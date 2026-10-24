# Satark Saathi

सतर्क साथी

An AI circuit-breaker that stops scams at the moment of payment

Event

IBM SkillsBuild National Hackathon 2026

Domain

FinTech and cybersecurity, agentic AI

Team

\[Team name\], \[College name\]

Members

\[Member 1\], \[Member 2\], \[Member 3\], \[Member 4\]

Paying a new payee**cbi.verify@exbank**

₹4,80,000

**Payment held**A 30-second safety check before your money moves.

Is someone on a call right now asking you to make this payment?

Yes, someone isNo

## Indians lost ₹19,813 crore to cyber fraud in 2025, and most of it never came back.

₹19,813 cr

lost in 2025 across 21.77 lakh complaints on the National Cyber Crime Reporting Portal (I4C).

### Where the money went

- **77%**Investment schemes
- **8%**Digital arrest
- **7%**Credit card fraud
- **4%**Sextortion
- **3%**E-commerce
- **1%**App and malware

- 1,23,672digital-arrest cases in 2024, up from 39,925 in 2022, with ₹1,935.51 crore lost in 2024 alone.
- 3 in 4rupees lost to cyber fraud are never recovered.
- ₹3,203 crlost in Maharashtra in 2025, the highest of any state.
- 45%of 2025 complaints traced back to scam centres in Cambodia, Myanmar and Laos.

Sources: I4C data as reported by IANS and SuperKalam (Jan 2026); Moneylife (2026). Full list on slide 23.

## The costliest scams don’t trick people once. They convince them over days.

### Fake investment scheme

1. Day 1

   Added to a WhatsApp or Telegram group sharing “stock tips”.
2. Day 3

   Small deposit shows big “profits” in a fake trading app. A small withdrawal is allowed.
3. Day 10

   Trust is built. The victim invests savings, often to a new account each time.
4. Day 14

   Withdrawal blocked. “Pay a tax or fee to release your funds.” The money is gone.

### Digital arrest

1. Minute 0

   Call about a “parcel with drugs” or a “money-laundering case” in the victim’s name.
2. Minute 15

   Video call with a fake officer in uniform, a fake warrant and a fake courtroom.
3. Hours

   Told to stay on camera and tell no one, or face immediate arrest.
4. The end

   Asked to transfer savings for “verification”, promised a refund once cleared.

### The levers both scams pull

- Authority
- Urgency
- Secrecy
- Isolation
- Greed or fear

By the time the victim pays, they aren’t suspicious. They’re convinced. And every one of these stories ends with the victim pressing **Pay**.

## Today’s defences work only when the victim already suspects a scam, or after the money is gone.

| Defence | What it does well | Where it breaks |
| --- | --- | --- |
| Police verification chatbots Kerala Police CyberWall, Indore Police Safe Clicks | Check numbers, links, SMS, emails and APK files sent by citizens, using police intelligence. | The citizen has to suspect and ask. A convinced victim never opens the chat. |
| Caller-ID and spam apps | Flag numbers already reported as spam. | Scammers rotate fresh numbers and use WhatsApp video calls. |
| Bank fraud monitoring | Spots unusual transactions, stolen cards and account takeovers. | In these scams the genuine customer approves the payment on their own phone, so it looks legitimate. |
| Awareness campaigns | Teach that “there is no digital arrest in Indian law”. | Forgotten under fear and pressure, in the moment that matters. |
| 1930 helpline and cybercrime.gov.in | Freeze money that’s still moving through mule accounts. | Works only after the loss, and victims often miss the first “golden hour”. |

Each defence is valuable. Satark Saathi is designed to work alongside them, not replace them.

## Every scam, whatever the script, ends at one moment: the victim pressing Pay.

It’s the one checkpoint every scam must pass through, and today no one is standing there. Satark Saathi puts a calm, informed second opinion exactly at that point.

## Satark Saathi steps in at the Pay moment, without the user having to ask.

An agentic AI layer that lives inside banking and UPI apps as an SDK, plus a companion app for families.

