# Satark Saathi — UI Component & Design System Specification
**Version:** 2.0 (Master UI/UX Transformation)  
**Repository:** `D:\SatarkSaathi\satark-saathi`  
**Target GitHub:** `https://github.com/Sarveshk-2006/SaTarkSaThi`  
**Status:** Verified & Enforced

---

## 1. Design Philosophy & Aesthetic Principles

Satark Saathi is a digital safety, scam prevention, and family protection platform for India. Its interface must communicate **trust without exaggerated claims**, **security without panic**, and **clarity for non-technical citizens and elders**.

### Core Tenets:
1. **Credible Digital Trust & Fintech Craftsmanship**: Clean editorial structure inspired by modern institutional fintech and security platforms (e.g. Stripe, Linear, Gov.uk, Indian CERT-In guidelines).
2. **Restrained Color & High Accessibility**: Strict semantic color tokens; no arbitrary neon gradients or decorative excess.
3. **Multi-Modal Threat Semantics**: Never communicate threat level by color alone. Every risk indicator pairs distinct semantic color with an explicit textual label, numeric score fraction (e.g. `92/100`), icon, and plain-language protective advice.
4. **Honest Simulation Transparency**: Where an operation simulates a high-stakes banking freeze (RBI zero-liability lien) or national cybercrime portal e-filing (1930 / cybercrime.gov.in), prominent `SimulationBanner` alerts ensure no false expectations are created.

---

## 2. Design Tokens

### 2.1 Color Palette

| Token Name | Hex Code | Semantic Role & Usage |
| :--- | :--- | :--- |
| `brand.navy` | `#14243A` | Primary ink, dark shell banners, high-contrast modal headers, brand typography |
| `brand.teal` | `#176B58` | Primary interactive accent, active navigation, primary action buttons, verified badges |
| `brand.tealLight` | `#E8F5EF` | Primary tint, badge backgrounds, pill highlights, hover state fills |
| `brand.bg` | `#F6F8FB` | Main application canvas background (subtle warm-slate tint) |
| `brand.surface` | `#FFFFFF` | Surface cards, dialog modals, drawer backgrounds, data tables |
| `brand.textPrimary`| `#182536` | Headings, primary labels, table values, input text |
| `brand.textSecondary`| `#64748B` | Subtitles, supporting copy, metadata timestamps, input placeholders |
| `brand.border` | `#E2E8F0` | Dividers, container borders, input field strokes, table gridlines |

### 2.2 Threat Status Semantics

| Threat Tier | Badge Fill | Badge Border | Text Color | Icon | Semantic Meaning |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **SAFE / GREEN** | `#ECFDF5` | `#A7F3D0` | `#065F46` | `ShieldCheck` | No strong risk indicators detected. *Explicit disclaimer: Safety not guaranteed.* |
| **CAUTION / AMBER** | `#FFFBEB` | `#FDE68A` | `#92400E` | `AlertTriangle` | Moderate risk / suspicious indicators. Independent offline verification advised. |
| **HIGH / RED** | `#FFF1F2` | `#FECDD3` | `#9F1239` | `ShieldAlert` | Elevated threat indicators detected. Immediate protective steps recommended. |
| **CRITICAL / RED** | `#FEF2F2` | `#FCA5A5` | `#991B1B` | `AlertOctagon` | Severe digital arrest / extortion threat. Emergency family alerts & freeze advised. |

### 2.3 Typography Scale

- **Font Family**: Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif.
- **Font Mono**: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace.

