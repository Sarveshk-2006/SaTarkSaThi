# SATARK SAATHI — PHASE 4.7 AUDIT REPORT
## Evaluation Integrity, Risk Communication & Staging Safety Audit

**Date:** October 23, 2026
**Repository:** `d:\SatarkSaathi\satark-saathi`
**Phase Objective:** Execute a rigorous, non-destructive engineering audit of Phase 4.6 evaluation metrics, risk communication semantics across the application, feature-flag controls, model failure modes, and formulate a reproducible specification for an independent Dataset E.

---

### 1. Executive Summary & Staging Decision

Phase 4.7 conducted an independent, non-destructive audit of Satark Saathi. All reported Phase 4.6 metrics on Dataset D were recomputed directly from per-sample raw predictions. Risk communication across the frontend and backend was audited to eliminate unsupported safety claims, and focused safety regression tests were added.

```
========================================================================================
AUDIT RELEASE DECISION: CONDITIONAL PASS (Approved for Internal Staging / Canary Only)
PRODUCTION DEFAULT MANDATE: DETERMINISTIC-ONLY MODE MUST REMAIN DEFAULT
========================================================================================
1. METRIC REPRODUCIBILITY: All reported Phase 4.6 metrics on Dataset D (N = 100) were
   independently reproduced with 100% mathematical fidelity. The reported claims of
   +3 True Positives, 0 additional False Positives, and +4 Exact-Tier Matches are verified.
2. LATENCY DECOUPLING: Model cold-start time (1,707.05 ms first disk read) was decoupled
   from warm inference latency (Deterministic: 2.11 ms avg; Hybrid: 2.88 ms avg).
3. RISK COMMUNICATION AUDITED: Removed the label "Verified Safe" from OverviewPage.tsx,
   replacing it with "Standard / Low Risk". Added an explicit Tier GREEN advisory in
   ScannerPage.tsx stating that GREEN indicates absence of detected threats, not proof
   of safety.
4. FEATURE FLAG AUDIT: Confirmed public endpoints (/api/v1/analyze) strictly execute in
   deterministic-only mode. Client request payloads cannot enable hybrid mode.
5. DATASET E ROADMAP: Formulated a comprehensive, predeclared specification for Dataset E
   (N >= 100) with strict de-duplication, template similarity guards, and ethical sourcing.
========================================================================================
```

---

### 2. Workstream 1: Independent Reproduction of Phase 4.6 Metrics

An independent audit runner (`scratch/independent_phase4_7_audit.py`) was executed against the frozen Dataset D ($N = 100$) ground truth:
- **Positive Class Definition:** Scam / Coercive Threat (`expected_is_scam == True`, $N = 50$).
- **Negative Class Definition:** Legitimate Institutional / Ambiguous Notice (`expected_is_scam == False`, $N = 50$).
- **Expected Policy Tier Distribution:**
  - `RED`: 49 samples (High-risk extortion, digital arrest, OTP theft, impersonation)
  - `AMBER`: 1 sample (`D-OBFUSC-13`: Emotional child ICU crowdfunding with personal volunteer UPI)
  - `GREEN`: 50 samples (Standard banking, utility notices, personal chats, public alerts)