Before the money moves

After the money moves

1. 1

   ### Risk Trigger

   Scores every payment in real time. Only payments that look like a scam in progress are briefly held.
2. 2

   ### AI Check-in

   A 30-second voice or text conversation in the user’s language that uncovers who is pushing the payment and why.
3. 3

   ### Family Shield

   Alerts a trusted contact when risk is high, breaking the isolation that scammers depend on.
4. 4

   ### Golden Hour Mode

   If money is already lost, turns panic into a checklist: block, call 1930, file a complete complaint, dispute with the bank.

**Who it protects:** senior citizens, first-time digital users, students and small merchants.

**Where it runs:** inside the apps people already pay with, so there’s nothing new to remember.

**What powers it:** IBM watsonx Orchestrate agents, Granite models on watsonx.ai and Granite Guardian.

## What happens when Ramesh, 67, is told he’s under “digital arrest”.

1. 10:12

   A video call from a fake “CBI officer”. Ramesh is told his Aadhaar is linked to money laundering and he must stay on camera.
2. 10:41

   Told to move his savings for “verification”, he enters ₹4,80,000 to a new payee in his bank app.
3. 10:41

   **Risk Trigger fires:** new payee, 12 times his usual largest payment, active call, senior-citizen account. Payment held.
4. 10:41

   **AI Check-in** speaks to him in Hindi and asks three short questions.
5. 10:42

   He says the officer told him not to tell anyone. Saathi classifies a digital-arrest script with high confidence and explains why in plain words.
6. 10:42

   **Family Shield** alerts his daughter Priya. The payment goes on a cooling-off hold.
7. 10:45

   Priya calls him. The scam call ends. ₹4.8 lakh saved, and the scam pattern is added to Scam Radar, anonymised.

Satark Saathi

रमेश जी, क्या कोई कॉल पर आपसे यह पेमेंट करने को कह रहा है?Ramesh ji, is someone on a call asking you to make this payment?

हाँ, CBI के अफसर ने कहा है। किसी को बताना मना है।Yes, the CBI officer said so. I’m not allowed to tell anyone.

Satark Saathi

यह “डिजिटल अरेस्ट” स्कैम है। पुलिस या CBI कभी वीडियो कॉल पर पैसे नहीं माँगते। मैं प्रिया को बता रहा हूँ।This is a “digital arrest” scam. Police or CBI never ask for money on a video call. I’m letting Priya know.

## The Risk Trigger holds only the payments that look like a scam in progress.

### The transaction

- Payee is new to this user
- Amount far above the user’s 90-day pattern
- First high-value transfer ever
- Several transfers in quick succession

### The moment

- User is on an active phone or video call
- Screen-sharing or remote-access app is open, where the phone allows detection
- Unusual hour or a recently changed device

### The payee

- Account or UPI ID created very recently
- Flagged in police or bank intelligence feeds
- Receives many first-time payers, a mule-account pattern

### The person

- Senior citizen or first-time digital user
- Protection level the user chose at sign-up
- Trusted contact set up, or not

### Risk score, 0 to 100

0–39

**Pass silently**The vast majority of payments. No delay, no pop-up.

40–69

**Gentle nudge**One-tap confirmation with a short, specific warning.

70–100

**Hold and check in**Payment paused and the AI Check-in starts.

Hackathon build: rules plus a gradient-boosted model trained on synthetic transactions. Production: scoring runs on IBM Safer Payments inside the bank. Thresholds shown are starting points to be tuned in a pilot.

## The AI Check-in asks what a bank fraud officer would ask, in the user’s language, in 30 seconds.

### It asks 2 to 4 questions

Chosen from the reasons the payment was held, by voice or text, in Hindi, Marathi, Kannada or English to start.

- Is someone on a call asking you to make this payment?
- Did they say they’re from the police, CBI, customs or your bank?
- Were you promised fixed or guaranteed returns?
- Were you told to keep this secret from your family?

### It recognises the script

