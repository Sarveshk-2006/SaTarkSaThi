A review of the problem statement with recommended additions, risks and a phased plan.
This document contains recommendations for discussion. It is not legal, regulatory or financial advice.
Contents
1. Executive summary	3
2. Scope and approach	3
3. Where the proposal stands	4
3.1 What works well	4
3.2 Gaps to close	4
4. Summary of suggestions	6
5. Detailed suggestions	7
S1.  Pin down the intervention point and design for failure	7
S2.  Build a layered risk engine with tiers, reason codes and shadow mode	8
S3.  Check who the user thinks they are paying, and add external risk signals	8
S4.  Make the check-in coach-resistant and observer-aware	9
S5.  Separate conversation from decision and use template-first guardrails	9
S6.  Build a scam playbook library	10
S7.  Right-size the friction: explainable, respectful and adjustable	10
S8.  Make Family Shield consent-first and abuse-resistant	11
S9.  Add prevention before the payment moment	11
S10.  Align Golden Hour Mode with the official reporting channels	12
S11.  Validate the language and voice stack early	12
S12.  Add inclusive channels and accessibility	13
S13.  Build in privacy, DPDP alignment and fairness	13
S14.  Protect the brand and the channel	14
S15.  Define human escalation and incident handling	14
S16.  Build an evaluation suite and red-team it	15
S17.  Define the metrics and the measurement method	15
S18.  Add intelligence feeds and a learning loop	16
S19.  Scope a focused demo and storyline	16
S20.  Plan the pilot and partnerships	17
S21.  Keep a list of future options	17
6. Risks and mitigations	18
7. Suggested roadmap	18
8. Open questions for the team	19
Appendix A. Claim check	20
Appendix B. Glossary	22
Appendix C. Sources	22

