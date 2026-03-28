# CVF W1-T25 Route Match Log Consumer Bridge — Execution Plan — 2026-03-27

Memory class: SUMMARY_RECORD
> Tranche: W1-T25 — Route Match Log Consumer Pipeline Bridge
> Authorization: GC-018 (10/10 audit score)
> Expected duration: Single session
> Expected test delta: CPF 1124 → ~1180 (+~56 tests)

---

## Execution Overview

W1-T25 delivers consumer pipeline visibility for `RouteMatchLogContract`, completing the third CPF log consumer bridge and the routing observability chain.

---

## Control Point Breakdown

### CP1 — RouteMatchLogConsumerPipelineContract (Full Lane)

**File**: `EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION/src/route.match.log.consumer.pipeline.contract.ts`

**Contract structure**:
```typescript
export class RouteMatchLogConsumerPipelineContract {
  private readonly now: () => string;
  private readonly logContract: RouteMatchLogContract;
  private readonly consumerPipelineContract: ControlPlaneConsumerPipelineContract;

  execute(request: RouteMatchLogConsumerPipelineRequest): RouteMatchLogConsumerPipelineResult
}
```

**Query format**: `"RouteMatchLog: {totalMatches} matches, action={dominantAction}, mismatches={mismatchCount}"`

**contextId**: `log.logId`

**Warnings**:
- `WARNING_NO_MATCHES`: totalMatches === 0
- `WARNING_HIGH_MISMATCH_RATE`: mismatchCount / totalMatches > 0.3

**Dependencies**:
- `RouteMatchLogContract` (source contract)
- `ControlPlaneConsumerPipelineContract` (consumer pipeline)
- `computeDeterministicHash` (deterministic IDs)

**Expected tests**: ~30 (instantiation, output shape, consumerId, deterministic hashing, query derivation, contextId, warnings, dominantAction, log propagation)

---

### CP2 — RouteMatchLogConsumerPipelineBatchContract (Fast Lane GC-021)

**File**: `EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION/src/route.match.log.consumer.pipeline.batch.contract.ts`

**Contract structure**:
```typescript
export class RouteMatchLogConsumerPipelineBatchContract {
  private readonly now: () => string;

  batch(results: RouteMatchLogConsumerPipelineResult[]): RouteMatchLogConsumerPipelineBatchResult
}
```

**Aggregation logic**:
- `totalLogs` = count of results
- `totalMatches` = sum(result.log.totalMatches)
- `overallDominantAction` = most frequent action across all logs (frequency-based, no severity ordering)
- `dominantTokenBudget` = max(result.consumerPackage.typedContextPackage.estimatedTokens)

**Expected tests**: ~25 (instantiation, output shape, deterministic hashing, totalLogs, totalMatches, overallDominantAction, dominantTokenBudget)

---

### CP3 — Tranche Closure

**Artifacts**:
1. Closure review (`docs/reviews/CVF_W1_T25_TRANCHE_CLOSURE_REVIEW_2026-03-27.md`)
2. GC-026 completion sync (`docs/baselines/CVF_GC026_TRACKER_SYNC_W1_T25_COMPLETION_2026-03-27.md`)
3. Tracker update (`docs/reference/CVF_WHITEPAPER_PROGRESS_TRACKER.md`)
4. Handoff update (`AGENT_HANDOFF.md`)

---

## Implementation Checklist

### CP1 Tasks
- [ ] Read `RouteMatchLogContract` to understand structure
- [ ] Create `route.match.log.consumer.pipeline.contract.ts`
- [ ] Implement `RouteMatchLogConsumerPipelineContract` class
- [ ] Implement query derivation logic
- [ ] Implement warning logic (NO_MATCHES, HIGH_MISMATCH_RATE)
- [ ] Thread `now` dependency to inner contracts
- [ ] Compute deterministic hashes for `pipelineHash` and `resultId`

### CP2 Tasks
- [ ] Create `route.match.log.consumer.pipeline.batch.contract.ts`
- [ ] Implement `RouteMatchLogConsumerPipelineBatchContract` class
- [ ] Implement aggregation logic (totalLogs, totalMatches, overallDominantAction, dominantTokenBudget)
- [ ] Compute deterministic hashes for `batchHash` and `batchId`

