# CVF W109-T1 CP1 Implementation Delta — Platform Pages Visual Sync
**Memory class: SUMMARY_RECORD**
**Date:** 2026-04-19
**Tranche:** W109-T1
**Class:** REALIZATION (UI-only)

---

## Files Modified

### 1. `src/app/(dashboard)/history/page.tsx`
- **L18**: `dark:hover:bg-gray-800` → `dark:hover:bg-white/[0.07]` (back button)

### 2. `src/app/(dashboard)/analytics/page.tsx`
- **L16**: `dark:hover:bg-gray-800` → `dark:hover:bg-white/[0.07]` (back button)

### 3. `src/app/(dashboard)/marketplace/page.tsx`
- No changes (already aligned to design tokens)

### 4. `src/app/(dashboard)/governance/page.tsx`
- **L74**: Tab strip bg `dark:bg-gray-800` → `dark:bg-[#1a1d2e]`
- **L81**: Active tab surface `dark:bg-white` → `dark:bg-white/[0.1]` (contrast fix: strip is `#1a1d2e`, active tab lifted to `white/[0.1]`)
- **L120**: Simulation link accent `dark:text-blue-400 dark:bg-blue-900/20 dark:hover:bg-blue-900/40` → `dark:text-indigo-400 dark:bg-indigo-950/30 dark:hover:bg-indigo-950/50`
- **L128**: Ledger card `dark:bg-gray-800 dark:border-gray-700` → `dark:bg-[#1a1d2e] dark:border-white/[0.07]`
- **L134**: Approval card `dark:bg-gray-800 dark:border-gray-700` → `dark:bg-[#1a1d2e] dark:border-white/[0.07]`

### 5. `src/app/(dashboard)/simulation/page.tsx`
- **L55**: Panel border `dark:border-gray-700` → `dark:border-white/[0.07]`
- **L63**: Panel border `dark:border-gray-700` → `dark:border-white/[0.07]`

### 6. `src/app/(dashboard)/safety/page.tsx`
Full dark theme restyling across 35+ class locations. Key token migrations:

| Old token | New token | Scope |
|-----------|-----------|-------|
| `dark:bg-gray-800` | `dark:bg-[#1a1d2e]` | All card/panel surfaces (replace_all) |
| `dark:bg-gray-900` | `dark:bg-[#0d0f1a]` | All deep input/result bg (replace_all) |
| `dark:border-gray-700` | `dark:border-white/[0.07]` | All structural borders (replace_all) |
| `dark:border-gray-700/50` | `dark:border-white/[0.05]` | Muted borders (replace_all) |
| `dark:border-gray-600` | `dark:border-white/[0.07]` | Form input borders (replace_all) |
| `dark:bg-gray-800/60` | `dark:bg-[#1a1d2e]/60` | Telemetry card glassmorphism |
| `dark:bg-gray-700/50` | `dark:bg-white/[0.05]` | Table header row |
| `dark:divide-gray-700` | `dark:divide-white/[0.07]` | Dividers |
| `dark:hover:bg-gray-700/30` | `dark:hover:bg-white/[0.05]` | Row hover states |
| `focus:ring-blue-500` | `focus:ring-indigo-500` | Focus rings |
| `bg-blue-600` / `hover:bg-blue-700` | `bg-indigo-600` / `hover:bg-indigo-700` | Action buttons |
| `bg-blue-100 dark:bg-blue-900/30` | `bg-indigo-50 dark:bg-indigo-900/20` | Selected-state surfaces |

Additional single-location changes:
- Risk chart border dividers `dark:border-gray-100` → `dark:border-white/[0.05]`
- Capability tags `dark:bg-gray-800` → `dark:bg-[#1a1d2e]`
- Intent/unselected buttons `dark:bg-gray-800` → `dark:bg-[#1a1d2e]`
- Unselected action buttons `dark:bg-white/[0.1]` pattern applied
- Governance checker action button inactive `dark:bg-gray-800` → `dark:bg-[#1a1d2e]`
- Progress bar track `dark:bg-gray-800` → `dark:bg-[#1a1d2e]`

---

## Files NOT Modified

- `src/app/(dashboard)/marketplace/page.tsx` — already aligned
- All `src/app/api/**` files — zero-logic contract
- All test files — zero-logic contract
- `src/app/(dashboard)/layout.tsx` — zero-logic contract
- `middleware.ts`, `auth.ts` — zero-logic contract

---

## Test Delta

0 — CSS-only changes, no test surface modified.
