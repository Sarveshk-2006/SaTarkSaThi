# SATARK SAATHI — PHASE 3 IMPLEMENTATION PLAN
## End-to-End Journey Integration, State Consistency & Demo Readiness

**Author:** Antigravity Senior Architecture & QA Team
**Baseline:** Phase 2.1 Independent Evaluation Audit
**Status:** Approved for Implementation Planning (No Phase 3 code applied in this phase)
**Target Event:** IBM Grand Finale Live Demonstration

---

## 1. Executive Summary & Audit Baseline

During the Phase 2.1 evaluation audit, the scam risk intelligence engine was subjected to an independent, frozen challenge dataset ($N=35$). The results verified that while the engine achieves **100% Precision (0% False Positive Rate)** across real-world legitimate and ambiguous institutional communications, its out-of-distribution detection recall on novel, un-templated coercion and social engineering is **38.9% (68.6% binary accuracy, 61.1% false negative rate)**.

Furthermore, a comprehensive code audit across all 6 product modules revealed critical architectural gaps:
1. **Disconnected Persistence**: Scam Scanner persists records to `ScamAnalysis`, whereas Incident History queries `Incident`. Scanned threats never appear in Incident History unless manually recreated in the Golden Hour recovery wizard.
2. **Volatile In-Memory Flow**: Multi-step handoffs (Scanner $\rightarrow$ Golden Hour, Payment Checkpoint $\rightarrow$ Golden Hour) rely entirely on React Router's volatile `location.state`, causing complete state loss upon browser refresh.
3. **Ghost Incident IDs**: Family Shield alerts dispatched from Scam Scanner transmit ephemeral UUIDs that do not exist in the `incidents` table, causing 404 errors when guardians click "View Incident".
4. **Unsupported Production Claims**: Backend recovery endpoints use misleading labels such as `"Bank of Baroda Production Gateway"` and `"National Portal e-Filing Registered"` without clear simulation badges.

This document outlines the focused, surgical engineering roadmap for Phase 3. **No broad rewrites** will be conducted. Every change is targeted to ensure a seamless, stateful, and bulletproof 2-device live demo.

---

## 2. Journey-by-Journey Implementation Matrix

| Journey | Module | Verified Working Behavior | Simulated / Incomplete Behavior | Priority | Target Files |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **J1: Scam Intelligence & Forensic Scan** | Scam Scanner (`/scanner`) | Text, URL, OCR, audio transcript analysis; heuristic tactic breakdown; confidence attribution; fallback to rule-based engine. | Analyses saved to `scam_analyses` table instead of `incidents`. Recent scans list lost on refresh. Scanned threat not linked to Family Shield alerts. | **P0** | `backend/app/routers/analyze_v1.py`<br>`frontend/src/pages/ScannerPage.tsx` |
| **J2: Coercion & Fraud Defense Checkpoint** | Payment Checkpoint (`/payment-checkpoint`) | Sandbox behavioral coercion assessment (pressure, secrecy, authority, returns); VPA heuristic flags; dynamic verification checklist. | Scoring uses ad-hoc logic disconnected from `risk_engine.py`. Handoff to Golden Hour carries no DB-persisted incident token. | **P1** | `backend/app/routers/payment.py`<br>`frontend/src/pages/PaymentCheckpointPage.tsx` |
| **J3: Family Shield & Live Guardian Alerting** | Family Shield (`/family-shield`) | Per-user authorized alert filtering (`user_id`); isolated WebSocket broadcast channels; contact CRUD; acknowledgement flow. | Consent defaulted to `true` on creation. Dispatching from Scanner links non-existent incident ID. Carrier DLT dispatch is simulated without clear UI badge. | **P0** | `backend/app/routers/alerts.py`<br>`frontend/src/pages/FamilyShieldPage.tsx` |
| **J4: Golden Hour Incident Recovery** | Golden Hour Recovery (`/golden-hour`) | 4-step wizard; structured complaint generation (Cybercrime 1930, Bank Nodal, Police FIR); missing UTR handling; text/markdown export. | State wiped on browser refresh. Misleading "Production Gateway" claims in freeze receipt. No incident selector dropdown for unlinked navigation. | **P0** | `backend/app/routers/recovery.py`<br>`frontend/src/pages/GoldenHourRecoveryPage.tsx` |
| **J5: Incident History & Digital Evidence Ledger** | Incident History (`/incidents`) | DB queries with search, type, and risk filters; detail drawer; audit trail export; delete operations. | Scans from `/scanner` and simulations from `/payment-checkpoint` do not appear. Guardian cross-user query logic hardcoded to user ID 2. | **P0** | `backend/app/routers/incidents.py`<br>`frontend/src/pages/IncidentHistoryPage.tsx` |
| **J6: Presenter Control & Live Demo Rehearsal** | Presenter Modal & Demo Tools | 1-click deterministic scenario injection; DB reseed / wipe; latency ping; live evaluation metrics modal. | Scenario injection uses router state without ensuring target component state persists if user navigates away. | **P1** | `frontend/src/components/demo/PresenterControlModal.tsx`<br>`backend/app/routers/settings.py` |

