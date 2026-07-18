#!/usr/bin/env python3
"""Tests for check_absorption_blindspot_control_presence.py (ADIF-0014)."""

from __future__ import annotations

import sys
import tempfile
import textwrap
import unittest
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(REPO_ROOT / "governance" / "compat"))

import check_absorption_blindspot_control_presence as checker


ENTRY_CONTROL_BLOCK_TEXT = textwrap.dedent("""\
## External Repository Absorption Entry Control

- Source type: legacy mirror
- Upstream or source-mirror disposition: N/A, retained legacy folder only
- Enumeration or manifest plan: filesystem-backed direct reads
- Per-file terminal-ledger plan: inline Source Verification Block
- Owner or overlap route: existing CVF owner surface
- Value-disposition route: ADAPT existing owners
- Claim boundary: entry hardening only; no absorption performed
""")

ARTIFACT_WITH_ALL_THREE_BLOCKS = textwrap.dedent(f"""\
# Test Artifact With All Three Blocks

Some content here.

## Mandatory Blind-Spot Control Block

- Gate 1: source enumerated
- Blind-spot verdict: CLEAR

## Corpus Completeness And Report Integrity

- Corpus task class: test
- Corpus verdict: COMPLETE_VERIFIED

{ENTRY_CONTROL_BLOCK_TEXT}
## After Section

More content.
""")

# Legacy two-block-only fixture, preserved verbatim under its original name
# for the backward-compatibility test class below. Since R95, an artifact
# carrying only the two original blocks (with no entry-control heading, no
# allowed disposition, and no comparison-only marker) now also raises
# MISSING_ENTRY_CONTROL_BLOCK; this is the intended R95 hardening, not a
# regression, and is asserted explicitly in TestBackwardCompatibility below.
ARTIFACT_WITH_BOTH_BLOCKS = textwrap.dedent("""\
# Test Artifact With Both Blocks

Some content here.

## Mandatory Blind-Spot Control Block

- Gate 1: source enumerated
- Blind-spot verdict: CLEAR

## Corpus Completeness And Report Integrity

- Corpus task class: test
- Corpus verdict: COMPLETE_VERIFIED

## After Section

More content.
""")

ARTIFACT_MISSING_BOTH_BLOCKS = textwrap.dedent("""\
# Test Artifact Missing Both Blocks

Some content here without control blocks.

## Some Other Section

Content.
""")

ARTIFACT_WITH_ALLOWED_DISPOSITION = textwrap.dedent("""\
# Test Artifact With Allowed Disposition

## Mandatory Blind-Spot Control Block

NOT_APPLICABLE_WITH_REASON: this artifact does not absorb legacy content.

## Corpus Completeness And Report Integrity

NOT_APPLICABLE_WITH_REASON: no corpus inventory in scope.

## External Repository Absorption Entry Control

NOT_APPLICABLE_WITH_REASON: this artifact does not absorb legacy content.

## After Section

More content.
""")

ARTIFACT_WITH_BLIND_SPOT_ONLY = textwrap.dedent("""\
# Test Artifact With Blind-Spot Only

## Mandatory Blind-Spot Control Block

- Gate 1: source enumerated
- Blind-spot verdict: CLEAR

## Other Section

Content.
""")

ARTIFACT_WITH_COMPARISON_ONLY_DISPOSITION = textwrap.dedent("""\
# Test Artifact With Comparison-Only Disposition

References `.private_reference/legacy/old_framework/README.md` for
side-by-side comparison only.

## Mandatory Blind-Spot Control Block

NOT_APPLICABLE_WITH_REASON: comparison only, no absorption performed.

## Corpus Completeness And Report Integrity

NOT_APPLICABLE_WITH_REASON: comparison only, no absorption performed.

## External Repository Absorption Entry Control

COMPARISON_ONLY_NO_ABSORPTION: this artifact cites the legacy path purely to
compare wording; no absorption, adaptation, or import is planned or claimed.

## After Section

More content.
""")

