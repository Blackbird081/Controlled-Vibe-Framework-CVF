#!/usr/bin/env python3
"""Focused tests for the SOT3-RCS-T1 review-cost control checker."""

from __future__ import annotations

import importlib.util
import sys
import unittest
from pathlib import Path

_COMPAT_DIR = Path(__file__).resolve().parent
if str(_COMPAT_DIR) not in sys.path:
    sys.path.insert(0, str(_COMPAT_DIR))

_MODULE_PATH = _COMPAT_DIR / "check_review_cost_control.py"
_SPEC = importlib.util.spec_from_file_location("check_review_cost_control", _MODULE_PATH)
if _SPEC is None or _SPEC.loader is None:
    raise RuntimeError(f"Unable to load module from {_MODULE_PATH}")
chk = importlib.util.module_from_spec(_SPEC)
sys.modules[_SPEC.name] = chk
_SPEC.loader.exec_module(chk)


_HEADER = (
    "# CVF Example Completion Review\n\n"
    "Status: REVIEWER_ACCEPTED_BOUNDED\n\n"
    "docType: completion_review\n\n"
    "Review-Cost Telemetry: REQUIRED\n\n"
)


def _telemetry_block(
    *,
    reviewRoundCount="1",
    workerRepairTurnCount="1",
    newRootCauseCountThisRound="0",
    dependentFindingCountThisRound="0",
    elapsedReviewMinutes="15",
    providerCallCount="0",
    tokenOrQuotaUsage="NOT_AVAILABLE_WITH_REASON: not exposed",
    valueDelta="Closed one receipt-binding integrity gap.",
    stopDisposition="COMPLETE_REVIEW",
):
    return (
        "## Review Cost Telemetry And Stop Disposition\n\n"
        f"reviewRoundCount: {reviewRoundCount}\n"
        f"workerRepairTurnCount: {workerRepairTurnCount}\n"
        f"newRootCauseCountThisRound: {newRootCauseCountThisRound}\n"
        f"dependentFindingCountThisRound: {dependentFindingCountThisRound}\n"
        f"elapsedReviewMinutes: {elapsedReviewMinutes}\n"
        f"providerCallCount: {providerCallCount}\n"
        f"tokenOrQuotaUsage: {tokenOrQuotaUsage}\n"
        f"valueDelta: {valueDelta}\n"
        f"stopDisposition: {stopDisposition}\n"
    )


_VALID = _HEADER + _telemetry_block()

_MISSING_FIELDS = _HEADER + (
    "## Review Cost Telemetry And Stop Disposition\n\n"
    "reviewRoundCount: 1\n"
    "stopDisposition: COMPLETE_REVIEW\n"
)

_INVALID_INTEGER = _HEADER + _telemetry_block(workerRepairTurnCount="two")

_INVALID_UNAVAILABLE_FIELD = _HEADER + _telemetry_block(
    elapsedReviewMinutes="unknown"
)

_BARE_UNAVAILABLE_FIELD = _HEADER + _telemetry_block(
    elapsedReviewMinutes="NOT_AVAILABLE_WITH_REASON"
)

_VALUE_DELTA_BARE_NUMBER = _HEADER + _telemetry_block(valueDelta="5")

_INVALID_STOP_TOKEN = _HEADER + _telemetry_block(stopDisposition="MAYBE_LATER")

_ROUND_THREE_VALID_ESCALATION = _HEADER + _telemetry_block(
    reviewRoundCount="3", stopDisposition="REVIEW_COST_ESCALATION_REQUIRED"
)

_ROUND_THREE_VALID_CONTINUE = _HEADER + _telemetry_block(
    reviewRoundCount="4", stopDisposition="CONTINUE_NEW_CRITICAL_EVIDENCE"
)

_ROUND_THREE_INVALID_COMPLETE = _HEADER + _telemetry_block(
    reviewRoundCount="3", stopDisposition="COMPLETE_REVIEW"
)

_ROUND_THREE_INVALID_PARK = _HEADER + _telemetry_block(
    reviewRoundCount="5", stopDisposition="PARK_LOW_INCREMENTAL_VALUE"
)

_NO_DECLARATION = (
    "# Historical Completion Review\n\n"
    "Status: REVIEWER_ACCEPTED_BOUNDED\n\n"
    "docType: completion_review\n\n"
    "This changed completion review omitted mandatory telemetry.\n"
)

_QUOTED_MARKER_STANDARD = (
    "# Some Standard\n\n"
    "docType: reference\n\n"
    "A completion review opts in via the exact line "
    "`Review-Cost Telemetry: REQUIRED`.\n"
)

_QUOTED_MARKER_FENCED = (
    "# Some Work Order\n\n"
    "```text\n"
    "Review-Cost Telemetry: REQUIRED\n"
    "```\n"
)

_ARCHIVE_PATH = "docs/reviews/archive/CVF_OLD_2026-01-01.md"


class ApplicabilityTests(unittest.TestCase):
    def test_declared_review_is_applicable(self):
        self.assertTrue(chk.is_applicable("docs/reviews/x.md", _VALID))

    def test_no_declaration_completion_review_is_applicable(self):
        self.assertTrue(chk.is_applicable("docs/reviews/x.md", _NO_DECLARATION))

    def test_backtick_quoted_marker_in_standard_not_applicable(self):
        self.assertFalse(
            chk.is_applicable(
                "docs/reference/review_cost_control/CVF_REVIEW_COST_AND_DIMINISHING_RETURN_CONTROL_STANDARD.md",
                _QUOTED_MARKER_STANDARD,
            )
        )

    def test_fenced_marker_in_work_order_not_applicable(self):
        self.assertFalse(
            chk.is_applicable("docs/work_orders/x.md", _QUOTED_MARKER_FENCED)
        )

    def test_non_reviews_path_not_applicable(self):
        self.assertFalse(chk.is_applicable("docs/baselines/x.md", _VALID))

    def test_archive_path_excluded(self):
        self.assertFalse(chk.is_applicable(_ARCHIVE_PATH, _VALID))

    def test_own_source_excluded(self):
        self.assertFalse(
            chk.is_applicable(chk.THIS_CHECKER_PATH, "Review-Cost Telemetry: REQUIRED\n")
        )

    def test_non_markdown_excluded(self):
        self.assertFalse(chk.is_applicable("docs/reviews/x.py", _VALID))


