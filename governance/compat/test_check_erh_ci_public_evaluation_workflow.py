#!/usr/bin/env python3
from __future__ import annotations

import importlib.util
import json
import sys
import tempfile
import unittest
from pathlib import Path


MODULE_PATH = Path(__file__).resolve().with_name("check_erh_ci_public_evaluation_workflow.py")
SPEC = importlib.util.spec_from_file_location("check_erh_ci_public_evaluation_workflow", MODULE_PATH)
if SPEC is None or SPEC.loader is None:
    raise RuntimeError(f"Unable to load module from {MODULE_PATH}")
MODULE = importlib.util.module_from_spec(SPEC)
sys.modules[SPEC.name] = MODULE
SPEC.loader.exec_module(MODULE)


class ErhCiPublicEvaluationWorkflowTests(unittest.TestCase):
    def setUp(self) -> None:
        self.temp_dir = tempfile.TemporaryDirectory()
        self.repo_root = Path(self.temp_dir.name)
        self._seed_minimal_repo()

    def tearDown(self) -> None:
        self.temp_dir.cleanup()

    def _write(self, rel_path: str, text: str) -> None:
        path = self.repo_root / rel_path
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(text, encoding="utf-8")

    def _seed_minimal_repo(self) -> None:
        self._write(
            ".github/workflows/cvf-ci.yml",
            "npx tsc --noEmit\nnpm run build\nnpm run test:run\nci-passed:\n",
        )
        self._write(
            ".github/workflows/cvf-web-ci.yml",
            "npm run lint -- --max-warnings=0\nnpm run test:coverage\n",
        )
        self._write(
            ".github/workflows/cvf-static-ci.yml",
            "python scripts/run_cvf_static_ci_gate.py --json\n",
        )
        self._write(
            ".github/workflows/cvf-protected-live-release-gate.yml",
            "workflow_dispatch:\nRUN_LIVE_GATE\nrun_cvf_release_gate_bundle.py --json\n"
            "cvf-protected-live-release-gate-result.json\n",
        )
        self._write(
            ".github/workflows/documentation-testing.yml",
            "check_markdown_structural_completeness.py\n"
            "check_work_order_dispatch_quality.py\nmarkdown-lint\n",
        )
        self._write(
            MODULE.WEB_PACKAGE_PATH,
            json.dumps(
                {
                    "scripts": {
                        "lint": "eslint",
                        "check": "tsc --noEmit",
                        "build": "next build --webpack",
                        "test:run": "vitest run",
                        "test:coverage": "vitest run --coverage",
                    }
                }
            ),
        )
        self._write(MODULE.T2A_LEDGER_PATH, "ledger\n")
        self._write(MODULE.T2C_WORKFLOW_PATH, "workflow\n")
        self._write(
            MODULE.SYSTEM_LOOP_REGISTRY_PATH,
            "erh-route-ledger-to-route-governance-proof-workflow\n"
            "ERH_T2C_ROUTE_GOVERNANCE_PROOF_WORKFLOW\n",
        )
        self._write(
            MODULE.T2B_PLAN_PATH,
            "Public docs must not say CI is production-grade\n"
            "coverage-threshold hardened\n"
            "dependency-audit hardened\n"
            "public-doc drift\n",
        )

    def test_ready_with_boundaries_when_all_markers_exist(self) -> None:
        report = MODULE.evaluate(self.repo_root)
        self.assertEqual(report["verdict"], "READY_WITH_BOUNDARIES")
        self.assertTrue(all(stage["status"] == "PASS" for stage in report["stages"]))
        self.assertFalse(report["optionalGapsNotClaimed"]["dependencyAuditHardened"])

    def test_missing_web_coverage_blocks_chain(self) -> None:
        self._write(".github/workflows/cvf-web-ci.yml", "npm run lint -- --max-warnings=0\n")
        report = MODULE.evaluate(self.repo_root)
        self.assertEqual(report["verdict"], "BLOCKED")
        web_stage = next(stage for stage in report["stages"] if stage["stage"] == "web_lint_and_coverage")
        self.assertIn("npm run test:coverage", web_stage["missing"])

    def test_missing_claim_boundary_blocks_chain(self) -> None:
        self._write(MODULE.T2B_PLAN_PATH, "Public docs may claim anything.\n")
        report = MODULE.evaluate(self.repo_root)
        self.assertEqual(report["verdict"], "BLOCKED")
        boundary_stage = next(stage for stage in report["stages"] if stage["stage"] == "public_claim_boundary")
        self.assertIn("Public docs must not say CI is production-grade", boundary_stage["missing"])


if __name__ == "__main__":
    unittest.main()
