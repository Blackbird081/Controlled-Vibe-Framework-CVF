#!/usr/bin/env python3
"""
Negative and canary tests for check_template_skill_standard_guard_compat.py

Addresses assessment gap R1 (no negative tests) and R3 (no canary tests
proving surface-detection regexes match real repo paths).

Test categories:
  1. Marker violation detection (adversarial marker removal)
  2. Missing required file detection
  3. Silent intake detection (added surface without companion docs)
  4. Silent intake pass-through (added surface with companion docs)
  5. Canary: surface-detection regexes match real repo path patterns
  6. Canary: companion-doc regex matches real repo path patterns
  7. Parse helpers (name-status parser, has_add_or_rename)
"""

from __future__ import annotations

import importlib.util
import sys
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

MODULE_PATH = Path(__file__).resolve().with_name(
    "check_template_skill_standard_guard_compat.py"
)
SPEC = importlib.util.spec_from_file_location(
    "check_template_skill_standard_guard_compat", MODULE_PATH
)
if SPEC is None or SPEC.loader is None:
    raise RuntimeError(f"Unable to load module from {MODULE_PATH}")
MODULE = importlib.util.module_from_spec(SPEC)
sys.modules[SPEC.name] = MODULE
SPEC.loader.exec_module(MODULE)


# ---------------------------------------------------------------------------
# HELPER: seed a minimal compliant fake repo
# ---------------------------------------------------------------------------

# Build a lookup of markers required per file so we can seed them.
_REQUIRED_MARKERS: dict[str, tuple[str, ...]] = MODULE.REQUIRED_MARKERS  # type: ignore[attr-defined]
_REQUIRED_FILES: tuple[str, ...] = MODULE.REQUIRED_FILES  # type: ignore[attr-defined]


def _minimal_text_for(path: str) -> str:
    """Return the smallest text that contains every required marker for *path*."""
    markers = _REQUIRED_MARKERS.get(path, ())
    return "\n".join(markers) + "\n"


class _RepoMixin:
    """Mixin providing ``_write`` and ``_seed_compliant_repo``."""

    repo_root: Path

    def _write(self, rel_path: str, text: str) -> None:
        p = self.repo_root / rel_path
        p.parent.mkdir(parents=True, exist_ok=True)
        p.write_text(text, encoding="utf-8")

    def _seed_compliant_repo(self) -> None:
        """Create every required file with all its required marker strings."""
        for path in _REQUIRED_FILES:
            self._write(path, _minimal_text_for(path))


# ---------------------------------------------------------------------------
# TEST SUITE
# ---------------------------------------------------------------------------