1. Executive summary
This report reviews the problem statement (PS) and proposes 21 additions. Each has a rationale, practical steps, watch-outs and a completion test. Section 4 summarises them and Section 5 describes them in detail.
What the review found
The pause point must be exact. UPI payments are real time and, once authorised, cannot be reversed by the payer. The check-in therefore has to run before the UPI PIN is entered, or the payer’s bank has to enforce it before releasing the debit. The PS does not yet say which. (S1)
The scammer is often still present. Victims of digital-arrest and investment scams are coached live and may be on a video call or sharing their screen. A spoken check-in can be overheard, and self-reported answers can be scripted. The design needs a discreet mode, indirect questions, signals that do not depend on what the user says, and a delay that works even when the answers sound fine. (S3, S4)
The AI should talk; rules should decide. A transparent policy engine with tiers and reason codes should make the proceed, delay or escalate decision. The language model should handle conversation only, using approved messages for anything safety-critical. (S2, S5)
Some technology assumptions need checking. IBM’s documentation lists Hindi but not Marathi or Kannada for Watson Speech to Text. Granite Guardian was trained and tested on English only. The Granite 3.3 model card’s language list does not include Hindi, Marathi or Kannada. The language plan needs a validated fallback. (S11)
Family Shield needs safeguards. A trusted contact can be coerced, impersonated or abusive. Two-sided consent, minimal alerts and a delay on changing contacts are essential. (S8)
Privacy and fairness need design work. Active-call detection and a “senior-citizen account” trigger raise feasibility, consent and fairness questions under the DPDP Act and RBI’s AI guidance. (S13)
Evidence and metrics need tightening. The headline statistics and two IBM claims need citations or rewording, and “money saved” needs a defined measurement method. (S17, Appendix A)
Recommended first moves
1.	Put the pause point and the tier policy on paper (S1, S2).
2.	Test Marathi and Kannada speech and text with real samples, then restate the language scope (S11).
3.	Write the coach-resistant check-in for the top three scam types and add the payee-mismatch rule (S3, S4, S6).
4.	Source or reword every claim listed in Appendix A before the PS is shared again.
5.	Fix the demo storyline and the success metrics (S17, S19).
2. Scope and approach
What was reviewed. The PS (problem, proposed solution, IBM technology and impact) and the plain-language summary in eli5.md.
How. The PS was read end to end. Selected statements about IBM products and about Indian payment infrastructure and regulation were checked against public documentation on 22 October 2026 (sources in Appendix C). Suggestions were then derived from gaps in the proposal, common scam patterns and the practical constraints of UPI-based payments.
What was not done. The headline statistics and the descriptions of CyberWall and Safe Clicks were not independently verified. No IBM service was tested. This is not legal advice, and items that need legal or regulatory confirmation are flagged.
How to read the ratings
3. Where the proposal stands
3.1 What works well
Targets the real blind spot. It focuses on the customer-authorised payment, where verification tools and bank fraud rules are weakest.
Proactive, not self-service. It does not depend on the user suspecting a scam first.
Covers the whole journey. A risk trigger and check-in before payment, Family Shield during, and Golden Hour after.
Complements existing tools. It sits alongside CyberWall, I4C resources and bank systems instead of replacing them.
Human-centred. Local languages, a conversation instead of a click-through warning, and a trusted person suit the people the PS describes.
Names measurable outcomes. Payments intercepted, false-alarm rate and money saved give the project something to test.
3.2 Gaps to close
4. Summary of suggestions
All 21 suggestions at a glance. Ratings are explained in Section 2.
5. Detailed suggestions
Each suggestion uses the same layout: what to add, why it matters, how to do it, watch-outs and a completion test. Figure 1 shows where the suggestions sit in the payment journey.
Figure 1. Where the suggestions sit in the payment journey. Blue: before and at the payment. Teal: during the check-in and decision. Amber: after a loss.
Cross-cutting suggestions: S9 prevention, S12 accessibility, S13 privacy and fairness, S14 security, S16 to S18 evaluation and learning, and S19 to S21 delivery.
A.  Foundation and detection
S1.  Pin down the intervention point and design for failure
Theme: Foundation   |   Impact: High   |   Effort: Medium   |   Priority: P1 Do first
S2.  Build a layered risk engine with tiers, reason codes and shadow mode
Theme: Detection   |   Impact: High   |   Effort: High   |   Priority: P1 Do first
S3.  Check who the user thinks they are paying, and add external risk signals
Theme: Detection   |   Impact: High   |   Effort: Medium   |   Priority: P1 Do first
B.  The check-in conversation
S4.  Make the check-in coach-resistant and observer-aware
Theme: Conversation   |   Impact: High   |   Effort: Medium   |   Priority: P1 Do first
S5.  Separate conversation from decision and use template-first guardrails
Theme: Conversation   |   Impact: High   |   Effort: Medium   |   Priority: P1 Do first
S6.  Build a scam playbook library
Theme: Conversation   |   Impact: High   |   Effort: Medium   |   Priority: P1 Do first
S7.  Right-size the friction: explainable, respectful and adjustable
Theme: Experience   |   Impact: High   |   Effort: Medium   |   Priority: P2 Needed for pilot
C.  Family Shield and prevention
S8.  Make Family Shield consent-first and abuse-resistant
Theme: Family   |   Impact: High   |   Effort: Medium   |   Priority: P1 Do first
S9.  Add prevention before the payment moment
Theme: Prevention   |   Impact: Medium   |   Effort: Medium   |   Priority: P2 Needed for pilot
D.  Golden Hour Mode
S10.  Align Golden Hour Mode with the official reporting channels
Theme: Response   |   Impact: High   |   Effort: Medium   |   Priority: P1 Do first
E.  Language, voice and inclusion
S11.  Validate the language and voice stack early
Theme: Inclusion   |   Impact: High   |   Effort: Medium   |   Priority: P1 Do first
S12.  Add inclusive channels and accessibility
Theme: Inclusion   |   Impact: Medium   |   Effort: High   |   Priority: P2 Needed for pilot
F.  Trust, privacy and security
S13.  Build in privacy, DPDP alignment and fairness
Theme: Governance   |   Impact: High   |   Effort: Medium   |   Priority: P1 Do first
S14.  Protect the brand and the channel
Theme: Security   |   Impact: High   |   Effort: Medium   |   Priority: P2 Needed for pilot
S15.  Define human escalation and incident handling
Theme: Governance   |   Impact: Medium   |   Effort: Medium   |   Priority: P2 Needed for pilot
G.  Learning and evidence
S16.  Build an evaluation suite and red-team it
Theme: Quality   |   Impact: High   |   Effort: Medium   |   Priority: P2 Needed for pilot
S17.  Define the metrics and the measurement method
Theme: Evidence   |   Impact: High   |   Effort: Low   |   Priority: P1 Do first
S18.  Add intelligence feeds and a learning loop
Theme: Learning   |   Impact: Medium   |   Effort: High   |   Priority: P3 Later
H.  Delivery and adoption
S19.  Scope a focused demo and storyline
Theme: Delivery   |   Impact: High   |   Effort: Low   |   Priority: P1 Do first
S20.  Plan the pilot and partnerships
Theme: Delivery   |   Impact: High   |   Effort: Medium   |   Priority: P2 Needed for pilot
S21.  Keep a list of future options
Theme: Future   |   Impact: Medium   |   Effort: High   |   Priority: P3 Later
These options are worth recording now but should not distract from the P1 and P2 work.
6. Risks and mitigations
The main ways the project could fail or cause harm, with the suggestions that address each.
7. Suggested roadmap
A sequence of phases with exit criteria rather than dates. Each phase should end with an explicit go or no-go decision.
8. Open questions for the team
Decisions that would sharpen the scope and priorities above.
1.	Is this a prototype for a competition or demo, or a concept for a specific partner? This changes the scope in S19 and S20.
2.	Who is the first intended deployer: a bank, a UPI app or a police programme?
3.	Which two or three languages are non-negotiable for the first version, given the findings in S11?
4.	Will the team have access to any real or sample data, such as anonymised transactions or scam transcripts?
5.	Should the first version use an age-based trigger or an opt-in protection level (S7, S13)?
6.	Who will review the scam playbooks and regional-language messages (S6, S11)?
7.	Which IBM integrations will be claimed, and which can be demonstrated (Appendix A, row 9)?
8.	What would count as success for the first pilot, and what would make the team stop (S17, S20)?
Appendix A. Claim check
Status key: Supported means consistent with the sources reviewed. Partly supported, Needs validation and Needs check mean true in part or dependent on testing. Not confirmed means a source was looked for and not found. Not checked means this review did not verify the statement.
Appendix B. Glossary
Appendix C. Sources
Accessed on 22 October 2026. Items marked as secondary or not official are included for context and should be replaced with primary sources before external use.
1.	IBM Cloud Docs, “Next-generation languages and models” (Watson Speech to Text)
https://cloud.ibm.com/docs/speech-to-text?topic=speech-to-text-models-ng
2.	IBM Granite, granite-3.3-8b-instruct model card (Hugging Face)
https://huggingface.co/ibm-granite/granite-3.3-8b-instruct
3.	IBM Granite, granite-guardian-3.3-8b model card (Hugging Face)
https://huggingface.co/ibm-granite/granite-guardian-3.3-8b
4.	IBM, Safer Payments product page
https://www.ibm.com/products/safer-payments
5.	LinkedIn post on connecting watsonx Orchestrate with IBM Safer Payments (not an official IBM source)
https://www.linkedin.com/posts/dmweinst_what-if-your-fraud-operations-dashboard-could-activity-7432098946920976384-znoc
6.	Press Information Bureau, DPDP Rules, 2025 notified
https://pib.gov.in/PressReleasePage.aspx?PRID=2190014&reg=3&lang=1
7.	Sansa Legal, DPDP Act and Rules phased implementation timeline (secondary source)
https://www.sansalegal.com/post/dpdp-act-2023-and-rules-2025-phased-implementation-timeline-and-business-compliance-deadlines
8.	Press Information Bureau, DoT introduces the Financial Fraud Risk Indicator (FRI)
https://pib.gov.in/PressReleasePage.aspx?PRID=2130249
9.	RBI Innovation Hub, MuleHunter.ai documentation
https://docs.rbihub.in/mule-hunter
10.	NPCI, UPI Circle delegated payments, full delegation additional requirements
https://www.npci.org.in/uploads/UPI_OC_No_201_A_FY_2025_26_Introduction_of_UPI_Circle_Delegated_Payments_for_secondary_users_Full_Delegation_Additional_Requirements_ba7e414c1a.pdf
11.	RBI, FREE-AI Committee report page
https://www.rbi.org.in/Scripts/PublicationReportDetails.aspx?ID=1306
12.	RBI, FAQs on Storage of Payment System Data
https://www.rbi.org.in/CommonPerson/english/Scripts/FAQs.aspx?Id=2995
13.	I4C, National Cybercrime Reporting Portal information
https://i4c.mha.gov.in/ncrp.aspx
14.	National Cyber Crime Reporting Portal
https://cybercrime.gov.in/
15.	Digital India, UPI 123PAY
https://www.digitalindia.gov.in/initiative/upi-123pay/
16.	Ministry of Health and Family Welfare, Tele MANAS
https://telemanas.mohfw.gov.in/
17.	Business Standard, wrong UPI payments: what can and cannot be recovered (secondary source)
https://www.business-standard.com/finance/personal-finance/wrong-upi-payment-here-s-what-you-can-recover-and-what-you-can-t-126012900939_1.html

