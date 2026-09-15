#!/usr/bin/env python3
"""Canonical committed-evidence fingerprint helper (MFRP-FINGERPRINT-T1).

Owns the single deterministic Git-blob recipe shared by the P2 receipt
producer (``run_agent_autorun_workflow_gate.py``) and the P4-C1 collector
(``mfrp_shadow_canary_autocollect.py``) for the additive
``cvf.committedEvidenceFingerprint.v1`` profile. The committed-evidence
fingerprint itself (``compute_committed_evidence_fingerprint``) never reads
mutable worktree bytes -- every byte is resolved from an immutable commit
object via ``git`` plumbing. It does not replace, weaken, or reinterpret the
existing raw ``worktreeFingerprint``/``changedPathPlanDigest`` identity; that
identity remains owned by its existing producer and validator.

A separate function, ``verify_worktree_matches_committed_target``, does
read worktree state -- this is the MFRP-FINGERPRINT-T1 rework-2/rework-3
(F1) historical-target admission check: it answers whether the worktree
the gate commands actually read corresponds to the committed target being
certified, which neither the raw worktree fingerprint nor the immutable
committed-evidence fingerprint alone can answer on their own. It reads
worktree bytes directly via ``Path.read_bytes()`` and committed bytes via
the same filter-free ``git cat-file blob`` recipe used elsewhere in this
module -- never ``git hash-object``/``git add``/``git diff``/``git
status`` against the worktree file, so no configured clean/smudge/process
filter and no ``core.autocrlf`` conversion can execute (rework-3: an
earlier revision used ``git hash-object``, which does run a configured
``clean`` filter, so a filter that maps arbitrary content to one fixed
blob could mask genuine semantic drift as false equivalence). The only
representation exception is a metadata-authorized LF-blob to CRLF-checkout
expansion with an unchanged target index blob. Binary/control bytes and
unsupported transforms are not eligible. Neither fingerprint is normalized.

Path-set policy (explicitly versioned):
``git diff --no-renames --name-only <base>..<head>`` with NUL-delimited
output (``-z``), which reports the old and new path independently for a
renamed file and ordinary Git deletion semantics for a removed file. Paths
are sorted as ordinal repo-relative forward-slash strings, encoded as UTF-8
bytes. Per path the digest input is: path bytes, NUL, SHA-256 of the raw
``head`` blob bytes (or the literal missing-entry sentinel for an actual
deletion at ``head``), NUL. No text decoding, newline translation, or
clean/smudge filter execution is performed anywhere in this recipe.
"""

from __future__ import annotations

import hashlib
import re
import subprocess
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]

COMMITTED_EVIDENCE_PROFILE = "cvf.committedEvidenceFingerprint.v1"
COMMITTED_EVIDENCE_KEYS = {"profile", "baseSha", "headSha", "fingerprint"}
PATH_SET_POLICY = "git-diff-no-renames-name-only-nul-delimited-v1"

_MISSING_ENTRY_SENTINEL = b"<missing-or-directory>"
_FULL_SHA_RE = re.compile(r"^[0-9a-f]{40}$")
_FINGERPRINT_RE = re.compile(r"^[0-9a-f]{64}$")


class CommittedEvidenceUnavailable(Exception):
    """Raised for any Git failure, unsupported entry kind, or ambiguous ref.

    Callers must treat this as an explicit failure state, never silently
    substitute the missing-entry sentinel for a real error.
    """


def _run_git(args: list[str], *, cwd: Path = REPO_ROOT) -> subprocess.CompletedProcess:
    return subprocess.run(
        ["git", *args],
        cwd=cwd,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
    )


def _is_full_commit_sha(value: str) -> bool:
    return bool(_FULL_SHA_RE.fullmatch(value or ""))


def resolve_full_sha(ref: str, *, cwd: Path = REPO_ROOT) -> str:
    """Resolve ``ref`` to its full 40-character commit SHA.

    Raises ``CommittedEvidenceUnavailable`` for an unresolved, ambiguous, or
    non-commit ref.
    """
    proc = _run_git(["rev-parse", "--verify", "--quiet", f"{ref}^{{commit}}"], cwd=cwd)
    out = proc.stdout.decode("utf-8", errors="strict").strip()
    if proc.returncode != 0 or not _is_full_commit_sha(out):
        raise CommittedEvidenceUnavailable(f"unresolved or ambiguous commit ref: {ref!r}")
    return out


