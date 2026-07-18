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


if __name__ == "__main__":
    unittest.main()
