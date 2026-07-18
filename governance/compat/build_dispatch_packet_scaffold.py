#!/usr/bin/env python3
"""
CVF Dispatch Packet Authoring Scaffold Helper (WOAS-R1).

Generates prefilled GC-018 baseline and work-order markdown skeletons so a
dispatch author starts from a form that already contains the machine-shape
sections several `governance/compat/check_*.py` gates require, instead of
blank-page authoring that discovers required literal tokens one gate failure
at a time.

Standard: docs/reference/work_order_authoring/CVF_WOAS_R1_DISPATCH_PACKET_AUTHORING_SCAFFOLD_STANDARD.md

This helper does not write files, does not call any live provider, does not
mutate git, session state, or any governed artifact. It only prints generated
markdown text to stdout when explicitly invoked. Generated output still
requires the dispatching agent to fill in real source-verified evidence,
run the ADIF resolver, and read applicable checker source before authoring
the final artifact.

Claim boundary: scaffold/text-generation helper only. No runtime, provider,
live-proof, Web, MCP, CLI, package-lifecycle, model-router, public-sync,
action-authority, or automatic-invocation behavior is implemented or claimed.
"""

from __future__ import annotations

import argparse
import re
import sys
from dataclasses import dataclass, field

from build_worker_return_skeleton_scaffold import build_worker_return_skeleton

PACKET_KINDS = (
    "generic-worker-dispatch",
    "held-dependency",
    "source-intake",
    "runtime-provider-live",
    "package-skill",
    "web-ui-dashboard",
    "mcp-cli-adapter",
    "public-sync",
    "protected-governance-path",
)

COMMIT_MODES = ("WORKER_MUST_NOT_COMMIT", "WORKER_MAY_COMMIT")

# Each trigger family: (key, family label, indicator examples, required generated stub label)
TRIGGER_FAMILIES: tuple[tuple[str, str, tuple[str, ...], str], ...] = (
    (
        "held_dependency",
        "held dependency",
        ("dependency text", "--status HOLD_*", "held-dependency"),
        "## Dependency Release Evidence",
    ),
    (
        "no_commit_worker",
        "no-commit worker",
        ("--commit-mode WORKER_MUST_NOT_COMMIT",),
        "## Agent Handoff Contract Control Block; ## Reviewer Closure Conversion; "
        "## Worker Return Packet Shape Contract",
    ),
    (
        "source_intake",
        "source-intake",
        ("source intake", "outside-source", "repo folder review", "copied folder", "source-intake"),
        "source-intake decision packet fields and negative-search rows",
    ),
    (
        "runtime_provider_live",
        "runtime/provider/live",
        ("runtime", "provider", "live proof", "model gateway"),
        "live-proof boundary and diagnostic reminder",
    ),
    (
        "package_skill",
        "package-skill",
        ("package skill", "ASSF", "skill registry"),
        "package-skill productionization boundary stub",
    ),
    (
        "web_ui_dashboard",
        "Web/UI/dashboard",
        ("Web", "UI", "dashboard", "frontend"),
        "DESIGN.md read reminder and UI claim boundary",
    ),
    (
        "mcp_cli",
        "MCP/CLI",
        ("MCP", "CLI", "adapter"),
        "adapter boundary and no-runtime-overclaim stub",
    ),
    (
        "public_sync",
        "public-sync",
        ("public export", "public-sync"),
        "public/provenance boundary and export disposition stub",
    ),
    (
        "unicode_evidence_reuse",
        "Unicode/evidence reuse",
        ("Unicode", "encoding", "prior evidence", "receipt reuse"),
        "evidence-reuse and encoding plan stub",
    ),
    (
        "protected_governance_path",
        "protected governance path",
        ("checker", "hook catalog", "autorun catalog", "session state"),
        "core guard self-protection authorization stub",
    ),
)

_WORD_INDICATOR_RE_CACHE: dict[str, re.Pattern[str]] = {}


def _word_pattern(indicator: str) -> re.Pattern[str]:
    pattern = _WORD_INDICATOR_RE_CACHE.get(indicator)
    if pattern is None:
        pattern = re.compile(r"\b" + re.escape(indicator.lower()) + r"\b")
        _WORD_INDICATOR_RE_CACHE[indicator] = pattern
    return pattern


