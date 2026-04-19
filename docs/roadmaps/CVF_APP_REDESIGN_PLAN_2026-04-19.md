# CVF App Redesign Plan — Full App Onboarding Sync
**Date:** 2026-04-19
**Status:** SUPERSEDED DRAFT / CRITIQUE RECORD ONLY — do not implement directly from this file
**Scope:** UI-only redesign of all app pages/modals to match `App onboarding/*.jsx` design files
**Author:** Claude Sonnet 4.6 via CVF session

> Superseded for execution by `docs/roadmaps/CVF_APP_REDESIGN_ROADMAP_V2_SYNTHESIZED_2026-04-19.md`.
> This file remains valuable as the original proposal plus embedded critiques, but agents should treat it as reference-only.
> Binding operator rule remains: redesign may professionalize the interface, but must preserve existing data flow, runtime behavior, routes, auth, APIs, stores, and provider execution paths unless the synthesized roadmap grants a narrow explicit exception.

---

## Context & Constraints

### What this plan does
Sync the visual design of every dashboard page and modal to match the redesigned App Onboarding mockups (`App onboarding/*.jsx`). The landing page (`/landing`) was already redesigned in a previous session and is **excluded** from this plan.

### Hard constraints
- **Zero logic changes:** No hooks, API calls, data fetching, auth, store, or middleware touched
- **GC-023 compliance:** All governed source files have line-count thresholds. Check line count + exception registry before adding code to any existing file. Tách sub-component nếu sắp vượt giới hạn.
- **Forbidden files:** `lib/`, `api/`, `middleware.ts`, `auth.ts`, `package.json`, `(dashboard)/layout.tsx` (no structural changes to layout)
- **Build gate:** `npm run build` must pass with zero errors after each phase
- **Pre-commit hook:** `.githooks/pre-commit` auto-enforces GC-023 on every commit

### Design source files (read-only reference)
| File | Covers |
|---|---|
| `App onboarding/cvf-sidebar.jsx` | Navigation sidebar — 4 groups, dark theme, gradient logo |
| `App onboarding/cvf-pages-home.jsx` | Home — template gallery, category filter, stats |
| `App onboarding/cvf-pages-workspace.jsx` | Skills, Skill Search, Help, Docs |
| `App onboarding/cvf-pages-ai.jsx` | AI Agent, Multi-Agent, Tools, Simulation, Knowledge |
| `App onboarding/cvf-pages-platform.jsx` | History, Analytics, Marketplace, Governance, Enterprise, AI Safety |
| `App onboarding/cvf-pages-account.jsx` | Context, Settings, AI Usage |
| `App onboarding/cvf-theme.jsx` | Design tokens (accent, card, sidebar colors), 57+ icons |

### Key architectural note
AI Agent, Multi-Agent, Tools, Context, Settings, AI Usage are **modal overlays** opened from `(dashboard)/layout.tsx` — they are NOT separate routes. Their components live in `src/components/`.

---

## Phase A — Sidebar (Highest global impact)

**Target file:** `src/components/Sidebar.tsx` (currently 359 lines)

**GC-023 pre-check required:** 359 lines is near limit. Plan to extract `SidebarNavItem` and `SidebarNavGroup` as sub-components if rewrite pushes over threshold.

### Changes from App Onboarding (`cvf-sidebar.jsx`)
| Current | Target |
|---|---|
| White/light bg + `dark:bg-gray-800` | Dark: `bg-gray-950 border-gray-800` |
| Emoji-only icons (`🏠`, `📚`, etc.) | SVG icons from cvf-theme.jsx (via Lucide) + label |
| 4 nav groups with different emoji headers | Workspace / AI / Platform / Account (exact 4 groups) |
| Active: `bg-blue-600` | Active: `bg-indigo-600` + white text + 5px accent dot |
| Hover: basic `hover:bg-gray-100` | Hover: `bg-gray-800` (dark) / `bg-gray-100` (light) |
| Logo: `🎯 CVF v1.6` text | Gradient circle logo + "CVF" bold + "v1.6" monospace sub |
| User block: text only | Avatar gradient circle + name + role badge (red for Admin) |
| Footer: role badge only | Footer: VI · EN language switcher + logout nav item |