ARTIFACT_WITH_ENTRY_CONTROL_MISSING_FIELDS = textwrap.dedent("""\
# Test Artifact With Entry Control Missing Fields

References `.private_reference/source_mirrors/example__repo/`.

## Mandatory Blind-Spot Control Block

- Gate 1: source enumerated
- Blind-spot verdict: CLEAR

## Corpus Completeness And Report Integrity

- Corpus task class: test
- Corpus verdict: COMPLETE_VERIFIED

## External Repository Absorption Entry Control

- Source type: source mirror
- Claim boundary: entry hardening only

## After Section

More content.
""")


class TestArtifactReferencesAbsorptionSource(unittest.TestCase):
    """Tests for the content-based absorption source trigger.

    The real scenario is: a changed governed artifact *contains text* that
    references ``.private_reference/legacy/`` or ``.private_reference/external_repos/``
    paths, while no private file is in the git diff.  The checker must scan
    artifact content, not changed paths.
    """

    def test_returns_true_for_artifact_citing_legacy_path(self):
        with tempfile.NamedTemporaryFile(mode="w", suffix=".md", delete=False) as f:
            f.write("# Test\n\nReferences `.private_reference/legacy/old.md` here.\n")
            f.flush()
            result = checker._artifact_references_absorption_source(f.name)
        Path(f.name).unlink()
        self.assertTrue(result)

    def test_returns_true_for_artifact_citing_external_repos_path(self):
        with tempfile.NamedTemporaryFile(mode="w", suffix=".md", delete=False) as f:
            f.write("# Test\n\nSee .private_reference/external_repos/agent-skills/README.md\n")
            f.flush()
            result = checker._artifact_references_absorption_source(f.name)
        Path(f.name).unlink()
        self.assertTrue(result)

    def test_returns_false_for_artifact_without_absorption_references(self):
        with tempfile.NamedTemporaryFile(mode="w", suffix=".md", delete=False) as f:
            f.write("# Test\n\nSome unrelated content.\n")
            f.flush()
            result = checker._artifact_references_absorption_source(f.name)
        Path(f.name).unlink()
        self.assertFalse(result)

    def test_returns_false_for_unreadable_file(self):
        result = checker._artifact_references_absorption_source("nonexistent/file.md")
        self.assertFalse(result)

    def test_returns_true_for_artifact_citing_source_mirror_path(self):
        with tempfile.NamedTemporaryFile(mode="w", suffix=".md", delete=False) as f:
            f.write(
                "# Test\n\nSee `.private_reference/source_mirrors/example__repo/`.\n"
            )
            f.flush()
            result = checker._artifact_references_absorption_source(f.name)
        Path(f.name).unlink()
        self.assertTrue(result)

    def test_returns_true_for_explicit_external_repository_absorption_language(self):
        with tempfile.NamedTemporaryFile(mode="w", suffix=".md", delete=False) as f:
            f.write(
                "# Test\n\nThis work order authorizes external repository "
                "absorption of a new upstream project.\n"
            )
            f.flush()
            result = checker._artifact_references_absorption_source(f.name)
        Path(f.name).unlink()
        self.assertTrue(result)

    def test_returns_true_for_copied_folder_absorption_language(self):
        with tempfile.NamedTemporaryFile(mode="w", suffix=".md", delete=False) as f:
            f.write(
                "# Test\n\nThis review documents a copied folder absorption "
                "outcome.\n"
            )
            f.flush()
            result = checker._artifact_references_absorption_source(f.name)
        Path(f.name).unlink()
        self.assertTrue(result)

    def test_returns_true_for_canonical_external_repo_or_copied_folder_phrase(self):
        with tempfile.NamedTemporaryFile(mode="w", suffix=".md", delete=False) as f:
            f.write(
                "# Test\n\nInput type: external repo or copied folder.\n"
            )
            f.flush()
            result = checker._artifact_references_absorption_source(f.name)
        Path(f.name).unlink()
        self.assertTrue(result)

    def test_returns_false_for_bare_word_repo_without_bounded_phrase(self):
        """Generic bare words such as 'repo' must not trigger the checker;
        only exact source paths or bounded multi-word intake phrases may."""
        with tempfile.NamedTemporaryFile(mode="w", suffix=".md", delete=False) as f:
            f.write(
                "# Test\n\nThis repo has a README and a CI config; nothing "
                "external is mentioned.\n"
            )
            f.flush()
            result = checker._artifact_references_absorption_source(f.name)
        Path(f.name).unlink()
        self.assertFalse(result)

    def test_returns_false_for_unrelated_prose_mentioning_folder_and_copied(self):
        """Unrelated prose using 'copied' and 'folder' separately, not as the
        bounded phrase, must not false-trigger."""
        with tempfile.NamedTemporaryFile(mode="w", suffix=".md", delete=False) as f:
            f.write(
                "# Test\n\nThe build output was copied into the release "
                "folder before packaging.\n"
            )
            f.flush()
            result = checker._artifact_references_absorption_source(f.name)
        Path(f.name).unlink()
        self.assertFalse(result)

    def test_trigger_is_case_insensitive_for_explicit_intake_language(self):
        with tempfile.NamedTemporaryFile(mode="w", suffix=".md", delete=False) as f:
            f.write(
                "# Test\n\nEXTERNAL REPOSITORY ABSORPTION is planned next "
                "quarter.\n"
            )
            f.flush()
            result = checker._artifact_references_absorption_source(f.name)
        Path(f.name).unlink()
        self.assertTrue(result)