def _matches_any_indicator(text: str, indicators: tuple[str, ...]) -> bool:
    lowered = text.lower()
    for indicator in indicators:
        if indicator.startswith("--"):
            continue
        if _word_pattern(indicator).search(lowered):
            return True
    return False


@dataclass
class ScaffoldArgs:
    packet_kind: str
    batch_id: str
    title: str
    date: str
    base: str
    commit_mode: str
    dependencies: list[str] = field(default_factory=list)
    include_worker_return_skeleton: bool = False


def detect_triggers(args: ScaffoldArgs) -> dict[str, bool]:
    """Return which trigger families are active for this invocation."""
    combined = " ".join([args.title, args.packet_kind, *args.dependencies])
    active: dict[str, bool] = {}
    for key, _name, indicators, _stub in TRIGGER_FAMILIES:
        if key == "held_dependency":
            active[key] = bool(args.dependencies) or args.packet_kind == "held-dependency"
            continue
        if key == "no_commit_worker":
            active[key] = args.commit_mode == "WORKER_MUST_NOT_COMMIT"
            continue
        active[key] = _matches_any_indicator(combined, indicators)
    return active


def build_trigger_map_table(active: dict[str, bool] | None = None) -> str:
    """Print an explainable, always-available reference table of trigger families."""
    lines = [
        "=== CVF Dispatch Packet Scaffold Trigger Map ===",
        "",
        "| Trigger family | Input indicator examples | Required generated stub | Status |",
        "| --- | --- | --- | --- |",
    ]
    for key, name, indicators, stub in TRIGGER_FAMILIES:
        indicator_text = ", ".join(indicators)
        status = "N/A (reference only)"
        if active is not None:
            status = "ACTIVE" if active.get(key) else "inactive"
        lines.append(f"| {name} | {indicator_text} | {stub} | {status} |")
    lines.append("")
    lines.append(
        "Claim boundary: reference/explanation table only; no runtime, provider, "
        "live, public-sync, package, Web, or MCP/CLI behavior is implemented."
    )
    return "\n".join(lines)


def _adif_disclosure_block() -> str:
    return (
        "## ADIF Defect Registry Disclosure\n\n"
        "Resolver query: taskClass=`FILL_ME`, role=`FILL_ME`, lifecyclePhase=`FILL_ME`\n\n"
        "Returned defects: FILL_ME_AFTER_RUNNING_RESOLVER\n\n"
        "| Field | Value |\n"
        "| --- | --- |\n"
        "| Resolver command | `python governance/compat/run_adif_defect_resolver.py "
        "--task-class \"FILL_ME\" --role FILL_ME --lifecycle-phase FILL_ME` |\n"
        "| Returned defect count | FILL_ME |\n"
        "| Returned defects | FILL_ME |\n"
        "| Disclosed defectIds | FILL_ME |\n"
        "| Dispatch impact | FILL_ME |\n\n"
        "Author reminder: run the resolver command above for real before dispatch; "
        "list every defectId it actually returns."
    )


def _checker_read_ahead_block() -> str:
    return (
        "## Checker Source Read-Ahead Block\n\n"
        "| Field | Value |\n"
        "| --- | --- |\n"
        "| applicableCheckersRead | FILL_ME (list `governance/compat/check_*.py` paths actually read) |\n"
        "| literalTokensReviewed | FILL_ME (exact headings, table labels, enum tokens, or "
        "regex-sensitive words reviewed) |\n"
        "| gateRunPurpose | FILL_ME (state confirmation/evidence, not first discovery) |\n"
        "| claimBoundary | FILL_ME (bound what this read-ahead block does and does not cover) |\n\n"
        "Author reminder: read every applicable checker source before writing the first "
        "governed line, then fill this block as confirmation evidence."
    )


def _source_verification_block() -> str:
    return (
        "## Source Verification Block\n\n"
        "| Claimed item | Claim type | Source file | Verified line/section | "
        "Verified path or symbol | Owning interface/function/schema | Disposition |\n"
        "| --- | --- | --- | --- | --- | --- | --- |\n"
        "| FILL_ME | FILL_ME | FILL_ME | FILL_ME | FILL_ME | FILL_ME | "
        "ACCEPT/REJECT/BLOCKED_SOURCE_NOT_FOUND |\n\n"
        "Author reminder: every claimed item needs a real source file and "
        "line/section; do not leave placeholder rows in the dispatched artifact."
    )


