# Satark Saathi — Master Design System (v2.0)
**Digital Scam Prevention & Family Safety Platform**  
*Stripe Discipline · Linear Interaction Precision · Radix Scales · WCAG 2.2 AA*

---

## 1. Design Direction & Brand Personality

Satark Saathi ("Alert Companion") is a mission-critical consumer and family cyber-defense platform designed for Indian digital payment users, elderly parents, and digital citizens. It bridges cutting-edge scam intelligence with reassuring, calm, accessible human ergonomics.

### 1.1 Brand Attributes
- **Trust & Protection:** Reassuring, institutional-grade authority without intimidation.
- **Calm Confidence:** De-escalating panic. When high risk is detected, the UI never induces fight-or-flight panic; instead, it provides immediate, actionable, step-by-step clarity.
- **Practical Intelligence:** Evidence-backed analysis with verifiable rationale rather than opaque AI claims.
- **Approachability:** Bilingual affordances (English & Hindi hints), accessible font scales, and high contrast suitable for multi-generational families.

### 1.2 Design Foundations & References
- **Stripe Product Discipline:** High typographic clarity, disciplined layouts, restrained color accents, elevated card surfaces, and structured tabular data.
- **Linear Interaction Precision:** Compact information architecture, clear active states, minimal decorative fluff, predictable keyboard focus, and smooth modal dialogs.
- **Radix Colors Token Scales:** Systematic semantic token scales ensuring accessible contrast ratios across light and dark surfaces.

---

## 2. Master Color Tokens

All colors are centralized in `frontend/tailwind.config.js` and defined via CSS custom properties in `frontend/src/index.css`.

### 2.1 Core Identity Palette

| Token Name | Hex Code | Intended Semantic Usage | WCAG AA Contrast (on Pure White / Canvas) |
| :--- | :--- | :--- | :--- |
| **Midnight Ink** | `#142A36` | Brand depth, primary headings, sidebar background, dark accents | 14.2:1 (AAA) |
| **Trust Green** | `#176B58` | Primary CTA buttons, brand badges, active nav indicators | 5.8:1 (AA Normal) |
| **Warm Ivory** | `#F7F8F4` | Global application canvas background | 1.05:1 (Subtle surface distinction from Pure White) |
| **Pure White** | `#FFFFFF` | Cards, forms, modals, dialog surfaces, elevated containers | Surface |
| **Soft Sage** | `#DCEDE5` | Secondary highlights, selected row backgrounds, pill badges | Tint / Pill |
| **Secondary Text** | `#64748B` | Supporting descriptions, metadata, timestamps, input placeholders | 4.6:1 (AA) |
| **Border Gray** | `#E2E8F0` | Dividers, card boundaries, input borders | 1.3:1 (Structural boundary) |
| **Warning Amber** | `#D69B36` | Caution alerts, verification step reminders | 3.2:1 (Used with dark amber text `#78350F`) |

### 2.2 Risk & Threat Semantic Colors (Strictly Independent from Brand)

> **Architectural Guardrail:** Risk severity tokens are NEVER conflated with brand colors. Risk is always communicated via three independent channels: **Color + Explicit Text Label + Semantic Icon + Plain-language Next Steps**.

| Risk Level | Surface Hex | Border Hex | Text Hex | Meaning & Protocol |
| :--- | :--- | :--- | :--- | :--- |
| **CRITICAL / RED** | `#FEF2F2` (Red-50) | `#FECACA` (Red-200) | `#991B1B` (Red-800) | Severe suspected fraud/extortion. Immediate stop; trigger guardian alert or 1930. |
| **CAUTION / AMBER** | `#FFFBEB` (Amber-50) | `#FDE68A` (Amber-200) | `#92400E` (Amber-800) | Anomalies detected. Requires independent verification before transfer. |
| **LOW RISK / GREEN** | `#ECFDF5` (Emerald-50) | `#A7F3D0` (Emerald-200) | `#065F46` (Emerald-800) | No active indicators detected. *Explicit disclaimer: Safety is never guaranteed.* |
| **INFORMATION** | `#EFF6FF` (Blue-50) | `#BFDBFE` (Blue-200) | `#1E40AF` (Blue-800) | Neutral system notices, model disclosures, educational hints. |

---

## 3. Typography & Hierarchy

The application utilizes a modern, legible sans-serif font stack (`system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif`), eliminating external render-blocking font downloads.

### 3.1 Typographic Scale

