"""Bounded Git and snapshot resolvers for worker evidence."""
from __future__ import annotations
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any
import hashlib
import subprocess
from worker_evidence_contract import EvidenceReadinessError, resolve_contained_path

@dataclass
class GitBatchResolver:
    """Batch resolver for blob digests/bytes, bounded to one process per
    distinct (source_root, pin) per invocation. Never executes a recorded
    query string; only ever runs a fixed, hard-coded `git ls-tree` argument
    list against paths the caller supplies.
    """

    repo_root: Path
    call_count: int = 0
    _cache: dict[tuple[str, str], dict[str, str]] = field(default_factory=dict)
    _line_count_cache: dict[tuple[str, str], dict[str, int | None]] = field(default_factory=dict)

    def resolve_blob_shas(
        self, source_root: str, pin: str, paths: tuple[str, ...]
    ) -> dict[str, str | None]:
        """Return {path: blob_sha or None} using one batched `git ls-tree`
        call per (source_root, pin), reused across repeated rows/paths within
        this resolver instance (same-run reuse, requirement 9)."""

        if not paths:
            return {}
        cache_key = (source_root, pin)
        cached = self._cache.get(cache_key)
        if cached is None:
            cached = {}
            self._cache[cache_key] = cached
        missing = tuple(p for p in paths if p not in cached)
        if missing:
            cached.update(self._ls_tree(source_root, pin, missing))
            for path in missing:
                cached.setdefault(path, None)
        return {p: cached.get(p) for p in paths}

    def resolve_line_counts(
        self, source_root: str, pin: str, paths: tuple[str, ...]
    ) -> dict[str, int | None]:
        """Return {path: line_count or None} by reading each row's blob
        content once via `git cat-file --batch` (F1 line-count fix): one
        batched, bounded subprocess call per (source_root, pin) invocation,
        not one `git cat-file`/`git show` per file. Cached per (source_root,
        pin) alongside the blob-sha cache so repeated rows/paths within one
        resolver instance never re-read content (requirement 9)."""

        if not paths:
            return {}
        cache_key = (source_root, pin)
        cached = self._line_count_cache.get(cache_key)
        if cached is None:
            shas = self.resolve_blob_shas(source_root, pin, paths)
            cached = self._batch_line_counts(source_root, shas)
            self._line_count_cache[cache_key] = cached
        missing = [p for p in paths if p not in cached]
        if missing:
            shas = self.resolve_blob_shas(source_root, pin, tuple(missing))
            cached.update(self._batch_line_counts(source_root, shas))
        return {p: cached.get(p) for p in paths}

    def _batch_line_counts(
        self, source_root: str, path_to_sha: dict[str, str | None]
    ) -> dict[str, int | None]:
        mirror = (self.repo_root / source_root) if source_root else self.repo_root
        ordered_paths = [p for p, sha in path_to_sha.items() if sha]
        if not ordered_paths:
            return {p: None for p in path_to_sha}
        batch_input = "\n".join(path_to_sha[p] for p in ordered_paths) + "\n"
        try:
            proc = subprocess.run(
                ["git", "-C", str(mirror), "cat-file", "--batch"],
                input=batch_input.encode("ascii"),
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                timeout=30,
            )
        except (OSError, subprocess.SubprocessError):
            return {p: None for p in path_to_sha}
        self.call_count += 1
        result: dict[str, int | None] = {p: None for p in path_to_sha}
        if proc.returncode != 0:
            return result
        # `git cat-file --batch` output per object:
        #   "<sha> <type> <size>\n<content bytes>\n"
        output = proc.stdout
        pos = 0
        for path in ordered_paths:
            newline = output.find(b"\n", pos)
            if newline == -1:
                break
            header = output[pos:newline]
            parts = header.split()
            if len(parts) != 3:
                break
            try:
                size = int(parts[2])
            except ValueError:
                break
            content_start = newline + 1
            if size < 0 or parts[1] != b"blob" or content_start + size >= len(output):
                break
            content = output[content_start:content_start + size]
            if output[content_start + size:content_start + size + 1] != b"\n":
                break
            result[path] = len(content.splitlines())
            pos = content_start + size + 1  # skip trailing newline after content
        return result

    def _ls_tree(self, source_root: str, pin: str, paths: tuple[str, ...]) -> dict[str, str]:
        # Only explicitly requested paths; never enumerate the complete tree.
        mirror = self.repo_root / source_root
        result = {}
        chunks, chunk, size = [], [], 0
        for path in paths:
            if chunk and size + len(path) > 16000:
                chunks.append(chunk)
                chunk, size = [], 0
            chunk.append(path)
            size += len(path) + 3
        if chunk:
            chunks.append(chunk)
        for chunk in chunks:
            try:
                self.call_count += 1
                proc = subprocess.run(
                    ["git", "--literal-pathspecs", "-C", str(mirror), "ls-tree", "-z", pin, "--", *chunk],
                    stdout=subprocess.PIPE, stderr=subprocess.PIPE, timeout=30,
                )
            except (OSError, subprocess.SubprocessError):
                continue
            if proc.returncode:
                continue
            for record in proc.stdout.split(b"\0"):
                head, sep, path = record.partition(b"\t")
                parts = head.split()
                if sep and len(parts) == 3 and parts[0] in (b"100644", b"100755") and parts[1] == b"blob":
                    result[path.decode("utf-8", errors="strict")] = parts[2].decode("ascii")
        return result


