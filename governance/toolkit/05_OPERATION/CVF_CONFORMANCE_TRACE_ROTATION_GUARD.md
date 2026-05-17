# CVF Conformance Trace Rotation Guard

**Guard Class:** `QUALITY_AND_CONFORMANCE_GUARD`
**Status:** Active rotation rule for the scoped Wave 1 conformance trace and its archive chain.
**Applies to:** `docs/reviews/cvf_phase_governance/CVF_CONFORMANCE_TRACE_2026-03-07.md` and the scoped archive chain under `docs/reviews/cvf_phase_governance/logs/`.
**Enforced by:** `governance/compat/check_conformance_trace_rotation.py`, `governance/compat/check_active_window_registry.py`, `governance/compat/CVF_ACTIVE_WINDOW_REGISTRY.json`

## Purpose

- keep the active conformance trace readable enough for humans to review before extending the baseline
- preserve append-only evidence without forcing all conformance history into one oversized file
- maintain a recoverable archive chain for older conformance windows

## Rule

The active conformance trace remains the canonical entrypoint and current working window. Rotate it when either threshold is exceeded:

- active file line count `> 1200`
- active batch count `> 60`

These thresholds are lower than the incremental test log because scoped conformance traces are narrower and are expected to be reviewed more frequently.

### Canonical Model

Active file:

- `docs/reviews/cvf_phase_governance/CVF_CONFORMANCE_TRACE_2026-03-07.md`

Archive files:

- `docs/reviews/cvf_phase_governance/logs/CVF_CONFORMANCE_TRACE_ARCHIVE_<YYYY>_PART_<NN>.md`

### Post-Rotation Target

After rotation:

- the active file MUST retain the trace header, archive index, and newest active batches
- the retained active window SHOULD stay at or below `20` recent batches unless the rotation utility deliberately uses another keep window

### Required Workflow

When threshold is reached:

1. run `python scripts/rotate_cvf_conformance_trace.py`
2. verify the active trace still contains the trace header, archive index, and newest active batches
3. verify the archive landed under the scoped `logs/` folder
4. run `python governance/compat/check_conformance_trace_rotation.py --enforce`

## Enforcement Surface

- repo-level enforcement runs through `governance/compat/check_conformance_trace_rotation.py`
- active-window registration and archive-protection sync are enforced through `governance/compat/check_active_window_registry.py`
- the guard blocks oversized active traces, invalid archive placement, invalid archive naming, and active traces that lost their archive index

Strict command:

```bash
python governance/compat/check_conformance_trace_rotation.py --enforce
```

Violations include:

- active conformance trace exceeds threshold without rotation
- archive created outside the scoped review `logs/` folder
- archive filename does not match the required pattern
- active trace loses its archive index after rotation

## Related Artifacts

- `governance/compat/check_conformance_trace_rotation.py`
- `governance/compat/check_active_window_registry.py`
- `governance/compat/CVF_ACTIVE_WINDOW_REGISTRY.json`
- `scripts/rotate_cvf_conformance_trace.py`
- `docs/reviews/cvf_phase_governance/CVF_CONFORMANCE_TRACE_2026-03-07.md`
- `docs/reviews/cvf_phase_governance/logs/`

## Final Clause

Scoped conformance evidence must stay append-only by chain, not by unlimited growth in one file. The active trace must stay reviewable and the archive must stay recoverable.
