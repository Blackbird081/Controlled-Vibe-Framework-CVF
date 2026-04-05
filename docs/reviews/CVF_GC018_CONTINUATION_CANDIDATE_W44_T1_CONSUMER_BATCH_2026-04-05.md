# CVF GC-018 Continuation Candidate — W44-T1 ConsumerBatchContract

Memory class: FULL_RECORD

> Date: 2026-04-05
> Lane: Full Lane
> Candidate: W44-T1 — ConsumerBatchContract (REALIZATION class)
> Reviewer: Cascade

---

## 1. Candidate Summary

Authorize implementation of `ConsumerBatchContract` — the batch counterpart to `ConsumerContract` in the `control.plane.workflow.barrel.ts` family. This is the final open batch surface in the workflow barrel.

---

## 2. Rationale

- W35-T1 (IntakeBatchContract), W36-T1 (RetrievalBatchContract), and W40-T1 (PackagingBatchContract) closed three of four workflow barrel batch surfaces; `ConsumerBatchContract` is the remaining open surface
- All previous workflow batch contracts followed the same pattern: embed the wrapped contract, classify results, aggregate counts, deterministic identity
- Gateway log batch family (W41/W42/W43) is now FULLY CLOSED; workflow family is the next logical family to close
- `ConsumerContract.consume()` is well-defined and stable

---

## 3. Scope

| Item | In scope |
| --- | --- |
| `consumer.batch.contract.ts` — REALIZATION class | YES |
| `tests/consumer.batch.contract.test.ts` | YES |
| `control.plane.workflow.barrel.ts` — export update | YES |
| `CVF_TEST_PARTITION_OWNERSHIP_REGISTRY.json` — partition entry | YES |
| Governance docs (audit, review, delta, GC-026 syncs, closure) | YES |
| Any contract outside `control.plane.workflow.barrel.ts` | NO |

---

## 4. Contract Design

`ConsumerBatchContract.batch(requests: ConsumerRequest[]): ConsumerBatch`

- Embeds `ConsumerContract` instance (created from `contractDependencies`)
- Calls `this.contract.consume(request)` for each request
- Status classification per receipt:
  - `DEGRADED` — `!receipt.intake.intent.valid`
  - `PARTIAL` — valid intent, zero chunks retrieved (`intake.retrieval.chunkCount === 0`)
  - `COMPLETE` — valid intent and chunks retrieved
- `dominantStatus: ConsumptionBatchStatus | "NONE"` — DEGRADED > PARTIAL > COMPLETE; NONE for empty batch
- Aggregates: `totalRequests`, `completeCount`, `partialCount`, `degradedCount`, `frozenCount`, `totalChunksRetrieved`
- `frozenCount` = count of receipts where `receipt.freeze !== undefined`
- `totalChunksRetrieved` = sum of `receipt.intake.retrieval.chunkCount`
- Seeds: `"w44-t1-cp1-consumer-batch"` / `"w44-t1-cp1-consumer-batch-id"`

---

## 5. Pass Conditions

1. `consumer.batch.contract.ts` canonical; zero TypeScript errors
2. All tests pass; CPF 0 failures
3. `batch(requests)` correctly calls `this.contract.consume(request)` for each request
4. Empty batch: `dominantStatus: "NONE"`, all counts `0`, valid hashes
5. Status classification correct: DEGRADED > PARTIAL > COMPLETE
6. `totalChunksRetrieved` and `frozenCount` correct sums
7. `totalRequests` = count of requests; `receipts.length === totalRequests`
8. `batchHash` and `batchId` deterministic with correct salts; `batchId ≠ batchHash`
9. All CP1 governance artifacts present with correct memory classes

---

## 6. Gate Checks

- G1 fresh GC-018 packet — PRESENT (this document)
- G2 keep/retire/merge-into map — keep `ConsumerContract` as-is; batch is additive
- G3 not-in-this-wave exclusions — `DesignConsumerContract` batch not in scope
- G9 quality gate — post-W43 quality assessment passed (25/25)

---

## 7. Authorization

**AUTHORIZED — W44-T1 ConsumerBatchContract (REALIZATION class); Full Lane; `control.plane.workflow.barrel.ts` `ConsumerContract.consume()` batch surface.**
