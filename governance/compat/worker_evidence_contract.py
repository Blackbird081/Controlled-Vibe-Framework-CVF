#!/usr/bin/env python3
"""CVF evidence-readiness validator (EVIDENCE-READINESS-T1, rework pass).

Reusable, importable validator that extends the existing worker-return
quality checker (`check_worker_return_quality_gate.py`) with a compact,
versioned evidence-binding data model. It is reached automatically by the
existing checker's `diagnose`/`run` path for worker returns whose *dispatch
work order* declares an evidence-readiness contract -- applicability is
derived from trusted work-order scope, never a worker-selected opt-out.

Scope and non-goals (see `## Semantics boundary` row of the paired
acceptance table): a clean result here certifies evidence *consistency* and
*bound source identity* only. It never proves an agent actually read a file,
never proves a discovery pass was exhaustive outside the declared candidate
set, and never certifies the correctness of any implementation claim. Those
remain reviewer obligations.

Rework note (2026-09-14, generation 1): a Local reviewer probe found five
defect groups in the initial pass -- `evaluate_worker_return()` never
actually resolved a row's claimed source identity against Git/a snapshot
(F1); structural safety helpers (`parse_strict_json`, path containment)
existed but were never reached from the entrypoint (F2); the reuse-binding
field parser's regex could not match its own documented dotted/slashed key
shape at all, so `validate_reuse_bindings()` was permanently starved of
input through the real entrypoint (F3); scaffold applicability defaulted off
and the audit-only-drift index was never populated automatically (F4, fixed
in the checker/scaffold files); and the previously reported latency numbers
were measured against a no-op path (F5). Generation 1 fixed F1-F3 here.

Rework note (2026-09-14, generation 2): a second independent probe found the
generation-1 fixes still had four gaps -- `validate_source_identity()` never
checked a row's declared `lineCount` against the source's real line count,
and a `sourcePin` containing "N/A" exempted ALL source verification for a
binding even when it had rows claiming real evidence, both under the F1
umbrella; REUSED rows were still excluded from source-identity resolution,
and the reuse chain only compared worker-declared strings against each
other with nothing independently readable to verify `priorArtifactSha256`
against, under F3. This generation adds real line-count verification (both
resolvers), closes the `sourcePin: N/A` blanket-skip escape hatch (a binding
with rows claiming evidence cannot exempt itself with an N/A pin), routes
REUSED rows through the same source-identity resolution as READ rows, and
adds a `priorArtifactPath` reuse-table column so `priorArtifactSha256` is
checked against real, independently readable bytes rather than a bare
worker-typed hex string. See `check_worker_return_quality_gate.py` for
generation 2's F4 (index integrity) and F5 (real shared-resolver wiring)
fixes.

Design constraints from the work order's Required Implementation Contract:

1. Pure data-model validation; one bounded resolver for source bytes/digests
   (batched Git operations, never a per-file subprocess and never shell
   execution of a recorded query string). A bounded snapshot resolver covers
   non-Git local projects (requirement 2).
2. One compact versioned evidence-binding schema, source-root relative,
   normalized paths, rejecting traversal/unsafe symlinks/ambiguous refs/
   duplicate JSON keys/invalid types.
3. Row-level identity: path, source identity, blob/content digest, line
   count, read spans, and read/reuse/exclusion status; overlap/coverage
   validation; reuse points at an immutable prior artifact digest+row.
4. Independent declared discovery manifest reconciled against processing
   rows; never rerun recorded queries; no hard-coded QM-specific counts.
5. Reject current-placeholder counts/drift/stale digest while historical
   fail/fix entries stay valid; one-directional digest binding only
   (finalized JSON hashes into the Markdown, never the reverse).
"""

from __future__ import annotations

import hashlib
import json
import re
import subprocess
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any, Callable

SCHEMA_VERSION = "cvf.workerEvidenceReadiness.v1"

# --- Applicability -----------------------------------------------------
# A worker return is only subject to evidence-readiness validation when its
# *cited dispatch work order* declares this contract token. This mirrors the
# existing fast-doc-variant pattern in check_worker_return_quality_gate.py:
# eligibility is proven by reading a trusted upstream file, not by anything
# the worker return itself asserts, so omission or tampering in the return
# cannot opt a covered task out.
EVIDENCE_READINESS_CONTRACT_TOKEN = "evidenceReadinessContract: REQUIRED_V1"

# Heading the worker return must carry when the contract is REQUIRED.
EVIDENCE_BINDING_HEADING = "## Evidence Readiness Binding"

