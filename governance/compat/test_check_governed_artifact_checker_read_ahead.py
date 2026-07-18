from __future__ import annotations

import sys
import textwrap
import unittest
from pathlib import Path


REPO_ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(REPO_ROOT / "governance" / "compat"))

import check_governed_artifact_checker_read_ahead as checker


VALID_ARTIFACT = textwrap.dedent("""\
# Test Completion

Status: CLOSED_PASS_BOUNDED

## Checker Source Read-Ahead Block

| Field | Evidence |
| --- | --- |
| applicableCheckersRead | `governance/compat/check_machine_closure_package.py`; `governance/compat/check_markdown_structural_completeness.py` |
| literalTokensReviewed | `## Machine Closure Package`; `Status: CLOSED_PASS_BOUNDED`; `Completion or reviewer artifact` |
| gateRunPurpose | confirm artifact shape after source read-ahead; not first discovery |
| claimBoundary | checker read-ahead evidence only |

## Claim Boundary

Doc only.
""")


class TestPathApplicability(unittest.TestCase):
    def test_review_path_is_applicable(self):
        self.assertTrue(checker._is_applicable_path("docs/reviews/CVF_TEST.md"))

    def test_reference_path_is_not_applicable(self):
        self.assertFalse(checker._is_applicable_path("docs/reference/CVF_TEST.md"))

    def test_archive_path_is_not_applicable(self):
        self.assertFalse(checker._is_applicable_path("docs/reviews/archive/CVF_TEST.md"))


class TestCheckerReadAheadBlock(unittest.TestCase):
    def test_valid_block_passes(self):
        self.assertEqual(checker.check_text("docs/reviews/CVF_TEST.md", VALID_ARTIFACT), [])

    def test_missing_block_fails(self):
        violations = checker.check_text("docs/reviews/CVF_TEST.md", "# Test\n\nNo block.\n")
        self.assertEqual([v.code for v in violations], ["checker_read_ahead_block_missing"])

    def test_missing_checker_path_fails(self):
        text = VALID_ARTIFACT.replace(
            "`governance/compat/check_machine_closure_package.py`; `governance/compat/check_markdown_structural_completeness.py`",
            "closure checker and markdown checker",
        )
        violations = checker.check_text("docs/reviews/CVF_TEST.md", text)
        self.assertIn("checker_read_ahead_no_checker_path", {v.code for v in violations})

    def test_missing_literal_tokens_fails(self):
        text = VALID_ARTIFACT.replace(
            "`## Machine Closure Package`; `Status: CLOSED_PASS_BOUNDED`; `Completion or reviewer artifact`",
            "N/A with reason: will check later",
        )
        violations = checker.check_text("docs/reviews/CVF_TEST.md", text)
        self.assertIn("checker_read_ahead_tokens_missing", {v.code for v in violations})

    def test_missing_checker_file_fails(self):
        text = VALID_ARTIFACT.replace(
            "governance/compat/check_machine_closure_package.py",
            "governance/compat/check_not_real.py",
        )
        violations = checker.check_text("docs/reviews/CVF_TEST.md", text)
        self.assertIn("checker_read_ahead_checker_missing", {v.code for v in violations})

    def test_non_confirmatory_gate_purpose_fails(self):
        text = VALID_ARTIFACT.replace(
            "confirm artifact shape after source read-ahead; not first discovery",
            "run the gate later",
        )
        violations = checker.check_text("docs/reviews/CVF_TEST.md", text)
        self.assertIn("checker_read_ahead_purpose_not_confirmatory", {v.code for v in violations})


if __name__ == "__main__":
    unittest.main()
