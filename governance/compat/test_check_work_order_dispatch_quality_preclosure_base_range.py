#!/usr/bin/env python3
"""Focused tests for the EACQ-FV-L1 stale pre-closure dispatch-base guard.

Loads the checker the same way the sibling test modules for this checker
family do: through `check_work_order_dispatch_quality.py`, whose module-load
step `exec()`s the split implementation files (including
`check_work_order_dispatch_quality_range.py`) into its own globals. The new
validator under test, `_validate_stale_preclosure_dispatch_base`, is called
directly on raw text so these tests stay isolated from the rest of
`_validate_work_order`'s many other dispatch-quality checks.
"""

from __future__ import annotations

import importlib.util
import sys
import unittest
from pathlib import Path


COMPAT_DIR = Path(__file__).resolve().parent
if str(COMPAT_DIR) not in sys.path:
    sys.path.insert(0, str(COMPAT_DIR))

MODULE_PATH = COMPAT_DIR / "check_work_order_dispatch_quality.py"
SPEC = importlib.util.spec_from_file_location("check_work_order_dispatch_quality", MODULE_PATH)
if SPEC is None or SPEC.loader is None:
    raise RuntimeError(f"Unable to load module from {MODULE_PATH}")
MODULE = importlib.util.module_from_spec(SPEC)
sys.modules[SPEC.name] = MODULE
SPEC.loader.exec_module(MODULE)


DISPATCH_SHA = "3a7d210bebdec728a10e708468fde3947da3581b"
DISTINCT_MATERIAL_SHA = "c3d4e7636abcdef1234567890abcdef123456789"


class StalePreclosureDispatchBaseTests(unittest.TestCase):
    """Focused Case Matrix, all six cases from the EACQ-FV-L1 work order."""

    def test_case_1_literal_dispatch_sha_reused_by_preclosure_plus_head_fails(self) -> None:
        text = (
            f"Dispatch base head: `{DISPATCH_SHA}`\n"
            "## Verification Commands\n"
            "python governance/compat/run_agent_autorun_workflow_gate.py "
            f"--phase pre-closure --base {DISPATCH_SHA} --head HEAD\n"
        )
        issues = MODULE._validate_stale_preclosure_dispatch_base(text)
        self.assertEqual(len(issues), 1)
        self.assertIn(DISPATCH_SHA, issues[0])

    def test_case_2_symbolic_dispatch_base_head_reused_by_preclosure_plus_head_fails(self) -> None:
        text = (
            f"Dispatch base head: `{DISPATCH_SHA}`\n"
            "## Verification Commands\n"
            "python governance/compat/run_agent_autorun_workflow_gate.py "
            "--phase pre-closure --base dispatchBaseHead --head HEAD\n"
        )
        issues = MODULE._validate_stale_preclosure_dispatch_base(text)
        self.assertEqual(len(issues), 1)

    def test_case_2b_symbolic_dispatch_base_head_via_inline_table_field(self) -> None:
        """The dispatch base can also be established via an inline
        `dispatchBaseHead=<sha>` table cell (as used in `baseHeadFor(phase)`
        rows) rather than the top-level `Dispatch base head:` field."""
        text = (
            f"| baseHeadFor(phase) | dispatchBaseHead=`{DISPATCH_SHA}`; "
            "executionBaseHead=worker captures; closureBaseHead=reviewer sets |\n"
            "## Verification Commands\n"
            "python governance/compat/run_agent_autorun_workflow_gate.py "
            f"--phase pre-closure --base {DISPATCH_SHA} --head HEAD\n"
        )
        issues = MODULE._validate_stale_preclosure_dispatch_base(text)
        self.assertEqual(len(issues), 1)

    def test_case_3_preimplementation_with_dispatch_base_passes(self) -> None:
        text = (
            f"Dispatch base head: `{DISPATCH_SHA}`\n"
            "## Verification Commands\n"
            "python governance/compat/run_agent_autorun_workflow_gate.py "
            f"--phase pre-implementation --base {DISPATCH_SHA} --head HEAD\n"
        )
        self.assertEqual(MODULE._validate_stale_preclosure_dispatch_base(text), [])

    def test_case_4_preclosure_with_distinct_material_base_passes(self) -> None:
        text = (
            f"Dispatch base head: `{DISPATCH_SHA}`\n"
            "## Verification Commands\n"
            "python governance/compat/run_agent_autorun_workflow_gate.py "
            f"--phase pre-closure --base {DISTINCT_MATERIAL_SHA} --head HEAD\n"
        )
        self.assertEqual(MODULE._validate_stale_preclosure_dispatch_base(text), [])

    def test_case_5_unsafe_command_quoted_only_in_explanatory_prose_passes(self) -> None:
        text = (
            f"Dispatch base head: `{DISPATCH_SHA}`\n"
            "Explanatory prose warns against commands like "
            "`python governance/compat/run_agent_autorun_workflow_gate.py "
            f"--phase pre-closure --base {DISPATCH_SHA} --head HEAD` appearing "
            "in a real Verification Commands section.\n"
            "## Verification Commands\n"
            "git status --short\n"
        )
        self.assertEqual(MODULE._validate_stale_preclosure_dispatch_base(text), [])

    def test_case_6_work_order_without_preclosure_command_passes(self) -> None:
        text = (
            f"Dispatch base head: `{DISPATCH_SHA}`\n"
            "## Verification Commands\n"
            "git diff --check\n"
            "git status --short\n"
        )
        self.assertEqual(MODULE._validate_stale_preclosure_dispatch_base(text), [])