class TestIntegrationContentTrigger(unittest.TestCase):
    """Integration test: a governed artifact cites absorption source paths in
    its text but no private file is changed.  The checker must still fire."""

    def test_governed_artifact_with_absorption_reference_missing_blocks(self):
        """A work-order-like artifact references .private_reference/legacy/
        but omits all three required blocks.  _check_artifact must report
        violations for all three."""
        artifact = textwrap.dedent("""\
        # Work Order Touching Legacy Source

        This work order authorizes absorption from
        `.private_reference/legacy/old_framework/README.md`.

        ## Some Other Section

        Content without control blocks.
        """)
        with tempfile.NamedTemporaryFile(mode="w", suffix=".md", delete=False) as f:
            f.write(artifact)
            f.flush()
            violations = checker._check_artifact(f.name)
        Path(f.name).unlink()
        self.assertEqual(len(violations), 3)
        types = {v["type"] for v in violations}
        self.assertIn("MISSING_BLIND_SPOT_CONTROL_BLOCK", types)
        self.assertIn("MISSING_CORPUS_COMPLETENESS_BLOCK", types)
        self.assertIn("MISSING_ENTRY_CONTROL_BLOCK", types)

    def test_governed_artifact_with_absorption_reference_and_blocks_passes(self):
        """A work-order-like artifact references .private_reference/legacy/
        and carries all three required blocks.  No violations."""
        artifact = textwrap.dedent(f"""\
        # Work Order Touching Legacy Source

        This work order authorizes absorption from
        `.private_reference/legacy/old_framework/README.md`.

        ## Mandatory Blind-Spot Control Block

        - Gate 1: source enumerated
        - Blind-spot verdict: CLEAR

        ## Corpus Completeness And Report Integrity

        - Corpus task class: test
        - Corpus verdict: COMPLETE_VERIFIED

        {ENTRY_CONTROL_BLOCK_TEXT}
        ## After Section

        Content.
        """)
        with tempfile.NamedTemporaryFile(mode="w", suffix=".md", delete=False) as f:
            f.write(artifact)
            f.flush()
            violations = checker._check_artifact(f.name)
        Path(f.name).unlink()
        self.assertEqual(violations, [])

    def test_governed_artifact_with_absorption_reference_and_na_disposition_passes(self):
        """A work-order-like artifact references .private_reference/external_repos/
        and carries all three required blocks with N/A dispositions.  No
        violations."""
        artifact = textwrap.dedent("""\
        # Work Order Touching External Repo

        This work order references
        `.private_reference/external_repos/agent-skills/README.md`.

        ## Mandatory Blind-Spot Control Block

        NOT_APPLICABLE_WITH_REASON: no legacy content absorbed.

        ## Corpus Completeness And Report Integrity

        NOT_APPLICABLE_WITH_REASON: no corpus inventory in scope.

        ## External Repository Absorption Entry Control

        NOT_APPLICABLE_WITH_REASON: no legacy content absorbed.

        ## After Section

        Content.
        """)
        with tempfile.NamedTemporaryFile(mode="w", suffix=".md", delete=False) as f:
            f.write(artifact)
            f.flush()
            violations = checker._check_artifact(f.name)
        Path(f.name).unlink()
        self.assertEqual(violations, [])

    def test_governed_artifact_citing_source_mirror_missing_entry_control(self):
        """A governed artifact citing .private_reference/source_mirrors/ with
        the two legacy blocks but no entry-control block must report exactly
        one MISSING_ENTRY_CONTROL_BLOCK violation."""
        artifact = textwrap.dedent("""\
        # Work Order Touching Source Mirror

        See `.private_reference/source_mirrors/example__repo/README.md`.

        ## Mandatory Blind-Spot Control Block

        - Gate 1: source enumerated
        - Blind-spot verdict: CLEAR

        ## Corpus Completeness And Report Integrity

        - Corpus task class: test
        - Corpus verdict: COMPLETE_VERIFIED

        ## After Section

        Content.
        """)
        with tempfile.NamedTemporaryFile(mode="w", suffix=".md", delete=False) as f:
            f.write(artifact)
            f.flush()
            violations = checker._check_artifact(f.name)
        Path(f.name).unlink()
        self.assertEqual(len(violations), 1)
        self.assertEqual(violations[0]["type"], "MISSING_ENTRY_CONTROL_BLOCK")

    def test_governed_artifact_with_explicit_intake_language_and_all_blocks_passes(self):
        """A governed artifact using bounded explicit intake language (no
        .private_reference path at all) and carrying all three blocks
        passes."""
        artifact = textwrap.dedent(f"""\
        # Work Order Planning External Repository Absorption

        This work order plans external repository absorption of a new
        upstream project.

        ## Mandatory Blind-Spot Control Block

        - Gate 1: source enumerated
        - Blind-spot verdict: CLEAR

        ## Corpus Completeness And Report Integrity

        - Corpus task class: test
        - Corpus verdict: COMPLETE_VERIFIED

        {ENTRY_CONTROL_BLOCK_TEXT}
        ## After Section

        Content.
        """)
        with tempfile.NamedTemporaryFile(mode="w", suffix=".md", delete=False) as f:
            f.write(artifact)
            f.flush()
            violations = checker._check_artifact(f.name)
        Path(f.name).unlink()
        self.assertEqual(violations, [])

    def test_governed_artifact_with_comparison_only_disposition_passes(self):
        """A governed artifact citing a legacy path purely for wording
        comparison may use the narrow COMPARISON_ONLY_NO_ABSORPTION
        disposition inside the entry-control heading instead of the full
        entry-control field set."""
        with tempfile.NamedTemporaryFile(mode="w", suffix=".md", delete=False) as f:
            f.write(ARTIFACT_WITH_COMPARISON_ONLY_DISPOSITION)
            f.flush()
            violations = checker._check_artifact(f.name)
        Path(f.name).unlink()
        self.assertEqual(violations, [])

    def test_governed_artifact_with_entry_control_missing_required_fields(self):
        """An entry-control block that is present but omits required fields
        raises INCOMPLETE_ENTRY_CONTROL_BLOCK, not MISSING_ENTRY_CONTROL_BLOCK."""
        with tempfile.NamedTemporaryFile(mode="w", suffix=".md", delete=False) as f:
            f.write(ARTIFACT_WITH_ENTRY_CONTROL_MISSING_FIELDS)
            f.flush()
            violations = checker._check_artifact(f.name)
        Path(f.name).unlink()
        self.assertEqual(len(violations), 1)
        self.assertEqual(violations[0]["type"], "INCOMPLETE_ENTRY_CONTROL_BLOCK")
        self.assertIn("Upstream or source-mirror disposition", violations[0]["message"])
        self.assertIn("Enumeration or manifest plan", violations[0]["message"])


