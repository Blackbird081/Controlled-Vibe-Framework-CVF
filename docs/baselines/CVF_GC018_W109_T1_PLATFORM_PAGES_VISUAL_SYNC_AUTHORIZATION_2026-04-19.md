# CVF GC-018 Authorization — W109-T1 Platform Pages Visual Sync

**Memory class:** FULL_RECORD
**Date:** 2026-04-19
**Tranche:** W109-T1
**Authorization class:** GC-018 (Pre-work authorization)
**Lane:** Fast Lane (GC-021) R1 — UI-only, zero logic change

---

## Scope

CSS-only visual sync for 5 platform page files:

| File | Change type |
| --- | --- |
| `src/app/(dashboard)/history/page.tsx` | CSS-only |
| `src/app/(dashboard)/analytics/page.tsx` | CSS-only |
| `src/app/(dashboard)/governance/page.tsx` | CSS-only |
| `src/app/(dashboard)/simulation/page.tsx` | CSS-only |
| `src/app/(dashboard)/safety/page.tsx` | CSS-only |

Note: `marketplace/page.tsx` has no dark-theme tokens at the page wrapper level — zero edits required.

---

## Design tokens applied

| Old | New |
| --- | --- |
| `dark:bg-gray-800` | `dark:bg-[#1a1d2e]` |
| `dark:bg-gray-800/60` | `dark:bg-[#1a1d2e]/60` |
| `dark:bg-gray-900` | `dark:bg-[#0d0f1a]` |
| `dark:bg-gray-700/50` | `dark:bg-white/[0.05]` |
| `dark:border-gray-700` | `dark:border-white/[0.07]` |
| `dark:border-gray-700/50` | `dark:border-white/[0.05]` |
| `dark:border-gray-600` | `dark:border-white/[0.07]` |
| `dark:divide-gray-700` | `dark:divide-white/[0.07]` |
| `dark:hover:bg-gray-700/30` | `dark:hover:bg-white/[0.05]` |
| `dark:hover:bg-gray-800` | `dark:hover:bg-white/[0.07]` |
| `bg-blue-600 hover:bg-blue-700` (action buttons) | `bg-indigo-600 hover:bg-indigo-700` |
| `border-blue-500 bg-blue-50 dark:bg-blue-900/20` (selection) | `border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20` |
| `focus:ring-blue-500` | `focus:ring-indigo-500` |
| `text-blue-600 dark:text-blue-400` (nav links) | `text-indigo-600 dark:text-indigo-400` |

---

## Zero-logic-change contract (binding)

- NO hooks added, removed, or reordered
- NO exported prop signatures changed
- NO click handlers, submit paths, or event listeners modified
- NO imports added or removed
- NO routing changes
- NO test files touched
- `(dashboard)/layout.tsx` NOT touched
- `src/lib/**` NOT touched

## Preserved semantic colors (out of scope)

- Safety status: emerald (safe), amber (warn), red (danger) — do NOT touch
- OpenClaw brand: blue chips in flow diagram — do NOT touch
- Risk metric badges (blue/purple/amber/green) in KernelHealthDashboard — do NOT touch
- StateBadge (approved/pending/rejected/blocked) — do NOT touch
- Toggle-inactive states (`dark:bg-gray-600` toggle pill, `dark:bg-gray-700` disabled icon) — do NOT touch
- OpenClaw ON/OFF status badge — do NOT touch
- OutputTestSection "Analyze" button (`bg-purple-600`) — do NOT touch (semantic purple = AI output)
- Domain adapter safety note text (`text-blue-600 dark:text-blue-400`) — do NOT touch (link-like)

---

## Deliverables

1. CSS-only edits to 5 files
2. CP1 audit: `cvf-web/docs/audits/CVF_W109_T1_CP1_PLATFORM_PAGES_VISUAL_SYNC_AUDIT_2026-04-19.md`
3. CP1 delta: `cvf-web/docs/baselines/CVF_W109_T1_CP1_PLATFORM_PAGES_VISUAL_SYNC_DELTA_2026-04-19.md`
4. GC-026 closure sync: `docs/baselines/CVF_GC026_TRACKER_SYNC_W109_T1_CLOSED_2026-04-19.md`
5. AGENT_HANDOFF.md update
