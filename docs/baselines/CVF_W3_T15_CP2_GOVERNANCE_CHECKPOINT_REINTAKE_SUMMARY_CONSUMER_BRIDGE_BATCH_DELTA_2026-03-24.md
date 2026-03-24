# CVF W3-T15 CP2 Delta — Governance Checkpoint Reintake Summary Consumer Bridge Batch

Memory class: SUMMARY_RECORD

> Tranche: W3-T15 — Governance Checkpoint Reintake Summary Consumer Bridge
> Control Point: CP2 — Fast Lane
> Date: 2026-03-24

---

## Files Added

| File | Type | Purpose |
|---|---|---|
| `EXTENSIONS/CVF_GOVERNANCE_EXPANSION_FOUNDATION/src/governance.checkpoint.reintake.summary.consumer.pipeline.batch.contract.ts` | Source | GovernanceCheckpointReintakeSummaryConsumerPipelineBatchContract |
| `EXTENSIONS/CVF_GOVERNANCE_EXPANSION_FOUNDATION/tests/governance.checkpoint.reintake.summary.consumer.pipeline.batch.test.ts` | Test | 14 dedicated tests |

## Test Delta

| Module | Before | After | Delta |
|---|---|---|---|
| GEF | 507 | 521 | +14 |

## Fields

- `immediateResultCount` — count of results where `reintakeSummary.dominantScope === "IMMEDIATE"`
- `deferredResultCount` — count of results where `reintakeSummary.dominantScope === "DEFERRED"`
- `dominantTokenBudget` — max estimatedTokens across results; 0 for empty
- `batchId ≠ batchHash`
