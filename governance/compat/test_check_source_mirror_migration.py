#!/usr/bin/env python3
"""Focused tests for check_source_mirror_migration.py."""

from __future__ import annotations

import importlib.util
from pathlib import Path
import unittest


MODULE_PATH = Path(__file__).resolve().with_name("check_source_mirror_migration.py")
SPEC = importlib.util.spec_from_file_location("check_source_mirror_migration", MODULE_PATH)
assert SPEC and SPEC.loader
checker = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(checker)


VALID_BLOCK = """
## Source Mirror Migration Control

| Field | Value |
|---|---|
| Legacy source path | `.private_reference/external_repos/agent-skills/` |
| Source mirror path | `.private_reference/source_mirrors/addyosmani__agent-skills/` |
| Mirror index row | `.private_reference/source_mirrors/INDEX.md` row `addyosmani__agent-skills` |
| Pinned upstream commit | `aba7c4e9695c363e65cb59effe926c7f1d1abe3d` |
| Migration disposition | `MIGRATED_TO_SOURCE_MIRROR` |
| Legacy cleanup disposition | legacy path retained until all active governed citations migrate |
| Claim boundary | no runtime, install, package activation, provider, public, or production authority |
"""


class SourceMirrorMigrationTests(unittest.TestCase):
    def test_no_legacy_reference_is_silent(self) -> None:
        text = "## External Absorption Core\nNo legacy source path here.\n"
        self.assertEqual(checker._check_text("docs/reviews/x.md", text), [])

    def test_legacy_reference_requires_block(self) -> None:
        text = "uses `.private_reference/external_repos/agent-skills/README.md`"
        violations = checker._check_text("docs/reviews/x.md", text)
        self.assertTrue(any(item["type"] == "source_mirror_migration_block_missing" for item in violations))

    def test_valid_block_passes(self) -> None:
        text = "source `.private_reference/external_repos/agent-skills/README.md`\n" + VALID_BLOCK
        self.assertEqual(checker._check_text("docs/reviews/x.md", text), [])

    def test_invalid_disposition_fails(self) -> None:
        text = (
            "source `.private_reference/external_repos/agent-skills/README.md`\n"
            + VALID_BLOCK.replace("MIGRATED_TO_SOURCE_MIRROR", "MIGRATED")
        )
        violations = checker._check_text("docs/reviews/x.md", text)
        self.assertTrue(any(item["type"] == "source_mirror_disposition_invalid" for item in violations))

    def test_source_mirror_path_required(self) -> None:
        text = (
            "source `.private_reference/external_repos/agent-skills/README.md`\n"
            + VALID_BLOCK.replace(".private_reference/source_mirrors/addyosmani__agent-skills/", "docs/reference/x.md")
        )
        violations = checker._check_text("docs/reviews/x.md", text)
        self.assertTrue(any(item["type"] == "source_mirror_path_invalid" for item in violations))


if __name__ == "__main__":
    unittest.main()
