"""
IBM watsonx.ai Integration for Satark Saathi Caller Shield.
Enriches caller intelligence records with grounded fraud summaries,
recurring extortion patterns, and recommended citizen actions.

Implements timeouts, circuit breaking, transparent provider attribution,
and deterministic local fallbacks so that call screening never hangs.
"""

import json
import logging
from datetime import datetime, timezone
from typing import Optional, Dict, Any, List
import httpx
from backend.app.config import settings

logger = logging.getLogger(__name__)

IBM_IAM_URL = "https://iam.cloud.ibm.com/identity/token"

CALLER_PROMPT_TEMPLATE = """You are a cybersecurity expert analyzing Indian telecom fraud patterns.
Evaluate the reported incoming caller behavior described below:

PHONE NUMBER: {phone_number}
PRIMARY CATEGORY: {category}
CLAIMED CALLER NAME: {claimed_name}
REPORTS SUMMARY:
{reports_text}

Instructions:
1. Produce a concise, evidence-grounded summary (maximum 2 sentences) describing the threat pattern.
2. Identify specific psychological coercion techniques (e.g., impersonation, fear of arrest, urgency, secrecy).
3. Do NOT invent real person names, home addresses, or employer records.
4. Provide 2 clear safety recommendations for an Indian citizen receiving this call.

Respond ONLY with valid JSON in this exact structure:
{{
  "verdict": "One-line threat classification",
  "summary": "Evidence-grounded 2-sentence summary of the scam pattern",
  "detected_signals": ["SIGNAL_1", "SIGNAL_2"],
  "recommended_action": "Clear 1-sentence recommended action for citizen",
  "confidence": "HIGH" or "MEDIUM" or "LOW"
}}
"""


