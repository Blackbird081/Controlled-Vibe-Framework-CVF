# CVF W107-T1 CP1 Delta — Account Modals Visual Sync

**Memory class:** SUMMARY_RECORD
**Date:** 2026-04-19
**Tranche:** W107-T1

---

## Token replacements summary

### `src/components/UserContext.tsx`
- `dark:bg-gray-800` → `dark:bg-[#1a1d2e]` (card surface)
- `dark:border-gray-700` → `dark:border-white/[0.07]` (card border)
- `dark:hover:bg-gray-700` → `dark:hover:bg-white/[0.07]` (close button)
- `dark:border-gray-600` → `dark:border-white/[0.07]` (all 6 input fields, replace_all)
- `bg-white dark:bg-gray-700` → `bg-white dark:bg-[#1a1d2e]` (all 6 input fields, replace_all)
- `focus:ring-blue-500` → `focus:ring-indigo-500` (all 6 input fields, replace_all)
- `bg-blue-600 hover:bg-blue-700` → `bg-indigo-600 hover:bg-indigo-700` (save button)

### `src/components/Settings.tsx`
- `dark:bg-gray-800` → `dark:bg-[#1a1d2e]` (card surface)
- `border-gray-200 dark:border-gray-700` → `border-gray-200 dark:border-white/[0.07]` (4 dividers + 2 inactive card states, replace_all)
- `dark:hover:bg-gray-700` → `dark:hover:bg-white/[0.07]` (close button)
- `'text-blue-600 border-b-2 border-blue-600'` → `'text-indigo-600 border-b-2 border-indigo-600'` (active tab)
- `'border-blue-500 bg-blue-50 dark:bg-blue-900/20'` → `'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'` (active provider card)
- `dark:border-gray-600 bg-white dark:bg-gray-700` → `dark:border-white/[0.07] bg-white dark:bg-[#1a1d2e]` (10 inputs/selects, replace_all)
- `dark:bg-gray-600` → `dark:bg-white/[0.07]` (5 show/hide API key buttons)
- `? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'` → `? 'bg-indigo-600' : ...` (3 toggle buttons, replace_all)
- `bg-blue-600 hover:bg-blue-700` → `bg-indigo-600 hover:bg-indigo-700` (export button)
- `dark:bg-gray-700 dark:hover:bg-gray-600` → `dark:bg-white/[0.07] dark:hover:bg-white/[0.1]` (import label)

### `src/components/AIUsagePanel.tsx`
- `dark:bg-gray-800` → `dark:bg-[#1a1d2e]` (card surface)
- `bg-gradient-to-r from-indigo-600 to-purple-600` → `bg-indigo-600` (header gradient flattened)
- `border-gray-200 dark:border-gray-700` → `border-gray-200 dark:border-white/[0.07]` (tabs border + pricing header border, replace_all)
- `dark:bg-gray-700/50` → `dark:bg-[#1a1d2e]` (2 summary cards, replace_all)
- `dark:divide-gray-700` → `dark:divide-white/[0.07]` (pricing table row dividers)

---

## Files NOT changed
- All test files: 0 changes
- `src/lib/**`: 0 changes
- `src/app/api/**`: 0 changes
- `src/app/(dashboard)/layout.tsx`: 0 changes
- All other components: 0 changes

## Expected test delta
- 0 new tests
- 0 modified tests
- 0 regressions