--- TABLE ---
SUGGESTIONS REPORT Satark Saathi Suggestions to strengthen the project An AI circuit-breaker that stops scams at the moment of payment

--- TABLE ---
Prepared for | Satark Saathi project team
Date | 22 October 2026
Status | Draft for team discussion
Based on | Documentation/PS.md (problem statement) and Documentation/eli5.md (plain-language summary), plus public sources checked on 22 October 2026 (Appendix C)

--- TABLE ---
Bottom line. The idea is well targeted and worth pursuing. It addresses the moment where existing checkers and bank fraud rules are weakest: a deceived customer authorising their own payment. To make it credible and buildable, the team should pin down where the pause happens, make the check-in resistant to a scammer who is still on the call, validate the language and voice stack, and tighten a few claims. None of this requires changing the core concept.

--- TABLE ---
Impact | How much the suggestion affects protection, safety or adoption: High, Medium or Low.
Effort | Relative size of the work: Low, Medium or High. No durations are implied.
P1  Do first | Shapes the design or credibility of the proposal. Address before building further or sharing the PS again.
P2  Needed for pilot | Required before a live trial with a partner.
P3  Later | Valuable at scale or once the core works.

--- TABLE ---
Gap in the current proposal | Why it matters | Addressed by
Where the hold happens is not defined. | A UPI payment is final once authorised, so a late hold protects no one. | S1
The scammer’s presence is not addressed. | Victims are coached, voices can be overheard and screens can be shared, so self-reported answers cannot be the only signal. | S3, S4
Decision logic is described only as proceed, cool off or escalate. | It needs thresholds, reason codes, an audit trail and a safe fallback. | S2, S5
Language and speech coverage is assumed. | Marathi and Kannada are not listed for Watson Speech to Text, and Granite Guardian is English only. | S11
Family Shield can be misused. | Contacts can be coerced, spoofed or abusive, and alerts can leak financial details. | S8
Some signals raise privacy and fairness questions. | Active-call detection and an age-based trigger need consent, feasibility checks and fairness testing. | S13
Some claims and statistics have no citation. | Credibility with judges, banks and regulators depends on sources. | Appendix A
Success metrics have no measurement method. | “Money saved” and “interception” need ground truth and a counterfactual. | S17
The route to adoption is undefined. | Banks and UPI apps must integrate, and regulators must be comfortable. | S19, S20

--- TABLE ---
ID | Suggestion | Theme | Impact | Effort | Priority
S1 | Pin down the intervention point and design for failure | Foundation | High | Medium | P1 Do first
S2 | Build a layered risk engine with tiers, reason codes and shadow mode | Detection | High | High | P1 Do first
S3 | Check who the user thinks they are paying, and add external risk signals | Detection | High | Medium | P1 Do first
S4 | Make the check-in coach-resistant and observer-aware | Conversation | High | Medium | P1 Do first
S5 | Separate conversation from decision and use template-first guardrails | Conversation | High | Medium | P1 Do first
S6 | Build a scam playbook library | Conversation | High | Medium | P1 Do first
S7 | Right-size the friction: explainable, respectful and adjustable | Experience | High | Medium | P2 Needed for pilot
S8 | Make Family Shield consent-first and abuse-resistant | Family | High | Medium | P1 Do first
S9 | Add prevention before the payment moment | Prevention | Medium | Medium | P2 Needed for pilot
S10 | Align Golden Hour Mode with the official reporting channels | Response | High | Medium | P1 Do first
S11 | Validate the language and voice stack early | Inclusion | High | Medium | P1 Do first
S12 | Add inclusive channels and accessibility | Inclusion | Medium | High | P2 Needed for pilot
S13 | Build in privacy, DPDP alignment and fairness | Governance | High | Medium | P1 Do first
S14 | Protect the brand and the channel | Security | High | Medium | P2 Needed for pilot
S15 | Define human escalation and incident handling | Governance | Medium | Medium | P2 Needed for pilot
S16 | Build an evaluation suite and red-team it | Quality | High | Medium | P2 Needed for pilot
S17 | Define the metrics and the measurement method | Evidence | High | Low | P1 Do first
S18 | Add intelligence feeds and a learning loop | Learning | Medium | High | P3 Later
S19 | Scope a focused demo and storyline | Delivery | High | Low | P1 Do first
S20 | Plan the pilot and partnerships | Delivery | High | Medium | P2 Needed for pilot
S21 | Keep a list of future options | Future | Medium | High | P3 Later

--- TABLE ---
1  Payment attempt before the UPI PIN is entered S1 | → | 2  Risk engine rules, payee checks, external signals S2, S3 | → | 3  Tier Green, Amber or Red S2, S7 | → | 4  Check-in discreet, coach-resistant, in the user’s language S4, S5, S6, S11
 |  |  |  |  |  | 
5  Policy engine the model converses; rules decide S5 | → | 6  Outcome proceed, delay or escalate S7, S15 | → | 7  Family alert trusted contact, with consent S8 | → | 8  Golden Hour if money is lost S10

--- TABLE ---
What to add | Decide exactly where Satark Saathi acts in the payment journey and what happens when it is unavailable. Realistic options are (a) inside the payer’s UPI or banking app, before the UPI PIN screen; (b) in the payer bank’s risk engine, which can decline or defer the debit with a reason code; or (c) both, with the bank-side check as a backstop.
Why it matters | A successful UPI payment is final from the payer’s side, so a hold applied after the PIN is entered protects no one. The PS says the transfer is “briefly held” but not where, by whom or for how long.
How to do it | Map the payment flow of the target app or bank and mark the last point at which a payment can still be paused cleanly. Treat the risk decision as a fast, synchronous call with a strict response-time budget, and the check-in as a separate session that follows it. Define degraded modes. If the AI service or network is unavailable, fall back to rules-only friction, such as a static warning and a short delay for Red-tier payments. Never approve silently, and never block every payment. Set a maximum hold time and say what the user sees when it ends: the payment completes, is cancelled or is escalated.
Watch-outs | The partner bank or app owns this decision, and any hold behaviour may need NPCI or RBI-aligned approval. A hold that is long or unexplained will push users to other apps.
Done when | A one-page sequence diagram, agreed with the partner, shows the hook point, time limits, fallback behaviour and who owns each step.