---

## 3. Prioritized Engineering Sequence (P0 / P1 / P2)

### Priority P0: Critical Path & Data Flow Unification (Must-Have for Demo)
1. **Unify Threat Persistence (`Scanner` $\rightarrow$ `Incident`)**:
   - Update `analyze_v1.py` so that high/critical risk scans automatically create an `Incident` row in the database, linking `analysis_id` and generating an authoritative `incident_id` (e.g. `INC-2026-XXXX`).
   - Store the authoritative `incident_id` in the analysis response so Scanner, Family Shield, and Golden Hour share the exact same database entity.
2. **Prevent Refresh State Evaporation (URL / Session Hydration)**:
   - Update `GoldenHourRecoveryPage.tsx` to accept an optional `?incident_id=...` query parameter in addition to `location.state`.
   - On mount, if `incident_id` is present, fetch the incident details directly from `/api/v1/incidents/{incident_id}` to hydrate the form even after a hard refresh.
3. **Fix Family Shield Alert $\leftrightarrow$ Incident Binding**:
   - Ensure `dispatchAlert` in `ScannerPage` passes the verified, database-persisted `incident_id`.
   - In `FamilyShieldPage`, ensure clicking "View Incident" on a received live alert navigates to `/incidents?q={incident_id}` and opens the incident drawer directly.
4. **Clarify Simulation Boundaries & Remove False Production Claims**:
   - In `recovery.py`, update `submit_bank_freeze` and `submit_cybercrime_portal` responses to explicitly set `is_simulation: True` and label gateways as `"CFCFRMS / NPCI Standard Simulation Switch"`.
   - In `GoldenHourRecoveryPage.tsx`, render prominent amber badges: `[HACKATHON SIMULATION MODE - NO ACTUAL LIEN APPLIED]`.

### Priority P1: Architectural Alignment & Robustness
1. **Harmonize Payment Checkpoint Scoring**:
   - Refactor `backend/app/routers/payment.py` to leverage `backend/app/services/risk_policy.py` for policy tiering, ensuring consistent terminology across both modules.
   - Add an optional "Save as Incident" action in Payment Checkpoint when a high-coercion transaction is flagged.
2. **Consent & Verification Workflow in Family Shield**:
   - Set `consent_granted: False` by default for newly added trusted contacts.
   - Implement a simulated 1-click "Send Consent Verification Request" with mock OTP verification before activating the contact for automated alert dispatches.
3. **Incident History Dynamic Ownership Refactor**:
   - Replace hardcoded `current_user_id != 2` in `incidents.py` and `alerts.py` with relationship-driven authorization based on `TrustedContact` guardian links.

### Priority P2: Polish, Audio/Indic Refinements & Ledger Export
1. **Incident Audit Ledger Formal PDF/Printable Export**:
   - Provide formatted HTML/print preview for the Golden Hour recovery package and incident audit ledger.
2. **Enhanced Indic Language Keyword Hints**:
   - Include Hinglish and regional phrasing cues in the plain language summaries for common Indian cybercrime categories.

