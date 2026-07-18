#!/usr/bin/env python3
"""
Focused tests for check_memory_consolidation_artifact_quality.py

Tests cover:
- missing source authority
- unresolved relative-date phrases (English and Vietnamese ASCII)
- TIME_AMBIGUOUS_BLOCKED incorrectly promoted
- rawMemoryReleased=true present
- missing rawMemoryReleased=false on retrieval-facing sections
- missing operator-visible review packet sections
- missing public export disposition in review packets
- positive (clean) path: compliant MEMCON artifact passes
- inapplicable path (no MEMCON marker): not checked
- archived files: skipped
- quoted source evidence: relative date allowed
"""

from __future__ import annotations

import importlib.util
import sys
import unittest
from pathlib import Path


MODULE_PATH = Path(__file__).resolve().with_name("check_memory_consolidation_artifact_quality.py")
SPEC = importlib.util.spec_from_file_location("check_memory_consolidation_artifact_quality", MODULE_PATH)
if SPEC is None or SPEC.loader is None:
    raise RuntimeError(f"Unable to load module from {MODULE_PATH}")
MODULE = importlib.util.module_from_spec(SPEC)
sys.modules[SPEC.name] = MODULE
SPEC.loader.exec_module(MODULE)


CLEAN_PATH = "docs/reviews/CVF_MEMCON_EXAMPLE_REVIEW.md"
WORK_ORDER_PATH = "docs/work_orders/CVF_AGENT_WORK_ORDER_MEMCON_EXAMPLE.md"
REFERENCE_PATH = "docs/reference/CVF_MEMCON_EXAMPLE_REF.md"
ARCHIVE_PATH = "docs/reviews/archive/CVF_MEMCON_ARCHIVED.md"
NON_MEMCON_PATH = "docs/reviews/CVF_SOME_OTHER_REVIEW.md"


def _violations_of_type(violations: list[dict], vtype: str) -> list[dict]:
    return [v for v in violations if v["type"] == vtype]


def _make_clean_review_text(extra: str = "") -> str:
    return (
        "# CVF MEMCON Review Packet\n\n"
        "Status: CLOSED_PASS_BOUNDED\n\n"
        "docType: review\n\n"
        "MEMCON\n\n"
        "sourceAuthority: docs/reference/CVF_MEMORY_CONSOLIDATION_SCHEMA_APPENDIX_2026-06-13.md\n\n"
        "rawMemoryReleased=false\n\n"
        "## Operator Memory Review Packet\n\n"
        "OperatorMemoryReviewPacket\n\n"
        "conflictsRequiringDecision: []\n\n"
        "staleOrOutdatedMemories: []\n\n"
        "temporalAmbiguityBlocks: []\n\n"
        "prunedOrRejectedNoise: []\n\n"
        "operatorActionsRequired: []\n\n"
        "Date: 2026-06-13\n\n"
        "## Public Export Disposition\n\n"
        "DEFERRED_PRIVATE_ONLY\n\n"
        + extra
    )


class TestSourceAuthorityMissing(unittest.TestCase):
    def test_missing_source_authority_fails(self) -> None:
        text = (
            "# CVF MEMCON Work Order\n\n"
            "MEMCON\n\n"
            "Some content without any provenance field.\n"
        )
        violations = MODULE.check_text(WORK_ORDER_PATH, text)
        types = [v["type"] for v in violations]
        self.assertIn("memcon_source_authority_missing", types)

    def test_source_authority_present_passes(self) -> None:
        text = (
            "# CVF MEMCON Reference\n\n"
            "MEMCON\n\n"
            "sourceAuthority: docs/reference/CVF_EXAMPLE.md\n"
        )
        violations = MODULE.check_text(REFERENCE_PATH, text)
        types = [v["type"] for v in violations]
        self.assertNotIn("memcon_source_authority_missing", types)

    def test_source_authority_section_heading_passes(self) -> None:
        text = (
            "# CVF MEMCON\n\n"
            "MEMCON\n\n"
            "## Source Authority\n\n"
            "See docs/reference/CVF_EXAMPLE.md\n"
        )
        violations = MODULE.check_text(REFERENCE_PATH, text)
        types = [v["type"] for v in violations]
        self.assertNotIn("memcon_source_authority_missing", types)