def _negative_search_block(title: str, date: str) -> str:
    return (
        "## Negative Search And Collision Discipline\n\n"
        "| Check | Evidence | Disposition |\n"
        "| --- | --- | --- |\n"
        f"| Path existence for \"{title}\" artifacts | `Test-Path` result before authoring | FILL_ME |\n"
        f"| Token search for \"{title}\" ({date}) | search roots: governed artifact roots plus session state; exact search command: `rg -n \"FILL_ME\" docs CVF_SESSION`; query used FILL_ME; result: FILL_ME | FILL_ME |\n"
        "| Collision decision | FILL_ME | FILL_ME |\n\n"
        "Author reminder: run the searches for real before dispatch; do not leave "
        "placeholder rows."
    )


def _public_export_disposition_block() -> str:
    return (
        "## Public Export Disposition\n\n"
        "DEFERRED_PRIVATE_ONLY\n\n"
        "Reason: FILL_ME (default private-only scaffold value; override with real "
        "EXPORTED or BLOCKED_MISSING_PUBLIC_ARTIFACTS evidence only if this packet "
        "genuinely changes public-sync scope)."
    )


def _dependency_release_block(dependencies: list[str]) -> str:
    lines = [
        "## Dependency Release Evidence",
        "",
        "| Dependency | Current evidence | Release rule | Disposition |",
        "| --- | --- | --- | --- |",
    ]
    if dependencies:
        for dep in dependencies:
            lines.append(f"| {dep} | FILL_ME | FILL_ME | FILL_ME |")
    else:
        lines.append("| FILL_ME | FILL_ME | FILL_ME | FILL_ME |")
    lines.append("")
    lines.append(
        "Author reminder: do not move this packet to DISPATCH_READY/DISPATCHED "
        "until every dependency row carries source-backed evidence."
    )
    return "\n".join(lines)


def _runtime_freshness_block() -> str:
    return (
        "## Current Runtime Freshness Verification\n\n"
        "| Field | Value |\n"
        "| --- | --- |\n"
        "| runtimeClaimPresent | NO |\n"
        "| runtimeMutationAuthorized | NO |\n"
        "| freshnessVerificationMode | NOT_APPLICABLE_WITH_REASON |\n"
        "| reason | FILL_ME: state why no runtime/provider/live claim is made, or "
        "replace this block with real live-proof evidence per "
        "`AGENTS.md` Mandatory Live Governance Proof section. |\n"
        "| requiredFutureAction | FILL_ME |\n\n"
        "Live-proof boundary reminder: mock mode is UI-structure-only; any claim "
        "about governance behavior, provider routing, or model call requires a "
        "real API call and a live-run diagnostic per "
        "`docs/reference/CVF_LIVE_RUN_DIAGNOSTIC_STANDARD_2026-05-24.md`."
    )


def _package_skill_block() -> str:
    return (
        "## Package Skill Productionization Control Block\n\n"
        "SOP source: `docs/reference/agent_system_skills/CVF_PACKAGE_SKILL_PRODUCTIONIZATION_SOP.md`\n\n"
        "Current phase: FILL_ME or `N/A with reason` if no package-skill lifecycle "
        "state changes.\n\n"
        "Target lifecycle state: FILL_ME.\n\n"
        "Prior phase evidence: FILL_ME.\n\n"
        "Next forbidden skip: do not use this packet to promote, activate, load, "
        "project, or claim runtime eligibility for any package skill without "
        "source-backed SOP evidence.\n\n"
        "Runtime/provider proof: FILL_ME or `N/A with reason`.\n\n"
        "Claim boundary: FILL_ME."
    )


def _web_ui_stub() -> str:
    return (
        "## Web/UI Claim Boundary (trigger stub)\n\n"
        "Read `DESIGN.md` before any Web/UI/dashboard implementation work.\n\n"
        "| Field | Value |\n"
        "| --- | --- |\n"
        "| DESIGN.md read | FILL_ME (confirm read before implementation) |\n"
        "| UI claim boundary | FILL_ME: no production-readiness, hosted, or "
        "live-data claim without separate evidence |\n"
    )


def _mcp_cli_stub() -> str:
    return (
        "## MCP/CLI Adapter Boundary (trigger stub)\n\n"
        "| Field | Value |\n"
        "| --- | --- |\n"
        "| Adapter scope | FILL_ME |\n"
        "| No-runtime-overclaim | This packet does not claim the adapter executes, "
        "intercepts, or wraps any runtime command unless separately proven. |\n"
    )


