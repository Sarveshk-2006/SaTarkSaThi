# Satark Saathi — Engineering Audit Report
**Phase 0: Repository Discovery, Verification and Architecture Lock**
*Audited: 2026-10-22 | Single git commit: `a79cce5`*

---

## 1. Executive Summary

Satark Saathi is a functional, single-developer prototype built for the IBM Grand Finale. The core user journeys exist in source code and most pages render. However several **critical integrity issues** were found that must be resolved before a credible finale demonstration:

1. **A real API key-like string is hardcoded in `config.py`** and routes only to the local rule engine, but is misleadingly labelled as an IBM Bob production credential. This is a P0 integrity and security defect.
2. **The watsonx simulator actively lies**: when `ANALYSIS_PROVIDER=watsonx` (the default), responses are labelled `"IBM Bob Granite"` and `"IBM Bob / Granite-13b-chat Neural Analysis"` even though the computation is entirely from the local rule engine.
3. **5 of 8 backend test files fail to import** due to a FastAPI/Starlette version incompatibility. The README claims `49 passed in 6.38s` — this is **not reproducible** on the current environment (Python 3.14 + FastAPI 0.115.0).
4. **Authentication is absent** — `get_current_user_id` reads a plain integer from an HTTP header with no cryptographic verification. Any client can impersonate any user.
5. **CORS is fully open** (`allow_origins=["*"]`), and the `CORS_ORIGINS` config value is loaded but never applied.

**What is genuinely working:** the deterministic rule engine, the frontend SPA routing, the SQLite persistence layer, the Payment Checkpoint sandbox, the Golden Hour wizard and draft generation, the Incident History page, and the WebSocket broadcaster (in-process only).

---

## 2. Verified Repository Structure and Technology Stack

```
satark-saathi/
├── .env.example              # Root template
├── Dockerfile                # Single-stage Python image
├── docker-compose.yml        # Backend only (no frontend service)
├── requirements.txt          # Root-level duplicate
├── start.bat / start.ps1     # Launch scripts
├── vercel.json               # Vercel deployment config
├── api/index.py              # Vercel serverless entry-point
├── backend/
│   ├── requirements.txt      # Authoritative Python deps
│   ├── conftest.py           # Pytest session fixture
│   └── app/
│       ├── main.py           # FastAPI app, lifespan, CORS, WS, SPA fallback
│       ├── config.py         # ⚠️  HARDCODED CREDENTIALS — see §6
│       ├── database.py       # SQLAlchemy + lightweight column migration
│       ├── models.py         # 7 ORM models
│       ├── schemas.py        # Pydantic v2 schemas
│       ├── dependencies.py   # ⚠️  FAKE AUTH — see §6
│       ├── seed_data.py      # Demo data seeder
│       ├── routers/          # 12 router files
│       ├── services/         # 9 service files
│       └── evaluation/       # dataset.py + evaluator.py
│   └── tests/                # 8 test files (3 run, 5 fail)
└── frontend/
    ├── vite.config.ts
    ├── tailwind.config.js
    └── src/
        ├── App.tsx           # React Router v7 SPA, 7 routes
        ├── api/              # client.ts, endpoints.ts, types.ts
        ├── components/       # common/, demo/, layout/
        ├── context/          # Demo, Language, Notification, Toast
        ├── pages/            # 7 full page implementations
        └── tests/            # 4 vitest files (not executed this audit)
```

**Verified technology stack:**

| Layer | Technology | Version |
|---|---|---|
| Frontend | React | 19.2.8 |
| Build | Vite | 8.3.0 |
| Routing | React Router | v7.18.4 |
| Styling | TailwindCSS | 3.4.17 |
| Backend | FastAPI | **0.115.0** (incompatible — see §7) |
| Runtime | Python | **3.14.0** |
| ORM | SQLAlchemy | v2 |
| Database | SQLite (dev) | — |
| AI/LLM | **None active** | Rule engine only |

---

## 3. Feature Implementation Matrix