--- TABLE ---
What to add | Replace “high-risk signals” with a documented scoring approach. Start with transparent rules, add a learned model later, and output three tiers: Green (proceed), Amber (check-in) and Red (check-in plus delay, family alert or escalation). Every decision carries reason codes.
Why it matters | Reason codes make decisions explainable to users and auditors. Tiers keep friction proportionate. A rules-first approach can be built and tested before large data sets exist.
How to do it | Signals to consider: new or recently created payee; amount compared with the user’s history; first large transfer; bursts of payments; time of day; active remote-access or screen-sharing apps; recent SIM or device change; payee risk flags (S3); in-app behaviour such as repeated edits; and a protection level chosen by the user. For the demo, a rules table with thresholds and reason codes is enough. For a pilot, add a model only when labelled outcomes exist (S18). Run in shadow mode first: score real or replayed payments, log what Satark Saathi would have done, and compare with confirmed fraud and legitimate outcomes before any hold is enabled. Version every rule and model, and log inputs, outputs and reason codes for audit (S13).
Watch-outs | Do not use age alone as a trigger (S13). Signals that depend on device permissions, such as call state or installed apps, may be restricted by the operating system and by user consent. Validate them before relying on them.
Done when | A tier policy table exists with thresholds, actions and reason codes, and shadow-mode results on historical or synthetic data show an acceptable false-alarm rate.

--- TABLE ---
What to add | Add a payee-identity check. Compare the verified name of the payee with who the user says they are paying, and flag mismatches. Combine this with external risk signals about the payee’s phone number or account.
Why it matters | Impersonation scams hinge on a mismatch: a “police officer”, “bank official” or “trading platform” asking for money to a personal account. This is one of the few signals a coached victim cannot easily hide, because it does not depend on what they choose to say.
How to do it | Show the payee’s verified name prominently in the check-in and ask a plain question: “Who are you paying, and why?” Compare the answer with the payee type, such as an individual or a registered merchant, where the data is available. Define Red triggers as rules, for example a personal payee combined with a stated purpose such as a fine, “verification”, a “safe account”, a refundable deposit or guaranteed returns. Use external signals through the partner bank or app: the Department of Telecommunications’ Financial Fraud Risk Indicator (FRI), which rates mobile numbers as Medium, High or Very High risk and is shared with banks and UPI providers; mule-account detection such as RBI Innovation Hub’s MuleHunter.ai where the partner uses it; the partner’s own fraud data; and I4C or NCRP intelligence if access can be agreed.
Watch-outs | These feeds are reached through partners and agreements, not something a standalone project can assume. Free-text answers can mislead (S4), so treat the mismatch as one signal among several.
Done when | Mismatch rules and at least one external signal, real or mocked, feed the risk engine and appear as reason codes.

--- TABLE ---
What to add | Design for the case where the scammer is still on the line. The victim may repeat what they are told, a spoken check-in may be overheard, and a shared screen shows the AI’s wording.
Why it matters | Digital-arrest and investment scams depend on isolation and live coaching. A check-in that relies on honest, spoken self-reports is the easiest part of the system for a scammer to defeat.
How to do it | Offer a discreet mode: tap-based, text only, no audio, with neutral on-screen wording. Suggest it automatically when screen sharing, remote access or an active call is detected. Prefer indirect, open questions to yes or no questions, such as “What will you receive for this payment?”, “How did you get this account number?” and “Has anyone asked you to keep this payment private?” Look for inconsistencies with the payee and amount. Use signals that do not depend on answers: payee identity (S3), session and device indicators, timing, and behaviour such as long pauses or pasted text. Make the delay itself protective. A short cooling-off period works even when the user answers “everything is fine”, because scammer pressure relies on real-time urgency. Alert the trusted contact through a separate channel (S8) and offer a one-tap call to the bank’s official number. Keep user-facing explanations educational, such as why a pattern is risky, instead of exposing exact thresholds that teach evasion.
Watch-outs | Use calm wording. Telling a frightened victim to “hang up now” can provoke a conflict with the scammer. Something like “A real official will wait while you check” is safer. Test the scripts against real scam patterns.
Done when | The check-in script has been tested by someone playing a coached victim and still escalates the intended share of high-risk cases.

--- TABLE ---
What to add | Let the language model handle conversation (understanding, empathy, clarifying questions). Let a deterministic policy engine decide whether to proceed, delay or escalate, and use pre-approved message templates for safety-critical statements.
Why it matters | Free-form generation can hallucinate, be manipulated through prompt injection or give inconsistent advice. Granite Guardian offers checks for harm, jailbreaking, groundedness and function-call hallucination, and supports custom criteria. But its model card says it was trained and tested on English only, and that custom criteria need testing. It is not by itself a verifier of scam advice in Hindi, Marathi or Kannada.
How to do it | Have the model return structured fields, such as detected scam type, claimed payee and confidence, that feed the policy engine. The engine picks the action and the template. Write safety-critical messages in advance, have native speakers review them in each language, and let the model select and personalise them rather than invent advice. Ground explanatory text in the curated playbooks (S6). Use Granite Guardian groundedness and custom-criteria checks (in English, or after translation) as one layer next to deterministic filters. Set hard rules: never ask for or accept a UPI PIN, OTP, card number or password; never claim to be a bank or police official; never tell a user that a payment is “safe”. Treat all user text and transcripts as untrusted input, and limit what tools the agent can call.
Watch-outs | The Guardian model card describes the main models as suited to moderate cost and latency uses such as spot-checking, and points to a smaller model for tighter latency budgets. Check latency for a live conversation. Do not show Guardian reasoning traces to users; the model card says they may be inaccurate.
Done when | A test shows that the policy engine’s decision is unchanged by prompt-injection attempts, and that every safety-critical message comes from an approved template.

