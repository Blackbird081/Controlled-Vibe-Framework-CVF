"""
Tests for check_equivalence_claim_evidence.py (EQC-T1)

Covers the four Required Proof Manifest tests from the work order:
  - test_flags_claim_without_evidence
  - test_allows_claim_with_evidence_command
  - test_allows_claim_with_disposition_token
  - test_no_path_reference_does_not_fire

Plus additional coverage for:
  - all closed phrase list entries
  - archive path exclusion
  - code-fence exclusion
  - work-order file with worker-return block
  - work-order file without worker-return block (should not fire)
"""

from __future__ import annotations

import sys
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parents[0]))

from check_equivalence_claim_evidence import (
    check_text,
    _has_worker_return_block,
    _is_applicable,
    EQUIVALENCE_PHRASES,
    DISPOSITION_TOKENS,
)

REVIEWS_PATH = "docs/reviews/CVF_SOME_WORKER_RETURN_2026-06-25.md"
WORK_ORDER_PATH = "docs/work_orders/CVF_SOME_WORK_ORDER_FOR_WORKER_2026-06-25.md"
ARCHIVE_PATH = "docs/reviews/archive/CVF_OLD_REVIEW_2026-01-01.md"


# ---------------------------------------------------------------------------
# Required Proof Manifest test 1
# ---------------------------------------------------------------------------

def test_flags_claim_without_evidence():
    """Violation raised on bare equivalence claim near a path-like token."""
    text = (
        "The implementation is verbatim from `governance/compat/check_foo.py` "
        "and requires no changes."
    )
    violations = check_text(REVIEWS_PATH, text)
    assert len(violations) == 1
    v = violations[0]
    assert v["type"] == "equivalence_claim_without_evidence"
    assert "verbatim" in v["message"]


# ---------------------------------------------------------------------------
# Required Proof Manifest test 2
# ---------------------------------------------------------------------------

def test_allows_claim_with_evidence_command():
    """No violation when an evidence command is adjacent to the same cited path."""
    text = (
        "The clause is identical to `governance/compat/check_foo.py`.\n\n"
        "```\n"
        "rg 'def main' governance/compat/check_foo.py\n"
        "```\n"
        "Result: identical match confirmed."
    )
    violations = check_text(REVIEWS_PATH, text)
    assert violations == []


# ---------------------------------------------------------------------------
# Required Proof Manifest test 3
# ---------------------------------------------------------------------------

def test_allows_claim_with_disposition_token():
    """No violation when a disposition token is adjacent to the same cited path."""
    for token in DISPOSITION_TOKENS:
        text = (
            f"The field is identical to `docs/reference/some_contract.md`. "
            f"{token} - confirmed after review."
        )
        violations = check_text(REVIEWS_PATH, text)
        assert violations == [], (
            f"Expected no violation when disposition token '{token}' is present, "
            f"got: {violations}"
        )


# ---------------------------------------------------------------------------
# Required Proof Manifest test 4
# ---------------------------------------------------------------------------

def test_no_path_reference_does_not_fire():
    """No false-fire on isolated equivalence phrase with no nearby path-like token."""
    text = (
        "The approach is verbatim from the original specification.\n"
        "No file path is referenced in this paragraph."
    )
    violations = check_text(REVIEWS_PATH, text)
    assert violations == []


# ---------------------------------------------------------------------------
# Additional phrase coverage
# ---------------------------------------------------------------------------

@pytest.mark.parametrize("phrase", EQUIVALENCE_PHRASES)
def test_all_phrases_detected(phrase):
    """Every phrase in the closed list triggers a violation when no evidence is adjacent."""
    text = (
        f"The field mapping is {phrase} in `docs/reference/some_contract.md`. "
        "No additional changes were needed."
    )
    violations = check_text(REVIEWS_PATH, text)
    assert len(violations) >= 1, (
        f"Expected violation for phrase '{phrase}', got none. text={text!r}"
    )


# ---------------------------------------------------------------------------
# git diff evidence
# ---------------------------------------------------------------------------

def test_allows_claim_with_git_diff_no_index():
    """No violation when git diff --no-index is adjacent."""
    text = (
        "The field is same as `docs/reference/some_contract.md`. "
        "git diff --no-index docs/reference/some_contract.md current_output.md "
        "showed zero diff lines."
    )
    violations = check_text(REVIEWS_PATH, text)
    assert violations == []


def test_allows_claim_with_git_diff():
    """No violation when git diff (any form) is adjacent."""
    text = (
        "Output is identical to `docs/reference/some_contract.md`. "
        "git diff HEAD docs/reference/some_contract.md returned empty."
    )
    violations = check_text(REVIEWS_PATH, text)
    assert violations == []


