# SATARK SAATHI — MASTER ROUTE AND COMPONENT INVENTORY
> **Document Reference:** `docs/audit/MASTER_ROUTE_AND_COMPONENT_INVENTORY.md`  
> **Phase:** 5.5 — Comprehensive Live Web Audit  
> **Evaluation Date:** October 23, 2026

---

## 1. Architecture & Platform Overview

| Property | Value | Notes |
| :--- | :--- | :--- |
| **Frontend Framework** | React 19.2.8 + TypeScript ~6.0.2 | Single-Page Application (SPA) |
| **Build Tool & Dev Server** | Vite 8.3.0 | Proxies `/api` and WebSockets to backend |
| **Styling Engine** | TailwindCSS 3.4.17 + Lucide Icons | Responsive layout, dark/light accents |
| **Client Routing** | React Router v7.18.4 (`BrowserRouter`) | Client-side routing with layout wrappers |
| **Backend Framework** | FastAPI 0.110+ on Python 3.12 | Async ASGI service via Uvicorn |
| **Database Engine** | SQLite (`satark_saathi.db`) | 9 relational tables with SQLAlchemy ORM |
| **Authentication Model** | Signed JWT (HS256) + Persona Fallback | `sessionStorage` for tokens, `localStorage` for persona ID |
| **Live Notifications** | FastAPI WebSockets (`/api/ws/alerts`) | Real-time push alerts to active guardians |
| **Inference Engine** | Dual-Tier: Rule Engine + Offline Semantic | Optional IBM watsonx.ai cloud integration |

---

## 2. Route Inventory & Component Hierarchy

### Route 1: `/` — Security Overview Dashboard
- **Path:** `/`
- **Component File:** `frontend/src/pages/OverviewPage.tsx`
- **Layout Wrapper:** `AppLayout.tsx` (Sidebar, Header, DemoModeIndicator)
- **Primary Purpose:** Real-time situational awareness, family cyber risk metrics, threat radar, and recent incident feed.
- **Accessible By:** Direct navigation, default home route.
- **Authentication:** Unrestricted in dev; loads user profile and scoped stats based on active persona header (`X-User-Id` or Bearer token).
- **Sub-components:**
  - `Hero Threat Banner`: Live threat posture indicator (Safe / Elevated / Critical).
  - `Metric Cards Grid`: 4 stat cards (Total Scans, Threats Blocked, Protected Family, Estimated Loss Prevented).
  - `Threat Radar Chart`: Recharts visualization of scam categorization distribution.
  - `Threat Activity Timeline`: Time-series chart of recent scans.
  - `Quick Action Bar`: Direct deep-links to Scanner, Payment Checkpoint, and Recovery.
  - `Recent Security Incidents Table`: Condensed list of latest 5 analyses.
- **API Dependencies:**
  - `GET /api/stats/overview`
  - `GET /api/health`
  - `GET /api/settings/profile`
  - `GET /api/alerts`
- **Observed States:**
  - *Loading:* Pulse skeleton loaders on cards and charts.
  - *Success / Seeded:* Displays Rajesh Sharma (ID 1) metrics and charts.
  - *Empty:* Fallback illustrations if zero incidents exist.
  - *Error:* Non-blocking toast notification if backend is unreachable.

---

### Route 2: `/scanner` — Multi-Modal Scam Analyzer Workspace
- **Path:** `/scanner`
- **Component File:** `frontend/src/pages/ScannerPage.tsx`
- **Primary Purpose:** Ingestion and forensic analysis of suspicious messages across 4 distinct modalities: Text, URL, Image, and Audio.
- **Accessible By:** Sidebar link, Quick Action card, direct URL navigation.
- **Authentication:** Scoped to active user. Analyses are saved and tied to authenticated user ID.
- **Sub-components:**
  - `Modality Tab Switcher`: 4 segmented tabs (`text`, `url`, `image`, `audio`).
  - `Text Analysis Form`: Textarea with character counter, channel selector (`SMS`, `WHATSAPP`, `TELEGRAM`, `CALL_TRANSCRIPT`, `EMAIL`, `WEB_BROWSER`).
  - `Preset Scenario Picker`: 8 pre-seeded Indian scam presets (Digital Arrest, Electricity Bill, Bank KYC, etc.).
  - `URL Analyzer Form`: Input for suspicious links with offline heuristic decomposition.
  - `Image Upload Zone`: Drag-and-drop / file selector with image preview and OCR text extraction.
  - `Audio Upload Zone`: WAV/MP3 file selector with local Whisper transcription.
  - `Analysis Result Card`: Risk badge (GREEN, AMBER, RED, CRITICAL), Risk score (0-100), Verdict headline, Plain-language explanation.
  - `Signals & Evidence Accordion`: Breakdown of detected scam indicators with weight, category, and matched text excerpts.
  - `Action Recommendation Panel`: Concrete citizen safety advice (e.g. "Do not share OTP", "Call 1930").
  - `Family SOS Dispatch Modal`: Modal to immediately broadcast threat alert to verified trusted contacts.
  - `Engine Transparency Footer`: Disclosure of active engine (Rule-based / Semantic), limitations notice.