class TestMarkerViolationDetection(_RepoMixin, unittest.TestCase):
    """R1-a: verify that deliberately removed markers are flagged."""

    def setUp(self) -> None:
        self.temp_dir = tempfile.TemporaryDirectory()
        self.repo_root = Path(self.temp_dir.name)

    def tearDown(self) -> None:
        self.temp_dir.cleanup()

    def test_compliant_repo_produces_no_violations(self) -> None:
        self._seed_compliant_repo()
        with patch.object(MODULE, "REPO_ROOT", self.repo_root):
            result = MODULE._classify({})
        self.assertEqual(result["missingFiles"], [])
        self.assertEqual(result["markerViolations"], {})
        self.assertEqual(result["silentIntakeViolations"], [])

    def test_guard_file_loses_gc044_marker(self) -> None:
        """Remove GC-044 from the guard file → must be detected."""
        self._seed_compliant_repo()
        guard_text = _minimal_text_for(MODULE.GUARD_PATH)
        self._write(MODULE.GUARD_PATH, guard_text.replace("GC-044", ""))
        with patch.object(MODULE, "REPO_ROOT", self.repo_root):
            result = MODULE._classify({})
        self.assertIn(MODULE.GUARD_PATH, result["markerViolations"])
        self.assertIn("GC-044", result["markerViolations"][MODULE.GUARD_PATH])

    def test_standard_file_loses_trusted_marker(self) -> None:
        """Remove TRUSTED_FOR_VALUE_PROOF from standard → detected."""
        self._seed_compliant_repo()
        std_text = _minimal_text_for(MODULE.STANDARD_PATH)
        self._write(
            MODULE.STANDARD_PATH,
            std_text.replace("TRUSTED_FOR_VALUE_PROOF", ""),
        )
        with patch.object(MODULE, "REPO_ROOT", self.repo_root):
            result = MODULE._classify({})
        self.assertIn(MODULE.STANDARD_PATH, result["markerViolations"])
        self.assertIn(
            "TRUSTED_FOR_VALUE_PROOF",
            result["markerViolations"][MODULE.STANDARD_PATH],
        )

    def test_handoff_loses_compat_script_marker(self) -> None:
        """Remove compat-script reference from handoff → detected."""
        self._seed_compliant_repo()
        handoff_text = _minimal_text_for(MODULE.HANDOFF_PATH)
        self._write(
            MODULE.HANDOFF_PATH,
            handoff_text.replace(MODULE.THIS_SCRIPT_PATH, ""),
        )
        with patch.object(MODULE, "REPO_ROOT", self.repo_root):
            result = MODULE._classify({})
        self.assertIn(MODULE.HANDOFF_PATH, result["markerViolations"])

    def test_master_policy_loses_guard_path_marker(self) -> None:
        """Remove guard path from master policy → detected."""
        self._seed_compliant_repo()
        policy_text = _minimal_text_for(MODULE.MASTER_POLICY_PATH)
        self._write(
            MODULE.MASTER_POLICY_PATH,
            policy_text.replace(MODULE.GUARD_PATH, ""),
        )
        with patch.object(MODULE, "REPO_ROOT", self.repo_root):
            result = MODULE._classify({})
        self.assertIn(MODULE.MASTER_POLICY_PATH, result["markerViolations"])

    def test_bootstrap_loses_trusted_marker(self) -> None:
        """Remove TRUSTED_FOR_VALUE_PROOF from bootstrap → detected."""
        self._seed_compliant_repo()
        text = _minimal_text_for(MODULE.BOOTSTRAP_PATH)
        self._write(
            MODULE.BOOTSTRAP_PATH,
            text.replace("TRUSTED_FOR_VALUE_PROOF", ""),
        )
        with patch.object(MODULE, "REPO_ROOT", self.repo_root):
            result = MODULE._classify({})
        self.assertIn(MODULE.BOOTSTRAP_PATH, result["markerViolations"])


class TestMissingFileDetection(_RepoMixin, unittest.TestCase):
    """R1-b: verify that deleting a required file triggers missingFiles."""

    def setUp(self) -> None:
        self.temp_dir = tempfile.TemporaryDirectory()
        self.repo_root = Path(self.temp_dir.name)

    def tearDown(self) -> None:
        self.temp_dir.cleanup()

    def test_missing_guard_file_detected(self) -> None:
        self._seed_compliant_repo()
        (self.repo_root / MODULE.GUARD_PATH).unlink()
        with patch.object(MODULE, "REPO_ROOT", self.repo_root):
            result = MODULE._classify({})
        self.assertIn(MODULE.GUARD_PATH, result["missingFiles"])

    def test_missing_standard_file_detected(self) -> None:
        self._seed_compliant_repo()
        (self.repo_root / MODULE.STANDARD_PATH).unlink()
        with patch.object(MODULE, "REPO_ROOT", self.repo_root):
            result = MODULE._classify({})
        self.assertIn(MODULE.STANDARD_PATH, result["missingFiles"])

    def test_missing_workflow_file_detected(self) -> None:
        self._seed_compliant_repo()
        (self.repo_root / MODULE.WORKFLOW_PATH).unlink()
        with patch.object(MODULE, "REPO_ROOT", self.repo_root):
            result = MODULE._classify({})
        self.assertIn(MODULE.WORKFLOW_PATH, result["missingFiles"])


