# Satark Saathi: Project Overview

## What this project is

Satark Saathi is a prototype for helping people in India recognize suspected
digital scams and respond more safely. It is aimed especially at seniors,
students, and people who are less experienced with digital payments.

It is a decision-support and demonstration app, not a bank, police service, or
guarantee that a scam will be detected or money recovered.

## What it does today

- **Scam analysis:** Reviews text and URLs, and has image/audio analysis paths
  for suspicious evidence.
- **Family Shield:** Lets a user add up to two trusted contacts and send in-app
  alerts. A contact receives anything only after the user grants consent **and**
  the contact accepts the invitation. Guardians can approve or decline risky
  payments. Telecom delivery is simulated.
- **Payment Checkpoint:** Scores a hypothetical payment with explained signals
  (coercion, recipient patterns, the user's mock payment history, call context)
  and offers an adaptive Safety Check-in in English, Hindi, Marathi and Kannada.
  It does not move, block, or intercept real money.
- **Mock UPI app:** A clearly labelled web demo of how a payment app could call a
  Satark safety SDK. It is not integrated with any real UPI app or bank.
- **Golden Hour recovery:** Helps prepare editable complaint and bank-dispute
  drafts, exportable as TXT or a structured PDF pack. It does not submit them to
  banks, police, or the national cybercrime portal.
- **Incident history:** Stores and displays app records and audit information.
- **Senior Mode and discreet safety phrase:** Larger, simpler interface; an
  opt-in secret phrase that quietly asks guardians to call.
- **Presenter tools:** Provides demo scenarios, health information, database
  reset, and a small benchmark.

See [FEATURE_GAP_AUDIT_AND_IMPLEMENTATION.md](FEATURE_GAP_AUDIT_AND_IMPLEMENTATION.md)
for what is real versus simulated.

## How it is built

- `backend/`: Python FastAPI API, SQLite/SQLAlchemy data layer, analysis and
  other services.
- `frontend/`: React + TypeScript web app built with Vite.
- `backend/app/routers/`: API endpoints; `services/`: application logic;
  `models.py` and `schemas*.py`: database and API data shapes.
- `frontend/src/pages/`: main screens; `components/` and `context/`: shared UI
  and app state.

For local development, run the backend on port `8000` and the Vite frontend on
port `5173` in separate terminals. The frontend proxies `/api` requests to the
backend. See the [README](../README.md#-prerequisites--quickstart) for commands.

## Important things to know before changing it

1. **Default analysis is rule-based.** IBM watsonx.ai is optional and requires
   credentials. Do not describe the default mode as live AI.
2. **Treat safety claims carefully.** The documented benchmark has 30 synthetic
   examples and measures the deterministic engine; it does not prove real-world
   accuracy or guarantee protection.
3. **Keep simulated actions clearly labeled.** Alerts are in-app simulations,
   payments are hypothetical, and recovery documents are drafts unless a real
   external integration is implemented.
4. **Preserve privacy and authorization.** Avoid logging secrets or unnecessary
   personal/evidence data, and keep ownership checks in place when changing API
   routes or records.
5. **Check both sides of a feature.** UI changes may need corresponding API,
   schema, database, and test updates. The Vite dev server sends `/api` to
   `127.0.0.1:8000`.
6. **Optional local tools may affect evidence analysis.** OCR/audio paths can
   depend on external tools such as Tesseract or FFmpeg; verify behavior when
   those tools are unavailable.
7. **Consent is enforced in the backend.** Use the helpers in
   `backend/app/services/family_guardian.py` instead of checking
   `consent_granted` alone. Never log or return check-in free text or the duress
   phrase.
8. **Calls are never auto-detected.** Keep call context explicit; see
   [PLATFORM_LIMITATIONS.md](PLATFORM_LIMITATIONS.md).
9. **Backend tests use a throwaway database** (set in `backend/conftest.py`),
   so they do not change your demo data.

Useful checks from the project root:

```powershell
python -m pytest backend/tests/ -v
cd frontend
npm test -- --run
npm run build
```

## Future direction in the project notes

The README lists these as roadmap ideas, not completed features:

- DigiLocker integration for complaint attachment authentication.
- NPCI UPI sandbox integration for VPA verification.
- Bhashini-powered multilingual voice support.

Before implementing any of these, confirm current API availability, consent and
privacy requirements, and whether the feature should remain a simulation or
connect to a real service.
