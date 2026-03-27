# CVF Python Automation Size Guard

**Guard Class:** `SIZE_AND_OWNERSHIP_GUARD`
**Status:** Active maintainability boundary for governed Python automation under shared repo automation surfaces.
**Applies to:** `scripts/**/*.py` and `governance/compat/**/*.py`, excluding approved legacy registry utilities and unrelated extension-local Python.
**Enforced by:** `governance/compat/check_python_automation_size.py`

## Purpose

- prevent single-file automation blobs that become hard to audit
- reduce risky edits caused by too many unrelated rules accumulating in one Python file
- stop future regressions where agents keep extending oversized scripts instead of splitting them

## Rule

Governed Python automation under `scripts/` and `governance/compat/` must stay reviewable.

### Scope

This guard applies to:

- `scripts/**/*.py`
- `governance/compat/**/*.py`

This guard does not apply to:

- vendored Python under `node_modules/`
- `governance/skill-library/registry/` legacy registry utilities
- extension-local Python outside the two governed automation trees above

### Size Thresholds

- soft threshold: `600` lines
- hard threshold: `1200` lines

Required behavior:

- any governed Python file above the soft threshold must either be split/refactored or be listed in the exception registry with rationale and follow-up plan
- any governed Python file above the hard threshold must not exist unless it is explicitly listed in the exception registry and granted a temporary approved maximum

### Exception Registry

Use:

- `governance/compat/CVF_PYTHON_AUTOMATION_SIZE_EXCEPTION_REGISTRY.json`

Each exception entry must include:

- `path`
- `approvedMaxLines`
- `rationale`
- `requiredFollowup`
- `status`

### Operational Rule

When a governed Python file approaches or exceeds the soft threshold:

1. stop extending it blindly
2. decide whether the next batch should split builders/helpers into a separate module or register a temporary exception with explicit follow-up
3. record the decision in the active roadmap or trace chain if the file remains oversized

### Current Baseline Note

At the time this guard was activated:

- `scripts/export_cvf_release_packet.py` was already above the hard threshold
- it was therefore treated as a legacy controlled exception
- future extensions to that file should bias toward extraction and refactor rather than continued in-place growth

## Enforcement Surface

- repo-level enforcement runs through `governance/compat/check_python_automation_size.py`
- CI enforcement runs through `.github/workflows/documentation-testing.yml`
- registry mutation hardening is baseline-protected inside the checker itself
- local pre-push remains intentionally deferred until legacy oversized Python debt is fully exception-tracked or split

Standard commands:

```bash
python governance/compat/check_python_automation_size.py
python governance/compat/check_python_automation_size.py --enforce
```

Exit codes:

- `0` governed Python automation is within policy
- `1` script or runtime error
- `2` size policy violation

## Related Artifacts

- `governance/compat/CVF_PYTHON_AUTOMATION_SIZE_EXCEPTION_REGISTRY.json`
- `governance/compat/check_python_automation_size.py`
- `governance/toolkit/05_OPERATION/CVF_GOVERNED_FILE_SIZE_GUARD.md`
- `docs/baselines/CVF_GUARD_HARDENING_BATCH2_RAPID_AUDIT_DELTA_2026-03-27.md`
- `docs/reference/CVF_GUARD_SURFACE_CLASSIFICATION.md`

## Final Clause

Automation that cannot be reviewed safely should not be allowed to keep growing just because it already exists.
