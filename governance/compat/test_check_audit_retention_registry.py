#!/usr/bin/env python3
from __future__ import annotations

import importlib.util
import json
import sys
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch


MODULE_PATH = Path(__file__).resolve().with_name("check_audit_retention_registry.py")
SPEC = importlib.util.spec_from_file_location("check_audit_retention_registry", MODULE_PATH)
if SPEC is None or SPEC.loader is None:
    raise RuntimeError(f"Unable to load module from {MODULE_PATH}")
MODULE = importlib.util.module_from_spec(SPEC)
sys.modules[SPEC.name] = MODULE
SPEC.loader.exec_module(MODULE)


class AuditRetentionRegistryTests(unittest.TestCase):
    def setUp(self) -> None:
        self.temp_dir = tempfile.TemporaryDirectory()
        self.repo_root = Path(self.temp_dir.name)

        (self.repo_root / "docs" / "audits").mkdir(parents=True, exist_ok=True)
        (self.repo_root / "docs" / "reference").mkdir(parents=True, exist_ok=True)
        (self.repo_root / "docs" / "reviews" / "cvf_phase_governance").mkdir(parents=True, exist_ok=True)
        (self.repo_root / "docs" / "logs").mkdir(parents=True, exist_ok=True)
        (self.repo_root / "governance" / "compat").mkdir(parents=True, exist_ok=True)

        (self.repo_root / "AGENT_HANDOFF.md").write_text("# handoff\n", encoding="utf-8")
        (self.repo_root / "docs" / "reference" / "CVF_MASTER_ARCHITECTURE_WHITEPAPER.md").write_text(
            "anchor\n",
            encoding="utf-8",
        )
        (self.repo_root / "docs" / "reference" / "CVF_WHITEPAPER_PROGRESS_TRACKER.md").write_text(
            "anchor\n",
            encoding="utf-8",
        )
        (self.repo_root / "docs" / "CVF_INCREMENTAL_TEST_LOG.md").write_text("active log\n", encoding="utf-8")
        (
            self.repo_root / "docs" / "reviews" / "cvf_phase_governance" / "CVF_CONFORMANCE_TRACE_2026-03-07.md"
        ).write_text("active trace\n", encoding="utf-8")

        self.retain_path = "docs/audits/CVF_W1_T1_CP1_FOUNDATION_AUDIT_2026-03-21.md"
        self.safe_path = "docs/audits/CVF_W2_T9_CP1_OLD_AUDIT_2026-03-21.md"
        (self.repo_root / self.retain_path).write_text(
            "foundation audit referenced by tracker\n",
            encoding="utf-8",
        )
        (self.repo_root / self.safe_path).write_text(
            "independent old audit\n",
            encoding="utf-8",
        )

        (
            self.repo_root / "docs" / "reference" / "CVF_RELEASE_MANIFEST.md"
        ).write_text(f"See {self.retain_path}\n", encoding="utf-8")

        (self.repo_root / "governance" / "compat" / "CVF_ACTIVE_WINDOW_REGISTRY.json").write_text(
            json.dumps(
                {
                    "classes": [
                        {"id": "GLOBAL_APPEND_ONLY_LOG_WINDOW", "description": "global"},
                        {"id": "SCOPED_APPEND_ONLY_TRACE_WINDOW", "description": "scoped"},
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
                            "status": "ACTIVE",
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
                            "status": "ACTIVE",
                        },
                    ],
                },
                indent=2,
            ),
            encoding="utf-8",
        )

    def tearDown(self) -> None:
        self.temp_dir.cleanup()

    def _write_registry(self, retain_paths: list[str]) -> None:
        (self.repo_root / "governance" / "compat" / "CVF_AUDIT_RETENTION_REGISTRY.json").write_text(
            json.dumps(
                {
                    "version": 1,
                    "lastReviewed": "2026-03-28",
                    "classes": [
                        {"id": "ACTIVE_RECENT_AUDIT", "description": "recent"},
                        {"id": "RETAIN_EVIDENCE_AUDIT", "description": "evidence"},
                        {"id": "SAFE_TO_ARCHIVE_AUDIT", "description": "safe"},
                    ],
                    "summary": {
                        "retainEvidenceCount": len(retain_paths),
                    },
                    "retainEvidencePaths": retain_paths,
                },
                indent=2,
            ),
            encoding="utf-8",
        )

    def test_build_report_passes_when_dynamic_blocked_audit_is_registered(self) -> None:
        self._write_registry([self.retain_path])

        with patch.object(MODULE, "REPO_ROOT", self.repo_root):
            report = MODULE.build_report(
                changed_paths={
                    self.retain_path: ["M"],
                    "docs/reference/CVF_RELEASE_MANIFEST.md": ["M"],
                }
            )

        self.assertTrue(report["compliant"])
        self.assertEqual(report["violationCount"], 0)
        self.assertEqual(report["dynamicScanMode"], "full")

    def test_build_report_fails_when_dynamic_blocked_audit_is_missing(self) -> None:
        self._write_registry([])

        with patch.object(MODULE, "REPO_ROOT", self.repo_root):
            report = MODULE.build_report(
                changed_paths={
                    self.retain_path: ["M"],
                    "docs/reference/CVF_RELEASE_MANIFEST.md": ["M"],
                }
            )

        self.assertFalse(report["compliant"])
        violation_types = {entry["type"] for entry in report["violations"]}
        self.assertIn("missing_dynamic_retain_evidence_entry", violation_types)

    def test_build_report_fails_when_registry_path_is_missing(self) -> None:
        self._write_registry(["docs/audits/CVF_MISSING_AUDIT_2026-03-21.md"])

        with patch.object(MODULE, "REPO_ROOT", self.repo_root):
            report = MODULE.build_report(changed_paths={self.retain_path: ["M"]})

        self.assertFalse(report["compliant"])
        violation_types = {entry["type"] for entry in report["violations"]}
        self.assertIn("missing_retain_evidence_file", violation_types)

    def test_build_report_skips_dynamic_scan_without_retention_affecting_changes(self) -> None:
        self._write_registry([])

        with patch.object(MODULE, "REPO_ROOT", self.repo_root):
            report = MODULE.build_report(changed_paths={"EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION/src/example.ts": ["M"]})

        self.assertTrue(report["compliant"])
        self.assertEqual(report["dynamicScanMode"], "skipped_no_retention_affecting_changes")
        self.assertEqual(report["dynamicCounts"]["status"], "skipped")

    def test_build_report_skips_dynamic_scan_for_handoff_change_without_audit_refs(self) -> None:
        self._write_registry([])

        with patch.object(MODULE, "REPO_ROOT", self.repo_root):
            report = MODULE.build_report(changed_paths={"AGENT_HANDOFF.md": ["M"]})

        self.assertTrue(report["compliant"])
        self.assertEqual(report["dynamicScanMode"], "skipped_no_retention_affecting_changes")


if __name__ == "__main__":
    unittest.main()