Answers and payment signals are matched against known scam patterns, each with a confidence score.

- Digital arrest and officer impersonation
- Investment and trading app
- Part-time “task” job
- KYC, OTP and bank impersonation
- Customer-care refund
- Sextortion
- Lottery and prize
- Family emergency, including cloned voices

### It decides what happens next

**Proceed.** Answers clear the concern. The payment goes through immediately.

**Cooling-off hold.** The payment waits 1 to 4 hours with the reason shown. Most scams collapse once the pressure breaks.

**Escalate.** Family Shield is alerted and the bank’s fraud desk receives a case summary.

**Never accuses.** The tone is a caring second opinion, not an interrogation.

**Always says why.** Every hold names the specific reasons in plain words.

**Voice first.** Works for people who struggle to read or type.

**User keeps the final say.** After the cooling-off hold, the choice is theirs.

## Family Shield breaks the isolation that scammers depend on.

1. 1

   ### Set up once

   The user picks up to two trusted contacts. Both sides give consent in the app.
2. 2

   ### Alert when it matters

   Only high-risk holds trigger an alert: the amount, the type of payee and the reason. Never the balance or the conversation.
3. 3

   ### Act in one tap

   Call the person now, or confirm “I’m handling it” so the bank’s fraud desk knows family is involved.

### Two-key payments

Optional. Above a limit the user sets, a payment needs approval from their trusted contact too.

### Duress phrase

A pre-set answer that looks ordinary on screen but silently alerts family, for when a scammer is watching on video.

Satark Saathi alert for Priya

### Papa’s payment of ₹4,80,000 was held

To a new payee, 10:41 am

It matches a “digital arrest” scam pattern. He is on a video call and was told to keep this secret.

Call Papa nowI’m handling it

## If money is already gone, Golden Hour Mode turns panic into a checklist.

Reporting fast is what saves money. Mumbai’s 1930 helpline blocked or recovered about ₹202 crore in 2025, and officials say a call in the first hour is the most effective step.

1. 10–5 minutes

   ### Stop the bleeding

   One tap to block UPI and cards in the bank app, then one tap to call 1930.
2. 25–15 minutes

   ### Build the complaint

   The agent assembles every detail police ask for, from the payment record and the user’s answers.
3. 315–30 minutes

   ### File and dispute

   Guides the user through cybercrime.gov.in and drafts the bank dispute request.
4. 4After

   ### Follow through

   Tracks the acknowledgement number, sends reminders and keeps evidence safe in one place.

### Complaint pack, prepared automatically

- Timeline of calls, messages and payments
- Amount, date, time and UTR number
- Payee UPI ID or account and bank
- Screenshots, chat exports and call log
- Scam type and how the user was approached
- 1930 acknowledgement number

Saathi prepares and guides. The user files through the official 1930 and cybercrime.gov.in channels.

## Add-ons extend protection beyond the Pay button.

| Add-on | What it does | Who it helps | Stage |
| --- | --- | --- | --- |
| Share-to-Check | Forward a message, link, screenshot or voice note for a verdict. Uses police feeds such as CyberWall where available. | Everyone | Hackathon |
| Duress phrase | A normal-looking answer that silently alerts family while a scammer watches. | Victims on video calls | Hackathon |
| Senior Mode | Large type, voice-only flow and fewer steps. | Senior citizens | Hackathon |
| 60-second lesson | After every held payment, a short explanation of how that scam works. | Everyone | Pilot |
| Merchant Shield | Confirms a payment really reached the account before goods are handed over. Flags fake screenshots and “I overpaid, please refund” tricks. | Small merchants | Pilot |
| Fraud-desk console | A case summary for every held payment, with reasons, answers and outcome. | Banks | Pilot |
| Scam Radar | Anonymised trends on new scam scripts, suspicious payee accounts and hotspots. | Police cyber cells, I4C | Later |
| IVR check-in | The same check-in as a phone call, for feature-phone users on UPI 123PAY. | Rural users | Later |