---

## 4. Module Modification Specifications

### Module 1: `backend/app/routers/analyze_v1.py` & `backend/app/routers/incidents.py`
- **Rationale**: Currently, `analyze_v1._persist_analysis` only writes to `ScamAnalysis`. It must also populate the `Incident` table so scans appear in Incident History and provide valid foreign keys for alerts and recovery dossiers.
- **Changes**:
  - In `_persist_analysis`: If `result.risk_level in ("HIGH", "CRITICAL")` or `result.policy_tier in ("AMBER", "RED")`, create an `Incident` record with matching `incident_id`, `title`, `description`, `scam_type`, and `risk_score`.
  - Add an API endpoint `GET /api/v1/incidents/{incident_id}` returning full incident details and linked analysis evidence.
- **Acceptance Criteria**:
  - Scanning a Digital Arrest message immediately results in a new record visible in `GET /api/v1/incidents`.
  - Deleting an incident cleanly handles or disassociates the corresponding analysis record.

### Module 2: `backend/app/routers/recovery.py` & `frontend/src/pages/GoldenHourRecoveryPage.tsx`
- **Rationale**: Prevent data loss when refreshing `/golden-hour` and correct misleading "Production Switch" claims.
- **Changes**:
  - `GoldenHourRecoveryPage.tsx`: Read `searchParams.get("incident_id")`. If present, fetch incident from backend and pre-fill Step 1 narrative, scam category, financial loss, and suspect contact.
  - `backend/app/routers/recovery.py`: Modify `submit_bank_freeze` and `submit_cybercrime_portal` response schemas to include `is_simulation: bool = True` and replace "Bank of Baroda Production Gateway" with "NPCI CFCFRMS Sandbox Simulation Switch".
- **Acceptance Criteria**:
  - Navigating to `/golden-hour?incident_id=INC-2026-001` and refreshing the page retains all incident fields and generated complaint drafts.
  - Freeze receipts display a clear `"SIMULATION / SANDBOX PROTOTYPE"` badge.

### Module 3: `backend/app/routers/alerts.py` & `frontend/src/pages/FamilyShieldPage.tsx`
- **Rationale**: Eliminate orphaned incident IDs in dispatched alerts and ensure explicit consent.
- **Changes**:
  - In `alerts.py`: Verify that `req.incident_id` matches an existing `Incident` record before assigning. If not found, create a placeholder incident record to preserve relational integrity.
  - In `FamilyShieldPage.tsx`: When adding a new contact, default `consent_granted` to `false` and display an interactive "Simulate OTP Verification" action.
  - Add an onClick handler to the alert item in `FamilyShieldPage` that navigates to `/incidents?q={incident_id}`.
- **Acceptance Criteria**:
  - Dispatched alert from Scanner links to an existing DB incident ID.
  - Recipient clicking the alert in Family Shield successfully navigates to the incident details without error.

---

## 5. Schema & Database Migration Implications

No destructive schema migrations are required. The SQLite database schema can be safely upgraded using backward-compatible column additions or table synchronization:

1. **`Incident` Model (`backend/app/models.py`)**:
   - Add optional foreign key: `analysis_id = Column(Integer, ForeignKey("scam_analyses.id"), nullable=True)`
   - Add index: `index=True` on `incident_id` for fast query lookup.
2. **`ScamAnalysis` Model (`backend/app/models.py`)**:
   - Add reverse relationship: `incident = orm_relationship("Incident", back_populates="scam_analysis", uselist=False)`
3. **Database Reset Script (`backend/app/routers/settings.py`)**:
   - Ensure `db.query(ScamAnalysis).delete()` and `db.query(Incident).delete()` execute in proper foreign key order.

---

## 6. Regression Testing & Acceptance Test Plan