class AdditionalBoundaryTests(unittest.TestCase):
    def test_no_verification_commands_section_at_all_passes(self) -> None:
        text = f"Dispatch base head: `{DISPATCH_SHA}`\nNo commands section here.\n"
        self.assertEqual(MODULE._validate_stale_preclosure_dispatch_base(text), [])

    def test_preclosure_command_with_non_head_target_passes(self) -> None:
        """A pre-closure command whose --head is not the literal word HEAD
        (for example a pinned closure commit) is not the unsafe pattern."""
        text = (
            f"Dispatch base head: `{DISPATCH_SHA}`\n"
            "## Verification Commands\n"
            "python governance/compat/run_agent_autorun_workflow_gate.py "
            f"--phase pre-closure --base {DISPATCH_SHA} --head {DISTINCT_MATERIAL_SHA}\n"
        )
        self.assertEqual(MODULE._validate_stale_preclosure_dispatch_base(text), [])

    def test_multiple_preclosure_commands_only_flags_once(self) -> None:
        """Exactly one stable issue message per affected work order, per the
        work order's Focused Case Matrix instruction, even if more than one
        unsafe command line is present."""
        text = (
            f"Dispatch base head: `{DISPATCH_SHA}`\n"
            "## Verification Commands\n"
            "python governance/compat/run_agent_autorun_workflow_gate.py "
            f"--phase pre-closure --base {DISPATCH_SHA} --head HEAD\n"
            "python governance/compat/run_agent_autorun_workflow_gate.py "
            f"--phase pre-closure --base {DISPATCH_SHA} --head HEAD\n"
        )
        issues = MODULE._validate_stale_preclosure_dispatch_base(text)
        self.assertEqual(len(issues), 1)

    def test_case_insensitive_hex_sha_still_matches(self) -> None:
        upper_sha = DISPATCH_SHA.upper()
        text = (
            f"Dispatch base head: `{DISPATCH_SHA}`\n"
            "## Verification Commands\n"
            "python governance/compat/run_agent_autorun_workflow_gate.py "
            f"--phase pre-closure --base {upper_sha} --head HEAD\n"
        )
        issues = MODULE._validate_stale_preclosure_dispatch_base(text)
        self.assertEqual(len(issues), 1)

    def test_inline_code_table_command_is_still_executable_and_fails(self) -> None:
        text = (
            f"Dispatch base head: `{DISPATCH_SHA}`\n"
            "## Verification Commands\n"
            "| `python governance/compat/run_agent_autorun_workflow_gate.py "
            f"--phase pre-closure --base {DISPATCH_SHA} --head HEAD` | required |\n"
        )
        issues = MODULE._validate_stale_preclosure_dispatch_base(text)
        self.assertEqual(len(issues), 1)

    def test_top_level_base_ignores_unrelated_historical_inline_base(self) -> None:
        historical_sha = "22644e47e118bd88bf0d004cb74819fd2956c061"
        text = (
            f"Dispatch base head: `{DISPATCH_SHA}`\n"
            f"Historical evidence used dispatchBaseHead=`{historical_sha}`.\n"
            "## Verification Commands\n"
            "python governance/compat/run_agent_autorun_workflow_gate.py "
            f"--phase pre-closure --base {historical_sha} --head HEAD\n"
        )
        self.assertEqual(MODULE._validate_stale_preclosure_dispatch_base(text), [])

    def test_only_dispatch_only_validation_does_not_touch_pre_implementation_semantics(self) -> None:
        """Sanity check: the new validator is additive and does not alter
        `_validate_no_empty_range_commands`, which already governs the
        separate `--base HEAD --head HEAD` empty-range defect."""
        text = (
            f"Dispatch base head: `{DISPATCH_SHA}`\n"
            "## Verification Commands\n"
            "python governance/compat/run_agent_autorun_workflow_gate.py --base HEAD --head HEAD\n"
        )
        self.assertEqual(MODULE._validate_stale_preclosure_dispatch_base(text), [])
        self.assertEqual(len(MODULE._validate_no_empty_range_commands(text)), 1)


class RealDocumentRegressionTests(unittest.TestCase):
    """Regression proof: the validator would have caught the exact repeated
    finding recorded in the accepted MV-1, MV-2, and EV-1 worker returns, and
    does not self-flag the real L1 work order's own safe command."""

    def test_mv2_historical_pinned_command_pattern_is_now_caught(self) -> None:
        mv2_dispatch_sha = "22644e47e118bd88bf0d004cb74819fd2956c061"
        text = (
            f"Dispatch base head: `{mv2_dispatch_sha}`\n"
            "## Verification Commands\n"
            "python governance/compat/run_agent_autorun_workflow_gate.py "
            f"--phase pre-closure --base {mv2_dispatch_sha} --head HEAD\n"
        )
        issues = MODULE._validate_stale_preclosure_dispatch_base(text)
        self.assertEqual(len(issues), 1)

    def test_real_l1_work_order_document_is_safe_under_its_own_new_rule(self) -> None:
        work_order_path = (
            COMPAT_DIR.parent.parent
            / "docs"
            / "work_orders"
            / "CVF_AGENT_WORK_ORDER_EACQ_FV_L1_PRECLOSURE_BASE_RANGE_DISPATCH_GUARD_2026-08-28.md"
        )
        if not work_order_path.is_file():
            self.skipTest("L1 work order document not present in this workspace")
        text = work_order_path.read_text(encoding="utf-8")
        self.assertEqual(MODULE._validate_stale_preclosure_dispatch_base(text), [])


if __name__ == "__main__":
    unittest.main()