class IBMCallerIntelligenceService:
    def __init__(self):
        self.api_key = settings.watsonx_apikey
        self.project_id = settings.watsonx_project_id
        self.base_url = settings.watsonx_url
        self.model_id = settings.watsonx_model_id
        self._iam_token: Optional[str] = None
        self._circuit_broken = False
        self._consecutive_failures = 0

    def is_configured(self) -> bool:
        """Returns True only when valid IBM credentials are present in environment."""
        return bool(self.api_key and self.project_id)

    async def _get_iam_token(self) -> Optional[str]:
        """Exchanges API key for IAM bearer token."""
        try:
            async with httpx.AsyncClient(timeout=8.0) as client:
                res = await client.post(
                    IBM_IAM_URL,
                    headers={"Content-Type": "application/x-www-form-urlencoded"},
                    data={
                        "grant_type": "urn:ibm:params:oauth:grant-type:apikey",
                        "apikey": self.api_key,
                    },
                )
                if res.status_code == 200:
                    token_data = res.json()
                    self._iam_token = token_data.get("access_token")
                    return self._iam_token
        except Exception as e:
            logger.warning(f"IBM IAM token exchange failed: {e}")
        return None

    def _generate_fallback(
        self,
        phone_number: str,
        category: str,
        claimed_name: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Deterministic, transparent local rule fallback when IBM is not configured or times out.
        """
        category_summaries = {
            "DIGITAL_ARREST": (
                "Coordinated digital arrest extortion. Impersonates law enforcement officials (CBI/Police) threatening immediate arrest over video calls.",
                ["IMPERSONATING_LAW_ENFORCEMENT", "THREAT_OF_IMMEDIATE_ARREST", "DEMAND_FOR_SECRECY"],
                "Do not answer or enter video calls. CBI and Police never conduct arrests or interrogations via phone or WhatsApp."
            ),
            "KYC_FRAUD": (
                "Banking KYC suspension trap. Coerces victims into sharing NetBanking passwords, OTPs, or clicking phishing links under threat of account freeze.",
                ["BANK_IMPERSONATION", "OTP_SOLICITATION", "ACCOUNT_FREEZE_COERCION"],
                "Banks never request OTPs or passwords over phone. Report directly to your bank nodal fraud desk."
            ),
            "ELECTRICITY_SCAM": (
                "Utility disconnection threat. Claims power supply will be cut at 9:30 PM due to unpaid bills to push unauthorized APK installation.",
                ["ARTIFICIAL_URGENCY", "UTILITY_IMPERSONATION", "MALICIOUS_APK_PUSH"],
                "Check power bill balance solely through official discom portals. Never call numbers provided in SMS."
            ),
            "COURIER_CUSTOMS": (
                "Customs package extortion. Claims an international parcel addressed to victim contains contraband (drugs/passports) requiring clearance payment.",
                ["CUSTOMS_IMPERSONATION", "CONTRABAND_ACCUSATION", "EXTORTION_DEMAND"],
                "Customs departments never demand fine transfers into personal bank accounts or UPI."
            ),
            "LOTTERY_FRAUD": (
                "Advance-fee lottery scam. Claims an unearned cash prize from KBC or international sweepstakes requiring upfront processing fees.",
                ["UNREALISTIC_LOTTERY_PRIZE", "UPFRONT_FEE_DEMAND", "SPOOFED_INTERNATIONAL_PREFIX"],
                "Never pay any advance fee or tax to claim lottery prizes. It is a guaranteed advance-fee scam."
            ),
            "LEGITIMATE_BUSINESS": (
                "Verified institutional communication trunk. Cross-matched against official directories.",
                ["CARRIER_VERIFIED_ENTERPRISE", "OFFICIAL_DIRECTORY_MATCH"],
                "Legitimate caller. Remember to never share personal PINs or OTPs with any caller."
            )
        }

        default_summary, default_signals, default_action = category_summaries.get(
            category,
            (
                f"Suspicious caller reported under {category.replace('_', ' ').title()}. Multiple citizen reports indicate potential fraud attempt.",
                ["COMMUNITY_REPORTED_SUSPICIOUS", "UNVERIFIED_CALLER"],
                "Exercise high caution. Do not reveal confidential credentials or authorize UPI requests."
            )
        )

        return {
            "summary": default_summary,
            "detected_signals": default_signals,
            "recommended_action": default_action,
            "confidence": "HIGH" if category in category_summaries else "MEDIUM",
            "provider": "Deterministic Local Rule Engine (Fallback)",
            "model": "rule_based_v1",
        }

    async def enrich_caller(
        self,
        phone_number: str,
        category: str,
        claimed_name: Optional[str] = None,
        reports_text: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Enriches a caller profile with AI pattern recognition.
        Strict 4-second timeout to guarantee non-blocking responsiveness.
        """
        if not self.is_configured() or self._circuit_broken:
            return self._generate_fallback(phone_number, category, claimed_name)

        if not self._iam_token:
            token = await self._get_iam_token()
            if not token:
                return self._generate_fallback(phone_number, category, claimed_name)

        prompt = CALLER_PROMPT_TEMPLATE.format(
            phone_number=phone_number,
            category=category,
            claimed_name=claimed_name or "Not Specified",
            reports_text=reports_text or f"Multiple citizens reported suspicious calls classified as {category}."
        )

        headers = {
            "Authorization": f"Bearer {self._iam_token}",
            "Content-Type": "application/json",
            "Accept": "application/json",
        }

        payload = {
            "model_id": self.model_id,
            "input": prompt,
            "parameters": {
                "decoding_method": "greedy",
                "max_new_tokens": 250,
                "min_new_tokens": 10,
                "temperature": 0.1,
            },
            "project_id": self.project_id,
        }

        endpoint = f"{self.base_url}/ml/v1/text/generation?version=2024-05-01"

        try:
            async with httpx.AsyncClient(timeout=4.0) as client:
                res = await client.post(endpoint, json=payload, headers=headers)
                if res.status_code == 200:
                    data = res.json()
                    results = data.get("results", [])
                    if results:
                        generated_text = results[0].get("generated_text", "").strip()
                        # Clean JSON code blocks if present
                        if "```" in generated_text:
                            lines = generated_text.split("```")
                            generated_text = lines[1].lstrip("json\n") if len(lines) > 1 else lines[0]
                        
                        parsed = json.loads(generated_text)
                        self._consecutive_failures = 0
                        return {
                            "summary": parsed.get("summary", ""),
                            "detected_signals": parsed.get("detected_signals", []),
                            "recommended_action": parsed.get("recommended_action", ""),
                            "confidence": parsed.get("confidence", "HIGH"),
                            "provider": "IBM watsonx.ai (Granite)",
                            "model": self.model_id,
                        }
        except Exception as e:
            logger.warning(f"IBM watsonx call failed, falling back to local engine: {e}")
            self._consecutive_failures += 1
            if self._consecutive_failures >= 3:
                self._circuit_broken = True

        return self._generate_fallback(phone_number, category, claimed_name)


# Global singleton instance
ibm_caller_service = IBMCallerIntelligenceService()