def is_ancestor(ancestor_sha: str, descendant_sha: str, *, cwd: Path = REPO_ROOT) -> bool:
    proc = _run_git(["merge-base", "--is-ancestor", ancestor_sha, descendant_sha], cwd=cwd)
    return proc.returncode == 0


def _changed_paths(base_sha: str, head_sha: str, *, cwd: Path = REPO_ROOT) -> tuple[str, ...]:
    """Path-set policy: ``git diff --no-renames --name-only -z base..head``.

    Returns sorted, ordinal, forward-slash repo-relative paths. Raises
    ``CommittedEvidenceUnavailable`` on any Git failure or undecodable path
    bytes; never returns a partial or guessed path list.
    """
    proc = _run_git(["diff", "--no-renames", "--name-only", "-z", f"{base_sha}..{head_sha}"], cwd=cwd)
    if proc.returncode != 0:
        detail = proc.stderr.decode("utf-8", errors="replace").strip()
        raise CommittedEvidenceUnavailable(f"git diff failed for {base_sha}..{head_sha}: {detail}")
    try:
        raw = proc.stdout.decode("utf-8", errors="strict")
    except UnicodeDecodeError as exc:
        raise CommittedEvidenceUnavailable(f"undecodable path bytes in diff output: {exc}") from exc
    paths = tuple(sorted(part.replace("\\", "/") for part in raw.split("\0") if part))
    return paths


def _entry_kind(head_sha: str, path: str, *, cwd: Path = REPO_ROOT) -> str | None:
    """Return ``"blob"``, ``"symlink"``, ``"gitlink"``, or ``None`` if the
    path does not exist at ``head_sha`` (an actual deletion at head).

    Raises ``CommittedEvidenceUnavailable`` on an explicit Git failure other
    than a clean not-found result.
    """
    proc = _run_git(["ls-tree", head_sha, "--", path], cwd=cwd)
    if proc.returncode != 0:
        detail = proc.stderr.decode("utf-8", errors="replace").strip()
        raise CommittedEvidenceUnavailable(f"git ls-tree failed for {head_sha}:{path}: {detail}")
    out = proc.stdout.decode("utf-8", errors="replace").strip()
    if not out:
        return None
    fields = out.split("\t", 1)[0].split()
    if len(fields) < 3:
        raise CommittedEvidenceUnavailable(f"unparsable git ls-tree entry for {head_sha}:{path}: {out!r}")
    mode, kind = fields[0], fields[1]
    if kind == "commit":
        return "gitlink"
    if kind != "blob":
        raise CommittedEvidenceUnavailable(f"unsupported git ls-tree entry kind for {head_sha}:{path}: {kind}")
    if mode == "120000":
        return "symlink"
    return "blob"


def _blob_sha(head_sha: str, path: str, *, cwd: Path = REPO_ROOT) -> str | None:
    proc = _run_git(["ls-tree", head_sha, "--", path], cwd=cwd)
    if proc.returncode != 0:
        detail = proc.stderr.decode("utf-8", errors="replace").strip()
        raise CommittedEvidenceUnavailable(f"git ls-tree failed for {head_sha}:{path}: {detail}")
    out = proc.stdout.decode("utf-8", errors="replace").strip()
    if not out:
        return None
    fields = out.split("\t", 1)[0].split()
    if len(fields) < 3:
        raise CommittedEvidenceUnavailable(f"unparsable git ls-tree entry for {head_sha}:{path}: {out!r}")
    return fields[2]


def _blob_bytes(blob_sha: str, *, cwd: Path = REPO_ROOT) -> bytes:
    proc = _run_git(["cat-file", "blob", blob_sha], cwd=cwd)
    if proc.returncode != 0:
        detail = proc.stderr.decode("utf-8", errors="replace").strip()
        raise CommittedEvidenceUnavailable(f"git cat-file failed for blob {blob_sha}: {detail}")
    return proc.stdout


