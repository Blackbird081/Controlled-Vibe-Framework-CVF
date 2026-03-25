# CVF W1-T21 Execution Plan — Clarification Refinement Consumer Pipeline Bridge

Memory class: SUMMARY_RECORD

> Tranche: W1-T21
> Date: 2026-03-25
> Branch: `cvf-next`

---

## Tranche Goal

Bridge `ClarificationRefinementContract` into the CPF consumer pipeline, closing the reverse-prompting loop and surfacing the `confidenceBoost` governance-quality signal. The clarification refinement contract takes a `ReversePromptPacket` and `ClarificationAnswer[]`, producing a `RefinedIntakeRequest` with `confidenceBoost` (0.0–1.0), enrichments, and answered/skipped counts. This bridge makes the clarification quality outcome consumer-visible and enrichable.

---

## CP1 — Full Lane

### Artifacts
- `EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION/src/clarification.refinement.consumer.pipeline.contract.ts`
- `EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION/tests/clarification.refinement.consumer.pipeline.test.ts`
- `docs/audits/CVF_W1_T21_CP1_CLARIFICATION_REFINEMENT_CONSUMER_PIPELINE_AUDIT_2026-03-25.md`
- `docs/reviews/CVF_GC019_W1_T21_CP1_CLARIFICATION_REFINEMENT_CONSUMER_PIPELINE_REVIEW_2026-03-25.md`
- `docs/baselines/CVF_W1_T21_CP1_CLARIFICATION_REFINEMENT_CONSUMER_PIPELINE_DELTA_2026-03-25.md`
- CPF `src/index.ts` barrel export block prepended
- `CVF_TEST_PARTITION_OWNERSHIP_REGISTRY.json` entry added

### Contract Design

```
Input:   ReversePromptPacket + ClarificationAnswer[]
Step 1:  ClarificationRefinementContract.refine(packet, answers) → RefinedIntakeRequest
Step 2:  query = `clarification-refinement:confidence:${confidenceBoost.toFixed(2)}:answered:${answeredCount}`.slice(0, 120)
         contextId = refinedRequest.refinedId
Step 3:  ControlPlaneConsumerPipelineContract.execute({ rankingRequest: { query, contextId, ... } })
Step 4:  warnings:
           confidenceBoost === 0         → "[clarification] no answers applied — refinement yielded no confidence boost"
           0 < confidenceBoost < 0.5     → "[clarification] low confidence refinement — insufficient answers applied"
Output:  ClarificationRefinementConsumerPipelineResult { resultId, createdAt, consumerId?, refinedRequest, consumerPackage, pipelineHash, warnings }
```

---

## CP2 — Fast Lane (GC-021)

### Artifacts
- `EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION/src/clarification.refinement.consumer.pipeline.batch.contract.ts`
- `EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION/tests/clarification.refinement.consumer.pipeline.batch.test.ts`
- `docs/audits/CVF_W1_T21_CP2_CLARIFICATION_REFINEMENT_CONSUMER_PIPELINE_BATCH_AUDIT_2026-03-25.md`
- `docs/reviews/CVF_GC021_W1_T21_CP2_CLARIFICATION_REFINEMENT_CONSUMER_PIPELINE_BATCH_REVIEW_2026-03-25.md`
- `docs/baselines/CVF_W1_T21_CP2_CLARIFICATION_REFINEMENT_CONSUMER_PIPELINE_BATCH_DELTA_2026-03-25.md`
- CPF `src/index.ts` barrel export block updated
- `CVF_TEST_PARTITION_OWNERSHIP_REGISTRY.json` entry added

### Contract Design

```
Input:   ClarificationRefinementConsumerPipelineResult[]
Fields:  lowConfidenceCount = results where refinedRequest.confidenceBoost < 0.5
         dominantTokenBudget = Math.max(typedContextPackage.estimatedTokens); 0 for empty
         batchId = hash(batchHash); batchId !== batchHash
Output:  ClarificationRefinementConsumerPipelineBatch { batchId, createdAt, results, totalResults, dominantTokenBudget, lowConfidenceCount, batchHash }
```

---

## CP3 — Closure

### Artifacts
- `docs/reviews/CVF_W1_T21_TRANCHE_CLOSURE_REVIEW_2026-03-25.md`
- `docs/baselines/CVF_GC026_TRACKER_SYNC_W1_T21_CLOSURE_2026-03-25.md`
- `docs/roadmaps/CVF_WHITEPAPER_COMPLETION_ROADMAP_2026-03-21.md` updated
- `AGENT_HANDOFF.md` updated

---

## Status Log

| CP | Status |
|---|---|
| GC-018 + GC-026 auth | DONE |
| CP1 | DONE — 29 tests, CPF 926 |
| CP2 | DONE — 19 tests, CPF 945 |
| CP3 | DONE — tranche closed |
