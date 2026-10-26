# Satark Saathi — Phase 4.8 Report
## Independent Dataset E Governance, Authoring Pipeline & Blind-Evaluation Readiness

**Evaluation Phase:** Phase 4.8
**Current System Status:** CONDITIONAL PASS (Internal Staging Only)
**Public API Default:** Pure Deterministic Engine (`HYBRID_DETECTION_ENABLED = False`)
**Audit Completion Date:** October 23, 2026
**Artifact Repository:** [evaluation_governance/](file:///d:/SatarkSaathi/satark-saathi/evaluation_governance)

---

### Executive Summary

Phase 4.8 establishes the scientific and operational foundation for a genuinely independent evaluation of the Satark Saathi fraud intelligence engine. Following the designation of Dataset D ($N=100$) as development-informed in Phase 4.7, Phase 4.8 delivers:

1. **Architectural Data Governance & Air-Gapping:** Implemented strict physical and logical boundaries preventing detector development code from accessing candidate or frozen evaluation data. Evaluation tools and candidates reside in a dedicated root directory ([evaluation_governance/](file:///d:/SatarkSaathi/satark-saathi/evaluation_governance)) entirely decoupled from `backend/app/`.
2. **Authoring Specification & Handbook:** Authored a complete labeling handbook ([LABELING_HANDBOOK.md](file:///d:/SatarkSaathi/satark-saathi/evaluation_governance/LABELING_HANDBOOK.md)), formal Pydantic v2 schema ([dataset_e_schema.py](file:///d:/SatarkSaathi/satark-saathi/evaluation_governance/schemas/dataset_e_schema.py)), and representative candidate authoring template covering all five balanced strata ($N=120$).
3. **Dual-Reviewer Agreement & Leakage Screening Tools:** Delivered reproducible tooling to compute Cohen's Kappa ($\kappa$) and observed agreement between independent reviewers ([calculate_agreement.py](file:///d:/SatarkSaathi/satark-saathi/evaluation_governance/tools/calculate_agreement.py)), and automated multi-tier leakage checks ([leakage_and_integrity_check.py](file:///d:/SatarkSaathi/satark-saathi/evaluation_governance/tools/leakage_and_integrity_check.py)) that screen candidates against Datasets A, B, C, and D using exact, normalized, Jaccard, and Levenshtein metrics.
4. **Decoupled Evaluation Runner:** Built a cryptographic package freezer ([package_freezer.py](file:///d:/SatarkSaathi/satark-saathi/evaluation_governance/tools/package_freezer.py)) and evaluation runner ([run_dataset_e_evaluator.py](file:///d:/SatarkSaathi/satark-saathi/evaluation_governance/tools/run_dataset_e_evaluator.py)) that feeds strictly unlabelled payloads to the detector, logs predictions separately, and validates SHA-256 manifests before evaluation.
5. **Truth in Labeling & Readiness Declaration:** **Dataset E is currently at the SPECIFIED & TOOLING-READY stage.** In accordance with scientific integrity guidelines, Dataset E is **NOT** claimed to be evaluated, completed, or frozen as a blind holdout, because authentic independent human reviewer records have not yet been collected.

---

### 1. Workstream 1: Dataset Governance & Access Boundaries

To eliminate benchmark leakage and observer bias, the evaluation governance model defines five isolated operational domains:

```
+──────────────────────────────────────────────────────────────────────────+
|                    SATARK SAATHI GOVERNANCE DOMAINS                     |
+──────────────────────────────────────────────────────────────────────────+
| 1. RUNTIME & DEVELOPMENT ENVIRONMENT                                    |
|    Path: `backend/app/`                                                  |
|    Contents: Rule engine, semantic model, policy, Datasets A-D.         |
|    Boundary: Forbidden from importing any files under                    |
|              `evaluation_governance/frozen_packages/`.                   |
|                                                                          |
| 2. CANDIDATE POOL (Pre-Adjudication Staging)                             |
|    Path: `evaluation_governance/candidate_pool/`                         |
|    Contents: Raw authoring templates and unverified candidate samples.  |
|    Boundary: Inaccessible to automated evaluators or production runners. |
|                                                                          |
| 3. INDEPENDENT REVIEW RECORDS                                            |
|    Path: `evaluation_governance/review_records/`                         |
|    Contents: Blind reviewer labeling forms and adjudication rationale.   |
|    Boundary: Reviewers inspect unlabelled text only; consensus audited.  |
|                                                                          |
| 4. FROZEN PACKAGES (Air-Gapped Ground Truth)                             |
|    Path: `evaluation_governance/frozen_packages/<pkg_id>/`               |
|    Contents: `test_inputs.json` (unlabelled text),                       |
|              `ground_truth.json` (sealed labels), `manifest.json`.       |
|    Boundary: Verified via SHA-256 before any evaluator execution.        |
|                                                                          |
| 5. EVALUATION OUTPUTS                                                    |
|    Path: `evaluation_governance/evaluation_outputs/`                     |
|    Contents: Decoupled per-sample predictions, stratum reports, gates.   |
+──────────────────────────────────────────────────────────────────────────+
```

#### Explicit Single-Developer / Automated Environment Limitation
In a single-operator local engineering environment, **genuine double-blind separation cannot be claimed**. An engineer with repository access can inspect both detection rules and candidate sample texts. To prevent simulated blindness:
- Dataset E tooling is constructed so external reviewers can provide isolated JSON labeling submissions.
- The repository strictly records the current status as **"Specification & Tooling Ready"** and prohibits manufacturing synthetic human review records.

---

### 2. Workstream 2: 120-Sample Authoring Specification & Handbook

The labeling handbook ([LABELING_HANDBOOK.md](file:///d:/SatarkSaathi/satark-saathi/evaluation_governance/LABELING_HANDBOOK.md)) governs the construction of the 120 candidate samples across five balanced strata:

| Stratum Key | Target Count | ID Prefix | Scope & Adversarial Challenge |
| :--- | :---: | :---: | :--- |
| **`CITIZEN_SCAM`** | 30 | `E-CITIZEN-01` .. `30` | Real-world style grievance narratives inspired by PIB Fact Check, CERT-In, and state police advisories. Covers zero-day vectors: solar rooftop schemes, pension arrears, Aadhaar biometrics, fake legal summons, investment WhatsApp groups. |
| **`INSTITUTIONAL_BENIGN`** | 30 | `E-INST-01` .. `30` | Official transactional SMS from IRCTC, EPFO, banking e-statements, municipal utilities, delivery OTPs, postal tracking. Must contain natural urgency without malicious coercion. |
| **`ACADEMIC_KEYWORD_HEAVY`** | 20 | `E-ACAD-01` .. `20` | Cybersecurity syllabi, university circulars, and banking awareness messages that discuss fraud terms ("digital arrest", "escrow", "OTP", "CBI") in an educational, non-malicious context. |
| **`HINGLISH_REGIONAL`** | 20 | `E-HING-01` .. `20` | Natural colloquial Indian syntax (Romanized Hindi, Marathi, Tamil) with authentic slang, emergency friend-in-need requests, and informal payment demands. |
| **`ADVERSARIAL_OBFUSCATED`** | 20 | `E-ADV-01` .. `20` | Mixed-intent communications, unicode spacing, character insertions, obfuscated URLs, and prompt injection patterns designed to evade naive filters. |

#### Schema Fields & Validation Invariants ([dataset_e_schema.py](file:///d:/SatarkSaathi/satark-saathi/evaluation_governance/schemas/dataset_e_schema.py))
- `id`: Pattern matching `^E-(CITIZEN|INST|ACAD|HING|ADV)-\d{2}$`.
- `text`: Minimum 15 characters, PII sanitized.
- `provenance_type`: One of `SYNTHETIC_STRESS_TEST`, `ADAPTED_PUBLIC_ADVISORY`, or `RESPONSIBLY_SOURCED_PUBLIC_RECORD`.
- `expected_is_scam`: Strict boolean (`True` for scam/fraud/extortion, `False` for benign/educational).
- `expected_tier`: `GREEN`, `AMBER`, or `RED`.
- `tier_rationale`: Mandatory textual justification for the expected tier.
- `evidence_span`: Verbatim substring within `text` that justifies threat or counter-signal (enforced by Pydantic validator).
- `pii_redaction_status`: Verified redaction of Indian mobile numbers, emails, and account details.

---

### 3. Workstream 3: Independent Review & Leakage Controls

#### Reviewer Agreement Tooling ([calculate_agreement.py](file:///d:/SatarkSaathi/satark-saathi/evaluation_governance/tools/calculate_agreement.py))
- Computes observed agreement ($P_o$) and chance-corrected Cohen's Kappa ($\kappa$):
  $$\kappa = \frac{P_o - P_e}{1 - P_e}$$
- Computes separate agreement metrics for binary scam classification and three-tier risk classification.
- Identifies sample-level disagreements for the Adjudicator.
- **Rule Enforced:** No synthetic agreement data is fabricated. Target $\kappa \ge 0.85$ is enforced as an entry criterion for candidate freeze, but will only be evaluated when genuine reviewer submissions are ingested.

#### Multi-Tier Leakage & Integrity Checker ([leakage_and_integrity_check.py](file:///d:/SatarkSaathi/satark-saathi/evaluation_governance/tools/leakage_and_integrity_check.py))
Screens every candidate against development datasets A, B, C, and D:
1. **Exact Duplicate Check:** Detects verbatim string matches.
2. **Normalized Duplicate Check:** Strips punctuation, collapses whitespace, and lowercases text.
3. **Token Jaccard Similarity:** Flags any candidate with token overlap $J \ge 0.60$ against historical samples.
4. **Levenshtein / SequenceMatcher Ratio:** Flags character-level similarity ratios $R \ge 0.70$.
5. **PII Detection:** Scans for unredacted 10-digit Indian phone numbers (`[6-9]\d{9}`), email addresses, or 12-digit Aadhaar formats.
6. **Schema & Verbatim Evidence Verification:** Confirms all fields are populated and evidence spans exist verbatim in the text.

---

### 4. Workstream 4: Decoupled Freeze & Evaluation Runner

The evaluation pipeline guarantees that detector inference occurs in an unlabelled context:

1. **Package Freezer ([package_freezer.py](file:///d:/SatarkSaathi/satark-saathi/evaluation_governance/tools/package_freezer.py)):**
   - Ingests candidates and writes:
     - `test_inputs.json`: Contains **only** `id`, `text`, and `channel`. Zero labels, zero tiers, zero rationales.
     - `ground_truth.json`: Contains `id`, `expected_is_scam`, `expected_tier`, `stratum`, and `threat_category`.
     - `manifest.json`: Stores SHA-256 hashes of both files, versioning, sample count, and strata totals.
2. **Evaluation Runner ([run_dataset_e_evaluator.py](file:///d:/SatarkSaathi/satark-saathi/evaluation_governance/tools/run_dataset_e_evaluator.py)):**
   - Verifies SHA-256 hashes against `manifest.json` before execution.
   - Feeds unlabelled `test_inputs.json` into:
     - Deterministic-Only Mode (`enable_semantic=False`)
     - Hybrid Mode (`enable_semantic=True`)
     - Semantic-Only Diagnostic Mode (evaluated as binary threat/safe, not compared as 3-tier)
   - Decouples and writes raw predictions to `evaluation_outputs/` before loading ground truth.
   - Evaluates confusion matrix (TP, TN, FP, FN), precision, recall, F1, FPR, FNR, exact 3-tier agreement, and per-stratum metrics.
   - Separates cold-start model deserialization latency from warm inference latency.

---

### 5. Workstream 5: Predeclared Acceptance Gates & Statistical Limits

The release gates for Dataset E acceptance are predeclared:

| Metric | Acceptance Gate | Denominator / Formulation | Audit Objective |
| :--- | :---: | :--- | :--- |
| **Recall (Sensitivity)** | $\ge 70.0\%$ | $\frac{\text{TP}}{\text{TP} + \text{FN}}$ (Actual Scams) | Ensures threat detection on novel, unseen pretexts. |
| **Precision** | $\ge 90.0\%$ | $\frac{\text{TP}}{\text{TP} + \text{FP}}$ (Predicted Scams) | Prevents high false-alarm rates on benign traffic. |
| **False-Positive Rate** | $\le 4.0\%$ | $\frac{\text{FP}}{\text{FP} + \text{TN}}$ (Actual Benign) | Protects institutional and academic communications. |
| **Warm Latency** | $< 10.0\text{ ms}$ | Average CPU inference time per message | Ensures responsive, real-time protection. |
| **Stratum Robustness** | Recall $\ge 50\%$, FPR $\le 10\%$ | Per individual stratum | Prevents aggregate metrics hiding a failure in a specific stratum. |

#### Small Sample Size Uncertainty ($N = 120$)
- At $N = 120$ (60 scams, 60 benign), a 95% Wilson confidence interval has an uncertainty margin of approximately $\pm 8\text{--}10\%$.
- **Statistical Invariant:** A passing point estimate on Dataset E does not prove production readiness or universal zero-day immunity. Passing Dataset E is a prerequisite for a limited, monitored staging canary, not automatic public deployment.

---

### 6. Workstream 6: Regression Testing & Repository Verification

All unit tests and end-to-end tooling checks were executed:

| Test Suite / Tool | Command | Scope | Result |
| :--- | :--- | :--- | :--- |
| **Phase 4.8 Unit Tests** | `python -m pytest backend/tests/test_dataset_e_governance_phase4_8.py` | Schema, Kappa agreement, leakage check, manifest tamper detection, metric reconciliation | **8 passed** (0.38s) |
| **Full Backend Regression** | `python -m pytest backend/tests` | All 18 backend test modules | **173 passed**, 0 failed (13.93s) |
| **Frontend Test Suite** | `npm test -- --run` | Scanner, navigation, component, API client tests | **8 passed**, 0 failed (2.15s) |
| **Frontend Production Build** | `npm run build` | TypeScript verification & Vite asset bundling | **Clean build** (1.73s) |
| **Mock Package Freezer** | `python evaluation_governance/tools/package_freezer.py ...` | Cryptographic split & SHA-256 manifest creation | **Verified** |
| **Evaluation Runner** | `python evaluation_governance/tools/run_dataset_e_evaluator.py ...` | Decoupled inference, metric computation & gate check | **Verified** |

---

### 7. Evaluation Readiness Status Declaration

```
+──────────────────────────────────────────────────────────────────────────+
|                     DATASET E READINESS DECLARATION                      |
+──────────────────────────────────────────────────────────────────────────+
| Current Milestone:           Phase 4.8 Complete                          |
| Governance Framework:        IMPLEMENTED & AIR-GAPPED                    |
| Authoring Handbook & Schema: COMPLETED & VALIDATED (Pydantic v2)         |
| Leakage & Agreement Tools:   COMPLETED & VERIFIED (Unit Tested)          |
| Decoupled Evaluation Runner: COMPLETED & CRYPTOGRAPHICALLY MANIFESTED    |
| Independent Review Status:   AWAITING INDEPENDENT HUMAN REVIEWERS        |
| Overall Dataset E Status:    SPECIFIED & TOOLING-READY                   |
| Blind Evaluation Status:     NOT EXECUTED (Awaiting Independent Review)  |
+──────────────────────────────────────────────────────────────────────────+
```

**Next Phase Recommendation:** Proceed to recruit two independent external reviewers to label the candidate pool using the blind review forms, compute Cohen's Kappa, freeze the adjudicated bundle, and execute the genuine double-blind evaluation.
