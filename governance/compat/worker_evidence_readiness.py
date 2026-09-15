"""Worker evidence validation and existing-gate entrypoints.

Schema/parsing and bounded source IO live in adjacent modules; this module
retains the public import surface used by the checker and scaffolds.
"""
from __future__ import annotations
from worker_evidence_contract import (
    hashlib,
    json,
    re,
    subprocess,
    dataclass,
    field,
    Path,
    Any,
    Callable,
    SCHEMA_VERSION,
    EVIDENCE_READINESS_CONTRACT_TOKEN,
    EVIDENCE_BINDING_HEADING,
    EVIDENCE_READINESS_PACKET_KINDS,
    EVIDENCE_READINESS_INDICATORS,
    _matches_any_evidence_indicator,
    evidence_readiness_auto_detected,
    resolve_evidence_readiness_applicable,
    REUSE_BINDING_HEADING,
    REUSE_ROW_COLUMNS,
    BINDING_SCHEMA_FIELD,
    BINDING_SCHEMA_VALUE,
    REQUIRED_BINDING_FIELDS,
    PATH_VALUED_BINDING_FIELDS,
    ROW_COLUMNS,
    ROW_STATUSES,
    CURRENT_PLACEHOLDER_TOKENS,
    _HISTORICAL_CONTEXT_MARKERS,
    EvidenceReadinessError,
    EvidenceIssue,
    EvidenceReadinessResult,
    normalize_source_relative_path,
    resolve_contained_path,
    _reject_duplicate_keys,
    parse_strict_json,
    EvidenceRow,
    _parse_span,
    parse_read_spans,
    spans_overlap_policy_ok,
    _FIELD_LINE_RE,
    _TABLE_ROW_RE,
    _NEXT_HEADING_RE,
    _NEXT_SUBHEADING_RE,
    _section,
    _subsection,
    declares_evidence_readiness_contract,
    parse_binding_fields,
    _parse_pipe_rows,
    parse_binding_rows,
    parse_reuse_rows,
    parse_discovery_manifest_rows,
)
from worker_evidence_sources import GitBatchResolver, SnapshotResolver


# --- Row/candidate reconciliation ------------------------------------------


def reconcile_candidate_set(
    declared_candidates: tuple[str, ...], processed_rows: tuple[EvidenceRow, ...]
) -> list[EvidenceIssue]:
    """Reject missing, duplicate, overlapping, or unknown paths; candidate =
    selected + excluded partition; exact reconciliation (requirement 2 / Set
    accounting acceptance row). A known candidate cannot disappear through
    counts, aliases, or an unnamed aggregate exclusion (requirement 3)."""

    issues: list[EvidenceIssue] = []

    seen: dict[str, int] = {}
    for row in processed_rows:
        seen[row.path] = seen.get(row.path, 0) + 1
    duplicates = sorted(p for p, n in seen.items() if n > 1)
    for path in duplicates:
        issues.append(
            EvidenceIssue(
                pointer=f"/rows/{path}",
                message="duplicate row for the same path",
                expected="1",
                observed=str(seen[path]),
            )
        )

    declared_set = set(declared_candidates)
    processed_set = set(seen)

    missing = sorted(declared_set - processed_set)
    for path in missing:
        issues.append(
            EvidenceIssue(
                pointer=f"/discoveryManifest/{path}",
                message="declared candidate has no processing row (READ/REUSED/EXCLUDED)",
                expected="present in rows",
                observed="absent",
            )
        )

    unknown = sorted(processed_set - declared_set)
    for path in unknown:
        issues.append(
            EvidenceIssue(
                pointer=f"/rows/{path}",
                message="row path is not a member of the declared discovery manifest",
                expected="member of discoveryManifest",
                observed="unknown path",
            )
        )

    return issues


