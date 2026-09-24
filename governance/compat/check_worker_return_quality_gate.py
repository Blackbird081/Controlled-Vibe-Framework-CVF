#!/usr/bin/env python3
"""CVF worker-return quality gate.

Checks changed no-commit worker-return artifacts for the minimum machine shape
needed before reviewer acceptance. The gate is intentionally structural: it
does not judge whether the implementation is correct, only whether the return
packet is filled enough to avoid late reviewer repair loops.
"""

from __future__ import annotations

import argparse
import re
import subprocess
import sys
from dataclasses import dataclass, field
from pathlib import Path

# Keep the ordinary/legacy checker startup free of the evidence module.
# Import once, only after an applicable packet or a registered index is seen.
EvidenceReadinessError = ValueError

def _evidence_module():
    import importlib
    sys.path.insert(0, str(Path(__file__).resolve().parent)) if str(Path(__file__).resolve().parent) not in sys.path else None
    return importlib.import_module("worker_evidence_readiness")

def evaluate_worker_return(**kwargs):
    return _evidence_module().evaluate_worker_return(**kwargs)

def binding_sections(text):
    return _evidence_module().binding_sections(text)

def parse_binding_fields(text):
    return _evidence_module().parse_binding_fields(text)

def parse_strict_json(text, **kwargs):
    return _evidence_module().parse_strict_json(text, **kwargs)

def resolve_contained_path(root, path):
    return _evidence_module().resolve_contained_path(root, path)

def _default_resolver_for(pin, root):
    return _evidence_module()._default_resolver_for(pin, root)

def _wer_section(text, heading):
    return _evidence_module()._section(text, heading)


REPO_ROOT = Path(__file__).resolve().parents[2]
STANDARD_PATH = (
    "docs/reference/work_order_authoring/"
    "CVF_WORKER_RETURN_QUALITY_GATE_STANDARD.md"
)

ELIGIBLE_PREFIX = "docs/reviews/"
# Bounded declared index for the audit-only-drift reverse binding lookup
# (requirement 7): maps a bound audit artifact path to the worker-return
# path(s) whose evidence-readiness binding references it. This is a small,
# self-declared sidecar -- never scanned/rebuilt from a full repository
# search -- populated by `evaluate_worker_return` callers (or by hand) when
# an evidence-readiness-applicable return is authored. Reading it costs one
# bounded JSON read, not 3000+ Markdown reads.
EVIDENCE_READINESS_AUDIT_INDEX_PATH = "governance/compat/evidence_readiness_audit_index.json"
EXCLUDED_PATH_MARKERS = (
    "_COMPLETION_",
    "_CODEX_REBUTTAL_",
    "_CLAUDE_REBUTTAL_RESPONSE_",
    "_CODEX_CLASSIFICATION_",
    "_FOR_CODEX_",
)
STATUS_MARKERS = ("Status: COMPLETE_PENDING_REVIEW", "Status: BLOCKED_WITH_REASON")
SELF_DECLARE_MARKER = "Self-declared worker-return artifact: yes"
RESPONDS_MARKER = "Responds to work order:"
DISPATCH_WORK_ORDER_MARKER = "dispatchWorkOrder:"
PLACEHOLDER_MARKERS = ("FILL_ME", "WORKER_MUST_CAPTURE_AT_START")

FAST_DOC_PROFILE = "WORKER_RETURN_FAST_DOC_V1"
FAST_DOC_SCOPE = "DOCUMENTATION_AND_EVIDENCE_ONLY_NO_COMMIT"
FAST_DOC_HEADING = "## Conditional Controls Disposition"
FAST_DOC_DISPOSITION = "conditionalControlsDisposition: EKI_NA; RIH_NA; CCRI_NA"
FAST_DOC_DISPATCH_TERMS = (
    f"contractProfile: {FAST_DOC_PROFILE}",
    f"scopeClassification: {FAST_DOC_SCOPE}",
    "Commit mode: WORKER_MUST_NOT_COMMIT",
    "publicSyncDisposition: FORBIDDEN",
    "liveRuntimeDisposition: FORBIDDEN",
    "checkerMutationDisposition: FORBIDDEN",
    "workerSelfSelection: FORBIDDEN",
)

