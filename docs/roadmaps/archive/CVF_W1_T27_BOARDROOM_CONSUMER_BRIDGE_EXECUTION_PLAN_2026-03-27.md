# CVF W1-T27 Execution Plan — Boardroom Consumer Pipeline Bridge — 2026-03-27

Memory class: SUMMARY_RECORD
> Tranche: W1-T27 — Boardroom Consumer Pipeline Bridge
> GC-018 authorization: 10/10 (APPROVED)
> Execution date: 2026-03-27
> Branch: cvf-next

---

## Tranche Overview

W1-T27 delivers consumer pipeline visibility for `BoardroomContract`, completing the fifth CPF consumer bridge and enabling boardroom session consumption across planes.

---

## Control Point Execution Plan

### CP1 — BoardroomConsumerPipelineContract (Full Lane)

**Objective**: Bridge `BoardroomContract` into CPF consumer pipeline

**Implementation**:

1. **Create contract file**: `EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION/src/boardroom.consumer.pipeline.contract.ts`

2. **Contract structure**:
```typescript
export interface BoardroomConsumerPipelineRequest {
  boardroomSession: BoardroomSession;
  consumerId: string;
  consumerType: string;
}

export interface BoardroomConsumerPipelineResult {
  consumerId: string;
  consumerType: string;
  boardroomSession: BoardroomSession;
  consumerPackage: ControlPlaneConsumerPackage;
  query: string;
  contextId: string;
  warnings: string[];
}

export interface BoardroomConsumerPipelineContractDependencies {
  now?: () => string;
}

export class BoardroomConsumerPipelineContract {
  // Implementation
}
```

3. **Query derivation**:
```typescript
const totalRounds = boardroomSession.rounds?.length ?? 0;
const decision = boardroomSession.decision ?? "PENDING";
const clarificationCount = boardroomSession.clarifications?.length ?? 0;
const query = `BoardroomSession: ${totalRounds} rounds, decision=${decision}, clarifications=${clarificationCount}`;
```

4. **Warning logic**:
```typescript
const warnings: string[] = [];
if (totalRounds === 0) {
  warnings.push("WARNING_NO_ROUNDS");
}
const pendingClarifications = boardroomSession.clarifications?.filter(
  c => c.status === "PENDING"
) ?? [];
if (pendingClarifications.length > 0) {
  warnings.push("WARNING_PENDING_CLARIFICATIONS");
}
```

5. **contextId**: `boardroomSession.sessionId`

6. **Deterministic hash**: `computeDeterministicHash("w1-t27-cp1-boardroom-consumer-pipeline", consumerId, boardroomSession.sessionId, timestamp)`

7. **Inner contracts**: Thread `now` to `ControlPlaneConsumerPipelineContract` via dependencies

8. **Create test file**: `EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION/tests/boardroom.consumer.pipeline.test.ts`

9. **Test coverage** (~35 tests):
   - Instantiation
   - Output shape validation
   - consumerId propagation
   - Deterministic hash verification
   - Query derivation (various round counts, decisions, clarification counts)
   - contextId extraction (sessionId)
   - WARNING_NO_ROUNDS (totalRounds === 0)
   - WARNING_PENDING_CLARIFICATIONS (pending clarifications present)
   - No warnings (normal case)
   - boardroomSession propagation
   - consumerPackage structure
   - Deterministic `now` injection

10. **Update barrel exports**: `EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION/src/index.ts`

11. **Update test partition registry**: `governance/compat/CVF_TEST_PARTITION_OWNERSHIP_REGISTRY.json`

12. **Governance artifacts**:
    - Audit: `docs/audits/CVF_W1_T27_CP1_BOARDROOM_CONSUMER_PIPELINE_AUDIT_2026-03-27.md`
    - Review: `docs/reviews/CVF_GC019_W1_T27_CP1_BOARDROOM_CONSUMER_PIPELINE_REVIEW_2026-03-27.md`
    - Delta: `docs/baselines/CVF_W1_T27_CP1_BOARDROOM_CONSUMER_PIPELINE_DELTA_2026-03-27.md`
    - Execution plan update (this document)

