# CVF W2-T38 Execution Plan — Retrieval Consumer Pipeline Bridge — 2026-03-28

Memory class: SUMMARY_RECORD

> Tranche: W2-T38 | Authorization: GC-018 score 9/10 — 2026-03-28
> CPF baseline: 1842 tests

---

## Tranche Scope

Bridge `RetrievalResultSurface` (output of `RetrievalContract.retrieve()`) into the CPF consumer pipeline.
CPF-pattern bridge: takes the domain output type directly — no RAGPipeline invocation inside the bridge.

---

## CP1 — Full Lane (GC-019)

**Contract**: `RetrievalConsumerPipelineContract`
**File**: `EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION/src/retrieval.consumer.pipeline.contract.ts`
**Test file**: `EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION/tests/retrieval.consumer.pipeline.test.ts`

- contextId: `computeDeterministicHash("retrieval-ctx-id", query, String(chunkCount), String(totalCandidates))`
- Query: `` `[retrieval] ${query.slice(0,40)} chunks:${chunkCount} candidates:${totalCandidates}` ``.slice(0, 120)
- Warnings: `WARNING_NO_CHUNKS` (chunkCount === 0); `WARNING_NO_TIERS_SEARCHED` (tiersSearched.length === 0)
- pipelineHash: `computeDeterministicHash("w2-t38-cp1-retrieval-consumer-pipeline", contextId, consumerPackage.pipelineHash, chunkCount, totalCandidates, warnings, createdAt)`
- resultId: `computeDeterministicHash("w2-t38-cp1-result-id", pipelineHash)`

---

## CP2 — Fast Lane (GC-021)

**Contract**: `RetrievalConsumerPipelineBatchContract`
**File**: `EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION/src/retrieval.consumer.pipeline.batch.contract.ts`

- totalResults, totalChunks (sum chunkCount), totalCandidates (sum), dominantTokenBudget (max consumerPackage.typedContextPackage.estimatedTokens or 0)
- batchHash: `computeDeterministicHash("w2-t38-cp2-retrieval-consumer-pipeline-batch", ...pipelineHashes, createdAt)`
- batchId: `computeDeterministicHash("w2-t38-cp2-batch-id", batchHash)`

---

## CP3 — Closure

- Closure review, GC-026 closure sync, roadmap post-cycle record, AGENT_HANDOFF updated
