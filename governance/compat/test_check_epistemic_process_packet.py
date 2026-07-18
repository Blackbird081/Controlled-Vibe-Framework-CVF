from __future__ import annotations

import importlib.util
import sys
import unittest
from pathlib import Path


MODULE_PATH = Path(__file__).resolve().with_name("check_epistemic_process_packet.py")
SPEC = importlib.util.spec_from_file_location("check_epistemic_process_packet", MODULE_PATH)
MODULE = importlib.util.module_from_spec(SPEC)
assert SPEC and SPEC.loader
sys.modules[SPEC.name] = MODULE
SPEC.loader.exec_module(MODULE)


# Fixture: complete evidence-heavy worker return with all epistemic sections
COMPLETE_WORKER_RETURN = """
## Worker Return

Status: WORKER_RETURN_SUBMITTED_UNCOMMITTED

## Expected Result / Prediction

The checker will find 3 violations in the test corpus based on source analysis.

## Evidence Comparison

Actual run produced 3 violations matching the prediction exactly.

## Contradiction Or Gap Disposition

No contradiction found; prediction and actual evidence agree.

## Claim Update

Claim confirmed: the checker produces the predicted number of violations.

## Claim boundary

Structural check only; no semantic truth claim.
"""

# Fixture: evidence-heavy return that omits evidence comparison
MISSING_EVIDENCE_COMPARISON = """
## Worker Return

Status: WORKER_RETURN_SUBMITTED_UNCOMMITTED

## Expected Result / Prediction

The checker will find 3 violations.

## Claim Update

Claim confirmed.
"""

# Fixture: evidencd-heavy return missing all required sections (only PASS claim)
GENERIC_PASS_ONLY = """
## Worker Return

Status: WORKER_RETURN_SUBMITTED_UNCOMMITTED

All gates passed. No issues found.
"""

# Fixture: NA escape with reason
NA_WITH_REASON = """
## Worker Return

Status: WORKER_RETURN_SUBMITTED_UNCOMMITTED

## Epistemic Process Block

Epistemic Process Applicability: EPISTEMIC_PROCESS_NA_WITH_REASON: this is a mechanical hook-wiring change with no analytical output or empirical claim.

## Claim boundary

Hook chain wiring only.
"""

# Fixture: NA escape without reason (violation)
NA_WITHOUT_REASON = """
## Worker Return

Status: WORKER_RETURN_SUBMITTED_UNCOMMITTED

## Epistemic Process Block

Epistemic Process Applicability: EPISTEMIC_PROCESS_NA_WITH_REASON

## Claim boundary

Hook chain wiring only.
"""

# Fixture: token appears in prose/commands, not as a valid applicability field
NA_TOKEN_ONLY_IN_PROSE = """
## Worker Return

Status: WORKER_RETURN_SUBMITTED_UNCOMMITTED

Command searched for EPISTEMIC_PROCESS_NA_WITH_REASON: <reason> during collision checks.

All gates passed. No issues found.
"""

# Fixture: mechanical/low-evidence note that should NOT trigger
MECHANICAL_NOTE = """
# Release Note

docType: note

This file records a changelog entry. No findings.
"""

# Fixture: baseline dispatch doc that should NOT trigger
BASELINE_DISPATCH = """
# GC-018 Authorization

docType: baseline

Status: DISPATCH_READY_FOR_CLAUDE

rawMemoryReleased=false
"""

# Fixture: evidence sections in wrong artifact type (docs/baselines/)
EVIDENCE_IN_BASELINE = """
Status: DISPATCH_READY_FOR_CLAUDE

WORKER_RETURN_SUBMITTED_UNCOMMITTED

## Expected Result / Prediction

Something here.

## Evidence Comparison

Some comparison.

## Contradiction Or Gap Disposition

No contradiction.

## Claim Update

Confirmed.
"""


