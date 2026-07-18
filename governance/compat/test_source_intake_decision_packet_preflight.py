#!/usr/bin/env python3
"""Focused tests for check_source_intake_decision_packet_preflight.py.

Tests cover:
  - SIDP-01: missing required section despite applicability marker
  - SIDP-02: missing/blank required field
  - SIDP-03: missing required co-section
  - SIDP-04: escalation token without negative-search evidence or next action
  - Range filtering / non-applicable artifacts ignored
"""
from __future__ import annotations

import sys
import textwrap
import unittest
from pathlib import Path
from unittest.mock import patch

sys.path.insert(0, str(Path(__file__).resolve().parent))
import check_source_intake_decision_packet_preflight as checker

COMPLETE_PACKET = textwrap.dedent(
    """\
    # CVF Agent Work Order - Test Source Intake

    Status: DISPATCH_READY

    Source intake decision packet: REQUIRED

    ## Source Intake Decision Packet

    | Required field | Required content |
    | --- | --- |
    | Decision packet standard | `docs/reference/external_agent_review/CVF_KIOD_R8_SOURCE_INTAKE_DECISION_PACKET_STANDARD.md` |
    | Input root or repository | `example/source-repo` |
    | Bounded scope | documentation-only scan of top-level folders |
    | Enumeration authority | `rg --files --hidden --no-ignore example/source-repo` |
    | Owner-surface taxonomy | `docs/reference/external_agent_review/CVF_KIOD_R1_OWNER_SURFACE_TAXONOMY.md`; doctrine class |
    | Pre-scan packet source | `docs/reference/external_agent_review/CVF_KIOD_R2_PRE_SCAN_PACKET_STANDARD.md`; inline table below |
    | Overlap routing matrix | `docs/reference/external_agent_review/CVF_KIOD_R3_OVERLAP_ROUTING_MATRIX_STANDARD.md`; CONFIRMED_EXISTING |
    | Negative-search evidence | `rg -n "example-topic" docs governance` returned 0 matches |
    | Core disposition | ABSORB |
    | Value conversion requirement | DOCTRINE_ADAPTED |
    | Overlap classification requirement | CONFIRMED_EXISTING |
    | Worker output path | `docs/reviews/EXAMPLE_WORKER_RETURN.md` |
    | Forbidden scope | runtime, provider, package, public-sync |
    | Claim boundary | pre-dispatch evidence only; not proof of completed intake |

    ## External Knowledge Intake Routing

    | Field | Value |
    | --- | --- |
    | Chain map | example |

    ## External Absorption Core

    | Field | Value |
    | --- | --- |
    | Standard | example |

    ## External Absorption Value Conversion Matrix

    | Source item | Value extracted |
    | --- | --- |
    | example | example |

    ## Overlap And Novelty Classification

    | Source item or group | Overlap disposition |
    | --- | --- |
    | example | CONFIRMED_EXISTING |
    """
)


class TestSIDP01MissingSection(unittest.TestCase):
    """SIDP-01: missing required section despite applicability marker."""

    def _check(self, text: str) -> list[dict]:
        with patch.object(checker, "_read", return_value=text):
            return checker.check_artifact("docs/work_orders/TEST_2026-07-01.md")

    def test_violation_when_section_missing(self):
        text = "Source intake decision packet: REQUIRED\n\nNo packet section here.\n"
        violations = self._check(text)
        sidp01 = [v for v in violations if v["rule"] == "SIDP-01"]
        self.assertGreaterEqual(len(sidp01), 1, f"Expected SIDP-01 violation; got {violations}")

    def test_no_violation_when_marker_absent(self):
        text = "# No marker here\n\nJust prose.\n"
        violations = self._check(text)
        self.assertEqual(violations, [], "Artifacts without the applicability marker must be skipped")

    def test_no_violation_for_complete_packet(self):
        violations = self._check(COMPLETE_PACKET)
        sidp01 = [v for v in violations if v["rule"] == "SIDP-01"]
        self.assertEqual(sidp01, [])


