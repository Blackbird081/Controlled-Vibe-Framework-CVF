from __future__ import annotations

import importlib.util
import sys
import unittest
from pathlib import Path


MODULE_PATH = Path(__file__).resolve().with_name("check_changed_corpus_registry_coverage.py")
SPEC = importlib.util.spec_from_file_location("check_changed_corpus_registry_coverage", MODULE_PATH)
MODULE = importlib.util.module_from_spec(SPEC)
assert SPEC and SPEC.loader
sys.modules[SPEC.name] = MODULE
SPEC.loader.exec_module(MODULE)


class ChangedCorpusRegistryCoverageTests(unittest.TestCase):
    def test_added_extension_source_without_registry_scope_is_violation(self) -> None:
        changed = {"EXTENSIONS/CVF_X/src/new_module.py": {"A"}}
        registry = {"corpora": [{"scopePaths": ["EXTENSIONS/CVF_Y/src/other.py"]}]}

        self.assertEqual(
            MODULE.find_coverage_violations(changed, registry),
            [
                "EXTENSIONS/CVF_X/src/new_module.py: added governed source/test file "
                "is not covered by docs/corpus-intelligence/CVF_CORPUS_SCAN_REGISTRY.json scopePaths"
            ],
        )

    def test_added_extension_source_under_registry_scope_passes(self) -> None:
        changed = {"EXTENSIONS/CVF_X/src/new_module.py": {"A"}}
        registry = {"corpora": [{"scopePaths": ["EXTENSIONS/CVF_X/src"]}]}

        self.assertEqual(MODULE.find_coverage_violations(changed, registry), [])

    def test_modified_extension_source_is_not_new_file_violation(self) -> None:
        changed = {"EXTENSIONS/CVF_X/src/existing.py": {"M"}}
        registry = {"corpora": []}

        self.assertEqual(MODULE.find_coverage_violations(changed, registry), [])

    def test_non_extension_markdown_is_not_source_violation(self) -> None:
        self.assertFalse(
            MODULE.is_new_governed_source_path("docs/reviews/CVF_PACKET.md", {"A"})
        )


if __name__ == "__main__":
    unittest.main()
