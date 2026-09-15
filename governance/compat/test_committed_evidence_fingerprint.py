#!/usr/bin/env python3
"""Hostile/unit tests for the canonical committed-evidence fingerprint helper.

Uses real temporary Git repositories for every committed-vs-worktree,
CRLF/binary/Unicode, add/modify/delete, and dirty-state proof -- never mocked
Git plumbing for those cases. Independently constructed expected values (via
direct ``git`` subprocess calls in the test body) are used where the recipe
itself is under test, so the helper is never compared only with itself.

Text Encoding Exception: this file intentionally includes literal non-ASCII
path characters (CJK and accented Latin) in one fixture to prove the shared
helper preserves Unicode/space-containing repository paths exactly, per the
work order's required hostile matrix row for Unicode/spaces paths.
"""

from __future__ import annotations

import hashlib
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

import committed_evidence_fingerprint as cef  # noqa: E402


class _TempRepoTestCase(unittest.TestCase):
    def setUp(self) -> None:
        self._tmp = tempfile.mkdtemp(prefix="cef-fingerprint-")
        self._repo = Path(self._tmp)
        self._git("init", "-q")
        self._git("config", "user.email", "test@example.invalid")
        self._git("config", "user.name", "CEF Test")

    def tearDown(self) -> None:
        import shutil

        shutil.rmtree(self._tmp, ignore_errors=True)

    def _git(self, *args: str) -> str:
        proc = subprocess.run(
            ["git", *args], cwd=self._repo, capture_output=True, text=True,
        )
        assert proc.returncode == 0, f"git {args} failed: {proc.stderr}"
        return proc.stdout.strip()

    def _git_bytes(self, *args: str) -> bytes:
        proc = subprocess.run(["git", *args], cwd=self._repo, capture_output=True)
        assert proc.returncode == 0, f"git {args} failed: {proc.stderr!r}"
        return proc.stdout

    def _write(self, relative: str, content: bytes) -> None:
        target = self._repo / relative
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_bytes(content)

    def _commit(self, message: str, *, add_all: bool = True) -> str:
        if add_all:
            self._git("add", "-A")
        self._git("commit", "-q", "-m", message)
        return self._git("rev-parse", "HEAD")


class DeterministicFingerprintTests(_TempRepoTestCase):
    def test_deterministic_across_repeated_computation(self):
        self._write("a.txt", b"stable content")
        base = self._commit("A")
        self._write("a.txt", b"stable content v2")
        head = self._commit("B")

        fp1 = cef.compute_committed_evidence_fingerprint(base, head, cwd=self._repo)
        fp2 = cef.compute_committed_evidence_fingerprint(base, head, cwd=self._repo)
        self.assertEqual(fp1, fp2)

    def test_fingerprint_changes_when_committed_content_changes(self):
        self._write("a.txt", b"version one")
        base = self._commit("A")
        self._write("a.txt", b"version two")
        head_1 = self._commit("B")
        fp_1 = cef.compute_committed_evidence_fingerprint(base, head_1, cwd=self._repo)

        self._git("reset", "-q", "--hard", base)
        self._write("a.txt", b"version three")
        head_2 = self._commit("B2")
        fp_2 = cef.compute_committed_evidence_fingerprint(base, head_2, cwd=self._repo)

        self.assertNotEqual(fp_1, fp_2)

    def test_mutable_worktree_bytes_cannot_substitute_for_committed_blob(self):
        self._write("g.txt", b"committed content")
        base = self._commit("A")
        self._write("g.txt", b"committed content v2")
        head = self._commit("B")
        fp_before_dirty = cef.compute_committed_evidence_fingerprint(base, head, cwd=self._repo)

        (self._repo / "g.txt").write_bytes(b"DIRTY UNCOMMITTED CONTENT")
        fp_after_dirty = cef.compute_committed_evidence_fingerprint(base, head, cwd=self._repo)

        self.assertEqual(
            fp_before_dirty, fp_after_dirty,
            msg="fingerprint must be sourced from the committed blob, not the dirtied worktree file",
        )

    def test_dirty_untracked_or_staged_drift_does_not_change_result(self):
        self._write("h.txt", b"base content")
        base = self._commit("A")
        self._write("h.txt", b"changed content")
        head = self._commit("B")
        fp_clean = cef.compute_committed_evidence_fingerprint(base, head, cwd=self._repo)

        self._write("untracked.txt", b"untracked drift")
        self._git("add", "untracked.txt")
        fp_with_staged_drift = cef.compute_committed_evidence_fingerprint(base, head, cwd=self._repo)

        self.assertEqual(fp_clean, fp_with_staged_drift)