**Nav group mapping (App Onboarding → Current groups):**
```
Workspace: Home, Landing Page, Skills, Skill Search, Help, Docs
AI:        AI Agent, Multi Agent, Tools, Simulation, Knowledge
Platform:  History, Analytics, Marketplace, Governance, Enterprise, AI Safety
Account:   Context, Settings, AI Usage
```
Note: Current sidebar uses different groupings (Browse / AI Features / Data / Governance / Safety / User). The regrouping must not break any `handleNavigate` calls in `layout.tsx`.

**Possible sub-components to extract:**
- `SidebarNavItem.tsx` (< 60 lines) — single nav item with hover/active state
- `SidebarNavGroup.tsx` (< 80 lines) — collapsible group header + items

---

## Phase B — Workspace Pages (5 pages)

### B1 — Home (`(dashboard)/home/page.tsx`)
**Design source:** `cvf-pages-home.jsx`

| Element | Design |
|---|---|
| Top stat strip | 4 cards: Templates / Skills / Runs Today / Success Rate |
| Category filter | 7 pill tabs: All / Content / Technical / Business / Research / Marketing / Automation |
| Search + Sort | Search input left + "Sort by: Most Used" dropdown right |
| Template grid | `auto-fill minmax(240px)` cards: color icon block + name (serif) + description + "Run →" button + usage count |
| Featured banner | Gradient banner with "Template of the Week" highlight |

New components to create (if home/page.tsx is too large):
- `src/app/(dashboard)/home/components/TemplateCategoryFilter.tsx`
- `src/app/(dashboard)/home/components/TemplateCard.tsx`
- `src/app/(dashboard)/home/components/FeaturedBanner.tsx`

### B2 — Skills (`skills/page.tsx`)
**Design source:** `cvf-pages-workspace.jsx: PageSkills`

| Element | Design |
|---|---|
| Header action | "Browse Marketplace" button (soft variant) |
| Filter row | Search input + 6 category pill buttons |
| Stat strip | 4 cards: Total Skills / Active / Beta / New |
| Card grid | `auto-fill minmax(240px)`: icon circle, badge (Active/Beta/New), name, description, usage count + category label |
| Hover | `translateY(-1px)` + shadow |

### B3 — Skill Search (`skills/search/page.tsx`)
**Design source:** `cvf-pages-workspace.jsx: PageSkillSearch`

| Element | Design |
|---|---|
| Hero | Centered: h2 "Find a skill for anything" + search bar (h=46px) + Search button |
| Quick tags | 5 chip buttons below search: "Summarize text" / "Write code" / "Analyze data" / "Draft email" / "Review contract" |
| Pre-search state | "Popular Skills" section: 6 mini cards (icon + name + uses count) |
| Post-search state | Count label + list-view results (icon + name + desc + category badge + "Use" button) |

### B4 — Help (`help/page.tsx`)
**Design source:** `cvf-pages-workspace.jsx: PageHelp`

| Element | Design |
|---|---|
| Quick links | 2×2 grid cards (icon + title + desc): Documentation / Quick Start / API Reference / Community |
| FAQ section | Section title + accordion (8 items, click to expand answer) |
| Header action | "Contact Support" button |

### B5 — Docs (`docs/page.tsx`)
**Design source:** `cvf-pages-workspace.jsx: PageDocs`

| Element | Design |
|---|---|
| Layout | 2-column: left tree sidebar (200px) + right content (flex-1, max-w-720) |
| Doc tree | 7 top-level sections, some with collapsible children (active = indigo highlight) |
| Content area | Breadcrumb + h1 + paragraph blocks (line-height 1.75) |
| Header action | "API Reference" button |

---

## Phase C — AI Group Modals (3 components)

### C1 — AI Agent (`src/components/AgentChatWithHistory.tsx`)
**Design source:** `cvf-pages-ai.jsx: PageAIAgent`

**Note:** This component already has substantial logic (AgentChat, message history, streaming). Only visual changes.

| Element | Design |
|---|---|
| Header | Model selector chip (Claude / GPT-4o / Gemini) + "LIVE" green badge |
| User bubble | Right-aligned, indigo-600 bg, white text, rounded-br-sm |
| AI bubble | Left-aligned, dark card bg, sparkle icon avatar, rounded-bl-sm |
| Typing indicator | 3 bounce dots (reuse animate-delay-0/150/300 from globals.css) |
| Empty state | Example prompt chips: "Summarize this document" / "Write SQL for..." |
| Input area | Dark-bordered textarea + send button (indigo) |

