# CVF W19-T1 Execution Plan — IsolationScopeBatchContract

Memory class: SUMMARY_RECORD

> Date: 2026-03-30
> Tranche: W19-T1 — IsolationScopeBatchContract (REALIZATION class)
> Authorization: GC-018 AUTHORIZED 2026-03-30
> Authorization packet: `docs/reviews/CVF_GC018_CONTINUATION_CANDIDATE_W19_T1_ISOLATION_SCOPE_BATCH_2026-03-30.md`

---

## Objective

Deliver `IsolationScopeBatchContract` — a governed batch wrapper for `TrustIsolationBoundaryContract.evaluateIsolationScope()` — closing the highest-frequency unbatched surface on the trust/isolation boundary. Follows the established W13/W14/W15/W17 batch contract pattern exactly.

---

## Control Points

### CP1 — Full Lane (GC-019)

Deliverables:
- `EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION/src/isolation.scope.batch.contract.ts`
- `EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION/tests/isolation.scope.batch.contract.test.ts` (~26 tests)
- `docs/audits/CVF_W19_T1_CP1_ISOLATION_SCOPE_BATCH_AUDIT_2026-03-30.md`
- `docs/reviews/CVF_GC019_W19_T1_CP1_ISOLATION_SCOPE_BATCH_REVIEW_2026-03-30.md`
- `docs/baselines/CVF_W19_T1_CP1_ISOLATION_SCOPE_BATCH_DELTA_2026-03-30.md`
- `docs/baselines/CVF_GC026_TRACKER_SYNC_W19_T1_CP1_DONE_2026-03-30.md`

Exit criteria:
- All ~26 CPF tests pass, 0 failures
- `dominantEnforcementMode` precedence correct: `HARD_BLOCK > ESCALATE > PASS`; `EMPTY` on empty batch
- `batchHash` and `batchId` distinct, deterministically computed
- No regressions in existing test suites

### CP2 — Tranche Closure

Deliverables:
- `docs/reviews/CVF_W19_T1_TRANCHE_CLOSURE_REVIEW_2026-03-30.md`
- `docs/baselines/CVF_GC026_TRACKER_SYNC_W19_T1_CLOSED_DELIVERED_2026-03-30.md`
- `docs/reference/CVF_WHITEPAPER_PROGRESS_TRACKER.md` (W19-T1 CLOSED DELIVERED)
- `AGENT_HANDOFF.md` (no active tranche; next GC-018)

---

## Fixed Inputs

| Input | Source | Constraint |
|---|---|---|
| `TrustIsolationBoundaryContract` | `trust.isolation.boundary.contract.ts` | FIXED — read only; not modified |
| `IsolationScopeRequest` | same file | FIXED — type consumed, not changed |
| `IsolationScopeResult` | same file | FIXED — type consumed, not changed |
| `IsolationEnforcementMode` | same file | FIXED — used for dominant mode resolution |
| `computeDeterministicHash` | CVF_v1.9_DETERMINISTIC_REPRODUCIBILITY | FIXED — hash utility |

---

## New Contract Design

```typescript
export type IsolationBatchDominantEnforcementMode = IsolationEnforcementMode | "EMPTY";

export interface IsolationScopeBatch {
  batchId: string;
  batchHash: string;
  createdAt: string;
  totalResults: number;
  hardBlockCount: number;
  escalateCount: number;
  passCount: number;
  dominantEnforcementMode: IsolationBatchDominantEnforcementMode;
  results: IsolationScopeResult[];
}

export class IsolationScopeBatchContract {
  batch(requests: IsolationScopeRequest[], boundary: TrustIsolationBoundaryContract): IsolationScopeBatch;
}
```

Dominant mode precedence: `HARD_BLOCK (3) > ESCALATE (2) > PASS (1)`. Tie-broken by precedence. `EMPTY` when no requests.

---

## Exit Criteria Summary

1. Contract file created and exported
2. Barrel index (`src/index.ts`) updated to include new exports
3. ~26 CPF tests all pass
4. Dominant enforcement mode logic correct across all boundary cases
5. 0 regressions in existing CPF/EPF/GEF/LPF suites
6. All governance artifacts committed with classified commit message
