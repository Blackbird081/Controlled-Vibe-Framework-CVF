#!/usr/bin/env python3
"""Focused tests for check_dispatch_packet_lifecycle_hygiene.py.

Tests cover:
  - LH-01: stale active-handoff reference in changed dispatch-ready artifact
  - LH-02: closed-lane stale DISPATCH_READY packet
  - LH-03: provider-specific normative role assignment
  - Unchanged / non-dispatch-ready artifacts ignored by range
"""
from __future__ import annotations

import sys
import textwrap
import unittest
from pathlib import Path
from unittest.mock import patch

sys.path.insert(0, str(Path(__file__).resolve().parent))
import check_dispatch_packet_lifecycle_hygiene as checker

ACTIVE_HANDOFF = "AGENT_HANDOFF_V30_2026-07-01.md"
STALE_HANDOFF = "AGENT_HANDOFF_V29_2026-06-30.md"

BASE_DISPATCH = textwrap.dedent(
    """\
    # CVF Agent Work Order - Test

    Status: DISPATCH_READY

    Batch ID: TEST-R1

    ## Agent Roles

    | Role | Owner | Responsibility |
    | --- | --- | --- |
    | Dispatcher | dispatcher | author packet |
    | Worker | worker | implement and return |
    | Reviewer/closer | reviewer/closer | accept and commit |

    ## Agent Handoff Contract Control Block

    | Field | Value |
    | --- | --- |
    | route | MULTI_AGENT_MULTI_ROLE |
    | rolePattern | dispatcher authors packet; worker returns uncommitted implementation evidence; reviewer/closer accepts |
    """
)


class TestLH01StaleActiveHandoff(unittest.TestCase):
    """LH-01: stale active-handoff reference in changed dispatch packet."""

    def _check(self, text: str, active: str = ACTIVE_HANDOFF) -> list[dict]:
        with (
            patch.object(checker, "_active_handoff", return_value=active),
            patch.object(checker, "_closed_lane_text", return_value=""),
            patch.object(checker, "_read", return_value=text),
        ):
            return checker.check_artifact("docs/work_orders/TEST_2026-07-01.md")

    def test_no_violation_when_handoff_matches_active(self):
        text = BASE_DISPATCH + f"\nActive handoff: `{ACTIVE_HANDOFF}`\n"
        violations = self._check(text)
        lh01 = [v for v in violations if v["rule"] == "LH-01"]
        self.assertEqual(lh01, [])

    def test_violation_when_stale_handoff_referenced_unqualified(self):
        text = BASE_DISPATCH + f"\nActive handoff is `{STALE_HANDOFF}`\n"
        violations = self._check(text)
        lh01 = [v for v in violations if v["rule"] == "LH-01"]
        self.assertGreaterEqual(len(lh01), 1, f"Expected LH-01 violation; got {violations}")
        self.assertIn(STALE_HANDOFF, lh01[0]["message"])

    def test_no_violation_for_archive_qualified_reference(self):
        text = BASE_DISPATCH + (
            f"\nSee `CVF_SESSION/handoffs/archive/{STALE_HANDOFF}` for historical context.\n"
        )
        violations = self._check(text)
        lh01 = [v for v in violations if v["rule"] == "LH-01"]
        self.assertEqual(lh01, [], "Archive-qualified references must not be flagged")

    def test_no_violation_when_artifact_not_dispatch_ready(self):
        text = BASE_DISPATCH.replace("Status: DISPATCH_READY", "Status: CLOSED_PASS_BOUNDED")
        text += f"\n{STALE_HANDOFF}\n"
        violations = self._check(text)
        self.assertEqual(violations, [], "Non-dispatch-ready artifacts must be skipped entirely")

    def test_no_violation_when_active_handoff_unavailable(self):
        text = BASE_DISPATCH + f"\n{STALE_HANDOFF}\n"
        with (
            patch.object(checker, "_active_handoff", return_value=""),
            patch.object(checker, "_closed_lane_text", return_value=""),
            patch.object(checker, "_read", return_value=text),
        ):
            violations = checker.check_artifact("docs/work_orders/TEST_2026-07-01.md")
        lh01 = [v for v in violations if v["rule"] == "LH-01"]
        self.assertEqual(lh01, [], "LH-01 must be skipped when bootstrap file is unavailable")


