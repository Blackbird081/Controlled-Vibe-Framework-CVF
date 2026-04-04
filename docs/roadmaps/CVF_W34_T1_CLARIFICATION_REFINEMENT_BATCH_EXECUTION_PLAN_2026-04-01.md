# CVF W34-T1 Clarification Refinement Batch Contract — Execution Plan

Memory class: SUMMARY_RECORD

> Date: 2026-04-01
> Tranche: W34-T1 — ClarificationRefinementBatchContract (REALIZATION class)
> Authorization: GC-018 AUTHORIZED 2026-04-01
> Lane: Full Lane

---

## 1. Objective

Implement `ClarificationRefinementBatchContract` to batch the `ClarificationRefinementContract.refine()` surface, closing the W1-T5 CP2 clarification refinement batch gap on the Control Plane Foundation.

---

## 2. Source Contract

- **Contract**: `ClarificationRefinementContract`
- **Method**: `refine(packet: ReversePromptPacket, answers: ClarificationAnswer[]): RefinedIntakeRequest`
- **File**: `EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION/src/clarification.refinement.contract.ts`
- **Injectable deps**: `scoreConfidence`, `now`

---

## 3. Batch Contract Spec

| Field | Value |
|---|---|
| Class name | `ClarificationRefinementBatchContract` |
| Factory | `createClarificationRefinementBatchContract()` |
| Batch input | `ClarificationRefinementRequest[]` where each item = `{ packet: ReversePromptPacket; answers: ClarificationAnswer[] }` |
| Batch output | `ClarificationRefinementBatch` |
| `totalRefinements` | `results.length` |
| `dominantConfidenceBoost` | `Math.max(...results.map(r => r.confidenceBoost))`; `0` for empty |
| Batch hash salt | `"w34-t1-cp1-clarification-refinement-batch"` |
| Batch ID salt | `"w34-t1-cp1-clarification-refinement-batch-id"` |
| Hash parts | `[createdAt + ":total:" + totalRefinements, "dominantConfidenceBoost:" + dominantConfidenceBoost]` |
| Batch ID parts | `[createdAt]` |

---

## 4. CP1 Steps

1. Create `clarification.refinement.batch.contract.ts`
2. Create `clarification.refinement.batch.contract.test.ts` (≥ 30 tests)
3. Add exports to `control.plane.coordination.barrel.ts`
4. Add entry to `CVF_TEST_PARTITION_OWNERSHIP_REGISTRY.json`
5. Run CPF tests — confirm 0 failures
6. Create CP1 governance artifacts (audit, GC-019 review, delta, GC-026 CP1 sync)
7. Update tracker (W34-T1 CP1 DELIVERED) + update AGENT_HANDOFF
8. Commit CP1

---

## 5. CP2 Steps

1. Create tranche closure review
2. Create GC-026 closed sync
3. Update tracker (W34-T1 CLOSED DELIVERED) + update AGENT_HANDOFF
4. Commit CP2 + push

---

## 6. Constraints

- `ClarificationRefinementContract` is read-only; no modification permitted
- No EPF / GEF / LPF changes
- Architecture baseline remains `v3.6-W32T1`
- All tests in dedicated file per GC-024 test partition ownership
- Reuse `createDeterministicBatchIdentity` from `batch.contract.shared.ts`
- Reuse `FIXED_BATCH_NOW` from `cpf.batch.contract.fixtures.ts`