REQUIRED_HEADINGS = (
    "## Purpose",
    "## Scope / Methodology",
    "## Findings / Position",
    "## Risk / Corrective Action",
    "## Checker Source Read-Ahead Block",
    "## Agent Operation Trace Block",
    "## Delta Execution Claim Boundary Control Block",
    "## Public Export Disposition",
    "## External Knowledge Intake Routing",
    "## Rescan Intelligence Hardening",
    "## Corpus Completeness And Report Integrity",
    "## Finding-To-Governance Learning Disposition",
    "## Epistemic Process Block",
    "## Claim Boundary",
    "## git status --short",
    "## Changed Files",
    "## Command Evidence",
    "## No-Commit Statement",
)
FAST_DOC_REQUIRED_HEADINGS = tuple(
    heading
    for heading in REQUIRED_HEADINGS
    if heading
    not in {
        "## External Knowledge Intake Routing",
        "## Rescan Intelligence Hardening",
        "## Corpus Completeness And Report Integrity",
    }
) + (FAST_DOC_HEADING,)

READ_AHEAD_FIELDS = (
    "applicableCheckersRead",
    "literalTokensReviewed",
    "gateRunPurpose",
    "claimBoundary",
)
AOT_FIELDS = (
    "Actor",
    "Provider or surface",
    "Session or invocation",
    "Working directory",
    "Command or tool surface",
    "Target paths",
    "Allowed scope source",
    "Before status evidence",
    "After status evidence",
    "Diff evidence",
    "Approval boundary",
    "Claim boundary",
    "Agent type",
    "Invocation ID",
    "Expected manifest",
    "Actual changed set",
    "Manifest delta",
    "Deletion or rename disposition",
)
DELTA_FIELDS = (
    "claimScope",
    "claimDisposition",
    "receiptEvidence",
    "actionEvidence",
    "invocationBoundary",
    "interceptionBoundary",
    "claimLanguage",
    "forbiddenExpansion",
)
PUBLIC_EXPORT_TOKENS = (
    "DEFERRED_PRIVATE_ONLY",
    "EXPORTED",
    "BLOCKED_MISSING_PUBLIC_ARTIFACTS",
)
EXTERNAL_INPUT_CANONICAL = (
    "operator-provided external comparison, critique, or recommendation"
)
INTERNAL_ONLY_INPUT_CANONICAL = (
    "| Input type | internal governed input (no external intake) |"
)
DELTA_RECEIPT_TOKENS = ("CLAIM_REJECTED_NO_RECEIPT", "CVF_RECEIPT_PRESENT")
DELTA_ACTION_TOKENS = ("CLAIM_REJECTED_NO_ACTION", "ACTION_EVIDENCE_PRESENT")

NEXT_HEADING_RE = re.compile(r"^##\s+.+$", re.MULTILINE)


@dataclass(frozen=True)
class Diagnostic:
    path: str
    eligible: bool
    issues: tuple[str, ...] = field(default_factory=tuple)

    @property
    def is_clean(self) -> bool:
        return self.eligible and not self.issues


def _configure_stdout() -> None:
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    if hasattr(sys.stderr, "reconfigure"):
        sys.stderr.reconfigure(encoding="utf-8", errors="replace")


def _normalize(path: str) -> str:
    return path.replace("\\", "/").strip()


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


def _parse_name_status(output: str) -> dict[str, set[str]]:
    changed: dict[str, set[str]] = {}
    for raw in output.splitlines():
        parts = raw.split("\t")
        if len(parts) < 2:
            continue
        status = parts[0].strip()
        path = parts[2] if status.startswith(("R", "C")) and len(parts) > 2 else parts[1]
        path = _normalize(path)
        if path:
            changed.setdefault(path, set()).add(status)
    return changed


def _merge_changed(target: dict[str, set[str]], source: dict[str, set[str]]) -> None:
    for path, statuses in source.items():
        target.setdefault(path, set()).update(statuses)


def get_changed_paths(base: str | None, head: str | None) -> dict[str, set[str]]:
    changed: dict[str, set[str]] = {}
    if base and head and base != head:
        code, out, err = _run_git(["diff", "--name-status", f"{base}..{head}"])
        if code != 0:
            raise RuntimeError(err or out or f"git diff failed for {base}..{head}")
        _merge_changed(changed, _parse_name_status(out))

    for args in (["diff", "--name-status"], ["diff", "--name-status", "--cached"]):
        code, out, _ = _run_git(args)
        if code == 0 and out:
            _merge_changed(changed, _parse_name_status(out))

    code, out, _ = _run_git(["ls-files", "--others", "--exclude-standard"])
    if code == 0 and out:
        for raw in out.splitlines():
            path = _normalize(raw)
            if path:
                changed.setdefault(path, set()).add("A")

    return changed


