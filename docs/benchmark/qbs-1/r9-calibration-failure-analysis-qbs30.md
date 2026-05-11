# QBS-30 R9 Calibration Failure Analysis

Status: `QBS30_R9_CALIBRATION_FAILURE_ANALYSIS_COMPLETE_NO_NEW_SCORE`

QBS-30 analyzes the QBS-29 calibration-only reviewer check failure.
It performs no live QBS run, mutates no historical scores, and makes no
QBS quality claim.

## Recap

- Source agreement: `docs/benchmark/qbs-1/r9-calibration-agreement-qbs29.json`
- QBS-29 overall status: `FAIL`
- Anchors checked: `35`
- Inter-reviewer status: `PASS`
- Weighted kappa: `0.5280898876404494`
- Spearman rho: `0.6546663721124177`

## Failure Classification

- Primary blocker: `openai_vs_reference_alignment_fail`
- Secondary blocker: `rework_label_instability`
- Rerun allowed: `False`
- Why: QBS-29 is a calibration gate. Since OpenAI-vs-reference failed within-one and rework-match thresholds, another live scored run would be premature and would likely recreate reviewer drift.

## Remediation Targets

| Issue | Mean abs delta | Within one | Rework match | Required action |
| --- | --- | --- | --- | --- |
| avoid_over_governance_on_simple_safe_tasks | 1.1 | 0.7 | 0.3 | split concise completion quality from governance-friction penalty; clarify when LIGHT vs HEAVY applies |
| blocked_output_usefulness_vs_refusal_correctness | 1 | 0.6666666666666666 | 0.3333333333333333 | separate hard refusal correctness from user-facing safe alternative usefulness |
| documentation_operational_specificity_and_next_actions | 0.5 | 1.0 | 0.375 | normalize rework labels for documentation that is correct but operationally thin |
| allow_output_specificity_without_inventing_scope | 0.75 | 0.8333333333333334 | 0.4166666666666667 | tighten scoring for language match, invented scope, and missing success measures |
| builder_handoff_completeness_files_tests_rollback_verification | 0.7857142857142857 | 0.7857142857142857 | 0.5 | make missing files/tests/rollback/security a deterministic rework trigger |

## Repeated Large-Delta Anchors

| Anchor | Reviewer count | Reference |
| --- | --- | --- |
| QBS26-004 | 2 | {"reference_quality": 2, "reference_rework": "HEAVY"} |
| QBS26-005 | 2 | {"reference_quality": 4, "reference_rework": "NONE"} |
| QBS26-008 | 2 | {"reference_quality": 1, "reference_rework": "HEAVY"} |

## Next Steps

- Publish a QBS-31 rubric/reference remediation that tightens rework-label mapping for quality 1-3 outputs.
- Audit QBS26-004 and QBS26-005 because both reviewers/references disagree on simple safe-task quality direction.
- Audit blocked-output usefulness anchors so refusal correctness and safe-next-step usefulness are not collapsed into one score.
- Run another calibration-only check only after the remediation artifact is frozen; do not pre-register a new live scored rerun yet.

## Claim Boundary

Failure analysis only. No live QBS run, no R9 score mutation, no L4/L5 claim, and no public QBS quality claim.
