from __future__ import annotations

import importlib.util
import sys
import tempfile
import unittest
from unittest import mock
from pathlib import Path


MODULE_PATH = Path(__file__).resolve().with_name("run_worker_return_fast_gate.py")
SPEC = importlib.util.spec_from_file_location("run_worker_return_fast_gate", MODULE_PATH)
MODULE = importlib.util.module_from_spec(SPEC)
assert SPEC and SPEC.loader
sys.modules[SPEC.name] = MODULE
SPEC.loader.exec_module(MODULE)


class WorkerReturnFastGateTests(unittest.TestCase):
    def test_selected_budget_uses_actual_bytes_and_normal_newline_counts(self):
        for raw in (b'a\nb\n', b'a\r\nb\r\n', b'a\rb\r'):
            self.assertEqual(MODULE.return_budget_issues(raw, 2, len(raw)), [])
            self.assertIn('line budget exceeded', MODULE.return_budget_issues(raw, 1, None)[0])
            self.assertIn('byte budget exceeded', MODULE.return_budget_issues(raw, None, len(raw)-1)[0])
        self.assertEqual(MODULE.return_budget_issues(b'x\n' * 2000), [])
        self.assertEqual(MODULE.return_budget_issues((chr(233) + '\n').encode(), 1, 3), [])
        self.assertTrue(MODULE.return_budget_issues((chr(233) + '\n').encode(), 1, 2))

    def test_budget_fails_before_any_gate_or_focused_test(self):
        with tempfile.TemporaryDirectory() as tmp, mock.patch.object(MODULE, 'REPO_ROOT', Path(tmp)), mock.patch.object(MODULE, '_run') as run:
            wo = Path(tmp) / 'docs/work_orders/order.md'; wo.parent.mkdir(parents=True)
            ret = Path(tmp) / 'docs/reviews/return.md'; ret.parent.mkdir(parents=True)
            wo.write_text('workerReturnPath: `docs/reviews/return.md`\n')
            ret.write_bytes(b'x\n' * 338)
            argv = ['gate', '--active-work-order', 'docs/work_orders/order.md', '--max-return-lines', '300']
            with mock.patch.object(sys, 'argv', argv):
                self.assertEqual(MODULE.main(), 1)
            run.assert_not_called()
            # Exact-fit limits continue into the entire original command bundle.
            run.return_value = 0
            with mock.patch.object(sys, 'argv', argv[:-1] + ['338']):
                self.assertEqual(MODULE.main(), 0)
            self.assertEqual(run.call_count, len(MODULE.build_commands((), 'docs/work_orders/order.md')))
            run.reset_mock()
            wo.write_text('workerReturnPath: `../escape.md`\n')
            with mock.patch.object(sys, 'argv', argv):
                self.assertEqual(MODULE.main(), 1)
            run.assert_not_called()

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

    def test_typescript_targets_route_to_package_vitest(self) -> None:
        targets = (
            "EXTENSIONS/CVF_EXECUTION_PLANE_FOUNDATION/tests/mao.durable.run.store.test.ts",
            "EXTENSIONS/CVF_EXECUTION_PLANE_FOUNDATION/tests/mao.operational.worker.launcher.test.ts",
        )
        commands = MODULE.build_commands(targets)

        self.assertEqual(commands[0].name, "focused vitest targets")
        self.assertEqual(commands[0].cwd, "EXTENSIONS/CVF_EXECUTION_PLANE_FOUNDATION")
        self.assertEqual(
            commands[0].command,
            (
                "npx", "vitest", "run",
                "tests/mao.durable.run.store.test.ts",
                "tests/mao.operational.worker.launcher.test.ts",
            ),
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
        original_root = MODULE.REPO_ROOT
        with tempfile.TemporaryDirectory() as temp_dir:
            MODULE.REPO_ROOT = Path(temp_dir)
            path = MODULE.REPO_ROOT / work_order
            path.parent.mkdir(parents=True)
            path.write_text(
                "workerReturnPath: `docs/reviews/CVF_EXAMPLE_WORKER_RETURN.md`\n",
                encoding="utf-8",
            )
            commands = MODULE.build_commands((), work_order)
        MODULE.REPO_ROOT = original_root
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
        self.assertEqual(
            by_name["work-order acceptance ledger"],
            (
                "python",
                "governance/compat/check_work_order_acceptance_ledger.py",
                "--work-order",
                work_order,
                "--return",
                "docs/reviews/CVF_EXAMPLE_WORKER_RETURN.md",
                "--enforce",
            ),
        )


if __name__ == "__main__":
    unittest.main()
