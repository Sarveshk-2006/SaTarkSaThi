package com.satarksaathi.app

import com.satarksaathi.app.core.security.MaskingUtils
import org.junit.Assert.assertEquals
import org.junit.Test

class MaskingUtilsTest {

    @Test
    fun testIndianPhoneNumberMasking() {
        val input = "+91 9876543210"
        val masked = MaskingUtils.maskPhoneNumber(input)
        assertEquals("+91 98*** **210", masked)
    }

    @Test
    fun testRaw10DigitPhoneMasking() {
        val input = "9876543210"
        val masked = MaskingUtils.maskPhoneNumber(input)
        assertEquals("98*** **210", masked)
    }

    @Test
    fun testNullOrEmptyPhoneMasking() {
        assertEquals("—", MaskingUtils.maskPhoneNumber(null))
        assertEquals("—", MaskingUtils.maskPhoneNumber(""))
    }
}