def _read(path: str) -> str:
    full = REPO_ROOT / path
    if not full.is_file():
        return ""
    return full.read_text(encoding="utf-8", errors="replace")


def is_eligible_worker_return(path: str, text: str) -> bool:
    normalized = _normalize(path)
    if not normalized.startswith(ELIGIBLE_PREFIX) or not normalized.endswith(".md"):
        return False
    if "/archive/" in normalized:
        return False
    if any(marker in normalized for marker in EXCLUDED_PATH_MARKERS):
        return False
    if SELF_DECLARE_MARKER in text:
        return True
    has_status = any(marker in text for marker in STATUS_MARKERS)
    has_work_order = RESPONDS_MARKER in text or DISPATCH_WORK_ORDER_MARKER in text
    return has_status and has_work_order


def _section(text: str, heading: str) -> str:
    start = text.find(heading)
    if start == -1:
        return ""
    match = NEXT_HEADING_RE.search(text, start + len(heading))
    end = match.start() if match else len(text)
    return text[start:end]


def _has_all(section: str, labels: tuple[str, ...]) -> list[str]:
    return [label for label in labels if label not in section]


def _fast_doc_dispatch_issues(text: str) -> list[str]:
    match = re.search(r"(?m)^dispatchWorkOrder:\s*`([^`]+)`\s*$", text)
    if not match:
        return ["fast-doc return lacks a readable `dispatchWorkOrder` path"]
    work_order_path = _normalize(match.group(1))
    if not work_order_path.startswith("docs/work_orders/"):
        return ["fast-doc dispatch path must be under `docs/work_orders/`"]
    work_order = _read(work_order_path)
    if not work_order:
        return [f"fast-doc dispatch work order is missing: `{work_order_path}`"]
    return [
        f"fast-doc dispatch work order lacks `{term}`"
        for term in FAST_DOC_DISPATCH_TERMS
        if term not in work_order
    ]


def diagnose(
    path: str,
    text: str,
    *,
    resolver_registry: "dict[tuple[str, str], object] | None" = None,
) -> Diagnostic:
    """Diagnose one worker-return path.

    `resolver_registry` (F5 fix) is an optional shared `{(sourceRoot,
    sourcePin): resolver}` map threaded down from `run()`. When supplied,
    `_evidence_readiness_issues` reuses (or lazily constructs once and
    caches) a resolver per distinct `(sourceRoot, sourcePin)` pair instead of
    constructing a brand-new resolver -- with an empty cache -- on every
    call. When omitted (e.g. a standalone `diagnose()` call from a test or
    script), a fresh resolver is constructed per call exactly as before,
    which stays correct, just not reused across a `run()` invocation.
    """

    if not is_eligible_worker_return(path, text):
        return Diagnostic(path=path, eligible=False)

    issues: list[str] = []

    for marker in PLACEHOLDER_MARKERS:
        if marker in text:
            issues.append(f"unresolved placeholder `{marker}` remains")

    fast_doc = f"contractProfile: {FAST_DOC_PROFILE}" in text
    required_headings = FAST_DOC_REQUIRED_HEADINGS if fast_doc else REQUIRED_HEADINGS
    for heading in required_headings:
        if heading not in text:
            issues.append(f"missing required heading `{heading}`")

    if fast_doc:
        issues.extend(_fast_doc_dispatch_issues(text))
        compact = _section(text, FAST_DOC_HEADING)
        if FAST_DOC_DISPOSITION not in compact:
            issues.append(
                "fast-doc conditional controls block lacks the canonical compact disposition"
            )

    if SELF_DECLARE_MARKER not in text:
        issues.append(f"missing `{SELF_DECLARE_MARKER}`")
    if RESPONDS_MARKER not in text:
        issues.append(f"missing `{RESPONDS_MARKER}`")
    if DISPATCH_WORK_ORDER_MARKER not in text:
        issues.append(f"missing `{DISPATCH_WORK_ORDER_MARKER}`")

    read_ahead = _section(text, "## Checker Source Read-Ahead Block")
    for label in _has_all(read_ahead, READ_AHEAD_FIELDS):
        issues.append(f"checker read-ahead block missing `{label}`")
    if read_ahead and "governance/compat/check_" not in read_ahead:
        issues.append("checker read-ahead does not name any `governance/compat/check_*.py` source")
    if read_ahead and "first discovery" in read_ahead.casefold():
        issues.append("checker read-ahead gateRunPurpose still says first discovery")

    aot = _section(text, "## Agent Operation Trace Block")
    for label in _has_all(aot, AOT_FIELDS):
        issues.append(f"agent operation trace block missing `{label}`")
    if aot and "git diff --name-status" not in aot:
        issues.append("agent operation trace lacks `git diff --name-status` diff evidence")

    delta = _section(text, "## Delta Execution Claim Boundary Control Block")
    for label in _has_all(delta, DELTA_FIELDS):
        issues.append(f"Delta block missing `{label}`")
    if delta and not any(token in delta for token in DELTA_RECEIPT_TOKENS):
        issues.append("Delta block lacks receipt evidence token")
    if delta and not any(token in delta for token in DELTA_ACTION_TOKENS):
        issues.append("Delta block lacks action evidence token")

    if not fast_doc:
        external = _section(text, "## External Knowledge Intake Routing")
        if external and not any(
            marker in external
            for marker in (EXTERNAL_INPUT_CANONICAL, INTERNAL_ONLY_INPUT_CANONICAL)
        ):
            issues.append("external knowledge input type is not canonical")

    public_export = _section(text, "## Public Export Disposition")
    if public_export and not any(token in public_export for token in PUBLIC_EXPORT_TOKENS):
        issues.append("public export disposition lacks an allowed token")

    command_evidence = _section(text, "## Command Evidence")
    if command_evidence and not re.search(r"\b(PASS|FAIL|BLOCKED|N/A with reason)\b", command_evidence):
        issues.append("command evidence lacks PASS/FAIL/BLOCKED/N/A disposition")

    if "WORKER_MUST_NOT_COMMIT honored" not in text and "BLOCKED_WITH_REASON" not in text:
        issues.append("no-commit statement must say `WORKER_MUST_NOT_COMMIT honored`")

    issues.extend(_evidence_readiness_issues(text, path=path, resolver_registry=resolver_registry))

    return Diagnostic(path=path, eligible=True, issues=tuple(issues))


