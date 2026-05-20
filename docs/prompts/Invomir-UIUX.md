---
name: invomir-uiux
description: >
  Master UI/UX skill for Invomir SaaS — Angular 21 + Angular Material + Tailwind CSS.
  Load this skill every time any frontend UI is being designed, built, reviewed, or styled for Invomir.
  Triggers: designing screens, building components, styling dashboards, creating modals/tables/forms/sidebars/navbars,
  applying themes, generating artifacts, reviewing UI code, or discussing any visual design decision in Invomir.
  Integrates brand guidelines, theme factory, skill-creator patterns, and web-artifacts-builder conventions
  into one unified Invomir frontend standard. Never produce a frontend response for Invomir without this skill.
---

# Invomir UI/UX Master Skill

> Unified frontend design system for Invomir SaaS.
> Stack: **Angular 21 · Angular Material · Tailwind CSS · RxJS · Signals**
> Inspired by: Stripe · Notion · Linear · Vercel · GitHub · Clerk

---

## 1. DESIGN PHILOSOPHY

Invomir UI must feel:

| ✅ Do | ❌ Avoid |
|---|---|
| Modern, minimal, premium | Over-designed, heavy gradients |
| Fast, airy, spacious | Random colors, neon effects |
| Clean, enterprise-grade | Inconsistent spacing/radius |
| Easy to scan, consistent | Cluttered dashboards, thick borders |
| Predictable, structured | Bouncing animations, colorful icon packs |

**The golden question before any UI decision:**
> *Would this fit on a Stripe, Linear, or Vercel dashboard?*

---

## 2. BRAND IDENTITY

### Color Palette

| Token | Value | Usage |
|---|---|---|
| `bg-neutral-50` | Background | Page backgrounds |
| `bg-white` | Card background | Cards, inputs, modals |
| `text-neutral-900` | Primary text | Headlines, labels |
| `text-neutral-500` | Secondary text | Descriptions, meta |
| `border-neutral-200` | Border | Cards, inputs, dividers |
| `primary` (brand) | Official brand color | Buttons, active nav, links, focus ring |
| `primary/10` | Brand tint | Active sidebar items |
| `primary/20` | Brand ring | Focus rings on inputs |

> **Rule:** Never introduce random per-component colors. All color decisions route through this table.

### Typography

**Font Family:**
```css
font-family: 'Inter', system-ui, sans-serif;
```

Never use: Poppins, Comic fonts, decorative fonts *(Note: Poppins is reserved for Anthropic brand contexts only — not Invomir)*.

### Type Scale

| Role | Classes | Usage |
|---|---|---|
| Page Title | `text-2xl font-semibold tracking-tight` | Dashboard title, main module heading |
| Section Title | `text-lg font-semibold` | Card titles, settings sections |
| Card Heading | `text-base font-semibold` | Card sub-headers |
| Body Text | `text-sm text-muted-foreground` | General content |
| Small / Labels | `text-xs text-muted-foreground` | Timestamps, helper text |
| Table Text | `text-sm` | All table content |
| Button Text | `text-sm font-medium` | All button labels |

**Font Weight Rules:**

| Context | Weight |
|---|---|
| Main titles, section headers | `font-semibold` |
| Labels | `font-medium` |
| Body, small text | `font-normal` |

---

## 3. SPACING SYSTEM

Use only these approved Tailwind spacing tokens:

```
2   → tiny spacing
4   → compact
6   → small
8   → normal
12  → medium
16  → section
24  → large section
32  → major separation
```

**Form field spacing:** `space-y-5`
**Never** mix arbitrary spacing values.

---

## 4. LAYOUT RULES

### Dashboard Structure
```
┌─────────────────────────────────┐
│  Sidebar (w-64)                 │
│  ┌───────────────────────────┐  │
│  │  Top Navbar (h-16)        │  │
│  ├───────────────────────────┤  │
│  │  Page Header              │  │
│  ├───────────────────────────┤  │
│  │  Content Area             │  │
│  │  max-w-7xl mx-auto        │  │
│  │  p-6 lg:p-8               │  │
│  └───────────────────────────┘  │
└─────────────────────────────────┘
```

**Content width:** Always `max-w-7xl mx-auto` — never full-bleed stretched layouts.
**Page padding:** `p-6 lg:p-8`
**Card padding:** `p-5`
**Modal padding:** `p-6`

---

## 5. COMPONENT LIBRARY

### Cards
```html
<div class="rounded-2xl border bg-white shadow-sm hover:shadow-md transition p-5">
  <!-- content -->
</div>
```

### Border Radius System
| Component | Class |
|---|---|
| Cards, Modals | `rounded-2xl` |
| Buttons, Inputs, Dropdowns | `rounded-xl` |

### Buttons