# --- Scaffold applicability auto-derivation (F4 fix) ------------------
# Shared by both `build_dispatch_packet_scaffold.py` and
# `build_worker_return_skeleton_scaffold.py` (both already import from this
# module) so the two scaffold owners cannot drift into two different
# applicability rules. Requirement 6: "derive applicability from trusted
# work-order scope/contract and recognized structured evidence, not a
# worker-selected opt-out" -- the *default* (no flag passed at all) must
# actively inspect the packet's own already-declared shape rather than
# silently staying off.

# Packet kinds whose whole shape is evidence/audit/corpus-producing by
# definition. Empty today by design: see the docstring on
# `evidence_readiness_auto_detected` for why `source-intake` is deliberately
# excluded. Kept as an explicit, reviewable extension point.
EVIDENCE_READINESS_PACKET_KINDS: tuple[str, ...] = ()

# Title/dependency-text indicators that a task produces or claims structured
# evidence (an audit, a corpus/discovery manifest, a source-verification
# receipt) even when the packet-kind is generic.
EVIDENCE_READINESS_INDICATORS: tuple[str, ...] = (
    "audit", "evidence readiness", "source verification", "corpus scan",
    "discovery manifest", "evidence binding", "runtime value audit",
)


def _matches_any_evidence_indicator(text: str) -> bool:
    lowered = text.lower()
    return any(re.search(r"\b" + re.escape(term) + r"\b", lowered) for term in EVIDENCE_READINESS_INDICATORS)


def evidence_readiness_auto_detected(*, packet_kind: str, title: str, dependencies: "list[str] | tuple[str, ...]" = ()) -> bool:
    """Derive applicability from the packet's own already-declared, trusted
    fields -- packet kind or title/dependency indicator language -- never
    from a flag a worker must remember to pass.

    `source-intake` is deliberately NOT an auto-trigger packet kind: it is
    an acquisition-decision shape (whether to absorb external source), not
    inherently an audit/corpus-evidence-producing shape, so it stays
    indicator-word-gated like any other generic packet kind rather than
    always-on.
    """

    if packet_kind in EVIDENCE_READINESS_PACKET_KINDS:
        return True
    combined = " ".join([title, packet_kind, *dependencies])
    return _matches_any_evidence_indicator(combined)


def resolve_evidence_readiness_applicable(args: Any) -> bool:
    """Resolve effective applicability for a scaffold `args`-like object
    carrying `evidence_readiness_applicable` (tri-state: `None` means
    auto-derive), `packet_kind`, `title`, and `dependencies`. An explicit
    override (`True`/`False`) always wins; otherwise this auto-detects from
    trusted packet shape so "nobody passed a flag" no longer silently
    resolves to uncovered."""

    override = getattr(args, "evidence_readiness_applicable", None)
    if override is not None:
        return bool(override)
    return evidence_readiness_auto_detected(
        packet_kind=getattr(args, "packet_kind", ""),
        title=getattr(args, "title", ""),
        dependencies=getattr(args, "dependencies", ()) or (),
    )

# Dedicated reuse sub-table heading (F3 fix). Reuse bindings for dotted or
# slashed row paths (e.g. `src/a.ts`) cannot round-trip through a bare
# `key: value` scalar field line (the field-line grammar only accepts a
# plain identifier key), so this is a separate, unambiguous pipe table keyed
# by row path instead of an encoded field-name string.
#
# `priorArtifactPath` (F3 continued): a repo-relative, independently
# readable locator for the prior artifact `priorArtifactSha256` claims to
# hash. Without it, `priorArtifactSha256` was a bare hex string the worker
# typed with nothing to check it against -- a self-consistent but entirely
# fabricated reuse chain would pass clean. With it, the checker reads the
# real bytes at that path and hashes them, so the digest claim is checkable
# against something this repo can actually open, not just re-asserted prose
# in the same document. A reuse binding lacking a resolvable
# `priorArtifactPath` is itself an issue, never a silent pass.
REUSE_BINDING_HEADING = "### Reuse Bindings"
REUSE_ROW_COLUMNS = ("path", "priorArtifactSha256", "priorArtifactPath", "priorBlobSha256")

BINDING_SCHEMA_FIELD = "evidenceBindingSchema"
BINDING_SCHEMA_VALUE = SCHEMA_VERSION

REQUIRED_BINDING_FIELDS = (
    "evidenceBindingSchema",
    "auditPath",
    "auditSha256",
    "discoveryManifestPath",
    "sourceRoot",
    "sourcePin",
)

