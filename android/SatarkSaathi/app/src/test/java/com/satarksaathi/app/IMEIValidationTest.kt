package com.satarksaathi.app

import com.satarksaathi.app.core.security.MaskingUtils
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

class IMEIValidationTest {

    @Test
    fun testValidIMEIFormat() {
        // Standard valid 15-digit Luhn test IMEI
        val validImei = "861234057890124"
        val isValid = MaskingUtils.isValidIMEIFormat(validImei)
        assertTrue("Expected valid Luhn check for properly constructed IMEI", isValid)
    }

    @Test
    fun testInvalidIMEILength() {
        // Less than 15 digits
        assertFalse(MaskingUtils.isValidIMEIFormat("8612345678"))
        // Greater than 15 digits
        assertFalse(MaskingUtils.isValidIMEIFormat("86123456789012345"))
    }

    @Test
    fun testNonNumericIMEI() {
        assertFalse(MaskingUtils.isValidIMEIFormat("86123456ABCDE12"))
    }

    @Test
    fun testIMEIMasking() {
        val raw = "861234567890123"
        val masked = MaskingUtils.maskIMEI(raw)
        assertEquals("861234******123", masked)
    }
}
