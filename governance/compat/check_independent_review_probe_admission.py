#!/usr/bin/env python3
"""
CVF Independent Review Probe Admission Checker (REVIEW-INDEPENDENT-PROBE-
ADMISSION-ROOT-T1).

Integrated root-contract checker for the Independent Review Probe Admission
Boundary (docs/reference/review_cost_control/CVF_REVIEW_COST_AND_DIMINISHING_
RETURN_CONTROL_STANDARD.md). One shared typed declaration-scanning API
(`DeclarationScanner`) serves dispatch-time, link-resolution, and closure-
time parsing identically, so masking/cardinality semantics cannot drift
between call sites.

Dispatch-time: every changed `docs/work_orders/*.md` declaring `docType:
work_order` (outside `/archive/`) is applicable. Exactly one
`independentProbeRequired` occurrence is required; a narrow high-risk marker
set makes `NOT_APPLICABLE_WITH_REASON` illegal and requires `YES`, which then
requires a complete `Independent Review Probe Admission Contract` block
naming the exact controlled non-worker role token.

Closure-time: a changed `docs/reviews/*.md` (or linked work order) is
applicable when it declares `independentProbeDisposition`, or links to a work
order declaring `independentProbeRequired: YES`. Only `PASS_INDEPENDENT_
PROBE` may accompany a terminal Status (from one authoritative metadata-
preamble declaration); a terminal PASS binds a controlled role token, two
distinct canonically normalized actor IDs, distinct invocation IDs, and
distinct oracle digests/evidence references whose declared SHA-256 is
recomputed against the actual bytes at each referenced path.

This checker validates declared evidence shape, field uniqueness, path/byte
integrity, and role/oracle separation only; it never scores whether a
trigger classification or semantic-sufficiency judgment is correct, and does
not use a provider/model name as normative role classification.
"""

from __future__ import annotations

import argparse
import hashlib
import re
import subprocess
import sys
from dataclasses import dataclass, field
from pathlib import Path, PurePosixPath

REPO_ROOT = Path(__file__).resolve().parents[2]
THIS_CHECKER_PATH = "governance/compat/check_independent_review_probe_admission.py"

WORK_ORDER_PREFIX = "docs/work_orders/"
REVIEW_PREFIX = "docs/reviews/"

# ---------------------------------------------------------------------------
# Declaration scanning primitives (shared by every phase below)
# ---------------------------------------------------------------------------

# RIPA-ROOT-01: fence delimiter is 3+ backticks OR 3+ tildes; closer must use
# the SAME character with run length >= the opener's (CommonMark rule).
_FENCE_OPEN_RE = re.compile(r"(?m)^[ \t]{0,3}(`{3,}|~{3,})[^\n]*$")
# CommonMark type-2 HTML blocks continue through the first ``-->`` or EOF.
# Masking only closed comments lets declaration-shaped lines inside an
# unterminated comment become authoritative.
_HTML_COMMENT_RE = re.compile(r"<!--.*?(?:-->|\Z)", re.S)
_BLOCKQUOTE_LINE_RE = re.compile(r"(?m)^[ \t]*>.*$")
_TABLE_ROW_RE = re.compile(r"(?m)^[ \t]*\|.*\|[ \t]*$")
# RIPA-ROOT-R1-04: an inline code span (N backticks, closed by the next run
# of exactly N) may span multiple lines; a single-line-only pattern missed a
# multi-line span whose interior looked like an unrelated declaration.
_INLINE_CODE_SPAN_OPEN_RE = re.compile(r"`+")
# A legitimate backtick-wrapped field VALUE is single-line and sits directly
# after a bare `fieldName:` prefix with nothing else preceding it on that
# line; only that shape survives masking. Everything else -- including every
# multi-line span -- is masked as non-declarative content.
_LEGITIMATE_VALUE_PREFIX_RE = re.compile(
    r"(?:^|\n)[ \t]*(?:[-*][ \t]+)?[A-Za-z][A-Za-z0-9_ .-]*:[ \t]*$"
)
_SECTION_HEADING_RE = re.compile(r"(?m)^##[ \t]+\S")

FIELD_VALUE_RE_TEMPLATE = r"(?m)^[ \t]*(?:[-*][ \t]+)?{field}:[ \t]*(.*)$"


def _blank_span(match: "re.Match[str]") -> str:
    """Replace a matched span with same-length whitespace, preserving offsets
    for position-sensitive logic (the metadata-preamble scan)."""
    return re.sub(r"[^\n]", " ", match.group(0))


def _mask_fenced_blocks(text: str) -> str:
    """Blank every matching-delimiter fenced block; an unterminated fence is
    masked to end of document."""
    out: list[str] = []
    pos = 0
    for m in _FENCE_OPEN_RE.finditer(text):
        if m.start() < pos:
            continue
        delimiter_run = m.group(1)
        delim_char = delimiter_run[0]
        min_len = len(delimiter_run)
        close_re = re.compile(
            rf"(?m)^[ \t]{{0,3}}{re.escape(delim_char)}{{{min_len},}}[ \t]*$"
        )
        close_match = close_re.search(text, m.end())
        end = close_match.end() if close_match else len(text)
        out.append(text[pos : m.start()])
        out.append(_blank_span_text(text[m.start() : end]))
        pos = end
    out.append(text[pos:])
    return "".join(out)


