#!/usr/bin/env python3
from __future__ import annotations

import hashlib
import importlib.util
import io
import json
import subprocess
import sys
import tempfile
import unittest
from contextlib import redirect_stdout
from pathlib import Path
from unittest.mock import patch


MODULE_PATH = Path(__file__).resolve().with_name("check_next_move_freshness.py")
SPEC = importlib.util.spec_from_file_location("check_next_move_freshness", MODULE_PATH)
if SPEC is None or SPEC.loader is None:
    raise RuntimeError(f"Unable to load module from {MODULE_PATH}")
MODULE = importlib.util.module_from_spec(SPEC)
sys.modules[SPEC.name] = MODULE
SPEC.loader.exec_module(MODULE)


HANDOFF_NAME = "AGENT_HANDOFF_TEST.md"


# --- Git-backed fixture repository helper -----------------------------------
#
# Consolidated Rework R1 makes the checker's exact-target supersession rule
# Git-authoritative (HEAD-committed bytes only). A plain temp-directory
# fixture (no `.git`) can no longer exercise that rule at all, since every
# `git ls-tree`/`git show` call inside the checker fails closed with no
# repository present. Every test below therefore builds a real, isolated Git
# repository under a temp directory and commits the fixture state before
# running the checker against it.


def _git(root: Path, *args: str, input_bytes: bytes | None = None) -> subprocess.CompletedProcess:
    return subprocess.run(
        ["git", *args],
        cwd=root,
        input=input_bytes,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        check=True,
    )


def _init_repo(root: Path) -> None:
    _git(root, "init", "-q")
    _git(root, "config", "user.email", "test@example.invalid")
    _git(root, "config", "user.name", "Test Runner")


def _commit_all(root: Path, message: str) -> str:
    _git(root, "add", "-A")
    _git(root, "commit", "-q", "-m", message)
    return _git(root, "rev-parse", "HEAD").stdout.decode().strip()


def _write(root: Path, rel_path: str, text: str) -> None:
    full = root / rel_path
    full.parent.mkdir(parents=True, exist_ok=True)
    # newline="" preserves exact bytes (no platform line-ending translation),
    # so a SHA-256 computed here from `text` matches what Git stores and what
    # the checker recomputes from committed bytes.
    full.write_text(text, encoding="utf-8", newline="")


def _sha256_of(text: str) -> str:
    return hashlib.sha256(text.encode("utf-8")).hexdigest()


def _write_surfaces(
    root: Path,
    *,
    active_next: str,
    front_next: str | None = None,
    handoff_next: str | None = None,
    handoff_startup: str | None = None,
) -> None:
    state = {
        "activeHandoff": HANDOFF_NAME,
        "nextAllowedMove": active_next,
        "modelGatewayC02P2DynamicModelRegistryBoundaryDispatch20260615": {
            "status": "CLOSED_PASS_BOUNDED",
            "workOrder": "docs/work_orders/CVF_AGENT_WORK_ORDER_MODEL_GATEWAY_C02_P2_DYNAMIC_MODEL_REGISTRY_BOUNDARY_2026-06-15.md",
            "nextAllowedMove": "P2 is closed. Model Gateway C-02 P3 may open only through fresh authorization.",
        },
        "roadmapStateReconciliationT3Closure20260616": (
            "RSF-T3 is CLOSED_PASS_BOUNDED at material commit abc12345."
        ),
    }
    _write(root, "CVF_SESSION/ACTIVE_SESSION_STATE.json", json.dumps(state))
    _write(
        root,
        "CVF_SESSION_MEMORY.md",
        "# Front Door\n\n## Next Allowed Move\n\n"
        f"{front_next if front_next is not None else active_next}\n",
    )
    startup = handoff_startup or (
        "Startup acknowledged: current mode=`mode`; active handoff=`AGENT_HANDOFF_TEST.md`; "
        "next allowed move=fresh operator authorization only."
    )
    _write(
        root,
        HANDOFF_NAME,
        f"{startup}\n\n## Next Allowed Move\n\n"
        f"{handoff_next if handoff_next is not None else active_next}\n",
    )


TARGET_PLAN_PATH = "docs/assessments/CVF_TASK_PROPORTIONAL_GOVERNANCE_SECOND_UPGRADE_EXTERNAL_CRITIQUE_PLAN_2026-08-17.md"
TARGET_PLAN_TEXT = (
    "# TPGR Second Upgrade External Critique Plan\n\n"
    "Synthetic fixture plan body reproducing the AFFD-R1 regression case.\n"
)


def _write_reconciliation_evidence(
    root: Path,
    *,
    evidence_name: str,
    target_path: str,
    sha256: str | None = None,
    commit_hash: str | None = None,
    terminal_relation: bool = True,
    evidence_dir: str = "docs/reviews",
) -> None:
    hash_clause = f"; SHA-256 `{sha256}`" if sha256 else ""
    commit_clause = f"; commit `{commit_hash}`" if commit_hash else ""
    heading = (
        "# Synthetic Reconciliation Evidence"
        if terminal_relation
        else "# Synthetic Advisory Evidence"
    )
    relation = (
        "Final reconciliation disposition:\n`ACCEPT_REVISE_BEFORE_IMPLEMENTATION_PLANNING`.\n"
        if terminal_relation
        else "An external critique was written about this plan. No further governed "
        "decision has been made.\n"
    )
    body = (
        f"{heading}\n\n"
        "## Target / Source\n\n"
        f"| original critique plan | `{target_path}`{commit_clause}{hash_clause} | CVF-governed planning source |\n\n"
        f"{relation}"
    )
    _write(root, f"{evidence_dir}/{evidence_name}", body)