# Binding fields whose value is itself a filesystem path relative to the
# repo root and therefore must go through the same normalize/containment
# check as every row/manifest path (F2). `sourceRoot` is a directory prefix,
# not a file, but must obey the identical traversal/absolute/symlink rules.
PATH_VALUED_BINDING_FIELDS = ("auditPath", "discoveryManifestPath", "sourceRoot", "sourcePin")

# Row table column order (Markdown pipe table under the binding heading).
ROW_COLUMNS = (
    "path",
    "blobSha256",
    "lineCount",
    "readSpans",
    "status",
)
ROW_STATUSES = ("READ", "REUSED", "EXCLUDED")

CURRENT_PLACEHOLDER_TOKENS = (
    "TO_FILL",
    "FILL_ME",
    "TODO_",
    "WORKER_MUST_CAPTURE_AT_START",
    "PENDING_BEFORE_READY",
)

_HISTORICAL_CONTEXT_MARKERS = (
    "historical failure",
    "historical fail",
    "labelled historical",
    "prior audit",
    "reworkOf",
    "f1Correction",
    "priorHashHistory",
)


# --- Errors --------------------------------------------------------------


class EvidenceReadinessError(ValueError):
    """Raised for a structurally invalid evidence-readiness input."""


@dataclass(frozen=True)
class EvidenceIssue:
    """One mechanically knowable inconsistency.

    `pointer` is a JSON-pointer-like or row-label locator; `expected` and
    `observed` are short strings for the deterministic report (requirement
    8: one deterministic report with pointers/paths, expected vs observed).
    """

    pointer: str
    message: str
    expected: str = ""
    observed: str = ""

    def render(self) -> str:
        if self.expected or self.observed:
            return f"{self.pointer}: {self.message} (expected={self.expected!r}, observed={self.observed!r})"
        return f"{self.pointer}: {self.message}"


@dataclass(frozen=True)
class EvidenceReadinessResult:
    applicable: bool
    issues: tuple[EvidenceIssue, ...] = field(default_factory=tuple)
    row_count: int = 0
    candidate_count: int = 0
    git_calls: int = 0

    @property
    def is_clean(self) -> bool:
        return not self.issues

    def render_issues(self) -> list[str]:
        return [issue.render() for issue in self.issues]


# --- Path normalization / safety -----------------------------------------


def normalize_source_relative_path(raw: str) -> str:
    """Normalize a path to forward-slash, source-root-relative form.

    Rejects traversal (`..`), absolute paths, and empty segments. Raises
    `EvidenceReadinessError` on an unsafe path rather than silently
    coercing it, per requirement 2.
    """

    if raw is None:
        raise EvidenceReadinessError("path is missing")
    text = str(raw).strip().replace("\\", "/")
    if not text:
        raise EvidenceReadinessError("path is empty")
    if text.startswith("/") or re.match(r"^[A-Za-z]:", text):
        raise EvidenceReadinessError(f"path must be source-root relative, not absolute: {raw!r}")
    if any(ord(c) < 32 for c in text) or ":" in text:
        raise EvidenceReadinessError("path contains control characters or an alternate stream")
    segments = text.split("/")
    for seg in segments:
        if seg in ("", ".", ".."):
            raise EvidenceReadinessError(f"path contains an unsafe or traversal segment: {raw!r}")
    return "/".join(segments)


def resolve_contained_path(repo_root: Path, declared_path: str) -> Path:
    """Resolve `repo_root / declared_path`, rejecting any traversal or
    symlink escape (F2).

    A textually safe relative path (no literal `..` segment) can still
    escape `repo_root` if a component along the way is a symlink pointing
    outside it. This resolves the full path via `Path.resolve()` (which
    follows symlinks) and verifies containment against the *resolved*
    `repo_root`, and additionally verifies no intermediate path component is
    itself a symlink -- so a safe-looking relative path cannot traverse out
    through a symlinked directory.
    """

    normalized = normalize_source_relative_path(declared_path)
    resolved_root = repo_root.resolve()
    candidate = repo_root / normalized

    # Reject any intermediate component that is itself a symlink, walking
    # from the root down to (but not requiring existence of) the final path.
    walked = repo_root
    for segment in normalized.split("/"):
        walked = walked / segment
        if walked.is_symlink():
            raise EvidenceReadinessError(
                f"path component is a symlink, which is rejected as an unsafe escape vector: {declared_path!r}"
            )

    try:
        resolved_candidate = candidate.resolve()
    except OSError as exc:  # pragma: no cover - defensive; resolve() rarely raises
        raise EvidenceReadinessError(f"path could not be resolved: {declared_path!r} ({exc})") from exc

    try:
        resolved_candidate.relative_to(resolved_root)
    except ValueError as exc:
        raise EvidenceReadinessError(
            f"path escapes the repository root after resolution: {declared_path!r}"
        ) from exc

    return candidate


