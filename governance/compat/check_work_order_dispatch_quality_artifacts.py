#!/usr/bin/env python3
"""Artifact-level dispatch-quality validators.

Loaded by check_work_order_dispatch_quality.py into its module globals.
"""

from __future__ import annotations

def _is_future_work_order_output_reference(text: str, work_order_path: str) -> bool:
    for line in text.splitlines():
        if work_order_path not in line:
            continue
        lowered = line.lower()
        has_future_context = any(
            marker in lowered
            for marker in (
                "future",
                "hold",
                "dependency-gated",
                "dependency gated",
                "pending dependency-release",
                "pending dependency release",
                "next dispatch candidate",
            )
        )
        has_output_context = any(
            marker in lowered
            for marker in ("output", "authored", "created", "dispatch packet", "work order exists")
        )
        if has_future_context and has_output_context:
            return True
    return False


def _validate_referenced_work_order_closure(text: str, artifact_label: str) -> list[str]:
    if not _is_closed_status(_extract_status(text)):
        return []
    issues: list[str] = []
    for work_order_path in sorted(
        {
            path
            for path in _extract_paths(text)
            if path.replace("\\", "/").startswith("docs/work_orders/")
        }
    ):
        work_order_text = _read_rel(work_order_path)
        if not work_order_text:
            issues.append(f"closed {artifact_label} cites missing work order `{work_order_path}`")
            continue
        if not _is_closed_status(_extract_status(work_order_text)):
            if _is_future_work_order_output_reference(text, work_order_path):
                continue
            issues.append(
                f"closed {artifact_label} cites work order `{work_order_path}` whose status is not CLOSED"
            )
            continue
        work_order_finality = _validate_closed_artifact_finality(work_order_text, "work order")
        if work_order_finality:
            issues.append(
                f"closed {artifact_label} cites work order `{work_order_path}` with unresolved closure residue"
            )
    return issues


def _work_order_scope_token(path: str) -> str:
    """Derive the bounded scope token from a work-order filename.

    `CVF_AGENT_WORK_ORDER_<SCOPE>_FOR_<AGENT>_<DATE>.md` -> `<SCOPE>`.
    The completion artifact is named `CVF_<SCOPE>_COMPLETION_<DATE>.md`, so the
    SCOPE token is the bounded join key between a work order and its closed
    completion. Returns an empty string when the filename does not match the
    canonical work-order shape.
    """
    name = Path(path.replace("\\", "/")).name
    if not name.startswith("CVF_AGENT_WORK_ORDER_") or not name.endswith(".md"):
        return ""
    stem = name[len("CVF_AGENT_WORK_ORDER_"):-len(".md")]
    # Strip the trailing `_FOR_<AGENT>_<DATE>` segment when present.
    for_match = re.search(r"_FOR_[A-Z0-9]+_\d{4}-\d{2}-\d{2}$", stem)
    if for_match:
        return stem[: for_match.start()]
    date_match = re.search(r"_\d{4}-\d{2}-\d{2}$", stem)
    if date_match:
        return stem[: date_match.start()]
    return stem


def _matching_closed_completion(path: str, text: str) -> str | None:
    """Return a matching CLOSED_PASS_BOUNDED completion path, or None.

    Uses bounded path/filename matching only -- it never performs a full-text
    repository scan. It checks two bounded sources:

    1. an explicit `completionReviewPath:` reference in the work-order body;
    2. completion artifacts under `docs/reviews/` whose filename carries the
       same SCOPE token as this work order (`CVF_<SCOPE>_COMPLETION_*.md`).

    A match must declare `Status: CLOSED_PASS_BOUNDED`.
    """
    candidates: list[str] = []

    # Source 1: explicit completionReviewPath reference for this work order.
    for explicit in _extract_completion_review_paths(text):
        normalized = explicit.replace("\\", "/")
        if normalized.startswith("docs/reviews/") and "_COMPLETION_" in normalized:
            candidates.append(normalized)

    # Source 2: bounded filename match by SCOPE token under docs/reviews/.
    scope = _work_order_scope_token(path)
    if scope:
        reviews_dir = REPO_ROOT / "docs" / "reviews"
        if reviews_dir.is_dir():
            prefix = f"CVF_{scope}_COMPLETION_"
            for entry in sorted(reviews_dir.glob(f"CVF_{scope}_COMPLETION_*.md")):
                if entry.name.startswith(prefix):
                    candidates.append(f"docs/reviews/{entry.name}")

    for candidate in sorted(set(candidates)):
        completion_text = _read_rel(candidate)
        if not completion_text:
            continue
        if _extract_status(completion_text).strip().upper() == "CLOSED_PASS_BOUNDED":
            return candidate
    return None


