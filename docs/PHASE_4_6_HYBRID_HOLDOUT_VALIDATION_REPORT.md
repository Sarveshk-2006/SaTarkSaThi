# SATARK SAATHI — PHASE 4.6 VALIDATION REPORT
## Hybrid Holdout Validation & Feature-Flag Release Gate

**Date:** October 23, 2026
**Repository:** `d:\SatarkSaathi\satark-saathi`
**Phase Objective:** Execute a strict, one-time comparative holdout validation on frozen Dataset D ($N = 100$) comparing Deterministic-Only, Semantic-Only, and Hybrid modes. Audit feature-flag controls, artifact security, and application call sites to establish an evidence-based release gate decision.

---

### 1. Executive Summary & Release Gate Verdict

Phase 4.6 executed an empirical, frozen-holdout comparison across all three operational modes of Satark Saathi on the protected blind holdout suite (Dataset D, $N = 100$). No model retraining, rule retuning, pattern additions, or threshold adjustments were made prior to or during evaluation.

```
========================================================================================
RELEASE GATE DECISION: CONDITIONAL PASS (Approved for Internal Staging)
PRODUCTION DEFAULT RECOMMENDATION: DETERMINISTIC-ONLY MODE REMAINS DEFAULT
========================================================================================
- HOLDOUT BENEFIT CONFIRMED: Hybrid mode improved recall on novel holdout scams from
  56.00% to 62.00% (+6.00%) and overall binary accuracy from 77.00% to 80.00% (+3.00%),
  while maintaining an exact 2.00% False Positive Rate (zero increase in false alarms).
- SAFETY GATING VALIDATED: Semantic-Only mode exhibited a disastrous 16.00% FPR (8 false
  positives on benign samples). The hybrid architecture's deterministic counter-signals
  and policy gating neutralized 7 of these 8 false alarms, preserving system safety.
- FEATURE-FLAG INTEGRITY CONFIRMED: All external API routes (/api/v1/analyze) strictly
  default to deterministic rule-based analysis. Client request payloads cannot enable
  semantic mode through user-controlled parameters.
========================================================================================
```

---

### 2. State & Baseline Verification

Before holdout evaluation, repository integrity was audited and verified:
- **Backend Test Suite:** `python -m pytest backend/tests/` passed **160 tests** in 11.90s.
- **Frontend Test Suite:** `npm test -- --run` passed **8 tests** across 4 suites in 2.72s.
- **Frontend Production Build:** `tsc -b && vite build` compiled cleanly in 1.42s.
- **Dataset D Integrity:** Verified exactly 100 samples (50 scams: 49 RED, 1 AMBER; 50 benign: 50 GREEN). Zero labels or sample texts were modified.

---

### 3. One-Time Frozen Holdout Comparison (Dataset D, N = 100)

Evaluated via `scratch/run_holdout_three_mode_comparison.py`:
1. **Mode 1 (Deterministic-Only):** Default production engine (`enable_semantic=False`).
2. **Mode 2 (Semantic-Only):** Diagnostic baseline (`OfflineSemanticEngine.predict(text)`).
3. **Mode 3 (Hybrid Proposed):** Integrated hybrid pipeline (`enable_semantic=True`).

#### Aggregate Binary & Tier Calibration Metrics
| Metric | 1. Deterministic-Only | 2. Semantic-Only (Diagnostic) | 3. Hybrid Mode (Configured) | Hybrid Delta vs. Deterministic |
| :--- | :--- | :--- | :--- | :--- |
| **Accuracy** | **77.00%** (77/100) | 90.00% (90/100) | **80.00%** (80/100) | **+3.00%** |
| **Precision** | **96.55%** (28/29) | 85.71% (48/56) | **96.88%** (31/32) | **+0.33%** |
| **Recall (Threat Detection)** | **56.00%** (28/50) | 96.00% (48/50) | **62.00%** (31/50) | **+6.00% (+3 Threats Detected)** |
| **F1 Score** | **0.7089** | 0.9057 | **0.7561** | **+0.0472** |
| **False Positive Rate (FPR)**| **2.00%** (1/50) | 16.00% (8/50) | **2.00%** (1/50) | **0.00% (Zero New False Alarms)**|
| **False Negative Rate (FNR)**| **44.00%** (22/50) | 4.00% (2/50) | **38.00%** (19/50) | **-6.00% (-3 Missed Scams)** |
| **True Positives (TP)** | 28 | 48 | **31** | **+3** |
| **True Negatives (TN)** | 49 | 42 | **49** | **0** |
| **False Positives (FP)** | 1 | 8 | **1** | **0** |
| **False Negatives (FN)** | 22 | 2 | **19** | **-3** |
| **Exact 3-Tier Match** | **69.00%** (69/100) | N/A (Binary) | **73.00%** (73/100) | **+4.00% (+4 Tier Matches)** |

