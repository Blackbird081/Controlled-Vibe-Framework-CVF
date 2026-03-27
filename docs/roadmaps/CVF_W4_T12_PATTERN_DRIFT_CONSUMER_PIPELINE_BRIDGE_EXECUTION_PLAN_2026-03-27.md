# CVF Execution Plan — W4-T12 PatternDrift Consumer Pipeline Bridge

Memory class: SUMMARY_RECORD

> Date: 2026-03-27
> Tranche: W4-T12
> Authorization: GC-018 score 9/10

---

## Objective

Bridge `PatternDriftContract` into the CPF consumer pipeline, making pattern drift signals (CRITICAL_DRIFT/DRIFTING/STABLE) consumer-visible with governed query formation, deterministic hashing, and warning generation.

---

## Chain

```
TruthModel (baseline) + TruthModel (current)
  → PatternDriftContract.detect()
  → PatternDriftSignal { driftId, driftClass, driftRationale, patternChanged, healthSignalChanged, confidenceDelta, driftHash }
  → ControlPlaneConsumerPipelineContract.execute()
  → ControlPlaneConsumerPackage
  → PatternDriftConsumerPipelineResult
```

---

## CP1 — Full Lane (GC-019)

**Contract**: `PatternDriftConsumerPipelineContract`
**File**: `EXTENSIONS/CVF_LEARNING_PLANE_FOUNDATION/src/pattern.drift.consumer.pipeline.contract.ts`
**Tests**: `EXTENSIONS/CVF_LEARNING_PLANE_FOUNDATION/tests/pattern.drift.consumer.pipeline.test.ts`

**Query format** (capped at 120 chars):
```
pattern-drift:class:${driftClass}:baseline:${baselineModelId}:current:${currentModelId}
```

**contextId**: `driftResult.driftId`

**Warnings**:
- `CRITICAL_DRIFT` → `"[pattern-drift] critical drift detected — immediate re-evaluation required"`
- `DRIFTING` → `"[pattern-drift] drift detected — model change requires monitoring"`
- `STABLE` → no warning

**Seeds**:
- pipelineHash: `w4-t12-cp1-pattern-drift-consumer-pipeline`
- resultId: `w4-t12-cp1-result-id`

**Target tests**: ~32

---

## CP2 — Fast Lane (GC-021)

**Contract**: `PatternDriftConsumerPipelineBatchContract`
**File**: `EXTENSIONS/CVF_LEARNING_PLANE_FOUNDATION/src/pattern.drift.consumer.pipeline.batch.contract.ts`
**Tests**: `EXTENSIONS/CVF_LEARNING_PLANE_FOUNDATION/tests/pattern.drift.consumer.pipeline.batch.test.ts`

**Batch fields**:
- `criticalDriftCount` = results where `driftResult.driftClass === "CRITICAL_DRIFT"`
- `driftingCount` = results where `driftResult.driftClass === "DRIFTING"`
- `dominantTokenBudget` = `Math.max(estimatedTokens)`; 0 for empty
- `batchId` ≠ `batchHash`

**Seeds**:
- batchHash: `w4-t12-cp2-pattern-drift-consumer-pipeline-batch`
- batchId: `w4-t12-cp2-batch-id`

**Target tests**: ~28

---

## CP3 — Closure

- Tranche closure review
- GC-026 tracker sync note (closure)
- Progress tracker update (mark W4-T12 DONE)
- Execution plan status log update
- Roadmap post-cycle record
- AGENT_HANDOFF update
- Push to `cvf-next`

---

## Status Log

| CP | Status |
|---|---|
| GC-018 + GC-026 auth | DONE |
| CP1 | DONE |
| CP2 | DONE |
| CP3 | DONE |
