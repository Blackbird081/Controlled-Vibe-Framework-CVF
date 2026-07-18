from __future__ import annotations

import importlib.util
import sys
import unittest
from pathlib import Path


MODULE_PATH = Path(__file__).resolve().with_name(
    "check_delta_mutating_profile_boundary.py"
)
SPEC = importlib.util.spec_from_file_location(
    "check_delta_mutating_profile_boundary", MODULE_PATH
)
MODULE = importlib.util.module_from_spec(SPEC)
assert SPEC and SPEC.loader
sys.modules[SPEC.name] = MODULE
SPEC.loader.exec_module(MODULE)


VALID_BLOCK = """
Delta mutating profile boundary: REQUIRED

## Delta Mutating Profile Boundary Control Block

| Field | Disposition |
| --- | --- |
| profileScope | MACHINE_GUARD_ONLY |
| fixedTargetPolicy | fixed target `.cvf/delta/example.json` |
| approvalEvidenceSource | approval evidence from `.cvf/policies/example.json` |
| callerPathInput | NO_CALLER_PATH_INPUT |
| commandAuthority | static command authority only |
| receiptChain | T1/T2/T3/T4 receipt chain |
| claimBoundary | no universal governed-coding or direct interception claim |
| forbiddenExpansion | runtime profiles, EDIT/COMMIT execution, provider/live, public-sync, and direct interception remain parked |
"""


class DeltaMutatingProfileBoundaryTests(unittest.TestCase):
    def test_valid_explicit_block_passes(self) -> None:
        violations = MODULE.check_text(
            "docs/reviews/CVF_DELTA_T4C_SAMPLE_COMPLETION_2026-06-19.md",
            VALID_BLOCK,
        )

        self.assertEqual([], violations)

    def test_path_marker_requires_section(self) -> None:
        violations = MODULE.check_text(
            "docs/reviews/CVF_DELTA_T4C_SAMPLE_COMPLETION_2026-06-19.md",
            "Status: COMPLETE_PENDING_CLOSURE\n",
        )

        self.assertTrue(
            any("missing `## Delta Mutating Profile Boundary Control Block`" in item for item in violations)
        )

    def test_text_marker_requires_section(self) -> None:
        violations = MODULE.check_text(
            "docs/reviews/CVF_INTERNAL_SAMPLE_COMPLETION_2026-06-19.md",
            "This artifact discusses caller path input for a profile.\n",
        )

        self.assertTrue(
            any("missing `## Delta Mutating Profile Boundary Control Block`" in item for item in violations)
        )

    def test_missing_field_fails(self) -> None:
        text = VALID_BLOCK.replace(
            "| receiptChain | T1/T2/T3/T4 receipt chain |\n",
            "",
        )

        violations = MODULE.check_text(
            "docs/reviews/CVF_DELTA_T4C_SAMPLE_COMPLETION_2026-06-19.md",
            text,
        )

        self.assertTrue(any("receiptChain" in item for item in violations))

    def test_empty_field_fails(self) -> None:
        text = VALID_BLOCK.replace(
            "| commandAuthority | static command authority only |",
            "| commandAuthority | TBD |",
        )

        violations = MODULE.check_text(
            "docs/reviews/CVF_DELTA_T4C_SAMPLE_COMPLETION_2026-06-19.md",
            text,
        )

        self.assertTrue(any("commandAuthority" in item for item in violations))

    def test_ambiguous_caller_path_input_fails(self) -> None:
        text = VALID_BLOCK.replace(
            "| callerPathInput | NO_CALLER_PATH_INPUT |",
            "| callerPathInput | caller path accepted from work order |",
        )

        violations = MODULE.check_text(
            "docs/reviews/CVF_DELTA_T4C_SAMPLE_COMPLETION_2026-06-19.md",
            text,
        )

        self.assertTrue(any("callerPathInput" in item for item in violations))

    def test_caller_path_na_with_reason_passes(self) -> None:
        text = VALID_BLOCK.replace(
            "| callerPathInput | NO_CALLER_PATH_INPUT |",
            "| callerPathInput | N/A with reason: checker-only artifact |",
        )

        violations = MODULE.check_text(
            "docs/reviews/CVF_DELTA_T4C_SAMPLE_COMPLETION_2026-06-19.md",
            text,
        )

        self.assertEqual([], violations)

    def test_unrelated_doc_ignored(self) -> None:
        violations = MODULE.check_text(
            "docs/reviews/CVF_INTERNAL_SAMPLE_COMPLETION_2026-06-19.md",
            "Status: COMPLETE_PENDING_CLOSURE\n",
        )

        self.assertEqual([], violations)

    def test_archive_path_ignored(self) -> None:
        violations = MODULE.check_text(
            "docs/reviews/archive/CVF_DELTA_T4C_SAMPLE_COMPLETION_2026-06-19.md",
            "Delta mutating profile boundary: REQUIRED\n",
        )

        self.assertEqual([], violations)


if __name__ == "__main__":
    unittest.main()