class CrlfBinaryUnicodeTests(_TempRepoTestCase):
    def test_crlf_checkout_representation_is_irrelevant_autocrlf_true(self):
        """The recurring MFRP-FINGERPRINT-T1 defect: core.autocrlf must never
        change the committed-evidence fingerprint, because every byte is
        read from the Git blob, never from a checked-out file.
        """
        self._git("config", "core.autocrlf", "true")
        self._write("f.txt", b"line1\r\nline2\r\n")
        base = self._commit("A")
        self._write("f.txt", b"line1\r\nline2\r\nline3\r\n")
        head = self._commit("B")

        fp_autocrlf_true = cef.compute_committed_evidence_fingerprint(base, head, cwd=self._repo)

        self._git("config", "core.autocrlf", "false")
        fp_autocrlf_false = cef.compute_committed_evidence_fingerprint(base, head, cwd=self._repo)

        self.assertEqual(fp_autocrlf_true, fp_autocrlf_false)

    def test_independently_computed_expected_hash_for_single_added_file(self):
        self._git("config", "core.autocrlf", "false")
        content = b"line1\r\nline2\r\n"
        self._write("only.txt", b"")
        base = self._commit("empty base")
        self._write("only.txt", content)
        head = self._commit("add only.txt")

        actual = cef.compute_committed_evidence_fingerprint(base, head, cwd=self._repo)

        blob_sha = self._git("rev-parse", f"{head}:only.txt")
        blob_bytes = self._git_bytes("cat-file", "blob", blob_sha)
        self.assertEqual(blob_bytes, content, "sanity: with autocrlf=false the raw committed bytes must be exactly the written CRLF bytes")
        expected = hashlib.sha256()
        expected.update(b"only.txt")
        expected.update(b"\0")
        expected.update(hashlib.sha256(blob_bytes).digest())
        expected.update(b"\0")
        self.assertEqual(actual, expected.hexdigest())

    def test_binary_bytes_are_hashed_without_lossy_normalization(self):
        binary_content = bytes(range(256))
        self._write("bin.dat", b"")
        base = self._commit("empty base")
        self._write("bin.dat", binary_content)
        head = self._commit("add binary")

        actual = cef.compute_committed_evidence_fingerprint(base, head, cwd=self._repo)
        blob_sha = self._git("rev-parse", f"{head}:bin.dat")
        blob_bytes = self._git_bytes("cat-file", "blob", blob_sha)
        self.assertEqual(blob_bytes, binary_content)

        expected = hashlib.sha256()
        expected.update(b"bin.dat")
        expected.update(b"\0")
        expected.update(hashlib.sha256(blob_bytes).digest())
        expected.update(b"\0")
        self.assertEqual(actual, expected.hexdigest())

    def test_unicode_and_space_containing_paths_are_preserved(self):
        unicode_path = "dir 中文/file with spaces éè.txt"
        self._write(unicode_path, b"")
        base = self._commit("empty base")
        self._write(unicode_path, b"unicode path content")
        head = self._commit("add unicode path")

        actual = cef.compute_committed_evidence_fingerprint(base, head, cwd=self._repo)
        blob_sha = self._git("rev-parse", f"{head}:{unicode_path}")
        blob_bytes = self._git_bytes("cat-file", "blob", blob_sha)

        expected = hashlib.sha256()
        expected.update(unicode_path.encode("utf-8"))
        expected.update(b"\0")
        expected.update(hashlib.sha256(blob_bytes).digest())
        expected.update(b"\0")
        self.assertEqual(actual, expected.hexdigest())