def _dispatch_work_order_path(text: str) -> str | None:
    match = re.search(r"(?m)^dispatchWorkOrder:\s*`([^`]+)`\s*$", text)
    if not match:
        return None
    return _normalize(match.group(1))


def _resolver_for_registry(
    resolver_registry: "dict[tuple[str, str], object] | None", source_root: str, source_pin: str
) -> object:
    """Return a resolver for `(source_root, source_pin)`, reusing one already
    in `resolver_registry` if present (F5 fix), or constructing a fresh one
    and caching it into the registry when supplied. Without a registry,
    constructs a fresh resolver every call (unchanged legacy behavior for
    direct `evaluate_worker_return`/standalone `diagnose()` callers)."""

    if resolver_registry is None:
        return _default_resolver_for(source_pin, REPO_ROOT)
    key = (source_root, source_pin)
    resolver = resolver_registry.get(key)
    if resolver is None:
        resolver = _default_resolver_for(source_pin, REPO_ROOT)
        resolver_registry[key] = resolver
    return resolver


def _source_pin_and_root_for_resolver(text: str) -> tuple[str, str] | None:
    """Cheaply peek the binding's `sourceRoot`/`sourcePin` without running
    the full validator, so `_evidence_readiness_issues` can pick (or build)
    the correctly-keyed shared resolver before calling
    `evaluate_worker_return`."""

    binding_section = _wer_section(text, "## Evidence Readiness Binding")
    if not binding_section:
        return None
    fields = parse_binding_fields(binding_section)
    source_root = fields.get("sourceRoot", "")
    source_pin = fields.get("sourcePin", "")
    if not source_pin:
        return None
    return source_root, source_pin