### C2 — Multi-Agent (`src/components/MultiAgentPanel.tsx`)
**Design source:** `cvf-pages-ai.jsx: PageMultiAgent`

**Note:** High complexity. Current implementation may differ significantly. Visual-only pass.

| Element | Design |
|---|---|
| Canvas | SVG with positioned node boxes + `<line>` edges |
| Node box | 120×80 rect, role label, status dot (idle=gray/thinking=amber/done=green) |
| Node roles | Researcher / Writer / Critic / Coordinator |
| Sidebar | Node palette with "Add Node" cards |

### C3 — Tools (`src/components/ToolsPage.tsx` or similar)
**Design source:** `cvf-pages-ai.jsx: PageTools`

| Element | Design |
|---|---|
| Layout | 2-3 column grid of tool cards |
| Card | Icon circle + name + description + toggle switch |
| Active state | Card border: `border-indigo-500`, background: `indigo-50/10` |

---

## Phase D — Platform Pages (6 pages)

### D1 — History (`(dashboard)/history/page.tsx`)
**Design source:** `cvf-pages-platform.jsx: PageHistory`

- Stat strip: Total Runs / Success / Failed / Avg Duration
- Table columns: Template · Model · Status · Duration · Tokens · Time
- Status badges: Completed (emerald) / Failed (red) / Running (amber pulse)
- Row hover highlight

### D2 — Analytics (`(dashboard)/analytics/page.tsx`)
**Design source:** `cvf-pages-platform.jsx: PageAnalytics`

- 4 metric cards: Total Tokens / Est. Cost / Avg Latency / Total Requests
- SVG line chart (7-day trend) — `<polyline>` with gradient area fill
- SVG bar chart (by template) — `<rect>` bars with labels
- No external chart library — SVG-only (matches WorkflowVisualizer pattern)

### D3 — Marketplace (`(dashboard)/marketplace/page.tsx`)
**Design source:** `cvf-pages-platform.jsx: PageMarketplace`

- Featured gradient banner (top)
- Filter tabs: All / Content / Code / Business / Research
- Install card grid: icon + name + description + install count badge + "Install" button
- Installed state: "Installed ✓" button variant

### D4 — Governance (`(dashboard)/governance/page.tsx`)
**Design source:** `cvf-pages-platform.jsx: PageGovernance`

- Grouped toggle rows: Safety / Privacy / Compliance / Audit sections
- Each row: label (500 weight) + description (muted) + toggle switch
- CvfToggle component pattern: pill with sliding circle

### D5 — Simulation (`(dashboard)/simulation/page.tsx`)
**Design source:** `cvf-pages-platform.jsx: PageSimulation`

- Left panel (40%): Model select + parameter sliders/inputs + scenario textarea
- Right panel (60%): Log output scrollable (monospace, color-coded: info=gray / warn=amber / error=red / success=green)
- "Run Simulation" button → append log lines

### D6 — AI Safety (`(dashboard)/safety/page.tsx`)
**Design source:** `cvf-pages-platform.jsx: PageAISafety`

- Section title + summary bar: "X guardrails active"
- Toggle rows with severity badges: CRITICAL (red) / HIGH (amber) / MEDIUM (blue) / LOW (gray)
- Each row: icon + name + description + toggle
- Grouped by category

---

## Phase E — Account Modals (3 components)

### E1 — Context (`src/components/UserContextForm.tsx`)
**Design source:** `cvf-pages-account.jsx: PageContext`

- Avatar gradient circle (80px) + "Change Photo" ghost button + file size note
- 2×4 grid: Full Name / Role / Company / Industry / Language / Timezone / Writing Style / AI Expertise
- Bio textarea (full width, rows=3)
- "Save Context" button → 2.2s green "Saved!" state

### E2 — Settings (`src/components/SettingsPage.tsx` or similar)
**Design source:** `cvf-pages-account.jsx: PageSettings`

- Appearance section: Theme (Light/Dark segmented buttons) + Accent color swatch picker (6 colors: Indigo/Violet/Sky/Emerald/Rose/Amber)
- AI Preferences: Default Model select + Output Language select
- Interface toggles: Auto-save / Compact Mode / Keyboard Shortcuts
- Notifications toggles: Run Notifications / Beta Features / Usage Analytics

### E3 — AI Usage (`src/components/AIUsagePanel.tsx`)
**Design source:** `cvf-pages-account.jsx: PageAIUsage`

