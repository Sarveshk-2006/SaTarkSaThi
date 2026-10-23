"""
IBM watsonx.ai Granite model integration.
Properly handles credentials, IAM token exchange, structured prompt engineering,
response validation, timeouts, and graceful fallback.

NEVER silently switches from failed IBM call to a result that appears from IBM.
"""

import json
import logging
from typing import Optional
import httpx
from backend.app.config import settings
from backend.app.services.analyzer_interface import ScamAnalyzerInterface
from backend.app.services.analysis_result import (
    AnalysisResult, AnalysisMode, InputType, RiskLevel,
    ConfidenceLabel, DetectedSignal
)
from backend.app.services.risk_policy import PolicyTier
from backend.app.services.rule_analyzer import RuleBasedScamAnalyzer

logger = logging.getLogger(__name__)

# IAM token endpoint
IBM_IAM_URL = "https://iam.cloud.ibm.com/identity/token"

# Structured prompt for Granite model
ANALYSIS_PROMPT_TEMPLATE = """You are a cybersecurity expert specializing in Indian digital fraud. Analyze the following {input_type} message received via {channel}.

MESSAGE:
---
{text}
---

Analyze for these scam indicators:
1. Impersonation of police, CBI, courts, banks, or government officials
2. Threats of arrest, account suspension, or legal action
3. Demands for secrecy or isolation from family
4. Urgent payment demands via UPI, bank transfer, or other methods
5. Requests for OTPs, PINs, passwords, or remote device access
6. Guaranteed investment returns or prize winnings
7. Suspicious payment links or URL shorteners
8. Requests to install unknown applications

Respond ONLY with valid JSON in this exact format:
{{
  "verdict": "One-line classification of the message",
  "risk_score": 0-100 integer,
  "risk_level": "LOW" or "MEDIUM" or "HIGH" or "CRITICAL",
  "confidence": "LOW" or "MEDIUM" or "HIGH",
  "summary": "Plain-language explanation for a non-technical user",
  "detected_signals": [
    {{
      "signal_type": "CATEGORY_NAME",
      "severity": "LOW" or "MEDIUM" or "HIGH",
      "reason": "Why this is flagged",
      "excerpt": "Relevant text from the message"
    }}
  ],
  "recommended_actions": ["Action 1", "Action 2"],
  "verification_steps": ["Step 1", "Step 2"],
  "should_alert_family": true or false
}}
"""


