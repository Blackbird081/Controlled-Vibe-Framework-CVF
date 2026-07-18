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

    def test_new_exception_with_valid_seed_authorization_is_accepted(self) -> None:
        # A new exception is allowed when its seedAuthorization GC-018 exists.
        mutated = {
            **self.base_registry,
            "exceptions": [
                {
                    "path": "scripts/demo.py",
                    "approvedMaxLines": 1400,
                    "status": "ACTIVE_EXCEPTION",
                    "rationale": "Legacy file.",
                    "requiredFollowup": "Split later.",
                    "seedAuthorization": "docs/baselines/EXISTS.md",
                }
            ],
        }
        with patch.object(MODULE, "_has_valid_seed_authorization", return_value=True):
            report = self._report(mutated, self.base_registry)
        self.assertNotIn("new_exception_requires_manual_review", {v["type"] for v in report["violations"]})

    def test_new_exception_with_missing_seed_authorization_still_blocks(self) -> None:
        mutated = {
            **self.base_registry,
            "exceptions": [
                {
                    "path": "scripts/demo.py",
                    "approvedMaxLines": 1400,
                    "status": "ACTIVE_EXCEPTION",
                    "rationale": "Legacy file.",
                    "requiredFollowup": "Split later.",
                    "seedAuthorization": "docs/baselines/DOES_NOT_EXIST.md",
                }
            ],
        }
        with patch.object(MODULE, "_has_valid_seed_authorization", return_value=False):
            report = self._report(mutated, self.base_registry)
        self.assertIn("new_exception_requires_manual_review", {v["type"] for v in report["violations"]})


class RatchetDownTests(unittest.TestCase):
    def _entry(self, cap: int, **overrides) -> dict:
        entry = {
            "path": "governance/compat/check_x.py",
            "fileClass": "python_checker",
            "approvedMaxLines": cap,
            "status": "ACTIVE_EXCEPTION",
            "rationale": "Legacy.",
            "requiredFollowup": "Split.",
            "seedAuthorization": "docs/baselines/EXISTS.md",
        }
        entry.update(overrides)
        return entry

    def test_lowering_cap_on_seeded_entry_is_authorized(self) -> None:
        base = self._entry(3056)
        current = self._entry(2972)
        with patch.object(MODULE, "_has_valid_seed_authorization", return_value=True):
            self.assertTrue(MODULE._is_authorized_ratchet_down(base, current))

    def test_raising_cap_is_not_authorized(self) -> None:
        base = self._entry(3056)
        current = self._entry(3100)
        with patch.object(MODULE, "_has_valid_seed_authorization", return_value=True):
            self.assertFalse(MODULE._is_authorized_ratchet_down(base, current))

    def test_lowering_cap_but_editing_another_field_is_not_authorized(self) -> None:
        base = self._entry(3056)
        current = self._entry(2972, rationale="Changed.")
        with patch.object(MODULE, "_has_valid_seed_authorization", return_value=True):
            self.assertFalse(MODULE._is_authorized_ratchet_down(base, current))

    def test_lowering_cap_without_seed_authorization_is_not_authorized(self) -> None:
        base = self._entry(3056)
        current = self._entry(2972)
        with patch.object(MODULE, "_has_valid_seed_authorization", return_value=False):
            self.assertFalse(MODULE._is_authorized_ratchet_down(base, current))


class ClassifyPythonTests(unittest.TestCase):
    def test_test_files_classified_by_name_or_location(self) -> None:
        self.assertEqual(MODULE._classify_python("governance/compat/test_x.py"), "python_test")
        self.assertEqual(MODULE._classify_python("scripts/foo_test.py"), "python_test")
        self.assertEqual(MODULE._classify_python("scripts/tests/bar.py"), "python_test")

    def test_checker_files_classified(self) -> None:
        self.assertEqual(MODULE._classify_python("governance/compat/check_x.py"), "python_checker")

    def test_cli_orchestrator_classified(self) -> None:
        self.assertEqual(MODULE._classify_python("governance/compat/run_x.py"), "python_cli_orchestrator")
        self.assertEqual(MODULE._classify_python("scripts/anything.py"), "python_cli_orchestrator")

    def test_remaining_compat_is_helper(self) -> None:
        self.assertEqual(MODULE._classify_python("governance/compat/policy_baseline.py"), "python_library_helper")

    def test_class_thresholds_resolve_with_override(self) -> None:
        registry = {"classThresholds": {"python_checker": {"hardThresholdLines": 1234}}}
        soft, hard = MODULE._resolve_class_thresholds(registry, "python_checker")
        self.assertEqual(hard, 1234)
        self.assertEqual(soft, 700)  # default retained when not overridden

    def test_class_thresholds_default_when_no_override(self) -> None:
        soft, hard = MODULE._resolve_class_thresholds({}, "python_cli_orchestrator")
        self.assertEqual((soft, hard), (500, 800))


