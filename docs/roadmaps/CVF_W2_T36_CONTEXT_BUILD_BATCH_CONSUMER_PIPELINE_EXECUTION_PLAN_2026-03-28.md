# CVF W2-T36 Execution Plan — Context Build Batch Consumer Pipeline Bridge — 2026-03-28

Memory class: SUMMARY_RECORD

> Tranche: W2-T36 | Authorization: GC-018 score 9/10 — 2026-03-28
> CPF baseline: 1742 tests

---

## Tranche Scope

Bridge `ContextBuildBatch` (output of `ContextBuildBatchContract`) into the CPF consumer pipeline.
This is a CPF-pattern bridge: takes the domain output type directly — no internal contract invocation.

---

## CP1 — Full Lane (GC-019)

**Contract**: `ContextBuildBatchConsumerPipelineContract`
**File**: `EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION/src/context.build.batch.consumer.pipeline.contract.ts`
**Test file**: `EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION/tests/context.build.batch.consumer.pipeline.test.ts`

Input type: `ContextBuildBatch`
- Query: `[context-build-batch] packages:${totalPackages} segments:${totalSegments} avg:${avgSegmentsPerPackage}`.slice(0, 120)
- contextId: `contextBuildBatch.batchId`
- Warnings: `WARNING_EMPTY_BATCH` (totalPackages === 0), `WARNING_NO_SEGMENTS` (totalSegments === 0 && totalPackages > 0)
- pipelineHash: `computeDeterministicHash("w2-t36-cp1-context-build-batch-consumer-pipeline", contextBuildBatch.batchHash, consumerPackage.pipelineHash, createdAt)`
- resultId: `computeDeterministicHash("w2-t36-cp1-result-id", pipelineHash)`

Expected: ~30 tests

---

## CP2 — Fast Lane (GC-021)

**Contract**: `ContextBuildBatchConsumerPipelineBatchContract`
**File**: `EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION/src/context.build.batch.consumer.pipeline.batch.contract.ts`
**Test file**: same as CP1 (added to context.build.batch.consumer.pipeline.test.ts)

Aggregation:
- totalResults = results.length
- totalPackages = sum(r.contextBuildBatch.totalPackages)
- totalSegments = sum(r.contextBuildBatch.totalSegments)
- dominantTokenBudget = max(r.consumerPackage.typedContextPackage.estimatedTokens) or 0 for empty
- batchHash: `computeDeterministicHash("w2-t36-cp2-context-build-batch-consumer-pipeline-batch", ...pipelineHashes, createdAt)`
- batchId: `computeDeterministicHash("w2-t36-cp2-batch-id", batchHash)`

Expected: ~17 tests

---

## CP3 — Closure

- Closure review: `docs/reviews/CVF_W2_T36_TRANCHE_CLOSURE_REVIEW_2026-03-28.md`
- GC-026 closure sync: `docs/baselines/CVF_GC026_TRACKER_SYNC_W2_T36_CLOSURE_2026-03-28.md`
- Roadmap post-cycle record added to `CVF_WHITEPAPER_COMPLETION_ROADMAP_2026-03-21.md`
- AGENT_HANDOFF.md updated

---

## Barrel Export

Exports prepended to `EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION/src/consumer.pipeline.bridges.barrel.ts` (not index.ts)

---

## Test Partition Registry

Two new entries added to `governance/compat/CVF_TEST_PARTITION_OWNERSHIP_REGISTRY.json`:
- `cpf/context.build.batch.consumer.pipeline.test.ts` (CP1)
- `cpf/context.build.batch.consumer.pipeline.batch.test.ts` (CP2, same file — note as batch section)
