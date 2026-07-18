#!/usr/bin/env python3
"""Focused tests for the AAF-T5 worker-experience retrospective checker."""

from __future__ import annotations

import importlib.util
import sys
import unittest
from pathlib import Path

_COMPAT_DIR = Path(__file__).resolve().parent
if str(_COMPAT_DIR) not in sys.path:
    sys.path.insert(0, str(_COMPAT_DIR))

_MODULE_PATH = _COMPAT_DIR / "check_worker_experience_retrospective.py"
_SPEC = importlib.util.spec_from_file_location(
    "check_worker_experience_retrospective", _MODULE_PATH
)
if _SPEC is None or _SPEC.loader is None:
    raise RuntimeError(f"Unable to load module from {_MODULE_PATH}")
chk = importlib.util.module_from_spec(_SPEC)
sys.modules[_SPEC.name] = chk
_SPEC.loader.exec_module(chk)


_WORKER_RETURN_HEADER = (
    "# Worker Return\n\n"
    "Status: COMPLETE_PENDING_REVIEW\n\n"
    "Responds to work order: docs/work_orders/x.md\n\n"
)

_VALID_STRUCT = (
    _WORKER_RETURN_HEADER
    + "WORKER_EXPERIENCE_RETRO:\n"
    + "frictionLevel: LOW\n"
    + "frictionType: KEYWORD_TRAP\n"
    + "observedStep: corpus block self-triggered full-field requirement\n"
    + "preventiveControlCandidate: HELPER_DIAGNOSTIC\n"
)

_VALID_STRUCT_WITH_BULLETS = (
    _WORKER_RETURN_HEADER
    + "WORKER_EXPERIENCE_RETRO:\n"
    + "- frictionLevel: LOW\n"
    + "- frictionType: KEYWORD_TRAP\n"
    + "- observedStep: corpus block self-triggered full-field requirement\n"
    + "- preventiveControlCandidate: HELPER_DIAGNOSTIC\n"
)

_VALID_NA = (
    _WORKER_RETURN_HEADER
    + "WORKER_EXPERIENCE_RETRO_NA_WITH_REASON: no friction beyond normal gates; "
    + "no gate surprise, no helper gap, no worktree contamination this return\n"
)

_MISSING_TOKEN = _WORKER_RETURN_HEADER + "## Findings\n\nDid the work.\n"

_BARE_NA = _WORKER_RETURN_HEADER + "WORKER_EXPERIENCE_RETRO_NA_WITH_REASON: none\n"

_NA_WITH_EXTRA_TEXT = (
    _WORKER_RETURN_HEADER
    + "WORKER_EXPERIENCE_RETRO_NA_WITH_REASON: no friction beyond normal gates; "
    + "no gate surprise, no helper gap, no worktree contamination this return; extra\n"
)

_BOTH_TOKENS = _VALID_STRUCT + "\n" + _VALID_NA

_BAD_ENUM = (
    _WORKER_RETURN_HEADER
    + "WORKER_EXPERIENCE_RETRO:\n"
    + "frictionLevel: SOMETIMES\n"
    + "frictionType: KEYWORD_TRAP\n"
    + "observedStep: x\n"
    + "preventiveControlCandidate: HELPER_DIAGNOSTIC\n"
)

_EMPTY_STEP = (
    _WORKER_RETURN_HEADER
    + "WORKER_EXPERIENCE_RETRO:\n"
    + "frictionLevel: NONE\n"
    + "frictionType: NONE\n"
    + "observedStep:\n"
    + "preventiveControlCandidate: NONE\n"
)

_ADVISORY_PACKET = (
    "# Advisory\n\n"
    "docType: review_context\n\n"
    "This packet discusses COMPLETE_PENDING_REVIEW and worker-return shape.\n"
    "Responds to work order: docs/work_orders/x.md\n"
)

_WORK_ORDER_DISCUSSING_MARKER = (
    "# Work Order\n\n"
    "Status: CLOSED_PASS_BOUNDED\n\n"
    "docType: work_order\n\n"
    "The worker-return artifact must include Self-declared worker-return "
    "artifact: yes and may return BLOCKED_WITH_REASON.\n\n"
    "Responds to work order: docs/work_orders/x.md\n\n"
    "WORKER_EXPERIENCE_RETRO:\n"
    "frictionLevel: NONE|LOW|MEDIUM|HIGH|BLOCKING\n"
    "frictionType: NONE|GATE_SURPRISE\n"
    "observedStep: template prose\n"
    "preventiveControlCandidate: NONE|CHECKER\n"
)