def _public_sync_stub() -> str:
    return (
        "## Public/Provenance Boundary (trigger stub)\n\n"
        "| Field | Value |\n"
        "| --- | --- |\n"
        "| Provenance repo | this workspace is the private provenance repository |\n"
        "| Public-sync boundary | FILL_ME: confirm `git remote -v` before any push "
        "intended for the public repository; never push provenance archive to "
        "the public repository |\n"
        "| Export disposition | see `## Public Export Disposition` below |\n"
    )


def _evidence_reuse_stub() -> str:
    return (
        "## Evidence Reuse And Encoding Plan (trigger stub)\n\n"
        "Standard: `docs/reference/CVF_PRIOR_VERIFICATION_REUSE_AND_UNICODE_EVIDENCE_HANDLING_STANDARD_2026-06-11.md`\n\n"
        "| Field | Value |\n"
        "| --- | --- |\n"
        "| verificationMode | FILL_ME (REUSE_PRIOR_VERIFICATION / RECOMPUTE_REQUIRED / "
        "REVIEWER_RECOMPUTE_ONLY) |\n"
        "| encodingPlan | FILL_ME: explicit `encoding=\"utf-8\", errors=\"replace\"` for "
        "any new subprocess text decoding |\n"
        "\n"
        "verificationMode: FILL_ME\n"
        "priorVerificationArtifact: FILL_ME\n"
        "priorVerificationAnchor: FILL_ME\n"
        "freshRecomputeRequired: FILL_ME\n"
        "unicodePathHandling: use literal paths and UTF-8-safe readers for governed artifact reads.\n"
        "extractedTextAuthority: FILL_ME\n"
        "\n"
        "Author reminder: keep these scalar field lines. The dispatch-quality "
        "checker reads them with a field-line parser and does not treat table "
        "cells as substitutes."
    )


def _scaffold_provenance_block(args: ScaffoldArgs) -> str:
    helper_cmd = (
        f"python governance/compat/build_dispatch_packet_scaffold.py"
        f" --packet-kind {args.packet_kind}"
        f" --batch-id {args.batch_id}"
        f' --title "{args.title}"'
        f" --date {args.date}"
        f" --base {args.base}"
        f" --commit-mode {args.commit_mode}"
    )
    if args.include_worker_return_skeleton:
        helper_cmd += " --include-worker-return-skeleton"
    helper_cmd += " --stdout"
    return (
        "## Scaffold Provenance Block\n\n"
        "| Field | Value |\n"
        "| --- | --- |\n"
        f"| scaffoldHelperCommand | `{helper_cmd}` |\n"
        f"| generatedProfile | {args.packet_kind} plus {args.commit_mode} no-commit worker profile |\n"
        "| generatedSkeletonStatus | USED_AS_STARTING_POINT |\n"
        "| manualEditsAfterScaffold | FILL_ME (describe manual edits made after scaffold generation) |\n"
        "| checkerReadAheadConfirmation | FILL_ME (list `governance/compat/check_*.py` paths read before authoring) |\n"
        "| docOnlyNewFields | FILL_ME (list new doc-only field names introduced by this dispatch) |\n"
        "| claimBoundary | Dispatch authoring provenance only; no runtime/provider/live/public/Web/MCP/model-router behavior claim. |\n"
    )


def _protected_governance_stub() -> str:
    return (
        "## Core Guard Self-Protection Authorization (trigger stub)\n\n"
        "| Field | Value |\n"
        "| --- | --- |\n"
        "| Authorized guard-maintenance scope | FILL_ME |\n"
        "| Protected paths | FILL_ME (list every `governance/compat/*.py`, "
        "`AGENTS.md`, hook-catalog, autorun-catalog, or session-state path "
        "actually changed) |\n"
        "| Operator authorization | FILL_ME |\n"
        "| Rollback boundary | FILL_ME |\n"
        "| Not authorized | FILL_ME |\n"
    )