## Architecture: five layers, with IBM watsonx at the core.

Channels

Bank and UPI appsSatark SDK collects payment and call-state signals

Satark Saathi appFamily setup, Share-to-Check, Golden Hour Mode

WhatsApp and IVRCheck-in for low-end and feature phones

Trusted-contact appAlerts and two-key approvals

Access

API gateway on IBM CloudAuthentication, rate limits, mutual TLS with partner banks

Consent managerOpt-ins, trusted contacts and DPDP consent records

Decision

Risk EngineRules and ML score in under 200 ms. IBM Safer Payments in production

IBM watsonx OrchestrateRuns the multi-agent workflow and hands off between agents

Risk Analyst agentCheck-in agentFamily Shield agentRecovery agent

AI services

Granite on watsonx.aiQuestions, scam-script classification and explanations

Granite GuardianScreens every response before the user sees it

Watson Speech to TextTurns spoken answers into text

Scam knowledge baseRetrieval over scam scripts and official advisories

Data and links

IBM CloudantCase and audit log with 90-day retention

Intelligence feedsCyberWall, I4C and partner banks, planned

NotificationsSMS, push and WhatsApp

Scam RadarAnonymised analytics for banks and police

IBM technologyTeam-built or partner component

## One held payment, end to end, in under a minute.

1. 10 s

   ### Pay tapped

   The SDK sends payee, amount, device and call-state signals. No call audio is ever captured.
2. 2under 0.2 s

   ### Scored

   The Risk Engine returns a 0–100 score with its top three reasons.
3. 3under 1 s

   ### Held

   A high score pauses the transfer. Orchestrate starts the Check-in agent with the reasons as context.
4. 4about 5 s

   ### Asked

   Granite chooses 2–4 questions in the user’s language. Speech to Text handles spoken answers.
5. 5about 30 s

   ### Understood

   Answers plus signals are classified into a scam type with a confidence score, grounded in the knowledge base.
6. 6under 1 s

   ### Checked

   Granite Guardian screens the explanation for harmful or unsupported claims before it’s shown.
7. 7about 35 s

   ### Decided

   Proceed, cooling-off hold or escalate. The Family Shield agent alerts the trusted contact if needed.
8. 8in the background

   ### Learned

   The outcome is logged. An anonymised pattern feeds Scam Radar and the next model update.

Timings are design targets for the prototype and pilot.

## The tech stack puts IBM tools where they matter most.

| Layer | Technology | What it does in Satark Saathi |
| --- | --- | --- |
| Agent orchestration | watsonx OrchestrateIBM | Coordinates the four agents, their tools and the hand-offs between them. |
| Language model | Granite on watsonx.aiIBM | Generates check-in questions, classifies scam scripts, writes plain-language explanations. |
| Guardrails | Granite GuardianIBM | Checks prompts and responses for harmful or ungrounded content. |
| Voice | Watson Speech to TextIBM | Voice-first check-in for people who can’t easily read or type. |
| Payment scoring, production | IBM Safer PaymentsIBM | Real-time behavioural fraud scoring inside the bank. IBM already pairs it with watsonx Orchestrate against customer-authorised payment scams. |
| Hosting and data | IBM Cloud Code Engine, IBM CloudantIBM | Serverless APIs, case records and audit logs. |
| Building | IBM BobIBM | AI-assisted development of the SDK, backend and app. |
| App and backend | Flutter, FastAPI, XGBoost | Mock UPI app with the SDK, API services and the hackathon risk model. |

## Built to protect people without taking away their choice.

### Consent first

Protection is opt-in through the user’s bank app. Trusted contacts consent too.

### No listening to calls

Only whether a call is active is used. Call audio is never recorded or sent.

### Data minimisation

Check-in answers are deleted after the decision. Only anonymised patterns are kept for Scam Radar.

### Explainable holds

Every hold shows the exact reasons in plain language, in the user’s own language.

### Temporary, not permanent

The AI can delay a payment, never block it forever. Longer blocks follow the bank’s own rules and people.

