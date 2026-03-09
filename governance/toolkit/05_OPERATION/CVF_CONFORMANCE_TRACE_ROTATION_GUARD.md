# CVF CONFORMANCE TRACE ROTATION GUARD

> **Type:** Governance Guard  
> **Effective:** 2026-03-07  
> **Status:** Active  
> **Applies to:** `docs/reviews/cvf_phase_governance/CVF_CONFORMANCE_TRACE_2026-03-07.md` and its scoped archive chain  
> **Enforced by:** `governance/compat/check_conformance_trace_rotation.py`

---

## 1. PURPOSE

`CVF_CONFORMANCE_TRACE_2026-03-07.md` is a scoped append-only evidence chain for Wave 1 conformance work.

It must stay:

- readable by humans,
- easy to diff,
- easy to audit by batch,
- small enough to review before extending the conformance baseline.

This guard prevents the active scoped trace from becoming too large while preserving append-only recovery through an archive chain.

---

## 2. CANONICAL MODEL

The canonical active file remains:

- `docs/reviews/cvf_phase_governance/CVF_CONFORMANCE_TRACE_2026-03-07.md`

Historical windows move to:

- `docs/reviews/cvf_phase_governance/logs/CVF_CONFORMANCE_TRACE_ARCHIVE_<YYYY>_PART_<NN>.md`

The active scoped trace remains the entrypoint and current working window.

---

## 3. ROTATION THRESHOLDS

> **NON-NEGOTIABLE:**  
> Rotate the active conformance trace when either threshold is exceeded:

- active file line count `> 1200`
- active batch count `> 60`

These values are lower than the incremental test log thresholds because scoped conformance traces are expected to be narrower and reviewed more frequently by humans.

---

## 4. POST-ROTATION TARGET

After rotation:

- the active file MUST retain the trace header, archive index, and newest active batches
- the retained active window SHOULD be at most `20` recent batches unless a different keep window is explicitly chosen in the rotation utility

---

## 5. ARCHIVE LOCATION AND NAMING

Approved archive location:

- `docs/reviews/cvf_phase_governance/logs/`

Required archive filename pattern:

```text
CVF_CONFORMANCE_TRACE_ARCHIVE_<YYYY>_PART_<NN>.md
```

---

## 6. REQUIRED WORKFLOW

When threshold is reached:

1. run:
   - `python scripts/rotate_cvf_conformance_trace.py`
2. verify the active trace still contains:
   - trace header,
   - archive index,
   - newest active batches
3. verify the archive landed under the scoped `logs/` folder
4. run:
   - `python governance/compat/check_conformance_trace_rotation.py --enforce`

---

## 7. ENFORCEMENT

Violations include:

- active conformance trace exceeds threshold without rotation,
- archive created outside the scoped review `logs/` folder,
- archive filename does not match the required CVF pattern,
- active trace loses its archive index after rotation.

### Automated Check

```bash
python governance/compat/check_conformance_trace_rotation.py
python governance/compat/check_conformance_trace_rotation.py --enforce
```

---

## 8. FINAL CLAUSE

Scoped conformance evidence must stay append-only by chain, not by unlimited growth in one file.

The active trace must stay reviewable.
The archive must stay recoverable.