13. **Commit and push**: CP1 implementation to cvf-next

---

### CP2 — BoardroomConsumerPipelineBatchContract (Fast Lane GC-021)

**Objective**: Aggregate multiple `BoardroomConsumerPipelineResult` records into a batch

**Implementation**:

1. **Create contract file**: `EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION/src/boardroom.consumer.pipeline.batch.contract.ts`

2. **Contract structure**:
```typescript
export interface BoardroomConsumerPipelineBatchResult {
  batchId: string;
  batchHash: string;
  timestamp: string;
  totalSessions: number;
  totalRounds: number;
  overallDominantDecision: BoardroomSessionDecision;
  totalClarifications: number;
  dominantTokenBudget: number;
  results: BoardroomConsumerPipelineResult[];
}

export interface BoardroomConsumerPipelineBatchContractDependencies {
  now?: () => string;
}

export class BoardroomConsumerPipelineBatchContract {
  // Implementation
}
```

3. **Aggregation logic**:
```typescript
const totalSessions = results.length;
const totalRounds = results.reduce((sum, r) => sum + (r.boardroomSession.rounds?.length ?? 0), 0);
const totalClarifications = results.reduce((sum, r) => sum + (r.boardroomSession.clarifications?.length ?? 0), 0);

// Frequency-based dominant decision
const decisionCounts = new Map<BoardroomSessionDecision, number>();
results.forEach(r => {
  const decision = r.boardroomSession.decision ?? "PENDING";
  decisionCounts.set(decision, (decisionCounts.get(decision) ?? 0) + 1);
});
const overallDominantDecision = selectDominantDecision(decisionCounts);

// Dominant token budget
const dominantTokenBudget = results.length === 0 ? 0 : Math.max(
  ...results.map(r => r.consumerPackage.typedContextPackage.estimatedTokens)
);
```

4. **Tie-break order**: APPROVED > REJECTED > NEEDS_CLARIFICATION > PENDING

5. **Deterministic hash**: 
   - `batchHash = computeDeterministicHash("w1-t27-cp2-boardroom-batch", totalSessions, totalRounds, overallDominantDecision, totalClarifications, dominantTokenBudget, timestamp)`
   - `batchId = computeDeterministicHash("w1-t27-cp2-boardroom-batch-id", batchHash)`

6. **Add tests to existing test file**: `EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION/tests/boardroom.consumer.pipeline.test.ts`

7. **Test coverage** (~28 tests):
   - Instantiation
   - Output shape validation
   - Deterministic hash verification
   - totalSessions calculation
   - totalRounds aggregation
   - totalClarifications aggregation
   - overallDominantDecision (frequency-based, various scenarios)
   - Tie-break order (APPROVED > REJECTED > NEEDS_CLARIFICATION > PENDING)
   - dominantTokenBudget (max selection)
   - Empty batch handling (dominantTokenBudget = 0)
   - Deterministic `now` injection

8. **Update barrel exports**: `EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION/src/index.ts`

9. **Governance artifacts**:
    - Audit: `docs/audits/CVF_W1_T27_CP2_BOARDROOM_CONSUMER_PIPELINE_BATCH_AUDIT_2026-03-27.md`
    - Review: `docs/reviews/CVF_GC021_W1_T27_CP2_BOARDROOM_CONSUMER_PIPELINE_BATCH_REVIEW_2026-03-27.md`
    - Delta: `docs/baselines/CVF_W1_T27_CP2_BOARDROOM_CONSUMER_PIPELINE_BATCH_DELTA_2026-03-27.md`
    - Execution plan update (this document)

10. **Commit and push**: CP2 implementation to cvf-next

---

### CP3 — Tranche Closure

**Objective**: Canonically close W1-T27 with full governance artifacts

