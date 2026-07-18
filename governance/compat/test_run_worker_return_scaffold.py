from __future__ import annotations

import importlib.util
import io
import tempfile
import unittest
from contextlib import redirect_stdout
from pathlib import Path
from unittest import mock


MODULE_PATH = Path(__file__).resolve().with_name("run_worker_return_scaffold.py")
SPEC = importlib.util.spec_from_file_location("run_worker_return_scaffold", MODULE_PATH)
assert SPEC is not None and SPEC.loader is not None
scaffold = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(scaffold)


class WorkerReturnScaffoldTests(unittest.TestCase):
    def test_scaffold_text_has_required_headings(self):
        text = scaffold.build_scaffold("Example Worker Return")
        self.assertTrue(text.startswith("# Example Worker Return"))
        self.assertIn("dispatchWorkOrder:", text)
        self.assertIn("executionBaseHead:", text)
        self.assertIn("rawMemoryReleased=false", text)
        for section in scaffold.WORKER_RETURN_SCAFFOLD_SECTIONS:
            self.assertIn(f"## {section}", text)
        self.assertIn("CVF_RECEIPT_PRESENT", text)
        self.assertIn("NOT_APPLICABLE_WITH_REASON", text)
        self.assertIn("## External Knowledge Intake Routing", text)
        self.assertIn("## Rescan Intelligence Hardening", text)
        self.assertIn("## Finding-To-Governance Learning Disposition", text)
        self.assertIn("## Epistemic Process Block", text)
        self.assertIn("## Worker Return Scaffold Effectiveness Measurement", text)
        self.assertIn("## Worker Return Jurisdiction Block", text)
        self.assertIn("## Command Evidence", text)
        self.assertIn("## Machine Closure Package", text)
        self.assertIn("| TODO: fill before review | READ |", text)
        self.assertIn("python governance/compat/run_worker_return_fast_gate.py", text)
        self.assertIn("Corpus verdict: NOT_APPLICABLE_WITH_REASON - N/A with reason", text)

    def test_full_scaffold_has_shared_checker_required_envelope(self):
        """Both profiles must open with the exact shared marker/heading envelope
        the worker-return quality checker requires (REQUIRED_HEADINGS parity)."""
        text = scaffold.build_scaffold("Example Worker Return")
        self.assertIn("Self-declared worker-return artifact: yes", text)
        self.assertIn("Responds to work order:", text)
        self.assertIn("## Checker Source Read-Ahead Block", text)
        self.assertIn("## git status --short", text)
        self.assertIn("## Changed Files", text)
        self.assertIn("## No-Commit Statement", text)
        self.assertIn("WORKER_MUST_NOT_COMMIT honored", text)

    def test_compact_scaffold_has_shared_checker_required_envelope(self):
        """The compact profile must preserve the exact same shared envelope as
        full, per FAST_DOC_REQUIRED_HEADINGS parity in the checker."""
        text = scaffold.build_scaffold(
            "Fast Doc Worker Return", scaffold.FAST_DOC_PROFILE
        )
        self.assertIn("Self-declared worker-return artifact: yes", text)
        self.assertIn("Responds to work order:", text)
        self.assertIn("## Checker Source Read-Ahead Block", text)
        self.assertIn("## git status --short", text)
        self.assertIn("## Changed Files", text)
        self.assertIn("## No-Commit Statement", text)
        self.assertIn("WORKER_MUST_NOT_COMMIT honored", text)

    def test_checker_read_ahead_table_has_all_four_required_fields(self):
        text = scaffold.build_scaffold("Example Worker Return")
        section_start = text.index("## Checker Source Read-Ahead Block")
        section_end = text.index("## Gate Evidence", section_start)
        section = text[section_start:section_end]
        for required_field in (
            "applicableCheckersRead",
            "literalTokensReviewed",
            "gateRunPurpose",
            "claimBoundary",
        ):
            self.assertIn(f"| {required_field} |", section)
        self.assertNotIn("first discovery", section.casefold())

    def test_command_evidence_carries_finalization_instruction(self):
        text = scaffold.build_scaffold("Example Worker Return")
        section_start = text.index("## Command Evidence")
        section_end = text.index("## No-Commit Statement", section_start)
        section = text[section_start:section_end]
        self.assertIn("LAST-MILE FINALIZATION", section)
        self.assertIn("actual first-run and final-run", section)
        self.assertIn("Do not leave a scaffold", section)

    def test_compact_scaffold_still_consolidates_conditional_controls_only(self):
        """Compact must add exactly the three-heading consolidation on top of the
        shared envelope; it must not gain any other eligibility-widening shape."""
        full_sections = set(scaffold.WORKER_RETURN_SCAFFOLD_SECTIONS)
        compact_sections = set(scaffold.FAST_DOC_SCAFFOLD_SECTIONS)
        self.assertEqual(
            full_sections - compact_sections,
            {
                "External Knowledge Intake Routing",
                "Rescan Intelligence Hardening",
                "Corpus Completeness And Report Integrity",
            },
        )
        self.assertEqual(compact_sections - full_sections, set())

    def test_external_knowledge_intake_routing_uses_required_row_label_shape(self):
        text = scaffold.build_scaffold("Example Worker Return")
        section_start = text.index("## External Knowledge Intake Routing")
        section_end = text.index("## Rescan Intelligence Hardening", section_start)
        section = text[section_start:section_end]
        self.assertIn("| Field | Value |", section)
        self.assertNotIn("| External item | Route | Local guard | Disposition | Claim boundary |", section)
        for required_row_label in (
            "Chain map",
            "Input type",
            "Chain map route",
            "Matching local-view guard",
            "Owner surface",
            "Disposition",
            "Claim boundary",
        ):
            self.assertIn(f"| {required_row_label} |", section)

    def test_fast_doc_scaffold_consolidates_conditional_controls(self):
        text = scaffold.build_scaffold(
            "Fast Doc Worker Return", scaffold.FAST_DOC_PROFILE
        )
        self.assertIn("contractProfile: WORKER_RETURN_FAST_DOC_V1", text)
        self.assertIn("## Conditional Controls Disposition", text)
        self.assertIn(
            "conditionalControlsDisposition: EKI_NA; RIH_NA; CCRI_NA", text
        )
        self.assertNotIn("## External Knowledge Intake Routing", text)
        self.assertNotIn("## Rescan Intelligence Hardening", text)
        self.assertNotIn("## Corpus Completeness And Report Integrity", text)

    def test_delta_execution_claim_boundary_uses_required_field_table_shape(self):
        text = scaffold.build_scaffold("Example Worker Return")
        section_start = text.index("## Delta Execution Claim Boundary Control Block")
        section_end = text.index("## Public Export Disposition", section_start)
        section = text[section_start:section_end]
        self.assertIn("| Field | Disposition |", section)
        self.assertNotIn("executionBaseHead: `TODO_EXECUTION_BASE_HEAD`", section)
        for required_row_label in (
            "claimScope",
            "claimDisposition",
            "receiptEvidence",
            "actionEvidence",
            "invocationBoundary",
            "interceptionBoundary",
            "claimLanguage",
            "forbiddenExpansion",
        ):
            self.assertIn(f"| {required_row_label} |", section)

    def test_emit_prints_without_writing(self):
        real_open = open

        def guarded_open(file, mode="r", *args, **kwargs):
            if any(flag in mode for flag in ("w", "a", "x", "+")):
                raise AssertionError(f"emit attempted a write open: {file!r} mode={mode!r}")
            return real_open(file, mode, *args, **kwargs)

        buf = io.StringIO()
        with mock.patch("builtins.open", side_effect=guarded_open):
            with redirect_stdout(buf):
                rc = scaffold.main(["--emit"])
        self.assertEqual(rc, 0)
        self.assertIn("## Source Inventory", buf.getvalue())

    def test_write_creates_one_new_file_under_reviews(self):
        with tempfile.TemporaryDirectory() as tmp:
            reviews = Path(tmp) / "docs" / "reviews"
            reviews.mkdir(parents=True)
            target = reviews / "CVF_WORKER_RETURN_SAMPLE_2026-06-26.md"
            with mock.patch.object(scaffold, "REPO_ROOT", Path(tmp)):
                written = scaffold.write_scaffold(str(target))
            self.assertTrue(written.exists())
            body = written.read_text(encoding="utf-8")
            self.assertIn("## Actual Changed Set", body)
            self.assertEqual(list(reviews.glob("*.md")), [written])

    def test_write_refuses_overwrite_and_outside_reviews(self):
        with tempfile.TemporaryDirectory() as tmp:
            reviews = Path(tmp) / "docs" / "reviews"
            reviews.mkdir(parents=True)
            target = reviews / "EXISTING.md"
            target.write_text("original content", encoding="utf-8")
            with mock.patch.object(scaffold, "REPO_ROOT", Path(tmp)):
                with self.assertRaises(ValueError):
                    scaffold.write_scaffold(str(target))
            self.assertEqual(target.read_text(encoding="utf-8"), "original content")

            outside = Path(tmp) / "docs" / "baselines" / "X.md"
            outside.parent.mkdir(parents=True)
            with mock.patch.object(scaffold, "REPO_ROOT", Path(tmp)):
                with self.assertRaises(ValueError):
                    scaffold.write_scaffold(str(outside))
            self.assertFalse(outside.exists())

    def test_cli_requires_exactly_one_action(self):
        self.assertEqual(scaffold.main([]), 2)
        self.assertEqual(scaffold.main(["--emit", "--write", "docs/reviews/x.md"]), 2)


if __name__ == "__main__":
    unittest.main()
