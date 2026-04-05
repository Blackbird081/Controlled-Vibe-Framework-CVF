# CVF W46-T1 Execution Plan — DesignConsumerBatchContract

Memory class: SUMMARY_RECORD

> Date: 2026-04-05
> Tranche: W46-T1
> Class: REALIZATION
> Lane: Full Lane
> Authorization: GC-018 AUTHORIZED — `docs/reviews/CVF_GC018_CONTINUATION_CANDIDATE_W46_T1_DESIGN_CONSUMER_BATCH_2026-04-05.md`

---

## 1. Objective

Close the final open batch surface in `control.plane.design.boardroom.barrel.ts` by implementing `DesignConsumerBatchContract`, which batches calls to `DesignConsumerContract.consume()` and aggregates results into a `DesignConsumptionBatchResult` with deterministic identity.

---

## 2. Deliverables

| Deliverable | Path |
|---|---|
| Contract | `EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION/src/design.consumer.batch.contract.ts` |
| Tests | `EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION/tests/design.consumer.batch.contract.test.ts` |
| Barrel | `EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION/src/control.plane.design.boardroom.barrel.ts` |
| Registry | `governance/compat/CVF_TEST_PARTITION_OWNERSHIP_REGISTRY.json` |

---

## 3. Implementation Notes

### Status Classification
- COMPLETE: `!receipt.orchestrationBlocked`
- PARTIAL: `receipt.orchestrationBlocked && receipt.boardroomSession.decision.decision === "AMEND_PLAN"`
- DEGRADED: `receipt.orchestrationBlocked && receipt.boardroomSession.decision.decision !== "AMEND_PLAN"` (ESCALATE or REJECT)
- NONE: empty batch

### Aggregates
- `totalRequests`: `receipts.length`
- `completedCount`, `partialCount`, `degradedCount`: counts per status
- `blockedCount`: count of `receipt.orchestrationBlocked === true`
- `warnedCount`: count of `receipt.warnings.length > 0`
- `dominantStatus`: DEGRADED > PARTIAL > COMPLETE; NONE if empty

### Batch Seeds
- `batchSeed`: `"w46-t1-cp1-design-consumer-batch"`
- `batchIdSeed`: `"w46-t1-cp1-design-consumer-batch-id"`

### Test Fixtures
- COMPLETE: `makeIntake("general")` → DesignConsumerContract.consume() → boardroom PROCEED → `!orchestrationBlocked`
- PARTIAL: inject `clarifications: [{ question: "define scope" }]` → AMEND_PLAN → `orchestrationBlocked + AMEND_PLAN`
- DEGRADED: `makeIntake("finance", { valid: false })` → R3 tasks + plan warnings → ESCALATE → `orchestrationBlocked + ESCALATE`

---

## 4. Pass Conditions

1. Contract implemented and exported from `control.plane.design.boardroom.barrel.ts`
2. `batch([])` → `dominantStatus: "NONE"`, all counts zero
3. Single COMPLETE intake → `completedCount: 1`, `dominantStatus: "COMPLETE"`
4. Single PARTIAL (AMEND_PLAN) → `partialCount: 1`, `dominantStatus: "PARTIAL"`
5. Single DEGRADED (ESCALATE) → `degradedCount: 1`, `dominantStatus: "DEGRADED"`
6. Mixed batch: DEGRADED dominates
7. Aggregates (`blockedCount`, `warnedCount`) accurate
8. Deterministic identity
9. CPF: 0 failures

---

## 5. Tranche Closure Steps

1. Implement contract
2. Write tests → run to confirm pass
3. Update barrel exports
4. Update partition registry
5. Write CP1 audit + GC-019 review + delta
6. Write GC-026 CP1 delivered sync
7. Write closure review + GC-026 closed sync
8. Update test log + handoff + tracker
9. Commit
