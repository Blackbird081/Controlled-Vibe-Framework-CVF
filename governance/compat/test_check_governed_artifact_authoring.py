#!/usr/bin/env python3
from __future__ import annotations

import importlib.util
import sys
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch


MODULE_PATH = Path(__file__).resolve().with_name("check_governed_artifact_authoring.py")
SPEC = importlib.util.spec_from_file_location("check_governed_artifact_authoring", MODULE_PATH)
if SPEC is None or SPEC.loader is None:
    raise RuntimeError(f"Unable to load module from {MODULE_PATH}")
MODULE = importlib.util.module_from_spec(SPEC)
sys.modules[SPEC.name] = MODULE
SPEC.loader.exec_module(MODULE)


class GovernedArtifactAuthoringTests(unittest.TestCase):
    def setUp(self) -> None:
        self.temp_dir = tempfile.TemporaryDirectory()
        self.repo_root = Path(self.temp_dir.name)

    def tearDown(self) -> None:
        self.temp_dir.cleanup()

    def _write(self, rel_path: str, text: str) -> None:
        path = self.repo_root / rel_path
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(text, encoding="utf-8")

    def _seed_compliant_repo(self) -> None:
        self._write(
            MODULE.STANDARD_PATH,
            "\n".join(
                [
                    "Source-Truth First",
                    "No Summary Substitution for Typed Evidence",
                    "Planning / Execution / Evidence / Continuity Separation",
                    "Continuity Surfaces Move Together",
                    "Stop When Source Truth Is Missing",
                    "Layered Machine Enforcement",
                    "docs/reviews/CVF_MULTI_AGENT_DECISION_PACK_POST_W7_OPEN_TARGETS_2026-03-28.md",
                    "docs/roadmaps/CVF_POST_W7_OPEN_TARGETS_UPGRADE_ROADMAP_2026-03-28.md",
                    MODULE.GUARD_PATH,
                    MODULE.DOCS_GOV_COMPAT_PATH,
                ]
            ),
        )
        self._write(
            MODULE.GUARD_PATH,
            "\n".join(
                [
                    "Control ID:",
                    "GC-032",
                    MODULE.STANDARD_PATH,
                    MODULE.THIS_SCRIPT_PATH,
                    "source-truth",
                    "typed evidence",
                    "continuity surfaces",
                ]
            ),
        )
        self._write(
            MODULE.MASTER_POLICY_PATH,
            "\n".join(
                [
                    "GC-032",
                    "governed artifact authoring is mandatory",
                    MODULE.STANDARD_PATH,
                    MODULE.GUARD_PATH,
                    MODULE.THIS_SCRIPT_PATH,
                ]
            ),
        )
        self._write(
            MODULE.CONTROL_MATRIX_PATH,
            "\n".join(
                [
                    "GC-032",
                    MODULE.STANDARD_PATH,
                    MODULE.GUARD_PATH,
                    MODULE.THIS_SCRIPT_PATH,
                    MODULE.DOCS_GOV_COMPAT_PATH,
                ]
            ),
        )
        self._write(
            MODULE.BOOTSTRAP_REFERENCE_PATH,
            "\n".join(
                [
                    "GC-032",
                    MODULE.STANDARD_PATH,
                    "drafting or materially revising governed artifacts",
                ]
            ),
        )
        self._write(
            MODULE.BOOTSTRAP_GUARD_PATH,
            "\n".join(
                [
                    "GC-032",
                    MODULE.STANDARD_PATH,
                    "governed artifact authoring",
                ]
            ),
        )
        self._write(MODULE.DOCS_INDEX_PATH, "reference/CVF_GOVERNED_ARTIFACT_AUTHORING_STANDARD.md")
        self._write(MODULE.README_PATH, Path(MODULE.GUARD_PATH).name)
        self._write(MODULE.KB_PATH, Path(MODULE.GUARD_PATH).name)
        self._write(
            MODULE.POST_W7_CHECKLIST_PATH,
            "\n".join(
                [
                    "GC-032",
                    MODULE.STANDARD_PATH,
                    "typed evidence",
                ]
            ),
        )
        self._write(MODULE.HOOK_CHAIN_PATH, MODULE.THIS_SCRIPT_PATH)
        self._write(
            MODULE.WORKFLOW_PATH,
            "\n".join(
                [
                    MODULE.THIS_SCRIPT_PATH,
                    "governed-artifact-authoring",
                    "Governed Artifact Authoring",
                ]
            ),
        )
        self._write(
            MODULE.DOCS_GOV_COMPAT_PATH,
            "\n".join(
                [
                    "performance_evidence_provenance",
                    "performance_evidence_symbolic_value",
                    "Report Hash",
                    "Trace ID",
                ]
            ),
        )

    def test_classify_passes_when_chain_is_complete(self) -> None:
        self._seed_compliant_repo()
        with patch.object(MODULE, "REPO_ROOT", self.repo_root):
            report = MODULE._classify([])
        self.assertTrue(report["compliant"])
        self.assertEqual(report["missingFileCount"], 0)
        self.assertEqual(report["markerViolationCount"], 0)

    def test_classify_fails_when_standard_loses_required_marker(self) -> None:
        self._seed_compliant_repo()
        self._write(MODULE.STANDARD_PATH, "Source-Truth First\n")
        with patch.object(MODULE, "REPO_ROOT", self.repo_root):
            report = MODULE._classify([])
        self.assertFalse(report["compliant"])
        self.assertIn(MODULE.STANDARD_PATH, report["markerViolations"])


if __name__ == "__main__":
    unittest.main()
