# Satark Safety SDK & Mock UPI App (Prototype)

**What exists:** a web-based mock UPI app (`/mock-upi`) that calls a prototype SDK boundary
(`frontend/src/sdk/satarkSafetySdk.ts` → `/api/sdk/v1/*`).
**What does not exist:** any integration with PhonePe, Google Pay, Paytm, BHIM, NPCI or a bank, and any
Flutter/Android/iOS build. No real money moves; completed mock payments only go to a demo ledger.

## Flow

```
Host app (mock UPI)            Satark backend
-------------------            --------------
preTransactionCheck  ───────▶  POST /api/sdk/v1/pre-transaction-check
                               → explained risk assessment (+ mock-ledger history)
                     ◀───────  decision: ALLOW | CHECKIN_REQUIRED |
                                         GUARDIAN_APPROVAL_REQUIRED | BLOCK_RECOMMENDED
if CHECKIN_REQUIRED  ───────▶  POST /api/payment/simulations/{id}/checkin   (adaptive questions)
getDecision          ───────▶  GET  /api/sdk/v1/transactions/{id}/decision
(guardian approves in Family Shield → GUARDIAN_APPROVAL_DECIDED over WebSocket)
complete / cancel    ───────▶  POST /api/sdk/v1/transactions/{id}/complete | cancel
                               (complete is refused with 409 unless the decision allows it)
```

## Decision rules (`routers/sdk.py`)

| Situation | Decision | Can complete |
|-----------|----------|--------------|
| Guardian request pending / expired | `GUARDIAN_APPROVAL_REQUIRED` | No |
| Guardian approved | `ALLOW` | Yes |
| Guardian declined | `BLOCK_RECOMMENDED` | No |
| GREEN, no check-in | `ALLOW` | Yes |
| AMBER/RED, check-in not done | `CHECKIN_REQUIRED` | No |
| After check-in: RED | `BLOCK_RECOMMENDED` | No (ask a guardian or call 1930) |
| After check-in: AMBER/GREEN | `ALLOW` (with caution message) | Yes |

## Native integration boundary (design only — not built)

A real host app would embed a thin native SDK that:

1. Authenticates the user to the Satark backend (OAuth/JWT), never sharing bank credentials or the UPI PIN.
2. Calls `preTransactionCheck` **before** the PIN screen with payee, amount, note and an explicit `callState`
   obtained only through permitted platform APIs (see [PLATFORM_LIMITATIONS.md](PLATFORM_LIMITATIONS.md)).
3. Renders the server-driven check-in natively (questions and options come from the API in the user's language).
4. Blocks its own "Pay" button until `getDecision().canComplete` is true, then reports `complete`/`cancel`.
5. Protects approval and PIN screens from screen capture (`FLAG_SECURE` on Android; capture-state handling on iOS).

Real deployment would also need a partnership with the payment app or bank, NPCI/RBI compliance review,
consent flows for sharing transaction history, and real SMS delivery for guardian invitations.
