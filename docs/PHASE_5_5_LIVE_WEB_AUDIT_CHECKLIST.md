# SATARK SAATHI — PHASE 5.5: LIVE WEB APPLICATION AUDIT CHECKLIST
> **Stop. Verify. Stay Safe.**  
> *Browser-Based End-to-End Verification Protocol for Live Hackathon Review*

---

## 1. Audit Framework & Rules

- **Execution Philosophy:** Genuine live browser verification. Every test must be executed against running local processes (`http://127.0.0.1:8000` and `http://127.0.0.1:5173`).
- **Data Protection:** Strictly use synthetic scenarios and pre-seeded demonstration identities (`Rajesh Sharma` [Protected Member, User ID 1], `Aarav Sharma` [Guardian, User ID 2]).
- **Safety Boundary:** Never initiate real UPI transactions, real banking freeze mandates, or actual 1930 cybercrime complaints. All operations are simulated and labeled.
- **Fail-Closed Verification:** No test may be marked `PASS` without inspecting actual DOM elements, network responses, and console logs.

---

## 2. Test Cases Matrix

### 2.1 Initial Page Load & Navigation

| Test ID | Prerequisites | Execution Steps | Expected Result | Actual Result | Status | Severity | Evidence to Collect |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `AUDIT-01-LOAD-OVERVIEW` | Backend running on 8000, Frontend on 5173 | 1. Navigate to `http://127.0.0.1:5173/`<br>2. Observe header, sidebar, hero metrics, threat radar | Page loads in < 2s without white screen. Overview cards display seeded metrics. Header displays "Rajesh Sharma", "Live WS" indicator. | `[PENDING AUDIT]` | `PENDING` | `CRITICAL` | Console errors, Network tab status codes |
| `AUDIT-02-NAV-LINKS` | Overview page loaded | 1. Click each sidebar link in sequence: Scanner, Payment, Family Shield, Golden Hour, History, Settings | Active route transitions immediately without full page reload. Header page title and description update dynamically. | `[PENDING AUDIT]` | `PENDING` | `HIGH` | URL bar update, route transition logs |

---

### 2.2 Authentication & Session Lifecycle

| Test ID | Prerequisites | Execution Steps | Expected Result | Actual Result | Status | Severity | Evidence to Collect |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `AUDIT-03-DEMO-AUTH-ISSUANCE` | Backend online | 1. Invoke `POST /api/auth/demo-token` with `{"user_id": 1}`<br>2. Inspect JWT payload | Returns 200 with signed `access_token`, `token_type: "bearer"`, and expiry in 7200s. Claims contain `user_id: 1, role: "PROTECTED_MEMBER"`. | `[PENDING AUDIT]` | `PENDING` | `CRITICAL` | HTTP 200 response payload |
| `AUDIT-04-AUTH-INVALID-CREDENTIALS` | Backend online | 1. Post to `POST /api/auth/login` with `identifier: "+91 98765 43210"` and incorrect passcode `"wrongpass"` | HTTP 401 Unauthorized returned with message `"Invalid credentials. Please verify your phone number/email and passcode."` | `[PENDING AUDIT]` | `PENDING` | `HIGH` | HTTP 401 JSON body |
| `AUDIT-05-PROFILE-SWITCHER` | App loaded on 5173 | 1. In header, click profile pill showing "Rajesh Sharma"<br>2. Observe active user change | Profile switches to "Aarav Sharma" (Guardian, User ID 2). Associated alerts and permissions update. Page reloads cleanly. | `[PENDING AUDIT]` | `PENDING` | `HIGH` | Header pill text, localStorage active user id |

---

### 2.3 Text Scanning (Deterministic & Rule Grounding)