### Fairness checks

False-hold rates are monitored by age group, language and region, and thresholds are adjusted.

### Guarded answers

Granite Guardian screens every response. Key facts, like “police never ask for money on calls”, come from a verified knowledge base.

### DPDP Act aligned

Consent records, purpose limits, retention limits and a clear way to delete data.

## Where Satark Saathi fits next to what already exists.

| Capability | Police chatbots CyberWall, Safe Clicks | Spam and caller-ID apps | Bank fraud systems | Satark Saathi |
| --- | --- | --- | --- | --- |
| Works without the user suspecting anything | No | Known numbers only | Yes | Yes |
| Acts at the moment of payment | No | No | Yes | Yes |
| Understands the social-engineering story | When asked | No | No | Yes |
| Brings in family | No | No | No | Yes |
| Guides recovery in the golden hour | Partly | No | Partly | Yes |

**The one-line answer:** CyberWall is a smoke detector you have to remember to press. Satark Saathi is a circuit-breaker that trips by itself, right at the payment.

**Partners, not rivals:** police and bank intelligence on numbers and links becomes one more input to our risk score.

Comparison based on public descriptions of each category of tool.

## What we’ll build at the hackathon, and what we’ll simulate.

### Working in the prototype

- Mock UPI app with the Satark SDK hooks
- Risk scoring: rules plus XGBoost on synthetic transactions
- watsonx Orchestrate flow with all four agents
- Granite check-in in Hindi, Marathi, Kannada and English, with voice
- Family Shield alerts through an SMS or WhatsApp sandbox
- Golden Hour complaint pack as a PDF
- Share-to-Check, duress phrase and Senior Mode

### Simulated, with a clear path

- Bank core and UPI rails, replaced by a mock payment service
- IBM Safer Payments, represented by our own scoring API with the same inputs and outputs
- Police and I4C feeds, replaced by a seeded dataset of scam numbers and UPI IDs

We’ll say clearly in the demo what is real and what is simulated.

### Three-minute demo

1. 0:00

   A fake “CBI officer” voice call plays.
2. 0:40

   The victim enters ₹4.8 lakh to a new payee.
3. 0:50

   Payment held. Voice check-in in Hindi.
4. 1:40

   Verdict and explanation on screen.
5. 2:00

   The daughter’s phone buzzes.
6. 2:20

   Second case, already paid: complaint pack in seconds.
7. 2:50

   Scam Radar shows the new pattern.

## Even small interception rates protect hundreds of crores.

### Losses prevented if Satark Saathi stopped a share of 2025’s reported losses

1%

₹198 cr

5%

₹991 cr

10%

₹1,981 cr

Illustrative, based on ₹19,813 crore of reported losses in 2025. Real losses are higher because many cases go unreported.

### How we’ll measure success in a pilot

| Metric | Pilot target |
| --- | --- |
| Scam payments intercepted | At least 60% of confirmed scam attempts |
| False holds | Under 0.5% of all payments |
| Time to report after a loss | Median under 30 minutes |
| Users who keep protection on | At least 80% after 90 days |
| Money saved or frozen | Tracked per bank, per month |

## Free for citizens, paid for by the institutions that lose when scams succeed.

### Citizens

Free. Switched on inside the bank or UPI app they already use, with a free companion app for families.

### Banks and UPI apps

License the SDK and fraud-desk console, priced per active protected user. They gain fewer fraud cases and disputes, stronger customer trust, and a ready answer to rising fraud-prevention expectations.

### Police and I4C

Scam Radar dashboards through public partnerships, giving cyber cells an early view of new scripts and mule accounts.

### Go-to-market

Start with one cooperative or small-finance bank in one state, where customers skew older and fraud teams are small. Prove the numbers, then expand through the SDK to more banks.

### Public-good tier

A subsidised version for rural and cooperative banks, funded through CSR and government digital-safety programmes.

## From hackathon prototype to a national safety layer.