class AddModifyDeleteRenameTests(_TempRepoTestCase):
    def test_added_modified_and_deleted_paths_agree_with_missing_sentinel(self):
        self._write("keep.txt", b"unchanged")
        self._write("modify.txt", b"before")
        self._write("delete.txt", b"will be deleted")
        base = self._commit("base with three files")

        self._write("modify.txt", b"after")
        self._write("add.txt", b"newly added")
        (self._repo / "delete.txt").unlink()
        self._git("add", "-A")
        head = self._commit("modify, add, delete")

        actual = cef.compute_committed_evidence_fingerprint(base, head, cwd=self._repo)

        changed = sorted(
            self._git("diff", "--no-renames", "--name-only", f"{base}..{head}").splitlines()
        )
        self.assertEqual(changed, ["add.txt", "delete.txt", "modify.txt"])

        expected = hashlib.sha256()
        for path in changed:
            expected.update(path.encode("utf-8"))
            expected.update(b"\0")
            if path == "delete.txt":
                expected.update(b"<missing-or-directory>")
            else:
                blob_sha = self._git("rev-parse", f"{head}:{path}")
                blob_bytes = self._git_bytes("cat-file", "blob", blob_sha)
                expected.update(hashlib.sha256(blob_bytes).digest())
            expected.update(b"\0")
        self.assertEqual(actual, expected.hexdigest())

    def test_no_renames_reports_rename_as_independent_delete_and_add(self):
        self._write("old_name.txt", b"rename target content")
        base = self._commit("base with old name")

        self._git("mv", "old_name.txt", "new_name.txt")
        head = self._commit("rename old_name.txt to new_name.txt")

        changed = sorted(
            self._git("diff", "--no-renames", "--name-only", f"{base}..{head}").splitlines()
        )
        self.assertEqual(changed, ["new_name.txt", "old_name.txt"])

        actual = cef.compute_committed_evidence_fingerprint(base, head, cwd=self._repo)
        expected = hashlib.sha256()
        for path in changed:
            expected.update(path.encode("utf-8"))
            expected.update(b"\0")
            if path == "old_name.txt":
                expected.update(b"<missing-or-directory>")
            else:
                blob_sha = self._git("rev-parse", f"{head}:{path}")
                blob_bytes = self._git_bytes("cat-file", "blob", blob_sha)
                expected.update(hashlib.sha256(blob_bytes).digest())
            expected.update(b"\0")
        self.assertEqual(actual, expected.hexdigest())


class RangeAndAncestryFailureTests(_TempRepoTestCase):
    def test_non_ancestor_range_is_unavailable(self):
        self._write("a.txt", b"one")
        commit_a = self._commit("A")
        self._git("checkout", "-q", "--orphan", "other-branch")
        self._git("rm", "-rq", "--cached", ".")
        for entry in self._repo.iterdir():
            if entry.name != ".git":
                if entry.is_dir():
                    import shutil

                    shutil.rmtree(entry)
                else:
                    entry.unlink()
        self._write("b.txt", b"two")
        commit_b = self._commit("B on unrelated root")

        with self.assertRaises(cef.CommittedEvidenceUnavailable):
            cef.compute_committed_evidence_fingerprint(commit_a, commit_b, cwd=self._repo)

    def test_short_sha_is_rejected_requires_full_forty_char_sha(self):
        self._write("a.txt", b"one")
        base = self._commit("A")
        self._write("a.txt", b"two")
        head = self._commit("B")

        with self.assertRaises(cef.CommittedEvidenceUnavailable):
            cef.compute_committed_evidence_fingerprint(base[:9], head, cwd=self._repo)
        with self.assertRaises(cef.CommittedEvidenceUnavailable):
            cef.compute_committed_evidence_fingerprint(base, head[:9], cwd=self._repo)

    def test_unresolved_ref_is_unavailable(self):
        with self.assertRaises(cef.CommittedEvidenceUnavailable):
            cef.resolve_full_sha("this-ref-does-not-exist", cwd=self._repo)

    def test_missing_blob_after_diff_enumeration_is_explicit_failure_not_sentinel(self):
        # Corrupt the object store reference path is impractical to simulate
        # safely in a hostile-but-hermetic test; instead prove the contract
        # via a path that git ls-tree cannot resolve for an invalid ref, i.e.
        # an internal call with a non-commit blob sha standing in for head.
        self._write("a.txt", b"one")
        base = self._commit("A")
        self._write("a.txt", b"two")
        head = self._commit("B")
        blob_sha_masquerading_as_commit = self._git("rev-parse", f"{head}:a.txt")

        with self.assertRaises(cef.CommittedEvidenceUnavailable):
            cef.compute_committed_evidence_fingerprint(
                base, blob_sha_masquerading_as_commit, cwd=self._repo
            )