def _evidence_readiness_issues(
    text: str,
    *,
    path: str | None = None,
    resolver_registry: "dict[tuple[str, str], object] | None" = None,
) -> list[str]:
    """Reach the evidence-readiness validator for applicable returns.

    Applicability is derived entirely from the cited dispatch work order
    (a trusted upstream file), never from anything the return itself
    asserts, so a worker cannot opt a covered task out by omission or by
    tampering with its own return. Not applicable (no evidence-readiness
    contract declared by the dispatch work order) costs one already-required
    file read and zero extra Git calls.

    F4 fix: whenever this successfully parses an applicable binding that
    declares an `auditPath`, it registers the reverse `auditPath ->
    workerReturnPath` mapping into the bounded audit index as a side effect
    (see `_register_evidence_readiness_binding`), so a later audit-only
    change automatically pulls this return back into re-diagnosis without
    any hand-maintained index entry existing beforehand.

    F5 fix: when the caller (`run()`, via `diagnose()`) supplies a shared
    `resolver_registry`, the resolver for this binding's `(sourceRoot,
    sourcePin)` is looked up/constructed-once in that registry and passed
    through to `evaluate_worker_return` as `source_resolver`, so multiple
    worker returns sharing the same `(sourceRoot, sourcePin)` within one
    `run()` invocation reuse a single resolution pass instead of each
    constructing its own resolver with an empty cache.
    """

    work_order_path = _dispatch_work_order_path(text)
    if not work_order_path:
        return []
    work_order_text = _read(work_order_path)
    if "evidenceReadinessContract: REQUIRED_V1" not in work_order_text:
        return []

    result = evaluate_worker_return(
        return_text=text, work_order_text=work_order_text, repo_root=REPO_ROOT,
        source_resolver_factory=lambda root, pin: _resolver_for_registry(resolver_registry, root, pin),
    )
    if not result.applicable:
        return []
    issues = [f"evidence readiness: {rendered}" for rendered in result.render_issues()]
    if path:
        registration_failures = [_register_evidence_readiness_binding(path, section) for section in binding_sections(text)]
        registration_failure = "; ".join(f for f in registration_failures if f)
        if registration_failure:
            # F4 fix: a failed index read/write is no longer silently
            # swallowed as a "non-fatal convenience side effect" -- it is
            # surfaced as a visible issue on the return being diagnosed so a
            # human sees the audit-only-drift coverage gap.
            issues.append(f"evidence readiness: {registration_failure}")
    return issues


class _EvidenceReadinessIndexCorrupt(Exception):
    """Raised internally when the audit index file exists but is malformed
    (not valid JSON, or not a JSON object) -- distinct from the file simply
    not existing yet (F4 fix)."""


def _load_evidence_readiness_audit_index() -> dict[str, list[str]]:
    """Read the small bounded audit-path -> worker-return-path(s) index.

    A MISSING index file is legitimate and expected on first use -- returns
    `{}` with no diagnostic. A PRESENT-BUT-MALFORMED index file (not valid
    JSON, or a JSON value that is not an object) is a real integrity problem
    (F4 fix): this raises `_EvidenceReadinessIndexCorrupt` instead of
    silently returning `{}` indistinguishably from "no bindings registered",
    so a caller that needs to know the difference (registration,
    audit-only-drift lookup, or the top-level integrity check) can decide
    how to react rather than losing the distinction entirely.
    """

    full = REPO_ROOT / EVIDENCE_READINESS_AUDIT_INDEX_PATH
    if not full.is_file():
        return {}
    text = _read(EVIDENCE_READINESS_AUDIT_INDEX_PATH)
    if not text.strip():
        # An existing-but-empty file is ambiguous; treat as corrupt rather
        # than silently equivalent to "file absent" -- a zero-byte index is
        # never something this module itself writes (the writer always
        # emits at least `{}\n`), so an empty file signals external damage.
        raise _EvidenceReadinessIndexCorrupt("index file exists but is empty")
    try:
        import json

        data = parse_strict_json(text, source_label="audit index")
    except (ValueError, EvidenceReadinessError) as exc:
        raise _EvidenceReadinessIndexCorrupt(f"index file is not valid JSON: {exc}") from exc
    if not isinstance(data, dict):
        raise _EvidenceReadinessIndexCorrupt("index file JSON top level is not an object")
    result: dict[str, list[str]] = {}
    for key, value in data.items():
        if isinstance(value, str):
            value = [value]
        if not isinstance(value, list) or not value or any(not isinstance(v, str) for v in value):
            raise _EvidenceReadinessIndexCorrupt("index entries must contain nonempty return-path lists")
        try:
            resolve_contained_path(REPO_ROOT, key)
            for v in value:
                resolve_contained_path(REPO_ROOT, v)
        except EvidenceReadinessError as exc:
            raise _EvidenceReadinessIndexCorrupt(str(exc)) from exc
        result[key] = value
    return result


def _load_evidence_readiness_audit_index_safe() -> tuple[dict[str, list[str]], str | None]:
    """Wrap `_load_evidence_readiness_audit_index`, converting a malformed
    index into an explicit `(empty_dict, reason)` pair instead of letting the
    exception propagate to every caller. Callers that must surface the
    integrity problem (rather than merely proceed with empty coverage) use
    the returned `reason`."""

    try:
        return _load_evidence_readiness_audit_index(), None
    except _EvidenceReadinessIndexCorrupt as exc:
        return {}, str(exc)


