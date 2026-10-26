# SATARK SAATHI — PHASE 4.2: GENERALIZATION, ROBUSTNESS & EVALUATION INTEGRITY REPORT

**Repository:** `D:\SatarkSaathi\satark-saathi`
**Date:** October 23, 2026
**Status:** In Active Development (Continuation of Phase 4 Upgrade Plan)
**Evaluation Scope:** Generalization Audit, Dataset Provenance Inspection, Out-of-Distribution Robustness Suite, ReDoS & Latency Safety

---

## 1. IMPLEMENTATION AUDIT FINDINGS

### 1.1 Category Matching, Scoring & Verdict Flow
We traced how inputs move from raw text to their final risk tier and verdict:
1. **Pre-processing:** `original_text = text.strip()`. Note: `normalize_text()` (NFKC + zero-width character stripping) exists in `backend/app/services/text_utils.py` but was not integrated directly into the input pipeline of `analyze_text()`, meaning zero-width character insertions (e.g., `c\u200bi\u200bb\u200bi\u200bl`) currently bypass standard ASCII word-boundary regexes.
2. **Category-Level Regex Matching:** Iterates over `SCAM_PATTERNS`. For each category, all regex patterns are evaluated with `re.search(pattern, original_text, re.IGNORECASE)`. If one or more match, the category's base `weight` is added along with a multi-match bonus (`min((len(matched_fragments) - 1) * 8, 20)`).
3. **Signal Construction:** The signal records `category = cat_data["title"]`, `reason_code = SIG_<CATEGORY>`, and `excerpt = matched_fragments[0]`.
4. **Tactic & Generic Pattern Matching:** Independent tactic matchers (`URGENCY_PATTERNS`, `SECRECY_PATTERNS`, `PAYMENT_DEMAND_PATTERNS`, `ADVERSARIAL_PATTERNS`, `SUSPICIOUS_URL_INDICATORS`) run in parallel. Critically, these signals are instantiated with `category = None`.
5. **Counter-Signal Reductions:** Iterates over `COUNTER_SIGNAL_PATTERNS` (helplines, standard bank transactions, delivery updates, casual greetings, official in-person visit instructions, security awareness advisories).
6. **Verdict Resolution (`_determine_verdict`):**
   - Filters positive signals for those having a non-null `category`.
   - Selects the highest-weighted category signal as the primary verdict.
   - If no category signals matched, evaluates generic tactics and returns cautious generic descriptors:
     - `ARTIFICIAL_URGENCY` -> `"Unverified Urgent Message"`
     - `SECRECY_DEMAND` -> `"Suspicious Confidentiality Request"`
     - Generic Coercive Payment -> `"Suspicious Coercive Payment Request"`
     - Generic Fallback -> `"Suspicious Communication"`
   - **Safety Invariant Verified:** Generic urgency, secrecy, authority, or payment language **cannot** alone produce an unjustified specific scam verdict (e.g., electricity bills).

### 1.2 Overlapping Categories & Signal Multipliers
- **Signal Multiplier Capping:** When multiple patterns in the same category match, the bonus is capped at +20 (`min((len - 1) * 8, 20)`). However, if an input matches *different* categories that share similar wording (e.g., both `DIGITAL_ARREST` and `COURIER_EXTORTION`), raw scores sum additively, which can push borderline cases into RED (50+).
- **Repetitive Keywords:** Identical repeated keywords (e.g., repeating `"URGENT"` 50 times) only match `re.search` once per pattern, successfully preventing score explosion on repetitive input.

### 1.3 Regex Performance & ReDoS Risks
We audited the regex patterns in `risk_engine.py` and `text_utils.py` for catastrophic backtracking (ReDoS).
- In `token_distance_pattern`, the quantifier `(?:\W+\w+){0,25}?\W+` uses a strictly bounded upper limit (`{0,25}?`), preventing exponential state-space explosions.
- Stress testing with a 102,609-character (100 KB) adversarial input completed in **264 ms**.
- A 51,285-character (50 KB) input completed in **130 ms**.
- All typical SMS/WhatsApp lengths (< 500 chars) execute in under **1.5 ms**.

---

## 2. DATASET PROVENANCE & INDEPENDENCE AUDIT

A critical goal of Phase 4.2 was establishing whether previously reported benchmark numbers reflect independent validation or development-cycle tuning.