#### Recomputed Metrics & Denominator Verification
| Evaluation Metric | Deterministic-Only Mode | Semantic-Only Mode (Diagnostic Binary) | Hybrid Mode (Configured Prototype) | Report Discrepancy Status |
| :--- | :--- | :--- | :--- | :--- |
| **True Positives (TP)** | **28** / 50 | **48** / 50 | **31** / 50 | **Exact Match (Claimed +3 TP verified)** |
| **True Negatives (TN)** | **49** / 50 | **42** / 50 | **49** / 50 | **Exact Match (Claimed 0 new FP verified)** |
| **False Positives (FP)**| **1** / 50 | **8** / 50 | **1** / 50 | **Exact Match** |
| **False Negatives (FN)**| **22** / 50 | **2** / 50 | **19** / 50 | **Exact Match** |
| **Binary Accuracy** | **77.00%** (77/100) | **90.00%** (90/100) | **80.00%** (80/100) | **Exact Match** |
| **Precision** | **96.55%** (28/29) | **85.71%** (48/56) | **96.88%** (31/32) | **Exact Match** |
| **Recall (Threats)** | **56.00%** (28/50) | **96.00%** (48/50) | **62.00%** (31/50) | **Exact Match (+6.00% gain)** |
| **F1 Score** | **0.7089** | **0.9057** | **0.7561** | **Exact Match (+0.0472 gain)** |
| **False Positive Rate** | **2.00%** (1/50) | **16.00%** (8/50) | **2.00%** (1/50) | **Exact Match** |
| **False Negative Rate** | **44.00%** (22/50) | **4.00%** (2/50) | **38.00%** (19/50) | **Exact Match** |
| **Exact 3-Tier Match** | **69.00%** (69/100) | N/A (Binary Probability Only) | **73.00%** (73/100) | **Exact Match (+4 tier matches verified)** |

#### Latency Profiling: Cold-Start vs. Warm Inference
Phase 4.6 reported Semantic-Only latency as 20.72 ms because the cold-start model load was aggregated into the sample average. In this independent audit, cold-start was isolated and warm inference was profiled across 100 samples:
- **Model Cold-Start Latency (First disk load):** **1,707.05 ms** (reading and deserializing `offline_semantic_model.joblib`).
- **Warm Inference Latencies:**
  - **Deterministic-Only:** Avg **2.11 ms** | Median **1.54 ms** | P95 **5.31 ms** | Max **16.64 ms**
  - **Semantic-Only:** Avg **0.92 ms** | Median **0.84 ms** | P95 **1.33 ms** | Max **2.25 ms**
  - **Hybrid Mode:** Avg **2.88 ms** | Median **2.50 ms** | P95 **5.94 ms** | Max **7.05 ms**

*Finding:* Warm hybrid inference incurs an average overhead of only **+0.77 ms** over pure deterministic execution, well within real-time latency budgets.

#### Audit of the Single AMBER Case (`D-OBFUSC-13`)
- **Scenario:** Emergency ICU appeal for a child requesting donations to a personal volunteer UPI (`savelife.aarav@okicici`).
- **Ground Truth Expected Tier:** `AMBER` (coercive emotional appeal without law-enforcement or arrest threat).
- **Detector Behavior:**
  - Deterministic-Only scored **55** $\longrightarrow$ Tier `RED`.
  - Hybrid scored **67** $\longrightarrow$ Tier `RED`.
- **Finding:** Under `RiskPolicy`, any score $\ge 50$ is mapped to `RED`. The detector correctly recognized the communication as a fraudulent threat (binary TP), but classified it as `RED` rather than `AMBER`. This accounts for 1 of the tier calibration mismatches.

#### Per-Sample Differences Trace (+7 Samples Shifted)
The claim of 7 sample shifts between Deterministic and Hybrid was verified:
1. `D-SCAM-03` (LPG Gas Disconnection Threat): Score $47 \rightarrow 59$ (Tier AMBER $\rightarrow$ **RED**, Expected: RED)
2. `D-SCAM-04` (Passport Penalty Extortion): Score $32 \rightarrow 44$ (Tier GREEN $\rightarrow$ **AMBER**, Converted Missed FN to **TP**)
3. `D-SCAM-14` (Insurance Policy Surrender): Score $45 \rightarrow 57$ (Tier AMBER $\rightarrow$ **RED**, Expected: RED)
4. `D-SCAM-18` (Telecom Legal Disconnection): Score $27 \rightarrow 39$ (Tier GREEN $\rightarrow$ **AMBER**, Converted Missed FN to **TP**)
5. `D-SCAM-20` (Diplomatic Cargo AML): Score $35 \rightarrow 47$ (Tier AMBER $\rightarrow$ **RED**, Expected: RED)
6. `D-SCAM-21` (Aadhaar Biometric Lock): Score $32 \rightarrow 44$ (Tier GREEN $\rightarrow$ **AMBER**, Converted Missed FN to **TP**)
7. `D-SCAM-25` (Lottery Vehicle Advance Fee): Score $43 \rightarrow 55$ (Tier AMBER $\rightarrow$ **RED**, Expected: RED)

