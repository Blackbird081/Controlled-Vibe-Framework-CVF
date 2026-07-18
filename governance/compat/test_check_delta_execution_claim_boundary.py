from __future__ import annotations

import importlib.util
import sys
import unittest
from pathlib import Path


MODULE_PATH = Path(__file__).resolve().with_name(
    "check_delta_execution_claim_boundary.py"
)
SPEC = importlib.util.spec_from_file_location(
    "check_delta_execution_claim_boundary", MODULE_PATH
)
MODULE = importlib.util.module_from_spec(SPEC)
assert SPEC and SPEC.loader
sys.modules[SPEC.name] = MODULE
SPEC.loader.exec_module(MODULE)


VALID_EVIDENCE_BLOCK = """
Delta execution claim boundary: REQUIRED

## Delta Execution Claim Boundary Control Block

| Field | Disposition |
| --- | --- |
| claimScope | bounded checker-only claim |
| claimDisposition | BOUNDED_CLAIM_WITH_EVIDENCE |
| receiptEvidence | CVF_RECEIPT_PRESENT in `.cvf/delta/sample-receipt.json` |
| actionEvidence | ACTION_EVIDENCE_PRESENT in focused test output |
| invocationBoundary | wrapper invocation only |
| interceptionBoundary | no direct IDE, shell, git, or filesystem interception |
| claimLanguage | bounded, no universal governed-coding claim |
| forbiddenExpansion | runtime profiles, provider/live, public-sync, EDIT/COMMIT, and direct interception remain parked |
"""


VALID_REJECTION_BLOCK = """
Delta execution claim boundary: REQUIRED

## Delta Execution Claim Boundary Control Block

| Field | Disposition |
| --- | --- |
| claimScope | broad execution-control claim |
| claimDisposition | CLAIM_REJECTED |
| receiptEvidence | CLAIM_REJECTED_NO_RECEIPT |
| actionEvidence | CLAIM_REJECTED_NO_ACTION |
| invocationBoundary | no mandatory invocation claim |
| interceptionBoundary | no direct IDE, shell, git, or filesystem interception claim |
| claimLanguage | rejected universal governed-coding control wording |
| forbiddenExpansion | runtime enforcement, direct interception, and provider/live remain parked |
"""


class DeltaExecutionClaimBoundaryTests(unittest.TestCase):
    def test_valid_evidence_block_passes(self) -> None:
        violations = MODULE.check_text(
            "docs/reviews/CVF_DELTA_T6_SAMPLE_COMPLETION_2026-06-19.md",
            VALID_EVIDENCE_BLOCK,
        )

        self.assertEqual([], violations)

    def test_valid_rejection_block_passes(self) -> None:
        violations = MODULE.check_text(
            "docs/reviews/CVF_INTERNAL_SAMPLE_COMPLETION_2026-06-19.md",
            VALID_REJECTION_BLOCK,
        )

        self.assertEqual([], violations)

    def test_path_marker_requires_section(self) -> None:
        violations = MODULE.check_text(
            "docs/reviews/CVF_DELTA_T6_SAMPLE_COMPLETION_2026-06-19.md",
            "Status: COMPLETE_PENDING_CLOSURE\n",
        )

        self.assertTrue(
            any("missing `## Delta Execution Claim Boundary Control Block`" in item for item in violations)
        )

    def test_text_marker_requires_section(self) -> None:
        violations = MODULE.check_text(
            "docs/reviews/CVF_INTERNAL_SAMPLE_COMPLETION_2026-06-19.md",
            "This artifact claims universal governed-coding control.\n",
        )

        self.assertTrue(
            any("missing `## Delta Execution Claim Boundary Control Block`" in item for item in violations)
        )

    def test_marked_guard_behavior_discussion_does_not_require_section(self) -> None:
        text = """
## Guard Behavior Discussion

Discussion-only disposition: META_DISCUSSION_ONLY

This note explains the execution claim boundary guard without making a claim.
"""
        self.assertEqual([], MODULE.check_text("docs/reviews/CVF_PLAIN_NOTE.md", text))

    def test_missing_field_fails(self) -> None:
        text = VALID_EVIDENCE_BLOCK.replace(
            "| actionEvidence | ACTION_EVIDENCE_PRESENT in focused test output |\n",
            "",
        )

        violations = MODULE.check_text(
            "docs/reviews/CVF_DELTA_T6_SAMPLE_COMPLETION_2026-06-19.md",
            text,
        )

        self.assertTrue(any("actionEvidence" in item for item in violations))

    def test_empty_field_fails(self) -> None:
        text = VALID_EVIDENCE_BLOCK.replace(
            "| claimScope | bounded checker-only claim |",
            "| claimScope | TBD |",
        )

        violations = MODULE.check_text(
            "docs/reviews/CVF_DELTA_T6_SAMPLE_COMPLETION_2026-06-19.md",
            text,
        )

        self.assertTrue(any("claimScope" in item for item in violations))

    def test_invalid_receipt_marker_fails(self) -> None:
        text = VALID_EVIDENCE_BLOCK.replace(
            "| receiptEvidence | CVF_RECEIPT_PRESENT in `.cvf/delta/sample-receipt.json` |",
            "| receiptEvidence | receipt might exist later |",
        )

        violations = MODULE.check_text(
            "docs/reviews/CVF_DELTA_T6_SAMPLE_COMPLETION_2026-06-19.md",
            text,
        )

        self.assertTrue(any("receiptEvidence" in item for item in violations))

    def test_invalid_action_marker_fails(self) -> None:
        text = VALID_EVIDENCE_BLOCK.replace(
            "| actionEvidence | ACTION_EVIDENCE_PRESENT in focused test output |",
            "| actionEvidence | action evidence pending |",
        )

        violations = MODULE.check_text(
            "docs/reviews/CVF_DELTA_T6_SAMPLE_COMPLETION_2026-06-19.md",
            text,
        )

        self.assertTrue(any("actionEvidence" in item for item in violations))

    def test_invalid_claim_disposition_fails(self) -> None:
        text = VALID_EVIDENCE_BLOCK.replace(
            "| claimDisposition | BOUNDED_CLAIM_WITH_EVIDENCE |",
            "| claimDisposition | broad claim accepted |",
        )

        violations = MODULE.check_text(
            "docs/reviews/CVF_DELTA_T6_SAMPLE_COMPLETION_2026-06-19.md",
            text,
        )

        self.assertTrue(any("claimDisposition" in item for item in violations))

    def test_unrelated_doc_ignored(self) -> None:
        violations = MODULE.check_text(
            "docs/reviews/CVF_INTERNAL_SAMPLE_COMPLETION_2026-06-19.md",
            "Status: COMPLETE_PENDING_CLOSURE\n",
        )

        self.assertEqual([], violations)

    def test_archive_path_ignored(self) -> None:
        violations = MODULE.check_text(
            "docs/reviews/archive/CVF_DELTA_T6_SAMPLE_COMPLETION_2026-06-19.md",
            "Delta execution claim boundary: REQUIRED\n",
        )

        self.assertEqual([], violations)


if __name__ == "__main__":
    unittest.main()