def _validate_stale_roadmap_redispatch(path: str, text: str) -> list[str]:
    """Block a roadmap-derived ready/dispatch work order whose tranche is closed.

    RSF-T2: a stale roadmap/work-order state can survive after a matching closed
    completion artifact already exists and mislead next-move selection. When a
    dispatch/ready work order is roadmap-derived and a matching
    `CLOSED_PASS_BOUNDED` completion already exists for its tranche, the work
    order is a stale redispatch and must not pass dispatch-quality.
    """
    if not _is_roadmap_derived(text):
        return []
    completion = _matching_closed_completion(path, text)
    if completion is None:
        return []
    return [
        "stale roadmap-derived dispatch/ready work order references a tranche "
        f"that already has a closed completion artifact `{completion}` "
        "(Status: CLOSED_PASS_BOUNDED); reconcile the roadmap/work-order state "
        "before redispatch instead of re-dispatching a closed tranche"
    ]


def _validate_provider_memory_authority_boundary(text: str, artifact_label: str) -> list[str]:
    issues: list[str] = []
    for raw_line in text.splitlines():
        line = raw_line.strip()
        if "AGENTS.md" not in line:
            continue
        if PROVIDER_SPECIFIC_MEMORY_CONTEXT_RE.search(line):
            issues.append(
                f"{artifact_label} misclassifies `AGENTS.md` as provider-specific or non-authoritative; "
                "`AGENTS.md` is canonical CVF authority"
            )
    return sorted(set(issues))


def _normalize_role_cell(value: str) -> str:
    cleaned = re.sub(r"`([^`]+)`", r"\1", value)
    cleaned = re.sub(r"[^A-Za-z0-9_./ -]+", " ", cleaned)
    return re.sub(r"\s+", " ", cleaned).strip().lower()


def _role_bucket(role_cell: str) -> set[str]:
    normalized = _normalize_role_cell(role_cell)
    buckets: set[str] = set()
    if any(token in normalized for token in IMPLEMENTATION_ROLE_TOKENS):
        buckets.add("implementation")
    if any(token in normalized for token in REVIEW_ROLE_TOKENS):
        buckets.add("review")
    if any(token in normalized for token in ORCHESTRATION_ROLE_TOKENS):
        buckets.add("orchestration")
    return buckets


def _single_agent_multi_role_phrase_present(text: str) -> bool:
    return re.search(
        r"\b(single[-_ ]agent[-_ ]multi[-_ ]role|SINGLE_AGENT_MULTI_ROLE|one\s+agent\s+multiple\s+roles|"
        r"same\s+agent\s+(?:owns|performs|executes)[\s\S]{0,80}(?:worker|implementer|reviewer|committer)|"
        r"Codex\s+multi[- ]role|Claude\s+multi[- ]role|self[- ]review)\b",
        text,
        re.IGNORECASE,
    ) is not None


def _role_tables_imply_single_agent_multi_role(text: str) -> bool:
    for table in _parse_any_markdown_tables(text):
        owner_roles: dict[str, set[str]] = {}
        for row in table:
            role = _row_value(row, "Role", "Lane")
            owner = _row_value(row, "Owner", "Agent", "Actor", "Assignee")
            if not role or not owner:
                continue
            normalized_owner = _normalize_role_cell(owner)
            if not normalized_owner or normalized_owner in {"n/a", "na", "none", "operator"}:
                continue
            owner_roles.setdefault(normalized_owner, set()).update(_role_bucket(role))
        for buckets in owner_roles.values():
            if "implementation" in buckets and "review" in buckets:
                return True
            if {"orchestration", "implementation", "review"}.issubset(buckets):
                return True
    return False


