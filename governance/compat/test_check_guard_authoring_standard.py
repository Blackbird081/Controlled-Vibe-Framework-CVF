#!/usr/bin/env python3
from __future__ import annotations

import importlib.util
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch


MODULE_PATH = Path(__file__).resolve().with_name("check_guard_authoring_standard.py")
SPEC = importlib.util.spec_from_file_location("check_guard_authoring_standard", MODULE_PATH)
if SPEC is None or SPEC.loader is None:
    raise RuntimeError(f"Unable to load module from {MODULE_PATH}")
MODULE = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(MODULE)


class CheckGuardAuthoringStandardTests(unittest.TestCase):
    def setUp(self) -> None:
        self.temp_dir = tempfile.TemporaryDirectory()
        self.repo_root = Path(self.temp_dir.name)
        self.guard_dir = self.repo_root / "governance" / "toolkit" / "05_OPERATION"
        self.guard_dir.mkdir(parents=True, exist_ok=True)
        self.guard_path = self.guard_dir / "CVF_SAMPLE_GUARD.md"
        self.enforcer_path = self.repo_root / "governance" / "compat" / "check_sample_guard.py"
        self.enforcer_path.parent.mkdir(parents=True, exist_ok=True)
        self.enforcer_path.write_text("print('ok')\n", encoding="utf-8")
        (self.repo_root / "README.md").write_text("CVF_SAMPLE_GUARD.md\n", encoding="utf-8")
        (self.repo_root / "docs").mkdir(parents=True, exist_ok=True)
        (self.repo_root / "docs" / "CVF_CORE_KNOWLEDGE_BASE.md").write_text("CVF_SAMPLE_GUARD.md\n", encoding="utf-8")
        (self.repo_root / "docs" / "reference").mkdir(parents=True, exist_ok=True)
        (self.repo_root / "docs" / "reference" / "CVF_GOVERNANCE_CONTROL_MATRIX.md").write_text("GC-030\n", encoding="utf-8")
        (self.repo_root / "governance" / "toolkit" / "02_POLICY").mkdir(parents=True, exist_ok=True)
        (self.repo_root / "governance" / "toolkit" / "02_POLICY" / "CVF_MASTER_POLICY.md").write_text("GC-030\n", encoding="utf-8")

    def tearDown(self) -> None:
        self.temp_dir.cleanup()

    def _write_guard(self, body: str) -> None:
        self.guard_path.write_text(body, encoding="utf-8")

    def _validate(self) -> list[str]:
        with patch.object(MODULE, "REPO_ROOT", self.repo_root):
            with patch.object(MODULE, "README_PATH", self.repo_root / "README.md"):
                with patch.object(MODULE, "KB_PATH", self.repo_root / "docs" / "CVF_CORE_KNOWLEDGE_BASE.md"):
                    with patch.object(MODULE, "CONTROL_MATRIX_PATH", self.repo_root / "docs" / "reference" / "CVF_GOVERNANCE_CONTROL_MATRIX.md"):
                        with patch.object(MODULE, "MASTER_POLICY_PATH", self.repo_root / "governance" / "toolkit" / "02_POLICY" / "CVF_MASTER_POLICY.md"):
                            return MODULE._validate_guard(
                                self.guard_path,
                                (self.repo_root / "README.md").read_text(encoding="utf-8"),
                                (self.repo_root / "docs" / "CVF_CORE_KNOWLEDGE_BASE.md").read_text(encoding="utf-8"),
                                (self.repo_root / "docs" / "reference" / "CVF_GOVERNANCE_CONTROL_MATRIX.md").read_text(encoding="utf-8"),
                                (self.repo_root / "governance" / "toolkit" / "02_POLICY" / "CVF_MASTER_POLICY.md").read_text(encoding="utf-8"),
                            )

    def test_accepts_compliant_guard(self) -> None:
        self._write_guard(
            "# Sample Guard\n\n"
            "**Control ID:** `GC-030`\n"
            "**Guard Class:** `META_GUARD`\n"
            "**Status:** Active\n"
            "**Applies to:** Test authors\n"
            "**Enforced by:** `governance/compat/check_sample_guard.py`\n\n"
            "## Purpose\n\nText.\n\n"
            "## Rule\n\nText.\n\n"
            "## Enforcement Surface\n\nText.\n\n"
            "## Related Artifacts\n\nText.\n\n"
            "## Final Clause\n\nText.\n"
        )

        self.assertEqual([], self._validate())

    def test_rejects_missing_section(self) -> None:
        self._write_guard(
            "# Sample Guard\n\n"
            "**Guard Class:** `META_GUARD`\n"
            "**Status:** Active\n"
            "**Applies to:** Test authors\n"
            "**Enforced by:** `governance/compat/check_sample_guard.py`\n\n"
            "## Purpose\n\nText.\n\n"
            "## Rule\n\nText.\n\n"
            "## Related Artifacts\n\nText.\n\n"
            "## Final Clause\n\nText.\n"
        )

        issues = self._validate()
        self.assertTrue(any("missing section `## Enforcement Surface`" in issue for issue in issues))

    def test_rejects_missing_enforced_by_path(self) -> None:
        self._write_guard(
            "# Sample Guard\n\n"
            "**Guard Class:** `META_GUARD`\n"
            "**Status:** Active\n"
            "**Applies to:** Test authors\n"
            "**Enforced by:** `governance/compat/missing_guard.py`\n\n"
            "## Purpose\n\nText.\n\n"
            "## Rule\n\nText.\n\n"
            "## Enforcement Surface\n\nText.\n\n"
            "## Related Artifacts\n\nText.\n\n"
            "## Final Clause\n\nText.\n"
        )

        issues = self._validate()
        self.assertTrue(any("does not exist" in issue for issue in issues))


if __name__ == "__main__":
    unittest.main()
