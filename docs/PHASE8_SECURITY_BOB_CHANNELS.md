# Phase 8 — Security hardening, IBM Bob adapter, admin console, extension and WhatsApp

This phase was built on the `261026_changes_enhance` branch. The status labels below are deliberately honest.

## What was added

| Capability | Status | Where |
|---|---|---|
| Admin-only settings / DB reset / provider verify | Implemented and tested | `routers/settings.py`, `routers/integrations.py`, `dependencies.py` |
| Access roles USER / OPERATOR / ADMIN (separate from the family role) | Implemented and tested | `models.py` (`access_role`, `is_active`), `routers/admin.py` |
| Admin console (accounts, roles, activation, audit log, verify buttons, retention purge) | Implemented, type-checked | `frontend/src/components/settings/AdminConsole.tsx` (Settings page) |
| Rate limiting (login / analysis / sensitive routes, per IP) | Implemented and tested | `services/security_ops.py` |
| Secret redaction in logs (Bearer, JWT, api keys, passwords, OTP/PIN) | Implemented and tested | `services/security_ops.py` |
| Evidence retention (raw scan text redacted after N days; scores kept) | Implemented and tested | `purge_expired_evidence`; runs at startup and from the admin console |
| Stricter production startup (no wildcard CORS, no DEBUG) | Implemented | `config.py` |
| IBM Bob runtime adapter + live verify | **Implemented, not verified live** | `services/bob_analyzer.py`, `POST /api/integrations/bob/verify` |
| AI cannot lower the local risk floor (Bob and watsonx) | Implemented and tested | `services/ai_safety_floor.py` |
| WhatsApp Cloud API webhook | **Blocked by external configuration** until Meta credentials exist | `routers/whatsapp.py` |
| WhatsApp reply preview (no message sent) | Implemented and tested | `POST /api/whatsapp/simulate`, Settings page |
| Browser extension (Chrome MV3) | Implemented, not store-reviewed | `extension/` |
| Android app | **Missing** | The web app's App mode (`/mock-upi`) is the mobile demo |

## IBM Bob — read this before adding your key

- IBM's public pages describe Bob as an IDE coding assistant. We found no public runtime-inference API reference.
- The adapter therefore uses a **configurable** wire format. The default `openai_chat` sends `{model, messages}` and reads `choices[0].message.content`, using `Authorization: Bearer <key>`.
- After adding your key, press **Verify IBM Bob** in Settings → Admin console:
  - `VERIFIED` means a real request succeeded.
  - `INVALID_RESPONSE` means the endpoint answers but in a different format. Confirm the correct format with IBM.
  - `AUTHENTICATION_FAILED` means the key or endpoint was rejected.
- The local rule engine always runs first. Bob can add explanation and raise risk, never lower it.
- If Bob fails, the result is labelled as coming from the local engine.

Add these to `backend/.env` (never to the frontend, the extension, or git):

```dotenv
ANALYSIS_PROVIDER=bob
BOB_API_KEY=your-key
BOB_API_ENDPOINT=https://<endpoint given with your Bob access>
BOB_MODEL_ID=<model id>
# Optional, only if IBM requires it:
# BOB_TEAM_ID=...
# BOB_TEAM_HEADER=<header name IBM specifies>
```

## Other new environment variables (all optional)

```dotenv
ADMIN_USER_IDS=1               # bootstrap admins (Rajesh by default)
ALLOW_DATABASE_RESET=true      # set false outside local demos; reset is always refused in production
RATE_LIMIT_ENABLED=true
RATE_LIMIT_LOGIN_PER_MINUTE=10
RATE_LIMIT_ANALYSIS_PER_MINUTE=40
RATE_LIMIT_SENSITIVE_PER_MINUTE=20
EVIDENCE_RETENTION_DAYS=30     # 0 disables the purge
WHATSAPP_VERIFY_TOKEN=
WHATSAPP_APP_SECRET=
WHATSAPP_ACCESS_TOKEN=
WHATSAPP_PHONE_NUMBER_ID=
```

## Role model (enforced by the backend)

| Role | Can do |
|---|---|
| USER | Own data. Family access only through two-sided Trusted Contact consent. |
| OPERATOR | Read the audit log (descriptions only, no message content). |
| ADMIN | Everything above, plus accounts and roles, system settings, provider verification, retention purge, and dev-only DB reset. |

Admins cannot demote or deactivate themselves. Demo personas 1 and 2 cannot be deactivated. Every change is written to `audit_events`.

## Browser extension (load unpacked)

1. Open `chrome://extensions`, turn on **Developer mode**, click **Load unpacked**, and pick the `extension/` folder.
2. Click the icon and sign in, for example with `+91 98765 43210` / `1234`. The token lives in `chrome.storage.session` and is cleared when the browser closes.
3. Select text on any page, right-click, and choose **Check with Satark Saathi**.

The extension uses only the `contextMenus` and `storage` permissions, and only for the local API host. It reads nothing unless you choose to check it, never fetches the suspicious URL, and contains no API keys.

## WhatsApp

- `GET /api/whatsapp/webhook` handles Meta's verify-token handshake.
- `POST /api/whatsapp/webhook` requires a valid `X-Hub-Signature-256`, skips repeated message IDs, and replies in the background.
- A phone number is **not** treated as proof of a Satark account. Forwarded messages are analysed anonymously and not stored.
- Live messaging needs an approved WhatsApp Business account. Test numbers are sandbox only.

## Limitations

- The rate limiter is in-memory and per process. Use a shared store (for example Redis) if you run several workers.
- Without a public IBM Bob API reference, the adapter's wire format is an assumption until the verify button returns `VERIFIED`.
- There is no Android project, and there are no migrations beyond the automatic add-column `migrate_db()`.
