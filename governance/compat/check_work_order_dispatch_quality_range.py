#!/usr/bin/env python3
"""Range-level dispatch-quality validators and classifier.

Loaded by check_work_order_dispatch_quality.py into its module globals.
"""

from __future__ import annotations

_DISPATCH_BASE_FIELD_RE = re.compile(
    r"(?im)^\s*(?:[-*]\s*)?Dispatch base head:\s*`?([0-9a-f]{6,40})`?\s*$"
)
_DISPATCH_BASE_HEAD_INLINE_RE = re.compile(
    r"(?i)\bdispatchBaseHead\s*[:=]\s*`?([0-9a-f]{6,40})`?"
)
_PRECLOSURE_COMMAND_RE = re.compile(
    r"(?im)^[^\n]*(?:run_agent_autorun_workflow_gate\.py[^\n]*--phase\s+pre-closure|"
    r"check_work_order_dispatch_quality\.py)[^\n]*$"
)
_COMMAND_BASE_ARG_RE = re.compile(r"--base\s+(\S+)")
_COMMAND_HEAD_ARG_RE = re.compile(r"--head\s+(\S+)")


def _extract_dispatch_base_values(text: str) -> set[str]:
    """Return every literal commit-hash value bound to this work order's
    dispatch base, from both the top-level `Dispatch base head:` field and
    any inline `dispatchBaseHead=<sha>` occurrence (for example inside a
    `baseHeadFor(phase)` table cell). Symbolic uses of the bare word
    `dispatchBaseHead` as a command argument are handled separately in
    `_validate_stale_preclosure_dispatch_base`, since that is not a literal
    hash value."""
    primary_values = {
        match.group(1).lower() for match in _DISPATCH_BASE_FIELD_RE.finditer(text)
    }
    if primary_values:
        return primary_values
    return {
        match.group(1).lower()
        for match in _DISPATCH_BASE_HEAD_INLINE_RE.finditer(text)
    }


def _validate_stale_preclosure_dispatch_base(text: str) -> list[str]:
    """Reject closure or dispatch-quality commands that reuse dispatch base with HEAD.

    A later continuity commit makes that range include non-worker changes; pending
    worker validation must start at executionBaseHead. Prose elsewhere is not scanned.
    """
    commands_section = _extract_section(text, "Verification Commands")
    if not commands_section:
        return []

    dispatch_base_values = _extract_dispatch_base_values(text)
    issues: list[str] = []
    for command_match in _PRECLOSURE_COMMAND_RE.finditer(commands_section):
        command = command_match.group(0)
        head_match = _COMMAND_HEAD_ARG_RE.search(command)
        if not head_match or head_match.group(1).strip("`") != "HEAD":
            continue
        base_match = _COMMAND_BASE_ARG_RE.search(command)
        if not base_match:
            continue
        base_value = base_match.group(1)
        stripped_base = base_value.strip("`")
        is_literal_reuse = stripped_base.lower() in dispatch_base_values
        is_symbolic_reuse = stripped_base.lower() in (
            "dispatchbasehead",
            "<dispatchbasehead>",
        )
        if is_literal_reuse or is_symbolic_reuse:
            issues.append(
                "`## Verification Commands` pins an executable closure/dispatch-quality "
                "command ending at `HEAD` to this work order's own dispatch base "
                f"(`{base_value}`); a later session-sync or continuity commit can make "
                "that range invalid as worker or closure proof (literal-format gotcha 12) - "
                "use `executionBaseHead` for pending worker validation or a distinct "
                "material/reviewer closure anchor for closure proof"
            )
            break
    return issues


_WORKER_RETURN_PATH_SCALAR_RE = re.compile(r"(?m)^\s*Worker return path:\s*(\S.*?)\s*$")
_WORKER_RETURN_PATH_FIELD_RE = re.compile(r"(?m)^\s*workerReturnPath:\s*(\S.*?)\s*$")
_REQUIRED_ARTIFACT_MANIFEST_HEADING_RE = re.compile(r"(?im)^##\s+Required Artifact Manifest\s*$")


def _validate_ready_manifest_and_return_binding(text: str) -> list[str]:
    """DRC-01/02: every ready no-commit order needs a parseable manifest and one agreeing return binding at dispatch."""
    scalars = [_clean_manifest_path(v) for v in _WORKER_RETURN_PATH_SCALAR_RE.findall(text)]
    fields = [_clean_manifest_path(v) for v in _WORKER_RETURN_PATH_FIELD_RE.findall(text)]
    has_heading = _REQUIRED_ARTIFACT_MANIFEST_HEADING_RE.search(text) is not None
    if not _is_worker_must_not_commit(text):
        return []
    prefix, issues = "ready WORKER_MUST_NOT_COMMIT work order", []
    required = [
        path
        for table in (_section_tables(text, "Required Artifact Manifest") if has_heading else [])
        for row in table
        for path in [_clean_manifest_path(_row_value(row, "Path", "Artifact", "Required artifact"))]
        if path and "FILL_ME" not in path and "/" in path
        and (not any(_normalize_table_key(k) in {"requiredathandoff", "required", "mustexist"} for k in row)
             or _truthy_cell(_row_value(row, "Required at handoff", "Required", "Must exist")))
    ]
    if not has_heading:
        issues.append(f"{prefix} lacks `## Required Artifact Manifest`; declare exact worker paths before dispatch")
    elif not required:
        issues.append(f"{prefix} has a prose-only or unparseable `## Required Artifact Manifest`; use a Path table")
    for label, values in (("Worker return path:", scalars), ("workerReturnPath:", fields)):
        if not values:
            issues.append(f"{prefix} lacks exact `{label}` binding")
        elif len(values) > 1:
            issues.append(f"{prefix} has {len(values)} `{label}` bindings; exactly one is allowed")
    if len(scalars) == 1 and len(fields) == 1:
        if scalars[0] != fields[0]:
            issues.append(f"`Worker return path:` (`{scalars[0]}`) and `workerReturnPath:` (`{fields[0]}`) disagree")
        elif required and scalars[0] not in required:
            issues.append(f"worker return binding `{scalars[0]}` is not a required row of `## Required Artifact Manifest`")
    return issues


