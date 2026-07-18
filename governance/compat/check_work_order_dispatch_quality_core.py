#!/usr/bin/env python3
"""Core helpers and shared dispatch-quality validators.

Loaded by check_work_order_dispatch_quality.py into its module globals.
"""

from __future__ import annotations

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


def _ref_exists(ref: str) -> bool:
    code, _, _ = _run_git(["rev-parse", "--verify", "--quiet", f"{ref}^{{commit}}"])
    return code == 0


def _discover_default_base(head: str) -> tuple[str, str]:
    env_base = os.getenv("CVF_COMPAT_BASE")
    if env_base:
        return env_base, "env:CVF_COMPAT_BASE"
    for ref in DEFAULT_BASE_CANDIDATES:
        if not _ref_exists(ref):
            continue
        code, out, _ = _run_git(["merge-base", ref, head])
        if code == 0 and out:
            return out, f"merge-base({ref},{head})"
    return "HEAD~1", "fallback:HEAD~1"


def _resolve_range(base: str | None, head: str | None) -> tuple[str, str, str]:
    resolved_head = head or "HEAD"
    if base:
        return base, resolved_head, "explicit:--base"
    resolved_base, source = _discover_default_base(resolved_head)
    return resolved_base, resolved_head, source


def _parse_name_status(output: str) -> dict[str, set[str]]:
    changed: dict[str, set[str]] = {}
    for raw_line in output.splitlines():
        parts = raw_line.split("\t")
        if len(parts) < 2:
            continue
        status = parts[0].strip()
        path = parts[2] if (status.startswith("R") or status.startswith("C")) and len(parts) > 2 else parts[1]
        normalized = path.replace("\\", "/").strip()
        changed.setdefault(normalized, set()).add(status)
    return changed


def _get_changed(base: str, head: str) -> dict[str, set[str]]:
    changed: dict[str, set[str]] = {}
    code, out, err = _run_git(["diff", "--name-status", f"{base}..{head}"])
    if code != 0:
        raise RuntimeError(f"git diff failed for range {base}..{head}: {err or out}")
    for path, statuses in _parse_name_status(out).items():
        changed.setdefault(path, set()).update(statuses)
    for args in (["diff", "--name-status"], ["diff", "--name-status", "--cached"]):
        code, out, _ = _run_git(args)
        if code == 0 and out:
            for path, statuses in _parse_name_status(out).items():
                changed.setdefault(path, set()).update(statuses)
    code, out, _ = _run_git(["ls-files", "--others", "--exclude-standard"])
    if code == 0 and out:
        for raw_line in out.splitlines():
            normalized = raw_line.replace("\\", "/").strip()
            if normalized:
                changed.setdefault(normalized, set()).add("A")
    return changed


def _read_rel(path: str) -> str:
    full = REPO_ROOT / path
    if not full.exists() or full.is_dir():
        return ""
    return full.read_text(encoding="utf-8")


def _read_rel_at(ref: str, path: str) -> str:
    normalized = path.replace("\\", "/")
    code, out, _ = _run_git(["show", f"{ref}:{normalized}"])
    return out if code == 0 else ""


def _exists_rel(path: str) -> bool:
    normalized = path.strip().strip("`").replace("\\", "/").rstrip(".,;:")
    return bool(normalized) and (REPO_ROOT / normalized).exists()


def _commit_contains_path(ref: str, path: str) -> bool:
    normalized = path.strip().strip("`").replace("\\", "/").rstrip(".,;:")
    if not normalized:
        return False
    code, _, _ = _run_git(["cat-file", "-e", f"{ref}:{normalized}"])
    return code == 0