- Plan banner: sparkle icon + plan name + quota line + monthly token count
- 2 donut charts side-by-side: Token Usage (indigo) + Run Count (emerald) — SVG with centered % text
- Daily bar chart (14 days) — today bar is full opacity, past bars are 55% opacity
- "Usage by Model" table: color dot + model + tokens (K) + runs + progress bar + %
- "Upgrade Plan" button in header

---

## Build Order & Verification

```
Phase A → npm run build → Phase B1 → build → B2 → build → B3 → build →
B4 → build → B5 → build → Phase C (component by component) → build →
Phase D (page by page) → build → Phase E → final build
```

**After each phase:**
1. `npm run build` — zero errors required
2. Open browser: verify redesigned page visually
3. Check `/home`, `/admin/*`, `/approvals` — no regressions
4. Chrome DevTools 375px — mobile layout OK
5. Dark mode toggle — all sections correct

**GC-023 pre-flight for every file:**
```bash
wc -l <file>  # check current line count
cat governance/compat/CVF_GOVERNED_FILE_SIZE_EXCEPTION_REGISTRY.json | grep "<filename>"
```

---

## Risk & Open Questions for Critique

1. **Sidebar regrouping risk:** Current `handleNavigate` in `layout.tsx` maps state strings to routes. Adding new nav items (Simulation, Knowledge, Enterprise under Platform group) may need new `case` entries. Is this a "logic change" or acceptable UI wiring?

2. **Modal vs Page inconsistency:** App Onboarding shows Context/Settings/AI Usage as full pages with top bars. Current app renders them as modals. Should they stay as modals (minimal change) or become dedicated routes (e.g., `/settings`, `/context`)? Converting to routes would change `layout.tsx` significantly.

3. **Phase C complexity (Multi-Agent SVG canvas):** The SVG node canvas is significantly more complex than current MultiAgentPanel. Is this in scope for a "UI-only" pass, or should it be deferred?

4. **Knowledge page:** App Onboarding shows it under AI group. Currently it lives at `/governance/knowledge`. Should the URL change? Changing routes affects Sidebar nav links.

5. **Enterprise page:** App Onboarding `PageEnterprise` shows a member table + org settings. Currently handled by `/admin/team` and `/admin/settings` (admin-only). Should this be in scope? Admin pages are outside the dashboard redesign.

6. **GC-023 on large existing files:** `Sidebar.tsx` (359 lines), `AgentChatWithHistory.tsx` (unknown), `AIUsagePanel.tsx` (unknown) may already be near limits. Need per-file pre-check before implementation.

7. **SVG charts (Analytics, AI Usage):** No chart library — pure SVG. Acceptable pattern (matches WorkflowVisualizer)? Or should a lightweight library like `recharts` be considered?

---

## Files Summary (estimated touches)

| Phase | Files touched | New files created |
|---|---|---|
| A — Sidebar | 1 (Sidebar.tsx) | 0-2 sub-components |
| B — Workspace | 5 pages | 3-8 component files |
| C — AI Modals | 3 components | 2-4 sub-components |
| D — Platform | 6 pages | 4-8 component files |
| E — Account | 3 components | 1-3 sub-components |
| **Total** | **~18 core files** | **~10-25 supporting files** |

All new files: `< 200 lines` (GC-023). All existing files: check before edit.

---

## Critique — Independent Agent Review (2026-04-19)

### Verdict: APPROVE WITH CONDITIONS

### 2026-04-19 Final Evaluation Addendum

This draft is **useful but not sufficient as a stand-alone implementation guide**. The embedded critique correctly found that the original draft left too many execution-affecting questions open.

To be considered implementation-safe, the final execution packet must additionally guarantee:

1. **Behavior preservation evidence, not just visual parity**
   - Agent must verify sidebar navigation, modal open/close, form submit/save, empty/loading/error/disabled states, and permission-gated surfaces still behave exactly as before.
   - "UI-only" cannot be accepted by declaration alone.

2. **Alibaba live validation after redesign**
   - After redesign work that touches AI-entry surfaces, rerun live tests using configured Alibaba credentials (`ALIBABA_API_KEY`, with compatibility aliases still allowed).
   - Goal: produce runtime evidence that redesign did not break governed execution, retrieval, or live provider connectivity.
   - Minimum route-level evidence set should include the existing live smoke lane in `cvf-web`, not only static build/test checks.

3. **Canon execution source**
   - The synthesized roadmap is the only execution-ready source because it closes the blockers above and adds tranche governance, rollback policy, and acceptance gates.

