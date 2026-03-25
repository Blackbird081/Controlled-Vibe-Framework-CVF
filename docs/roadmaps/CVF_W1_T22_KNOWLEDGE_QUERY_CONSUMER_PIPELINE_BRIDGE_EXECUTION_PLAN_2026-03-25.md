# CVF W1-T22 Execution Plan — Knowledge Query Consumer Pipeline Bridge

Memory class: SUMMARY_RECORD

> Date: 2026-03-25
> Tranche: W1-T22 — Knowledge Query Consumer Pipeline Bridge
> Authorization: GC-018 score 10/10
> CPF baseline: 945 tests

---

## Tranche Boundary

Bridge `KnowledgeQueryContract` (W1-T10 CP1) into the CPF consumer pipeline. This closes the final known unbridged CPF aggregate contract gap.

**In scope:**
- CP1: `KnowledgeQueryConsumerPipelineContract` — Full Lane
- CP2: `KnowledgeQueryConsumerPipelineBatchContract` — Fast Lane (GC-021)
- CP3: Tranche closure review + GC-026 sync + tracker + roadmap + AGENT_HANDOFF

**Out of scope:**
- Changes to `KnowledgeQueryContract` internals
- New retrieval or ranking logic

---

## CP1 — KnowledgeQueryConsumerPipelineContract

### Chain
```
Input:   KnowledgeQueryConsumerPipelineRequest
         { queryRequest: KnowledgeQueryRequest, segmentTypeConstraints?, consumerId?,
           candidateItems?: KnowledgeItem[], scoringWeights? }

Step 1:  KnowledgeQueryContract.query(queryRequest) → KnowledgeResult
Step 2:  query = knowledge-query:found:${totalFound}:threshold:${relevanceThreshold.toFixed(2)} (<=120)
         contextId = queryResult.contextId
         ControlPlaneConsumerPipelineContract.execute(...) → ControlPlaneConsumerPackage
Step 3:  warnings:
           totalFound === 0       → "[knowledge-query] no results found — query returned empty set"
           relevanceThreshold === 0.0 → "[knowledge-query] zero relevance threshold — all items included regardless of quality"
Step 4:  pipelineHash = computeDeterministicHash("w1-t22-cp1-knowledge-query-consumer-pipeline", queryResult.queryHash, consumerPackage.pipelineHash, createdAt)
         resultId     = computeDeterministicHash("w1-t22-cp1-result-id", pipelineHash)

Output:  KnowledgeQueryConsumerPipelineResult
         { resultId, createdAt, consumerId?, queryResult, consumerPackage, pipelineHash, warnings }
```

### Deliverables
- `EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION/src/knowledge.query.consumer.pipeline.contract.ts`
- `EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION/tests/knowledge.query.consumer.pipeline.test.ts` (~22 tests)
- Barrel exports in `src/index.ts`
- Partition registry entry
- Audit, GC-019 review, delta docs

---

## CP2 — KnowledgeQueryConsumerPipelineBatchContract

### Fields
```
emptyResultCount    = results.filter(r => r.queryResult.totalFound === 0).length
dominantTokenBudget = Math.max(typedContextPackage.estimatedTokens); 0 for empty
batchHash           = computeDeterministicHash("w1-t22-cp2-...", ...pipelineHashes, createdAt)
batchId             = computeDeterministicHash("w1-t22-cp2-batch-id", batchHash)  // distinct
```

### Deliverables
- `EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION/src/knowledge.query.consumer.pipeline.batch.contract.ts`
- `EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION/tests/knowledge.query.consumer.pipeline.batch.test.ts` (~15 tests)
- Barrel exports in `src/index.ts`
- Partition registry entry
- Fast Lane audit, GC-021 review, delta docs

---

## CP3 — Tranche Closure

### Deliverables
- Tranche closure review
- GC-026 closure sync note + tracker update (same commit)
- Roadmap post-cycle record
- `AGENT_HANDOFF.md` update
- Execution plan status log update
- Push to `cvf-next`

---

## Status Log

| CP | Status |
|---|---|
| GC-018 + GC-026 auth | DONE |
| CP1 | PENDING |
| CP2 | PENDING |
| CP3 | PENDING |