class DiagnoseTests(unittest.TestCase):
    def test_valid_declaration_is_clean(self):
        d = chk.diagnose("docs/reviews/x.md", _VALID)
        self.assertTrue(d.applicable)
        self.assertTrue(d.is_clean)
        self.assertEqual(d.issues, ())

    def test_missing_fields_flagged(self):
        d = chk.diagnose("docs/reviews/x.md", _MISSING_FIELDS)
        self.assertTrue(d.applicable)
        self.assertFalse(d.is_clean)
        missing = [i for i in d.issues if "missing required field" in i]
        self.assertEqual(len(missing), len(chk.ALL_FIELDS) - 2)

    def test_invalid_integer_flagged(self):
        d = chk.diagnose("docs/reviews/x.md", _INVALID_INTEGER)
        self.assertFalse(d.is_clean)
        self.assertTrue(any("workerRepairTurnCount" in i for i in d.issues))

    def test_invalid_unavailable_field_flagged(self):
        d = chk.diagnose("docs/reviews/x.md", _INVALID_UNAVAILABLE_FIELD)
        self.assertFalse(d.is_clean)
        self.assertTrue(any("elapsedReviewMinutes" in i for i in d.issues))

    def test_unavailable_field_with_reason_is_clean(self):
        d = chk.diagnose("docs/reviews/x.md", _VALID)
        self.assertTrue(d.is_clean)

    def test_bare_unavailable_reason_is_rejected(self):
        d = chk.diagnose("docs/reviews/x.md", _BARE_UNAVAILABLE_FIELD)
        self.assertFalse(d.is_clean)
        self.assertTrue(any("elapsedReviewMinutes" in i for i in d.issues))

    def test_value_delta_bare_number_flagged(self):
        d = chk.diagnose("docs/reviews/x.md", _VALUE_DELTA_BARE_NUMBER)
        self.assertFalse(d.is_clean)
        self.assertTrue(any("valueDelta" in i for i in d.issues))

    def test_invalid_stop_token_flagged(self):
        d = chk.diagnose("docs/reviews/x.md", _INVALID_STOP_TOKEN)
        self.assertFalse(d.is_clean)
        self.assertTrue(any("stopDisposition" in i for i in d.issues))


class RoundThreeEscalationTests(unittest.TestCase):
    def test_round_three_escalation_token_is_clean(self):
        d = chk.diagnose("docs/reviews/x.md", _ROUND_THREE_VALID_ESCALATION)
        self.assertTrue(d.is_clean)

    def test_round_four_continue_token_is_clean(self):
        d = chk.diagnose("docs/reviews/x.md", _ROUND_THREE_VALID_CONTINUE)
        self.assertTrue(d.is_clean)

    def test_round_three_complete_review_rejected(self):
        d = chk.diagnose("docs/reviews/x.md", _ROUND_THREE_INVALID_COMPLETE)
        self.assertFalse(d.is_clean)
        self.assertTrue(any("reviewRoundCount >= 3" in i for i in d.issues))

    def test_round_five_park_rejected(self):
        d = chk.diagnose("docs/reviews/x.md", _ROUND_THREE_INVALID_PARK)
        self.assertFalse(d.is_clean)
        self.assertTrue(any("reviewRoundCount >= 3" in i for i in d.issues))

    def test_round_two_allows_any_valid_token(self):
        text = _HEADER + _telemetry_block(
            reviewRoundCount="2", stopDisposition="PARK_LOW_INCREMENTAL_VALUE"
        )
        d = chk.diagnose("docs/reviews/x.md", text)
        self.assertTrue(d.is_clean)


class HistoricalExclusionTests(unittest.TestCase):
    def test_changed_completion_review_without_declaration_is_flagged(self):
        d = chk.diagnose("docs/reviews/CVF_CHANGED_REVIEW.md", _NO_DECLARATION)
        self.assertTrue(d.applicable)
        self.assertFalse(d.is_clean)
        self.assertTrue(any("missing exact standalone declaration" in i for i in d.issues))

    def test_archived_completion_review_is_excluded(self):
        d = chk.diagnose(_ARCHIVE_PATH, _NO_DECLARATION)
        self.assertFalse(d.applicable)
        self.assertTrue(d.is_clean)


class RunIntegrationTests(unittest.TestCase):
    def test_run_returns_only_applicable_diagnostics(self):
        # run() drives off changed-path discovery; here we exercise diagnose()
        # directly per path to keep the test hermetic (no git dependency).
        paths_and_texts = {
            "docs/reviews/a.md": _VALID,
            "docs/reviews/b.md": _NO_DECLARATION,
            "docs/work_orders/c.md": _QUOTED_MARKER_FENCED,
        }
        applicable = [
            p for p, t in paths_and_texts.items() if chk.is_applicable(p, t)
        ]
        self.assertEqual(applicable, ["docs/reviews/a.md", "docs/reviews/b.md"])


if __name__ == "__main__":
    unittest.main()
