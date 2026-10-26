# Satark Saathi — The Story Behind the Button

> **Stop. Verify. Stay Safe.**
> A pitch narrative for Satark Saathi (सतर्क साथी). Names and events are illustrative.

---

## 1. 2:47 a.m.

Ananya's phone lights up in the dark. It is the hospital in Nagpur.

*"Your father has been shifted to the ICU. We need a deposit before the procedure. Please arrange it as soon as possible."*

She is 26, alone in a rented flat in Pune, 700 km away. Her hands are shaking. She opens her phone and does what all of us would do: she opens her apps.

- Her **payment app** shows her balance — and a cheerful banner: *"Pre-approved loan up to ₹5,00,000. Get money in minutes!"*
- Her **investment app** shows a neat dashboard: a fixed deposit, her PPF, a few mutual funds, some shares. Green and red numbers.
- Her **bank app** shows her FD maturity date.
- Her **insurance** card is somewhere in her email.

Every app shows her **information**. Not one of them tells her **what to do**.

Should she break the FD and lose interest? Sell the mutual funds — and is there an exit load? Take the instant loan at an interest rate she cannot read at 3 a.m.? Or does her father's health policy cover a cashless ICU admission — and how does she even start that?

She doesn't need another dashboard. She needs **one button** that says: *"Here is the best way to raise this money tonight — tap to start."*

Today, that button does not exist. Our apps are **reactive**: they wait for us to know what to ask. In a crisis, nobody knows what to ask.

---

## 2. 3:05 a.m. — Then the second call comes

While Ananya is still staring at her screen, a WhatsApp video call arrives from an unknown number. A man in a uniform. A police logo behind him.

*"Your father's hospital admission has been flagged in a money-laundering case. To avoid his arrest, pay a ₹50,000 'clearance fee' to this account within 15 minutes. Do not tell anyone — this is a confidential investigation."*

Fear. Urgency. Secrecy. Authority. At 3 a.m., with her father in the ICU, it almost sounds possible.

This is how **digital arrest** and impersonation scams work. They don't break into your phone — they break into your **judgment**, at the exact moment you are least able to defend it. And UPI is instant. Once the PIN is entered, the money is gone in seconds.

Across India, this scene repeats every night — for grandparents, students, first-time UPI users and frightened children like Ananya.

---

## 3. What if her phone had a *saathi* — a companion that acts?

**Satark Saathi** is built on one belief:

> **Protection must be active, not reactive.**
> Don't just show people information. Stand between a frightened person and an irreversible payment — and when the worst happens, turn panic into one button.

Replay Ananya's night with Satark Saathi.

### Before — *Verify*
She forwards the caller's message to **Scam Analyzer**. In plain language it explains: *police never collect fines through personal UPI IDs; "do not tell anyone" is a classic isolation tactic; this matches a known digital-arrest pattern.*

### During — *Pause, and bring family in*
She opens her payment app anyway — panic is powerful. Before the PIN screen, the **Satark safety check** steps in:

- The UPI ID sounds official but is a personal handle.
- The amount is far larger than anything she normally sends.
- She is paying a brand-new payee — while on a call.

Each reason is shown, one line each. Then a short **Safety Check-in**, in English, हिन्दी, मराठी or ಕನ್ನಡ: *Is someone on a call with you right now? Did anyone tell you to keep this secret? Has anyone told you how to answer these questions?*

She answers "No, it's fine" — exactly as the caller instructed. **It doesn't matter.** Reassuring answers cannot clear a payment that already matches scam patterns. The app says, gently and firmly:
*"Please don't send this money now. Talk to a trusted family member or call 1930 first."*

With one tap, her brother **Aarav** — her trusted guardian, who accepted that role in advance — gets an approval request on his phone. He calls her. He declines the payment. The ₹50,000 never leaves.

And if the scammer were standing over her shoulder, watching her screen? Ananya could type her **secret safety phrase** into the check-in. The screen would just say *"a family check is needed"* — while Aarav quietly gets a message: *"Please call her now."*

### After — *The Golden Hour, in one button*
Not every story ends in time. Suppose the money had already gone.

In the first hours after fraud, every minute matters. But victims don't know whom to call, what to write, or in what order. So they freeze — and the golden hour slips away.

With Satark Saathi, Ananya describes what happened **once**, and presses **one button: _Activate Golden Hour Response_.** In seconds she sees:

1. ✅ Complaint prepared and dispatched to the **cyber crime cell**, with a reference number
2. ✅ Request to her **bank** to block the amount in the fraudster's account
3. ✅ Intimation to the **cyber police station**

…plus a ready-to-print PDF complaint pack, a checklist of anything still missing (like the UTR), and the exact real steps: **call 1930**, file at **cybercrime.gov.in**, send the letter to the bank.

That is the difference between an app that **shows** and an app that **acts**.

---

## 4. Built for the people who need it most

- **Senior Mode** — large text, strong contrast, big buttons and a four-choice home screen: *check a message, check before paying, my family helpers, I lost money.* One-tap calls to 1930 and family.
- **Two-sided consent** — a guardian must *accept* the role. Adding someone's number is not the same as their agreement.
- **Privacy first** — free-text answers are checked once and never stored; the safety phrase is kept only as a protected hash.
- **Web and App modes** — the same protection on a family dashboard and inside a (mock) payment app through a small safety SDK boundary.

---

## 5. Honest by design (what is real in this prototype)

We believe a safety product must never over-promise. In this hackathon build:

| Real today | Simulated / not yet integrated |
|-----------|--------------------------------|
| Scam analysis, explained risk signals, adaptive multilingual check-in, anti-coaching logic | E-mails to the cyber crime cell, bank lien requests and police intimation — **clearly labelled simulations** |
| Two-sided consent, guardian approvals, discreet safety phrase, Senior Mode | Any integration with real UPI apps, banks, NPCI or telecom operators |
| PDF complaint pack, audit trail, one-tap Golden Hour flow | Automatic call or screen-share detection (platforms don't allow it; signals are user-reported or demo-simulated) |
| Local rule engine | IBM watsonx.ai is optional and not verified live; no watsonx Orchestrate, Granite Guardian or Safer Payments integration |

The path to production is partnerships: payment apps embedding the SDK, banks accepting structured lien requests, and official reporting APIs.

---

## 6. The vision

Ananya's first problem that night — *how do I raise money for my father, fast and wisely?* — is the same problem in a different form: **people in crisis don't need more dashboards; they need a companion that tells them the next step and takes it with them.**

Satark Saathi starts where the stakes are highest — the moment a scammer turns fear into a payment. The same idea, *one button that acts*, can grow to every financial emergency: comparing an FD break against a loan or an insurance claim, and starting the right one in a single tap.

> **Stop. Verify. Stay Safe.**
> Because in a crisis, nobody should have to know which app to open.

---

### 90-second pitch version

> "At 2:47 a.m., Ananya learns her father is in the ICU. Her payment app offers a ₹5 lakh loan. Her investment app shows her FD and mutual funds. Not one app tells her what to do. Twenty minutes later, a fake 'police officer' on a video call demands ₹50,000 to 'avoid his arrest' — and tells her to keep it secret.
>
> Today's financial apps are reactive. They show information and wait. **Satark Saathi acts.** It explains why a message is a scam, pauses a risky payment with a short check-in in her language that coached answers can't fool, and lets her brother approve or decline it. If money is lost, she describes it once and presses one button: the complaint, the bank's lien request and the police intimation are prepared and dispatched together — in our demo, as clearly labelled simulations, with the real 1930 steps beside them.
>
> Stop. Verify. Stay Safe. One companion, one button, when it matters most."