---

### 3. Workstream 2: Risk Communication & Green-Tier Safety Audit

An audit of the frontend and API responses was conducted to enforce truthful risk communication:

#### Corrected Risk Communication Labels
1. **`frontend/src/pages/OverviewPage.tsx` (Line 108):**
   - *Previous Text:* `{ name: 'Verified Safe', count: stats.safe_analyses, color: '#059669' }`
   - *Audit Finding:* Violated safety rule ("Never represent GREEN as proof that a message is safe").
   - *Correction Made:* Replaced with `{ name: 'Standard / Low Risk', count: stats.safe_analyses, color: '#059669' }`.
2. **`frontend/src/pages/ScannerPage.tsx` (Lines 968-975):**
   - *Audit Finding:* GREEN tier results lacked an explicit disclaimer explaining the negative result.
   - *Correction Made:* Added an explicit contextual advisory box:
     ```tsx
     {currentAnalysis.policy_tier === 'GREEN' && (
       <p className="mt-2 text-[11px] text-emerald-800 bg-emerald-50 border border-emerald-200 rounded p-2 leading-relaxed">
         <strong>Tier GREEN Advisory:</strong> No sufficiently strong threat indicators were detected in this message. This does <em>not</em> guarantee that the communication or sender is safe or authentic. Always exercise digital vigilance and never disclose OTPs, PINs, or credentials.
       </p>
     )}
     ```
3. **Heuristic Score vs. Probability Integrity:**
   - Both `ScannerPage.tsx` and API responses explicitly label the score as a *"Heuristic signal indicator based on weighted threat vectors and counter-signals. Not a calibrated probability."*
   - Plain-language summaries present scores strictly as ratios (e.g. `Score: 59/100`), never as decimal chances or statistical probabilities.

---

### 4. Workstream 3: Feature-Flag, Artifact & Model Failure Audit

