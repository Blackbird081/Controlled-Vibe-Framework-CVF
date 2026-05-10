# QBS-15 Reviewer Calibration Anchors

Status: `QBS15_REVIEWER_CALIBRATION_ANCHORS_READY_NO_NEW_SCORE`

Date: 2026-05-10

## Scope

QBS-15 implements the first reviewer calibration control required by QBS-14.
It builds a fixed anchor set from R5/R6/R7 scored artifacts and updates the
model-assisted reviewer script so future runs can explicitly include
calibration guidance.

QBS-15 does not run a new benchmark and does not publish a new QBS score.

## Artifacts

- Anchor builder: `scripts/build_qbs_reviewer_calibration_anchors.py`
- Anchor set: `reviewer-calibration-anchors-qbs15.json`
- Updated reviewer scorer: `scripts/score_qbs_model_assisted_reviewers.py`

## Anchor Set

The generated anchor set contains `20` examples:

| Anchor kind | Count | Meaning |
|---|---:|---|
| `high_disagreement` | `14` | Examples where OpenAI and DeepSeek diverged, intended for adjudication before claim runs. |
| `consensus_reference` | `6` | Examples where reviewers agreed, intended as scale references, not final human gold labels. |

Family coverage:

| Family | Anchor count |
|---|---:|
| `ambiguous_noncoder_requests` | `4` |
| `builder_handoff_technical_planning` | `4` |
| `bypass_adversarial_governance` | `4` |
| `cost_quota_provider_selection` | `4` |
| `negative_controls` | `3` |
| `high_risk_security_secrets` | `1` |

## Calibration Axes

The anchor set targets the drift areas found in QBS-14:

- `cost_provider_tradeoff_and_metric_claims`
- `builder_handoff_completeness_and_specificity`
- `clarification_specificity_without_assuming_solution`
- `approval_refusal_usefulness`
- `safe_refusal_boundary_and_alternative`
- `avoid_over_governance_on_simple_safe_tasks`

## Reviewer Script Update

`score_qbs_model_assisted_reviewers.py` now supports explicit calibration
inputs:

```bash
python scripts/score_qbs_model_assisted_reviewers.py \
  --run-id <run-id> \
  --prompt-version qbs15-model-assisted-reviewer-v2 \
  --calibration-anchors docs/benchmark/qbs-1/reviewer-calibration-anchors-qbs15.json
```

The default prompt version remains the historical QBS9 scorer unless the caller
opts into the QBS15 calibration mode. This preserves historical reproducibility.

## Boundary

These anchors are not final human gold labels. They are a public calibration
and adjudication packet. A future claim run should not use them as proof by
itself; it should first resolve high-disagreement anchors through a third
adjudicator or human spot-check, then pre-register the revised reviewer plan.

No L4/L5 claim is made by QBS-15.
