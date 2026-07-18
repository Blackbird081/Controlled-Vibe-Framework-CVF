#!/usr/bin/env python3
"""
Focused tests for check_work_order_dispatch_quality_lifecycle.py.

GFS-PY T2: verifies lifecycle/status validators extracted from the
dispatch-quality monolith preserve the original status and finality behavior.
"""

from __future__ import annotations

from check_work_order_dispatch_quality_lifecycle import (
    _extract_status,
    _is_closed_status,
    _is_dispatch_status,
    _is_hold_status,
    _validate_closed_artifact_finality,
    _validate_closed_roadmap_status_residue,
    _validate_dispatch_pending_dependency_language,
    _validate_fast_lane_status_consistency,
    _validate_pending_artifact_evidence_finality,
    _validate_ready_dependency_release,
    _validate_self_reported_gate_evidence_consistency,
    _validate_status_token_hygiene,
)


def test_extract_status_reads_top_status_line():
    assert _extract_status("# Test\nStatus: DISPATCH_READY\n") == "DISPATCH_READY"


def test_status_classifiers_preserve_original_semantics():
    assert _is_dispatch_status("DISPATCHED_TO_WORKER") is True
    assert _is_dispatch_status("READY_FOR_IMPLEMENTATION") is True
    assert _is_dispatch_status("CLOSED_PASS_BOUNDED") is True
    assert _is_hold_status("HOLD_PENDING_T1") is True
    assert _is_hold_status("PROPOSED") is True
    assert _is_hold_status("DRAFT") is True
    assert _is_closed_status("CLOSED_PASS_BOUNDED") is True
    assert _is_closed_status("COMPLETE_PENDING_REVIEW") is False


def test_hold_status_with_closed_token_fails():
    issues = _validate_status_token_hygiene("Status: HOLD_UNTIL_T1_CLOSED_PASS\n", "work order")
    assert issues == [
        "work order hold/draft/proposed status must not contain `CLOSED`; "
        "use PASS or SATISFIED wording for prerequisite status tokens"
    ]


def test_closed_artifact_finality_finds_open_rows_and_unchecked_items():
    text = """\
Status: CLOSED_PASS_BOUNDED

| Item | Status |
| --- | --- |
| x | OPEN |
| y | HOLD_PENDING_T1 |

- [ ] unresolved
"""
    issues = _validate_closed_artifact_finality(text, "work order")
    assert "closed work order contains 1 table row(s) still marked OPEN" in issues
    assert "closed work order contains 1 unchecked checklist item(s)" in issues
    assert "closed work order contains 1 table row(s) still marked HOLD/PENDING/READY_FOR_DISPATCH" in issues


def test_closed_roadmap_status_residue_detects_ready_and_hold_tokens():
    text = "Status: CLOSED_PASS_BOUNDED\n\nT2 is WORK_ORDER_READY. T3 HOLD_UNTIL_T2_PASS.\n"
    issues = _validate_closed_roadmap_status_residue(text)
    assert any("closed roadmap contains stale dispatch/hold status residue" in issue for issue in issues)


def test_fast_lane_active_with_pass_position_fails():
    text = "Status: ACTIVE\n\nDisposition: PASS\n"
    assert _validate_fast_lane_status_consistency(text) == [
        "fast-lane audit status is still ACTIVE/DRAFT/HOLD while disposition or decision is pass/approve"
    ]


def test_dispatch_pending_dependency_language_fails():
    text = "Prerequisite: DSCP-T6 `CLOSED_PASS_BOUNDED` pending reviewer commit.\n"
    assert _validate_dispatch_pending_dependency_language(text, "work order") == [
        "dispatch/ready work order contains pending predecessor release language next to "
        "`CLOSED_PASS` evidence; keep status HOLD/DRAFT until the prerequisite closure commit exists"
    ]


def test_ready_dependency_release_required_row_fails():
    text = """\
| Dependency | Disposition |
| --- | --- |
| prior closure | REQUIRED |
"""
    issues = _validate_ready_dependency_release(text, lambda _commit, _path: True)
    assert issues == [
        "dispatch/ready work order contains unresolved prerequisite disposition `REQUIRED`; "
        "release HOLD only after replacing it with source-backed ACCEPT evidence per "
        "docs/reference/CVF_WORK_ORDER_DEPENDENCY_RELEASE_EVIDENCE_STANDARD_2026-06-03.md"
    ]


def test_ready_dependency_release_commit_path_mismatch_fails():
    text = "`docs/reviews/CVF_DONE.md` at commit `abcdef1`\n"
    issues = _validate_ready_dependency_release(text, lambda _commit, _path: False)
    assert issues == [
        "dispatch/ready work order cites dependency artifact "
        "`docs/reviews/CVF_DONE.md` at commit `abcdef1`, but that commit does not contain the path; "
        "cite the closure commit that contains the prerequisite artifact per "
        "docs/reference/CVF_WORK_ORDER_DEPENDENCY_RELEASE_EVIDENCE_STANDARD_2026-06-03.md"
    ]


def test_pending_artifact_clean_status_claim_fails():
    text = "- `git status --short` -> clean\n"
    issues = _validate_pending_artifact_evidence_finality(
        "docs/reviews/CVF_PENDING_REVIEW.md",
        text,
        {"M"},
    )
    assert "pending changed artifact records `git status --short` as clean even though the artifact itself is not committed; record the actual pending status or commit first" in issues


def test_self_reported_failed_gate_requires_blocking_status():
    text = "Status: COMPLETE_PENDING_REVIEW\n\n- `python governance/compat/check_work_order_dispatch_quality.py` -> FAIL\n"
    issues = _validate_self_reported_gate_evidence_consistency(text)
    assert issues == [
        "artifact records a failed self-reported governance gate while status is not BLOCKED/HOLD; "
        "repair allowed-scope failures and rerun, or mark the artifact BLOCKED with return action"
    ]
