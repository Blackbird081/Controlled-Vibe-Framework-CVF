#!/usr/bin/env python3
from __future__ import annotations

import importlib.util
import json
import sys
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch


MODULE_PATH = Path(__file__).resolve().with_name("check_governed_file_size.py")
SPEC = importlib.util.spec_from_file_location("check_governed_file_size", MODULE_PATH)
if SPEC is None or SPEC.loader is None:
    raise RuntimeError(f"Unable to load module from {MODULE_PATH}")
MODULE = importlib.util.module_from_spec(SPEC)
sys.modules[SPEC.name] = MODULE
SPEC.loader.exec_module(MODULE)


class GovernedFileSizeTests(unittest.TestCase):
    def setUp(self) -> None:
        self.temp_dir = tempfile.TemporaryDirectory()
        self.repo_root = Path(self.temp_dir.name)
        self.registry = self.repo_root / "registry.json"
        self.registry.write_text(
            json.dumps(
                {
                    "thresholds": {
                        "active_markdown": {
                            "softThresholdLines": 90,
                            "hardThresholdLines": 120,
                        },
                        "general_source": {
                            "softThresholdLines": 90,
                            "hardThresholdLines": 120,
                        },
                        "test_code": {
                            "softThresholdLines": 90,
                            "hardThresholdLines": 120,
                        },
                    },
                    "nearHardRotationMarginLines": 5,
                    "nearHardMinShrinkLines": 10,
                    "nearHardMaxCompressedStatementLines": 0,
                    "exceptions": [],
                }
            ),
            encoding="utf-8",
        )

    def tearDown(self) -> None:
        self.temp_dir.cleanup()

    def _write_lines(self, rel_path: str, line_count: int) -> Path:
        path = self.repo_root / rel_path
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text("\n".join(f"line {index}" for index in range(line_count)) + "\n", encoding="utf-8")
        return path

    def _write_source_with_compression(self, rel_path: str, line_count: int) -> Path:
        path = self._write_lines(rel_path, line_count)
        lines = path.read_text(encoding="utf-8").splitlines()
        lines[-1] = "const first = 1; const second = 2;"
        path.write_text("\n".join(lines) + "\n", encoding="utf-8")
        return path

    def _report_for(self, changed: dict[str, set[str]], previous_lines: int | None = None) -> dict:
        files = [path for path in self.repo_root.rglob("*") if path.is_file() and path.name != "registry.json"]
        with patch.object(MODULE, "REPO_ROOT", self.repo_root), patch.object(
            MODULE, "_iter_candidate_files", return_value=files
        ), patch.object(MODULE, "_worktree_changed_files", return_value=changed), patch.object(
            MODULE, "_head_line_count", return_value=previous_lines
        ):
            return MODULE.build_report(self.registry)

    def test_near_hard_touched_without_rotation_fails(self) -> None:
        self._write_lines("CVF_SESSION_MEMORY.md", 118)

        report = self._report_for({"CVF_SESSION_MEMORY.md": {"M"}}, previous_lines=119)

        self.assertFalse(report["compliant"])
        self.assertEqual(report["violations"][0]["type"], "near_hard_threshold_touched_without_rotation")

    def test_near_hard_touched_with_archive_rotation_passes(self) -> None:
        self._write_lines("CVF_SESSION_MEMORY.md", 118)
        self._write_lines("CVF_SESSION/handoffs/archive/CVF_SESSION_MEMORY_PRE_ROTATION_ARCHIVE_TEST.md", 118)

        report = self._report_for(
            {
                "CVF_SESSION_MEMORY.md": {"M"},
                "CVF_SESSION/handoffs/archive/CVF_SESSION_MEMORY_PRE_ROTATION_ARCHIVE_TEST.md": {"A"},
            },
            previous_lines=119,
        )

        self.assertTrue(report["compliant"])

    def test_near_hard_touched_with_meaningful_shrink_passes(self) -> None:
        self._write_lines("docs/reference/LONG_ACTIVE_DOC.md", 118)

        report = self._report_for({"docs/reference/LONG_ACTIVE_DOC.md": {"M"}}, previous_lines=140)

        self.assertTrue(report["compliant"])

    def test_near_hard_source_with_statement_compression_fails(self) -> None:
        self._write_source_with_compression("src/app/api/execute/route.ts", 118)

        report = self._report_for({"src/app/api/execute/route.ts": {"M"}}, previous_lines=119)

        self.assertFalse(report["compliant"])
        self.assertEqual(report["violations"][0]["type"], "near_hard_statement_compression")

    def test_added_test_file_is_not_rotation_evidence_for_source_file(self) -> None:
        self._write_lines("src/app/api/execute/route.ts", 118)
        self._write_lines("src/app/api/execute/route.some-feature.test.ts", 10)

        report = self._report_for(
            {
                "src/app/api/execute/route.ts": {"M"},
                "src/app/api/execute/route.some-feature.test.ts": {"A"},
            },
            previous_lines=119,
        )

        self.assertFalse(report["compliant"])
        self.assertEqual(report["violations"][0]["type"], "near_hard_threshold_touched_without_rotation")

    def test_added_source_file_is_rotation_evidence_for_source_file(self) -> None:
        self._write_lines("src/app/api/execute/route.ts", 118)
        self._write_lines("src/app/api/execute/route-response-readouts.ts", 20)

        report = self._report_for(
            {
                "src/app/api/execute/route.ts": {"M"},
                "src/app/api/execute/route-response-readouts.ts": {"A"},
            },
            previous_lines=119,
        )

        self.assertTrue(report["compliant"])


if __name__ == "__main__":
    unittest.main()