def _blank_span_text(span: str) -> str:
    return re.sub(r"[^\n]", " ", span)


def _mask_inline_code_spans(text: str) -> str:
    """Mask every inline code span except a single-line span sitting right
    after a bare `fieldName:` prefix -- the one legitimate backtick-wrapped
    value shape. Every multi-line span is always masked."""
    out: list[str] = []
    pos = 0
    length = len(text)
    while pos < length:
        open_match = _INLINE_CODE_SPAN_OPEN_RE.search(text, pos)
        if not open_match:
            out.append(text[pos:])
            break
        run_len = len(open_match.group(0))
        close_re = re.compile(rf"(?<!`)`{{{run_len}}}(?!`)")
        close_match = close_re.search(text, open_match.end())
        if not close_match:
            out.append(text[pos:])
            break
        span_start, span_end = open_match.start(), close_match.end()
        span_text = text[span_start:span_end]
        preceding = text[:span_start]
        is_legitimate_value = (
            "\n" not in span_text
            and _LEGITIMATE_VALUE_PREFIX_RE.search(preceding) is not None
        )
        out.append(text[pos:span_start])
        if is_legitimate_value:
            out.append(span_text)
        else:
            out.append(_blank_span_text(span_text))
        pos = span_end
    return "".join(out)


def mask_non_declarative(text: str) -> str:
    """The single shared masking pass: fenced blocks, HTML comments,
    blockquote lines, table rows, and every inline code span except a
    legitimate single-line backtick-wrapped field value."""
    masked = _mask_fenced_blocks(text)
    masked = _HTML_COMMENT_RE.sub(_blank_span, masked)
    masked = _mask_inline_code_spans(masked)
    masked = _TABLE_ROW_RE.sub(_blank_span, masked)
    masked = _BLOCKQUOTE_LINE_RE.sub(_blank_span, masked)
    return masked


@dataclass(frozen=True)
class ScalarResult:
    """`ok` is False whenever the occurrence count does not satisfy
    `cardinality`, including an empty duplicate, counted before value
    interpretation."""

    field_name: str
    occurrences: tuple[str, ...]
    cardinality: str  # "EXACTLY_ONE" | "ZERO_OR_ONE"
    ok: bool
    value: str | None
    error: str | None


class DeclarationScanner:
    """One shared declaration-reading API used by every phase so masking and
    cardinality semantics can never drift between call sites."""

    def __init__(self, raw_text: str) -> None:
        self.raw_text = raw_text
        self.masked_text = mask_non_declarative(raw_text)

    def occurrences(self, field_name: str, *, within: str | None = None) -> tuple[str, ...]:
        """Every declared value for `field_name`, in order, including empty
        values, read from `within` or the full masked document."""
        haystack = self.masked_text if within is None else within
        pattern = re.compile(FIELD_VALUE_RE_TEMPLATE.format(field=re.escape(field_name)))
        values: list[str] = []
        for match in pattern.finditer(haystack):
            value = match.group(1).strip().rstrip("|").strip(" `")
            values.append(value)
        return tuple(values)

    def scalar(
        self,
        field_name: str,
        *,
        cardinality: str = "EXACTLY_ONE",
        within: str | None = None,
    ) -> ScalarResult:
        occ = self.occurrences(field_name, within=within)
        non_empty = tuple(v for v in occ if v)
        if cardinality == "EXACTLY_ONE":
            ok = len(occ) == 1 and len(non_empty) == 1
            if not ok:
                reason = (
                    f"`{field_name}` must occur exactly once with a non-empty "
                    f"value; found {len(occ)} declaration(s)"
                )
                return ScalarResult(field_name, occ, cardinality, False, None, reason)
            return ScalarResult(field_name, occ, cardinality, True, non_empty[0], None)
        if cardinality == "ZERO_OR_ONE":
            if len(occ) > 1:
                reason = (
                    f"`{field_name}` must occur at most once; found "
                    f"{len(occ)} declarations"
                )
                return ScalarResult(field_name, occ, cardinality, False, None, reason)
            if len(occ) == 1 and not occ[0]:
                reason = f"`{field_name}` declaration must not be empty"
                return ScalarResult(field_name, occ, cardinality, False, None, reason)
            value = occ[0] if occ else None
            return ScalarResult(field_name, occ, cardinality, True, value, None)
        raise ValueError(f"unknown cardinality: {cardinality}")

    def bounded_section(self, heading_re: "re.Pattern[str]") -> tuple[str | None, str]:
        """Return `(section_text, error)` for exactly one heading match,
        bounded to the text between that heading and the next level-two
        heading or end of document. Zero matches returns `(None, "")`
        (caller decides applicability); more than one returns an error."""
        headings = list(heading_re.finditer(self.masked_text))
        if not headings:
            return None, ""
        if len(headings) > 1:
            return None, f"heading matching `{heading_re.pattern}` must occur exactly once; found {len(headings)} occurrences"
        start = headings[0].end()
        next_heading = _SECTION_HEADING_RE.search(self.masked_text, pos=start)
        end = next_heading.start() if next_heading else len(self.masked_text)
        return self.masked_text[start:end], ""

    def preamble(self) -> str:
        """Text before the first level-two heading, from the masked view."""
        m = _SECTION_HEADING_RE.search(self.masked_text)
        return self.masked_text[: m.start()] if m else self.masked_text


# ---------------------------------------------------------------------------
# Canonical repo-relative path and evidence-binding validators
# ---------------------------------------------------------------------------