def _validate_work_order(path: str, text: str) -> list[str]:
    issues: list[str] = []
    status = _extract_status(text)
    dispatching = "DISPATCHED" in status.upper() or "READY" in status.upper()
    issues.extend(_validate_status_token_hygiene(text, "work order"))
    issues.extend(_validate_closed_artifact_finality(text, "work order"))
    issues.extend(_validate_mandatory_remediation_escalation(text, "work order"))
    issues.extend(_validate_provider_memory_authority_boundary(text, "work order"))

    if dispatching and _is_roadmap_derived(text) and not _has_trace_matrix(text):
        issues.append("roadmap-derived work order is dispatch/ready without Roadmap-To-Work-Order Trace Matrix")

    if dispatching:
        issues.extend(_validate_stale_roadmap_redispatch(path, text))
        if not _has_worker_autonomy_clause(text):
            issues.append("dispatch/ready work order lacks Worker Autonomy / No-Question Rule")
        issues.extend(_validate_stale_preclosure_dispatch_base(text))
        issues.extend(_validate_commit_mode_and_anchor_lifecycle(text))
        issues.extend(_validate_worker_completion_review_boundary(text))
        issues.extend(_validate_no_commit_reviewer_closure_contract(text))
        issues.extend(_validate_worker_return_packet_shape_contract(text))
        issues.extend(_validate_ready_manifest_and_return_binding(text))
        issues.extend(_validate_source_verification_table_shape(text))
        issues.extend(_validate_source_verification_disposition_discipline(text))
        issues.extend(_validate_intake_role_routing_decision(text, "work order"))
        issues.extend(_validate_single_agent_multi_role_control(text, "work order"))
        issues.extend(_validate_evidence_reuse_and_encoding_plan(text))
        issues.extend(_validate_protected_path_authorization_carrier(text))
        issues.extend(_validate_legacy_coverage_index_disposition(text))

    if dispatching and _is_connector_wave(path, text):
        wave_id = _extract_wave_id(path, text)
        if wave_id is not None and not _has_gc018_for_wave(wave_id):
            issues.append(f"LHW{wave_id} connector work order is dispatch/ready without fresh GC-018 baseline")
        if "Source Verification" not in text or not _source_table_has_required_columns(text):
            issues.append("dispatch/ready work order lacks a complete Source Verification table")

    if dispatching:
        issues.extend(_validate_required_first_reads(text))
        issues.extend(_validate_required_proof_manifest_atomic_literals(text))
        issues.extend(_validate_near_threshold_owner_maintainability_plan(text))
        if (
            ("Required Artifact Manifest" in text or "Required Proof Manifest" in text)
            and FULFILLMENT_MANIFEST_MARKER not in text
        ):
            issues.append(
                "work order has required artifact/proof manifests but lacks "
                f"`{FULFILLMENT_MANIFEST_MARKER}` marker"
            )
        blocking_precondition = re.search(
            r"(pre-?condition|gate condition|dispatch only after|only after)[\s\S]{0,240}CLOSED_PASS",
            text,
            re.IGNORECASE,
        )
        if blocking_precondition:
            issues.append("dispatch/ready status conflicts with unresolved CLOSED_PASS precondition language")
        issues.extend(_validate_ready_source_blockers(text))
        issues.extend(_validate_ready_dependency_release(text))
        issues.extend(_validate_ready_live_method_proof_path(text))

    issues.extend(_validate_accepted_source_rows(path, text))
    issues.extend(_validate_negative_search_collision_discipline(path, text, "work order"))
    issues.extend(_validate_no_empty_range_commands(text))
    issues.extend(_validate_accept_owner_map_coverage(text))
    issues.extend(_validate_runtime_freshness_claims(text))
    issues.extend(_validate_architecture_readiness_admission(path, text))

    if re.search(r"install[\s\S]{0,120}always blocked|always blocked[\s\S]{0,120}install", text, re.IGNORECASE):
        issues.append("work order asserts `install` is always blocked; cite a source policy or map it to approval/escalation")

    return issues


def _validate_roadmap(path: str, text: str) -> list[str]:
    issues: list[str] = []
    status = _extract_status(text)
    issues.extend(_validate_status_token_hygiene(text, "roadmap"))
    issues.extend(_validate_closed_artifact_finality(text, "roadmap"))
    issues.extend(_validate_mandatory_remediation_escalation(text, "roadmap"))
    issues.extend(_validate_closed_roadmap_status_residue(text))
    issues.extend(_validate_referenced_work_order_closure(text, "roadmap"))
    if _is_connector_wave(path, text) and _is_dispatch_status(status) and not _is_hold_status(status):
        wave_id = _extract_wave_id(path, text)
        if wave_id is not None and not _has_gc018_for_wave(wave_id):
            issues.append(f"LHW{wave_id} connector roadmap is dispatch/ready without fresh GC-018 baseline")
    if _is_dispatch_status(status) and not _is_hold_status(status):
        issues.extend(_validate_dispatch_pending_dependency_language(text, "roadmap"))
        issues.extend(_validate_source_verification_disposition_discipline(text))
    issues.extend(_validate_accepted_source_rows(path, text))
    issues.extend(_validate_negative_search_collision_discipline(path, text, "roadmap"))
    issues.extend(_validate_no_empty_range_commands(text))
    issues.extend(_validate_accept_owner_map_coverage(text))
    issues.extend(_validate_runtime_freshness_claims(text))
    return issues