def _evidence_readiness_audit_index_integrity() -> str | None:
    """Return a diagnostic-ready issue string if the audit-readiness index
    is present but malformed, else `None` (missing file or valid file both
    return `None` -- neither is an integrity problem). Called once per
    `run()` invocation so the malformed-index case is surfaced as a visible
    issue on every diagnosed return in that run, rather than disappearing
    silently (F4 fix)."""

    _, reason = _load_evidence_readiness_audit_index_safe()
    if reason is None:
        return None
    return (
        "evidence readiness: audit-readiness index "
        f"`{EVIDENCE_READINESS_AUDIT_INDEX_PATH}` could not be read ({reason}); "
        "audit-only-drift coverage for this run may be incomplete"
    )


def _write_evidence_readiness_audit_index(index: dict[str, list[str]]) -> None:
    """Persist the small bounded audit-path -> worker-return-path(s) index.

    Deterministic JSON (sorted keys, sorted value lists) so repeated runs
    produce a stable diff. This is the ONLY writer of this file; it is never
    hand-maintained, closing F4's gap directly (a return whose author never
    manually edited this file still gets audit-only-drift coverage).

    Raises `OSError` on a write failure (disk full, permission denied,
    concurrent-write race); the caller (`_register_evidence_readiness_binding`)
    is responsible for turning that into a visible issue rather than
    swallowing it (F4 fix) -- this function itself no longer decides that
    policy so it stays a plain, honest write primitive.
    """

    import json

    full = REPO_ROOT / EVIDENCE_READINESS_AUDIT_INDEX_PATH
    full.parent.mkdir(parents=True, exist_ok=True)
    serializable = {key: sorted(set(values)) for key, values in sorted(index.items())}
    full.write_text(json.dumps(serializable, indent=2, sort_keys=True) + "\n", encoding="utf-8")


def _register_evidence_readiness_binding(worker_return_path: str, text: str) -> str | None:
    """Side effect of evaluating an applicable evidence-readiness binding
    (requirement 7): register `auditPath -> [workerReturnPath, ...]` in the
    bounded declared index automatically, so the audit-only-drift reverse
    lookup works without any human hand-maintaining the index file first.

    Bounded: this only ever touches the one small index file plus the one
    binding section already being diagnosed -- never a full-repository scan.

    F4 fix: a read or write failure here is no longer silently swallowed.
    Returns `None` on success (or a legitimate no-op, e.g. no `auditPath`
    declared), or a human-readable reason string when the index could not be
    read (malformed) or written (`OSError`) -- the caller
    (`_evidence_readiness_issues`) surfaces that reason as a visible issue on
    the return being diagnosed, so a human sees the coverage gap instead of
    it being invisible.
    """

    binding_section = _wer_section(text, "## Evidence Readiness Binding")
    if not binding_section:
        return None
    fields = parse_binding_fields(binding_section)
    audit_path = fields.get("auditPath", "")
    if not audit_path or "N/A" in audit_path.upper() or "TO_FILL" in audit_path.upper():
        return None
    audit_path = _normalize(audit_path)
    worker_return_path = _normalize(worker_return_path)

    index, load_reason = _load_evidence_readiness_audit_index_safe()
    if load_reason is not None:
        return f"audit-readiness index could not be read ({load_reason})"

    existing = set(index.get(audit_path, []))
    if worker_return_path in existing:
        return None  # already registered; no write needed
    existing.add(worker_return_path)
    index[audit_path] = sorted(existing)
    try:
        _write_evidence_readiness_audit_index(index)
    except OSError as exc:
        return f"audit-readiness index could not be written ({exc})"
    return None


def _audit_only_drift_paths(changed: dict[str, set[str]]) -> set[str]:
    """Bounded reverse-binding lookup (requirement 7): for every changed path
    that is NOT itself an eligible worker return, check the small declared
    index for worker-return paths bound to it as an audit artifact. Returns
    the set of worker-return paths that must be re-diagnosed even though
    their own Markdown bytes did not change this run.

    F4 fix: uses the safe loader so a malformed index degrades to "no drift
    hits this call" (bounded, same as before) rather than raising out of
    this lookup; the malformed-index condition itself is surfaced separately
    and once per `run()` via `_evidence_readiness_audit_index_integrity`, not
    duplicated here per changed-path scan.
    """

    index, _reason = _load_evidence_readiness_audit_index_safe()
    hits: set[str] = set()
    for path in changed:
        hits.update(index.get(path, ()))
        if not path.endswith(".json"):
            continue
        try:
            raw = _read(path)
            if "workerReturnPath" not in raw:
                continue
            data = parse_strict_json(raw, source_label=path)
            if isinstance(data, dict) and isinstance(data.get("workerReturnPath"), str):
                target = data["workerReturnPath"]
                resolve_contained_path(REPO_ROOT, target)
                # Locator is routing data only: require the return to bind this audit.
                if any(parse_binding_fields(s).get("auditPath") == path for s in binding_sections(_read(target))):
                    hits.add(target)
        except (ValueError, EvidenceReadinessError):
            pass
    return hits