| Test ID | Prerequisites | Execution Steps | Expected Result | Actual Result | Status | Severity | Evidence to Collect |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `AUDIT-06-SCAN-BENIGN-TEXT` | On `/scanner` page, Text tab active | 1. Enter: `"Hi Mom, I will reach home by 7 PM after office."`<br>2. Click "Analyze Communication" | Risk Level: `LOW` / `SAFE`. Risk Score ≤ 15. Verdict indicates low scam likelihood. No false positive alarms triggered. | `[PENDING AUDIT]` | `PENDING` | `HIGH` | Result card screenshot, Risk score badge |
| `AUDIT-07-SCAN-DIGITAL-ARREST` | On `/scanner` page | 1. Select preset or paste: `"URGENT: CBI Officer Vikram Singh. Seized parcel with MDMA. Non-Bailable Warrant. DIGITAL ARREST. Join Skype."`<br>2. Click Analyze | Risk Level: `CRITICAL` (Score 90–100). Red border, law enforcement impersonation signals, high urgency alert. Alert prompt triggered. | `[PENDING AUDIT]` | `PENDING` | `CRITICAL` | Risk badge, detected signals list |
| `AUDIT-08-SCAN-AMBIGUOUS-ELECTRICITY` | On `/scanner` page | 1. Enter: `"Electricity bill unpaid. Power disconnected tonight. Call officer at 9876501234."`<br>2. Click Analyze | Risk Level: `HIGH` (Score 70–85). Category: Utility Impersonation. Flags immediate urgency and unofficial phone number. | `[PENDING AUDIT]` | `PENDING` | `HIGH` | Signal breakdown, Plain language summary |
| `AUDIT-09-SCAN-DEVANAGARI-TEXT` | On `/scanner` page | 1. Enter: `"प्रिय उपभोक्ता, आपका बिजली कनेक्शन आज रात 9:30 बजे काट दिया जाएगा। तुरंत 9876501234 पर कॉल करें।"`<br>2. Click Analyze | Native Devanagari script analyzed accurately. Risk Level `HIGH` or `CRITICAL`. Summary and matched keywords extracted correctly. | `[PENDING AUDIT]` | `PENDING` | `HIGH` | Extracted signal tokens in Devanagari |

---

### 2.4 URL Scanning & Domain Structure Analysis

| Test ID | Prerequisites | Execution Steps | Expected Result | Actual Result | Status | Severity | Evidence to Collect |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `AUDIT-10-URL-BENIGN-DOMAIN` | On `/scanner`, URL tab active | 1. Enter safe URL: `https://www.sbi.co.in/portal/web/home`<br>2. Click Analyze URL | Risk Level: `LOW` (Score ≤ 15). Structural analyzer detects legitimate banking domain without suspicious shorteners or typosquatting. | `[PENDING AUDIT]` | `PENDING` | `HIGH` | URL analysis result card |
| `AUDIT-11-URL-PHISHING-SHORTENER` | On `/scanner`, URL tab active | 1. Enter synthetic phishing URL: `http://bit.ly/sbi-kyc-pan-update-2026`<br>2. Click Analyze URL | Risk Level: `CRITICAL` or `HIGH`. Flags URL shortener, unsecured HTTP protocol, and credential-harvesting tokens in path. | `[PENDING AUDIT]` | `PENDING` | `CRITICAL` | Signal reasons: URL shortener, unencrypted HTTP |

---

### 2.5 Image Upload & OCR Graceful Degradation

| Test ID | Prerequisites | Execution Steps | Expected Result | Actual Result | Status | Severity | Evidence to Collect |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `AUDIT-12-IMAGE-OCR-DEGRADED-CHECK` | On `/scanner`, Image tab active | 1. Upload a PNG/JPEG screenshot of a suspicious message<br>2. Inspect system response | In absence of host Tesseract binary: System displays honest notification (`"tesseract_unavailable"` or prompts manual transcription). Does not crash or fabricate text. | `[PENDING AUDIT]` | `PENDING` | `HIGH` | UI status badge, Network response from `/v1/analyze/image` |
| `AUDIT-13-IMAGE-OVERSIZE-PROTECTION` | On `/scanner`, Image tab active | 1. Attempt upload of file > 10MB or corrupted bytes | Client or server rejects upload with HTTP 400/422 validation notice. Memory limits respected. | `[PENDING AUDIT]` | `PENDING` | `MEDIUM` | Toast alert or validation error message |

---

### 2.6 Audio Upload & Speech-to-Text Transcription