def _validate_mandatory_remediation_escalation(text: str, artifact_label: str) -> list[str]:
    issues: list[str] = []
    context = (
        r"guard|gate|autorun|pre-dispatch|pre-implementation|pre-closure|pre-push|"
        r"check_work_order_dispatch_quality|check_active_session_state|"
        r"Source Verification|closure residue|allowed scope|Finding-To-Governance|"
        r"N/A with reason|runtime/provider/cost"
    )
    preference = (
        r"do you want|would you like|should I|may I|operator checkpoint|"
        r"operator approval|ask(?:ed)? operator|waiting for operator|pending operator|"
        "\u0062\u1ea1n mu\u1ed1n|ban muon|c\u00f3 mu\u1ed1n|co muon|"
        "t\u00f4i c\u00f3 n\u00ean|toi co nen|"
        "ch\u1edd operator|cho operator"
    )
    repair = (
        r"fix|repair|correct|resolve|rerun|re-run|add|update|adjust|clean|"
        "s\u1eeda|sua|ch\u1ec9nh|chinh|th\u00eam|them|"
        "ch\u1ea1y l\u1ea1i|chay lai"
    )
    patterns = (
        rf"(?is)\b(?:{preference})\b[\s\S]{{0,220}}\b(?:{repair})\b[\s\S]{{0,220}}\b(?:{context})\b",
        rf"(?is)\b(?:{context})\b[\s\S]{{0,220}}\b(?:{preference})\b[\s\S]{{0,220}}\b(?:{repair})\b",
        rf"(?is)\b(?:{repair})\b[\s\S]{{0,220}}\b(?:{context})\b[\s\S]{{0,220}}\b(?:{preference})\b",
    )
    for pattern in patterns:
        if re.search(pattern, text):
            issues.append(
                f"{artifact_label} treats mandatory allowed-scope gate remediation as an operator preference; "
                "repair machine-gate failures inside Allowed scope instead of asking the operator"
            )
            break
    return issues
def _extract_wave_id(path: str, text: str) -> int | None:
    # Wave ID must come from the filename, not the body -- roadmaps that merely
    # reference LHW waves in their prose must not be mis-classified as LHW connector
    # waves. Only the file path is authoritative for wave identity.
    match = LHW_RE.search(path)
    return int(match.group(1)) if match else None


def _extract_wave_ids_from_path(path: str) -> set[int]:
    return {int(match.group(1)) for match in LHW_RE.finditer(path)}


def _is_connector_wave(path: str, text: str) -> bool:
    wave_id = _extract_wave_id(path, text)
    return wave_id is not None and wave_id >= 6


def _has_gc018_for_wave(wave_id: int) -> bool:
    baseline_root = REPO_ROOT / "docs" / "baselines"
    if not baseline_root.exists():
        return False
    wave = f"LHW{wave_id}".upper()
    for path in baseline_root.rglob("*.md"):
        name = path.name.upper()
        if wave in name and re.search(r"GC[-_]?018", name):
            return True
    return False


def _extract_paths(text: str) -> list[str]:
    paths = []
    for path_pattern in (PATH_RE, ROOT_GOVERNANCE_PATH_RE):
        for match in path_pattern.finditer(text):
            path = (match.group(1) or match.group(2)).replace("\\", "/").rstrip(".,;:")
            if "*" in path or "<" in path or ">" in path:
                continue
            paths.append(path)
    return paths


def _extract_completion_review_paths(text: str) -> list[str]:
    """Extract only paths from the work order's own completionReviewPath field.

    Authority-chain references to prior completion artifacts are evidence for
    dependency release, not proof that the current work order is stale.
    """
    lines = text.splitlines()
    paths: list[str] = []
    for index, line in enumerate(lines):
        if not re.match(r"^\s*completionReviewPath\s*:", line):
            continue
        window = [line]
        for follow in lines[index + 1 : index + 4]:
            if not follow.strip():
                break
            if re.match(r"^\s*[A-Za-z][A-Za-z0-9 _/-]*\s*:", follow):
                break
            window.append(follow)
        paths.extend(_extract_paths("\n".join(window)))
    return paths


# _extract_section imported from check_work_order_dispatch_quality_tables (GFS-PY T1)


def _requires_legacy_coverage_index_disposition(text: str) -> bool:
    return bool(LEGACY_COVERAGE_SCOPE_RE.search(text) and LEGACY_ADJACENT_RE.search(text))


def _validate_legacy_coverage_index_disposition(text: str) -> list[str]:
    if not _requires_legacy_coverage_index_disposition(text):
        return []

    section = _extract_section(text, LEGACY_COVERAGE_DISPOSITION_MARKER)
    if not section:
        return [
            "legacy-adjacent foundation/workflow-chain work order lacks "
            f"`## {LEGACY_COVERAGE_DISPOSITION_MARKER}` with coverage-index row evidence "
            "or `NOT_APPLICABLE_WITH_REASON`"
        ]

    if LEGACY_COVERAGE_NOT_APPLICABLE_RE.search(section):
        return []

    issues: list[str] = []
    if LEGACY_COVERAGE_INDEX_PATH not in section:
        issues.append(
            f"`## {LEGACY_COVERAGE_DISPOSITION_MARKER}` must cite "
            f"`{LEGACY_COVERAGE_INDEX_PATH}` or record `NOT_APPLICABLE_WITH_REASON`"
        )
    if LEGACY_COVERAGE_INDEX_PATH in section and not LEGACY_COVERAGE_ROW_RE.search(section):
        issues.append(
            f"`## {LEGACY_COVERAGE_DISPOSITION_MARKER}` cites the legacy coverage index "
            "but does not name a stable row id"
        )
    return issues


