# CVF DESIGN.md

Canonical UI/UX design system for Controlled Vibe Framework products.

This file is the design contract for coding agents. External design repos,
brand-inspired DESIGN.md files, screenshots, and prototypes are reference
material only. CVF remains the source of truth.

## 1. Visual Theme & Atmosphere

CVF interfaces should feel like a professional command workspace: precise,
calm, structured, and operational. The UI must help users make decisions,
run workflows, and inspect evidence without feeling like a marketing page.

Primary qualities:
- Premium but not decorative
- Dense enough for real work, never cluttered
- Clear hierarchy before visual effects
- Data, state, actions, and review gates are first-class UI
- Dark-primary by default, with readable light support when required

Avoid:
- Generic AI gradients, glowing blobs, and decorative orbs
- Landing-page hero treatment inside operational apps
- Random brand mimicry from external references
- One-off page styling that breaks system consistency

## 2. Color Palette & Roles

### Core Dark System

| Role | Token | Value | Usage |
| --- | --- | --- | --- |
| Shell | `--cvf-bg-shell` | `#0d0f1a` | App sidebar, outer chrome |
| Page | `--cvf-bg-page` | `#111218` | Main content background |
| Surface | `--cvf-surface` | `#1c1d27` | Cards, panels, tables |
| Surface elevated | `--cvf-surface-elevated` | `#242636` | Active panels, drawers |
| Border | `--cvf-border` | `rgba(255,255,255,0.08)` | Dividers, card outlines |
| Border strong | `--cvf-border-strong` | `rgba(255,255,255,0.14)` | Active/focus boundaries |
| Text primary | `--cvf-text-primary` | `#f4f7fb` | Main text, headings |
| Text secondary | `--cvf-text-secondary` | `#a3adc2` | Body support text |
| Text muted | `--cvf-text-muted` | `#6f7890` | Metadata, placeholders |

### Accent & Semantic Roles

| Role | Token | Value | Usage |
| --- | --- | --- | --- |
| Primary accent | `--cvf-accent` | `#5b5cf6` | Primary actions, active nav, focus |
| Accent soft | `--cvf-accent-soft` | `rgba(91,92,246,0.14)` | Active backgrounds, subtle highlights |
| Success | `--cvf-success` | `#10b981` | Pass, connected, completed |
| Warning | `--cvf-warning` | `#f59e0b` | Pending, caution |
| Danger | `--cvf-danger` | `#f43f5e` | Error, destructive, blocked |
| Info | `--cvf-info` | `#38bdf8` | Neutral system info |

Rules:
- Use one primary accent per product surface unless a domain brand requires a
  controlled override.
- Semantic colors must communicate state, not decoration.
- External reference palettes may inspire a variant, but must be remapped to
  CVF roles before implementation.

## 3. Typography Rules

Preferred font stack:
- UI sans: `DM Sans`, `Inter`, system sans
- Technical mono: `DM Mono`, `ui-monospace`, `SFMono-Regular`, `Menlo`

Hierarchy:

| Role | Size | Weight | Line Height | Notes |
| --- | --- | --- | --- | --- |
| Page title | 24-26px | 700 | 1.15 | Operational, compact |
| Section title | 13-14px | 600 | 1.3 | Use for panels and grouped controls |
| Body / table | 12-13.5px | 400-500 | 1.45-1.65 | Dense but readable |
| Metadata label | 9-11px | 700 | 1.2 | Uppercase, letter-spaced |
| KPI number | 26-34px | 700 | 1.0 | Tabular if possible |
| Button text | 11-12px | 500-600 | 1.2 | Concise action labels |

Rules:
- Use letter spacing only for uppercase metadata labels.
- Do not scale font size directly with viewport width.
- Prefer compact operational clarity over oversized marketing type.

## 4. Layout & Navigation

### App Shell

Default product shell:
- Fixed left sidebar: 220px desktop baseline
- Topbar/action strip: 44-52px
- Scrollable content region
- Clear page title, status, and primary action area

Sidebar pattern:
- Logo/product block
- User/workspace block
- Grouped navigation with uppercase group labels
- Footer actions such as settings, language, logout
- Active item uses accent-soft background, bright text, and optional 5px dot

### Page Rhythm

| Element | Default |
| --- | --- |
| Page padding | 24-32px |
| Section spacing | 18-24px |
| Card gap | 10-16px |
| Card padding | 16-20px |
| Panel radius | 12-14px |
| Control radius | 7-9px |

Dashboard order:
1. Header/action strip
2. KPI or stat strip
3. Primary chart/table/workflow area
4. Secondary detail panels
5. Activity, evidence, or audit trail

