from __future__ import annotations

import importlib.util
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path


MODULE_PATH = Path(__file__).resolve().with_name(
    "check_external_absorption_conditional_reopen_index.py"
)
SPEC = importlib.util.spec_from_file_location(
    "check_external_absorption_conditional_reopen_index", MODULE_PATH
)
checker = importlib.util.module_from_spec(SPEC)
assert SPEC and SPEC.loader
sys.modules[SPEC.name] = checker
SPEC.loader.exec_module(checker)


SAMPLE_INDEX_TEXT = """## Candidate Index

| Candidate ID | Source lane | Candidate class |
|---|---|---|
| `MPA-AI-utility-under-attack-evaluation-precursor` | MPA-AI-T0 | `RUNTIME_CANDIDATE` |
| `CGE-code-intelligence-checker-candidates` | CodeGraph CGE-R1 | `CHECKER_CANDIDATE` |

## Terminal Source-Family Closures

| Source family | Source evidence | Terminal status |
| --- | --- | --- |
| `Gop y CVF EI-01 through EI-13` | some path | `RECONCILED_NO_REOPEN` |
"""


def _closeout(body: str) -> str:
    return (
        "External absorption core: REQUIRED\n\n"
        "## External Absorption Value Conversion Matrix\n\n"
        f"{body}\n"
    )


def _run_git(repo: Path, *args: str) -> subprocess.CompletedProcess[str]:
    return subprocess.run(
        ["git", "-C", str(repo), *args],
        text=True,
        encoding="utf-8",
        errors="replace",
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        check=True,
    )


def _init_repo(repo: Path) -> None:
    _run_git(repo, "init", "-q")
    _run_git(repo, "config", "user.email", "test@example.com")
    _run_git(repo, "config", "user.name", "Test")


class ConditionalCandidateDetectionTests(unittest.TestCase):
    def test_detects_all_seven_known_candidate_tokens(self) -> None:
        for token in checker.CONDITIONAL_CANDIDATE_TOKENS:
            with self.subTest(token=token):
                found = checker._mentions_conditional_candidate(f"disposition: {token} recorded")
                self.assertIn(token, found)

    def test_ignores_unrelated_text(self) -> None:
        found = checker._mentions_conditional_candidate("no candidate vocabulary appears here at all")
        self.assertEqual(found, [])

    def test_word_boundary_prevents_false_positive_substring(self) -> None:
        # "PRE_DEFERRED_TOKEN" must not register as a bare "DEFERRED" hit.
        found = checker._mentions_conditional_candidate("status PRE_DEFERRED_TOKEN only")
        self.assertNotIn("DEFERRED", found)


class IndexParsingTests(unittest.TestCase):
    def test_extracts_candidate_index_ids(self) -> None:
        ids = checker._extract_index_candidate_ids(SAMPLE_INDEX_TEXT)
        self.assertIn("MPA-AI-utility-under-attack-evaluation-precursor", ids)
        self.assertIn("CGE-code-intelligence-checker-candidates", ids)

    def test_extracts_terminal_source_family_closure_ids(self) -> None:
        ids = checker._extract_index_candidate_ids(SAMPLE_INDEX_TEXT)
        self.assertIn("Gop y CVF EI-01 through EI-13", ids)

    def test_header_row_not_treated_as_candidate_id(self) -> None:
        ids = checker._extract_index_candidate_ids(SAMPLE_INDEX_TEXT)
        self.assertNotIn("Candidate ID", ids)
        self.assertNotIn("Source family", ids)


