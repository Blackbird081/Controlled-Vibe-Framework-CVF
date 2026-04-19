# GC-018 Authorization — W105-T1 Sidebar Visual Sync

**Date:** 2026-04-19
**Tranche:** W105-T1
**Class:** REALIZATION (UI-only variant)
**Lane:** Full Lane (GC-019) — first tranche of UI redesign wave
**Memory class:** SUMMARY_RECORD (GC-022)
**Parent roadmap:** `docs/roadmaps/CVF_APP_REDESIGN_ROADMAP_V2_SYNTHESIZED_2026-04-19.md`

---

## 1. Scope

Visual-only resync of three surfaces to the App Onboarding mockup (`App onboarding/cvf-sidebar.jsx` + `cvf-theme.jsx`):

| # | Surface | File | Action |
| --- | --- | --- | --- |
| 1 | Sidebar | `src/components/Sidebar.tsx` | Rewrite internals to match dark-theme mockup |
| 2 | Sub-components (new) | `src/components/sidebar/SidebarNavItem.tsx`, `SidebarNavGroup.tsx` | Extract to keep main file under GC-023 threshold |
| 3 | CompactHeader | `src/components/CompactHeader.tsx` | Dark-theme restyle (minor) |

**`(dashboard)/layout.tsx`: NOT TOUCHED in this tranche.** Although the roadmap §2.1 allows up to 2 new `handleNavigate` cases, implementation analysis shows zero new cases are needed (Knowledge and Enterprise entries already have working routed paths via `<Link>`; new mockup items `landing`, `skill-search`, `help`, `docs` are also route-based). The §2.1 ceiling is left unused — safer.

## 2. Binding constraints (copied from roadmap §6)

```text
FORBIDDEN EDITS:
- src/lib/**                    (business logic)
- src/app/api/**                (routes)
- middleware.ts, auth.ts, package.json, tsconfig.json, vitest.config.ts, next.config.ts
- (dashboard)/layout.tsx        (NOT USED in W105-T1)
- Any *.test.ts / *.test.tsx
- SidebarProps / CompactHeaderProps exported signatures (no rename, no new required props)

ALLOWED:
- Tailwind classes, inline styles, CSS variables
- JSX structure reordering / wrapping
- Local-only UI state for hover/collapse (purely cosmetic)
- Extract new sub-component files under src/components/sidebar/
- lucide-react icons (already a dependency)

SCOPE FENCES (W105-T1):
- Keep SidebarProps interface frozen — all existing props consumed as-is
- Active state derived from appState + usePathname() inside Sidebar (no layout.tsx change)
- Footer VI·EN: cosmetic placeholder only (disabled, tooltip "Coming soon") — roadmap §2.8
- Light mode: must not break; dark mode is visual source of truth — roadmap §2.7
- Role-based gating and permissions gating preserved verbatim
- Mobile overlay + onClose(isOpen) behavior preserved

STOP CONDITIONS:
- Any test goes from pass to fail → REVERT
- tsc --noEmit produces new error → REVERT
- Any edit would cross GC-023 hard threshold → extract sub-component FIRST
- An edit requires touching a forbidden surface → STOP, reopen GC-018
```

## 3. Baseline snapshot (2026-04-19, pre-W105-T1)

| Metric | Value | Source |
| --- | --- | --- |
| cvf-web tests | **2070 passed / 35 skipped / 0 failures** (147 files) | Commit `5d3242a6` |
| tsc --noEmit | clean | Pre-flight verification |
| npm run lint | **4 pre-existing errors** (ALL out of scope) | Pre-flight verification |
| npm run build | green | Inherited from `5d3242a6` |

Pre-existing lint errors (frozen — must NOT worsen in W105-T1):

- `scripts/w102_benefit_benchmark.js:27` — `@typescript-eslint/no-require-imports`
- `src/app/landing/components/HeroVisualizer.tsx:51` — `react-hooks/set-state-in-effect`
- `src/app/landing/components/WorkflowVisualizer.tsx:54` — `react-hooks/set-state-in-effect`
- `src/app/landing/page.tsx:154` — `react-hooks/set-state-in-effect`

None of these files are in W105-T1 scope. Regression rule: W105-T1 must produce 0 new errors; pre-existing 4 errors remain unchanged.

## 4. File line-count pre-check (GC-023)

| File | Current | Hard limit | Post-edit projection |
| --- | --- | --- | --- |
| `src/components/Sidebar.tsx` | 339 | 1000 | ~280 (reduced via sub-component extraction) |
| `src/components/CompactHeader.tsx` | 55 | 1000 | ~90 |
| `src/components/sidebar/SidebarNavItem.tsx` | — (new) | 700 (frontend_component) | ~70 |
| `src/components/sidebar/SidebarNavGroup.tsx` | — (new) | 700 (frontend_component) | ~60 |

All projections safely under hard thresholds.

## 5. Alibaba live-validation requirement

Per roadmap §5.3, W105-T1 does **not** require Alibaba live smoke (Sidebar is not AI-facing). Live validation is required from W108-T1 onward. W105-T1 closure only requires:

- `npx tsc --noEmit` clean
- `npm run lint` — 4 pre-existing errors unchanged, 0 new errors
- `npx vitest run` — baseline 2070 / 35 / 0 preserved
- `npm run build` green
- Before/after screenshots of sidebar + CompactHeader in dark + light mode

## 6. Expected deliverables

1. CP1 commit: Sidebar + CompactHeader visual resync + 2 new sub-component files.
2. CP1 audit doc: `docs/audits/CVF_W105_T1_CP1_SIDEBAR_VISUAL_SYNC_AUDIT_2026-04-19.md`.
3. CP1 delta doc: `docs/baselines/CVF_W105_T1_CP1_SIDEBAR_VISUAL_SYNC_DELTA_2026-04-19.md`.
4. Closure review: `docs/reviews/CVF_W105_T1_TRANCHE_CLOSURE_REVIEW_2026-04-19.md`.
5. GC-026 sync: `docs/baselines/CVF_GC026_TRACKER_SYNC_W105_T1_CLOSED_2026-04-19.md`.
6. AGENT_HANDOFF.md row in Last Tranches Closed table.

## 7. Authorization

- **Operator pre-authorization:** User explicitly requested execution of roadmap §5.1–§5.4 for W105-T1 on 2026-04-19.
- **Behavior preservation contract:** All existing `SidebarProps` consumers (only `layout.tsx` uses it) must continue to function unchanged.
- **Closure authority:** This tranche is self-authorized under the parent roadmap's pre-approved W105–W109 split. No external review gate before CP1.

---

**Status:** AUTHORIZED — proceed to CP1.
