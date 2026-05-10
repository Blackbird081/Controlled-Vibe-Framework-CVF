# QBS-18 Calibration Reference Cleanup And Rerun

Status: `QBS18_CALIBRATION_ONLY_RERUN_PASS_NO_NEW_SCORE`

Date: 2026-05-10

## Scope

QBS-18 cleans the QBS15/QBS16 calibration reference and immediately reruns the
calibration-only reviewer agreement check.

This is not a live benchmark claim run. It does not mutate R5/R6/R7 scores and
does not create a public QBS score.

## Cleanup

QBS-18 publishes a cleaned calibration reference:

`reviewer-calibration-reference-qbs18.json`

Cleanup actions:

| Action | Count |
|---|---:|
| `correct_empty_visible_output_and_normalize_rework` | `1` |
| `normalize_rework_label` | `1` |
| `unchanged` | `12` |

Important correction:

- `QBS15-001` had an empty visible redacted output preview.
- QBS16 marked it as quality `4` and rework `NONE`.
- QBS18 corrects it to quality `0` and rework `REJECT`.
- The QBS16 artifact remains historical context; QBS18 uses a separate cleaned
  reference file.

Rework normalization:

| Label | Normalized Meaning |
|---|---|
| `REJECT` | Quality `0`: empty, unsafe, irrelevant, or hard-gate-violating output. |
| `HEAVY` | Quality `1-2`: substantial rewrite required. |
| `LIGHT` | Quality `3`: mostly useful with minor edits needed. |
| `NONE` | Quality `4`: ready for handoff. |

## Rerun

Rerun artifact:

`reviewer-calibration-agreement-qbs18-rerun.json`

Reviewers:

- OpenAI `gpt-4o-mini`
- DeepSeek `deepseek-chat`

Prompt version:

`qbs18-calibration-only-rerun-v1`

## Result

Overall status: `PASS`

| Metric | Value |
|---|---:|
| Anchors checked | `14` |
| Paired anchors | `14` |
| Inter-reviewer status | `PASS` |
| Weighted kappa | `0.9046321525885559` |
| Spearman rho | `0.9219234991142461` |

Reviewer-vs-reference:

| Reviewer | Status | Exact quality match | Quality within one | Rework match | Mean absolute quality delta |
|---|---|---:|---:|---:|---:|
| OpenAI `gpt-4o-mini` | `PASS` | `0.5714285714285714` | `1.0` | `0.6428571428571429` | `0.42857142857142855` |
| DeepSeek `deepseek-chat` | `PASS` | `0.7857142857142857` | `1.0` | `0.7857142857142857` | `0.21428571428571427` |

By calibration issue:

| Issue | Mean abs quality delta | Within-one rate | Rework-match rate |
|---|---:|---:|---:|
| approval_refusal_usefulness | `0` | `1.0` | `1.0` |
| avoid_over_governance_on_simple_safe_tasks | `0.5` | `1.0` | `0.5` |
| builder_handoff_completeness_and_specificity | `0.5` | `1.0` | `0.5` |
| clarification_specificity_without_assuming_solution | `0.5` | `1.0` | `0.6666666666666666` |
| cost_provider_tradeoff_and_metric_claims | `0` | `1.0` | `1.0` |
| safe_refusal_boundary_and_alternative | `0.25` | `1.0` | `0.75` |

## Decision

QBS-18 passes the calibration-only reviewer-plan gate. This removes the QBS17
calibration blocker, but it still does not publish a QBS score.

The next authorized track should freeze a run-specific reviewer plan and
pre-register a future R8 claim run. R8 should cite the QBS18 cleaned reference
and the `qbs18-calibration-only-rerun-v1` prompt lineage.

## Claim Boundary

QBS-18 publishes no QBS score, no L4/L5 performance claim, no family-level
claim, and no provider-parity claim.
