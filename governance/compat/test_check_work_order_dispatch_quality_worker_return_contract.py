from __future__ import annotations

import importlib.util
import sys
import subprocess
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch


MODULE_PATH = Path(__file__).resolve().with_name("check_work_order_dispatch_quality.py")
sys.path.insert(0, str(MODULE_PATH.parent))
SPEC = importlib.util.spec_from_file_location("check_work_order_dispatch_quality", MODULE_PATH)
if SPEC is None or SPEC.loader is None:
    raise RuntimeError(f"Unable to load module from {MODULE_PATH}")
MODULE = importlib.util.module_from_spec(SPEC)
sys.modules[SPEC.name] = MODULE
SPEC.loader.exec_module(MODULE)


class WorkerReturnContractDispatchQualityTests(unittest.TestCase):
    def setUp(self) -> None:
        self.temp_dir = tempfile.TemporaryDirectory()
        self.repo_root = Path(self.temp_dir.name)

    def tearDown(self) -> None:
        self.temp_dir.cleanup()

    def _write(self, rel_path: str, text: str) -> None:
        path = self.repo_root / rel_path
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(text, encoding="utf-8")

    def test_no_commit_contract_requires_worker_return_fast_gate_command(self) -> None:
        work_order = "docs/work_orders/CVF_WO_NO_FAST_GATE_TEST_2026-07-02.md"
        self._write(
            work_order,
            "\n".join(
                [
                    "Status: DISPATCHED_TO_WORKER",
                    "Commit mode: WORKER_MUST_NOT_COMMIT",
                    "dispatchBaseHead: abc1234",
                    "executionBaseHead: capture before edits",
                    "closureBaseHead: reviewer stage",
                    "## Worker Autonomy / No-Question Rule",
                    "Proceed inside allowed scope.",
                    "## Reviewer Closure Conversion",
                    "completionReviewPath: `docs/reviews/CVF_NO_FAST_GATE_COMPLETION_2026-07-02.md`",
                    "reviewerOwnedClosurePaths:",
                    "- `docs/reviews/CVF_NO_FAST_GATE_COMPLETION_2026-07-02.md`",
                    "## Worker Return Packet Shape Contract",
                    "contractProfile: WORKER_RETURN_FULL_GATE_V1",
                    "requiredGate: `python governance/compat/run_worker_return_fast_gate.py`",
                    "individualCheckerSubstitution: FORBIDDEN",
                    "workerReturnSkeleton: CHECKER_SAFE_SKELETON_REQUIRED",
                ]
            ),
        )

        with patch.object(MODULE, "REPO_ROOT", self.repo_root):
            report = MODULE._classify([work_order])

        self.assertFalse(report["compliant"])
        self.assertIn(
            "WORKER_MUST_NOT_COMMIT dispatch lacks `## Verification Commands` "
            "for worker-return fast gate evidence",
            report["violations"][0]["issues"],
        )

    def test_fast_doc_contract_requires_fail_closed_eligibility_terms(self) -> None:
        text = "\n".join(
            (
                "Commit mode: WORKER_MUST_NOT_COMMIT",
                "## Worker Return Packet Shape Contract",
                "contractProfile: WORKER_RETURN_FAST_DOC_V1",
                "scopeClassification: DOCUMENTATION_AND_EVIDENCE_ONLY_NO_COMMIT",
                "requiredGate: `python governance/compat/run_worker_return_fast_gate.py`",
                "individualCheckerSubstitution: FORBIDDEN",
                "workerReturnSkeleton: CHECKER_SAFE_SKELETON_REQUIRED",
                "publicSyncDisposition: FORBIDDEN",
                "liveRuntimeDisposition: FORBIDDEN",
                "checkerMutationDisposition: FORBIDDEN",
                "workerSelfSelection: FORBIDDEN",
                "## Verification Commands",
                "`python governance/compat/run_worker_return_fast_gate.py`",
            )
        )
        self.assertEqual(MODULE._validate_worker_return_packet_shape_contract(text), [])

    def test_fast_doc_contract_missing_boundary_term_fails(self) -> None:
        text = "\n".join(
            (
                "Commit mode: WORKER_MUST_NOT_COMMIT",
                "## Worker Return Packet Shape Contract",
                "contractProfile: WORKER_RETURN_FAST_DOC_V1",
                "scopeClassification: DOCUMENTATION_AND_EVIDENCE_ONLY_NO_COMMIT",
                "requiredGate: `python governance/compat/run_worker_return_fast_gate.py`",
                "individualCheckerSubstitution: FORBIDDEN",
                "workerReturnSkeleton: CHECKER_SAFE_SKELETON_REQUIRED",
                "liveRuntimeDisposition: FORBIDDEN",
                "checkerMutationDisposition: FORBIDDEN",
                "workerSelfSelection: FORBIDDEN",
                "## Verification Commands",
                "`python governance/compat/run_worker_return_fast_gate.py`",
            )
        )
        issues = MODULE._validate_worker_return_packet_shape_contract(text)
        self.assertTrue(any("publicSyncDisposition" in issue for issue in issues))


    def _dispatch_work_order(self, status: str, return_bindings: tuple[str, ...] = (), required_gate: str | None = "python governance/compat/run_worker_return_fast_gate.py") -> str:
        lines = [
            f"Status: {status}",
            "Commit mode: WORKER_MUST_NOT_COMMIT",
            "## Worker Return Packet Shape Contract",
        ]
        if required_gate is not None:
            lines.append(f"requiredGate: `{required_gate}`")
        lines.extend(return_bindings)
        return "\n".join(lines)

    def _validate_with_builder_subprocess_guard(self, path: str, text: str):
        original_builder = MODULE.runner.build_commands

        def guarded_builder(*args, **kwargs):
            with patch.object(
                MODULE.runner.subprocess,
                "run",
                side_effect=AssertionError("return-command construction must not execute subprocesses"),
            ):
                return original_builder(*args, **kwargs)

        with patch.object(MODULE, "REPO_ROOT", self.repo_root):
            with patch.object(MODULE.runner, "build_commands", side_effect=guarded_builder) as builder:
                issues = MODULE._validate_work_order(path, text)
        return issues, builder.call_count, builder.call_args

    def test_dispatch_builds_declared_fast_gate_without_opt_in_or_subprocess(self) -> None:
        path = "docs/work_orders/CVF_FAST_GATE_RETURN_ROUTE_TEST.md"
        text = self._dispatch_work_order(
            "READY_FOR_DISPATCH", ("workerReturnPath: `docs/reviews/CVF_FAST_GATE_RETURN.md`",)
        )

        self.assertNotIn("preapproval", text.lower())
        issues, call_count, call_args = self._validate_with_builder_subprocess_guard(path, text)

        self.assertEqual(call_count, 1)
        self.assertEqual(call_args.args, ((), path))
        self.assertEqual(call_args.kwargs["repo_root"], self.repo_root)
        self.assertEqual(call_args.kwargs["work_order_text"], text)
        self.assertFalse(any("cannot build the worker-return fast gate" in issue for issue in issues))

    def test_dispatch_preserves_parser_errors_for_bare_missing_and_duplicate_paths(self) -> None:
        path = "docs/work_orders/CVF_FAST_GATE_RETURN_ROUTE_TEST.md"
        variants = (
            ("bare", ("workerReturnPath: docs/reviews/CVF_FAST_GATE_RETURN.md",)),
            ("missing", ()),
            (
                "duplicate",
                (
                    "workerReturnPath: `docs/reviews/CVF_FAST_GATE_RETURN.md`",
                    "workerReturnPath: `docs/reviews/OTHER_RETURN.md`",
                ),
            ),
        )
        for label, return_bindings in variants:
            with self.subTest(label=label):
                text = self._dispatch_work_order("DISPATCHED_TO_WORKER", return_bindings)
                issues, call_count, _ = self._validate_with_builder_subprocess_guard(path, text)
                build_issues = [
                    issue for issue in issues if "cannot build the worker-return fast gate" in issue
                ]
                self.assertEqual(call_count, 1)
                self.assertEqual(len(build_issues), 1)
                self.assertIn("active work order lacks an exact workerReturnPath", build_issues[0])

    def test_frozen_october16_packet_preimage_fails_closed_on_its_bare_path(self) -> None:
        source = (
            "docs/work_orders/"
            "CVF_AGENT_WORK_ORDER_NCR_HTML_B_E_RUNTIME_2026-10-16.md"
        )
        revision = "27dff0217"
        repository = Path(__file__).resolve().parents[2]
        captured = subprocess.run(
            ["git", "show", f"{revision}:{source}"],
            cwd=repository,
            check=True,
            capture_output=True,
        )
        frozen_text = captured.stdout.decode("utf-8")
        self._write(source, frozen_text)
        copied_text = (self.repo_root / source).read_text(encoding="utf-8")

        self.assertIn("requiredGate:", copied_text)
        self.assertIn("workerReturnPath: docs/reviews/", copied_text)
        issues, call_count, _ = self._validate_with_builder_subprocess_guard(source, copied_text)
        build_issues = [
            issue for issue in issues if "cannot build the worker-return fast gate" in issue
        ]
        self.assertEqual(call_count, 1)
        self.assertEqual(len(build_issues), 1)
        self.assertIn("active work order lacks an exact workerReturnPath", build_issues[0])

    def test_draft_hold_closed_non_fast_and_prose_examples_do_not_activate_builder(self) -> None:
        path = "docs/work_orders/CVF_FAST_GATE_RETURN_ROUTE_TEST.md"
        cases = (
            ("draft", self._dispatch_work_order("DRAFT")),
            ("hold", self._dispatch_work_order("HOLD")),
            ("closed", self._dispatch_work_order("CLOSED_PASS")),
            (
                "mismatched-tilde-does-not-close-backtick-fence",
                "\n".join(
                    (
                        "Status: READY_FOR_DISPATCH",
                        "## Worker Return Packet Shape Contract",
                        "```yaml",
                        "~~~",
                        "requiredGate: `python governance/compat/run_worker_return_fast_gate.py`",
                        "```",
                    )
                ),
            ),
            (
                "short-backtick-does-not-close-longer-fence",
                "\n".join(
                    (
                        "Status: READY_FOR_DISPATCH",
                        "## Worker Return Packet Shape Contract",
                        "````yaml",
                        "```",
                        "requiredGate: `python governance/compat/run_worker_return_fast_gate.py`",
                        "````",
                    )
                ),
            ),
            (
                "heading-inside-fence-does-not-select-contract-section",
                "Status: READY_FOR_DISPATCH\n"
                "## Notes\n"
                "```markdown\n"
                "## Worker Return Packet Shape Contract\n"
                "requiredGate: `python governance/compat/run_worker_return_fast_gate.py`\n"
                "```\n",
            ),
            (
                "non-fast",
                self._dispatch_work_order(
                    "READY_FOR_DISPATCH", required_gate="python governance/compat/other_gate.py"
                ),
            ),
            (
                "prose",
                "Status: READY_FOR_DISPATCH\nCommit mode: WORKER_MUST_NOT_COMMIT\n"
                "## Worker Return Packet Shape Contract\n"
                "This example has requiredGate: `python governance/compat/run_worker_return_fast_gate.py`\n"
                "```yaml\n"
                "requiredGate: `python governance/compat/run_worker_return_fast_gate.py`\n"
                "```\n"
                "## Notes\n"
                "requiredGate: `python governance/compat/run_worker_return_fast_gate.py`",
            ),
        )
        for label, text in cases:
            with self.subTest(label=label):
                issues, call_count, _ = self._validate_with_builder_subprocess_guard(path, text)
                self.assertEqual(call_count, 0)
                self.assertFalse(
                    any("cannot build the worker-return fast gate" in issue for issue in issues)
                )


if __name__ == "__main__":
    unittest.main()
