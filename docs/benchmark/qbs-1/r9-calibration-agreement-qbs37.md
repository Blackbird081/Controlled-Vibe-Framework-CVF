# QBS Calibration-Only Reviewer Agreement

Status: `QBS37_R9_POST_TRIANGULATION_FAMILY_DIAGNOSTIC_COMPLETE_NO_NEW_SCORE`

This artifact runs a calibration-only reviewer agreement check against the
QBS-28 cleaned R9 calibration reference. It performs no live QBS scored
run, mutates no historical scores, and makes no QBS quality claim.

## Source

- Source anchors: `docs/benchmark/qbs-1/r9-calibration-anchors-qbs26.json`
- Source reference: `docs/benchmark/qbs-1/r9-calibration-reference-qbs36.json`
- Rubric addendum: `docs/benchmark/qbs-1/r9-reviewer-rubric-remediation-qbs31.md`
- Reference limitation: Derived from QBS26 R9 anchors and QBS36 available-provider triangulation with reviewer provider overlap; model-only and not a human gold-label review.
- Rework mode: `derived`

## Result

- Overall status: `PASS`
- Anchors checked: `35`
- Paired anchors: `35`
- Inter-reviewer status: `PASS`
- Weighted kappa: `0.72`
- Spearman rho: `0.7831388456799362`

Reviewer vs reference:

| Reviewer | Status | Within one | Rework match | Mean abs delta |
| --- | --- | --- | --- | --- |
| openai:gpt-4o-mini | PASS | 0.9714285714285714 | 0.7142857142857143 | 0.5142857142857142 |
| deepseek:deepseek-chat | PASS | 0.9428571428571428 | 0.6285714285714286 | 0.5428571428571428 |

Calibration issues:

| Issue | Count | Mean abs delta | Within one | Rework match |
| --- | --- | --- | --- | --- |
| allow_output_specificity_without_inventing_scope | 12 | 0.5 | 1.0 | 0.5833333333333334 |
| avoid_over_governance_on_simple_safe_tasks | 10 | 1 | 0.7 | 0.4 |
| blocked_output_usefulness_vs_refusal_correctness | 6 | 0.5 | 1.0 | 0.8333333333333334 |
| builder_handoff_completeness_files_tests_rollback_verification | 14 | 0.2857142857142857 | 1.0 | 0.8571428571428571 |
| clarifying_question_specificity_without_solution_assumption | 4 | 0.5 | 1.0 | 0.5 |
| documentation_operational_specificity_and_next_actions | 8 | 0.625 | 1.0 | 0.375 |
| named_provider_recommendations_without_measured_candidates | 10 | 0.5 | 1.0 | 1.0 |
| secret_handling_refusal_and_safe_alternative | 4 | 0.5 | 1.0 | 0.5 |
| unsafe_request_boundary_and_alternative_helpfulness | 2 | 0 | 1.0 | 1.0 |

Per-family diagnostics:

| Family | Anchors | Exploratory | Kappa | Spearman |
| --- | --- | --- | --- | --- |
| ambiguous_noncoder_requests | 2 | True | 1.0 | 0.9999999999999998 |
| builder_handoff_technical_planning | 7 | False | 0.30000000000000004 | 0.30000000000000004 |
| bypass_adversarial_governance | 4 | False | 0.875 | 0.9438798074485389 |
| cost_quota_provider_selection | 5 | False | 0.11764705882352955 | 0.2499999999999999 |
| documentation_operations | 4 | False | 0.75 | 0.9045340337332909 |
| high_risk_security_secrets | 2 | True | 0.0 | None |
| negative_controls | 5 | False | 0.0 | None |
| normal_productivity_app_planning | 6 | False | 0.625 | 0.7905694150420951 |

## Claim Boundary

Calibration-only reviewer-plan check. No live QBS score, no L4/L5 claim, and no historical score mutation. Derived rework mode is a calibration-only view based on the QBS-31 quality-to-rework mapping.
