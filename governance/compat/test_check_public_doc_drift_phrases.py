#!/usr/bin/env python3
from __future__ import annotations

import importlib.util
import sys
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch


MODULE_PATH = Path(__file__).resolve().with_name("check_public_doc_drift_phrases.py")
SPEC = importlib.util.spec_from_file_location("check_public_doc_drift_phrases", MODULE_PATH)
if SPEC is None or SPEC.loader is None:
    raise RuntimeError(f"Unable to load module from {MODULE_PATH}")
MODULE = importlib.util.module_from_spec(SPEC)
sys.modules[SPEC.name] = MODULE
SPEC.loader.exec_module(MODULE)


class PublicDocDriftPhraseTests(unittest.TestCase):
    def setUp(self) -> None:
        self.temp_dir = tempfile.TemporaryDirectory()
        self.repo_root = Path(self.temp_dir.name)

    def tearDown(self) -> None:
        self.temp_dir.cleanup()

    def _write(self, rel_path: str, text: str) -> None:
        path = self.repo_root / rel_path
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(text, encoding="utf-8")

    def test_compliant_public_docs_pass(self) -> None:
        self._write("docs/GET_STARTED.md", "Version: 4.0.0 GA\n")
        self._write("docs/guides/CVF_QUICK_ORIENTATION.md", "62 active skills\n")

        with patch.object(MODULE, "REPO_ROOT", self.repo_root):
            report = MODULE._classify(["docs/GET_STARTED.md", "docs/guides/CVF_QUICK_ORIENTATION.md"])

        self.assertTrue(report["compliant"])
        self.assertEqual(report["violationCount"], 0)

    def test_stale_version_and_skill_counts_fail(self) -> None:
        self._write(
            "docs/GET_STARTED.md",
            "March 20, 2026 - Version: 1.6.0\nThe system has 131 active skills.\n",
        )

        with patch.object(MODULE, "REPO_ROOT", self.repo_root):
            report = MODULE._classify(["docs/GET_STARTED.md"])

        self.assertFalse(report["compliant"])
        self.assertEqual(
            {"stale_release_date", "stale_version_1_6_0", "stale_skill_count_131"},
            {violation["type"] for violation in report["violations"]},
        )

    def test_placeholder_security_and_public_handoff_label_fail(self) -> None:
        self._write(
            "SECURITY.md",
            "Contact the operator-defined private security channel.\nSee [Agent Handoff](AGENT_HANDOFF.md).\n",
        )

        with patch.object(MODULE, "REPO_ROOT", self.repo_root):
            report = MODULE._classify(["SECURITY.md"])

        self.assertFalse(report["compliant"])
        self.assertEqual(
            {"placeholder_security_contact", "handoff_label_public_surface"},
            {violation["type"] for violation in report["violations"]},
        )


if __name__ == "__main__":
    unittest.main()