class ThreeOutcomePositiveTests(unittest.TestCase):
    """Focused Case Matrix: positive matching row add/update; positive cited
    existing matching row plus current rationale; positive exact no-entry
    marker with each allowed reason class."""

    def test_outcome_one_add_or_update_matching_row_in_same_changed_set(self) -> None:
        path = "docs/audits/sample.md"
        text = _closeout(
            "closeout records RUNTIME_CANDIDATE disposition for the evaluated cluster."
        )
        violations = checker.check_text(
            path,
            text,
            changed_paths={
                "docs/audits/sample.md",
                checker.INDEX_PATH,
            },
            index_text_after=SAMPLE_INDEX_TEXT,
            changed_index_rows={
                "MPA-AI-utility-under-attack-evaluation-precursor": (
                    f"| `MPA-AI-utility-under-attack-evaluation-precursor` | {path} | `RUNTIME_CANDIDATE` |"
                )
            },
        )
        self.assertEqual(violations, [])

    def test_outcome_one_update_existing_matching_row_in_same_changed_set(self) -> None:
        candidate_id = "MPA-AI-utility-under-attack-evaluation-precursor"
        text = _closeout(
            f"RUNTIME_CANDIDATE tracked as `{candidate_id}` for this closeout."
        )
        violations = checker.check_text(
            "docs/audits/update.md",
            text,
            changed_paths={"docs/audits/update.md", checker.INDEX_PATH},
            index_text_after=SAMPLE_INDEX_TEXT,
            changed_index_rows={
                candidate_id: f"| `{candidate_id}` | `RUNTIME_CANDIDATE` | updated row |"
            },
        )
        self.assertEqual(violations, [])

    def test_outcome_two_cites_existing_matching_row_with_currency_statement(self) -> None:
        text = _closeout(
            "closeout records DEFERRED disposition. See the central conditional "
            "reopen index row `MPA-AI-utility-under-attack-evaluation-precursor`, "
            "which remains current."
        )
        violations = checker.check_text(
            "docs/reviews/sample.md",
            text,
            changed_paths={"docs/reviews/sample.md"},
            index_text_after=SAMPLE_INDEX_TEXT,
            changed_index_rows={},
        )
        self.assertEqual(violations, [])

    def test_outcome_two_cites_terminal_source_family_closure_row(self) -> None:
        text = _closeout(
            "closeout records CHECKER_CANDIDATE disposition. This item is part of "
            "the terminal source family `Gop y CVF EI-01 through EI-13` in the "
            "conditional reopen index, and that row remains current."
        )
        violations = checker.check_text(
            "docs/reviews/sample2.md",
            text,
            changed_paths={"docs/reviews/sample2.md"},
            index_text_after=SAMPLE_INDEX_TEXT,
            changed_index_rows={},
        )
        self.assertEqual(violations, [])

    def _no_entry_marker_case(self, reason: str) -> list[dict[str, str]]:
        text = _closeout(
            f"closeout records VALUE_PARKED disposition. "
            f"{checker.NO_ENTRY_MARKER}: {reason}"
        )
        return checker.check_text(
            "docs/reviews/no_entry_sample.md",
            text,
            changed_paths={"docs/reviews/no_entry_sample.md"},
            index_text_after=SAMPLE_INDEX_TEXT,
            changed_index_rows={},
        )

    def test_outcome_three_no_entry_marker_reason_fully_adapted(self) -> None:
        violations = self._no_entry_marker_case(
            "fully adapted into CVF doctrine with no remaining native value."
        )
        self.assertEqual(violations, [])

    def test_outcome_three_no_entry_marker_reason_rejected_no_remaining_value(self) -> None:
        violations = self._no_entry_marker_case(
            "rejected with no remaining CVF-native value after review."
        )
        self.assertEqual(violations, [])

    def test_outcome_three_no_entry_marker_reason_already_owned_elsewhere(self) -> None:
        violations = self._no_entry_marker_case(
            "already owned by another governed index and tracked there."
        )
        self.assertEqual(violations, [])


