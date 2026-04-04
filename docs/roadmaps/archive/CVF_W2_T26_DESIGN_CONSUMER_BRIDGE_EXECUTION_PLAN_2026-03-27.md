# CVF W2-T26 Design Consumer Bridge — Execution Plan — 2026-03-27

Memory class: SUMMARY_RECORD
> Tranche: W2-T26 — Design Consumer Pipeline Bridge
> Authorization: GC-018 (10/10 audit score)
> Expected duration: Single session
> Expected test delta: CPF 1189 → ~1245 (+~56 tests)

---

## Execution Overview

W2-T26 delivers consumer pipeline visibility for `DesignContract`, completing the fourth CPF consumer bridge and enabling design plan consumption across planes.

---

## Control Point Breakdown

### CP1 — DesignConsumerPipelineContract (Full Lane)

**File**: `EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION/src/design.consumer.pipeline.contract.ts`

**Contract structure**:
```typescript
export class DesignConsumerPipelineContract {
  private readonly now: () => string;
  private readonly designContract: DesignContract;
  private readonly consumerPipelineContract: ControlPlaneConsumerPipelineContract;

  execute(request: DesignConsumerPipelineRequest): DesignConsumerPipelineResult
}
```

**Query format**: `"DesignPlan: {totalTasks} tasks, phase={dominantPhase}, risk={dominantRisk}"`

**contextId**: `designPlan.planId`

**Warnings**:
- `WARNING_NO_TASKS`: totalTasks === 0
- `WARNING_HIGH_RISK_TASKS`: criticalRiskCount > 0

**Dependencies**:
- `DesignContract` (source contract)
- `ControlPlaneConsumerPipelineContract` (consumer pipeline)
- `computeDeterministicHash` (deterministic IDs)

**Expected tests**: ~30

---

### CP2 — DesignConsumerPipelineBatchContract (Fast Lane GC-021)

**File**: `EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION/src/design.consumer.pipeline.batch.contract.ts`

**Contract structure**:
```typescript
export class DesignConsumerPipelineBatchContract {
  private readonly now: () => string;

  batch(results: DesignConsumerPipelineResult[]): DesignConsumerPipelineBatchResult
}
```

**Aggregation logic**:
- `totalPlans` = count of results
- `totalTasks` = sum(result.designPlan.tasks.length)
- `overallDominantPhase` = most frequent phase (CLOSURE > VALIDATION > IMPLEMENTATION > DESIGN > PLANNING)
- `overallDominantRisk` = most frequent risk (CRITICAL > HIGH > MEDIUM > LOW)
- `dominantTokenBudget` = max(result.consumerPackage.typedContextPackage.estimatedTokens)

**Expected tests**: ~25

---

### CP3 — Tranche Closure

**Artifacts**:
1. Closure review
2. GC-026 completion sync
3. Tracker update
4. Handoff update

---

## Implementation Checklist

### CP1 Tasks
- [ ] Read `DesignContract` to understand structure
- [ ] Create `design.consumer.pipeline.contract.ts`
- [ ] Implement `DesignConsumerPipelineContract` class
- [ ] Implement query derivation logic
- [ ] Implement warning logic (NO_TASKS, HIGH_RISK_TASKS)
- [ ] Thread `now` dependency to inner contracts
- [ ] Compute deterministic hashes

### CP2 Tasks
- [ ] Create `design.consumer.pipeline.batch.contract.ts`
- [ ] Implement `DesignConsumerPipelineBatchContract` class
- [ ] Implement aggregation logic
- [ ] Compute deterministic hashes

### Test Tasks
- [ ] Create `tests/design.consumer.pipeline.test.ts`
- [ ] Write CP1 tests (~30 tests)
- [ ] Write CP2 tests (~25 tests)
- [ ] Verify all tests pass

### Integration Tasks
- [ ] Update `src/index.ts` barrel exports
- [ ] Update test partition registry

### Governance Tasks
- [ ] Run CPF tests
- [ ] Commit CP1+CP2
- [ ] Push to cvf-next
- [ ] Create CP3 closure artifacts
- [ ] Update tracker and handoff
- [ ] Commit and push CP3

---

W2-T26 EXECUTION PLAN READY