class WatsonXScamAnalyzer(ScamAnalyzerInterface):
    """
    IBM watsonx.ai Granite Model Analyzer.

    Two explicit modes:
    - IBM mode: Calls watsonx.ai when WATSONX_APIKEY and WATSONX_PROJECT_ID are configured.
    - Fallback: Uses the deterministic rule engine with clear labelling.
      The fallback result is NEVER presented as IBM output.
    """

    def __init__(self):
        self.api_key = settings.watsonx_apikey
        self.project_id = settings.watsonx_project_id
        self.base_url = settings.watsonx_url
        self.model_id = settings.watsonx_model_id
        self.fallback = RuleBasedScamAnalyzer()
        self._iam_token: Optional[str] = None

    def is_configured(self) -> bool:
        """True only when both API key and project ID are non-empty environment values."""
        return settings.watsonx_configured

    async def _get_iam_token(self) -> Optional[str]:
        """Exchange API key for IAM bearer token."""
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.post(
                    IBM_IAM_URL,
                    headers={"Content-Type": "application/x-www-form-urlencoded"},
                    data={
                        "grant_type": "urn:ibm:params:oauth:grant-type:apikey",
                        "apikey": self.api_key,
                    },
                )
                if response.status_code == 200:
                    token_data = response.json()
                    self._iam_token = token_data.get("access_token")
                    return self._iam_token
                else:
                    logger.error(f"IAM token exchange failed: HTTP {response.status_code}")
                    return None
        except httpx.TimeoutException:
            logger.error("IAM token exchange timed out")
            return None
        except Exception as e:
            logger.error(f"IAM token exchange error: {e}")
            return None

    async def _call_watsonx(self, text: str, input_type: str, channel: str) -> Optional[dict]:
        """
        Call the IBM watsonx.ai text generation endpoint.
        Returns parsed JSON response dict or None on any failure.
        Called only when credentials are configured.
        """
        token = await self._get_iam_token()
        if not token:
            logger.warning("Could not obtain IAM token; cannot call watsonx.ai")
            return None

        prompt = ANALYSIS_PROMPT_TEMPLATE.format(
            input_type=input_type,
            channel=channel,
            text=text[:3000],
        )

        payload = {
            "model_id": self.model_id,
            "project_id": self.project_id,
            "input": prompt,
            "parameters": {
                "decoding_method": "greedy",
                "max_new_tokens": 800,
                "min_new_tokens": 50,
                "repetition_penalty": 1.1,
                "stop_sequences": ["\n\n\n"],
            },
        }

        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post(
                    f"{self.base_url}/ml/v1/text/generation?version=2024-05-31",
                    json=payload,
                    headers={
                        "Content-Type": "application/json",
                        "Accept": "application/json",
                        "Authorization": f"Bearer {token}",
                    },
                )

                if response.status_code == 200:
                    data = response.json()
                    generated_text = data.get("results", [{}])[0].get("generated_text", "")
                    try:
                        json_start = generated_text.find("{")
                        json_end = generated_text.rfind("}") + 1
                        if json_start >= 0 and json_end > json_start:
                            return json.loads(generated_text[json_start:json_end])
                    except json.JSONDecodeError:
                        logger.warning("watsonx.ai response was not valid JSON")
                        return None
                elif response.status_code == 401:
                    logger.error("watsonx.ai authentication failed — check API key")
                    return None
                elif response.status_code == 429:
                    logger.warning("watsonx.ai rate limit exceeded")
                    return None
                else:
                    logger.warning(f"watsonx.ai returned HTTP {response.status_code}")
                    return None

        except httpx.TimeoutException:
            logger.error("watsonx.ai request timed out after 30 seconds")
            return None
        except Exception as e:
            logger.error(f"watsonx.ai call failed: {e}")
            return None

        return None


    def _parse_ibm_response(self, ibm_data: dict, incident_id: str, input_type: InputType) -> Optional[AnalysisResult]:
        """Validate and parse IBM model output into AnalysisResult."""
        if not isinstance(ibm_data, dict):
            return None

        # Validate essential required fields from model schema
        required_keys = ["verdict", "risk_score", "summary"]
        if not all(k in ibm_data and ibm_data[k] is not None for k in required_keys):
            logger.warning(f"IBM response missing required keys: {[k for k in required_keys if k not in ibm_data]}")
            return None

        try:
            risk_score = int(ibm_data.get("risk_score", 0))
            risk_score = max(0, min(risk_score, 99))

            risk_level_str = str(ibm_data.get("risk_level", "LOW")).upper()
            risk_level = RiskLevel(risk_level_str) if risk_level_str in RiskLevel.__members__ else RiskLevel.LOW

            confidence_str = str(ibm_data.get("confidence", "MEDIUM")).upper()
            confidence = ConfidenceLabel(confidence_str) if confidence_str in ConfidenceLabel.__members__ else ConfidenceLabel.MEDIUM

            signals = []
            for sig_data in ibm_data.get("detected_signals", []):
                signals.append(DetectedSignal(
                    signal_type=sig_data.get("signal_type", "UNKNOWN"),
                    severity=sig_data.get("severity", "MEDIUM"),
                    reason=sig_data.get("reason", "Flagged by AI analysis"),
                    excerpt=sig_data.get("excerpt"),
                    weight=1.0
                ))

            # Map risk_level to legacy severity
            severity_map = {
                RiskLevel.CRITICAL: "HIGH_RISK",
                RiskLevel.HIGH: "HIGH_RISK",
                RiskLevel.MEDIUM: "CAUTION",
                RiskLevel.LOW: "SAFE"
            }

            verdict = ibm_data.get("verdict", "AI Analysis Complete")
            summary = ibm_data.get("summary", "Analysis completed by IBM watsonx.ai Granite model.")
            should_alert = ibm_data.get("should_alert_family", risk_score >= 60)
            recommended_actions = ibm_data.get("recommended_actions", [])
            verification_steps = ibm_data.get("verification_steps", [])

            legacy_evidence = [
                {"factor_type": s.signal_type, "severity": s.severity, "description": s.reason, "matched_text": s.excerpt or ""}
                for s in signals
            ]

            policy_tier = PolicyTier.from_score(risk_score)
            primary_action = recommended_actions[0] if recommended_actions else "Exercise standard digital safety practices."

            return AnalysisResult(
                incident_id=incident_id,
                input_type=input_type,
                risk_level=risk_level,
                risk_score=risk_score,
                policy_tier=policy_tier.value,
                confidence_label=confidence,
                verdict=verdict,
                plain_language_summary=summary,
                detected_signals=signals,
                counter_signals=[],
                reason_codes=[f"SIG_AI_{s.signal_type}" for s in signals],
                supporting_evidence=[f"{s.signal_type}: {s.reason}" for s in signals],
                recommended_actions=recommended_actions,
                recommended_action=primary_action,
                verification_steps=verification_steps,
                should_alert_family=should_alert,
                ai_provider="ibm_watsonx",
                analysis_mode=AnalysisMode.AI_ASSISTED,
                limitations=[
                    "This analysis was performed by IBM watsonx.ai Granite model.",
                    "AI-generated risk assessments may have false positives or false negatives.",
                    "A low-risk result does not guarantee the communication is safe.",
                    "Always verify through official channels."
                ],
                classification=verdict,
                severity=severity_map.get(risk_level, "SAFE"),
                summary=summary,
                advice=primary_action,
                suggested_action=primary_action,
                is_flagged_for_family=should_alert,
                evidence_items=legacy_evidence
            )
        except Exception as e:
            logger.error(f"Failed to parse IBM response: {e}")
            return None

    async def _analyze_with_fallback(self, text: str, input_type: InputType, channel: str) -> AnalysisResult:
        """
        Try IBM watsonx.ai first, fall back to rule engine with explicit labeling.
        NEVER returns a result that appears to be from IBM when it's actually from rules.
        """
        import uuid
        incident_id = f"SA-{uuid.uuid4().hex[:12].upper()}"

        if not self.is_configured():
            logger.info("IBM watsonx.ai not configured; using rule-based analysis.")
            result = await self.fallback.analyze_text(text, channel)
            result.ai_provider = "none"
            result.analysis_mode = AnalysisMode.RULE_BASED
            result.limitations.insert(0, "IBM watsonx.ai credentials not configured. Analysis performed by deterministic rule engine only.")
            return result

        # Attempt IBM call
        ibm_data = await self._call_watsonx(text, input_type.value, channel)

        if ibm_data:
            parsed = self._parse_ibm_response(ibm_data, incident_id, input_type)
            if parsed:
                return parsed
            logger.warning("IBM response could not be parsed; falling back to rule engine")

        # Explicit fallback—clearly marked as NOT from IBM
        logger.warning("IBM watsonx.ai call failed; using rule-based fallback (clearly labeled)")
        result = await self.fallback.analyze_text(text, channel)
        result.ai_provider = "none"
        result.analysis_mode = AnalysisMode.RULE_BASED
        result.limitations.insert(0, "IBM watsonx.ai call failed. This result is from the deterministic rule engine, NOT from AI analysis.")
        return result

    async def analyze_text(self, text: str, channel: str = "SMS") -> AnalysisResult:
        return await self._analyze_with_fallback(text, InputType.TEXT, channel)

    async def analyze_url(self, url: str) -> AnalysisResult:
        # URL analysis is always rule-based (no need for LLM)
        return await self.fallback.analyze_url(url)

    async def analyze_image_text(self, extracted_text: str, filename: str) -> AnalysisResult:
        result = await self._analyze_with_fallback(extracted_text, InputType.IMAGE, "IMAGE")
        result.plain_language_summary = f"Analysis of text extracted from image '{filename}'. " + result.plain_language_summary
        return result

    async def analyze_audio_text(self, transcript: str, filename: str) -> AnalysisResult:
        result = await self._analyze_with_fallback(transcript, InputType.AUDIO, "CALL_TRANSCRIPT")
        result.plain_language_summary = f"Analysis of transcript from audio '{filename}'. " + result.plain_language_summary
        return result

    # Legacy compatibility
    async def analyze(self, text: str, channel: str = "SMS") -> AnalysisResult:
        return await self.analyze_text(text, channel)