class EpistemicProcessPacketTests(unittest.TestCase):

    # --- PASS: complete evidence-heavy packet ---

    def test_complete_evidence_packet_passes(self) -> None:
        """A docs/reviews/ worker return with all epistemic sections must pass."""
        path = "docs/reviews/CVF_EXAMPLE_WORKER_RETURN_2026-06-13.md"
        changed = {path: {"A"}}
        texts = {path: COMPLETE_WORKER_RETURN}

        self.assertEqual(MODULE.find_epistemic_violations(changed, texts), [])

    # --- FAIL: generic PASS claim without evidence sections ---

    def test_generic_pass_claim_without_evidence_sections_is_violation(self) -> None:
        """Worker return with only a generic PASS claim and no epistemic sections."""
        path = "docs/reviews/CVF_EXAMPLE_WORKER_RETURN_2026-06-13.md"
        changed = {path: {"A"}}
        texts = {path: GENERIC_PASS_ONLY}

        violations = MODULE.find_epistemic_violations(changed, texts)

        self.assertEqual(len(violations), 1)
        self.assertIn("epistemic process sections", violations[0])
        self.assertIn("Expected Result / Prediction", violations[0])

    # --- FAIL: packet missing evidence comparison ---

    def test_missing_evidence_comparison_is_violation(self) -> None:
        """Worker return missing Evidence Comparison section."""
        path = "docs/reviews/CVF_EXAMPLE_WORKER_RETURN_2026-06-13.md"
        changed = {path: {"A"}}
        texts = {path: MISSING_EVIDENCE_COMPARISON}

        violations = MODULE.find_epistemic_violations(changed, texts)

        self.assertEqual(len(violations), 1)
        self.assertIn("Evidence Comparison", violations[0])

    # --- FAIL: evidence sections in wrong artifact type (docs/baselines/) ---

    def test_evidence_sections_in_baseline_does_not_require_epistemic_check(self) -> None:
        """docs/baselines/ files are excluded from the epistemic process checker."""
        path = "docs/baselines/CVF_GC018_EXAMPLE_2026-06-13.md"
        changed = {path: {"A"}}
        texts = {path: EVIDENCE_IN_BASELINE}

        # Baselines are in EXCLUDED_PREFIXES; checker must not trigger
        self.assertEqual(MODULE.find_epistemic_violations(changed, texts), [])

    # --- PASS: NA escape with reason ---

    def test_na_with_reason_passes(self) -> None:
        """EPISTEMIC_PROCESS_NA_WITH_REASON with explicit reason must pass."""
        path = "docs/reviews/CVF_MECHANICAL_WIRING_RETURN_2026-06-13.md"
        changed = {path: {"A"}}
        texts = {path: NA_WITH_REASON}

        self.assertEqual(MODULE.find_epistemic_violations(changed, texts), [])

    # --- FAIL: NA escape without reason ---

    def test_na_without_reason_is_violation(self) -> None:
        """EPISTEMIC_PROCESS_NA_WITH_REASON without a reason must fail."""
        path = "docs/reviews/CVF_MECHANICAL_WIRING_RETURN_2026-06-13.md"
        changed = {path: {"A"}}
        texts = {path: NA_WITHOUT_REASON}

        violations = MODULE.find_epistemic_violations(changed, texts)

        self.assertEqual(len(violations), 1)
        self.assertIn("EPISTEMIC_PROCESS_NA_WITH_REASON", violations[0])
        self.assertIn("no reason", violations[0])

    def test_na_token_in_prose_does_not_bypass_required_sections(self) -> None:
        """The NA token must be in the applicability field, not arbitrary prose."""
        path = "docs/reviews/CVF_EXAMPLE_WORKER_RETURN_2026-06-13.md"
        changed = {path: {"A"}}
        texts = {path: NA_TOKEN_ONLY_IN_PROSE}

        violations = MODULE.find_epistemic_violations(changed, texts)

        self.assertEqual(len(violations), 1)
        self.assertIn("epistemic process sections", violations[0])

    # --- PASS: mechanical/low-evidence work avoids the checker ---

    def test_mechanical_note_not_in_eligible_prefix_is_ignored(self) -> None:
        """A note file under docs/reference/ without evidence-heavy triggers is ignored."""
        path = "docs/reference/CVF_RELEASE_NOTE_2026-06-13.md"
        changed = {path: {"A"}}
        texts = {path: MECHANICAL_NOTE}

        self.assertEqual(MODULE.find_epistemic_violations(changed, texts), [])

    def test_baseline_dispatch_doc_is_ignored(self) -> None:
        """docs/baselines/ dispatch docs are excluded from the checker."""
        path = "docs/baselines/CVF_GC018_EXAMPLE_2026-06-13.md"
        changed = {path: {"A"}}
        texts = {path: BASELINE_DISPATCH}

        self.assertEqual(MODULE.find_epistemic_violations(changed, texts), [])

    # --- PASS: archived files are ignored ---

    def test_archived_file_is_ignored(self) -> None:
        """Files under /archive/ must be skipped even if they contain trigger vocabulary."""
        path = "docs/reviews/archive/CVF_OLD_WORKER_RETURN_2026-06-13.md"
        changed = {path: {"M"}}
        texts = {path: COMPLETE_WORKER_RETURN}

        self.assertEqual(MODULE.find_epistemic_violations(changed, texts), [])

    # --- PASS: docs/reviews/ completion with all required sections ---

    def test_completion_review_with_all_sections_passes(self) -> None:
        """A completion_review file with all epistemic sections must pass."""
        content = (
            "docType: completion_review\n"
            "Status: CLOSED_PASS_BOUNDED\n"
            + COMPLETE_WORKER_RETURN
        )
        path = "docs/reviews/CVF_EXAMPLE_COMPLETION_2026-06-13.md"
        changed = {path: {"A"}}
        texts = {path: content}

        self.assertEqual(MODULE.find_epistemic_violations(changed, texts), [])

    # --- is_evidence_heavy_packet unit tests ---

    def test_docs_reviews_worker_return_is_eligible(self) -> None:
        text = "Status: WORKER_RETURN_SUBMITTED_UNCOMMITTED\n"
        self.assertTrue(MODULE.is_evidence_heavy_packet(
            "docs/reviews/CVF_EXAMPLE.md", text
        ))

    def test_docs_baselines_is_not_eligible(self) -> None:
        text = "WORKER_RETURN_SUBMITTED_UNCOMMITTED\n"
        self.assertFalse(MODULE.is_evidence_heavy_packet(
            "docs/baselines/CVF_GC018_EXAMPLE.md", text
        ))

    def test_docs_work_orders_is_not_eligible(self) -> None:
        text = "Status: DISPATCH_READY_FOR_CLAUDE\nWORKER_RETURN\n"
        self.assertFalse(MODULE.is_evidence_heavy_packet(
            "docs/work_orders/CVF_AGENT_WORK_ORDER_EXAMPLE.md", text
        ))

    def test_non_md_file_is_not_eligible(self) -> None:
        text = "WORKER_RETURN_SUBMITTED_UNCOMMITTED\n"
        self.assertFalse(MODULE.is_evidence_heavy_packet(
            "docs/reviews/output.json", text
        ))


if __name__ == "__main__":
    unittest.main()