| Role | Font Size | Line Height | Weight | Tracking | Usage |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Page Title** | `1.25rem` (20px) | `1.75rem` (28px) | Bold (700) | `-0.025em` | Route header title (`h1`) |
| **Section Heading** | `1.0rem` (16px) | `1.5rem` (24px) | Bold (700) | `-0.015em` | Card & workflow headers (`h2`, `h3`) |
| **Card Title** | `0.875rem` (14px) | `1.25rem` (20px) | Semibold (600) | `normal` | Sub-section cards, preset labels |
| **Body Standard** | `0.875rem` (14px) | `1.375rem` (22px) | Regular (400) | `normal` | Incident descriptions, explanations |
| **Body Compact** | `0.75rem` (12px) | `1.125rem` (18px) | Regular / Medium | `normal` | Input labels, table rows, button text |
| **Metadata / Micro** | `0.6875rem` (11px) | `1.0rem` (16px) | Medium (500) | `+0.01em` | Timestamps, UTR tags, disclaimers |
| **Overline / Category**| `0.625rem` (10px) | `0.875rem` (14px) | Bold (700) | `+0.05em` | Uppercase badge category labels |

---

## 4. Spacing, Geometry & Elevation

### 4.1 Spacing Units
Consistent 4px grid rhythm:
- `p-2` (8px), `p-3` (12px), `p-4` (16px), `p-5` (20px), `p-6` (24px).
- Max container widths: `max-w-7xl` (1280px) for wide dashboard grids; `max-w-4xl` for focused single-column recovery wizards.

### 4.2 Corner Radii
- **`rounded-xl` (12px):** Standard interactive elements (buttons, inputs, dropdown items, alert cards).
- **`rounded-2xl` (16px):** Primary content cards, layout containers, modal dialogs.
- **`rounded-full` (9999px):** Status badges, avatar pills, icon action wrappers.

### 4.3 Elevation & Shadows
- **Card Surface (`shadow-card`):** `0 1px 3px 0 rgba(20, 42, 54, 0.05), 0 1px 2px -1px rgba(20, 42, 54, 0.03)`
- **Subtle Surface (`shadow-subtle`):** `0 1px 2px 0 rgba(20, 42, 54, 0.04)`
- **Floating Modals / Toasts (`shadow-2xl`):** `0 20px 25px -5px rgba(20, 42, 54, 0.2)`

---

## 5. Shared Component Library

### 5.1 Buttons (`Button.tsx` / standard class pattern)
- **Primary Action:** `bg-[#176B58] hover:bg-[#135948] text-white rounded-xl shadow-subtle font-semibold`
- **Secondary Action:** `bg-white hover:bg-[#F7F8F4] text-[#142A36] border border-[#E2E8F0] rounded-xl font-semibold`
- **Destructive Action:** `bg-red-700 hover:bg-red-800 text-white rounded-xl shadow-subtle font-semibold`
- **Emergency Helpline:** `bg-[#142A36] hover:bg-black text-white rounded-xl font-bold`

### 5.2 Form Inputs
- **Text & Textarea Inputs:** `bg-[#F7F8F4] focus:bg-white border border-[#E2E8F0] rounded-xl text-xs sm:text-sm text-[#142A36] focus:ring-1 focus:ring-[#176B58] focus:border-[#176B58] transition-all`
- **Checkboxes & Radios:** `rounded text-[#176B58] focus:ring-[#176B58] border-[#CBD5E1]`

### 5.3 RiskSeverityBadge (`RiskSeverityBadge.tsx`)
- Renders severity icon (`ShieldCheck`, `AlertTriangle`, `AlertOctagon`).
- Formats normalized status text: `Critical Risk`, `High Risk`, `Caution`, `Safe`.
- Shows score fraction `(85/100)`.

### 5.4 Simulation & Sandbox Banners (`SimulationBanner.tsx`)
- High-visibility banner across simulated features (Payment Checkpoint, Golden Hour Interbank Freeze).
- Distinct amber/slate styling preventing users or evaluators from mistaking sandbox actions for live banking/police filings.

### 5.5 30-Second AI Safety Check-in Modal
- Interactive modal to counter cognitive tunnel vision during ongoing extortion/digital arrest calls.
- 3 calibrated diagnostic questions (Bilingual English + Hindi).
- Real-time diagnostic synthesis: Digital Arrest / Extortion vs. Investment Fraud vs. Low Coercion.

---

## 6. Accessibility & Responsiveness Contract

1. **WCAG 2.2 AA Compliance:** All primary and secondary text achieves $\ge 4.5:1$ contrast ratio against Warm Ivory (`#F7F8F4`) and Pure White (`#FFFFFF`).
2. **Keyboard Focus:** High-visibility focus indicators (`focus:ring-2 focus:ring-[#176B58] focus:ring-offset-1`).
3. **Multi-device Layouts:** Tested across 320px (iPhone SE), 375px (iPhone 12/13), 768px (iPad Mini), 1366px (Laptop), and 1920px (Desktop) without horizontal scrolling or clipped CTAs.
4. **Motion Safety:** All animations respect `prefers-reduced-motion: reduce`.
