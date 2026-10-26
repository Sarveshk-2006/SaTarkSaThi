from backend.app.config import settings
from backend.app.services.analyzer_interface import ScamAnalyzerInterface
from backend.app.services.rule_analyzer import RuleBasedScamAnalyzer
from backend.app.services.watsonx_analyzer import WatsonXScamAnalyzer
from backend.app.services.bob_analyzer import BobScamAnalyzer

SUPPORTED_PROVIDERS = ("rule_based", "watsonx", "bob")


def get_analyzer_service() -> ScamAnalyzerInterface:
    provider = (settings.analysis_provider or "rule_based").lower()
    if provider == "watsonx":
        return WatsonXScamAnalyzer()
    if provider == "bob":
        return BobScamAnalyzer()
    return RuleBasedScamAnalyzer()
