# CVF W3-T14 CP2 Delta — Governance Checkpoint Log Consumer Bridge Batch

Memory class: SUMMARY_RECORD
> Tranche: W3-T14 — Governance Checkpoint Log Consumer Bridge
> Control Point: CP2 — Fast Lane
> Date: 2026-03-24

---

## Files Added

| File | Type | Purpose |
|---|---|---|
| `EXTENSIONS/CVF_GOVERNANCE_EXPANSION_FOUNDATION/src/governance.checkpoint.log.consumer.pipeline.batch.contract.ts` | Source | GovernanceCheckpointLogConsumerPipelineBatchContract |
| `EXTENSIONS/CVF_GOVERNANCE_EXPANSION_FOUNDATION/tests/governance.checkpoint.log.consumer.pipeline.batch.test.ts` | Test | 14 dedicated tests |

## Test Delta

| Module | Before | After | Delta |
|---|---|---|---|
| GEF | 476 | 490 | +14 |

## Fields

- `escalateResultCount` — count of results where `checkpointLog.dominantCheckpointAction === "ESCALATE"`
- `haltResultCount` — count of results where `checkpointLog.dominantCheckpointAction === "HALT"`
- `dominantTokenBudget` — max estimatedTokens across results; 0 for empty
- `batchId ≠ batchHash`
