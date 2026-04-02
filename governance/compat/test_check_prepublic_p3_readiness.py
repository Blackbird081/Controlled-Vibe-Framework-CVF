#!/usr/bin/env python3
from __future__ import annotations

import importlib.util
import json
import sys
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch


MODULE_PATH = Path(__file__).resolve().with_name("check_prepublic_p3_readiness.py")
SPEC = importlib.util.spec_from_file_location("check_prepublic_p3_readiness", MODULE_PATH)
if SPEC is None or SPEC.loader is None:
    raise RuntimeError(f"Unable to load module from {MODULE_PATH}")
MODULE = importlib.util.module_from_spec(SPEC)
sys.modules[SPEC.name] = MODULE
SPEC.loader.exec_module(MODULE)


class CheckPrepublicP3ReadinessTests(unittest.TestCase):
    def setUp(self) -> None:
        self.temp_dir = tempfile.TemporaryDirectory()
        self.repo_root = Path(self.temp_dir.name)
        (self.repo_root / "governance" / "compat").mkdir(parents=True, exist_ok=True)
        (self.repo_root / "governance" / "toolkit" / "05_OPERATION").mkdir(parents=True, exist_ok=True)
        (self.repo_root / "docs" / "reference").mkdir(parents=True, exist_ok=True)
        (self.repo_root / ".github" / "workflows").mkdir(parents=True, exist_ok=True)

        (self.repo_root / "README.md").write_text("readme\n", encoding="utf-8")
        (self.repo_root / "ARCHITECTURE.md").write_text("arch\n", encoding="utf-8")
        (self.repo_root / ".git").write_text("gitdir: /tmp/worktree/.git\n", encoding="utf-8")

        (self.repo_root / "docs" / "reference" / "CVF_PREPUBLIC_P3_READINESS.md").write_text(
            "`P3` must stay blocked\nrestructuring/p3-\nsecondary git worktree\n",
            encoding="utf-8",
        )
        (self.repo_root / "docs" / "reference" / "CVF_PREPUBLIC_PUBLICATION_DECISION_MEMO_2026-04-02.md").write_text(
            "Re-assessment-By: 2026-05-01\n",
            encoding="utf-8",
        )
        (self.repo_root / "governance" / "toolkit" / "05_OPERATION" / "CVF_PREPUBLIC_P3_READINESS_GUARD.md").write_text(
            "This guard does not itself authorize `P3`.\nrestructuring/p3-\nsecondary git worktree\n",
            encoding="utf-8",
        )
        (self.repo_root / "governance" / "compat" / "run_local_governance_hook_chain.py").write_text(
            "check_prepublic_p3_readiness.py\n",
            encoding="utf-8",
        )
        (self.repo_root / ".github" / "workflows" / "documentation-testing.yml").write_text(
            "check_prepublic_p3_readiness.py\n",
            encoding="utf-8",
        )

        self.phase_gate_registry = self.repo_root / "governance" / "compat" / "CVF_PREPUBLIC_PHASE_GATE_REGISTRY.json"
        self.root_file_registry = self.repo_root / "governance" / "compat" / "CVF_ROOT_FILE_EXPOSURE_REGISTRY.json"
        self.root_registry = self.repo_root / "governance" / "compat" / "CVF_ROOT_FOLDER_LIFECYCLE_REGISTRY.json"
        self.extension_registry = self.repo_root / "governance" / "compat" / "CVF_EXTENSION_LIFECYCLE_REGISTRY.json"

        self.phase_gate_registry.write_text(
            json.dumps(
                {
                    "allowedStatuses": [{"id": "OPEN"}, {"id": "BLOCKED"}, {"id": "CLOSED"}],
                    "phases": [
                        {"phase": "P0", "status": "CLOSED", "evidence": ["docs/reference/CVF_PREPUBLIC_P3_READINESS.md"]},
                        {"phase": "P1", "status": "CLOSED", "evidence": ["docs/reference/CVF_PREPUBLIC_P3_READINESS.md"]},
                        {"phase": "P2", "status": "CLOSED", "evidence": ["docs/reference/CVF_PREPUBLIC_P3_READINESS.md"]}
                    ]
                },
                indent=2,
            ),
            encoding="utf-8",
        )
        self.root_file_registry.write_text(
            json.dumps(
                {
                    "ignoredRootFiles": [],
                    "files": [
                        {"path": "README.md", "exposureClass": "PUBLIC_DOCS_ONLY"},
                        {"path": "ARCHITECTURE.md", "exposureClass": "PUBLIC_DOCS_ONLY"}
                    ]
                },
                indent=2,
            ),
            encoding="utf-8",
        )
        self.root_registry.write_text(
            json.dumps(
                {
                    "roots": [
                        {
                            "path": "docs",
                            "lifecycleClass": "ACTIVE_CANONICAL",
                            "exposureClass": "PUBLIC_DOCS_ONLY",
                            "publicContentAuditStatus": "CURATION_REQUIRED",
                            "publicContentAuditEvidence": "docs/reference/CVF_PREPUBLIC_P3_READINESS.md"
                        }
                    ]
                },
                indent=2,
            ),
            encoding="utf-8",
        )
        self.extension_registry.write_text(
            json.dumps(
                {
                    "extensions": [
                        {
                            "path": "CVF_CONTROL_PLANE_FOUNDATION",
                            "lifecycleClass": "ACTIVE_CANONICAL",
                            "exposureClass": "PUBLIC_EXPORT_CANDIDATE",
                            "exportReadiness": "NEEDS_PACKAGING"
                        }
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
            with patch.object(MODULE, "PHASE_GATE_REGISTRY_PATH", self.phase_gate_registry):
                with patch.object(MODULE, "ROOT_FILE_REGISTRY_PATH", self.root_file_registry):
                    with patch.object(MODULE, "ROOT_REGISTRY_PATH", self.root_registry):
                        with patch.object(MODULE, "EXTENSION_REGISTRY_PATH", self.extension_registry):
                            with patch.object(MODULE, "READINESS_DOC_PATH", self.repo_root / "docs" / "reference" / "CVF_PREPUBLIC_P3_READINESS.md"):
                                with patch.object(MODULE, "DECISION_MEMO_PATH", self.repo_root / "docs" / "reference" / "CVF_PREPUBLIC_PUBLICATION_DECISION_MEMO_2026-04-02.md"):
                                    with patch.object(MODULE, "GUARD_DOC_PATH", self.repo_root / "governance" / "toolkit" / "05_OPERATION" / "CVF_PREPUBLIC_P3_READINESS_GUARD.md"):
                                        with patch.object(MODULE, "HOOK_CHAIN_PATH", self.repo_root / "governance" / "compat" / "run_local_governance_hook_chain.py"):
                                            with patch.object(MODULE, "WORKFLOW_PATH", self.repo_root / ".github" / "workflows" / "documentation-testing.yml"):
                                                with patch.object(
                                                    MODULE,
                                                    "_detect_relocation_wave",
                                                    return_value={
                                                        "detected": False,
                                                        "currentBranch": "cvf-next",
                                                        "worktreeCount": 1,
                                                        "structuralPaths": [],
                                                        "governanceMarkers": [],
                                                    },
                                                ):
                                                    return MODULE.build_report()

    def test_accepts_compliant_p3_readiness(self) -> None:
        report = self._build_report()
        self.assertTrue(report["compliant"])

    def test_flags_missing_export_readiness(self) -> None:
        current = json.loads(self.extension_registry.read_text(encoding="utf-8"))
        del current["extensions"][0]["exportReadiness"]
        self.extension_registry.write_text(json.dumps(current, indent=2), encoding="utf-8")
        report = self._build_report()
        self.assertTrue(any(v["type"] == "missing_export_readiness" for v in report["violations"]))

    def test_flags_unclassified_root_file(self) -> None:
        current = json.loads(self.root_file_registry.read_text(encoding="utf-8"))
        current["files"] = [entry for entry in current["files"] if entry["path"] != "ARCHITECTURE.md"]
        self.root_file_registry.write_text(json.dumps(current, indent=2), encoding="utf-8")
        report = self._build_report()
        self.assertTrue(any(v["type"] == "unclassified_root_file" for v in report["violations"]))

    def test_ignores_git_worktree_pointer_file(self) -> None:
        report = self._build_report()
        self.assertFalse(any(v["path"] == ".git" for v in report["violations"]))

    def test_flags_relocation_wave_on_canonical_branch(self) -> None:
        with patch.object(MODULE, "REPO_ROOT", self.repo_root):
            with patch.object(MODULE, "PHASE_GATE_REGISTRY_PATH", self.phase_gate_registry):
                with patch.object(MODULE, "ROOT_FILE_REGISTRY_PATH", self.root_file_registry):
                    with patch.object(MODULE, "ROOT_REGISTRY_PATH", self.root_registry):
                        with patch.object(MODULE, "EXTENSION_REGISTRY_PATH", self.extension_registry):
                            with patch.object(MODULE, "READINESS_DOC_PATH", self.repo_root / "docs" / "reference" / "CVF_PREPUBLIC_P3_READINESS.md"):
                                with patch.object(MODULE, "DECISION_MEMO_PATH", self.repo_root / "docs" / "reference" / "CVF_PREPUBLIC_PUBLICATION_DECISION_MEMO_2026-04-02.md"):
                                    with patch.object(MODULE, "GUARD_DOC_PATH", self.repo_root / "governance" / "toolkit" / "05_OPERATION" / "CVF_PREPUBLIC_P3_READINESS_GUARD.md"):
                                        with patch.object(MODULE, "HOOK_CHAIN_PATH", self.repo_root / "governance" / "compat" / "run_local_governance_hook_chain.py"):
                                            with patch.object(MODULE, "WORKFLOW_PATH", self.repo_root / ".github" / "workflows" / "documentation-testing.yml"):
                                                with patch.object(
                                                    MODULE,
                                                    "_detect_relocation_wave",
                                                    return_value={
                                                        "detected": True,
                                                        "currentBranch": "cvf-next",
                                                        "worktreeCount": 1,
                                                        "structuralPaths": ["EXTENSIONS/CVF_ECO_v1.4_RAG_PIPELINE/file.ts"],
                                                        "governanceMarkers": ["docs/audits/CVF_P3_TEST.md"],
                                                    },
                                                ):
                                                    report = MODULE.build_report()
        violation_types = {v["type"] for v in report["violations"]}
        self.assertIn("p3_relocation_requires_dedicated_branch", violation_types)
        self.assertIn("p3_relocation_on_canonical_branch", violation_types)
        self.assertIn("p3_relocation_requires_secondary_worktree", violation_types)


if __name__ == "__main__":
    unittest.main()
