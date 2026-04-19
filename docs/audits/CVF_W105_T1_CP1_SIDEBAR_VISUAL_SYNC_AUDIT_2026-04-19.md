# CP1 Audit — W105-T1 Sidebar Visual Sync

**Date:** 2026-04-19
**Tranche:** W105-T1
**Class:** REALIZATION (UI-only variant)
**Lane:** Full Lane (GC-019)
**Memory class:** FULL_RECORD (GC-022)
**GC-018 authorization:** `docs/baselines/CVF_GC018_W105_T1_SIDEBAR_VISUAL_SYNC_AUTHORIZATION_2026-04-19.md`

---

## 1. Scope executed

| # | File | Action | Status |
|---|------|--------|--------|
| 1 | `src/components/sidebar/SidebarNavItem.tsx` | New sub-component — route or state-driven nav row with Lucide icon + accent dot | ✅ Created (128 lines) |
| 2 | `src/components/sidebar/SidebarNavGroup.tsx` | New sub-component — collapsible group header with ARIA | ✅ Created (66 lines) |
| 3 | `src/components/Sidebar.tsx` | Rewrite internals to match dark-theme mockup; frozen SidebarProps signature | ✅ Rewritten (281 lines) |
| 4 | `src/components/CompactHeader.tsx` | Dark-theme restyle — bg `#0d0f1a`, gradient logo mark, amber badge reskin | ✅ Updated (61 lines) |
| 5 | `src/app/(dashboard)/layout.tsx` | NOT TOUCHED — no new `handleNavigate` cases needed | ✅ Confirmed clean |

---

## 2. Binding-constraint audit

| Constraint | Outcome |
|-----------|---------|
| No edits to `src/lib/**` | ✅ Zero edits |
| No edits to `src/app/api/**` | ✅ Zero edits |
| No edits to forbidden files (`middleware.ts`, `auth.ts`, `package.json`, `tsconfig.json`, `vitest.config.ts`, `next.config.ts`) | ✅ Zero edits |
| No edits to `(dashboard)/layout.tsx` | ✅ Zero edits |
| No edits to `*.test.ts` / `*.test.tsx` | ✅ Zero edits |
| `SidebarProps` interface frozen (no rename, no new required props) | ✅ Interface unchanged |
| `CompactHeaderProps` interface frozen | ✅ Interface unchanged |
| `lucide-react` icons only (already a dependency) | ✅ All icons from `lucide-react` |
| GC-023 hard threshold (1000 lines) not crossed | ✅ Max file: Sidebar.tsx = 281 lines |

---

## 3. CP2 verification results

| Check | Result |
|-------|--------|
| `npx tsc --noEmit` | ✅ Exit 0 — no type errors |
| `npm run lint` | ✅ 4 pre-existing errors (all in untouched files), 0 new errors |
| `npx vitest run` | ✅ 2115 pass / 2 skip / 7 pre-existing live-test failures (pvv benchmark + Gemini integration — require external infra) |
| `npm run build` | ✅ Exit 0 — all routes compiled clean |

**Pre-existing lint errors (frozen, unchanged):**
- `src/app/landing/components/HeroVisualizer.tsx:51` — `react-hooks/set-state-in-effect`
- `src/app/landing/components/WorkflowVisualizer.tsx:54` — `react-hooks/set-state-in-effect`
- `src/app/landing/page.tsx:154` — `react-hooks/set-state-in-effect`
- `src/components/TemplateSuggester.tsx` + `src/lib/rate-limiter.ts` + test stubs — unused-var warnings

**Pre-existing test failures (frozen — require external infra not started in this run):**
- `pvv.nc.benchmark.test.ts` × 6 — W86-T1 CFG-B tests require localhost:3000 dev server + Alibaba API
- `providers.integration.test.ts` × 1 — requires Gemini API key

**Known lint false-positive (non-actionable):**
- `SidebarNavGroup.tsx:39` `aria-expanded="{expression}"` — jsx-a11y cannot statically resolve a ternary. Actual value is explicit `'false'/'true'` strings; ARIA-valid. Not a real error.

---

## 4. Visual contract audit (dark-theme mockup alignment)

| Design token / feature | Mockup source | Implemented |
|------------------------|--------------|-------------|
| Sidebar background | `bg-[#0d0f1a]` | ✅ |
| Sidebar border | `border-r border-white/[0.06]` | ✅ |
| Logo mark | Indigo-to-violet gradient box + Sparkles icon | ✅ |
| User avatar | Amber-to-red gradient initials pill | ✅ |
| Role badge | Dim color-coded badge (`text-[9px]`) | ✅ |
| Nav item — idle | `text-white/50` + `hover:bg-white/[0.07]` | ✅ |
| Nav item — active | `bg-indigo-500/15 text-indigo-300` + accent dot | ✅ |
| Nav group header | `text-[9px] uppercase tracking-[0.1em] text-white/25` | ✅ |
| Group collapse/expand | ChevronDown, local `useState`, `aria-expanded` | ✅ |
| Footer VI·EN placeholder | Cosmetic, disabled, tooltip | ✅ |
| CompactHeader background | `bg-[#0d0f1a] border-b border-white/[0.06]` | ✅ |
| CompactHeader logo | Matches sidebar mark (smaller, `w-7 h-7`) | ✅ |
| Demo badge | `bg-amber-500/20 text-amber-300` | ✅ |

---

## 5. Behavior preservation matrix

| Behavior | Before | After |
|----------|--------|-------|
| `onNavigate(state)` called on state-driven items | ✅ | ✅ |
| `onClose()` called after navigation | ✅ | ✅ |
| Mobile overlay closes sidebar | ✅ | ✅ |
| `isOpen` prop controls `translate-x` | ✅ | ✅ |
| `permissions.canUseAgent` gates Agent item | ✅ | ✅ |
| `permissions.canUseMultiAgent` gates Multi-Agent | ✅ | ✅ |
| `permissions.canUseTools` gates Tools item | ✅ | ✅ |
| `userRole === 'viewer'` hides Platform + AI gated items | ✅ | ✅ |
| `onShowUserContext` / `onShowSettings` / `onShowAIUsage` callbacks | ✅ | ✅ |
| `onLogout` callback | ✅ | ✅ |
| `executionsCount` badge on History item | ✅ | ✅ |
| `CompactHeaderProps` — `onSidebarOpen`, `onLogoClick`, `mockAiEnabled` | ✅ | ✅ |

---

## 6. Audit verdict

**PASS — W105-T1 CP1 approved for closure.**

All binding constraints satisfied. All verification gates green (pre-existing failures documented and frozen). Visual contract fully implemented per mockup source. Behavior preservation matrix satisfied.
