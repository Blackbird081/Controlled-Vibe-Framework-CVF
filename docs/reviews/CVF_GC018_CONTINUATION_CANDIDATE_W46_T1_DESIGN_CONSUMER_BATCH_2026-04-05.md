# GC-018 Continuation Candidate — W46-T1 DesignConsumerBatchContract

Memory class: FULL_RECORD

> Date: 2026-04-05
> Tranche: W46-T1
> Class: REALIZATION
> Lane: Full Lane
> Authorization status: AUTHORIZED

---

## 1. Candidate Summary

| Field | Value |
|---|---|
| Tranche | W46-T1 |
| Contract | `DesignConsumerBatchContract` |
| Source contract | `DesignConsumerContract.consume(ControlPlaneIntakeResult)` |
| Barrel | `control.plane.design.boardroom.barrel.ts` |
| Surface | Last open batch surface in design.boardroom barrel |
| Precedent | W44-T1 ConsumerBatchContract; W45-T1 GatewayConsumerBatchContract |

---

## 2. Rationale

`control.plane.design.boardroom.barrel.ts` has all 8 contracts (W26–W32, W34) batch-closed except `DesignConsumerContract.consume()`. This is the final batch surface in this barrel. Closing it completes the design.boardroom family and establishes full CPF domain barrel batch coverage.

---

## 3. Contract Design

### Input
`ControlPlaneIntakeResult[]`

### Output: `DesignConsumptionBatchResult`

| Field | Description |
|---|---|
| `batchId` | deterministic batch ID |
| `batchHash` | deterministic batch hash |
| `createdAt` | ISO timestamp |
| `totalRequests` | count of intake results |
| `completedCount` | receipts with `!orchestrationBlocked` |
| `partialCount` | receipts with `orchestrationBlocked && decision === "AMEND_PLAN"` |
| `degradedCount` | receipts with `orchestrationBlocked && decision !== "AMEND_PLAN"` (ESCALATE/REJECT) |
| `warnedCount` | receipts with `warnings.length > 0` |
| `blockedCount` | receipts with `orchestrationBlocked === true` |
| `dominantStatus` | DEGRADED > PARTIAL > COMPLETE; NONE for empty |
| `receipts` | `DesignConsumptionReceipt[]` in input order |

### Status Classification
- **COMPLETE**: `!receipt.orchestrationBlocked`
- **PARTIAL**: `receipt.orchestrationBlocked && receipt.boardroomSession.decision.decision === "AMEND_PLAN"`
- **DEGRADED**: `receipt.orchestrationBlocked && receipt.boardroomSession.decision.decision !== "AMEND_PLAN"` (ESCALATE or REJECT)
- **NONE**: empty batch

### Batch Seeds
- `batchSeed`: `"w46-t1-cp1-design-consumer-batch"`
- `batchIdSeed`: `"w46-t1-cp1-design-consumer-batch-id"`

---

## 4. Pass Conditions

1. `design.consumer.batch.contract.ts` implemented and exported from barrel
2. `batch([])` → `dominantStatus: "NONE"`, all counts zero
3. Single COMPLETE receipt → `completedCount: 1`, `dominantStatus: "COMPLETE"`
4. Single PARTIAL receipt (AMEND_PLAN) → `partialCount: 1`, `dominantStatus: "PARTIAL"`
5. Single DEGRADED receipt (ESCALATE) → `degradedCount: 1`, `dominantStatus: "DEGRADED"`
6. Mixed batch: DEGRADED dominates
7. Aggregates (`blockedCount`, `warnedCount`, `totalRequests`) accurate
8. Deterministic identity (same inputs → same `batchHash`)
9. CPF: 0 failures, 0 regressions

---

## 5. Gate Checks

| Gate | Result |
|---|---|
| Scope bounded | PASS — single batch surface, no new contracts |
| No cross-plane impact | PASS |
| Precedent exists | PASS — W44/W45 direct predecessors |
| Test baseline stable | PASS — CPF 2900, 0 failures |
| Architecture unchanged | PASS — REALIZATION class |

**GC-018 AUTHORIZED — proceed to W46-T1 implementation.**
