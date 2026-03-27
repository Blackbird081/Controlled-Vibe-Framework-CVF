# CVF Conformance Execution Performance Guard

**Guard Class:** `QUALITY_AND_CONFORMANCE_GUARD`
**Status:** Active performance and determinism rule for canonical Wave 1 conformance closure.
**Applies to:** Humans and AI agents running or extending the authoritative Wave 1 conformance sequence and related packet-posture wrappers.
**Enforced by:** `scripts/run_cvf_wave1_authoritative_sequence.py`, `scripts/run_cvf_runtime_evidence_release_gate.py`

## Purpose

- keep Wave 1 conformance deterministic and operationally reviewable
- reduce avoidable latency from repeated bootstrap and release-gate work
- preserve sequential correctness without accepting wasteful duplication

## Rule

Wave conformance must stay deterministic, reuse shared bootstrap state where possible, and expose enough timing data to support evidence-based optimization.

### Mandatory Execution Rules

- use `scripts/run_cvf_wave1_authoritative_sequence.py` for canonical Wave 1 closure
- do not replace the authoritative sequential path with parallel reruns that can reintroduce report or summary mismatch
- sibling packet wrappers must reuse shared bootstrap state whenever they validate the same runtime evidence set in one batch

### Mandatory Optimization Rule

If a wrapper is only validating alternate packet postures over the same runtime-evidence baseline:

- shared runtime-evidence bootstrap must run once
- child packet wrappers must not regenerate the same release-gate state redundantly inside the same parent wrapper

### Mandatory Observability Rule

Wave conformance output must record per-scenario duration so future optimization is evidence-based instead of guessed.

### Current Baseline Decision

As of `2026-03-07`:

- the primary avoidable hotspot was repeated invocation of `run_cvf_runtime_evidence_release_gate.py` across secondary packet-posture wrappers
- that hotspot was reduced by shared bootstrap reuse in the secondary packet-posture aggregation wrapper

### Follow-Up Rule

If authoritative Wave 1 closure remains operationally expensive after shared-bootstrap reuse:

1. inspect scenario-duration data first
2. optimize the slowest repeated bootstrap chain
3. only then add new packet or evidence layers

Do not keep extending Wave 1 blindly while runtime cost rises without visibility.

## Enforcement Surface

- the canonical execution surface is `scripts/run_cvf_wave1_authoritative_sequence.py`
- shared runtime-evidence gating behavior is anchored by `scripts/run_cvf_runtime_evidence_release_gate.py`
- reviewer and runner maintenance must reject changes that trade deterministic sequence truth for ad hoc parallel speedups

## Related Artifacts

- `scripts/run_cvf_wave1_authoritative_sequence.py`
- `scripts/run_cvf_runtime_evidence_release_gate.py`
- `governance/toolkit/05_OPERATION/CVF_CONFORMANCE_TRACE_ROTATION_GUARD.md`
- `governance/toolkit/05_OPERATION/CVF_INCREMENTAL_TEST_LOG_ROTATION_GUARD.md`
- `governance/toolkit/05_OPERATION/CVF_PYTHON_AUTOMATION_SIZE_GUARD.md`

## Final Clause

Wave conformance is allowed to be sequential. It is not allowed to be wasteful, opaque, or nondeterministic.
