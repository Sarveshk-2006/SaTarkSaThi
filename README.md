# Satark Saathi (सतर्क साथी)
> **Stop. Verify. Stay Safe.**
> *AI-Assisted Digital Scam Prevention, Family Protection & Golden Hour Fraud Recovery for Indian Families*

[![Tests](https://img.shields.io/badge/pytest-236%2F236%20passed-emerald)](backend/tests/)
[![Frontend Tests](https://img.shields.io/badge/vitest-8%2F8%20passed-teal)](frontend/src/tests/)
[![TypeScript](https://img.shields.io/badge/typescript-strict%20build%20passing-blue)](frontend/)
[![Architecture](https://img.shields.io/badge/FastAPI%20%2B%20React%2019-Vite%20%7C%20Tailwind-indigo)]()
[![Security](https://img.shields.io/badge/Auth-Cryptographic%20JWT%20%2B%20PBKDF2-blueviolet)]()


Satark Saathi is a cybersecurity and fraud-recovery product designed to protect Indian citizens—especially senior citizens, students, and first-time digital payment users—against high-impact digital extortion attacks, social engineering, and financial cyberfraud.

---

## 📑 Table of Contents
1. [Executive Summary & Problem Statement](#-executive-summary--problem-statement)
2. [End-to-End System Architecture](#-end-to-end-system-architecture)
3. [Core Feature Modules](#-core-feature-modules)
   - [Scam Intelligence Engine](#1-scam-intelligence-engine-scanner)
   - [Family Shield Network](#2-family-shield-network-family-shield)
   - [Payment Checkpoint](#3-payment-checkpoint-sandbox-simulation)
   - [Golden Hour Recovery Desk](#4-golden-hour-recovery-desk-golden-hour)
   - [Incident History & Audit Ledger](#5-incident-history--audit-ledger-incident-history)
   - [Presenter Control Deck](#6-presenter-control-deck-live-demo-controls)
4. [Repeatable Benchmark Evaluation (N=30)](#-repeatable-benchmark-evaluation-n30)
5. [Prerequisites & Quickstart](#-prerequisites--quickstart)
6. [IBM watsonx.ai Configuration](#-ibm-watsonxai-configuration)
7. [API Documentation](#-api-documentation)
8. [Automated Testing & Verification](#-automated-testing--verification)
9. [Step-by-Step Hackathon Demonstration Script](#-step-by-step-hackathon-demonstration-script)
10. [Security & Privacy Review](#-security--privacy-review)
11. [Honest Implementation Report & Roadmap](#-honest-implementation-report--roadmap)

---

## 🎯 Executive Summary & Problem Statement

India witnesses thousands of cyber-fraud incidents daily, including:
- **Digital Arrest Extortion**: Impersonators posing as CBI, Mumbai Police, or Customs officers intimidating victims over Skype/WhatsApp video calls with bogus arrest warrants and demanding secrecy from family members.
- **Predatory Loan App Blackmail**: Extortionists threatening contact lists and morphed photos.
- **Utility / TRAI Disconnection Scares**: Threatening power disconnection or SIM blockage within hours.
- **Prepaid Task & Investment Scams**: Telegram groups promising guaranteed 100% daily/monthly returns.
- **Urgent Coerced Payments**: Forcing instant UPI transfers before the victim can consult anyone.

Satark Saathi provides an operational defense: **Forensic Threat Detection**, **Immediate Trusted Guardian In-App Alerts**, **Pre-Transaction Risk Checkpoints**, and **Rapid Golden Hour Recovery Complaint Generation** aligned with India's **1930 Cyber Fraud Helpline** and **RBI Zero-Liability Customer Protection Guidelines**.

---

## 🏗️ End-to-End System Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          SATARK SAATHI CLIENT (React 19 + TypeScript)       │
│  - Scam Analyzer Workspace (Text, URL, Screenshot, Voice Transcript)        │
│  - Family Shield & Live Notification Transport (Audio Chime Synthesis)      │
│  - Payment Checkpoint Sandbox (Coercion Scoring & Safeguard Checklist)     │
│  - Golden Hour Recovery Desk (4-Step Wizard, 1930 Portal, RBI, Police FIR)  │
│  - Incident History Ledger (Search, Filters, Audit Log, JSON Export)        │
│  - Presenter Control Deck (1-Click Scenarios, Health, Benchmarking N=30)   │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │ HTTP / REST & WebSockets (/api/ws)
┌──────────────────────────────────────▼──────────────────────────────────────┐
│                       FASTAPI BACKEND & SECURITY LAYER                      │
│  - Structured Pydantic Input/Output Validation & Ownership Guards           │
│  - AlertBroadcaster WebSocket Transport with Fallback Simulation Delivery   │
│  - Standardized Incident Identifiers (SA-XXXXXX) across all modules         │
└──────────────┬───────────────────────────────┬──────────────────────────────┘
               │                               │
┌──────────────▼─────────────┐   ┌─────────────▼──────────────────────────────┐
│      DATABASE LAYER        │   │             AI FORENSIC ENGINE             │
│  - SQLAlchemy Engine       │   │  - IBM watsonx.ai Granite 13B Chat Model   │
│  - SQLite (Local Dev)      │   │  - Satark Deterministic Heuristic Engine   │
│  - PostgreSQL Compatible   │   │  - Weighted Threat Indicators (+15 to +45) │
│  - Auto Column Migration   │   │  - Counter-Signals (1800, bank debit norms)│
│  - Ownership Enforced      │   │  - Repeatable Benchmark Runner (N=30)      │
└────────────────────────────┘   └────────────────────────────────────────────┘
```

---

## 🛡️ Core Feature Modules

### 1. Scam Intelligence Engine (`/scanner`)
- **4 Unified Input Modalities**:
  - **Text**: Multiline analysis for SMS, WhatsApp forwards, email threats, and chat transcripts.
  - **URL**: Safe structural inspection of hostnames, deceptive subdomains (`bit.ly`, `sbi-kyc-verify.xyz`), TLDs, and path entropy without fetching or executing untrusted code.
  - **Image / Screenshot**: OCR extraction for WhatsApp/payment screenshots (JPG, PNG, WebP up to 10 MB) with manual review fallback. In-memory processing with no indefinite evidence retention.
  - **Voice / Call Transcript**: Form for call transcripts and voice notes. Explicitly disclaims that live telephonic calls are never tapped.
- **Explainable Scoring**: Returns heuristic risk score (0-100), risk level (`LOW`, `MEDIUM`, `HIGH`, `CRITICAL`), confidence label (`LOW`, `MEDIUM`, `HIGH`), detected signals with excerpt quotes, recommended immediate protective actions, and independent verification steps.
- **Explicit Provider Labeling**: Clearly identifies whether IBM watsonx.ai or the deterministic local rule engine generated the report.

### 2. Family Shield Network (`/family-shield`)
- **Trusted Contact Management**: Add, edit, verify, and remove family guardians.
- **6-Digit OTP Verification Flow**: Simulates telecom carrier OTP dispatch and verification.
- **Configurable Alert Thresholds**: Configure whether contacts receive `ALL`, `HIGH_RISK_ONLY`, or `CRITICAL_ONLY` alerts.
- **Explicit Consent**: Consent toggle is required before incident details can be shared.
- **Live WebSocket Notification Transport**:
  - Live transport connects to `ws://127.0.0.1:8000/api/ws/alerts`.
  - Secondary sessions (e.g. Son: Aarav Sharma) receive instant in-app alerts with audio chime synthesis.
  - The notification displays Incident ID, risk level, threat summary, and recommended action.
  - Includes 1-click alert acknowledgment and retry/delivery state tracking.
- **Dual Persona Sessions**: Header persona switcher enables toggling between `Rajesh Sharma (Father / Primary)` and `Aarav Sharma (Son / Guardian)`.

### 3. Payment Checkpoint (Sandbox Simulation) (`/payment-checkpoint`)
- **Pre-Transaction Fraud Simulation**: Interactive sandbox designed to test hypothetical payments before money moves.
- **Coercion & Social Engineering Checklist**:
  - Caller claims official authority (Police, CBI, Customs, Court, Electricity Board).
  - Secrecy demanded ("Do not tell your family, friends, or lawyer").
  - Urgent coercive pressure ("Pay within 15 minutes or face raid/disconnection").
  - Guaranteed investment returns promised.
- **Risk Outcomes**:
  - `PROCEED_WITH_CAUTION` (Score < 30)
  - `PAUSE_AND_VERIFY` (Score 30 - 64)
  - `SEEK_TRUSTED_HELP` (Score >= 65)
- **Prominent Disclaimers**: Bold banner explicitly states `"SIMULATION ONLY: no real money has been moved or blocked."` Never displays a fake payment-success screen.
- **1-Click Escalation**: Easily escalate flagged transactions directly into the Golden Hour Recovery Desk or contact Family Shield guardians.

### 4. Golden Hour Recovery Desk (`/golden-hour`)
- **4-Step Incident Wizard**:
  - **Step 1: Incident Information**: Date/time, scam type, communication channel, factual description.
  - **Step 2: Financial Information**: Amount lost or at risk, bank or payment app, transfer status (Pending vs Completed), transaction reference / UTR.
  - **Step 3: Evidence & Timeline**: Suspect contact, message transcript, chronological event builder.
  - **Step 4: Structured Complaint Dossier Generation**:
    1. **1930 Cyber Fraud Helpline & cybercrime.gov.in Portal Draft**: Formatted for national reporting.
    2. **Bank Dispute & Recall Letter**: Cites RBI Master Circular `DBR.No.Leg.BC.78/09.07.005/2017-18` (Zero & Limited Customer Liability) for immediate lien marking.
    3. **Cyber Police Station FIR Draft**: Cites Section 66D IT Act 2000 and Bharatiya Nyaya Sanhita (BNS).
- **Missing UTR Policy**: Missing UTR is explicitly supported and rendered as `[UTR / TRANSACTION REF NOT SUPPLIED - PENDING BANK STATEMENT]`. No values or dates are ever fabricated.
- **Editable & Exportable**: User can review and edit all text drafts inline before exporting as `.txt`.
- **National Helpline Guidance**: Prominently guides users to call **1930** and report to [cybercrime.gov.in](https://cybercrime.gov.in/). Disclaims that complaints are not automatically filed with banks or police.

### 5. Incident History & Audit Ledger (`/incident-history`)
- **Direct Database Backed**: All records load directly from the SQLite database; zero hardcoded frontend mock arrays.
- **Search & Filters**: Filter by free text, incident ID (`SA-XXXXXX`), scam category, risk level, and recovery status (`UNDER_REVIEW`, `REPORTED_1930`, `BANK_FREEZE_REQUESTED`, `RESOLVED`).
- **Detailed Drawer**: Displays financial particulars, statement of facts, linked recovery progress, and exportable chronological audit events.
- **Exportable Audit Trail**: Download full JSON audit ledger for any incident.

### 6. Presenter Control Deck (Live Demo Controls)
- **Discreet Header Trigger**: Presenter Deck button located in the application header.
- **1-Click Deterministic Scenarios**:
  - 1. *Digital Arrest / CBI Extortion* (WhatsApp video call threat)
  - 2. *Guaranteed 100% Returns Scheme* (Telegram trading group)
  - 3. *OTP Theft Call Transcript* (Voice transcript of bank impersonation)
  - 4. *Coerced Authority Payment* (₹25,000 customs bond simulation)
  - 5. *Legitimate Bank Debit Notice* (Genuine transactional SMS)
- **Live System Health**: Real-time ping ms, FastAPI status, SQLite database engine, active AI provider, and live WebSocket connection state.
- **Live Evaluation Suite**: Execute repeatable benchmark evaluations and display precision, recall, and latency metrics directly in the presenter UI.
- **Database Reset**: Reseed database to default clean demo state in 1 click.

---

## 📊 Repeatable Benchmark Evaluation (N=30)

Satark Saathi features an automated, repeatable evaluation module (`backend/app/evaluation/`) testing 30 balanced, ground-truth samples (15 SCAM vs 15 SAFE):

| Metric | Measured Benchmark | Target Threshold | Status |
| :--- | :---: | :---: | :---: |
| **Total Test Samples** | 30 | 30 | ✅ Complete |
| **Scam Samples (Positive)** | 15 | 15 | ✅ Balanced |
| **Legitimate Samples (Negative)**| 15 | 15 | ✅ Balanced |
| **Precision** | **100% (1.000)** | >= 85% | ✅ Passed |
| **Recall** | **93.3% (0.933)** | >= 85% | ✅ Passed |
| **F1-Score** | **96.6% (0.966)** | >= 85% | ✅ Passed |
| **False Positive Rate (FPR)** | **0.0% (0.000)** | <= 15% | ✅ Passed |
| **False Negative Rate (FNR)** | **6.7% (0.067)** | <= 15% | ✅ Passed |
| **Average Latency** | **~2.1 ms** | < 1000 ms | ✅ Real-time |
| **Family Alert Transport** | **PASSED** | 100% Delivery | ✅ Verified |
| **Recovery Dossier Generation** | **PASSED** | Valid Drafts | ✅ Verified |

> **Engine and Methodology Notice**: These metrics are produced by running the **Satark deterministic rule engine** against the synthetic evaluation dataset.
> The rule engine is the default and active engine unless `ANALYSIS_PROVIDER=watsonx` is set with valid IBM credentials.
> When IBM watsonx.ai Granite is active, the evaluation runner will report `LIVE_IBM_CONNECTED` in the `provider_status` field.
> Measurements are executed via `backend/app/evaluation/evaluator.py` and reflect performance on the 30-sample benchmark. Synthetic performance is indicative; it does not guarantee detection of novel attacks.

---

## 🚀 Prerequisites & Quickstart

### Prerequisites
- Python 3.10+ (Tested on Python 3.14.3)
- Node.js 18+ and npm
- Windows PowerShell, Linux bash, or macOS zsh

### 1. Backend Setup & Startup
```powershell
# Navigate to repository root
cd satark-saathi

# Create and activate a virtual environment (recommended)
python -m venv backend/venv
.\backend\venv\Scripts\Activate.ps1   # Windows PowerShell
# source backend/venv/bin/activate    # Linux / macOS

# Install dependencies (Starlette version is pinned — see requirements.txt)
pip install -r backend/requirements.txt

# Start FastAPI backend with hot-reload
python -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8000 --reload
```
*Backend API runs at: `http://127.0.0.1:8000` (Swagger Docs: `http://127.0.0.1:8000/docs`)*

### 2. Frontend Setup & Startup
```powershell
# Open a second terminal window
cd frontend

# Install dependencies (if first time)

npm install

# Start Vite development server
npm run dev -- --host 127.0.0.1 --port 5173
```
*Frontend runs at: `http://127.0.0.1:5173`*

### 3. Database Initialization & Reset
The database is automatically initialized and seeded with baseline demo profiles and records upon startup (`satark_saathi.db`).
- **To reset via Presenter Deck**: Click **Presenter Deck** in the top header and click **Reset Clean Seed Data**.
- **To reset via API**:
```powershell
curl -X POST http://127.0.0.1:8000/api/settings/reset-database -H "Content-Type: application/json" -d '{"seed_demo_data": true}'
```

---

## 🤖 IBM watsonx.ai Configuration

Satark Saathi includes an **optional, unverified** client for IBM watsonx.ai text generation. It is off by default; all analysis runs on the local rule engine unless credentials are configured. No watsonx Orchestrate, Granite Guardian or IBM Safer Payments integration exists — see `GET /api/integrations/status` and [docs/FEATURE_GAP_AUDIT_AND_IMPLEMENTATION.md](docs/FEATURE_GAP_AUDIT_AND_IMPLEMENTATION.md).

The default model is `ibm/granite-4-h-small`. The previous default, `ibm/granite-13b-chat-v2`, is listed by IBM only as deploy-on-demand, so it does not work with the pay-per-token `model_id` call this client makes. Confirm the model is available to your project and region before relying on it.

### Configuring Watsonx Credentials
Copy `.env.example` to `backend/.env` (or set environment variables):
```env
ANALYSIS_PROVIDER="watsonx"
WATSONX_APIKEY="your-ibm-cloud-api-key"
WATSONX_PROJECT_ID="your-watsonx-project-id"
WATSONX_URL="https://us-south.ml.cloud.ibm.com"
WATSONX_MODEL_ID="ibm/granite-4-h-small"
```
Then call `POST /api/integrations/watsonx/verify` to perform a real IAM token exchange and a 1-token generation call.

### Deterministic Local Fallback Guarantee
If IBM credentials are not configured or the IBM Cloud endpoint is unreachable, Satark Saathi **gracefully falls back to the internal deterministic rule engine**.

The fallback is **always clearly labelled** — API responses carry `ai_provider: "none"` and `analysis_mode: "rule_based"`. The `/api/health` endpoint reports `watsonx_configured: false`. No response will claim to be from IBM when the rule engine is active.

---

## 📡 API Documentation

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/health` | Backend and database liveness status |
| `GET` | `/api/scanner/presets` | Preset scam scenarios catalog |
| `POST` | `/api/v1/analyze` | Text forensic risk analysis |
| `POST` | `/api/v1/analyze/url` | Static URL structure inspection |
| `POST` | `/api/v1/analyze/image` | Image screenshot analysis with OCR |
| `POST` | `/api/v1/analyze/audio` | Audio transcript forensic inspection |
| `GET` | `/api/contacts` | List trusted family guardians |
| `POST` | `/api/contacts` | Add new trusted contact |
| `POST` | `/api/contacts/{id}/verify/request` | Request 6-digit verification OTP |
| `POST` | `/api/contacts/{id}/verify/confirm` | Confirm 6-digit OTP verification |
| `POST` | `/api/contacts/{id}/invite` | Create a one-time invitation code (demo: returned in response) |
| `GET` | `/api/contacts/invitations` | Invitations addressed to the signed-in user |
| `POST` | `/api/contacts/invitations/{id}/respond` | Invited user accepts / declines in-app |
| `POST` | `/api/contacts/invitations/respond-with-code` | Invited person accepts / declines with a code |
| `POST` | `/api/alerts/dispatch` | Dispatch in-app / simulated family alert |
| `POST` | `/api/alerts/{id}/acknowledge` | Acknowledge emergency alert |
| `WS` | `/api/ws/alerts` | Live WebSocket notification transport |
| `POST` | `/api/payment/simulate` | Explained payment risk assessment (sandbox) |
| `GET` | `/api/payment/simulations` | Retrieve simulation ledger history |
| `POST` | `/api/payment/simulations/{id}/checkin` | Adaptive multilingual Safety Check-in |
| `POST` / `GET` | `/api/payment/simulations/{id}/guardian-approval` | Request / read guardian approval |
| `GET` | `/api/guardian/approvals` | Approval requests you created or may decide |
| `POST` | `/api/guardian/approvals/{ref}/decision` | Guardian approves / declines |
| `GET` / `PUT` / `DELETE` | `/api/safety/duress` | Opt-in discreet safety phrase (hash only) |
| `POST` | `/api/sdk/v1/pre-transaction-check` | Prototype SDK boundary used by App mode (mock UPI) |
| `GET` | `/api/sdk/v1/transactions/{id}/decision` | Current SDK decision |
| `POST` | `/api/sdk/v1/transactions/{id}/complete` / `cancel` | Finish a mock payment (refused unless allowed) |
| `GET` | `/api/integrations/status` | What is real, simulated or not integrated |
| `POST` | `/api/recovery/wizard` | 4-step Golden Hour recovery dossier generation |
| `POST` | `/api/recovery/drafts/{id}/activate-response` | One-tap Golden Hour response (simulated complaint, bank lien request, police intimation) |
| `PUT` | `/api/recovery/drafts/{id}` | Update and save edited complaint drafts |
| `GET` | `/api/recovery/drafts/{id}/export?format=txt\|pdf` | Export dossier as TXT or PDF complaint pack |
| `GET` | `/api/incidents` | Filterable incident history records |
| `GET` | `/api/incidents/{id}` | Incident details with ownership check |
| `GET` | `/api/incidents/{id}/audit` | Incident chronological audit trail |
| `POST` | `/api/settings/reset-database` | Reset and reseed database |
| `GET` | `/api/evaluation/metrics` | Retrieve evaluation benchmark report |
| `POST` | `/api/evaluation/run` | Execute 30-sample benchmark suite |

---

## 🧪 Automated Testing & Verification

Every test in this repository has been physically executed and verified.

**Runtime**: Python 3.14.0 · FastAPI 0.115.0 · Starlette 0.38.6 (pinned in `requirements.txt`)

```powershell
# Run full backend test suite (236 tests across 21 test suites)
python -m pytest backend/tests/ -v

# Run frontend Vitest test suite (8 tests)
cd frontend
npm test -- --run

# Run frontend production bundle validation
npm run build
```

### Verified Test Results Summary:
- **Pytest**: `236 passed in ~11s` (Risk engine, context-aware signals, Devanagari/Hinglish detection, cryptographic auth, ownership & consent guards, evaluation suites, gateways).
- **Vitest**: `8 passed in ~2s` (4 test suites: navigation, components, api client, scanner workspace).
- **TypeScript & Vite Build**: `✓ built in 1.87s` with `0 errors`.


---

## 🎭 Step-by-Step Hackathon Demonstration Script

Follow this 5-minute presentation script for a live demonstration:

1. **Introduction & Presenter Deck (0:00 - 1:00)**:
   - Open `http://127.0.0.1:5173/`.
   - Click **Presenter Deck** in the header.
   - Show the **System & Live Health** tab (FastAPI 8000 online, SQLite connected, Live WS connected).
   - Switch to the **Benchmark Evaluation** tab and click **Run Benchmark (N=30)**. Highlight the **100% Precision**, **93.3% Recall**, and **~2ms latency**.
   - Close the Presenter Deck.

2. **Scam Analyzer & Threat Detection (1:00 - 2:00)**:
   - Navigate to **Scam Analyzer** (`/scanner`).
   - Click the **Digital Arrest / CBI Impersonation** preset.
   - Click **Run Forensic Analysis**.
   - Show the **99/100 CRITICAL RISK** verdict, plain-language summary, and detected indicators (*Authority Impersonation*, *Digital Arrest Demand*, *Secrecy Coercion*).

3. **Family Shield Emergency Alert (2:00 - 3:00)**:
   - Click **Alert Family Shield Guardians**.
   - Confirm dispatch to the 2 accepted guardians.
   - Observe the live in-app notification banner at the top of the screen with audio chime and Incident ID (`SA-XXXXXX`).
   - Click **Acknowledge Alert**.
   - Show the header persona switcher (`Rajesh Sharma` vs `Aarav Sharma`).

4. **Payment Checkpoint Sandbox (3:00 - 4:00)**:
   - Navigate to **Payment Checkpoint** (`/payment-checkpoint`).
   - Show the **SIMULATION ONLY** banner.
   - Fill in: Amount `₹25,000`, Recipient `cbi.clearing@sbi`, check **Authority Claimed** and **Secrecy Demanded**.
   - Click **Run Sandbox Risk Assessment**.
   - Show the **SEEK_TRUSTED_HELP** outcome card with verification protocol.
   - Click **Open Golden Hour Recovery Dossier →**.

5. **Golden Hour Recovery & Incident Audit (4:00 - 5:00)**:
   - Walk through the 4-step wizard prefilled with the dispute details.
   - Show Step 4: Review the **1930 Cybercrime Portal Draft**, **RBI Banking Dispute Letter**, and **Police FIR Draft**.
   - Highlight that missing UTR is explicitly marked as `[PENDING STATEMENT]` without fabricating facts.
   - Navigate to **Incident History** (`/incident-history`).
   - Open the incident details drawer to show the unified record, linked status, and exportable JSON audit trail.

---

## 🔒 Security & Privacy Review

- **Zero Secret Exposure**: Watsonx API keys and server configuration reside exclusively on the backend (`.env`) and are never sent to frontend clients.
- **Untrusted File & Evidence Handling**: All uploaded screenshots and audio files are parsed in-memory with strict MIME validation and size limits (10 MB / 25 MB). Evidence is not indefinitely retained.
- **Ownership & Authorization**: All incident, contact, and recovery routes enforce user ownership checks. Accessing another user's incident returns HTTP 403 Forbidden.
- **Admin-only operations**: `PUT /api/settings/system`, `POST /api/settings/reset-database` and `POST /api/integrations/watsonx/verify` require an administrator (`ADMIN_USER_IDS`, default `1` = Rajesh). Database reset additionally needs `ALLOW_DATABASE_RESET=true` (default in dev) and is always refused in production.
- **Phase 8 hardening**: USER/OPERATOR/ADMIN access roles with an admin console, per-IP rate limiting, secret redaction in logs, evidence retention, an IBM Bob adapter (unverified until its live check passes), a Chrome extension (`extension/`) and a signed WhatsApp webhook. See [docs/PHASE8_SECURITY_BOB_CHANNELS.md](docs/PHASE8_SECURITY_BOB_CHANNELS.md).
- **Prompt Injection Defense**: Untrusted text passed to LLM boundaries is isolated in delimiter blocks with strict system constraints.
- **Disclaimer**: Satark Saathi provides digital fraud detection and reporting assistance. It does not replace formal law enforcement investigation or guarantee financial recovery.

---

## 📋 Honest Implementation Report & Roadmap

### Completed Features:
- ✅ **Scam Intelligence Engine**: Text, URL, Image OCR, and Audio transcript inspection with explainable signals.
- ✅ **IBM watsonx.ai Bridge**: Granite 13B model integration with automatic, transparent local fallback.
- ✅ **Family Shield**: Contact CRUD, 6-digit OTP verification, threshold controls, live WebSockets, and acknowledgment.
- ✅ **Payment Checkpoint**: Interactive sandbox simulation, coercion factor scoring, and safeguard checklist.
- ✅ **Golden Hour Recovery**: 4-step wizard, 1930 Helpline guidance, RBI dispute draft, and missing UTR preservation.
- ✅ **Incident History**: SQLite-backed search, filters, details drawer, and exportable audit trail.
- ✅ **Presenter Deck**: 1-click scenarios, health monitoring, database reset, and N=30 evaluation benchmark.

### Features Operating in Local Fallback Mode:
- **IBM watsonx.ai**: When IBM credentials are not provided in `.env`, the system runs on the internal deterministic rule engine.
- **Telecom SMS/WhatsApp Delivery**: Simulated in-app via WebSockets to enable cross-device demonstration without external telecom API costs.
- **Bank Interception**: Simulated pre-transaction sandbox (real UPI payment apps do not permit third-party interception).

### Phase 6 Safety Upgrades
Adaptive multilingual Safety Check-in (English/Hindi/Marathi/Kannada, anti-coaching), explained transaction-risk signals from a mock payment history, explicit call-state signal, two-sided Family Shield consent with a two-guardian cap and guardian approvals, discreet duress phrase, Senior Mode, Golden Hour PDF complaint pack, a mock UPI app with an SDK boundary, and honest IBM integration status. Details and limitations: [docs/FEATURE_GAP_AUDIT_AND_IMPLEMENTATION.md](docs/FEATURE_GAP_AUDIT_AND_IMPLEMENTATION.md).

> Upgrading an existing demo database: run **Settings → Restore Realistic Demo Data** once so the two seeded guardians are marked as accepted and the mock payment history is created.

### Phase 7: Landing, Login, Web/App Mode, One-tap Golden Hour
Open `http://127.0.0.1:5173` → landing page → **Sign in** (demo accounts Rajesh `+91 98765 43210` or Aarav `+91 98101 23456`, passcode `1234`). Use the **Web / App** toggle in the header to switch between the dashboard and the mobile payment-app experience. In Golden Hour, one button activates the complaint to the cyber crime cell, the bank lien request and the cyber police intimation — **simulated and clearly labelled in this demo**. Pitch narrative: [STORY.md](STORY.md).

### Future Roadmap:
- Direct integration with DigiLocker for Aadhaar/PAN complaint attachment authentication.
- Live integration with NPCI UPI API sandbox for real-time VPA verification.
- Multilingual voice synthesis (Bhashini API) for elderly citizens in 12 Indian languages.