class SymlinkAndGitlinkPolicyTests(_TempRepoTestCase):
    def test_symlink_entry_is_explicitly_rejected_not_followed(self):
        """Create a real Git tree symlink entry (mode 120000) directly
        through the index/object database, independent of the host OS's
        symlink support, so this proof is not conditionally skipped on
        platforms (including Windows without elevated privilege) where
        creating an actual filesystem symlink requires special rights.
        """
        self._write("target.txt", b"target content")
        base = self._commit("base")

        blob_sha = self._git_hash_object_stdin("target.txt")
        self._git(
            "update-index", "--add", "--cacheinfo", f"120000,{blob_sha},link.txt"
        )
        head = self._commit("add symlink entry via index", add_all=False)

        entry = self._git("ls-tree", head, "--", "link.txt")
        self.assertTrue(entry.startswith("120000 blob"), entry)

        with self.assertRaises(cef.CommittedEvidenceUnavailable) as ctx:
            cef.compute_committed_evidence_fingerprint(base, head, cwd=self._repo)
        self.assertIn("symlink", str(ctx.exception))

    def _git_hash_object_stdin(self, content: str) -> str:
        proc = subprocess.run(
            ["git", "hash-object", "-w", "--stdin"],
            cwd=self._repo, input=content, capture_output=True, text=True,
        )
        assert proc.returncode == 0, proc.stderr
        return proc.stdout.strip()

    def test_gitlink_entry_is_classified_and_explicitly_rejected(self):
        """A gitlink (commit mode 160000, submodule reference) must be
        explicitly rejected, never silently skipped as a deletion or
        followed into a nested repository.
        """
        self._write("regular.txt", b"regular content")
        base = self._commit("base")

        fake_submodule_commit = "1" * 40
        self._git(
            "update-index", "--add", "--cacheinfo",
            f"160000,{fake_submodule_commit},sub",
        )
        head = self._commit("add gitlink entry via index", add_all=False)

        entry = self._git("ls-tree", head, "--", "sub")
        self.assertIn("commit", entry)

        with self.assertRaises(cef.CommittedEvidenceUnavailable) as ctx:
            cef.compute_committed_evidence_fingerprint(base, head, cwd=self._repo)
        self.assertIn("gitlink", str(ctx.exception))


class ShapeValidationTests(unittest.TestCase):
    def _valid_object(self) -> dict:
        return {
            "profile": cef.COMMITTED_EVIDENCE_PROFILE,
            "baseSha": "a" * 40,
            "headSha": "b" * 40,
            "fingerprint": "c" * 64,
        }

    def test_valid_shape_accepted(self):
        valid, reason = cef.validate_committed_evidence_shape(self._valid_object())
        self.assertTrue(valid, reason)

    def test_extra_key_rejected(self):
        value = self._valid_object()
        value["extra"] = "unexpected"
        valid, _ = cef.validate_committed_evidence_shape(value)
        self.assertFalse(valid)

    def test_missing_key_rejected(self):
        value = self._valid_object()
        del value["fingerprint"]
        valid, _ = cef.validate_committed_evidence_shape(value)
        self.assertFalse(valid)

    def test_unknown_profile_rejected(self):
        value = self._valid_object()
        value["profile"] = "cvf.committedEvidenceFingerprint.v2"
        valid, _ = cef.validate_committed_evidence_shape(value)
        self.assertFalse(valid)

    def test_short_sha_rejected(self):
        value = self._valid_object()
        value["baseSha"] = "a" * 9
        valid, _ = cef.validate_committed_evidence_shape(value)
        self.assertFalse(valid)

    def test_uppercase_fingerprint_rejected(self):
        value = self._valid_object()
        value["fingerprint"] = "C" * 64
        valid, _ = cef.validate_committed_evidence_shape(value)
        self.assertFalse(valid)

    def test_non_dict_rejected(self):
        valid, _ = cef.validate_committed_evidence_shape("not-a-dict")
        self.assertFalse(valid)

    def test_none_rejected(self):
        valid, _ = cef.validate_committed_evidence_shape(None)
        self.assertFalse(valid)

    def test_boolean_rejected(self):
        valid, _ = cef.validate_committed_evidence_shape(True)
        self.assertFalse(valid)


class BuildCommittedEvidenceTests(_TempRepoTestCase):
    def test_build_committed_evidence_produces_valid_closed_shape(self):
        self._write("a.txt", b"one")
        base = self._commit("A")
        self._write("a.txt", b"two")
        head = self._commit("B")

        evidence = cef.build_committed_evidence(base, head, cwd=self._repo)
        valid, reason = cef.validate_committed_evidence_shape(evidence)
        self.assertTrue(valid, reason)
        self.assertEqual(evidence["baseSha"], base)
        self.assertEqual(evidence["headSha"], head)

    def test_build_committed_evidence_is_deterministic(self):
        self._write("a.txt", b"one")
        base = self._commit("A")
        self._write("a.txt", b"two")
        head = self._commit("B")

        first = cef.build_committed_evidence(base, head, cwd=self._repo)
        second = cef.build_committed_evidence(base, head, cwd=self._repo)
        self.assertEqual(first, second)


