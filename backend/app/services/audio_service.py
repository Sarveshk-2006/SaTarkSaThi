"""
Audio Transcription Service.
Provides genuine local offline speech-to-text transcription using OpenAI Whisper (tiny model).
Ensures safe temporary file handling, offline operation, and strict separation between
speech recognition and scam-risk policy evaluation.
"""

import os
import shutil
import tempfile
import logging
from typing import Tuple, Optional

logger = logging.getLogger("satark_saathi.audio")

# Maximum permitted audio file size (25 MB)
MAX_AUDIO_BYTES = 25 * 1024 * 1024


class AudioTranscriptionService:
    def __init__(self):
        self._model = None
        self._model_load_attempted = False
        self._whisper_available = False
        self._ffmpeg_available = bool(shutil.which("ffmpeg"))

        # Check if whisper is installed
        try:
            import whisper  # noqa: F401
            self._whisper_available = True
        except ImportError:
            self._whisper_available = False
            logger.info("OpenAI Whisper package is not installed.")

    def _get_model(self):
        """Lazy loader for the Whisper model to avoid slow application startup."""
        if self._model is None and not self._model_load_attempted:
            self._model_load_attempted = True
            if self._whisper_available and self._ffmpeg_available:
                try:
                    import whisper
                    # Loads tiny model from local cache (~/.cache/whisper/tiny.pt)
                    self._model = whisper.load_model("tiny")
                    logger.info("Local Whisper tiny model loaded successfully.")
                except Exception as e:
                    logger.warning(f"Failed to load Whisper model: {e}")
                    self._model = None
        return self._model

    def is_available(self) -> bool:
        """Returns True only if genuine speech recognition is available."""
        if not (self._whisper_available and self._ffmpeg_available):
            return False
        model = self._get_model()
        return model is not None

    def transcribe_audio(self, audio_bytes: bytes, filename: str = "audio.wav") -> Tuple[Optional[str], str]:
        """
        Transcribes audio bytes into text using local Whisper engine.
        Returns: (transcript_text, method_used)

        Strict safety rules:
        - Never infers spoken content from filenames or extensions.
        - Returns (None, reason) if speech recognition is unavailable, silent, or failed.
        """
        if not audio_bytes or len(audio_bytes) < 32:
            return None, "empty_or_truncated_audio"

        if len(audio_bytes) > MAX_AUDIO_BYTES:
            return None, "file_too_large"

        if not self.is_available():
            return None, "stt_unavailable"

        model = self._get_model()
        if model is None:
            return None, "stt_model_unavailable"

        # Determine extension safely
        ext = os.path.splitext(filename)[1].lower()
        if ext not in [".wav", ".mp3", ".ogg", ".webm", ".m4a"]:
            ext = ".wav"

        temp_path = None
        try:
            with tempfile.NamedTemporaryFile(suffix=ext, delete=False) as temp_file:
                temp_path = temp_file.name
                temp_file.write(audio_bytes)
                temp_file.flush()

            # Execute local offline transcription
            result = model.transcribe(temp_path, fp16=False)
            text = (result.get("text") or "").strip()

            if not text:
                return None, "silent_or_unintelligible"

            return text, "openai_whisper_local_tiny"

        except Exception as e:
            logger.warning(f"Audio transcription error on file {filename}: {e}")
            return None, "transcription_failed"
        finally:
            if temp_path and os.path.exists(temp_path):
                try:
                    os.remove(temp_path)
                except Exception as e:
                    logger.debug(f"Failed to delete temp audio file {temp_path}: {e}")


audio_service = AudioTranscriptionService()
