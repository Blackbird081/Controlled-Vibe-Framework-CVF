# CVF Audit — W4-T11 CP1 GovernanceSignalConsumerPipelineContract

Memory class: FULL_RECORD

> Date: 2026-03-25
> Tranche: W4-T11 CP1 — GovernanceSignal Consumer Pipeline Bridge (Full Lane GC-019)
> Auditor: Cascade

---

## Scope

Audit of `GovernanceSignalConsumerPipelineContract` — the CP1 Full Lane delivery for W4-T11.

---

## Contract Audit

| Item | Status |
|---|---|
| Contract file created | PASS |
| Imports correct (deterministic hash, GovernanceSignalContract, CPF pipeline) | PASS |
| Warning constants defined | PASS |
| Request / Result / Dependencies interfaces exported | PASS |
| execute() chains ThresholdAssessment → signal() → CPF | PASS |
| query format correct (type:signalType:urgency:urgency:assessment:sourceAssessmentId, <=120) | PASS |
| contextId = signalResult.signalId | PASS |
| ESCALATE warning fired correctly | PASS |
| TRIGGER_REVIEW warning fired correctly | PASS |
| MONITOR / NO_ACTION no warning | PASS |
| pipelineHash seed = w4-t11-cp1-governance-signal-consumer-pipeline | PASS |
| resultId seed = w4-t11-cp1-result-id | PASS |
| resultId != pipelineHash | PASS |
| consumerId propagated | PASS |
| Factory function exported | PASS |

---

## Test Audit

| Item | Status |
|---|---|
| Test file created | PASS |
| 36 tests, 0 failures | PASS |
| instantiation (2 tests) | PASS |
| output shape (7 tests) | PASS |
| consumerId propagation (2 tests) | PASS |
| deterministic hashing (4 tests) | PASS |
| query derivation (8 tests) | PASS |
| warning messages (5 tests) | PASS |
| signalResult propagation (8 tests) | PASS |

---

## Governance Audit

| Item | Status |
|---|---|
| GC-018 authorization in place | PASS |
| GC-019 Full Lane protocol followed | PASS |
| GC-022 Memory class declared | PASS |
| Barrel export added to src/index.ts | PASS |
| Partition registry entry added | PASS |
| Audit document (this file) created | PASS |
| GC-019 Review created | PASS |
| Delta created | PASS |

---

## Result

**AUDIT PASSED** — W4-T11 CP1 GovernanceSignalConsumerPipelineContract is compliant and ready for commit.
