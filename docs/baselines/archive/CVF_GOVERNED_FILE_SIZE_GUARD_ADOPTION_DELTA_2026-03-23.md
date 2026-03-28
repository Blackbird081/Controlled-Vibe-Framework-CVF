# CVF Governed File Size Guard Adoption Delta

Memory class: SUMMARY_RECORD
Date: `2026-03-23`
Scope: adopt a repo-wide governed file size guard for maintainability beyond dedicated log rotation guards

---

## What Changed

This batch introduces `GC-023`:

- operational rule: `governance/toolkit/05_OPERATION/CVF_GOVERNED_FILE_SIZE_GUARD.md`
- automated checker: `governance/compat/check_governed_file_size.py`
- canonical exception registry: `governance/compat/CVF_GOVERNED_FILE_SIZE_EXCEPTION_REGISTRY.json`

It also wires the new guard into:

- `CVF_MASTER_POLICY.md`
- `CVF_GOVERNANCE_CONTROL_MATRIX.md`
- local pre-push governance hook chain
- CI workflow `documentation-testing.yml`

---

## Threshold Model

The guard uses class-specific thresholds:

- `test_code`: advisory `800`, hard `1200`
- `frontend_component`: advisory `700`, hard `1000`
- `general_source`: advisory `700`, hard `1000`
- `active_markdown`: advisory `900`, hard `1200`

Dedicated rotation guards remain authoritative for:

- `docs/CVF_INCREMENTAL_TEST_LOG.md`
- `docs/logs/**`
- archive paths
- governed Python automation already covered by its own size policy

---

## Initial Exception Trail

The registry seeds current legacy debt explicitly instead of leaving it implicit.

Initial exceptions include:

- `EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION/tests/index.test.ts`
- `EXTENSIONS/CVF_EXECUTION_PLANE_FOUNDATION/tests/index.test.ts`
- `EXTENSIONS/CVF_LEARNING_PLANE_FOUNDATION/tests/index.test.ts`
- `EXTENSIONS/CVF_EXECUTION_PLANE_FOUNDATION/src/index.ts`
- `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/app/(dashboard)/safety/page.tsx`
- `EXTENSIONS/CVF_v1.5_UX_PLATFORM/cvf-web/src/lib/templates.ts`
- `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/components/SpecExport.tsx`
- `docs/reference/CVF_IN_VSCODE_GUIDE.md`

Each entry records:

- file class
- approved maximum
- rationale
- required follow-up split plan

---

## Verification

The batch is valid only if all of the following pass:

- `python -m py_compile governance/compat/check_governed_file_size.py`
- `python governance/compat/check_governed_file_size.py --enforce`
- `python governance/compat/run_local_governance_hook_chain.py --hook pre-push`

---

## Result

CVF now has:

- dedicated rotation guards for append-only evidence chains,
- dedicated size control for governed Python automation,
- and a general governed file-size guard for the remaining maintainability surface.
