# QBS-41 R10 Post-Score Analysis

**Status:** `QBS41_R10_POST_SCORE_ANALYSIS_COMPLETE_NO_NEW_SCORE`  
**Run:** `qbs1-powered-single-provider-20260512-alibaba-r10`  
**Date:** 2026-05-12  
**Boundary:** Post-score analysis only. No new QBS score, no L4/L5 claim, no family-level claim, no provider-parity claim. Historical R5–R9 artifacts are unchanged.

---

## Hard Gates

All hard gates PASS.

| Gate | Result |
|---|---|
| direct_configs_transport_ok | PASS |
| cfg_b_receipt_complete | PASS |
| cfg_b_expected_decision_match | PASS |
| secret_scan_clean | PASS |
| mock_fallback_detected | false |
| severe_unsafe_false_negative_count | 0 |
| negative_control_false_block_count | 0 |
| f7_front_door_evidence_complete | PASS |

---

## Reviewer Agreement

| Metric | Value | Gate |
|---|---|---|
| quadratic_weighted_cohen_kappa | `0.3789` | FAIL (< 0.60) |
| spearman_rho | `0.5869` | FAIL (< 0.65) |
| paired_score_count | `432` | complete (no missing) |

Reviewers: OpenAI `gpt-4o-mini` + DeepSeek `deepseek-chat`,  
prompt version `qbs40-r10-post-qbs39-scored-run-v1`,  
calibration reference `r9-calibration-reference-qbs36.json`.

Scorer completeness remediation (QBS-34) held: **0 missing scores**, 432/432 paired.

---

## L4 Quality Delta

| Metric | Value |
|---|---|
| median CFG-B vs CFG-A1 | `-0.125` |
| bootstrap 95% CI | `[-0.25, 0.0]` |
| median CFG-B vs CFG-A0 | `-0.125` |
| median heavy/reject improvement CFG-B vs CFG-A1 | `-0.167` |
| reviewer_agreement_passed | false |
| l4_pass | **false** |

---

## Reviewer Disagreement by Family (sorted by mean abs diff)

| Family | mean abs diff | paired count |
|---|---|---|
| `cost_quota_provider_selection` | **1.741** | 54 |
| `normal_productivity_app_planning` | 1.185 | 54 |
| `bypass_adversarial_governance` | 1.130 | 54 |
| `builder_handoff_technical_planning` | 1.037 | 54 |
| `documentation_operations` | 0.926 | 54 |
| `ambiguous_noncoder_requests` | 0.889 | 54 |
| `high_risk_security_secrets` | 0.667 | 54 |
| `negative_controls` | 0.593 | 54 |

Overall mean abs diff: `1.021`

---

## Worst Family by Median Delta

`negative_controls`: median CFG-B vs CFG-A1 = **-0.4375** (5/6 negative tasks, 0 positive).

This is notably worse than R9 for negative controls — the QBS-39 family output contract
does not apply to `negative_controls` (only the three chronic-negative families). This
suggests negative-control outputs may have regressed in specificity or tone under the
tighter governed prompt.

---

## Comparison with R8 / R9

| Run | kappa | rho | missing | median delta |
|---|---|---|---|---|
| R8 | 0.500 | 0.570 | 1 | -0.125 |
| R9 | 0.372 | 0.438 | 0 | -0.125 |
| **R10** | **0.379** | **0.587** | **0** | **-0.125** |

kappa is marginally better than R9 but still far below the 0.60 gate. rho improved
over R9. scorer completeness is now stable at 432/432.

---

## Key Findings for Next Track

1. **cost_quota_provider_selection** remains the most disagreed family (mean abs diff
   `1.741`). This family has been the top disagreement source since R6. The QBS-39
   family contract targets it but disagreement is primarily at the reviewer level, not
   solely an output-quality issue.

2. **negative_controls regression**: median delta dropped to `-0.4375` from `-0.125` in
   R9. The QBS-39 contract does not cover this family. Investigation needed.

3. **Scorer completeness is stable**: 432/432 paired with zero missing. QBS-34
   alias-retry fix holds across R10.

4. **kappa instability** persists across R8–R10 range (0.372–0.500). The calibration
   reference (QBS-36 triangulated) did not stabilize reviewer agreement for a live run.
   The calibration-only check (QBS-37 kappa `0.72`) does not generalise to live run
   scoring, suggesting the live corpus is harder to agree on than the 35-anchor
   calibration set.

---

## Boundary

- No QBS score is claimed.
- No L4/L5, family-level, or provider-parity claim is made.
- Historical R5–R9 artifacts are not mutated.
- No raw API key values were printed or committed.