class TestSilentIntakeDetection(_RepoMixin, unittest.TestCase):
    """R1-c: verify that added skill/template surfaces without companion docs
    trigger silentIntakeViolations."""

    def setUp(self) -> None:
        self.temp_dir = tempfile.TemporaryDirectory()
        self.repo_root = Path(self.temp_dir.name)

    def tearDown(self) -> None:
        self.temp_dir.cleanup()

    def test_added_skill_without_companion_doc(self) -> None:
        """Add a .skill.md file with no companion doc in batch → violation."""
        self._seed_compliant_repo()
        fake_changed: dict[str, set[str]] = {
            "EXTENSIONS/CVF_v1.5.2_SKILL_LIBRARY_FOR_END_USERS/new_thing.skill.md": {"A"},
        }
        with patch.object(MODULE, "REPO_ROOT", self.repo_root):
            result = MODULE._classify(fake_changed)
        self.assertEqual(len(result["silentIntakeViolations"]), 1)
        self.assertIn(
            "EXTENSIONS/CVF_v1.5.2_SKILL_LIBRARY_FOR_END_USERS/new_thing.skill.md",
            result["silentIntakeViolations"],
        )

    def test_added_template_without_companion_doc(self) -> None:
        """Add a template .ts file with no companion doc in batch → violation."""
        self._seed_compliant_repo()
        fake_changed: dict[str, set[str]] = {
            "EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/lib/templates/new_template.ts": {"A"},
        }
        with patch.object(MODULE, "REPO_ROOT", self.repo_root):
            result = MODULE._classify(fake_changed)
        self.assertEqual(len(result["silentIntakeViolations"]), 1)

    def test_added_wizard_without_companion_doc(self) -> None:
        """Add a Wizard component with no companion doc → violation."""
        self._seed_compliant_repo()
        fake_changed: dict[str, set[str]] = {
            "EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/components/NewWizard.tsx": {"A"},
        }
        with patch.object(MODULE, "REPO_ROOT", self.repo_root):
            result = MODULE._classify(fake_changed)
        self.assertEqual(len(result["silentIntakeViolations"]), 1)

    def test_added_skill_with_companion_doc_passes(self) -> None:
        """Add a .skill.md file WITH a companion doc → no violation."""
        self._seed_compliant_repo()
        fake_changed: dict[str, set[str]] = {
            "EXTENSIONS/CVF_v1.5.2_SKILL_LIBRARY_FOR_END_USERS/new_thing.skill.md": {"A"},
            "docs/assessments/CVF_NEW_SKILL_INTAKE_ASSESSMENT_2026-04-15.md": {"A"},
        }
        with patch.object(MODULE, "REPO_ROOT", self.repo_root):
            result = MODULE._classify(fake_changed)
        self.assertEqual(result["silentIntakeViolations"], [])

    def test_added_skill_with_known_standard_as_companion_passes(self) -> None:
        """Companion doc = the canonical standard file itself → allowed."""
        self._seed_compliant_repo()
        fake_changed: dict[str, set[str]] = {
            "EXTENSIONS/CVF_v1.5.2_SKILL_LIBRARY_FOR_END_USERS/new_thing.skill.md": {"A"},
            MODULE.STANDARD_PATH: {"M"},
        }
        with patch.object(MODULE, "REPO_ROOT", self.repo_root):
            result = MODULE._classify(fake_changed)
        self.assertEqual(result["silentIntakeViolations"], [])

    def test_modified_skill_does_not_trigger_silent_intake(self) -> None:
        """Modifying (not adding) a skill → no silent intake check needed."""
        self._seed_compliant_repo()
        fake_changed: dict[str, set[str]] = {
            "EXTENSIONS/CVF_v1.5.2_SKILL_LIBRARY_FOR_END_USERS/existing.skill.md": {"M"},
        }
        with patch.object(MODULE, "REPO_ROOT", self.repo_root):
            result = MODULE._classify(fake_changed)
        self.assertEqual(result["addedSurfaces"], [])
        self.assertEqual(result["silentIntakeViolations"], [])

    def test_renamed_skill_triggers_silent_intake_check(self) -> None:
        """Renamed surface should trigger the add-or-rename path."""
        self._seed_compliant_repo()
        fake_changed: dict[str, set[str]] = {
            "EXTENSIONS/CVF_v1.5.2_SKILL_LIBRARY_FOR_END_USERS/renamed.skill.md": {"R100"},
        }
        with patch.object(MODULE, "REPO_ROOT", self.repo_root):
            result = MODULE._classify(fake_changed)
        self.assertEqual(len(result["addedSurfaces"]), 1)
        # No companion doc → violation
        self.assertEqual(len(result["silentIntakeViolations"]), 1)


