package com.satarksaathi.app

import com.satarksaathi.app.data.models.AnalysisResponse
import com.satarksaathi.app.data.models.HelplinesResponse
import com.satarksaathi.app.data.models.IncidentResponse
import com.satarksaathi.app.data.models.TokenResponse
import kotlinx.serialization.json.Json
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertTrue
import org.junit.Test

class ApiSerializationTest {

    private val json = Json {
        ignoreUnknownKeys = true
        coerceInputValues = true
        isLenient = true
    }

    @Test
    fun testTokenResponseDeserialization() {
        val payload = """
            {
                "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.dummy",
                "token_type": "bearer",
                "expires_in": 86400,
                "user_id": 1,
                "role": "USER",
                "full_name": "Rajesh Sharma"
            }
        """.trimIndent()

        val token = json.decodeFromString<TokenResponse>(payload)
        assertEquals("Rajesh Sharma", token.fullName)
        assertEquals(1, token.userId)
        assertEquals("USER", token.role)
    }

    @Test
    fun testAnalysisResponseDeserialization() {
        val payload = """
            {
                "incident_id": "SA-892145",
                "input_type": "TEXT",
                "risk_level": "HIGH",
                "risk_score": 85,
                "policy_tier": "RED",
                "confidence_label": "HIGH",
                "verdict": "Urgent Threat: Electricity Disconnection Scam",
                "plain_language_summary": "High risk fraudulent threat attempting to coerce immediate payment.",
                "detected_signals": [
                    {
                        "reason_code": "URGENCY_POWER_CUT",
                        "signal_type": "THREAT_COERCION",
                        "severity": "HIGH",
                        "reason": "Immediate service disconnection ultimatum within hours",
                        "excerpt": "power will be disconnected tonight at 9:30 PM",
                        "weight": 2.5
                    }
                ],
                "recommended_actions": [
                    "Do not transfer money or install APK files.",
                    "Verify power status directly via official electricity board portal."
                ],
                "ai_provider": "local_rule_engine",
                "analysis_mode": "rule_based"
            }
        """.trimIndent()

        val res = json.decodeFromString<AnalysisResponse>(payload)
        assertEquals("SA-892145", res.incidentId)
        assertEquals("HIGH", res.riskLevel)
        assertEquals(85, res.riskScore)
        assertEquals("RED", res.policyTier)
        assertEquals(1, res.detectedSignals.size)
        assertEquals("URGENCY_POWER_CUT", res.detectedSignals[0].reasonCode)
        assertEquals(2, res.recommendedActions.size)
    }

    @Test
    fun testIncidentResponseDeserialization() {
        val payload = """
            {
                "id": 10,
                "incident_id": "SA-412890",
                "user_id": 1,
                "analysis_id": 45,
                "title": "Suspected Digital Arrest Video Call",
                "scam_type": "Digital Arrest",
                "description": "Caller impersonating CBI officer demanding video verification",
                "financial_loss": 25000.0,
                "currency": "INR",
                "bank_name": "State Bank of India",
                "transaction_ref": "UPI/412890123/UTR",
                "severity": "HIGH",
                "risk_level": "CRITICAL",
                "status": "UNDER_REVIEW",
                "created_at": "2026-10-27T04:00:00Z"
            }
        """.trimIndent()

        val inc = json.decodeFromString<IncidentResponse>(payload)
        assertEquals("SA-412890", inc.incidentId)
        assertEquals(25000.0, inc.financialLoss, 0.001)
        assertEquals("State Bank of India", inc.bankName)
        assertEquals("CRITICAL", inc.riskLevel)
    }

    @Test
    fun testHelplinesResponseDeserialization() {
        val payload = """
            {
                "emergency_helplines": [
                    {
                        "bank": "National Cyber Crime Helpline",
                        "toll_free": "1930",
                        "description": "Ministry of Home Affairs 24x7 Citizen Reporting",
                        "portal": "https://cybercrime.gov.in"
                    },
                    {
                        "bank": "State Bank of India (SBI)",
                        "toll_free": "1800 11 2211",
                        "sms_block": "SMS 'BLOCK' to 567676",
                        "portal": "https://cms.onlinesbi.sbi"
                    }
                ],
                "official_guidance": {
                    "primary_helpline": "1930",
                    "primary_portal": "https://cybercrime.gov.in",
                    "disclaimer": "Reporting initiates inter-bank lien hold",
                    "golden_hour_timeline": "First 2 to 3 hours"
                },
                "golden_hour_protocol": [
                    "1. Dial 1930 immediately",
                    "2. Contact debiting bank"
                ]
            }
        """.trimIndent()

        val helplines = json.decodeFromString<HelplinesResponse>(payload)
        assertEquals(2, helplines.emergencyHelplines.size)
        assertEquals("1930", helplines.officialGuidance.primaryHelpline)
        assertEquals(2, helplines.goldenHourProtocol.size)
    }
}
