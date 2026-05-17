#!/usr/bin/env python3
from __future__ import annotations

import importlib.util
import json
import sys
import tempfile
import unittest
from pathlib import Path
from types import SimpleNamespace
from unittest.mock import patch


MODULE_PATH = Path(__file__).resolve().with_name("check_review_retention_registry.py")
SPEC = importlib.util.spec_from_file_location("check_review_retention_registry", MODULE_PATH)
if SPEC is None or SPEC.loader is None:
    raise RuntimeError(f"Unable to load module from {MODULE_PATH}")
MODULE = importlib.util.module_from_spec(SPEC)
sys.modules[SPEC.name] = MODULE
SPEC.loader.exec_module(MODULE)


class ReviewRetentionRegistryTests(unittest.TestCase):
    def setUp(self) -> None:
        self.temp_dir = tempfile.TemporaryDirectory()
        self.repo_root = Path(self.temp_dir.name)

        (self.repo_root / "docs" / "reviews").mkdir(parents=True, exist_ok=True)
        (self.repo_root / "docs" / "reference").mkdir(parents=True, exist_ok=True)
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

        self.retain_path = "docs/reviews/CVF_W1_T3_TRANCHE_CLOSURE_REVIEW_2026-03-22.md"
        self.safe_path = "docs/reviews/CVF_OLD_SUPPLEMENTAL_REVIEW_2026-03-21.md"
        (self.repo_root / self.retain_path).write_text(
            "closure review referenced by tracker\n",
            encoding="utf-8",
        )
        (self.repo_root / self.safe_path).write_text(
            "old independent review\n",
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
                        }
                    ],
                },
                indent=2,
            ),
            encoding="utf-8",
        )

    def tearDown(self) -> None:
        self.temp_dir.cleanup()

    def _write_registry(self, retain_paths: list[str]) -> None:
        (self.repo_root / "governance" / "compat" / "CVF_REVIEW_RETENTION_REGISTRY.json").write_text(
            json.dumps(
                {
                    "version": 1,
                    "lastReviewed": "2026-03-28",
                    "classes": [
                        {"id": "ACTIVE_DECISION_REVIEW", "description": "recent"},
                        {"id": "RETAIN_EVIDENCE_REVIEW", "description": "evidence"},
                        {"id": "SAFE_TO_ARCHIVE_REVIEW", "description": "safe"},
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

    def test_build_report_passes_when_dynamic_blocked_review_is_registered(self) -> None:
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

    def test_build_report_fails_when_dynamic_blocked_review_is_missing(self) -> None:
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
        self._write_registry(["docs/reviews/CVF_MISSING_REVIEW_2026-03-21.md"])

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

    def test_build_report_skips_dynamic_scan_for_handoff_change_without_review_refs(self) -> None:
        self._write_registry([])

        with patch.object(MODULE, "REPO_ROOT", self.repo_root):
            report = MODULE.build_report(changed_paths={"AGENT_HANDOFF.md": ["M"]})

        self.assertTrue(report["compliant"])
        self.assertEqual(report["dynamicScanMode"], "skipped_no_retention_affecting_changes")

    def test_run_git_handles_none_stdout_and_stderr(self) -> None:
        with patch.object(
            MODULE.subprocess,
            "run",
            return_value=SimpleNamespace(returncode=0, stdout=None, stderr=None),
        ):
            code, out, err = MODULE._run_git(["status"])

        self.assertEqual(code, 0)
        self.assertEqual(out, "")
        self.assertEqual(err, "")


if __name__ == "__main__":
    unittest.main()
