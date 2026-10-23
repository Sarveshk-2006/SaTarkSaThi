"""
Text normalization, character mapping, and token-distance matching utilities for Satark Saathi.
Provides safe, explainable token windowing that preserves exact original substring excerpts.
"""

import re
import unicodedata
from typing import Optional, Tuple, List


def normalize_text(text: str) -> str:
    """
    Safely normalizes text for analysis without destroying semantic characters.
    - Applies Unicode NFKC normalization
    - Removes invisible zero-width and control characters
    - Collapses consecutive whitespace to single spaces
    """
    if not text:
        return ""
    cleaned = unicodedata.normalize("NFKC", text)
    cleaned = re.sub(r"[\u200B-\u200D\uFEFF\u00A0\u200E\u200F\u202A-\u202E]", "", cleaned)
    cleaned = re.sub(r"[ \t\r\f\v]+", " ", cleaned)
    return cleaned


def normalize_with_mapping(original_text: str) -> Tuple[str, List[int]]:
    """
    Normalizes text (NFKC, zero-width stripping, whitespace collapse) while maintaining
    a position mapping from normalized indices to original character indices.
    This guarantees that any span matched in normalized text can be extracted as an
    exact verbatim slice of the original text.
    """
    if not original_text:
        return "", []

    norm_chars = []
    norm_to_orig = []
    invisible_chars = set('\u200B\u200C\u200D\uFEFF\u00A0\u200E\u200F\u202A\u202B\u202C\u202D\u202E')

    for orig_idx, char in enumerate(original_text):
        if char in invisible_chars:
            continue
        nfkc_char = unicodedata.normalize("NFKC", char)
        for c in nfkc_char:
            norm_chars.append(c)
            norm_to_orig.append(orig_idx)

    final_chars = []
    final_to_orig = []
    prev_is_space = False

    for c, orig_idx in zip(norm_chars, norm_to_orig):
        is_space = c in " \t\r\f\v"
        if is_space:
            if not prev_is_space:
                final_chars.append(" ")
                final_to_orig.append(orig_idx)
                prev_is_space = True
        else:
            final_chars.append(c)
            final_to_orig.append(orig_idx)
            prev_is_space = False

    return "".join(final_chars), final_to_orig


def extract_original_excerpt(original_text: str, mapping: List[int], start_norm: int, end_norm: int) -> str:
    """
    Extracts the exact verbatim slice from original_text corresponding to [start_norm, end_norm]
    in the normalized string.
    """
    if not original_text or not mapping or start_norm >= len(mapping) or end_norm <= 0:
        return ""
    start_orig = mapping[min(max(0, start_norm), len(mapping) - 1)]
    end_orig = mapping[min(max(0, end_norm - 1), len(mapping) - 1)] + 1
    return original_text[start_orig:end_orig]


def detect_script(text: str) -> dict:
    """
    Analyzes character distributions to identify the primary script and language support tier.

    Supported:
    - LATIN: English and Romanized Hinglish
    - DEVANAGARI: Hindi and Marathi native script
    - MIXED_DEVANAGARI_LATIN: Mixed Hindi/English messages

    Unsupported / Low Coverage:
    - REGIONAL_INDIC_UNSUPPORTED: Dravidian (Tamil, Telugu, Kannada, Malayalam)
      and other regional scripts (Bengali, Gujarati, Gurmukhi, Oriya).
    """
    if not text:
        return {"primary_script": "EMPTY", "is_supported": True, "notes": "No text provided."}

    devanagari_count = len(re.findall(r'[\u0900-\u097F]', text))
    latin_count = len(re.findall(r'[a-zA-Z]', text))
    dravidian_count = len(re.findall(r'[\u0B80-\u0D7F]', text))
    other_indic_count = len(re.findall(r'[\u0980-\u0B7F]', text))

    total_alpha = devanagari_count + latin_count + dravidian_count + other_indic_count
    if total_alpha == 0:
        return {"primary_script": "NUMERIC_OR_SYMBOLIC", "is_supported": True, "notes": "No alphabetic script detected."}

    if devanagari_count > 0 and (devanagari_count / total_alpha) >= 0.15:
        if latin_count > 0 and (latin_count / total_alpha) >= 0.20:
            return {
                "primary_script": "MIXED_DEVANAGARI_LATIN",
                "is_supported": True,
                "notes": "Mixed Devanagari and Latin script detected. Evaluated against Hindi and English patterns."
            }
        return {
            "primary_script": "DEVANAGARI",
            "is_supported": True,
            "notes": "Devanagari script detected. Evaluated against targeted Hindi scam patterns."
        }

    if dravidian_count > 0 or other_indic_count > 0:
        return {
            "primary_script": "REGIONAL_INDIC_UNSUPPORTED",
            "is_supported": False,
            "notes": "Regional Indic script (e.g. Tamil, Telugu, Kannada, Bengali) detected. Pattern coverage is limited; lack of detection does NOT imply safety."
        }

    return {
        "primary_script": "LATIN",
        "is_supported": True,
        "notes": "Latin script (English / Romanized Hinglish) fully supported."
    }


def is_prohibition_context(text: str, match_start: int) -> bool:
    """
    Evaluates whether a match is immediately preceded in the same clause/sentence
    by a prohibition or security warning (e.g. 'do not', 'never', 'will never ask',
    'should never', 'refrain from', 'kisi ko mat', or Hindi 'कभी नहीं / सावधान').
    """
    window = text[max(0, match_start - 70):match_start]
    sentence_segment = re.split(r'[\.\!\?\n;।]', window)[-1]
    prohibition_pattern = (
        r"\b(do not|don'?t|never|will never|should not|should never|not to|refrain from|"
        r"kisi ko mat|mat|kabhi nahi|kabhi mat|savdhan|"
        r"कभी नहीं|कभी मत|मत दें|मत बताएं|शेयर न करें|सावधान|अलर्ट|सलाह|चेतावनी|बचें)\b"
    )
    return bool(re.search(prohibition_pattern, sentence_segment, re.IGNORECASE))


def token_distance_pattern(phrase1_regex: str, phrase2_regex: str, max_tokens: int = 20) -> str:
    """
    Constructs a regular expression that matches phrase1 followed by phrase2
    with at most max_tokens intervening words.

    The resulting match captures the exact text span from the beginning of phrase1
    to the end of phrase2, ensuring verifiable verbatim evidence excerpts.
    Handles intervening whitespace and punctuation between tokens cleanly.
    """
    return rf"(?:{phrase1_regex})(?:\W+\w+){{0,{max_tokens}}}?\W+(?:{phrase2_regex})"


def find_token_window_match(
    phrase1_regex: str,
    phrase2_regex: str,
    text: str,
    max_tokens: int = 20,
    flags: int = re.IGNORECASE
) -> Optional[Tuple[str, int, int]]:
    """
    Searches for phrase1 and phrase2 occurring within max_tokens of each other.
    Returns (verbatim_excerpt, start_index, end_index) if found, else None.
    """
    pattern = token_distance_pattern(phrase1_regex, phrase2_regex, max_tokens)
    match = re.search(pattern, text, flags)
    if match:
        return match.group(0), match.start(), match.end()
    return None
