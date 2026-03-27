# CVF W4-T15 Learning Reinjection Consumer Bridge — Execution Plan

Memory class: SUMMARY_RECORD

> Date: 2026-03-27
> Tranche: W4-T15 — Learning Reinjection Consumer Pipeline Bridge
> Authorization: `docs/reviews/CVF_GC018_CONTINUATION_CANDIDATE_W4_T15_LEARNING_REINJECTION_CONSUMER_BRIDGE_2026-03-27.md` (10/10)
> Architecture baseline: `docs/reference/CVF_MASTER_ARCHITECTURE_WHITEPAPER.md` (v2.2-W4T11)
> Test baseline: LPF 835 tests, 0 failures
> Target: LPF ~900 tests, 0 failures

---

## Control Point Sequence

### CP1 — LearningReinjectionConsumerPipelineContract (Full Lane)

**Objective**: Create consumer-visible pipeline for learning reinjection results

**Deliverables**:
1. Contract: `EXTENSIONS/CVF_LEARNING_PLANE_FOUNDATION/src/learning.reinjection.consumer.pipeline.contract.ts`
2. Test: `EXTENSIONS/CVF_LEARNING_PLANE_FOUNDATION/tests/learning.reinjection.consumer.pipeline.test.ts`
3. Partition entry: `governance/compat/CVF_TEST_PARTITION_OWNERSHIP_REGISTRY.json`
4. Export: `EXTENSIONS/CVF_LEARNING_PLANE_FOUNDATION/src/index.ts`
5. Audit: `docs/audits/CVF_W4_T15_CP1_LEARNING_REINJECTION_CONSUMER_PIPELINE_AUDIT_2026-03-27.md`
6. Review: `docs/reviews/CVF_GC019_W4_T15_CP1_LEARNING_REINJECTION_CONSUMER_PIPELINE_REVIEW_2026-03-27.md`
7. Delta: `docs/baselines/CVF_W4_T15_CP1_LEARNING_REINJECTION_CONSUMER_PIPELINE_DELTA_2026-03-27.md`

**Contract Signature**:
```typescript
Input: LearningReinjectionConsumerPipelineRequest {
  signal: GovernanceSignal;
  candidateItems?: RankableKnowledgeItem[];
  scoringWeights?: ScoringWeights;
  segmentTypeConstraints?: SegmentTypeConstraints;
  consumerId?: string;
}

Output: LearningReinjectionConsumerPipelineResult {
  resultId: string;
  createdAt: string;
  reinjectionResult: LearningReinjectionResult;
  consumerPackage: ControlPlaneConsumerPackage;
  pipelineHash: string;
  warnings: string[];
  consumerId: string | undefined;
}
```

**Implementation Notes**:
- Query derivation: `"Reinjection: " + reinjectionResult.sourceSignalType + " → " + reinjectionResult.feedbackInput.feedbackClass` (max 120 chars)
- Thread `now` dependency to inner `LearningReinjectionContract`
- Thread `now` dependency to inner `ControlPlaneConsumerPipelineContract`
- Deterministic hash: `computeDeterministicHash("w4-t15-cp1-learning-reinjection-consumer-pipeline", ...)`
- contextId = reinjectionResult.reinjectionId
- Warnings:
  - `feedbackInput.feedbackClass === "REJECT"` → `WARNING_REJECT`
  - `feedbackInput.feedbackClass === "ESCALATE"` → `WARNING_ESCALATE`

**Test Coverage**:
- Instantiation (3 tests)
- Output shape (7 tests)
- consumerId propagation (3 tests)
- Deterministic hashing (4 tests)
- Query derivation (4 tests: ESCALATE, TRIGGER_REVIEW, MONITOR, NO_ACTION)
- Warning messages (4 tests: REJECT, ESCALATE, RETRY, ACCEPT)
- Reinjection result propagation (6 tests)
- Consumer package shape (4 tests)
- Estimated: ~35 tests

**Status**: ✅ COMPLETE

**Actual Results**:
- Tests: 35 tests (LPF 835 → 870, 0 failures)
- Audit: APPROVED
- Review: APPROVED
- Commit: READY

---

### CP2 — LearningReinjectionConsumerPipelineBatchContract (Fast Lane GC-021)

**Objective**: Aggregate multiple learning reinjection consumer pipeline results