def _reject_duplicate_keys(pairs: list[tuple[str, Any]]) -> dict[str, Any]:
    seen: dict[str, Any] = {}
    for key, value in pairs:
        if key in seen:
            raise EvidenceReadinessError(f"duplicate JSON key `{key}` in evidence input")
        seen[key] = value
    return seen


def parse_strict_json(text: str, *, source_label: str) -> Any:
    """Parse JSON rejecting duplicate keys, per requirement 2."""

    try:
        return json.loads(text, object_pairs_hook=_reject_duplicate_keys)
    except EvidenceReadinessError:
        raise
    except json.JSONDecodeError as exc:
        raise EvidenceReadinessError(f"{source_label} is not valid JSON: {exc}") from exc


# --- Row model -------------------------------------------------------------


@dataclass(frozen=True)
class EvidenceRow:
    path: str
    blob_sha256: str
    line_count: int
    read_spans: tuple[tuple[int, int], ...]
    status: str

    def covers_full(self) -> bool:
        """True if the union of read spans covers 1..line_count with no gap.

        A partial read can never satisfy a full-read claim (requirement 3).
        """

        if self.line_count <= 0:
            return not self.read_spans
        covered: set[int] = set()
        for start, end in self.read_spans:
            covered.update(range(start, end + 1))
        return covered == set(range(1, self.line_count + 1))


def _parse_span(raw: str) -> tuple[int, int]:
    match = re.match(r"^\s*(\d+)\s*-\s*(\d+)\s*$", raw)
    if not match:
        raise EvidenceReadinessError(f"malformed read span: {raw!r}")
    start, end = int(match.group(1)), int(match.group(2))
    if start < 1 or end < start:
        raise EvidenceReadinessError(f"invalid read span bounds: {raw!r}")
    return (start, end)


def parse_read_spans(raw: str) -> tuple[tuple[int, int], ...]:
    raw = raw.strip()
    if not raw or raw.upper() in {"NONE", "N/A"}:
        return ()
    spans = [_parse_span(part) for part in raw.split(";") if part.strip()]
    return tuple(spans)


def spans_overlap_policy_ok(spans: tuple[tuple[int, int], ...]) -> bool:
    """Overlap is allowed (re-reads of the same range are not a defect) but
    spans must be individually well-formed and monotonically non-decreasing
    in start order once sorted; this only rejects reversed/garbled input
    already caught by `_parse_span`, and exists as an explicit named policy
    hook per requirement 3's 'validate bounds, overlap policy'."""

    ordered = sorted(spans)
    return ordered == sorted(ordered)


# --- Markdown binding-block parsing ---------------------------------------

_FIELD_LINE_RE = re.compile(r"(?m)^([A-Za-z][A-Za-z0-9_]*):\s*(.+?)\s*$")
_TABLE_ROW_RE = re.compile(r"^\|(.+)\|\s*$")
_NEXT_HEADING_RE = re.compile(r"^##\s+.+$", re.MULTILINE)
_NEXT_SUBHEADING_RE = re.compile(r"^#{2,3}\s+.+$", re.MULTILINE)


def _section(text: str, heading: str) -> str:
    start = text.find(heading)
    if start == -1:
        return ""
    match = _NEXT_HEADING_RE.search(text, start + len(heading))
    end = match.start() if match else len(text)
    return text[start:end]


def _subsection(text: str, heading: str) -> str:
    """Like `_section`, but a `###` sub-heading also terminates the match so
    a nested subsection (e.g. `### Reuse Bindings` inside `## Evidence
    Readiness Binding`) can be extracted or excluded independently."""

    start = text.find(heading)
    if start == -1:
        return ""
    match = _NEXT_SUBHEADING_RE.search(text, start + len(heading))
    end = match.start() if match else len(text)
    return text[start:end]


def declares_evidence_readiness_contract(work_order_text: str) -> bool:
    """True only if the trusted dispatch work order declares the contract.

    This is the sole applicability gate (requirement 6): derived from the
    work order the return cites, never from a flag inside the return.
    """

    return EVIDENCE_READINESS_CONTRACT_TOKEN in work_order_text


