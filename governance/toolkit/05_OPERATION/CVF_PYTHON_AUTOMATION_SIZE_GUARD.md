# CVF Python Automation Size Guard

**Guard Class:** `SIZE_AND_OWNERSHIP_GUARD`
**Status:** Active class-aware maintainability boundary for governed Python automation under shared repo automation surfaces.
**Applies to:** `scripts/**/*.py` and `governance/compat/**/*.py`, classified per-class (`python_checker`, `python_test`, `python_library_helper`, `python_cli_orchestrator`), excluding approved legacy registry utilities and unrelated extension-local Python.
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

Per-class thresholds (GFS-PY-T1, operator-confirmed 2026-06-25). Files are
classified by path: a test by name (`test_*.py`/`*_test.py`) or `/tests/`
location is `python_test`; a `governance/compat/check_*.py` is a
`python_checker`; a `governance/compat/run_*.py` or any `scripts/*.py` is a
`python_cli_orchestrator`; any remaining `governance/compat/*.py` is a
`python_library_helper`.

| File class | Soft | Near-hard | Hard |
| --- | ---: | ---: | ---: |
| `python_checker` | 700 | 900 | 1000 |
| `python_test` | 900 | 1100 | 1200 |
| `python_library_helper` | 600 | 800 | 900 |
| `python_cli_orchestrator` | 500 | 700 | 800 |

The flat `softThresholdLines`/`hardThresholdLines` registry fields (600/1200)
are retained as a backward-compatible fallback for any in-scope file that
resolves to no specific class.

Required behavior:

- under soft: OK;
- over soft: advisory; split if adding new logic;
- near-hard and touched in a batch: the same batch must split/extract into a
  new module or shrink the file by at least 50 lines;
- over hard: the file must not exist unless it is listed in the exception
  registry with an approved maximum and a follow-up split plan.

### Touch Rule For Excepted Files

An already-excepted oversized file may be read freely. But a batch that
**modifies** it must not increase its line count: the net line delta versus
`HEAD` must be `<= 0`, unless `approvedMaxLines` is raised in the same
human-reviewed governance change. New logic belongs in a split/helper module,
not appended to the monolith. A bugfix or wiring change is allowed only while
it keeps the net delta at or below zero (or is covered by a same-batch
approvedMaxLines increase).

### Exception Registry

Use:

- `governance/compat/CVF_PYTHON_AUTOMATION_SIZE_EXCEPTION_REGISTRY.json`

Each exception entry must include:

- `path`
- `fileClass`
- `approvedMaxLines`
- `rationale`
- `requiredFollowup`
- `status`

A newly added exception is rejected as a self-authored grant unless it carries
a `seedAuthorization` field naming a GC-018 baseline path that exists in the
repo. This makes seeding a legacy exception a human-reviewed governance change,
not silent drift.

### Operational Rule

When a governed Python file approaches or exceeds its class soft threshold:

1. stop extending it blindly;
2. decide whether the next batch should split builders/helpers into a separate
   module or register a temporary exception with explicit follow-up;
3. record the decision in the active roadmap or trace chain if the file remains
   oversized. The dispatch-quality monolith split is sequenced in
   `docs/roadmaps/CVF_GOVERNED_PYTHON_FILE_SIZE_COVERAGE_ROADMAP_2026-06-25.md`.

## Enforcement Surface

- repo-level enforcement runs through `governance/compat/check_python_automation_size.py`
- local pre-commit and pre-push enforcement runs through `governance/compat/run_local_governance_hook_chain.py`
- early enforcement runs in the autorun `pre-implementation` phase through `governance/compat/run_agent_autorun_workflow_gate.py`
- CI enforcement runs through `.github/workflows/documentation-testing.yml`
- registry mutation hardening (threshold drift, exception mutation, self-authored exception) is baseline-protected inside the checker itself

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
- `docs/baselines/archive/CVF_GUARD_HARDENING_BATCH2_RAPID_AUDIT_DELTA_2026-03-27.md`
- `docs/reference/CVF_GUARD_SURFACE_CLASSIFICATION.md`

## Final Clause

Automation that cannot be reviewed safely should not be allowed to keep growing just because it already exists.