class TestRelativeDatePhrases(unittest.TestCase):
    def test_today_in_durable_text_fails(self) -> None:
        text = (
            "# CVF MEMCON\n\n"
            "MEMCON\n\n"
            "sourceAuthority: docs/ref.md\n\n"
            "The decision was made today.\n"
        )
        violations = MODULE.check_text(REFERENCE_PATH, text)
        types = [v["type"] for v in violations]
        self.assertIn("memcon_unresolved_relative_date", types)

    def test_yesterday_fails(self) -> None:
        text = (
            "MEMCON\n\n"
            "sourceAuthority: docs/ref.md\n\n"
            "This was confirmed yesterday.\n"
        )
        violations = MODULE.check_text(REFERENCE_PATH, text)
        self.assertTrue(any(v["type"] == "memcon_unresolved_relative_date" for v in violations))

    def test_recently_fails(self) -> None:
        text = (
            "MEMCON\n\n"
            "sourceAuthority: docs/ref.md\n\n"
            "This pattern was recently introduced.\n"
        )
        violations = MODULE.check_text(REFERENCE_PATH, text)
        self.assertTrue(any(v["type"] == "memcon_unresolved_relative_date" for v in violations))

    def test_last_week_fails(self) -> None:
        text = (
            "MEMCON\n\n"
            "sourceAuthority: docs/ref.md\n\n"
            "Last week we verified the schema.\n"
        )
        violations = MODULE.check_text(REFERENCE_PATH, text)
        self.assertTrue(any(v["type"] == "memcon_unresolved_relative_date" for v in violations))

    def test_vietnamese_hom_nay_fails(self) -> None:
        text = (
            "MEMCON\n\n"
            "sourceAuthority: docs/ref.md\n\n"
            "The claim hom nay is confirmed.\n"
        )
        violations = MODULE.check_text(REFERENCE_PATH, text)
        self.assertTrue(any(v["type"] == "memcon_unresolved_relative_date" for v in violations))

    def test_vietnamese_tuan_truoc_fails(self) -> None:
        text = (
            "MEMCON\n\n"
            "sourceAuthority: docs/ref.md\n\n"
            "tuan truoc we decided on this.\n"
        )
        violations = MODULE.check_text(REFERENCE_PATH, text)
        self.assertTrue(any(v["type"] == "memcon_unresolved_relative_date" for v in violations))

    def test_absolute_date_passes(self) -> None:
        text = (
            "MEMCON\n\n"
            "sourceAuthority: docs/ref.md\n\n"
            "Date: 2026-06-13\n"
        )
        violations = MODULE.check_text(REFERENCE_PATH, text)
        types = [v["type"] for v in violations]
        self.assertNotIn("memcon_unresolved_relative_date", types)

    def test_quoted_source_evidence_relative_date_allowed(self) -> None:
        text = (
            "MEMCON\n\n"
            "sourceAuthority: docs/ref.md\n\n"
            "> source evidence: The operator said today the change was approved.\n"
        )
        violations = MODULE.check_text(REFERENCE_PATH, text)
        types = [v["type"] for v in violations]
        self.assertNotIn("memcon_unresolved_relative_date", types)

    def test_three_months_ago_fails(self) -> None:
        text = (
            "MEMCON\n\n"
            "sourceAuthority: docs/ref.md\n\n"
            "This was set three months ago.\n"
        )
        violations = MODULE.check_text(REFERENCE_PATH, text)
        self.assertTrue(any(v["type"] == "memcon_unresolved_relative_date" for v in violations))