def compute_committed_evidence_fingerprint(
    base_sha: str, head_sha: str, *, cwd: Path = REPO_ROOT
) -> str:
    """Compute the canonical committed-evidence fingerprint for ``base_sha``
    ``..`` ``head_sha``.

    Raises ``CommittedEvidenceUnavailable`` for any unresolved ref, non-
    ancestor range, Git command failure, or unsupported tree-entry kind
    (symlink/gitlink are explicitly unsupported and rejected here, never
    silently followed or skipped as a deletion).
    """
    if not _is_full_commit_sha(base_sha) or not _is_full_commit_sha(head_sha):
        raise CommittedEvidenceUnavailable("baseSha and headSha must be full 40-character commit SHAs")
    if not is_ancestor(base_sha, head_sha, cwd=cwd):
        raise CommittedEvidenceUnavailable(f"{base_sha} is not an ancestor of {head_sha}")

    paths = _changed_paths(base_sha, head_sha, cwd=cwd)
    digest = hashlib.sha256()
    for path in paths:
        digest.update(path.encode("utf-8", errors="strict"))
        digest.update(b"\0")
        kind = _entry_kind(head_sha, path, cwd=cwd)
        if kind is None:
            digest.update(_MISSING_ENTRY_SENTINEL)
        elif kind == "blob":
            blob_sha = _blob_sha(head_sha, path, cwd=cwd)
            if blob_sha is None:
                raise CommittedEvidenceUnavailable(f"blob disappeared during resolution for {head_sha}:{path}")
            digest.update(hashlib.sha256(_blob_bytes(blob_sha, cwd=cwd)).digest())
        else:
            raise CommittedEvidenceUnavailable(
                f"unsupported {kind} entry at {head_sha}:{path} is explicitly rejected, not followed"
            )
        digest.update(b"\0")
    return digest.hexdigest()


def _read_worktree_bytes(repo_relative_path: str, *, cwd: Path = REPO_ROOT) -> bytes | None:
    """Return the raw disk bytes of the worktree file at
    ``repo_relative_path`` (relative to ``cwd``), or ``None`` if it is not
    a regular file.

    This reads bytes directly via ``Path.read_bytes()`` -- it never invokes
    ``git`` for this read, so no configured ``clean``/``smudge``/``process``
    filter, no ``core.autocrlf`` conversion, and no other content
    transform of any kind can run. This is the deterministic countermeasure
    to the MFRP-FINGERPRINT-T1 rework-3 (F1) finding: ``git hash-object``
    (used by an earlier revision of this admission check) executes
    whatever ``clean`` filter ``.gitattributes``/``filter.<name>.clean``
    configures, so a worktree file containing genuinely different content
    can still hash identically to the committed target if a configured
    filter maps arbitrary input to the same fixed output -- filtered blob
    equality is not semantic equivalence, and the governing contract's
    byte recipe explicitly forbids clean/smudge filter execution.
    """
    full = cwd / repo_relative_path
    if not full.is_file() or full.is_symlink():
        return None
    return full.read_bytes()


def _worktree_bytes_match_committed_blob(worktree_bytes: bytes, committed_bytes: bytes,
                                       *, allow_crlf_checkout: bool = False) -> bool:
    """Exact bytes by default; optionally reproduce a proven CRLF checkout.

    The caller must establish metadata eligibility before enabling this
    narrow exception. Never reduce both byte streams to normalized text.
    """
    if worktree_bytes == committed_bytes:
        return True
    if not allow_crlf_checkout or b"\r" in committed_bytes:
        return False
    # Conservative text boundary: never normalize binary/control bytes.
    if any(byte < 32 and byte not in (9, 10) for byte in committed_bytes):
        return False
    return worktree_bytes == committed_bytes.replace(b"\n", b"\r\n")