WORKER_RETURN_PATH_SCALAR_RE = re.compile(r"(?m)^\s*Worker return path:\s*(\S.*?)\s*$")
WORKER_RETURN_PATH_FIELD_RE = re.compile(r"(?m)^\s*workerReturnPath:\s*(\S.*?)\s*$")
ACTIVE_WORK_ORDER_PREFIX = "docs/work_orders/"


def _clean_binding(value: str) -> str:
    return _normalize(value).strip("`").rstrip(".,;:")


def _contained_rel(path: str) -> str | None:
    """Return the normalized repo-relative path if it resolves inside
    REPO_ROOT, else None. Absolute paths and escapes are rejected."""

    normalized = _normalize(path)
    if not normalized or Path(normalized).is_absolute() or re.match(r"^[A-Za-z]:", normalized):
        return None
    root = REPO_ROOT.resolve()
    try:
        (root / normalized).resolve().relative_to(root)
    except ValueError:
        return None
    return normalized


def diagnose_active_work_order(
    work_order_path: str,
    *,
    resolver_registry: "dict[tuple[str, str], object] | None" = None,
) -> Diagnostic:
    """DRC-04/DRC-05: resolve the exact worker return bound by the active work
    order and diagnose it regardless of changed-path discovery. Only that exact
    return can satisfy the active work order; any other eligible return is
    irrelevant to this admission."""

    label = f"active work order `{_normalize(work_order_path)}`"
    wo_rel = _contained_rel(work_order_path)
    if wo_rel is None or not wo_rel.startswith(ACTIVE_WORK_ORDER_PREFIX) or not wo_rel.endswith(".md"):
        return Diagnostic(path=_normalize(work_order_path), eligible=True, issues=(
            f"{label} must be a repo-contained `{ACTIVE_WORK_ORDER_PREFIX}*.md` path",))
    wo_text = _read(wo_rel)
    if not wo_text:
        return Diagnostic(path=wo_rel, eligible=True, issues=(f"{label} is missing or unreadable",))

    scalars = [_clean_binding(v) for v in WORKER_RETURN_PATH_SCALAR_RE.findall(wo_text)]
    fields = [_clean_binding(v) for v in WORKER_RETURN_PATH_FIELD_RE.findall(wo_text)]
    if len(scalars) != 1 or len(fields) != 1 or scalars[0] != fields[0]:
        return Diagnostic(path=wo_rel, eligible=True, issues=(
            f"{label} must bind exactly one agreeing `Worker return path:` and "
            f"`workerReturnPath:` (found {scalars or 'none'} / {fields or 'none'})",))

    return_rel = _contained_rel(scalars[0])
    if return_rel is None:
        return Diagnostic(path=scalars[0], eligible=True, issues=(
            f"exact worker return bound by {label} is not repo-contained",))
    return_text = _read(return_rel)
    if not return_text:
        return Diagnostic(path=return_rel, eligible=True, issues=(
            f"exact worker return bound by {label} is absent; no other return can satisfy it",))

    d = diagnose(return_rel, return_text, resolver_registry=resolver_registry)
    if not d.eligible:
        return Diagnostic(path=return_rel, eligible=True, issues=(
            f"exact worker return bound by {label} is not an eligible worker-return artifact",))
    issues = list(d.issues)
    bound_back = _dispatch_work_order_path(return_text)
    if bound_back != wo_rel:
        issues.append(
            f"exact worker return `dispatchWorkOrder` is `{bound_back or 'missing'}`, "
            f"not the active work order `{wo_rel}`"
        )
    return Diagnostic(path=return_rel, eligible=True, issues=tuple(issues))


