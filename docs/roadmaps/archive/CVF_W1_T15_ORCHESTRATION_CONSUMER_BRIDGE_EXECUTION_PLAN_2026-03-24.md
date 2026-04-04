# CVF W1-T15 Execution Plan — Control Plane Orchestration Consumer Bridge

Memory class: SUMMARY_RECORD
> Date: 2026-03-24
> Authorization: `docs/reviews/CVF_GC018_CONTINUATION_CANDIDATE_W1_T15_2026-03-24.md` (GC-018: 10/10)
> Branch: `cvf-next`

---

## Tranche Summary

**W1-T15 — Control Plane Orchestration Consumer Bridge**

Closes the last CPF orchestration gap: `OrchestrationContract` (W1-T3/CP3) produces `OrchestrationResult` but has no governed consumer-visible package path. This tranche bridges `DesignPlan → OrchestrationResult → ControlPlaneConsumerPackage` using the same consumer pipeline pattern established in W1-T13 and W1-T14.

Gap closed: W1-T3 implied gap — orchestration assignments have no consumer-enriched output path.

---

## Contract Design

### CP1 — OrchestrationConsumerPipelineContract (Full Lane)

**Input:** `OrchestrationConsumerPipelineRequest`
```
{
  plan: DesignPlan
  candidateItems?: RankableKnowledgeItem[]
  scoringWeights?: ScoringWeights
  segmentTypeConstraints?: SegmentTypeConstraints
  consumerId?: string
}
```

**Chain:**
1. OrchestrationContract.orchestrate(plan) → OrchestrationResult
2. ControlPlaneConsumerPipelineContract.execute({ rankingRequest: { query, contextId, candidateItems, scoringWeights }, segmentTypeConstraints }) → ControlPlaneConsumerPackage
   - query: derived from `plan.vibeOriginal` (normalized, first 120 chars)
   - contextId: `orchestrationResult.orchestrationId`

**Output:** `OrchestrationConsumerPipelineResult`
```
{
  resultId: string
  createdAt: string
  consumerId?: string
  orchestrationResult: OrchestrationResult
  consumerPackage: ControlPlaneConsumerPackage
  pipelineHash: string
  warnings: string[]
}
```

### CP2 — OrchestrationConsumerPipelineBatchContract (Fast Lane GC-021)

**Input:** `OrchestrationConsumerPipelineResult[]`

**Output:** `OrchestrationConsumerPipelineBatch`
```
{
  batchId: string
  createdAt: string
  totalResults: number
  results: OrchestrationConsumerPipelineResult[]
  dominantTokenBudget: number   // Math.max of consumerPackage.typedContextPackage.estimatedTokens
  batchHash: string
}
```

- empty batch → dominantTokenBudget = 0, valid hash
- batchId ≠ batchHash (batchId = hash of batchHash only)

---

## Control Points

| CP | Description | Lane | Artifacts |
|---|---|---|---|
| CP1 | OrchestrationConsumerPipelineContract | Full Lane | contract + test + audit + review + delta + exec plan update + test log update + commit |
| CP2 | OrchestrationConsumerPipelineBatchContract | Fast Lane (GC-021) | contract + test + audit + review + delta + exec plan update + test log update + commit |
| CP3 | Tranche closure review | Full Lane | closure doc + roadmap update + tracker update + GC-026 closure sync + AGENT_HANDOFF update + commit |

---

## File Checklist

### New source files
- [ ] `EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION/src/orchestration.consumer.pipeline.contract.ts`
- [ ] `EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION/src/orchestration.consumer.pipeline.batch.contract.ts`

### New test files (GC-023 — dedicated, never appended to index.test.ts)
- [ ] `EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION/tests/orchestration.consumer.pipeline.test.ts`
- [ ] `EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION/tests/orchestration.consumer.pipeline.batch.test.ts`

### Updated files
- [ ] `EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION/src/index.ts` (barrel exports)
- [ ] `governance/compat/CVF_TEST_PARTITION_OWNERSHIP_REGISTRY.json` (2 new partition entries)
- [ ] `docs/CVF_INCREMENTAL_TEST_LOG.md`
- [ ] `docs/roadmaps/CVF_WHITEPAPER_COMPLETION_ROADMAP_2026-03-21.md`
- [ ] `docs/reference/CVF_WHITEPAPER_PROGRESS_TRACKER.md`
- [ ] `AGENT_HANDOFF.md`

### Governance docs
- [ ] `docs/audits/CVF_W1_T15_CP1_ORCHESTRATION_CONSUMER_PIPELINE_AUDIT_2026-03-24.md`
- [ ] `docs/reviews/CVF_GC019_W1_T15_CP1_ORCHESTRATION_CONSUMER_PIPELINE_REVIEW_2026-03-24.md`
- [ ] `docs/baselines/CVF_W1_T15_CP1_ORCHESTRATION_CONSUMER_PIPELINE_DELTA_2026-03-24.md`
- [ ] `docs/audits/CVF_W1_T15_CP2_ORCHESTRATION_CONSUMER_PIPELINE_BATCH_AUDIT_2026-03-24.md`
- [ ] `docs/reviews/CVF_GC021_W1_T15_CP2_ORCHESTRATION_CONSUMER_PIPELINE_BATCH_REVIEW_2026-03-24.md`
- [ ] `docs/baselines/CVF_W1_T15_CP2_ORCHESTRATION_CONSUMER_PIPELINE_BATCH_DELTA_2026-03-24.md`
- [ ] `docs/reviews/CVF_W1_T15_TRANCHE_CLOSURE_REVIEW_2026-03-24.md`
- [ ] `docs/baselines/CVF_GC026_TRACKER_SYNC_W1_T15_CLOSURE_2026-03-24.md`

---

## Status

| CP | Status |
|---|---|
| CP1 | DONE |
| CP2 | DONE |
| CP3 | DONE |