def _validate_baseline(path: str, text: str) -> list[str]:
    issues: list[str] = []
    issues.extend(_validate_status_token_hygiene(text, "baseline"))
    issues.extend(_validate_closed_artifact_finality(text, "baseline"))
    issues.extend(_validate_mandatory_remediation_escalation(text, "baseline"))
    issues.extend(_validate_referenced_work_order_closure(text, "baseline"))
    issues.extend(_validate_accepted_source_rows(path, text))
    issues.extend(_validate_negative_search_collision_discipline(path, text, "baseline"))
    issues.extend(_validate_no_empty_range_commands(text))
    issues.extend(_validate_accept_owner_map_coverage(text))
    issues.extend(_validate_runtime_freshness_claims(text))
    return issues


def _validate_fast_lane_audit(path: str, text: str) -> list[str]:
    issues: list[str] = []
    status = _extract_status(text)
    issues.extend(_validate_status_token_hygiene(text, "fast-lane audit"))
    issues.extend(_validate_closed_artifact_finality(text, "fast-lane audit"))
    issues.extend(_validate_mandatory_remediation_escalation(text, "fast-lane audit"))
    issues.extend(_validate_fast_lane_status_consistency(text))
    if "FAST_LANE_READY" in status.upper() and re.search(
        r"(pre-?condition|conditional|only after)[\s\S]{0,240}CLOSED_PASS",
        text,
        re.IGNORECASE,
    ):
        issues.append("FAST_LANE_READY audit has unmet/conditional CLOSED_PASS prerequisite; use HOLD_* until satisfied")
    if _is_connector_wave(path, text) and "FAST_LANE_READY" in status.upper():
        wave_id = _extract_wave_id(path, text)
        if wave_id is not None and not _has_gc018_for_wave(wave_id):
            issues.append(f"LHW{wave_id} fast-lane audit is ready without fresh GC-018 baseline")
    issues.extend(_validate_accepted_source_rows(path, text))
    issues.extend(_validate_negative_search_collision_discipline(path, text, "fast-lane audit"))
    issues.extend(_validate_no_empty_range_commands(text))
    return issues


def _validate_completion_or_spec(path: str, text: str) -> list[str]:
    issues: list[str] = []
    issues.extend(_validate_status_token_hygiene(text, "completion/spec artifact"))
    issues.extend(_validate_closed_artifact_finality(text, "completion/spec artifact"))
    issues.extend(_validate_mandatory_remediation_escalation(text, "completion/spec artifact"))
    issues.extend(_validate_referenced_work_order_closure(text, "completion/spec artifact"))
    issues.extend(_validate_accepted_source_rows(path, text))
    issues.extend(_validate_negative_search_collision_discipline(path, text, "completion/spec artifact"))
    issues.extend(_validate_no_empty_range_commands(text))
    issues.extend(_validate_connector_spec_line_count_claim(path, text))
    return issues


def _validate_connector_spec_line_count_claim(path: str, text: str) -> list[str]:
    normalized = path.replace("\\", "/")
    if not (
        normalized.startswith("docs/reference/CVF_LHW")
        and "CONNECTOR_SPEC" in normalized.upper()
    ):
        return []
    actual = len(text.splitlines())
    thresholds = {
        int(match.group(1))
        for match in re.finditer(
            r"(?im)\b(?:connector\s+spec|spec|artifact|file)[^\n]{0,80}"
            r"(?:<|under|below|no\s+more\s+than|max(?:imum)?)\s*(\d+)\s+lines?\b",
            text,
        )
    }
    for threshold in sorted(thresholds):
        if actual > threshold:
            return [
                f"connector spec claims a line-count threshold under {threshold} lines but file has {actual} lines"
            ]
    return []


def _extract_allowed_scope_text(text: str) -> str:
    patterns = (
        r"(?ims)^Allowed scope:\s*$([\s\S]*?)(?=^Forbidden scope:\s*$|^##\s+|\Z)",
        r"(?ims)^\*\*Allowed scope:\*\*\s*$([\s\S]*?)(?=^\*\*Forbidden scope:\*\*\s*$|^##\s+|\Z)",
        r"(?ims)^Allowed:\s*$([\s\S]*?)(?=^Forbidden:\s*$|^##\s+|\Z)",
        r"(?ims)^\*\*Allowed:\*\*\s*$([\s\S]*?)(?=^\*\*Forbidden:\*\*\s*$|^##\s+|\Z)",
    )
    for pattern in patterns:
        match = re.search(pattern, text)
        if match:
            return match.group(1)
    return ""


def _extract_forbidden_scope_text(text: str) -> str:
    patterns = (
        r"(?ims)^Forbidden scope:\s*$([\s\S]*?)(?=^##\s+|\Z)",
        r"(?ims)^\*\*Forbidden scope:\*\*\s*$([\s\S]*?)(?=^##\s+|\Z)",
        r"(?ims)^Forbidden:\s*$([\s\S]*?)(?=^##\s+|\Z)",
        r"(?ims)^\*\*Forbidden:\*\*\s*$([\s\S]*?)(?=^##\s+|\Z)",
    )
    for pattern in patterns:
        match = re.search(pattern, text)
        if match:
            return match.group(1)
    return ""


def _path_matches_allowed(path: str, allowed_path: str) -> bool:
    normalized = path.replace("\\", "/").strip()
    allowed = allowed_path.replace("\\", "/").strip().rstrip("/")
    return normalized == allowed or normalized.startswith(f"{allowed}/")


def _is_session_continuity_path(path: str) -> bool:
    normalized = path.replace("\\", "/")
    return normalized in {
        "CVF_SESSION_MEMORY.md",
        "CVF_SESSION/ACTIVE_SESSION_STATE.json",
    } or normalized.startswith("CVF_SESSION/handoffs/") or normalized.startswith("AGENT_HANDOFF")