def validate_row_bounds(rows: tuple[EvidenceRow, ...]) -> list[EvidenceIssue]:
    issues: list[EvidenceIssue] = []
    for row in rows:
        if row.status not in ROW_STATUSES:
            issues.append(
                EvidenceIssue(
                    pointer=f"/rows/{row.path}/status",
                    message="row status is not a recognized value",
                    expected="|".join(ROW_STATUSES),
                    observed=row.status,
                )
            )
            continue
        if row.status == "EXCLUDED":
            continue
        if row.line_count < 0:
            issues.append(
                EvidenceIssue(
                    pointer=f"/rows/{row.path}/lineCount",
                    message="negative line count",
                    observed=str(row.line_count),
                )
            )
            continue
        if not spans_overlap_policy_ok(row.read_spans):
            issues.append(
                EvidenceIssue(
                    pointer=f"/rows/{row.path}/readSpans",
                    message="read spans fail overlap/order policy",
                )
            )
        for start, end in row.read_spans:
            if end > row.line_count:
                issues.append(
                    EvidenceIssue(
                        pointer=f"/rows/{row.path}/readSpans",
                        message="read span exceeds declared line count",
                        expected=f"<= {row.line_count}",
                        observed=str(end),
                    )
                )
        if row.status == "READ" and not row.covers_full():
            issues.append(
                EvidenceIssue(
                    pointer=f"/rows/{row.path}/readSpans",
                    message="partial read span cannot satisfy a full-read (READ) claim",
                    expected=f"union covers 1-{row.line_count}",
                    observed=str(row.read_spans),
                )
            )
    return issues


def validate_source_identity(
    rows: tuple[EvidenceRow, ...],
    *,
    source_root: str,
    source_pin: str,
    resolver: Any,
) -> list[EvidenceIssue]:
    """Resolve each non-excluded row's claimed source identity against the
    real resolver (Git or snapshot) and reject any row whose declared
    `blobSha256` does not match, whose declared `lineCount` does not match
    the real line count of the resolved bytes, or whose source path cannot
    be resolved at all (F1 fix -- this is the check that was previously
    entirely absent from the real entrypoint).

    A row whose source cannot be resolved (path does not exist at that
    root/pin) is a hard issue, never silently skipped, per the work order's
    explicit rework instruction.

    REUSED rows are resolved exactly like READ rows (F3 continuation): a
    REUSED row still claims a current `blobSha256` for its own source, and
    that claim must be checked against the real resolver the same way a READ
    row's claim is, independent of the separate reuse-chain check in
    `validate_reuse_bindings`.
    """

    issues: list[EvidenceIssue] = []
    resolvable = tuple(
        row for row in rows if row.status in ("READ", "REUSED", "EXCLUDED") and row.path
    )
    if not resolvable:
        return issues
    paths = tuple(row.path for row in resolvable)
    resolved = resolver.resolve_blob_shas(source_root, source_pin, paths)
    resolve_line_counts = getattr(resolver, "resolve_line_counts", None)
    resolved_line_counts: dict[str, int | None] = (
        resolve_line_counts(source_root, source_pin, paths) if resolve_line_counts else {}
    )

    for row in resolvable:
        actual = resolved.get(row.path)
        if actual is None:
            issues.append(
                EvidenceIssue(
                    pointer=f"/rows/{row.path}/blobSha256",
                    message=(
                        "row source could not be resolved at the declared sourceRoot/sourcePin "
                        "(nonexistent path, fabricated pin, or unreachable source)"
                    ),
                    expected="resolvable blob at sourceRoot+sourcePin+path",
                    observed="unresolved",
                )
            )
            continue
        if row.status == "EXCLUDED":
            # Identity is still checked (a fabricated exclusion of a real
            # path is not itself a digest mismatch), but an EXCLUDED row has
            # no obligation to declare a matching blob digest or line count.
            continue
        if not row.blob_sha256:
            issues.append(
                EvidenceIssue(
                    pointer=f"/rows/{row.path}/blobSha256",
                    message="row is missing a declared blobSha256 for a resolvable source",
                    expected=actual,
                    observed="",
                )
            )
            continue
        if row.blob_sha256.lower() != actual.lower():
            issues.append(
                EvidenceIssue(
                    pointer=f"/rows/{row.path}/blobSha256",
                    message="declared blobSha256 does not match the resolved source identity",
                    expected=actual,
                    observed=row.blob_sha256,
                )
            )
        # F1 line-count fix: a correct blobSha256 only proves the bytes
        # match; it says nothing about a fabricated declared lineCount. Read
        # the real line count from the same resolved source and compare.
        actual_line_count = resolved_line_counts.get(row.path)
        if actual_line_count is not None and row.line_count != actual_line_count:
            issues.append(
                EvidenceIssue(
                    pointer=f"/rows/{row.path}/lineCount",
                    message="declared lineCount does not match the resolved source's actual line count",
                    expected=str(actual_line_count),
                    observed=str(row.line_count),
                )
            )
    return issues


