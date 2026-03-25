# CVF GC-019 Full Lane Review — W2-T22 CP1 Execution Pipeline Consumer Bridge

Memory class: FULL_RECORD

> Tranche: W2-T22 — Execution Pipeline Consumer Bridge
> Control Point: CP1 — ExecutionPipelineConsumerPipelineContract
> Lane: Full Lane
> Date: 2026-03-25

---

## Review Decision: APPROVED

### Contract Summary

`ExecutionPipelineConsumerPipelineContract` closes the EPF consumer visibility gap for `ExecutionPipelineContract`. The contract:

1. Accepts a single `ExecutionBridgeReceipt` and passes it to `ExecutionPipelineContract.run()` to produce an `ExecutionPipelineReceipt`
2. Threads `now` through to `commandRuntimeDependencies.now` for full determinism across the command runtime chain
3. Derives query: `[pipeline] failed:${failedCount} sandboxed:${sandboxedCount} total:${totalEntries}` (truncated to 120 chars)
4. Sets `contextId = receipt.pipelineReceiptId` and routes through `ControlPlaneConsumerPipelineContract`
5. Emits warnings for failures (detected) and sandboxed executions (review required)
6. Produces deterministic `pipelineHash` and distinct `resultId`

### Test Coverage Review

- 18 tests covering: field completeness, query format, query length bound, contextId linkage, allow/sandbox/deny/failed execution paths, both-warnings case, consumerId propagation, resultId ≠ pipelineHash, estimatedTokens presence, determinism, hash divergence on different inputs, factory/direct-instantiation equivalence, pipeline stages presence

### Notable: Determinism Fix

`ExecutionPipelineContract` creates its internal `CommandRuntimeContract` without threading `now` — which breaks determinism. The consumer bridge fixes this by propagating `now` into `commandRuntimeDependencies`, ensuring the full chain uses one shared clock.

---

## Reviewer Sign-off

GC-019 Full Lane Review — APPROVED | 2026-03-25
