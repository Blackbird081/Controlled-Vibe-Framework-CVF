#!/usr/bin/env python3
"""Reject closed or committed-superseded targets on active next-move surfaces.

The authority model and exact binding rules live in
docs/reference/CVF_NEXT_MOVE_FRESHNESS_CHECKER_STANDARD_2026-06-16.md.
Supersession evidence is resolved only from Git HEAD bytes.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import re
import subprocess
import sys
import unicodedata
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Iterable


REPO_ROOT = Path(__file__).resolve().parents[2]

FRONT_DOOR_PATH = "CVF_SESSION_MEMORY.md"
STATE_PATH = "CVF_SESSION/ACTIVE_SESSION_STATE.json"

CLOSED_RE = re.compile(r"\bCLOSED_PASS(?:_BOUNDED)?\b", re.IGNORECASE)

LABEL_PATTERNS = (
    re.compile(r"\bRSF-T\d+[A-Z]?\b", re.IGNORECASE),
    re.compile(r"\bFPRC-T\d+[A-Z]?\b", re.IGNORECASE),
    re.compile(r"\bCCLV-T\d+[A-Z]?\b", re.IGNORECASE),
    re.compile(r"\bLHW\d+\b", re.IGNORECASE),
    re.compile(
        r"\b(?:MODEL\s+GATEWAY\s+)?C[-\s]?0?2\s+P\d+(?:[A-Z](?![A-Z0-9]))?(?:[-\s][A-Z](?![A-Z0-9]))?\b",
        re.IGNORECASE,
    ),
)

ACTION_RE = re.compile(
    r"\b("
    r"next\s+allowed\s+move|next\s+move|dispatch(?:ed|ing)?|redispatch|"
    r"dispatch_ready|ready|worker|execute|may\s+open|open\s+only\s+through|"
    r"may\s+proceed|allowed\s+to\s+open|active"
    r")\b",
    re.IGNORECASE,
)

SAFE_CLOSED_CONTEXT_RE = re.compile(
    r"\b("
    r"closed_pass(?:_bounded)?|already\s+closed|is\s+closed|closed\s+at|"
    r"do\s+not|must\s+not|not\s+authorized|blocked|parked"
    r")\b",
    re.IGNORECASE,
)

STARTUP_ACK_RE = re.compile(r"^Startup acknowledged:.*$", re.IGNORECASE | re.MULTILINE)

# Exact-target committed-supersession evidence is current-only.
EVIDENCE_DIRS = ("docs/reviews", "docs/baselines")
EVIDENCE_ARCHIVE_MARKER = "/archive/"

# Planning targets are limited to the two governed families below.
TARGET_PATH_RE = re.compile(
    r"\b(docs[/\\](?:assessments|roadmaps)[/\\][A-Za-z0-9_./\\~:-]+\.md)\b"
)

SHA256_LABEL_RE = re.compile(r"\bSHA-256\b", re.IGNORECASE)
SHA256_TOKEN_RE = re.compile(r"`?([0-9a-fA-F]{64})`?")
COMMIT_LABEL_RE = re.compile(r"\bcommit\b", re.IGNORECASE)
# Only an unambiguous full commit ID can authorize a binding.
COMMIT_TOKEN_RE = re.compile(r"`?([0-9a-fA-F]{40})`?\b")

# Terminality requires a recognized label followed by a recognized token.
TERMINAL_DISPOSITION_LABEL_RE = re.compile(
    r"\b("
    r"final\s+reconciliation\s+disposition|"
    r"final\s+disposition|"
    r"reconciliation\s+disposition|"
    r"closure\s+disposition|"
    r"terminal\s+disposition"
    r")\s*:",
    re.IGNORECASE,
)

# Worker-return COMPLETE tokens are intentionally non-terminal here.
TERMINAL_DISPOSITION_TOKENS = (
    "ACCEPT_REVISE_BEFORE_IMPLEMENTATION_PLANNING",
    "ACCEPT_WITH_BOUNDED_REPAIR_PENDING_MATERIAL_COMMIT",
    "REVISE_BEFORE_IMPLEMENTATION_PLANNING",
    "SELECTIVELY_ADAPTED_INTO_REVISED_PLAN",
    "SUPERSEDED",
    "CLOSED_PASS",
    "CLOSED_PASS_BOUNDED",
    "RECONCILED",
)
TERMINAL_DISPOSITION_TOKEN_RE = re.compile(
    r"`?(" + "|".join(re.escape(token) for token in TERMINAL_DISPOSITION_TOKENS) + r")`?\b"
)

# Advisory text without a terminal label/token pair never supersedes a target.
ADVISORY_ONLY_RE = re.compile(
    r"\b(critique|advisory[_\s]input|advisory[_\s]only)\b", re.IGNORECASE
)

# Bindings never combine unrelated Markdown rows or sentences.
TABLE_ROW_RE = re.compile(r"^\s*\|.*\|\s*$")


@dataclass(frozen=True)
class TargetIdentity:
    """A next-move-mentioned target, normalized and Git-verified at HEAD."""

    normalized_path: str
    head_sha256: str


@dataclass(frozen=True)
class SupersededTarget:
    target_path: str
    evidence_path: str
    binding: str
    matched_hash: str
    binding_kind: str  # "sha256" or "commit"


@dataclass(frozen=True)
class ClosedTarget:
    label: str
    aliases: tuple[str, ...]
    evidence: str


@dataclass(frozen=True)
class NextMoveSurface:
    name: str
    path: str
    text: str


@dataclass(frozen=True)
class Violation:
    surface: str
    target: str
    line: str
    evidence: str


def _configure_stdout() -> None:
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    if hasattr(sys.stderr, "reconfigure"):
        sys.stderr.reconfigure(encoding="utf-8", errors="replace")


def _read_text(rel_path: str) -> str | None:
    full = REPO_ROOT / rel_path
    if not full.exists() or full.is_dir():
        return None
    return full.read_text(encoding="utf-8", errors="replace")


def _load_state() -> tuple[dict[str, Any] | None, str | None]:
    text = _read_text(STATE_PATH)
    if text is None:
        return None, f"{STATE_PATH} not found"
    try:
        data = json.loads(text)
    except json.JSONDecodeError as exc:
        return None, f"{STATE_PATH} is not valid JSON: {exc}"
    if not isinstance(data, dict):
        return None, f"{STATE_PATH} is not a JSON object"
    return data, None


def _normalize_for_matching(text: str) -> str:
    return re.sub(r"\s+", " ", text.replace("_", " ").replace("/", " ")).strip()


def _canonical_label(raw: str) -> str:
    text = _normalize_for_matching(raw).upper()
    mg = re.search(r"(?:MODEL\s+GATEWAY\s+)?C[-\s]?0?2\s+(P\d+[A-Z]?(?:[-\s][A-Z])?)", text)
    if mg:
        phase = mg.group(1).replace(" ", "-")
        return f"Model Gateway C-02 {phase}"
    for prefix in ("RSF", "FPRC", "CCLV"):
        match = re.search(rf"\b{prefix}-T\d+[A-Z]?\b", text)
        if match:
            return match.group(0)
    match = re.search(r"\bLHW\d+\b", text)
    if match:
        return match.group(0)
    return raw.strip()


def _aliases_for(label: str) -> tuple[str, ...]:
    aliases = {label}
    upper = label.upper()
    if upper.startswith("MODEL GATEWAY C-02 "):
        short = label.replace("Model Gateway ", "")
        aliases.add(short)
        aliases.add(short.replace("C-02", "C02"))
        aliases.add(label.replace("C-02", "C02"))
    return tuple(sorted(aliases, key=len, reverse=True))


def _labels_from_text(text: str) -> set[str]:
    normalized = _normalize_for_matching(text)
    labels: set[str] = set()
    for pattern in LABEL_PATTERNS:
        for match in pattern.finditer(normalized):
            labels.add(_canonical_label(match.group(0)))
    return labels


def _iter_closed_target_records(value: Any, path: str = "$") -> Iterable[tuple[str, str]]:
    if isinstance(value, dict):
        status = value.get("status")
        status_is_closed = isinstance(status, str) and CLOSED_RE.search(status)
        if status_is_closed:
            evidence_parts = [path]
            for key, nested in value.items():
                if isinstance(nested, str) and key in {
                    "roadmap",
                    "gc018",
                    "workOrder",
                    "workerReturn",
                    "reviewerOwnedClosurePath",
                    "completionReviewPath",
                    "completion",
                    "review",
                }:
                    evidence_parts.append(key)
                    evidence_parts.append(nested)
            yield " ".join(evidence_parts), f"{path}.status={status}"
        for key, nested in value.items():
            yield from _iter_closed_target_records(nested, f"{path}.{key}")
    elif isinstance(value, list):
        for index, nested in enumerate(value):
            yield from _iter_closed_target_records(nested, f"{path}[{index}]")
    elif isinstance(value, str) and CLOSED_RE.search(value):
        yield value, path


def collect_closed_targets(state: dict[str, Any]) -> list[ClosedTarget]:
    by_label: dict[str, ClosedTarget] = {}
    for text, evidence in _iter_closed_target_records(state):
        for label in _labels_from_text(text):
            by_label.setdefault(
                label,
                ClosedTarget(label=label, aliases=_aliases_for(label), evidence=evidence),
            )
    return sorted(by_label.values(), key=lambda item: item.label)


def _extract_heading_section(text: str | None, heading: str) -> str | None:
    if text is None:
        return None
    lines = text.splitlines()
    start: int | None = None
    heading_lower = heading.lower()
    for index, line in enumerate(lines):
        if line.strip().lower() == heading_lower:
            start = index + 1
            break
    if start is None:
        return None
    end = len(lines)
    for index in range(start, len(lines)):
        if lines[index].startswith("## "):
            end = index
            break
    return "\n".join(lines[start:end]).strip()


def _extract_startup_ack(text: str | None) -> str:
    if text is None:
        return ""
    match = STARTUP_ACK_RE.search(text)
    return match.group(0).strip() if match else ""


def collect_next_move_surfaces(state: dict[str, Any]) -> tuple[list[NextMoveSurface], list[str]]:
    surfaces: list[NextMoveSurface] = []
    diagnostics: list[str] = []

    next_allowed = state.get("nextAllowedMove")
    if isinstance(next_allowed, str) and next_allowed.strip():
        surfaces.append(NextMoveSurface("active state nextAllowedMove", STATE_PATH, next_allowed))
    else:
        diagnostics.append(f"{STATE_PATH} missing top-level nextAllowedMove string")

    front_text = _read_text(FRONT_DOOR_PATH)
    front_next = _extract_heading_section(front_text, "## Next Allowed Move")
    if front_next:
        surfaces.append(NextMoveSurface("front-door Next Allowed Move", FRONT_DOOR_PATH, front_next))
    else:
        diagnostics.append(f"{FRONT_DOOR_PATH} missing ## Next Allowed Move section")

    handoff = state.get("activeHandoff")
    handoff_path = handoff if isinstance(handoff, str) and handoff else None
    handoff_text = _read_text(handoff_path) if handoff_path else None
    if not handoff_path:
        diagnostics.append(f"{STATE_PATH} missing activeHandoff string")
    elif handoff_text is None:
        diagnostics.append(f"active handoff not found: {handoff_path}")
    else:
        handoff_next = _extract_heading_section(handoff_text, "## Next Allowed Move")
        if handoff_next:
            surfaces.append(NextMoveSurface("active handoff Next Allowed Move", handoff_path, handoff_next))
        else:
            diagnostics.append(f"{handoff_path} missing ## Next Allowed Move section")
        startup_ack = _extract_startup_ack(handoff_text)
        if startup_ack:
            surfaces.append(NextMoveSurface("active handoff startup acknowledgment", handoff_path, startup_ack))
        else:
            diagnostics.append(f"{handoff_path} missing startup acknowledgment")

    return surfaces, diagnostics


def _line_contains_alias(line: str, target: ClosedTarget) -> bool:
    line_lower = _normalize_for_matching(line).lower()
    return any(_normalize_for_matching(alias).lower() in line_lower for alias in target.aliases)


def _iter_fragments(text: str) -> Iterable[str]:
    paragraph: list[str] = []
    for raw_line in [*text.splitlines(), ""]:
        stripped = raw_line.strip()
        if stripped:
            paragraph.append(stripped)
            continue
        if not paragraph:
            continue
        logical_line = " ".join(paragraph)
        paragraph = []
        for fragment in re.split(r"(?<=[.;])\s+|\s+-\s+", logical_line):
            cleaned = fragment.strip()
            if cleaned:
                yield cleaned


# --- Git-authoritative primitives ------------------------------------------


def _run_git(args: list[str]) -> tuple[int, bytes, str]:
    """Run a git subcommand rooted at REPO_ROOT. Returns (returncode,
    stdout_bytes, stderr_text). Never raises on a non-zero exit; callers
    decide how to interpret failure (usually: treat as "not authoritative,
    do not supersede").
    """
    proc = subprocess.run(
        ["git", *args],
        cwd=REPO_ROOT,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
    )
    return proc.returncode, proc.stdout, proc.stderr.decode("utf-8", errors="replace")


def normalize_target_path(raw: str) -> str | None:
    """Normalize a next-move-mentioned path to one canonical POSIX form, or
    return None if the form is unsafe/ambiguous and must fail closed.

    Rejects: empty input, absolute paths, drive-letter prefixes (`C:`),
    UNC-style `\\\\server\\...` forms, `..` traversal segments, and a `~`
    home-relative marker. Accepts a mix of `/` and `\\` separators as long as
    the normalized result is unambiguous.
    """
    if not raw:
        return None
    candidate = raw.strip().strip("`")
    if not candidate:
        return None
    # Reject drive-letter and UNC forms before separator normalization,
    # since "C:\\foo" or "\\\\server\\share" must never be treated as a safe
    # repository-relative candidate.
    if re.match(r"^[A-Za-z]:[/\\]", candidate):
        return None
    if candidate.startswith("\\\\") or candidate.startswith("//"):
        return None
    normalized = candidate.replace("\\", "/")
    normalized = re.sub(r"/+", "/", normalized)
    if normalized.startswith("/") or normalized.startswith("~"):
        return None
    segments = normalized.split("/")
    if any(segment in ("..", ".") or segment == "" for segment in segments):
        return None
    if any("~" in segment for segment in segments):
        return None
    return normalized


def _fold_for_collision(path: str) -> str:
    """Fold a path to a form used only for collision DETECTION (never for
    resolving which real file is meant): Unicode NFC-normalized and
    lowercased, so a case-only or Unicode-normalization-only variant of the
    same visible path is recognized as a possible collision rather than
    silently treated as a distinct, unambiguous file.
    """
    return unicodedata.normalize("NFC", path).lower()


def _ls_tree_paths_ci(normalized_path: str) -> list[str]:
    """Return every path tracked at HEAD whose case/Unicode-folded form
    equals normalized_path's folded form. Used to detect case-only or
    Unicode-normalization-only collisions and to confirm exact tracked
    existence without ever trusting the working tree.
    """
    parent = normalized_path.rsplit("/", 1)[0] if "/" in normalized_path else "."
    returncode, out, _ = _run_git(["ls-tree", "-r", "--name-only", "HEAD", "--", parent + "/"])
    if returncode != 0:
        return []
    candidates = out.decode("utf-8", errors="replace").splitlines()
    target_folded = _fold_for_collision(normalized_path)
    return [c for c in candidates if _fold_for_collision(c) == target_folded]


def resolve_target_identity(raw_path: str) -> tuple[TargetIdentity | None, str | None]:
    """Resolve a raw next-move path mention to a Git-verified TargetIdentity.

    Returns (identity, ambiguity_reason). Exactly one of the two is
    non-None on any ambiguous/ineligible outcome:
    - (None, None): the path is simply not a tracked-at-HEAD candidate (an
      unsafe/malformed form, or a brand-new/never-committed path) - not an
      error, nothing to bind yet;
    - (None, reason): a real case-only or Unicode-normalization-only
      collision was found among tracked paths - fails closed as ambiguous
      rather than guessing which file is meant;
    - (identity, None): a unique, safe, tracked-at-HEAD match was resolved.
    """
    normalized = normalize_target_path(raw_path)
    if normalized is None:
        return None, None
    # Restrict to the governed families even after normalization, using a
    # plain fullmatch (not the lexing-stage TARGET_PATH_RE, which is
    # deliberately permissive about separators before normalization runs).
    if not re.fullmatch(r"docs/(?:assessments|roadmaps)/[A-Za-z0-9_./-]+\.md", normalized):
        return None, None
    matches = _ls_tree_paths_ci(normalized)
    exact_matches = [m for m in matches if m == normalized]
    if len(exact_matches) != 1:
        if len(matches) >= 1:
            # A case/Unicode-fold variant is tracked but no byte-exact match
            # exists: this is a real ambiguous collision, not "does not
            # exist" - surface it rather than silently returning nothing.
            return None, (
                f"{normalized}: no byte-exact tracked match at HEAD, but "
                f"case/Unicode-fold variant(s) are tracked ({', '.join(sorted(matches))}); "
                "AMBIGUOUS - refusing to guess which file is meant"
            )
        return None, None
    if len(matches) > 1:
        return None, (
            f"{normalized}: byte-exact tracked match exists at HEAD, but "
            f"additional case/Unicode-fold variant(s) are also tracked "
            f"({', '.join(sorted(m for m in matches if m != normalized))}); "
            "AMBIGUOUS - refusing to treat the exact match as authoritative"
        )
    returncode, head_bytes, _ = _run_git(["show", f"HEAD:{normalized}"])
    if returncode != 0:
        return None, None
    head_sha256 = hashlib.sha256(head_bytes).hexdigest()
    return TargetIdentity(normalized_path=normalized, head_sha256=head_sha256), None


def target_is_dirty(normalized_path: str) -> bool:
    """True when normalized_path is tracked and its working-tree content
    differs from its HEAD blob (staged or unstaged). Never treats an
    untracked file as dirty here; untracked-ness is handled separately by
    resolve_target_identity returning None.
    """
    returncode, out, _ = _run_git(["status", "--porcelain=v1", "--", normalized_path])
    if returncode != 0:
        return False
    for line in out.decode("utf-8", errors="replace").splitlines():
        status_code = line[:2]
        if status_code.strip() == "??":
            continue
        if status_code.strip():
            return True
    return False


# Characters that, immediately preceding a TARGET_PATH_RE match, mean the
# regex has only captured a SUFFIX of a longer, unsafe path mention (e.g.
# `\b` matches at the `:`->`d` boundary in `C:\docs\...`, silently dropping
# the drive-letter prefix from the captured group). Any such prefix
# character must reject the match outright rather than normalize the
# truncated suffix as if it were the whole mention.
_UNSAFE_PRECEDING_CHARS = (":", "\\", "~")


def _target_paths_from_text(text: str) -> set[str]:
    normalized: set[str] = set()
    for match in TARGET_PATH_RE.finditer(text):
        start = match.start(1)
        if start > 0 and text[start - 1] in _UNSAFE_PRECEDING_CHARS:
            # The real mention extends further left than what \b matched
            # (drive-letter colon, UNC/extra backslash, or home-tilde) -
            # reject rather than silently normalize a truncated suffix.
            continue
        candidate = normalize_target_path(match.group(1))
        if candidate is not None:
            normalized.add(candidate)
    return normalized


def _unsafe_target_mentions_from_text(text: str) -> list[str]:
    """Return governed-target-like mentions that cannot be normalized safely.

    These are diagnostics, not candidates.  Silently dropping them would let
    an actionable drive-qualified, traversal, UNC, or home-relative spelling
    bypass the freshness check entirely.
    """
    diagnostics: list[str] = []
    for match in TARGET_PATH_RE.finditer(text):
        raw = match.group(1)
        start = match.start(1)
        unsafe_prefix = start > 0 and text[start - 1] in _UNSAFE_PRECEDING_CHARS
        if unsafe_prefix or normalize_target_path(raw) is None:
            diagnostics.append(
                f"unsafe or ambiguous governed target mention {raw!r}; "
                "refusing to drop an unresolvable next-move target"
            )
    return diagnostics


def _parse_cat_file_batch(entries: list[tuple[str, str]], batch_output: bytes) -> dict[str, str]:
    """Parse `git cat-file --batch` output into {path: text}. entries is the
    ordered (blob_sha1, path) list fed as input, in the same order the
    batch output emits records. This decodes the entire evidence corpus in
    one subprocess round-trip instead of one `git show` per file (~5,000+
    files would otherwise dominate runtime; see Consolidated Rework R1
    Command Evidence for the measured before/after).
    """
    results: dict[str, str] = {}
    pos = 0
    for _sha1, path in entries:
        newline_idx = batch_output.index(b"\n", pos)
        header = batch_output[pos:newline_idx].decode("utf-8", errors="replace")
        parts = header.split()
        if len(parts) != 3:
            # "<sha1> missing" or similar: object could not be read.
            pos = newline_idx + 1
            continue
        _obj_sha1, _obj_type, size_text = parts
        size = int(size_text)
        content_start = newline_idx + 1
        content = batch_output[content_start:content_start + size]
        results[path] = content.decode("utf-8", errors="replace")
        pos = content_start + size + 1  # skip the record's trailing newline
    return results


def _load_evidence_corpus() -> dict[str, str]:
    """Load {path: text} for every non-archive Markdown path tracked at HEAD
    under the bounded evidence families, in one batched `git ls-tree` plus
    one batched `git cat-file --batch` round-trip. Uses HEAD-tracked
    listings only, never a working-tree directory walk, so an untracked
    evidence file can never be discovered or read here.
    """
    returncode, out, _ = _run_git(
        ["ls-tree", "-r", "HEAD", "--", *(f"{d}/" for d in EVIDENCE_DIRS)]
    )
    if returncode != 0:
        return {}
    entries: list[tuple[str, str]] = []
    for line in out.decode("utf-8", errors="replace").splitlines():
        if "\t" not in line:
            continue
        meta, rel = line.split("\t", 1)
        meta_parts = meta.split()
        if len(meta_parts) != 3:
            continue
        _mode, objtype, sha1 = meta_parts
        if objtype != "blob" or not rel.endswith(".md"):
            continue
        if f"/{EVIDENCE_ARCHIVE_MARKER.strip('/')}/" in f"/{rel}/":
            continue
        entries.append((sha1, rel))
    if not entries:
        return {}
    batch_input = ("\n".join(sha1 for sha1, _ in entries) + "\n").encode("ascii")
    proc = subprocess.run(
        ["git", "cat-file", "--batch"],
        cwd=REPO_ROOT,
        input=batch_input,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
    )
    if proc.returncode != 0:
        return {}
    return _parse_cat_file_batch(entries, proc.stdout)


def _iter_binding_units(text: str) -> Iterable[str]:
    """Yield one binding unit per Markdown table row (a full `| ... |`
    physical line) or per sentence-bounded logical line from the remaining
    non-table prose. A path/hash/disposition triple must co-occur inside one
    such unit; it can never be assembled across unrelated rows or
    paragraphs. Table rows are stripped out before handing the remainder to
    _iter_fragments, so two adjacent table rows (no blank line between them)
    are never merged into one paragraph/fragment by that function's
    paragraph-joining logic.
    """
    non_table_lines: list[str] = []
    for raw_line in text.splitlines():
        if TABLE_ROW_RE.match(raw_line):
            yield raw_line
            non_table_lines.append("")  # preserve paragraph breaks
        else:
            non_table_lines.append(raw_line)
    yield from _iter_fragments("\n".join(non_table_lines))


def _document_has_terminal_disposition(text: str) -> bool:
    """True only when a recognized disposition label is followed, on the
    same line or the next non-blank line, by a recognized disposition
    token. This is a document-level check (not row/window-proximity based),
    matching the reviewer's requirement to separate identity binding from
    consuming-disposition proof.
    """
    lines = text.splitlines()
    for index, line in enumerate(lines):
        if not TERMINAL_DISPOSITION_LABEL_RE.search(line):
            continue
        label_start = TERMINAL_DISPOSITION_LABEL_RE.search(line).end()
        same_line_tail = line[label_start:]
        if TERMINAL_DISPOSITION_TOKEN_RE.search(same_line_tail):
            return True
        for lookahead in lines[index + 1: index + 3]:
            if not lookahead.strip():
                continue
            if TERMINAL_DISPOSITION_TOKEN_RE.search(lookahead):
                return True
            break
    return False


def classify_document_terminality(text: str) -> str:
    """Deterministic, testable classification used for diagnostic
    reporting only (never for authorization, which always goes through
    _document_has_terminal_disposition directly): "TERMINAL" when a
    recognized disposition label+token pair exists; "ADVISORY_ONLY" when
    the document reads as a bare critique/advisory-input with no such pair;
    "UNCLASSIFIED" otherwise.
    """
    if _document_has_terminal_disposition(text):
        return "TERMINAL"
    if ADVISORY_ONLY_RE.search(text):
        return "ADVISORY_ONLY"
    return "UNCLASSIFIED"


def _extract_binding(unit: str) -> tuple[str, str] | None:
    """From one binding unit (table row or logical line), return
    (kind, token) for the first qualifying SHA-256 or full 40-hex commit
    token labelled inside that same unit, or None. A short (7-39 hex char)
    commit-labelled token is intentionally not returned here: it is
    diagnostic-only and must never authorize supersession.
    """
    if SHA256_LABEL_RE.search(unit):
        sha_match = SHA256_TOKEN_RE.search(unit, SHA256_LABEL_RE.search(unit).end())
        if sha_match:
            return "sha256", sha_match.group(1).lower()
    if COMMIT_LABEL_RE.search(unit):
        label_end = COMMIT_LABEL_RE.search(unit).end()
        commit_match = COMMIT_TOKEN_RE.search(unit, label_end)
        if commit_match:
            return "commit", commit_match.group(1).lower()
    return None


def _verify_commit_binding(commit_id: str, target_path: str, head_sha256: str) -> bool:
    """Requirement B: the commit must exist, be an ancestor of HEAD, contain
    target_path, and have byte-identical target content at that commit
    compared to HEAD. Any failure at any step returns False (fail closed).
    """
    returncode, _, _ = _run_git(["rev-parse", "--verify", "--quiet", f"{commit_id}^{{commit}}"])
    if returncode != 0:
        return False
    returncode, _, _ = _run_git(["merge-base", "--is-ancestor", commit_id, "HEAD"])
    if returncode != 0:
        return False
    returncode, blob, _ = _run_git(["show", f"{commit_id}:{target_path}"])
    if returncode != 0:
        return False
    commit_sha256 = hashlib.sha256(blob).hexdigest()
    return commit_sha256 == head_sha256


def find_superseded_targets(
    target_paths: set[str],
) -> tuple[list[SupersededTarget], list[str]]:
    """Discover, for each candidate normalized target path, whether a
    committed (HEAD-tracked) evidence file binds that exact path to
    Git-verifiable identity (Accepted Binding A or B) inside a document that
    also carries a recognized terminal disposition. Returns
    (superseded_targets, ambiguity_diagnostics); ambiguity_diagnostics
    reports dirty-frontier or unresolved-target conditions that must never
    be silently treated as either fresh or superseded.
    """
    superseded: list[SupersededTarget] = []
    ambiguity_diagnostics: list[str] = []

    if not target_paths:
        return superseded, ambiguity_diagnostics

    # One batched corpus load for the whole call, regardless of how many
    # candidate targets are being checked (see _load_evidence_corpus).
    evidence_corpus = _load_evidence_corpus()

    for target_path in sorted(target_paths):
        identity, ambiguity_reason = resolve_target_identity(target_path)
        if ambiguity_reason is not None:
            ambiguity_diagnostics.append(ambiguity_reason)
            continue
        if identity is None:
            # Untracked or unsafe form: nothing to bind. Not an error by
            # itself (a brand-new, never-committed target is legitimate and
            # simply cannot be superseded yet).
            continue
        if target_is_dirty(identity.normalized_path):
            ambiguity_diagnostics.append(
                f"{identity.normalized_path}: working-tree content differs from "
                "the HEAD-committed blob; this checker only evaluates "
                "committed content, so freshness for this target is "
                "AMBIGUOUS until the dirty edit is committed or reverted"
            )
            continue

        for evidence_path, evidence_text in sorted(evidence_corpus.items()):
            if not evidence_text or identity.normalized_path not in evidence_text:
                continue
            if not _document_has_terminal_disposition(evidence_text):
                continue

            found_binding: tuple[str, str] | None = None
            for unit in _iter_binding_units(evidence_text):
                if identity.normalized_path not in unit:
                    continue
                binding = _extract_binding(unit)
                if binding is None:
                    continue
                kind, token = binding
                if kind == "sha256":
                    if token == identity.head_sha256:
                        found_binding = (kind, token)
                        break
                    # Exact path but a different SHA-256 in this unit: do
                    # not treat this as supersession, and keep scanning
                    # other units/files rather than assuming this document
                    # is authoritative.
                    continue
                if kind == "commit":
                    if _verify_commit_binding(token, identity.normalized_path, identity.head_sha256):
                        found_binding = (kind, token)
                        break
                    continue

            if found_binding is None:
                continue
            kind, token = found_binding
            superseded.append(
                SupersededTarget(
                    target_path=identity.normalized_path,
                    evidence_path=evidence_path,
                    binding=f"{kind} {token}",
                    matched_hash=token,
                    binding_kind=kind,
                )
            )
            break

    return superseded, ambiguity_diagnostics


def evaluate(
    closed_targets: list[ClosedTarget],
    surfaces: list[NextMoveSurface],
    diagnostics: list[str],
    superseded_targets: list[SupersededTarget] | None = None,
    ambiguity_diagnostics: list[str] | None = None,
) -> list[Violation]:
    violations = [
        Violation(
            surface="configuration",
            target="next-move surface",
            line=diagnostic,
            evidence="required current next-move surface missing",
        )
        for diagnostic in diagnostics
    ]

    violations.extend(
        Violation(
            surface="dirty-frontier ambiguity",
            target="next-move surface",
            line=diagnostic,
            evidence=(
                "AMBIGUOUS_DIRTY_TARGET: working-tree content differs from "
                "the HEAD-committed blob for a target named in current "
                "next-move text; commit or revert before this checker can "
                "evaluate freshness for that target"
            ),
        )
        for diagnostic in (ambiguity_diagnostics or [])
    )

    for surface in surfaces:
        for line in _iter_fragments(surface.text):
            for target in closed_targets:
                if not _line_contains_alias(line, target):
                    continue
                if not ACTION_RE.search(line):
                    continue
                if SAFE_CLOSED_CONTEXT_RE.search(line):
                    continue
                violations.append(
                    Violation(
                        surface=f"{surface.name} ({surface.path})",
                        target=target.label,
                        line=line,
                        evidence=target.evidence,
                    )
                )

    superseded_by_path = {item.target_path: item for item in (superseded_targets or [])}
    if superseded_by_path:
        for surface in surfaces:
            for line in _iter_fragments(surface.text):
                for target_path in _target_paths_from_text(line):
                    superseded = superseded_by_path.get(target_path)
                    if superseded is None:
                        continue
                    if not ACTION_RE.search(line):
                        continue
                    if SAFE_CLOSED_CONTEXT_RE.search(line):
                        continue
                    violations.append(
                        Violation(
                            surface=f"{surface.name} ({surface.path})",
                            target=target_path,
                            line=line,
                            evidence=(
                                f"superseded by {superseded.evidence_path} "
                                f"(binding hash {superseded.matched_hash}); "
                                "recommended action: refresh current frontier "
                                "rather than redispatch"
                            ),
                        )
                    )
    return violations


def main() -> int:
    _configure_stdout()
    parser = argparse.ArgumentParser(
        description=(
            "Check current CVF next-move surfaces for stale references to "
            "targets already CLOSED_PASS or CLOSED_PASS_BOUNDED, or to exact "
            "governed planning/assessment targets already superseded by a "
            "committed reconciliation, completion, or terminal-closure "
            "record (AFFD-R1)."
        )
    )
    parser.add_argument(
        "--enforce",
        action="store_true",
        help="Exit non-zero when stale closed-target next-move text is found.",
    )
    args = parser.parse_args()

    print("=== CVF Next-Move Freshness Checker ===")
    state, error = _load_state()
    if error:
        print(f"VIOLATION: {error}")
        return 1 if args.enforce else 0
    assert state is not None

    closed_targets = collect_closed_targets(state)
    surfaces, diagnostics = collect_next_move_surfaces(state)

    print(f"Closed targets discovered: {len(closed_targets)}")
    for target in closed_targets:
        print(f"  - {target.label} [{target.evidence}]")

    print(f"\nNext-move surfaces checked: {len(surfaces)}")
    for surface in surfaces:
        print(f"  - {surface.name}: {surface.path}")

    candidate_target_paths: set[str] = set()
    unsafe_target_diagnostics: list[str] = []
    for surface in surfaces:
        candidate_target_paths |= _target_paths_from_text(surface.text)
        for fragment in _iter_fragments(surface.text):
            if not ACTION_RE.search(fragment) or SAFE_CLOSED_CONTEXT_RE.search(fragment):
                continue
            unsafe_target_diagnostics.extend(_unsafe_target_mentions_from_text(fragment))
    superseded_targets, ambiguity_diagnostics = find_superseded_targets(candidate_target_paths)
    ambiguity_diagnostics.extend(unsafe_target_diagnostics)

    print(f"\nExact-target candidates scanned: {len(candidate_target_paths)}")
    for candidate in sorted(candidate_target_paths):
        print(f"  - {candidate}")
    print(f"Superseded exact targets discovered: {len(superseded_targets)}")
    for superseded in superseded_targets:
        print(
            f"  - {superseded.target_path} superseded by "
            f"{superseded.evidence_path} ({superseded.binding_kind} {superseded.matched_hash})"
        )
    if ambiguity_diagnostics:
        print(f"Dirty-frontier ambiguities discovered: {len(ambiguity_diagnostics)}")
        for diagnostic in ambiguity_diagnostics:
            print(f"  - {diagnostic}")

    violations = evaluate(
        closed_targets, surfaces, diagnostics, superseded_targets, ambiguity_diagnostics
    )
    print(f"\nViolations: {len(violations)}")
    for violation in violations:
        print(f"  - {violation.surface}: {violation.target}")
        print(f"    line: {violation.line}")
        print(f"    closed evidence: {violation.evidence}")

    if violations:
        if args.enforce:
            print("\nVIOLATION - current next-move text points at closed or superseded work.")
            return 1
        print("\nADVISORY - current next-move text may point at closed or superseded work.")
        return 0

    print("\nCOMPLIANT - current next-move surfaces do not dispatch closed or superseded targets.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
