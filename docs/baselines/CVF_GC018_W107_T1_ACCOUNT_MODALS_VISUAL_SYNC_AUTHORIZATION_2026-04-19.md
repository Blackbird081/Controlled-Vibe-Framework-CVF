# GC-018 Authorization — W107-T1: Account Modals Visual Sync

**Memory class:** POINTER_RECORD
**Date:** 2026-04-19
**Tranche:** W107-T1
**Class:** REALIZATION (UI-only variant)
**Verification Tier:** Tier A (presentation-only — no layout.tsx touch, no wiring change, no signature change)
**Status:** AUTHORIZED

---

## Scope

Restyle the three Account modal components to match dark theme design tokens established in W105-T1 and W106-T1.

**Target files (3):**

| File | Lines | Change class |
| --- | --- | --- |
| `src/components/UserContext.tsx` | 267 | CSS-only |
| `src/components/Settings.tsx` | 776 | CSS-only (advisory: > 700 — no new lines added) |
| `src/components/AIUsagePanel.tsx` | 415 | CSS-only |

---

## Binding constraints

- Zero-logic contract: no changes to `src/lib/**`, `src/app/api/**`, `middleware.ts`, `auth.ts`, test files, or `(dashboard)/layout.tsx`
- Exported component signatures must remain frozen: `UserContextForm({ onClose?, compact? })`, `SettingsPage({ onClose? })`, `AIUsagePanel({ onClose })`
- No new required props, no hook dependency array changes, no route/wiring changes
- All save/submit/cancel click handlers remain unchanged
- Expected test delta: 0
- Expected regression: 0

---

## Design tokens

| Token | Value |
| --- | --- |
| Background | `#0d0f1a` |
| Card surface | `#1a1d2e` → `dark:bg-[#1a1d2e]` |
| Border | `dark:border-white/[0.07]` |
| Accent (primary) | indigo (replacing blue/purple) |
| Hover surface | `dark:hover:bg-white/[0.07]` |

---

## Expected deliverables

- CP1: CSS-only edits to 3 modal component files
- CP2 (Tier A): `tsc --noEmit` + `npm run lint` + `npm run build` + targeted vitest (`UserContext.test.tsx`, `Settings.test.tsx`)
- CP3: CP1 audit + CP1 delta + GC-026 sync + `AGENT_HANDOFF.md` entry

---

## Stop conditions

- Any test that was passing now fails → REVERT
- Any tsc error → REVERT
- Any edit that requires touching an exported prop signature → STOP, reopen GC-018
- Any edit that changes a click handler or form submission path → STOP

---

**Authorization:** Self-authorized per roadmap §5.1 (GC-018 per-tranche authorization). Operator instruction: run roadmap to completion without waiting.