**Primary:**
```html
<button class="h-10 px-4 rounded-xl text-sm font-medium bg-primary text-white hover:bg-primary/90 transition">
  Action
</button>
```

**Secondary:**
```html
<button class="h-10 px-4 rounded-xl text-sm font-medium border bg-white hover:bg-neutral-50 transition">
  Cancel
</button>
```

**Danger (delete/destructive only):**
```html
<button class="h-10 px-4 rounded-xl text-sm font-medium bg-red-600 text-white hover:bg-red-700 transition">
  Delete
</button>
```

### Inputs
```html
<input class="h-10 w-full rounded-xl border bg-white px-3 text-sm
              focus:outline-none focus:ring-2 focus:ring-primary/20" />
```

Never: glowing inputs, thick borders, outdated box-shadow hacks.

### Forms
Every form field must include:
1. Label (`text-sm font-medium`)
2. Input
3. Helper text (`text-xs text-muted-foreground`)
4. Validation message

```html
<div class="space-y-5">
  <div class="flex flex-col gap-1.5">
    <label class="text-sm font-medium text-neutral-900">Invoice Number</label>
    <input class="h-10 rounded-xl border bg-white px-3 text-sm focus:ring-2 focus:ring-primary/20" />
    <p class="text-xs text-neutral-500">Auto-generated if left blank</p>
  </div>
</div>
```

### Tables
```html
<table class="w-full text-sm">
  <thead>
    <tr class="border-b">
      <th class="py-3 px-4 text-left font-medium text-neutral-600">Column</th>
    </tr>
  </thead>
  <tbody>
    <tr class="border-b hover:bg-neutral-50 transition">
      <td class="py-3 px-4">Value</td>
    </tr>
  </tbody>
</table>
```

Tables must be: clean, readable, spacious, responsive. Never: dense enterprise layouts, tiny text, too many borders.

### Sidebar
```html
<aside class="w-64 h-screen border-r bg-white flex flex-col">
  <!-- nav items -->
  <a class="flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium
            bg-primary/10 text-primary">  <!-- active state -->
    <svg class="size-4">...</svg>
    Invoices
  </a>
</aside>
```

### Navbar
```html
<header class="h-16 border-b bg-white flex items-center px-6 gap-4">
  <!-- minimal, not overcrowded -->
</header>
```

### Modals
```html
<div class="fixed inset-0 bg-black/40 flex items-center justify-center p-4">
  <div class="w-full max-w-lg rounded-2xl bg-white shadow-xl p-6 flex flex-col gap-6">
    <!-- Header -->
    <div>
      <h2 class="text-lg font-semibold">Modal Title</h2>
      <p class="text-sm text-neutral-500">Short description.</p>
    </div>
    <!-- Body -->
    <div>...</div>
    <!-- Footer -->
    <div class="flex justify-end gap-3">
      <button class="...secondary">Cancel</button>
      <button class="...primary">Confirm</button>
    </div>
  </div>
</div>
```

---

## 6. ICONS

**Library:** Lucide Icons only.
**Preferred sizes:** `size-4` (inline/nav), `size-5` (feature icons).
Never: oversized icons, colorful third-party icon packs, emoji-as-icons.

---

## 7. ANIMATIONS

**Allowed transitions:**
```css
transition        /* default 150ms */
transition-all duration-200
```

Use for: hover states, modal fade-in, sidebar item highlights.
**Never:** bouncing, spinning loaders everywhere, dramatic entrance animations.

---

## 8. STATE PATTERNS

### Empty State
Every empty screen must have:
```html
<div class="flex flex-col items-center justify-center py-24 gap-4 text-center">
  <svg class="size-10 text-neutral-300">...</svg>
  <h3 class="text-base font-semibold text-neutral-900">No invoices yet</h3>
  <p class="text-sm text-neutral-500">Create your first invoice to get started.</p>
  <button class="...primary">Create Invoice</button>
</div>
```

### Loading State
Use skeleton loaders — never block full UI:
```html
<div class="h-8 w-48 rounded-xl bg-neutral-100 animate-pulse"></div>
```

### Error State
```html
<div class="rounded-2xl border border-red-200 bg-red-50 p-5 flex gap-3 items-start">
  <svg class="size-4 text-red-500 mt-0.5">...</svg>
  <div>
    <p class="text-sm font-medium text-red-800">Something went wrong</p>
    <p class="text-xs text-red-600">Please try again or contact support.</p>
  </div>
  <button class="ml-auto text-sm font-medium text-red-700 hover:underline">Retry</button>
</div>
```

---

## 9. ANGULAR MATERIAL INTEGRATION

Angular Material must be **customized** — never use default Material appearance.

Always override in theme:
- Spacing → match Tailwind spacing tokens
- Border radius → `rounded-xl` / `rounded-2xl`
- Typography → Inter, per scale above
- Colors → neutral palette + primary brand token