- **API Dependencies:**
  - `GET /api/scanner/presets`
  - `POST /api/v1/analyze` (Text analysis)
  - `POST /api/v1/analyze/url` (URL analysis)
  - `POST /api/v1/analyze/image` (Image OCR)
  - `POST /api/v1/analyze/audio` (Audio transcription)
  - `GET /api/contacts` (For alert dispatch modal)
  - `POST /api/alerts/dispatch` (SOS notification trigger)
- **Observed States:**
  - *Idle / Form Entry:* Clean input fields, preset dropdown enabled.
  - *Analyzing:* Animated scanner beam, button shows loading spinner.
  - *Completed Analysis:* Full result card with color-coded severity.
  - *Degraded OCR:* Banner displayed when Tesseract binary is absent on host.
  - *Validation Error:* Red outline on empty submission with helper message.

---

### Route 3: `/payment-checkpoint` — Pre-Transaction Safety Sandbox
- **Path:** `/payment-checkpoint`
- **Component File:** `frontend/src/pages/PaymentCheckpointPage.tsx`
- **Primary Purpose:** Pre-transaction safety verification before scanning a QR code or entering a UPI PIN.
- **Accessible By:** Sidebar link, Overview deep-link, direct URL navigation.
- **Authentication:** Scoped to active user; simulation results can be persisted as incidents.
- **Sub-components:**
  - `Payment Form`: Recipient VPA / Account input, Amount field (INR), Purpose selector.
  - `Pre-Payment Safety Checklist`: 4 mandatory interactive checkmarks (e.g., "PIN is only for sending money, never receiving").
  - `Risk Evaluation Banner`: Color-coded warning if VPA matches known impersonation keywords (CBI, Police, Refund).
  - `Halt Payment Interlock`: High-risk alert preventing impulsive completion.
  - `Save Incident Action`: Persists high-risk check to incident history for family visibility.
  - `Simulation Guarantee Disclaimer`: Clearly marked banner stating no real banking transaction occurs.
- **API Dependencies:**
  - `POST /api/payment/check`
  - `POST /api/payment/save-incident`
- **Observed States:**
  - *Initial:* Checklist unchecked, Check button disabled until required fields entered.
  - *Safe Check:* Green banner with confirmation to proceed safely.
  - *High Risk / Blocked:* Red modal warning with emergency advice.

---

### Route 4: `/family-shield` — Trusted Guardian Network
- **Path:** `/family-shield`
- **Component File:** `frontend/src/pages/FamilyShieldPage.tsx`
- **Primary Purpose:** Management of family guardians, consent verification, and real-time security alert dispatches.
- **Accessible By:** Sidebar link, Header alerts link, direct URL navigation.
- **Authentication:** Scoped to active user ID.
- **Sub-components:**
  - `Guardian Contact Cards`: Grid of trusted contacts showing name, phone, relationship, consent status.
  - `Add Contact Modal`: Form with name, phone, relationship dropdown, notification preferences.
  - `Consent Status Indicator`: Green "Consent Verified" vs Amber "Pending Consent" badge.
  - `Simulate Alert Dispatch Button`: Triggers live SOS alert across WebSocket.
  - `Alert Delivery History`: Table showing past dispatches, delivery channels, and acknowledgement timestamps.
  - `Carrier SMS Logs Drawer`: Simulated telecom carrier transmission log.
- **API Dependencies:**
  - `GET /api/contacts`
  - `POST /api/contacts`
  - `PUT /api/contacts/{id}`
  - `DELETE /api/contacts/{id}`
  - `POST /api/contacts/{id}/verify-consent`
  - `POST /api/contacts/{id}/revoke-consent`
  - `GET /api/alerts`
  - `POST /api/alerts/dispatch`
  - `GET /api/alerts/carrier-logs`
- **Observed States:**
  - *Loaded:* Displays pre-seeded contact (Aarav Sharma - Son - Verified).
  - *Pending Consent:* Disables alert dispatch until explicit consent is toggled.
  - *Alert Sent:* Live toast confirmation, WebSocket audio chime, table row update.

---

### Route 5: `/golden-hour` — Golden Hour Recovery Desk
- **Path:** `/golden-hour`
- **Component File:** `frontend/src/pages/GoldenHourRecoveryPage.tsx`
- **Primary Purpose:** Rapid fraud response within the critical first 60 minutes after financial compromise.
- **Accessible By:** Sidebar link, direct URL navigation.
- **Authentication:** Scoped to active user. Incidents loaded from user's incident history.
- **Sub-components:**
  - `Golden Hour Countdown Banner`: Simulated 60-minute recovery window timer with guidance notes.
  - `Emergency Action Cards`: Direct 1930 National Cybercrime Helpline quick-dial trigger.
  - `Incident Linker Dropdown`: Selects existing incident to pre-populate fraud details.
  - `Bank Freeze Mandate Form`: Generates simulated formal bank freeze request with UTR and amount.
  - `Cybercrime Portal Complaint Generator`: Formats standardized legal complaint for cybercrime.gov.in.
  - `Legal Copy Action`: One-click copy formatted complaint text to clipboard.
  - `Simulation Boundary Disclaimers`: Prominent disclaimer: *"PROTOTYPE SIMULATION ONLY: No actual bank account lien was placed. In a real emergency, call 1930."*