def _is_protected_authorization_path(path: str) -> bool:
    """Mirror check_core_guard_self_protection._is_protected.

    Protected = governance/compat/*.py checkers, CVF_SESSION/** JSON state,
    CVF_SESSION_MEMORY.md, and AGENT_HANDOFF*.md handoffs. Kept in sync with the
    core-guard self-protection gate so dispatch and closure agree on what
    requires a Core Guard Self-Protection Authorization carrier.
    """
    normalized = path.replace("\\", "/").strip()
    if normalized in {"CVF_SESSION_MEMORY.md"}:
        return True
    if re.match(r"^AGENT_HANDOFF[^/]*\.md$", normalized):
        return True
    if normalized.startswith("governance/compat/") and normalized.endswith(".py"):
        return True
    if normalized.startswith("CVF_SESSION/") and normalized.endswith(".json"):
        return True
    return False


def _validate_protected_path_authorization_carrier(text: str) -> list[str]:
    """Require a Core Guard Self-Protection Authorization carrier when a work
    order authorizes the worker to create or modify a protected path.

    Closes the DIR-T1 ORCHESTRATOR_PACKET_GAP learning: authorizing a
    governance/compat checker or CVF_SESSION/handoff file in scope without the
    authorization carrier forces the worker to synthesize one mid-task. The
    required tokens match check_core_guard_self_protection so dispatch and the
    closure-time core-guard gate share one vocabulary.
    """
    issues: list[str] = []
    scope_text = "\n".join(
        [
            _extract_allowed_scope_text(text),
            _extract_section(text, "Allowed Implementation Scope"),
            _extract_section(text, "New Files To Create"),
            _extract_section(text, "New Source And Test"),
            _extract_section(text, "Write Ownership"),
            _extract_section(text, "Authorized Artifact Set"),
        ]
    )
    forbidden_text = "\n".join(
        [
            _extract_forbidden_scope_text(text),
            _extract_section(text, "Forbidden Path Manifest"),
        ]
    )
    forbidden_paths = set(_extract_paths(forbidden_text))

    authorized_protected = sorted(
        {
            p
            for p in _extract_paths(scope_text)
            if _is_protected_authorization_path(p) and p not in forbidden_paths
        }
    )
    if not authorized_protected:
        return issues

    if "Core Guard Self-Protection Authorization" not in text:
        sample = ", ".join(authorized_protected[:5])
        issues.append(
            "work order authorizes protected path(s) "
            f"({sample}) without a `Core Guard Self-Protection Authorization` "
            "block; add the carrier per template section 7A"
        )
        return issues

    required_tokens = (
        "Authorized guard-maintenance scope",
        "Protected paths",
        "Operator authorization",
        "Rollback boundary",
    )
    missing = [token for token in required_tokens if token not in text]
    if missing:
        issues.append(
            "Core Guard Self-Protection Authorization block is missing required "
            f"field(s): {', '.join(missing)}"
        )

    carrier_section = _extract_section(text, "Core Guard Self-Protection Authorization")
    # Each authorized protected path must be named in the carrier's Protected
    # paths list.
    carrier_paths = set(_extract_paths(carrier_section))
    unlisted = [p for p in authorized_protected if p not in carrier_paths]
    if unlisted and "Protected paths" not in missing:
        sample = ", ".join(unlisted[:5])
        issues.append(
            "Core Guard Self-Protection Authorization `Protected paths` list does "
            f"not name every authorized protected path; missing: {sample}"
        )
    return issues


def _has_trace_matrix(text: str) -> bool:
    return re.search(r"Roadmap[- ]To[- ]Work[- ]Order Trace Matrix", text, re.IGNORECASE) is not None


def _has_worker_autonomy_clause(text: str) -> bool:
    return re.search(r"Worker Autonomy\s*/\s*No-Question Rule", text, re.IGNORECASE) is not None