class TestIsGovernedArtifact(unittest.TestCase):
    def test_work_order_is_governed(self):
        self.assertTrue(checker._is_governed_artifact(
            "docs/work_orders/CVF_AGENT_WORK_ORDER_TEST.md"
        ))

    def test_baseline_is_governed(self):
        self.assertTrue(checker._is_governed_artifact(
            "docs/baselines/CVF_GC018_TEST.md"
        ))

    def test_review_is_governed(self):
        self.assertTrue(checker._is_governed_artifact(
            "docs/reviews/CVF_TEST_REVIEW.md"
        ))

    def test_archive_path_is_not_governed(self):
        self.assertFalse(checker._is_governed_artifact(
            "docs/reviews/archive/CVF_OLD_REVIEW.md"
        ))

    def test_non_markdown_is_not_governed(self):
        self.assertFalse(checker._is_governed_artifact(
            "governance/compat/check_something.py"
        ))

    def test_random_path_is_not_governed(self):
        self.assertFalse(checker._is_governed_artifact(
            "EXTENSIONS/some_file.ts"
        ))


class TestCheckArtifact(unittest.TestCase):
    def test_artifact_with_all_three_blocks_passes(self):
        with tempfile.NamedTemporaryFile(mode="w", suffix=".md", delete=False) as f:
            f.write(ARTIFACT_WITH_ALL_THREE_BLOCKS)
            f.flush()
            violations = checker._check_artifact(f.name)
        Path(f.name).unlink()
        self.assertEqual(violations, [])

    def test_artifact_missing_all_blocks_fails(self):
        with tempfile.NamedTemporaryFile(mode="w", suffix=".md", delete=False) as f:
            f.write(ARTIFACT_MISSING_BOTH_BLOCKS)
            f.flush()
            violations = checker._check_artifact(f.name)
        Path(f.name).unlink()
        self.assertEqual(len(violations), 3)
        types = {v["type"] for v in violations}
        self.assertIn("MISSING_BLIND_SPOT_CONTROL_BLOCK", types)
        self.assertIn("MISSING_CORPUS_COMPLETENESS_BLOCK", types)
        self.assertIn("MISSING_ENTRY_CONTROL_BLOCK", types)

    def test_artifact_with_allowed_disposition_passes(self):
        with tempfile.NamedTemporaryFile(mode="w", suffix=".md", delete=False) as f:
            f.write(ARTIFACT_WITH_ALLOWED_DISPOSITION)
            f.flush()
            violations = checker._check_artifact(f.name)
        Path(f.name).unlink()
        self.assertEqual(violations, [])

    def test_artifact_with_blind_spot_only_fails_for_corpus_and_entry_control(self):
        with tempfile.NamedTemporaryFile(mode="w", suffix=".md", delete=False) as f:
            f.write(ARTIFACT_WITH_BLIND_SPOT_ONLY)
            f.flush()
            violations = checker._check_artifact(f.name)
        Path(f.name).unlink()
        self.assertEqual(len(violations), 2)
        types = {v["type"] for v in violations}
        self.assertIn("MISSING_CORPUS_COMPLETENESS_BLOCK", types)
        self.assertIn("MISSING_ENTRY_CONTROL_BLOCK", types)


