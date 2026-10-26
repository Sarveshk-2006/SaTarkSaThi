"""
Opt-in duress phrase support.

Only a salted PBKDF2-SHA256 hash and the phrase's word count are stored. Matching
hashes every contiguous word window of the user's free-text answer, so the phrase
can be embedded naturally in a sentence without ever being stored or logged.
"""

import hashlib
import hmac
import secrets
import unicodedata
from typing import List, Optional, Tuple

DURESS_ITERATIONS = 20_000
MIN_WORDS, MAX_WORDS = 2, 8
MIN_CHARS, MAX_CHARS = 8, 80
MAX_SCAN_WORDS = 120


def normalize_words(text: str) -> List[str]:
    """Casefolds and strips punctuation while keeping letters, combining marks and digits of any script."""
    text = unicodedata.normalize("NFKC", text or "").casefold()
    cleaned = "".join(ch if unicodedata.category(ch)[0] in ("L", "M", "N") else " " for ch in text)
    return cleaned.split()


def validate_phrase(phrase: str) -> Optional[str]:
    """Returns an error message, or None when the phrase is acceptable."""
    words = normalize_words(phrase)
    joined = " ".join(words)
    if not (MIN_WORDS <= len(words) <= MAX_WORDS):
        return f"Use between {MIN_WORDS} and {MAX_WORDS} words so the phrase is not triggered by accident."
    if not (MIN_CHARS <= len(joined) <= MAX_CHARS):
        return f"Use between {MIN_CHARS} and {MAX_CHARS} characters."
    if joined.replace(" ", "").isdigit():
        return "The phrase must contain words, not only numbers."
    return None


def _derive(normalized: str, salt: str, iterations: int) -> str:
    return hashlib.pbkdf2_hmac("sha256", normalized.encode("utf-8"), salt.encode("utf-8"), iterations).hex()


def hash_phrase(phrase: str) -> Tuple[str, int]:
    words = normalize_words(phrase)
    salt = secrets.token_hex(16)
    digest = _derive(" ".join(words), salt, DURESS_ITERATIONS)
    return f"pbkdf2_sha256${DURESS_ITERATIONS}${salt}${digest}", len(words)


def contains_phrase(text: str, stored_hash: Optional[str], word_count: Optional[int]) -> bool:
    if not text or not stored_hash or not word_count:
        return False
    try:
        _, iterations_str, salt, digest = stored_hash.split("$")
        iterations = int(iterations_str)
    except ValueError:
        return False

    words = normalize_words(text)[:MAX_SCAN_WORDS]
    matched = False
    for i in range(0, max(0, len(words) - word_count + 1)):
        candidate = _derive(" ".join(words[i:i + word_count]), salt, iterations)
        # Keep scanning after a match so timing does not reveal the phrase position.
        matched = hmac.compare_digest(candidate, digest) or matched
    return matched