| Scale Token | Class | Size / Line-Height | Weight | Usage |
| :--- | :--- | :--- | :--- | :--- |
| **Display** | `text-2xl` | 24px / 32px | Bold (700) | Major landing greetings |
| **Page Title** | `text-xl` | 20px / 28px | Bold (700) | Page headers, wizard titles |
| **Section Title**| `text-lg` | 18px / 26px | Bold (700) | Card groups, modality titles |
| **Card Title** | `text-base` | 16px / 24px | Semibold (600) | Primary cards, modal titles |
| **Body Regular** | `text-sm` | 14px / 20px | Regular (400) / Medium (500) | Inputs, narrative text, tables |
| **Body Small** | `text-xs` | 12px / 18px | Regular (400) / Medium (500) | Form labels, descriptions, subtext |
| **Micro Tag** | `text-[10px]`| 10px / 14px | Bold (700) / Semibold (600) | Status pills, uppercase badges |

### 2.4 Spacing, Radii & Shadows

- **Border Radii**:
  - `rounded-xl` (`12px`): Form inputs, action buttons, small badges, notification popovers.
  - `rounded-2xl` (`16px`): Primary cards, wizard steps, emergency banners, modals, sidebars.
  - `rounded-full` (`9999px`): Status pills, user avatar badges, online WebSocket indicator.
- **Shadows**:
  - `shadow-xs`: Subtle card hover states (`0 1px 2px 0 rgba(0, 0, 0, 0.05)`).
  - `shadow-sm`: Default card containers.
  - `shadow-md`: Primary high-priority emergency banners, active modals, floating drawers.
  - `shadow-xl`: Main floating dialogs with backdrop blur.

---

## 3. Shared Component Primitives Inventory

### 3.1 `SimulationBanner` (`src/components/common/SimulationBanner.tsx`)
- **Purpose**: Displays an accessible, non-dismissible or dismissible amber notice whenever a workflow involves sandbox simulations (e.g. Payment Checkpoint sandbox, Bank lien dispatch, Cybercrime portal draft filing).
- **Styling**: `bg-amber-50/90 border border-amber-200/80 text-amber-900 rounded-xl p-3.5 flex items-start gap-2.5 shadow-xs`.
- **Icon**: `AlertTriangle` in amber.

### 3.2 `RiskSeverityBadge` (`src/components/common/RiskSeverityBadge.tsx`)
- **Purpose**: Renders standard threat badges across Scam Analyzer, Incident History, and Family Shield.
- **Contract Preservation**: Preserves exact test string assertions:
  - `"High Risk"`, `"(92/100)"`
  - `"Caution"`
  - `"Safe"`
  - Added support for `"CRITICAL"`, `"HIGH_RISK"`, `"LOW"`, and numeric scores.

### 3.3 `LoadingSkeleton` (`src/components/common/LoadingSkeleton.tsx`)
- **Purpose**: Displays pulse-animated shimmer blocks for asynchronous API data loading states.
- **Usage**: Tables, detail drawers, contact cards, metric summaries.

### 3.4 `EmptyState` (`src/components/common/EmptyState.tsx`)
- **Purpose**: Reusable zero-data presentation with icon, title, description, and primary CTA.
- **Usage**: Empty incident history searches, zero trusted contacts configured, zero alerts dispatched.

### 3.5 `ConfirmationModal` (`src/components/common/ConfirmationModal.tsx`)
- **Purpose**: High-trust confirmation dialog for consequential actions (deleting contact, purging database, resetting workspace).
- **Features**: Backdrop blur, trap focus, explicit danger vs safe action buttons, keyboard ESC dismissal.

### 3.6 `CopyButton` (`src/components/common/CopyButton.tsx`)
- **Purpose**: One-click clipboard copy for Golden Hour dispute drafts, UTR numbers, and incident IDs.
- **Feedback**: Temporary icon transformation to checkmark with 2-second timeout and toast confirmation.

---

## 4. Application Shell & Navigation Architecture

### 4.1 Sidebar (`src/components/layout/Sidebar.tsx`)
- **Width**: `w-64` (Desktop fixed navigation rail).
- **Theme**: Deep navy `#14243A` with forest teal active states (`bg-[#176B58] text-white`).
- **Required Section Labels** (Preserved verbatim for tests):
  - `'Satark Saathi'`
  - `'Overview'`
  - `'Scam Analyzer'`
  - `'Family Shield'`
  - `'Payment Checkpoint'`
  - `'Golden Hour Recovery'`
  - `'Incident History'`
  - `'Settings'`
  - `'Cyber Crime: 1930'`
