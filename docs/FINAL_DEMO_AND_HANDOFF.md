# SATARK SAATHI — FINAL DEMONSTRATION & HANDOFF GUIDE

> **Stop. Verify. Stay Safe.**
> *AI-Assisted Digital Scam Prevention, Family Protection & Golden Hour Fraud Recovery for Indian Families*

---

## 1. Project Purpose & Architecture Overview

### 1.1 Mission

Satark Saathi (सतर्क साथी) protects citizens—especially seniors, students, and first-time digital payment users—against high-impact digital extortion, impersonation fraud, and social engineering in India.

### 1.2 Core Workflows

1. **Forensic Multi-Modal Risk Analysis**: Evaluates suspicious text, URLs, screenshots (OCR), and voice notes (Whisper) with explainable signal attribution.
2. **Family Shield Network**: Informs designated family guardians via live real-time WebSockets with audible chime synthesis upon detecting acute scam threats.
3. **Pre-Transaction Payment Checkpoint**: An interactive sandbox simulation analyzing coercion factors (urgency, authority, secrecy) before money is transferred.
4. **Golden Hour Fraud Recovery Desk**: 4-step wizard generating formal, audit-compliant complaint dossiers (1930 Cybercrime Portal, RBI Banking Dispute under Limited Liability circulars, Police FIR).
5. **Incident History & Audit Ledger**: Direct SQLite/PostgreSQL-backed search, dynamic relationship authorization, and exportable JSON audit trails.

### 1.3 Technology Stack

- **Backend**: FastAPI 0.115, Pydantic 2, SQLAlchemy 2, PyJWT, Cryptography.
- **Frontend**: React 19, TypeScript, Vite 8, Tailwind CSS, Lucide icons.
- **AI & Forensics**: Satark Context-Aware Deterministic Rule Engine, optional IBM watsonx.ai Granite 13B bridge, local offline Whisper ASR, and Tesseract OCR engine.
- **Real-Time Layer**: Channel-isolated WebSocket broadcaster (`AlertBroadcaster`).

---

## 2. Prerequisites & Local Environment Setup

### 2.1 System Requirements

- **Python**: 3.10+ (Verified on Python 3.14.0)
- **Node.js**: 18+ and `npm`
- **Tesseract OCR (Optional)**: `tesseract-ocr` binary for screenshot text extraction. When absent, the application gracefully degrades to manual text input.
- **FFmpeg (Optional)**: Required for local Whisper audio speech-to-text. When absent, the application prompts manual transcript entry without claiming false safety.

### 2.2 Environment Configuration

Copy `.env.example` to `backend/.env` (or configure system environment variables):

```env
APP_NAME="Satark Saathi API"
APP_ENV="development"
DEBUG=false
PORT=8000
HOST="0.0.0.0"
DATABASE_URL="sqlite:///./satark_saathi.db"
CORS_ORIGINS="http://localhost:5173,http://localhost:3000,http://127.0.0.1:5173"

# Authentication Configuration
JWT_SECRET_KEY="satark_saathi_dev_secret_key_change_in_production_min32chars"
JWT_ALGORITHM="HS256"
JWT_ACCESS_TOKEN_EXPIRE_MINUTES=120
JWT_ISSUER="satark-saathi-auth"
JWT_AUDIENCE="satark-saathi-app"
ALLOW_DEMO_HEADER_AUTH=true

# AI Engine (Default is deterministic rule engine)
ANALYSIS_PROVIDER="rule_based"
WATSONX_APIKEY=""
WATSONX_PROJECT_ID=""

# Telecom Gateway (Default is simulated in-app delivery)
SMS_PROVIDER="simulated"
ENABLE_DEMO_SEED=true
```

---

## 3. How to Run the Application

### 3.1 Terminal 1 — FastAPI Backend

```powershell
# From repository root
python -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8000 --reload
```

- API Endpoint: `http://127.0.0.1:8000`
- Interactive OpenAPI / Swagger Docs: `http://127.0.0.1:8000/docs`

### 3.2 Terminal 2 — React Frontend

```powershell
cd frontend
npm run dev -- --host 127.0.0.1 --port 5173
```

- Web Application: `http://127.0.0.1:5173`

---

## 4. Authentication & Demonstration Personas

### 4.1 Demonstration Personas

The application comes pre-seeded with two connected demonstration personas:

1. **Rajesh Sharma (ID: 1)**
   - Role: `PROTECTED_MEMBER` (Primary user / Father)
   - Phone: `+91 98765 43210`
   - Default Passcode: `1234`
2. **Aarav Sharma (ID: 2)**
   - Role: `GUARDIAN` (Trusted family member / Son)
   - Phone: `+91 98101 23456`
   - Default Passcode: `1234`

### 4.2 Authentication Workflow

- **Development/Staging Mode:** Header persona switcher toggles between Rajesh and Aarav. In development, the system issues cryptographically signed JWT tokens or falls back to demo persona IDs for automated tests.
- **Production Mode:** Demo header authentication (`X-User-Id`) is **strictly rejected with HTTP 401**. Users must authenticate via `POST /api/auth/login` to obtain a signed Bearer token.
- **Client Token Storage:** All tokens are maintained in tab-scoped `sessionStorage` (never in persistent `localStorage`) to protect credentials from terminal theft.

---