def _allows_crlf_checkout(path: str, expected_blob: str, *, cwd: Path) -> bool:
    """Read metadata only; never execute a clean/smudge/process filter.

    Require the index to retain the target blob. A later semantic commit
    cannot be laundered into checkout equivalence by newline conversion.
    Unknown metadata/attributes fail closed; exact bytes need no exception.
    """
    index = _run_git(["ls-files", "--stage", "-z", "--", path], cwd=cwd)
    entries = index.stdout.split(b"\0")
    if index.returncode or len(entries) != 2 or entries[-1]:
        return False
    metadata, separator, name = entries[0].partition(b"\t")
    fields = metadata.split()
    if (not separator or name != path.encode("utf-8") or len(fields) != 3
            or fields[0] not in (b"100644", b"100755")
            or fields[1] != expected_blob.encode("ascii") or fields[2] != b"0"):
        return False
    keys = ["text", "eol", "filter", "working-tree-encoding", "ident"]
    proc = _run_git(["check-attr", "-z", *keys, "--", path], cwd=cwd)
    parts = proc.stdout.split(b"\0")
    if proc.returncode or len(parts) != len(keys) * 3 + 1 or parts[-1]:
        return False
    attrs = {}
    for offset, key in zip(range(0, len(parts) - 1, 3), keys):
        if parts[offset] != path.encode("utf-8") or parts[offset + 1] != key.encode():
            return False
        attrs[key] = parts[offset + 2]
    if attrs["text"] not in (b"set", b"auto", b"unspecified"):
        return False
    if any(attrs[key] not in (b"unset", b"unspecified")
           for key in ("filter", "working-tree-encoding", "ident")):
        return False
    if attrs["eol"] == b"crlf":
        return True
    if attrs["eol"] != b"unspecified":
        return False
    config = _run_git(["config", "--get", "core.autocrlf"], cwd=cwd)
    return config.returncode == 0 and config.stdout.strip().lower() == b"true"


def verify_worktree_matches_committed_target(
    base_sha: str, head_sha: str, *, cwd: Path = REPO_ROOT
) -> tuple[bool, str]:
    """Verify that every path changed by ``base_sha..head_sha`` currently
    has, in the worktree rooted at ``cwd``, content equivalent to the blob
    already committed for that path at ``head_sha``.

    This answers the question the raw ``worktreeFingerprint`` stability
    check cannot: not merely "did the worktree stay the same across two
    nearby reads during this one run", but "does the worktree the gate
    commands actually read correspond to the committed target being
    certified". A worktree that is stable yet parked at a later commit
    whose evidence paths have since drifted from ``head_sha`` (the
    MFRP-FINGERPRINT-T1 rework-2 counterexample: A -> B -> C, worktree
    clean at C, admission requested for A..B) fails this check even though
    it would pass a pure before/after stability comparison.

    Equivalence is decided by direct byte comparison (see
    ``_read_worktree_bytes`` and ``_worktree_bytes_match_committed_blob``):
    worktree bytes are read via ``Path.read_bytes()`` and committed bytes
    via ``git cat-file blob`` on the SHA resolved from ``git ls-tree`` --
    neither path ever invokes ``git add``/``git hash-object``/``git
    diff``/``git status`` against the file, so no configured
    ``clean``/``smudge``/``process`` filter and no ``core.autocrlf``
    conversion can execute. This is a deliberate correction of an earlier
    revision of this function (MFRP-FINGERPRINT-T1 rework-3, F1) that used
    ``git hash-object``: that command runs whatever ``clean`` filter
    ``.gitattributes`` configures, so a maliciously or accidentally
    configured filter that maps arbitrary content to one fixed blob could
    make genuinely different worktree content hash identically to the
    committed target -- filtered blob equality is not semantic
    equivalence, and the governing contract's byte recipe explicitly
    forbids clean/smudge filter execution. The only representation
    difference tolerated is a metadata-authorized LF-to-CRLF checkout
    expansion with an unchanged index blob (never an external filter);
    any other difference,
    including any transform a repository's own filter configuration might
    otherwise apply, is treated as drift and rejected.

    Returns ``(True, "reason")`` when every changed path's worktree bytes
    match the committed target (exactly, or via the bounded checkout
    expansion above), or every changed path is a consistent deletion at
    both locations; ``(False, "reason")`` on any other mismatch,
    unsupported entry kind at ``head_sha``, or missing worktree file where
    ``head_sha`` expects content. Raises ``CommittedEvidenceUnavailable``
    only for an explicit Git failure (unresolved ref, non-ancestor range,
    a ``git ls-tree``/``git cat-file`` command failure) -- never silently
    treats a Git failure as either a pass or a fail.
    """
    if not _is_full_commit_sha(base_sha) or not _is_full_commit_sha(head_sha):
        raise CommittedEvidenceUnavailable("baseSha and headSha must be full 40-character commit SHAs")
    if not is_ancestor(base_sha, head_sha, cwd=cwd):
        raise CommittedEvidenceUnavailable(f"{base_sha} is not an ancestor of {head_sha}")

    paths = _changed_paths(base_sha, head_sha, cwd=cwd)
    for path in paths:
        kind = _entry_kind(head_sha, path, cwd=cwd)
        full = cwd / path
        if kind is None:
            # head_sha expects this path deleted/absent; the worktree must
            # agree (no file present at all -- a directory is also treated
            # as "not the expected regular-file content").
            if full.is_file():
                return False, (
                    f"worktree has content at {path!r} but {head_sha} has no "
                    "entry there (deleted-at-head / present-in-worktree drift)"
                )
            continue
        if kind != "blob":
            return False, (
                f"unsupported {kind} entry at {head_sha}:{path} cannot be "
                "admitted through worktree-vs-committed verification"
            )
        expected_blob = _blob_sha(head_sha, path, cwd=cwd)
        if expected_blob is None:
            raise CommittedEvidenceUnavailable(
                f"blob disappeared during resolution for {head_sha}:{path}"
            )
        expected_bytes = _blob_bytes(expected_blob, cwd=cwd)
        worktree_bytes = _read_worktree_bytes(path, cwd=cwd)
        if worktree_bytes is None:
            return False, (
                f"{head_sha} expects blob content at {path!r} but the worktree "
                "has no regular file there"
            )
        if not _worktree_bytes_match_committed_blob(
            worktree_bytes, expected_bytes,
            allow_crlf_checkout=(worktree_bytes != expected_bytes and
                                 _allows_crlf_checkout(path, expected_blob, cwd=cwd)),
        ):
            return False, (
                f"worktree content at {path!r} does not match {head_sha}'s "
                f"committed blob {expected_blob} -- semantic drift, not a "
                "benign checkout representation difference"
            )
    return True, "worktree content matches the committed target for every changed path"


