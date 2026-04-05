# CVF W45-T1 Execution Plan — GatewayConsumerBatchContract

Memory class: SUMMARY_RECORD

> Date: 2026-04-05
> Tranche: W45-T1
> Class: REALIZATION
> Lane: Full Lane
> Authorization: GC-018 AUTHORIZED — `docs/reviews/CVF_GC018_CONTINUATION_CANDIDATE_W45_T1_GATEWAY_CONSUMER_BATCH_2026-04-05.md`

---

## 1. Objective

Close the final open batch surface in `control.plane.gateway.barrel.ts` by implementing `GatewayConsumerBatchContract`, which batches calls to `GatewayConsumerContract.consume()` and aggregates results into a `GatewayConsumptionBatchResult` with deterministic identity.

---

## 2. Deliverables

| Deliverable | Path |
|---|---|
| Contract implementation | `EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION/src/gateway.consumer.batch.contract.ts` |
| Test suite | `EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION/tests/gateway.consumer.batch.contract.test.ts` |
| Barrel export update | `EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION/src/control.plane.gateway.barrel.ts` |
| Partition registry entry | `governance/compat/CVF_TEST_PARTITION_OWNERSHIP_REGISTRY.json` |
| CP1 audit | `docs/audits/CVF_W45_T1_CP1_GATEWAY_CONSUMER_BATCH_AUDIT_2026-04-05.md` |
| GC-019 review | `docs/reviews/CVF_GC019_W45_T1_CP1_GATEWAY_CONSUMER_BATCH_REVIEW_2026-04-05.md` |
| CP1 delta | `docs/baselines/CVF_W45_T1_CP1_GATEWAY_CONSUMER_BATCH_DELTA_2026-04-05.md` |
| GC-026 CP1 sync | `docs/baselines/CVF_GC026_TRACKER_SYNC_W45_T1_CP1_DELIVERED_2026-04-05.md` |
| Closure review | `docs/reviews/CVF_W45_T1_TRANCHE_CLOSURE_REVIEW_2026-04-05.md` |
| GC-026 closed sync | `docs/baselines/CVF_GC026_TRACKER_SYNC_W45_T1_CLOSED_2026-04-05.md` |

---

## 3. Implementation Notes

### Status Classification
- DEGRADED: `!receipt.intakeResult.intent.valid`
- PARTIAL: `receipt.intakeResult.intent.valid && receipt.intakeResult.retrieval.chunkCount === 0`
- COMPLETE: `receipt.intakeResult.intent.valid && receipt.intakeResult.retrieval.chunkCount > 0`
- NONE: empty batch

### Aggregates
- `totalRequests`: `receipts.length`
- `completedCount`, `partialCount`, `degradedCount`: counts per status
- `dominantStatus`: resolved by `resolveDominantByCount` with precedence DEGRADED > PARTIAL > COMPLETE
- `totalChunksRetrieved`: sum of `receipt.intakeResult.retrieval.chunkCount`
- `warnedCount`: count of receipts where `receipt.warnings.length > 0`

### Batch Identity
- `batchSeed`: `"w45-t1-cp1-gateway-consumer-batch"`
- `batchIdSeed`: `"w45-t1-cp1-gateway-consumer-batch-id"`
- `hashParts`: signal content + timestamps
- Use `createDeterministicBatchIdentity` from `batch.contract.shared.ts`

### Pattern Reference
- Follow `consumer.batch.contract.ts` (W44) for structure
- Follow `gateway.auth.log.batch.contract.ts` (W41) for gateway-family style

---

## 4. Test Strategy

Target: ~27 tests

| Group | Tests |
|---|---|
| Empty batch | NONE status, 0 counts, batchHash defined |
| Single COMPLETE | status, counts, totalChunksRetrieved > 0 |
| Single PARTIAL | status, counts, totalChunksRetrieved === 0 |
| Single DEGRADED | status, degradedCount === 1 |
| Dominant status — DEGRADED wins | mixed batch |
| Dominant status — PARTIAL beats COMPLETE | mixed batch |
| Count accuracy | multi-receipt counts |
| totalChunksRetrieved aggregation | sum across receipts |
| warnedCount accuracy | warned vs clean receipts |
| Output shape | required fields present |
| Determinism | two calls, same result |
| Factory test | createGatewayConsumerBatchContract() |

---

## 5. Pass Conditions

1. Contract implemented and exported
2. Empty batch → NONE
3. Single COMPLETE receipt → COMPLETE
4. Single PARTIAL receipt → PARTIAL
5. Single DEGRADED receipt → DEGRADED
6. Mixed: DEGRADED dominates
7. Counts and aggregates accurate
8. Deterministic identity
9. CPF suite: 0 failures

---

## 6. Tranche Closure Steps

1. Implement contract
2. Write tests — run to confirm pass
3. Update barrel exports
4. Update partition registry
5. Write CP1 audit + GC-019 review + delta
6. Write GC-026 CP1 delivered sync
7. Write closure review + GC-026 closed sync
8. Update test log + handoff + tracker
9. Commit
