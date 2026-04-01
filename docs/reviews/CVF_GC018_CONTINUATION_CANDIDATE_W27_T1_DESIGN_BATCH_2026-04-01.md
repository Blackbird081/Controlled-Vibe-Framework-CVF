# CVF GC-018 Continuation Candidate Authorization — W27-T1 DesignBatchContract

Memory class: FULL_RECORD

> Date: 2026-04-01
> Control: GC-018 Continuation Candidate Authorization
> Candidate: W27-T1 — DesignBatchContract (REALIZATION class)
> Reviewer: Cascade
> Quality assessment: `docs/assessments/CVF_POST_W26_CONTINUATION_QUALITY_ASSESSMENT_2026-04-01.md` (9.86/10 EXCELLENT)

---

## Authorization Packet

| Field | Value |
|---|---|
| Tranche ID | W27-T1 |
| Tranche class | REALIZATION |
| Source contract | `DesignContract` (W1-T3) |
| Method batched | `design(intakeResult: ControlPlaneIntakeResult): DesignPlan` |
| New contract | `DesignBatchContract` |
| New file | `EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION/src/design.batch.contract.ts` |
| Test file | `EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION/tests/design.batch.contract.test.ts` |
| Projected tests | ~27 |
| Batch hash salt | `"w27-t1-cp1-design-batch"` |
| Batch ID salt | `"w27-t1-cp1-design-batch-id"` |
| Fixed test timestamp | `"2026-04-01T00:00:00.000Z"` |

---

## Dominant Metric Specification

| Metric | Type | Precedence |
|---|---|---|
| `dominantRisk` | `DesignTaskRisk \| "NONE"` | R3 > R2 > R1 > R0 |

Resolution: sum all task `riskSummary` buckets across all batch plans; highest count wins; tie-broken by R3 > R2 > R1 > R0. Returns `"NONE"` when batch is empty.

---

## Aggregation Specification

| Field | Aggregation |
|---|---|
| `totalRequests` | count of input `ControlPlaneIntakeResult[]` |
| `totalPlans` | count of `DesignPlan[]` produced |
| `totalTasks` | sum of `plan.totalTasks` across all plans |
| `r0Count` | sum of `plan.riskSummary.R0` |
| `r1Count` | sum of `plan.riskSummary.R1` |
| `r2Count` | sum of `plan.riskSummary.R2` |
| `r3Count` | sum of `plan.riskSummary.R3` |
| `dominantRisk` | resolved via precedence rule above |
| `batchHash` | deterministic via salt `"w27-t1-cp1-design-batch"` |
| `batchId` | deterministic via salt `"w27-t1-cp1-design-batch-id"` |

---

## Authorization Verdict

**GC-018 AUTHORIZED — W27-T1 DesignBatchContract. Proceed to CP1 Full Lane.**

Authorized scope: implement `DesignBatchContract` + `createDesignBatchContract` factory + `DominantDesignRisk` type + `DesignBatchResult` type + ~27 tests + barrel exports + CPF run.
