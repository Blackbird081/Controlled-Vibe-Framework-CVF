# CVF GOVERNED FILE SIZE GUARD

> **Control ID:** `GC-023`  
> **Type:** Governance Guard  
> **Effective:** 2026-03-23  
> **Status:** Active  
> **Applies to:** governed source, test, frontend, and active markdown files across CVF  
> **Enforced by:** `governance/compat/check_governed_file_size.py`

---

## 1. PURPOSE

CVF requires files that remain:

- reviewable by humans,
- maintainable across waves,
- split by responsibility,
- safe to change without excessive regression surface.

Some CVF artifacts already use dedicated rotation guards, such as:

- `docs/CVF_INCREMENTAL_TEST_LOG.md`
- governed conformance traces
- governed Python automation size control

This guard covers the remaining governed files that would otherwise grow without a global maintainability boundary.

---

## 2. CANONICAL PRINCIPLE

Large files are allowed only when one of the following is true:

1. the file is still below the active hard threshold for its class, or
2. the file has an approved exception entry with explicit rationale and follow-up.

The default rule is:

- split before the file becomes a maintenance liability,
- do not keep adding new tranche logic into an already oversized file,
- preserve current exceptions only as tracked debt, never as silent drift.

---

## 3. FILE CLASSES AND THRESHOLDS

### `test_code`

Applies to:

- `*.test.ts`
- `*.test.tsx`
- `*.test.js`
- `*.test.jsx`
- files under `/tests/`

Thresholds:

- advisory threshold: `> 800` lines
- hard threshold: `> 1200` lines

### `frontend_component`

Applies to:

- `*.tsx`
- `*.jsx`
- excluding test files

Thresholds:

- advisory threshold: `> 700` lines
- hard threshold: `> 1000` lines

### `general_source`

Applies to:

- `*.ts`
- `*.js`
- excluding tests and frontend components

Thresholds:

- advisory threshold: `> 700` lines
- hard threshold: `> 1000` lines

### `active_markdown`

Applies to:

- non-archived markdown intended for active reading or governed execution reference

Thresholds:

- advisory threshold: `> 900` lines
- hard threshold: `> 1200` lines

---

## 4. EXCLUSIONS

This guard does **not** govern files already controlled by dedicated rotation or archive rules:

- `docs/CVF_INCREMENTAL_TEST_LOG.md`
- `docs/logs/**`
- any path containing `/archive/`
- `docs/reviews/cvf_phase_governance/logs/**`
- governed Python automation already covered by `check_python_automation_size.py`

These exclusions exist to avoid double-enforcement and conflicting thresholds.

---

## 5. REQUIRED WORKFLOW

When a governed file exceeds the hard threshold:

1. split the file by responsibility, scope, or tranche, **or**
2. add an approved exception entry to:
   - `governance/compat/CVF_GOVERNED_FILE_SIZE_EXCEPTION_REGISTRY.json`
3. include:
   - rationale,
   - approved maximum,
   - required follow-up split plan
4. run:
   - `python governance/compat/check_governed_file_size.py --enforce`

If a file is already above threshold and is touched in a new batch:

- prefer reducing or extracting from it in that same batch,
- do not append new tranche logic into the oversized file unless the exception still truthfully covers that usage.

---

## 6. EXCEPTION MODEL

Approved exceptions are allowed only for:

- legacy debt already present before the guard,
- temporary compatibility surfaces,
- deliberate monoliths that are being phased out or actively split.

Each exception must declare:

- file path,
- file class,
- approved maximum lines,
- status,
- rationale,
- required follow-up.

Exception entries are governance debt records, not blanket approvals.

---

## 7. ENFORCEMENT

### Automated Check

```bash
# Advisory
python governance/compat/check_governed_file_size.py

# Strict
python governance/compat/check_governed_file_size.py --enforce
```

### Violation Conditions

Violations include:

- a governed file exceeding its hard threshold without approved exception,
- a file exceeding its exception maximum,
- an incomplete exception entry,
- growing an oversized file without maintaining the exception trail.

---

## 8. FINAL CLAUSE

CVF does not require every file to be tiny.

CVF **does** require every large file to be:

- intentional,
- reviewable,
- justified,
- and on a path toward cleaner ownership.
