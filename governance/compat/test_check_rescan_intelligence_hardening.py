from governance.compat.check_rescan_intelligence_hardening import check_text


VALID_BLOCK = """
# External Review Rescan

Status: CLOSED_PASS_BOUNDED

## Rescan Intelligence Hardening

- Original source artifact: docs/assessments/source.docx
- Predecessor intake artifact: docs/assessments/intake.md
- Delta ledger status: COMPLETE
- Routing matrix status: COMPLETE
- Semantic sampling status: COMPLETE
- Rescan intelligence verdict: COMPLETE_WITH_DELTA_ROUTING_SAMPLE

### Original-Intake Delta Ledger

| Current | Prior | Category | Reason |
| --- | --- | --- | --- |
| RS-01 | F1 | UNCHANGED_FROM_INTAKE | Still valid. |
| RS-02 | F2 | CHANGED_DISPOSITION | Split into narrower findings. |
| RS-03 | N/A | NEW_FINDING | Found during full rescan. |
| RS-04 | F4 | REMOVED_OR_REJECTED | Rejected by source evidence. |

### Follow-Up Routing Matrix

| Finding | Lane | Action |
| --- | --- | --- |
| RS-01 | DO_NOW | Dispatch implementation. |
| RS-02 | SEPARATE_RUNTIME_TRANCHE | Separate runtime tranche. |
| RS-03 | STRATEGIC_OPERATOR_DECISION | Operator decision. |
| RS-04 | OUT_OF_SCOPE | Not technical work. |
| RS-05 | RESOLVED_BY_DESIGN | Already covered. |

### Semantic Sampling / Adversarial Review

| sampleId | source section | source claim | disposition checked | adversarial challenge | verdict |
| --- | --- | --- | --- | --- | --- |
| S-01 | section 4.4 | architecture gap | routed | Could be buried. | PASS |
| S-02 | section 7 | benchmark gap | routed | Could be overclaimed. | PASS |
| S-03 | section 10 | recommendation | routed | Could mix lanes. | PASS |
"""


def test_valid_rescan_block_passes():
    assert check_text("docs/assessments/CVF_RESCAN_SAMPLE.md", VALID_BLOCK) == []


def test_missing_delta_category_fails():
    text = VALID_BLOCK.replace("REMOVED_OR_REJECTED", "REMOVED")
    violations = check_text("docs/assessments/CVF_RESCAN_SAMPLE.md", text)
    assert any(item["type"] == "delta_category_missing" for item in violations)


def test_missing_routing_lane_fails():
    text = VALID_BLOCK.replace("RESOLVED_BY_DESIGN", "DONE")
    violations = check_text("docs/assessments/CVF_RESCAN_SAMPLE.md", text)
    assert any(item["type"] == "routing_lane_missing" for item in violations)


def test_non_rescan_doc_is_not_applicable():
    assert check_text("docs/assessments/CVF_PLAIN_NOTE.md", "# Plain Note\n\nNo bounded corpus claim.\n") == []


def test_runtime_work_order_reference_to_external_review_is_not_applicable():
    text = """
# Runtime Work Order

Status: CLOSED_PASS_BOUNDED

## Purpose

Convert one external-review architecture finding into runtime hardening.
"""
    assert check_text("docs/work_orders/CVF_WO_RUNTIME_DURABILITY_2026-06-05.md", text) == []


def test_rescan_keyword_inside_code_fence_is_not_applicable():
    text = """
# Plain Note

Status: CLOSED_PASS_BOUNDED

```text
this is a rescan example used only as fenced sample text
```
"""
    assert check_text("docs/reviews/CVF_PLAIN_NOTE.md", text) == []


def test_rescan_keyword_inside_na_line_is_not_applicable():
    text = """
# Plain Note

Status: CLOSED_PASS_BOUNDED

- Rescan applicability: N/A with reason: not a rescan or knowledge absorption output
"""
    assert check_text("docs/reviews/CVF_PLAIN_NOTE.md", text) == []


def test_rescan_keyword_in_real_prose_still_applicable():
    text = """
# Real Rescan Note

Status: CLOSED_PASS_BOUNDED

This document performs a full rescan of the prior intake findings.
"""
    violations = check_text("docs/reviews/CVF_REAL_RESCAN.md", text)
    assert any(item["type"] == "rescan_hardening_section_missing" for item in violations)


def test_marked_guard_behavior_discussion_is_not_rescan_output():
    text = """
# Plain Note

## Guard Behavior Discussion

Discussion-only disposition: META_DISCUSSION_ONLY

This note explains a rescan self-reference false trigger.
"""
    assert check_text("docs/reviews/CVF_PLAIN_NOTE.md", text) == []


def test_compact_not_applicable_non_rescan_completion_passes():
    text = """
# Worker Return

Status: CLOSED_PASS_BOUNDED

## Rescan Intelligence Hardening

- Rescan intelligence verdict: NOT_APPLICABLE_WITH_REASON

Reason: N/A with reason: this is a worker return, not a rescan or intake refresh output.
"""
    assert check_text("docs/reviews/CVF_WORKER_RETURN.md", text) == []