def validate_reuse_bindings(
    rows: tuple[EvidenceRow, ...],
    reuse_fields: dict[str, dict[str, str]],
    *,
    current_audit_sha256: str,
    repo_root: "Path | None" = None,
    source_root: str | None = None,
    source_pin: str | None = None,
) -> list[EvidenceIssue]:
    """Read reuse must point to an immutable prior artifact digest+row; a
    changed source identity (blob sha) invalidates reuse (requirement 3).

    F3 continued: previously this only compared worker-declared strings
    against each other within the same return (`priorArtifactSha256` vs.
    `priorBlobSha256` vs. `current_audit_sha256`, all worker-typed in the
    same document) -- a fabricated but internally self-consistent chain
    passed clean because nothing here ever read an independently verifiable
    artifact. Now, when `repo_root` is supplied, `priorArtifactPath` (the
    new reuse sub-table column) is resolved and its real bytes are hashed;
    a `priorArtifactSha256` that does not match those real bytes is
    rejected, and a reuse binding with no resolvable `priorArtifactPath` at
    all is itself an issue rather than a silent pass on an unverifiable bare
    digest.
    """

    issues: list[EvidenceIssue] = []
    prior_cache: dict[Path, tuple[str, dict[str, str], dict[str, list[EvidenceRow]], list[EvidenceIssue]]] = {}
    prior_paths: dict[str, Path] = {}
    for row in rows:
        if row.status != "REUSED":
            continue
        meta = reuse_fields.get(row.path)
        if not meta:
            issues.append(
                EvidenceIssue(
                    pointer=f"/rows/{row.path}/reuse",
                    message="REUSED row lacks a reuse-source digest/row binding",
                )
            )
            continue
        prior_digest = meta.get("priorArtifactSha256", "")
        prior_path = meta.get("priorArtifactPath", "")
        prior_blob = meta.get("priorBlobSha256", "")
        if not prior_digest:
            issues.append(
                EvidenceIssue(
                    pointer=f"/rows/{row.path}/reuse/priorArtifactSha256",
                    message="reuse binding is missing the prior artifact digest",
                )
            )
        if prior_digest and prior_digest == current_audit_sha256:
            issues.append(
                EvidenceIssue(
                    pointer=f"/rows/{row.path}/reuse/priorArtifactSha256",
                    message="reuse binding points at the current audit digest, not an immutable prior one (self-hash cycle)",
                )
            )
        if not prior_blob:
            issues.append(
                EvidenceIssue(
                    pointer=f"/rows/{row.path}/reuse/priorBlobSha256",
                    message="reuse binding is missing the prior blob digest",
                )
            )
        elif prior_blob != row.blob_sha256:
            issues.append(
                EvidenceIssue(
                    pointer=f"/rows/{row.path}/reuse/priorBlobSha256",
                    message="source identity changed since reuse was recorded; reuse is invalidated",
                    expected=row.blob_sha256,
                    observed=prior_blob,
                )
            )

        # F3 continued: chain-of-custody against real, independently
        # readable bytes -- never just re-asserted prose in this document.
        if not prior_path:
            issues.append(
                EvidenceIssue(
                    pointer=f"/rows/{row.path}/reuse/priorArtifactPath",
                    message=(
                        "reuse binding has no priorArtifactPath locator; a bare "
                        "priorArtifactSha256 digest is not independently verifiable "
                        "against real bytes"
                    ),
                )
            )
        elif repo_root is not None and prior_digest:
            try:
                if prior_path not in prior_paths:
                    prior_paths[prior_path] = resolve_contained_path(repo_root, prior_path)
                resolved_prior = prior_paths[prior_path]
            except EvidenceReadinessError as exc:
                issues.append(
                    EvidenceIssue(
                        pointer=f"/rows/{row.path}/reuse/priorArtifactPath",
                        message=str(exc),
                    )
                )
                resolved_prior = None
            if resolved_prior is not None:
                if resolved_prior not in prior_cache and not resolved_prior.is_file():
                    issues.append(
                        EvidenceIssue(
                            pointer=f"/rows/{row.path}/reuse/priorArtifactPath",
                            message="priorArtifactPath does not resolve to a real, readable prior artifact",
                            observed=prior_path,
                        )
                    )
                else:
                    try:
                        if resolved_prior not in prior_cache:
                            prior_bytes = resolved_prior.read_bytes()
                            sections = binding_sections(prior_bytes.decode("utf-8"))
                            matches = [section for section in sections
                                if (source_root is None or parse_binding_fields(section).get("sourceRoot") == source_root)
                                and (source_pin is None or parse_binding_fields(section).get("sourcePin") == source_pin)]
                            section = matches[0] if len(matches) == 1 else ""
                            fields = parse_binding_fields(section)
                            prior_rows, errors = build_rows(parse_binding_rows(section))
                            by_path: dict[str, list[EvidenceRow]] = {}
                            for prior_row in prior_rows:
                                by_path.setdefault(prior_row.path, []).append(prior_row)
                            prior_cache[resolved_prior] = (hashlib.sha256(prior_bytes).hexdigest(), fields, by_path, errors)
                        actual_prior_digest, fields, by_path, errors = prior_cache[resolved_prior]
                    except (OSError, UnicodeError, EvidenceReadinessError) as exc:
                        issues.append(EvidenceIssue(pointer=f"/rows/{row.path}/reuse", message=f"cannot read prior evidence: {exc}"))
                        continue
                    if actual_prior_digest.lower() != prior_digest.lower():
                        issues.append(
                            EvidenceIssue(
                                pointer=f"/rows/{row.path}/reuse/priorArtifactSha256",
                                message=(
                                    "priorArtifactSha256 does not match the real bytes at "
                                    "priorArtifactPath -- fabricated or stale reuse-chain digest"
                                ),
                                expected=actual_prior_digest,
                                observed=prior_digest,
                            )
                        )
                    candidates = by_path.get(row.path, [])
                    valid = not errors and not fields.get("__duplicateFields") and fields.get(BINDING_SCHEMA_FIELD) == BINDING_SCHEMA_VALUE
                    valid = valid and (source_root is None or fields.get("sourceRoot") == source_root)
                    valid = valid and (source_pin is None or fields.get("sourcePin") == source_pin)
                    if len(candidates) != 1:
                        valid = False
                    else:
                        prior_row = candidates[0]
                        valid = valid and prior_row.status == "READ" and prior_row.covers_full()
                        valid = valid and not validate_row_bounds((prior_row,))
                        valid = valid and prior_row.blob_sha256 == row.blob_sha256 and prior_row.line_count == row.line_count
                    if not valid:
                        issues.append(EvidenceIssue(
                            pointer=f"/rows/{row.path}/reuse",
                            message="prior artifact must contain one full READ row with matching schema, source root/pin, path, blob and line count; reference the original READ receipt",
                        ))
    return issues