class TestBackwardCompatibility(unittest.TestCase):
    """Pre-R95 artifacts that only ever carried the two original ADIF-0014
    blocks must be recognized correctly under the extended checker: the two
    original violation/pass semantics remain exactly as before, and the new
    third block is additive, not a silent replacement of old behavior."""

    def test_legacy_two_block_fixture_now_also_needs_entry_control(self):
        """ARTIFACT_WITH_BOTH_BLOCKS (the original pre-R95 fixture, byte-for-byte
        unchanged) used to pass with zero violations. Under R95 it now raises
        exactly one MISSING_ENTRY_CONTROL_BLOCK violation and nothing else -
        proving the original two-block detection logic is untouched and only
        the new third requirement was added on top."""
        with tempfile.NamedTemporaryFile(mode="w", suffix=".md", delete=False) as f:
            f.write(ARTIFACT_WITH_BOTH_BLOCKS)
            f.flush()
            violations = checker._check_artifact(f.name)
        Path(f.name).unlink()
        self.assertEqual(len(violations), 1)
        self.assertEqual(violations[0]["type"], "MISSING_ENTRY_CONTROL_BLOCK")

    def test_legacy_missing_both_blocks_fixture_reports_original_two_plus_new_one(self):
        """ARTIFACT_MISSING_BOTH_BLOCKS still reports the original two
        violation types, plus the new third one; the original two are
        unchanged in type and message shape."""
        with tempfile.NamedTemporaryFile(mode="w", suffix=".md", delete=False) as f:
            f.write(ARTIFACT_MISSING_BOTH_BLOCKS)
            f.flush()
            violations = checker._check_artifact(f.name)
        Path(f.name).unlink()
        types = {v["type"] for v in violations}
        self.assertEqual(
            types,
            {
                "MISSING_BLIND_SPOT_CONTROL_BLOCK",
                "MISSING_CORPUS_COMPLETENESS_BLOCK",
                "MISSING_ENTRY_CONTROL_BLOCK",
            },
        )

    def test_original_source_prefixes_still_trigger_after_extension(self):
        """The two original ABSORPTION_SOURCE_PREFIXES entries remain present
        and still trigger detection after the source-mirror prefix was
        added, proving the extension is additive."""
        self.assertIn(".private_reference/legacy/", checker.ABSORPTION_SOURCE_PREFIXES)
        self.assertIn(".private_reference/external_repos/", checker.ABSORPTION_SOURCE_PREFIXES)
        self.assertIn(".private_reference/source_mirrors/", checker.ABSORPTION_SOURCE_PREFIXES)

    def test_original_headings_constants_unchanged(self):
        """The two original heading constants keep their exact original
        string values; only a new third heading constant was added."""
        self.assertEqual(checker.BLIND_SPOT_HEADING, "## Mandatory Blind-Spot Control Block")
        self.assertEqual(checker.CORPUS_HEADING, "## Corpus Completeness And Report Integrity")
        self.assertEqual(
            checker.ENTRY_CONTROL_HEADING,
            "## External Repository Absorption Entry Control",
        )

    def test_allowed_disposition_patterns_unchanged(self):
        """The allowed-disposition regex patterns retain their original
        vocabulary (NOT_APPLICABLE_WITH_REASON, SKIPPED_WITH_REASON)."""
        joined = "\n".join(p.pattern for p in checker.ALLOWED_DISPOSITION_PATTERNS)
        self.assertIn("NOT_APPLICABLE_WITH_REASON", joined)
        self.assertIn("SKIPPED_WITH_REASON", joined)


