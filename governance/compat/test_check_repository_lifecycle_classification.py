#!/usr/bin/env python3
from __future__ import annotations

import importlib.util
import json
import sys
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch


MODULE_PATH = Path(__file__).resolve().with_name("check_repository_lifecycle_classification.py")
SPEC = importlib.util.spec_from_file_location("check_repository_lifecycle_classification", MODULE_PATH)
if SPEC is None or SPEC.loader is None:
    raise RuntimeError(f"Unable to load module from {MODULE_PATH}")
MODULE = importlib.util.module_from_spec(SPEC)
sys.modules[SPEC.name] = MODULE
SPEC.loader.exec_module(MODULE)


class CheckRepositoryLifecycleClassificationTests(unittest.TestCase):
    def setUp(self) -> None:
        self.temp_dir = tempfile.TemporaryDirectory()
        self.repo_root = Path(self.temp_dir.name)
        (self.repo_root / "governance" / "compat").mkdir(parents=True, exist_ok=True)
        (self.repo_root / "governance" / "toolkit" / "05_OPERATION").mkdir(parents=True, exist_ok=True)
        (self.repo_root / "docs" / "reference").mkdir(parents=True, exist_ok=True)
        (self.repo_root / ".github" / "workflows").mkdir(parents=True, exist_ok=True)
        (self.repo_root / "EXTENSIONS").mkdir(parents=True, exist_ok=True)
        (self.repo_root / "docs").mkdir(exist_ok=True)
        (self.repo_root / "governance").mkdir(exist_ok=True)
        (self.repo_root / "scripts").mkdir(exist_ok=True)

        (self.repo_root / "EXTENSIONS" / "CVF_CONTROL_PLANE_FOUNDATION").mkdir(exist_ok=True)
        (self.repo_root / "EXTENSIONS" / "CVF_ECO_v1.4_RAG_PIPELINE").mkdir(exist_ok=True)

        (self.repo_root / "docs" / "reference" / "CVF_REPOSITORY_LIFECYCLE_CLASSIFICATION.md").write_text("classification\n", encoding="utf-8")
        (self.repo_root / "governance" / "toolkit" / "05_OPERATION" / "CVF_REPOSITORY_LIFECYCLE_CLASSIFICATION_GUARD.md").write_text("guard\n", encoding="utf-8")
        (self.repo_root / "governance" / "compat" / "run_local_governance_hook_chain.py").write_text("check_repository_lifecycle_classification.py\n", encoding="utf-8")
        (self.repo_root / ".github" / "workflows" / "documentation-testing.yml").write_text("check_repository_lifecycle_classification.py\n", encoding="utf-8")

        self.root_registry = self.repo_root / "governance" / "compat" / "CVF_ROOT_FOLDER_LIFECYCLE_REGISTRY.json"
        self.extension_registry = self.repo_root / "governance" / "compat" / "CVF_EXTENSION_LIFECYCLE_REGISTRY.json"
        self.root_registry.write_text(
            json.dumps(
                {
                    "classes": [{"id": "ACTIVE_CANONICAL"}, {"id": "MERGED_RETAINED"}, {"id": "FROZEN_REFERENCE"}, {"id": "RETIRE_CANDIDATE"}],
                    "ignoredRoots": [],
                    "roots": [
                        {"path": "docs", "lifecycleClass": "ACTIVE_CANONICAL"},
                        {"path": "governance", "lifecycleClass": "ACTIVE_CANONICAL"},
                        {"path": "EXTENSIONS", "lifecycleClass": "ACTIVE_CANONICAL"},
                        {"path": ".github", "lifecycleClass": "ACTIVE_CANONICAL"},
                        {"path": "scripts", "lifecycleClass": "ACTIVE_CANONICAL"}
                    ]
                },
                indent=2,
            ),
            encoding="utf-8",
        )
        self.extension_registry.write_text(
            json.dumps(
                {
                    "classes": [{"id": "ACTIVE_CANONICAL"}, {"id": "MERGED_RETAINED"}, {"id": "FROZEN_REFERENCE"}, {"id": "RETIRE_CANDIDATE"}],
                    "extensions": [
                        {"path": "CVF_CONTROL_PLANE_FOUNDATION", "lifecycleClass": "ACTIVE_CANONICAL"},
                        {"path": "CVF_ECO_v1.4_RAG_PIPELINE", "lifecycleClass": "MERGED_RETAINED"}
                    ]
                },
                indent=2,
            ),
            encoding="utf-8",
        )

    def tearDown(self) -> None:
        self.temp_dir.cleanup()

    def _build_report(self):
        with patch.object(MODULE, "REPO_ROOT", self.repo_root):
            with patch.object(MODULE, "ROOT_REGISTRY_PATH", self.root_registry):
                with patch.object(MODULE, "EXTENSION_REGISTRY_PATH", self.extension_registry):
                    with patch.object(MODULE, "CLASSIFICATION_DOC_PATH", self.repo_root / "docs" / "reference" / "CVF_REPOSITORY_LIFECYCLE_CLASSIFICATION.md"):
                        with patch.object(MODULE, "GUARD_DOC_PATH", self.repo_root / "governance" / "toolkit" / "05_OPERATION" / "CVF_REPOSITORY_LIFECYCLE_CLASSIFICATION_GUARD.md"):
                            with patch.object(MODULE, "HOOK_CHAIN_PATH", self.repo_root / "governance" / "compat" / "run_local_governance_hook_chain.py"):
                                with patch.object(MODULE, "WORKFLOW_PATH", self.repo_root / ".github" / "workflows" / "documentation-testing.yml"):
                                    return MODULE.build_report()

    def test_accepts_compliant_classification(self) -> None:
        report = self._build_report()
        self.assertTrue(report["compliant"])

    def test_flags_unclassified_root(self) -> None:
        current = json.loads(self.root_registry.read_text(encoding="utf-8"))
        current["roots"] = [entry for entry in current["roots"] if entry["path"] != "scripts"]
        self.root_registry.write_text(json.dumps(current, indent=2), encoding="utf-8")
        report = self._build_report()
        self.assertTrue(any(v["type"] == "unclassified_root" for v in report["violations"]))


if __name__ == "__main__":
    unittest.main()