**Deliverables**:
1. Contract: `EXTENSIONS/CVF_LEARNING_PLANE_FOUNDATION/src/learning.reinjection.consumer.pipeline.batch.contract.ts`
2. Tests: add to `tests/learning.reinjection.consumer.pipeline.test.ts`
3. Export: `EXTENSIONS/CVF_LEARNING_PLANE_FOUNDATION/src/index.ts`
4. Audit: `docs/audits/CVF_W4_T15_CP2_LEARNING_REINJECTION_CONSUMER_PIPELINE_BATCH_AUDIT_2026-03-27.md`
5. Review: `docs/reviews/CVF_GC021_W4_T15_CP2_LEARNING_REINJECTION_CONSUMER_PIPELINE_BATCH_REVIEW_2026-03-27.md`
6. Delta: `docs/baselines/CVF_W4_T15_CP2_LEARNING_REINJECTION_CONSUMER_PIPELINE_BATCH_DELTA_2026-03-27.md`

**Contract Signature**:
```typescript
Input: LearningReinjectionConsumerPipelineResult[]

Output: LearningReinjectionConsumerPipelineBatchResult {
  batchId: string;
  createdAt: string;
  totalResults: number;
  dominantTokenBudget: number; // max across all results
  rejectCount: number; // count of REJECT feedback
  escalateCount: number; // count of ESCALATE feedback
  retryCount: number; // count of RETRY feedback
  acceptCount: number; // count of ACCEPT feedback
  batchHash: string;
}
```

**Implementation Notes**:
- `dominantTokenBudget = Math.max(...results.map(r => r.consumerPackage.typedContextPackage.estimatedTokens))`
- Empty batch: `dominantTokenBudget = 0`, valid hash
- Feedback class counts: count occurrences of each feedbackClass
- Deterministic hash: `computeDeterministicHash("w4-t15-cp2-learning-reinjection-consumer-pipeline-batch", ...)`
- `batchId = computeDeterministicHash("w4-t15-cp2-batch-id", batchHash)`

**Test Coverage**:
- Instantiation (3 tests)
- Output shape (5 tests)
- Empty batch (4 tests)
- Single result (3 tests)
- Multiple results with dominantTokenBudget derivation (6 tests)
- Feedback class count aggregation (4 tests)
- Deterministic hash reproducibility (3 tests)
- Mixed feedback classes (2 tests)
- Estimated: ~30 tests

**Status**: ✅ COMPLETE

**Actual Results**:
- Tests: 26 tests (LPF 870 → 896, 0 failures)
- Audit: APPROVED
- Review: APPROVED
- Commit: READY

---

### CP3 — Tranche Closure Review (Full Lane)

**Objective**: Verify tranche completion and governance compliance

**Deliverables**:
1. Closure review: `docs/reviews/CVF_W4_T15_TRANCHE_CLOSURE_REVIEW_2026-03-27.md`
2. GC-026 closure sync: `docs/baselines/CVF_GC026_TRACKER_SYNC_W4_T15_CLOSURE_2026-03-27.md`
3. Whitepaper tracker sync: `docs/baselines/CVF_WHITEPAPER_TRACKER_SYNC_W4_T15_CLOSURE_2026-03-27.md`
4. Progress tracker update: `docs/reference/CVF_WHITEPAPER_PROGRESS_TRACKER.md`
5. Handoff update: `AGENT_HANDOFF.md`

**Verification Checklist**:
- [ ] All tests pass (LPF ~900 tests, 0 failures)
- [ ] All contracts exported from `src/index.ts`
- [ ] Partition entries added to registry
- [ ] All audit docs complete (CP1 Full Lane, CP2 Fast Lane)
- [ ] All review docs complete (CP1 GC-019, CP2 GC-021)
- [ ] All delta docs complete
- [ ] Execution plan updated after each CP
- [ ] Deterministic hash reproducibility verified
- [ ] Query derivation validated (max 120 chars)
- [ ] Batch aggregation logic validated
- [ ] Memory governance compliance (all docs in correct class)

**Success Criteria**:
- LPF test count: 835 → ~900 (+~65 tests, 0 failures)
- Eighth LPF consumer bridge delivered
- Learning reinjection consumer-visible
- Signal → feedback mapping traceable

**Status**: PENDING

---

## Next Immediate Action

Execute CP1 — LearningReinjectionConsumerPipelineContract (Full Lane)

