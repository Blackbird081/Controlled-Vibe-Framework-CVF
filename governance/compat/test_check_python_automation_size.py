#!/usr/bin/env python3
from __future__ import annotations

import importlib.util
import json
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch


MODULE_PATH = Path(__file__).resolve().with_name("check_python_automation_size.py")
SPEC = importlib.util.spec_from_file_location("check_python_automation_size", MODULE_PATH)
if SPEC is None or SPEC.loader is None:
    raise RuntimeError(f"Unable to load module from {MODULE_PATH}")
MODULE = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(MODULE)


def _write_registry(payload: dict) -> Path:
    handle = tempfile.NamedTemporaryFile("w", encoding="utf-8", suffix=".json", delete=False)
    with handle:
        json.dump(payload, handle)
    return Path(handle.name)


class CheckPythonAutomationSizeTests(unittest.TestCase):
    def setUp(self) -> None:
        self.base_registry = {
            "softThresholdLines": 600,
            "hardThresholdLines": 1200,
            "exceptions": [],
        }
        self.sample_file = MODULE.REPO_ROOT / "scripts" / "demo.py"
        self.temp_paths: list[Path] = []

    def tearDown(self) -> None:
        for path in self.temp_paths:
            path.unlink(missing_ok=True)

    def _report(self, payload: dict, baseline: dict | None) -> dict:
        registry_path = _write_registry(payload)
        self.temp_paths.append(registry_path)
        with patch.object(MODULE, "_iter_governed_python_files", return_value=[self.sample_file]):
            with patch.object(MODULE, "_count_lines", return_value=200):
                with patch.object(MODULE, "load_json_policy_baseline", return_value=(baseline, "HEAD")):
                    with patch.object(MODULE, "_rel", side_effect=lambda path: path.as_posix()):
                        return MODULE.build_report(registry_path)

    def test_passes_when_registry_matches_baseline(self) -> None:
        report = self._report(self.base_registry, self.base_registry)
        self.assertTrue(report["compliant"])

    def test_blocks_threshold_change_from_baseline(self) -> None:
        mutated = dict(self.base_registry)
        mutated["hardThresholdLines"] = 1300

        report = self._report(mutated, self.base_registry)

        self.assertFalse(report["compliant"])
        self.assertIn("threshold_changed_from_baseline", {v["type"] for v in report["violations"]})

    def test_blocks_new_exception_entry(self) -> None:
        mutated = {
            **self.base_registry,
            "exceptions": [
                {
                    "path": "scripts/demo.py",
                    "approvedMaxLines": 1400,
                    "status": "ACTIVE_EXCEPTION",
                    "rationale": "Legacy file.",
                    "requiredFollowup": "Split later.",
                }
            ],
        }

        report = self._report(mutated, self.base_registry)

        self.assertFalse(report["compliant"])
        self.assertIn("new_exception_requires_manual_review", {v["type"] for v in report["violations"]})


if __name__ == "__main__":
    unittest.main()
