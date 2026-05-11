# QBS-36 R9 Triangulated Calibration Reference

Status: `QBS36_R9_TRIANGULATED_CALIBRATION_REFERENCE_READY_NO_NEW_SCORE`

QBS-36 cleans available-provider triangulation into a reviewer
calibration reference that future calibration checks can cite. It
performs no live QBS scored run, does not mutate R9 scores, and does
not make a QBS quality claim.

## Source

- Source anchors: `docs/benchmark/qbs-1/r9-calibration-anchors-qbs26.json`
- Source adjudication: `docs/benchmark/qbs-1/r9-anchor-adjudication-qbs36.json`
- Limitation: Derived from QBS26 R9 anchors and QBS36 available-provider triangulation with reviewer provider overlap; model-only and not a human gold-label review.

## Result

- Reference count: `35`
- Quality distribution: `{"0": 1, "1": 5, "2": 16, "3": 7, "4": 6}`
- Rework distribution: `{"HEAVY": 21, "LIGHT": 7, "NONE": 6, "REJECT": 1}`
- Cleanup actions: `{"unchanged": 35}`
- Excluded requires-review anchors: `0`

## Family Coverage

| Family | Count | Quality distribution | Rework distribution |
| --- | --- | --- | --- |
| ambiguous_noncoder_requests | 2 | {"1": 1, "3": 1} | {"HEAVY": 1, "LIGHT": 1} |
| builder_handoff_technical_planning | 7 | {"1": 1, "2": 5, "3": 1} | {"HEAVY": 6, "LIGHT": 1} |
| bypass_adversarial_governance | 4 | {"2": 2, "3": 1, "4": 1} | {"HEAVY": 2, "LIGHT": 1, "NONE": 1} |
| cost_quota_provider_selection | 5 | {"1": 3, "2": 2} | {"HEAVY": 5} |
| documentation_operations | 4 | {"2": 1, "3": 1, "4": 2} | {"HEAVY": 1, "LIGHT": 1, "NONE": 2} |
| high_risk_security_secrets | 2 | {"4": 2} | {"NONE": 2} |
| negative_controls | 5 | {"0": 1, "2": 2, "3": 1, "4": 1} | {"HEAVY": 2, "LIGHT": 1, "NONE": 1, "REJECT": 1} |
| normal_productivity_app_planning | 6 | {"2": 4, "3": 2} | {"HEAVY": 4, "LIGHT": 2} |

## Calibration Issue Coverage

| Issue | Count | Quality distribution | Cleanup actions |
| --- | --- | --- | --- |
| allow_output_specificity_without_inventing_scope | 6 | {"2": 4, "3": 2} | {"unchanged": 6} |
| avoid_over_governance_on_simple_safe_tasks | 5 | {"0": 1, "2": 2, "3": 1, "4": 1} | {"unchanged": 5} |
| blocked_output_usefulness_vs_refusal_correctness | 3 | {"2": 2, "4": 1} | {"unchanged": 3} |
| builder_handoff_completeness_files_tests_rollback_verification | 7 | {"1": 1, "2": 5, "3": 1} | {"unchanged": 7} |
| clarifying_question_specificity_without_solution_assumption | 2 | {"1": 1, "3": 1} | {"unchanged": 2} |
| documentation_operational_specificity_and_next_actions | 4 | {"2": 1, "3": 1, "4": 2} | {"unchanged": 4} |
| named_provider_recommendations_without_measured_candidates | 5 | {"1": 3, "2": 2} | {"unchanged": 5} |
| secret_handling_refusal_and_safe_alternative | 2 | {"4": 2} | {"unchanged": 2} |
| unsafe_request_boundary_and_alternative_helpfulness | 1 | {"3": 1} | {"unchanged": 1} |

## Claim Boundary

Reference cleanup only. No live QBS run, no R9 score mutation, no L4/L5 claim, and no public QBS quality claim.
