# CVF W24-T1 Execution Plan — GatewayPIIDetectionBatchContract

Memory class: SUMMARY_RECORD

> Date: 2026-04-01
> Tranche: W24-T1 — GatewayPIIDetectionBatchContract (REALIZATION class)
> Authorization anchor: `docs/reviews/CVF_GC018_CONTINUATION_CANDIDATE_W24_T1_GATEWAY_PII_DETECTION_BATCH_2026-04-01.md`

---

## Objective

Implement `GatewayPIIDetectionBatchContract` batching `GatewayPIIDetectionContract.detect()` across a list of `GatewayPIIDetectionRequest` inputs. Aggregate PII counts, resolve dominant PIIType with SSN > CREDIT_CARD > EMAIL > PHONE > CUSTOM precedence, and produce deterministic batchHash/batchId.

---

## Execution Steps

### CP1 Full Lane

1. **Implement source file**
   - Path: `EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION/src/gateway.pii.detection.batch.contract.ts`
   - Define `GatewayPIIDetectionBatch` type
   - Implement `GatewayPIIDetectionBatchContract.batch()` method
   - Implement `resolveDominantPiiType()` helper with precedence SSN > CREDIT_CARD > EMAIL > PHONE > CUSTOM
   - Implement `createGatewayPIIDetectionBatchContract()` factory
   - Use hash salts: `"w24-t1-cp1-gateway-pii-detection-batch"`, `"w24-t1-cp1-gateway-pii-detection-batch-id"`

2. **Implement test file**
   - Path: `EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION/tests/gateway.pii.detection.batch.contract.test.ts`
   - Fixed timestamp: `"2026-04-01T00:00:00.000Z"`
   - Target: ~27 tests, 0 failures
   - Coverage: empty batch, count accuracy per PII type, dominant resolution, determinism, factory, output shape

3. **Add barrel exports**
   - Path: `EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION/src/index.ts`
   - Export `GatewayPIIDetectionBatchContract`, `GatewayPIIDetectionBatch`, factory

4. **Verify full CPF suite** — 0 failures required

5. **Create CP1 governance artifacts**
   - `docs/audits/CVF_W24_T1_CP1_GATEWAY_PII_DETECTION_BATCH_AUDIT_2026-04-01.md`
   - `docs/reviews/CVF_GC019_W24_T1_CP1_GATEWAY_PII_DETECTION_BATCH_REVIEW_2026-04-01.md`
   - `docs/baselines/CVF_W24_T1_CP1_GATEWAY_PII_DETECTION_BATCH_DELTA_2026-04-01.md`
   - `docs/baselines/CVF_GC026_TRACKER_SYNC_W24_T1_CP1_DONE_2026-04-01.md`

6. **Update tracker + AGENT_HANDOFF** — CP1 DONE state

7. **Commit + push** — classified commit to cvf-next

### CP2 Tranche Closure

8. **Create CP2 governance artifacts**
   - `docs/reviews/CVF_W24_T1_TRANCHE_CLOSURE_REVIEW_2026-04-01.md`
   - `docs/baselines/CVF_GC026_TRACKER_SYNC_W24_T1_CLOSED_2026-04-01.md`

9. **Update tracker + AGENT_HANDOFF** — CLOSED DELIVERED state

10. **Commit + push** — classified commit to cvf-next

---

## Pass Conditions

| # | Condition |
|---|---|
| 1 | `GatewayPIIDetectionBatchContract` class exported from barrel |
| 2 | `batch()` calls `contract.detect()` on each request |
| 3 | emailCount, phoneCount, ssnCount, creditCardCount, customCount, totalDetected, totalClean accurate |
| 4 | `dominantPiiType`: SSN > CREDIT_CARD > EMAIL > PHONE > CUSTOM; NONE on empty or no PII |
| 5 | batchHash/batchId distinct, deterministic, W24-T1 domain salts |
| 6 | ~27 tests, 0 failures |
| 7 | No regressions in full CPF suite |

---

## Key Values

| Key | Value |
|---|---|
| Source file | `EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION/src/gateway.pii.detection.batch.contract.ts` |
| Test file | `EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION/tests/gateway.pii.detection.batch.contract.test.ts` |
| Batch hash salt | `"w24-t1-cp1-gateway-pii-detection-batch"` |
| Batch ID salt | `"w24-t1-cp1-gateway-pii-detection-batch-id"` |
| Fixed test timestamp | `"2026-04-01T00:00:00.000Z"` |
| Dominant precedence | SSN > CREDIT_CARD > EMAIL > PHONE > CUSTOM |
| Empty/no PII sentinel | NONE |