class WorktreeMatchesCommittedTargetTests(_TempRepoTestCase):
    """MFRP-FINGERPRINT-T1 rework-2 (F1): the historical-target admission
    check. A pure before/after worktree-fingerprint stability comparison
    cannot distinguish "the worktree reflects headSha" from "the worktree
    is stable at some later commit whose evidence paths already drifted
    away from headSha". This class proves ``verify_worktree_matches_
    committed_target`` makes exactly that distinction, using real temporary
    Git repositories (never mocked git plumbing).
    """

    def test_reviewer_counterexample_a_b_c_drift_is_rejected(self):
        """The exact Local-review counterexample: A is base, B is the
        target whose evidence.txt changes, C is a further commit that
        changes evidence.txt's content again (semantic drift), and the
        worktree is clean and stable at C. Admission for A..B must be
        rejected because the worktree (at C) does not match B's committed
        blob for evidence.txt, even though the worktree is perfectly
        stable and even though A is genuinely an ancestor of B.
        """
        self._write("evidence.txt", b"base content")
        commit_a = self._commit("A")
        self._write("evidence.txt", b"target content for B")
        commit_b = self._commit("B")
        self._write("evidence.txt", b"drifted content at C -- semantic change")
        self._commit("C")

        matches, reason = cef.verify_worktree_matches_committed_target(
            commit_a, commit_b, cwd=self._repo
        )
        self.assertFalse(matches, reason)
        self.assertIn("evidence.txt", reason)

    def test_continuity_only_later_head_still_admits(self):
        """A later commit that touches only an unrelated continuity path
        (not any A..B evidence path) must not block admission for A..B:
        the worktree, though parked at the continuity commit, still
        matches B's committed blob for every A..B changed path.
        """
        self._write("evidence.txt", b"base content")
        commit_a = self._commit("A")
        self._write("evidence.txt", b"target content for B")
        commit_b = self._commit("B")
        self._write("CONTINUITY.md", b"session sync notes only")
        self._commit("continuity-only C")

        matches, reason = cef.verify_worktree_matches_committed_target(
            commit_a, commit_b, cwd=self._repo
        )
        self.assertTrue(matches, reason)

    def test_clean_worktree_exactly_at_head_admits(self):
        """Control/positive case: worktree genuinely checked out at head
        (no later commit at all) must admit."""
        self._write("evidence.txt", b"base content")
        commit_a = self._commit("A")
        self._write("evidence.txt", b"target content for B")
        commit_b = self._commit("B")

        matches, reason = cef.verify_worktree_matches_committed_target(
            commit_a, commit_b, cwd=self._repo
        )
        self.assertTrue(matches, reason)

    def test_crlf_checkout_representation_still_admits(self):
        """A worktree file whose bytes differ only by core.autocrlf's CRLF
        checkout conversion from the committed LF blob must still be
        treated as matching -- git hash-object applies the same clean
        filter git add would, so this is Git's own canonical equivalence,
        not a hand-rolled normalization that could mask real drift.
        """
        self._git("config", "core.autocrlf", "true")
        self._write("evidence.txt", b"line1\r\nline2\r\n")
        commit_a = self._commit("A")
        self._write("evidence.txt", b"line1\r\nline2\r\nline3\r\n")
        commit_b = self._commit("B")

        # Simulate a fresh CRLF checkout of the worktree at head (the file
        # already has CRLF bytes on disk from the writes above; re-assert
        # the checkout explicitly to prove this is genuinely a checkout
        # representation, not merely "we happened to write CRLF bytes").
        self._git("checkout", "--", "evidence.txt")

        matches, reason = cef.verify_worktree_matches_committed_target(
            commit_a, commit_b, cwd=self._repo
        )
        self.assertTrue(matches, reason)

    def test_binary_semantic_change_at_head_target_is_rejected(self):
        """A binary file whose worktree bytes differ from the committed
        target's binary blob must be rejected -- binary content has no
        line-ending representation to tolerate, so any byte difference is
        genuine drift.
        """
        self._write("evidence.bin", bytes(range(0, 128)))
        commit_a = self._commit("A")
        self._write("evidence.bin", bytes(range(1, 129)))
        commit_b = self._commit("B")
        # Drift the worktree away from B's committed binary content
        # without a further commit (simulating a dirty/mismatched
        # worktree at exactly head_sha).
        self._write("evidence.bin", bytes(range(2, 130)))

        matches, reason = cef.verify_worktree_matches_committed_target(
            commit_a, commit_b, cwd=self._repo
        )
        self.assertFalse(matches, reason)
        self.assertIn("evidence.bin", reason)

    def test_deletion_at_head_requires_worktree_absence(self):
        """head_sha deletes a path; if the worktree still has content
        there (e.g. a later commit re-added it, or it was never removed),
        admission must be rejected."""
        self._write("to_delete.txt", b"will be deleted at B")
        commit_a = self._commit("A")
        (self._repo / "to_delete.txt").unlink()
        self._git("add", "-A")
        commit_b = self._commit("B deletes to_delete.txt")
        # Re-introduce the file in the worktree without committing --
        # simulates a later commit that resurrected it.
        self._write("to_delete.txt", b"resurrected content")

        matches, reason = cef.verify_worktree_matches_committed_target(
            commit_a, commit_b, cwd=self._repo
        )
        self.assertFalse(matches, reason)
        self.assertIn("to_delete.txt", reason)

    def test_deletion_at_head_with_worktree_absence_admits(self):
        """Positive case for deletion: head_sha deletes a path and the
        worktree genuinely has no file there either."""
        self._write("to_delete.txt", b"will be deleted at B")
        commit_a = self._commit("A")
        (self._repo / "to_delete.txt").unlink()
        self._git("add", "-A")
        commit_b = self._commit("B deletes to_delete.txt")

        matches, reason = cef.verify_worktree_matches_committed_target(
            commit_a, commit_b, cwd=self._repo
        )
        self.assertTrue(matches, reason)

    def test_dirty_worktree_can_still_incidentally_match_committed_target(self):
        """Distinguishes helper invariance from producer admission: this
        helper only answers "does the worktree equal the committed blob",
        which a dirty-but-coincidentally-reverted worktree can still
        satisfy. The producer's own separate git-status-based closure
        finality gate (_closure_worktree_finality_failures), not this
        helper, is what rejects a dirty worktree outright regardless of
        content equivalence -- this helper's job is narrower and this test
        proves it does not overreach into that separate concern.
        """
        self._write("evidence.txt", b"base content")
        commit_a = self._commit("A")
        self._write("evidence.txt", b"target content for B")
        commit_b = self._commit("B")

        # Dirty the worktree (staged, not committed) but restore identical
        # committed content -- the file is technically "touched" but its
        # blob content still equals head's.
        self._write("evidence.txt", b"target content for B")
        self._git("add", "evidence.txt")

        matches, reason = cef.verify_worktree_matches_committed_target(
            commit_a, commit_b, cwd=self._repo
        )
        self.assertTrue(
            matches, "helper answers content equivalence only, not dirty-tree cleanliness: " + reason
        )

    def test_multiple_changed_paths_only_drifted_one_is_rejected(self):
        """When base..head changes multiple paths, a semantic drift in
        just one of them at a later commit must still reject the whole
        admission -- partial correctness is not acceptable."""
        self._write("keep.txt", b"unchanged reference")
        self._write("evidence.txt", b"base content")
        commit_a = self._commit("A")
        self._write("keep.txt", b"keep.txt changed at B too")
        self._write("evidence.txt", b"target content for B")
        commit_b = self._commit("B")
        # Only evidence.txt drifts further; keep.txt matches B exactly.
        self._write("evidence.txt", b"drifted at C")
        self._commit("C")

        matches, reason = cef.verify_worktree_matches_committed_target(
            commit_a, commit_b, cwd=self._repo
        )
        self.assertFalse(matches, reason)
        self.assertIn("evidence.txt", reason)