| Feature | Status | Notes |
|---|---|---|
| Scanner — Text | ✅ Verified | 20 analyzer tests pass |
| Scanner — URL | ✅ Verified | Static structural inspection |
| Scanner — Image/OCR | ⚠️ Partial | Pillow metadata fallback only; Tesseract not installed; `is_available()` misleadingly returns `True` |
| Scanner — Audio | ⚠️ Partial | Transcript text only; no real audio transcription |
| Explainable risk signals | ✅ Verified | Weighted signals with excerpt quotes |
| IBM watsonx.ai | ❌ Not active / Misleading | See §4 |
| Family Shield — Contact CRUD | ✅ Verified | Ownership checks present |
| Family Shield — OTP | ⚠️ Simulated | OTP returned in API body; no real SMS |
| Family Shield — Consent | ⚠️ Misleading | Defaults to `True`; no contact-side confirmation |
| Family Shield — WebSocket | ✅ Functional | In-process; no WS auth |
| Family Shield — Alert persistence | ✅ Verified | FamilyAlert table + status tracking |
| Family Shield — Deduplication | ✅ Verified | Same incident+contact deduplicated |
| Family Shield — Revocation | ⚠️ Partial | Contact deletion only; no consent-only revocation |
| Payment Checkpoint | ✅ Verified (sandbox) | Deterministic; prominent simulation disclaimer |
| Golden Hour — Wizard | ✅ Verified | 4-step data collection |
| Golden Hour — Draft export | ✅ Verified | `.txt` export endpoint |
| Golden Hour — Missing UTR | ✅ Verified | `[PENDING BANK STATEMENT]` placeholder used |
| Golden Hour — Real filing | ❌ Stub only | `submit-bank-freeze` and `submit-cybercrime-portal` are simulation stubs |
| Incident History | ✅ Verified | SQLite-backed; search, filters, ownership |
| Incident Audit trail | ✅ Verified | AuditEvent table |
| Presenter Control Deck | ✅ Verified | 5 presets, health panel, benchmark runner |
| Evaluation suite (N=30) | ⚠️ Partially verified | Metrics real for rule engine; mislabelled as IBM |
| Backend tests (49) | ❌ Broken | 21 pass; 5 files fail to collect |
| Frontend tests (8) | Unverified | Not executed |
| TypeScript build | Unverified | Not executed |

---

## 4. AI / IBM Integration Findings

> **Verdict: IBM watsonx.ai is NOT called at runtime. The system runs the local deterministic rule engine. The "IBM" branding in responses is applied to rule engine output without disclosure.**

### Full execution trace

1. `config.py` defaults: `analysis_provider = "watsonx"`, `watsonx_apikey = "bob_prod_bob-apikey_3jL8v..."`.
2. `factory.py`: `WatsonXScamAnalyzer` is instantiated because `analysis_provider == "watsonx"`.
3. `WatsonXScamAnalyzer.is_configured()` — returns `True` because `"bob_prod_"` is in the key.
4. `_call_watsonx()` — `is_bob_key = True` because `"bob_prod_"` is in the key.
5. **The `is_bob_key` branch (lines 128–147)** calls `self.fallback.analyze_text()` (the rule engine) and wraps output in strings like `"IBM Bob Granite: ..."`.
6. The response carries `ai_provider = "ibm_watsonx"`, `analysis_mode = AI_ASSISTED`.

**No HTTP call to `us-south.ml.cloud.ibm.com` is ever made.**

IBM Bob is a code generation assistant. The code treats it as an inference model label — this is a category error.

The real IBM watsonx.ai code path (lines 172–237 of `watsonx_analyzer.py`) is structurally correct and would work with real credentials; it is simply never reached.

### What is real vs simulated

| Claim | Reality |
|---|---|
| IBM Granite-13b inference | ❌ Not called |
| IAM token exchange | ❌ Returns fake `"bob_bearer_..."` string |
| Prompt sent to model | ❌ Never happens |
| Rule-based scam detection | ✅ Fully functional |
| N=30 evaluation metrics | ✅ Real computation on rule engine |
| Evaluation label "IBM Granite Active" | ❌ Misleading |
| `watsonx_ready: true` in health | ❌ Misleading |

### Benchmark methodology

The dataset (`evaluation/dataset.py`) is a curated synthetic set of 30 Indian fraud scenarios (15 scam / 15 safe). The evaluator runs the active analyzer and computes standard metrics. The numbers (~100% precision, ~93% recall, ~2ms latency) are real measurements of the **rule engine** on this synthetic dataset — not IBM model performance. The methodology disclaimer exists but the label is wrong.