def _source_intake_stub() -> str:
    return (
        "## Source-Intake Decision Packet Fields (trigger stub)\n\n"
        "| Field | Value |\n"
        "| --- | --- |\n"
        "| Chain map | `docs/reference/external_agent_review/"
        "CVF_EXTERNAL_KNOWLEDGE_ABSORPTION_CHAIN_MAP.md` |\n"
        "| Input type | FILL_ME (must be a canonical chain-map input type) |\n"
        "| Negative search performed | FILL_ME |\n"
        "| Disposition | FILL_ME (ABSORB/ADAPT/DEFER/REJECT/BLOCK/"
        "PACKAGE_CANDIDATE/RUNTIME_CANDIDATE/CHECKER_CANDIDATE/"
        "NO_PACKAGE_OR_RUNTIME_VALUE) |\n"
    )


def _agent_handoff_control_block(args: ScaffoldArgs) -> str:
    return (
        "## Agent Handoff Contract Control Block\n\n"
        "Contract source archive-qualified exception: "
        "`docs/reference/CVF_AHB_T2_AGENT_HANDOFF_CONTRACT_RATIFICATION_2026-06-16.md`\n\n"
        "| Field | Value |\n"
        "| --- | --- |\n"
        "| route | FILL_ME (SINGLE_AGENT_SINGLE_ROLE / SINGLE_AGENT_MULTI_ROLE / "
        "MULTI_AGENT_SINGLE_ROLE / MULTI_AGENT_MULTI_ROLE) |\n"
        "| rolePattern | FILL_ME |\n"
        "| phase | FILL_ME |\n"
        f"| baseHeadFor(phase) | dispatchBaseHead={args.base}; "
        "executionBaseHead=WORKER_MUST_CAPTURE_AT_START; closureBaseHead=REVIEWER_TO_SET |\n"
        "| changedSetScope(phase) | FILL_ME |\n"
        "| traceScope(phase, actor) | FILL_ME |\n"
        f"| commitOwner(phase) | {args.commit_mode} |\n"
        "| crossBatchIsolation | FILL_ME |\n"
        "| nextMoveSurfaces | FILL_ME |\n"
    )


def _reviewer_closure_conversion_block(batch_id: str, date: str) -> str:
    return (
        "## Reviewer Closure Conversion\n\n"
        "| Field | Value |\n"
        "| --- | --- |\n"
        f"| completionReviewPath | `docs/reviews/CVF_{batch_id}_COMPLETION_{date}.md` "
        "(optional; prefer repairing evidence in the worker return per gotcha 30) |\n"
        "| reviewerOwnedClosurePaths | FILL_ME |\n"
        "| closureOwner | FILL_ME |\n"
        "| workerCommitPermission | FORBIDDEN |\n"
    )


def _work_order_fulfillment_manifest() -> str:
    return (
        "## Work-Order Fulfillment Manifest\n\n"
        "| Artifact | Required worker action |\n"
        "| --- | --- |\n"
        "| FILL_ME | FILL_ME |\n"
    )


def _worker_return_packet_shape_contract(worker_return_path: str) -> str:
    return (
        "## Worker Return Packet Shape Contract\n\n"
        f"workerReturnPath: `{worker_return_path}`\n"
        "contractProfile: WORKER_RETURN_FULL_GATE_V1\n"
        "requiredGate: `python governance/compat/run_worker_return_fast_gate.py`\n"
        "individualCheckerSubstitution: FORBIDDEN\n"
        "workerReturnSkeleton: CHECKER_SAFE_SKELETON_REQUIRED\n"
        "\n"
        "Shape-list rule: when listing required worker-output sections, write "
        "section names without the `##` prefix. Reserve actual heading syntax "
        "for real sections so structural checkers do not treat this checklist "
        "as the artifact section body.\n"
    )


def _worker_output_checker_read_ahead_mandate() -> str:
    return (
        "## Worker Output Checker Read-Ahead Mandate\n\n"
        "Before writing each worker-owned output artifact, read checker source "
        "for that file's docType, path family, and conditional content class.\n\n"
        "| Output artifact | Required read-ahead result |\n"
        "| --- | --- |\n"
        "| worker return under `docs/reviews/` | derive exact review headings, worker-return quality terms, trace labels, delta boundary labels, corpus/value/rescan tokens, and no-commit evidence shape before writing |\n"
        "| companion reference under `docs/reference/` | derive exact reference headings such as Scope / Applies To, Target / Source, source verification, corpus/value/rescan, trace, and claim-boundary labels before writing |\n\n"
        "Literal-shape reminders: do not list required headings as backticked "
        "`## ...` strings before the real section; write source-not-found "
        "disposition spelling instead of the exact blocked enum in "
        "literalTokensReviewed; avoid `after ... closure` wording unless a "
        "dependency-release row cites the accepted artifact path and commit."
    )


