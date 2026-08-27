from __future__ import annotations

import sys
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

sys.path.insert(0, str(Path(__file__).resolve().parent))
import run_cvf_static_ci_gate as static_gate


class PublicWorkflowOrchestrationTests(unittest.TestCase):
    def write_workflows(self, root: Path) -> None:
        for relative_path, fragments in static_gate.PUBLIC_WORKFLOW_REQUIREMENTS.items():
            path = root / relative_path
            path.parent.mkdir(parents=True, exist_ok=True)
            path.write_text("\n".join(fragments), encoding="utf-8")

    def test_accepts_complete_public_workflow_topology(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            self.write_workflows(root)
            with patch.object(static_gate, "REPO_ROOT", root):
                result = static_gate.check_public_workflow_orchestration()
        self.assertEqual(result.status, "PASS")

    def test_rejects_private_only_hook_marker(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            self.write_workflows(root)
            path = root / ".github/workflows/ci.yml"
            path.write_text(path.read_text(encoding="utf-8") + "\nrun_local_governance_hook_chain.py --hook pre-commit\n", encoding="utf-8")
            with patch.object(static_gate, "REPO_ROOT", root):
                result = static_gate.check_public_workflow_orchestration()
        self.assertEqual(result.status, "FAIL")
        self.assertTrue(any("private-only marker" in item for item in result.detail))

    def test_rejects_missing_public_runner_command(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            self.write_workflows(root)
            (root / ".github/workflows/cvf-static-ci.yml").write_text("name: stale\n", encoding="utf-8")
            with patch.object(static_gate, "REPO_ROOT", root):
                result = static_gate.check_public_workflow_orchestration()
        self.assertEqual(result.status, "FAIL")
        self.assertTrue(any("missing public command fragment" in item for item in result.detail))


if __name__ == "__main__":
    unittest.main()