def validate_no_current_placeholders(binding_fields: dict[str, str], rows: tuple[EvidenceRow, ...]) -> list[EvidenceIssue]:
    """Reject current readiness placeholders while historical fail/fix
    entries recorded as prose stay valid (requirement 5). Only scans the
    structured binding fields/rows, never the whole document, so this never
    trips on unrelated historical narrative elsewhere in the return."""

    issues: list[EvidenceIssue] = []
    for key, value in binding_fields.items():
        for token in CURRENT_PLACEHOLDER_TOKENS:
            if token in value:
                issues.append(
                    EvidenceIssue(
                        pointer=f"/binding/{key}",
                        message="unresolved current readiness placeholder in evidence binding field",
                        observed=token,
                    )
                )
    for row in rows:
        for field_name, value in row.items():
            for token in CURRENT_PLACEHOLDER_TOKENS:
                if token in value:
                    issues.append(
                        EvidenceIssue(
                            pointer=f"/rows/{row.get('path', '?')}/{field_name}",
                            message="unresolved current readiness placeholder in evidence row",
                            observed=token,
                        )
                    )
    return issues


def validate_digest_binding(
    binding_fields: dict[str, str], audit_bytes: bytes | None
) -> list[EvidenceIssue]:
    """Audit content digest must match the structured return binding
    (requirement: Evidence projection). One-directional: the finalized
    audit JSON hashes into the Markdown binding, never the reverse
    (requirement 5's self-hash-cycle avoidance)."""

    issues: list[EvidenceIssue] = []
    declared = binding_fields.get("auditSha256", "")
    if not declared:
        issues.append(EvidenceIssue(pointer="/binding/auditSha256", message="missing audit digest binding"))
        return issues
    if audit_bytes is None:
        issues.append(
            EvidenceIssue(
                pointer="/binding/auditPath",
                message="bound audit artifact could not be read for digest verification",
            )
        )
        return issues
    actual = hashlib.sha256(audit_bytes).hexdigest()
    if actual != declared.lower():
        issues.append(
            EvidenceIssue(
                pointer="/binding/auditSha256",
                message="stale digest: bound audit digest does not match the current audit artifact bytes",
                expected=actual,
                observed=declared,
            )
        )
    return issues