class CleanFilterCannotMaskSemanticDriftTests(_TempRepoTestCase):
    """MFRP-FINGERPRINT-T1 rework-3 (F1): an earlier revision of
    ``verify_worktree_matches_committed_target`` used ``git hash-object``,
    which executes whatever ``clean`` filter ``.gitattributes`` configures.
    A filter that maps arbitrary input to one fixed output can make
    genuinely different worktree content hash identically to the committed
    target -- filtered blob equality is not semantic equivalence, and the
    governing byte-recipe contract explicitly forbids clean/smudge filter
    execution anywhere in this admission path. These tests prove the fix
    (direct ``Path.read_bytes()`` comparison, never ``git hash-object``/
    ``git add``/``git diff``/``git status`` against the file) both rejects
    the counterexample and never itself invokes the configured filter.
    """

    def setUp(self) -> None:
        super().setUp()
        # A dedicated, per-test-instance scratch directory for the filter
        # script and sentinel file: self._repo.parent is the *shared*
        # system temp root (self._repo is Path(self._tmp) directly, not a
        # subdirectory), so placing per-test support files there would
        # leak and collide across every test in this file. This scratch
        # directory is torn down in tearDown alongside the repo itself.
        self._scratch = Path(tempfile.mkdtemp(prefix="cef-filter-scratch-"))

    def tearDown(self) -> None:
        import shutil

        shutil.rmtree(self._scratch, ignore_errors=True)
        super().tearDown()

    def _configure_reviewprobe_filter(self, sentinel_path: Path) -> None:
        """Configure a ``clean`` filter that (a) always emits the fixed
        bytes ``target`` regardless of its real input, masking any
        semantic drift a naive filtered-blob-equality check would miss,
        and (b) appends one line to ``sentinel_path`` every time it
        actually runs, so tests can distinguish "the filter ran during
        fixture setup" (expected, and irrelevant to what is being tested)
        from "the filter ran because the admission check under test
        invoked it" (the defect this fix must prove absent).

        The filter command is a standalone script file, not an inline
        ``-c`` string, to avoid brittle nested shell/Python quoting across
        platforms (an inline one-liner with an embedded ``\\n`` byte
        previously broke Git's filter shell invocation on Windows); it is
        still an arbitrary external command -- exactly the class of thing
        a real ``.gitattributes`` ``clean`` filter may configure.
        """
        script_path = self._scratch / "reviewprobe_filter.py"
        script_path.write_text(
            "import pathlib, sys\n"
            f"pathlib.Path({str(sentinel_path)!r}).open('a', encoding='utf-8').write('FILTER_RAN\\n')\n"
            "sys.stdout.write('target')\n",
            encoding="utf-8",
        )
        # Quote both the interpreter and script paths: Git invokes the
        # configured filter command through a shell, and either path may
        # contain spaces (a temp directory or this repository's own path).
        filter_command = f'"{sys.executable}" "{script_path}"'
        self._git("config", "filter.reviewprobe.clean", filter_command)
        self._write(".gitattributes", b"evidence.txt filter=reviewprobe\n")

    def test_reviewer_clean_filter_counterexample_is_rejected(self):
        """The exact Local-review counterexample: a ``clean`` filter that
        always emits ``target`` regardless of real content is configured
        before committing B; the worktree is then overwritten with
        completely different content and ``git add``ed (the filter
        converts it back to ``target`` during add, so ``git status`` is
        clean and no staged delta exists, but the actual disk bytes remain
        the different content). Admission for A..B must be rejected: the
        disk bytes genuinely differ from B's committed blob, and this
        check must never launder that difference through the configured
        filter.
        """
        sentinel = self._scratch / "filter_ran.log"
        self._write("evidence.txt", b"base")
        commit_a = self._commit("A")

        self._configure_reviewprobe_filter(sentinel)
        self._write("evidence.txt", b"target")
        commit_b = self._commit("B")

        # Overwrite with genuinely different content, then stage it -- the
        # filter runs here (fixture setup), converting the staged blob
        # back to "target" while leaving the real disk bytes untouched.
        self._write("evidence.txt", b"totally different malicious content")
        self._git("add", "evidence.txt")
        status = self._git("status", "--short")
        self.assertEqual(status, "", "fixture precondition: filter must mask this from git status")
        self.assertTrue(sentinel.is_file(), "fixture precondition: the filter must have actually run during git add")

        setup_run_count = sentinel.read_text(encoding="utf-8").count("FILTER_RAN")

        matches, reason = cef.verify_worktree_matches_committed_target(
            commit_a, commit_b, cwd=self._repo
        )

        self.assertFalse(
            matches,
            "the admission check must detect the real disk-byte drift, "
            "never accept the filter-laundered staged equivalence: " + reason,
        )
        self.assertIn("evidence.txt", reason)

        # The admission check itself must not have invoked the filter even
        # once: the sentinel's run count must be exactly what fixture setup
        # (the git add above) already produced, not incremented further.
        final_run_count = sentinel.read_text(encoding="utf-8").count("FILTER_RAN") if sentinel.is_file() else 0
        self.assertEqual(
            final_run_count, setup_run_count,
            "verify_worktree_matches_committed_target must never execute a "
            "configured clean filter; the sentinel must not increment "
            "beyond what fixture setup alone produced",
        )

    def test_admission_check_never_invokes_configured_filter_at_all(self):
        """Isolated proof of the no-filter-execution claim, independent of
        the counterexample's pass/fail outcome: even for a legitimately
        matching target (no drift, no malicious intent), the admission
        check under test must add zero additional filter invocations
        beyond whatever fixture setup itself already produced.

        Note on isolation: ``git commit`` itself was found, during this
        test's own development, to invoke the configured clean filter at
        least once even when the blob is staged via ``git hash-object
        --no-filters -w`` plus a direct ``git update-index`` (evidenced by
        the sentinel existing immediately after ``git commit`` returns,
        before this test's function-under-test call runs at all) -- so a
        literal zero-invocations-ever precondition is not achievable for
        this fixture's own commit of B. This test instead uses the same
        before/after run-count technique as
        ``test_reviewer_clean_filter_counterexample_is_rejected`` above,
        which correctly isolates "invocations caused by the function under
        test" from "invocations Git's own commit machinery already
        produced" regardless of that baseline.
        """
        sentinel = self._scratch / "filter_ran.log"
        self._write("evidence.txt", b"base")
        commit_a = self._commit("A")

        self._configure_reviewprobe_filter(sentinel)
        self._write("evidence.txt", b"target")
        commit_b = self._commit("B")

        setup_run_count = (
            sentinel.read_text(encoding="utf-8").count("FILTER_RAN")
            if sentinel.is_file() else 0
        )

        matches, _reason = cef.verify_worktree_matches_committed_target(
            commit_a, commit_b, cwd=self._repo
        )

        self.assertTrue(
            matches,
            "sanity: worktree genuinely matches B's committed content here",
        )
        final_run_count = (
            sentinel.read_text(encoding="utf-8").count("FILTER_RAN")
            if sentinel.is_file() else 0
        )
        self.assertEqual(
            final_run_count, setup_run_count,
            "verify_worktree_matches_committed_target must add zero "
            "additional configured-filter invocations beyond whatever "
            "fixture setup (git commit itself) already produced",
        )