_URI_SCHEME_RE = re.compile(r"^[A-Za-z][A-Za-z0-9+.\-]*://")
_DRIVE_RE = re.compile(r"^[A-Za-z]:")
_CANONICAL_SHA256_RE = re.compile(r"^[0-9a-f]{64}$")


@dataclass(frozen=True)
class PathResult:
    ok: bool
    normalized: str | None
    error: str | None


def validate_repo_relative_path(raw: str) -> PathResult:
    """Accept only a clean forward-slash repo-relative path; reject URI
    schemes, absolute/UNC/drive paths, backslashes, empty/`.`/`..` segments,
    repeated separators, and any path resolving outside the repository."""
    if not raw:
        return PathResult(False, None, "path must not be empty")
    if _URI_SCHEME_RE.match(raw):
        return PathResult(False, None, f"path must not use a URI scheme, found `{raw}`")
    if raw.startswith("//") or raw.startswith("\\\\"):
        return PathResult(False, None, f"path must not be a UNC path, found `{raw}`")
    if "\\" in raw:
        return PathResult(False, None, f"path must use forward slashes only, found `{raw}`")
    if _DRIVE_RE.match(raw):
        return PathResult(False, None, f"path must not be an absolute drive path, found `{raw}`")
    if raw.startswith("/"):
        return PathResult(False, None, f"path must be repo-relative, found absolute `{raw}`")
    if "//" in raw:
        return PathResult(False, None, f"path must not contain repeated separators, found `{raw}`")
    segments = raw.split("/")
    if any(seg == "" or seg == "." for seg in segments):
        return PathResult(False, None, f"path must not contain empty or `.` segments, found `{raw}`")
    if any(seg == ".." for seg in segments):
        return PathResult(False, None, f"path must not contain `..` traversal, found `{raw}`")
    candidate = PurePosixPath(raw)
    resolved = (REPO_ROOT / candidate).resolve()
    try:
        resolved.relative_to(REPO_ROOT.resolve())
    except ValueError:
        return PathResult(False, None, f"path resolves outside the repository, found `{raw}`")
    return PathResult(True, raw, None)


@dataclass(frozen=True)
class EvidenceResult:
    ok: bool
    error: str | None


def bind_evidence(ref: str, declared_digest: str, *, self_path: str) -> EvidenceResult:
    """Validate `ref` as a canonical repo-relative path to an existing
    regular file, recompute its SHA-256, and require equality with
    `declared_digest`. `self_path` is the closure document's own path; it
    may never cite itself as its own evidence file."""
    path_result = validate_repo_relative_path(ref)
    if not path_result.ok:
        return EvidenceResult(False, path_result.error)
    normalized = path_result.normalized or ref
    if normalized == self_path:
        return EvidenceResult(False, f"evidence reference must not cite this document itself, found `{ref}`")
    if not _CANONICAL_SHA256_RE.match(declared_digest):
        return EvidenceResult(False, f"declared digest must be a canonical lowercase 64-hex SHA-256, found `{declared_digest}`")
    full = REPO_ROOT / normalized
    if not full.exists() or not full.is_file():
        return EvidenceResult(False, f"evidence reference does not exist as a regular file, found `{ref}`")
    actual = hashlib.sha256(full.read_bytes()).hexdigest()
    if actual != declared_digest:
        return EvidenceResult(False, f"declared digest `{declared_digest}` does not match recomputed digest `{actual}` for `{ref}`")
    return EvidenceResult(True, None)


# ---------------------------------------------------------------------------
# Contract vocabulary
# ---------------------------------------------------------------------------

WORK_ORDER_RE = re.compile(r"(?mi)^docType:\s*work_order\s*$")
DISPATCH_BLOCK_HEADING_RE = re.compile(
    r"(?mi)^##\s*Independent Review Probe Admission Contract\s*$"
)

PROBE_REQUIRED_FIELD = "independentProbeRequired"
PROBE_REQUIRED_YES = "YES"
PROBE_REQUIRED_NA_PREFIX = "NOT_APPLICABLE_WITH_REASON"

REASON_PREFIX_GRAMMAR_RE_TEMPLATE = r"^{prefix}(?:[:\-].*)?$"

# RIPA-ROOT-03/04: exactly one link declaration is resolved across the two
# supported field names -- not "at most one distinct value" as the prior
# round allowed, which admitted two identical `Responds to work order` lines.
LINK_FIELD_NAMES = ("dispatchWorkOrder", "Responds to work order")

DISPATCH_FIELDS = (
    "independentProbeRiskClass",
    "independentProbeDispositionAtDispatch",
    "probeExecutorRole",
    "implementationOracleSeparation",
    "positiveControl",
    "negativeMutationClasses",
    "expectedInformationGain",
    "rerunCostReason",
    "reviewerDecisionOwner",
)

CORE_GUARD_AUTH_HEADING_RE = re.compile(
    r"(?mi)^##\s*Core Guard Self-Protection Authorization\s*$"
)
PROVIDER_EXECUTION_GRANTED_RE = re.compile(
    r"(?mi)^providerExecutionAuthority:[ \t]*(?!FORBIDDEN\b)\S"
)
CANONICALIZATION_MARKER_RE = re.compile(r"(?i)canonicaliz")
PARTY_A_MARKER_RE = re.compile(r"(?i)\bparty a\b")


