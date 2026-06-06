#!/usr/bin/env python3
from __future__ import annotations

import importlib.util
import json
import sys
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch


MODULE_PATH = Path(__file__).resolve().with_name("check_conformance_trace_rotation.py")
SPEC = importlib.util.spec_from_file_location("check_conformance_trace_rotation", MODULE_PATH)
if SPEC is None or SPEC.loader is None:
    raise RuntimeError(f"Unable to load module from {MODULE_PATH}")
MODULE = importlib.util.module_from_spec(SPEC)
sys.modules[SPEC.name] = MODULE
SPEC.loader.exec_module(MODULE)


class CheckConformanceTraceRotationTests(unittest.TestCase):
    def setUp(self) -> None:
        self.temp_dir = tempfile.TemporaryDirectory()
        self.repo_root = Path(self.temp_dir.name)
        self.active_trace = (
            self.repo_root
            / "docs"
            / "reviews"
            / "cvf_phase_governance"
            / "CVF_CONFORMANCE_TRACE_2026-03-07.md"
        )
        self.archive_dir = self.repo_root / "docs" / "reviews" / "cvf_phase_governance" / "logs"
        self.manifest = self.repo_root / "governance" / "public-surface-manifest.json"
        self.archive_dir.mkdir(parents=True, exist_ok=True)
        self.manifest.parent.mkdir(parents=True, exist_ok=True)

    def tearDown(self) -> None:
        self.temp_dir.cleanup()

    def _validate(self):
        with patch.object(MODULE, "REPO_ROOT", self.repo_root):
            with patch.object(MODULE, "ACTIVE_TRACE", self.active_trace):
                with patch.object(MODULE, "ARCHIVE_DIR", self.archive_dir):
                    with patch.object(MODULE, "PUBLIC_SURFACE_MANIFEST", self.manifest):
                        return MODULE._validate()

    def test_allows_missing_private_blocked_trace_in_public_sync(self) -> None:
        self.manifest.write_text(
            json.dumps({"classes": {"PRIVATE_PROVENANCE_BLOCKED": ["docs/reviews/**"]}, "allowlist": []}),
            encoding="utf-8",
        )
        report = self._validate()
        self.assertTrue(report["compliant"])
        self.assertEqual("OMITTED_PRIVATE_PROVENANCE_IN_PUBLIC_SYNC", report["publicSyncDisposition"])

    def test_missing_trace_without_public_manifest_fails(self) -> None:
        report = self._validate()
        self.assertFalse(report["compliant"])
        self.assertEqual("missing_active_trace", report["violations"][0]["type"])

    def test_existing_trace_still_requires_archive_index(self) -> None:
        self.active_trace.write_text("trace\n", encoding="utf-8")
        report = self._validate()
        self.assertFalse(report["compliant"])
        self.assertEqual("missing_archive_index", report["violations"][0]["type"])


if __name__ == "__main__":
    unittest.main()
