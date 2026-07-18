# ADIF-0040 - Live Score Without Recomputable Sanitized Input

Memory class: POINTER_RECORD

Status: ACTIVE

```text
defectId: ADIF-0040
title: Live score without recomputable sanitized input
defectCategory: CLOSURE_EVIDENCE
defectClass: WORKER_EXECUTION_ERROR
defectRole: worker
severity: HIGH
lifecycleState: ACTIVE
taskClasses: Runtime / provider / live proof; Worker execution (`WORKER_MUST_NOT_COMMIT`); Reviewer-return review
roles: dispatcher; worker; reviewer; closer
lifecyclePhases: pre-dispatch; pre-implementation; pre-closure
surfaceSelectors: live evidence artifacts that persist a score, defect verdict, or release candidate derived from provider output
detectionSignals: evidence persists only a response hash and derived score while omitting the sanitized parsed input needed for independent recomputation
enforcementLevel: GUIDANCE_ONLY
checkerBindings: NOT_APPLICABLE_WITH_REASON: no current checker verifies that every derived live score includes its sanitized recomputation input
promotionState: MACHINE_CHECK_CANDIDATE
supersedes: NONE
lastVerifiedCommit: 63658c1e6
roadmapSeedId: NONE
```

## Purpose

Prevent a worker-generated live score or material-defect verdict from passing
structural gates when the reviewer cannot independently recompute it from the
persisted secret-safe evidence.

## Scope / Applies To

Applies when a live proof derives a rubric score, defect list, threshold, or
release decision from provider output. It does not require raw provider payload
retention; the persisted input may be a sanitized parsed projection sufficient
to reproduce every derived claim.

## Bad Example

Persist a response hash, score, and empty defect list but omit the sanitized
candidate. The reviewer can confirm that some bytes existed but cannot verify
that those bytes justified the score or release threshold.

## Good Example

Persist the raw-response hash plus a secret-safe parsed candidate containing
every field consumed by the deterministic scorer. The reviewer reruns the
scorer against that candidate and compares all derived rows before acceptance.

## Canonical Sources

- `docs/work_orders/CVF_AGENT_WORK_ORDER_MAO_OA_T6A_HARDER_CANDIDATE_DIRECT_BASELINE_CALIBRATION_2026-07-17.md`
- `docs/reviews/evidence/mao-oa-t6a-direct-candidate-calibration-2026-07-17.json`
- `EXTENSIONS/CVF_EXECUTION_PLANE_FOUNDATION/scripts/run-mao-oa-t6a-candidate-calibration.ts`
- `docs/reference/CVF_WORK_ORDER_CLOSURE_QUALITY_GATE_STANDARD_2026-05-28.md`

## Remediation

1. Declare the sanitized recomputation input in the work-order evidence schema.
2. Persist every non-secret parsed field consumed by scoring or defect logic.
3. Hash but do not persist raw provider payload when raw retention is forbidden.
4. Reviewer must reject the derived score if the persisted input is absent.
5. Do not spend another provider call merely to repair an evidence-shape defect
   unless fresh authority explicitly releases the call.

## Epistemic Process Block

### Expected Result / Prediction

A deterministic live score should be independently reproducible from the
persisted secret-safe evidence without trusting the worker's derived values.

### Evidence Comparison

T6A persisted a hash and 100/100 result but no sanitized candidate, while the
work order explicitly required parsed candidate evidence and reviewer rescoring.

### Contradiction Or Gap Disposition

Passing tests and structural gates do not close this evidence gap. The live
score remains unaccepted because a cryptographic hash is not scoring input.

### Claim Update

The implementation and one-call receipt may be accepted independently, but the
score, defect verdict, and comparison-release decision require recomputable
sanitized input.

## Agent Operation Trace Block

| Field | Evidence |
|---|---|
| Actor | independent reviewer/closer |
| Provider or surface | local private provenance workspace |
| Session or invocation | MAO-OA-T6A completion review, 2026-07-17 |
| Working directory | repository root |
| Command or tool surface | work-order/evidence/source reads, independent tests, secret scan, apply_patch, ADIF integrity gate |
| Target paths | this entry and entries README |
| Allowed scope source | mandatory ADIF disclosure for a new non-obvious defect found during reviewer closure |
| Before status evidence | T6A evidence stored only derived score, defects, and raw-response hash |
| After status evidence | missing-recomputable-input pattern is resolver-discoverable as ADIF-0040 |
| Diff evidence | new entry and README row in the T6A material closure batch |
| Approval boundary | durable learning and reviewer evidence disposition only; no provider rerun or checker mutation |
| Claim boundary | guidance and machine-check candidate only |
| Agent type | reviewer/closer |
| Invocation ID | `mao-oa-t6a-adif-0040-2026-07-17` |
| Expected manifest | ADIF-0040 entry and entries README row |
| Actual changed set | ADIF-0040 entry and entries README row |
| Manifest delta | MATCH |
| Deletion or rename disposition | N/A with reason: none |

## Public Export Disposition

DEFERRED_PRIVATE_ONLY

Reason: private provenance learning record; no public-sync action.

## Claim Boundary

This entry records one non-obvious closure-evidence defect and its bounded
remediation. It does not modify a checker, authorize another live call, accept
the T6A score, release T6B, or claim broader prevention.
