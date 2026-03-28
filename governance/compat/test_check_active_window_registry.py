#!/usr/bin/env python3
from __future__ import annotations

import importlib.util
import json
import sys
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch


MODULE_PATH = Path(__file__).resolve().with_name("check_active_window_registry.py")
SPEC = importlib.util.spec_from_file_location("check_active_window_registry", MODULE_PATH)
if SPEC is None or SPEC.loader is None:
    raise RuntimeError(f"Unable to load module from {MODULE_PATH}")
MODULE = importlib.util.module_from_spec(SPEC)
sys.modules[SPEC.name] = MODULE
SPEC.loader.exec_module(MODULE)


class CheckActiveWindowRegistryTests(unittest.TestCase):
    def setUp(self) -> None:
        self.temp_dir = tempfile.TemporaryDirectory()
        self.repo_root = Path(self.temp_dir.name)
        (self.repo_root / "governance" / "compat").mkdir(parents=True, exist_ok=True)
        (self.repo_root / "governance" / "toolkit" / "05_OPERATION").mkdir(parents=True, exist_ok=True)
        (self.repo_root / "docs" / "reference").mkdir(parents=True, exist_ok=True)
        (self.repo_root / ".github" / "workflows").mkdir(parents=True, exist_ok=True)
        (self.repo_root / "scripts").mkdir(parents=True, exist_ok=True)
        (self.repo_root / "docs" / "logs").mkdir(parents=True, exist_ok=True)
        (self.repo_root / "docs" / "reviews" / "cvf_phase_governance" / "logs").mkdir(parents=True, exist_ok=True)

        (self.repo_root / "docs" / "CVF_INCREMENTAL_TEST_LOG.md").write_text("log\n", encoding="utf-8")
        (self.repo_root / "docs" / "reviews" / "cvf_phase_governance" / "CVF_CONFORMANCE_TRACE_2026-03-07.md").write_text("trace\n", encoding="utf-8")
        (self.repo_root / "governance" / "compat" / "check_incremental_test_log_rotation.py").write_text("print('ok')\n", encoding="utf-8")
        (self.repo_root / "governance" / "compat" / "check_conformance_trace_rotation.py").write_text("print('ok')\n", encoding="utf-8")
        (self.repo_root / "scripts" / "rotate_cvf_incremental_test_log.py").write_text("print('ok')\n", encoding="utf-8")
        (self.repo_root / "scripts" / "rotate_cvf_conformance_trace.py").write_text("print('ok')\n", encoding="utf-8")
        (self.repo_root / "governance" / "toolkit" / "05_OPERATION" / "CVF_INCREMENTAL_TEST_LOG_ROTATION_GUARD.md").write_text(
            "**Applies to:** `docs/CVF_INCREMENTAL_TEST_LOG.md` and `docs/logs/CVF_INCREMENTAL_TEST_LOG_ARCHIVE_*.md`\n\n"
            "canonical entrypoint\nactive working window\n",
            encoding="utf-8",
        )
        (self.repo_root / "governance" / "toolkit" / "05_OPERATION" / "CVF_CONFORMANCE_TRACE_ROTATION_GUARD.md").write_text(
            "**Applies to:** `docs/reviews/cvf_phase_governance/CVF_CONFORMANCE_TRACE_2026-03-07.md` and `docs/reviews/cvf_phase_governance/logs/CVF_CONFORMANCE_TRACE_ARCHIVE_*.md`\n\n"
            "canonical entrypoint\ncurrent working window\n",
            encoding="utf-8",
        )

        for path in (
            self.repo_root / "governance" / "toolkit" / "05_OPERATION" / "CVF_ACTIVE_WINDOW_REGISTRY_GUARD.md",
            self.repo_root / "governance" / "toolkit" / "05_OPERATION" / "CVF_ACTIVE_ARCHIVE_GUARD.md",
            self.repo_root / "governance" / "compat" / "run_local_governance_hook_chain.py",
            self.repo_root / ".github" / "workflows" / "documentation-testing.yml",
            self.repo_root / "docs" / "reference" / "CVF_ACTIVE_WINDOW_CLASSIFICATION.md",
        ):
            path.write_text("governance/compat/CVF_ACTIVE_WINDOW_REGISTRY.json\ncheck_active_window_registry.py\n", encoding="utf-8")

        self.registry_path = self.repo_root / "governance" / "compat" / "CVF_ACTIVE_WINDOW_REGISTRY.json"
        self.registry_path.write_text(
            json.dumps(
                {
                    "classes": [
                        {"id": "GLOBAL_APPEND_ONLY_LOG_WINDOW", "description": "global"},
                        {"id": "SCOPED_APPEND_ONLY_TRACE_WINDOW", "description": "scoped"}
                    ],
                    "windows": [
                        {
                            "id": "incremental_test_log_active_window",
                            "windowClass": "GLOBAL_APPEND_ONLY_LOG_WINDOW",
                            "activePath": "docs/CVF_INCREMENTAL_TEST_LOG.md",
                            "archiveDir": "docs/logs",
                            "archivePattern": "^CVF_INCREMENTAL_TEST_LOG_ARCHIVE_\\d{4}_PART_\\d{2}\\.md$",
                            "rotationGuard": "governance/toolkit/05_OPERATION/CVF_INCREMENTAL_TEST_LOG_ROTATION_GUARD.md",
                            "rotationCheck": "governance/compat/check_incremental_test_log_rotation.py",
                            "rotationScript": "scripts/rotate_cvf_incremental_test_log.py",
                            "protectionMode": "PERMANENT_ACTIVE_WINDOW",
                            "status": "ACTIVE"
                        },
                        {
                            "id": "phase_governance_conformance_trace_active_window",
                            "windowClass": "SCOPED_APPEND_ONLY_TRACE_WINDOW",
                            "activePath": "docs/reviews/cvf_phase_governance/CVF_CONFORMANCE_TRACE_2026-03-07.md",
                            "archiveDir": "docs/reviews/cvf_phase_governance/logs",
                            "archivePattern": "^CVF_CONFORMANCE_TRACE_ARCHIVE_\\d{4}_PART_\\d{2}\\.md$",
                            "rotationGuard": "governance/toolkit/05_OPERATION/CVF_CONFORMANCE_TRACE_ROTATION_GUARD.md",
                            "rotationCheck": "governance/compat/check_conformance_trace_rotation.py",
                            "rotationScript": "scripts/rotate_cvf_conformance_trace.py",
                            "protectionMode": "PERMANENT_ACTIVE_WINDOW",
                            "status": "ACTIVE"
                        }
                    ]
                },
                indent=2,
            ),
            encoding="utf-8",
        )

    def tearDown(self) -> None:
        self.temp_dir.cleanup()

    def _build_report(self, baseline=None):
        with patch.object(MODULE, "REPO_ROOT", self.repo_root):
            with patch.object(MODULE, "REGISTRY_PATH", self.registry_path):
                with patch.object(MODULE, "GUARD_DOC_PATH", self.repo_root / "governance" / "toolkit" / "05_OPERATION" / "CVF_ACTIVE_WINDOW_REGISTRY_GUARD.md"):
                    with patch.object(MODULE, "ACTIVE_ARCHIVE_GUARD_PATH", self.repo_root / "governance" / "toolkit" / "05_OPERATION" / "CVF_ACTIVE_ARCHIVE_GUARD.md"):
                        with patch.object(MODULE, "HOOK_CHAIN_PATH", self.repo_root / "governance" / "compat" / "run_local_governance_hook_chain.py"):
                            with patch.object(MODULE, "WORKFLOW_PATH", self.repo_root / ".github" / "workflows" / "documentation-testing.yml"):
                                with patch.object(MODULE, "WINDOW_CLASSIFICATION_PATH", self.repo_root / "docs" / "reference" / "CVF_ACTIVE_WINDOW_CLASSIFICATION.md"):
                                    with patch.object(MODULE, "ROTATION_GUARD_DIR", self.repo_root / "governance" / "toolkit" / "05_OPERATION"):
                                        with patch.object(MODULE, "load_json_policy_baseline", return_value=(baseline, "HEAD" if baseline else None)):
                                            return MODULE.build_report()

    def test_accepts_compliant_registry(self) -> None:
        report = self._build_report()
        self.assertTrue(report["compliant"])

    def test_blocks_unregistered_rotation_guard(self) -> None:
        self.registry_path.write_text(json.dumps({"classes": [], "windows": []}, indent=2), encoding="utf-8")
        report = self._build_report()
        self.assertTrue(any(v["type"] == "rotation_guard_not_registered" for v in report["violations"]))

    def test_blocks_baseline_mutation(self) -> None:
        current = json.loads(self.registry_path.read_text(encoding="utf-8"))
        baseline = json.loads(self.registry_path.read_text(encoding="utf-8"))
        current["windows"][0]["archiveDir"] = "docs/other"
        self.registry_path.write_text(json.dumps(current, indent=2), encoding="utf-8")
        report = self._build_report(baseline=baseline)
        self.assertTrue(any(v["type"] == "window_mutated_from_baseline" for v in report["violations"]))


if __name__ == "__main__":
    unittest.main()