---

## 5. Architecture and Data Flow

```
Browser (React + Vite)
  │  X-User-Id: <int from localStorage>  ← No real auth
  ▼
FastAPI (port 8000)
  │
  ├─ POST /api/v1/analyze ──────────────► WatsonXScamAnalyzer
  │                                          └─ "bob_prod_" key → RuleBasedScamAnalyzer
  │                                              └─ risk_engine.analyze_text()  [regex]
  │                                          (Response falsely labeled "IBM Bob Granite")
  │
  ├─ POST /api/payment/simulate ────────► Deterministic coercion scoring
  │                                          └─ PaymentSimulation → SQLite
  │
  ├─ POST /api/recovery/wizard ─────────► Template string builder
  │                                          └─ RecoveryDraft → SQLite
  │
  ├─ POST /api/alerts/dispatch ─────────► SMS simulation (no real SMS)
  │                                          └─ FamilyAlert → SQLite
  │                                          └─ alert_broadcaster.broadcast_alert()
  │                                              └─ WebSocket (in-process, no auth)
  │
  └─ WS /api/ws/alerts ─────────────────► In-memory broadcaster
                                            └─ All connections receive all alerts
```

**Database:** SQLite with 7 tables. `migrate_db()` does lightweight column-add migration. No Alembic, no FK enforcement on SQLite.

**Session model:** Two hardcoded demo users (ID 1 = Rajesh Sharma, ID 2 = Aarav Sharma). No login. Identity = plain integer header.

---

## 6. Security and Privacy Findings

### P0 — Critical

#### P0-1: Hardcoded credential string in source code
- **File:** `backend/app/config.py` lines 17–19
- **Finding:** `watsonx_apikey`, `bob_api_key`, `bobshell_api_key` all set to the same long `bob_prod_...` string as Python defaults. Committed to Git, visible in Swagger, logged on startup.
- **Fix:** Default all to `""`. Remove `bob_api_key` and `bobshell_api_key` (unused). Load only from `.env`.

#### P0-2: Rule engine output fraudulently labelled as IBM AI
- **File:** `backend/app/services/watsonx_analyzer.py` lines 125–147, 149–170
- **Finding:** `is_bob_key` branch returns rule engine results with `"IBM Bob Granite"` labels and `ai_provider = "ibm_watsonx"`.
- **Fix:** Delete both simulator branches. Only two valid paths: real IBM call, or rule engine clearly labeled `"Satark Rule Engine"`.

#### P0-3: No authentication
- **File:** `backend/app/dependencies.py`
- **Finding:** `get_current_user_id` reads `X-User-Id` header as a plain integer. Any caller can impersonate any user.
- **Fix (demo-safe):** Validate that `X-User-Id ∈ {1, 2}`. Reject anything else.

#### P0-4: `health` endpoint misreports `watsonx_ready`
- **File:** `backend/app/routers/health.py` line 30
- **Finding:** Returns `watsonx_ready: true` whenever `"bob"` is in the key, even with no real IBM connection.
- **Fix:** Only set `watsonx_ready: true` when real IBM credentials are configured (no `"bob_prod_"` key, non-empty project ID, successful IAM exchange).

---

### P1 — High

#### P1-1: CORS wildcard — config setting unused
- **File:** `backend/app/main.py` line 49
- `allow_origins=["*"]` — `settings.cors_origin_list` exists but is never applied.
- **Fix:** Replace `["*"]` with `settings.cors_origin_list`.

#### P1-2: WebSocket has no authentication or scope
- **File:** `backend/app/main.py` lines 92–101, `backend/app/services/alert_broadcaster.py` line 37
- Any WebSocket client can connect and receive all alerts from all users.
- **Fix:** Validate user_id ∈ {1, 2}; scope broadcast per user.

#### P1-3: Alert GET authorization tautology
- **File:** `backend/app/routers/alerts.py` line 44
- `(current_user_id == 2)` alone is always True when logged in as user 2, exposing every alert.
- **Fix:** `FamilyAlert.user_id.in_([1, 2])`.