Focused regression tests were added in [test_audit_safety_phase4_7.py](file:///d:/SatarkSaathi/satark-saathi/backend/tests/test_audit_safety_phase4_7.py):

| Safety Invariant Tested | Test Function | Result |
| :--- | :--- | :--- |
| **Privacy / Log Sanitization** | `test_logging_does_not_leak_raw_text` | **PASS** — Exception logs do not retain raw passwords or OTPs |
| **Semantic Uncertainty Neutrality** | `test_semantic_uncertainty_preserves_deterministic_score` | **PASS** — $p \in [0.35, 0.65]$ outputs weight $=0$, score unmodified |
| **Acute-Threat Floor Inviolability** | `test_acute_threat_floor_inviolability_across_all_codes` | **PASS** — All 10 acute codes enforce Tier RED ($\text{score} \ge 45$) |
| **Green Tier Communication Safety** | `test_green_tier_never_claims_verified_safe` | **PASS** — Summaries never use "verified safe" or guarantees |
| **Trusted Model Path Pinned** | `test_trusted_model_path_constraint` | **PASS** — Model path strictly pinned to `backend/app/models/` |

#### Additional Security Audits Completed:
- **Public API Feature Flag Isolation:** Public route `POST /api/v1/analyze` passes no `enable_semantic` parameter to the backend engine; Pydantic schema `TextAnalyzeRequest` rejects / ignores extra client payload parameters. Semantic inference cannot be activated by untrusted HTTP requests.
- **Offline Network Isolation:** Python socket audit confirmed zero outbound network connections during model initialization, vectorization, or scoring.

---

### 5. Workstream 4: Dataset E Preparation Plan (Predeclared Specification)

To enable future release validation without contaminating benchmarks, the specification for **Dataset E ($N = 120$)** is predeclared:

```
Dataset Identifier:        DATASET_E_STAGING_ACCEPTANCE_v1
Target Volume:             120 Samples
Sourcing Strategy:         Anonymized Citizen Submissions + Public Warning Notices
De-duplication Standard:   Levenshtein / Jaccard Token Distance < 0.60 vs Datasets A, B, C, D
Dual Reviewer Agreement:   Cohen's Kappa >= 0.85
Storage & Packaging:       Encrypted JSON with SHA-256 Pre-Commit Manifest
Evaluation Status:         PREDECLARED SPECIFICATION (NOT EVALUATED IN THIS PHASE)
```

#### Proposed Strata Distribution ($N = 120$)
1. **Real-World Citizen-Reported Scams ($N = 30$, 25%):** Anonymized grievance narratives sourced from public cybercrime advisories (PIB Fact Check, RBI Kehta Hai, CERT-In). Covers zero-day pretexts: solar rooftop schemes, livestock loans, fake university quota seats, trade union arrears.
2. **Legitimate Institutional & Public Utilities ($N = 30$, 25%):** Official communications from Indian Railways (IRCTC), municipal property tax desks, EPFO statements, postal tracking, and bank monthly statements.
3. **Keyword-Heavy Educational & Legal Circulars ($N = 20$, 17%):** Cybersecurity circulars, legal syllabi, and banking awareness messages that discuss fraud terms ("digital arrest", "escrow", "OTP") in an educational context.
4. **Colloquial Hinglish & Regional Transliterations ($N = 20$, 17%):** Romanized Hindi, Marathi, and Tamil conversational phrases with natural typo variations and colloquial expressions.
5. **Adversarial Injections, Obfuscations & Camouflage ($N = 20$, 17%):** Mixed-intent communications, unicode spacing, full-width characters, and prompt injection evasions attempting to bypass safety policies.

#### Predeclared Acceptance Gate Criteria for Dataset E
- **Specificity on Benign / Institutional Traffic:** $\ge 96.0\%$ ($\text{FPR} \le 4.0\%$).
- **Precision on Scam Pretexts:** $\ge 90.0\%$.
- **Threat Recall:** $\ge 70.0\%$.
- **Latency Budget:** Warm single-thread CPU inference $< 10$ ms.
- **Zero Invariant Regressions:** Zero acute-threat downgrades and 100% verbatim evidence excerpts.

---

### 6. Workstream 5: Regression & Release Gate Status

The complete regression suite was executed across all components:

| Component / Test Suite | Command | Total Items | Passed | Failed | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Backend Test Suite** | `pytest backend/tests/` | 165 | **165** | 0 | **PASS (100%)** |
| **Frontend Test Suite** | `npm test -- --run` | 8 | **8** | 0 | **PASS (100%)** |
| **Frontend Production Build** | `tsc -b && vite build` | 2,515 modules | **Clean** | 0 | **PASS (1.40s)** |
| **Dataset D Audit Runner** | `independent_phase4_7_audit.py`| 100 | **100** | 0 | **REPRODUCED** |

#### Files Modified During Phase 4.7
1. `frontend/src/pages/OverviewPage.tsx`: Replaced `"Verified Safe"` with `"Standard / Low Risk"` to eliminate misleading safety claims.
2. `frontend/src/pages/ScannerPage.tsx`: Added explicit Tier GREEN explanatory advisory note.
3. `backend/tests/test_audit_safety_phase4_7.py`: Created new test module with 5 regression tests covering logging privacy, uncertainty safety, acute-threat floors, and trusted paths.
4. `scratch/independent_phase4_7_audit.py`: Created reproducible evaluation script for per-sample verification.
5. `docs/PHASE_4_7_EVALUATION_INTEGRITY_AND_SAFETY_REPORT.md`: Comprehensive audit report deliverable.

---

### 7. Final Release Recommendation

```
========================================================================================
FINAL AUDIT DECISION: CONDITIONAL PASS (Approved for Internal Staging)
========================================================================================
1. STAGING VERDICT: The hybrid prototype is mathematically validated and safely
   isolated. It is APPROVED for internal developer testing and canary benchmarking.
2. PRODUCTION MANDATE: DETERMINISTIC-ONLY OPERATION REMAINS DEFAULT for all public
   traffic. Public API schemas do not allow client-side hybrid activation.
3. NEXT RELEASE STAGE: Authoring and independent double-blind evaluation of Dataset E.
========================================================================================
```
