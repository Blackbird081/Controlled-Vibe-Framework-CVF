"""Git framing and reviewer regression tests for evidence readiness."""
import unittest
import tempfile
import subprocess
import hashlib
import json
from pathlib import Path
from test_worker_evidence_readiness import wer, _binding_block, _COMPAT_DIR, CONTRACT_WORK_ORDER, SNAPSHOT_PIN

class GitBackedSourceResolutionTests(unittest.TestCase):
    """F1, Git-path proof: evaluate_worker_return() correctly resolves and
    validates source identity against a REAL temporary Git repository (not
    just the snapshot resolver), using GitBatchResolver end to end."""

    def setUp(self) -> None:
        self._tmp = tempfile.TemporaryDirectory()
        self.repo_root = Path(self._tmp.name)
        self.mirror = self.repo_root / "src"
        self.mirror.mkdir(parents=True)
        self._git("init", "-q")
        self._git("config", "user.email", "test@example.com")
        self._git("config", "user.name", "Test")
        (self.mirror / "a.ts").write_text("line1\nline2\n", encoding="utf-8")
        self._git("add", "a.ts")
        self._git("commit", "-q", "-m", "initial")
        self.commit_sha = self._git("rev-parse", "HEAD").strip()
        self.blob_sha = self._git("rev-parse", "HEAD:a.ts").strip()

    def tearDown(self) -> None:
        self._tmp.cleanup()

    def _git(self, *args: str) -> str:
        proc = subprocess.run(
            ["git", "-C", str(self.mirror), *args],
            text=True,
            encoding="utf-8",
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            check=True,
        )
        return proc.stdout

    def test_git_backed_row_with_correct_blob_sha_is_clean(self) -> None:
        audit_bytes = json.dumps({"schemaVersion": "cvf.evidenceAudit.v1"}).encode("utf-8")
        (self.repo_root / "docs/audits").mkdir(parents=True)
        (self.repo_root / "docs/audits/fixture_audit.json").write_bytes(audit_bytes)
        (self.repo_root / "docs/manifests").mkdir(parents=True)
        (self.repo_root / "docs/manifests/fixture_manifest.txt").write_text("a.ts\n", encoding="utf-8")
        digest = hashlib.sha256(audit_bytes).hexdigest()
        return_text = "# Return\n" + _binding_block(
            audit_path="docs/audits/fixture_audit.json",
            audit_sha256=digest,
            manifest_path="docs/manifests/fixture_manifest.txt",
            source_root="src",
            source_pin=self.commit_sha,
            rows=[("a.ts", self.blob_sha, 2, "1-2", "READ")],
        )
        result = wer.evaluate_worker_return(
            return_text=return_text, work_order_text=CONTRACT_WORK_ORDER, repo_root=self.repo_root
        )
        self.assertTrue(result.is_clean, result.render_issues())

    def test_git_backed_row_with_fabricated_blob_sha_is_rejected(self) -> None:
        audit_bytes = json.dumps({"schemaVersion": "cvf.evidenceAudit.v1"}).encode("utf-8")
        (self.repo_root / "docs/audits").mkdir(parents=True)
        (self.repo_root / "docs/audits/fixture_audit.json").write_bytes(audit_bytes)
        (self.repo_root / "docs/manifests").mkdir(parents=True)
        (self.repo_root / "docs/manifests/fixture_manifest.txt").write_text("a.ts\n", encoding="utf-8")
        digest = hashlib.sha256(audit_bytes).hexdigest()
        return_text = "# Return\n" + _binding_block(
            audit_path="docs/audits/fixture_audit.json",
            audit_sha256=digest,
            manifest_path="docs/manifests/fixture_manifest.txt",
            source_root="src",
            source_pin=self.commit_sha,
            rows=[("a.ts", "f" * 40, 2, "1-2", "READ")],
        )
        result = wer.evaluate_worker_return(
            return_text=return_text, work_order_text=CONTRACT_WORK_ORDER, repo_root=self.repo_root
        )
        self.assertFalse(result.is_clean)
        self.assertTrue(any("does not match the resolved source identity" in i.message for i in result.issues))

    def test_git_backed_row_with_fabricated_pin_is_rejected(self) -> None:
        audit_bytes = json.dumps({"schemaVersion": "cvf.evidenceAudit.v1"}).encode("utf-8")
        (self.repo_root / "docs/audits").mkdir(parents=True)
        (self.repo_root / "docs/audits/fixture_audit.json").write_bytes(audit_bytes)
        (self.repo_root / "docs/manifests").mkdir(parents=True)
        (self.repo_root / "docs/manifests/fixture_manifest.txt").write_text("a.ts\n", encoding="utf-8")
        digest = hashlib.sha256(audit_bytes).hexdigest()
        fabricated_pin = "f" * 40
        return_text = "# Return\n" + _binding_block(
            audit_path="docs/audits/fixture_audit.json",
            audit_sha256=digest,
            manifest_path="docs/manifests/fixture_manifest.txt",
            source_root="src",
            source_pin=fabricated_pin,
            rows=[("a.ts", self.blob_sha, 2, "1-2", "READ")],
        )
        result = wer.evaluate_worker_return(
            return_text=return_text, work_order_text=CONTRACT_WORK_ORDER, repo_root=self.repo_root
        )
        self.assertFalse(result.is_clean)
        self.assertTrue(any("could not be resolved" in i.message for i in result.issues))

    def test_git_backed_row_with_correct_blob_but_fabricated_line_count_is_rejected(self) -> None:
        """F1 continued (generation 2), Git-path proof: a row with the real
        Git blob sha (bytes genuinely match) but a fabricated lineCount is
        rejected -- proves GitBatchResolver's `resolve_line_counts` (via
        `git cat-file --batch`) is actually reached through the real
        entrypoint, not just the snapshot resolver's line-count path."""
        audit_bytes = json.dumps({"schemaVersion": "cvf.evidenceAudit.v1"}).encode("utf-8")
        (self.repo_root / "docs/audits").mkdir(parents=True)
        (self.repo_root / "docs/audits/fixture_audit.json").write_bytes(audit_bytes)
        (self.repo_root / "docs/manifests").mkdir(parents=True)
        (self.repo_root / "docs/manifests/fixture_manifest.txt").write_text("a.ts\n", encoding="utf-8")
        digest = hashlib.sha256(audit_bytes).hexdigest()
        return_text = "# Return\n" + _binding_block(
            audit_path="docs/audits/fixture_audit.json",
            audit_sha256=digest,
            manifest_path="docs/manifests/fixture_manifest.txt",
            source_root="src",
            source_pin=self.commit_sha,
            rows=[("a.ts", self.blob_sha, 999, "1-2", "READ")],  # real blob sha, fabricated lineCount (real is 2)
        )
        result = wer.evaluate_worker_return(
            return_text=return_text, work_order_text=CONTRACT_WORK_ORDER, repo_root=self.repo_root
        )
        self.assertFalse(result.is_clean)
        self.assertTrue(
            any(
                i.pointer == "/rows/a.ts/lineCount"
                and "does not match the resolved source's actual line count" in i.message
                for i in result.issues
            )
        )


