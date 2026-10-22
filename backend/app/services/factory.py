from backend.app.config import settings
from backend.app.services.analyzer_interface import ScamAnalyzerInterface
from backend.app.services.rule_analyzer import RuleBasedScamAnalyzer
from backend.app.services.watsonx_analyzer import WatsonXScamAnalyzer

def get_analyzer_service() -> ScamAnalyzerInterface:
    if settings.analysis_provider == "watsonx":
        return WatsonXScamAnalyzer()
    return RuleBasedScamAnalyzer()