| Test ID | Prerequisites | Execution Steps | Expected Result | Actual Result | Status | Severity | Evidence to Collect |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `AUDIT-14-AUDIO-WHISPER-LOCAL` | On `/scanner`, Audio tab active (FFmpeg + Whisper cached) | 1. Upload sample `.wav` or `.mp3` audio recording (e.g. simulated bank caller voice)<br>2. Click Transcribe & Analyze | Audio transcribed locally via Whisper tiny model. Transcribed text populated into analysis workspace and analyzed for scam intent. | `[PENDING AUDIT]` | `PENDING` | `HIGH` | Transcript text box, Network payload from `/v1/analyze/audio` |
| `AUDIT-15-AUDIO-OVERSIZE-REJECTION` | On `/scanner`, Audio tab active | 1. Attempt upload of audio > 25MB | Server returns HTTP 413 or 400 with clear size error message. System remains responsive. | `[PENDING AUDIT]` | `PENDING` | `MEDIUM` | Error banner |

---

### 2.7 Risk Explanations, Confidence & Limitation Transparency

| Test ID | Prerequisites | Execution Steps | Expected Result | Actual Result | Status | Severity | Evidence to Collect |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `AUDIT-16-EVIDENCE-BREAKDOWN` | Completed scan on `/scanner` | 1. Scroll to "Signals Detected" and "Technical Forensics"<br>2. Expand details | Each signal exhibits: Signal type, Severity tag, Matched excerpt, and Weight. No generic placeholders or missing data. | `[PENDING AUDIT]` | `PENDING` | `HIGH` | Forensics accordion screenshot |
| `AUDIT-17-LIMITATION-DISCLOSURE` | Completed scan on `/scanner` | 1. Review bottom banner of analysis result card | Discloses: Analysis mode (Deterministic Rule Engine / Offline Semantic), confidence caveats, and reminder that human verification is advised. | `[PENDING AUDIT]` | `PENDING` | `MEDIUM` | Limitation disclosure text block |

---

### 2.8 Incident Persistence & Historical Audit Trail

| Test ID | Prerequisites | Execution Steps | Expected Result | Actual Result | Status | Severity | Evidence to Collect |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `AUDIT-18-HISTORY-PERSISTENCE` | Scan completed in `AUDIT-07` | 1. Navigate to `/incident-history`<br>2. Inspect top entry | The newly scanned incident appears immediately in history with identical timestamp, classification, risk score, and channel. | `[PENDING AUDIT]` | `PENDING` | `HIGH` | History table row data |
| `AUDIT-19-AUDIT-LOG-INTEGRITY` | On `/incident-history` | 1. Click on incident to view detailed audit events | Shows chronological audit trail: `SCAN_EXECUTED`, timestamp, user ID, risk score. Immutable forensic record maintained. | `[PENDING AUDIT]` | `PENDING` | `HIGH` | Modal / expanded audit timeline |

---

### 2.9 Family Shield Network & Consent-First Alerts

| Test ID | Prerequisites | Execution Steps | Expected Result | Actual Result | Status | Severity | Evidence to Collect |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `AUDIT-20-CONTACT-CREATION-CONSENT` | Navigate to `/family-shield` | 1. Fill "Add Trusted Guardian" form with name, phone, relationship<br>2. Submit form | Contact created with `consent_granted: false` ("Pending Consent"). System does NOT allow unverified notification dispatch. | `[PENDING AUDIT]` | `PENDING` | `CRITICAL` | Status pill on contact card |
| `AUDIT-21-ALERT-DISPATCH-VERIFICATION` | On `/family-shield`, contact verified | 1. Click "Simulate SOS Alert Dispatch"<br>2. Observe toast & WebSocket | Alert delivered via WebSocket. Bell notification counter increments. Audio chime plays. Alert status marked `SENT`. | `[PENDING AUDIT]` | `PENDING` | `HIGH` | WebSocket message in DevTools, Bell counter badge |
| `AUDIT-22-ISOLATION-BETWEEN-USERS` | User 1 has contacts; switch to User 2 | 1. Switch profile to User 2 (Aarav)<br>2. Inspect `/family-shield` and `/incident-history` | User 2 only sees contacts and incidents authorized for User 2. User 1's private drafts and unauthorized data are strictly hidden. | `[PENDING AUDIT]` | `PENDING` | `CRITICAL` | Table rows under User 2 |

---

### 2.10 Payment Checkpoint Simulation

