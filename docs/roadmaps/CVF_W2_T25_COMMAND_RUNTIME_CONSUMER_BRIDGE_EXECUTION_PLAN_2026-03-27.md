# CVF W2-T25 Command Runtime Consumer Bridge — Execution Plan

Memory class: SUMMARY_RECORD

> Date: 2026-03-27
> Tranche: W2-T25 — Command Runtime Consumer Pipeline Bridge
> Authorization: `docs/reviews/CVF_GC018_CONTINUATION_CANDIDATE_W2_T25_COMMAND_RUNTIME_CONSUMER_BRIDGE_2026-03-27.md` (10/10)
> Architecture baseline: `docs/reference/CVF_MASTER_ARCHITECTURE_WHITEPAPER.md` (v2.2-W4T11)
> Test baseline: EPF 902 tests, 0 failures
> Target: EPF ~970 tests, 0 failures

---

## Control Point Sequence

### CP1 — CommandRuntimeConsumerPipelineContract (Full Lane)

**Objective**: Create consumer-visible pipeline for command runtime results

**Deliverables**:
1. Contract: `EXTENSIONS/CVF_EXECUTION_PLANE_FOUNDATION/src/command.runtime.consumer.pipeline.contract.ts`
2. Test: `EXTENSIONS/CVF_EXECUTION_PLANE_FOUNDATION/tests/command.runtime.consumer.pipeline.contract.test.ts`
3. Partition entry: `governance/compat/CVF_TEST_PARTITION_OWNERSHIP_REGISTRY.json`
4. Export: `EXTENSIONS/CVF_EXECUTION_PLANE_FOUNDATION/src/index.ts`
5. Audit: `docs/audits/CVF_W2_T25_CP1_COMMAND_RUNTIME_CONSUMER_PIPELINE_AUDIT_2026-03-27.md`
6. Review: `docs/reviews/CVF_GC019_W2_T25_CP1_COMMAND_RUNTIME_CONSUMER_PIPELINE_REVIEW_2026-03-27.md`
7. Delta: `docs/baselines/CVF_W2_T25_CP1_COMMAND_RUNTIME_CONSUMER_PIPELINE_DELTA_2026-03-27.md`

**Contract Signature**:
```typescript
Input: PolicyGateResult
Output: {
  runtimeResult: CommandRuntimeResult;
  consumerPackage: {
    packageId: string;
    contextId: string; // = runtimeResult.runtimeId
    typedContextPackage: TypedContextPackage;
    packageHash: string;
  };
  pipelineHash: string;
}
```

**Implementation Notes**:
- Query derivation: extract from `runtimeResult.summary` (max 120 chars)
- Thread `now` dependency to inner `CommandRuntimeContract`
- Thread `now` dependency to inner `ControlPlaneConsumerPipelineContract`
- Deterministic hash: `computeDeterministicHash("w2-t25-cp1-command-runtime-consumer-pipeline", ...)`
- contextId = runtimeResult.runtimeId

**Test Coverage**:
- Empty gate result
- Single task execution (each RuntimeExecutionStatus)
- Multiple tasks with execution counts
- Query derivation (max 120 chars)
- Deterministic hash reproducibility
- Consumer package structure validation
- Estimated: ~35 tests

**Status**: ✅ COMPLETE

**Actual Results**:
- Tests: 39 tests (EPF 902 → 941, 0 failures)
- Audit: APPROVED
- Review: APPROVED
- Commit: READY

---

### CP2 — CommandRuntimeConsumerPipelineBatchContract (Fast Lane GC-021)

**Objective**: Aggregate multiple command runtime consumer pipeline results

**Deliverables**:
1. Contract: `EXTENSIONS/CVF_EXECUTION_PLANE_FOUNDATION/src/command.runtime.consumer.pipeline.batch.contract.ts`
2. Tests: add to `tests/command.runtime.consumer.pipeline.contract.test.ts`
3. Export: `EXTENSIONS/CVF_EXECUTION_PLANE_FOUNDATION/src/index.ts`
4. Audit: `docs/audits/CVF_W2_T25_CP2_COMMAND_RUNTIME_CONSUMER_PIPELINE_BATCH_AUDIT_2026-03-27.md`
5. Review: `docs/reviews/CVF_GC021_W2_T25_CP2_COMMAND_RUNTIME_CONSUMER_PIPELINE_BATCH_REVIEW_2026-03-27.md`
6. Delta: `docs/baselines/CVF_W2_T25_CP2_COMMAND_RUNTIME_CONSUMER_PIPELINE_BATCH_DELTA_2026-03-27.md`

**Contract Signature**:
```typescript
Input: CommandRuntimeConsumerPipelineResult[]
Output: {
  batchId: string;
  createdAt: string;
  totalResults: number;
  dominantTokenBudget: number; // max across all results
  executedCount: number; // sum across all runtime results
  sandboxedCount: number;
  skippedCount: number;
  failedCount: number;
  batchHash: string;
}
```

**Implementation Notes**:
- `dominantTokenBudget = Math.max(...results.map(r => r.consumerPackage.typedContextPackage.estimatedTokens))`
- Empty batch: `dominantTokenBudget = 0`, valid hash
- Aggregate execution counts from all runtime results
- Deterministic hash: `computeDeterministicHash("w2-t25-cp2-command-runtime-consumer-pipeline-batch", ...)`
- `batchId = computeDeterministicHash("w2-t25-cp2-batch-id", batchHash, createdAt)`

**Test Coverage**:
- Empty batch
- Single result
- Multiple results with dominantTokenBudget derivation
- Execution count aggregation
- Deterministic hash reproducibility
- Estimated: ~30 tests

**Status**: PENDING

---

### CP3 — Tranche Closure Review (Full Lane)

**Objective**: Verify tranche completion and governance compliance

**Deliverables**:
1. Closure review: `docs/reviews/CVF_W2_T25_TRANCHE_CLOSURE_REVIEW_2026-03-27.md`
2. GC-026 closure sync: `docs/baselines/CVF_GC026_TRACKER_SYNC_W2_T25_CLOSURE_2026-03-27.md`
3. Whitepaper tracker sync: `docs/baselines/CVF_WHITEPAPER_TRACKER_SYNC_W2_T25_CLOSURE_2026-03-27.md`
4. Progress tracker update: `docs/reference/CVF_WHITEPAPER_PROGRESS_TRACKER.md`
5. Handoff update: `AGENT_HANDOFF.md`

**Verification Checklist**:
- [ ] All tests pass (EPF ~970 tests, 0 failures)
- [ ] All contracts exported from `src/index.ts`
- [ ] Partition entry added to registry
- [ ] All audit docs complete (CP1 Full Lane, CP2 Fast Lane)
- [ ] All review docs complete (CP1 GC-019, CP2 GC-021)
- [ ] All delta docs complete
- [ ] Execution plan updated after each CP
- [ ] Deterministic hash reproducibility verified
- [ ] Query derivation validated (max 120 chars)
- [ ] Batch aggregation logic validated
- [ ] Memory governance compliance (all docs in correct class)

**Success Criteria**:
- EPF test count: 902 → ~970 (+~68 tests, 0 failures)
- First EPF core runtime consumer bridge delivered
- W2-T3 defer record closed (runtime now consumer-visible)
- Execution runtime consumer-visible

**Status**: PENDING

---

## Next Immediate Action

Execute CP1 — CommandRuntimeConsumerPipelineContract (Full Lane)