--- TABLE ---
What to add | A maintained knowledge base of scam types. Each entry holds red flags, tailored questions, the recommended action per tier and approved messages in each supported language.
Why it matters | The PS names investment scams, digital arrest and fixed-return promises. Real traffic includes more. Playbooks make the check-in specific instead of generic, can be reviewed by police and bank staff, and give the model and the guard checks something to ground against.
How to do it | Start with the three patterns the PS cites: impersonation of officials (digital arrest), fake investment or trading platforms, and fixed-return promises. Add later: task or part-time-job scams, fake KYC or utility-bill threats, fake customer-care numbers, refund or collect-request tricks, loan-app harassment, sextortion, and relative-in-distress or voice-clone calls. For each playbook, record the triggers, five to seven questions, red flags, what a legitimate version looks like, the next action by tier, and the Golden Hour hooks (S10). Review with police cyber cells and bank fraud teams. Version and date each playbook, and update it as new scripts appear (S18).
Watch-outs | Do not publish detailed detection logic; scammers adapt. Keep a regular review cycle.
Done when | Three playbooks are complete in two languages and have been reviewed by a domain expert.

--- TABLE ---
What to add | Make the experience proportionate and understandable, with trusted-payee lists, adjustable protection levels and a business mode.
Why it matters | Too many false alarms train users to click through. Too few let scams pass. Small merchants and frequent payers have unusual but legitimate patterns.
How to do it | Tier the friction: Green passes silently, Amber is a short check-in, Red adds a delay and a family alert. Explain each pause in one or two plain sentences, such as “You are paying a new account for the first time, and the amount is much higher than usual.” Use a positive tone (“Let’s double-check together”) and offer clear exits: cancel, pay later, or call someone I trust. Build a trusted-payee list from payment history and user choice to cut repeat alerts. Add a business profile that learns normal supplier and customer patterns for merchants. Let users choose a protection level at onboarding (standard or extra) instead of applying an age-based default. Track overrides and later outcomes to tune thresholds.
Watch-outs | Overrides must stay possible, because blocking a legitimate payment has a real cost. Avoid wording that blames or frightens the user.
Done when | In testing, Amber check-ins fit the 30-second target and the trusted-payee list measurably reduces repeat false alarms.

--- TABLE ---
What to add | A trusted-contact flow that needs opt-in from both the user and the contact, shares only what is needed, resists abuse and hijacking, and has a fallback when the contact cannot be reached.
Why it matters | Breaking a victim’s isolation is one of the strongest ideas in the PS. But the contact channel can itself be exploited: a scammer can pressure a victim into adding the scammer’s number, an abusive relative could use alerts to control someone, and alerts can leak financial details.
How to do it | Require two-sided consent. The contact accepts an in-app invitation, and either side can revoke it at any time. Delay and announce changes. A new contact becomes active only after a waiting period, and the user and existing contacts are told. Share the minimum: “Asha is trying to send a large payment to a new account and may be under pressure. Please call her now.” Include amounts or payee details only if the user has agreed. Give the contact simple tools: a short list of questions to ask, a one-tap call, and a way to ask for a longer hold. Provide fallbacks. If nobody answers, offer a callback from the bank’s verified helpline, another contact, or a waiting period. Use NPCI’s UPI Circle as a reference point. Under partial delegation the primary user approves a secondary user’s payments with their own UPI PIN. For a senior paying from their own account the direction is reversed, so an approval flow would need to be built in the app or agreed with NPCI and the bank.
Watch-outs | Consider coercive control and domestic abuse. Do not make family approval mandatory for adults who have not chosen it, and protect the user’s dignity and autonomy.
Done when | Coerced enrolment, spoofed contacts and abusive contacts have been threat-modelled with documented mitigations, and the flow has been walked through in at least one user-research session.

--- TABLE ---
What to add | Light-touch features that reduce the chance of ever reaching the payment step.
Why it matters | People are most receptive before an incident, and the earlier the nudge, the less pressure there is.
How to do it | A short “protect my family” setup: add a trusted contact (S8), choose a protection level, and practise a simulated scam call. Brief lessons in the user’s language that show how common scam scripts work before the user meets them (sometimes called prebunking). An optional family code word for “relative in trouble” calls, which also helps against voice-cloned calls. Timely reminders when a new script is circulating or during seasons when specific scams spike.
Watch-outs | Keep lessons short and voluntary, and avoid fear-based framing.
Done when | Onboarding completion and short scenario-quiz results are tracked.

--- TABLE ---
What to add | Make Golden Hour Mode a guided, time-aware flow that follows the official routes: call the national cybercrime helpline 1930, file on cybercrime.gov.in, and inform the bank, with a pre-filled complaint pack.
Why it matters | I4C describes the Citizen Financial Cyber Fraud Reporting and Management System, reached through 1930, as connecting police with banks and payment intermediaries so that defrauded money can be intercepted. Speed matters. Victims in shock often do not know what to collect or whom to call first.
How to do it | Show a visible timer and a three-step checklist: call 1930, notify the bank and ask for a block or hold, then complete the complaint online. With consent, collect the transaction reference (UTR), date and time, amount, payer account, payee name or UPI ID, phone numbers, app names, links and screenshots. Produce a clear timeline as text and PDF. Give a short script in the user’s language for what to say on the 1930 and bank calls. Track status (called, complaint number received, bank reference) and send reminders to follow up. After the incident, warn about “fund-recovery” scams that target earlier victims, guide the user to secure accounts (change passwords, remove remote-access apps, check the SIM) and link to wellbeing support such as Tele-MANAS (toll-free 14416).
Watch-outs | Promise speed, not outcomes: freezing funds is not guaranteed. Check which formats the portal and banks accept. The project can prepare information, but it may not be able to file for the user without their authorisation.
Done when | A user can reach a complete, correct report pack in a few taps, and a domain expert confirms that the steps match current official procedure.

--- TABLE ---
What to add | Test Hindi, Marathi, Kannada and English speech and text end to end, including mixed-language speech (for example Hindi with English), regional accents and noisy surroundings, before committing to the stack.
Why it matters | IBM’s next-generation Watson Speech to Text model list shows Hindi (India) and English (India) telephony models but no Marathi or Kannada; the page was last updated on 17 February 2025. The Granite 3.3 8B Instruct model card lists English, German, Spanish, French, Japanese, Portuguese, Arabic, Czech, Italian, Korean, Dutch and Chinese, and says users may fine-tune for other languages. Granite Guardian was trained and tested on English only. Newer Granite releases exist and were not reviewed.
How to do it | Collect small test sets of real or scripted speech in each language, including mixed-language and noisy samples. Measure word error rate and whether the intent was understood. Confirm current coverage with IBM. If gaps remain, evaluate alternatives such as Indian-language speech and translation services (for example the Government of India’s Bhashini platform or AI4Bharat’s open models; check coverage, licences and fit) or fine-tuning. Where a model cannot be trusted in a language, constrain it: choose from approved templates (S5), or use a text and tap flow. Track quality per language and release a language only when it passes an agreed threshold.
Watch-outs | Dialect, tone and honorifics matter in sensitive conversations, so use native-speaker reviewers. Do not promise languages in the PS that have not been validated.
Done when | Each launch language has a measured accuracy report and a documented fallback, and the PS wording matches what was validated.

