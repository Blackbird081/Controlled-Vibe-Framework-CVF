#!/usr/bin/env python3
from __future__ import annotations

import importlib.util
import sys
import tempfile
import unittest
from pathlib import Path


MODULE_PATH = Path(__file__).resolve().with_name("check_erh_public_surface_drift_workflow.py")
SPEC = importlib.util.spec_from_file_location("check_erh_public_surface_drift_workflow", MODULE_PATH)
if SPEC is None or SPEC.loader is None:
    raise RuntimeError(f"Unable to load module from {MODULE_PATH}")
MODULE = importlib.util.module_from_spec(SPEC)
sys.modules[SPEC.name] = MODULE
SPEC.loader.exec_module(MODULE)


class ErhPublicSurfaceDriftWorkflowTests(unittest.TestCase):
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
        for evidence_path in MODULE.PRIVATE_EVIDENCE_PATHS.values():
            self._write(evidence_path, "completion evidence\n")
        self._write(
            MODULE.CHAIN_REFERENCE_PATH,
            "\n".join(
                [
                    MODULE.CHAIN_VERSION,
                    "PUBLIC_SUMMARY_EXPORTED_BOUNDED",
                    "DRIFT_BOUNDED_WITH_UPDATE_CANDIDATES",
                    "PUBLIC_SUMMARY_UPDATE_CANDIDATE",
                    "private evidence -> public artifact -> status",
                ]
            ),
        )
        self._write(
            MODULE.LEDGER_PATH,
            "\n".join(
                [
                    "# Public Surface Drift Ledger",
                    "Public sync remote:",
                    MODULE.PUBLIC_REMOTE,
                    "Public commit:",
                    MODULE.PUBLIC_COMMIT,
                    "Private Evidence To Public Surface Drift Matrix",
                    "Next public-sync action queue",
                    "does not prove live governance behavior",
                    *MODULE.PRIVATE_EVIDENCE_PATHS.keys(),
                    *MODULE.PRIVATE_EVIDENCE_PATHS.values(),
                    *MODULE.PUBLIC_ARTIFACT_PATHS,
                    *MODULE.ALLOWED_DRIFT_STATUSES,
                ]
            ),
        )
        self._write(
            MODULE.SYSTEM_LOOP_REGISTRY_PATH,
            "erh-public-surface-drift-workflow-chain\n"
            "ERH_PUBLIC_SURFACE_DRIFT_WORKFLOW\n"
            "check_erh_public_surface_drift_workflow.py\n",
        )
        self._write(MODULE.ROADMAP_PATH, "ERH-PD1\nPUBLIC_SURFACE_DRIFT_WORKFLOW\n")

    def test_public_summary_exported_when_all_markers_exist(self) -> None:
        report = MODULE.evaluate(self.repo_root)
        self.assertEqual(report["verdict"], "PUBLIC_SUMMARY_EXPORTED_BOUNDED")
        self.assertTrue(all(stage["status"] == "PASS" for stage in report["stages"]))
        self.assertEqual(report["updateCandidates"], ["ERH-DEP"])

    def test_missing_private_evidence_blocks_chain(self) -> None:
        missing_path = self.repo_root / MODULE.PRIVATE_EVIDENCE_PATHS["ERH-CI1"]
        missing_path.unlink()
        report = MODULE.evaluate(self.repo_root)
        self.assertEqual(report["verdict"], "BLOCKED")
        private_stage = next(stage for stage in report["stages"] if stage["stage"] == "private_erh_evidence_available")
        self.assertIn(MODULE.PRIVATE_EVIDENCE_PATHS["ERH-CI1"], private_stage["missing"])

    def test_missing_public_artifact_snapshot_blocks_chain(self) -> None:
        self._write(MODULE.LEDGER_PATH, "Public Surface Drift Ledger\n")
        report = MODULE.evaluate(self.repo_root)
        self.assertEqual(report["verdict"], "BLOCKED")
        snapshot_stage = next(stage for stage in report["stages"] if stage["stage"] == "public_sync_snapshot_recorded")
        self.assertIn(MODULE.PUBLIC_REMOTE, snapshot_stage["missing"])


if __name__ == "__main__":
    unittest.main()
