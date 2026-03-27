# CVF Governed File Size Guard

**Control ID:** `GC-023`
**Guard Class:** `SIZE_AND_OWNERSHIP_GUARD`
**Status:** Active global maintainability boundary for governed source, test, frontend, and active markdown files.
**Applies to:** governed source, test, frontend, and active markdown files across CVF, excluding surfaces that already have their own dedicated rotation or archive guards.
**Enforced by:** `governance/compat/check_governed_file_size.py`

## Purpose

- keep governed files reviewable by humans
- preserve split-by-responsibility discipline across waves and tranches
- stop oversized files from growing through silent drift instead of intentional exception tracking

Some CVF artifacts already use dedicated rotation or archive controls, such as:

- `docs/CVF_INCREMENTAL_TEST_LOG.md`
- governed conformance trace logs
- governed Python automation covered by `check_python_automation_size.py`

`GC-023` covers the remaining governed file surface that would otherwise lack a global maintainability boundary.

## Rule

Large governed files are allowed only when one of these conditions is true:

1. the file stays below the active hard threshold for its class
2. the file has an approved exception entry with explicit rationale and follow-up

Default operating rule:

- split before the file becomes a maintenance liability
- do not keep adding new tranche logic into an already oversized file without an exception trail
- preserve exceptions as tracked debt, never as silent drift

### File Classes And Thresholds

#### `test_code`

Applies to:

- `*.test.ts`
- `*.test.tsx`
- `*.test.js`
- `*.test.jsx`
- files under `/tests/`

Thresholds:

- advisory threshold: `> 800` lines
- hard threshold: `> 1200` lines

#### `frontend_component`

Applies to:

- `*.tsx`
- `*.jsx`
- excluding test files

Thresholds:

- advisory threshold: `> 700` lines
- hard threshold: `> 1000` lines

#### `general_source`

Applies to:

- `*.ts`
- `*.js`
- excluding tests and frontend components

Thresholds:

- advisory threshold: `> 700` lines
- hard threshold: `> 1000` lines

#### `active_markdown`

Applies to:

- non-archived markdown intended for active reading or governed execution reference

Thresholds:

- advisory threshold: `> 900` lines
- hard threshold: `> 1200` lines

### Exclusions

This guard does not govern files already controlled by dedicated rotation or archive rules:

- `docs/CVF_INCREMENTAL_TEST_LOG.md`
- `docs/logs/**`
- any path containing `/archive/`
- `docs/reviews/cvf_phase_governance/logs/**`
- governed Python automation already covered by `check_python_automation_size.py`

These exclusions exist to avoid double-enforcement and conflicting thresholds.

### Required Workflow

When a governed file exceeds the hard threshold:

1. split the file by responsibility, scope, or tranche, or
2. add an approved exception entry to `governance/compat/CVF_GOVERNED_FILE_SIZE_EXCEPTION_REGISTRY.json`
3. include rationale, approved maximum, and required follow-up split plan
4. run `python governance/compat/check_governed_file_size.py --enforce`

If a file is already above threshold and is touched in a new batch:

- prefer reducing or extracting from it in the same batch
- do not append new tranche logic into the oversized file unless the exception still truthfully covers that usage

### Exception Model

Approved exceptions are allowed only for:

- legacy debt already present before the guard
- temporary compatibility surfaces
- deliberate monoliths that are being phased out or actively split

Each exception must declare:

- file path
- file class
- approved maximum lines
- status
- rationale
- required follow-up

Exception entries are governance debt records, not blanket approvals.

## Enforcement Surface

- repo-level enforcement runs through `governance/compat/check_governed_file_size.py`
- local pre-commit and pre-push enforcement runs through `governance/compat/run_local_governance_hook_chain.py`
- exception trail integrity is paired with `governance/compat/check_governed_exception_registry.py`
- CI enforcement runs through `.github/workflows/documentation-testing.yml`

Strict command:

```bash
python governance/compat/check_governed_file_size.py --enforce
```

Violations include:

- a governed file exceeding its hard threshold without approved exception
- a file exceeding its exception maximum
- an incomplete exception entry
- growing an oversized file without maintaining the exception trail

## Related Artifacts

- `governance/compat/CVF_GOVERNED_FILE_SIZE_EXCEPTION_REGISTRY.json`
- `governance/compat/check_governed_file_size.py`
- `governance/compat/check_governed_exception_registry.py`
- `governance/toolkit/05_OPERATION/CVF_PYTHON_AUTOMATION_SIZE_GUARD.md`
- `docs/reference/CVF_GUARD_SURFACE_CLASSIFICATION.md`

## Final Clause

CVF does not require every file to be tiny.

CVF does require every large governed file to be intentional, reviewable, justified, and on a path toward cleaner ownership.
