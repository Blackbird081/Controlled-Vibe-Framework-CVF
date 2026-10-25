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

    def _seed(self, profile: str = "private") -> None:
        for rel_path in MODULE.SUMMARY_SURFACE_PROFILES[profile]:
            self._write(rel_path, "Summary only.\nSee docs/baselines/example.md\n")

    def test_default_profile_preserves_the_five_private_surfaces(self) -> None:
        self.assertEqual(
            MODULE.SUMMARY_SURFACES,
            [
                "docs/reference/CVF_MASTER_ARCHITECTURE_WHITEPAPER.md",
                "docs/reference/CVF_WHITEPAPER_PROGRESS_TRACKER.md",
                "CVF_SESSION_MEMORY.md",
                "docs/INDEX.md",
                "docs/roadmaps/CVF_POST_W7_OPEN_TARGETS_UPGRADE_ROADMAP_2026-03-28.md",
            ],
        )
        self._seed()
        with patch.object(MODULE, "REPO_ROOT", self.repo_root):
            report = MODULE._classify()
        self.assertTrue(report["compliant"])
        self.assertEqual(report["profile"], "private")
        self.assertEqual(report["summarySurfaceCount"], 5)

    def test_public_profile_passes_for_the_four_exported_surfaces(self) -> None:
        self.assertEqual(
            MODULE.PUBLIC_SUMMARY_SURFACES,
            [
                "docs/reference/CVF_MASTER_ARCHITECTURE_WHITEPAPER.md",
                "docs/reference/CVF_WHITEPAPER_PROGRESS_TRACKER.md",
                "docs/INDEX.md",
                "AGENT_HANDOFF.md",
            ],
        )
        self._seed("public")
        with patch.object(MODULE, "REPO_ROOT", self.repo_root):
            report = MODULE._classify("public")
        self.assertTrue(report["compliant"])
        self.assertEqual(report["profile"], "public")
        self.assertEqual(report["summarySurfaceCount"], 4)

    def test_public_profile_fails_when_an_exported_surface_is_missing(self) -> None:
        self._seed("public")
        (self.repo_root / "AGENT_HANDOFF.md").unlink()
        with patch.object(MODULE, "REPO_ROOT", self.repo_root):
            report = MODULE._classify("public")
        self.assertFalse(report["compliant"])
        self.assertIn(
            ("missing_summary_surface", "AGENT_HANDOFF.md"),
            {(item["type"], item["path"]) for item in report["violations"]},
        )

    def test_public_profile_rejects_typed_evidence_in_an_exported_surface(self) -> None:
        self._seed("public")
        self._write("AGENT_HANDOFF.md", "runId: ci-123\n")
        with patch.object(MODULE, "REPO_ROOT", self.repo_root):
            report = MODULE._classify("public")
        self.assertFalse(report["compliant"])
        self.assertIn(
            ("summary_embeds_typed_evidence", "AGENT_HANDOFF.md"),
            {(item["type"], item["path"]) for item in report["violations"]},
        )

    def test_fails_when_summary_surface_inlines_typed_evidence_token(self) -> None:
        self._seed()
        self._write(MODULE.SUMMARY_SURFACES[0], "reportHash: abc123\n")
        with patch.object(MODULE, "REPO_ROOT", self.repo_root):
            report = MODULE._classify()
        self.assertFalse(report["compliant"])
        self.assertIn("summary_embeds_typed_evidence", {v["type"] for v in report["violations"]})

    def test_unknown_profile_is_rejected_instead_of_falling_back(self) -> None:
        with patch.object(MODULE, "REPO_ROOT", self.repo_root):
            with self.assertRaisesRegex(ValueError, "unknown summary surface profile"):
                MODULE._classify("auto")

    def test_cli_rejects_unknown_profile(self) -> None:
        with patch.object(sys, "argv", [str(MODULE_PATH), "--profile", "auto"]):
            with self.assertRaises(SystemExit) as raised:
                MODULE.main()
        self.assertEqual(raised.exception.code, 2)


if __name__ == "__main__":
    unittest.main()