### A. GC-023 Line Count Actuals (verified by reading files)

| File | Current Lines | Hard Threshold | Safe? |
| --- | --- | --- | --- |
| `Sidebar.tsx` | 359 | 1000 | ✅ |
| `AIUsagePanel.tsx` | 414 | 1000 | ✅ |
| `layout.tsx` | 311 | 1000 | ✅ |
| `AgentChatWithHistory.tsx` | 149 | 1000 | ✅ |
| `MultiAgentPanel.tsx` | 658 | 1000 | ✅ (66%) |

No exception registry entries needed before implementation.

Unknown — must verify before editing: `ToolsPage`, `SettingsPage`, `UserContextForm`.

### B. Accuracy Issues Found

**Sidebar "zero logic change" — PARTIALLY FALSE:**

- Regrouping 6 nav groups → 4 groups is visual reorder ✅
- BUT: adding "Knowledge" and "Enterprise" as new nav items under Platform group **requires new `case` entries in `handleNavigate()` in `layout.tsx`** — this IS a logic change
- Fix: Explicitly acknowledge that `layout.tsx` `handleNavigate` needs 2 new case entries (knowledge → `/governance/knowledge`, enterprise → `/admin/team`). Scope it as minimal, targeted.

**Phase C (Multi-Agent SVG canvas) — RISK FLAGGED:**

- `MultiAgentPanel.tsx` is 658 lines with existing logic
- "UI-only" for SVG node canvas is feasible only if node positioning algorithm is untouched
- If visual redesign requires changing node layout coordinates → logic change boundary blurred
- Fix: Confirm SVG canvas redesign is style-only (colors, box sizes, font) NOT node position algorithm

**Modal vs Page (Context/Settings/AI Usage) — PLAN IS CORRECT:**

- App Onboarding shows full-page layouts, but keeping as modals is correct for minimal-change approach
- UX inconsistency is acceptable trade-off; converting to routes would require layout.tsx surgery

### C. Build Order Issue — CRITICAL

Plan says A → B → C → D → E. This is WRONG ordering for Phase C.

Phase C rewrites components (`AgentChatWithHistory`, `MultiAgentPanel`, `ToolsPage`) that are **imported by `layout.tsx`**. If Phase C components have any compile error, Phase D pages will fail to build because `layout.tsx` cannot compile.

Corrected build order:

```text
A → B1 → B2 → B3 → B4 → B5 → E (modals first, lowest risk) → C (in-place, signature unchanged) → D
```

Or alternatively:

```text
A → B → D → E → C  (do complex C last, in isolation)
```

Rule: Phase C components must preserve their existing export signature — no prop name changes, no new required props — so layout.tsx import doesn't need updating.

### D. SVG Charts (Analytics, AI Usage) — CLEARED

Pure `<svg>` with `<polyline>`, `<rect>`, `<circle>` is SSR-safe in React 19 / Next.js 16.

Condition: No interactive hover/tooltip on SVG elements. Static-only charts = safe.
If interactive charts are needed → must wrap in `'use client'` and use `useEffect` for DOM interactions.

### E. Missing from Plan

1. **`CompactHeader.tsx`** — imported by layout (line 23). Does it need visual update? Plan silent on this.
2. **ToolsPage, SettingsPage, UserContextForm** — line counts unverified. Must check before Phase C/E.
3. **Dark mode for new SVG charts** — SVG `fill`/`stroke` colors must use CSS variables or conditional Tailwind `dark:` classes. Plan doesn't specify this.
4. **No fallback strategy** if `npm run build` fails mid-phase (stash? revert to last commit?).

### F. Five Conditions for Implementation

1. **Condition 1 — handleNavigate scope:** Explicitly list the 2 new `case` entries needed in `layout.tsx` before starting Phase A. Confirm with team these are acceptable as "minimal wiring" not "logic change".
2. **Condition 2 — Build order:** Follow corrected order: A → B → E → C (in-place) → D.
3. **Condition 3 — Pre-flight line counts:** Run `wc -l` on ToolsPage, SettingsPage, UserContextForm before Phase C/E starts.
4. **Condition 4 — SVG charts static-only:** No interactive hover/tooltips. Static visual only.
5. **Condition 5 — Dark mode SVG:** All SVG chart colors must have dark mode variants (use `currentColor` + CSS custom properties or conditional class logic).
