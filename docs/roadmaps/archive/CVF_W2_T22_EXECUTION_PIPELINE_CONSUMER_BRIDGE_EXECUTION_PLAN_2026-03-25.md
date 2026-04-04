# CVF W2-T22 Execution Plan — Execution Pipeline Consumer Bridge

Memory class: SUMMARY_RECORD
> Tranche: W2-T22
> Date: 2026-03-25
> Branch: `cvf-next`

---

## Tranche Goal

Bridge `ExecutionPipelineContract` into the CPF consumer pipeline, closing the EPF consumer visibility gap for full-pipeline execution receipts (the canonical INTAKE→DESIGN→ORCHESTRATION→DISPATCH→POLICY-GATE→EXECUTION provenance record).

---

## CP1 — Full Lane

### Artifacts
- `EXTENSIONS/CVF_EXECUTION_PLANE_FOUNDATION/src/execution.pipeline.consumer.pipeline.contract.ts`
- `EXTENSIONS/CVF_EXECUTION_PLANE_FOUNDATION/tests/execution.pipeline.consumer.pipeline.test.ts`
- `docs/audits/CVF_W2_T22_CP1_EXECUTION_PIPELINE_CONSUMER_BRIDGE_AUDIT_2026-03-25.md`
- `docs/reviews/CVF_GC019_W2_T22_CP1_EXECUTION_PIPELINE_CONSUMER_BRIDGE_REVIEW_2026-03-25.md`
- `docs/baselines/CVF_W2_T22_CP1_EXECUTION_PIPELINE_CONSUMER_BRIDGE_DELTA_2026-03-25.md`
- EPF `src/index.ts` barrel export block prepended
- `CVF_TEST_PARTITION_OWNERSHIP_REGISTRY.json` entry added

### Contract Design

```
Input: ExecutionBridgeReceipt (single)
  → ExecutionPipelineContract.run(bridgeReceipt) → ExecutionPipelineReceipt
  → query = `[pipeline] failed:${failedCount} sandboxed:${sandboxedCount} total:${totalEntries}`.slice(0, 120)
  → contextId = receipt.pipelineReceiptId
  → ControlPlaneConsumerPipelineContract.execute({rankingRequest: {query, contextId, ...}})
  → pipelineHash = hash("w2-t22-cp1-execution-pipeline-consumer-pipeline", receipt.pipelineHash, consumerPackage.pipelineHash, createdAt)
  → resultId = hash("w2-t22-cp1-result-id", pipelineHash)
  → warnings: failedCount > 0 → "[pipeline] execution failures detected — review pipeline receipt"
              sandboxedCount > 0 → "[pipeline] sandboxed executions present — review required"
```

---

## CP2 — Fast Lane (GC-021)

### Artifacts
- `EXTENSIONS/CVF_EXECUTION_PLANE_FOUNDATION/src/execution.pipeline.consumer.pipeline.batch.contract.ts`
- `EXTENSIONS/CVF_EXECUTION_PLANE_FOUNDATION/tests/execution.pipeline.consumer.pipeline.batch.test.ts`
- `docs/audits/CVF_W2_T22_CP2_EXECUTION_PIPELINE_CONSUMER_BRIDGE_BATCH_AUDIT_2026-03-25.md`
- `docs/reviews/CVF_GC021_W2_T22_CP2_EXECUTION_PIPELINE_CONSUMER_BRIDGE_BATCH_REVIEW_2026-03-25.md`
- `docs/baselines/CVF_W2_T22_CP2_EXECUTION_PIPELINE_CONSUMER_BRIDGE_BATCH_DELTA_2026-03-25.md`
- EPF `src/index.ts` batch barrel export block prepended
- `CVF_TEST_PARTITION_OWNERSHIP_REGISTRY.json` entry added

### Batch Design

```
Batch fields: failedResultCount, sandboxedResultCount, dominantTokenBudget
failedResultCount  = results.filter(r => r.pipelineReceipt.failedCount > 0).length
sandboxedResultCount = results.filter(r => r.pipelineReceipt.sandboxedCount > 0).length
dominantTokenBudget = Math.max(...estimatedTokens) or 0 for empty
batchHash = hash("w2-t22-cp2-execution-pipeline-consumer-pipeline-batch", ...pipelineHashes, createdAt)
batchId = hash("w2-t22-cp2-batch-id", batchHash)
```

---

## CP3 — Closure

### Artifacts
- `docs/reviews/CVF_W2_T22_TRANCHE_CLOSURE_REVIEW_2026-03-25.md`
- `docs/baselines/CVF_GC026_TRACKER_SYNC_W2_T22_CLOSURE_2026-03-25.md`
- `docs/roadmaps/CVF_WHITEPAPER_COMPLETION_ROADMAP_2026-03-21.md` updated
- `AGENT_HANDOFF.md` updated

---

## Status Log

| CP | Status |
|---|---|
| GC-018 + GC-026 auth | DONE |
| CP1 | IN PROGRESS |
| CP2 | PENDING |
| CP3 | PENDING |