def _needs_single_agent_multi_role_control(text: str) -> bool:
    return _single_agent_multi_role_phrase_present(text) or _role_tables_imply_single_agent_multi_role(text)


def _validate_single_agent_multi_role_control(text: str, artifact_label: str) -> list[str]:
    if not _needs_single_agent_multi_role_control(text):
        return []

    section = _extract_section(text, SINGLE_AGENT_MULTI_ROLE_MARKER)
    if not section:
        return [
            f"{artifact_label} uses single-agent multi-role execution but lacks "
            f"`## {SINGLE_AGENT_MULTI_ROLE_MARKER}`"
        ]

    required_patterns = {
        "role separation ledger": r"role separation|role ledger|role-by-role",
        "evidence basis independent of memory": r"evidence basis|diff|source|gate|test",
        "self-review boundary": r"self-review|not independent|independent review not claimed|no independent review",
        "escalation conditions": r"escalation|operator|external reviewer|stop condition",
        "gate sequence": r"gate sequence|reviewer-fast|pre-dispatch|pre-implementation|pre-closure|pre-push",
    }
    issues: list[str] = []
    for label, pattern in required_patterns.items():
        if not re.search(pattern, section, re.IGNORECASE):
            issues.append(
                f"{artifact_label} single-agent multi-role control block is missing {label}"
            )
    return sorted(set(issues))


def _requires_evidence_reuse_and_encoding_plan(text: str) -> bool:
    lowered = text.lower()
    direct_markers = (
        "prior verification",
        "prior manifest",
        "t11b",
        "source bundle",
        "extracted text",
        "extracted-text",
        "unicode path",
        "unicode-path",
    )
    if any(marker in lowered for marker in direct_markers):
        return True
    return re.search(
        r"(?:consume|consumes|cite|cites|use|uses|read|reads|load|loads|relies\s+on|relies\s+upon)"
        r"[\s\S]{0,140}external evidence digest"
        r"|external evidence digest[\s\S]{0,140}"
        r"(?:consume|consumes|cite|cites|use|uses|read|reads|load|loads|input|source)",
        text,
        re.IGNORECASE,
    ) is not None


def _field_value_from_block(block: str, field_name: str) -> str:
    match = re.search(
        rf"(?im)^\s*(?:[-*]\s*)?{re.escape(field_name)}\s*:\s*`?([^`\n]+?)`?\s*$",
        block,
    )
    return match.group(1).strip() if match else ""


def _is_missing_or_na(value: str) -> bool:
    normalized = value.strip().strip("`").lower()
    return not normalized or normalized in {"n/a", "na", "n/a with reason", "none", "tbd", "todo"}


