CVF v1.7.1 Kernel Architecture - Treeview Index

This file now acts as an index to two explicit trees:

1. Target architecture (design intent):
   - `TREEVIEW_TARGET.md`

2. Implemented architecture (current code snapshot):
   - `TREEVIEW_IMPLEMENTED.md`

Core rule:
- CVF current architecture is the base.
- All kernel additions must strengthen CVF, not break existing CVF structure.

Canonical module path:
- `EXTENSIONS/CVF_v1.7.1_SAFETY_RUNTIME/kernel-architecture/`

Maintenance rule:
- Update `TREEVIEW_IMPLEMENTED.md` after any file/folder change in this module.
- Keep `TREEVIEW_TARGET.md` as design intent baseline.
- Validate module after structural changes with:
  - `npm run test:run`
  - `npm run test:coverage`
  - `npm run test:e2e`
