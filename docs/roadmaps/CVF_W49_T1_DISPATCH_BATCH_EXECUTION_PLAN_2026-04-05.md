# CVF W49-T1 Execution Plan — DispatchBatchContract

Memory class: SUMMARY_RECORD

> Tranche: W49-T1 | Class: REALIZATION | Lane: Full Lane
> Date: 2026-04-05
> GC-018 Authorization: `docs/reviews/CVF_GC018_CONTINUATION_CANDIDATE_W49_T1_DISPATCH_BATCH_2026-04-05.md`

---

## Objective

Close the `DispatchContract.dispatch()` standalone batch surface in EPF. This is the first standalone batch contract in the EPF execution chain (after the consumer bridge batch closed in W48-T1). Implements `DispatchBatchContract` as a REALIZATION class batch contract.

---

## Inputs

- `DispatchContract.dispatch(orchestrationId: string, assignments: TaskAssignment[]): DispatchResult`
- Input type: `DispatchBatchInput` (per-dispatch pair)
- Batch input: `DispatchBatchInput[]`

```typescript
interface DispatchBatchInput {
  orchestrationId: string;
  assignments: TaskAssignment[];
}
```

---

## Output Shape

```typescript
type DispatchBatchStatus = "FULLY_AUTHORIZED" | "PARTIALLY_AUTHORIZED" | "FULLY_BLOCKED" | "NONE";

interface DispatchBatchResult {
  batchId: string;
  batchHash: string;
  createdAt: string;
  totalDispatches: number;
  totalAssignments: number;
  totalAuthorized: number;
  totalBlocked: number;
  totalEscalated: number;
  warnedCount: number;
  dominantStatus: DispatchBatchStatus;
  results: DispatchResult[];
}
```

---

## Status Classification

| Condition | Status |
|---|---|
| Empty batch | `"NONE"` |
| `totalAuthorized > 0`, `totalBlocked = 0`, `totalEscalated = 0` | `"FULLY_AUTHORIZED"` |
| `totalAuthorized > 0`, (`totalBlocked > 0` OR `totalEscalated > 0`) | `"PARTIALLY_AUTHORIZED"` |
| `totalAuthorized = 0` (non-empty batch) | `"FULLY_BLOCKED"` |

Dominance precedence: `FULLY_BLOCKED > PARTIALLY_AUTHORIZED > FULLY_AUTHORIZED`

- `warnedCount` = count of `DispatchResult` entries where `warnings.length > 0`
- `totalAssignments` = sum of all `assignments.length` across all inputs

---

## Delivery Steps

### Phase A — EPF Barrel Split (prerequisite)

1. Read `EXTENSIONS/CVF_EXECUTION_PLANE_FOUNDATION/src/index.ts` lines covering dispatch exports
2. Create `EXTENSIONS/CVF_EXECUTION_PLANE_FOUNDATION/src/epf.dispatch.barrel.ts` with all dispatch family re-exports (dispatch contract, dispatch consumer pipeline contract/batch)
3. Replace dispatch entries in `index.ts` with single `export * from "./epf.dispatch.barrel"` line
4. Verify `index.ts` line count drops below 1450
5. Run `npx vitest run EXTENSIONS/CVF_EXECUTION_PLANE_FOUNDATION` — 1154 tests must all pass (no regressions from re-export reorganization)

### Phase B — DispatchBatchContract

6. Create `EXTENSIONS/CVF_EXECUTION_PLANE_FOUNDATION/src/dispatch.batch.contract.ts`
7. Add `DispatchBatchContract.batch(inputs: DispatchBatchInput[]): DispatchBatchResult`
8. Export `DispatchBatchContract`, `createDispatchBatchContract`, and types from `epf.dispatch.barrel.ts`
9. Add partition entry to `governance/compat/CVF_TEST_PARTITION_OWNERSHIP_REGISTRY.json`
10. Create `EXTENSIONS/CVF_EXECUTION_PLANE_FOUNDATION/tests/dispatch.batch.contract.test.ts`
11. Run `npx vitest run EXTENSIONS/CVF_EXECUTION_PLANE_FOUNDATION/tests/dispatch.batch.contract.test.ts`

### Phase C — Governance Chain

12. Write CP1 audit doc
13. Write GC-019 CP1 review doc
14. Write CP1 delta doc
15. Write GC-026 CP1 delivered sync
16. Write tranche closure review
17. Write GC-026 closed sync
18. Update `docs/CVF_INCREMENTAL_TEST_LOG.md`
19. Update `AGENT_HANDOFF.md`
20. Commit

---

## Hash Salts

- Batch hash salt: `"w49-t1-cp1-dispatch-batch"`
- Batch ID salt: `"w49-t1-cp1-dispatch-batch-id"`

---

## Test Scenarios (minimum)

1. Empty batch → `dominantStatus: "NONE"`, valid `batchHash`, valid `batchId`
2. Single fully authorized dispatch → `dominantStatus: "FULLY_AUTHORIZED"`
3. Single fully blocked dispatch → `dominantStatus: "FULLY_BLOCKED"`
4. Mix of authorized + blocked → `dominantStatus: "PARTIALLY_AUTHORIZED"`
5. All dispatches fully blocked → `dominantStatus: "FULLY_BLOCKED"`
6. Mix of authorized + escalated → `dominantStatus: "PARTIALLY_AUTHORIZED"`
7. `totalAuthorized` aggregation is correct across multiple dispatches
8. `totalBlocked` aggregation is correct
9. `totalEscalated` aggregation is correct
10. `totalAssignments` = sum of all input assignment array lengths
11. `warnedCount` = count of results with `warnings.length > 0`
12. `batchHash` determinism (same input → same hash across calls)
13. `batchId ≠ batchHash` (batchId = hash of batchHash)
14. `results` array length = `totalDispatches`
15. Factory `createDispatchBatchContract()` produces working contract