class GitBatchResolverLineCountTests(unittest.TestCase):
    """F1 continued (generation 2): GitBatchResolver.resolve_line_counts must
    read blob content via a bounded, batched `git cat-file --batch` call
    (not one subprocess per file) and count lines correctly."""

    def setUp(self) -> None:
        self._tmp = tempfile.TemporaryDirectory()
        self.repo_root = Path(self._tmp.name)
        self.mirror = self.repo_root / "src"
        self.mirror.mkdir(parents=True)
        subprocess.run(["git", "init", "-q"], cwd=self.mirror, check=True)
        subprocess.run(["git", "config", "user.email", "test@example.com"], cwd=self.mirror, check=True)
        subprocess.run(["git", "config", "user.name", "Test"], cwd=self.mirror, check=True)
        (self.mirror / "a.ts").write_text("line1\nline2\nline3\n", encoding="utf-8")  # 3 lines
        (self.mirror / "b.ts").write_text("only one line, no trailing newline", encoding="utf-8")  # 1 line
        subprocess.run(["git", "add", "a.ts", "b.ts"], cwd=self.mirror, check=True)
        subprocess.run(["git", "commit", "-q", "-m", "initial"], cwd=self.mirror, check=True)
        self.commit_sha = subprocess.run(
            ["git", "rev-parse", "HEAD"], cwd=self.mirror, text=True, capture_output=True, check=True
        ).stdout.strip()

    def tearDown(self) -> None:
        self._tmp.cleanup()

    def test_resolve_line_counts_matches_real_content(self) -> None:
        resolver = wer.GitBatchResolver(repo_root=self.repo_root)
        counts = resolver.resolve_line_counts("src", self.commit_sha, ("a.ts", "b.ts"))
        self.assertEqual(counts["a.ts"], 3)
        self.assertEqual(counts["b.ts"], 1)

    def test_resolve_line_counts_uses_one_batched_call_not_per_file(self) -> None:
        """Bounded per requirement 9: one batched subprocess call for the
        whole (source_root, pin) resolution, reused across repeated calls
        within one resolver instance -- not one `git cat-file`/`git show`
        subprocess per file."""
        resolver = wer.GitBatchResolver(repo_root=self.repo_root)
        resolver.resolve_line_counts("src", self.commit_sha, ("a.ts", "b.ts"))
        call_count_after_first = resolver.call_count
        # ls-tree (1 call) + cat-file --batch (1 call) = 2, not one per file.
        self.assertLessEqual(call_count_after_first, 2)
        resolver.resolve_line_counts("src", self.commit_sha, ("a.ts", "b.ts"))
        self.assertEqual(resolver.call_count, call_count_after_first, "second call must reuse the cache")


