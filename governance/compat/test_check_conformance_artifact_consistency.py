#!/usr/bin/env python3
from __future__ import annotations

import importlib.util
import json
import sys
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch


MODULE_PATH = Path(__file__).resolve().with_name("check_conformance_artifact_consistency.py")
SPEC = importlib.util.spec_from_file_location("check_conformance_artifact_consistency", MODULE_PATH)
if SPEC is None or SPEC.loader is None:
    raise RuntimeError(f"Unable to load module from {MODULE_PATH}")
MODULE = importlib.util.module_from_spec(SPEC)
sys.modules[SPEC.name] = MODULE
SPEC.loader.exec_module(MODULE)


def _scenario(scenario_id: str = "CF-001") -> dict[str, object]:
    return {
        "scenarioId": scenario_id,
        "title": "Core compatibility gate",
        "objective": "Verify the public scenario registry contract.",
        "workdir": ".",
        "command": ["python", "governance/compat/check_core_compat.py", "--enforce"],
    }


class ConformanceArtifactConsistencyTests(unittest.TestCase):
    def setUp(self) -> None:
        self.temp_dir = tempfile.TemporaryDirectory()
        self.repo_root = Path(self.temp_dir.name)
        public_carrier = "# Public carrier\n"
        (self.repo_root / "AGENTS.md").write_text(public_carrier, encoding="utf-8")
        carrier_path = self.repo_root / "governance" / "toolkit" / "05_OPERATION" / "CVF_PUBLIC_CORE_AGENTS.md"
        carrier_path.parent.mkdir(parents=True, exist_ok=True)
        carrier_path.write_text(public_carrier, encoding="utf-8")
        self.registry_path = self.repo_root / MODULE.SCENARIO_REGISTRY_REL_PATH
        self.registry_path.parent.mkdir(parents=True, exist_ok=True)
        self.scenario_doc_path = self.repo_root / MODULE.SCENARIO_DOC_REL_PATH
        self.scenario_doc_path.parent.mkdir(parents=True, exist_ok=True)
        self.scenario_doc_path.write_text("\n".join(MODULE.PUBLIC_SCENARIO_DOC_MARKERS), encoding="utf-8")
        self.registry = {
            "schemaVersion": "2026-03-07",
            "wave": "WAVE_1",
            "requestId": "REQ-20260307-002",
            "scenarios": [_scenario()],
        }
        self._write_registry()

    def tearDown(self) -> None:
        self.temp_dir.cleanup()

    def _write_registry(self) -> None:
        self.registry_path.write_text(json.dumps(self.registry, indent=2), encoding="utf-8")

    def test_public_profile_checks_registry_without_private_artifacts_or_execution(self) -> None:
        with patch.object(MODULE, "REPO_ROOT", self.repo_root):
            report = MODULE._build_report(profile="public")

        self.assertTrue(report["compliant"])
        self.assertEqual(report["scenarioCount"], 1)
        self.assertEqual(report["privateReportSummaryComparison"], "not_applicable_public_profile")
        self.assertEqual(report["privateCommandExecution"], "not_run_public_profile")
        self.assertEqual(
            report["claimBoundary"],
            "PUBLIC_SCENARIO_REGISTRY_SCHEMA_ONLY_NOT_PRIVATE_CONFORMANCE_RESULT",
        )
        self.assertFalse((self.repo_root / "docs/reviews/cvf_phase_governance/CVF_CROSS_EXTENSION_CONFORMANCE_REPORT_2026-03-07.md").exists())
        self.assertFalse((self.repo_root / "docs/reviews/cvf_phase_governance/CVF_CROSS_EXTENSION_CONFORMANCE_SUMMARY_2026-03-07.json").exists())

    def test_public_profile_requires_public_registry(self) -> None:
        self.registry_path.unlink()

        with patch.object(MODULE, "REPO_ROOT", self.repo_root):
            report = MODULE._build_report(profile="public")

        self.assertFalse(report["compliant"])
        self.assertIn("required_public_file_missing", {entry["type"] for entry in report["violations"]})

    def test_public_profile_rejects_duplicate_scenario_ids(self) -> None:
        self.registry["scenarios"].append(_scenario())
        self._write_registry()

        with patch.object(MODULE, "REPO_ROOT", self.repo_root):
            report = MODULE._build_report(profile="public")

        self.assertFalse(report["compliant"])
        self.assertIn("duplicate_scenario_id", {entry["type"] for entry in report["violations"]})

    def test_public_profile_rejects_empty_identity_and_invalid_command_schema(self) -> None:
        self.registry["scenarios"][0]["scenarioId"] = " "
        self.registry["scenarios"][0]["command"] = ["python", " "]
        self._write_registry()

        with patch.object(MODULE, "REPO_ROOT", self.repo_root):
            report = MODULE._build_report(profile="public")

        self.assertFalse(report["compliant"])
        violation_types = {entry["type"] for entry in report["violations"]}
        self.assertIn("invalid_scenario_field", violation_types)
        self.assertIn("invalid_scenario_command", violation_types)

    def test_public_profile_rejects_wrong_public_carrier(self) -> None:
        (self.repo_root / "AGENTS.md").write_text("# different carrier\n", encoding="utf-8")

        with patch.object(MODULE, "REPO_ROOT", self.repo_root):
            report = MODULE._build_report(profile="public")

        self.assertFalse(report["compliant"])
        self.assertIn("public_carrier_mismatch", {entry["type"] for entry in report["violations"]})

    def test_private_default_keeps_three_way_report_comparison(self) -> None:
        (self.repo_root / "docs" / "reviews" / "cvf_phase_governance").mkdir(parents=True)
        report_path = self.repo_root / "docs" / "reviews" / "cvf_phase_governance" / "CVF_CROSS_EXTENSION_CONFORMANCE_REPORT_2026-03-07.md"
        summary_path = self.repo_root / "docs" / "reviews" / "cvf_phase_governance" / "CVF_CROSS_EXTENSION_CONFORMANCE_SUMMARY_2026-03-07.json"
        report_path.write_text("| `CF-001` |\n- overall result: `PASS`\n", encoding="utf-8")
        summary_path.write_text(json.dumps({
            "scenarioRegistry": "docs/reference/CVF_CONFORMANCE_SCENARIOS.json",
            "overallResult": "PASS",
            "results": [{"scenarioId": "CF-001", "result": "PASS"}],
        }), encoding="utf-8")

        with patch.object(MODULE, "REPO_ROOT", self.repo_root), patch.object(MODULE, "SCENARIO_REGISTRY_PATH", self.registry_path), patch.object(
            MODULE, "REPORT_PATH", report_path
        ), patch.object(MODULE, "SUMMARY_PATH", summary_path):
            report = MODULE._build_report()

        self.assertTrue(report["compliant"])
        self.assertEqual(report["scenarioCount"], 1)

    def test_public_profile_rejects_unknown_profile(self) -> None:
        with self.assertRaises(ValueError):
            MODULE._build_report(profile="unknown")


if __name__ == "__main__":
    unittest.main()