def _verification_commands_block(args: ScaffoldArgs) -> str:
    lines = [
        "## Verification Commands",
        "",
        "```powershell",
        "python governance/compat/run_agent_autorun_workflow_gate.py "
        f"--phase pre-implementation --base {args.base} --head HEAD",
    ]
    if args.commit_mode == "WORKER_MUST_NOT_COMMIT":
        lines.append("python governance/compat/run_worker_return_fast_gate.py")
    lines.extend(
        [
            "git status --short",
            "```",
        ]
    )
    return "\n".join(lines)


def _delta_claim_boundary_block() -> str:
    return (
        "## Delta Execution Claim Boundary Control Block\n\n"
        "| Field | Value |\n"
        "| --- | --- |\n"
        "| claimScope | FILL_ME |\n"
        "| claimDisposition | CLAIM_REJECTED: no execution-control, "
        "runtime-enforcement, direct-interception, or mandatory-wrapper "
        "behavior is claimed unless replaced with real evidence. |\n"
        "| receiptEvidence | FILL_ME |\n"
        "| actionEvidence | FILL_ME |\n"
        "| invocationBoundary | FILL_ME |\n"
        "| interceptionBoundary | No direct interception, wrapper/proxy "
        "enforcement, runtime gate, or agent coding control is authorized "
        "unless replaced with real evidence. |\n"
        "| claimLanguage | FILL_ME |\n"
        "| forbiddenExpansion | Do not expand into runtime/provider/live/"
        "public/package/Web/MCP/model-router behavior without a fresh "
        "source-verified authorization. |\n"
    )


def _agent_operation_trace_block(args: ScaffoldArgs) -> str:
    return (
        "## Agent Operation Trace Block\n\n"
        "| Field | Evidence |\n"
        "| --- | --- |\n"
        "| Actor | FILL_ME |\n"
        "| Provider or surface | FILL_ME |\n"
        f"| Session or invocation | {args.batch_id} {args.title}, {args.date} |\n"
        "| Working directory | FILL_ME |\n"
        "| Command or tool surface | FILL_ME |\n"
        "| Target paths | FILL_ME |\n"
        "| Allowed scope source | FILL_ME |\n"
        "| Before status evidence | FILL_ME |\n"
        "| After status evidence | FILL_ME |\n"
        "| Diff evidence | `git diff --name-status` |\n"
        "| Approval boundary | FILL_ME |\n"
        "| Claim boundary | FILL_ME |\n"
        "| Agent type | FILL_ME |\n"
        f"| Invocation ID | `{args.batch_id.lower()}-{args.date}` |\n"
        "| Expected manifest | FILL_ME |\n"
        "| Actual changed set | FILL_ME |\n"
        "| Manifest delta | FILL_ME |\n"
    )


def _foundation_storage_layout_block() -> str:
    return (
        "## Foundation Storage Layout Block\n\n"
        "| Field | Value |\n"
        "| --- | --- |\n"
        "| Storage standard | `docs/reference/foundation_storage/"
        "CVF_FOUNDATION_FILE_STORAGE_AND_INDEX_STANDARD.md` |\n"
        "| Planned durable reference folder | FILL_ME |\n"
        "| Planned front door/index | FILL_ME |\n"
        "| Date policy | FILL_ME |\n"
        "| Owner surface | FILL_ME |\n"
        "| Claim boundary | FILL_ME |\n"
    )