def _validate_single_work_order_scope_range(changed_files: list[str]) -> list[dict[str, Any]]:
    normalized_files = sorted(path.replace("\\", "/") for path in changed_files)
    closed_work_orders: list[str] = []
    for path in normalized_files:
        if not path.startswith("docs/work_orders/") or "/archive/" in path:
            continue
        text = _read_rel(path)
        if text and _is_closed_status(_extract_status(text)):
            closed_work_orders.append(path)
    if len(closed_work_orders) != 1:
        return []

    work_order_path = closed_work_orders[0]
    text = _read_rel(work_order_path)
    allowed_scope = _extract_allowed_scope_text(text)
    if not allowed_scope:
        return []

    explicit_paths = _extract_paths(allowed_scope)
    allowed_lower = allowed_scope.lower()
    disallowed: list[str] = []
    for path in normalized_files:
        if path == work_order_path:
            continue
        if any(_path_matches_allowed(path, allowed_path) for allowed_path in explicit_paths):
            continue
        if "this work order" in allowed_lower and path == work_order_path:
            continue
        if "session continuity" in allowed_lower and _is_session_continuity_path(path):
            continue
        disallowed.append(path)

    if not disallowed:
        return []

    sample = ", ".join(disallowed[:8])
    suffix = "" if len(disallowed) <= 8 else f", ... (+{len(disallowed) - 8} more)"
    return [
        {
            "path": work_order_path,
            "issues": [
                "closed work-order changed range includes files outside its Allowed scope: "
                f"{sample}{suffix}"
            ],
        }
    ]


def _is_runtime_or_source_change(path: str) -> bool:
    normalized = path.replace("\\", "/")
    if normalized.endswith(".md") or normalized.endswith(".json"):
        return False
    return normalized.startswith(("EXTENSIONS/", "scripts/", "sdk/", "governance/compat/"))


def _work_order_runtime_activity(text: str, changed_files: list[str]) -> bool:
    normalized_files = [path.replace("\\", "/") for path in changed_files]
    if any(_is_runtime_or_source_change(path) for path in normalized_files):
        return True
    owned_section = _extract_section(text, "Write Ownership")
    required_section = _extract_section(text, "Required Artifact Manifest")
    declared_paths = _extract_paths(owned_section + "\n" + required_section)
    return any(
        any(_path_matches_pattern(changed_path, declared_path) for declared_path in declared_paths)
        for changed_path in normalized_files
    )


def _validate_work_order_fulfillment_manifests(changed_files: list[str]) -> list[dict[str, Any]]:
    normalized_files = sorted(path.replace("\\", "/") for path in changed_files)
    violations: list[dict[str, Any]] = []

    for work_order_path in normalized_files:
        if not work_order_path.startswith("docs/work_orders/") or "/archive/" in work_order_path:
            continue
        text = _read_rel(work_order_path)
        if FULFILLMENT_MANIFEST_MARKER not in text:
            continue
        status = _extract_status(text)
        if not _is_dispatch_status(status) or _is_hold_status(status):
            continue
        if not _work_order_runtime_activity(text, normalized_files):
            continue

        issues: list[str] = []
        required_tables = _section_tables(text, "Required Artifact Manifest")
        if not required_tables:
            issues.append("work order declares fulfillment manifest but lacks `## Required Artifact Manifest` table")
        for table in required_tables:
            for row in table:
                path = _clean_manifest_path(_row_value(row, "Path", "Artifact", "Required artifact"))
                required_at_handoff = _truthy_cell(_row_value(row, "Required at handoff", "Required", "Must exist"))
                if path and required_at_handoff and not _exists_rel(path):
                    issues.append(f"required handoff artifact is missing: `{path}`")

        pre_existing_tables = _section_tables(text, "Pre-Existing Dirty Path Exemptions")
        exempt_patterns = [
            _clean_manifest_path(_row_value(row, "Path", "Pattern"))
            for table in pre_existing_tables
            for row in table
            if _clean_manifest_path(_row_value(row, "Path", "Pattern"))
        ]
        for table in _section_tables(text, "Forbidden Path Manifest"):
            for row in table:
                pattern = _clean_manifest_path(_row_value(row, "Path", "Pattern", "Forbidden path"))
                if not pattern:
                    continue
                for changed_path in normalized_files:
                    if any(_path_matches_pattern(changed_path, exempt) for exempt in exempt_patterns):
                        continue
                    if _path_matches_pattern(changed_path, pattern):
                        issues.append(f"changed file violates forbidden path manifest: `{changed_path}` matches `{pattern}`")

        for table in _section_tables(text, "Required Proof Manifest"):
            for row in table:
                required = _truthy_cell(_row_value(row, "Required at handoff", "Required", "Must exist"))
                if not required:
                    continue
                path = _clean_manifest_path(_row_value(row, "Path", "Proof path"))
                literal = _row_value(row, "Required literal", "Literal", "Required token").strip().strip("`")
                if path and not _exists_rel(path):
                    issues.append(f"required proof file is missing: `{path}`")
                    continue
                if path and literal and literal not in _read_rel(path):
                    issues.append(f"required proof literal `{literal}` is missing from `{path}`")

        # Fix (C): validate Forbidden Filesystem State At Dispatch block.
        # If the work order has a Forbidden Path Manifest but no
        # Forbidden Filesystem State At Dispatch section, flag it so orchestrators
        # are reminded to record disk state before dispatch.
        # If the section exists, check that no row records PRESENT without a
        # documented exemption or governance resolution.
        has_forbidden_manifest = bool(list(_section_tables(text, "Forbidden Path Manifest")))
        if has_forbidden_manifest:
            ffs_tables = list(_section_tables(text, "Forbidden Filesystem State At Dispatch"))
            if not ffs_tables:
                issues.append(
                    "work order has a Forbidden Path Manifest but is missing "
                    "`## Forbidden Filesystem State At Dispatch` block; "
                    "orchestrator must record disk state of forbidden paths before dispatch"
                )
            else:
                for table in ffs_tables:
                    for row in table:
                        actual = _row_value(row, "Actual state at dispatch", "Actual state", "Actual").strip().upper()
                        fp = _clean_manifest_path(_row_value(row, "Forbidden path", "Path", "Forbidden"))
                        if actual == "PRESENT" and fp:
                            issues.append(
                                f"Forbidden Filesystem State records PRESENT for `{fp}` without "
                                "exemption; resolve (remove or govern) before dispatch"
                            )

        if issues:
            violations.append({"path": work_order_path, "issues": issues})

    return violations


