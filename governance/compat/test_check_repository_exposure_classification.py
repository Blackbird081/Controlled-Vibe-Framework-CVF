#!/usr/bin/env python3
from __future__ import annotations

import importlib.util
import json
import sys
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch


MODULE_PATH = Path(__file__).resolve().with_name("check_repository_exposure_classification.py")
SPEC = importlib.util.spec_from_file_location("check_repository_exposure_classification", MODULE_PATH)
if SPEC is None or SPEC.loader is None:
    raise RuntimeError(f"Unable to load module from {MODULE_PATH}")
MODULE = importlib.util.module_from_spec(SPEC)
sys.modules[SPEC.name] = MODULE
SPEC.loader.exec_module(MODULE)


class CheckRepositoryExposureClassificationTests(unittest.TestCase):
    def setUp(self) -> None:
        self.temp_dir = tempfile.TemporaryDirectory()
        self.repo_root = Path(self.temp_dir.name)
        (self.repo_root / "governance" / "compat").mkdir(parents=True, exist_ok=True)
        (self.repo_root / "governance" / "toolkit" / "05_OPERATION").mkdir(parents=True, exist_ok=True)
        (self.repo_root / "docs" / "reference").mkdir(parents=True, exist_ok=True)
        (self.repo_root / ".github" / "workflows").mkdir(parents=True, exist_ok=True)

        (self.repo_root / "docs" / "reference" / "CVF_REPOSITORY_EXPOSURE_CLASSIFICATION.md").write_text(
            "private-by-default, selective-publication-only\nrepository contents can be cloned as a whole\n",
            encoding="utf-8",
        )
        (self.repo_root / "governance" / "toolkit" / "05_OPERATION" / "CVF_REPOSITORY_EXPOSURE_CLASSIFICATION_GUARD.md").write_text(
            "This guard does not itself authorize publication.\n",
            encoding="utf-8",
        )
        (self.repo_root / "governance" / "compat" / "run_local_governance_hook_chain.py").write_text("check_repository_exposure_classification.py\n", encoding="utf-8")
        (self.repo_root / ".github" / "workflows" / "documentation-testing.yml").write_text("check_repository_exposure_classification.py\n", encoding="utf-8")

        self.root_registry = self.repo_root / "governance" / "compat" / "CVF_ROOT_FOLDER_LIFECYCLE_REGISTRY.json"
        self.extension_registry = self.repo_root / "governance" / "compat" / "CVF_EXTENSION_LIFECYCLE_REGISTRY.json"
        self.root_registry.write_text(
            json.dumps(
                {
                    "exposureClasses": [{"id": "PUBLIC_DOCS_ONLY"}, {"id": "PUBLIC_EXPORT_CANDIDATE"}, {"id": "INTERNAL_ONLY"}, {"id": "PRIVATE_ENTERPRISE_ONLY"}],
                    "roots": [
                        {"path": "docs", "lifecycleClass": "ACTIVE_CANONICAL", "exposureClass": "PUBLIC_DOCS_ONLY"},
                        {"path": "EXTENSIONS", "lifecycleClass": "ACTIVE_CANONICAL", "exposureClass": "INTERNAL_ONLY"}
                    ]
                },
                indent=2,
            ),
            encoding="utf-8",
        )
        self.extension_registry.write_text(
            json.dumps(
                {
                    "exposureClasses": [{"id": "PUBLIC_DOCS_ONLY"}, {"id": "PUBLIC_EXPORT_CANDIDATE"}, {"id": "INTERNAL_ONLY"}, {"id": "PRIVATE_ENTERPRISE_ONLY"}],
                    "extensions": [
                        {"path": "CVF_CONTROL_PLANE_FOUNDATION", "lifecycleClass": "ACTIVE_CANONICAL", "exposureClass": "PUBLIC_EXPORT_CANDIDATE"},
                        {"path": "CVF_ECO_v1.4_RAG_PIPELINE", "lifecycleClass": "MERGED_RETAINED", "exposureClass": "INTERNAL_ONLY"}
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
                    with patch.object(MODULE, "CLASSIFICATION_DOC_PATH", self.repo_root / "docs" / "reference" / "CVF_REPOSITORY_EXPOSURE_CLASSIFICATION.md"):
                        with patch.object(MODULE, "GUARD_DOC_PATH", self.repo_root / "governance" / "toolkit" / "05_OPERATION" / "CVF_REPOSITORY_EXPOSURE_CLASSIFICATION_GUARD.md"):
                            with patch.object(MODULE, "HOOK_CHAIN_PATH", self.repo_root / "governance" / "compat" / "run_local_governance_hook_chain.py"):
                                with patch.object(MODULE, "WORKFLOW_PATH", self.repo_root / ".github" / "workflows" / "documentation-testing.yml"):
                                    return MODULE.build_report()

    def test_accepts_compliant_exposure_classification(self) -> None:
        report = self._build_report()
        self.assertTrue(report["compliant"])

    def test_flags_missing_exposure_field(self) -> None:
        current = json.loads(self.extension_registry.read_text(encoding="utf-8"))
        del current["extensions"][0]["exposureClass"]
        self.extension_registry.write_text(json.dumps(current, indent=2), encoding="utf-8")
        report = self._build_report()
        self.assertTrue(any(v["type"] == "missing_extension_exposure_field" for v in report["violations"]))

    def test_flags_invalid_public_export_lifecycle_pair(self) -> None:
        current = json.loads(self.extension_registry.read_text(encoding="utf-8"))
        current["extensions"][0]["lifecycleClass"] = "FROZEN_REFERENCE"
        self.extension_registry.write_text(json.dumps(current, indent=2), encoding="utf-8")
        report = self._build_report()
        self.assertTrue(any(v["type"] == "invalid_extension_public_export_lifecycle_pair" for v in report["violations"]))


if __name__ == "__main__":
    unittest.main()