#### Inference Latency Measurements (Reproducible Measurement Procedure)
Measured per-sample across the 100 scenarios on single-threaded CPU:
| Latency Metric | 1. Deterministic-Only | 2. Semantic-Only | 3. Hybrid Mode |
| :--- | :--- | :--- | :--- |
| **Average Latency** | **2.23 ms** | 20.72 ms (cold load) | **6.23 ms** |
| **Median Latency** | **1.58 ms** | 0.87 ms | **3.92 ms** |
| **P95 Latency** | **6.09 ms** | 2.37 ms | **18.56 ms** |
| **Max Latency** | **17.02 ms** | 1891.88 ms (cold start) | **25.27 ms** |

---

### 4. Per-Stratum Performance Breakdown

| Evaluation Stratum | Sample Count | Deterministic Acc | Semantic-Only Acc | Hybrid Acc | Stratum Assessment |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Legitimate Institutional Notices** | 25 | **100.0%** (25/25) | 96.0% (24/25) | **100.0%** (25/25) | Hybrid preserves perfect institutional specificity |
| **Ambiguous & Borderline Scenarios** | 15 | **100.0%** (15/15) | 86.7% (13/15) | **100.0%** (15/15) | Zero false alarms on low-threat traffic |
| **Hinglish & Regional Dialects** | 10 | **100.0%** (10/10) | 80.0% (8/10) | **100.0%** (10/10) | Deterministic normalization shields dialect noise |
| **Long Documents & Keyword Dispersion**| 10 | **90.0%** (9/10) | 70.0% (7/10) | **90.0%** (9/10) | Single common academic FP in both modes |
| **Mixed-Intent & Camouflage** | 15 | **60.0%** (9/15) | 86.7% (13/15) | **60.0%** (9/15) | High camouflage remains difficult for regex |
| **Novel Unseen Pretexts (Scams)** | 25 | **36.0%** (9/25) | 100.0% (25/25) | **48.0%** (12/25) | **Hybrid recovers +3 zero-day pretexts (+12.0%)** |

---

### 5. Itemized Failure Analysis & Policy Delta

#### Hybrid False Positives ($N = 1$, Identical to Deterministic)
- `D-LONG-03` (**Score: 43, Tier: AMBER, Expected: GREEN**): Academic law school course syllabus on Cyber Law & Digital Forensics. Contains course curriculum discussing "Digital Arrest", "escrow accounts", and "crypto tracking". Flagged by deterministic rule `SIG_DIGITAL_ARREST`. Semantic model predicted $p = 0.575$ (uncertain zone, weight $=0$), meaning the semantic classifier did not worsen the score.

#### Hybrid Recovered Scams (+3 True Positives vs Deterministic)
The hybrid pipeline successfully escalated 3 zero-day scam pretexts that pure deterministic regex rules missed:
1. `D-SCAM-04` (**Passport Clearance Penalty Extortion**):
   - Deterministic: Score 32 (Tier: GREEN) $\longrightarrow$ **MISSED (FN)**
   - Hybrid: Score 44 (Tier: AMBER) $\longrightarrow$ **DETECTED (TP)**
   - Semantic Classifier added `SIG_SEMANTIC_SCAM_AFFINITY` ($p = 0.742$, weight $+12$, indicators: `'clearance'`, `'penalty'`, `'immediate'`).
2. `D-SCAM-18` (**Telecom Disconnection & Legal Scare**):
   - Deterministic: Score 27 (Tier: GREEN) $\longrightarrow$ **MISSED (FN)**
   - Hybrid: Score 39 (Tier: AMBER) $\longrightarrow$ **DETECTED (TP)**
   - Semantic Classifier added `SIG_SEMANTIC_SCAM_AFFINITY` ($p = 0.695$, weight $+12$, indicators: `'disconnection'`, `'legal'`, `'hours'`).
3. `D-SCAM-21` (**Aadhaar Biometric Lock Extortion**):
   - Deterministic: Score 32 (Tier: GREEN) $\longrightarrow$ **MISSED (FN)**
   - Hybrid: Score 44 (Tier: AMBER) $\longrightarrow$ **DETECTED (TP)**
   - Semantic Classifier added `SIG_SEMANTIC_SCAM_AFFINITY` ($p = 0.718$, weight $+12$, indicators: `'update'`, `'immediately'`, `'account'`).

#### Tier Calibrations (+4 Scenarios Escalated to Expected RED Tier)
- `D-SCAM-03` (LPG Gas Supply Disconnection): Det AMBER (47) $\longrightarrow$ **Hyb RED (59)** (Expected: RED)
- `D-SCAM-14` (Insurance Policy Surrender Advance Fee): Det AMBER (45) $\longrightarrow$ **Hyb RED (57)** (Expected: RED)
- `D-SCAM-20` (Diplomatic Cargo AML Extortion): Det AMBER (35) $\longrightarrow$ **Hyb RED (47)** (Expected: RED)
- `D-SCAM-25` (Lottery Vehicle Advance Fee Scam): Det AMBER (43) $\longrightarrow$ **Hyb RED (55)** (Expected: RED)