def _validate_evidence_reuse_and_encoding_plan(text: str) -> list[str]:
    if not _requires_evidence_reuse_and_encoding_plan(text):
        return []
    block = _extract_section(text, EVIDENCE_REUSE_ENCODING_PLAN_MARKER)
    if not block:
        return [
            "dispatch/ready work order cites prior verification, external evidence, "
            "source bundle, T11B, extracted text, or Unicode-path evidence but lacks "
            f"`## {EVIDENCE_REUSE_ENCODING_PLAN_MARKER}`"
        ]

    issues: list[str] = []
    mode_value = _field_value_from_block(block, "verificationMode").strip().strip("`")
    modes_in_block = {
        mode
        for mode in EVIDENCE_REUSE_VERIFICATION_MODES
        if re.search(rf"\b{re.escape(mode)}\b", block)
    }
    if not mode_value:
        issues.append(f"`## {EVIDENCE_REUSE_ENCODING_PLAN_MARKER}` lacks `verificationMode`")
    elif mode_value not in EVIDENCE_REUSE_VERIFICATION_MODES:
        issues.append(
            f"`verificationMode` must be one of {sorted(EVIDENCE_REUSE_VERIFICATION_MODES)}; "
            f"found `{mode_value}`"
        )
    if len(modes_in_block) > 1:
        issues.append(
            f"`## {EVIDENCE_REUSE_ENCODING_PLAN_MARKER}` records multiple verification modes: "
            + ", ".join(sorted(modes_in_block))
        )

    prior_artifact = _field_value_from_block(block, "priorVerificationArtifact")
    prior_anchor = _field_value_from_block(block, "priorVerificationAnchor")
    recompute_reason = _field_value_from_block(block, "recomputeReason")
    unicode_handling = _field_value_from_block(block, "unicodePathHandling")
    extracted_authority = _field_value_from_block(block, "extractedTextAuthority")
    fresh_recompute = _field_value_from_block(block, "freshRecomputeRequired")

    if mode_value == "REUSE_PRIOR_VERIFICATION":
        if _is_missing_or_na(prior_artifact):
            issues.append("`REUSE_PRIOR_VERIFICATION` requires `priorVerificationArtifact`")
        if _is_missing_or_na(prior_anchor):
            issues.append("`REUSE_PRIOR_VERIFICATION` requires `priorVerificationAnchor`")
        if fresh_recompute.strip().strip("`").upper() not in {"NO", "FALSE"}:
            issues.append("`REUSE_PRIOR_VERIFICATION` requires `freshRecomputeRequired: NO`")
    elif mode_value == "RECOMPUTE_REQUIRED":
        if _is_missing_or_na(recompute_reason):
            issues.append("`RECOMPUTE_REQUIRED` requires a concrete `recomputeReason`")
    elif mode_value == "REVIEWER_RECOMPUTE_ONLY":
        if _is_missing_or_na(prior_artifact):
            issues.append("`REVIEWER_RECOMPUTE_ONLY` requires `priorVerificationArtifact`")

    if re.search(r"unicode|extracted[- ]text", text, re.IGNORECASE):
        if _is_missing_or_na(unicode_handling):
            issues.append("Unicode or extracted-text evidence requires `unicodePathHandling`")
        elif not re.search(r"literal|utf-?8|utf8", unicode_handling, re.IGNORECASE):
            issues.append("`unicodePathHandling` must require literal paths or UTF-8-safe readers")
    if re.search(r"extracted[- ]text", text, re.IGNORECASE):
        normalized_authority = extracted_authority.strip().strip("`")
        if normalized_authority not in {"SOURCE_AUTHORITY", "AUXILIARY_ONLY", "N/A with reason"}:
            issues.append(
                "`extractedTextAuthority` must be SOURCE_AUTHORITY, AUXILIARY_ONLY, or N/A with reason"
            )

    return issues


def _extract_role_routing_modes(section: str) -> set[str]:
    upper_section = section.upper()
    return {
        mode
        for mode in ROLE_ROUTING_MODES | PENDING_ROLE_ROUTING_MODES
        if mode in upper_section
    }


def _validate_intake_role_routing_decision(text: str, artifact_label: str) -> list[str]:
    section = _extract_section(text, INTAKE_ROLE_ROUTING_MARKER)
    if not section:
        return [
            f"dispatch/ready {artifact_label} lacks `## {INTAKE_ROLE_ROUTING_MARKER}`"
        ]

    issues: list[str] = []
    modes = _extract_role_routing_modes(section)
    allowed_modes = modes & ROLE_ROUTING_MODES
    pending_modes = modes & PENDING_ROLE_ROUTING_MODES
    if not allowed_modes and not pending_modes:
        issues.append(
            f"{artifact_label} intake role routing decision lacks a canonical route mode"
        )
    if pending_modes:
        issues.append(
            f"dispatch/ready {artifact_label} records pending role routing mode "
            f"`{sorted(pending_modes)[0]}`; keep status HOLD/DRAFT until routing is resolved"
        )
    if len(allowed_modes) > 1:
        issues.append(
            f"{artifact_label} intake role routing decision records multiple route modes: "
            f"{', '.join(sorted(allowed_modes))}"
        )

    required_patterns = {
        "intake summary": r"intake|user request|operator request|raw request|non-coder",
        "scope classification": r"scope|bounded|blast radius|changed paths|allowed scope",
        "risk sensitivity": r"risk|public-sync|provider|live|secret|legal|production|readiness",
        "selected role route": r"role route|routing mode|execution model|selected route|routeMode|route mode",
        "role separation basis": r"worker|reviewer|orchestrator|single-agent|multi-agent|single_agent|multi_agent",
        "escalation condition": r"escalation|operator checkpoint|external reviewer|hold|blocked|stop",
    }
    for label, pattern in required_patterns.items():
        if not re.search(pattern, section, re.IGNORECASE):
            issues.append(
                f"{artifact_label} intake role routing decision is missing {label}"
            )

    if "SINGLE_AGENT_MULTI_ROLE" in allowed_modes and SINGLE_AGENT_MULTI_ROLE_MARKER not in text:
        issues.append(
            f"{artifact_label} selects `SINGLE_AGENT_MULTI_ROLE` but lacks "
            f"`## {SINGLE_AGENT_MULTI_ROLE_MARKER}`"
        )

    return sorted(set(issues))


