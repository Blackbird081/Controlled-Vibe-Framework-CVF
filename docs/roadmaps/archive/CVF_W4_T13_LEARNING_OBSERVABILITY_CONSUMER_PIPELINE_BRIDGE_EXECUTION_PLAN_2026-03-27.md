# CVF Execution Plan — W4-T13 — LearningObservability Consumer Pipeline Bridge

Memory class: SUMMARY_RECORD
> Tranche: W4-T13
> Date: 2026-03-27
> Branch: `cvf-next`
> LPF baseline: 685 tests, 0 failures
> GC-018 score: 9/10

---

## Objective

Bridge `LearningObservabilityContract` into the CPF consumer pipeline, enabling
`LearningObservabilityReport` health classification (CRITICAL/DEGRADED/HEALTHY/UNKNOWN)
to be consumer-visible via the governed ranking and packaging layer.

---

## CP1 — Full Lane (GC-019)

**Contract:** `LearningObservabilityConsumerPipelineContract`

**Chain:**

```
LearningStorageLog + LearningLoopSummary
  → LearningObservabilityContract.report()
  → LearningObservabilityReport
  → ControlPlaneConsumerPipelineContract.execute()
  → ControlPlaneConsumerPackage
  → LearningObservabilityConsumerPipelineResult
```

**Query format:**

```
learning-observability:health:${observabilityHealth}:storage:${sourceStorageLogId}:loop:${sourceLoopSummaryId}
```

Sliced to 120 characters.

**contextId:** `reportResult.reportId`

**Warnings:**
- CRITICAL → `"[learning-observability] critical observability health — governed intervention required"`
- DEGRADED → `"[learning-observability] degraded observability health — learning loop at risk"`
- HEALTHY / UNKNOWN → no warning

**Seeds:**
- pipelineHash: `w4-t13-cp1-learning-observability-consumer-pipeline`
- resultId: `w4-t13-cp1-result-id`

**Deliverables:**
- `EXTENSIONS/CVF_LEARNING_PLANE_FOUNDATION/src/learning.observability.consumer.pipeline.contract.ts`
- `EXTENSIONS/CVF_LEARNING_PLANE_FOUNDATION/tests/learning.observability.consumer.pipeline.test.ts`
- Barrel exports added to `EXTENSIONS/CVF_LEARNING_PLANE_FOUNDATION/src/index.ts`
- Partition registry entry: `governance/compat/CVF_TEST_PARTITION_OWNERSHIP_REGISTRY.json`
- Audit: `docs/audits/CVF_W4_T13_CP1_LEARNING_OBSERVABILITY_CONSUMER_PIPELINE_AUDIT_2026-03-27.md`
- Review: `docs/reviews/CVF_GC019_W4_T13_CP1_LEARNING_OBSERVABILITY_CONSUMER_PIPELINE_REVIEW_2026-03-27.md`
- Delta: `docs/baselines/CVF_W4_T13_CP1_LEARNING_OBSERVABILITY_CONSUMER_PIPELINE_DELTA_2026-03-27.md`

---

## CP2 — Fast Lane (GC-021)

**Contract:** `LearningObservabilityConsumerPipelineBatchContract`

**Batch fields:**
- `criticalCount` — results where `reportResult.observabilityHealth === "CRITICAL"`
- `degradedCount` — results where `reportResult.observabilityHealth === "DEGRADED"`
- `dominantTokenBudget` — `Math.max(...estimatedTokens)` across batch; `0` for empty
- `batchHash` — deterministic hash over all result pipelineHashes + createdAt
- `batchId` — deterministic hash over batchHash (separate seed)

**Seeds:**
- batchHash: `w4-t13-cp2-learning-observability-consumer-pipeline-batch`
- batchId: `w4-t13-cp2-batch-id`

**Deliverables:**
- `EXTENSIONS/CVF_LEARNING_PLANE_FOUNDATION/src/learning.observability.consumer.pipeline.batch.contract.ts`
- `EXTENSIONS/CVF_LEARNING_PLANE_FOUNDATION/tests/learning.observability.consumer.pipeline.batch.test.ts`
- Barrel exports added to `EXTENSIONS/CVF_LEARNING_PLANE_FOUNDATION/src/index.ts`
- Partition registry entry: `governance/compat/CVF_TEST_PARTITION_OWNERSHIP_REGISTRY.json`
- Audit: `docs/audits/CVF_W4_T13_CP2_LEARNING_OBSERVABILITY_CONSUMER_PIPELINE_BATCH_AUDIT_2026-03-27.md`
- Review: `docs/reviews/CVF_GC021_W4_T13_CP2_LEARNING_OBSERVABILITY_CONSUMER_PIPELINE_BATCH_REVIEW_2026-03-27.md`
- Delta: `docs/baselines/CVF_W4_T13_CP2_LEARNING_OBSERVABILITY_CONSUMER_PIPELINE_BATCH_DELTA_2026-03-27.md`

---

## CP3 — Closure

**Deliverables:**
- Tranche closure review
- GC-026 closure sync note
- Progress tracker: W4-T13 marked DONE
- Execution plan: all CPs marked DONE
- Roadmap: post-cycle record appended
- AGENT_HANDOFF: updated to W4-T13 closure state
- Push to `cvf-next`

---

## Status Log

| CP | Status |
|---|---|
| GC-018 + GC-026 auth | DONE |
| CP1 | DONE |
| CP2 | DONE |
| CP3 | DONE |