_HIGH_RISK_MARKER_CHECKS = (
    (CORE_GUARD_AUTH_HEADING_RE, "Core Guard Self-Protection Authorization heading present"),
    (PROVIDER_EXECUTION_GRANTED_RE, "providerExecutionAuthority is granted (not FORBIDDEN)"),
    (CANONICALIZATION_MARKER_RE, "canonicalization surface mentioned"),
    (PARTY_A_MARKER_RE, "Party A mentioned"),
)


def _high_risk_markers(masked_text: str) -> tuple[str, ...]:
    return tuple(label for pattern, label in _HIGH_RISK_MARKER_CHECKS if pattern.search(masked_text))


DISPOSITION_FIELD = "independentProbeDisposition"
DISPOSITION_PENDING = "PENDING_REVIEWER_EXECUTION"
DISPOSITION_PASS = "PASS_INDEPENDENT_PROBE"
DISPOSITION_FAIL = "FAIL_INDEPENDENT_PROBE"
DISPOSITION_BLOCKED_PREFIX = "BLOCKED_INDEPENDENT_PROBE_WITH_REASON"

PASS_REQUIRED_FIELDS = (
    "probeExecutorActor",
    "probeCommandOrMethod",
    "probeObservedResult",
    "oracleSeparationBasis",
)
# RIPA-ROOT-07/R1-02: role/actor separation is structural, not a keyword
# blacklist; a terminal PASS requires the controlled role token plus two
# distinct normalized actor IDs. Free-text actor prose is reviewer evidence
# only, never the machine identity oracle.
PASS_ROLE_FIELD = "probeExecutorRole"
PASS_ACTOR_FIELDS = ("implementationWorkerActor", "probeExecutorActor")
PASS_IDENTITY_FIELDS = ("workerInvocationId", "probeInvocationId")
PASS_ORACLE_DIGEST_FIELDS = ("workerOracleSha256", "probeOracleSha256")
PASS_EVIDENCE_REF_FIELDS = ("workerEvidenceRef", "probeEvidenceRef")

TERMINAL_STATUS_VALUE_RE = re.compile(r"^(CLOSED[A-Z_]*|ACCEPTED[A-Z_]*)\s*$")
NON_TERMINAL_STATUS_VALUE_RE = re.compile(
    r"^(COMPLETE_PENDING_REVIEW|BLOCKED_WITH_REASON)\s*$"
)

PROBE_EXECUTOR_ROLE_TOKEN = "LOCAL_REVIEWER_NOT_IMPLEMENTATION_WORKER"
REVIEWER_DECISION_OWNER_TOKEN = "LOCAL"


_CAMEL_BOUNDARY_RE = re.compile(r"(?<=[a-z0-9])(?=[A-Z])")


def _normalize_identity(value: str) -> str:
    """Canonicalize for equality comparison: insert a separator at
    camelCase boundaries, collapse whitespace/hyphens/underscores to one
    underscore, then uppercase, so any spelling/casing/punctuation variant
    of the same identity compares equal."""
    boundary_split = _CAMEL_BOUNDARY_RE.sub("_", value.strip())
    collapsed = re.sub(r"[\s\-_]+", "_", boundary_split)
    return collapsed.upper()


def _normalize_command_fingerprint(value: str) -> str:
    collapsed = re.sub(r"\s+", " ", value.strip().lower())
    collapsed = re.sub(r"[\\/]+", "/", collapsed)
    return collapsed


def _reason_grammar_match(value: str, prefix: str) -> "re.Match[str] | None":
    pattern = re.compile(REASON_PREFIX_GRAMMAR_RE_TEMPLATE.format(prefix=re.escape(prefix)))
    return pattern.match(value)


def _reason_after_prefix(value: str, prefix: str) -> str:
    match = _reason_grammar_match(value, prefix)
    if match is None:
        return ""
    rest = value[len(prefix):]
    return rest.lstrip(":-").strip()


def _is_exact_or_reasoned(value: str, prefix: str) -> bool:
    return _reason_grammar_match(value, prefix) is not None


@dataclass(frozen=True)
class Diagnostic:
    path: str
    applicable: bool
    issues: tuple[str, ...] = field(default_factory=tuple)

    @property
    def is_clean(self) -> bool:
        return self.applicable and not self.issues


def _configure_stdout() -> None:
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    if hasattr(sys.stderr, "reconfigure"):
        sys.stderr.reconfigure(encoding="utf-8", errors="replace")


def _normalize_path(path: str) -> str:
    return path.replace("\\", "/")


def _run_git(args: list[str]) -> tuple[int, str, str]:
    proc = subprocess.run(
        ["git", *args],
        cwd=REPO_ROOT,
        text=True,
        encoding="utf-8",
        errors="replace",
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
    )
    return proc.returncode, proc.stdout.strip(), proc.stderr.strip()


def _git_paths(*args: str) -> set[str]:
    code, out, _ = _run_git(list(args))
    return {_normalize_path(p) for p in out.splitlines() if p.strip()} if code == 0 and out else set()


def _diff_and_staged_md_paths(base: str, head: str) -> set[str]:
    paths: set[str] = set()
    if base and head:
        paths |= _git_paths("diff", "--name-only", f"{base}..{head}")
    paths |= _git_paths("diff", "--name-only")
    paths |= _git_paths("diff", "--name-only", "--cached")
    return paths