class TestCanarySurfaceRegexes(unittest.TestCase):
    """R3: verify that the surface-detection regexes match realistic repo paths."""

    def test_skill_surface_regex_matches_real_pattern(self) -> None:
        paths = [
            "EXTENSIONS/CVF_v1.5.2_SKILL_LIBRARY_FOR_END_USERS/business_plan.skill.md",
            "EXTENSIONS/CVF_v1.5.2_SKILL_LIBRARY_FOR_END_USERS/risk_assessment.skill.md",
            "EXTENSIONS/CVF_v1.5.2_SKILL_LIBRARY_FOR_END_USERS/nested/deep.skill.md",
        ]
        for p in paths:
            with self.subTest(path=p):
                self.assertIsNotNone(
                    MODULE.SKILL_SURFACE_RE.match(p),
                    f"SKILL_SURFACE_RE should match {p}",
                )

    def test_skill_surface_regex_rejects_non_skill(self) -> None:
        non_matches = [
            "EXTENSIONS/CVF_v1.5.2_SKILL_LIBRARY_FOR_END_USERS/README.md",
            "EXTENSIONS/CVF_v1.5.2_SKILL_LIBRARY_FOR_END_USERS/notes.txt",
            "governance/toolkit/some.skill.md",
            "docs/reference/some.skill.md",
        ]
        for p in non_matches:
            with self.subTest(path=p):
                self.assertIsNone(
                    MODULE.SKILL_SURFACE_RE.match(p),
                    f"SKILL_SURFACE_RE should NOT match {p}",
                )

    def test_template_surface_regex_matches_real_patterns(self) -> None:
        paths = [
            "EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/lib/templates/business-plan.ts",
            "EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/lib/templates/nested/index.ts",
            "EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/components/AppWizard.tsx",
            "EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/components/TemplateWizard.tsx",
        ]
        for p in paths:
            with self.subTest(path=p):
                self.assertIsNotNone(
                    MODULE.TEMPLATE_SURFACE_RE.match(p),
                    f"TEMPLATE_SURFACE_RE should match {p}",
                )

    def test_template_surface_regex_rejects_non_template(self) -> None:
        non_matches = [
            "EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/lib/utils.ts",
            "EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/components/Button.tsx",
            "EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/components/NotAWizard.ts",
            "EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/app/page.tsx",
        ]
        for p in non_matches:
            with self.subTest(path=p):
                self.assertIsNone(
                    MODULE.TEMPLATE_SURFACE_RE.match(p),
                    f"TEMPLATE_SURFACE_RE should NOT match {p}",
                )

    def test_companion_doc_regex_matches_real_patterns(self) -> None:
        """Paths where the keyword appears late enough that greedy .+ still
        leaves it for the keyword group to match."""
        paths = [
            "docs/roadmaps/CVF_TEMPLATE_SKILL_CORPUS_RESCREEN_ROADMAP_2026-04-14.md",
            "docs/assessments/CVF_NEW_SKILL_INTAKE_ASSESSMENT_2026-04-15.md",
            "docs/reviews/CVF_CORPUS_RESCREEN_REVIEW_2026-04-15.md",
            "docs/reference/CVF_WHATEVER_RESCREEN_STUFF_2026-04-15.md",
        ]
        for p in paths:
            with self.subTest(path=p):
                self.assertIsNotNone(
                    MODULE.COMPANION_DOC_RE.match(p),
                    f"COMPANION_DOC_RE should match {p}",
                )

    def test_companion_doc_regex_known_gap_greedy_prefix(self) -> None:
        """KNOWN GAP (R4): The greedy `.+` before the keyword group in
        COMPANION_DOC_RE can consume the keyword itself when the keyword
        appears early in the filename and the remaining suffix does not
        contain another keyword.

        Example: CVF_NON_CODER_VALUE_BASELINE_2026-04-15.md
          - `.+` consumes `NON_CODER_VALUE_BASELINE_2026-04-15`
          - backtracking leaves `_BASELINE_2026-04-15` which contains no keyword
          - match fails even though the filename clearly relates to NON_CODER_VALUE

        Fix: change `CVF_.+(<keywords>)` to `CVF_.*(<keywords>)` or use
        a non-greedy quantifier `CVF_.+?(<keywords>)`.

        This test documents the gap without fixing it, so the rebuttal agent
        can decide whether to fix the regex or accept the limitation.
        """
        # These paths SHOULD match conceptually but DO NOT due to greedy .+
        gap_paths = [
            "docs/baselines/CVF_NON_CODER_VALUE_BASELINE_2026-04-15.md",
            "docs/reference/CVF_TEMPLATE_OUTPUT_QUALITY_STANDARD_2026-04-15.md",
        ]
        for p in gap_paths:
            with self.subTest(path=p):
                self.assertIsNone(
                    MODULE.COMPANION_DOC_RE.match(p),
                    f"KNOWN GAP: greedy .+ consumes keyword for {p} — "
                    "if this starts passing, the regex was fixed and this test "
                    "should be moved to the positive match set",
                )

    def test_companion_doc_regex_rejects_non_governed(self) -> None:
        non_matches = [
            "docs/roadmaps/CVF_SOME_RANDOM_ROADMAP_2026-04-15.md",
            "docs/assessments/CVF_PERFORMANCE_ASSESSMENT_2026-04-15.md",
            "docs/INDEX.md",
            "README.md",
            "governance/toolkit/05_OPERATION/CVF_SOMETHING_SKILL.md",
        ]
        for p in non_matches:
            with self.subTest(path=p):
                self.assertIsNone(
                    MODULE.COMPANION_DOC_RE.match(p),
                    f"COMPANION_DOC_RE should NOT match {p}",
                )