| Test ID | Prerequisites | Execution Steps | Expected Result | Actual Result | Status | Severity | Evidence to Collect |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `AUDIT-23-PAYMENT-BENIGN-UPI` | Navigate to `/payment-checkpoint` | 1. Enter UPI VPA: `merchant@icici`, Amount: `₹450`, Purpose: `Grocery`<br>2. Click Check Payment Safety | Safety status: `LOW_RISK`. Clear message: UPI PIN is only for sending money, not receiving. Verification checklist displayed. | `[PENDING AUDIT]` | `PENDING` | `HIGH` | Result banner, Checklist items |
| `AUDIT-24-PAYMENT-SUSPICIOUS-VPA` | Navigate to `/payment-checkpoint` | 1. Enter VPA: `cbi.officer.refund99@paytm`, Amount: `₹50,000`<br>2. Check Payment Safety | Safety status: `HIGH_RISK` / `BLOCKED`. Warning: Impersonation keyword "cbi" / "refund" in VPA. Advised to halt payment immediately. | `[PENDING AUDIT]` | `PENDING` | `CRITICAL` | Alert modal, "Halt Payment" button |

---

### 2.11 Golden Hour Recovery Desk Simulation

| Test ID | Prerequisites | Execution Steps | Expected Result | Actual Result | Status | Severity | Evidence to Collect |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `AUDIT-25-BANK-FREEZE-SIMULATION` | Navigate to `/golden-hour` | 1. In Bank Freeze Mandate, enter Bank: `State Bank of India`, Amount: `₹25,000`, UTR: `UTR992817291`<br>2. Submit Mandate | Returns simulated freeze acknowledgement with reference ID. UI explicitly displays: *"PROTOTYPE SIMULATION ONLY: No actual bank account lien was placed."* | `[PENDING AUDIT]` | `PENDING` | `CRITICAL` | Simulation disclaimer on screen |
| `AUDIT-26-CYBERCRIME-1930-DRAFT` | Navigate to `/golden-hour` | 1. Generate formal complaint draft<br>2. Review legal template | Pre-fills comprehensive complaint formatted for National Cyber Crime Reporting Portal (cybercrime.gov.in) with incident details. | `[PENDING AUDIT]` | `PENDING` | `HIGH` | Complaint text preview, "Copy Draft" button |

---

### 2.12 Responsive Design & Edge Conditions

| Test ID | Prerequisites | Execution Steps | Expected Result | Actual Result | Status | Severity | Evidence to Collect |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `AUDIT-27-VIEWPORT-MOBILE-375PX` | Browser DevTools set to 375px width | 1. Test navigation hamburger, scanner input, result cards, and alert modals | No horizontal scroll overflow. Hamburger drawer operates smoothly. Touch targets ≥ 44px. Typography scales legibly. | `[PENDING AUDIT]` | `PENDING` | `HIGH` | Mobile viewport screenshot |
| `AUDIT-28-VIEWPORT-TABLET-768PX` | DevTools set to 768px (iPad portrait) | 1. Test grid layouts on Overview, Scanner, and Golden Hour | 2-column grids collapse gracefully. No truncated metric values or overlapping buttons. | `[PENDING AUDIT]` | `PENDING` | `MEDIUM` | Tablet viewport screenshot |
| `AUDIT-29-EMPTY-STATE-BEHAVIOR` | On History or Shield with 0 items | 1. Reset database with demo seed disabled or observe empty state | Informative illustration, friendly copy, and direct call-to-action button (e.g. "Run First Scan"). No broken UI blocks. | `[PENDING AUDIT]` | `PENDING` | `MEDIUM` | Empty state container screenshot |
| `AUDIT-30-OFFLINE-DEGRADATION` | Disconnect backend (stop port 8000) | 1. Observe frontend header and try submitting scan | Header status pill shifts to Amber "Connecting...". Scan button surfaces clean error toast: `"Unable to connect to Satark Saathi server."` | `[PENDING AUDIT]` | `PENDING` | `HIGH` | Toast message screenshot, console log |

---

## 3. Post-Audit Scoring & Defect Categorization

- **Critical Blocker:** Crash, secret leak, incorrect safety advice on active scam, or real financial execution.
- **High Severity:** Broken primary user flow, authorization boundary violation, or failed notification dispatch.
- **Medium Severity:** Cosmetic overflow, missing localization string, or unhandled non-blocking API exception.
- **Low Severity:** Minor padding misalignment or non-critical UI polish item.