## 5. Suggested 5-Minute End-to-End Demonstration Script

### Step 1: System Health & Presenter Deck (0:00 - 1:00)

1. Open `http://127.0.0.1:5173`.
2. Click **Presenter Deck** in the top navigation bar.
3. Review **System Health**: Backend online, SQLite connected, live WebSockets active.
4. Show the **Benchmark Evaluation** tab: Run the benchmark suite and review precision (100%), recall (93.3%), and latency (~2ms).

### Step 2: Multi-Modal Threat Detection (1:00 - 2:00)

1. Navigate to **Scam Analyzer** (`/scanner`).
2. **Text Analysis**: Select preset *"Digital Arrest / CBI Impersonation"*. Click **Run Forensic Analysis**.
   - Show the **CRITICAL RISK (99/100)** score.
   - Point out detected signals: *Authority Impersonation*, *Digital Arrest Demand*, *Secrecy Coercion*.
   - Point out exact verbatim evidence excerpts and immediate protective steps.
3. **URL Analysis**: Enter `http://sbi-kyc-update.xyz/login`. Observe the domain impersonation warning and offline safety check.
4. **Devanagari / Hinglish**: Enter native Hindi or Hinglish threats (*"CBI se officer bol raha hu, aapka digital arrest warrant nikla hai"*). Show accurate transliteration detection.

### Step 3: Family Shield Emergency Notification (2:00 - 3:00)

1. In the high-risk analysis result card, click **Alert Family Shield Guardians**.
2. Confirm the alert dialog.
3. Observe the live in-app emergency alert banner at the top of the browser with synthesized audio alert chime and Incident ID (`SA-XXXXXX`).
4. Switch persona in the header to **Aarav Sharma (Son / Guardian)**.
5. Click **Acknowledge Alert** and show delivery audit tracking.

### Step 4: Payment Checkpoint Pre-Transaction Sandbox (3:00 - 4:00)

1. Navigate to **Payment Checkpoint** (`/payment-checkpoint`).
2. Point out the bold **SIMULATION ONLY** banner.
3. Enter amount `₹25,000`, recipient `cbi.clearing@sbi`, check **Authority Claimed** and **Secrecy Demanded**.
4. Click **Run Sandbox Risk Assessment**.
5. Show the resulting **SEEK_TRUSTED_HELP** risk tier with verification protocol.
6. Click **Open Golden Hour Recovery Dossier →** to escalate directly.

### Step 5: Golden Hour Recovery & Incident History (4:00 - 5:00)

1. Walk through the 4-step Recovery Wizard.
2. Step 4 displays 3 generated complaint drafts:
   - **National Cybercrime Reporting Portal (1930 / cybercrime.gov.in)**.
   - **Bank Dispute Letter** citing RBI Zero/Limited Liability framework.
   - **Cyber Police FIR Draft** citing IT Act Section 66D.
3. Point out that missing transaction references are faithfully preserved as `[UTR / TRANSACTION REF NOT SUPPLIED - PENDING BANK STATEMENT]`.
4. Navigate to **Incident History** (`/incident-history`).
5. Open the details drawer to view the unified incident record, recovery status, and exportable JSON audit trail.

---

## 6. Transparent Simulation Boundaries & Disclaimers

Satark Saathi maintains complete integrity regarding external capabilities:

- **Payment Sandbox:** All payment assessments are simulations. No money is moved, held, or debited.
- **Bank Freeze Simulation:** The *"Simulate Bank Freeze"* action prototypes the CFCFRMS / NPCI workflow and assigns a sandbox reference token (`BF-STAT-SIM-...`). No actual interbank lien is applied. Users are instructed to call 1930 and their bank nodal officer.
- **Cybercrime Portal Submission:** The 1-click filing rehearsal generates an acknowledgement token (`MHA-1930-SIM-...`) for training. Dossiers are not automatically transmitted to police servers; citizens must submit formally at `cybercrime.gov.in`.

---

## 7. Known Limitations & Production Deployment Requirements

### 7.1 Current System Limitations

1. **Single-Node WebSockets:** Alert broadcasting operates in-process via Python `asyncio`. It is single-instance capable; multi-worker horizontal scaling requires Redis Pub/Sub.
2. **Local Machine OCR/Whisper Dependencies:** If Tesseract or FFmpeg are not installed on the host machine, image and voice analysis gracefully fall back to manual text input.
3. **Consent Model:** Consent is unilateral (primary user grants permission to share incidents with their contact). Bilateral cryptographic key-exchange is reserved for future phases.

### 7.2 Requirements for Real-World Production Deployment

To deploy Satark Saathi in an internet-facing production environment:

1. Set `APP_ENV="production"` in `backend/.env`.
2. Generate a secure, unique `JWT_SECRET_KEY` ($\ge$ 32 characters, e.g. `openssl rand -hex 32`).
3. Set `ALLOW_DEMO_HEADER_AUTH=false` (server will terminate startup if left true).
4. Restrict `CORS_ORIGINS` to trusted, production HTTPS domain origins.
5. Deploy behind a reverse proxy (e.g. Nginx, Cloudflare) terminating TLS/HTTPS.
6. Migrate `DATABASE_URL` to a managed PostgreSQL cluster with regular automated backups.
7. Integrate a production SMS/telecom gateway (Twilio, Fast2SMS) for real guardian SMS delivery.
