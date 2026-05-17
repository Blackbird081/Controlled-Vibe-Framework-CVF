#!/usr/bin/env python3
from __future__ import annotations

import importlib.util
import json
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch


MODULE_PATH = Path(__file__).resolve().with_name("check_governed_exception_registry.py")
SPEC = importlib.util.spec_from_file_location("check_governed_exception_registry", MODULE_PATH)
if SPEC is None or SPEC.loader is None:
    raise RuntimeError(f"Unable to load module from {MODULE_PATH}")
MODULE = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(MODULE)


def _write_registry(payload: dict) -> Path:
    handle = tempfile.NamedTemporaryFile("w", encoding="utf-8", suffix=".json", delete=False)
    with handle:
        json.dump(payload, handle)
    return Path(handle.name)


class CheckGovernedExceptionRegistryTests(unittest.TestCase):
    def setUp(self) -> None:
        self.maxDiff = None
        self.base_registry = {
            "thresholds": {
                "general_source": {
                    "softThresholdLines": 700,
                    "hardThresholdLines": 1000,
                    "maxApprovableLines": 2000,
                    "maxAllowedBumpPercent": 65,
                }
            },
            "exceptions": [
                {
                    "path": "src/index.ts",
                    "fileClass": "general_source",
                    "approvedMaxLines": 1450,
                    "status": "ACTIVE_EXCEPTION",
                    "rationale": "Legacy barrel.",
                    "requiredFollowup": "Split on next substantive change.",
                }
            ],
        }
        self.temp_paths: list[Path] = []

    def tearDown(self) -> None:
        for path in self.temp_paths:
            path.unlink(missing_ok=True)

    def _validate(self, payload: dict, head_payload: dict | None) -> dict:
        registry_path = _write_registry(payload)
        self.temp_paths.append(registry_path)
        with patch.object(MODULE, "_read_head_registry", return_value=head_payload):
            return MODULE.validate(registry_path)

    def test_passes_when_registry_matches_head(self) -> None:
        report = self._validate(self.base_registry, self.base_registry)
        self.assertTrue(report["compliant"])
        self.assertEqual(report["violationCount"], 0)

    def test_blocks_approved_max_change_from_head(self) -> None:
        mutated = json.loads(json.dumps(self.base_registry))
        mutated["exceptions"][0]["approvedMaxLines"] = 1600

        report = self._validate(mutated, self.base_registry)

        self.assertFalse(report["compliant"])
        self.assertIn(
            "approved_max_changed_from_head",
            {violation["type"] for violation in report["violations"]},
        )

    def test_blocks_new_exception_entry(self) -> None:
        mutated = json.loads(json.dumps(self.base_registry))
        mutated["exceptions"].append(
            {
                "path": "src/new.ts",
                "fileClass": "general_source",
                "approvedMaxLines": 1200,
                "status": "ACTIVE_EXCEPTION",
                "rationale": "New debt.",
                "requiredFollowup": "Split later.",
            }
        )

        report = self._validate(mutated, self.base_registry)

        self.assertFalse(report["compliant"])
        self.assertIn(
            "new_exception_requires_manual_review",
            {violation["type"] for violation in report["violations"]},
        )

    def test_blocks_missing_max_allowed_bump_percent(self) -> None:
        mutated = json.loads(json.dumps(self.base_registry))
        del mutated["thresholds"]["general_source"]["maxAllowedBumpPercent"]

        report = self._validate(mutated, None)

        self.assertFalse(report["compliant"])
        self.assertIn(
            "schema_missing_max_bump_percent",
            {violation["type"] for violation in report["violations"]},
        )


if __name__ == "__main__":
    unittest.main()