**Implementation**:

1. **Create closure review**: `docs/reviews/CVF_W1_T27_TRANCHE_CLOSURE_REVIEW_2026-03-27.md`

2. **Create GC-026 completion sync**: `docs/baselines/CVF_GC026_TRACKER_SYNC_W1_T27_COMPLETION_2026-03-27.md`

3. **Update progress tracker**: `docs/reference/CVF_WHITEPAPER_PROGRESS_TRACKER.md`
   - Add W1-T27 to tranche tracker
   - Update active tranche to W1-T27
   - Update validation posture

4. **Update handoff**: `AGENT_HANDOFF.md`
   - Update test counts (CPF 1256 → ~1319)
   - Update last four tranches
   - Update key contracts
   - Update state
   - Update last push
   - Update guidance

5. **Commit and push**: CP3 closure artifacts to cvf-next

---

## Test Execution Plan

### Pre-CP1 Baseline
- CPF: 1256 tests, 0 failures (1 pre-existing failure in unrelated test)

### Post-CP1 Target
- CPF: ~1291 tests (+~35), 0 failures

### Post-CP2 Target
- CPF: ~1319 tests (+~63 total), 0 failures

### Test Commands
```bash
cd EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION && npm test
```

---

## Commit Strategy

### CP1 Commit
```
feat(W1-T27/CP1): BoardroomConsumerPipelineContract — Full Lane

Tranche: W1-T27 — Boardroom Consumer Pipeline Bridge
Control point: CP1 — BoardroomConsumerPipelineContract
Lane: Full Lane

Contract: Bridges BoardroomContract into CPF consumer pipeline
Tests: 35 new (1291 CPF total, 0 failures)
Governance artifacts: audit, review, delta, execution plan update
```

### CP2 Commit
```
feat(W1-T27/CP2): BoardroomConsumerPipelineBatchContract — Fast Lane (GC-021)

Tranche: W1-T27 — Boardroom Consumer Pipeline Bridge
Control point: CP2 — BoardroomConsumerPipelineBatchContract
Lane: Fast Lane (GC-021)

Contract: Aggregates BoardroomConsumerPipelineResult records into batch
Tests: 28 new (1319 CPF total, 0 failures)
Governance artifacts: audit, review, delta, execution plan update
```

### CP3 Commit
```
feat(W1-T27/CP3): W1-T27 closure artifacts — Closure

Tranche: W1-T27 — Boardroom Consumer Pipeline Bridge
Control point: CP3 — Closure
Lane: Closure

Artifacts: GC-026 completion sync, closure review, tracker update, handoff update
Tests: CPF 1319 tests (1256 → 1319, +63 tests, 0 failures)
Governance artifacts: GC-026 completion sync, closure review, tracker update, handoff update
```

---

## Risk Assessment

| Risk | Mitigation |
|------|------------|
| BoardroomSession structure complexity | Follow established consumer bridge pattern, comprehensive tests |
| Decision aggregation logic | Frequency-based with clear tie-break order |
| Clarification tracking | Test pending/resolved clarification scenarios |
| Multi-round handling | Test various round counts including zero |

---

## Success Criteria

- [x] GC-018 authorization (10/10)
- [ ] CP1 contract implemented and tested (~35 tests)
- [ ] CP2 batch contract implemented and tested (~28 tests)
- [ ] All CPF tests passing (1319 total, 0 failures)
- [ ] Barrel exports updated
- [ ] Test partition registry updated
- [ ] All governance artifacts created
- [ ] Commits pushed to cvf-next
- [ ] Tracker and handoff updated

---

## Execution Status

- [x] GC-018 authorization
- [x] GC-026 authorization sync
- [x] Execution plan created
- [ ] CP1 implementation
- [ ] CP2 implementation
- [ ] CP3 closure

W1-T27 EXECUTION PLAN — BOARDROOM CONSUMER PIPELINE BRIDGE