class TestLH02ClosedLane(unittest.TestCase):
    """LH-02: closed-lane stale DISPATCH_READY packet."""

    def _check(self, text: str, closed_text: str) -> list[dict]:
        with (
            patch.object(checker, "_active_handoff", return_value=ACTIVE_HANDOFF),
            patch.object(checker, "_closed_lane_text", return_value=closed_text),
            patch.object(checker, "_read", return_value=text),
        ):
            return checker.check_artifact("docs/work_orders/TEST_2026-07-01.md")

    def test_violation_when_lane_is_closed(self):
        closed_text = (
            "| KIOD-R5 Packet-Blocked Pilot | `be6be4e2` | CLOSED_PASS_BOUNDED; accepted |"
        )
        text = BASE_DISPATCH.replace("Batch ID: TEST-R1", "Batch ID: KIOD-R5")
        violations = self._check(text, closed_text)
        lh02 = [v for v in violations if v["rule"] == "LH-02"]
        self.assertGreaterEqual(len(lh02), 1, f"Expected LH-02 violation; got {violations}")
        self.assertIn("KIOD-R5", lh02[0]["message"])

    def test_no_violation_when_lane_not_in_closed_text(self):
        closed_text = "| KIOD-R8 Future Tranche | `pending` | DISPATCH_READY; |"
        text = BASE_DISPATCH.replace("Batch ID: TEST-R1", "Batch ID: KIOD-R8")
        violations = self._check(text, closed_text)
        lh02 = [v for v in violations if v["rule"] == "LH-02"]
        self.assertEqual(lh02, [])

    def test_no_violation_when_closed_token_far_from_lane_key(self):
        padding = "X" * 500
        closed_text = f"KIOD-R9 relevant lane{padding}CLOSED_PASS_BOUNDED unrelated lane"
        text = BASE_DISPATCH.replace("Batch ID: TEST-R1", "Batch ID: KIOD-R9")
        violations = self._check(text, closed_text)
        lh02 = [v for v in violations if v["rule"] == "LH-02"]
        self.assertEqual(lh02, [], "Closed token outside window must not trigger LH-02")

    def test_no_violation_when_artifact_not_dispatch_ready(self):
        closed_text = "| KIOD-R5 | CLOSED_PASS_BOUNDED |"
        text = BASE_DISPATCH.replace("Status: DISPATCH_READY", "Status: CLOSED_PASS_BOUNDED")
        text = text.replace("Batch ID: TEST-R1", "Batch ID: KIOD-R5")
        violations = self._check(text, closed_text)
        self.assertEqual(violations, [])


class TestLH03ProviderSpecificRole(unittest.TestCase):
    """LH-03: provider-specific normative role assignment."""

    def _check(self, text: str) -> list[dict]:
        with (
            patch.object(checker, "_active_handoff", return_value=ACTIVE_HANDOFF),
            patch.object(checker, "_closed_lane_text", return_value=""),
            patch.object(checker, "_read", return_value=text),
        ):
            return checker.check_artifact("docs/work_orders/TEST_2026-07-01.md")

    def test_violation_when_provider_name_in_agent_roles_table(self):
        text = BASE_DISPATCH.replace(
            "| Worker | worker | implement and return |",
            "| Worker | Claude | implement and return |",
        )
        violations = self._check(text)
        lh03 = [v for v in violations if v["rule"] == "LH-03"]
        self.assertGreaterEqual(len(lh03), 1, f"Expected LH-03 violation; got {violations}")
        self.assertIn("Claude", lh03[0]["message"])

    def test_violation_when_provider_name_in_role_pattern_field(self):
        text = BASE_DISPATCH.replace(
            "| rolePattern | dispatcher authors packet; worker returns uncommitted implementation evidence; reviewer/closer accepts |",
            "| rolePattern | Claude authors packet; worker returns; reviewer/closer accepts |",
        )
        violations = self._check(text)
        lh03 = [v for v in violations if v["rule"] == "LH-03"]
        self.assertGreaterEqual(len(lh03), 1, f"Expected LH-03 violation; got {violations}")

    def test_no_violation_for_role_neutral_assignment(self):
        violations = self._check(BASE_DISPATCH)
        lh03 = [v for v in violations if v["rule"] == "LH-03"]
        self.assertEqual(lh03, [], "Role-neutral dispatch packet must not be flagged")

    def test_no_violation_for_provider_name_outside_agent_roles(self):
        text = BASE_DISPATCH + (
            "\n## Evidence\n\n"
            "Prior live run with Claude provider: receipt abc123.\n"
        )
        violations = self._check(text)
        lh03 = [v for v in violations if v["rule"] == "LH-03"]
        self.assertEqual(
            lh03,
            [],
            "Provider names outside Agent Roles / rolePattern must not be flagged",
        )


class TestUnchangedHistoricalArtifactsIgnoredByRange(unittest.TestCase):
    """Unchanged historical artifacts must not be inspected."""

    def test_empty_changed_set_yields_compliant_report(self):
        with patch.object(checker, "_changed_paths", return_value=[]):
            report = checker._run_check("HEAD", "HEAD")
        self.assertEqual(report["checkedFileCount"], 0)
        self.assertTrue(report["compliant"])

    def test_applicable_path_filter_accepts_baselines_and_work_orders(self):
        self.assertTrue(checker._is_applicable("docs/baselines/FOO_2026-07-01.md"))
        self.assertTrue(checker._is_applicable("docs/work_orders/BAR_2026-07-01.md"))

    def test_applicable_path_filter_rejects_reviews_and_roadmaps(self):
        self.assertFalse(checker._is_applicable("docs/reviews/FOO_2026-07-01.md"))
        self.assertFalse(checker._is_applicable("docs/roadmaps/BAR_2026-07-01.md"))
        self.assertFalse(checker._is_applicable("docs/audits/BAZ_2026-07-01.md"))

    def test_applicable_path_filter_rejects_archive_paths(self):
        self.assertFalse(
            checker._is_applicable("docs/baselines/archive/FOO_2026-07-01.md")
        )
        self.assertFalse(
            checker._is_applicable("docs/work_orders/archive/BAR.md")
        )

    def test_non_dispatch_ready_artifact_skipped(self):
        closed_text = "Status: CLOSED_PASS_BOUNDED\n\nBatch ID: TEST-R1\n"
        with (
            patch.object(checker, "_active_handoff", return_value=ACTIVE_HANDOFF),
            patch.object(checker, "_closed_lane_text", return_value=""),
            patch.object(checker, "_read", return_value=closed_text),
        ):
            violations = checker.check_artifact("docs/baselines/CLOSED_2026-07-01.md")
        self.assertEqual(violations, [], "Closed artifact must yield no violations")


if __name__ == "__main__":
    unittest.main()