class SimilarTransformSurveyTests(_TempRepoTestCase):
    """MFRP-FINGERPRINT-T1 rework-3 (F1) point 3: survey of other
    ``.gitattributes``-driven checkout transforms the admission path could
    plausibly be exposed to, so coverage is claimed only where there is
    actual evidence, not by inference from the clean-filter fix alone.
    """

    def test_eol_attribute_driven_crlf_is_still_tolerated(self):
        """The ``eol=crlf``/``eol=lf`` gitattributes override produces the
        exact same CRLF-vs-LF byte-pattern difference core.autocrlf does;
        the fixed CRLF-to-LF Python substitution this check applies
        catches it identically regardless of which mechanism caused it,
        because the substitution operates on the resulting byte pattern,
        not on which Git setting triggered it.
        """
        self._git("config", "core.autocrlf", "false")
        self._write(".gitattributes", b"evidence.txt text eol=crlf\n")
        self._commit("attrs")
        self._write("evidence.txt", b"line1\nline2\n")
        commit_a = self._commit("A")
        self._write("evidence.txt", b"line1\nline2\nline3\n")
        commit_b = self._commit("B")

        # Force a fresh checkout so the eol attribute actually applies to
        # the worktree bytes (it does not retroactively rewrite files
        # already on disk without a checkout).
        self._git("rm", "-f", "evidence.txt")
        self._git("checkout", "HEAD", "--", "evidence.txt")
        checked_out = (self._repo / "evidence.txt").read_bytes()
        self.assertIn(b"\r\n", checked_out, "fixture precondition: eol=crlf must have produced CRLF bytes")

        matches, reason = cef.verify_worktree_matches_committed_target(
            commit_a, commit_b, cwd=self._repo
        )
        self.assertTrue(matches, reason)

    def test_ident_keyword_expansion_is_explicitly_not_covered_and_fails_closed(self):
        """The ``ident`` gitattribute expands ``$Id$`` to
        ``$Id: <blob-sha> $`` on checkout, which is a legitimate,
        non-malicious Git checkout-representation difference this
        governing contract does not name anywhere (only CRLF/LF is named).
        This test documents, with real evidence, that such a checkout
        produces a genuine disk-vs-committed-blob byte difference this
        admission check does NOT special-case: it fails closed (rejects)
        rather than silently expanding the contract's tolerated-equivalence
        set to cover it. This is the correct, disclosed limitation, not a
        gap being claimed as covered.
        """
        self._write(".gitattributes", b"evidence.txt ident\n")
        self._commit("attrs")
        self._write("evidence.txt", b"prefix $Id$ suffix\n")
        commit_a = self._commit("A")
        self._write("evidence.txt", b"prefix $Id$ suffix updated\n")
        commit_b = self._commit("B")

        self._git("rm", "-f", "evidence.txt")
        self._git("checkout", "HEAD", "--", "evidence.txt")
        checked_out = (self._repo / "evidence.txt").read_bytes()
        blob_sha = self._git("rev-parse", f"{commit_b}:evidence.txt")
        committed_bytes = self._git_bytes("cat-file", "blob", blob_sha)
        self.assertNotEqual(
            checked_out, committed_bytes,
            "fixture precondition: ident expansion must have produced a "
            "genuine disk-vs-blob byte difference",
        )

        matches, reason = cef.verify_worktree_matches_committed_target(
            commit_a, commit_b, cwd=self._repo
        )
        self.assertFalse(
            matches,
            "ident-expanded checkout content is not a covered equivalence "
            "class; this must fail closed, not silently pass: " + reason,
        )


if __name__ == "__main__":
    unittest.main()
