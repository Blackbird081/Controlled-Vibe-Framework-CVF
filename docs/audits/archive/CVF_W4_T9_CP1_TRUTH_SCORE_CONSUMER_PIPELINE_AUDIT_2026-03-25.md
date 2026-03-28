# CVF W4-T9 CP1 Audit — TruthScoreConsumerPipelineContract

Memory class: FULL_RECORD

> Date: 2026-03-25
> Tranche: W4-T9 — TruthScore Consumer Pipeline Bridge
> Control point: CP1
> Lane: Full Lane (GC-019)
> Auditor: Cascade

---

## Contract

**File**: `EXTENSIONS/CVF_LEARNING_PLANE_FOUNDATION/src/truth.score.consumer.pipeline.contract.ts`
**Class**: `TruthScoreConsumerPipelineContract`
**Foundation**: LPF

---

## Contract Chain

```
TruthModel
  → TruthScoreContract.score()
  → TruthScore { compositeScore, scoreClass, scoreId, dimensions, rationale, scoreHash }
  → ControlPlaneConsumerPipelineContract.execute()
  → ControlPlaneConsumerPackage
  → TruthScoreConsumerPipelineResult
```

---

## Output Fields

| Field | Source |
|---|---|
| `resultId` | `computeDeterministicHash("w4-t9-cp1-result-id", pipelineHash)` |
| `createdAt` | `now()` |
| `scoreResult` | `TruthScoreContract.score(model)` |
| `consumerPackage` | `ControlPlaneConsumerPipelineContract.execute(...)` |
| `pipelineHash` | `computeDeterministicHash("w4-t9-cp1-truth-score-consumer-pipeline", scoreResult.scoreHash, consumerPackage.pipelineHash, createdAt)` |
| `warnings` | derived from `scoreResult.scoreClass` |
| `consumerId` | propagated from request or `undefined` |

---

## Query Derivation

```
truth-score:class:${scoreClass}:score:${compositeScore}:model:${sourceTruthModelId}
```

Capped at 120 characters. `contextId = scoreResult.scoreId`.

---

## Warning Rules

| scoreClass | Warning |
|---|---|
| `INSUFFICIENT` | `"[truth-score] insufficient truth data — model not actionable"` |
| `WEAK` | `"[truth-score] weak truth signal — model quality degraded"` |
| `STRONG` | none |
| `ADEQUATE` | none |

---

## Determinism

- `now` injected via `TruthScoreConsumerPipelineContractDependencies`
- Threaded into `TruthScoreContract` and `ControlPlaneConsumerPipelineContract`
- Seeds: `w4-t9-cp1-truth-score-consumer-pipeline` / `w4-t9-cp1-result-id`
- `resultId` ≠ `pipelineHash`

---

## Test Coverage (32 tests)

- instantiation without deps
- factory pattern
- output shape (7 fields)
- consumerId propagation (provided / absent)
- deterministic hashing (4 cases)
- query derivation (5 cases including 120-char cap)
- contextId = scoreResult.scoreId
- warning messages (5 cases)
- scoreResult propagation (5 cases)

---

## Governance Compliance

| Protocol | Status |
|---|---|
| GC-018 authorization | AUTHORIZED (10/10) |
| GC-019 Full Lane | COMPLIANT |
| GC-022 Memory class | FULL_RECORD |
| GC-024 dedicated test file | COMPLIANT |
| GC-026 tracker sync | COMPLIANT |

---

## Verdict

**PASS** — CP1 contract is correct, complete, and governance-compliant.
