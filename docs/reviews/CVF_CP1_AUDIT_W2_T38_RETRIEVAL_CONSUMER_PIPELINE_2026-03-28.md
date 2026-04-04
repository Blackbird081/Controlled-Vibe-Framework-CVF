---
tranche: W2-T38
checkpoint: CP1
title: Retrieval Consumer Pipeline Bridge — CP1 Full Lane Audit
date: 2026-03-28
status: PASSED
risk: R1-LOW
---

# CP1 Full Lane Audit — W2-T38 Retrieval Consumer Pipeline Bridge

## Scope

CP1 covers the core contract implementation:
- `retrieval.consumer.pipeline.contract.ts` — `RetrievalConsumerPipelineContract`
- `retrieval.consumer.pipeline.batch.contract.ts` — `RetrievalConsumerPipelineBatchContract`
- `tests/retrieval.consumer.pipeline.test.ts` — 51 tests (CP1 + CP2 combined)

## Design Decisions

| Decision | Rationale |
|---|---|
| contextId derived via `computeDeterministicHash("retrieval-ctx-id", query, chunkCount, totalCandidates)` | `RetrievalResultSurface` has no natural ID field; derivation is deterministic and unique per search context |
| Query: `[retrieval] ${query.slice(0,40)} chunks:N candidates:N` | Follows CPF bridge query convention; 40-char source slice + metrics; truncated to 120 chars |
| `WARNING_NO_CHUNKS` before `WARNING_NO_TIERS_SEARCHED` | Data completeness warning precedes search coverage warning |
| `totalChunks` = sum of `chunkCount`; `totalCandidates` = sum of `totalCandidates` | Direct retrieval metrics aggregation; no transformation |
| `dominantTokenBudget` = max `estimatedTokens` across results | Consistent with all prior CPF CP2 batches |

## Conformance Checks

- [x] Input type is `RetrievalResultSurface` from `CVF_ECO_v1.4_RAG_PIPELINE` — no internal contract invocation (bridge pattern)
- [x] pipelineHash prefix: `w2-t38-cp1-retrieval-consumer-pipeline`
- [x] resultId prefix: `w2-t38-cp1-result-id`
- [x] batchHash prefix: `w2-t38-cp2-retrieval-consumer-pipeline-batch`
- [x] batchId prefix: `w2-t38-cp2-batch-id`
- [x] GC-023: test file 233 lines — under soft threshold 800
- [x] GC-023: barrel exports prepended (not appended)
- [x] Test partition registry updated (2 entries prepended)
- [x] No modification to `index.test.ts` (frozen)

## Test Coverage

- Instantiation (2 CP1, 2 CP2)
- Output shape (9 CP1, 7 CP2)
- consumerId propagation (2)
- Query derivation (6)
- contextId derivation (2)
- Warnings (10)
- Deterministic hashing (6 CP1, 4 CP2)
- Aggregation (5 CP2)

**Total: 51 tests — all pass (1893 total CPF tests)**

## Risk Classification

R1-LOW: Pure contract addition, no modification to existing code, fully tested, bridge pattern only.