1. 1Hackathon

   ### Prototype

   Mock UPI app, four agents, four languages, Family Shield and Golden Hour Mode working end to end.
2. 2Months 0–6

   ### First bank pilot

   One partner bank, about 5,000 opted-in users, real scoring thresholds tuned on live data.
3. 3Months 6–12

   ### Production grade

   IBM Safer Payments integration, 10 Indian languages, IVR check-in, Merchant Shield.
4. 4Months 12–24

   ### National scale

   Multi-bank SDK and a shared Scam Radar with police cyber cells and I4C.

## Questions we expect from the jury.

### Why is this better than CyberWall?

CyberWall answers “is this number or link safe?” when a citizen thinks to ask. We step in when the victim doesn’t think to ask, at the payment, and we can use CyberWall’s intelligence as an input.

### Banks already detect fraud. Why add this?

Bank systems see the real customer approving a payment on their own phone, so it looks legitimate. The missing signal is that someone is pressuring them, and only a conversation reveals that.

### What if the scammer coaches the victim to say “no”?

Answers are only one input. Transaction and call signals still drive the hold, the cooling-off period still applies to high scores, and the duress phrase and family alert don’t depend on honest answers.

### Won’t pauses annoy people?

Only high-risk combinations are held, like a large first payment to a new payee during a call. Normal payments go straight through, and we track false holds as a core metric.

### Are you listening to people’s calls?

No. We only use whether a call is active. No audio is recorded, and check-in answers are deleted after the decision.

### How will a bank adopt it?

Through a lightweight SDK and an API that mirrors IBM Safer Payments’ inputs and outputs, starting with a small pilot that measures money saved.

## Sources.

1. IANS, Jan 2026: I4C data on 2025 losses (₹19,813 crore), 21.77 lakh complaints and loss share by scam type. [ianslive.in](https://ianslive.in/indians-lose-over-rs-52976-crore-to-cyber-frauds-over-six-years-report--20260103154943)
2. SuperKalam, Jan 2026: Maharashtra’s 2025 losses and the share of complaints traced to Southeast Asia. [superkalam.com](https://superkalam.com/current-affairs/03-01-2026/indians-lost-rs-53k-cr-to-fraud-cheating-cases-in-last-6-years-pg9-ac817bc7-aec9-47b5-b07b-a48a1c1be43c)
3. Moneylife, 2026: digital-arrest cases 2022 to 2024 and the share of losses never recovered. [moneylife.in](https://moneylife.in/article/fraud-alert-india-is-losing-over-22000-crore-a-year-in-cyber-scams-and-the-worst-is-yet-to-come/80612.html)
4. UNI India, Sep 2026: Kerala Police CyberWall service. [uniindia.com](https://www.uniindia.com/south-india/crime-kerala-cyberwall/195204)
5. Kerala Kaumudi, Sep 2026: what CyberWall can check. [keralakaumudi.com](https://keralakaumudi.com/lifestyle/tech/kerala-police-whatsapp-cyber-fraud-1799732)
6. The Wire (PTI), Oct 2025: Indore Police Safe Clicks chatbot. [thewire.in](https://m.thewire.in/article/ptiprnews/indore-police-commissionerate-becomes-first-to-launch-ai-chatbot-safe-clicks-in-madhya-pradesh)
7. The420.in: Mumbai’s 1930 helpline and golden-hour recoveries in 2025. [the420.in](https://the420.in/mumbai-1930-cyber-helpline-saves-202-crore-2025)
8. IBM: Safer Payments with watsonx Orchestrate against authorised push-payment scams. [ibm.com](https://www.ibm.com/products/safer-payments)
9. IBM case study: Arab National Bank pausing suspicious transactions with Safer Payments. [ibm.com](https://www.ibm.com/case-studies/anb)

## Almost every Indian family has received this call. Satark Saathi makes sure no one has to face it alone.

Team

\[Team name\], \[College name\]

Contact

\[Email\], \[Phone\]

Code

\[GitHub repository link\]

सतर्क साथी

1 / 24