def build_committed_evidence(base_sha: str, head_sha: str, *, cwd: Path = REPO_ROOT) -> dict[str, str]:
    """Build the closed ``committedEvidence`` object for a resolved range."""
    fingerprint = compute_committed_evidence_fingerprint(base_sha, head_sha, cwd=cwd)
    return {
        "profile": COMMITTED_EVIDENCE_PROFILE,
        "baseSha": base_sha,
        "headSha": head_sha,
        "fingerprint": fingerprint,
    }


def validate_committed_evidence_shape(value: object) -> tuple[bool, str]:
    """Validate the closed shape only (keys, types, SHA/fingerprint format).

    Every field is type-checked before any string operation is applied to
    it, so a non-string field (an int, a list, ``None`` held under an
    existing key, and so on) is rejected with a structured ``(False,
    reason)`` result rather than raising ``TypeError`` out of this
    function. Does not recompute the fingerprint or check ancestry; callers
    that need a trust decision must call
    ``compute_committed_evidence_fingerprint`` and compare, and must check
    ancestry themselves via ``is_ancestor``.
    """
    if not isinstance(value, dict) or set(value) != COMMITTED_EVIDENCE_KEYS:
        return False, "committedEvidence keys do not match the closed four-field shape"
    if value.get("profile") != COMMITTED_EVIDENCE_PROFILE:
        return False, "committedEvidence.profile mismatch"
    base_sha = value.get("baseSha")
    if not isinstance(base_sha, str) or not _is_full_commit_sha(base_sha):
        return False, "committedEvidence.baseSha must be a full 40-character commit SHA"
    head_sha = value.get("headSha")
    if not isinstance(head_sha, str) or not _is_full_commit_sha(head_sha):
        return False, "committedEvidence.headSha must be a full 40-character commit SHA"
    fingerprint = value.get("fingerprint")
    if not isinstance(fingerprint, str) or not _FINGERPRINT_RE.fullmatch(fingerprint):
        return False, "committedEvidence.fingerprint must be a lowercase SHA-256 digest"
    return True, "committedEvidence shape valid"