# ---------------------------------------------------------------------------
# Archive path exclusion
# ---------------------------------------------------------------------------

def test_archive_path_not_checked():
    """Files under archive/ are excluded."""
    text = (
        "The field is verbatim from `docs/reference/some_contract.md`. "
        "No adjacent evidence."
    )
    violations = check_text(ARCHIVE_PATH, text)
    assert violations == []


# ---------------------------------------------------------------------------
# Code-fence exclusion
# ---------------------------------------------------------------------------

def test_phrase_inside_code_fence_not_fired():
    """Phrase inside a markdown code fence must not trigger a violation."""
    text = (
        "Here is sample output:\n"
        "```\n"
        "verbatim from `docs/reference/some_contract.md` - no change\n"
        "```\n"
        "End of sample."
    )
    violations = check_text(REVIEWS_PATH, text)
    assert violations == []


# ---------------------------------------------------------------------------
# Work-order with and without worker-return block
# ---------------------------------------------------------------------------

def test_work_order_with_worker_return_block_is_checked():
    """Work-order file containing a worker-return marker is checked."""
    text = (
        "Worker Status: COMPLETE_PENDING_REVIEW\n\n"
        "The field is identical to `docs/reference/some_contract.md`."
    )
    violations = check_text(WORK_ORDER_PATH, text)
    assert len(violations) >= 1


def test_work_order_without_worker_return_block_is_skipped():
    """Work-order file with no worker-return marker is not checked."""
    text = (
        "This is a dispatch-only work order.\n\n"
        "The field is identical to `docs/reference/some_contract.md`. "
        "No worker-return block present."
    )
    violations = check_text(WORK_ORDER_PATH, text)
    assert violations == []


# ---------------------------------------------------------------------------
# _has_worker_return_block helper
# ---------------------------------------------------------------------------

def test_has_worker_return_block_detects_marker():
    assert _has_worker_return_block("Worker Status: COMPLETE_PENDING_REVIEW")
    assert _has_worker_return_block("Status: BLOCKED_WITH_REASON")
    assert not _has_worker_return_block("Dispatch complete. No worker block.")


# ---------------------------------------------------------------------------
# _is_applicable helper
# ---------------------------------------------------------------------------

def test_is_applicable_reviews():
    assert _is_applicable(REVIEWS_PATH, "Any review text")


def test_is_applicable_archive_false():
    assert not _is_applicable(ARCHIVE_PATH, "Any text")


def test_is_applicable_work_order_needs_worker_return():
    assert not _is_applicable(WORK_ORDER_PATH, "Dispatch only text")
    assert _is_applicable(WORK_ORDER_PATH, "Worker Status: COMPLETE_PENDING_REVIEW")


# ---------------------------------------------------------------------------
# Multi-violation in same file
# ---------------------------------------------------------------------------

def test_multiple_phrases_same_file():
    """Multiple unverified claims in the same file produce multiple violations."""
    text = (
        "The field is verbatim from `docs/reference/some_contract.md`.\n\n"
        "The mapping is identical to `docs/reference/other_contract.md`."
    )
    violations = check_text(REVIEWS_PATH, text)
    assert len(violations) == 2


# ---------------------------------------------------------------------------
# Disposition token in wrong paragraph does not satisfy
# ---------------------------------------------------------------------------

def test_disposition_token_far_away_does_not_clear():
    """A disposition token more than EVIDENCE_WINDOW chars away should not clear the violation."""
    spacer = " " * 500
    text = (
        f"MATCH - confirmed.{spacer}"
        "The field is identical to `docs/reference/some_contract.md`."
    )
    violations = check_text(REVIEWS_PATH, text)
    # The disposition token is more than 400 chars away; expect a violation.
    assert len(violations) >= 1


def test_unchanged_is_not_a_hard_equivalence_trigger():
    """Plain status wording should not force evidence when it only says unchanged."""
    text = (
        "The changed set status for `docs/reference/some_contract.md` is "
        "unchanged after review."
    )
    violations = check_text(REVIEWS_PATH, text)
    assert violations == []


# ---------------------------------------------------------------------------
# Table row evidence (markdown table)
# ---------------------------------------------------------------------------

def test_allows_claim_with_markdown_table_evidence():
    """A markdown table separator row adjacent to the claim satisfies the evidence requirement."""
    text = (
        "The field is reused exactly from `docs/reference/some_contract.md`.\n"
        "| Field | Old value | New value |\n"
        "| --- | --- | --- |\n"
        "| name | foo | foo |\n"
    )
    violations = check_text(REVIEWS_PATH, text)
    assert violations == []
