# Satark Saathi — Native Android Application

Satark Saathi is an AI-assisted telecom safety, scam prevention, and family protection application engineered for Indian citizens, featuring a **Sanchar Saathi-inspired citizen-service UI/UX**.

This application is built as a pure native Android client that connects directly to the existing Satark Saathi FastAPI backend.

---

## 🚀 Key Specifications

- **Application ID:** `com.satarksaathi.app`
- **Architecture:** MVVM + Clean Architecture + Repository Pattern
- **UI Framework:** 100% Jetpack Compose with Material 3
- **Language:** Kotlin 2.0.21
- **Target SDK:** 35 (Android 15)
- **Minimum SDK:** 24 (Android 7.0 Nougat — covering >98% of active Indian Android devices)
- **Networking:** Retrofit 2.11 + OkHttp 4.12 + Kotlinx Serialization
- **Secure Storage:** Android Keystore + AndroidX Security Crypto (`EncryptedSharedPreferences`)
- **Measured Release APK Size:** **2.73 MB** (Ultra-lightweight; R8 minified & resource shrunk)
- **Measured Debug APK Size:** **18.85 MB**

---

## 📱 Navigation & Screen Architecture

The app uses a 4-destination persistent bottom navigation bar (`Home`, `Safety Center`, `My Cases`, `Profile`) with a decoupled Jetpack Compose navigation graph:

1. **Onboarding & Authentication:**
   - `SplashScreen`: Cold-start brand animation and session verification.
   - `OnboardingScreen`: Citizen education on scam signals and digital safety.
   - `LoginScreen`: Token/passcode login with 1-tap demo credentials (Rajesh Sharma #1, Aarav Sharma #2).
2. **Home Screen (`HomeScreen`):**
   - Sanchar Saathi-inspired citizen service grid.
   - Quick Scan Card with immediate paste & analyze action.
   - 1930 National Cyber Crime Helpline rapid dialer bar.
   - Active Family Shield overview and live threat feeds.
3. **Telecom Safety Center (`TelecomSafetyCenterScreen`):**
   - **Report Suspicious Communication (`ReportSuspiciousCommunicationScreen`):** Paste SMS/WhatsApp/URL or pick screenshot for risk scoring and official Chakshu reporting handoff.
   - **Lost or Stolen Mobile (`LostOrStolenPhoneScreen`):** Guided checklist for FIR registration, SIM blocking, and official CEIR portal handoff.
   - **Device Genuineness (`IMEIVerificationGuideScreen`):** 15-digit Luhn algorithm IMEI syntax check and KYM verification instructions.
   - **Mobile Connection Safety (`MobileConnectionSafetyScreen`):** Guidelines to detect unauthorised SIMs registered against Aadhaar with TAFCOP handoff.
   - **Suspicious Caller Report (`SuspiciousCallerReportScreen`):** Form to log spoofed international (+92, +880, etc.) or fake police/CBI calls.
   - **Trusted Bank Contacts (`TrustedBankContactsScreen`):** Verified fraud helplines for Indian banks (SBI, HDFC, ICICI, Axis, PNB, RBI Sachet).
4. **Scam Scanner (`ScamScannerScreen`, `ScanResultScreen`):**
   - Real-time text and URL risk scoring (0–100 scale).
   - Signal breakdown (Urgency, Impersonation, Suspicious Links, Coercion).
   - Actionable citizen recommendations.
5. **My Cases (`IncidentHistoryScreen`, `IncidentDetailScreen`):**
   - Active and resolved safety reports with audit trail.
6. **Family Shield (`FamilyShieldScreen`):**
   - Trusted guardian network management and high-risk safety alerts.
7. **Recovery Assistant (`RecoveryAssistantScreen`):**
   - "Golden Hour" 1930 liaison checklist, bank freeze escalation steps, and pre-formatted dispute email/letter templates.
8. **Settings & Governance:**
   - `ProfileScreen`, `SettingsScreen`, `NotificationsScreen`, `PrivacyAndPermissionsScreen`, `OfficialServiceHandoffScreen`.

---

## 🔒 Security & Privacy Posture

1. **Encrypted Storage:** JWT authentication tokens and sensitive credentials are encrypted using AES-256 GCM backed by the hardware Android Keystore.
2. **Data Masking:** All phone numbers (`+91 98*** **210`) and IMEIs (`861234******123`) are masked on the UI layer via `MaskingUtils`.
3. **No Intrusive Permissions:**
   - **NO** `READ_SMS` permission.
   - **NO** `READ_CALL_LOG` permission.
   - **NO** `READ_PHONE_STATE` permission.
   - Users manually paste suspicious messages or use Android's privacy-preserving Photo Picker.
4. **Network Security:** Strict HTTPS enforcement in production with cleartext permitted solely for development loopback (`10.0.2.2`).

---

## 🏛️ Official Government Boundaries & Disclaimers

The app upholds strict governance boundaries:
- **CEIR (Central Equipment Identity Register):** Phone blocking/unblocking is executed via official user-initiated handoffs to `https://www.ceir.gov.in/`.
- **Sanchar Saathi Chakshu:** Citizen reporting is prepared in the app and handed off to `https://www.sancharsaathi.gov.in/`.
- **National Cyber Crime Reporting Portal (1930):** Financial fraud alerts trigger guided instructions to call 1930 and submit details on `https://cybercrime.gov.in/`.
- The app explicitly states that it does not represent or impersonate any government department.

---

## ⚙️ Build & Installation

### Prerequisites
- JDK 17 or JDK 21
- Android SDK with Platform 34/35 and Build Tools 34.0.0+

### Build Commands (Windows PowerShell)

```powershell
# Navigate to project
cd android/SatarkSaathi

# Run all unit tests
.\gradlew.bat test

# Build debug APK
.\gradlew.bat assembleDebug

# Build optimized release APK
.\gradlew.bat assembleRelease
```

Generated APKs:
- **Release APK:** `app/build/outputs/apk/release/app-release.apk` (~2.73 MB)
- **Debug APK:** `app/build/outputs/apk/debug/app-debug.apk` (~18.85 MB)

### Installation via ADB
```powershell
adb install -r app/build/outputs/apk/release/app-release.apk
```