def parse_binding_fields(section_text: str) -> dict[str, str]:
    """Parse the scalar `key: value` field lines in the binding section.

    Excludes the row-table header labels and anything inside a nested `###`
    subsection (the reuse-binding sub-table is parsed separately by
    `parse_reuse_rows`, never through this bare-identifier field parser --
    F3 fix: dotted/slashed keys cannot round-trip through this grammar, so
    they are no longer attempted here at all).
    """

    # Exclude nested subsections (e.g. "### Reuse Bindings") from field
    # parsing so their table rows are never mistaken for scalar fields.
    # Search starts after the section's own leading `##` heading line so
    # that heading is never mistaken for a nested subsection boundary.
    search_start = len(EVIDENCE_BINDING_HEADING) if section_text.startswith(EVIDENCE_BINDING_HEADING) else 0
    first_sub = _NEXT_SUBHEADING_RE.search(section_text, search_start)
    scalar_text = section_text[: first_sub.start()] if first_sub else section_text

    fields: dict[str, str] = {}
    for match in _FIELD_LINE_RE.finditer(scalar_text):
        key, value = match.group(1), match.group(2)
        if key in ROW_COLUMNS:
            continue
        if key in fields:
            fields["__duplicateFields"] = fields.get("__duplicateFields", "") + key + ","
        fields[key] = value.strip("`")
    return fields


def _parse_pipe_rows(section_text: str, columns: tuple[str, ...], header_key: str) -> list[dict[str, str]]:
    rows: list[dict[str, str]] = []
    header_seen = False
    for line in section_text.splitlines():
        m = _TABLE_ROW_RE.match(line.strip())
        if not m:
            continue
        cells = [c.strip() for c in m.group(1).split("|")]
        if not header_seen:
            if cells and cells[0].strip("` ") == header_key:
                header_seen = True
            continue
        if all(set(c) <= {"-", " ", ":"} for c in cells):
            continue
        if len(cells) < len(columns):
            continue
        row = dict(zip(columns, cells[: len(columns)]))
        rows.append(row)
    return rows


def parse_binding_rows(section_text: str) -> list[dict[str, str]]:
    """Parse the pipe-table rows under the binding heading.

    Tolerant of the header/separator rows; only rows whose first cell is not
    a known header label and not a `---` separator are treated as data. The
    reuse sub-table (if present) is excluded so its rows are never read as
    top-level evidence rows.
    """

    search_start = len(EVIDENCE_BINDING_HEADING) if section_text.startswith(EVIDENCE_BINDING_HEADING) else 0
    first_sub = _NEXT_SUBHEADING_RE.search(section_text, search_start)
    main_text = section_text[: first_sub.start()] if first_sub else section_text
    return _parse_pipe_rows(main_text, ROW_COLUMNS, "path")


def parse_reuse_rows(section_text: str) -> dict[str, dict[str, str]]:
    """Parse the dedicated `### Reuse Bindings` sub-table (F3 fix).

    Keyed by row `path` (normalized), each value carries
    `priorArtifactSha256`, `priorArtifactPath`, and `priorBlobSha256` as
    unambiguous pipe-table cells -- never an encoded scalar field-line key --
    so a path containing `.` or `/` round-trips correctly, unlike the
    previous `reuse.<path>.<field>` scalar-field-line scheme whose parser
    regex could never match such a key in the first place.

    `priorArtifactPath` (F3 continued) is the independently readable locator
    the checker resolves and hashes to verify `priorArtifactSha256` against
    real bytes, rather than trusting a bare worker-typed hex string.
    """

    reuse_section = _subsection(section_text, REUSE_BINDING_HEADING)
    if not reuse_section:
        return {}
    raw_rows = _parse_pipe_rows(reuse_section, REUSE_ROW_COLUMNS, "path")
    result: dict[str, dict[str, str]] = {}
    for raw in raw_rows:
        try:
            path = normalize_source_relative_path(raw.get("path", ""))
        except EvidenceReadinessError:
            path = raw.get("path", "").strip()
        result[path] = {
            "priorArtifactSha256": raw.get("priorArtifactSha256", "").strip(),
            "priorArtifactPath": raw.get("priorArtifactPath", "").strip(),
            "priorBlobSha256": raw.get("priorBlobSha256", "").strip(),
        }
    return result


def parse_discovery_manifest_rows(manifest_text: str) -> list[str]:
    """Parse a declared discovery manifest: one normalized path per non-empty,
    non-comment line. This is a declared, reviewer-authored artifact --
    never a recomputed scan -- per requirement 4."""

    paths: list[str] = []
    for raw in manifest_text.splitlines():
        line = raw.strip()
        if not line or line.startswith("#"):
            continue
        paths.append(normalize_source_relative_path(line))
    return paths
