# SATARK SAATHI — BASELINE & FEATURE INVENTORY
## Phase 0 Architectural Inspection & Functional Route Inventory

**Project:** Satark Saathi — Digital Scam Prevention & Family Safety Platform  
**Repository:** `D:\SatarkSaathi\satark-saathi`  
**Target GitHub:** `https://github.com/Sarveshk-2006/SaTarkSaThi`  
**Production URL:** `https://satark-saathi-mu.vercel.app`  
**Audit & Baseline Date:** October 24, 2026  
**Status:** Baseline Established · Functional Integrity Guaranteed  

---

## 1. REPOSITORY & TECHNICAL STACK INSPECTION

### 1.1 Technical Stack & Dependencies
- **Core Framework:** React 19.2.8, React DOM 19.2.8
- **Language & Compiler:** TypeScript 6.0.2 (`tsc -b`), ECMAScript Modules (`"type": "module"`)
- **Build Tool:** Vite 8.3.0 (`@vitejs/plugin-react` 6.1.1)
- **Routing:** React Router DOM 7.18.4 (`BrowserRouter`, `Routes`, `Route`, `Navigate`, `NavLink`, `useNavigate`, `useLocation`)
- **Styling Architecture:** Tailwind CSS 3.4.17, PostCSS 8.5.30, Autoprefixer 10.6.1
- **Icons:** Lucide React 1.56.0 (Consistent SVG line icons)
- **Data Visualization:** Recharts 3.10.1 (Used in Overview metrics)
- **Testing Tools:** Vitest 5.0.4, `@testing-library/react` 16.3.3, `@testing-library/jest-dom` 7.0.1, JSDOM 29.1.1
- **Linter:** Oxlint 1.81.0

### 1.2 Baseline Verification Metrics
- **Backend Test Suite:** 236 / 236 passing (`pytest backend/tests/ -v`, execution time: 43.84s).
- **Frontend Test Suite:** 8 / 8 passing (`vitest run`, execution time: 3.36s).
- **Production Build:** Vite production build compiles cleanly without errors in 2.09s (`dist/` generated: JS 856 kB, CSS 43.7 kB).
- **API Latency Baseline:** 
  - Text Scam Analysis: **0.79 ms**
  - Pre-Transaction Simulation with DB write: **10.01 ms**

---

## 2. APPLICATION SHELL & STATE MANAGEMENT PATTERNS

### 2.1 Context Providers (Wrapped in `App.tsx`)
1. **`ToastContext` (`ToastProvider`):** Global feedback system providing accessible, auto-dismissing toast notifications (`success`, `error`, `warning`, `info`).
2. **`DemoModeContext` (`DemoModeProvider`):** Manages mock offline state fallback, backend connectivity polling, and presenter control triggers.
3. **`LanguageContext` (`LanguageProvider`):** Multilingual localized meta dictionary covering English, Hindi, Marathi, and Kannada.
4. **`NotificationContext` (`NotificationProvider`):** Manages live WebSocket subscriptions to `/alerts/ws`, demo user switching (Persona 1: Rajesh, Persona 2: Priya, Persona 3: Vikram, Persona 4: Sunita), and unread badge counters.

### 2.2 Global Layout Hierarchy (`frontend/src/components/layout/`)
- **`AppLayout.tsx`:** Standard desktop/mobile frame wrapping `<Sidebar />`, `<Header />`, `<MobileHeader />`, and `<Outlet />`.
- **`Sidebar.tsx`:** Fixed desktop navigation rail with 7 primary route links, active route highlights, brand shield mark, and helpline badge.
- **`Header.tsx`:** Desktop top bar with incident search query input, quick language selector dropdown, live alert notification bell with dropdown tray, demo persona switcher, and presenter controls trigger.
- **`MobileHeader.tsx`:** Responsive mobile app bar with brand header, one-tap `tel:1930` emergency dialer, and accessible hamburger drawer.

---

## 3. ROUTE-BY-ROUTE FEATURE INVENTORY