def validate_audit_json_structure(
    binding_fields: dict[str, str], audit_bytes: bytes | None, rows: tuple[EvidenceRow, ...]
) -> list[EvidenceIssue]:
    """Parse the bound audit artifact bytes with `parse_strict_json` (F2):
    a non-JSON or duplicate-key audit must produce an issue, not merely be
    hashed as opaque bytes. When the audit JSON structurally declares a
    plausible count field, cross-check it against the binding's row-derived
    counts (requirement: 'current counts agree')."""

    issues: list[EvidenceIssue] = []
    if audit_bytes is None:
        return issues
    audit_path = binding_fields.get("auditPath", "?")
    try:
        text = audit_bytes.decode("utf-8")
    except UnicodeDecodeError as exc:
        issues.append(
            EvidenceIssue(
                pointer="/binding/auditPath",
                message=f"bound audit artifact is not valid UTF-8 text: {exc}",
            )
        )
        return issues
    try:
        parsed = parse_strict_json(text, source_label=f"audit artifact `{audit_path}`")
    except EvidenceReadinessError as exc:
        issues.append(EvidenceIssue(pointer="/binding/auditPath", message=str(exc)))
        return issues

    if not isinstance(parsed, dict):
        return [EvidenceIssue(pointer="/audit", message="audit JSON must be an object")]
    if "schemaVersion" in parsed and parsed["schemaVersion"] != "cvf.evidenceAudit.v1":
        issues.append(EvidenceIssue(pointer="/audit/schemaVersion", message="unknown evidence audit schema", observed=str(parsed["schemaVersion"])))

    # Cross-check any structurally declared count-shaped field against the
    # binding's own row-derived counts, without hard-coding a QM-specific
    # field name (requirement 4). Only fields that are both present and an
    # int are considered; a mismatch is reported, a missing/unrecognized
    # field is not an error (the audit schema is not standardized).
    read_count = sum(1 for r in rows if r.status == "READ")
    reused_count = sum(1 for r in rows if r.status == "REUSED")
    excluded_count = sum(1 for r in rows if r.status == "EXCLUDED")
    total_count = len(rows)
    known_count_fields = {
        "readCount": read_count,
        "reusedCount": reused_count,
        "excludedCount": excluded_count,
        "totalCount": total_count,
        "targetCount": total_count,
        "candidateCount": total_count,
    }
    for field_name, expected_value in known_count_fields.items():
        if field_name not in parsed:
            continue
        declared_value = parsed[field_name]
        if isinstance(declared_value, bool) or not isinstance(declared_value, int):
            issues.append(EvidenceIssue(pointer=f"/audit/{field_name}", message="count must be an integer", observed=repr(declared_value)))
            continue
        if declared_value != expected_value:
            issues.append(
                EvidenceIssue(
                    pointer=f"/binding/auditPath#/{field_name}",
                    message="audit JSON structurally declared count does not match current binding row counts",
                    expected=str(expected_value),
                    observed=str(declared_value),
                )
            )
    return issues


def validate_required_binding_fields(binding_fields: dict[str, str]) -> list[EvidenceIssue]:
    issues: list[EvidenceIssue] = []
    if binding_fields.get("__duplicateFields"):
        issues.append(EvidenceIssue(pointer="/binding", message="duplicate binding fields", observed=binding_fields["__duplicateFields"]))
    for name in REQUIRED_BINDING_FIELDS:
        if not binding_fields.get(name):
            issues.append(EvidenceIssue(pointer=f"/binding/{name}", message="missing required evidence-binding field"))
    schema = binding_fields.get(BINDING_SCHEMA_FIELD, "")
    if schema and schema != BINDING_SCHEMA_VALUE:
        issues.append(
            EvidenceIssue(
                pointer=f"/binding/{BINDING_SCHEMA_FIELD}",
                message="unrecognized evidence-binding schema version",
                expected=BINDING_SCHEMA_VALUE,
                observed=schema,
            )
        )
    return issues


