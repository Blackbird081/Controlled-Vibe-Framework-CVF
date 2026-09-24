from __future__ import annotations

import importlib.util
import sys
import unittest
from pathlib import Path


MODULE_PATH = Path(__file__).resolve().with_name("run_worker_return_fast_gate.py")
SPEC = importlib.util.spec_from_file_location("run_worker_return_fast_gate", MODULE_PATH)
MODULE = importlib.util.module_from_spec(SPEC)
assert SPEC and SPEC.loader
sys.modules[SPEC.name] = MODULE
SPEC.loader.exec_module(MODULE)


class WorkerReturnFastGateTests(unittest.TestCase):
    def test_default_commands_include_reviewer_fast_and_registry_drift(self) -> None:
        labels = [command.name for command in MODULE.build_commands()]

        self.assertEqual(
            labels,
            [
                "corpus scan registry aggregate drift",
                "epistemic process packet",
                "worker-return quality gate",
                "independent review probe admission",
                "reviewer-fast governance gate",
                "git diff whitespace check",
            ],
        )

    def test_pytest_targets_run_before_governance_gates(self) -> None:
        commands = MODULE.build_commands(("tests/example_test.py",))

        self.assertEqual(commands[0].name, "focused pytest targets")
        self.assertEqual(
            commands[0].command,
            ("python", "-m", "pytest", "tests/example_test.py", "-q"),
        )

    def test_epistemic_packet_check_runs_before_reviewer_fast(self) -> None:
        commands = MODULE.build_commands()
        labels = [command.name for command in commands]

        self.assertLess(
            labels.index("epistemic process packet"),
            labels.index("reviewer-fast governance gate"),
        )
        self.assertEqual(
            commands[labels.index("epistemic process packet")].command,
            ("python", "governance/compat/check_epistemic_process_packet.py", "--enforce"),
        )

    def test_worker_return_quality_runs_before_reviewer_fast(self) -> None:
        commands = MODULE.build_commands()
        labels = [command.name for command in commands]

        self.assertLess(
            labels.index("worker-return quality gate"),
            labels.index("reviewer-fast governance gate"),
        )
        self.assertEqual(
            commands[labels.index("worker-return quality gate")].command,
            ("python", "governance/compat/check_worker_return_quality_gate.py", "--enforce"),
        )

    def test_independent_review_probe_admission_uses_changed_lane_only(self) -> None:
        # RIPA-ROOT-09: the fast gate must not fail on a pre-existing
        # unrelated parked artifact's known finding, so it invokes the
        # checker's narrower changed-lane-only mode.
        commands = MODULE.build_commands()
        labels = [command.name for command in commands]
        self.assertEqual(
            commands[labels.index("independent review probe admission")].command,
            (
                "python",
                "governance/compat/check_independent_review_probe_admission.py",
                "--enforce",
                "--changed-lane-only",
            ),
        )

    def test_active_work_order_is_forwarded_to_worker_return_quality(self) -> None:
        # DRC-03: the exact-return admission must receive the active work
        # order whenever the fast gate is given one.
        work_order = "docs/work_orders/CVF_EXAMPLE_WORK_ORDER.md"
        commands = MODULE.build_commands((), work_order)
        by_name = {command.name: command.command for command in commands}
        self.assertEqual(
            by_name["worker-return quality gate"],
            (
                "python",
                "governance/compat/check_worker_return_quality_gate.py",
                "--enforce",
                "--active-work-order",
                work_order,
            ),
        )
        self.assertEqual(
            by_name["independent review probe admission"][-2:],
            ("--active-work-order", work_order),
        )


if __name__ == "__main__":
    unittest.main()
