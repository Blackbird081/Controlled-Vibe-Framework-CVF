---
tranche: W2-T38
title: Delta Record — Retrieval Consumer Pipeline Bridge
date: 2026-03-28
---

# Delta Record — W2-T38 Retrieval Consumer Pipeline Bridge

## New Files

- `EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION/src/retrieval.consumer.pipeline.contract.ts`
  - `RetrievalConsumerPipelineContract` — CP1 bridge from `RetrievalResultSurface` to `ControlPlaneConsumerPackage`
  - `createRetrievalConsumerPipelineContract` factory
  - contextId derived (no natural ID on `RetrievalResultSurface`)
  - Warnings: `WARNING_NO_CHUNKS`, `WARNING_NO_TIERS_SEARCHED`

- `EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION/src/retrieval.consumer.pipeline.batch.contract.ts`
  - `RetrievalConsumerPipelineBatchContract` — CP2 aggregator
  - `createRetrievalConsumerPipelineBatchContract` factory
  - Aggregates: totalResults, totalChunks, totalCandidates, dominantTokenBudget

- `EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION/tests/retrieval.consumer.pipeline.test.ts`
  - 51 tests covering CP1 + CP2

## Modified Files

- `EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION/src/consumer.pipeline.bridges.barrel.ts`
  - W2-T38 CP1 + CP2 exports prepended

- `governance/compat/CVF_TEST_PARTITION_OWNERSHIP_REGISTRY.json`
  - W2-T38 CP1 + CP2 partition entries prepended

## Metrics

| Metric | Value |
|---|---|
| New source files | 2 |
| New test files | 1 |
| New tests | 51 |
| Total CPF tests | 1893 |
| Total CPF test files | 52 |