_SELF_DECLARED = (
    "# Some Return\n\n"
    "Self-declared worker-return artifact: yes\n\n"
    + "WORKER_EXPERIENCE_RETRO_NA_WITH_REASON: no friction beyond normal gates; "
    + "no gate surprise, no helper gap, no worktree contamination this return\n"
)


class EligibilityTests(unittest.TestCase):
    def test_status_plus_responds_pair_is_eligible(self):
        self.assertTrue(chk.is_eligible_worker_return("docs/reviews/x.md", _VALID_STRUCT))

    def test_advisory_review_context_excluded(self):
        self.assertFalse(
            chk.is_eligible_worker_return("docs/reviews/x.md", _ADVISORY_PACKET)
        )

    def test_completion_path_excluded(self):
        self.assertFalse(
            chk.is_eligible_worker_return(
                "docs/reviews/CVF_X_COMPLETION_2026-06-20.md", _WORKER_RETURN_HEADER
            )
        )

    def test_work_order_discussing_marker_excluded(self):
        self.assertFalse(
            chk.is_eligible_worker_return(
                "docs/work_orders/CVF_X_FOR_WORKER_2026-06-20.md",
                _WORK_ORDER_DISCUSSING_MARKER,
            )
        )

    def test_explicit_self_declaration_overrides(self):
        self.assertTrue(
            chk.is_eligible_worker_return("docs/reviews/anything.md", _SELF_DECLARED)
        )

    def test_non_md_excluded(self):
        self.assertFalse(chk.is_eligible_worker_return("x.py", _VALID_STRUCT))

    def test_self_declared_reference_standard_excluded(self):
        self.assertFalse(
            chk.is_eligible_worker_return(
                "docs/reference/work_order_authoring/CVF_WORKER_RETURN_QUALITY_GATE_STANDARD.md",
                _SELF_DECLARED,
            )
        )

    def test_self_declared_fixture_excluded(self):
        self.assertFalse(
            chk.is_eligible_worker_return(
                "governance/compat/fixtures/woas_r3_worker_return_skeleton_golden.md",
                _SELF_DECLARED,
            )
        )


class DiagnoseTests(unittest.TestCase):
    def test_valid_struct_is_clean(self):
        d = chk.diagnose("docs/reviews/x.md", _VALID_STRUCT)
        self.assertTrue(d.eligible)
        self.assertTrue(d.is_clean, d.issues)

    def test_valid_struct_with_bullet_prefix_is_clean(self):
        d = chk.diagnose("docs/reviews/x.md", _VALID_STRUCT_WITH_BULLETS)
        self.assertTrue(d.eligible)
        self.assertTrue(d.is_clean, d.issues)

    def test_valid_na_is_clean(self):
        d = chk.diagnose("docs/reviews/x.md", _VALID_NA)
        self.assertTrue(d.is_clean, d.issues)

    def test_missing_token_flagged(self):
        d = chk.diagnose("docs/reviews/x.md", _MISSING_TOKEN)
        self.assertTrue(d.eligible)
        self.assertFalse(d.is_clean)
        self.assertTrue(any("missing worker-experience token" in i for i in d.issues))

    def test_bare_na_rejected(self):
        d = chk.diagnose("docs/reviews/x.md", _BARE_NA)
        self.assertFalse(d.is_clean)
        self.assertTrue(any("non-asserting" in i for i in d.issues))

    def test_na_with_extra_text_rejected(self):
        d = chk.diagnose("docs/reviews/x.md", _NA_WITH_EXTRA_TEXT)
        self.assertFalse(d.is_clean)
        self.assertTrue(any("exact asserting reason" in i for i in d.issues))

    def test_both_token_forms_rejected(self):
        d = chk.diagnose("docs/reviews/x.md", _BOTH_TOKENS)
        self.assertFalse(d.is_clean)
        self.assertTrue(any("exactly one" in i for i in d.issues))

    def test_bad_enum_rejected(self):
        d = chk.diagnose("docs/reviews/x.md", _BAD_ENUM)
        self.assertFalse(d.is_clean)
        self.assertTrue(any("invalid frictionLevel" in i for i in d.issues))

    def test_empty_observed_step_rejected(self):
        d = chk.diagnose("docs/reviews/x.md", _EMPTY_STEP)
        self.assertFalse(d.is_clean)
        self.assertTrue(any("observedStep" in i for i in d.issues))

    def test_advisory_packet_not_eligible_so_not_flagged(self):
        d = chk.diagnose("docs/reviews/x.md", _ADVISORY_PACKET)
        # Not eligible -> never enters the violation set; the runner filters on
        # eligibility, so an advisory packet is never flagged for a missing token.
        self.assertFalse(d.eligible)
        self.assertEqual(d.issues, ())


if __name__ == "__main__":
    unittest.main()