class TouchRuleTests(unittest.TestCase):
    def setUp(self) -> None:
        self.sample_file = MODULE.REPO_ROOT / "governance" / "compat" / "check_demo.py"
        self.temp_paths: list[Path] = []

    def tearDown(self) -> None:
        for path in self.temp_paths:
            path.unlink(missing_ok=True)

    def _report(self, registry: dict, *, lines: int, changed: set, head_lines, baseline=None) -> dict:
        registry_path = _write_registry(registry)
        self.temp_paths.append(registry_path)
        with patch.object(MODULE, "_iter_governed_python_files", return_value=[self.sample_file]):
            with patch.object(MODULE, "_count_lines", return_value=lines):
                with patch.object(MODULE, "_rel", side_effect=lambda path: "governance/compat/check_demo.py"):
                    with patch.object(MODULE, "_changed_paths_against_head", return_value=changed):
                        with patch.object(MODULE, "_head_line_count", return_value=head_lines):
                            with patch.object(MODULE, "load_json_policy_baseline", return_value=(baseline, "HEAD")):
                                return MODULE.build_report(registry_path)

    def _exception_registry(self, approved: int) -> dict:
        return {
            "softThresholdLines": 600,
            "hardThresholdLines": 1200,
            "exceptions": [
                {
                    "path": "governance/compat/check_demo.py",
                    "fileClass": "python_checker",
                    "approvedMaxLines": approved,
                    "status": "ACTIVE_EXCEPTION",
                    "rationale": "Legacy.",
                    "requiredFollowup": "Split.",
                    "seedAuthorization": "docs/baselines/EXISTS.md",
                }
            ],
        }

    def test_touched_excepted_file_that_grew_fails(self) -> None:
        # Exception already in baseline; file grew 1100 -> 1150 with no max bump.
        registry = self._exception_registry(1200)
        report = self._report(
            registry,
            lines=1150,
            changed={"governance/compat/check_demo.py"},
            head_lines=1100,
            baseline=registry,
        )
        self.assertIn("exception_file_grew_on_touch", {v["type"] for v in report["violations"]})

    def test_freshly_seeded_exception_growth_is_exempt(self) -> None:
        # Exception absent from baseline (fresh seed) with valid seedAuthorization.
        registry = self._exception_registry(1150)
        empty_baseline = {"softThresholdLines": 600, "hardThresholdLines": 1200, "exceptions": []}
        with patch.object(MODULE, "_has_valid_seed_authorization", return_value=True):
            report = self._report(
                registry,
                lines=1150,
                changed={"governance/compat/check_demo.py"},
                head_lines=1100,
                baseline=empty_baseline,
            )
        self.assertNotIn("exception_file_grew_on_touch", {v["type"] for v in report["violations"]})

    def test_near_hard_touched_without_shrink_fails(self) -> None:
        # No exception; python_checker hard 1000; file at 990 (within 25), touched, no shrink.
        registry = {"softThresholdLines": 600, "hardThresholdLines": 1200, "exceptions": []}
        report = self._report(
            registry,
            lines=990,
            changed={"governance/compat/check_demo.py"},
            head_lines=985,
            baseline=None,
        )
        self.assertIn("near_hard_threshold_touched_without_shrink", {v["type"] for v in report["violations"]})

    def test_near_hard_touched_with_shrink_passes(self) -> None:
        registry = {"softThresholdLines": 600, "hardThresholdLines": 1200, "exceptions": []}
        report = self._report(
            registry,
            lines=990,
            changed={"governance/compat/check_demo.py"},
            head_lines=1050,  # shrank 60 lines
            baseline=None,
        )
        self.assertNotIn("near_hard_threshold_touched_without_shrink", {v["type"] for v in report["violations"]})


if __name__ == "__main__":
    unittest.main()
