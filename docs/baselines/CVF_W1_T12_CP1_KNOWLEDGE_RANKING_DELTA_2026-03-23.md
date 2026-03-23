# CVF W1-T12 CP1 Richer Knowledge Ranking Contract — Implementation Delta

Memory class: SUMMARY_RECORD

> Date: `2026-03-23`
> Tranche: `W1-T12`
> Control point: `CP1 — Richer Knowledge Ranking Contract`

## What Changed

- created `EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION/src/knowledge.ranking.contract.ts`
  - `KnowledgeRankingContract`: `KnowledgeRankingRequest + ScoringWeights → RankedKnowledgeResult`
  - `RankableKnowledgeItem`: extends `KnowledgeItem` with optional `tier?` and `recencyScore?`
  - multi-criteria scoring: relevance, tier priority (T0→T1→T2→T3→unknown), recency bias
  - weight normalization (weights always sum to 1.0)
  - relevance threshold pre-filter, maxItems cap
  - deterministic ranking hash via `computeDeterministicHash`
  - factory function `createKnowledgeRankingContract()`
- updated `src/index.ts` barrel exports
- created `tests/knowledge.ranking.test.ts` — 11 new tests (dedicated partition file per GC-024)
- updated `governance/compat/CVF_TEST_PARTITION_OWNERSHIP_REGISTRY.json` — CPF Knowledge Ranking partition

## Closes

- W1-T10 defer: `advanced scoring/ranking deferred`

## Verification

- 655 foundation tests, 0 failures (11 new CP1 tests)
- governance gates: COMPLIANT