def build_gc018_baseline(args: ScaffoldArgs, active: dict[str, bool]) -> str:
    lines = [
        f"# CVF GC-018 Baseline - {args.title}",
        "",
        "Memory class: governed-dispatch-baseline",
        "",
        "Status: HOLD_PENDING_OPERATOR_DECISION",
        "",
        f"Batch ID: {args.batch_id}",
        "",
        f"Dispatch base head: {args.base}",
        "",
        f"Commit mode: {args.commit_mode}",
        "",
        "Decision owner: FILL_ME (Operator)",
        "",
        "Reviewer owner: FILL_ME",
        "",
        "Worker target: FILL_ME (worker role, not a specific provider name)",
        "",
        "## Purpose",
        "",
        "FILL_ME: state the mission prompt for this baseline in one to three "
        "sentences.",
        "",
    ]
    lines.append(_scaffold_provenance_block(args))
    lines.append("")
    if active.get("held_dependency"):
        lines.append(_dependency_release_block(args.dependencies))
        lines.append("")
    lines.append(_adif_disclosure_block())
    lines.append("")
    lines.append(_checker_read_ahead_block())
    lines.append("")
    lines.append(_source_verification_block())
    lines.append("")
    lines.append(_negative_search_block(args.title, args.date))
    lines.append("")
    if active.get("runtime_provider_live"):
        lines.append(_runtime_freshness_block())
        lines.append("")
    if active.get("package_skill"):
        lines.append(_package_skill_block())
        lines.append("")
    if active.get("source_intake"):
        lines.append(_source_intake_stub())
        lines.append("")
    if active.get("web_ui_dashboard"):
        lines.append(_web_ui_stub())
        lines.append("")
    if active.get("mcp_cli"):
        lines.append(_mcp_cli_stub())
        lines.append("")
    if active.get("public_sync"):
        lines.append(_public_sync_stub())
        lines.append("")
    if active.get("unicode_evidence_reuse"):
        lines.append(_evidence_reuse_stub())
        lines.append("")
    if active.get("protected_governance_path"):
        lines.append(_protected_governance_stub())
        lines.append("")
    lines.append(
        "## Claim Boundary\n\n"
        "FILL_ME: state exactly what this baseline authorizes and what it does "
        "not (runtime, provider, public, package, Web, MCP behavior claims "
        "require explicit evidence, not silence)."
    )
    lines.append("")
    lines.append(_public_export_disposition_block())
    return "\n".join(lines) + "\n"


def build_work_order(args: ScaffoldArgs, active: dict[str, bool]) -> str:
    worker_return_path = f"docs/reviews/CVF_{args.batch_id}_WORKER_RETURN_{args.date}.md"
    lines = [
        f"# CVF Agent Work Order - {args.title}",
        "",
        "Memory class: governed-worker-dispatch",
        "",
        "Status: HOLD_PENDING_OPERATOR_DECISION",
        "",
        f"Batch ID: {args.batch_id}",
        "",
        f"Dispatch base head: {args.base}",
        "",
        f"Commit mode: {args.commit_mode}",
        "",
        "Worker: delegated worker",
        "",
        "Reviewer/closer: FILL_ME",
        "",
        f"Worker return path: `{worker_return_path}`",
        "",
        "## Dispatch Prompt Envelope",
        "",
        f"Role: delegated worker for {args.batch_id}.",
        "",
        f"Canonical packet: `docs/work_orders/CVF_AGENT_WORK_ORDER_{args.batch_id}_{args.date}.md`",
        "",
        f"Commit mode: {args.commit_mode}.",
        "",
        "executionBaseHead: WORKER_MUST_CAPTURE_AT_START.",
        "",
        f"Current-time notes: FILL_ME (artifact date is {args.date}).",
        "",
        "Do-not-misread notes: FILL_ME (state what this packet does not "
        "authorize).",
        "",
        "Required first actions: read required startup files, guard "
        "orientation, literal gotchas, this packet, the paired GC-018 "
        "baseline, and all checker source listed in the Checker Source "
        "Read-Ahead Block before writing any artifact.",
        "",
        "Return contract: create the worker return artifact, run required "
        "gates, leave changes uncommitted (if WORKER_MUST_NOT_COMMIT), and "
        "return `COMPLETE_PENDING_REVIEW` or `BLOCKED_WITH_REASON`.",
        "",
        "## Purpose",
        "",
        "FILL_ME: state the mission prompt for this work order.",
        "",
    ]
    lines.append(_scaffold_provenance_block(args))
    lines.append("")
    if active.get("held_dependency"):
        lines.append(_dependency_release_block(args.dependencies))
        lines.append("")
    lines.append(
        "## Worker Autonomy / No-Question Rule\n\n"
        "Worker must repair allowed-scope checker failures directly by reading "
        "the failing checker source and matching the literal required shape. "
        "Worker should return to orchestrator only for a source contradiction, "
        "forbidden-scope need, or missing authority that makes completion "
        "impossible."
    )
    lines.append("")
    lines.append(_adif_disclosure_block())
    lines.append("")
    lines.append(_checker_read_ahead_block())
    lines.append("")
    lines.append(_source_verification_block())
    lines.append("")
    lines.append(_negative_search_block(args.title, args.date))
    lines.append("")
    if active.get("no_commit_worker"):
        lines.append(_agent_handoff_control_block(args))
        lines.append("")
        lines.append(_reviewer_closure_conversion_block(args.batch_id, args.date))
        lines.append("")
        lines.append(_worker_output_checker_read_ahead_mandate())
        lines.append("")
    lines.append(_work_order_fulfillment_manifest())
    lines.append("")
    lines.append(_worker_return_packet_shape_contract(worker_return_path))
    lines.append("")
    lines.append(_verification_commands_block(args))
    lines.append("")
    if active.get("runtime_provider_live"):
        lines.append(_runtime_freshness_block())
        lines.append("")
    if active.get("package_skill"):
        lines.append(_package_skill_block())
        lines.append("")
    if active.get("source_intake"):
        lines.append(_source_intake_stub())
        lines.append("")
    if active.get("web_ui_dashboard"):
        lines.append(_web_ui_stub())
        lines.append("")
    if active.get("mcp_cli"):
        lines.append(_mcp_cli_stub())
        lines.append("")
    if active.get("public_sync"):
        lines.append(_public_sync_stub())
        lines.append("")
    if active.get("unicode_evidence_reuse"):
        lines.append(_evidence_reuse_stub())
        lines.append("")
    if active.get("protected_governance_path"):
        lines.append(_protected_governance_stub())
        lines.append("")
    lines.append(_agent_operation_trace_block(args))
    lines.append("")
    lines.append(_delta_claim_boundary_block())
    lines.append("")
    lines.append(
        "## Claim Boundary\n\n"
        "FILL_ME: state exactly what this work order authorizes and what it "
        "does not."
    )
    lines.append("")
    lines.append(_public_export_disposition_block())
    return "\n".join(lines) + "\n"