def _validate_ready_dependency_release(text: str) -> list[str]:
    return _validate_ready_dependency_release_with_commit_check(text, _commit_contains_path)


def _looks_like_live_method_proof(text: str) -> bool:
    lowered = text.lower()
    return (
        "live proof" in lowered
        and ("provider method" in lowered or "json_mode" in lowered or "streaming" in lowered or "tool_call" in lowered)
    )


def _has_source_verified_executable_proof_path(text: str) -> bool:
    for row in _parse_markdown_tables(text):
        if "ACCEPT" not in row.get("Disposition", "").upper():
            continue
        joined = " ".join(row.values()).lower()
        if "executable" not in joined or "proof path" not in joined:
            continue
        if any(_exists_rel(source_path) for source_path in _extract_paths(row.get("Source file", ""))):
            return True
    return False


def _validate_ready_live_method_proof_path(text: str) -> list[str]:
    if not _looks_like_live_method_proof(text):
        return []
    if "/api/execute" not in text and "method flag" not in text.lower():
        return []
    if _has_source_verified_executable_proof_path(text):
        return []
    return [
        "dispatch/ready live-method proof cites generic `/api/execute` or a method flag "
        "without a source-verified executable proof path"
    ]


def _validate_no_empty_range_commands(text: str) -> list[str]:
    if re.search(r"--base\s+HEAD\s+--head\s+HEAD", text):
        return [
            "artifact records an empty `--base HEAD --head HEAD` verification range; "
            "use the actual base/head range or the autorun wrapper default for closure"
        ]
    return []


def _extract_accept_owner_map_concepts(source_text: str) -> list[str]:
    concepts: list[str] = []
    for raw_line in source_text.splitlines():
        stripped = raw_line.strip()
        if not (stripped.startswith("|") and "ACCEPT_AS_OWNER_MAP" in stripped):
            continue
        cells = [cell.strip().strip("`") for cell in stripped.strip("|").split("|")]
        if len(cells) < 2:
            continue
        concept = re.sub(r"\s+", " ", cells[0]).strip()
        if concept and concept.lower() != "concept":
            concepts.append(concept)
    return concepts


def _normalize_concept_text(value: str) -> str:
    value = re.sub(r"`([^`]+)`", r"\1", value)
    value = re.sub(r"[^A-Za-z0-9]+", " ", value).lower()
    return re.sub(r"\s+", " ", value).strip()


def _concept_mentioned(text: str, concept: str) -> bool:
    normalized_text = _normalize_concept_text(text)
    normalized_concept = _normalize_concept_text(concept)
    if normalized_concept and normalized_concept in normalized_text:
        return True
    tokens = [
        token
        for token in normalized_concept.split()
        if token not in {"the", "and", "for", "with", "remaining", "items", "item"}
    ]
    if not tokens:
        return False
    # Long concept names may include explanatory parentheticals. Requiring every
    # token would make disposition tables brittle, so require the leading core.
    core_tokens = tokens[: min(4, len(tokens))]
    return all(re.search(rf"\b{re.escape(token)}\b", normalized_text) for token in core_tokens)


def _claims_all_accept_owner_map_coverage(text: str) -> bool:
    return re.search(
        r"(?:covers|cover|absorb|absorbs|covering)[\s\S]{0,180}"
        r"ACCEPT_AS_OWNER_MAP|ACCEPT_AS_OWNER_MAP[\s\S]{0,180}(?:all|remaining)",
        text,
        re.IGNORECASE,
    ) is not None


