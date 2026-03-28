# CVF GC-018 Continuation Candidate — W2-T38 — 2026-03-28

Memory class: FULL_RECORD

> Candidate: W2-T38 — Retrieval Consumer Pipeline Bridge
> Survey date: 2026-03-28 | Authorization: AUTHORIZED

---

## Selected: RetrievalContract

**Source**: `EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION/src/retrieval.contract.ts`
**Purpose**: Unified retrieval surface over RAGPipeline — executes a query and returns chunks with relevance scores, total candidates, retrieval timing, and tiers searched.
**Key fields on RetrievalResultSurface**: query, chunkCount, totalCandidates, retrievalTimeMs, tiersSearched[], chunks[]
**Consumer value**: LOW (RAGPipeline runtime dep; bridge takes RetrievalResultSurface directly — no RAGPipeline invocation in bridge)
**Priority note**: Marked LOW because the domain contract has a heavy runtime dependency; bridge itself is CPF-pattern and straightforward.

### Expected Consumer Pipeline Design

**CP1**: `RetrievalConsumerPipelineContract`
- Input: `RetrievalResultSurface` directly (CPF pattern — no internal RAGPipeline invocation)
- contextId: `computeDeterministicHash("retrieval-ctx-id", query, chunkCount, totalCandidates)` (no natural ID field)
- Query: `"[retrieval] ${query.slice(0,40)} chunks:${chunkCount} candidates:${totalCandidates}"` (slice 120)
- Warnings:
  - `WARNING_NO_CHUNKS` — chunkCount === 0
  - `WARNING_NO_TIERS_SEARCHED` — tiersSearched.length === 0

**CP2**: `RetrievalConsumerPipelineBatchContract`
- Aggregation: totalResults, totalChunks (sum chunkCount), totalCandidates (sum), dominantTokenBudget (max consumerPackage.typedContextPackage.estimatedTokens)

## Audit Score: 9/10 — AUTHORIZED

W2-T38 AUTHORIZED