@dataclass
class SnapshotResolver:
    """Bounded resolver for non-Git local projects (requirement 2: 'exact
    file snapshots for non-Git local projects'). `pin` is treated as an
    opaque snapshot identity (e.g. a directory name or archive tag) rooted
    under `repo_root / source_root / pin`; a row's blob identity is the
    SHA-256 of the exact file bytes at that snapshot path. No shell
    execution, no network -- just bounded filesystem reads, cached per
    (source_root, pin) within one resolver instance (requirement 9)."""

    repo_root: Path
    call_count: int = 0
    _cache: dict[tuple[str, str], dict[str, str]] = field(default_factory=dict)
    _line_count_cache: dict[tuple[str, str], dict[str, int | None]] = field(default_factory=dict)
    _base_cache: dict[tuple[str, str], tuple[Path, bool]] = field(default_factory=dict)

    def resolve_blob_shas(
        self, source_root: str, pin: str, paths: tuple[str, ...]
    ) -> dict[str, str | None]:
        if not paths:
            return {}
        cache_key = (source_root, pin)
        cached = self._cache.get(cache_key)
        if cached is None:
            cached = {}
            self._cache[cache_key] = cached
        base, base_exists = self._resolved_base(source_root, pin)
        result: dict[str, str | None] = {}
        lc_cache = self._line_count_cache.setdefault(cache_key, {})
        for p in paths:
            if p in cached:
                result[p] = cached[p]
                continue
            digest, line_count = self._read_digest_and_line_count(base, base_exists, p)
            cached[p] = digest
            result[p] = digest
            lc_cache[p] = line_count
        return result

    def _resolved_base(self, source_root: str, pin: str) -> tuple[Path, bool]:
        """Resolve and cache the `(source_root, pin)` snapshot base directory
        ONCE per distinct pair, instead of re-resolving `repo_root /
        source_root / pin` and re-checking `.exists()` for every single row
        -- this is what keeps a 1000-row packet bounded (requirement 9): the
        per-row cost is one file read, not also a repeated base-directory
        resolve/stat."""

        cache_key = (source_root, pin)
        cached = self._base_cache.get(cache_key)
        if cached is not None:
            return cached
        base = self.repo_root / source_root / pin if source_root else self.repo_root / pin
        base_exists = base.exists()
        resolved = (base, base_exists)
        self._base_cache[cache_key] = resolved
        return resolved

    def resolve_line_counts(
        self, source_root: str, pin: str, paths: tuple[str, ...]
    ) -> dict[str, int | None]:
        """Return {path: line_count or None}, counted from the SAME bytes
        read to compute the digest in `resolve_blob_shas` -- never a second
        file read (F1 fix). Calling `resolve_blob_shas` first (as
        `validate_source_identity` does) populates the line-count cache as a
        side effect of that one read; any path not yet cached is read once
        here and cached for both digest and line count."""

        if not paths:
            return {}
        cache_key = (source_root, pin)
        lc_cache = self._line_count_cache.setdefault(cache_key, {})
        digest_cache = self._cache.setdefault(cache_key, {})
        base, base_exists = self._resolved_base(source_root, pin)
        result: dict[str, int | None] = {}
        for p in paths:
            if p in lc_cache:
                result[p] = lc_cache[p]
                continue
            digest, line_count = self._read_digest_and_line_count(base, base_exists, p)
            digest_cache[p] = digest
            lc_cache[p] = line_count
            result[p] = line_count
        return result

    def _read_digest_and_line_count(
        self, base: Path, base_exists: bool, path: str
    ) -> tuple[str | None, int | None]:
        try:
            full = resolve_contained_path(base, path) if base_exists else (base / path)
        except EvidenceReadinessError:
            return None, None
        self.call_count += 1
        try:
            data = full.read_bytes()
        except OSError:
            return None, None
        digest = hashlib.sha256(data).hexdigest()
        text = data.decode("utf-8", errors="replace")
        line_count = text.count("\n") + (1 if text and not text.endswith("\n") else 0)
        return digest, line_count
