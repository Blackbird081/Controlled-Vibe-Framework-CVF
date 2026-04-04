# CVF W37-T1 Context Packager Batch Contract — Execution Plan

Memory class: SUMMARY_RECORD

> Date: 2026-04-04
> Tranche: W37-T1 — ContextPackagerBatchContract (REALIZATION class)
> Authorization: GC-018 AUTHORIZED 2026-04-04
> Lane: Full Lane

---

## 1. Objective

Implement `ContextPackagerBatchContract` to batch the `ContextPackagerContract.pack()` surface, closing the W1-T12 context packager batch gap on the Control Plane Foundation.

---

## 2. Source Contract

- **Contract**: `ContextPackagerContract`
- **Method**: `pack(request: ContextPackagerRequest): TypedContextPackage`
- **File**: `EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION/src/context.packager.contract.ts`
- **Injectable deps**: `now`, `estimateTokens`

---

## 3. Batch Contract Spec

| Field | Value |
|---|---|
| Class name | `ContextPackagerBatchContract` |
| Factory | `createContextPackagerBatchContract()` |
| Batch input | `ContextPackagerRequest[]` |
| Batch output | `ContextPackagerBatch` |
| `totalPackaged` | count of results with `status === "PACKAGED"` |
| `totalEmpty` | count of results with `status === "EMPTY"` |
| `totalSegments` | sum of `result.totalSegments` across all results |
| `dominantStatus` | `PACKAGED` if any result is PACKAGED; `EMPTY` if all EMPTY; `NONE` if batch empty |
| `dominantTokenBudget` | `Math.max(...results.map(r => r.estimatedTokens))`; `0` for empty |
| Batch hash salt | `"w37-t1-cp1-context-packager-batch"` |
| Batch ID salt | `"w37-t1-cp1-context-packager-batch-id"` |

---

## 4. CP1 Steps

1. Create `context.packager.batch.contract.ts`
2. Create `context.packager.batch.contract.test.ts` (≥ 28 tests)
3. Add exports to `control.plane.context.barrel.ts`
4. Add entry to `CVF_TEST_PARTITION_OWNERSHIP_REGISTRY.json`
5. Run CPF tests — confirm 0 failures
6. Create CP1 governance artifacts (audit, GC-019 review, delta, GC-026 CP1 sync)
7. Update tracker (W37-T1 CP1 DELIVERED) + update AGENT_HANDOFF
8. Commit CP1

---

## 5. CP2 Steps

1. Create tranche closure review
2. Create GC-026 closed sync
3. Update tracker (W37-T1 CLOSED DELIVERED) + update AGENT_HANDOFF
4. Commit CP2 + push

---

## 6. Constraints

- `ContextPackagerContract` is read-only; no modification permitted
- No EPF / GEF / LPF changes
- Architecture baseline remains `v3.6-W32T1`
- All tests in dedicated file per GC-024 test partition ownership
- Reuse `createDeterministicBatchIdentity` from `batch.contract.shared.ts`
- Reuse `FIXED_BATCH_NOW` from `cpf.batch.contract.fixtures.ts`
