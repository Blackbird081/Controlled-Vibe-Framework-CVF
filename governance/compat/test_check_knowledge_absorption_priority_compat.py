#!/usr/bin/env python3
from __future__ import annotations

import importlib.util
import sys
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch


MODULE_PATH = Path(__file__).resolve().with_name("check_knowledge_absorption_priority_compat.py")
SPEC = importlib.util.spec_from_file_location("check_knowledge_absorption_priority_compat", MODULE_PATH)
if SPEC is None or SPEC.loader is None:
    raise RuntimeError(f"Unable to load module from {MODULE_PATH}")
MODULE = importlib.util.module_from_spec(SPEC)
sys.modules[SPEC.name] = MODULE
SPEC.loader.exec_module(MODULE)


class KnowledgeAbsorptionPriorityCompatTests(unittest.TestCase):
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
                    "doctrine-first / governance-first absorption",
                    "implementation-first expansion",
                    "Graphify / LLM-Powered / Palace",
                    MODULE.GRAPHIFY_ROADMAP_PATH,
                ]
            ),
        )
        self._write(
            MODULE.EXEC_NOTE_PATH,
            "\n".join(
                [
                    "highest-value next step",
                    "doctrine-first / governance-first uplift",
                    MODULE.STANDARD_PATH,
                ]
            ),
        )
        self._write(
            MODULE.GUARD_PATH,
            "\n".join(
                [
                    "Control ID:",
                    "GC-043",
                    MODULE.STANDARD_PATH,
                    MODULE.EXEC_NOTE_PATH,
                    MODULE.GRAPHIFY_ROADMAP_PATH,
                    MODULE.THIS_SCRIPT_PATH,
                    "owner-surface mapping",
                    "implementation-first expansion",
                ]
            ),
        )
        self._write(
            MODULE.MASTER_POLICY_PATH,
            "\n".join(
                [
                    "GC-043",
                    "future knowledge absorption",
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
                    "GC-043",
                    MODULE.GUARD_PATH,
                    MODULE.STANDARD_PATH,
                    MODULE.EXEC_NOTE_PATH,
                    MODULE.THIS_SCRIPT_PATH,
                ]
            ),
        )
        self._write(
            MODULE.BOOTSTRAP_PATH,
            "\n".join(
                [
                    "GC-043",
                    MODULE.STANDARD_PATH,
                    "repo-derived skill intake",
                    "post-closure synthesis-first uplift planning",
                ]
            ),
        )
        self._write(MODULE.DOCS_INDEX_PATH, "reference/CVF_KNOWLEDGE_ABSORPTION_AND_EXTENSION_PRIORITY_STANDARD_2026-04-13.md")
        self._write(MODULE.REFERENCE_README_PATH, Path(MODULE.STANDARD_PATH).name)
        self._write(MODULE.ROOT_README_PATH, Path(MODULE.GUARD_PATH).name)
        self._write(
            MODULE.KB_PATH,
            "\n".join(
                [
                    Path(MODULE.GUARD_PATH).name,
                    "Doctrine-first / governance-first absorption",
                ]
            ),
        )
        self._write(
            MODULE.HANDOFF_PATH,
            "\n".join(
                [
                    MODULE.STANDARD_PATH,
                    Path(MODULE.GUARD_PATH).name,
                    MODULE.THIS_SCRIPT_PATH,
                ]
            ),
        )
        self._write(MODULE.HOOK_CHAIN_PATH, MODULE.THIS_SCRIPT_PATH)
        self._write(
            MODULE.WORKFLOW_PATH,
            "\n".join(
                [
                    MODULE.THIS_SCRIPT_PATH,
                    "knowledge-absorption-priority-guard",
                    "Knowledge Absorption Priority Guard",
                ]
            ),
        )
        self._write(
            MODULE.GRAPHIFY_ROADMAP_PATH,
            "\n".join(
                [
                    MODULE.STANDARD_PATH,
                    "SYNTHESIS-ONLY",
                    "no code changes",
                    "DOCTRINE / SYNTHESIS LANE",
                    "doctrine-first / governance-first absorption",
                    "Knowledge Base_Graphify",
                ]
            ),
        )

    def test_classify_passes_when_chain_and_changed_roadmap_are_compliant(self) -> None:
        self._seed_compliant_repo()
        changed = [MODULE.GRAPHIFY_ROADMAP_PATH]
        with patch.object(MODULE, "REPO_ROOT", self.repo_root):
            report = MODULE._classify(changed)
        self.assertTrue(report["compliant"])
        self.assertEqual(report["knowledgeRoadmapViolationCount"], 0)

    def test_classify_fails_when_changed_roadmap_loses_doctrine_markers(self) -> None:
        self._seed_compliant_repo()
        self._write(
            MODULE.GRAPHIFY_ROADMAP_PATH,
            "\n".join(
                [
                    "SYNTHESIS-ONLY",
                    "no code changes",
                    "Knowledge Base_Graphify",
                ]
            ),
        )
        changed = [MODULE.GRAPHIFY_ROADMAP_PATH]
        with patch.object(MODULE, "REPO_ROOT", self.repo_root):
            report = MODULE._classify(changed)
        self.assertFalse(report["compliant"])
        self.assertIn(MODULE.GRAPHIFY_ROADMAP_PATH, report["knowledgeRoadmapViolations"])

    def test_classify_fails_when_guard_chain_is_missing_required_marker(self) -> None:
        self._seed_compliant_repo()
        self._write(MODULE.HANDOFF_PATH, MODULE.STANDARD_PATH)
        with patch.object(MODULE, "REPO_ROOT", self.repo_root):
            report = MODULE._classify([])
        self.assertFalse(report["compliant"])
        self.assertIn(MODULE.HANDOFF_PATH, report["markerViolations"])


if __name__ == "__main__":
    unittest.main()
