#!/usr/bin/env python3
from __future__ import annotations

import importlib.util
import json
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch


MODULE_PATH = Path(__file__).resolve().with_name("check_test_partition_ownership.py")
SPEC = importlib.util.spec_from_file_location("check_test_partition_ownership", MODULE_PATH)
if SPEC is None or SPEC.loader is None:
    raise RuntimeError(f"Unable to load module from {MODULE_PATH}")
MODULE = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(MODULE)


class CheckTestPartitionOwnershipTests(unittest.TestCase):
    def setUp(self) -> None:
        self.temp_dir = tempfile.TemporaryDirectory()
        self.repo_root = Path(self.temp_dir.name)
        self.registry_path = self.repo_root / "registry.json"
        self.canonical_file = self.repo_root / "tests" / "domain.test.ts"
        self.canonical_file.parent.mkdir(parents=True, exist_ok=True)
        self.canonical_file.write_text("export const ok = true;\n", encoding="utf-8")
        self.legacy_file = self.repo_root / "tests" / "index.test.ts"
        self.legacy_file.write_text("describe('legacy', () => {});\n", encoding="utf-8")
        self.base_registry = {
            "partitions": [
                {
                    "scope": "Domain Partition",
                    "canonicalFile": "tests/domain.test.ts",
                    "forbiddenFiles": ["tests/index.test.ts"],
                    "forbiddenPatterns": ["DomainContract"],
                }
            ]
        }

    def tearDown(self) -> None:
        self.temp_dir.cleanup()

    def _write_registry(self, payload: dict) -> None:
        self.registry_path.write_text(json.dumps(payload), encoding="utf-8")

    def _report(self, payload: dict, baseline: dict | None) -> dict:
        self._write_registry(payload)
        with patch.object(MODULE, "REPO_ROOT", self.repo_root):
            with patch.object(MODULE, "load_json_policy_baseline", return_value=(baseline, "HEAD")):
                return MODULE.build_report(self.registry_path)

    def test_blocks_mutated_existing_partition(self) -> None:
        mutated = json.loads(json.dumps(self.base_registry))
        mutated["partitions"][0]["forbiddenPatterns"] = ["DifferentContract"]

        report = self._report(mutated, self.base_registry)

        self.assertFalse(report["compliant"])
        self.assertIn("partition_mutated_from_baseline", {v["type"] for v in report["violations"]})

    def test_blocks_removed_existing_partition(self) -> None:
        report = self._report({"partitions": []}, self.base_registry)

        self.assertFalse(report["compliant"])
        self.assertIn("partition_removed_from_baseline", {v["type"] for v in report["violations"]})

    def test_allows_additive_new_partition(self) -> None:
        extra_file = self.repo_root / "tests" / "extra.test.ts"
        extra_file.write_text("export const extra = true;\n", encoding="utf-8")
        additive = json.loads(json.dumps(self.base_registry))
        additive["partitions"].append(
            {
                "scope": "Extra Partition",
                "canonicalFile": "tests/extra.test.ts",
                "forbiddenFiles": ["tests/index.test.ts"],
                "forbiddenPatterns": ["ExtraContract"],
            }
        )

        report = self._report(additive, self.base_registry)

        self.assertTrue(report["compliant"])


if __name__ == "__main__":
    unittest.main()
