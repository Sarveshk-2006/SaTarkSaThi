"""
OCR (Optical Character Recognition) Service.
Provides safe, genuine text extraction from uploaded images using pytesseract.
Strictly disallows synthetic filename-based text generation or raw byte heuristics.
"""

import io
import logging
from typing import Tuple, Optional
from PIL import Image

logger = logging.getLogger("satark_saathi.ocr")

MAX_IMAGE_BYTES = 10 * 1024 * 1024  # 10 MB
MAX_DIMENSION = 8000  # Prevent decompression bomb attacks
MIN_DIMENSION = 10


class OCRService:
    def __init__(self):
        self._tesseract_available = False
        try:
            import pytesseract
            # Test if tesseract executable is callable on the host system
            pytesseract.get_tesseract_version()
            self._tesseract_available = True
            logger.info("Tesseract OCR engine is available and verified.")
        except Exception as e:
            self._tesseract_available = False
            logger.info(f"Tesseract OCR engine is not available on host: {e}")

    def is_available(self) -> bool:
        """Returns True only if the external Tesseract OCR binary is verified and callable."""
        return self._tesseract_available

    def extract_text(self, image_bytes: bytes, filename: str = "image.png") -> Tuple[Optional[str], str]:
        """
        Extracts readable text from image bytes using genuine OCR.
        Returns: (extracted_text, method_used)

        Strict safety rules:
        - Never infers document text from filenames or file extensions.
        - Never searches raw binary bytes for scam strings to simulate OCR.
        - Returns (None, reason) when OCR is unavailable, unreadable, or empty.
        """
        if not image_bytes or len(image_bytes) < 32:
            return None, "empty_or_truncated_image"

        if len(image_bytes) > MAX_IMAGE_BYTES:
            return None, "file_too_large"

        # Validate image integrity and dimensions
        try:
            img = Image.open(io.BytesIO(image_bytes))
            img.verify()  # Verify image integrity
            # Re-open after verify() as recommended by Pillow documentation
            img = Image.open(io.BytesIO(image_bytes))
            width, height = img.size
            if width < MIN_DIMENSION or height < MIN_DIMENSION:
                return None, "image_dimensions_too_small"
            if width > MAX_DIMENSION or height > MAX_DIMENSION:
                return None, "image_dimensions_exceed_limit"
        except Exception as e:
            logger.warning(f"Invalid or corrupted image format ({filename}): {e}")
            return None, "invalid_image_format"

        if not self.is_available():
            return None, "tesseract_unavailable"

        try:
            import pytesseract
            extracted = pytesseract.image_to_string(img, lang="eng+hin").strip()
            if not extracted or len(extracted) < 5:
                return None, "empty_ocr_output"

            return extracted, "tesseract_engine"

        except Exception as e:
            logger.warning(f"pytesseract extraction error on {filename}: {e}")
            return None, "ocr_extraction_failed"


ocr_service = OCRService()
