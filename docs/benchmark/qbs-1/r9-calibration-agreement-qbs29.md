# QBS-29 R9 Calibration-Only Reviewer Agreement

Status: `QBS29_R9_CALIBRATION_ONLY_REVIEWER_AGREEMENT_COMPLETE_NO_NEW_SCORE`

QBS-29 runs a calibration-only reviewer agreement check against the
QBS-28 cleaned R9 calibration reference. It performs no live QBS scored
run, mutates no historical scores, and makes no QBS quality claim.

## Source

- Source anchors: `docs/benchmark/qbs-1/r9-calibration-anchors-qbs26.json`
- Source reference: `docs/benchmark/qbs-1/r9-calibration-reference-qbs28.json`
- Rubric addendum: `docs/benchmark/qbs-1/r9-calibration-reference-qbs28.md`
- Reference limitation: Derived from QBS26 R9 anchors and QBS27 Alibaba/DashScope model adjudication; still not a human gold-label review.

## Result

- Overall status: `FAIL`
- Anchors checked: `35`
- Paired anchors: `35`
- Inter-reviewer status: `PASS`
- Weighted kappa: `0.5280898876404494`
- Spearman rho: `0.6546663721124177`

Reviewer vs reference:

| Reviewer | Status | Within one | Rework match | Mean abs delta |
| --- | --- | --- | --- | --- |
| openai:gpt-4o-mini | FAIL | 0.7714285714285715 | 0.4857142857142857 | 0.7714285714285715 |
| deepseek:deepseek-chat | PASS | 0.9428571428571428 | 0.6285714285714286 | 0.5428571428571428 |

Calibration issues:

| Issue | Count | Mean abs delta | Within one | Rework match |
| --- | --- | --- | --- | --- |
| allow_output_specificity_without_inventing_scope | 12 | 0.75 | 0.8333333333333334 | 0.4166666666666667 |
| avoid_over_governance_on_simple_safe_tasks | 10 | 1.1 | 0.7 | 0.3 |
| blocked_output_usefulness_vs_refusal_correctness | 6 | 1 | 0.6666666666666666 | 0.3333333333333333 |
| builder_handoff_completeness_files_tests_rollback_verification | 14 | 0.7857142857142857 | 0.7857142857142857 | 0.5 |
| clarifying_question_specificity_without_solution_assumption | 4 | 0 | 1.0 | 1.0 |
| documentation_operational_specificity_and_next_actions | 8 | 0.5 | 1.0 | 0.375 |
| named_provider_recommendations_without_measured_candidates | 10 | 0.5 | 1.0 | 0.9 |
| secret_handling_refusal_and_safe_alternative | 4 | 0 | 1.0 | 1.0 |
| unsafe_request_boundary_and_alternative_helpfulness | 2 | 0 | 1.0 | 1.0 |

## Claim Boundary

Calibration-only reviewer-plan check. No live QBS score, no L4/L5 claim, and no historical score mutation.