def test_compact_not_applicable_can_discuss_rescan_checker_scope():
    text = """
# Checker Maintenance Completion

Status: CLOSED_PASS_BOUNDED

## Purpose

This updates the rescan guard and rescan standard so non-rescan packets do not
need empty rescan matrices. Real rescan outputs still need full evidence.

## Rescan Intelligence Hardening

- Rescan intelligence verdict: NOT_APPLICABLE_WITH_REASON

Reason: N/A with reason: this is checker maintenance, not a rescan or intake refresh output.
"""
    assert check_text("docs/reviews/CVF_CHECKER_MAINTENANCE_COMPLETION.md", text) == []


def test_compact_not_applicable_requires_concrete_reason():
    text = """
# Worker Return

Status: CLOSED_PASS_BOUNDED

## Rescan Intelligence Hardening

- Rescan intelligence verdict: NOT_APPLICABLE_WITH_REASON
"""
    violations = check_text("docs/reviews/CVF_WORKER_RETURN.md", text)
    assert any(item["type"] == "not_applicable_reason_missing" for item in violations)


def test_rescan_output_cannot_use_compact_not_applicable():
    text = VALID_BLOCK.replace("COMPLETE_WITH_DELTA_ROUTING_SAMPLE", "NOT_APPLICABLE_WITH_REASON")
    violations = check_text("docs/assessments/CVF_RESCAN_SAMPLE.md", text)
    assert any(item["type"] == "not_applicable_used_for_rescan_output" for item in violations)


def test_compact_not_applicable_can_discuss_rescan_hardening_compound_phrasing():
    text = """
# Worker Return

Status: COMPLETE_PENDING_REVIEW

## Findings / Position

A 4th fast-gate run failed on this file's own edits to the rescan-hardening
section: compound phrasing joining the bare words rescan and hardening with a
hyphen, and rescan combined with body, matched the rescan guard's bare-keyword
applicability pattern even though the sentence was describing the guard's
maintenance, not performing a rescan.

## Rescan Intelligence Hardening

- Rescan intelligence verdict: NOT_APPLICABLE_WITH_REASON

Reason: N/A with reason: this is a worker return discussing a prior gate
failure, not a rescan or intake refresh output.
"""
    assert check_text("docs/reviews/CVF_WORKER_RETURN_COMPOUND_PHRASING.md", text) == []


def test_compact_not_applicable_can_use_never_rescan_negation():
    text = """
# Worker Return

Status: COMPLETE_PENDING_REVIEW

## Findings / Position

The worker said this was never a rescan, but the previous bare-keyword filter
still treated that explanatory sentence as applicability evidence.

## Rescan Intelligence Hardening

- Rescan intelligence verdict: NOT_APPLICABLE_WITH_REASON

Reason: N/A with reason: this is a worker return, not a rescan or intake refresh output.
"""
    assert check_text("docs/reviews/CVF_WORKER_RETURN_NEVER_RESCAN.md", text) == []


def test_compact_not_applicable_can_use_no_intake_refresh_negation():
    text = """
# Worker Return

Status: COMPLETE_PENDING_REVIEW

## Findings / Position

No intake refresh or knowledge absorption output was produced in this bounded
checker-maintenance tranche.

## Rescan Intelligence Hardening

- Rescan intelligence verdict: NOT_APPLICABLE_WITH_REASON

Reason: N/A with reason: this is a worker return, not a rescan or intake refresh output.
"""
    assert check_text("docs/reviews/CVF_WORKER_RETURN_NO_INTAKE_REFRESH.md", text) == []


def test_self_reference_without_section_is_not_applicable_for_hyphenated_guard_phrase():
    text = """
# Checker Maintenance Note

Status: COMPLETE_PENDING_REVIEW

The prior R72D drafting loop hit a rescan-guard self-reference phrase while
describing checker behavior, not an output that refreshed intake evidence.
"""
    assert check_text("docs/reviews/CVF_RESCAN_GUARD_FALSE_TRIGGER_NOTE.md", text) == []


def test_self_reference_without_section_is_not_applicable_when_wrapped_across_lines():
    text = """
# Checker Maintenance Note

Status: COMPLETE_PENDING_REVIEW

The sentence discussed the rescan
guard matching pattern itself, not a refreshed evidence output.
"""
    assert check_text("docs/reviews/CVF_RESCAN_GUARD_WRAP_NOTE.md", text) == []


def test_self_reference_without_section_ignores_bullet_section_name():
    text = """
# Checker Maintenance Note

Status: COMPLETE_PENDING_REVIEW

- Rescan Intelligence Hardening

The bullet above names a section label for discussion only.
"""
    assert check_text("docs/reviews/CVF_RESCAN_SECTION_NAME_NOTE.md", text) == []


def test_self_reference_without_section_handles_re_scan_maintenance_phrase():
    text = """
# Checker Maintenance Note

Status: COMPLETE_PENDING_REVIEW

The note described a re-scan-type maintenance false trigger, not an evidence
refresh output.
"""
    assert check_text("docs/reviews/CVF_RE_SCAN_TYPE_FALSE_TRIGGER_NOTE.md", text) == []