class TestTimeAmbiguousPromotion(unittest.TestCase):
    def test_time_ambiguous_blocked_with_retrieval_eligible_fails(self) -> None:
        text = (
            "MEMCON\n\n"
            "sourceAuthority: docs/ref.md\n\n"
            "temporalNormalizationStatus: TIME_AMBIGUOUS_BLOCKED\n"
            "retrievalEligibility: ELIGIBLE\n"
        )
        violations = MODULE.check_text(REFERENCE_PATH, text)
        types = [v["type"] for v in violations]
        self.assertIn("memcon_time_ambiguous_promoted", types)

    def test_time_ambiguous_blocked_with_consolidated_fails(self) -> None:
        text = (
            "MEMCON\n\n"
            "sourceAuthority: docs/ref.md\n\n"
            "TIME_AMBIGUOUS_BLOCKED CONSOLIDATED record\n"
        )
        violations = MODULE.check_text(REFERENCE_PATH, text)
        types = [v["type"] for v in violations]
        self.assertIn("memcon_time_ambiguous_promoted", types)

    def test_time_ambiguous_blocked_without_promotion_passes(self) -> None:
        text = (
            "MEMCON\n\n"
            "sourceAuthority: docs/ref.md\n\n"
            "temporalNormalizationStatus: TIME_AMBIGUOUS_BLOCKED\n"
            "retrievalEligibility: BLOCKED_TIME_AMBIGUOUS\n"
        )
        violations = MODULE.check_text(REFERENCE_PATH, text)
        types = [v["type"] for v in violations]
        self.assertNotIn("memcon_time_ambiguous_promoted", types)

    def test_no_time_ambiguous_blocked_passes(self) -> None:
        text = (
            "MEMCON\n\n"
            "sourceAuthority: docs/ref.md\n\n"
            "temporalNormalizationStatus: ABSOLUTE_DATE_PRESENT\n"
            "retrievalEligibility: ELIGIBLE\n"
        )
        violations = MODULE.check_text(REFERENCE_PATH, text)
        types = [v["type"] for v in violations]
        self.assertNotIn("memcon_time_ambiguous_promoted", types)


class TestRawMemoryReleased(unittest.TestCase):
    def test_raw_memory_released_true_fails(self) -> None:
        text = (
            "MEMCON\n\n"
            "sourceAuthority: docs/ref.md\n\n"
            "rawMemoryReleased: true\n"
        )
        violations = MODULE.check_text(REFERENCE_PATH, text)
        types = [v["type"] for v in violations]
        self.assertIn("memcon_raw_memory_released_true", types)

    def test_raw_memory_released_equals_true_fails(self) -> None:
        text = (
            "MEMCON\n\n"
            "sourceAuthority: docs/ref.md\n\n"
            "rawMemoryReleased=true\n"
        )
        violations = MODULE.check_text(REFERENCE_PATH, text)
        types = [v["type"] for v in violations]
        self.assertIn("memcon_raw_memory_released_true", types)

    def test_raw_memory_released_false_passes(self) -> None:
        text = (
            "MEMCON\n\n"
            "sourceAuthority: docs/ref.md\n\n"
            "rawMemoryReleased=false\n"
        )
        violations = MODULE.check_text(REFERENCE_PATH, text)
        types = [v["type"] for v in violations]
        self.assertNotIn("memcon_raw_memory_released_true", types)


class TestRetrievalBoundary(unittest.TestCase):
    def test_retrieval_facing_without_boundary_marker_fails(self) -> None:
        text = (
            "MEMCON\n\n"
            "sourceAuthority: docs/ref.md\n\n"
            "ConsolidatedMemoryRecord for retrieval.\n"
        )
        violations = MODULE.check_text(REFERENCE_PATH, text)
        types = [v["type"] for v in violations]
        self.assertIn("memcon_retrieval_boundary_missing", types)

    def test_retrieval_facing_with_boundary_marker_passes(self) -> None:
        text = (
            "MEMCON\n\n"
            "sourceAuthority: docs/ref.md\n\n"
            "ConsolidatedMemoryRecord for retrieval.\n"
            "rawMemoryReleased=false\n"
        )
        violations = MODULE.check_text(REFERENCE_PATH, text)
        types = [v["type"] for v in violations]
        self.assertNotIn("memcon_retrieval_boundary_missing", types)

    def test_no_retrieval_facing_no_boundary_required(self) -> None:
        text = (
            "MEMCON\n\n"
            "sourceAuthority: docs/ref.md\n\n"
            "MemorySignal intake record only.\n"
        )
        violations = MODULE.check_text(REFERENCE_PATH, text)
        types = [v["type"] for v in violations]
        self.assertNotIn("memcon_retrieval_boundary_missing", types)


