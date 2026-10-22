"""
Rule-based scam analyzer implementation.
Wraps the deterministic risk engine and conforms to the ScamAnalyzerInterface.
"""

import logging
from backend.app.services.analyzer_interface import ScamAnalyzerInterface
from backend.app.services.analysis_result import AnalysisResult, InputType
from backend.app.services.risk_engine import analyze_text, analyze_url

logger = logging.getLogger(__name__)


class RuleBasedScamAnalyzer(ScamAnalyzerInterface):
    """
    Deterministic rule-based analyzer for Indian digital scam patterns.
    Uses weighted pattern matching with counter-signals.
    Does not require any external API credentials.
    """

    async def analyze_text(self, text: str, channel: str = "SMS") -> AnalysisResult:
        """Analyze suspicious text using the deterministic risk engine."""
        result = analyze_text(text, input_type=InputType.TEXT, channel=channel)
        result.analysis_mode = result.analysis_mode  # Already rule_based
        return result

    async def analyze_url(self, url: str) -> AnalysisResult:
        """Analyze a URL for suspicious indicators."""
        return analyze_url(url)

    async def analyze_image_text(self, extracted_text: str, filename: str) -> AnalysisResult:
        """Analyze text extracted from an image screenshot."""
        result = analyze_text(extracted_text, input_type=InputType.IMAGE)
        result.plain_language_summary = (
            f"Analysis of text extracted from image '{filename}'. "
            + result.plain_language_summary
        )
        return result

    async def analyze_audio_text(self, transcript: str, filename: str) -> AnalysisResult:
        """Analyze a voice/audio transcript."""
        result = analyze_text(transcript, input_type=InputType.AUDIO)
        result.plain_language_summary = (
            f"Analysis of transcript from audio '{filename}'. "
            + result.plain_language_summary
        )
        return result

    # Legacy compatibility
    async def analyze(self, text: str, channel: str = "SMS") -> AnalysisResult:
        return await self.analyze_text(text, channel)