class NegativeCaseTests(unittest.TestCase):
    """Focused Case Matrix: negative MPA omission; negative bare index-path
    citation; negative missing/non-matching row identifier; negative empty or
    unsupported no-entry reason."""

    def test_negative_mpa_omission_regression(self) -> None:
        """Primary regression: models the actual MPA deferred closeout, which
        recorded a DEFERRED utility-under-attack candidate but (before the
        index repair) neither updated a matching index row, cited a current
        matching row, nor stated the no-entry marker. The checker must fail
        specifically because the candidate disappeared from the reopen
        index, not for an unrelated malformed-file reason."""
        mpa_text = _closeout(
            "utility-under-attack cluster: 8 files, terminal status DEFERRED. "
            "Value-disposition route: reopen only after a separately selected "
            "evaluation owner and value gate."
        )
        pre_repair_index_text = (
            "## Candidate Index\n\n"
            "| Candidate ID | Source lane |\n"
            "|---|---|\n"
            "| `CGE-code-intelligence-checker-candidates` | CodeGraph CGE-R1 |\n"
        )
        violations = checker.check_text(
            "docs/audits/CVF_MPA_AI_T0_LOCAL_MEMORY_POISONING_ABSORPTION_AUDIT_2026-08-27.md",
            mpa_text,
            changed_paths={
                "docs/audits/CVF_MPA_AI_T0_LOCAL_MEMORY_POISONING_ABSORPTION_AUDIT_2026-08-27.md"
            },
            index_text_after=pre_repair_index_text,
            changed_index_rows={},
        )
        self.assertEqual(len(violations), 1)
        self.assertEqual(
            violations[0]["type"], "conditional_reopen_index_candidate_disappeared"
        )
        self.assertIn("DEFERRED", violations[0]["message"])

    def test_negative_unrelated_index_row_change_is_not_matching(self) -> None:
        text = _closeout("RUNTIME_CANDIDATE retained for the MPA evaluation cluster.")
        violations = checker.check_text(
            "docs/audits/mpa.md",
            text,
            changed_paths={"docs/audits/mpa.md", checker.INDEX_PATH},
            index_text_after=SAMPLE_INDEX_TEXT,
            changed_index_rows={
                "CGE-code-intelligence-checker-candidates": (
                    "| `CGE-code-intelligence-checker-candidates` | `CHECKER_CANDIDATE` | unrelated update |"
                )
            },
        )
        self.assertEqual(len(violations), 1)

    def test_negative_same_path_but_wrong_candidate_class_is_not_matching(self) -> None:
        path = "docs/audits/mpa_wrong_class.md"
        text = _closeout("RUNTIME_CANDIDATE retained for the MPA evaluation cluster.")
        violations = checker.check_text(
            path,
            text,
            changed_paths={path, checker.INDEX_PATH},
            index_text_after=SAMPLE_INDEX_TEXT,
            changed_index_rows={
                "CGE-code-intelligence-checker-candidates": (
                    f"| `CGE-code-intelligence-checker-candidates` | {path} | `CHECKER_CANDIDATE` |"
                )
            },
        )
        self.assertEqual(len(violations), 1)

    def test_negative_bare_index_path_citation_is_not_evidence(self) -> None:
        text = _closeout(
            "closeout records DEFERRED disposition. See "
            f"{checker.INDEX_PATH} for the general policy."
        )
        violations = checker.check_text(
            "docs/reviews/bare.md",
            text,
            changed_paths={"docs/reviews/bare.md"},
            index_text_after=SAMPLE_INDEX_TEXT,
            changed_index_rows={},
        )
        self.assertEqual(len(violations), 1)

    def test_negative_missing_non_matching_row_identifier(self) -> None:
        text = _closeout(
            "closeout records DEFERRED disposition. See the central conditional "
            "reopen index row `SOME-CANDIDATE-THAT-DOES-NOT-EXIST`, which remains current."
        )
        violations = checker.check_text(
            "docs/reviews/nonmatch.md",
            text,
            changed_paths={"docs/reviews/nonmatch.md"},
            index_text_after=SAMPLE_INDEX_TEXT,
            changed_index_rows={},
        )
        self.assertEqual(len(violations), 1)

    def test_negative_empty_no_entry_reason(self) -> None:
        text = _closeout(
            f"closeout records VALUE_PARKED disposition. {checker.NO_ENTRY_MARKER}"
        )
        violations = checker.check_text(
            "docs/reviews/empty_reason.md",
            text,
            changed_paths={"docs/reviews/empty_reason.md"},
            index_text_after=SAMPLE_INDEX_TEXT,
            changed_index_rows={},
        )
        self.assertEqual(len(violations), 1)

    def test_negative_unsupported_short_no_entry_reason(self) -> None:
        text = _closeout(
            f"closeout records VALUE_PARKED disposition. {checker.NO_ENTRY_MARKER}: n/a"
        )
        violations = checker.check_text(
            "docs/reviews/short_reason.md",
            text,
            changed_paths={"docs/reviews/short_reason.md"},
            index_text_after=SAMPLE_INDEX_TEXT,
            changed_index_rows={},
        )
        self.assertEqual(len(violations), 1)

    def test_negative_unsupported_long_no_entry_reason(self) -> None:
        text = _closeout(
            f"VALUE_PARKED. {checker.NO_ENTRY_MARKER}: not authorized in this tranche"
        )
        violations = checker.check_text(
            "docs/reviews/unsupported_reason.md",
            text,
            changed_paths={"docs/reviews/unsupported_reason.md"},
            index_text_after=SAMPLE_INDEX_TEXT,
            changed_index_rows={},
        )
        self.assertEqual(len(violations), 1)

    def test_no_entry_marker_outside_disposition_section_does_not_satisfy(self) -> None:
        text = _closeout("VALUE_PARKED candidate remains unresolved.") + (
            "\n## Checker Notes\n\n"
            f"{checker.NO_ENTRY_MARKER}: fully adapted into another owner.\n"
        )
        violations = checker.check_text(
            "docs/reviews/marker_elsewhere.md",
            text,
            changed_paths={"docs/reviews/marker_elsewhere.md"},
            index_text_after=SAMPLE_INDEX_TEXT,
            changed_index_rows={},
        )
        self.assertEqual(len(violations), 1)

    def test_currency_statement_must_be_near_matching_row_citation(self) -> None:
        candidate_id = "MPA-AI-utility-under-attack-evaluation-precursor"
        text = _closeout(
            f"DEFERRED; see conditional reopen index row `{candidate_id}`."
        ) + "\n## Unrelated\n\n" + ("filler " * 100) + "row remains current.\n"
        violations = checker.check_text(
            "docs/reviews/distant_currency.md",
            text,
            changed_paths={"docs/reviews/distant_currency.md"},
            index_text_after=SAMPLE_INDEX_TEXT,
            changed_index_rows={},
        )
        self.assertEqual(len(violations), 1)

    def test_multiple_outcomes_fail_exactly_one_rule(self) -> None:
        candidate_id = "MPA-AI-utility-under-attack-evaluation-precursor"
        text = _closeout(
            f"DEFERRED; conditional reopen index row `{candidate_id}` remains current. "
            f"{checker.NO_ENTRY_MARKER}: fully adapted into the governed owner."
        )
        violations = checker.check_text(
            "docs/reviews/multiple.md",
            text,
            changed_paths={"docs/reviews/multiple.md"},
            index_text_after=SAMPLE_INDEX_TEXT,
            changed_index_rows={},
        )
        self.assertEqual(len(violations), 1)
        self.assertEqual(
            violations[0]["type"], "conditional_reopen_index_multiple_outcomes"
        )

    def test_candidate_vocabulary_outside_owner_section_is_not_a_disposition(self) -> None:
        text = (
            "External absorption core: REQUIRED\n\n"
            "## Purpose\n\nDocumentation mentions DEFERRED and RUNTIME_CANDIDATE.\n\n"
            "## External Absorption Value Conversion Matrix\n\n"
            "No conditional candidate is recorded in this matrix.\n"
        )
        violations = checker.check_text(
            "docs/reviews/documentation.md",
            text,
            changed_paths={"docs/reviews/documentation.md"},
            index_text_after=SAMPLE_INDEX_TEXT,
            changed_index_rows={},
        )
        self.assertEqual(violations, [])