class TestParseHelpers(unittest.TestCase):
    """Verify the git-output parse functions used by the gate."""

    def test_parse_name_status_add(self) -> None:
        output = "A\tsome/new/file.md"
        result = MODULE._parse_name_status_output(output)
        self.assertIn("some/new/file.md", result)
        self.assertIn("A", result["some/new/file.md"])

    def test_parse_name_status_rename(self) -> None:
        output = "R100\told/path.md\tnew/path.md"
        result = MODULE._parse_name_status_output(output)
        self.assertIn("new/path.md", result)
        self.assertIn("R100", result["new/path.md"])
        self.assertNotIn("old/path.md", result)

    def test_parse_name_status_modify(self) -> None:
        output = "M\texisting/file.md"
        result = MODULE._parse_name_status_output(output)
        self.assertIn("existing/file.md", result)
        self.assertIn("M", result["existing/file.md"])

    def test_parse_name_status_skips_empty_lines(self) -> None:
        output = "\n\nA\tfile.md\n\n"
        result = MODULE._parse_name_status_output(output)
        self.assertEqual(len(result), 1)

    def test_parse_name_status_normalizes_backslash(self) -> None:
        output = "A\tsome\\windows\\path.md"
        result = MODULE._parse_name_status_output(output)
        self.assertIn("some/windows/path.md", result)

    def test_has_add_or_rename_true_for_add(self) -> None:
        self.assertTrue(MODULE._has_add_or_rename({"A"}))

    def test_has_add_or_rename_true_for_rename(self) -> None:
        self.assertTrue(MODULE._has_add_or_rename({"R100"}))

    def test_has_add_or_rename_true_for_copy(self) -> None:
        self.assertTrue(MODULE._has_add_or_rename({"C100"}))

    def test_has_add_or_rename_false_for_modify(self) -> None:
        self.assertFalse(MODULE._has_add_or_rename({"M"}))

    def test_has_add_or_rename_false_for_delete(self) -> None:
        self.assertFalse(MODULE._has_add_or_rename({"D"}))


class TestMultipleSurfacesInOneBatch(_RepoMixin, unittest.TestCase):
    """R1-d: complex batch scenarios."""

    def setUp(self) -> None:
        self.temp_dir = tempfile.TemporaryDirectory()
        self.repo_root = Path(self.temp_dir.name)

    def tearDown(self) -> None:
        self.temp_dir.cleanup()

    def test_multiple_skills_added_one_companion_doc_passes(self) -> None:
        """Multiple new surfaces + at least one companion doc → no violation."""
        self._seed_compliant_repo()
        fake_changed: dict[str, set[str]] = {
            "EXTENSIONS/CVF_v1.5.2_SKILL_LIBRARY_FOR_END_USERS/skill_a.skill.md": {"A"},
            "EXTENSIONS/CVF_v1.5.2_SKILL_LIBRARY_FOR_END_USERS/skill_b.skill.md": {"A"},
            "docs/assessments/CVF_BATCH_SKILL_INTAKE_ASSESSMENT_2026-04-15.md": {"A"},
        }
        with patch.object(MODULE, "REPO_ROOT", self.repo_root):
            result = MODULE._classify(fake_changed)
        self.assertEqual(len(result["addedSurfaces"]), 2)
        self.assertEqual(result["silentIntakeViolations"], [])

    def test_mixed_surfaces_no_companion_all_flagged(self) -> None:
        """Skill + template added without companion → both flagged."""
        self._seed_compliant_repo()
        fake_changed: dict[str, set[str]] = {
            "EXTENSIONS/CVF_v1.5.2_SKILL_LIBRARY_FOR_END_USERS/skill_a.skill.md": {"A"},
            "EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/lib/templates/new.ts": {"A"},
        }
        with patch.object(MODULE, "REPO_ROOT", self.repo_root):
            result = MODULE._classify(fake_changed)
        self.assertEqual(len(result["silentIntakeViolations"]), 2)


if __name__ == "__main__":
    unittest.main()