class TestOperatorPacketSections(unittest.TestCase):
    def _make_packet_text(self, missing_section: str | None = None) -> str:
        sections = {
            "conflictsRequiringDecision": "conflictsRequiringDecision: []\n",
            "staleOrOutdatedMemories": "staleOrOutdatedMemories: []\n",
            "temporalAmbiguityBlocks": "temporalAmbiguityBlocks: []\n",
            "prunedOrRejectedNoise": "prunedOrRejectedNoise: []\n",
            "operatorActionsRequired": "operatorActionsRequired: []\n",
        }
        body = (
            "OperatorMemoryReviewPacket\n"
            "MEMCON\n"
            "sourceAuthority: docs/ref.md\n"
            "rawMemoryReleased=false\n"
            "Public Export Disposition\nDEFERRED_PRIVATE_ONLY\n"
        )
        for key, content in sections.items():
            if key != missing_section:
                body += content
        return body

    def test_missing_conflicts_section_fails(self) -> None:
        text = self._make_packet_text("conflictsRequiringDecision")
        violations = MODULE.check_text(CLEAN_PATH, text)
        types = [v["type"] for v in violations]
        self.assertIn("memcon_operator_packet_section_missing", types)

    def test_missing_stale_section_fails(self) -> None:
        text = self._make_packet_text("staleOrOutdatedMemories")
        violations = MODULE.check_text(CLEAN_PATH, text)
        types = [v["type"] for v in violations]
        self.assertIn("memcon_operator_packet_section_missing", types)

    def test_missing_temporal_ambiguity_section_fails(self) -> None:
        text = self._make_packet_text("temporalAmbiguityBlocks")
        violations = MODULE.check_text(CLEAN_PATH, text)
        types = [v["type"] for v in violations]
        self.assertIn("memcon_operator_packet_section_missing", types)

    def test_missing_pruned_section_fails(self) -> None:
        text = self._make_packet_text("prunedOrRejectedNoise")
        violations = MODULE.check_text(CLEAN_PATH, text)
        types = [v["type"] for v in violations]
        self.assertIn("memcon_operator_packet_section_missing", types)

    def test_missing_operator_actions_section_fails(self) -> None:
        text = self._make_packet_text("operatorActionsRequired")
        violations = MODULE.check_text(CLEAN_PATH, text)
        types = [v["type"] for v in violations]
        self.assertIn("memcon_operator_packet_section_missing", types)

    def test_all_sections_present_passes(self) -> None:
        text = self._make_packet_text(None)
        violations = MODULE.check_text(CLEAN_PATH, text)
        types = [v["type"] for v in violations]
        self.assertNotIn("memcon_operator_packet_section_missing", types)

    def test_work_order_mentioning_packet_shape_is_not_packet(self) -> None:
        text = (
            "MEMCON\n\n"
            "sourceAuthority: docs/ref.md\n\n"
            "The work order names OperatorMemoryReviewPacket as a future output shape.\n"
        )
        violations = MODULE.check_text(WORK_ORDER_PATH, text)
        types = [v["type"] for v in violations]
        self.assertNotIn("memcon_operator_packet_section_missing", types)