class TestSIDP02MissingField(unittest.TestCase):
    """SIDP-02: missing or blank required field."""

    def _check(self, text: str) -> list[dict]:
        with patch.object(checker, "_read", return_value=text):
            return checker.check_artifact("docs/work_orders/TEST_2026-07-01.md")

    def test_violation_when_field_row_removed(self):
        text = COMPLETE_PACKET.replace(
            "| Forbidden scope | runtime, provider, package, public-sync |\n", ""
        )
        violations = self._check(text)
        sidp02 = [v for v in violations if v["rule"] == "SIDP-02"]
        self.assertGreaterEqual(len(sidp02), 1, f"Expected SIDP-02 violation; got {violations}")
        self.assertTrue(any("Forbidden scope" in v["message"] for v in sidp02))

    def test_violation_when_field_value_blank(self):
        text = COMPLETE_PACKET.replace(
            "| Claim boundary | pre-dispatch evidence only; not proof of completed intake |",
            "| Claim boundary | N/A |",
        )
        violations = self._check(text)
        sidp02 = [v for v in violations if v["rule"] == "SIDP-02"]
        self.assertGreaterEqual(len(sidp02), 1, f"Expected SIDP-02 violation; got {violations}")

    def test_no_violation_for_complete_packet(self):
        violations = self._check(COMPLETE_PACKET)
        sidp02 = [v for v in violations if v["rule"] == "SIDP-02"]
        self.assertEqual(sidp02, [])


class TestSIDP03MissingCoSection(unittest.TestCase):
    """SIDP-03: missing required co-section."""

    def _check(self, text: str) -> list[dict]:
        with patch.object(checker, "_read", return_value=text):
            return checker.check_artifact("docs/work_orders/TEST_2026-07-01.md")

    def test_violation_when_overlap_section_missing(self):
        text = COMPLETE_PACKET.split("## Overlap And Novelty Classification")[0]
        violations = self._check(text)
        sidp03 = [v for v in violations if v["rule"] == "SIDP-03"]
        self.assertGreaterEqual(len(sidp03), 1, f"Expected SIDP-03 violation; got {violations}")
        self.assertTrue(
            any("Overlap And Novelty Classification" in v["message"] for v in sidp03)
        )

    def test_no_violation_for_complete_packet(self):
        violations = self._check(COMPLETE_PACKET)
        sidp03 = [v for v in violations if v["rule"] == "SIDP-03"]
        self.assertEqual(sidp03, [])


class TestSIDP04EscalationEvidence(unittest.TestCase):
    """SIDP-04: escalation token without negative-search evidence or next action."""

    def _check(self, text: str) -> list[dict]:
        with patch.object(checker, "_read", return_value=text):
            return checker.check_artifact("docs/work_orders/TEST_2026-07-01.md")

    def test_violation_when_owner_not_found_without_evidence(self):
        text = COMPLETE_PACKET.replace(
            "| Overlap routing matrix | `docs/reference/external_agent_review/CVF_KIOD_R3_OVERLAP_ROUTING_MATRIX_STANDARD.md`; CONFIRMED_EXISTING |",
            "| Overlap routing matrix | OWNER_SURFACE_NOT_FOUND |",
        ).replace(
            "| Negative-search evidence | `rg -n \"example-topic\" docs governance` returned 0 matches |",
            "| Negative-search evidence | none recorded |",
        )
        violations = self._check(text)
        sidp04 = [v for v in violations if v["rule"] == "SIDP-04"]
        self.assertGreaterEqual(len(sidp04), 1, f"Expected SIDP-04 violation; got {violations}")

    def test_no_violation_when_owner_not_found_with_full_evidence(self):
        text = COMPLETE_PACKET.replace(
            "| Overlap routing matrix | `docs/reference/external_agent_review/CVF_KIOD_R3_OVERLAP_ROUTING_MATRIX_STANDARD.md`; CONFIRMED_EXISTING |",
            "| Overlap routing matrix | OWNER_SURFACE_NOT_FOUND; negative-search command `rg -n \"topic\" docs` found 0 matches; next governed action: route to KIOD-R4 decision |",
        )
        violations = self._check(text)
        sidp04 = [v for v in violations if v["rule"] == "SIDP-04"]
        self.assertEqual(sidp04, [])

    def test_violation_when_overlap_section_has_new_finding_without_next_action(self):
        text = COMPLETE_PACKET.replace(
            "| example | CONFIRMED_EXISTING |",
            "| example | NEW_FINDING |",
        )
        violations = self._check(text)
        sidp04 = [v for v in violations if v["rule"] == "SIDP-04"]
        self.assertGreaterEqual(len(sidp04), 1, f"Expected SIDP-04 violation; got {violations}")

    def test_no_violation_when_overlap_section_has_new_finding_with_full_evidence(self):
        text = COMPLETE_PACKET.replace(
            "| example | CONFIRMED_EXISTING |",
            "| example | NEW_FINDING; negative-search command `rg -n \"topic\" docs` found 0 matches; next governed action: follow-up work order `docs/work_orders/EXAMPLE.md` |",
        )
        violations = self._check(text)
        sidp04 = [v for v in violations if v["rule"] == "SIDP-04"]
        self.assertEqual(sidp04, [])

    def test_no_violation_for_confirmed_existing_disposition(self):
        violations = self._check(COMPLETE_PACKET)
        sidp04 = [v for v in violations if v["rule"] == "SIDP-04"]
        self.assertEqual(sidp04, [])


