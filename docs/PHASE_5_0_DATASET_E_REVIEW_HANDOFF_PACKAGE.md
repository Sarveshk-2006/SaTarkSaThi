# Satark Saathi — Phase 5.0 Report
## Independent Dataset E Review Handoff Package

**Evaluation Phase:** Phase 5.0
**Repository:** `D:\SatarkSaathi\satark-saathi`
**Current System Status:** CONDITIONAL PASS (Internal Staging Only)
**Public API Default:** Pure Deterministic Engine (`HYBRID_DETECTION_ENABLED = False`)
**Dataset E Governance State:** **READY TO INVITE REVIEWERS**
**Deliverable Date:** October 23, 2026

---

### Executive Summary

Phase 5.0 prepares the complete operational handoff package required to recruit, instruct, and coordinate human participants for the **Dataset E ($N=120$)** evaluation benchmark.

In strict adherence to scientific and evaluation integrity constraints:
- **Zero fictitious candidate samples or reviewer records have been manufactured.**
- **The distinction between specification and human data is maintained:** The specification and automated tooling are 100% complete, while the 120 candidate samples and their corresponding dual reviews remain authentic human actions to be completed.
- **Physical and cryptographic custodian boundaries are documented**, replacing naive assumptions regarding local directory separation.
- **Dedicated role-specific operational instructions and submission templates** have been created for candidate authors, Reviewer 1, Reviewer 2, the Independent Custodian, and the Evaluation Runner.
- **All 21 governance unit and adversarial tests pass (100%)**, and the evaluation commands and package schemas match the codebase exactly.

---

### 1. Existing Assets vs. Outstanding Human Deliverables

A precise audit of repository assets separates automated code/tooling from deliverables that must be authored by humans:

| Operational Component | Status | Source File / Artifact | Notes & Human Requirement |
| :--- | :---: | :--- | :--- |
| **Labeling Handbook** | **COMPLETE** | `evaluation_governance/LABELING_HANDBOOK.md` | Authoring taxonomy, strata, and tier guidance. |
| **Pydantic v2 Schema** | **COMPLETE** | `evaluation_governance/schemas/dataset_e_schema.py` | Validates candidate records, evidence spans, tiers. |
| **Candidate Intake Template** | **COMPLETE** | `evaluation_governance/candidate_pool/candidate_intake_sheet.json` | JSON structure for authors. |
| **120 Candidate Samples** | **PENDING** | `evaluation_governance/candidate_pool/dataset_e_candidates_120.json` | **Must be authored by human curators** (30 Citizen, 30 Institutional, 20 Academic, 20 Hinglish, 20 Adversarial). |
| **Reviewer 1 Instructions** | **COMPLETE** | `evaluation_governance/instructions/INSTRUCTIONS_REVIEWER_1.md` | Blind review protocol for Reviewer 1. |
| **Reviewer 2 Instructions** | **COMPLETE** | `evaluation_governance/instructions/INSTRUCTIONS_REVIEWER_2.md` | Blind review protocol for Reviewer 2. |
| **Reviewer 1 Submission** | **PENDING** | `evaluation_governance/review_records/reviewer_1_submission.json` | **Must be completed independently by Reviewer 1.** |
| **Reviewer 2 Submission** | **PENDING** | `evaluation_governance/review_records/reviewer_2_submission.json` | **Must be completed independently by Reviewer 2.** |
| **Agreement Calculator** | **COMPLETE** | `evaluation_governance/tools/calculate_agreement.py` | Computes Kappa, PABAK, prevalence/bias indices. |
| **Adjudication Log** | **PENDING** | `evaluation_governance/review_records/adjudication_log.json` | **Must be authored by the Adjudicator** on disagreements. |
| **Leakage & PII Checker** | **COMPLETE** | `evaluation_governance/tools/leakage_and_integrity_check.py` | Screens candidates against Datasets A, B, C, D. |
| **Package Freezer** | **COMPLETE** | `evaluation_governance/tools/package_freezer.py` | Splits unlabelled inputs from ground truth. |
| **Custodian Instructions** | **COMPLETE** | `evaluation_governance/instructions/INSTRUCTIONS_INDEPENDENT_CUSTODIAN.md` | Sealed custody, off-repo storage, and reconciliation. |
| **Evaluator Instructions** | **COMPLETE** | `evaluation_governance/instructions/INSTRUCTIONS_EVALUATION_RUNNER.md` | Execution steps for running the decoupled runner. |
| **Frozen Dataset E Package** | **PENDING** | `evaluation_governance/frozen_packages/DATASET_E_FROZEN_v1` | **Pending completion of human reviews and freeze.** |

---

### 2. Role-Specific Operational Instructions

To ensure strict operational isolation, independent instruction documents have been authored:

1. **Candidate Authors ([INSTRUCTIONS_CANDIDATE_AUTHORS.md](file:///d:/SatarkSaathi/satark-saathi/evaluation_governance/instructions/INSTRUCTIONS_CANDIDATE_AUTHORS.md)):**
   - Directs the composition of the 120 samples across the 5 predefined strata.
   - Enforces PII scrubbing rules (masks for phone numbers, accounts, names, UPI handles).
   - Requires pre-submission validation via `leakage_and_integrity_check.py`.
2. **Reviewer 1 ([INSTRUCTIONS_REVIEWER_1.md](file:///d:/SatarkSaathi/satark-saathi/evaluation_governance/instructions/INSTRUCTIONS_REVIEWER_1.md)):**
   - Independent labeling sheet with unlabelled items only (`id`, `text`, `channel`, `stratum`, `language`).
   - Instructions for assigning `is_scam`, `risk_tier` (`GREEN`, `AMBER`, `RED`), `threat_category`, `ambiguity_flag`, and `notes`.
   - Prohibits inter-reviewer communication or consulting detector heuristics.
3. **Reviewer 2 ([INSTRUCTIONS_REVIEWER_2.md](file:///d:/SatarkSaathi/satark-saathi/evaluation_governance/instructions/INSTRUCTIONS_REVIEWER_2.md)):**
   - Identical blind labeling protocol executed in parallel isolation.
4. **Independent Custodian ([INSTRUCTIONS_INDEPENDENT_CUSTODIAN.md](file:///d:/SatarkSaathi/satark-saathi/evaluation_governance/instructions/INSTRUCTIONS_INDEPENDENT_CUSTODIAN.md)):**
   - Ingests reviewer submissions, runs agreement calculation, supervises adjudication.
   - Manages physical and cryptographic custody of sealed `ground_truth.json`.
   - Distributes only unlabelled `test_inputs.json` to the evaluation runner.
5. **Evaluation Runner ([INSTRUCTIONS_EVALUATION_RUNNER.md](file:///d:/SatarkSaathi/satark-saathi/evaluation_governance/instructions/INSTRUCTIONS_EVALUATION_RUNNER.md)):**
   - Executes `run_dataset_e_evaluator.py`, verifying manifest SHA-256 digests.
   - Serializes decoupled prediction artifacts and verifies performance against release gates.

---

### 3. Review Field Specifications & Preservation Rules

Every candidate and reviewer decision is bound to a strict field contract:

```
+──────────────────────────────────────────────────────────────────────────+
|                    DATASET E REVIEW DATA CONTRACT                        |
+──────────────────────────────────────────────────────────────────────────+
| Field Name               | Type    | Description                         |
+──────────────────────────+─────────+─────────────────────────────────────+
| `id`                     | String  | Stable ID (e.g. `E-CITIZEN-01`)     |
| `text`                   | String  | Sanitized message body (>= 15 chars)|
| `channel`                | String  | Communication channel (SMS, etc.)   |
| `stratum`                | String  | One of 5 pre-declared strata        |
| `language`               | String  | Language tag (en, hi-Latn, etc.)    |
| `provenance_type`        | String  | SYNTHETIC, ADAPTED, RESPONSIBLY_SRC |
| `expected_is_scam`       | Boolean | True (Malicious/Fraud) / False       |
| `expected_tier`          | String  | GREEN, AMBER, or RED                |
| `tier_rationale`         | String  | Explicit written justification      |
| `threat_category`        | String  | Descriptive category classification |
| `evidence_span`          | String  | Verbatim substring in text (or null)|
| `ambiguity_flag`         | Boolean | True if borderline/mixed-intent     |
| `pii_redaction_status`   | String  | Must be VERIFIED_REDACTED           |
+──────────────────────────────────────────────────────────────────────────+
```

#### Immutability & Adjudication Separation Rule
- Reviewer submissions (`reviewer_1_submission.json` and `reviewer_2_submission.json`) must **NEVER be modified or overwritten** during adjudication.
- All disagreements must be resolved in a separate file: `evaluation_governance/review_records/adjudication_log.json` (using [adjudication_log_template.json](file:///d:/SatarkSaathi/satark-saathi/evaluation_governance/review_records/adjudication_log_template.json)).
- The final adjudicated dataset is compiled into a new file: `candidate_pool/adjudicated_dataset_e_120.json`.

---

### 4. Independent Custodian Access Boundary & Protocol

In a single-operator local development environment:
- **Local directory paths and Git branches do NOT provide security access control.** Any user or process running on the host machine has full read/write access to all files.
- **Cryptographic hashes (SHA-256) provide post-freeze tamper detection, NOT access prevention.** A developer can inspect hashed files locally.

#### The Custodian Air-Gap Protocol:
To achieve genuine double-blind separation during evaluation:
1. **Physical Ground-Truth Extraction:**
   - Once `package_freezer.py` generates `test_inputs.json`, `ground_truth.json`, and `manifest.json`, the Custodian **immediately copies `ground_truth.json` to an off-site, external secure storage** (e.g., an encrypted USB drive, private cloud bucket with KMS, or GPG-encrypted archive).
   - `ground_truth.json` is deleted from the developer workspace.
2. **Unlabelled Inference:**
   - The developer or CI runner receives **only** `test_inputs.json` and `manifest.json`.
   - The detector runs inference on `test_inputs.json` and produces `predictions.json`.
   - The developer commits and submits `predictions.json` (along with its SHA-256 hash) to the Custodian.
3. **Independent Custodian Reconciliation:**
   - The Custodian restores `ground_truth.json` in an isolated environment, runs `run_dataset_e_evaluator.py`, and publishes the final reconciliation report.
   - Neither the detector code nor the developer has accessed the ground-truth labels during inference.

---

### 5. Human Action Checklist with Completion Evidence

The following 9 stages govern the evaluation handoff:

```
[ ] STAGE 1: CANDIDATE AUTHORING
    - Action: Human curators author 120 samples across the 5 strata using candidate_intake_sheet.json.
    - Required Evidence: Validated candidate_pool/dataset_e_candidates_120.json passing dataset_e_schema.py.

[ ] STAGE 2: PRE-REVIEW LEAKAGE & PII SCREENING
    - Action: Run leakage_and_integrity_check.py against Datasets A, B, C, D.
    - Required Evidence: Zero exact duplicates, zero normalized duplicates, zero unredacted PII warnings.

[ ] STAGE 3: BLIND REVIEW DISTRIBUTION
    - Action: Custodian generates unlabelled blind_candidate_sheet_120.json and delivers to Reviewers 1 & 2.
    - Required Evidence: Signed distribution receipt with timestamp and SHA-256 hash of review sheet.

[ ] STAGE 4: INDEPENDENT REVIEW EXECUTION
    - Action: Reviewers 1 and 2 independently complete all 120 labels in isolation.
    - Required Evidence: Sealed reviewer_1_submission.json and reviewer_2_submission.json with 100% complete labels.

[ ] STAGE 5: AGREEMENT CALCULATION
    - Action: Custodian runs calculate_agreement.py on the two submission files.
    - Required Evidence: Agreement report confirming zero missing samples and calculating Cohen's Kappa & PABAK.

[ ] STAGE 6: DISAGREEMENT ADJUDICATION
    - Action: Designated Adjudicator reviews conflicting cases and documents consensus.
    - Required Evidence: Committed adjudication_log.json with explicit rationale for every resolved discrepancy.

[ ] STAGE 7: FINAL PACKAGE FREEZE
    - Action: Custodian executes package_freezer.py on adjudicated_dataset_e_120.json.
    - Required Evidence: frozen_packages/DATASET_E_FROZEN_v1 containing test_inputs.json, ground_truth.json, manifest.json.

[ ] STAGE 8: CUSTODIAN AIR-GAP CONFIRMATION
    - Action: Custodian moves ground_truth.json off-site; provides only test_inputs.json to evaluation runner.
    - Required Evidence: Custodian signed confirmation of off-site ground truth deposit.

[ ] STAGE 9: BLIND INFERENCE & INDEPENDENT RECONCILIATION
    - Action: Evaluator runs inference, commits predictions.json, and Custodian reconciles report.
    - Required Evidence: Official evaluation report generated by run_dataset_e_evaluator.py.
```

---

### 6. Verification of Command Signatures & Package Schemas

All commands documented in the handoff package match the actual CLI signatures in `evaluation_governance/tools/`:

| Tool | Documented CLI Command | Verified Code Implementation | Status |
| :--- | :--- | :--- | :---: |
| **Leakage Checker** | `python evaluation_governance/tools/leakage_and_integrity_check.py <candidate_file.json>` | `sys.argv[1]` parsed as candidate path in `leakage_and_integrity_check.py` | **MATCH** |
| **Agreement Calculator** | `python evaluation_governance/tools/calculate_agreement.py <r1.json> <r2.json>` | `sys.argv[1]`, `sys.argv[2]` parsed as reviewer files in `calculate_agreement.py` | **MATCH** |
| **Package Freezer** | `python evaluation_governance/tools/package_freezer.py <candidates.json> <output_dir> [package_id]` | `sys.argv[1..3]` parsed in `package_freezer.py` | **MATCH** |
| **Evaluation Runner** | `python evaluation_governance/tools/run_dataset_e_evaluator.py <package_dir> <output_dir> [evaluation_label]` | `sys.argv[1..3]` parsed in `run_dataset_e_evaluator.py` | **MATCH** |

---

### 7. Governance Test Verification

The complete governance test suite was executed:
- `backend/tests/test_dataset_e_governance_phase4_8.py`: **8 passed** (0.45s)
- `backend/tests/test_adversarial_integrity_phase4_9.py`: **13 passed** (2.05s)
- **Total Governance Tests: 21 passed (0 failed)**

---

### 8. Final Decision & Status Determination

```
========================================================================================
FINAL EVALUATION DECISION: READY TO INVITE REVIEWERS
========================================================================================
JUSTIFICATION:
1. All operational instructions, schemas, intake templates, and submission forms
   have been created, verified, and placed in evaluation_governance/.
2. All 21 governance unit and adversarial tests pass cleanly with zero defects.
3. Command signatures, schema fields, and package formats match the real codebase.
4. Physical and cryptographic custody requirements have been clearly specified.
5. The pipeline is fully prepared for human curator and reviewer participation.
========================================================================================
```

*All existing working-tree modifications have been preserved. No commits, pushes, or detector modifications have been made.*