class GitBatchResolverTests(unittest.TestCase):
    def test_resolver_reuses_ls_tree_within_one_instance(self) -> None:
        resolver = wer.GitBatchResolver(repo_root=_COMPAT_DIR.parents[1])
        resolver.resolve_blob_shas(".", "HEAD", ("AGENTS.md",))
        first_calls = resolver.call_count
        resolver.resolve_blob_shas(".", "HEAD", ("AGENTS.md",))
        self.assertEqual(resolver.call_count, first_calls)

    def test_resolver_returns_none_for_unknown_path(self) -> None:
        resolver = wer.GitBatchResolver(repo_root=_COMPAT_DIR.parents[1])
        result = resolver.resolve_blob_shas(".", "HEAD", ("definitely/not/a/real/path.xyz",))
        self.assertIsNone(result.get("definitely/not/a/real/path.xyz"))


class ReviewerRegressionTests(unittest.TestCase):
    def test_multiple_sources_and_strict_contract(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            sections = []
            for source in ("one", "two"):
                folder = root / source / SNAPSHOT_PIN
                folder.mkdir(parents=True)
                raw = source.encode()
                (folder / "a.ts").write_bytes(raw)
                (root / (source + ".json")).write_bytes(b'{"schemaVersion":"cvf.evidenceAudit.v1"}')
                (root / (source + ".txt")).write_text("a.ts\n")
                sections.append(_binding_block(audit_path=source + ".json",
                    audit_sha256=hashlib.sha256((root / (source + ".json")).read_bytes()).hexdigest(),
                    manifest_path=source + ".txt", source_root=source,
                    rows=[("a.ts", hashlib.sha256(raw).hexdigest(), 1, "1-1", "READ")]))
            def evaluate(text):
                return wer.evaluate_worker_return(return_text=text, work_order_text=CONTRACT_WORK_ORDER, repo_root=root)
            good = evaluate("\n".join(sections))
            self.assertTrue(good.is_clean, good.render_issues())
            self.assertEqual(good.row_count, 2)
            self.assertFalse(evaluate("\n".join(sections).replace("sourceRoot: two", "sourceRoot: missing")).is_clean)
            for pin in ("HEAD", "refs/heads/main", "abcdef123"):
                self.assertFalse(evaluate(sections[0].replace(SNAPSHOT_PIN, pin)).is_clean)
            self.assertFalse(evaluate(sections[0].replace("sourceRoot: one", "sourceRoot: wrong\nsourceRoot: one")).is_clean)
            for value in ([], {"schemaVersion": "unknown.v1"}, {"totalCount": "1"}, {"totalCount": True}):
                raw = json.dumps(value).encode()
                old = hashlib.sha256((root / "one.json").read_bytes()).hexdigest()
                # Always start from the original binding digest.
                text = sections[0].replace(hashlib.sha256(b'{"schemaVersion":"cvf.evidenceAudit.v1"}').hexdigest(), hashlib.sha256(raw).hexdigest())
                (root / "one.json").write_bytes(raw)
                self.assertFalse(evaluate(text).is_clean, value)

    def test_reuse_requires_original_matching_full_read_row(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            (root / "src" / SNAPSHOT_PIN).mkdir(parents=True)
            data = b"first\nsecond\n"
            (root / "src" / SNAPSHOT_PIN / "a.ts").write_bytes(data)
            blob = hashlib.sha256(data).hexdigest()
            (root / "audit.json").write_bytes(b"{}")
            (root / "manifest.txt").write_text("a.ts\n")
            prior = _binding_block(audit_path="audit.json", audit_sha256="a" * 64,
                manifest_path="manifest.txt", rows=[("a.ts", blob, 2, "1-2", "READ")])
            variants = {
                "valid": prior,
                "unrelated": "no evidence rows",
                "wrong_pin": prior.replace(SNAPSHOT_PIN, "different-snapshot"),
                "wrong_root": prior.replace("sourceRoot: src", "sourceRoot: other"),
                "wrong_blob": prior.replace(blob, "f" * 64),
                "missing_row": prior.replace("| a.ts |", "| b.ts |"),
                "partial": prior.replace("1-2", "1-1"),
                "excluded": prior.replace("| READ |", "| EXCLUDED |"),
                "duplicate": prior + f"\n| a.ts | {blob} | 2 | 1-2 | READ |\n",
            }
            for label, content in variants.items():
                with self.subTest(label=label):
                    raw = content.encode("utf-8")
                    (root / "prior.md").write_bytes(raw)
                    current = _binding_block(audit_path="audit.json", audit_sha256=hashlib.sha256(b"{}").hexdigest(),
                        manifest_path="manifest.txt", rows=[("a.ts", blob, 2, "1-2", "REUSED")],
                        reuse_rows=[("a.ts", hashlib.sha256(raw).hexdigest(), "prior.md", blob)])
                    result = wer.evaluate_worker_return(return_text=current, work_order_text=CONTRACT_WORK_ORDER, repo_root=root)
                    self.assertEqual(result.is_clean, label == "valid", result.render_issues())

    def test_git_multibyte_and_crlf_batches_through_entrypoint(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            mirror = root / "src"
            mirror.mkdir()
            def git(*args, data=None):
                return subprocess.run(["git", "-C", str(mirror), *args], input=data,
                    capture_output=True, check=True).stdout.decode().strip()
            git("init", "--quiet")
            contents = {"a.ts": "\u00e9\n".encode(), "b.ts": "ti\u1ebfng Vi\u1ec7t\r\nx\r\n".encode(), "c.ts": b"tail"}
            blobs = {p: git("hash-object", "-w", "--stdin", data=b) for p, b in contents.items()}
            tree = git("mktree", data="".join(f"100644 blob {sha}\t{p}\n" for p, sha in blobs.items()).encode())
            (root / "audit.json").write_bytes(b"{}")
            (root / "manifest.txt").write_text("\n".join(contents))
            rows = [(p, blobs[p], len(b.splitlines()), f"1-{len(b.splitlines())}", "READ") for p, b in contents.items()]
            text = _binding_block(audit_path="audit.json", audit_sha256=hashlib.sha256(b"{}").hexdigest(),
                manifest_path="manifest.txt", source_pin=tree, rows=rows)
            result = wer.evaluate_worker_return(return_text=text, work_order_text=CONTRACT_WORK_ORDER, repo_root=root)
            self.assertTrue(result.is_clean, result.render_issues())
            resolver = wer.GitBatchResolver(root)
            resolver.resolve_blob_shas("src", tree, ("b.ts",))
            self.assertEqual(set(resolver._cache[("src", tree)]), {"b.ts"})
            resolver.resolve_blob_shas("src", tree, ("a.ts",))
            self.assertEqual(set(resolver._cache[("src", tree)]), {"a.ts", "b.ts"})


if __name__ == "__main__":
    unittest.main()