--- TABLE ---
What to add | Make the check-in usable by people with low literacy, low vision, hearing difficulty, weak connectivity or basic phones.
Why it matters | The PS targets senior citizens, first-time digital users, students and small merchants. Many will rely on voice, large text or non-smartphone channels.
How to do it | Voice-first with read-aloud text, adjustable speed, large fonts, high contrast, screen-reader labels and captions for audio. Avoid time pressure inside the check-in itself. A low-bandwidth mode with a text fallback. In a later phase, extend to feature-phone users through the channels NPCI supports under UPI 123PAY (IVR calls, missed calls and others), where the partner offers them. Test with older adults and with accessibility specialists.
Watch-outs | Voice raises privacy exposure in public places, so always offer a silent mode (S4).
Done when | An accessibility checklist passes for the app screens, and usability testing with older adults meets the agreed task-success targets.

--- TABLE ---
What to add | Design privacy, consent and fairness into the product from the start, and map them to the DPDP Act, RBI’s guidance on AI and RBI’s data-storage rules.
Why it matters | The PS says the design is consent-based and aligned with the DPDP Act, and a reviewer will ask how. Call state, device data, voice recordings and family contacts are all sensitive. The DPDP Rules, 2025 were notified on 14 November 2025 and are being phased in; secondary sources report that the consent-manager provisions start on 13 November 2026 and the main obligations follow a longer transition. RBI’s FREE-AI Committee report (13 August 2025) sets out principles for responsible AI in finance. RBI’s 2018 directive on storage of payment-system data requires such data to be stored only in India.
How to do it | Write a purpose-limited data map: what is collected, why, where it is processed (on the device or on a server), and how long it is kept. Use plain-language, standalone consent notices in the user’s language, with granular and revocable consent for audio, family alerts and evidence capture. Handle minors separately. Process sensitive signals on the device and send only risk flags where feasible. Do not keep raw audio unless the user opts in, and redact PINs, OTPs and ID numbers from transcripts. Replace age-based triggers with a protection level the user chooses, plus behavioural risk. Compare outcomes across age, gender, language and region to detect uneven false-alarm rates. Keep audit logs of decisions and model versions, give users a way to contest or comment on a hold, and name an accountable owner. Confirm which IBM Cloud region would host any payment data, and get legal review of the lawful basis, breach handling and any sharing with police cyber cells.
Watch-outs | Timelines are still being phased in. Confirm current obligations at the time of the pilot.
Done when | A short privacy and fairness assessment exists, has been reviewed by counsel, and its actions are tracked.

--- TABLE ---
What to add | Prevent scammers from imitating Satark Saathi, and threat-model the system itself.
Why it matters | A trusted protection brand is attractive to impersonate: a fake “Satark Saathi” call or SMS could manufacture exactly the trust the product is meant to break. The system also adds attack surfaces such as prompt injection, spoofed trusted contacts and replayed approvals.
How to do it | Set a public rule: the check-in lives only inside the official app. It never phones, never sends links by SMS or WhatsApp asking for action, and never asks for a PIN or OTP. State it during onboarding and in every Amber and Red message. Authenticate every message to trusted contacts inside the app, not by SMS alone. Run a threat model using a recognised checklist such as the OWASP Top 10 for LLM Applications. Add rate limits, abuse monitoring, signed requests between components, secret management and least-privilege tool access for the agent. Prepare an incident playbook for brand abuse, including takedown requests and public advisories.
Watch-outs | Avoid describing detection logic in public material.
Done when | The threat model has been reviewed and the demo components have passed a basic red-team test.

--- TABLE ---
What to add | A defined path to humans: a bank fraud-desk callback for Red cases, a reviewer queue for ambiguous cases, and the ability to switch features off.
Why it matters | Some situations, such as a distressed user, a very large amount or an unusual pattern, deserve a person. Banks and regulators will expect accountability and an off switch.
How to do it | Decide who the human is (bank staff or a partner call centre), when they are triggered, what they say and their hours. Keep a review queue with service levels, a switch that can disable a rule, language or partner, and an incident review after each missed scam or wrongful hold. Train staff on the playbooks (S6) and the user-facing wording.
Watch-outs | Callback numbers must be official and verifiable in the app (S14). Staffing cost grows with volume, so size escalation carefully.
Done when | Escalation paths and the off switch have been tested in drills.

--- TABLE ---
What to add | A repeatable test set and process that measures the check-in and policy engine before every release.
Why it matters | Safety and accuracy claims need evidence, and multilingual, adversarial conversations are where such systems tend to fail.
How to do it | Gold set: scripted multi-turn conversations per scam type and language, labelled with the expected tier and action. Include legitimate look-alikes, such as paying a real doctor, broker or relative. Adversarial set: coached users, prompt-injection attempts, evasive answers and background voices. Metrics: correct-tier rate, missed-scam rate, false-alarm rate, template adherence, word error rate per language, harmful-advice rate and latency. Automate as regression tests, add human review, and red-team with people outside the build team.
Watch-outs | Synthetic data can flatter performance. Refresh the set with realistic scripts reviewed by experts (S6).
Done when | The suite runs on every change with agreed pass and fail thresholds.

--- TABLE ---
What to add | Define each success measure precisely, where ground truth comes from, and how impact will be estimated.
Why it matters | The PS names risky payments intercepted, false-alarm rate and money saved. Without definitions, “money saved” will be disputed, because a stopped payment is not automatically a prevented loss.
How to do it | Example definitions: interception rate = confirmed-scam attempts stopped or cancelled ÷ all confirmed-scam attempts. False-alarm rate = legitimate payments interrupted ÷ all legitimate payments, and separately the share of Amber and Red check-ins that proved legitimate. Also track added friction (median time added), override rate, time to report in Golden Hour, and gaps across language, age and region. Ground truth comes from user, bank or complaint confirmation. Report ranges where it is uncertain. Estimate impact with shadow-mode comparison on historical data, then a staged rollout. Avoid withholding protection from some users purely for measurement. For “money saved”, count only amounts for payments that were stopped and later judged to be scams, and adjust for the chance the victim would have paid by another route. Publish the method.
Watch-outs | Do not claim causal savings from raw counts. Label estimates clearly.
Done when | A metrics sheet with definitions and data sources has been agreed with the partner.