def _parse_args(argv: list[str] | None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Generate prefilled CVF GC-018 baseline and work-order scaffold forms."
    )
    parser.add_argument("--packet-kind", choices=PACKET_KINDS, default="generic-worker-dispatch")
    parser.add_argument("--batch-id", default=None)
    parser.add_argument("--title", default=None)
    parser.add_argument("--date", default=None)
    parser.add_argument("--base", default=None)
    parser.add_argument("--commit-mode", choices=COMMIT_MODES, default=None)
    parser.add_argument("--dependency", action="append", default=[], dest="dependencies")
    parser.add_argument("--stdout", action="store_true")
    parser.add_argument("--include-worker-return-skeleton", action="store_true")
    parser.add_argument("--explain-trigger-map", action="store_true")
    return parser.parse_args(argv)


def main(argv: list[str] | None = None) -> int:
    args = _parse_args(argv)

    if args.explain_trigger_map:
        print(build_trigger_map_table())
        return 0

    missing = [
        name
        for name, value in (
            ("--batch-id", args.batch_id),
            ("--title", args.title),
            ("--date", args.date),
            ("--base", args.base),
            ("--commit-mode", args.commit_mode),
        )
        if not value
    ]
    if missing:
        print(
            "ERROR: missing required argument(s) for packet generation: "
            + ", ".join(missing),
            file=sys.stderr,
        )
        return 2
    if not args.stdout:
        print(
            "ERROR: packet generation requires --stdout unless --explain-trigger-map is used.",
            file=sys.stderr,
        )
        return 2

    scaffold_args = ScaffoldArgs(
        packet_kind=args.packet_kind,
        batch_id=args.batch_id,
        title=args.title,
        date=args.date,
        base=args.base,
        commit_mode=args.commit_mode,
        dependencies=list(args.dependencies),
        include_worker_return_skeleton=args.include_worker_return_skeleton,
    )
    active = detect_triggers(scaffold_args)
    baseline_md = build_gc018_baseline(scaffold_args, active)
    work_order_md = build_work_order(scaffold_args, active)

    print(build_trigger_map_table(active))
    print()
    print("=== Generated GC-018 Baseline Skeleton ===")
    print(baseline_md)
    print("=== Generated Work Order Skeleton ===")
    print(work_order_md)

    if args.include_worker_return_skeleton:
        skeleton_md = build_worker_return_skeleton(scaffold_args)
        print("=== Generated Worker Return Skeleton ===")
        print(skeleton_md)

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
