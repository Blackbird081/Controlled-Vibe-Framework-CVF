# CVF W44-T1 Execution Plan — ConsumerBatchContract

Memory class: SUMMARY_RECORD

> Tranche: W44-T1 — ConsumerBatchContract (REALIZATION class)
> Date: 2026-04-05
> Lane: Full Lane
> Authorization: `docs/reviews/CVF_GC018_CONTINUATION_CANDIDATE_W44_T1_CONSUMER_BATCH_2026-04-05.md`

---

## 1. Objective

Implement `ConsumerBatchContract` — the final open batch surface in `control.plane.workflow.barrel.ts`. Closes `ConsumerContract.consume()` batch surface; completes W1-T2 workflow barrel family.

---

## 2. CP1 Deliverables

| Deliverable | Path |
| --- | --- |
| Contract | `EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION/src/consumer.batch.contract.ts` |
| Tests | `EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION/tests/consumer.batch.contract.test.ts` |
| Barrel update | `EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION/src/control.plane.workflow.barrel.ts` |
| Partition entry | `governance/compat/CVF_TEST_PARTITION_OWNERSHIP_REGISTRY.json` |

---

## 3. Implementation Notes

**ConsumerBatchContract.batch(requests: ConsumerRequest[]): ConsumerBatch**

- Embeds `ConsumerContract` (created from `contractDependencies`)
- Calls `this.contract.consume(request)` for each request in `requests`
- Status classification per receipt:
  - `"DEGRADED"` — `!receipt.intake.intent.valid`
  - `"PARTIAL"` — intent valid, zero chunks retrieved
  - `"COMPLETE"` — intent valid and chunks retrieved
- `dominantStatus: ConsumptionBatchStatus | "NONE"` — DEGRADED > PARTIAL > COMPLETE; NONE for empty
- Aggregates: `totalRequests`, `completeCount`, `partialCount`, `degradedCount`, `frozenCount`, `totalChunksRetrieved`
- `frozenCount` = count of receipts where `receipt.freeze !== undefined`
- `totalChunksRetrieved` = sum of `receipt.intake.retrieval.chunkCount`
- `receipts: ConsumptionReceipt[]` in input order

**Deterministic identity:**
- batchSeed: `"w44-t1-cp1-consumer-batch"`
- batchIdSeed: `"w44-t1-cp1-consumer-batch-id"`
- hashParts: `[createdAt:total:N, complete:C, partial:P, degraded:D]`
- batchIdParts: `[createdAt]`

---

## 4. Test Strategy (target ~27 tests)

- 4 tests: empty batch
- 7 tests: count aggregations (totalRequests, completeCount, partialCount, degradedCount, frozenCount, totalChunksRetrieved, receipts.length)
- 5 tests: dominantStatus resolution (COMPLETE, PARTIAL, DEGRADED, mixed, NONE)
- 5 tests: determinism (batchHash stable, batchId stable, batchHash ≠ batchId, different inputs = different hashes, createdAt injected)
- 3 tests: factory function
- 3 tests: output shape

---

## 5. Pass Conditions

1. `consumer.batch.contract.ts` canonical; zero TypeScript errors
2. All tests pass; CPF 0 failures
3. `batch(requests)` calls `consume()` for each request
4. Empty batch: `dominantStatus: "NONE"`, all counts `0`, valid hashes
5. Status classification: DEGRADED > PARTIAL > COMPLETE; NONE for empty
6. `totalChunksRetrieved` and `frozenCount` correct sums
7. `totalRequests === receipts.length`
8. Deterministic hashes with correct salts; `batchId ≠ batchHash`
9. All governance artifacts present with correct memory classes

---

## 6. Tranche Closure Steps

After CP1 passes all 9 conditions:
1. CP1 audit + GC-019 review
2. CP1 delta
3. GC-026 CP1 delivered sync
4. Tranche closure review
5. GC-026 closed sync
6. Update test log + handoff
7. Commit with governed message