| Test ID | Test Target | Procedure | Expected Outcome |
| :--- | :--- | :--- | :--- |
| **TEST-P3-01** | Scan to History Flow | 1. Analyze text via `/scanner`.<br>2. Confirm result is HIGH risk.<br>3. Navigate to `/incidents`. | Incident appears immediately in the table with matching score and verdict. |
| **TEST-P3-02** | Recovery Hydration on Reload | 1. Analyze threat in `/scanner`.<br>2. Click "Escalate to Golden Hour".<br>3. Hard refresh browser (F5) at Step 2. | All fields (loss, suspect, narrative) remain populated from the backend. |
| **TEST-P3-03** | 2-Device Alert Handoff | 1. Open Session 1 (Rajesh) and Session 2 (Aarav).<br>2. Rajesh scans threat and clicks "Dispatch Family Alert".<br>3. Aarav receives alert modal. | Aarav clicks "View Incident Dossier", drawer opens with full incident details. |
| **TEST-P3-04** | Simulation Disclaimer Visibility | 1. Complete Bank Freeze in Golden Hour.<br>2. Inspect UI receipt. | Header displays "NPCI Sandbox Simulation Mode" with no claims of live interbank lien. |
| **TEST-P3-05** | Frozen Challenge Baseline | Run frozen challenge runner (`run_challenge.py`). | Metrics remain preserved at 100% precision, 38.9% recall (no cheating/overfitting). |

---

## 7. Demo Rehearsal Script (IBM Grand Finale)

### Scene 1: The Trap (Scam Scanner - Rajesh Sharma / Senior Citizen)
1. **Action**: Open Satark Saathi on Laptop A (Rajesh Sharma, Protected Member).
2. **Action**: Open Presenter Modal ($\text{Ctrl}+\text{M}$ or header button) and click scenario: **"Digital Arrest / CBI Extortion"**.
3. **Action**: Click **"Analyze Communication"**.
4. **Demonstrate**: Heuristic breakdown reveals:
   - Authority Impersonation (CBI / Delhi HQ).
   - Artificial Urgency & Coercion (Arrest Warrant, 15 min deadline).
   - Isolation Demand ("Do not tell family or lawyer").
   - Result: **RED / HIGH RISK (Score: 92/100)**.
   - System recommends: **"Do not transfer funds. Involve Family Shield Guardian immediately."**

### Scene 2: The Shield (Family Shield Live WebSocket Broadcast - Aarav Sharma / Guardian)
1. **Action**: On Laptop A, click **"Dispatch Family Shield Alert"** to Aarav Sharma.
2. **Action**: Switch focus to Laptop B / Second Browser Window (Aarav Sharma, Trusted Guardian).
3. **Demonstrate**:
   - Instant Web Audio alert chime sounds.
   - Screen displays real-time high-priority modal: `"Critical Alert: Rajesh Sharma targeted by CBI Digital Arrest Scam"`.
   - Aarav clicks **"Review Incident Evidence"** $\rightarrow$ opens Incident History showing forensic evidence.

### Scene 3: The Checkpoint (Payment Checkpoint Sandbox)
1. **Action**: Demonstrate what happens if Rajesh attempts to pay ₹25,000 to `cbi.clearing@sbi`.
2. **Action**: In Payment Checkpoint, run the **"Coerced Authority Payment"** preset.
3. **Demonstrate**:
   - Checkpoint triggers friction intervention: **SEEK TRUSTED HELP**.
   - Highlights that Indian courts and police never settle criminal bonds via private UPI.
   - User clicks **"Escalate to Golden Hour Recovery"**.

### Scene 4: Golden Hour Recovery (Cybercrime 1930 & Banking Freeze)
1. **Action**: Golden Hour wizard loads with pre-filled case details (no data re-entry).
2. **Demonstrate**:
   - 4-step wizard generates tri-partite complaint dossiers:
     1. National Cyber Crime Reporting Portal (1930 format).
     2. Bank Nodal Officer Immediate Transaction Recall Letter.
     3. Police Cyber Crime Cell Formal FIR.
   - Missing UTR handling: clearly tags reference as pending bank statement.
   - 1-click simulated filing to 1930 portal and interbank lien request.
   - Highlight: Honest simulation disclaimers verifying no live funds were intercepted.

---
*End of Implementation Plan — Phase 3 readiness verified.*