--- TABLE ---
What to add | Feed outcomes back into the system: which holds were confirmed scams, which were legitimate, and which new scripts appeared.
Why it matters | Scam scripts change quickly and static rules age. A feedback loop improves accuracy and reduces false alarms over time.
How to do it | Capture outcome labels: user-confirmed, bank-confirmed, complaint filed, or payment completed with no later report. Review a sample with analysts on a regular cadence to update playbooks and rules (S6, S2). Retrain models only through governed releases. Where partners allow, share aggregated, anonymised patterns with banks and cyber cells. If user-reported payees are used, add abuse controls so that innocent people are not wrongly flagged. Monitor drift by scam type, language and region.
Watch-outs | Avoid feedback loops that entrench bias, for example flagging more users from areas that report more. Share only lawful, minimised data.
Done when | A labelled outcomes dataset and a change-control process exist.

--- TABLE ---
What to add | A narrow, end-to-end demonstration that proves the core idea convincingly, with clear mock-ups where real integrations are not possible.
Why it matters | Reviewers remember one believable story more than a long feature list. Several integrations, such as the payment hook, bank feeds and 1930, cannot be live in a prototype.
How to do it | Scenario: a senior receives a video call from a “CBI officer” who says to move money, then opens a mock UPI app to pay a new payee. Show the risk tier with reason codes, the discreet check-in, the Red-tier delay, the trusted-contact alert, and the Golden Hour pack after a simulated loss. Use the IBM stack where feasible (watsonx Orchestrate for the workflow, Granite on watsonx.ai for conversation, Granite Guardian for checks). Mock the UPI app, payee feeds and call detection, and use synthetic data. State plainly what is real and what is simulated, and show measured results from the evaluation suite on test conversations (S16). Prepare a recorded fallback and one slide on what could go wrong, showing awareness of S1 and S4.
Watch-outs | Demonstrate only languages that have been validated (S11).
Done when | A scripted demo of a few minutes runs reliably end to end, and the team can answer “what is real and what is mocked?”

--- TABLE ---
What to add | A staged route from prototype to live use with one partner, with go and no-go criteria at each stage.
Why it matters | The PS assumes adoption by banks, UPI apps and police cyber cells. Each needs a clear reason, a low-risk first step and regulator comfort.
How to do it | Stage 1: shadow mode with one bank or UPI app on historical or replayed data, with no user impact. Stage 2: advisory mode for volunteers, such as family pairs. The check-in appears but cannot hold payments. Stage 3: enforced holds for the Red tier only, with human escalation and an off switch. Stage 4: expand languages, segments and partners. Engage RBI and NPCI early and ask about sandbox routes. Involve police cyber cells in playbook review and escalation, and involve senior-citizen and consumer organisations. Build the business case: expected losses avoided against running cost and the cost of false alarms, with pricing options such as per protected user, per intervention or sponsored.
Watch-outs | Pilot ethics: informed consent, a clear opt-out and support for anyone harmed.
Done when | A one-page pilot charter exists with scope, metrics (S17), safeguards and exit criteria.

--- TABLE ---
Option | Why it could matter | Prerequisite
Voice-clone and deepfake awareness | Scammers can imitate relatives or officials by voice or video. A family code word gives a check that does not rely on detection. | A simple code-word flow (S9); detection research later.
Aggregated insight dashboards for banks and cyber cells | Show hotspots and trending scripts without exposing individuals. | Anonymisation and data-sharing agreements (S13, S18).
SDK or API for third-party apps | Lets more apps embed the check-in with the same safeguards. | A stable policy engine, a sandbox and partner onboarding (S1, S2).
Community “digital saathi” volunteers | Gives seniors a local, human contact alongside family and the bank. | Training, vetting and partnerships with NGOs or local bodies.
Telecom signals through official channels | Early warnings about suspicious numbers or calls beyond bank data. | A formal agreement with the relevant authority and a privacy review (S13).
Regulator-facing audit reports | Show how decisions were made and how the system performs across groups. | Audit logs and fairness tests (S13, S16).

--- TABLE ---
Risk | Likelihood | Impact | Mitigation | Suggestions
Payment completes before the hold takes effect | Medium | High | Place the hook before PIN entry, add a bank-side backstop, and test end to end with the partner. | S1
A scammer coaches or observes the check-in | High | High | Offer a discreet mode, ask indirect questions, use payee-based signals, add a delay and alert family out of band. | S3, S4
Too many false alarms; users click through or abandon | High | High | Tier the friction, maintain trusted payees, tune in shadow mode and track overrides. | S2, S7, S17
Weak Marathi or Kannada speech and text support | High | High | Validate early, plan fallbacks, use template-first messages and restate the scope. | S5, S11
Wrong or harmful advice from the model | Medium | High | Separate conversation from decision, use approved templates and guard checks, and red-team. | S5, S16
Privacy or regulatory exposure (DPDP, RBI data rules) | Medium | High | Create a data map, design consent, process signals on the device, host in India and get legal review. | S13
Family Shield is misused (coercion, spoofing, abuse) | Medium | High | Require two-sided consent, delay contact changes and share minimal information. | S8
Scammers impersonate the Satark Saathi brand | Medium | High | Keep the check-in in the official app only, publish the rule and threat-model the system. | S14
No clear route to adoption | Medium | High | Work with one partner, stage the pilot and engage regulators early. | S19, S20
Over-claiming in the PS (statistics, IBM integrations) | Medium | Medium | Source or reword each claim. | Appendix A
Unfair outcomes (age-based triggers, language gaps) | Medium | Medium | Use opt-in protection levels and test outcomes by group. | S13, S16
External feeds (FRI, mule detection, I4C data) are unavailable | Medium | Medium | Design for partner-provided signals, mock them in the demo and fall back to internal signals. | S3, S18

