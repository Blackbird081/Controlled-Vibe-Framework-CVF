# QBS-14 Reviewer Calibration Plan

Status: `QBS14_REVIEWER_CALIBRATION_REQUIRED_NO_NEW_SCORE`

Date: 2026-05-10

## Scope

QBS-14 analyzes reviewer drift across the scored R5, R6, and R7 runs. It does
not execute another live benchmark and does not publish a new QBS score.

Primary diagnostic artifact:

`reviewer-drift-analysis-qbs14.json`

## Why QBS-14 Stops Reruns

R7 did not improve the claim gates after QBS-12 remediation:

| Run | Agreement | Kappa | Spearman rho | Median `CFG-B - CFG-A1` | L4 |
|---|---|---:|---:|---:|---|
| R5 | `PASS` | `0.7138606707187487` | `0.7864500452029551` | `-0.25` | `false` |
| R6 | `FAIL` | `0.5043578866178171` | `0.5987420572601858` | `-0.125` | `false` |
| R7 | `FAIL` | `0.46363630803481326` | `0.5329992930685284` | `-0.125` | `false` |

QBS-10/QBS-12 remediations improved the governed lane compared with the R5
failure mode, but the scoring method is no longer stable enough for a public
claim attempt.

## Reviewer Drift

Mean absolute quality-score difference between DeepSeek and OpenAI:

| Run | Overall | `CFG-A0` | `CFG-A1` | `CFG-B` |
|---|---:|---:|---:|---:|
| R5 | `0.703704` | `0.659722` | `0.680556` | `0.770833` |
| R6 | `0.701389` | `0.722222` | `0.666667` | `0.715278` |
| R7 | `0.731481` | `0.75` | `0.666667` | `0.777778` |

The disagreement is not isolated to the governed `CFG-B` lane. Direct baselines
also have substantial reviewer disagreement, especially on cost/provider,
builder-handoff, and ambiguous non-coder prompts.

## Highest-Drift Families

| Run | Highest-drift family | Mean absolute difference |
|---|---|---:|
| R5 | `builder_handoff_technical_planning` | `1.018519` |
| R6 | `cost_quota_provider_selection` | `1.037037` |
| R7 | `builder_handoff_technical_planning` | `1.018519` |

R7 also showed high drift for:

- `cost_quota_provider_selection`: `0.944444`
- `ambiguous_noncoder_requests`: `0.888889`

## Reviewer Bias Signal

OpenAI tended to score higher than DeepSeek across runs:

| Run | DeepSeek overall mean | OpenAI overall mean | DeepSeek `CFG-B` mean | OpenAI `CFG-B` mean |
|---|---:|---:|---:|---:|
| R5 | `2.652778` | `3.143519` | `1.756944` | `2.027778` |
| R6 | `2.868056` | `3.37963` | `2.729167` | `3.166667` |
| R7 | `2.914352` | `3.391204` | `2.833333` | `3.111111` |

This bias is not automatically wrong, but it means the current two-reviewer
setup is fragile when the outputs are near threshold.

## QBS-14 Decision

Do not pre-register another live score run yet.

Before R8 or any future claim attempt, QBS should add a reviewer calibration
stage:

1. Build a fixed calibration anchor set from R5/R6/R7 outputs.
2. Include examples where reviewers disagreed by 2+ quality points.
3. Clarify rubric anchors for:
   - cost/provider-selection tasks;
   - builder-handoff completeness;
   - ambiguous non-coder clarification;
   - approval/refusal usefulness.
4. Add a third adjudicator or human spot-check for high-disagreement anchors.
5. Only then pre-register another live score run.

## Claim Boundary

QBS-14 does not change historical R5/R6/R7 scores. It creates a diagnostic and
calibration requirement. No L4/L5 public claim is made.
