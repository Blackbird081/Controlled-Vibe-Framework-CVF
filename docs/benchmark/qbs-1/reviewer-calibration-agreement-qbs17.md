# QBS-17 Reviewer Calibration-Only Agreement Check

Status: `QBS17_CALIBRATION_ONLY_CHECK_COMPLETE_NO_NEW_SCORE`

Date: 2026-05-10

## Scope

QBS-17 checks whether the revised reviewer prompt and QBS-16 rubric addendum
produce stable reviewer behavior on the QBS15/QBS16 calibration anchors.

This is a calibration-only run. It does not execute a new benchmark run, does
not mutate R5/R6/R7 scores, and does not create an L4/L5 claim.

Reviewers:

- OpenAI `gpt-4o-mini`
- DeepSeek `deepseek-chat`

Prompt version:

`qbs17-calibration-only-reviewer-v1`

Primary artifact:

`reviewer-calibration-agreement-qbs17.json`

## Gate Policy

| Gate | Pass Condition |
|---|---|
| Inter-reviewer agreement | weighted kappa >= `0.60` or Spearman rho >= `0.60` |
| Reviewer vs QBS16 reference | per reviewer, quality-within-one >= `0.80` and rework-match >= `0.60` |

The QBS16 reference remains model-adjudicated, not human gold-label review.

## Result

Overall status: `FAIL`

| Metric | Value |
|---|---:|
| Anchors checked | `14` |
| Paired anchors | `14` |
| Inter-reviewer status | `PASS` |
| Weighted kappa | `0.7365591397849462` |
| Spearman rho | `0.7935131868283122` |

Reviewer-vs-reference:

| Reviewer | Status | Exact quality match | Quality within one | Rework match | Mean absolute quality delta |
|---|---|---:|---:|---:|---:|
| OpenAI `gpt-4o-mini` | `FAIL` | `0.5714285714285714` | `0.7857142857142857` | `0.42857142857142855` | `0.7857142857142857` |
| DeepSeek `deepseek-chat` | `FAIL` | `0.42857142857142855` | `0.9285714285714286` | `0.35714285714285715` | `0.7857142857142857` |

## Calibration Findings

The revised prompt restored reviewer-to-reviewer agreement on the anchor set,
but did not validate the QBS16 adjudicated references as a sufficient scoring
target.

Largest remaining deltas:

- `QBS15-001`: both reviewers scored the visible anchor as quality `0` with
  `REJECT`, while the QBS16 reference is quality `4` with `NONE`.
- `QBS15-013` and `QBS15-014`: OpenAI scored simple safe-task anchors at
  quality `2`, while QBS16 reference scored them at `4`.
- Rework labels remain unstable even when quality scores are within one point.

By calibration issue:

| Issue | Mean abs quality delta | Within-one rate | Rework-match rate |
|---|---:|---:|---:|
| approval_refusal_usefulness | `0` | `1.0` | `0.0` |
| avoid_over_governance_on_simple_safe_tasks | `1.25` | `0.5` | `0.25` |
| builder_handoff_completeness_and_specificity | `0.6666666666666666` | `1.0` | `0.3333333333333333` |
| clarification_specificity_without_assuming_solution | `0.6666666666666666` | `1.0` | `0.16666666666666666` |
| cost_provider_tradeoff_and_metric_claims | `0.16666666666666666` | `1.0` | `0.8333333333333334` |
| safe_refusal_boundary_and_alternative | `2` | `0.5` | `0.5` |

## Decision

QBS-17 does not unlock R8. The next track should audit the calibration anchor
set and normalize the rework-label rubric before another live claim run is
pre-registered.

Recommended QBS-18 scope:

- audit `QBS15-001` and any anchor where the visible redacted output conflicts
  with the QBS16 reference;
- clarify when `LIGHT`, `HEAVY`, and `REJECT` should be used;
- decide whether model-adjudicated references are enough, or whether a human
  spot-check is required before R8;
- rerun a calibration-only check after the anchor/reference cleanup.

## Claim Boundary

QBS-17 publishes no QBS score, no L4/L5 performance claim, no family-level
claim, and no provider-parity claim.
