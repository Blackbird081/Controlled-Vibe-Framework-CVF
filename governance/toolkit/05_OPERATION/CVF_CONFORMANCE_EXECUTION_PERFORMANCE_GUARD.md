# CVF CONFORMANCE EXECUTION PERFORMANCE GUARD

> **Type:** Operational Policy  
> **Effective:** 2026-03-07  
> **Status:** Active  
> **Enforcement:** Partial (workflow + runner behavior)

---

## 1. PURPOSE

Wave conformance must remain deterministic and operationally reviewable.

This guard exists because:
- authoritative sequences can become slow as Wave 1 grows
- repeated nested bootstrap/export work creates avoidable latency
- race-free sequential verification is required, but sequential should not mean wasteful duplication

---

## 2. RULE

### Mandatory execution rules

- Use `scripts/run_cvf_wave1_authoritative_sequence.py` for canonical Wave 1 closure.
- Do not replace the authoritative sequential path with parallel reruns that can reintroduce report/summary mismatch.
- Sibling packet wrappers MUST reuse shared bootstrap state whenever they validate the same runtime evidence set in one batch.

### Mandatory optimization rule

If a wrapper is only validating alternate packet postures over the same runtime evidence baseline:
- shared runtime-evidence bootstrap must run once
- child packet wrappers must not regenerate the same release-gate state redundantly inside the same parent wrapper

### Mandatory observability rule

Wave conformance output must record per-scenario duration so future optimization is evidence-based, not guessed.

---

## 3. CURRENT BASELINE DECISION

As of 2026-03-07:
- the primary avoidable hotspot identified was repeated invocation of `run_cvf_runtime_evidence_release_gate.py` across secondary packet posture wrappers
- this hotspot has been reduced by shared bootstrap reuse in the secondary packet posture aggregation wrapper

---

## 4. FOLLOW-UP RULE

If authoritative Wave 1 closure remains operationally expensive after shared-bootstrap reuse:

1. inspect scenario duration data first
2. optimize the slowest repeated bootstrap chain
3. only then add new packet/evidence layers

Do not keep extending Wave 1 blindly while runtime cost is rising without visibility.

---

## 5. RELATED GOVERNANCE

- `CVF_CONFORMANCE_TRACE_ROTATION_GUARD.md`
- `CVF_INCREMENTAL_TEST_LOG_ROTATION_GUARD.md`
- `CVF_PYTHON_AUTOMATION_SIZE_GUARD.md`

End of Conformance Execution Performance Guard.
