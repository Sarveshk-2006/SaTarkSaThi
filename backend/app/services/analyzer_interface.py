"""
Abstract analyzer interface and legacy adapter.
All analysis providers implement ScamAnalyzerInterface.
"""

from abc import ABC, abstractmethod
from typing import Optional
from backend.app.services.analysis_result import AnalysisResult, InputType


class ScamAnalyzerInterface(ABC):
    """
    Abstract base for all scam analysis providers.
    Implementations must return a validated AnalysisResult.
    """

    @abstractmethod
    async def analyze_text(self, text: str, channel: str = "SMS") -> AnalysisResult:
        """Analyze suspicious text content."""
        pass

    @abstractmethod
    async def analyze_url(self, url: str) -> AnalysisResult:
        """Analyze a suspicious URL without visiting it."""
        pass

    @abstractmethod
    async def analyze_image_text(self, extracted_text: str, filename: str) -> AnalysisResult:
        """Analyze text extracted from an image (OCR output)."""
        pass

    @abstractmethod
    async def analyze_audio_text(self, transcript: str, filename: str) -> AnalysisResult:
        """Analyze a voice/audio transcript."""
        pass

    # Legacy compatibility
    async def analyze(self, text: str, channel: str = "SMS") -> AnalysisResult:
        """Legacy method name - delegates to analyze_text."""
        return await self.analyze_text(text, channel)