# RIPA-ROOT-09: `_changed_md_paths` scans the full working-tree surface so
# nothing is silently skipped from diagnosis; `_lane_md_paths` below is the
# narrower set eligible to fail the gate. An out-of-lane finding is still
# reported by `run()`, never hidden.
def _changed_md_paths(base: str, head: str) -> tuple[str, ...]:
    paths = _diff_and_staged_md_paths(base, head) | _git_paths("ls-files", "--others", "--exclude-standard")
    return tuple(sorted(p for p in paths if p.endswith(".md")))


# RIPA-ROOT-R1-01: Git trackedness alone cannot distinguish an artifact this
# dispatch is actively producing from one abandoned by an unrelated, already-
# parked tranche -- both are equally untracked. The caller names the current
# dispatch via `--active-work-order`; the checker reads that file's own
# `Worker return path:` declaration and adds it to the lane unconditionally.
WORKER_RETURN_PATH_RE = re.compile(r"(?m)^Worker return path:[ \t]*`?([^`\n]+?)`?[ \t]*$")


def _declared_worker_return_path(active_work_order: str | None) -> str | None:
    if not active_work_order:
        return None
    path_result = validate_repo_relative_path(active_work_order)
    if not path_result.ok or not path_result.normalized:
        return None
    normalized = path_result.normalized
    text = _read(normalized)
    if not text or not is_work_order_applicable(normalized, text):
        return None
    result = DeclarationScanner(text).scalar("Worker return path", cardinality="ZERO_OR_ONE")
    if not result.ok or not result.value:
        return None
    raw = result.value.strip().strip("`").strip()
    return_path_result = validate_repo_relative_path(raw)
    return return_path_result.normalized if return_path_result.ok else None


def _lane_md_paths(base: str, head: str, active_work_order: str | None = None) -> frozenset[str]:
    md_paths = frozenset(p for p in _diff_and_staged_md_paths(base, head) if p.endswith(".md"))
    declared = _declared_worker_return_path(active_work_order)
    return md_paths | ({declared} if declared else frozenset())


def _read(path: str) -> str:
    full = REPO_ROOT / path
    if not full.exists() or full.is_dir():
        return ""
    return full.read_text(encoding="utf-8", errors="replace")


def is_work_order_applicable(path: str, text: str) -> bool:
    normalized = _normalize_path(path)
    if not normalized.startswith(WORK_ORDER_PREFIX) or not normalized.endswith(".md"):
        return False
    if "/archive/" in normalized:
        return False
    if normalized == THIS_CHECKER_PATH:
        return False
    scanner = DeclarationScanner(text)
    return bool(WORK_ORDER_RE.search(scanner.masked_text))


@dataclass(frozen=True)
class LinkResolution:
    has_reference: bool
    requires_yes: bool | None
    error: str | None


def resolve_link(scanner: DeclarationScanner) -> LinkResolution:
    """Resolve exactly one logical link declaration across `LINK_FIELD_NAMES`.
    RIPA-ROOT-03: cardinality is checked per field name -- a true duplicate
    (the same field name twice) fails closed; declaring both field names
    once each with agreeing values (this repo's own template convention) is
    valid, but a disagreeing pair is ambiguous and fails closed."""
    per_field: dict[str, tuple[str, ...]] = {name: scanner.occurrences(name) for name in LINK_FIELD_NAMES}
    for name, occ in per_field.items():
        if len(occ) > 1:
            return LinkResolution(
                True, None, f"`{name}` must occur at most once; found {len(occ)} declarations"
            )
        if len(occ) == 1 and not occ[0]:
            return LinkResolution(True, None, f"`{name}` declaration must not be empty")

    declared = {name: occ[0] for name, occ in per_field.items() if occ}
    if not declared:
        return LinkResolution(False, None, None)
    distinct_values = {v.strip().strip("`").strip() for v in declared.values()}
    if len(distinct_values) > 1:
        return LinkResolution(
            True,
            None,
            f"declared link fields disagree: {declared}",
        )
    raw = next(iter(distinct_values))
    path_result = validate_repo_relative_path(raw)
    if not path_result.ok:
        return LinkResolution(True, None, f"work-order reference invalid: {path_result.error}")
    normalized = path_result.normalized or raw
    if not normalized.startswith(WORK_ORDER_PREFIX) or not normalized.endswith(".md"):
        return LinkResolution(
            True, None, f"work-order reference `{raw}` is not an exact repo-relative docs/work_orders/*.md path"
        )
    if "/archive/" in normalized:
        return LinkResolution(True, None, f"work-order reference `{raw}` points into an archived path")
    full = REPO_ROOT / normalized
    if not full.exists() or full.is_dir():
        return LinkResolution(True, None, f"work-order reference `{raw}` does not exist")
    referenced_text = full.read_text(encoding="utf-8", errors="replace")
    if not is_work_order_applicable(normalized, referenced_text):
        return LinkResolution(True, None, f"work-order reference `{raw}` is not an active docType: work_order")
    referenced_scanner = DeclarationScanner(referenced_text)
    # RIPA-ROOT-04: the referenced work order's own declaration must itself
    # satisfy exactly-one non-empty cardinality; an empty duplicate there
    # (even alongside a valid YES) fails closed rather than being masked by
    # a non-empty-only occurrence count.
    referenced_result = referenced_scanner.scalar(PROBE_REQUIRED_FIELD, cardinality="EXACTLY_ONE")
    if not referenced_result.ok:
        return LinkResolution(
            True,
            None,
            f"work-order reference `{raw}` does not declare exactly one "
            f"non-empty `{PROBE_REQUIRED_FIELD}`: {referenced_result.error}",
        )
    return LinkResolution(True, referenced_result.value == PROBE_REQUIRED_YES, None)