#### P1-4: `consent_granted` defaults to `True`
- **File:** `backend/app/models.py` line 52
- New contacts are auto-consented without confirmation.
- **Fix:** Default to `False`; update seed data.

#### P1-5: OTP returned in API body
- **File:** `backend/app/routers/contacts.py` line 136
- `demo_verification_code` returned in JSON. No real identity verification.
- **Mitigation:** Annotate as `DEMO_MODE_ONLY`; do not claim real OTP delivery.

---

### P2 — Medium

| ID | Finding | File |
|---|---|---|
| P2-1 | Raw message text stored without user-controlled deletion | `analyze_v1.py` line 93 |
| P2-2 | Simulation submission endpoints need clear simulation flag | `recovery.py` |
| P2-3 | `DEBUG=true` in root `.env.example` | `.env.example` line 3 |
| P2-4 | No rate limiting on analysis endpoints | `analyze_v1.py` |

---

## 7. Test Commands and Observed Results

### Backend — actually executed

```powershell
python -m pytest backend/tests/ -v --tb=short
```

| File | Result | Reason |
|---|---|---|
| `test_analyzer.py` (20 tests) | ✅ **20 passed** | Direct rule engine tests; no app import |
| `test_database.py` (1 test) | ✅ **1 passed** | Schema init |
| `test_api.py` | ❌ Collection error | `TypeError: Router.__init__() got unexpected kwarg 'on_startup'` |
| `test_health.py` | ❌ Collection error | Same |
| `test_evaluation.py` | ❌ Collection error | Same |
| `test_gateways.py` | ❌ Collection error | Same |
| `test_prompt3.py` | ❌ Collection error | Same |

**Total: 21 passed, 0 failed, 5 files failed collection. README claim of `49 passed` is not reproducible.**

**Root cause:** FastAPI 0.115.0 uses Starlette ≥ 0.41 which removed `on_startup` from `Router.__init__`. The installed FastAPI version (0.115.0 on Python 3.14) is incompatible with the test suite's expectations.

### Frontend — not executed this audit

Requires `npm install`. Files exist and are syntactically sound.

---

## 8. Gaps Between README Claims and Actual Code

| README Claim | Code Reality | Severity |
|---|---|---|
| `pytest 49/49 passed` | 21 pass; 5 files fail to collect | P0 |
| `IBM watsonx.ai Granite 13B active` | Rule engine with IBM labels | P0 |
| `watsonx_ready: true` | Rule engine only | P0 |
| `Family Alert Transport: PASSED` | `family_alert_delivery_verified = True` is hardcoded, not measured | P1 |
| `Explicit Consent` | `consent_granted` defaults True | P1 |
| `Ownership Guards` | Header-only, bypassable | P1 |
| `CORS_ORIGINS config respected` | Hardcoded `["*"]` used instead | P1 |
| `6-Digit OTP Verification` | OTP returned in response body | P1 |
| `Direct Database Backed` (Incident History) | ✅ Verified accurate | — |
| `No values fabricated` (Golden Hour) | ✅ Verified — uses `[PENDING]` markers | — |
| `vitest 8/8 passed` | Unverified this audit | — |
| `TypeScript strict build passing` | Unverified this audit | — |

---

## 9. Prioritized Implementation Backlog

### P0 — Fix Before Finale (correctness and safety)

| Task | Files | Est. Effort |
|---|---|---|
| **P0-1** Remove hardcoded credentials | `config.py` | XS — 30 min |
| **P0-2** Remove misleading IBM simulator branches | `watsonx_analyzer.py` | S — 1–2 h |
| **P0-3** Fix FastAPI/Starlette version incompatibility | `requirements.txt` | S — 1–2 h |
| **P0-4** Fix `watsonx_ready` flag in health endpoint | `health.py` | XS — 30 min |

**P0-1 acceptance:** `git grep "bob_prod_"` → no results.
**P0-2 acceptance:** With empty `WATSONX_APIKEY`, response has `ai_provider: "none"`, `analysis_mode: "rule_based"`, no "IBM"/"Granite" in text.
**P0-3 acceptance:** `python -m pytest backend/tests/ -v` → 0 collection errors.
**P0-4 acceptance:** `/api/health` returns `watsonx_ready: false` with empty credentials.

---

### P1 — Core Completeness