- **Components**: `DemoModeIndicator`, Emergency 1930 quick call badge, offline sync indicator.

### 4.2 Header (`src/components/layout/Header.tsx`)
- **Height**: `h-16` with crisp bottom border `#E2E8F0` and canvas surface.
- **Interactive Controls**:
  - Search trigger with global shortcut hint.
  - Multi-language dropdown (English / हिन्दी / मराठी).
  - Real-time WebSocket connection status pill (`WebSocket Live` vs `Reconnecting`).
  - Active persona switcher (`Rajesh (Protected Senior)` vs `Aarav (Family Guardian)`).
  - Quick Presenter Deck launch button.

### 4.3 Mobile Navigation (`src/components/layout/MobileHeader.tsx`)
- **Height**: `h-14` responsive top bar.
- **Features**: Brand badge, 1930 emergency quick-call pill, slide-over navigation drawer with backdrop blur, touch-friendly `44px` minimum hit targets.

---

## 5. Domain Workspace Components

### 5.1 Scam Analyzer Workspace (`src/pages/ScannerPage.tsx`)
- **Tabs**: 4 distinct modality selectors:
  1. `Text Analysis` (SMS, WhatsApp, Email messages)
  2. `Suspicious URL` (Domain age, static heuristic, phishing heuristics)
  3. `Screenshot / OCR` (Payment receipts, fake police warrants, arrest letters)
  4. `Voice Evidence / Audio` (Whisper transcription & speech extortion analysis)
- **Presets**: 4 authentic Indian scam scenarios (Digital Arrest, Electricity Bill Threat, Telegram Task Scam, Legitimate Bank Alert).
- **Assessment Card**: Multi-tier risk severity header, confidence score gauge, forensic signal tags, direct SOS dispatch modal trigger.

### 5.2 Family Shield Network (`src/pages/FamilyShieldPage.tsx`)
- **Features**:
  - Live 2-device demonstration notification status banner.
  - Guardian contact cards with consent authorization badges (`Consent Granted` vs `Consent Pending`).
  - 6-digit OTP phone verification modal.
  - Live in-app alert simulation broadcast modal.
  - Indian Telecom DLT Carrier SMS audit trail viewer.

### 5.3 Golden Hour Recovery Wizard (`src/pages/GoldenHourRecoveryPage.tsx`)
- **Emergency Action**: Prominent 1930 National Cybercrime helpline banner with direct dial.
- **4-Step Wizard**:
  1. `Incident Particulars` (Category, channel, statement of facts).
  2. `Financial Details` (Loss amount, bank, optional missing UTR).
  3. `Evidence & Timeline` (Suspect contacts, transcripts, chronological milestones).
  4. `Recovery Actions` (Exportable TXT dispute dossier, interactive sandbox lien mandate, 1930 portal e-filing simulation).
- **Bank Directory**: 24x7 verified Indian bank emergency hotlines & dispute portal links.

### 5.4 Payment Checkpoint Sandbox (`src/pages/PaymentCheckpointPage.tsx`)
- **Features**:
  - Prominent pre-transaction simulation disclaimer.
  - Preset test cases (Fake Mumbai Police Bail Demand, Electricity Bill Payment, Legitimate Grocery Transfer).
  - Behavioral coercion checklists (caller on line, urgent ultimatum, screen sharing requested).
  - Incident dossier persistence button.

### 5.5 Incident History & Audit Ledger (`src/pages/IncidentHistoryPage.tsx`)
- **Features**:
  - Forensic filter bar (Search, scam category, risk level, status).
  - Responsive audit table with status tags.
  - Interactive right-side forensic detail drawer.
  - Chronological audit events trail with JSON export.