def _validate_runtime_changes_against_referenced_work_orders(changed_files: list[str]) -> list[dict[str, Any]]:
    normalized_files = sorted(path.replace("\\", "/") for path in changed_files)
    runtime_changed = [path for path in normalized_files if _is_runtime_or_source_change(path)]
    if not runtime_changed:
        return []

    referenced_work_orders: set[str] = set()
    referring_artifacts: dict[str, set[str]] = {}
    for path in normalized_files:
        if not _is_target(path):
            continue
        text = _read_rel(path)
        for work_order_path in _extract_paths(text):
            normalized_work_order = work_order_path.replace("\\", "/")
            if normalized_work_order.startswith("docs/work_orders/"):
                referenced_work_orders.add(normalized_work_order)
                referring_artifacts.setdefault(normalized_work_order, set()).add(path)

    for path in normalized_files:
        if path.startswith("docs/work_orders/") and "/archive/" not in path:
            referenced_work_orders.add(path)
            referring_artifacts.setdefault(path, set()).add(path)

    violations: list[dict[str, Any]] = []
    for work_order_path in sorted(referenced_work_orders):
        work_order_text = _read_rel(work_order_path)
        if not work_order_text:
            continue
        status = _extract_status(work_order_text)
        if not _is_hold_status(status):
            continue
        ownership_text = "\n".join(
            _extract_section(work_order_text, heading)
            for heading in (
                "Scope / Target / Owner Boundary",
                "Required Artifact Manifest",
                "Write Ownership",
                "Work-Order Fulfillment Manifest",
            )
        )
        owned_patterns = sorted(set(_extract_paths(ownership_text)))
        matched_runtime = [
            changed_path
            for changed_path in runtime_changed
            if any(_path_matches_pattern(changed_path, pattern) for pattern in owned_patterns)
        ]
        if not matched_runtime:
            continue
        sample_runtime = ", ".join(matched_runtime[:6])
        suffix = "" if len(matched_runtime) <= 6 else f", ... (+{len(matched_runtime) - 6} more)"
        referrers = ", ".join(sorted(referring_artifacts.get(work_order_path, set()))[:4])
        violations.append(
            {
                "path": work_order_path,
                "issues": [
                    "changed range includes runtime/source files while referenced work order "
                    f"`{work_order_path}` is still `{status}`; release/downgrade the work order "
                    "before implementation. Runtime/source sample: "
                    f"{sample_runtime}{suffix}. Referring artifact(s): {referrers or 'unknown'}"
                ],
            }
        )
    return violations


def _validate_lhw_wave_closure_range(
    changed_files: list[str],
    base_ref: str | None = None,
) -> list[dict[str, Any]]:
    normalized_files = sorted(path.replace("\\", "/") for path in changed_files)
    violations: list[dict[str, Any]] = []
    for path in normalized_files:
        if not path.startswith("docs/roadmaps/") or "/archive/" in path:
            continue
        if len(_extract_wave_ids_from_path(path)) != 1:
            continue
        text = _read_rel(path)
        current_status = _extract_status(text)
        if not text or not _is_closed_status(current_status) or not _is_connector_wave(path, text):
            continue
        if base_ref:
            prior_text = _read_rel_at(base_ref, path)
            prior_status = _extract_status(prior_text) if prior_text else ""
            if prior_text and _is_closed_status(prior_status):
                continue
        wave_id = _extract_wave_id(path, text)
        if wave_id is None:
            continue
        present_tranches = {
            int(match.group(1))
            for changed_path in normalized_files
            for match in re.finditer(rf"LHW{wave_id}[-_]T([123])(?!\d)", changed_path, re.IGNORECASE)
        }
        missing = [f"T{index}" for index in (1, 2, 3) if index not in present_tranches]
        if missing:
            violations.append(
                {
                    "path": path,
                    "issues": [
                        f"closed LHW{wave_id} connector roadmap changed without full wave-range evidence; "
                        f"missing changed artifact(s) for {', '.join(missing)}"
                    ],
                }
            )
    return violations


def _is_target(path: str) -> bool:
    normalized = path.replace("\\", "/")
    if "/archive/" in normalized:
        return False
    return normalized.endswith(".md") and (
        normalized.startswith("docs/work_orders/")
        or normalized.startswith("docs/roadmaps/")
        or normalized.startswith("docs/baselines/")
        or normalized.startswith("docs/reviews/")
        or (
            normalized.startswith("docs/reference/CVF_LHW")
            and "CONNECTOR_SPEC" in normalized.upper()
        )
    )


def _validate_path(path: str) -> list[str]:
    text = _read_rel(path)
    if not text:
        return ["changed governed dispatch artifact is missing from workspace"]
    return _validate_text(path, text)