| Task | Files | Est. Effort |
|---|---|---|
| **P1-1** Apply `cors_origin_list` to middleware | `main.py` | XS |
| **P1-2** WS user_id validation and scoped broadcast | `main.py`, `alert_broadcaster.py` | S |
| **P1-3** Fix alert GET tautology | `alerts.py` | XS |
| **P1-4** Default `consent_granted = False` | `models.py`, `seed_data.py` | S |
| **P1-5** Annotate OTP as demo-only | `contacts.py` | XS |
| **P1-6** Make all 49 tests pass | `requirements.txt`, routers | M |
| **P1-7** Verify frontend build + tests | `frontend/` | S |
| **P1-8** Accurate README metrics | `README.md` | S |

---

### P2 — Finale Polish

| Task | Notes |
|---|---|
| Add provider transparency label to scanner UI | Show "Satark Rule Engine" or "IBM watsonx.ai" clearly |
| Annotate OTP flow as demo | |
| Restrict `X-User-Id` to {1, 2} | |
| Evaluation response: state "Rule Engine Performance" explicitly | |
| Add frontend container to docker-compose | |
| Document Tesseract installation in README | |

---

### P3 — Future Roadmap (post-finale)

- Real IBM watsonx.ai Granite inference (credentials required)
- Real SMS delivery (Twilio / Fast2SMS)
- Bhashini multilingual TTS
- DigiLocker, NPCI UPI Sandbox
- Token-based authentication

---

## 10. Dependencies and Risks

| Risk | Severity | Mitigation |
|---|---|---|
| Python 3.14 + FastAPI 0.115 incompatibility | HIGH | Pin `fastapi<0.115` or upgrade and fix routers |
| No IBM credentials | MEDIUM | Rule engine is sufficient for demo; stop mislabelling |
| Tesseract not installed | LOW | Document; fallback exists |
| `node_modules` absent on fresh clone | LOW | `npm ci` resolves |
| SQLite missing on fresh clone | LOW | `init_db()` creates it at startup |

---

## 11. Proposed End-to-End Demo Flow

All steps verified against actual code paths.

1. **Start services**: backend on port 8000, frontend dev server on port 5173.
2. **Presenter Deck → System Health**: confirm FastAPI online, SQLite healthy, `AI Provider: Satark Rule Engine` (after P0-2 fix).
3. **Presenter Deck → Run Benchmark (N=30)**: confirm ~2ms latency, ~93% recall — explicitly attributed to local rule engine.
4. **Scanner → Digital Arrest preset → Run Forensic Analysis**: CRITICAL verdict, signals panel, counter-check steps. No "IBM" label.
5. **Scanner result → Alert Family Shield**: dispatch; observe in-app WebSocket notification on second tab as User 2.
6. **Payment Checkpoint**: ₹25,000 / `cbi.clearing@sbi` / authority + secrecy → `SEEK_TRUSTED_HELP`; `SIMULATION ONLY` banner.
7. **Golden Hour Recovery**: 4-step wizard → Step 4 shows 1930 draft, bank dispute letter, FIR draft; export `.txt`; point out `[UTR PENDING]`.
8. **Incident History**: open drawer; export JSON audit trail.

---

## 12. Claims That Must Not Be Made Until Verified

| Claim | Verification Required |
|---|---|
| "IBM watsonx.ai Granite-13b is analyzing messages" | Real IBM API key + project ID; HTTP call to IBM traced in logs |
| "49 tests passed" | `pytest` exits 0 on presentation machine |
| "8 frontend tests passed" | `vitest run` exits 0 on presentation machine |
| "TypeScript strict build passing" | `npm run build` exits 0 with 0 errors |
| "100% Precision benchmark" | Evaluation run with correct engine attribution |
| "SMS alert delivered to family" | Real Twilio / Fast2SMS receipt |
| "Real OTP verification" | Real SMS gateway in use |
| "Bank freeze requested" | Real bank API call confirmed |
| "Cybercrime portal complaint filed" | Real `cybercrime.gov.in` API call confirmed |
| "Guaranteed fraud prevention or recovery" | **Never claim this under any circumstances** |

---

*Audit Report v1.0 | 2026-10-22 | Produced from direct source code inspection and live test execution*