class TestRangeFilteringAndApplicability(unittest.TestCase):
    """Range filtering and non-applicable artifacts must be ignored."""

    def test_empty_changed_set_yields_compliant_report(self):
        with patch.object(checker, "_changed_paths", return_value=[]):
            report = checker._run_check("HEAD", "HEAD")
        self.assertEqual(report["checkedFileCount"], 0)
        self.assertTrue(report["compliant"])

    def test_applicable_path_filter_accepts_governed_dirs(self):
        self.assertTrue(checker._is_applicable_path("docs/baselines/FOO_2026-07-01.md"))
        self.assertTrue(checker._is_applicable_path("docs/work_orders/BAR_2026-07-01.md"))
        self.assertTrue(checker._is_applicable_path("docs/reviews/BAZ_2026-07-01.md"))
        self.assertTrue(checker._is_applicable_path("docs/roadmaps/QUX_2026-07-01.md"))

    def test_applicable_path_filter_rejects_other_dirs(self):
        self.assertFalse(checker._is_applicable_path("docs/audits/FOO_2026-07-01.md"))
        self.assertFalse(checker._is_applicable_path("docs/reference/BAR_2026-07-01.md"))

    def test_applicable_path_filter_rejects_archive_paths(self):
        self.assertFalse(checker._is_applicable_path("docs/baselines/archive/FOO_2026-07-01.md"))
        self.assertFalse(checker._is_applicable_path("docs/work_orders/archive/BAR.md"))

    def test_artifact_without_marker_skipped_entirely(self):
        with patch.object(checker, "_read", return_value="# No marker\n\nProse only.\n"):
            violations = checker.check_artifact("docs/work_orders/PLAIN_2026-07-01.md")
        self.assertEqual(violations, [])

    def test_backtick_quoted_marker_in_literal_token_list_not_applicable(self):
        """Regression: a dispatcher's own Checker Source Read-Ahead Block can
        cite the marker string inside a backtick-quoted literalTokensReviewed
        list as an example of what the worker must review, without declaring
        the artifact itself as a source-intake decision packet. A bare
        substring match false-triggers on this citation (see gotcha item 5)."""
        text = (
            "# Some Other Work Order\n\n"
            "Status: DISPATCH_READY\n\n"
            "## Checker Source Read-Ahead Block\n\n"
            "| Field | Value |\n"
            "| --- | --- |\n"
            "| literalTokensReviewed | `Status: DISPATCH_READY`; "
            "`Source intake decision packet: REQUIRED` |\n"
        )
        with patch.object(checker, "_read", return_value=text):
            violations = checker.check_artifact("docs/work_orders/OTHER_2026-07-01.md")
        self.assertEqual(
            violations,
            [],
            "Backtick-quoted marker citation inside another field must not trigger applicability",
        )

    def test_standalone_marker_line_is_applicable(self):
        text = (
            "# Real Source Intake Packet\n\n"
            "Status: DISPATCH_READY\n\n"
            "Source intake decision packet: REQUIRED\n\n"
            "## Source Intake Decision Packet\n\n"
            "no fields here\n"
        )
        with patch.object(checker, "_read", return_value=text):
            violations = checker.check_artifact("docs/work_orders/REAL_2026-07-01.md")
        self.assertTrue(violations, "Standalone marker line must trigger applicability")


if __name__ == "__main__":
    unittest.main()