Form workflow order:
1. Context and preserved constraints
2. Required fields
3. Advanced fields
4. Review gate
5. Primary action and recovery state

## 5. Component Styling

### Cards & Panels

- Background: `--cvf-surface`
- Border: 1px `--cvf-border`
- Radius: 12-14px
- Padding: 16-20px
- Hover: border shifts toward accent alpha, translateY(-1px to -2px)
- Do not nest cards inside cards unless repeated items require clear grouping.

### KPI / Stat Cards

- Label: uppercase, 10-11px, muted
- Value: 26px+, bold, tabular where possible
- Icon pill: 28-32px, semantic/accent alpha background
- Optional trend/status line: 11px, concise

### Filters & Search

- Filter bar has its own surface and border.
- Search height: 36px, radius 9px, icon left.
- Pills: radius 999px only for filters/tags, not primary buttons.
- Active pill: accent background; inactive pill: tab alpha background.

### Buttons

| Type | Treatment |
| --- | --- |
| Primary | Solid accent, white text |
| Soft | Accent alpha background, accent text |
| Outline | Transparent with accent/border alpha |
| Ghost | Transparent, hover surface |
| Danger | Danger color only for destructive actions |

Rules:
- Use icons for tool buttons when the meaning is familiar.
- Keep button labels short.
- Avoid oversized rounded text pills for commands.

### Tables & Dense Data

- Preserve row scanability over decorative styling.
- Use sticky headers only when table height warrants it.
- Align numeric values consistently.
- Empty, loading, and error states must occupy the table area rather than
  appearing as disconnected notices.

### Empty / Loading / Error

- Empty: explain the next useful action.
- Loading: skeleton or muted progress, never a blank wait.
- Error: plain-language cause, recovery action, and trace/evidence if useful.

## 6. Depth, Motion & Feedback

Depth:
- Prefer thin alpha borders and restrained shadows.
- Use elevation to clarify interaction or containment, not decoration.

Motion:
- Hover transitions: 120-180ms
- Page/card reveal: fade + translateY(6-8px), 180-240ms
- Hover lift: max 2px
- Respect reduced-motion preferences.

Focus:
- Keyboard focus must remain visible.
- Focus treatment should use accent border/ring without large glows.

## 7. Responsive Behavior

Breakpoints are implementation-specific, but behavior must follow:
- Mobile: single column, no horizontal scroll, touch targets at least 44px
- Tablet: preserve primary workflows, collapse secondary panels earlier
- Desktop: use grid density carefully; do not stretch content beyond readability
- Data tables: provide horizontal containment or responsive column strategy

Mobile priority:
1. Primary action
2. Current status
3. Required inputs or top data
4. Secondary filters/details

## 8. Accessibility & Language

- Maintain readable contrast in both dark and light modes.
- Do not use color alone to communicate status.
- All controls need accessible labels.
- Vietnamese UI must stay natural and short.
- Avoid technical jargon in non-coder surfaces.
- Error and approval messages must explain what the user can do next.

## 9. Agent Prompt Guide

When building or redesigning a CVF web surface, agents must:

1. Use this `DESIGN.md` as the canonical visual system.
2. Preserve existing routes, auth, APIs, data contracts, stores, parsers, and
   integrations unless the user explicitly approves runtime changes.
3. Generate or follow a handoff packet before making broad UI changes.
4. Apply CVF visual DNA through existing project components and tokens first.
5. Avoid importing new UI libraries unless explicitly approved.
6. Validate desktop, tablet, mobile, keyboard focus, loading, empty, and error
   states before delivery.

Default handoff sections:
1. Website Goal
2. Target Users
3. Required Pages and Flows
4. CVF Web Redesign DNA
5. UX / Visual Direction
6. Protected Constraints
7. Agent Build Instructions
8. Acceptance Checklist

Do not invent concrete endpoint paths, database fields, auth mechanisms, or
route names that the user did not provide. State protected scope instead.

## 10. Reference Absorption Policy

External design references are allowed only as inspiration.

Absorb:
- Layout archetypes
- Component recipes
- Typography relationships
- Spacing rhythm
- State handling
- Useful anti-patterns

Do not absorb:
- Brand identity as-is
- Proprietary visual signatures
- Decorative trends that weaken usability
- Conflicting token systems
- Duplicate skills that overlap the CVF canonical UI/UX skill

CVF skill library rule:
- Keep UI/UX skills few and strong.
- Prefer one canonical system skill, one prototype-ingest skill, and one QA
  checklist over many overlapping design skills.