--- TABLE ---
Phase | Focus | Includes | Exit criteria
Phase 0 Prototype and demo | Show the core idea end to end with honest labelling of what is mocked. | S1, S2 (tier table), S3 (mocked feeds), S4, S5, S6 (top three), S8 (basic), S10, S11 (validated languages only), S17 (definitions), S19. | The scripted demo runs end to end. Every claim in the PS is sourced or reworded. The language scope matches validated results.
Phase 1 Shadow-mode pilot (no user impact) | Learn what the system would have done on real or replayed payments. | S2 (full engine), S3 (live feeds), S13, S14, S16, S17, S20 (pilot charter). | Agreed miss and false-alarm rates in shadow mode. Privacy and security reviews complete. Partner agrees to the next phase.
Phase 2 Advisory pilot (volunteers, no holds) | Test the conversation, family flow and Golden Hour with real people. | S7, S8 (full), S9, S12, S15. | No safety incidents. Check-ins fit the time target. Override and report metrics reviewed. Accessibility testing passed.
Phase 3 Enforced Red tier and scale | Hold the highest-risk payments and extend to more languages and partners. | S18, S20 (expansion), S21. | An acceptable interception and false-alarm trade-off for the partner and regulator. Escalation and off switch tested. Business case confirmed.

--- TABLE ---
# | Statement | What the review found | Status | Suggested action
1 | “21.7 lakh cyber-fraud complaints and Rs 19,800 crore lost in 2025 (I4C)” | Not checked in this review. | Not checked | Cite the exact I4C or MHA publication and date, and state the period and unit.
2 | “Fake investment schemes caused about 77% of these losses” | Not checked in this review. | Not checked | Cite the source and say whether the share is of losses or of complaints.
3 | “Digital arrest scams crossed 1.2 lakh cases in 2024” | Not checked in this review. | Not checked | Cite an official figure and date.
4 | “Roughly three of every four rupees lost are never recovered” | Not checked in this review. | Not checked | Cite the source and define “recovered”.
5 | “Kerala Police’s CyberWall and Indore Police’s Safe Clicks” | Not checked in this review. | Not checked | Confirm names, scope and links, and describe what each tool does.
6 | “Watson Speech to Text enables voice-first use” in Hindi, Marathi, Kannada and English | IBM’s next-generation model list (page last updated 17 February 2025) includes Hindi (India) and English (India) telephony models but does not list Marathi or Kannada. | Partly supported | Re-test, then restate the language scope or add a fallback (S11).
7 | “watsonx.ai with Granite models conducts the check-in” in those languages | The Granite 3.3 8B Instruct model card lists 12 supported languages (English, German, Spanish, French, Japanese, Portuguese, Arabic, Czech, Italian, Korean, Dutch, Chinese) and says users may fine-tune for others. Newer Granite releases were not reviewed. | Needs validation | Test Indian-language quality on the current model. Plan fine-tuning or template-first messages (S5, S11).
8 | “Granite Guardian guards against harmful or incorrect advice” | The model card lists checks for harm, social bias, jailbreaking, violence, profanity, sexual content, unethical behaviour, harm engagement and evasiveness, plus groundedness, context relevance and answer relevance for retrieval, and function-call hallucination for agents. Custom criteria are supported but need testing. It was trained and tested on English only. | Partly supported | Reword to “screens for harmful content and unsupported claims, with custom scam-advice criteria”, and plan for non-English use (S5).
9 | “IBM Safer Payments, which IBM already pairs with watsonx Orchestrate to stop customer-authorised payment scams” | The Safer Payments page describes real-time fraud prevention for card, real-time and mobile payments and lists “Agentic AI for fraud detection”. No official IBM source describing this exact pairing for customer-authorised scams was found. A LinkedIn post mentions connecting watsonx Orchestrate with Safer Payments to improve fraud-investigation efficiency. | Not confirmed | Cite an official IBM source or reword to “can be integrated with” (S20).
10 | “The design is consent-based and aligned with India’s DPDP Act” | The DPDP Rules, 2025 were notified on 14 November 2025 (PIB) and are being phased in. Secondary sources report consent-manager provisions from 13 November 2026 and the main obligations after a longer transition. | Supported (context) | Add a concrete consent and data-handling design, and confirm dates with counsel (S13).
11 | “1930, cybercrime.gov.in and their bank within the critical first hour, when funds can still be frozen” | I4C describes 1930 and CFCFRMS as connecting police with banks and payment intermediaries for real-time intervention. Success depends on speed and on where the money has moved. | Supported with caveat | Say “as soon as possible, ideally within the first hour” and avoid implying that funds are always frozen (S10).
12 | “IBM Cloud hosts the solution” | RBI’s 2018 directive on storage of payment-system data requires payment data to be stored only in India. | Needs check | Confirm the hosting region and data residency for any payment data handled (S13).
13 | Used in S3, not in the PS: officials do not demand payments through calls or personal UPI IDs | Not checked in this review. | Not checked | Find and cite the official advisory before using it in public material.
14 | Design assumption in S1: a UPI payment cannot be reversed once authorised | Secondary sources consistently describe successful UPI payments as final, with recovery depending on the dispute process and the recipient’s cooperation. This was not checked against NPCI’s primary text. | Supported (secondary) | Confirm with NPCI documentation and the partner bank (S1).

--- TABLE ---
Term | Meaning
APP fraud | Authorised push payment fraud: the victim authorises the payment themselves because they have been deceived.
CFCFRMS | Citizen Financial Cyber Fraud Reporting and Management System, run by I4C and reached through helpline 1930. It connects police with banks and payment intermediaries.
Cooling-off period | A short enforced delay before a payment completes.
DPDP Act | Digital Personal Data Protection Act, 2023, supported by the DPDP Rules, 2025.
FRI | Financial Fraud Risk Indicator from the Department of Telecommunications. It rates mobile numbers as Medium, High or Very High risk of financial fraud.
Granite Guardian | IBM’s family of safety models that judge prompts and responses against risk criteria.
I4C | Indian Cyber Crime Coordination Centre, under the Ministry of Home Affairs.
Mule account | A bank account used to receive and move the proceeds of fraud.
MuleHunter.ai | An AI and machine-learning model from the RBI Innovation Hub for detecting mule accounts.
NCRP | National Cyber Crime Reporting Portal (cybercrime.gov.in).
NPCI | National Payments Corporation of India, which operates UPI.
Prebunking | Teaching people how manipulation tactics work before they meet them.
Reason code | A short, standard label that explains why a decision was made.
Shadow mode | Running a system in parallel without affecting users, to measure what it would have done.
UPI | Unified Payments Interface, India’s real-time payment system.
UTR | Unique transaction reference used to trace a payment.
watsonx Orchestrate | IBM’s platform for building and running AI agents and workflows.