def validate_binding_path_safety(binding_fields: dict[str, str], repo_root: Path) -> list[EvidenceIssue]:
    """Every filesystem-path-shaped binding field must pass the same
    normalize/containment/symlink check as row and manifest paths (F2).
    Previously only manifest *rows* were checked; the binding fields
    themselves (`auditPath`, `discoveryManifestPath`, `sourceRoot`) were
    joined to `repo_root` with no safety check at all."""

    issues: list[EvidenceIssue] = []
    for field_name in PATH_VALUED_BINDING_FIELDS:
        value = binding_fields.get(field_name, "")
        if not value or value.upper() in {"N/A", "NONE"} or "N/A_WITH_REASON" in value.upper():
            continue
        try:
            resolve_contained_path(repo_root, value)
        except EvidenceReadinessError as exc:
            issues.append(EvidenceIssue(pointer=f"/binding/{field_name}", message=str(exc)))
    return issues


# --- Row construction from parsed table cells ------------------------------


def build_rows(raw_rows: list[dict[str, str]]) -> tuple[tuple[EvidenceRow, ...], list[EvidenceIssue]]:
    rows: list[EvidenceRow] = []
    issues: list[EvidenceIssue] = []
    for raw in raw_rows:
        try:
            path = normalize_source_relative_path(raw.get("path", ""))
        except EvidenceReadinessError as exc:
            issues.append(EvidenceIssue(pointer="/rows/?/path", message=str(exc)))
            continue
        status = raw.get("status", "").strip().upper()
        line_count_raw = raw.get("lineCount", "0").strip()
        try:
            line_count = int(line_count_raw)
        except ValueError:
            issues.append(
                EvidenceIssue(pointer=f"/rows/{path}/lineCount", message="line count is not an integer", observed=line_count_raw)
            )
            line_count = 0
        try:
            spans = parse_read_spans(raw.get("readSpans", ""))
        except EvidenceReadinessError as exc:
            issues.append(EvidenceIssue(pointer=f"/rows/{path}/readSpans", message=str(exc)))
            spans = ()
        rows.append(
            EvidenceRow(
                path=path,
                blob_sha256=raw.get("blobSha256", "").strip(),
                line_count=line_count,
                read_spans=spans,
                status=status,
            )
        )
    return tuple(rows), issues


# --- Top-level entry point ---------------------------------------------------


def _looks_like_na(value: str) -> bool:
    """True if `value` is an N/A-shaped placeholder (e.g. `N/A`,
    `N/A_WITH_REASON: ...`, empty). Used to decide whether `sourcePin` is a
    legitimate non-pin rather than as a blanket bypass (F1 continued)."""

    if not value:
        return True
    upper = value.upper()
    return "N/A" in upper or upper in {"NONE", "NOT_APPLICABLE"}


def _default_resolver_for(source_pin: str, repo_root: Path) -> Any:
    """Choose Git vs. snapshot resolution automatically: a pin that looks
    like a Git ref/commit (hex sha or symbolic ref such as HEAD) uses
    `GitBatchResolver`; anything else falls back to `SnapshotResolver` for
    non-Git local projects (requirement 2)."""

    if re.fullmatch(r"[0-9a-fA-F]{7,40}", source_pin) or source_pin in {"HEAD"} or source_pin.startswith("refs/"):
        return GitBatchResolver(repo_root=repo_root)
    return SnapshotResolver(repo_root=repo_root)


