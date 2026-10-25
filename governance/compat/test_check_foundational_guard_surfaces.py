#!/usr/bin/env python3
from __future__ import annotations

import importlib.util
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch


MODULE_PATH = Path(__file__).resolve().with_name("check_foundational_guard_surfaces.py")
SPEC = importlib.util.spec_from_file_location("check_foundational_guard_surfaces", MODULE_PATH)
if SPEC is None or SPEC.loader is None:
    raise RuntimeError(f"Unable to load module from {MODULE_PATH}")
MODULE = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(MODULE)


class CheckFoundationalGuardSurfacesTests(unittest.TestCase):
    def setUp(self) -> None:
        self.temp_dir = tempfile.TemporaryDirectory()
        self.repo_root = Path(self.temp_dir.name)
        (self.repo_root / "docs" / "reference").mkdir(parents=True, exist_ok=True)
        (self.repo_root / "docs" / "reviews").mkdir(parents=True, exist_ok=True)
        (self.repo_root / "docs" / "baselines").mkdir(parents=True, exist_ok=True)
        (self.repo_root / "EXTENSIONS").mkdir(parents=True, exist_ok=True)
        (self.repo_root / "docs" / "CVF_ARCHITECTURE_DECISIONS.md").write_text(
            "## ADR-001: Baseline\n",
            encoding="utf-8",
        )
        (self.repo_root / "docs" / "CVF_CORE_KNOWLEDGE_BASE.md").write_text(
            "Known extension: CVF_ECO_v1.0_INTENT_VALIDATION\n",
            encoding="utf-8",
        )

    def tearDown(self) -> None:
        self.temp_dir.cleanup()

    def _read_text(self, path: str) -> str:
        abs_path = self.repo_root / path
        if not abs_path.exists() or abs_path.is_dir():
            return ""
        return abs_path.read_text(encoding="utf-8")

    def test_adr_guard_requires_adr_update_when_policy_guard_changes(self) -> None:
        changed = {
            "governance/toolkit/05_OPERATION/CVF_ADR_GUARD.md": ["M"],
        }

        with patch.object(MODULE, "REPO_ROOT", self.repo_root):
            with patch.object(MODULE, "_read_text", side_effect=self._read_text):
                report = MODULE._check_adr_guard([], changed, [])

        self.assertTrue(report["triggered"])
        self.assertTrue(any("without updating docs/CVF_ARCHITECTURE_DECISIONS.md" in issue for issue in report["issues"]))

    def test_architecture_guard_requires_kb_update_for_new_extension_root(self) -> None:
        changed = {
            "EXTENSIONS/CVF_CLI_v1.0_RUNNER/package.json": ["A"],
        }

        with patch.object(MODULE, "REPO_ROOT", self.repo_root):
            with patch.object(MODULE, "_read_text", side_effect=self._read_text):
                report = MODULE._check_architecture_check_guard([], changed, ["CVF_CLI_v1.0_RUNNER"])

        self.assertTrue(report["triggered"])
        self.assertTrue(any("without updating docs/CVF_CORE_KNOWLEDGE_BASE.md" in issue for issue in report["issues"]))
        self.assertTrue(any("does not mention new extension roots" in issue for issue in report["issues"]))

    def test_extension_versioning_rejects_unregistered_or_malformed_root(self) -> None:
        report = MODULE._check_extension_versioning_guard(["CVF_BADSTREAM_v1.0_THING", "intent_validation"])
        self.assertTrue(report["triggered"])
        self.assertEqual(1, len(report["issues"]))
        self.assertIn("intent_validation", report["issues"][0])
        self.assertIn("CVF_BADSTREAM_v1.0_THING", report["issues"][0])

    def test_structural_change_requires_gc019_supporting_docs(self) -> None:
        commits = [{"message": "refactor(arch): consolidate boundary"}]
        changed = {
            "EXTENSIONS/CVF_v1.0_ALPHA/file.ts": ["R100"],
        }

        report = MODULE._check_structural_change_audit_guard(commits, changed)

        self.assertTrue(report["triggered"])
        self.assertTrue(any("without a GC-019 review, delta, or restructuring artifact" in issue for issue in report["issues"]))

    def test_test_depth_report_requires_tier_markers(self) -> None:
        report_path = self.repo_root / "docs" / "reviews" / "CVF_SAMPLE_TEST_REPORT.md"
        report_path.write_text("Tests: 10/10 PASS\n", encoding="utf-8")
        changed = {"docs/reviews/CVF_SAMPLE_TEST_REPORT.md": ["M"]}

        with patch.object(MODULE, "REPO_ROOT", self.repo_root):
            with patch.object(MODULE, "_read_text", side_effect=self._read_text):
                report = MODULE._check_test_depth_classification_guard(changed)

        self.assertTrue(report["triggered"])
        self.assertTrue(any("reports test counts without tier markers" in issue for issue in report["issues"]))

    def test_workspace_isolation_rejects_root_app_artifacts(self) -> None:
        changed = {
            "app/page.tsx": ["A"],
            "next.config.ts": ["A"],
        }

        report = MODULE._check_workspace_isolation_guard(changed)

        self.assertTrue(report["triggered"])
        self.assertTrue(any("suspicious downstream-app or non-isolated workspace additions" in issue for issue in report["issues"]))


if __name__ == "__main__":
    unittest.main()


def test_public_structure_review_is_same_delta_and_does_not_replace_private_review(tmp_path, monkeypatch):
    import json
    base = "a" * 40
    path = "EXTENSIONS/existing/tests/integration.py"
    manifest = "docs/EXPORT_MANIFEST.md"
    changed = {path: ["A"], manifest: ["M"]}
    record = {"schemaVersion": "cvf.publicChangeEvidence.v1", "publicBase": base,
              "sourceCommit": "b" * 40, "changedPaths": [path],
              "claimBoundary": "PUBLIC_CHANGE_TRACEABILITY_NOT_PRIVATE_CLOSURE"}
    text = ("# Export\n\n## Public Change Evidence\n\nChange summary: Add existing SDK integration evidence.\n"
            "Changed owners: `EXTENSIONS/existing/tests/integration.py`\nValidation: Offline contract proof.\n"
            "Structural review: PUBLIC_PROJECTION_STRUCTURE_REVIEWED; existing SDK test ownership only.\n\n"
            "```public-change-evidence-json\n" + json.dumps(record) + "\n```\n")
    target = tmp_path / manifest
    target.parent.mkdir(parents=True)
    target.write_text(text)
    monkeypatch.setattr(MODULE, "REPO_ROOT", tmp_path)
    monkeypatch.setattr(MODULE, "PUBLIC_PROFILE", True)
    monkeypatch.setattr(MODULE, "PUBLIC_EVIDENCE_BASE", base)
    monkeypatch.setattr(MODULE, "_run_git", lambda args: (1, "", "no previous manifest"))
    assert MODULE._check_structural_change_audit_guard([], changed)["issues"] == []
    target.write_text(text.replace("Structural review:", "Missing review:"))
    assert MODULE._check_structural_change_audit_guard([], changed)["issues"]
    target.write_text(text)
    monkeypatch.setattr(MODULE, "PUBLIC_PROFILE", False)
    assert MODULE._check_structural_change_audit_guard([], changed)["issues"]
