# CVF W4-T3 Evaluation Engine Slice — Tranche Execution Plan

Memory class: SUMMARY_RECORD

> Date: `2026-03-22`
> Tranche: `W4-T3 — Learning Plane Evaluation Engine Slice`
> Package: `EXTENSIONS/CVF_LEARNING_PLANE_FOUNDATION/`
> Authorization: `docs/reviews/CVF_GC018_CONTINUATION_CANDIDATE_W4_T3_2026-03-22.md` (13/15)

---

## Goal

Deliver the first learning-plane surface that classifies a `TruthModel` against governance thresholds, producing an actionable `EvaluationVerdict`.

---

## Control Points

| CP | Title | Lane | Deliverable |
|----|-------|------|-------------|
| CP1 | Evaluation Engine Contract | Full | `src/evaluation.engine.contract.ts` + 9 new tests |
| CP2 | Evaluation Threshold Contract | Fast | `src/evaluation.threshold.contract.ts` + 7 new tests |
| CP3 | Tranche Closure Review | Full | all governance artifacts |

---

## CP1 — Evaluation Engine Contract (Full Lane)

**Types:**
- `EvaluationVerdict`: `"PASS" | "WARN" | "FAIL" | "INCONCLUSIVE"`
- `EvaluationSeverity`: `"CRITICAL" | "HIGH" | "MEDIUM" | "LOW" | "NONE"`
- `EvaluationResult`: `{ resultId, evaluatedAt, sourceTruthModelId, sourceTruthModelVersion, verdict, severity, confidenceLevel, rationale, evaluationHash }`

**Contract:** `EvaluationEngineContract.evaluate(model: TruthModel): EvaluationResult`

**Verdict logic (in priority order):**
1. INCONCLUSIVE: `confidenceLevel < 0.3` OR `healthTrajectory === "UNKNOWN"`
2. FAIL: `currentHealthSignal === "CRITICAL"` OR `dominantPattern === "REJECT"`
3. WARN: `currentHealthSignal === "DEGRADED"` OR `dominantPattern === "ESCALATE"` OR `healthTrajectory === "DEGRADING"`
4. PASS: otherwise

**Severity logic:**
- FAIL + CRITICAL health → CRITICAL
- FAIL (other) → HIGH
- WARN + DEGRADING trajectory → HIGH
- WARN → MEDIUM
- PASS + confidenceLevel < 0.5 → LOW
- PASS + confidenceLevel >= 0.5 → NONE
- INCONCLUSIVE → LOW

---

## CP2 — Evaluation Threshold Contract (Fast Lane, GC-021)

**Types:**
- `OverallStatus`: `"PASSING" | "WARNING" | "FAILING" | "INSUFFICIENT_DATA"`
- `ThresholdAssessment`: `{ assessmentId, assessedAt, totalVerdicts, passCount, warnCount, failCount, inconclusiveCount, overallStatus, summary, assessmentHash }`

**Contract:** `EvaluationThresholdContract.assess(results: EvaluationResult[]): ThresholdAssessment`

**OverallStatus logic:**
- INSUFFICIENT_DATA: empty OR all INCONCLUSIVE
- FAILING: any FAIL
- WARNING: any WARN (no FAIL)
- PASSING: all PASS

---

## Test Target

- CP1: 9 new tests
- CP2: 7 new tests
- **Total new: 16 — Grand total: 263**
