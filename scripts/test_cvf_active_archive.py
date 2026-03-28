#!/usr/bin/env python3
from __future__ import annotations

import importlib.util
import json
import sys
import tempfile
import unittest
from datetime import datetime
from pathlib import Path
from unittest.mock import patch


MODULE_PATH = Path(__file__).resolve().with_name("cvf_active_archive.py")
SPEC = importlib.util.spec_from_file_location("cvf_active_archive", MODULE_PATH)
if SPEC is None or SPEC.loader is None:
    raise RuntimeError(f"Unable to load module from {MODULE_PATH}")
MODULE = importlib.util.module_from_spec(SPEC)
sys.modules[SPEC.name] = MODULE
SPEC.loader.exec_module(MODULE)


class CvfActiveArchiveTests(unittest.TestCase):
    def setUp(self) -> None:
        self.temp_dir = tempfile.TemporaryDirectory()
        self.repo_root = Path(self.temp_dir.name)
        (self.repo_root / "docs" / "reviews" / "cvf_phase_governance").mkdir(parents=True, exist_ok=True)
        (self.repo_root / "docs" / "logs").mkdir(parents=True, exist_ok=True)
        (self.repo_root / "governance" / "compat").mkdir(parents=True, exist_ok=True)

        (self.repo_root / "docs" / "CVF_INCREMENTAL_TEST_LOG.md").write_text(
            "active log\n",
            encoding="utf-8",
        )
        (self.repo_root / "docs" / "reviews" / "cvf_phase_governance" / "CVF_CONFORMANCE_TRACE_2026-03-07.md").write_text(
            "active trace\n",
            encoding="utf-8",
        )
        (self.repo_root / "docs" / "CVF_OLD_REVIEW_2026-03-01.md").write_text(
            "old dated file\n",
            encoding="utf-8",
        )
        (self.repo_root / "docs" / "logs" / "CVF_INCREMENTAL_TEST_LOG_ARCHIVE_2026_PART_01.md").write_text(
            "archive file\n",
            encoding="utf-8",
        )
        (self.repo_root / "governance" / "compat" / "CVF_ACTIVE_WINDOW_REGISTRY.json").write_text(
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

    def test_scan_root_keeps_dedicated_active_windows_permanent(self) -> None:
        cutoff = datetime(2026, 3, 25)

        with patch.object(MODULE, "PROJECT_ROOT", self.repo_root):
            with patch.object(MODULE, "ACTIVE_WINDOW_REGISTRY_PATH", self.repo_root / "governance" / "compat" / "CVF_ACTIVE_WINDOW_REGISTRY.json"):
                MODULE.load_active_window_paths.cache_clear()
                result = MODULE.scan_root(self.repo_root / "docs", cutoff)

        permanent_paths = {path.relative_to(self.repo_root).as_posix() for path in result.permanent}
        archive_candidates = {info.rel_path for info in result.archive_candidates}

        self.assertIn("docs/CVF_INCREMENTAL_TEST_LOG.md", permanent_paths)
        self.assertIn(
            "docs/reviews/cvf_phase_governance/CVF_CONFORMANCE_TRACE_2026-03-07.md",
            permanent_paths,
        )
        self.assertNotIn("docs/CVF_INCREMENTAL_TEST_LOG.md", archive_candidates)
        self.assertNotIn(
            "docs/reviews/cvf_phase_governance/CVF_CONFORMANCE_TRACE_2026-03-07.md",
            archive_candidates,
        )

    def test_scan_root_still_flags_ordinary_old_dated_docs(self) -> None:
        cutoff = datetime(2026, 3, 25)

        with patch.object(MODULE, "PROJECT_ROOT", self.repo_root):
            with patch.object(MODULE, "ACTIVE_WINDOW_REGISTRY_PATH", self.repo_root / "governance" / "compat" / "CVF_ACTIVE_WINDOW_REGISTRY.json"):
                MODULE.load_active_window_paths.cache_clear()
                result = MODULE.scan_root(self.repo_root / "docs", cutoff)

        archive_candidates = {info.rel_path for info in result.archive_candidates}
        self.assertIn("docs/CVF_OLD_REVIEW_2026-03-01.md", archive_candidates)

    def test_scan_root_excludes_dedicated_archive_zones(self) -> None:
        cutoff = datetime(2026, 3, 25)

        with patch.object(MODULE, "PROJECT_ROOT", self.repo_root):
            with patch.object(MODULE, "ACTIVE_WINDOW_REGISTRY_PATH", self.repo_root / "governance" / "compat" / "CVF_ACTIVE_WINDOW_REGISTRY.json"):
                MODULE.load_active_window_paths.cache_clear()
                result = MODULE.scan_root(self.repo_root / "docs", cutoff)

        archive_candidates = {info.rel_path for info in result.archive_candidates}
        permanent_paths = {path.relative_to(self.repo_root).as_posix() for path in result.permanent}

        self.assertNotIn("docs/logs/CVF_INCREMENTAL_TEST_LOG_ARCHIVE_2026_PART_01.md", archive_candidates)
        self.assertNotIn("docs/logs/CVF_INCREMENTAL_TEST_LOG_ARCHIVE_2026_PART_01.md", permanent_paths)


if __name__ == "__main__":
    unittest.main()