def _validate_accept_owner_map_coverage(text: str) -> list[str]:
    if not _claims_all_accept_owner_map_coverage(text):
        return []
    audit_text = _read_rel(IMPORTANT_FULL_SCAN_AUDIT_PATH)
    if not audit_text:
        return [
            f"artifact claims complete ACCEPT_AS_OWNER_MAP coverage but `{IMPORTANT_FULL_SCAN_AUDIT_PATH}` is missing"
        ]
    missing = [
        concept
        for concept in _extract_accept_owner_map_concepts(audit_text)
        if not _concept_mentioned(text, concept)
    ]
    if not missing:
        return []
    return [
        "artifact claims complete ACCEPT_AS_OWNER_MAP coverage but lacks disposition for: "
        + "; ".join(missing)
    ]


def _has_runtime_freshness_section(text: str) -> bool:
    return re.search(
        r"^##\s+(?:Current Runtime Freshness Verification|Runtime Freshness Verification|Repo Freshness Verification)\b",
        text,
        re.MULTILINE | re.IGNORECASE,
    ) is not None


def _has_absence_or_staleness_claim(text: str) -> bool:
    return re.search(
        r"\b(?:NOT in CVF|not implemented|completely absent|absent from CVF|"
        r"no registry|no learning orchestrator|hardcoded strings?|per-role only|"
        r"no typed execution strategy|no relevance scoring|"
        r"no registry update|"
        r"no provider/API key use|no provider calls?|must not call providers?|"
        r"do not call providers?)\b",
        text,
        re.IGNORECASE,
    ) is not None


def _validate_runtime_freshness_claims(text: str) -> list[str]:
    issues: list[str] = []
    if _has_absence_or_staleness_claim(text) and not _has_runtime_freshness_section(text):
        issues.append(
            "artifact makes absent/not-implemented/hardcoded runtime claims without a "
            "`Current Runtime Freshness Verification` section"
        )

    if "resolveProviderForRole" in text and "EXTENSIONS/CVF_ECO_v2.2_GOVERNANCE_CLI/src/execute.client.ts" not in text:
        issues.append(
            "`resolveProviderForRole()` claim must cite current source "
            "`EXTENSIONS/CVF_ECO_v2.2_GOVERNANCE_CLI/src/execute.client.ts`"
        )

    provider_registry_claim = re.search(
        r"provider[\s\S]{0,120}(?:hardcoded|no registry|no model registry|no provider/API key use|no provider calls?)"
        r"|(?:hardcoded|no registry|no model registry|no provider/API key use|no provider calls?)[\s\S]{0,120}provider",
        text,
        re.IGNORECASE,
    )
    if provider_registry_claim:
        if (
            "EXTENSIONS/CVF_MODEL_GATEWAY/src/provider-registry.ts" not in text
            and "PROVIDER_CAPABILITY_REGISTRY" not in text
        ):
            issues.append(
                "provider registry absence/hardcoded claim must account for current "
                "`EXTENSIONS/CVF_MODEL_GATEWAY/src/provider-registry.ts` and "
                "`PROVIDER_CAPABILITY_REGISTRY` surfaces"
            )

    if re.search(r"consolidation and decay[\s\S]{0,120}(?:NOT implemented|not implemented|absent)", text, re.IGNORECASE):
        if "EXTENSIONS/CVF_LEARNING_PLANE_FOUNDATION/src/memory-lifecycle-policy.ts" not in text:
            issues.append(
                "memory consolidation/decay absence claim must account for current "
                "`EXTENSIONS/CVF_LEARNING_PLANE_FOUNDATION/src/memory-lifecycle-policy.ts`"
            )

    if re.search(r"No learning orchestrator in CVF|learning orchestrator[\s\S]{0,80}NOT in CVF", text, re.IGNORECASE):
        if (
            "EXTENSIONS/CVF_LEARNING_PLANE_FOUNDATION/src/learning-signal-intake-bridge.ts" not in text
            and "EXTENSIONS/CVF_LEARNING_PLANE_FOUNDATION/src/feedback.ledger.contract.ts" not in text
        ):
            issues.append(
                "learning-orchestrator absence claim must account for current learning-signal "
                "and feedback ledger surfaces"
            )

    return issues