def _validate_text(path: str, text: str) -> list[str]:
    normalized = path.replace("\\", "/")
    if normalized.startswith("docs/work_orders/"):
        return _validate_work_order(normalized, text)
    if normalized.startswith("docs/roadmaps/"):
        return _validate_roadmap(normalized, text)
    if normalized.startswith("docs/baselines/"):
        return _validate_baseline(normalized, text)
    if normalized.startswith("docs/reviews/") and "FAST_LANE_AUDIT" in normalized.upper():
        return _validate_fast_lane_audit(normalized, text)
    if normalized.startswith("docs/reviews/") or (
        normalized.startswith("docs/reference/CVF_LHW") and "CONNECTOR_SPEC" in normalized.upper()
    ):
        return _validate_completion_or_spec(normalized, text)
    return []


def _classify(changed_files: list[str], base_ref: str | None = None) -> dict[str, Any]:
    targets = sorted(path.replace("\\", "/") for path in changed_files if _is_target(path))
    # Collect the set of file statuses so rename-only files can be skipped.
    changed_status: dict[str, set[str]] = {}
    try:
        for p, statuses in _get_changed(base_ref or "HEAD", "HEAD").items():
            changed_status[p.replace("\\", "/")] = statuses
    except RuntimeError:
        # Unit tests patch REPO_ROOT to a temporary non-git directory and pass
        # explicit changed files. In that mode, content validation should still
        # run even though rename/pre-existing-status optimization is unavailable.
        changed_status = {}
    violations = []
    for path in targets:
        statuses = changed_status.get(path, set())
        # Skip files that were only renamed/moved -- content unchanged, no new violations possible.
        if statuses and statuses <= {"R"}:
            continue
        # Skip deleted files -- they are no longer present in the workspace and
        # cannot be validated; the archive move is governed by a separate authority doc.
        if statuses and "D" in statuses:
            continue
        text = _read_rel(path)
        issues = _validate_path(path)
        issues.extend(_validate_pending_artifact_evidence_finality(path, text, statuses))
        issues.extend(_validate_self_reported_gate_evidence_consistency(text))
        if not issues:
            continue
        # Suppress pre-existing violations: if every issue was already present in the
        # committed (HEAD) version of the file, this commit did not introduce them.
        head_text = _read_rel_at("HEAD", path)
        if head_text:
            head_issues = set(_validate_text(path, head_text))
            new_issues = [i for i in issues if i not in head_issues]
            if not new_issues:
                continue
            issues = new_issues
        violations.append({"path": path, "issues": issues})
    violations.extend(_validate_single_work_order_scope_range(changed_files))
    violations.extend(_validate_lhw_wave_closure_range(changed_files, base_ref=base_ref))
    violations.extend(_validate_runtime_changes_against_referenced_work_orders(changed_files))
    violations.extend(_validate_work_order_fulfillment_manifests(changed_files))

    required_markers = {
        STANDARD_PATH: (
            "Roadmap-To-Work-Order Trace Matrix",
            "Negative And Fail-Condition Scan",
            "Mandatory Gate-Failure Remediation Protocol",
            "Worker Autonomy / No-Question Rule",
            "Pending Artifact Evidence Finality",
            COMMIT_MODE_ANCHOR_MARKER,
            "Self-Reported Gate Evidence Consistency",
            NEAR_THRESHOLD_PLAN_MARKER,
            FULFILLMENT_MANIFEST_MARKER,
            "Current Runtime Freshness Verification",
            NEGATIVE_SEARCH_COLLISION_MARKER,
            SINGLE_AGENT_MULTI_ROLE_MARKER,
            INTAKE_ROLE_ROUTING_MARKER,
            EVIDENCE_REUSE_ENCODING_PLAN_MARKER,
            DISPATCH_PACKET_LEARNING_MARKER,
            "ACCEPT_AS_OWNER_MAP coverage",
            THIS_SCRIPT_PATH,
        ),
        WORK_ORDER_TEMPLATE_PATH: (
            "Source Verification Block",
            "Roadmap-To-Work-Order Trace Matrix",
            "Mandatory Gate-Failure Remediation Protocol",
            "Worker Autonomy / No-Question Rule",
            "Pending Artifact Evidence Finality",
            COMMIT_MODE_ANCHOR_MARKER,
            "Self-Reported Gate Evidence Consistency",
            NEAR_THRESHOLD_PLAN_MARKER,
            FULFILLMENT_MANIFEST_MARKER,
            "Current Runtime Freshness Verification",
            NEGATIVE_SEARCH_COLLISION_MARKER,
            SINGLE_AGENT_MULTI_ROLE_MARKER,
            INTAKE_ROLE_ROUTING_MARKER,
            "ACCEPT_AS_OWNER_MAP coverage",
            THIS_SCRIPT_PATH,
        ),
        WORK_ORDER_AUTHORING_HARDENING_ADDENDUM_PATH: (
            EXPORT_SURFACE_DECISION_MARKER,
            NEXT_TRANCHE_AUDIT_MINI_PACKAGE_MARKER,
            NEAR_THRESHOLD_TEMPLATE_OWNER_MARKER,
            DISPATCH_PACKET_LEARNING_MARKER,
            REQUIRED_PROOF_ATOMIC_LITERAL_MARKER,
        ),
        WORK_ORDER_FINALITY_ADDENDUM_PATH: (
            COMMIT_MODE_ANCHOR_MARKER,
            "Dependency Release And Next-Work-Order Refresh",
            "Two-Stage Handoff Finality",
            "Worker Pending-Return Gate",
            "Reviewer Closure Conversion Block",
        ),
        EVIDENCE_REUSE_ENCODING_STANDARD_PATH: (
            EVIDENCE_REUSE_ENCODING_PLAN_MARKER,
            "REUSE_PRIOR_VERIFICATION",
            "RECOMPUTE_REQUIRED",
            "REVIEWER_RECOMPUTE_ONLY",
            "unicodePathHandling",
        ),
        WORKER_AUTONOMY_STANDARD_PATH: (
            "Worker Autonomy Prompt",
            "Worker Autonomy / No-Question Rule",
            "Commit Mode And Base-Anchor Requirement",
            THIS_SCRIPT_PATH,
        ),
        HOOK_CHAIN_PATH: (THIS_SCRIPT_PATH,),
    }
    marker_violations: dict[str, list[str]] = {}
    for path, markers in required_markers.items():
        # Skip marker check for files that no longer exist on disk (e.g., archived files).
        if not (REPO_ROOT / path).exists():
            continue
        text = effective_binding_text(path, _read_rel(path))
        missing = [marker for marker in markers if marker not in text]
        if missing:
            marker_violations[path] = missing

    return {
        "timestamp": dt.datetime.now(dt.timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z"),
        "policy": STANDARD_PATH,
        "script": THIS_SCRIPT_PATH,
        "checkedFiles": targets,
        "checkedFileCount": len(targets),
        "violations": violations,
        "violationCount": len(violations),
        "markerViolations": marker_violations,
        "markerViolationCount": len(marker_violations),
        "compliant": not violations and not marker_violations,
    }

def _validate_architecture_readiness_admission(path: str, text: str) -> list[str]:
    """Applicability-gated pre-invocation architecture-readiness validator.

    Fails closed on: missing/unclassified applicability declaration,
    incomplete or malformed matrix rows, worker-authored machine
    disposition, missing/stale semantic review binding, digest drift, and
    the reviewer-recreation contradiction. Never itself decides semantic
    correctness -- that remains reviewer-owned per DARA-T1.
    """
    _sync_source_validation_repo_root()
    declaration = source_validation._architecture_readiness_declaration(text)
    if declaration is None:
        dispatch_surface = source_validation._extract_scalar_field(text, "dispatchSurface") or ""
        if dispatch_surface == "EXTERNAL_AGENT_CLI_MCP":
            return [
                f"`{source_validation.ARCHITECTURE_READINESS_MARKER}` is absent from this "
                "`EXTERNAL_AGENT_CLI_MCP` work order; dispatch requires exactly one declaration "
                "(`BLOCKED_ARCHITECTURE_APPLICABILITY_UNCLASSIFIED`)"
            ]
        return []
    _low_risk_prefix = source_validation.ARCHITECTURE_READINESS_LOW_RISK_PREFIX
    if (declaration not in source_validation.ARCHITECTURE_READINESS_ALLOWED_DECLARATIONS
            and not declaration.startswith(_low_risk_prefix)):
        return [
            f"`{source_validation.ARCHITECTURE_READINESS_MARKER}` has an unrecognized value `{declaration}`; "
            f"use one of {', '.join(source_validation.ARCHITECTURE_READINESS_ALLOWED_DECLARATIONS)}"
        ]

    issues: list[str] = []

    if declaration == source_validation.ARCHITECTURE_READINESS_BLOCKED_UNCLASSIFIED:
        issues.append(
            "work order declares `BLOCKED_ARCHITECTURE_APPLICABILITY_UNCLASSIFIED`; "
            "resolve applicability before dispatch"
        )
        return issues

    if declaration in source_validation.ARCHITECTURE_READINESS_NOT_APPLICABLE_TOKENS:
        if declaration == "NOT_APPLICABLE_ACCEPTED_DESIGN_ECHO":
            digest = source_validation._extract_scalar_field(text, "architectureMatrixCanonicalDigest")
            review_path = source_validation._extract_scalar_field(text, "architectureSemanticReviewPath")
            review_commit = source_validation._extract_scalar_field(text, "architectureSemanticReviewCommit")
            review_sha = source_validation._extract_scalar_field(text, "architectureSemanticReviewFileSha256")
            issues.extend(source_validation._validate_immutable_review_identity_fields(
                review_path=review_path, review_commit=review_commit, review_sha=review_sha,
                digest=digest, context_label="NOT_APPLICABLE_ACCEPTED_DESIGN_ECHO",
            ))
            echo_disposition = source_validation._extract_scalar_field(text, "architectureBindingEchoDisposition")
            if not echo_disposition:
                issues.append(
                    "`NOT_APPLICABLE_ACCEPTED_DESIGN_ECHO` requires "
                    "`architectureBindingEchoDisposition`"
                )
            elif echo_disposition not in source_validation.ARCHITECTURE_ECHO_DISPOSITION_VALUES:
                issues.append(
                    f"`architectureBindingEchoDisposition` has invalid value `{echo_disposition}`; "
                    f"use one of {', '.join(sorted(source_validation.ARCHITECTURE_ECHO_DISPOSITION_VALUES))}"
                )
            elif echo_disposition != "EXACT_MATCH":
                issues.append(
                    f"work order echoes `architectureBindingEchoDisposition: {echo_disposition}`; "
                    "the accepted architecture identity no longer matches and dispatch must not proceed"
                )
        return issues

    if declaration.startswith(_low_risk_prefix):
        reason = declaration[len(_low_risk_prefix):]
        if not reason:
            issues.append(
                f"`{_low_risk_prefix}` requires a non-empty reason after the colon"
            )
        return issues

    # declaration == REQUIRED: full matrix identity/coverage validation.
    rows = source_validation._architecture_matrix_rows(text)
    if not rows:
        issues.append(
            f"`{source_validation.ARCHITECTURE_READINESS_MARKER} {source_validation.ARCHITECTURE_READINESS_REQUIRED}` "
            f"but no `## {source_validation.ARCHITECTURE_BINDING_MATRIX_HEADING}` table with the required "
            f"`{source_validation.ARCHITECTURE_MATRIX_SCHEMA}` columns was found"
        )
        return issues

    # R3-02: extract the writable manifest so row validation can constrain rollback paths.
    writable_manifest = source_validation._extract_writable_manifest_paths(text) or None

    seen_behavior_owner: dict[str, set[str]] = {}
    for row in rows:
        issues.extend(
            source_validation._validate_architecture_matrix_row_identity(row, writable_manifest=writable_manifest)
        )
        behavior = row.get("behaviorIdentity", "").strip()
        owner = row.get("canonicalOwnerPath", "").strip()
        if behavior:
            owners_for_behavior = seen_behavior_owner.setdefault(behavior, set())
            if owner:
                owners_for_behavior.add(owner)

    for behavior, owners in seen_behavior_owner.items():
        if len(owners) > 1:
            issues.append(
                f"architecture matrix declares duplicate `behaviorIdentity` `{behavior}` across "
                f"distinct canonical owner paths: {', '.join(sorted(owners))}; one behavior must "
                "have exactly one canonical owner"
            )

    declared_schema = source_validation._extract_scalar_field(text, "architectureMatrixSchema")
    if declared_schema and declared_schema != source_validation.ARCHITECTURE_MATRIX_SCHEMA:
        issues.append(
            f"`architectureMatrixSchema` is `{declared_schema}`, expected `{source_validation.ARCHITECTURE_MATRIX_SCHEMA}`"
        )

    declared_row_count = source_validation._extract_scalar_field(text, "architectureMatrixRowCount")
    if declared_row_count is not None:
        try:
            if int(declared_row_count) != len(rows):
                issues.append(
                    f"`architectureMatrixRowCount` is `{declared_row_count}` but the matrix has {len(rows)} row(s)"
                )
        except ValueError:
            issues.append(f"`architectureMatrixRowCount` is not an integer: `{declared_row_count}`")

    declared_digest = source_validation._extract_scalar_field(text, "architectureMatrixCanonicalDigest")
    if declared_digest:
        recomputed_digest = source_validation._architecture_matrix_canonical_digest(rows)
        if declared_digest.lower() != recomputed_digest:
            issues.append(
                "`architectureMatrixCanonicalDigest` does not match the recomputed digest over the "
                "immutable authoring preimage (criterionId..evidenceOutputPath); the matrix content "
                "changed after the digest was bound"
            )

    for field_name in source_validation.ARCHITECTURE_MATRIX_SCALAR_FIELDS:
        if source_validation._extract_scalar_field(text, field_name) is None:
            issues.append(f"work order with `{source_validation.ARCHITECTURE_READINESS_REQUIRED}` matrix is missing scalar `{field_name}`")

    semantic_disposition = source_validation._extract_scalar_field(text, "architectureSemanticDisposition")
    review_path = source_validation._extract_scalar_field(text, "architectureSemanticReviewPath")
    review_commit = source_validation._extract_scalar_field(text, "architectureSemanticReviewCommit")
    review_sha = source_validation._extract_scalar_field(text, "architectureSemanticReviewFileSha256")

    if semantic_disposition == "ACCEPTED_BOUNDED":
        criterion_ids_for_review = [
            row.get("criterionId", "").strip() for row in rows
            if row.get("criterionId", "").strip()
        ]
        issues.extend(source_validation._validate_immutable_review_identity_fields(
            review_path=review_path, review_commit=review_commit,
            review_sha=review_sha,
            digest=source_validation._extract_scalar_field(text, "architectureMatrixCanonicalDigest"),
            criterion_ids=criterion_ids_for_review,
            context_label="architectureSemanticDisposition: ACCEPTED_BOUNDED",
        ))
    elif semantic_disposition in (None, "", "PENDING_REVIEW"):
        issues.append(
            "work order declares `Architecture-Readiness Admission: REQUIRED` but "
            "`architectureSemanticDisposition` is not `ACCEPTED_BOUNDED`; dispatch is blocked "
            "(`BLOCKED_SEMANTIC_REVIEW_MISSING_OR_STALE`)"
        )
    elif semantic_disposition and semantic_disposition.startswith("REJECTED"):
        issues.append(
            f"work order declares `Architecture-Readiness Admission: REQUIRED` but "
            f"`architectureSemanticDisposition` is `{semantic_disposition}`; dispatch is blocked"
        )

    usage_count = source_validation._extract_scalar_field(text, "cumulativeExternalInvocationCount")
    ceiling = source_validation._extract_scalar_field(text, "externalInvocationCeiling")
    if usage_count is None or ceiling is None:
        issues.append(
            "work order requires architecture readiness but is missing known "
            "`cumulativeExternalInvocationCount`/`externalInvocationCeiling` usage evidence "
            "(`BLOCKED_USAGE_UNKNOWN`)"
        )
    else:
        try:
            if int(usage_count) >= int(ceiling):
                issues.append(
                    f"`cumulativeExternalInvocationCount` ({usage_count}) is not strictly below "
                    f"`externalInvocationCeiling` ({ceiling}) (`BLOCKED_INVOCATION_CEILING_REACHED`)"
                )
        except ValueError:
            issues.append("`cumulativeExternalInvocationCount`/`externalInvocationCeiling` must be integers")

    reviewer_boundary = source_validation._extract_scalar_field(text, "reviewerWorkBoundary")
    if reviewer_boundary and reviewer_boundary != "EVALUATE_RETURNED_EVIDENCE_NOT_RECREATE_IMPLEMENTATION":
        issues.append(
            f"`reviewerWorkBoundary` is `{reviewer_boundary}`, expected "
            "`EVALUATE_RETURNED_EVIDENCE_NOT_RECREATE_IMPLEMENTATION`"
        )

    if re.search(
        r"machine\s+(?:PASS|pass)[\s\S]{0,200}\b(?:reviewer|human)\s+(?:will\s+)?re-?(?:create|do|implement|verify)",
        text,
        re.IGNORECASE,
    ):
        issues.append(
            "work order combines a machine-PASS claim with reviewer-recreation language; "
            "the reviewer must evaluate returned evidence, not recreate implementation "
            "(`HT-12` forbidden pattern)"
        )

    return issues