### 2.1 Audit of the Frozen Challenge Dataset (`challenge_dataset.py`, N = 35)
- **Provenance:** Created during Phase 2/3 as an adversarial frozen challenge benchmark.
- **Independence Status:** **Not independent of Phase 4.1 development.** The 11 failure families identified in Phase 4 were specifically derived from inspecting the failure cases of this dataset.
- **Scientific Implication:** The 100% recall on this dataset is a **regression baseline confirmation**, proving that all targeted problem families were successfully implemented. It **must not** be cited as an unbiased estimate of real-world generalization.

### 2.2 Audit of Expansion Dataset B (`expansion_dataset.py`, N = 40)
- **Provenance:** Authored during Phase 4.1 to provide a broader development validation set.
- **Independence Status:** **Partially coupled to Phase 4.1 rule design.**
  - Textual analysis reveals direct lexical correspondences between several dataset scenarios and regex patterns introduced during the same phase (e.g., `EXP-SCAM-06` uses *"to our advisor"*, `EXP-SCAM-03` uses *"client conference"*, `EXP-SCAM-11` uses *"defence welfare qr"*).
  - During Phase 4.1 development, two samples (`EXP-SCAM-08` and `EXP-BENIGN-10`) were actively debugged and the regex engine was updated to accommodate them.
- **Scientific Implication:** Dataset B represents an **expanded unit/development benchmark**, not an independent out-of-distribution validation suite.

---

## 3. INDEPENDENT ROBUSTNESS SUITE (DATASET C, N = 50)

