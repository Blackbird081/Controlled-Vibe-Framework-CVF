# CVF W2-T17 Execution Plan — Execution Reintake Summary Consumer Bridge

Memory class: SUMMARY_RECORD
> Tranche: W2-T17
> Date: 2026-03-24
> Branch: `cvf-next`

---

## Tranche Goal

Bridge `ExecutionReintakeSummaryContract` into the CPF consumer pipeline, closing the EPF aggregate consumer visibility gap for execution re-intake summaries.

---

## CP1 — Full Lane

### Artifacts
- `EXTENSIONS/CVF_EXECUTION_PLANE_FOUNDATION/src/execution.reintake.summary.consumer.pipeline.contract.ts`
- `EXTENSIONS/CVF_EXECUTION_PLANE_FOUNDATION/tests/execution.reintake.summary.consumer.pipeline.test.ts`
- `docs/audits/CVF_W2_T17_CP1_EXECUTION_REINTAKE_SUMMARY_CONSUMER_BRIDGE_AUDIT_2026-03-24.md`
- `docs/reviews/CVF_GC019_W2_T17_CP1_EXECUTION_REINTAKE_SUMMARY_CONSUMER_BRIDGE_REVIEW_2026-03-24.md`
- `docs/baselines/CVF_W2_T17_CP1_EXECUTION_REINTAKE_SUMMARY_CONSUMER_BRIDGE_DELTA_2026-03-24.md`
- EPF `src/index.ts` barrel export block prepended
- `CVF_TEST_PARTITION_OWNERSHIP_REGISTRY.json` entry added
- Exception registry updated (EPF src/index.ts `approvedMaxLines` → 1400)

### Contract Design

```
Input: FeedbackResolutionSummary[]
  → ExecutionReintakeSummaryContract.summarize() → ExecutionReintakeSummary
  → query = `[reintake-summary] ${dominantReintakeAction} — ${totalRequests} request(s)`.slice(0, 120)
  → contextId = summary.summaryId
  → ControlPlaneConsumerPipelineContract.execute({rankingRequest: {query, contextId, ...}})
  → pipelineHash = hash("w2-t17-cp1-execution-reintake-summary-consumer-pipeline", summaryHash, consumerPackage.pipelineHash, createdAt)
  → resultId = hash("w2-t17-cp1-result-id", pipelineHash)
  → warnings: REPLAN → "[execution-reintake-summary] dominant action REPLAN — full replanning required"
              RETRY → "[execution-reintake-summary] dominant action RETRY — retry queued"
```

---

## CP2 — Fast Lane (GC-021)

### Artifacts
- `EXTENSIONS/CVF_EXECUTION_PLANE_FOUNDATION/src/execution.reintake.summary.consumer.pipeline.batch.contract.ts`
- `EXTENSIONS/CVF_EXECUTION_PLANE_FOUNDATION/tests/execution.reintake.summary.consumer.pipeline.batch.test.ts`
- `docs/audits/CVF_W2_T17_CP2_EXECUTION_REINTAKE_SUMMARY_CONSUMER_BRIDGE_BATCH_AUDIT_2026-03-24.md`
- `docs/reviews/CVF_GC021_W2_T17_CP2_EXECUTION_REINTAKE_SUMMARY_CONSUMER_BRIDGE_BATCH_REVIEW_2026-03-24.md`
- `docs/baselines/CVF_W2_T17_CP2_EXECUTION_REINTAKE_SUMMARY_CONSUMER_BRIDGE_BATCH_DELTA_2026-03-24.md`
- EPF `src/index.ts` batch barrel export block prepended
- `CVF_TEST_PARTITION_OWNERSHIP_REGISTRY.json` entry added

### Batch Design

```
Batch fields: replanResultCount, retryResultCount, dominantTokenBudget
replanResultCount = results.filter(r => r.reintakeSummary.dominantReintakeAction === "REPLAN").length
retryResultCount = results.filter(r => r.reintakeSummary.dominantReintakeAction === "RETRY").length
dominantTokenBudget = Math.max(...estimatedTokens) or 0 for empty
batchHash = hash("w2-t17-cp2-execution-reintake-summary-consumer-pipeline-batch", ...pipelineHashes, createdAt)
batchId = hash("w2-t17-cp2-batch-id", batchHash)
```

---

## CP3 — Closure

### Artifacts
- `docs/reviews/CVF_W2_T17_TRANCHE_CLOSURE_REVIEW_2026-03-24.md`
- `docs/baselines/CVF_GC026_TRACKER_SYNC_W2_T17_CLOSURE_2026-03-24.md`
- `docs/reference/CVF_WHITEPAPER_PROGRESS_TRACKER.md` updated
- `AGENT_HANDOFF.md` updated

---

## Status Log

| CP | Status |
|---|---|
| GC-018 + GC-026 auth | DONE |
| CP1 | DONE |
| CP2 | DONE |
| CP3 | DONE |
