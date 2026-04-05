# GC-018 Continuation Candidate Authorization Packet — W45-T1 GatewayConsumerBatchContract

Memory class: FULL_RECORD

> Date: 2026-04-05
> Tranche: W45-T1
> Class: REALIZATION
> Lane: Full Lane
> Authorizing gate: GC-018
> Quality assessment anchor: `docs/assessments/CVF_POST_W44_CONTINUATION_QUALITY_ASSESSMENT_2026-04-05.md`
> Decision: EXPAND_NOW — 0 failures, no governance debt, open surface confirmed

---

## 1. Candidate Summary

| Field | Value |
|---|---|
| Tranche | W45-T1 |
| Contract | `GatewayConsumerBatchContract` |
| Target method | `GatewayConsumerContract.consume(signal: GatewaySignalRequest): GatewayConsumptionReceipt` |
| Barrel | `control.plane.gateway.barrel.ts` |
| Baseline CPF | 2870 tests, 0 failures |
| Expected delta | ~27 new tests |

---

## 2. Rationale

`GatewayConsumerContract.consume()` is the final open batch surface in `control.plane.gateway.barrel.ts`. It orchestrates a 2-stage pipeline (AIGateway → Intake) and produces a `GatewayConsumptionReceipt`. A batch contract is required to close this surface, enabling downstream callers to process multiple gateway signals in batch with deterministic, governed aggregation.

All other batch surfaces in the gateway barrel (W22–W25 gateway batch family, W41–W43 gateway log batch family) are canonically closed. This is the single remaining surface.

---

## 3. Scope

**In scope:**
- `GatewayConsumerBatchContract.batch(signals: GatewaySignalRequest[]): GatewayConsumptionBatchResult`
- Factory function `createGatewayConsumerBatchContract()`
- Export from `control.plane.gateway.barrel.ts`
- Partition entry in `CVF_TEST_PARTITION_OWNERSHIP_REGISTRY.json`
- Full governance artifact chain (audit, review, delta, GC-026 syncs, test log, handoff)

**Not in scope:**
- `DesignConsumerContract.consume()` — W46-T1 candidate
- Any EPF/GEF/LPF surfaces
- Whitepaper update — deferred to after W46-T1
- L0–L4 risk-model migration
- Any physical restructuring

---

## 4. Contract Design

### 4.1 Status Classification

| Condition | Status |
|---|---|
| Empty batch (0 requests) | `"NONE"` |
| `!receipt.intakeResult.intent.valid` | `"DEGRADED"` |
| `intent.valid && chunkCount === 0` | `"PARTIAL"` |
| `intent.valid && chunkCount > 0` | `"COMPLETE"` |

Precedence: `DEGRADED > PARTIAL > COMPLETE`

### 4.2 Output Shape

```typescript
export interface GatewayConsumptionBatchResult {
  batchHash: string;
  batchId: string;
  createdAt: string;
  totalRequests: number;
  completedCount: number;
  partialCount: number;
  degradedCount: number;
  dominantStatus: GatewayConsumptionBatchStatus | "NONE";
  totalChunksRetrieved: number;
  warnedCount: number;
  receipts: GatewayConsumptionReceipt[];
}
```

### 4.3 Aggregates

- `totalChunksRetrieved` = sum of `receipt.intakeResult.retrieval.chunkCount` across all receipts
- `warnedCount` = count of receipts where `receipt.warnings.length > 0`
- Batch identity uses fixed seeds: `"w45-t1-cp1-gateway-consumer-batch"` and `"w45-t1-cp1-gateway-consumer-batch-id"`

---

## 5. Pass Conditions (9)

1. `gateway.consumer.batch.contract.ts` implemented and exported from `control.plane.gateway.barrel.ts`
2. `batch([])` returns `dominantStatus: "NONE"`, empty counts, `batchHash` and `batchId` defined
3. Single COMPLETE receipt → `dominantStatus: "COMPLETE"`, `completedCount: 1`
4. Single PARTIAL receipt (valid + 0 chunks) → `dominantStatus: "PARTIAL"`, `partialCount: 1`
5. Single DEGRADED receipt (!intent.valid) → `dominantStatus: "DEGRADED"`, `degradedCount: 1`
6. Mixed batch: DEGRADED dominates COMPLETE and PARTIAL
7. `totalChunksRetrieved` and `warnedCount` aggregate correctly across multiple receipts
8. Deterministic: two calls with same inputs produce identical `batchHash` and `batchId`
9. Full CPF suite: 0 failures, 0 regressions

---

## 6. Not In This Wave

- `DesignConsumerContract.consume()` batch — separate W46-T1 candidate
- Any EPF, GEF, LPF batch surfaces
- Whitepaper update to v3.7 — after W46 closes

---

## 7. Dependency Declaration

- Depends on: `GatewayConsumerContract` (gateway.consumer.contract.ts), `GatewayConsumptionReceipt` type, `ControlPlaneIntakeResult` type
- No cross-plane dependencies
- No W7 chain impact — REALIZATION class addition only
- No architectural boundary changes

---

## 8. Authorization Gate

**GC-018 AUTHORIZED — proceed to implementation.**

> Quality-first decision gate passed: EXPAND_NOW
> Active quality assessment: `docs/assessments/CVF_POST_W44_CONTINUATION_QUALITY_ASSESSMENT_2026-04-05.md`
> All mandatory gates (G1–G9) satisfied for REALIZATION class continuation
