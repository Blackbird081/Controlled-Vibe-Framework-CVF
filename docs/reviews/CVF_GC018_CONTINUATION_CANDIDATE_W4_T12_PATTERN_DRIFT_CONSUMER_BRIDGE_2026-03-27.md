# CVF GC-018 Continuation Candidate Review — W4-T12 PatternDrift Consumer Pipeline Bridge

Memory class: FULL_RECORD

> Date: 2026-03-27
> Protocol: GC-018 — Continuation Candidate Authorization
> Reviewer: Cascade

---

## Candidate Survey

| Rank | Candidate | Gap | Score |
|---|---|---|---|
| 1 | PatternDriftContract | No CPF consumer pipeline bridge | 9/10 |
| 2 | LearningObservabilityContract | No CPF consumer pipeline bridge | 8/10 |
| 3 | EvaluationThresholdContract | No CPF consumer pipeline bridge | 7/10 |
| 4 | LearningLoopContract | No CPF consumer pipeline bridge | 6/10 |

**Selected**: PatternDriftContract — Score 9/10

---

## Candidate Profile

**Contract**: `PatternDriftContract`
**File**: `EXTENSIONS/CVF_LEARNING_PLANE_FOUNDATION/src/pattern.drift.contract.ts`
**Method**: `detect(baseline: TruthModel, current: TruthModel): PatternDriftSignal`

**Chain**:
```
TruthModel (baseline) + TruthModel (current)
  → PatternDriftContract.detect()
  → PatternDriftSignal { driftId, driftClass, driftRationale, patternChanged, healthSignalChanged, confidenceDelta, driftHash }
```

**Output classifications**:
- `CRITICAL_DRIFT` — health turned critical, confidence dropped >0.3, or trajectory turned DEGRADING
- `DRIFTING` — dominantPattern changed, healthSignal changed, or |confidenceDelta| > 0.1
- `STABLE` — no significant change

---

## Gap Assessment

| Item | Status |
|---|---|
| PatternDriftContract has its own tests | YES (learning.pattern.drift.test.ts) |
| Consumer pipeline bridge exists | NO — gap |
| Batch contract exists | NO — gap |
| Consumer-visible drift signals | NO — gap |

---

## Tranche Proposal

**Tranche**: W4-T12 — PatternDrift Consumer Pipeline Bridge

| CP | Contract | Lane |
|---|---|---|
| CP1 | PatternDriftConsumerPipelineContract | Full Lane (GC-019) |
| CP2 | PatternDriftConsumerPipelineBatchContract | Fast Lane (GC-021) |
| CP3 | Tranche closure review | Full Lane |

**Query format** (CP1):
`pattern-drift:class:${driftClass}:baseline:${baselineModelId}:current:${currentModelId}`.slice(0, 120)

**contextId**: `driftResult.driftId`

**Warnings**:
- `CRITICAL_DRIFT` → `"[pattern-drift] critical drift detected — immediate re-evaluation required"`
- `DRIFTING` → `"[pattern-drift] drift detected — model change requires monitoring"`
- `STABLE` → no warning

**CP1 Seeds**: `w4-t12-cp1-pattern-drift-consumer-pipeline` / `w4-t12-cp1-result-id`
**CP2 Seeds**: `w4-t12-cp2-pattern-drift-consumer-pipeline-batch` / `w4-t12-cp2-batch-id`

**CP2 Batch fields**:
- `criticalDriftCount` = results where `driftResult.driftClass === "CRITICAL_DRIFT"`
- `driftingCount` = results where `driftResult.driftClass === "DRIFTING"`
- `dominantTokenBudget` = Math.max(estimatedTokens); 0 for empty

---

## Authorization Decision

**AUTHORIZED** — W4-T12 PatternDrift Consumer Pipeline Bridge — GC-018 score 9/10

Authorized deliverables:
- CP1: PatternDriftConsumerPipelineContract (~32 tests)
- CP2: PatternDriftConsumerPipelineBatchContract (~28 tests)
- CP3: Tranche closure review