class TestExtractSection(unittest.TestCase):
    def test_extracts_section_content(self):
        text = "## Mandatory Blind-Spot Control Block\n\ntest content\n\n## Next Section\n"
        section = checker._extract_section(text, "## Mandatory Blind-Spot Control Block")
        self.assertIn("test content", section)
        self.assertNotIn("## Next Section", section)

    def test_returns_empty_for_missing_section(self):
        text = "## Other Heading\ncontent\n"
        section = checker._extract_section(text, "## Mandatory Blind-Spot Control Block")
        self.assertEqual(section, "")


class TestHasAllowedDisposition(unittest.TestCase):
    def test_returns_true_for_not_applicable(self):
        text = "## Mandatory Blind-Spot Control Block\n\nNOT_APPLICABLE_WITH_REASON: test\n"
        self.assertTrue(checker._has_allowed_disposition(text, "## Mandatory Blind-Spot Control Block"))

    def test_returns_true_for_skipped(self):
        text = "## Corpus Completeness And Report Integrity\n\nSKIPPED_WITH_REASON: test\n"
        self.assertTrue(checker._has_allowed_disposition(text, "## Corpus Completeness And Report Integrity"))

    def test_returns_false_for_missing_section(self):
        text = "## Other\ncontent\n"
        self.assertFalse(checker._has_allowed_disposition(text, "## Mandatory Blind-Spot Control Block"))

    def test_returns_false_for_section_without_disposition(self):
        text = "## Mandatory Blind-Spot Control Block\n\n- Gate 1: test\n- verdict: CLEAR\n"
        self.assertFalse(checker._has_allowed_disposition(text, "## Mandatory Blind-Spot Control Block"))