class ArchiveSafetyTests(unittest.TestCase):
    def test_archive_path_is_not_applicable(self) -> None:
        text = "closeout records DEFERRED disposition with no index update.\n"
        violations = checker.check_text(
            "docs/reviews/archive/old_closeout.md",
            text,
            changed_paths={"docs/reviews/archive/old_closeout.md"},
            index_text_after=SAMPLE_INDEX_TEXT,
            changed_index_rows={},
        )
        self.assertEqual(violations, [])

    def test_non_governed_prefix_is_not_applicable(self) -> None:
        text = "DEFERRED disposition mentioned in a non-governed file.\n"
        violations = checker.check_text(
            "src/notes.md",
            text,
            changed_paths={"src/notes.md"},
            index_text_after=SAMPLE_INDEX_TEXT,
            changed_index_rows={},
        )
        self.assertEqual(violations, [])

    def test_roadmap_and_work_order_are_not_closeout_surfaces(self) -> None:
        text = _closeout("DEFERRED candidate is described for planning only.")
        for path in ("docs/roadmaps/plan.md", "docs/work_orders/order.md"):
            with self.subTest(path=path):
                violations = checker.check_text(
                    path,
                    text,
                    changed_paths={path},
                    index_text_after=SAMPLE_INDEX_TEXT,
                    changed_index_rows={},
                )
                self.assertEqual(violations, [])

    def test_the_index_and_standard_themselves_are_exempt(self) -> None:
        text = "DEFERRED, RUNTIME_CANDIDATE, VALUE_PARKED are documented here.\n"
        for path in (checker.INDEX_PATH, checker.STANDARD_PATH):
            with self.subTest(path=path):
                violations = checker.check_text(
                    path,
                    text,
                    changed_paths={path},
                    index_text_after=SAMPLE_INDEX_TEXT,
                    changed_index_rows={},
                )
                self.assertEqual(violations, [])