| Route Path | Page Component | Functional Purpose | Real Backend Integrations | User Interactions & Workflows |
| :--- | :--- | :--- | :--- | :--- |
| `/` | `OverviewPage.tsx` | Executive safety dashboard, threat status overview, quick scan entry | `GET /stats/overview`, `GET /alerts`, `GET /incidents` | - Quick launcher buttons to Scanner, Checkpoint, Family Shield.<br>- Real database metrics (Active Guardians, Scans Today, Blocked Coercion).<br>- Recent Threat Alert audit cards with 1-click incident routing. |
| `/scanner` | `ScannerPage.tsx` | Multi-modal digital scam analysis engine | `POST /scanner/analyze`, `POST /scanner/analyze-url`, `POST /scanner/analyze-image`, `POST /scanner/analyze-audio` | - 4 Analysis Tabs: Raw Text, Phishing URL, Screenshot OCR, Audio Whisper.<br>- Sample presets (Digital Arrest, Electricity Bill, Army Rental, Benign Bank).<br>- Unified Risk Scorecard: Policy Tier (`GREEN`, `AMBER`, `RED`), heuristic score, reason codes, verbatim evidence excerpts, plain-language advisory.<br>- 1-click action to save scan as authoritative incident. |
| `/payment-checkpoint` | `PaymentCheckpointPage.tsx` | Pre-transaction UPI VPA scanner & coercion checklist sandbox | `GET /payment/simulations`, `POST /payment/simulate`, `POST /payment/simulations/{id}/save-incident` | - VPA input, amount, beneficiary name, new recipient toggle.<br>- Behavioral coercion checkboxes (Authority claimed, Secrecy demanded, Urgent pressure, Guaranteed returns).<br>- 4 presets (Digital Arrest bail, Electricity disconnection, Telegram crypto, Benign kirana).<br>- Evaluates score in 10ms; displays verified action checklist.<br>- 1-click buttons: "Alert Family Shield" and "Save Authoritative Incident". |
| `/family-shield` | `FamilyShieldPage.tsx` | Trusted guardian network & real-time emergency alert dispatch | `GET /contacts`, `POST /contacts`, `PUT /contacts/{id}`, `DELETE /contacts/{id}`, `POST /contacts/{id}/verify/request`, `POST /contacts/{id}/verify/confirm`, `GET /alerts`, `POST /alerts/dispatch`, `POST /alerts/{id}/acknowledge`, `POST /alerts/{id}/retry`, `GET /alerts/carrier-logs` | - Guardian Contact CRUD with relationship, phone, and threshold.<br>- In-app 6-digit OTP verification flow with auto-fill demo hint.<br>- Unilateral user consent grant/revoke.<br>- Real-time WebSocket toast alerts upon threat dispatch.<br>- DLT carrier SMS log inspector with template tracking.<br>- Guardian alert acknowledgement and delivery retry. |
| `/golden-hour` | `GoldenHourRecoveryPage.tsx` | Post-loss recovery desk, 1930 helpline guidance, legal complaint drafts | `GET /recovery/helplines`, `GET /recovery/cases/{id}`, `POST /recovery/wizard`, `PUT /recovery/drafts/{id}`, `GET /recovery/drafts/{id}/export`, `POST /recovery/submit-bank-freeze`, `POST /recovery/submit-cybercrime-portal` | - 1930 Emergency Protocol banner with 2-hour countdown guidance.<br>- 4-Step Recovery Wizard (Incident details -> Bank selection & recall -> Evidence & timeline -> Formal legal complaint drafts).<br>- Generates formal drafts for Cyber Crime Portal, Bank Nodal Officer, Cyber Police Station.<br>- Supports pending UTR without hallucinating data.<br>- Export dossier as `.txt` / `.md`.<br>- Sandbox bank freeze and cybercrime portal submission simulation. |
| `/incident-history` | `IncidentHistoryPage.tsx` | Forensic archive of analyzed threat incidents and simulation dossiers | `GET /incidents`, `DELETE /incidents/{id}`, `GET /incidents/export` | - Full-text search by title, incident ID, suspect handle, bank.<br>- Filters by Status (`UNDER_REVIEW`, `FREEZE_REQUESTED`, `RESOLVED`) and Severity (`CRITICAL`, `HIGH`, `MEDIUM`, `LOW`).<br>- Detailed incident card view with timeline, UTR, financial loss.<br>- 1-click navigation to Golden Hour recovery for unfiled incidents.<br>- Safe deletion with confirmation modal.<br>- Dossier export. |
| `/settings` | `SettingsPage.tsx` | Complainant profile, AI model bridge configuration, evaluation controls | `GET /profile`, `PUT /profile`, `GET /settings/watsonx`, `PUT /settings/watsonx` | - Complainant identity settings (Full name, phone, email, city, primary bank).<br>- IBM watsonx.ai Granite model credentials configuration with validation.<br>- Data retention controls and evaluation audit link. |

---

## 4. SHARED REUSABLE COMPONENTS INVENTORY

1. **`SimulationBanner.tsx`:** High-visibility contextual disclosure banner distinguishing sandbox prototype simulations from live bank operations.
2. **`RiskSeverityBadge.tsx`:** Standardized threat tier badge mapping numeric score and category to distinct semantic colors, text labels, and icons.
3. **`EvidenceRow.tsx`:** Verbatim excerpt highlighter rendering detected manipulation indicators and rationale without truncating facts.
4. **`LoadingSkeleton.tsx`:** Accessible loading state skeletons with restrained pulse animation.
5. **`EmptyState.tsx`:** User-friendly empty state with descriptive guidance and primary action triggers.
6. **`ErrorState.tsx`:** Graceful error boundary state with retry actions.
7. **`ConfirmationModal.tsx`:** Accessible dialog for destructive actions (e.g., deleting a contact or incident).
8. **`CopyButton.tsx`:** 1-click clipboard helper with confirmation state.
9. **`PresenterControlModal.tsx`:** Demo controls modal allowing instant state reset, test alert triggers, and persona switching for hackathon evaluation.

---

## 5. DESIGN & ARCHITECTURAL GAPS TO ADDRESS IN TRANSFORMATION

1. **Palette Harmony:** The existing UI uses `#F6F8FB` (cool slate); the master design specification mandates **Warm Ivory (`#F7F8F4`)** as the background surface canvas, accented by **Midnight Ink (`#142A36`)**, **Trust Green (`#176B58`)**, and **Soft Sage (`#DCEDE5`)**.
2. **Typography Discipline:** Align all typography strictly with Stripe-like clarity: clean font weights, controlled tracking, deliberate line heights, and absence of visual clutter.
3. **Linear-like Interaction Precision:** Tighter, more purposeful interaction states (subtle borders, refined button elevations, clean focus rings, compact tables).
4. **Risk State Separation:** Guarantee that threat levels (`GREEN`, `AMBER`, `RED`) strictly use semantic indicators separate from the brand green `#176B58` so that user trust and threat visibility are never conflated.
5. **Responsive Integrity:** Ensure perfect rendering without horizontal clipping across all 5 test viewports (320px, 375px, 768px, 1366px, 1920px).

---

*Verified baseline established. Ready for Phase 1 Design Token implementation.*