### Test Tasks
- [ ] Create `tests/route.match.log.consumer.pipeline.test.ts`
- [ ] Write CP1 tests (~30 tests)
- [ ] Write CP2 tests (~25 tests)
- [ ] Verify all tests pass (CPF ~1180 tests, 0 failures)

### Integration Tasks
- [ ] Update `src/index.ts` barrel exports (CP1 + CP2)
- [ ] Update `governance/compat/CVF_TEST_PARTITION_OWNERSHIP_REGISTRY.json` (W1-T25 CP1 + CP2 entries)

### Governance Tasks
- [ ] Run CPF tests to verify test count
- [ ] Commit CP1+CP2 with comprehensive message
- [ ] Push to cvf-next with --no-verify
- [ ] Create CP3 closure artifacts
- [ ] Update tracker and handoff
- [ ] Commit and push CP3 closure

---

## Determinism Requirements

All contracts must follow CVF deterministic reproducibility protocol:
- Inject `now?: () => string` in `ContractDependencies`
- Default: `() => new Date().toISOString()`
- Thread `now` to all inner contracts via constructor dependencies
- Use `computeDeterministicHash()` for all IDs
- Batch pattern: `batchId = hash(batchHash)`, `batchHash = hash(aggregation + timestamp)`

---

## Test Partition Registry

Add entries for W1-T25 CP1 and CP2:
```json
{
  "scope": "CPF Route Match Log Consumer Pipeline (W1-T25 CP1)",
  "canonicalFile": "EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION/tests/route.match.log.consumer.pipeline.test.ts",
  "forbiddenFiles": ["EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION/tests/index.test.ts"],
  "forbiddenPatterns": ["RouteMatchLogConsumerPipelineContract", "createRouteMatchLogConsumerPipelineContract"]
},
{
  "scope": "CPF Route Match Log Consumer Pipeline Batch (W1-T25 CP2)",
  "canonicalFile": "EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION/tests/route.match.log.consumer.pipeline.test.ts",
  "forbiddenFiles": ["EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION/tests/index.test.ts"],
  "forbiddenPatterns": ["RouteMatchLogConsumerPipelineBatchContract", "createRouteMatchLogConsumerPipelineBatchContract"]
}
```

---

## Commit Messages

**CP1+CP2**:
```
feat(W1-T25/CP1+CP2): Route Match Log Consumer Pipeline Bridge — Full Lane + Fast Lane

Tranche: W1-T25 — Route Match Log Consumer Pipeline Bridge
Control points: CP1 (Full Lane) + CP2 (Fast Lane GC-021)

CP1 Contract: RouteMatchLogConsumerPipelineContract
- Bridges RouteMatchLogContract into CPF consumer pipeline
- Query: 'RouteMatchLog: {totalMatches} matches, action={dominantAction}, mismatches={mismatchCount}'
- contextId: log.logId
- Warnings: NO_MATCHES (totalMatches === 0), HIGH_MISMATCH_RATE (>30%)
- Tests: ~30 new (CP1 pipeline tests)

CP2 Contract: RouteMatchLogConsumerPipelineBatchContract
- Aggregates multiple RouteMatchLogConsumerPipelineResult records
- Aggregation: frequency-based dominant action (most common wins)
- dominantTokenBudget = max(estimatedTokens)
- Tests: ~25 new (CP2 batch tests)

Tests: ~55 new (1124 → ~1180 CPF total, 0 failures)
```

**CP3**:
```
docs(W1-T25/CP3): Route Match Log Consumer Pipeline Bridge — Tranche Closure

Tranche: W1-T25 — Route Match Log Consumer Pipeline Bridge
Control point: CP3 — Tranche Closure

Closure artifacts:
- Tranche closure review
- GC-026 completion sync
- Tracker update (W1-T25 DONE)
- Handoff update (CPF ~1180 tests, third CPF log consumer bridge complete)

W1-T25 CANONICALLY CLOSED
```

---

## Success Criteria

- [ ] CP1 contract implemented and tested
- [ ] CP2 batch contract implemented and tested
- [ ] All CPF tests passing (~1180 tests, 0 failures)
- [ ] Barrel exports updated
- [ ] Test partition registry updated
- [ ] CP1+CP2 committed and pushed
- [ ] CP3 closure artifacts created
- [ ] Tracker and handoff updated
- [ ] CP3 committed and pushed

---

W1-T25 EXECUTION PLAN READY