def is_review_applicable(path: str, text: str) -> bool:
    normalized = _normalize_path(path)
    if not (normalized.startswith(REVIEW_PREFIX) or normalized.startswith(WORK_ORDER_PREFIX)):
        return False
    if not normalized.endswith(".md"):
        return False
    if "/archive/" in normalized:
        return False
    scanner = DeclarationScanner(text)
    if scanner.scalar(DISPOSITION_FIELD, cardinality="ZERO_OR_ONE").value is not None:
        return True
    return resolve_link(scanner).has_reference


def diagnose_dispatch(path: str, text: str) -> Diagnostic:
    if not is_work_order_applicable(path, text):
        return Diagnostic(path=path, applicable=False)

    scanner = DeclarationScanner(text)
    issues: list[str] = []

    required_result = scanner.scalar(PROBE_REQUIRED_FIELD, cardinality="EXACTLY_ONE")
    if not required_result.ok:
        issues.append(
            f"active changed work order must declare `{PROBE_REQUIRED_FIELD}` "
            f"exactly once (`{PROBE_REQUIRED_YES}` or "
            f"`{PROBE_REQUIRED_NA_PREFIX}: <reason>`): {required_result.error}"
        )
        return Diagnostic(path=path, applicable=True, issues=tuple(issues))

    required = required_result.value or ""
    is_yes = required == PROBE_REQUIRED_YES
    is_na = _is_exact_or_reasoned(required, PROBE_REQUIRED_NA_PREFIX)

    if not is_yes and not is_na:
        issues.append(
            f"`{PROBE_REQUIRED_FIELD}` must be `{PROBE_REQUIRED_YES}` or "
            f"`{PROBE_REQUIRED_NA_PREFIX}: <reason>`, found `{required}`"
        )
        return Diagnostic(path=path, applicable=True, issues=tuple(issues))

    if is_na and not _reason_after_prefix(required, PROBE_REQUIRED_NA_PREFIX):
        issues.append(f"`{PROBE_REQUIRED_FIELD}: {PROBE_REQUIRED_NA_PREFIX}` requires a non-empty reason")

    markers = _high_risk_markers(scanner.masked_text)
    if is_na and markers:
        issues.append(
            f"`{PROBE_REQUIRED_FIELD}: {PROBE_REQUIRED_NA_PREFIX}` is not "
            f"admissible: high-risk marker(s) present ({'; '.join(markers)}); "
            f"must declare `{PROBE_REQUIRED_YES}`"
        )

    if not is_yes:
        return Diagnostic(path=path, applicable=True, issues=tuple(issues))

    section_text, section_error = scanner.bounded_section(DISPATCH_BLOCK_HEADING_RE)
    if section_error:
        issues.append(section_error)
        return Diagnostic(path=path, applicable=True, issues=tuple(issues))
    if section_text is None:
        issues.append(
            "missing `## Independent Review Probe Admission Contract` block "
            f"required when `{PROBE_REQUIRED_FIELD}: {PROBE_REQUIRED_YES}`"
        )
        return Diagnostic(path=path, applicable=True, issues=tuple(issues))

    section_scanner = DeclarationScanner(section_text)
    field_values: dict[str, str] = {}
    for field_name in DISPATCH_FIELDS:
        result = section_scanner.scalar(field_name, cardinality="EXACTLY_ONE", within=section_text)
        if not result.ok:
            issues.append(f"dispatch plan field `{field_name}`: {result.error}")
            continue
        field_values[field_name] = result.value or ""

    role = field_values.get("probeExecutorRole", "")
    if role and _normalize_identity(role) != _normalize_identity(PROBE_EXECUTOR_ROLE_TOKEN):
        issues.append(
            "`probeExecutorRole` must name a non-worker role using the exact "
            f"controlled token `{PROBE_EXECUTOR_ROLE_TOKEN}`, found `{role}`"
        )

    owner = field_values.get("reviewerDecisionOwner", "")
    if owner and _normalize_identity(owner) != _normalize_identity(REVIEWER_DECISION_OWNER_TOKEN):
        issues.append(
            "`reviewerDecisionOwner` must be the exact controlled token "
            f"`{REVIEWER_DECISION_OWNER_TOKEN}`, found `{owner}`"
        )

    return Diagnostic(path=path, applicable=True, issues=tuple(issues))


def _authoritative_status(scanner: DeclarationScanner) -> str | None:
    """Exactly one preamble `Status:` declaration, read from the masked
    (fence/table/blockquote/comment-stripped) preamble text before the first
    `## ` heading. Zero or more than one occurrence -- even identical values
    -- resolves to None."""
    preamble = scanner.preamble()
    result = scanner.scalar("Status", cardinality="EXACTLY_ONE", within=preamble)
    return result.value if result.ok else None


