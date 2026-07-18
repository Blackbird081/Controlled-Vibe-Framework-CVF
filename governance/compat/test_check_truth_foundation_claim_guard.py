"""
Focused tests for check_truth_foundation_claim_guard.py.

Covers TKG-T4 requirements:
- one true-positive per implemented overclaim class;
- true-negatives for bounded wording;
- discussion-only planning prose exclusion;
- CLI --base/--head/--enforce/--json behavior;
- read-only implementation boundary.
"""

from __future__ import annotations

import io
import json
import sys
import unittest
from contextlib import redirect_stdout
from pathlib import Path
from unittest import mock


REPO_ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(REPO_ROOT))

from governance.compat import check_truth_foundation_claim_guard as checker


GOVERNED_PATH = "docs/reviews/test_truth_foundation_claim.md"


def _doc(body: str) -> str:
    return f"""\
# Test Truth Foundation Claim

Status: TEST

## Purpose

{body}

## Claim Boundary

Static test fixture only.
"""


class TestTruthFoundationClaimTruePositives(unittest.TestCase):

    def _types_for(self, body: str) -> list[str]:
        violations = checker.diagnose_truth_foundation_claims(GOVERNED_PATH, _doc(body))
        return [item["type"] for item in violations]

    def test_integrity_as_truth_detected(self) -> None:
        types = self._types_for("The sha256 hash proves the contents are semantically true.")
        self.assertIn("integrity_as_truth_overclaim", types)

    def test_llm_self_verification_detected(self) -> None:
        types = self._types_for(
            "Reviewer prose alone verified the production readiness hard claim."
        )
        self.assertIn("llm_self_verification_overclaim", types)

    def test_external_input_authority_detected(self) -> None:
        types = self._types_for("The external repo is the CVF source authority for this rule.")
        self.assertIn("external_input_authority_overclaim", types)


class TestTruthFoundationClaimTrueNegatives(unittest.TestCase):

    def test_integrity_boundary_language_passes(self) -> None:
        violations = checker.diagnose_truth_foundation_claims(
            GOVERNED_PATH,
            _doc("The sha256 hash proves byte stability only; source verification owns semantics."),
        )
        self.assertEqual(violations, [])

    def test_reviewer_risk_language_passes(self) -> None:
        violations = checker.diagnose_truth_foundation_claims(
            GOVERNED_PATH,
            _doc("Reviewer prose identified a risk; tests and source reads verify hard claims."),
        )
        self.assertEqual(violations, [])

    def test_external_advisory_language_passes(self) -> None:
        violations = checker.diagnose_truth_foundation_claims(
            GOVERNED_PATH,
            _doc("The external repo is advisory input until a CVF-owned contract maps it."),
        )
        self.assertEqual(violations, [])

    def test_discussion_only_section_is_ignored(self) -> None:
        text = """\
# Planning Fixture

Status: TEST

## Guard Behavior Discussion

Discussion-only disposition: META_DISCUSSION_ONLY

The sha256 hash proves the contents are semantically true.
Reviewer prose alone verified the production readiness hard claim.
The external repo is the CVF source authority for this rule.

## Claim Boundary

Discussion-only examples above are ignored.
"""
        violations = checker.diagnose_truth_foundation_claims(GOVERNED_PATH, text)
        self.assertEqual(violations, [])

    def test_archive_path_is_not_applicable(self) -> None:
        self.assertFalse(checker._is_applicable("docs/reviews/archive/old.md"))


class TestTruthFoundationClaimCliContract(unittest.TestCase):

    def _run_main(self, argv: list[str], doc_text: str) -> tuple[int, str]:
        with mock.patch.object(sys, "argv", ["check_truth_foundation_claim_guard.py", *argv]), \
             mock.patch.object(checker, "_get_changed_name_status", return_value={GOVERNED_PATH: {"M"}}), \
             mock.patch.object(checker, "_get_worktree_name_status", return_value={}), \
             mock.patch.object(checker, "_read_rel", return_value=doc_text), \
             mock.patch.object(checker.Path, "exists", return_value=True), \
             mock.patch.object(checker.Path, "is_dir", return_value=False):
            output = io.StringIO()
            with redirect_stdout(output):
                rc = checker.main()
            return rc, output.getvalue()

    def test_non_enforcing_mode_reports_violation_but_returns_zero(self) -> None:
        rc, output = self._run_main(
            ["--base", "BASE", "--head", "HEAD"],
            _doc("The receipt proves the claim is correct."),
        )
        self.assertEqual(rc, 0)
        self.assertIn("VIOLATION", output)

    def test_enforcing_mode_returns_nonzero_for_violation(self) -> None:
        rc, output = self._run_main(
            ["--base", "BASE", "--head", "HEAD", "--enforce"],
            _doc("The approval proves the statement is true."),
        )
        self.assertEqual(rc, 2)
        self.assertIn("integrity artifact is claimed", output)

    def test_json_mode_returns_structured_report(self) -> None:
        rc, output = self._run_main(
            ["--base", "BASE", "--head", "HEAD", "--json"],
            _doc("The external repo is the CVF source authority for this rule."),
        )
        self.assertEqual(rc, 0)
        report = json.loads(output)
        self.assertEqual(report["violationCount"], 1)
        self.assertEqual(report["range"]["base"], "BASE")
        self.assertEqual(report["range"]["head"], "HEAD")

    def test_enforcing_mode_returns_zero_when_clean(self) -> None:
        rc, output = self._run_main(
            ["--base", "BASE", "--head", "HEAD", "--enforce"],
            _doc("Plain governed Markdown with no truth-foundation overclaim."),
        )
        self.assertEqual(rc, 0)
        self.assertIn("COMPLIANT", output)


class TestReadOnlyImplementationBoundary(unittest.TestCase):

    def test_checker_source_has_no_write_or_network_primitives(self) -> None:
        source = Path(checker.__file__).read_text(encoding="utf-8")
        forbidden_tokens = (
            ".write_text(",
            ".write_bytes(",
            "open(",
            "requests.",
            "urllib.",
            "socket.",
            "http.client",
        )
        for token in forbidden_tokens:
            with self.subTest(token=token):
                self.assertNotIn(token, source)


if __name__ == "__main__":
    unittest.main()
