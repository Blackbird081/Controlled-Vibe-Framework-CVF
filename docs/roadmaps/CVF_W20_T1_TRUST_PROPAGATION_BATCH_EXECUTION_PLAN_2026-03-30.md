# CVF W20-T1 Execution Plan — TrustPropagationBatchContract

Memory class: SUMMARY_RECORD

> Date: 2026-03-30
> Tranche: W20-T1 — TrustPropagationBatchContract (REALIZATION class)
> Authorization: GC-018 AUTHORIZED 2026-03-30
> Authorization packet: `docs/reviews/CVF_GC018_CONTINUATION_CANDIDATE_W20_T1_TRUST_PROPAGATION_BATCH_2026-03-30.md`

---

## Objective

Deliver `TrustPropagationBatchContract` — a governed batch wrapper for `TrustIsolationBoundaryContract.decideTrustPropagation()` — closing the second unbatched surface on the trust/isolation boundary. Follows the established W13/W14/W15/W17/W19 batch contract pattern exactly.

---

## Control Points

### CP1 — Full Lane (GC-019)

Deliverables:
- `EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION/src/trust.propagation.batch.contract.ts`
- `EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION/tests/trust.propagation.batch.contract.test.ts` (~26 tests)
- `docs/audits/CVF_W20_T1_CP1_TRUST_PROPAGATION_BATCH_AUDIT_2026-03-30.md`
- `docs/reviews/CVF_GC019_W20_T1_CP1_TRUST_PROPAGATION_BATCH_REVIEW_2026-03-30.md`
- `docs/baselines/CVF_W20_T1_CP1_TRUST_PROPAGATION_BATCH_DELTA_2026-03-30.md`
- `docs/baselines/CVF_GC026_TRACKER_SYNC_W20_T1_CP1_DONE_2026-03-30.md`

Exit criteria:
- All ~26 CPF tests pass, 0 failures
- `dominantMode` precedence correct: `BLOCKED > GRAPH_GATED > DIRECT`; `EMPTY` on empty batch
- `batchHash` and `batchId` distinct, deterministically computed
- No regressions in existing test suites

### CP2 — Tranche Closure

Deliverables:
- `docs/reviews/CVF_W20_T1_TRANCHE_CLOSURE_REVIEW_2026-03-30.md`
- `docs/baselines/CVF_GC026_TRACKER_SYNC_W20_T1_CLOSED_2026-03-30.md`
- `docs/reference/CVF_WHITEPAPER_PROGRESS_TRACKER.md` (W20-T1 CLOSED DELIVERED)
- `AGENT_HANDOFF.md` (no active tranche; next GC-018)

---

## Fixed Inputs

| Input | Source | Constraint |
|---|---|---|
| `TrustIsolationBoundaryContract` | `trust.isolation.boundary.contract.ts` | FIXED — read only; not modified |
| `TrustPropagationRequest` | same file | FIXED — type consumed, not changed |
| `TrustPropagationDecision` | same file | FIXED — type consumed, not changed |
| `TrustPropagationMode` | same file | FIXED — used for dominant mode resolution |
| `computeDeterministicHash` | CVF_v1.9_DETERMINISTIC_REPRODUCIBILITY | FIXED — hash utility |

---

## New Contract Design

```typescript
export type TrustPropagationBatchDominantMode = TrustPropagationMode | "EMPTY";

export interface TrustPropagationBatch {
  batchId: string;
  batchHash: string;
  createdAt: string;
  totalDecisions: number;
  blockedCount: number;
  graphGatedCount: number;
  directCount: number;
  dominantMode: TrustPropagationBatchDominantMode;
  decisions: TrustPropagationDecision[];
}

export class TrustPropagationBatchContract {
  batch(requests: TrustPropagationRequest[], boundary: TrustIsolationBoundaryContract): TrustPropagationBatch;
}
```

Dominant mode precedence: `BLOCKED (3) > GRAPH_GATED (2) > DIRECT (1)`. Tie-broken by precedence. `EMPTY` when no requests.

---

## Exit Criteria Summary

1. Contract file created and exported
2. Barrel index (`src/index.ts`) updated to include new exports
3. ~26 CPF tests all pass
4. Dominant mode logic correct across all boundary cases
5. 0 regressions in existing CPF/EPF/GEF/LPF suites
6. All governance artifacts committed with classified commit message