To establish an honest measure of real-world generalization, we constructed a separate, independently authored robustness suite: [backend/app/evaluation/robustness_dataset.py](file:///d:/SatarkSaathi/satark-saathi/backend/app/evaluation/robustness_dataset.py).

### 3.1 Design Principles
- Authored **without** referencing or modifying the regex definitions in `risk_engine.py`.
- Includes unseen emerging fraud vectors, legitimate public notices, subtle urgency without fraud, financial notifications without coercion, obfuscation/spacing variations, long documents with dispersed keywords, and boundary ambiguities.
- **Strict Invariant:** This dataset was evaluated as-is and was **not tuned against** to inflate scores.

### 3.2 Dataset Composition (N = 50)
1. **Novel Indirect Scams (12):** APK wedding invitations, Fastag toll blacklists, RWA society maintenance QR fraud, freelance translation deposit fraud, Steam gift card romance angles, e-challan sideloading camouflage, hotel rating VIP prepaid task escalation, India Post redirection links, eSIM swap takeover, predatory micro-loan contact blackmail, lucky scratch card registration fees, video morph sextortion.
2. **Legitimate Institutional Notices (12):** Airport final boarding calls, hospital emergency blood appeals, IMD cyclone disaster alerts, official income tax refund credits, mutual fund dividend payouts, corporate HR monthly payslip notices, power utility scheduled maintenance, telecom pack renewal, legitimate self-initiated password OTPs, university examination circulars, e-commerce delivery rider contacts, landlord rent confirmations.
3. **Urgent Non-Fraud & Financial Non-Coercive (8):** Urgent work meeting reschedules, school bus delay alerts, pharmacy prescription clarifications, library book overdue notices, quarterly savings interest credits, fixed deposit maturity notices, Zerodha contract notes, credit card statements.
4. **Obfuscation, Typos & Hinglish (6):** Typo-laden electricity threats, spaced-out bank KYC text, vernacular Hinglish SIM deactivations, Hinglish KBC lottery tax demands, Hinglish foreign parcel customs extortion, punctuation-dense collect PIN traps.
5. **Long Documents with Dispersed Keywords (4):** Corporate energy efficiency newsletter, university student conduct handbook, Bangkok travelogue & baggage rules, bank cyber security awareness circular.
6. **Ambiguous / Boundary Cases (4):** Unsolicited WhatsApp job pitch with Bitly link, friend small loan request, crypto investment Telegram invite with soft disclaimer, BlueDart rescheduling link.
7. **Adversarial Injection & Signal Stress (4):** Benign text with injected evasion instructions, malicious transfer with prompt shielding, repetitive urgency stress test, repetitive financial terms stress test.

---

## 4. COMPREHENSIVE BENCHMARK RESULTS

### 4.1 Performance Across All Three Evaluation Sets

| Metric | Frozen Challenge (Dataset A) | Expansion Dataset (Dataset B) | **Independent Robustness (Dataset C)** |
| :--- | :---: | :---: | :---: |
| **Total Samples (N)** | **35** | **40** | **50** |
| **Dataset Purpose** | Regression Frozen Benchmark | Extended Development Benchmark | **Unbiased Generalization Suite** |
| **True Positives (TP)** | 18 / 18 | 18 / 19 | **12 / 22** |
| **True Negatives (TN)** | 17 / 17 | 21 / 21 | **25 / 28** |
| **False Positives (FP)** | 0 / 17 | 0 / 21 | **3 / 28** |
| **False Negatives (FN)** | 0 / 18 | 1 / 19 | **10 / 22** |
| **Binary Accuracy** | **100.0%** (35/35) | **97.5%** (39/40) | **74.0%** (37/50) |
| **Precision** | **100.0%** (18/18) | **100.0%** (18/18) | **80.0%** (12/15) |
| **Recall** | **100.0%** (18/18) | **94.7%** (18/19) | **54.5%** (12/22) |
| **F1 Score** | **1.0000** | **0.9730** | **0.6486** |
| **False Positive Rate (FPR)** | **0.0%** (0/17) | **0.0%** (0/21) | **10.7%** (3/28) |
| **False Negative Rate (FNR)** | **0.0%** (0/18) | **5.3%** (1/19) | **45.5%** (10/22) |
| **Exact 3-Tier Match** | **88.6%** (31/35) | **90.0%** (36/40) | **64.0%** (32/50) |
| **Mean Evaluation Latency** | 0.95 ms | 1.12 ms | **1.21 ms** |

---

## 5. IN-DEPTH ERROR & FAILURE ANALYSIS (DATASET C)

Evaluating against Dataset C highlights the fundamental limitations of pure deterministic pattern matching when confronted with out-of-distribution social engineering.

### 5.1 False Positives (FP = 3 / 28)
1. **`ROB-BENIGN-09` — Self-Service Password Reset OTP:**
   - *Text:* `"491029 is your Amazon password reset OTP. Do not share this OTP with anyone. Amazon customer service will never call to ask for your OTP."`
   - *Verdict:* `OTP / PIN / Password Theft Attempt` (Score: 45, Tier: RED).
   - *Root Cause:* The warning `"Do not share this OTP with anyone"` matched `r"\b(share.{0,10}otp)\b"`. The regex lacked a negative lookbehind for `"do not share"` or an awareness of standard self-service authentication disclaimers.
2. **`ROB-LONG-04` — Bank Cyber Security Awareness Circular:**
   - *Text:* `"HDFC Bank Security Advisory: ... Remember that banks never ask you to share your OTP, netbanking password, or UPI PIN. If you suspect fraud, report to 1930."`
   - *Verdict:* `OTP / PIN / Password Theft Attempt` (Score: 42, Tier: AMBER).
   - *Root Cause:* Although the counter-signal `CTR_SECURITY_AWARENESS_ADVISORY` matched and reduced weight by 40, `OTP_THEFT` has weight 45. The residual score (45 - 40 = 5, plus tactic indicators) retained `OTP_THEFT` as the primary verdict.
3. **`ROB-LONG-03` — Travelogue & Foreign Baggage Guidance:**
   - *Text:* `"Travel Advisory for Bangkok Delegates: ... Customs regulations permit duty-free import of personal gifts... passport control..."`
   - *Verdict:* `Digital Arrest / Law Enforcement Impersonation` (Score: 35, Tier: AMBER).
   - *Root Cause:* The words `"customs"`, `"airport"`, and `"personal gifts"` in close proximity triggered an unintentional sub-clause match under the expanded extortion rules.

### 5.2 False Negatives (FN = 10 / 22)
Deterministic regex matching exhibited an expected 45.5% False Negative Rate on novel phrasing:
1. **Unseen Scams / Gift Tokens (`ROB-SCAM-05`):** Steam wallet cards requested in a romance pretext were not recognized because the gift-card rule strictly enumerated Apple, Amazon, and Google Play.
2. **Unseen Lexical Stems (`ROB-ROBUST-01`):** Typographical variants (`"bijli... disconct tonite... elec oficer"`) failed exact word-boundary regexes (`disconnect`, `officer`).
3. **Novel Domain TLDs & Schemes (`ROB-SCAM-02`, `ROB-SCAM-06`, `ROB-SCAM-08`):** Fastag toll blacklists, e-challans on `.site`, and postal address redirection on `.xyz` scored only 20-32 points (GREEN), failing to cross the AMBER threshold (35).
4. **Novel Pretexts (`ROB-SCAM-03`, `ROB-SCAM-04`, `ROB-SCAM-09`):** Housing society maintenance UPI QR fraud, freelance translation deposit scams, and eSIM swap activation traps lacked designated category signatures.

### 5.3 Category Confusions
- **`ROB-SCAM-11` (Scratch Card Lucky Draw):** Expected *Lottery / Prize Scam*, but predicted *Credit Score Repair / CIBIL Alteration Advance Fee* because the phrase `"deposit 1% processing charge ₹18,000"` matched the generic processing fee regex in the credit repair category.
- **`ROB-ROBUST-05` (Hinglish Foreign Parcel):** Expected *Customs Extortion*, but predicted *Digital Arrest* because the phrase `"Jail se bachne ke liye"` triggered the criminal arrest threat pattern.

---

## 6. REGRESSION AND SAFETY VERIFICATION

We executed the full suite of automated tests across backend and frontend:

| Test Suite | File | Tests Run | Result | Duration |
| :--- | :--- | :---: | :---: | :---: |
| **Phase 4.2 Robustness & Invariants** | `test_risk_engine_robustness.py` | 12 | **12 Passed** | 3.04s |
| **Phase 4.1 Focused Regression** | `test_risk_engine_phase4.py` | 24 | **24 Passed** | 3.60s |
| **Phase 2 Intelligence Suite** | `test_risk_engine_phase2.py` | 11 | **11 Passed** | 1.80s |
| **Phase 1.1 Security Suite** | `test_security_phase11.py` | 11 | **11 Passed** | 1.25s |
| **Phase 3 Integration Suite** | `test_phase3_integration.py` | 9 | **9 Passed** | 1.10s |
| **Prompt 3 Recovery Suite** | `test_prompt3.py` | 8 | **8 Passed** | 0.85s |
| **API Endpoints Suite** | `test_api.py` | 24 | **24 Passed** | 1.95s |
| **Gateway & Service Suite** | `test_gateways.py` | 13 | **13 Passed** | 0.90s |
| **Evaluation Suite** | `test_evaluation.py` | 4 | **4 Passed** | 0.45s |
| **Health Suite** | `test_health.py` | 4 | **4 Passed** | 0.35s |
| **Total Backend Test Suite** | `backend/tests/` | **120** | **120 Passed (0 Failures)** | **7.73s** |
| **Frontend Vitest Suite** | `frontend/src/tests/` | **8** | **8 Passed (0 Failures)** | **2.48s** |
| **Frontend Production Build** | `tsc -b && vite build` | 2515 modules | **Clean Build (Zero Errors)** | **1.79s** |

---

## 7. PRIORITIZED RECOMMENDATIONS FOR PHASE 4.3

Based on the findings of the Dataset C robustness evaluation:

1. **Negative Context Filters for Security Advisories:**
   - Update `OTP_THEFT` to require affirmative solicitation (`r"(?:send|share|tell|give)\s+(?:me\s+)?(?:the\s+)?otp"`) and add negative lookbehinds for warning language (`r"(?:do\s+not|never|will\s+never)\s+share\s+otp"`). This will directly eliminate the 2 false positives observed on legitimate bank/Amazon advisories.
2. **Input Normalization Integration:**
   - Connect `normalize_text()` directly into `analyze_text()` prior to regex evaluation, ensuring full-width and zero-width obfuscated text is decoded before matching.
3. **Phonetic & Typo Resilience (Fuzzy / Soundex Matching):**
   - Pure regexes fail when key terms are misspelled (`bijli -> bijlee`, `disconct -> disconnect`). Introduce lightweight Levenshtein or Double-Metaphone token matching for critical action words (`disconnect`, `officer`, `arrest`, `challan`).
4. **Generalization Over Rigid Vocabulary Lists:**
   - Instead of hardcoding specific gift cards (Apple, Amazon, Google Play), recognize general gift voucher structures (`[A-Za-z0-9]+\s+(?:gift\s+cards?|vouchers?|wallet\s+cards?)\s+worth\s+₹?\d+`).
5. **Preserve Evaluation Integrity:**
   - Keep Dataset C strictly frozen as an untouched benchmark. Use Dataset B for iterative development and tuning.
