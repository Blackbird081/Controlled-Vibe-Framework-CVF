# CVF Full Lane Audit — W1-T12 CP1 Richer Knowledge Ranking Contract

Memory class: FULL_RECORD

> Decision type: `Full Lane` additive capability contract
> Date: `2026-03-23`
> Tranche: `W1-T12 — Richer Knowledge Layer + Context Packager Enhancement Slice`
> Control point: `CP1 — Richer Knowledge Ranking Contract`
> Execution plan: `docs/roadmaps/CVF_W1_T12_RICHER_KNOWLEDGE_CONTEXT_PACKAGER_EXECUTION_PLAN_2026-03-23.md`

## 1. Change Description

Create `knowledge.ranking.contract.ts` implementing `KnowledgeRankingContract`.

Inputs:
- `KnowledgeRankingRequest`: extends base knowledge query request with `ScoringWeights` (relevanceWeight, tierWeight, recencyWeight)
- `RankableKnowledgeItem`: extends `KnowledgeItem` with optional `tier?: string` and `recencyScore?: number`

Outputs:
- `RankedKnowledgeItem`: base item + compositeScore + scoreBreakdown + rank (1-based)
- `RankedKnowledgeResult`: ranked items, total ranked, weights used, ranking hash

Consumer path closed: `KnowledgeRankingRequest + ScoringWeights → RankedKnowledgeResult`

Closes W1-T10 defer: `advanced scoring/ranking deferred`

## 2. Structural Risk Assessment

- no existing module ownership changed: `SAFE`
- no physical merge: `SAFE`
- no concept-to-module boundary change: `SAFE`
- additive only — `KnowledgeQueryContract` unchanged: `SAFE`
- backward compatible: `KnowledgeItem` not modified, `RankableKnowledgeItem` extends it optionally: `SAFE`
- rollback unit: delete `knowledge.ranking.contract.ts` + revert barrel line

## 3. Test Strategy

- dedicated partition file `tests/knowledge.ranking.test.ts` (GC-024 required)
- cover: instantiation, ranking order, score breakdown, weight normalization, deterministic hash
- update `CVF_TEST_PARTITION_OWNERSHIP_REGISTRY.json`

## 4. Audit Decision

- `FULL LANE READY — PROCEED`
