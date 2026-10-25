#!/usr/bin/env python3
from __future__ import annotations

import importlib.util
import json
import sys
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch


MODULE_PATH = Path(__file__).resolve().with_name("check_incremental_test_log_rotation.py")
SPEC = importlib.util.spec_from_file_location("check_incremental_test_log_rotation", MODULE_PATH)
if SPEC is None or SPEC.loader is None:
    raise RuntimeError(f"Unable to load module from {MODULE_PATH}")
MODULE = importlib.util.module_from_spec(SPEC)
sys.modules[SPEC.name] = MODULE
SPEC.loader.exec_module(MODULE)


class IncrementalTestLogRotationTests(unittest.TestCase):
    def setUp(self) -> None:
        self.temp_dir = tempfile.TemporaryDirectory()
        self.repo_root = Path(self.temp_dir.name)
        public_carrier = "# Public carrier\n"
        (self.repo_root / "AGENTS.md").write_text(public_carrier, encoding="utf-8")
        carrier_path = self.repo_root / "governance" / "toolkit" / "05_OPERATION" / "CVF_PUBLIC_CORE_AGENTS.md"
        carrier_path.parent.mkdir(parents=True, exist_ok=True)
        carrier_path.write_text(public_carrier, encoding="utf-8")

        for rel_path in MODULE.PUBLIC_REQUIRED_FILES:
            path = self.repo_root / rel_path
            path.parent.mkdir(parents=True, exist_ok=True)
        (self.repo_root / "docs" / "CVF_INCREMENTAL_TEST_LOG.md").write_text(
            "\n".join((
                "# CVF Incremental Test Log",
                "",
                "Memory class: SUMMARY_RECORD",
                "",
                "Status: CURRENT",
                "",
                "## Purpose",
                "Record public-sync test activity for changed source/test batches.",
                "This public log is intentionally compact and does not mirror private provenance logs.",
                "",
                "## Scope / Target / Owner Boundary",
                "Scope: public-sync verification summaries.",
                "Owner boundary: Raw provider transcripts, private handoffs, and private provenance logs remain outside this public log.",
                "",
                "## Protocol / Contract / Requirements",
                "Record public batch commands and claim boundaries.",
                "",
                "## Batch: Public source verification",
                "",
                "## Evidence / Verification",
                "- `python governance/compat/check_incremental_test_log_rotation.py --profile public --enforce` - PASS",
                "",
                "## Claim Boundary",
                "This compact record does not claim private archive readiness.",
            )),
            encoding="utf-8",
        )
        (self.repo_root / "governance" / "toolkit" / "05_OPERATION" / "CVF_INCREMENTAL_TEST_LOG_ROTATION_GUARD.md").write_text(
            "\n".join(MODULE.PUBLIC_ROTATION_GUARD_REQUIRED_MARKERS),
            encoding="utf-8",
        )
        (self.repo_root / "governance" / "toolkit" / "05_OPERATION" / "CVF_ACTIVE_WINDOW_REGISTRY_GUARD.md").write_text(
            "Public active-window registration contract.\n",
            encoding="utf-8",
        )
        (self.repo_root / "docs" / "reference" / "CVF_ACTIVE_WINDOW_CLASSIFICATION.md").write_text(
            "Public active-window classification.\n",
            encoding="utf-8",
        )
        registry = {
            "version": 1,
            "classes": [{"id": "GLOBAL_APPEND_ONLY_LOG_WINDOW", "description": "Public log window."}],
            "windows": [dict(MODULE.PUBLIC_WINDOW_FIELDS)],
        }
        registry_path = self.repo_root / "governance" / "compat" / "CVF_ACTIVE_WINDOW_REGISTRY.json"
        registry_path.parent.mkdir(parents=True, exist_ok=True)
        registry_path.write_text(json.dumps(registry), encoding="utf-8")

    def tearDown(self) -> None:
        self.temp_dir.cleanup()

    def test_public_profile_checks_compact_contract_and_omits_private_archives(self) -> None:
        with patch.object(MODULE, "REPO_ROOT", self.repo_root), patch.object(
            MODULE,
            "_collect_archives",
            side_effect=AssertionError("public profile must not enumerate private archives"),
        ):
            report = MODULE._validate(profile="public")

        self.assertTrue(report["compliant"])
        self.assertEqual(report["profile"], "public")
        self.assertEqual(report["archiveCount"], None)
        self.assertEqual(report["archiveScanStatus"], "not_applicable_private_archives")
        self.assertEqual(report["privateArchiveEvidenceStatus"], "not_applicable_public_profile")
        self.assertEqual(report["publicWindowRegistrationStatus"], "checked")

    def test_public_profile_fails_when_required_public_guard_is_missing(self) -> None:
        (self.repo_root / "governance" / "toolkit" / "05_OPERATION" / "CVF_INCREMENTAL_TEST_LOG_ROTATION_GUARD.md").unlink()

        with patch.object(MODULE, "REPO_ROOT", self.repo_root):
            report = MODULE._validate(profile="public")

        self.assertFalse(report["compliant"])
        self.assertIn("missing_public_required_file", {entry["type"] for entry in report["violations"]})

    def test_public_profile_fails_on_window_contract_mismatch(self) -> None:
        registry_path = self.repo_root / "governance" / "compat" / "CVF_ACTIVE_WINDOW_REGISTRY.json"
        registry = json.loads(registry_path.read_text(encoding="utf-8"))
        registry["windows"][0]["rotationCheck"] = "governance/compat/other_checker.py"
        registry_path.write_text(json.dumps(registry), encoding="utf-8")

        with patch.object(MODULE, "REPO_ROOT", self.repo_root):
            report = MODULE._validate(profile="public")

        self.assertFalse(report["compliant"])
        self.assertIn("public_window_registration_mismatch", {entry["type"] for entry in report["violations"]})

    def test_public_profile_enforces_compact_log_size(self) -> None:
        log_path = self.repo_root / "docs" / "CVF_INCREMENTAL_TEST_LOG.md"
        log_path.write_text(log_path.read_text(encoding="utf-8") + "\n" * (MODULE.MAX_ACTIVE_LINES + 1), encoding="utf-8")

        with patch.object(MODULE, "REPO_ROOT", self.repo_root):
            report = MODULE._validate(profile="public")

        self.assertFalse(report["compliant"])
        self.assertIn("active_line_threshold", {entry["type"] for entry in report["violations"]})

    def test_public_profile_then_private_default_still_checks_archives(self) -> None:
        with patch.object(MODULE, "REPO_ROOT", self.repo_root), patch.object(
            MODULE, "ACTIVE_LOG_PATH", self.repo_root / "docs" / "CVF_INCREMENTAL_TEST_LOG.md"
        ), patch.object(MODULE, "ARCHIVE_DIR", self.repo_root / "docs" / "logs"):
            public_report = MODULE._validate(profile="public")
            archive_dir = self.repo_root / "docs" / "logs"
            archive_dir.mkdir(parents=True, exist_ok=True)
            (archive_dir / "CVF_INCREMENTAL_TEST_LOG_ARCHIVE_bad.md").write_text("archive\n", encoding="utf-8")
            private_report = MODULE._validate()

        self.assertTrue(public_report["compliant"])
        self.assertEqual(private_report["archiveCount"], 1)
        self.assertIn("archive_naming", {entry["type"] for entry in private_report["violations"]})


if __name__ == "__main__":
    unittest.main()