def run(
    base: str | None, head: str | None, active_work_order: str | None = None
) -> list[Diagnostic]:
    diagnostics: list[Diagnostic] = []
    changed = get_changed_paths(base, head)
    diagnosed_paths: set[str] = set()

    # F5 fix: construct ONE resolver registry for this whole `run()`
    # invocation and thread it through every `diagnose()` call below, so two
    # (or more) worker returns sharing the same (sourceRoot, sourcePin)
    # within this invocation reuse a single resolution pass instead of each
    # `diagnose()` call constructing its own fresh, empty-cache resolver.
    resolver_registry: dict[tuple[str, str], object] = {}

    # F4 fix: surface a malformed/unwritable audit-readiness index as a
    # visible diagnostic instead of it silently degrading to "no coverage".
    # Read once for this invocation so every path below shares the same
    # disclosed integrity status.
    index_state = _evidence_readiness_audit_index_integrity()
    if index_state is not None:
        diagnostics.append(Diagnostic(path=EVIDENCE_READINESS_AUDIT_INDEX_PATH, eligible=True, issues=(index_state,)))

    # Active-work-order admission is rooted in the explicit order, not in Git
    # discovery: the exact bound return is always diagnosed, even when the
    # changed set selects zero returns.
    if active_work_order:
        active = diagnose_active_work_order(active_work_order, resolver_registry=resolver_registry)
        diagnostics.append(active)
        diagnosed_paths.add(active.path)

    for path, statuses in sorted(changed.items()):
        if path in diagnosed_paths:
            continue
        if not any(status.startswith(("A", "M", "R")) for status in statuses):
            continue
        text = _read(path)
        d = diagnose(path, text, resolver_registry=resolver_registry)
        diagnosed_paths.add(path)
        if d.eligible:
            diagnostics.append(d)

    # Audit-only drift: the bound Markdown return did not change this run,
    # but the audit artifact it references did. Re-diagnose those returns so
    # a stale-digest / drifted-count defect cannot bypass validation just
    # because the review packet's own bytes are untouched.
    for worker_return_path in sorted(_audit_only_drift_paths(changed) - diagnosed_paths):
        text = _read(worker_return_path)
        if not text:
            continue
        d = diagnose(worker_return_path, text, resolver_registry=resolver_registry)
        if d.eligible:
            diagnostics.append(d)

    # An opted-in audit cannot disappear when its index is removed. Recover
    # through its reciprocal locator or emit a blocking coverage diagnostic.
    index, _ = _load_evidence_readiness_audit_index_safe()
    for path in changed:
        if not path.endswith(".json") or path in index:
            continue
        try:
            raw = _read(path)
            if "cvf.evidenceAudit.v1" not in raw:
                continue
            data = parse_strict_json(raw, source_label=path)
        except (ValueError, EvidenceReadinessError):
            continue
        if isinstance(data, dict) and data.get("schemaVersion") == "cvf.evidenceAudit.v1":
            diagnostics.append(Diagnostic(path=path, eligible=True, issues=(
                "evidence readiness: audit has no verified reverse binding; restore its workerReturnPath receipt or index",)))
    return diagnostics


def main(argv: list[str] | None = None) -> int:
    _configure_stdout()
    parser = argparse.ArgumentParser(description="CVF worker-return quality gate.")
    parser.add_argument("--base", default=None)
    parser.add_argument("--head", default="HEAD")
    parser.add_argument("--enforce", action="store_true")
    parser.add_argument(
        "--active-work-order",
        default=None,
        help=(
            "Repo-relative work order being executed. Its exact bound worker "
            "return must exist and pass; zero eligible returns then fails."
        ),
    )
    args = parser.parse_args(argv)

    print("=== CVF Worker Return Quality Gate ===")
    print(f"Standard: {STANDARD_PATH}")
    if args.base:
        print(f"Range: {args.base}..{args.head}")
    if args.active_work_order:
        print(f"Active work order: {_normalize(args.active_work_order)}")

    try:
        diagnostics = run(args.base, args.head, args.active_work_order)
    except Exception as exc:  # noqa: BLE001
        print(f"FAIL: {exc}")
        return 2 if args.enforce else 0

    violations = [d for d in diagnostics if not d.is_clean]
    print(f"Eligible worker-return artifacts checked: {len(diagnostics)}")
    print(f"Violations: {len(violations)}")

    if violations:
        for d in violations:
            for issue in d.issues:
                print(f"  - {d.path}: {issue}")
        print("VIOLATION - worker-return packet is not review-ready.")
        return 1 if args.enforce else 0

    print("COMPLIANT - worker-return packets are review-ready.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