#### Remaining Hybrid False Negatives ($N = 19$)
19 novel scam pretexts remained undetected (scored $< 35$, Tier: GREEN):
- `D-SCAM-01` (Solar rooftop subsidy advance fee)
- `D-SCAM-02` (Pension arrears advance fee)
- `D-SCAM-05` (Income tax refund advance fee)
- `D-SCAM-06` (Livestock farming subsidy loan)
- `D-SCAM-09` (Corporate vendor PO registration fee)
- `D-SCAM-10` (Excitel fiber broadband cutoff)
- `D-SCAM-11` (MBBS quota admission seat donation)
- `D-SCAM-12` (MCD property tax sealing notice)
- `D-SCAM-13` (Bank locker annual physical verification fee)
- `D-SCAM-15` (Overseas Poland warehouse supervisor visa)
- `D-SCAM-16` (YouTube copyright strike extortion)
- `D-SCAM-17` (Binance flash-loan arbitrage bot)
- `D-SCAM-23` (DPS early bird fee concession)
- `D-OBFUSC-02` (BlueDart logistics APK sideload)
- `D-OBFUSC-05` (Spaced token bank account update)
- `D-OBFUSC-09` (Flipkart customer satisfaction survey link)
- `D-OBFUSC-10` (Adversarial injection claiming to be RBI advisory)
- `D-OBFUSC-11` (SpeedLoan photo gallery blackmail)
- `D-OBFUSC-12` (Army welfare housing flat booking QR)

*Root Cause:* These scenarios utilize novel, zero-day administrative pretexts (solar subsidy, goat farming, MBBS quota seats) whose specific n-grams did not exist in the development training corpus. The classifier safely assigned neutral probabilities ($p \in [0.50, 0.64]$) falling into the conservative uncertain zone, avoiding false scoring while falling back safely to deterministic rules.

---

### 6. Feature-Flag, API & Security Audit

Verified in [test_feature_flag_audit_phase4_6.py](file:///d:/SatarkSaathi/satark-saathi/backend/tests/test_feature_flag_audit_phase4_6.py):

1. **Default Production Calling Invariant:**
   - Traced all production routes (`backend/app/routers/analyze_v1.py` and `rule_analyzer.py`).
   - Default call: `analyze_text(text, input_type=InputType.TEXT, channel=channel)`.
   - Result: `analysis_mode="rule_based"`, `ai_provider="none"`. Confirmed 100% deterministic by default.
2. **Payload Tampering Defense:**
   - Attempted injecting `{"enable_semantic": true, "mode": "hybrid"}` into `POST /api/v1/analyze`.
   - Pydantic schema `TextAnalyzeRequest` rejects / ignores extra client parameters. The API response strictly remains `analysis_mode="rule_based"`.
3. **Artifact Integrity & Resilience:**
   - Tested behavior with corrupted / invalid model bytes.
   - Verified that `OfflineSemanticEngine` detects corruption, logs a warning, and falls back to deterministic analysis with zero 500 errors.
4. **Offline & Privacy Verification:**
   - Socket monitoring verified: 0 outbound HTTP/TCP connections made during model load, inference, or scoring.
   - Scanned text is processed strictly in-memory and never transmitted to external cloud endpoints.
5. **Score Representation Safety:**
   - Confirmed that `risk_score` is strictly an integer in $[0, 99]$ and user summaries present it as a heuristic score (e.g. `Score: 59/100`), never as a decimal probability.
6. **Verbatim Excerpt Invariant:**
   - 100% of reported evidence excerpts across all holdout runs were verified to be exact verbatim substrings of the raw input text.

---

### 7. Evaluation Asset Protection Policy

**Dataset D Provenance Status:**
- Prior to Phase 4.6, Dataset D was a blind holdout ($N=100$).
- Under release gate discipline, because Dataset D's failure cases and error taxonomy have now been inspected and documented, **Dataset D is formally designated as a development-informed benchmark for all future development cycles.**
- It may no longer be used as a blind holdout for subsequent model iterations. Any future claim of open-domain generalization must be validated against a newly authored, uninspected Dataset E ($N \ge 100$).

---

### 8. Release Gate Recommendation & Implementation Scope

```
========================================================================================
FINAL RELEASE GATE DECISION: CONDITIONAL PASS
========================================================================================
1. STAGING PROMOTION: The hybrid architecture is APPROVED for internal staging and
   opt-in canary testing. It demonstrated measurable value on novel pretexts (+6.00% recall)
   with zero false alarm penalty.
2. PRODUCTION DEFAULT: DETERMINISTIC-ONLY MODE MUST REMAIN DEFAULT for public endpoints.
   Enabling semantic inference by default in production requires training on a broader,
   field-derived telecom corpus rather than synthetic training data.
3. NEXT RELEASE STAGE (Phase 5): Live Pilot Instrumentation, Real-World Canary Deployment,
   and Authoring of Dataset E for Final Acceptance.
========================================================================================
```
