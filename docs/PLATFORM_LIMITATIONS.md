# Platform Limitations: Calls, Screen Sharing and Other Apps

Satark Saathi does **not** detect calls, screen sharing or other apps automatically. In this prototype the
call context is always one of:

- `NONE` — no call;
- `USER_REPORTED_ACTIVE_CALL` — the user says they are on a call (form choice or check-in answer);
- `DEMO_SIMULATED_ACTIVE_CALL` — a presenter-controlled stand-in for an OS signal, badged "DEMO ONLY".

## What real mobile platforms allow (summary — verify against current docs before building)

| Capability | Android | iOS |
|------------|---------|-----|
| Is a phone call active? | `TelephonyCallback.CallStateListener` reports **telephony (mobile network) call state** for a subscription and requires the `READ_PHONE_STATE` runtime permission. It does not describe calls inside other apps such as WhatsApp video calls. | CallKit's `CXCallObserver` exposes the list of active calls and changes to them (for calls surfaced through CallKit). It does not give call content. |
| Who is calling / what they say | Not available to a normal app. | Not available. |
| Is someone screen-sharing / recording? | An app can protect its own windows with `FLAG_SECURE` (blank screenshots / no display on non-secure screens) and opt out of overlays with `HIDE_OVERLAY_WINDOWS`; newer Android versions add limited signals about recording of the app's own window. | UIKit can tell an app whether its own screen is being captured/mirrored. |
| What other apps are open or doing | Not available without highly privileged access (e.g. accessibility services), which Play policy restricts and which would be inappropriate here. | Not available. |

Sources: Android [`TelephonyCallback.CallStateListener`](https://developer.android.com/reference/android/telephony/TelephonyCallback.CallStateListener),
Android [fraud-prevention guidance](https://developer.android.com/security/fraud-prevention/activities),
Apple [`CXCallObserver`](https://developer.apple.com/documentation/callkit/cxcallobserver).

## Design consequences

1. **Explicit signals only.** A host app may pass `call_state` to the SDK only if it obtained it through a
   permitted API with the user's consent, or if the user reported it. The backend records the source of every
   signal (`USER_REPORTED`, `DEMO_SIMULATED_DEVICE_SIGNAL`, …) and the UI shows it.
2. **Ask, don't assume.** The check-in asks about calls, screen sharing, OTP/PIN requests and secrecy directly,
   and treats contradictions as a warning sign instead of trusting the more reassuring answer.
3. **Protect the app itself.** A production app should use `FLAG_SECURE` (Android) on PIN/approval screens and
   react to iOS screen-capture state, so a remote "helper" cannot watch approvals.
4. **No claims of automatic detection** in UI copy, docs or demos.