def _validate_commit_mode_and_anchor_lifecycle(text: str) -> list[str]:
    issues: list[str] = []
    mode_match = re.search(
        r"(?im)^\s*(?:[-*]\s*)?Commit mode:\s*`?([A-Z_]+)`?\s*$",
        text,
    )
    if not mode_match:
        issues.append(
            "dispatch/ready work order lacks explicit `Commit mode: "
            "WORKER_MAY_COMMIT | WORKER_MUST_NOT_COMMIT`"
        )
    elif mode_match.group(1) not in ALLOWED_COMMIT_MODES:
        issues.append(
            "dispatch/ready work order has invalid commit mode "
            f"`{mode_match.group(1)}`; use WORKER_MAY_COMMIT or WORKER_MUST_NOT_COMMIT"
        )

    missing_anchors = [
        anchor
        for anchor in ("dispatchBaseHead", "executionBaseHead", "closureBaseHead")
        if anchor not in text
    ]
    if missing_anchors:
        issues.append(
            "dispatch/ready work order lacks base-anchor lifecycle marker(s): "
            + ", ".join(missing_anchors)
        )
    dispatch_base_match = re.search(
        r"(?im)^\s*(?:[-*]\s*)?dispatchBaseHead:\s*`?([^`\n]+?)`?\s*$",
        text,
    )
    if dispatch_base_match:
        dispatch_base = dispatch_base_match.group(1).strip()
        if not re.fullmatch(r"[0-9a-f]{6,40}", dispatch_base, re.IGNORECASE):
            issues.append(
                "dispatch/ready work order has non-commit `dispatchBaseHead`; "
                "the orchestrator must set a real git commit hash before dispatch"
            )
    return issues


def _is_worker_must_not_commit(text: str) -> bool:
    return (
        re.search(
            r"(?im)^\s*(?:[-*]\s*)?Commit mode:\s*`?WORKER_MUST_NOT_COMMIT`?\s*$",
            text,
        )
        is not None
    )


def _completion_review_assigned_to_worker(text: str) -> bool:
    for line in text.splitlines():
        if "completion review" not in line.lower():
            continue
        if re.search(r"\|\s*(?:Worker|Executor)\s*\|[^|\n]*completion review", line, re.IGNORECASE):
            return True
        if re.search(r"completion review[^|\n]*\|\s*(?:Worker|Executor)\s*\|", line, re.IGNORECASE):
            return True
        if re.search(
            r"\b(?:worker|executor)\b[^.\n|]*(?:create|author|produce|write|file)[^.\n|]*completion review",
            line,
            re.IGNORECASE,
        ):
            return True
    return False


def _validate_worker_completion_review_boundary(text: str) -> list[str]:
    if not _is_worker_must_not_commit(text):
        return []
    if not _completion_review_assigned_to_worker(text):
        return []
    return [
        "WORKER_MUST_NOT_COMMIT dispatch assigns completion review to Worker; "
        "use a worker handoff/evaluation artifact and reviewer-owned completion review, "
        "or explicitly change role/commit mode before dispatch"
    ]


def _validate_no_commit_reviewer_closure_contract(text: str) -> list[str]:
    if not _is_worker_must_not_commit(text):
        return []

    issues: list[str] = []
    if re.search(r"Reviewer Closure Conversion", text, re.IGNORECASE) is None:
        issues.append(
            "WORKER_MUST_NOT_COMMIT dispatch lacks Reviewer Closure Conversion block"
        )
    if "completionReviewPath" not in text:
        issues.append(
            "WORKER_MUST_NOT_COMMIT dispatch lacks `completionReviewPath` for reviewer-owned closure"
        )
    if "reviewerOwnedClosurePaths" not in text:
        issues.append(
            "WORKER_MUST_NOT_COMMIT dispatch lacks `reviewerOwnedClosurePaths` for closure scope"
        )
    if "_COMPLETION_" not in text:
        issues.append(
            "WORKER_MUST_NOT_COMMIT dispatch lacks conventional `_COMPLETION_` reviewer artifact path"
        )
    if re.search(
        r"ACTIVE_SESSION_STATE\.json[\s\S]{0,160}(?:closure invariant|final invariant|source invariant)",
        text,
        re.IGNORECASE,
    ):
        issues.append(
            "WORKER_MUST_NOT_COMMIT dispatch treats mutable ACTIVE_SESSION_STATE.json as a closure invariant; "
            "cite stable completion/review artifacts for predecessor closure facts"
        )
    return issues