def diagnose_closure(path: str, text: str) -> Diagnostic:
    if not is_review_applicable(path, text):
        return Diagnostic(path=path, applicable=False)

    scanner = DeclarationScanner(text)
    issues: list[str] = []
    self_path = _normalize_path(path)

    link = resolve_link(scanner)
    if link.has_reference and link.error:
        issues.append(f"work-order reference cannot be resolved: {link.error}")

    disposition_result = scanner.scalar(DISPOSITION_FIELD, cardinality="ZERO_OR_ONE")
    if not disposition_result.ok:
        issues.append(f"`{DISPOSITION_FIELD}`: {disposition_result.error}")
        disposition = ""
    else:
        disposition = disposition_result.value or ""

    if not disposition:
        if link.has_reference and link.requires_yes:
            issues.append(
                f"artifact is linked to a work order declaring "
                f"`{PROBE_REQUIRED_FIELD}: {PROBE_REQUIRED_YES}` but omits "
                f"required field `{DISPOSITION_FIELD}`"
            )
        return Diagnostic(path=path, applicable=True, issues=tuple(issues))

    valid_tokens = (
        disposition == DISPOSITION_PASS
        or disposition == DISPOSITION_FAIL
        or _is_exact_or_reasoned(disposition, DISPOSITION_BLOCKED_PREFIX)
        or disposition == DISPOSITION_PENDING
    )
    if not valid_tokens:
        issues.append(
            f"`{DISPOSITION_FIELD}` must be one of `{DISPOSITION_PENDING}`, "
            f"`{DISPOSITION_PASS}`, `{DISPOSITION_FAIL}`, or "
            f"`{DISPOSITION_BLOCKED_PREFIX}: <reason>`, found `{disposition}`"
        )
        return Diagnostic(path=path, applicable=True, issues=tuple(issues))

    if _is_exact_or_reasoned(disposition, DISPOSITION_BLOCKED_PREFIX) and not _reason_after_prefix(
        disposition, DISPOSITION_BLOCKED_PREFIX
    ):
        issues.append(f"`{DISPOSITION_BLOCKED_PREFIX}` requires a non-empty reason")

    status = _authoritative_status(scanner)
    if status is None:
        issues.append(
            "exactly one metadata-preamble `Status:` declaration is required "
            "before the first `## ` section to evaluate closure-time disposition"
        )
    terminal = status is not None and bool(TERMINAL_STATUS_VALUE_RE.match(status))
    non_terminal = status is not None and bool(NON_TERMINAL_STATUS_VALUE_RE.match(status))

    if terminal and disposition != DISPOSITION_PASS:
        issues.append(
            f"`{DISPOSITION_FIELD}: {disposition}` cannot accompany a terminal "
            "closed/accepted Status; only `PASS_INDEPENDENT_PROBE` may close"
        )
    if disposition == DISPOSITION_PASS and status is not None and not terminal:
        issues.append(
            f"`{DISPOSITION_FIELD}: {DISPOSITION_PASS}` requires a terminal "
            f"closed/accepted Status, found `{status}`"
        )
    if disposition != DISPOSITION_PASS and status is not None and not non_terminal and not terminal:
        issues.append(
            f"`{DISPOSITION_FIELD}: {disposition}` requires a recognized "
            f"non-terminal worker-return Status, found `{status}`"
        )

    if disposition == DISPOSITION_PASS:
        issues.extend(_diagnose_pass_fields(scanner, self_path))

    return Diagnostic(path=path, applicable=True, issues=tuple(issues))


def _diagnose_pass_fields(scanner: DeclarationScanner, self_path: str) -> list[str]:
    issues: list[str] = []
    values: dict[str, str] = {}
    field_groups = (
        ((PASS_ROLE_FIELD,), "role"),
        (PASS_ACTOR_FIELDS, "actor"),
        (PASS_REQUIRED_FIELDS, "required"),
        (PASS_IDENTITY_FIELDS, "identity"),
        (PASS_ORACLE_DIGEST_FIELDS, "oracle/evidence binding"),
        (PASS_EVIDENCE_REF_FIELDS, "oracle/evidence binding"),
    )
    for names, label in field_groups:
        for field_name in names:
            result = scanner.scalar(field_name, cardinality="EXACTLY_ONE")
            if not result.ok:
                issues.append(f"`{DISPOSITION_PASS}` {label} field `{field_name}`: {result.error}")
                continue
            values[field_name] = result.value or ""

    # RIPA-ROOT-R1-02: role checked by exact normalized equality; separation
    # judged from unequal canonical actor IDs, never a free-text keyword scan.
    role = values.get(PASS_ROLE_FIELD, "")
    if role and _normalize_identity(role) != _normalize_identity(PROBE_EXECUTOR_ROLE_TOKEN):
        issues.append(f"`{PASS_ROLE_FIELD}` must be the exact controlled token `{PROBE_EXECUTOR_ROLE_TOKEN}`, found `{role}`")

    implementation_actor = values.get("implementationWorkerActor", "")
    probe_actor = values.get("probeExecutorActor", "")
    if implementation_actor and probe_actor and _normalize_identity(implementation_actor) == _normalize_identity(probe_actor):
        issues.append("`implementationWorkerActor` and `probeExecutorActor` must be distinct after normalization; identical canonical actor IDs are not role separation")

    worker_invocation = values.get("workerInvocationId", "")
    probe_invocation = values.get("probeInvocationId", "")
    if worker_invocation and probe_invocation and worker_invocation == probe_invocation:
        issues.append("`workerInvocationId` and `probeInvocationId` must be distinct; identical invocation IDs are not role separation")

    separation_basis = values.get("oracleSeparationBasis", "")
    worker_suite_markers = ("worker's own suite", "worker's own test", "same oracle", "same command", "worker test suite")
    if separation_basis and any(m in separation_basis.lower() for m in worker_suite_markers):
        issues.append("`oracleSeparationBasis` describes worker-suite corroboration, not independent-oracle separation")

    command = values.get("probeCommandOrMethod", "")
    worker_command_result = scanner.scalar("workerTestCommand", cardinality="ZERO_OR_ONE")
    worker_command = worker_command_result.value or "" if worker_command_result.ok else ""
    if command and worker_command and _normalize_command_fingerprint(command) == _normalize_command_fingerprint(worker_command):
        issues.append("`probeCommandOrMethod` normalizes to the same fingerprint as the declared `workerTestCommand`; a same-oracle corroboration is not an independent probe")

    worker_digest = values.get("workerOracleSha256", "")
    probe_digest = values.get("probeOracleSha256", "")
    if worker_digest and probe_digest and worker_digest == probe_digest:
        issues.append("`workerOracleSha256` and `probeOracleSha256` must be distinct; identical digests are not oracle separation")

    worker_ref = values.get("workerEvidenceRef", "")
    probe_ref = values.get("probeEvidenceRef", "")
    if worker_ref and probe_ref and _normalize_path(worker_ref) == _normalize_path(probe_ref):
        issues.append("`workerEvidenceRef` and `probeEvidenceRef` must be distinct; identical evidence references are not evidence binding")

    # RIPA-ROOT-02/06: canonical path validation plus cryptographic binding
    # against the actual referenced bytes, before any digest comparison.
    if worker_ref and worker_digest:
        result = bind_evidence(worker_ref, worker_digest, self_path=self_path)
        if not result.ok:
            issues.append(f"`workerEvidenceRef`/`workerOracleSha256` binding: {result.error}")
    if probe_ref and probe_digest:
        result = bind_evidence(probe_ref, probe_digest, self_path=self_path)
        if not result.ok:
            issues.append(f"`probeEvidenceRef`/`probeOracleSha256` binding: {result.error}")

    return issues


