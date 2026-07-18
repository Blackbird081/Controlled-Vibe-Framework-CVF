#!/usr/bin/env python3
"""Focused unit tests for the dispatch scaffold provenance checker."""

from __future__ import annotations

import importlib.util
import sys
import unittest
from pathlib import Path


MODULE_PATH = Path(__file__).resolve().with_name("check_dispatch_scaffold_provenance.py")
SPEC = importlib.util.spec_from_file_location("check_dispatch_scaffold_provenance", MODULE_PATH)
MODULE = importlib.util.module_from_spec(SPEC)
assert SPEC and SPEC.loader
sys.modules[SPEC.name] = MODULE
SPEC.loader.exec_module(MODULE)


VALID_BLOCK = """## Scaffold Provenance Block

| Field | Value |
| --- | --- |
| scaffoldHelperCommand | `python governance/compat/build_dispatch_packet_scaffold.py --packet-kind generic-worker-dispatch --batch-id TEST --title "Test" --date 2026-07-01 --base abc123 --commit-mode WORKER_MUST_NOT_COMMIT --include-worker-return-skeleton --stdout` |
| generatedProfile | generic-worker-dispatch plus WORKER_MUST_NOT_COMMIT no-commit worker profile |
| generatedSkeletonStatus | USED_AS_STARTING_POINT |
| manualEditsAfterScaffold | Filled authority chain and scope; removed all placeholder fields. |
| checkerReadAheadConfirmation | `governance/compat/check_work_order_dispatch_quality.py`; `governance/compat/check_dispatch_prompt_envelope.py` |
| docOnlyNewFields | `Scaffold Provenance Block`; `scaffoldHelperCommand` |
| claimBoundary | Dispatch authoring provenance only; no runtime/provider/live/public/Web/MCP/model-router behavior claim. |
"""

DISPATCH_READY_HEADER = "Status: DISPATCH_READY\n\n"


class ScaffoldProvenanceCheckerTests(unittest.TestCase):
    def test_valid_block_passes(self) -> None:
        text = DISPATCH_READY_HEADER + VALID_BLOCK
        violations = MODULE.check_text("docs/baselines/test.md", text)
        self.assertEqual(violations, [])

    def test_missing_block_fails(self) -> None:
        text = DISPATCH_READY_HEADER + "## Purpose\n\nSome purpose.\n"
        violations = MODULE.check_text("docs/baselines/test.md", text)
        self.assertEqual(len(violations), 1)
        self.assertEqual(violations[0].code, "scaffold_provenance_block_missing")

    def test_missing_field_fails(self) -> None:
        block = VALID_BLOCK.replace(
            "| docOnlyNewFields |", "| REMOVED_FIELD |"
        )
        text = DISPATCH_READY_HEADER + block
        violations = MODULE.check_text("docs/baselines/test.md", text)
        codes = [v.code for v in violations]
        self.assertIn("scaffold_provenance_field_missing", codes)

    def test_placeholder_field_fails(self) -> None:
        block = VALID_BLOCK.replace(
            "Filled authority chain and scope; removed all placeholder fields.",
            "FILL_ME (describe manual edits)",
        )
        text = DISPATCH_READY_HEADER + block
        violations = MODULE.check_text("docs/baselines/test.md", text)
        codes = [v.code for v in violations]
        self.assertIn("scaffold_provenance_field_placeholder", codes)

    def test_invalid_skeleton_status_fails(self) -> None:
        block = VALID_BLOCK.replace(
            "USED_AS_STARTING_POINT", "BOGUS_STATUS"
        )
        text = DISPATCH_READY_HEADER + block
        violations = MODULE.check_text("docs/baselines/test.md", text)
        codes = [v.code for v in violations]
        self.assertIn("scaffold_provenance_invalid_skeleton_status", codes)

    def test_no_helper_command_fails(self) -> None:
        block = VALID_BLOCK.replace(
            "build_dispatch_packet_scaffold.py",
            "some_other_helper.py",
        )
        text = DISPATCH_READY_HEADER + block
        violations = MODULE.check_text("docs/baselines/test.md", text)
        codes = [v.code for v in violations]
        self.assertIn("scaffold_provenance_no_helper_command", codes)

    def test_non_dispatch_ready_skipped(self) -> None:
        text = "Status: HOLD_PENDING_OPERATOR_DECISION\n\n" + VALID_BLOCK
        violations = MODULE.check_text("docs/baselines/test.md", text)
        self.assertEqual(violations, [])

    def test_archived_path_skipped(self) -> None:
        violations = MODULE.check_path("docs/baselines/archive/old.md")
        self.assertEqual(violations, [])

    def test_non_applicable_path_skipped(self) -> None:
        violations = MODULE.check_path("docs/reviews/some_review.md")
        self.assertEqual(violations, [])

    def test_quoted_block_in_code_fence_ignored(self) -> None:
        fenced = "```\n" + VALID_BLOCK + "\n```\n"
        text = DISPATCH_READY_HEADER + fenced
        violations = MODULE.check_text("docs/baselines/test.md", text)
        # The checker strips code fences, so the block inside a fence
        # should not count as a real block. The checker should report
        # the block as missing.
        codes = [v.code for v in violations]
        self.assertIn("scaffold_provenance_block_missing", codes)