- **API Dependencies:**
  - `GET /api/incidents`
  - `GET /api/incidents/{id}`
  - `GET /api/recovery/helplines`
  - `POST /api/recovery/submit-bank-freeze`
  - `POST /api/recovery/submit-cybercrime-portal`
  - `GET /api/recovery/case-context/{id}`
- **Observed States:**
  - *Initial:* Emergency numbers visible, freeze mandate form empty.
  - *Incident Selected:* Auto-fills suspect VPA, transaction amount, and incident timeline.
  - *Freeze Submitted:* Displays simulated reference ID and compliance instructions.

---

### Route 6: `/incident-history` — Forensic Audit & Incident Archive
- **Path:** `/incident-history`
- **Component File:** `frontend/src/pages/IncidentHistoryPage.tsx`
- **Primary Purpose:** Historical record of all analyzed communications, payment blocks, and reported fraud incidents.
- **Accessible By:** Sidebar link, Overview table deep-link, direct URL navigation.
- **Authentication:** Strictly scoped to active user; user 2 cannot see user 1 incidents.
- **Sub-components:**
  - `Search & Filter Bar`: Text search, risk severity filter (All, Critical, High, Medium, Low), category filter.
  - `Incident Cards / Table`: Chronological listing with timestamp, classification, risk badge, channel icon.
  - `Forensic Detail Modal`: Deep inspection of original text, extracted evidence tokens, and audit log events.
  - `Delete Incident Action`: Removes incident with server-side ownership verification.
- **API Dependencies:**
  - `GET /api/incidents`
  - `GET /api/incidents/{id}`
  - `DELETE /api/incidents/{id}`
- **Observed States:**
  - *Loaded:* Displays pre-seeded and newly scanned incidents.
  - *Filtered:* Dynamically filters rows based on search query or severity pill.
  - *Empty:* Friendly illustration when search matches no incidents.

---

### Route 7: `/settings` — Platform Settings & User Profile
- **Path:** `/settings`
- **Component File:** `frontend/src/pages/SettingsPage.tsx`
- **Primary Purpose:** Complainant profile management, AI engine provider credentials, and database reset controls.
- **Accessible By:** Sidebar link, direct URL navigation.
- **Authentication:** Scoped to active user.
- **Sub-components:**
  - `Complainant Profile Form`: Full name, phone number, email, primary bank, city, language preference.
  - `IBM watsonx.ai Bridge Card`: Configures API Key, Project ID, and Model ID with secure password masking.
  - `Platform Capabilities Overview`: Read-only indicators for Tesseract, Whisper, and rule engine status.
  - `Demo Database Reset Modal`: Allows resetting database to clean demo state with seed data.
- **API Dependencies:**
  - `GET /api/settings/profile`
  - `PUT /api/settings/profile`
  - `GET /api/settings`
  - `PUT /api/settings/system`
  - `POST /api/settings/reset-database`
- **Observed States:**
  - *Loaded:* Pre-fills Rajesh Sharma profile details.
  - *Saved:* Toast notification confirming profile update.
  - *Resetting:* Spinner while SQLite database re-seeds.

---

### Route 8: `*` — Catch-All Fallback
- **Path:** `*`
- **Behavior:** Defined as `<Route path="*" element={<Navigate to="/" replace />} />`.
- **Observed Result:** Unknown routes (e.g. `/unknown-path`) automatically redirect to `/` (Security Overview) without displaying a blank page or 404 crash.

---

## 3. Global Layout Components

| Component | File Path | Interactive Elements |
| :--- | :--- | :--- |
| **Header** | `src/components/layout/Header.tsx` | - Global Search input<br>- Notifications Bell trigger & dropdown menu<br>- Language selector modal trigger<br>- User Profile / Persona switcher button<br>- WebSocket "Live WS" status pill<br>- Presenter Deck modal button |
| **Sidebar** | `src/components/layout/Sidebar.tsx` | - Logo / brand mark link to `/`<br>- 7 Navigation links (`NavLink` with active indicator)<br>- Emergency 1930 Helpline callout card |
| **MobileHeader** | `src/components/layout/MobileHeader.tsx` | - Hamburger menu toggle drawer<br>- Compact brand logo<br>- Quick emergency 1930 button |
| **DemoModeIndicator** | `src/components/layout/DemoModeIndicator.tsx` | - Floating demo mode status tag<br>- Database seed status indicator |
| **PresenterControlModal**| `src/components/demo/PresenterControlModal.tsx` | - Preset scenario inject triggers<br>- Health verification panel<br>- Model capability indicators |
