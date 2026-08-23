#!/usr/bin/env python3
"""Focused proof for the T2A currentAuthority validator.

Isolated from governance/compat/test_check_active_session_state.py per the
T2A Work Order Near-Threshold Owner Maintainability Plan, which forbids
touching that near-hard-threshold existing test file.
"""

from __future__ import annotations

import hashlib
import importlib.util
import sys
import tempfile
import unittest
from pathlib import Path
from unittest import mock


MODULE_PATH = Path(__file__).resolve().with_name("check_active_session_state.py")
SPEC = importlib.util.spec_from_file_location("check_active_session_state_t2a", MODULE_PATH)
if SPEC is None or SPEC.loader is None:
    raise RuntimeError(f"Unable to load module from {MODULE_PATH}")
MODULE = importlib.util.module_from_spec(SPEC)
sys.modules[SPEC.name] = MODULE
SPEC.loader.exec_module(MODULE)


class CurrentAuthorityValidationTests(unittest.TestCase):
    def setUp(self) -> None:
        self.temp_dir = tempfile.TemporaryDirectory()
        self.repo_root = Path(self.temp_dir.name)
        self.baseline_rel = "docs/baselines/TEST_BASELINE.md"
        self.work_order_rel = "docs/work_orders/TEST_WORK_ORDER.md"
        baseline_path = self.repo_root / self.baseline_rel
        work_order_path = self.repo_root / self.work_order_rel
        baseline_path.parent.mkdir(parents=True, exist_ok=True)
        work_order_path.parent.mkdir(parents=True, exist_ok=True)
        baseline_path.write_text("baseline content\n", encoding="utf-8")
        work_order_path.write_text("work order content\n", encoding="utf-8")
        self.baseline_hash = hashlib.sha256(baseline_path.read_bytes()).hexdigest()
        self.work_order_hash = hashlib.sha256(work_order_path.read_bytes()).hexdigest()
        self.valid_value = {
            "baselinePath": self.baseline_rel,
            "baselineSha256": self.baseline_hash,
            "workOrderPath": self.work_order_rel,
            "workOrderSha256": self.work_order_hash,
        }

    def tearDown(self) -> None:
        self.temp_dir.cleanup()

    def _validate(self, value):
        with mock.patch.object(MODULE, "REPO_ROOT", self.repo_root):
            return MODULE._validate_current_authority(value)

    def test_valid_authority_passes(self) -> None:
        self.assertEqual(self._validate(self.valid_value), [])

    def test_absent_authority_fails(self) -> None:
        violations = self._validate(None)
        self.assertEqual(len(violations), 1)
        self.assertIn("currentAuthority must be an object", violations[0])

    def test_not_object_fails(self) -> None:
        violations = self._validate("not-an-object")
        self.assertEqual(len(violations), 1)
        self.assertIn("must be an object", violations[0])

    def test_missing_field_fails(self) -> None:
        value = dict(self.valid_value)
        del value["workOrderSha256"]
        violations = self._validate(value)
        self.assertTrue(any("missing required fields" in v for v in violations))

    def test_extra_field_fails(self) -> None:
        value = dict(self.valid_value)
        value["unexpectedField"] = "x"
        violations = self._validate(value)
        self.assertTrue(any("unknown extra fields" in v for v in violations))

    def test_non_string_field_fails(self) -> None:
        value = dict(self.valid_value)
        value["baselinePath"] = 12345
        violations = self._validate(value)
        self.assertTrue(any("baselinePath must be a non-empty string" in v for v in violations))

    def test_empty_string_field_fails(self) -> None:
        value = dict(self.valid_value)
        value["workOrderPath"] = ""
        violations = self._validate(value)
        self.assertTrue(any("workOrderPath" in v for v in violations))

    def test_absolute_path_fails(self) -> None:
        value = dict(self.valid_value)
        value["baselinePath"] = "/etc/passwd"
        violations = self._validate(value)
        self.assertTrue(any("must be repository-relative" in v for v in violations))

    def test_windows_absolute_path_fails(self) -> None:
        value = dict(self.valid_value)
        value["baselinePath"] = "C:/secret/file.md"
        violations = self._validate(value)
        self.assertTrue(any("must be repository-relative" in v for v in violations))

    def test_escaping_path_fails(self) -> None:
        value = dict(self.valid_value)
        value["workOrderPath"] = "../outside.md"
        violations = self._validate(value)
        self.assertTrue(any("escapes the repository root" in v or "must not contain" in v for v in violations))

    def test_directory_path_fails(self) -> None:
        value = dict(self.valid_value)
        value["baselinePath"] = "docs/baselines"
        violations = self._validate(value)
        self.assertTrue(any("must be a regular file, not a directory" in v for v in violations))

    def test_missing_path_fails(self) -> None:
        value = dict(self.valid_value)
        value["workOrderPath"] = "docs/work_orders/DOES_NOT_EXIST.md"
        violations = self._validate(value)
        self.assertTrue(any("does not exist" in v for v in violations))

    def test_symlink_path_fails(self) -> None:
        target = self.repo_root / self.baseline_rel
        link_rel = "docs/baselines/LINKED.md"
        link_path = self.repo_root / link_rel
        try:
            link_path.symlink_to(target)
        except OSError:
            self.skipTest("symlink creation not permitted in this environment")
        value = dict(self.valid_value)
        value["baselinePath"] = link_rel
        violations = self._validate(value)
        self.assertTrue(any("must not be a symlink" in v for v in violations))

    def test_malformed_sha256_too_short_fails(self) -> None:
        value = dict(self.valid_value)
        value["baselineSha256"] = "abc123"
        violations = self._validate(value)
        self.assertTrue(any("baselineSha256 must be a lowercase 64-character SHA-256" in v for v in violations))

    def test_malformed_sha256_uppercase_fails(self) -> None:
        value = dict(self.valid_value)
        value["workOrderSha256"] = self.work_order_hash.upper()
        violations = self._validate(value)
        self.assertTrue(any("workOrderSha256 must be a lowercase 64-character SHA-256" in v for v in violations))

    def test_baseline_hash_tampering_fails(self) -> None:
        value = dict(self.valid_value)
        value["baselineSha256"] = "0" * 64
        violations = self._validate(value)
        self.assertTrue(any("baselineSha256 does not match current raw bytes" in v for v in violations))

    def test_work_order_hash_tampering_fails(self) -> None:
        value = dict(self.valid_value)
        value["workOrderSha256"] = "f" * 64
        violations = self._validate(value)
        self.assertTrue(any("workOrderSha256 does not match current raw bytes" in v for v in violations))

    def test_validator_never_raises_on_malformed_input(self) -> None:
        for bad_value in (None, "x", 123, [], {}, {"baselinePath": None}):
            try:
                self._validate(bad_value)
            except Exception as exc:  # noqa: BLE001 - proving no raw exception leaks
                self.fail(f"_validate_current_authority raised {exc!r} for {bad_value!r}")


if __name__ == "__main__":
    unittest.main()