def _evaluate_binding(
    *,
    return_text: str,
    work_order_text: str,
    repo_root: Path,
    audit_bytes_resolver: "Callable[[str], bytes | None] | None" = None,
    source_resolver: Any = None,
) -> EvidenceReadinessResult:
    """Evaluate one worker-return's evidence-readiness binding.

    `audit_bytes_resolver` is an optional callable `(path: str) -> bytes |
    None` used to read the bound audit artifact's current bytes for digest
    verification; defaults to a plain repo-relative file read. Injectable so
    tests and the bounded resolver can avoid redundant reads within one run.

    `source_resolver` is an optional object exposing
    `resolve_blob_shas(source_root, pin, paths) -> {path: sha_or_None}`
    (the shape shared by `GitBatchResolver` and `SnapshotResolver`). When
    omitted, one is chosen automatically from `sourcePin`'s shape (F1 fix:
    this is what actually wires real source-identity resolution into the
    real entrypoint; previously nothing in this function ever constructed
    or called a resolver).
    """

    if not declares_evidence_readiness_contract(work_order_text):
        return EvidenceReadinessResult(applicable=False)

    binding_section = _section(return_text, EVIDENCE_BINDING_HEADING)
    issues: list[EvidenceIssue] = []
    if not binding_section:
        issues.append(
            EvidenceIssue(
                pointer="/",
                message=f"dispatch work order requires an evidence-readiness contract but the return lacks `{EVIDENCE_BINDING_HEADING}`",
            )
        )
        return EvidenceReadinessResult(applicable=True, issues=tuple(issues))

    binding_fields = parse_binding_fields(binding_section)
    issues.extend(validate_required_binding_fields(binding_fields))
    issues.extend(validate_binding_path_safety(binding_fields, repo_root))

    raw_rows = parse_binding_rows(binding_section)
    rows, row_build_issues = build_rows(raw_rows)
    issues.extend(row_build_issues)
    issues.extend(validate_row_bounds(rows))
    issues.extend(validate_no_current_placeholders(binding_fields, [dict(r) for r in raw_rows]))

    manifest_path = binding_fields.get("discoveryManifestPath", "")
    declared_candidates: tuple[str, ...] = ()
    if manifest_path:
        try:
            manifest_full = resolve_contained_path(repo_root, manifest_path)
            manifest_text = manifest_full.read_text(encoding="utf-8", errors="replace") if manifest_full.is_file() else ""
        except (OSError, EvidenceReadinessError):
            manifest_text = ""
        if not manifest_text:
            issues.append(
                EvidenceIssue(
                    pointer="/binding/discoveryManifestPath",
                    message="declared discovery manifest could not be read",
                    observed=manifest_path,
                )
            )
        else:
            try:
                declared_candidates = tuple(parse_discovery_manifest_rows(manifest_text))
            except EvidenceReadinessError as exc:
                issues.append(EvidenceIssue(pointer="/binding/discoveryManifestPath", message=str(exc)))
                declared_candidates = ()
            issues.extend(reconcile_candidate_set(declared_candidates, rows))

    # F3 fix: reuse bindings now come from the dedicated, unambiguous
    # `### Reuse Bindings` sub-table, never the bare-identifier scalar
    # field-line parser (which could never match a dotted/slashed key).
    reuse_fields = parse_reuse_rows(binding_section)
    issues.extend(
        validate_reuse_bindings(
            rows,
            reuse_fields,
            current_audit_sha256=binding_fields.get("auditSha256", ""),
            repo_root=repo_root,
            source_root=binding_fields.get("sourceRoot", ""),
            source_pin=binding_fields.get("sourcePin", ""),
        )
    )

    audit_path = binding_fields.get("auditPath", "")
    audit_bytes: bytes | None = None
    if audit_path:
        if audit_bytes_resolver is not None:
            audit_bytes = audit_bytes_resolver(audit_path)
        else:
            try:
                full = resolve_contained_path(repo_root, audit_path)
            except EvidenceReadinessError as exc:
                issues.append(EvidenceIssue(pointer="/binding/auditPath", message=str(exc)))
                full = None
            audit_bytes = full.read_bytes() if full is not None and full.is_file() else None
        issues.extend(validate_digest_binding(binding_fields, audit_bytes))
        issues.extend(validate_audit_json_structure(binding_fields, audit_bytes, rows))

    # F1 fix: actually resolve every non-excluded row's claimed source
    # identity (blobSha256) against Git or a bounded snapshot resolver for
    # the declared sourceRoot/sourcePin. This is the check that was
    # entirely absent from the real entrypoint before this rework -- a
    # fixture with a nonexistent source path, a fabricated pin, and a
    # fabricated digest previously passed clean because nothing here ever
    # called a resolver at all.
    source_root = binding_fields.get("sourceRoot", "")
    source_pin = binding_fields.get("sourcePin", "")
    source_pin_is_na = _looks_like_na(source_pin)

    # Rows that claim real evidence: a non-empty blobSha256, or a status of
    # READ/REUSED (both of which are meaningless without a real source
    # identity). EXCLUDED rows never claim evidence and are exempt.
    rows_claiming_evidence = tuple(
        row for row in rows if row.status in ("READ", "REUSED") or row.blob_sha256
    )

    if source_pin_is_na:
        # F1 continued: `sourcePin: N/A` (or any N/A-shaped value) is only a
        # legitimate skip when the binding has NO rows requiring source
        # verification in the first place. A binding with real READ/REUSED
        # rows or a populated blobSha256 cannot legitimately declare an N/A
        # pin and expect that evidence to go unverified -- requirement 2
        # requires an immutable Git blob or exact snapshot pin for any row
        # claiming real evidence. This closes the escape hatch a dishonest
        # worker could previously use to bypass F1 entirely by writing
        # `sourcePin: N/A`.
        if rows_claiming_evidence:
            issues.append(
                EvidenceIssue(
                    pointer="/binding/sourcePin",
                    message=(
                        "sourcePin is N/A-shaped but the binding has rows claiming real evidence "
                        "(READ/REUSED status or a populated blobSha256); an N/A pin is not an "
                        "immutable source identity and cannot exempt those rows from source "
                        "verification"
                    ),
                    expected="an immutable Git ref/sha or exact snapshot pin",
                    observed=source_pin,
                )
            )
    elif source_pin == "HEAD" or source_pin.startswith("refs/") or re.fullmatch(r"[0-9a-fA-F]{7,39}", source_pin):
        issues.append(EvidenceIssue(pointer="/binding/sourcePin", message="Git pin must be a full immutable object ID"))
    elif rows and source_pin and "TO_FILL" not in source_pin.upper():
        resolver = source_resolver if source_resolver is not None else _default_resolver_for(source_pin, repo_root)
        issues.extend(
            validate_source_identity(rows, source_root=source_root, source_pin=source_pin, resolver=resolver)
        )

    return EvidenceReadinessResult(
        applicable=True,
        issues=tuple(issues),
        row_count=len(rows),
        candidate_count=len(declared_candidates),
    )


