# CVF GC-018 Continuation Candidate — W1-T19 Knowledge Ranking Consumer Bridge

Memory class: FULL_RECORD

> Date: `2026-03-24`
> Candidate: W1-T19 — Knowledge Ranking Consumer Bridge
> Workline: W1 — Control Plane
> Auditor score: 10/10

---

## Tranche Summary

W1-T19 closes the W1-T12 implied gap: `KnowledgeRankingContract` (W1-T12 CP1) produces
`RankedKnowledgeResult` carrying `compositeScore`, `scoreBreakdown`, and `rank` per item —
but this enriched output has no governed consumer-visible path to CPF independent of the
composite W1-T13 chain. A dedicated consumer bridge is the correct architectural closure.

---

## Implied Gap Being Closed

W1-T12 CP1 introduced `KnowledgeRankingContract` with multi-factor scoring
(relevance × tier × recency weights). The resulting `RankedKnowledgeResult` is richer than
a basic `KnowledgeResult`, yet no standalone consumer pipeline exists to deliver it to CPF.
Callers must go through the entire W1-T13 composite chain (`KnowledgeQueryRequest →
KnowledgeRankingContract → ContextPackagerContract → ControlPlaneConsumerPipelineContract`)
even when they already hold `RankedKnowledgeItem[]` from a prior ranking pass.

The implied gap: **`RankedKnowledgeResult` has no governed consumer-visible enriched
output path.**

This also makes partial progress on the Knowledge Layer `PARTIAL` target-state by closing
the only contract-addressable remaining gap (RAG/vector/external store remain infrastructure-
deferred).

---

## Proposed Control Points

### CP1 — Full Lane (GC-019)
`KnowledgeRankingConsumerPipelineContract`

Chain:
```
KnowledgeRankingRequest
  → KnowledgeRankingContract.rank()
  → RankedKnowledgeResult
  → query: "${request.query}:ranked:${totalRanked}" (≤120 chars)
  → contextId: result.resultId
  → ControlPlaneConsumerPipelineContract
  → ControlPlaneConsumerPackage
```

Warning: empty result → `[knowledge] no ranked items returned — query may need broadening`

### CP2 — Fast Lane (GC-021)
`KnowledgeRankingConsumerPipelineBatchContract`

Aggregates `KnowledgeRankingConsumerPipelineResult[]` → `KnowledgeRankingConsumerPipelineBatch`
with `dominantTokenBudget` = `Math.max(estimatedTokens)`, 0 for empty; `batchId ≠ batchHash`

### CP3 — Tranche Closure
Closure review + GC-026 sync + tracker + handoff + push.

---

## Rationale

- Closes W1-T12 CP1 implied gap (highest-value actionable item in Knowledge Layer)
- Standalone bridge enables callers with pre-ranked results to access CPF directly
- Follows canonical consumer bridge pattern (same as W1-T17, W1-T18)
- Does not require infrastructure (no RAG/vector/external store dependencies)
- Directly advances Knowledge Layer `PARTIAL` → `SUBSTANTIALLY DELIVERED` claim

---

## Authorization Boundary

- **Authorized**: `KnowledgeRankingConsumerPipelineContract` + `KnowledgeRankingConsumerPipelineBatchContract` + tests + governance artifacts
- **Not authorized**: RAG pipeline, vector search, external knowledge store integration
- **Not authorized**: changes to `KnowledgeRankingContract`, `ContextPackagerContract`, or `ControlPlaneConsumerPipelineContract`
