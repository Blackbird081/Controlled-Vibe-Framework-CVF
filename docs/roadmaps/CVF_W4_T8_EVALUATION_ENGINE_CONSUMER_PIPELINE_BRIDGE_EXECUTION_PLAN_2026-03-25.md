# CVF W4-T8 Execution Plan — Evaluation Engine Consumer Pipeline Bridge

Memory class: SUMMARY_RECORD

> Date: 2026-03-25
> Tranche: W4-T8 — Evaluation Engine Consumer Pipeline Bridge
> Authorization: GC-018 score 10/10
> Authorization source: docs/reviews/CVF_GC018_CONTINUATION_CANDIDATE_W4_T8_EVALUATION_ENGINE_CONSUMER_BRIDGE_2026-03-25.md

---

## Objective

Bridge `EvaluationEngineContract` (LPF, W4-T3 CP1) into the CPF consumer pipeline. Surfaces the evaluation verdict, severity, and confidence level as governed consumer-visible output. Closes the final high-value unbridged LPF aggregate contract gap.

---

## Contract Chain

```
TruthModel
  → EvaluationEngineContract.evaluate()
  → EvaluationResult { verdict, severity, confidenceLevel, rationale, evaluationHash }
  → ControlPlaneConsumerPipelineContract.execute()
  → ControlPlaneConsumerPackage
  → EvaluationEngineConsumerPipelineResult
```

---

## CP1 — Full Lane (GC-019)

### Contract: EvaluationEngineConsumerPipelineContract

Location: `EXTENSIONS/CVF_LEARNING_PLANE_FOUNDATION/src/evaluation.engine.consumer.pipeline.contract.ts`

Fields:
- `query`: `"evaluation-engine:verdict:${verdict}:severity:${severity}:confidence:${confidenceLevel.toFixed(2)}"` capped at 120 chars
- `contextId`: `evaluationResult.sourceTruthModelId`
- `evaluationResult`: full `EvaluationResult`
- `consumerPackage`: `ControlPlaneConsumerPackage`
- `pipelineHash`: `computeDeterministicHash("w4-t8-cp1-evaluation-engine-consumer-pipeline", evaluationResult.evaluationHash, consumerPackage.pipelineHash, createdAt)`
- `resultId`: `computeDeterministicHash("w4-t8-cp1-result-id", pipelineHash)` — distinct from pipelineHash
- `warnings`: array of strings

Warnings:
- `verdict === "FAIL"` → `"[evaluation-engine] evaluation failed — governed intervention required"`
- `verdict === "INCONCLUSIVE"` → `"[evaluation-engine] evaluation inconclusive — insufficient learning data"`
- `verdict === "PASS"` or `"WARN"` → no warning

Test file: `EXTENSIONS/CVF_LEARNING_PLANE_FOUNDATION/tests/evaluation.engine.consumer.pipeline.test.ts`
Partition entry: `LPF EvaluationEngine Consumer Pipeline`

Artifacts:
- Audit: `docs/audits/CVF_W4_T8_CP1_EVALUATION_ENGINE_CONSUMER_PIPELINE_AUDIT_2026-03-25.md`
- Review: `docs/reviews/CVF_GC019_W4_T8_CP1_EVALUATION_ENGINE_CONSUMER_PIPELINE_REVIEW_2026-03-25.md`
- Delta: `docs/baselines/CVF_W4_T8_CP1_EVALUATION_ENGINE_CONSUMER_PIPELINE_DELTA_2026-03-25.md`

---

## CP2 — Fast Lane (GC-021)

### Contract: EvaluationEngineConsumerPipelineBatchContract

Location: `EXTENSIONS/CVF_LEARNING_PLANE_FOUNDATION/src/evaluation.engine.consumer.pipeline.batch.contract.ts`

Fields:
- `failCount`: results where `evaluationResult.verdict === "FAIL"`
- `inconclusiveCount`: results where `evaluationResult.verdict === "INCONCLUSIVE"`
- `dominantTokenBudget`: `Math.max(estimatedTokens)`; 0 for empty
- `batchHash`: `computeDeterministicHash("w4-t8-cp2-evaluation-engine-consumer-pipeline-batch", ...pipelineHashes, createdAt)`
- `batchId`: `computeDeterministicHash("w4-t8-cp2-batch-id", batchHash)` — distinct from batchHash

Test file: `EXTENSIONS/CVF_LEARNING_PLANE_FOUNDATION/tests/evaluation.engine.consumer.pipeline.batch.test.ts`
Partition entry: `LPF EvaluationEngine Consumer Pipeline Batch`

Artifacts:
- Audit: `docs/audits/CVF_W4_T8_CP2_EVALUATION_ENGINE_CONSUMER_PIPELINE_BATCH_AUDIT_2026-03-25.md`
- Review: `docs/reviews/CVF_GC021_W4_T8_CP2_EVALUATION_ENGINE_CONSUMER_PIPELINE_BATCH_REVIEW_2026-03-25.md`
- Delta: `docs/baselines/CVF_W4_T8_CP2_EVALUATION_ENGINE_CONSUMER_PIPELINE_BATCH_DELTA_2026-03-25.md`

---

## CP3 — Closure Review

Artifacts:
- Closure review: `docs/reviews/CVF_W4_T8_TRANCHE_CLOSURE_REVIEW_2026-03-25.md`
- GC-026 closure sync: `docs/baselines/CVF_GC026_TRACKER_SYNC_W4_T8_CLOSURE_2026-03-25.md`
- Progress tracker update
- Roadmap post-cycle record
- AGENT_HANDOFF update
- Push to `cvf-next`

---

## Status Log

| CP | Status |
|---|---|
| GC-018 + GC-026 auth | DONE |
| CP1 | PENDING |
| CP2 | PENDING |
| CP3 | PENDING |