def binding_sections(text: str) -> list[str]:
    return [_section(text[m.start():], EVIDENCE_BINDING_HEADING)
            for m in re.finditer(r"(?m)^## Evidence Readiness Binding[ \t]*$", text)]


def evaluate_worker_return(*, return_text: str, work_order_text: str, repo_root: Path,
                           audit_bytes_resolver=None, source_resolver=None,
                           source_resolver_factory=None) -> EvidenceReadinessResult:
    """Evaluate each source-scoped binding; every row belongs to its section.

    Multiple roots use repeated binding sections, each with its own manifest
    and audit projection. Reuse a resolver and artifact bytes within this call.
    """
    if not declares_evidence_readiness_contract(work_order_text):
        return EvidenceReadinessResult(applicable=False)
    sections = binding_sections(return_text) or [return_text]
    resolvers, byte_cache, results = {}, {}, []
    def read_bytes(path):
        if path not in byte_cache:
            if audit_bytes_resolver is not None:
                byte_cache[path] = audit_bytes_resolver(path)
            else:
                try:
                    byte_cache[path] = resolve_contained_path(repo_root, path).read_bytes()
                except (OSError, EvidenceReadinessError):
                    byte_cache[path] = None
        return byte_cache[path]
    for section in sections:
        fields = parse_binding_fields(section)
        key = (fields.get("sourceRoot", ""), fields.get("sourcePin", ""))
        if key not in resolvers:
            resolvers[key] = (source_resolver_factory(*key) if source_resolver_factory else
                              source_resolver or _default_resolver_for(key[1], repo_root))
        results.append(_evaluate_binding(return_text=section, work_order_text=work_order_text,
            repo_root=repo_root, audit_bytes_resolver=read_bytes, source_resolver=resolvers[key]))
    issues = tuple(EvidenceIssue(pointer=(f"/bindings/{i}" if len(results) > 1 else "") + issue.pointer,
        message=issue.message, expected=issue.expected, observed=issue.observed)
        for i, result in enumerate(results) for issue in result.issues)
    return EvidenceReadinessResult(applicable=True, issues=issues,
        row_count=sum(r.row_count for r in results), candidate_count=sum(r.candidate_count for r in results),
        git_calls=sum(r.call_count for r in resolvers.values() if isinstance(r, GitBatchResolver)))