def _validate_required_first_reads(text: str) -> list[str]:
    issues: list[str] = []
    section = _extract_section(text, "Required First Reads")
    for path in _extract_paths(section):
        if not _exists_rel(path):
            issues.append(f"Required First Reads cites missing path `{path}`")
    return issues


def _classify_size_guard_path(path: str) -> str:
    suffix = Path(path).suffix.lower()
    lower = path.lower()
    if suffix == ".md":
        return "active_markdown"
    if ".test." in lower or "/tests/" in lower:
        return "test_code"
    if suffix in {".tsx", ".jsx"}:
        return "frontend_component"
    return "general_source"


def _validate_near_threshold_owner_maintainability_plan(text: str) -> list[str]:
    issues: list[str] = []
    registry_path = REPO_ROOT / FILE_SIZE_REGISTRY_PATH
    if not registry_path.exists():
        return issues
    try:
        registry = json.loads(registry_path.read_text(encoding="utf-8"))
    except json.JSONDecodeError:
        return [f"`{FILE_SIZE_REGISTRY_PATH}` is invalid JSON"]

    thresholds = registry.get("thresholds", {})
    margin = int(registry.get("nearHardRotationMarginLines", 25))
    min_shrink = int(registry.get("nearHardMinShrinkLines", 50))
    ownership_text = "\n".join(
        [
            _extract_allowed_scope_text(text),
            _extract_section(text, "Write Ownership"),
        ]
    )
    ownership_paths = set(_extract_paths(ownership_text))
    forbidden_paths = set(_extract_paths(_extract_forbidden_scope_text(text)))
    plan_text = _extract_section(text, NEAR_THRESHOLD_PLAN_MARKER)

    for owner in registry.get("proactiveOwnerSurfaces", []):
        if not isinstance(owner, dict) or owner.get("status") != "ACTIVE":
            continue
        owner_path = str(owner.get("path", "")).replace("\\", "/").strip()
        prefixes = [
            str(prefix).replace("\\", "/").strip()
            for prefix in owner.get("domainPrefixes", [])
            if str(prefix).strip()
        ]
        full_owner_path = REPO_ROOT / owner_path
        if not owner_path or not prefixes or not full_owner_path.exists():
            continue
        file_class = _classify_size_guard_path(owner_path)
        hard = int(thresholds.get(file_class, {}).get("hardThresholdLines", 0) or 0)
        lines = len(full_owner_path.read_text(encoding="utf-8", errors="replace").splitlines())
        if not hard or lines < max(1, hard - margin):
            continue
        adjacent_owned = sorted(
            path
            for path in ownership_paths
            if path != owner_path and any(path.startswith(prefix) for prefix in prefixes)
        )
        if not adjacent_owned:
            continue
        if not plan_text:
            issues.append(
                f"dispatch/ready work order enters registered near-threshold owner domain for `{owner_path}` "
                f"({lines}/{hard} lines) without `## {NEAR_THRESHOLD_PLAN_MARKER}`"
            )
            continue
        if owner_path not in ownership_paths:
            issues.append(
                f"dispatch/ready work order enters registered near-threshold owner domain for `{owner_path}` "
                "but does not include the owner entrypoint in Allowed scope or Write Ownership"
            )
        if owner_path in forbidden_paths:
            issues.append(
                f"dispatch/ready work order treats near-threshold owner entrypoint `{owner_path}` as forbidden-touch; "
                "split/shrink ownership is required instead of bypassing maintainability debt"
            )
        if owner_path not in plan_text:
            issues.append(
                f"`## {NEAR_THRESHOLD_PLAN_MARKER}` must cite near-threshold owner entrypoint `{owner_path}`"
            )
        if not re.search(r"\b(?:split|extract|rotate|archive)\b", plan_text, re.IGNORECASE):
            issues.append(
                f"`## {NEAR_THRESHOLD_PLAN_MARKER}` must name a split/extract/rotate/archive action for `{owner_path}`"
            )
        if not re.search(
            rf"Minimum shrink target:\s*{min_shrink}\s+lines\b",
            plan_text,
            re.IGNORECASE,
        ):
            issues.append(
                f"`## {NEAR_THRESHOLD_PLAN_MARKER}` must include `Minimum shrink target: {min_shrink} lines`"
            )
    return issues


