# QBS-32 R9 Calibration-Only Reviewer Agreement Rerun

Status: `QBS32_R9_CALIBRATION_ONLY_RERUN_COMPLETE_NO_NEW_SCORE`

This artifact runs a calibration-only reviewer agreement check against the
QBS-28 cleaned R9 calibration reference. It performs no live QBS scored
run, mutates no historical scores, and makes no QBS quality claim.

## Source

- Source anchors: `docs/benchmark/qbs-1/r9-calibration-anchors-qbs26.json`
- Source reference: `docs/benchmark/qbs-1/r9-calibration-reference-qbs28.json`
- Rubric addendum: `docs/benchmark/qbs-1/r9-reviewer-rubric-remediation-qbs31.md`
- Reference limitation: Derived from QBS26 R9 anchors and QBS27 Alibaba/DashScope model adjudication; still not a human gold-label review.

## Result

- Overall status: `FAIL`
- Anchors checked: `35`
- Paired anchors: `35`
- Inter-reviewer status: `FAIL`
- Weighted kappa: `0.44639718804920914`
- Spearman rho: `0.46647062187999994`

Reviewer vs reference:

| Reviewer | Status | Within one | Rework match | Mean abs delta |
| --- | --- | --- | --- | --- |
| openai:gpt-4o-mini | FAIL | 0.9428571428571428 | 0.4857142857142857 | 0.7428571428571429 |
| deepseek:deepseek-chat | FAIL | 0.9428571428571428 | 0.5142857142857142 | 0.7428571428571429 |

Calibration issues:

| Issue | Count | Mean abs delta | Within one | Rework match |
| --- | --- | --- | --- | --- |
| allow_output_specificity_without_inventing_scope | 12 | 0.75 | 1.0 | 0.4166666666666667 |
| avoid_over_governance_on_simple_safe_tasks | 10 | 1.2 | 0.8 | 0.1 |
| blocked_output_usefulness_vs_refusal_correctness | 6 | 0.6666666666666666 | 1.0 | 0.6666666666666666 |
| builder_handoff_completeness_files_tests_rollback_verification | 14 | 0.5714285714285714 | 1.0 | 0.6428571428571429 |
| clarifying_question_specificity_without_solution_assumption | 4 | 0.75 | 0.75 | 0.5 |
| documentation_operational_specificity_and_next_actions | 8 | 0.625 | 0.875 | 0.5 |
| named_provider_recommendations_without_measured_candidates | 10 | 0.6 | 1.0 | 0.9 |
| secret_handling_refusal_and_safe_alternative | 4 | 0.75 | 1.0 | 0.25 |
| unsafe_request_boundary_and_alternative_helpfulness | 2 | 1 | 1.0 | 0.0 |

## Claim Boundary

Calibration-only reviewer-plan check. No live QBS score, no L4/L5 claim, and no historical score mutation.
