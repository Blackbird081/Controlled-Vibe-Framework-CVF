#!/usr/bin/env python3
# Text Encoding Exception: preserves source-faithful Unicode from accepted skill metadata.
"""
Focused tests for generate_user_skills.py.

All tests operate on temporary directories via Python's tempfile module.
NONE of these tests touch the real registry output directory
(governance/skill-library/registry/user-skills).

Run with: python governance/skill-library/registry/test_generate_user_skills.py
"""

from __future__ import annotations

import hashlib
import os
import shutil
import sys
import tempfile
import unittest
from pathlib import Path
from unittest import mock

sys.path.insert(0, str(Path(__file__).resolve().parent))

import generate_user_skills as gen  # noqa: E402


def make_fixture_source_tree(root: Path) -> Path:
    """
    Build a small fixture skill-library source tree:
      domain_a/
        01_alpha.skill.md
        02_beta.skill.md
      domain_b/
        03_gamma.skill.md
    Returns the fixture root path.
    """
    src = root / "fixture_skill_library"
    (src / "domain_a").mkdir(parents=True)
    (src / "domain_b").mkdir(parents=True)

    (src / "domain_a" / "01_alpha.skill.md").write_text(
        "# Alpha Skill\n\n> **Difficulty:** ⭐ Easy\n\nBody text for alpha.\n",
        encoding="utf-8",
    )
    (src / "domain_a" / "02_beta.skill.md").write_text(
        "# Beta Skill\n\n> **Difficulty:** ⭐⭐⭐ Advanced\n\nBody text for beta.\n",
        encoding="utf-8",
    )
    (src / "domain_b" / "03_gamma.skill.md").write_text(
        "# Gamma Skill\n\n> **Difficulty:** ⭐⭐ Medium\n\nBody text for gamma.\n",
        encoding="utf-8",
    )
    return src


def dir_snapshot(path: Path) -> dict:
    """Return {relative_path: (mtime_ns, sha256)} for every file under path."""
    snap = {}
    if not path.exists():
        return snap
    for p in sorted(path.rglob("*")):
        if p.is_file():
            rel = p.relative_to(path).as_posix()
            stat = p.stat()
            digest = hashlib.sha256(p.read_bytes()).hexdigest()
            snap[rel] = (stat.st_mtime_ns, digest)
    return snap


class GenerateUserSkillsTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.mkdtemp(prefix="psrr_r1_test_")
        self.addCleanup(shutil.rmtree, self.tmp, ignore_errors=True)
        self.tmp_path = Path(self.tmp)
        self.src = make_fixture_source_tree(self.tmp_path)
        self.out = self.tmp_path / "output"

    # ------------------------------------------------------------------
    # Fresh generation
    # ------------------------------------------------------------------
    def test_fresh_generation_into_empty_dir(self):
        manifest = gen.build_manifest(self.src, self.out)
        self.assertEqual(len(manifest.records), 3)

        plan = gen.compute_plan(manifest, self.out)
        self.assertEqual(len(plan.to_add), 3)
        self.assertEqual(plan.to_update, [])
        self.assertEqual(plan.to_delete, [])

        gen.apply_manifest(manifest, plan, self.out)

        produced = sorted(p.name for p in self.out.glob("USR-*.gov.md"))
        expected_names = sorted(manifest.file_contents.keys())
        self.assertEqual(produced, expected_names)
        self.assertEqual(len(produced), 3)

        # Content matches exactly what was computed.
        for name in expected_names:
            self.assertEqual(
                (self.out / name).read_text(encoding="utf-8"),
                manifest.file_contents[name],
            )

        index_text = (self.out / "INDEX.md").read_text(encoding="utf-8")
        exception_marker = (
            "Text Encoding Exception: preserves source-faithful Unicode "
            "from accepted skill metadata."
        )
        self.assertIn(exception_marker, index_text)
        for name in expected_names:
            self.assertIn(
                exception_marker,
                (self.out / name).read_text(encoding="utf-8"),
            )
        self.assertIn("**Total Skills:** 3", index_text)
        self.assertIn("Alpha Skill", index_text)
        self.assertIn("Beta Skill", index_text)
        self.assertIn("Gamma Skill", index_text)

    # ------------------------------------------------------------------
    # Stale cleanup
    # ------------------------------------------------------------------
    def test_stale_cleanup_removes_only_undesired_usr_files(self):
        self.out.mkdir(parents=True)
        stale1 = self.out / "USR-999_stale_one.gov.md"
        stale2 = self.out / "USR-998_stale_two.gov.md"
        stale1.write_text("stale content 1", encoding="utf-8")
        stale2.write_text("stale content 2", encoding="utf-8")

        manifest = gen.build_manifest(self.src, self.out)
        plan = gen.compute_plan(manifest, self.out)
        self.assertEqual(sorted(plan.to_delete), ["USR-998_stale_two.gov.md", "USR-999_stale_one.gov.md"])

        gen.apply_manifest(manifest, plan, self.out)

        self.assertFalse(stale1.exists())
        self.assertFalse(stale2.exists())
        remaining = sorted(p.name for p in self.out.glob("USR-*.gov.md"))
        self.assertEqual(remaining, sorted(manifest.file_contents.keys()))

    # ------------------------------------------------------------------
    # Unrelated-file preservation
    # ------------------------------------------------------------------
    def test_unrelated_file_preserved(self):
        self.out.mkdir(parents=True)
        unrelated = self.out / "README_local.txt"
        unrelated.write_text("do not touch me", encoding="utf-8")

        manifest = gen.build_manifest(self.src, self.out)
        plan = gen.compute_plan(manifest, self.out)
        gen.apply_manifest(manifest, plan, self.out)

        self.assertTrue(unrelated.exists())
        self.assertEqual(unrelated.read_text(encoding="utf-8"), "do not touch me")

    # ------------------------------------------------------------------
    # Dry-run / check perform no writes
    # ------------------------------------------------------------------
    def test_dry_run_performs_no_writes(self):
        self.out.mkdir(parents=True)
        seed = self.out / "USR-999_stale.gov.md"
        seed.write_text("seed", encoding="utf-8")

        before = dir_snapshot(self.out)
        with mock.patch.object(gen, "SKILL_LIBRARY_PATH", self.src):
            rc = gen.main(["--output-dir", str(self.out), "--dry-run"])
        self.assertEqual(rc, 0)
        after = dir_snapshot(self.out)
        self.assertEqual(before, after)

    def test_dry_run_and_check_no_writes_via_library_functions(self):
        self.out.mkdir(parents=True)
        seed = self.out / "USR-999_stale.gov.md"
        seed.write_text("seed", encoding="utf-8")

        before = dir_snapshot(self.out)

        manifest = gen.build_manifest(self.src, self.out)
        plan = gen.compute_plan(manifest, self.out)
        gen.print_plan(plan)  # dry-run print path; must not mutate anything
        self.assertTrue(plan.has_drift)

        after_dry_run = dir_snapshot(self.out)
        self.assertEqual(before, after_dry_run)

        # --check equivalent: just computing plan again, no apply.
        manifest2 = gen.build_manifest(self.src, self.out)
        plan2 = gen.compute_plan(manifest2, self.out)
        self.assertTrue(plan2.has_drift)
        after_check = dir_snapshot(self.out)
        self.assertEqual(before, after_check)

    def test_cli_dry_run_and_check_flags_no_writes(self):
        self.out.mkdir(parents=True)
        seed = self.out / "USR-999_stale.gov.md"
        seed.write_text("seed", encoding="utf-8")
        before = dir_snapshot(self.out)

        with mock.patch.object(gen, "SKILL_LIBRARY_PATH", self.src):
            rc = gen.main(["--output-dir", str(self.out), "--dry-run"])
            self.assertEqual(rc, 0)
            after = dir_snapshot(self.out)
            self.assertEqual(before, after)

            rc = gen.main(["--output-dir", str(self.out), "--check"])
            self.assertEqual(rc, 1)  # drift present (empty out vs 3 desired + stale)
            after2 = dir_snapshot(self.out)
            self.assertEqual(before, after2)

    # ------------------------------------------------------------------
    # Render failure before mutation
    # ------------------------------------------------------------------
    def test_render_failure_aborts_before_any_mutation(self):
        self.out.mkdir(parents=True)
        pre_existing = self.out / "USR-001_01_alpha.gov.md"
        pre_existing.write_text("pre-existing untouched content", encoding="utf-8")
        before = dir_snapshot(self.out)

        bad_file = self.src / "domain_a" / "02_beta.skill.md"
        original_read_text = Path.read_text

        def flaky_read_text(self_path, *args, **kwargs):
            if self_path == bad_file:
                raise UnicodeDecodeError("utf-8", b"\xff", 0, 1, "simulated decode failure")
            return original_read_text(self_path, *args, **kwargs)

        with mock.patch.object(Path, "read_text", flaky_read_text):
            with self.assertRaises(gen.SkillRenderError):
                gen.build_manifest(self.src, self.out)

        after = dir_snapshot(self.out)
        self.assertEqual(before, after)

        with mock.patch.object(gen, "SKILL_LIBRARY_PATH", self.src), \
             mock.patch.object(Path, "read_text", flaky_read_text):
            rc = gen.main(["--output-dir", str(self.out)])
            self.assertEqual(rc, 2)

        after_main = dir_snapshot(self.out)
        self.assertEqual(before, after_main)

    def test_atomic_write_replace_failure_preserves_target_and_cleans_temp(self):
        self.out.mkdir(parents=True)
        target = self.out / "USR-001_existing.gov.md"
        target.write_text("original bytes", encoding="utf-8")
        before = target.read_bytes()

        with mock.patch.object(gen.os, "replace", side_effect=OSError("simulated replace failure")):
            with self.assertRaises(OSError):
                gen._atomic_write(target, "replacement bytes")

        self.assertEqual(target.read_bytes(), before)
        self.assertEqual(list(self.out.glob(".*.tmp")), [])

    # ------------------------------------------------------------------
    # Deterministic ordering / content
    # ------------------------------------------------------------------
    def test_deterministic_rendering_across_independent_renders(self):
        manifest1 = gen.build_manifest(self.src, self.out)
        manifest2 = gen.build_manifest(self.src, self.out)

        self.assertEqual(manifest1.file_contents, manifest2.file_contents)
        self.assertEqual(manifest1.index_content, manifest2.index_content)
        self.assertEqual(
            [r.gov_filename for r in manifest1.records],
            [r.gov_filename for r in manifest2.records],
        )

        for content in [*manifest1.file_contents.values(), manifest1.index_content]:
            self.assertFalse(any(line.endswith(" ") for line in content.splitlines()))

    # ------------------------------------------------------------------
    # Second-apply idempotence
    # ------------------------------------------------------------------
    def test_second_apply_is_idempotent(self):
        manifest = gen.build_manifest(self.src, self.out)
        plan = gen.compute_plan(manifest, self.out)
        gen.apply_manifest(manifest, plan, self.out)

        after_first = dir_snapshot(self.out)
        # sha256 digests captured; mtimes may or may not change on rewrite,
        # so compare content-hash-only view separately.
        first_hashes = {k: v[1] for k, v in after_first.items()}

        manifest2 = gen.build_manifest(self.src, self.out)
        plan2 = gen.compute_plan(manifest2, self.out)
        self.assertFalse(plan2.has_drift)
        self.assertEqual(plan2.to_add, [])
        self.assertEqual(plan2.to_update, [])
        self.assertEqual(plan2.to_delete, [])
        self.assertFalse(plan2.index_changed)

        gen.apply_manifest(manifest2, plan2, self.out)
        after_second = dir_snapshot(self.out)
        second_hashes = {k: v[1] for k, v in after_second.items()}

        self.assertEqual(first_hashes, second_hashes)
        self.assertEqual(set(after_first.keys()), set(after_second.keys()))


if __name__ == "__main__":
    unittest.main()
