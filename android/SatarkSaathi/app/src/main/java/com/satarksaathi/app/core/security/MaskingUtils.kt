package com.satarksaathi.app.core.security

object MaskingUtils {

    /**
     * Masks an Indian or international phone number for privacy.
     * Example: "+91 9876543210" -> "+91 98*** **210"
     */
    fun maskPhoneNumber(phone: String?): String {
        if (phone.isNullOrBlank()) return "—"
        val clean = phone.trim()
        val digits = clean.filter { it.isDigit() }
        if (digits.length < 10) return clean

        val prefix = if (clean.startsWith("+91")) "+91 " else ""
        val last10 = digits.takeLast(10)
        val masked = "${last10.substring(0, 2)}*** **${last10.substring(7)}"
        return prefix + masked
    }

    /**
     * Masks an IMEI number while keeping initial TAC (Type Allocation Code) and last 3 digits.
     * Example: "861234567890123" -> "861234******123"
     */
    fun maskIMEI(imei: String?): String {
        if (imei.isNullOrBlank()) return "—"
        val digits = imei.filter { it.isDigit() }
        if (digits.length != 15) return imei

        return "${digits.substring(0, 6)}******${digits.substring(12)}"
    }

    /**
     * Local syntax check for 15-digit IMEI format.
     * Note: This is a local format validation only, NOT an authoritative genuine-device check.
     */
    fun isValidIMEIFormat(imei: String?): Boolean {
        if (imei == null) return false
        val clean = imei.trim()
        if (clean.length != 15 || !clean.all { it.isDigit() }) return false
        return validateLuhn(clean)
    }

    /**
     * Standard Luhn checksum algorithm for 15-digit IMEI.
     */
    fun validateLuhn(number: String): Boolean {
        var sum = 0
        var alternate = false
        for (i in number.length - 1 downTo 0) {
            var n = number[i].digitToInt()
            if (alternate) {
                n *= 2
                if (n > 9) {
                    n -= 9
                }
            }
            sum += n
            alternate = !alternate
        }
        return (sum % 10 == 0)
    }
}