def _validate_worker_return_packet_shape_contract(text: str) -> list[str]:
    if not _is_worker_must_not_commit(text):
        return []

    section = _extract_section(text, WORKER_RETURN_PACKET_SHAPE_CONTRACT_MARKER)
    if not section:
        return [
            "WORKER_MUST_NOT_COMMIT dispatch lacks "
            f"`## {WORKER_RETURN_PACKET_SHAPE_CONTRACT_MARKER}`; "
            "pre-dispatch must give the worker the packet-shape sections needed "
            "to pass worker-return fast gate without reviewer repair"
        ]

    issues: list[str] = []
    if f"contractProfile: {WORKER_RETURN_FAST_DOC_PROFILE}" in section:
        required_terms = WORKER_RETURN_FAST_DOC_REQUIRED_TERMS
    else:
        required_terms = WORKER_RETURN_FULL_GATE_REQUIRED_TERMS
    for term in required_terms:
        if term not in section:
            issues.append(
                f"`## {WORKER_RETURN_PACKET_SHAPE_CONTRACT_MARKER}` missing required contract term `{term}`"
            )

    if re.search(r"(?im)^##\s+Verification Commands\s*$", text) is None:
        issues.append(
            "WORKER_MUST_NOT_COMMIT dispatch lacks `## Verification Commands` "
            "for worker-return fast gate evidence"
        )
    else:
        verification_section = _extract_section(text, "Verification Commands")
        if "run_worker_return_fast_gate.py" not in verification_section:
            issues.append(
                "`## Verification Commands` must include "
                "`python governance/compat/run_worker_return_fast_gate.py`"
            )

    if "individual checker" in section.lower() and "individualCheckerSubstitution: FORBIDDEN" not in section:
        issues.append(
            f"`## {WORKER_RETURN_PACKET_SHAPE_CONTRACT_MARKER}` must forbid "
            "substituting individual checker lists for the compact full-gate profile"
        )
    return issues


def _is_roadmap_derived(text: str) -> bool:
    return "docs/roadmaps/" in text or "roadmap-derived" in text.lower() or "Roadmap requirement" in text


# _parse_markdown_tables, _parse_any_markdown_tables, _normalize_table_key,
# _row_value, _section_tables, _truthy_cell, _clean_manifest_path
# imported from check_work_order_dispatch_quality_tables (GFS-PY T1)



def _required_proof_literal_issue(raw_literal: str) -> str | None:
    raw = raw_literal.strip()
    if not raw:
        return None
    spans = re.findall(r"`([^`]+)`", raw)
    if len(spans) > 1:
        return (
            "Required Proof Manifest row has multiple required literals in one "
            "cell; split the proof into one row per literal"
        )
    stripped = raw.strip("`").strip()
    if re.search(r"`\s*(?:and|or|,|;)\s*`", raw, re.IGNORECASE):
        return (
            "Required Proof Manifest row has compound literal syntax; split the "
            "proof into one row per literal"
        )
    if re.search(r"\s+(?:and|or)\s+", stripped, re.IGNORECASE) and re.search(
        r"`|[A-Z0-9_]{4,}", stripped
    ):
        return (
            "Required Proof Manifest literal appears compound; use an atomic "
            "literal row or record an explicit N/A with reason"
        )
    return None


def _validate_required_proof_manifest_atomic_literals(text: str) -> list[str]:
    issues: list[str] = []
    for table in _section_tables(text, "Required Proof Manifest"):
        for row in table:
            required = _truthy_cell(_row_value(row, "Required at handoff", "Required", "Must exist"))
            if not required:
                continue
            raw_literal = _row_value(row, "Required literal", "Literal", "Required token")
            issue = _required_proof_literal_issue(raw_literal)
            if issue and issue not in issues:
                issues.append(issue)
    return issues


def _path_matches_pattern(path: str, pattern: str) -> bool:
    normalized = path.replace("\\", "/").strip()
    clean_pattern = _clean_manifest_path(pattern).rstrip("/")
    if not clean_pattern:
        return False
    if any(marker in clean_pattern for marker in ("*", "?", "[")):
        return fnmatch.fnmatch(normalized, clean_pattern)
    return normalized == clean_pattern or normalized.startswith(f"{clean_pattern}/")


def _sync_source_validation_repo_root() -> None:
    source_validation.REPO_ROOT = REPO_ROOT


def _source_table_has_required_columns(text: str) -> bool:
    return source_validation._source_table_has_required_columns(text)


def _validate_source_verification_table_shape(text: str) -> list[str]:
    return source_validation._validate_source_verification_table_shape(text)


def _validate_ready_source_blockers(text: str) -> list[str]:
    return source_validation._validate_ready_source_blockers(text)


def _validate_source_verification_disposition_discipline(text: str) -> list[str]:
    return source_validation._validate_source_verification_disposition_discipline(text)


def _validate_accepted_source_rows(path: str, text: str) -> list[str]:
    _sync_source_validation_repo_root()
    return source_validation._validate_accepted_source_rows(path, text)


def _validate_negative_search_collision_discipline(
    path: str,
    text: str,
    artifact_label: str,
) -> list[str]:
    _sync_source_validation_repo_root()
    return source_validation._validate_negative_search_collision_discipline(path, text, artifact_label)