Prefer `appearance="outline"` with custom overrides or `appearance="fill"` stripped to minimal.
Combine Mat components with Tailwind utility classes directly on host elements.

---

## 10. THEME SYSTEM

Invomir uses a **custom theme** derived from the Theme Factory system:

**Theme Name:** Invomir Professional
```
Primary Background : #FAFAFA  (neutral-50)
Card Background    : #FFFFFF
Primary Text       : #171717  (neutral-900)
Secondary Text     : #737373  (neutral-500)
Border             : #E5E5E5  (neutral-200)
Brand Primary      : [Official Invomir brand color — apply via CSS variable --color-primary]
Font               : Inter, system-ui
```

When generating HTML artifacts or previews, apply this theme via CSS variables:
```css
:root {
  --color-background: #FAFAFA;
  --color-card: #FFFFFF;
  --color-text-primary: #171717;
  --color-text-secondary: #737373;
  --color-border: #E5E5E5;
  --color-primary: /* Invomir brand color */;
  --font-sans: 'Inter', system-ui, sans-serif;
}
```

Dark mode: use semantic color tokens — never hardcode light-only values.

---

## 11. ACCESSIBILITY

Always ensure:
- Proper contrast ratios (WCAG AA minimum)
- Visible focus states (`focus:ring-2 focus:ring-primary/20`)
- Keyboard navigation support
- `aria-label` on icon-only buttons
- Never rely on color alone to convey meaning

---

## 12. RESPONSIVE DESIGN

Every screen must work on mobile · tablet · desktop.

Use:
```html
class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
class="flex flex-col md:flex-row gap-4"
```

Never build desktop-only layouts.

---

## 13. ARTIFACT GENERATION RULES

When generating HTML/React artifacts for Invomir UI (using web-artifacts-builder patterns):

**Stack for artifacts:** React 18 + Tailwind CSS + Lucide React
**Available libraries:** `lucide-react`, `recharts`, `shadcn/ui` components
**Avoid:** purple gradients, excessive centered layouts, uniform rounded blobs, AI-slop aesthetics

**Artifact structure:**
```jsx
// Single-file React artifact — CSS via Tailwind utility classes
// All state in useState/useReducer — no localStorage
// Default export, no required props
export default function InvoiceList() {
  return (
    <div className="min-h-screen bg-neutral-50 p-6 lg:p-8 font-sans">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold tracking-tight text-neutral-900">
            Invoices
          </h1>
          <button className="h-10 px-4 rounded-xl text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 transition">
            New Invoice
          </button>
        </div>
        {/* Content */}
      </div>
    </div>
  );
}
```

---

## 14. SKILL-CREATOR INTEGRATION

When this skill is used to **create or update Invomir UI components as skills**, follow the Skill Creator pattern:

1. **Capture intent** — what screen/component, what data, what interactions
2. **Draft component** — follow all rules in this document
3. **Test cases** — verify spacing, typography, states (empty/loading/error), responsiveness
4. **Iterate** — qualitative review before finalizing
5. **Package** — reusable Angular component or React artifact

Skill descriptions for Invomir components must be **"pushy"** — trigger on any mention of the component name, related screens, or data contexts.

---

## 15. PRE-FLIGHT CHECKLIST

Before finalizing **any** Invomir UI screen or component:

- [ ] Spacing consistent with approved tokens?
- [ ] Typography follows the type scale?
- [ ] Border radius uses `rounded-xl` / `rounded-2xl` only?
- [ ] Colors route through the palette — no random values?
- [ ] Hover states defined for interactive elements?
- [ ] Empty / loading / error states handled?
- [ ] Responsive on mobile, tablet, desktop?
- [ ] Accessible — contrast, focus, aria?
- [ ] Animations subtle (150–250ms)?
- [ ] Angular Material overridden — no raw default Material?
- [ ] Would this fit on Stripe's or Linear's dashboard?

**If any answer is NO → fix before delivering.**

---

## 16. QUICK REFERENCE CARD

```
Layout      max-w-7xl mx-auto · p-6 lg:p-8 · sidebar w-64 · navbar h-16
Cards       rounded-2xl border bg-white shadow-sm p-5
Buttons     h-10 px-4 rounded-xl text-sm font-medium
Inputs      h-10 rounded-xl border px-3 focus:ring-2 focus:ring-primary/20
Tables      text-sm · header font-medium text-neutral-600 · rows hover:bg-neutral-50
Icons       Lucide · size-4 / size-5
Animations  transition · 150–250ms · no bounce
Fonts       Inter, system-ui · semibold titles · normal body
Spacing     2·4·6·8·12·16·24·32 only
```

---

*Invomir UI/UX Skill — synthesized from: Brand Guidelines · Theme Factory · Skill Creator · Web Artifacts Builder · Invomir Design System Document*