class TestRunCheckEndToEnd(unittest.TestCase):
    """End-to-end tests for run_check() with monkeypatched git helpers.

    Simulates the real scenario: a governed Markdown artifact appears in the
    git diff, its content references ``.private_reference/legacy/``, but it
    omits the required control blocks.  run_check() must return violations.

    This regression test guards against the original P0 defect where the
    checker only looked at changed *paths* (which never include gitignored
    ``.private_reference/`` files) instead of scanning artifact *content*.
    """

    def test_run_check_returns_violations_for_artifact_citing_legacy_without_blocks(self):
        fake_path = "docs/work_orders/CVF_FAKE_WORK_ORDER.md"
        fake_content = textwrap.dedent("""\
        # Fake Work Order

        This artifact references `.private_reference/legacy/old_framework/README.md`.

        ## Some Other Section

        Content without control blocks.
        """)

        original_git = checker._get_changed_name_status
        original_worktree = checker._get_worktree_name_status
        original_read = checker._read_rel

        def fake_changed_name_status(base, head):
            return {fake_path: {"A"}}

        def fake_worktree_name_status():
            return {}

        def fake_read_rel(path):
            if path == fake_path:
                return fake_content
            return original_read(path)

        try:
            checker._get_changed_name_status = fake_changed_name_status
            checker._get_worktree_name_status = fake_worktree_name_status
            checker._read_rel = fake_read_rel

            violations = checker.run_check(base="fake-base", head="fake-head")
        finally:
            checker._get_changed_name_status = original_git
            checker._get_worktree_name_status = original_worktree
            checker._read_rel = original_read

        self.assertEqual(len(violations), 3)
        types = {v["type"] for v in violations}
        self.assertIn("MISSING_BLIND_SPOT_CONTROL_BLOCK", types)
        self.assertIn("MISSING_CORPUS_COMPLETENESS_BLOCK", types)
        self.assertIn("MISSING_ENTRY_CONTROL_BLOCK", types)
        self.assertEqual(violations[0]["path"], fake_path)

    def test_run_check_returns_no_violations_when_artifact_has_blocks(self):
        fake_path = "docs/reviews/CVF_FAKE_REVIEW.md"
        fake_content = textwrap.dedent(f"""\
        # Fake Review

        This artifact references `.private_reference/external_repos/agent-skills/README.md`.

        ## Mandatory Blind-Spot Control Block

        - Gate 1: source enumerated
        - Blind-spot verdict: CLEAR

        ## Corpus Completeness And Report Integrity

        - Corpus task class: test
        - Corpus verdict: COMPLETE_VERIFIED

        {ENTRY_CONTROL_BLOCK_TEXT}
        ## After Section

        Content.
        """)

        original_git = checker._get_changed_name_status
        original_worktree = checker._get_worktree_name_status
        original_read = checker._read_rel

        def fake_changed_name_status(base, head):
            return {fake_path: {"M"}}

        def fake_worktree_name_status():
            return {}

        def fake_read_rel(path):
            if path == fake_path:
                return fake_content
            return original_read(path)

        try:
            checker._get_changed_name_status = fake_changed_name_status
            checker._get_worktree_name_status = fake_worktree_name_status
            checker._read_rel = fake_read_rel

            violations = checker.run_check(base="fake-base", head="fake-head")
        finally:
            checker._get_changed_name_status = original_git
            checker._get_worktree_name_status = original_worktree
            checker._read_rel = original_read

        self.assertEqual(violations, [])

    def test_run_check_returns_violations_for_artifact_citing_source_mirror(self):
        """End-to-end: a governed artifact citing the new
        .private_reference/source_mirrors/ prefix with no control blocks at
        all must trigger run_check() and report all three violations."""
        fake_path = "docs/work_orders/CVF_FAKE_SOURCE_MIRROR_WORK_ORDER.md"
        fake_content = textwrap.dedent("""\
        # Fake Source Mirror Work Order

        See `.private_reference/source_mirrors/example__repo/README.md`.

        ## Some Other Section

        Content without control blocks.
        """)

        original_git = checker._get_changed_name_status
        original_worktree = checker._get_worktree_name_status
        original_read = checker._read_rel

        def fake_changed_name_status(base, head):
            return {fake_path: {"A"}}

        def fake_worktree_name_status():
            return {}

        def fake_read_rel(path):
            if path == fake_path:
                return fake_content
            return original_read(path)

        try:
            checker._get_changed_name_status = fake_changed_name_status
            checker._get_worktree_name_status = fake_worktree_name_status
            checker._read_rel = fake_read_rel

            violations = checker.run_check(base="fake-base", head="fake-head")
        finally:
            checker._get_changed_name_status = original_git
            checker._get_worktree_name_status = original_worktree
            checker._read_rel = original_read

        self.assertEqual(len(violations), 3)
        types = {v["type"] for v in violations}
        self.assertIn("MISSING_BLIND_SPOT_CONTROL_BLOCK", types)
        self.assertIn("MISSING_CORPUS_COMPLETENESS_BLOCK", types)
        self.assertIn("MISSING_ENTRY_CONTROL_BLOCK", types)

    def test_run_check_silent_for_bare_word_repo_prose(self):
        """End-to-end: generic bare-word 'repo' prose must not trigger
        run_check(), confirming the bounded-phrase discipline holds at the
        integration level, not only in the unit-level trigger test."""
        fake_path = "docs/work_orders/CVF_FAKE_BARE_REPO_WORD_ORDER.md"
        fake_content = textwrap.dedent("""\
        # Fake Work Order

        This repo has good test coverage and a clean CI setup.

        ## Some Section

        Content.
        """)

        original_git = checker._get_changed_name_status
        original_worktree = checker._get_worktree_name_status
        original_read = checker._read_rel

        def fake_changed_name_status(base, head):
            return {fake_path: {"A"}}

        def fake_worktree_name_status():
            return {}

        def fake_read_rel(path):
            if path == fake_path:
                return fake_content
            return original_read(path)

        try:
            checker._get_changed_name_status = fake_changed_name_status
            checker._get_worktree_name_status = fake_worktree_name_status
            checker._read_rel = fake_read_rel

            violations = checker.run_check(base="fake-base", head="fake-head")
        finally:
            checker._get_changed_name_status = original_git
            checker._get_worktree_name_status = original_worktree
            checker._read_rel = original_read

        self.assertEqual(violations, [])

    def test_run_check_silent_for_artifact_without_absorption_references(self):
        fake_path = "docs/work_orders/CVF_UNRELATED_WORK_ORDER.md"
        fake_content = textwrap.dedent("""\
        # Unrelated Work Order

        No absorption source references here.

        ## Some Section

        Content.
        """)

        original_git = checker._get_changed_name_status
        original_worktree = checker._get_worktree_name_status
        original_read = checker._read_rel

        def fake_changed_name_status(base, head):
            return {fake_path: {"A"}}

        def fake_worktree_name_status():
            return {}

        def fake_read_rel(path):
            if path == fake_path:
                return fake_content
            return original_read(path)

        try:
            checker._get_changed_name_status = fake_changed_name_status
            checker._get_worktree_name_status = fake_worktree_name_status
            checker._read_rel = fake_read_rel

            violations = checker.run_check(base="fake-base", head="fake-head")
        finally:
            checker._get_changed_name_status = original_git
            checker._get_worktree_name_status = original_worktree
            checker._read_rel = original_read

        self.assertEqual(violations, [])


if __name__ == "__main__":
    unittest.main()
