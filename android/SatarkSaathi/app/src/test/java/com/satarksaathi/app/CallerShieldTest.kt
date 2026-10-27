package com.satarksaathi.app

import com.satarksaathi.app.core.telecom.LocalCallerCache
import com.satarksaathi.app.data.models.CallerLookupDto
import com.satarksaathi.app.data.models.CallerReportRequest
import kotlinx.serialization.json.Json
import org.junit.Assert.*
import org.junit.Test

class CallerShieldTest {

    private val json = Json {
        ignoreUnknownKeys = true
        isLenient = true
    }

    @Test
    fun testPhoneNumberNormalization() {
        assertEquals("+919876543210", LocalCallerCache.normalizeNumber("9876543210"))
        assertEquals("+919876543210", LocalCallerCache.normalizeNumber("09876543210"))
        assertEquals("+919876543210", LocalCallerCache.normalizeNumber("+91 98765-43210"))
        assertEquals("+919876543210", LocalCallerCache.normalizeNumber("+91 (98765) 43210"))
        assertEquals("+923001234567", LocalCallerCache.normalizeNumber("+92 300 1234567"))
    }

    @Test
    fun testCallerLookupDtoSerialization() {
        val jsonString = """
            {
                "phone_number": "+91 98765 00001",
                "normalized_number": "+919876500001",
                "display_tag": "Suspected Fake Police / CBI Extortion",
                "category": "DIGITAL_ARREST",
                "risk_score": 98,
                "risk_level": "CRITICAL",
                "confidence": "HIGH",
                "action": "WARN",
                "is_blocked": false,
                "carrier_verified": false,
                "total_reports": 142,
                "ibm_summary": "Extortion campaign impersonating CBI officers.",
                "evidence_signals": ["IMPERSONATING_LAW_ENFORCEMENT"],
                "recommended_action": "Do not answer. Disconnect immediately."
            }
        """.trimIndent()

        val dto = json.decodeFromString<CallerLookupDto>(jsonString)
        assertEquals("+919876500001", dto.normalizedNumber)
        assertEquals("DIGITAL_ARREST", dto.category)
        assertEquals(98, dto.riskScore)
        assertEquals("CRITICAL", dto.riskLevel)
        assertEquals(1, dto.evidenceSignals.size)
        assertEquals("IMPERSONATING_LAW_ENFORCEMENT", dto.evidenceSignals[0])
    }

    @Test
    fun testCallerReportRequestSerialization() {
        val req = CallerReportRequest(
            phoneNumber = "+91 98765 00001",
            category = "DIGITAL_ARREST",
            claimedCallerName = "CBI Officer Vijay",
            description = "Attempted arrest threat over WhatsApp call."
        )

        val encoded = json.encodeToString(CallerReportRequest.serializer(), req)
        assertTrue(encoded.contains("DIGITAL_ARREST"))
        assertTrue(encoded.contains("CBI Officer Vijay"))
    }

    @Test
    fun testScreeningDecisionLogic() {
        val safeCaller = CallerLookupDto(
            phoneNumber = "+91 22 2854 0000",
            normalizedNumber = "+912228540000",
            displayTag = "State Bank of India",
            category = "LEGITIMATE_BUSINESS",
            riskScore = 4,
            riskLevel = "LOW",
            action = "ALLOW"
        )
        assertFalse(safeCaller.isBlocked)
        assertEquals("ALLOW", safeCaller.action)

        val criticalScam = CallerLookupDto(
            phoneNumber = "+91 98765 00001",
            normalizedNumber = "+919876500001",
            displayTag = "Fake CBI Extortion",
            category = "DIGITAL_ARREST",
            riskScore = 98,
            riskLevel = "CRITICAL",
            action = "WARN"
        )
        assertTrue(criticalScam.riskScore >= 95)
    }
}
