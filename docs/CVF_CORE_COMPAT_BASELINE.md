# CVF Core Compatibility Baseline

## Purpose

This document defines the fast compatibility process to avoid re-scanning the entire CVF core on every change.

Primary inputs:
- `governance/compat/core-manifest.json`
- `governance/compat/check_core_compat.py`
- `docs/CVF_INCREMENTAL_TEST_LOG.md`

---

## Baseline Snapshot

- Baseline date: `2026-02-25`
- Baseline source: `docs/CVF_INDEPENDENT_ASSESSMENT_2026-02-25.md`
- Core frozen zone:
  - `v1.0/**`
  - `v1.1/**`
  - `v1.2/**`

Interpretation:
- If changed files do not touch deep-scan triggers and do not touch frozen core,
  focused tests are allowed.
- If deep-scan triggers are touched, run full regression.

---

## Fast Compatibility Gate

Run before selecting test scope:

```bash
python governance/compat/check_core_compat.py --base <BASE_REF> --head <HEAD_REF>
```

Common local usage:

```bash
python governance/compat/check_core_compat.py --base HEAD~1 --head HEAD
```

Generate machine-readable report:

```bash
python governance/compat/check_core_compat.py --base HEAD~1 --head HEAD --json --write-report governance/compat/last-report.json
```

Enforcement mode (non-zero exit when deep scan is required):

```bash
python governance/compat/check_core_compat.py --base HEAD~1 --head HEAD --enforce
```

---

## Decision Rules

1. Gate says `FOCUSED TESTS ALLOWED`:
   - Run only impacted tests.
   - Log skipped unaffected areas in `docs/CVF_INCREMENTAL_TEST_LOG.md`.

2. Gate says `FULL REGRESSION REQUIRED`:
   - Run full relevant test suite(s) before merge.

3. Frozen core touched:
   - Treat as high-risk change.
   - Require explicit review and full regression.

---

## Notes

- This process optimizes developer time; it does not reduce quality gates.
- `core-manifest.json` must be updated if architecture boundaries or trigger files change.
- `cvf-web-ci.yml` now runs the compatibility gate as an impact report step before lint/test.
