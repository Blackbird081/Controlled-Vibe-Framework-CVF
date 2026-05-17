#!/usr/bin/env python3
from __future__ import annotations

import importlib.util
import sys
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch


MODULE_PATH = Path(__file__).resolve().with_name("check_canon_summary_evidence_separation.py")
SPEC = importlib.util.spec_from_file_location("check_canon_summary_evidence_separation", MODULE_PATH)
if SPEC is None or SPEC.loader is None:
    raise RuntimeError(f"Unable to load module from {MODULE_PATH}")
MODULE = importlib.util.module_from_spec(SPEC)
sys.modules[SPEC.name] = MODULE
SPEC.loader.exec_module(MODULE)


class CanonSummaryEvidenceSeparationTests(unittest.TestCase):
    def setUp(self) -> None:
        self.temp_dir = tempfile.TemporaryDirectory()
        self.repo_root = Path(self.temp_dir.name)

    def tearDown(self) -> None:
        self.temp_dir.cleanup()

    def _write(self, rel_path: str, text: str) -> None:
        path = self.repo_root / rel_path
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(text, encoding="utf-8")

    def _seed(self) -> None:
        for rel_path in MODULE.SUMMARY_SURFACES:
            self._write(rel_path, "Summary only.\nSee docs/baselines/example.md\n")

    def test_passes_when_summary_surfaces_stay_high_level(self) -> None:
        self._seed()
        with patch.object(MODULE, "REPO_ROOT", self.repo_root):
            report = MODULE._classify()
        self.assertTrue(report["compliant"])

    def test_fails_when_summary_surface_inlines_typed_evidence_token(self) -> None:
        self._seed()
        self._write(MODULE.SUMMARY_SURFACES[0], "reportHash: abc123\n")
        with patch.object(MODULE, "REPO_ROOT", self.repo_root):
            report = MODULE._classify()
        self.assertFalse(report["compliant"])
        self.assertIn("summary_embeds_typed_evidence", {v["type"] for v in report["violations"]})


if __name__ == "__main__":
    unittest.main()
