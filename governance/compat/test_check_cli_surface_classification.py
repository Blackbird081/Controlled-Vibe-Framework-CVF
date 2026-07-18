"""Focused tests for the CLI surface classification checker."""

from __future__ import annotations

import importlib.util
import json
import sys
import tempfile
import unittest
from pathlib import Path


MODULE_PATH = Path(__file__).resolve().with_name("check_cli_surface_classification.py")
SPEC = importlib.util.spec_from_file_location("check_cli_surface_classification", MODULE_PATH)
assert SPEC and SPEC.loader
MODULE = importlib.util.module_from_spec(SPEC)
sys.modules[SPEC.name] = MODULE
SPEC.loader.exec_module(MODULE)


def _write_registry(path: Path, entries: list[dict]) -> None:
    path.write_text(
        json.dumps(
            {
                "schemaVersion": "0.1.0",
                "standardPath": "docs/reference/CVF_CLI_SURFACE_CLASSIFICATION_STANDARD_2026-06-30.md",
                "entries": entries,
            },
            indent=2,
        ),
        encoding="utf-8",
    )


class CliSurfaceClassificationTests(unittest.TestCase):
    def test_real_registry_is_compliant(self) -> None:
        report = MODULE.build_report()
        self.assertTrue(report["compliant"], report["violations"])
        self.assertGreaterEqual(report["checkedEntries"], 3)

    def test_cli_required_requires_main_and_dunder_entrypoint(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            source = root / "governance" / "compat" / "run_missing_cli.py"
            source.parent.mkdir(parents=True)
            source.write_text("def helper():\n    return 1\n", encoding="utf-8")
            registry = root / "registry.json"
            _write_registry(
                registry,
                [
                    {
                        "path": "governance/compat/run_missing_cli.py",
                        "classification": "CLI_REQUIRED",
                        "status": "TEST",
                        "ownerSurface": "test",
                        "reason": "test fixture",
                        "evidence": ["test"],
                    }
                ],
            )
            report = MODULE.build_report(registry_path=registry, repo_root=root)
            self.assertFalse(report["compliant"])
            self.assertEqual(report["violations"][0]["type"], "cli_required_without_entrypoint")

    def test_module_only_rejects_entrypoint(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            source = root / "governance" / "compat" / "split_module.py"
            source.parent.mkdir(parents=True)
            source.write_text(
                "def main():\n    return 0\n\nif __name__ == '__main__':\n    raise SystemExit(main())\n",
                encoding="utf-8",
            )
            registry = root / "registry.json"
            _write_registry(
                registry,
                [
                    {
                        "path": "governance/compat/split_module.py",
                        "classification": "MODULE_ONLY",
                        "status": "TEST",
                        "ownerSurface": "parent",
                        "reason": "test fixture",
                        "evidence": ["test"],
                    }
                ],
            )
            report = MODULE.build_report(registry_path=registry, repo_root=root)
            self.assertFalse(report["compliant"])
            self.assertEqual(report["violations"][0]["type"], "module_only_has_entrypoint")

    def test_duplicate_paths_are_rejected(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            source = root / "governance" / "compat" / "run_ok.py"
            source.parent.mkdir(parents=True)
            source.write_text(
                "def main():\n    return 0\n\nif __name__ == '__main__':\n    raise SystemExit(main())\n",
                encoding="utf-8",
            )
            entry = {
                "path": "governance/compat/run_ok.py",
                "classification": "CLI_REQUIRED",
                "status": "TEST",
                "ownerSurface": "test",
                "reason": "test fixture",
                "evidence": ["test"],
            }
            registry = root / "registry.json"
            _write_registry(registry, [entry, dict(entry)])
            report = MODULE.build_report(registry_path=registry, repo_root=root)
            violation_types = {item["type"] for item in report["violations"]}
            self.assertIn("duplicate_entry", violation_types)


if __name__ == "__main__":
    unittest.main()