def run(base: str, head: str) -> list[Diagnostic]:
    results: list[Diagnostic] = []
    for path in _changed_md_paths(base, head):
        text = _read(path)
        dispatch = diagnose_dispatch(path, text)
        if dispatch.applicable:
            results.append(dispatch)
        closure = diagnose_closure(path, text)
        if closure.applicable:
            results.append(closure)
    return results


def main(argv: list[str] | None = None) -> int:
    _configure_stdout()
    parser = argparse.ArgumentParser(description="CVF independent review probe admission checker.")
    parser.add_argument("--base", default="HEAD")
    parser.add_argument("--head", default="HEAD")
    parser.add_argument("--enforce", action="store_true")
    parser.add_argument(
        "--changed-lane-only",
        action="store_true",
        help=(
            "Only fail the gate for violations on paths within the current "
            "base..head diff or live/staged diff (RIPA-ROOT-09). Every "
            "applicable artifact is still diagnosed and printed; a "
            "violation on a pre-existing untracked artifact outside this "
            "lane is reported as a known finding but does not fail the gate."
        ),
    )
    parser.add_argument(
        "--active-work-order",
        default=None,
        help=(
            "Repo-relative path of the work order currently being executed. "
            "Its declared `Worker return path:` is always added to the "
            "changed lane under --changed-lane-only, even when that return "
            "is untracked, so the artifact this dispatch is producing can "
            "never be misclassified as an out-of-lane known finding "
            "(RIPA-ROOT-R1-01)."
        ),
    )
    args = parser.parse_args(argv)

    print("=== CVF Independent Review Probe Admission Gate ===")
    diagnostics = run(args.base, args.head)
    all_violations = [d for d in diagnostics if not d.is_clean]

    active_binding_error: str | None = None
    if args.changed_lane_only and args.active_work_order:
        if _declared_worker_return_path(args.active_work_order) is None:
            active_binding_error = (
                "explicit --active-work-order binding could not resolve exactly one "
                "valid Worker return path; refusing changed-lane evaluation"
            )

    if args.changed_lane_only:
        lane = _lane_md_paths(args.base, args.head, args.active_work_order)
        violations = [d for d in all_violations if d.path in lane]
        out_of_lane = [d for d in all_violations if d.path not in lane]
    else:
        violations = all_violations
        out_of_lane = []

    print(f"Applicable artifacts checked: {len(diagnostics)}")
    if out_of_lane:
        print(f"Known findings outside the current changed lane: {len(out_of_lane)}")
        for d in out_of_lane:
            for issue in d.issues:
                print(f"  (out-of-lane) {d.path}: {issue}")
    if not violations and active_binding_error is None:
        print("PASS: all applicable artifacts satisfy the independent-probe admission contract.")
        return 0

    print(f"Violations: {len(violations) + (1 if active_binding_error else 0)}")
    if active_binding_error:
        print(f"  - {active_binding_error}: `{args.active_work_order}`")
    for d in violations:
        for issue in d.issues:
            print(f"  - {d.path}: {issue}")
    print(
        "VIOLATION - complete the dispatch-time plan or closure-time evidence "
        "required by the Independent Review Probe Admission Boundary."
    )
    return 1 if args.enforce else 0


if __name__ == "__main__":
    raise SystemExit(main())