class ScaffoldProvenanceHelperTests(unittest.TestCase):
    """Test that the scaffold helper output includes the provenance block."""

    def setUp(self) -> None:
        sys.path.insert(0, str(Path(__file__).resolve().parent))
        from build_dispatch_packet_scaffold import ScaffoldArgs, build_gc018_baseline, build_work_order, detect_triggers
        self.args = ScaffoldArgs(
            packet_kind="protected-governance-path",
            batch_id="TEST-R5",
            title="Test R5",
            date="2026-07-01",
            base="abc123",
            commit_mode="WORKER_MUST_NOT_COMMIT",
        )
        self.active = detect_triggers(self.args)
        self.build_gc018_baseline = build_gc018_baseline
        self.build_work_order = build_work_order

    def test_gc018_baseline_includes_scaffold_provenance_block(self) -> None:
        output = self.build_gc018_baseline(self.args, self.active)
        self.assertIn("## Scaffold Provenance Block", output)
        self.assertIn("scaffoldHelperCommand", output)
        self.assertIn("generatedProfile", output)
        self.assertIn("generatedSkeletonStatus", output)
        self.assertIn("USED_AS_STARTING_POINT", output)
        self.assertIn("manualEditsAfterScaffold", output)
        self.assertIn("checkerReadAheadConfirmation", output)
        self.assertIn("docOnlyNewFields", output)
        self.assertIn("claimBoundary", output)

    def test_work_order_includes_scaffold_provenance_block(self) -> None:
        output = self.build_work_order(self.args, self.active)
        self.assertIn("## Scaffold Provenance Block", output)
        self.assertIn("scaffoldHelperCommand", output)
        self.assertIn("build_dispatch_packet_scaffold.py", output)

    def test_gc018_helper_command_has_no_fill_me_for_known_fields(self) -> None:
        output = self.build_gc018_baseline(self.args, self.active)
        block_start = output.find("## Scaffold Provenance Block")
        block_end = output.find("##", block_start + 5)
        block = output[block_start:block_end]
        for field in ("scaffoldHelperCommand", "generatedProfile", "generatedSkeletonStatus", "claimBoundary"):
            self.assertIn(field, block)
        self.assertNotIn("FILL_ME", block.split("manualEditsAfterScaffold")[0].split("generatedSkeletonStatus")[1])


class ScaffoldProvenanceCatalogWiringTests(unittest.TestCase):
    """Test that the checker is wired into all gate catalogs."""

    def test_reviewer_fast_contains_scaffold_provenance(self) -> None:
        catalog_path = Path(__file__).resolve().with_name("local_governance_hook_catalog_reviewer_fast.py")
        text = catalog_path.read_text(encoding="utf-8")
        self.assertIn("dispatch scaffold provenance", text)
        self.assertIn("check_dispatch_scaffold_provenance.py", text)

    def test_pre_commit_contains_scaffold_provenance(self) -> None:
        catalog_path = Path(__file__).resolve().with_name("local_governance_hook_catalog_pre_commit.py")
        text = catalog_path.read_text(encoding="utf-8")
        self.assertIn("dispatch scaffold provenance", text)
        self.assertIn("check_dispatch_scaffold_provenance.py", text)

    def test_pre_push_contains_scaffold_provenance(self) -> None:
        catalog_path = Path(__file__).resolve().with_name("local_governance_hook_catalog_pre_push.py")
        text = catalog_path.read_text(encoding="utf-8")
        self.assertIn("dispatch scaffold provenance", text)
        self.assertIn("check_dispatch_scaffold_provenance.py", text)

    def test_autorun_contains_scaffold_provenance(self) -> None:
        catalog_path = Path(__file__).resolve().with_name("agent_autorun_command_catalog.py")
        text = catalog_path.read_text(encoding="utf-8")
        self.assertIn("dispatch scaffold provenance", text)
        self.assertIn("check_dispatch_scaffold_provenance.py", text)


if __name__ == "__main__":
    unittest.main()
