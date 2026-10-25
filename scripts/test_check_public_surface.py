from __future__ import annotations

import shutil
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

import check_public_surface as public_surface


ARCHIVE_PATH = "docs/evidence/archive/EXPORT_MANIFEST_2026-05-09.md"


class PublicSurfaceReviewedArchiveTests(unittest.TestCase):
    def setUp(self) -> None:
        self.temp_dir = tempfile.TemporaryDirectory()
        self.root = Path(self.temp_dir.name)
        self.archive = self.root / ARCHIVE_PATH
        self.archive.parent.mkdir(parents=True, exist_ok=True)
        shutil.copyfile(public_surface.ROOT / ARCHIVE_PATH, self.archive)

    def tearDown(self) -> None:
        self.temp_dir.cleanup()

    def scan_archive(self) -> list[str]:
        with patch.object(public_surface, "ROOT", self.root), patch.object(
            public_surface, "git_surface_files", return_value=[self.archive]
        ):
            return public_surface.scan()

    def test_exact_historical_archive_payload_is_accepted(self) -> None:
        violations = self.scan_archive()
        self.assertEqual(violations, [])

    def test_changed_bytes_at_pinned_path_fail(self) -> None:
        with self.archive.open("ab") as handle:
            handle.write(b"\nchanged payload\n")

        violations = self.scan_archive()

        self.assertTrue(any("reviewed frozen markdown payload drift" in item for item in violations))
        self.assertTrue(any("large markdown file needs review" in item for item in violations))

    def test_unrelated_large_archive_still_fails(self) -> None:
        unrelated = self.root / "docs/evidence/archive/UNRELATED.md"
        unrelated.parent.mkdir(parents=True, exist_ok=True)
        unrelated.write_text("line\n" * 1200, encoding="utf-8")

        with patch.object(public_surface, "ROOT", self.root), patch.object(
            public_surface, "git_surface_files", return_value=[unrelated]
        ):
            violations = public_surface.scan()

        self.assertTrue(any("large markdown file needs review: docs/evidence/archive/UNRELATED.md" in item for item in violations))


if __name__ == "__main__":
    unittest.main()
