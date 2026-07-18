from __future__ import annotations

import importlib.util
import sys
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


if __name__ == "__main__":
    unittest.main()