class TestPublicExportDisposition(unittest.TestCase):
    def test_review_packet_missing_disposition_fails(self) -> None:
        text = (
            "MEMCON\n\n"
            "sourceAuthority: docs/ref.md\n\n"
            "rawMemoryReleased=false\n\n"
            "OperatorMemoryReviewPacket\n\n"
            "conflictsRequiringDecision: []\n"
            "staleOrOutdatedMemories: []\n"
            "temporalAmbiguityBlocks: []\n"
            "prunedOrRejectedNoise: []\n"
            "operatorActionsRequired: []\n"
        )
        violations = MODULE.check_text(CLEAN_PATH, text)
        types = [v["type"] for v in violations]
        self.assertIn("memcon_public_export_disposition_missing", types)

    def test_review_packet_with_valid_disposition_passes(self) -> None:
        text = _make_clean_review_text()
        violations = MODULE.check_text(CLEAN_PATH, text)
        types = [v["type"] for v in violations]
        self.assertNotIn("memcon_public_export_disposition_missing", types)
        self.assertNotIn("memcon_public_export_disposition_invalid", types)

    def test_review_packet_disposition_invalid_value_fails(self) -> None:
        text = (
            "MEMCON\n\n"
            "sourceAuthority: docs/ref.md\n\n"
            "rawMemoryReleased=false\n\n"
            "OperatorMemoryReviewPacket\n\n"
            "conflictsRequiringDecision: []\n"
            "staleOrOutdatedMemories: []\n"
            "temporalAmbiguityBlocks: []\n"
            "prunedOrRejectedNoise: []\n"
            "operatorActionsRequired: []\n\n"
            "## Public Export Disposition\n\n"
            "UNKNOWN_VALUE\n"
        )
        violations = MODULE.check_text(CLEAN_PATH, text)
        types = [v["type"] for v in violations]
        self.assertIn("memcon_public_export_disposition_invalid", types)


class TestInapplicablePaths(unittest.TestCase):
    def test_archived_file_skipped(self) -> None:
        text = "MEMCON\nsourceAuthority: docs/ref.md\n"
        violations = MODULE.check_text(ARCHIVE_PATH, text)
        self.assertEqual(violations, [])

    def test_non_memcon_file_skipped(self) -> None:
        text = "## Some Review\n\nNo memory plane markers in this document.\n"
        violations = MODULE.check_text(NON_MEMCON_PATH, text)
        self.assertEqual(violations, [])

    def test_non_docs_path_skipped(self) -> None:
        text = "MEMCON\nsourceAuthority: docs/ref.md\n"
        violations = MODULE.check_text("governance/compat/some_checker.py", text)
        self.assertEqual(violations, [])


class TestCleanArtifactPasses(unittest.TestCase):
    def test_fully_compliant_review_packet_passes(self) -> None:
        text = _make_clean_review_text()
        violations = MODULE.check_text(CLEAN_PATH, text)
        self.assertEqual(violations, [], f"Expected no violations but got: {violations}")

    def test_fully_compliant_work_order_passes(self) -> None:
        text = (
            "# CVF MEMCON Work Order\n\n"
            "MEMCON\n\n"
            "sourceAuthority: docs/reference/CVF_MEMORY_CONSOLIDATION_SCHEMA_APPENDIX_2026-06-13.md\n\n"
            "Date: 2026-06-13\n\n"
            "All temporal references use absolute dates.\n"
        )
        violations = MODULE.check_text(WORK_ORDER_PATH, text)
        self.assertEqual(violations, [], f"Expected no violations but got: {violations}")


def _make_clean_review_text(extra: str = "") -> str:
    return (
        "# CVF MEMCON Review Packet\n\n"
        "Status: CLOSED_PASS_BOUNDED\n\n"
        "docType: review\n\n"
        "MEMCON\n\n"
        "sourceAuthority: docs/reference/CVF_MEMORY_CONSOLIDATION_SCHEMA_APPENDIX_2026-06-13.md\n\n"
        "rawMemoryReleased=false\n\n"
        "## Operator Memory Review Packet\n\n"
        "OperatorMemoryReviewPacket\n\n"
        "conflictsRequiringDecision: []\n\n"
        "staleOrOutdatedMemories: []\n\n"
        "temporalAmbiguityBlocks: []\n\n"
        "prunedOrRejectedNoise: []\n\n"
        "operatorActionsRequired: []\n\n"
        "Date: 2026-06-13\n\n"
        "## Public Export Disposition\n\n"
        "DEFERRED_PRIVATE_ONLY\n\n"
        + extra
    )


if __name__ == "__main__":
    unittest.main()