class RangeAndWorktreeDiscoveryTests(unittest.TestCase):
    """Focused Case Matrix: committed-range plus staged, unstaged, and
    untracked discovery, using a real isolated temporary Git repository so no
    governed repository evidence is mutated."""

    def test_committed_range_discovery(self) -> None:
        with tempfile.TemporaryDirectory() as tmp_dir:
            repo = Path(tmp_dir)
            _init_repo(repo)
            (repo / "docs").mkdir()
            (repo / "docs" / "reviews").mkdir()
            base_file = repo / "docs" / "reviews" / "base.md"
            base_file.write_text("baseline\n", encoding="utf-8")
            _run_git(repo, "add", ".")
            _run_git(repo, "commit", "-q", "-m", "base")
            base_sha = _run_git(repo, "rev-parse", "HEAD").stdout.strip()

            new_file = repo / "docs" / "reviews" / "committed.md"
            new_file.write_text("DEFERRED candidate committed\n", encoding="utf-8")
            _run_git(repo, "add", ".")
            _run_git(repo, "commit", "-q", "-m", "add committed candidate")
            head_sha = _run_git(repo, "rev-parse", "HEAD").stdout.strip()

            original_repo_root = checker.REPO_ROOT
            checker.REPO_ROOT = repo
            try:
                changed = checker._changed_files(base_sha, head_sha)
            finally:
                checker.REPO_ROOT = original_repo_root
            self.assertIn("docs/reviews/committed.md", changed)

    def test_staged_unstaged_and_untracked_discovery(self) -> None:
        with tempfile.TemporaryDirectory() as tmp_dir:
            repo = Path(tmp_dir)
            _init_repo(repo)
            (repo / "docs").mkdir()
            (repo / "docs" / "reviews").mkdir()
            tracked = repo / "docs" / "reviews" / "tracked.md"
            tracked.write_text("original\n", encoding="utf-8")
            _run_git(repo, "add", ".")
            _run_git(repo, "commit", "-q", "-m", "base")

            # unstaged modification
            tracked.write_text("modified unstaged\n", encoding="utf-8")
            # staged new file
            staged = repo / "docs" / "reviews" / "staged.md"
            staged.write_text("staged content\n", encoding="utf-8")
            _run_git(repo, "add", "docs/reviews/staged.md")
            # untracked new file
            untracked = repo / "docs" / "reviews" / "untracked.md"
            untracked.write_text("untracked content\n", encoding="utf-8")

            original_repo_root = checker.REPO_ROOT
            checker.REPO_ROOT = repo
            try:
                changed = checker._changed_files(None, None)
            finally:
                checker.REPO_ROOT = original_repo_root

            self.assertIn("docs/reviews/tracked.md", changed)
            self.assertIn("docs/reviews/staged.md", changed)
            self.assertIn("docs/reviews/untracked.md", changed)


class DeterministicCliTests(unittest.TestCase):
    def test_repeated_run_over_clean_worktree_is_deterministic(self) -> None:
        result_one = subprocess.run(
            [sys.executable, str(MODULE_PATH), "--enforce"],
            cwd=checker.REPO_ROOT,
            text=True,
            encoding="utf-8",
            errors="replace",
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
        )
        result_two = subprocess.run(
            [sys.executable, str(MODULE_PATH), "--enforce"],
            cwd=checker.REPO_ROOT,
            text=True,
            encoding="utf-8",
            errors="replace",
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
        )
        self.assertEqual(result_one.returncode, result_two.returncode)
        self.assertEqual(result_one.stdout, result_two.stdout)

    def test_cli_exit_code_zero_on_clean_worktree(self) -> None:
        result = subprocess.run(
            [sys.executable, str(MODULE_PATH), "--enforce"],
            cwd=checker.REPO_ROOT,
            text=True,
            encoding="utf-8",
            errors="replace",
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
        )
        self.assertEqual(result.returncode, 0)
        self.assertIn("COMPLIANT", result.stdout)


if __name__ == "__main__":
    unittest.main()