class _CheckerRunMixin:
    def _run(self, root: Path, argv: list[str]) -> tuple[int, str]:
        out = io.StringIO()
        with patch.object(MODULE, "REPO_ROOT", root), \
            patch.object(sys, "argv", ["check_next_move_freshness.py", *argv]), \
            redirect_stdout(out):
            code = MODULE.main()
        return code, out.getvalue()


class NextMoveFreshnessTests(_CheckerRunMixin, unittest.TestCase):
    def test_allows_closed_target_only_as_blocked_context(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            _init_repo(root)
            _write_surfaces(
                root,
                active_next=(
                    "Do not redispatch Model Gateway C-02 P2 from stale continuity text; "
                    "C-02 P2 is already closed. Next allowed move: fresh authorization only."
                ),
            )
            _commit_all(root, "fixture")
            code, text = self._run(root, ["--enforce"])
            self.assertEqual(code, 0)
            self.assertIn("COMPLIANT", text)

    def test_allows_soft_wrapped_do_not_redispatch_context(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            _init_repo(root)
            _write_surfaces(
                root,
                active_next="Next allowed move: fresh operator authorization only.",
                handoff_next=(
                    "Next allowed move: fresh authorization only. Do not\n"
                    "redispatch Model Gateway C-02 P2 from stale continuity text."
                ),
            )
            _commit_all(root, "fixture")
            code, text = self._run(root, ["--enforce"])
            self.assertEqual(code, 0)
            self.assertIn("COMPLIANT", text)

    def test_rejects_active_state_dispatch_to_closed_target(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            _init_repo(root)
            _write_surfaces(
                root,
                active_next="Next allowed move: dispatch Model Gateway C-02 P2 to Claude.",
                front_next="Next allowed move: fresh operator authorization only.",
                handoff_next="Next allowed move: fresh operator authorization only.",
            )
            _commit_all(root, "fixture")
            code, text = self._run(root, ["--enforce"])
            self.assertEqual(code, 1)
            self.assertIn("Model Gateway C-02 P2", text)

    def test_rejects_stale_dispatch_inside_long_next_allowed_value(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            _init_repo(root)
            _write_surfaces(
                root,
                active_next=(
                    "RSF-T3 is CLOSED_PASS_BOUNDED at material commit abc12345. "
                    "Next allowed move: dispatch Model Gateway C-02 P2 to Claude."
                ),
                front_next="Next allowed move: fresh operator authorization only.",
                handoff_next="Next allowed move: fresh operator authorization only.",
            )
            _commit_all(root, "fixture")
            code, text = self._run(root, ["--enforce"])
            self.assertEqual(code, 1)
            self.assertIn("dispatch Model Gateway C-02 P2", text)

    def test_rejects_front_door_fresh_auth_open_for_closed_target(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            _init_repo(root)
            _write_surfaces(
                root,
                active_next="Next allowed move: fresh operator authorization only.",
                front_next=(
                    "Fresh authorization only: Model Gateway C-02 P2 may open through "
                    "fresh GC-018."
                ),
                handoff_next="Next allowed move: fresh operator authorization only.",
            )
            _commit_all(root, "fixture")
            code, text = self._run(root, ["--enforce"])
            self.assertEqual(code, 1)
            self.assertIn("front-door Next Allowed Move", text)

    def test_rejects_handoff_next_move_to_closed_target(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            _init_repo(root)
            _write_surfaces(
                root,
                active_next="Next allowed move: fresh operator authorization only.",
                handoff_next="Next move: Model Gateway C02 P2 worker may execute.",
            )
            _commit_all(root, "fixture")
            code, text = self._run(root, ["--enforce"])
            self.assertEqual(code, 1)
            self.assertIn("active handoff Next Allowed Move", text)

    def test_rejects_handoff_startup_ack_to_closed_target(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            _init_repo(root)
            _write_surfaces(
                root,
                active_next="Next allowed move: fresh operator authorization only.",
                handoff_next="Next allowed move: fresh operator authorization only.",
                handoff_startup=(
                    "Startup acknowledged: current mode=`mode`; active handoff=`AGENT_HANDOFF_TEST.md`; "
                    "next allowed move=Model Gateway C-02 P2 DISPATCHED_TO_CLAUDE."
                ),
            )
            _commit_all(root, "fixture")
            code, text = self._run(root, ["--enforce"])
            self.assertEqual(code, 1)
            self.assertIn("startup acknowledgment", text)

    def test_advisory_exit_zero_on_violation_without_enforce(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            _init_repo(root)
            _write_surfaces(
                root,
                active_next="Next allowed move: dispatch Model Gateway C-02 P2.",
                front_next="Next allowed move: fresh operator authorization only.",
                handoff_next="Next allowed move: fresh operator authorization only.",
            )
            _commit_all(root, "fixture")
            code, text = self._run(root, [])
            self.assertEqual(code, 0)
            self.assertIn("ADVISORY", text)

    def test_missing_surface_fails_in_enforce_mode(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            _init_repo(root)
            _write_surfaces(
                root,
                active_next="Next allowed move: fresh operator authorization only.",
            )
            _write(root, "CVF_SESSION_MEMORY.md", "# Front Door\n")
            _commit_all(root, "fixture")
            code, text = self._run(root, ["--enforce"])
            self.assertEqual(code, 1)
            self.assertIn("missing ## Next Allowed Move", text)


class NextMoveFreshnessExactTargetSupersessionTests(_CheckerRunMixin, unittest.TestCase):
    """AFFD-R1 / Consolidated Rework R1: exact-target freshness against
    Git-committed reconciliation/completion evidence only."""

    def _committed_fixture(
        self,
        root: Path,
        *,
        active_next: str,
        target_path: str = TARGET_PLAN_PATH,
        target_text: str = TARGET_PLAN_TEXT,
        write_target: bool = True,
        evidence_name: str | None = "CVF_RECONCILIATION_2026-08-17.md",
        evidence_sha256: str | None = None,
        evidence_commit: str | None = None,
        evidence_terminal: bool = True,
        evidence_dir: str = "docs/reviews",
    ) -> str:
        """Build and commit the common fixture shape; returns the target's
        committed SHA-256 (of target_text) for convenience. Pass
        evidence_name=None to omit evidence entirely."""
        _init_repo(root)
        if write_target:
            _write(root, target_path, target_text)
        if evidence_name is not None:
            _write_reconciliation_evidence(
                root,
                evidence_name=evidence_name,
                target_path=target_path,
                sha256=evidence_sha256,
                commit_hash=evidence_commit,
                terminal_relation=evidence_terminal,
                evidence_dir=evidence_dir,
            )
        _write_surfaces(
            root,
            active_next=active_next,
            front_next="Next allowed move: fresh operator authorization only.",
            handoff_next="Next allowed move: fresh operator authorization only.",
        )
        _commit_all(root, "fixture")
        return _sha256_of(target_text)

    # 1 / 19: real regression case, SHA-256 binding -------------------------

    def test_rejects_dispatch_of_exact_plan_already_reconciled_by_sha256(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            plan_hash = _sha256_of(TARGET_PLAN_TEXT)
            self._committed_fixture(
                root,
                active_next=f"Next allowed move: dispatch critique of `{TARGET_PLAN_PATH}` to a worker.",
                evidence_sha256=plan_hash,
            )
            code, text = self._run(root, ["--enforce"])
            self.assertEqual(code, 1)
            self.assertIn(TARGET_PLAN_PATH, text)
            self.assertIn("Superseded exact targets discovered: 1", text)

    def test_real_tpgr_committed_reconciliation_is_detected(self) -> None:
        """Case 19: run the checker directly against the actual repository
        (REPO_ROOT unpatched - this uses the real, currently committed
        repository state) to confirm the real TPGR reconciliation is
        detected via Git-authoritative evidence."""
        superseded, ambiguity = MODULE.find_superseded_targets(
            {"docs/assessments/CVF_TASK_PROPORTIONAL_GOVERNANCE_SECOND_UPGRADE_EXTERNAL_CRITIQUE_PLAN_2026-08-17.md"}
        )
        self.assertEqual(ambiguity, [])
        self.assertEqual(len(superseded), 1)
        self.assertEqual(
            superseded[0].evidence_path,
            "docs/reviews/CVF_TPGR_SECOND_UPGRADE_CRITIQUE_RECONCILIATION_AND_REVISED_PLAN_2026-08-17.md",
        )
        self.assertEqual(
            superseded[0].matched_hash,
            "6cc0cde0dd98b6dbc79aa9bd01357e24fcc4657860c67e5aa1ca7ec1c7882653",
        )

    # 2: untracked evidence cannot authorize --------------------------------

    def test_untracked_evidence_cannot_authorize_supersession(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            plan_hash = _sha256_of(TARGET_PLAN_TEXT)
            self._committed_fixture(
                root,
                active_next=f"Next allowed move: dispatch critique of `{TARGET_PLAN_PATH}` to a worker.",
                evidence_name=None,
            )
            # Add evidence AFTER the commit, leaving it untracked.
            _write_reconciliation_evidence(
                root,
                evidence_name="CVF_UNTRACKED_2026-08-17.md",
                target_path=TARGET_PLAN_PATH,
                sha256=plan_hash,
            )
            code, text = self._run(root, ["--enforce"])
            self.assertEqual(code, 0)
            self.assertIn("COMPLIANT", text)
            self.assertIn("Superseded exact targets discovered: 0", text)

    # 3 / 17: dirty tracked target ------------------------------------------

    def test_dirty_tracked_target_cannot_authorize_through_working_tree_edits(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            plan_hash = _sha256_of(TARGET_PLAN_TEXT)
            self._committed_fixture(
                root,
                active_next=f"Next allowed move: dispatch critique of `{TARGET_PLAN_PATH}` to a worker.",
                evidence_sha256=plan_hash,
            )
            # Dirty the tracked target after commit (unstaged edit).
            _write(root, TARGET_PLAN_PATH, TARGET_PLAN_TEXT + "\nDirty edit.\n")
            code, text = self._run(root, ["--enforce"])
            self.assertEqual(code, 1)
            self.assertIn("AMBIGUOUS_DIRTY_TARGET", text)
            self.assertIn("Superseded exact targets discovered: 0", text)

    def test_dirty_tracked_target_produces_explicit_ambiguity_violation(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            plan_hash = _sha256_of(TARGET_PLAN_TEXT)
            self._committed_fixture(
                root,
                active_next=f"Next allowed move: dispatch critique of `{TARGET_PLAN_PATH}` to a worker.",
                evidence_sha256=plan_hash,
            )
            _write(root, TARGET_PLAN_PATH, TARGET_PLAN_TEXT + "\nDirty edit.\n")
            with patch.object(MODULE, "REPO_ROOT", root):
                superseded, ambiguity = MODULE.find_superseded_targets({TARGET_PLAN_PATH})
            self.assertEqual(superseded, [])
            self.assertEqual(len(ambiguity), 1)
            self.assertIn("AMBIGUOUS", ambiguity[0])

    # 18: exact hash from working-tree bytes but not HEAD bytes -------------

    def test_working_tree_hash_alone_cannot_authorize(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            dirty_text = TARGET_PLAN_TEXT + "\nDirty edit only in working tree.\n"
            dirty_hash = _sha256_of(dirty_text)
            self._committed_fixture(
                root,
                active_next=f"Next allowed move: dispatch critique of `{TARGET_PLAN_PATH}` to a worker.",
                evidence_sha256=dirty_hash,
            )
            # Now dirty the working tree to actually match dirty_hash; the
            # committed HEAD blob still matches TARGET_PLAN_TEXT, not this.
            _write(root, TARGET_PLAN_PATH, dirty_text)
            code, text = self._run(root, ["--enforce"])
            # The target is now dirty (working tree != HEAD), so this must
            # report ambiguity, never quietly accept the working-tree hash.
            self.assertEqual(code, 1)
            self.assertIn("AMBIGUOUS_DIRTY_TARGET", text)
            self.assertIn("Superseded exact targets discovered: 0", text)

    # 4 / 5 / 6 / 7 / 8 / 9: commit-token verification chain ----------------

    def test_arbitrary_fake_commit_token_cannot_authorize(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            fake_commit = "a" * 40
            self._committed_fixture(
                root,
                active_next=f"Next allowed move: dispatch critique of `{TARGET_PLAN_PATH}` to a worker.",
                evidence_commit=fake_commit,
            )
            code, text = self._run(root, ["--enforce"])
            self.assertEqual(code, 0)
            self.assertIn("Superseded exact targets discovered: 0", text)

    def test_nonexistent_commit_cannot_authorize(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            # Well-formed 40-hex but not a real object in this repo.
            nonexistent = "deadbeef" + "0" * 32
            self._committed_fixture(
                root,
                active_next=f"Next allowed move: dispatch critique of `{TARGET_PLAN_PATH}` to a worker.",
                evidence_commit=nonexistent,
            )
            code, text = self._run(root, ["--enforce"])
            self.assertEqual(code, 0)
            self.assertIn("Superseded exact targets discovered: 0", text)

    def test_non_ancestor_commit_cannot_authorize(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            _init_repo(root)
            _write(root, TARGET_PLAN_PATH, TARGET_PLAN_TEXT)
            _write_surfaces(root, active_next="placeholder")
            _commit_all(root, "base")
            # Branch off, make an unrelated commit that never merges back,
            # so it exists but is NOT an ancestor of the eventual HEAD.
            _git(root, "checkout", "-q", "-b", "side-branch")
            _write(root, "docs/assessments/SIDE.md", "side\n")
            _commit_all(root, "side commit")
            side_commit = _git(root, "rev-parse", "HEAD").stdout.decode().strip()
            _git(root, "checkout", "-q", "-")
            _git(root, "checkout", "-q", "-b", "main-continued")
            _write_reconciliation_evidence(
                root,
                evidence_name="CVF_RECONCILIATION_2026-08-17.md",
                target_path=TARGET_PLAN_PATH,
                commit_hash=side_commit,
            )
            _write_surfaces(
                root,
                active_next=f"Next allowed move: dispatch critique of `{TARGET_PLAN_PATH}` to a worker.",
            )
            _commit_all(root, "main continuation")
            code, text = self._run(root, ["--enforce"])
            self.assertEqual(code, 0)
            self.assertIn("Superseded exact targets discovered: 0", text)

    def test_short_commit_cannot_authorize(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            _init_repo(root)
            _write(root, TARGET_PLAN_PATH, TARGET_PLAN_TEXT)
            first_commit = _commit_all(root, "add target")
            short_commit = first_commit[:10]
            _write_reconciliation_evidence(
                root,
                evidence_name="CVF_RECONCILIATION_2026-08-17.md",
                target_path=TARGET_PLAN_PATH,
                commit_hash=short_commit,
            )
            _write_surfaces(
                root,
                active_next=f"Next allowed move: dispatch critique of `{TARGET_PLAN_PATH}` to a worker.",
            )
            _commit_all(root, "add evidence")
            code, text = self._run(root, ["--enforce"])
            self.assertEqual(code, 0)
            self.assertIn("Superseded exact targets discovered: 0", text)

    def test_ancestor_commit_with_different_target_bytes_cannot_authorize(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            _init_repo(root)
            _write(root, TARGET_PLAN_PATH, TARGET_PLAN_TEXT)
            first_commit = _commit_all(root, "add target v1")
            # Change the target's content in a later commit; first_commit IS
            # an ancestor of HEAD, but its target bytes differ from HEAD's.
            _write(root, TARGET_PLAN_PATH, TARGET_PLAN_TEXT + "\nChanged later.\n")
            _write_reconciliation_evidence(
                root,
                evidence_name="CVF_RECONCILIATION_2026-08-17.md",
                target_path=TARGET_PLAN_PATH,
                commit_hash=first_commit,
            )
            _write_surfaces(
                root,
                active_next=f"Next allowed move: dispatch critique of `{TARGET_PLAN_PATH}` to a worker.",
            )
            _commit_all(root, "change target and add evidence")
            code, text = self._run(root, ["--enforce"])
            self.assertEqual(code, 0)
            self.assertIn("Superseded exact targets discovered: 0", text)

    def test_verified_ancestor_commit_with_byte_identical_target_authorizes(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            _init_repo(root)
            _write(root, TARGET_PLAN_PATH, TARGET_PLAN_TEXT)
            first_commit = _commit_all(root, "add target")
            # No further edits to the target: first_commit's target bytes
            # are byte-identical to HEAD's target bytes.
            _write_reconciliation_evidence(
                root,
                evidence_name="CVF_RECONCILIATION_2026-08-17.md",
                target_path=TARGET_PLAN_PATH,
                commit_hash=first_commit,
            )
            _write_surfaces(
                root,
                active_next=f"Next allowed move: dispatch critique of `{TARGET_PLAN_PATH}` to a worker.",
            )
            _commit_all(root, "add evidence")
            code, text = self._run(root, ["--enforce"])
            self.assertEqual(code, 1)
            self.assertIn(TARGET_PLAN_PATH, text)
            self.assertIn("Superseded exact targets discovered: 1", text)

    # 10: path/hash/terminal words in separate unrelated rows ---------------

    def test_path_hash_and_terminal_words_in_separate_rows_cannot_combine(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            _init_repo(root)
            _write(root, TARGET_PLAN_PATH, TARGET_PLAN_TEXT)
            plan_hash = _sha256_of(TARGET_PLAN_TEXT)
            body = (
                "# Unrelated Multi-Row Evidence\n\n"
                "Final reconciliation disposition:\n`ACCEPT_REVISE_BEFORE_IMPLEMENTATION_PLANNING`.\n\n"
                "## Target / Source\n\n"
                f"| this row names the target only | `{TARGET_PLAN_PATH}` | no hash here |\n"
                f"| an unrelated row carries a hash | SHA-256 `{plan_hash}` for a DIFFERENT file | not this target |\n"
            )
            _write(root, "docs/reviews/CVF_SPLIT_ROWS_2026-08-17.md", body)
            _write_surfaces(
                root,
                active_next=f"Next allowed move: dispatch critique of `{TARGET_PLAN_PATH}` to a worker.",
            )
            _commit_all(root, "fixture")
            code, text = self._run(root, ["--enforce"])
            self.assertEqual(code, 0)
            self.assertIn("Superseded exact targets discovered: 0", text)

    # 11: "reconciliation" only in the document title ------------------------

    def test_reconciliation_word_only_in_title_cannot_authorize(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            _init_repo(root)
            _write(root, TARGET_PLAN_PATH, TARGET_PLAN_TEXT)
            plan_hash = _sha256_of(TARGET_PLAN_TEXT)
            body = (
                "# Some Reconciliation-Adjacent Title With No Real Disposition\n\n"
                "## Target / Source\n\n"
                f"| original critique plan | `{TARGET_PLAN_PATH}`; SHA-256 `{plan_hash}` | CVF-governed planning source |\n\n"
                "This document never states a recognized disposition label/token pair.\n"
            )
            _write(root, "docs/reviews/CVF_TITLE_ONLY_2026-08-17.md", body)
            _write_surfaces(
                root,
                active_next=f"Next allowed move: dispatch critique of `{TARGET_PLAN_PATH}` to a worker.",
            )
            _commit_all(root, "fixture")
            code, text = self._run(root, ["--enforce"])
            self.assertEqual(code, 0)
            self.assertIn("Superseded exact targets discovered: 0", text)

    # 12: advisory critique with exact hash remains non-terminal ------------

    def test_advisory_critique_with_exact_hash_remains_non_terminal(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            plan_hash = _sha256_of(TARGET_PLAN_TEXT)
            self._committed_fixture(
                root,
                active_next=f"Next allowed move: dispatch critique of `{TARGET_PLAN_PATH}` to a worker.",
                evidence_name="CVF_CRITIQUE_ONLY_2026-08-17.md",
                evidence_sha256=plan_hash,
                evidence_terminal=False,
            )
            code, text = self._run(root, ["--enforce"])
            self.assertEqual(code, 0)
            self.assertIn("COMPLIANT", text)
            evidence_text = (root / "docs/reviews/CVF_CRITIQUE_ONLY_2026-08-17.md").read_text()
            self.assertEqual(MODULE.classify_document_terminality(evidence_text), "ADVISORY_ONLY")

    # 13: Windows path form detects the same superseded target --------------

    def test_windows_style_path_detects_the_same_superseded_target(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            plan_hash = _sha256_of(TARGET_PLAN_TEXT)
            windows_style = TARGET_PLAN_PATH.replace("/", "\\")
            self._committed_fixture(
                root,
                active_next=f"Next allowed move: dispatch critique of `{windows_style}` to a worker.",
                evidence_sha256=plan_hash,
            )
            code, text = self._run(root, ["--enforce"])
            self.assertEqual(code, 1)
            self.assertIn(TARGET_PLAN_PATH, text)
            self.assertIn("Superseded exact targets discovered: 1", text)

    # 14: traversal and drive-letter paths fail closed -----------------------

    def test_traversal_path_fails_closed(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            plan_hash = _sha256_of(TARGET_PLAN_TEXT)
            traversal_path = "docs/assessments/../assessments/CVF_TASK_PROPORTIONAL_GOVERNANCE_SECOND_UPGRADE_EXTERNAL_CRITIQUE_PLAN_2026-08-17.md"
            self.assertIsNone(MODULE.normalize_target_path(traversal_path))
            self._committed_fixture(
                root,
                active_next=f"Next allowed move: dispatch critique of `{traversal_path}` to a worker.",
                evidence_sha256=plan_hash,
            )
            code, text = self._run(root, ["--enforce"])
            self.assertEqual(code, 1)
            self.assertIn("unsafe or ambiguous governed target mention", text)
            self.assertIn("AMBIGUOUS_DIRTY_TARGET", text)

    def test_drive_letter_path_fails_closed(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            plan_hash = _sha256_of(TARGET_PLAN_TEXT)
            drive_path = "C:\\docs\\assessments\\CVF_TASK_PROPORTIONAL_GOVERNANCE_SECOND_UPGRADE_EXTERNAL_CRITIQUE_PLAN_2026-08-17.md"
            self.assertIsNone(MODULE.normalize_target_path(drive_path))
            self._committed_fixture(
                root,
                active_next=f"Next allowed move: dispatch critique of `{drive_path}` to a worker.",
                evidence_sha256=plan_hash,
            )
            code, text = self._run(root, ["--enforce"])
            self.assertEqual(code, 1)
            self.assertIn("unsafe or ambiguous governed target mention", text)
            self.assertIn("AMBIGUOUS_DIRTY_TARGET", text)

    # 15 / 16: case/Unicode collision fails closed; untracked target ---------

    def test_case_collision_fails_closed_as_ambiguous(self) -> None:
        """A genuinely case-distinct collision pair cannot be created on a
        case-insensitive filesystem (Windows/default macOS), so this test
        exercises the collision-detection unit directly by controlling what
        `git ls-tree` reports, rather than relying on the OS to hold two
        case-variant files side by side."""
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            _init_repo(root)
            _write(root, TARGET_PLAN_PATH, TARGET_PLAN_TEXT)
            plan_hash = _sha256_of(TARGET_PLAN_TEXT)
            _write_reconciliation_evidence(
                root,
                evidence_name="CVF_RECONCILIATION_2026-08-17.md",
                target_path=TARGET_PLAN_PATH,
                sha256=plan_hash,
            )
            _write_surfaces(
                root,
                active_next=f"Next allowed move: dispatch critique of `{TARGET_PLAN_PATH}` to a worker.",
            )
            _commit_all(root, "fixture")

            case_variant = TARGET_PLAN_PATH.replace(
                "CVF_TASK_PROPORTIONAL", "cvf_task_proportional"
            )
            with patch.object(
                MODULE, "_ls_tree_paths_ci", return_value=[TARGET_PLAN_PATH, case_variant]
            ):
                with patch.object(MODULE, "REPO_ROOT", root):
                    identity, reason = MODULE.resolve_target_identity(TARGET_PLAN_PATH)
                    self.assertIsNone(identity)
                    self.assertIsNotNone(reason)
                    self.assertIn("AMBIGUOUS", reason)
                    code, text = self._run(root, ["--enforce"])
            self.assertEqual(code, 1)
            self.assertIn("AMBIGUOUS", text)
            self.assertIn("Superseded exact targets discovered: 0", text)

    def test_untracked_target_cannot_become_superseded(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            plan_hash = _sha256_of(TARGET_PLAN_TEXT)
            self._committed_fixture(
                root,
                active_next=f"Next allowed move: dispatch critique of `{TARGET_PLAN_PATH}` to a worker.",
                write_target=False,
                evidence_sha256=plan_hash,
            )
            # Target file was never committed (write_target=False); write it
            # now, untracked, after the commit.
            _write(root, TARGET_PLAN_PATH, TARGET_PLAN_TEXT)
            code, text = self._run(root, ["--enforce"])
            self.assertEqual(code, 0)
            self.assertIn("Superseded exact targets discovered: 0", text)

    # Remaining adversarial/compat cases carried forward from the original
    # implementation, adapted to committed fixtures -------------------------

    def test_same_title_different_path_does_not_reject(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            other_path = "docs/assessments/CVF_TASK_PROPORTIONAL_GOVERNANCE_SECOND_UPGRADE_EXTERNAL_CRITIQUE_PLAN_2026-08-18.md"
            _init_repo(root)
            _write(root, other_path, TARGET_PLAN_TEXT)
            _write(root, TARGET_PLAN_PATH, TARGET_PLAN_TEXT)
            _write_reconciliation_evidence(
                root,
                evidence_name="CVF_RECONCILIATION_2026-08-17.md",
                target_path=TARGET_PLAN_PATH,
                sha256=_sha256_of(TARGET_PLAN_TEXT),
            )
            _write_surfaces(
                root,
                active_next=f"Next allowed move: dispatch critique of `{other_path}` to a worker.",
            )
            _commit_all(root, "fixture")
            code, text = self._run(root, ["--enforce"])
            self.assertEqual(code, 0)
            self.assertIn("COMPLIANT", text)

    def test_critique_without_reconciliation_does_not_reject(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            plan_hash = _sha256_of(TARGET_PLAN_TEXT)
            self._committed_fixture(
                root,
                active_next=f"Next allowed move: dispatch critique of `{TARGET_PLAN_PATH}` to a worker.",
                evidence_name="CVF_CRITIQUE_ONLY_2026-08-17.md",
                evidence_sha256=plan_hash,
                evidence_terminal=False,
            )
            code, text = self._run(root, ["--enforce"])
            self.assertEqual(code, 0)
            self.assertIn("COMPLIANT", text)

    def test_historical_citation_only_does_not_reject(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            _init_repo(root)
            _write(root, TARGET_PLAN_PATH, TARGET_PLAN_TEXT)
            _write_reconciliation_evidence(
                root,
                evidence_name="CVF_RECONCILIATION_2026-08-17.md",
                target_path=TARGET_PLAN_PATH,
                sha256=_sha256_of(TARGET_PLAN_TEXT),
            )
            _write_surfaces(
                root,
                active_next="Next allowed move: fresh operator authorization only.",
                front_next=(
                    f"Historical evidence: `{TARGET_PLAN_PATH}` was previously reviewed. "
                    "Next allowed move: fresh operator authorization only."
                ),
            )
            _commit_all(root, "fixture")
            code, text = self._run(root, ["--enforce"])
            self.assertEqual(code, 0)
            self.assertIn("COMPLIANT", text)

    def test_do_not_reopen_language_does_not_reject(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            plan_hash = _sha256_of(TARGET_PLAN_TEXT)
            self._committed_fixture(
                root,
                active_next=(
                    f"Do not reopen or redispatch `{TARGET_PLAN_PATH}`; it is already "
                    "reconciled and superseded."
                ),
                evidence_sha256=plan_hash,
            )
            code, text = self._run(root, ["--enforce"])
            self.assertEqual(code, 0)
            self.assertIn("COMPLIANT", text)

    def test_malformed_ambiguous_binding_fails_safely_without_inventing_supersession(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            _init_repo(root)
            _write(root, TARGET_PLAN_PATH, TARGET_PLAN_TEXT)
            _write(
                root,
                "docs/reviews/CVF_MALFORMED_2026-08-17.md",
                "# Malformed Evidence\n\n"
                f"original critique plan `{TARGET_PLAN_PATH}` SHA-256 `not-a-real-hash` "
                "Final reconciliation disposition:\n`ACCEPT_REVISE_BEFORE_IMPLEMENTATION_PLANNING`.\n",
            )
            _write_surfaces(
                root,
                active_next=f"Next allowed move: dispatch critique of `{TARGET_PLAN_PATH}` to a worker.",
            )
            _commit_all(root, "fixture")
            code, text = self._run(root, ["--enforce"])
            self.assertEqual(code, 0)
            self.assertIn("COMPLIANT", text)
            self.assertIn("Superseded exact targets discovered: 0", text)

    def test_exact_path_changed_hash_does_not_treat_stale_reconciliation_as_current(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            stale_hash = _sha256_of(TARGET_PLAN_TEXT)
            self._committed_fixture(
                root,
                active_next=f"Next allowed move: dispatch critique of `{TARGET_PLAN_PATH}` to a worker.",
                target_text=TARGET_PLAN_TEXT + "\nChanged after reconciliation.\n",
                evidence_sha256=stale_hash,
            )
            code, text = self._run(root, ["--enforce"])
            self.assertEqual(code, 0)
            self.assertIn("COMPLIANT", text)
            self.assertIn("Superseded exact targets discovered: 0", text)

    def test_current_valid_new_plan_with_no_downstream_consumer_passes(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            new_plan_path = "docs/assessments/CVF_BRAND_NEW_PLAN_2026-08-30.md"
            _init_repo(root)
            _write(root, new_plan_path, "# Brand New Plan\n")
            _write_surfaces(
                root,
                active_next=f"Next allowed move: dispatch critique of `{new_plan_path}` to a worker.",
            )
            _commit_all(root, "fixture")
            code, text = self._run(root, ["--enforce"])
            self.assertEqual(code, 0)
            self.assertIn("COMPLIANT", text)

    def test_existing_closed_lane_behavior_remains_byte_compatible(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            _init_repo(root)
            _write_surfaces(
                root,
                active_next="Next allowed move: dispatch Model Gateway C-02 P2 to Claude.",
            )
            _commit_all(root, "fixture")
            code, text = self._run(root, ["--enforce"])
            self.assertEqual(code, 1)
            self.assertIn("Model Gateway C-02 P2", text)
            self.assertIn("Exact-target candidates scanned: 0", text)

    def test_provider_or_model_name_in_evidence_filename_is_not_treated_as_authority(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            plan_hash = _sha256_of(TARGET_PLAN_TEXT)
            self._committed_fixture(
                root,
                active_next=f"Next allowed move: dispatch critique of `{TARGET_PLAN_PATH}` to a worker.",
                evidence_name="CVF_CLAUDE_GPT4_GEMINI_RECONCILIATION_2026-08-17.md",
                evidence_sha256=plan_hash,
            )
            code, text = self._run(root, ["--enforce"])
            self.assertEqual(code, 1)
            self.assertIn(TARGET_PLAN_PATH, text)

    def test_binding_evidence_in_archive_directory_is_ignored(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            plan_hash = _sha256_of(TARGET_PLAN_TEXT)
            self._committed_fixture(
                root,
                active_next=f"Next allowed move: dispatch critique of `{TARGET_PLAN_PATH}` to a worker.",
                evidence_sha256=plan_hash,
                evidence_dir="docs/reviews/archive",
            )
            code, text = self._run(root, ["--enforce"])
            self.assertEqual(code, 0)
            self.assertIn("COMPLIANT", text)
            self.assertIn("Superseded exact targets discovered: 0", text)

    # 20: deliberate regression-guard demonstrations -------------------------

    def test_regression_guard_fails_when_new_rule_disabled(self) -> None:
        """Disable find_superseded_targets: the TPGR-style fixture must
        incorrectly pass. Restore: it must reject again. No file is left
        mutated (patch.object is a context manager, restored automatically)."""
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            plan_hash = _sha256_of(TARGET_PLAN_TEXT)
            self._committed_fixture(
                root,
                active_next=f"Next allowed move: dispatch critique of `{TARGET_PLAN_PATH}` to a worker.",
                evidence_sha256=plan_hash,
            )

            with patch.object(MODULE, "find_superseded_targets", return_value=([], [])):
                code_disabled, text_disabled = self._run(root, ["--enforce"])
            self.assertEqual(
                code_disabled, 0,
                "regression guard: with the rule disabled, the stale TPGR-style "
                "dispatch must incorrectly pass, proving the rule (not an "
                "unrelated gate) is what catches this case",
            )
            self.assertIn("COMPLIANT", text_disabled)

            code_restored, text_restored = self._run(root, ["--enforce"])
            self.assertEqual(code_restored, 1)
            self.assertIn(TARGET_PLAN_PATH, text_restored)

    def test_regression_guard_forged_evidence_rejected_then_accepted_as_negative_test(self) -> None:
        """Disable commit/evidence verification (_verify_commit_binding
        forced to always return True): a forged/non-ancestor commit token
        must then incorrectly authorize supersession, proving verification
        - not luck - is what rejects forged evidence normally. Restore: the
        same forged token must be rejected again."""
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            forged_commit = "b" * 40
            self._committed_fixture(
                root,
                active_next=f"Next allowed move: dispatch critique of `{TARGET_PLAN_PATH}` to a worker.",
                evidence_commit=forged_commit,
            )

            code_normal, text_normal = self._run(root, ["--enforce"])
            self.assertEqual(code_normal, 0)
            self.assertIn("Superseded exact targets discovered: 0", text_normal)

            with patch.object(MODULE, "_verify_commit_binding", return_value=True):
                code_forced, text_forced = self._run(root, ["--enforce"])
            self.assertEqual(
                code_forced, 1,
                "regression guard: with commit verification forced to always "
                "succeed, the forged commit token must incorrectly authorize "
                "supersession, proving verification is what normally blocks it",
            )
            self.assertIn("Superseded exact targets discovered: 1", text_forced)

            code_restored, text_restored = self._run(root, ["--enforce"])
            self.assertEqual(code_restored, 0)
            self.assertIn("Superseded exact targets discovered: 0", text_restored)


if __name__ == "__main__":
    unittest.main()
