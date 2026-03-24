# CVF W2-T20 CP2 Audit — ExecutionObservationConsumerPipelineBatchContract

Memory class: FULL_RECORD

> Date: `2026-03-24`
> Tranche: `W2-T20 CP2`
> Lane: Fast Lane (GC-021)
> Contract: `ExecutionObservationConsumerPipelineBatchContract`

---

## Contract Identity

| Item | Value |
|---|---|
| File | `EXTENSIONS/CVF_EXECUTION_PLANE_FOUNDATION/src/execution.observation.consumer.pipeline.batch.contract.ts` |
| Class | `ExecutionObservationConsumerPipelineBatchContract` |
| Factory | `createExecutionObservationConsumerPipelineBatchContract` |
| Lane | Fast Lane (GC-021) |
| Tranche | W2-T20 CP2 |

## Batch Logic Audit

| Property | Rule |
|---|---|
| `failedResultCount` | `results.filter(r => r.observation.outcomeClass === "FAILED").length` |
| `gatedResultCount` | `results.filter(r => r.observation.outcomeClass === "GATED").length` |
| `dominantTokenBudget` | `Math.max(...typedContextPackage.estimatedTokens)`; `0` for empty batch |
| `batchHash` | deterministic hash of all `pipelineHash` values + `createdAt` |
| `batchId` | hash of `batchHash` only — `batchId ≠ batchHash` ✓ |

## Test Coverage

- 17 tests, 0 failures
- Covers: instantiation, empty batch (all zeros), batchId ≠ batchHash, totalResults, failedResultCount, gatedResultCount, all-SUCCESS zero counts, SANDBOXED does not increment failedResultCount, dominantTokenBudget max, determinism, hash uniqueness, results array preserved, createdAt match

## Verdict

APPROVED
