#!/usr/bin/env python3
"""
CVF Work Order Dispatch Quality Gate

Hard-fails new or amended governed dispatch packets that try to move from
planning into execution before the required source, roadmap, prerequisite, and
GC-018 evidence exists.
"""

from __future__ import annotations

import argparse
import datetime as dt
import fnmatch
import json
import os
import re
import subprocess
import sys
from pathlib import Path
from typing import Any

import check_work_order_dispatch_quality_source as source_validation
from check_work_order_dispatch_quality_tables import (
    _clean_manifest_path,
    _extract_section,
    _normalize_table_key,
    _parse_any_markdown_tables,
    _parse_markdown_tables,
    _row_value,
    _section_tables,
    _truthy_cell,
)
from check_work_order_dispatch_quality_lifecycle import (
    _extract_status,
    _is_closed_status,
    _is_dispatch_status,
    _is_hold_status,
    _validate_closed_artifact_finality,
    _validate_closed_roadmap_status_residue,
    _validate_dispatch_pending_dependency_language,
    _validate_fast_lane_status_consistency,
    _validate_pending_artifact_evidence_finality,
    _validate_self_reported_gate_evidence_consistency,
    _validate_status_token_hygiene,
    _validate_ready_dependency_release as _validate_ready_dependency_release_with_commit_check,
)
from guard_binding_catalog import effective_binding_text

REPO_ROOT = Path(__file__).resolve().parents[2]
DEFAULT_BASE_CANDIDATES = ("origin/main", "origin/master", "main", "master")

STANDARD_PATH = "docs/reference/CVF_WORK_ORDER_CLOSURE_QUALITY_GATE_STANDARD_2026-05-28.md"
WORK_ORDER_TEMPLATE_PATH = "docs/reference/CVF_AGENT_WORK_ORDER_TEMPLATE_2026-05-19.md"
WORK_ORDER_AUTHORING_HARDENING_ADDENDUM_PATH = (
    "docs/reference/CVF_WORK_ORDER_AUTHORING_HARDENING_ADDENDUM_2026-06-11.md"
)
WORK_ORDER_FINALITY_ADDENDUM_PATH = (
    "docs/reference/CVF_AGENT_WORK_ORDER_FINALITY_AND_REVIEW_CONVERSION_ADDENDUM_2026-06-12.md"
)
LEGACY_COVERAGE_INDEX_PATH = "docs/reference/CVF_LEGACY_ABSORPTION_COVERAGE_INDEX_2026-06-13.md"
WORKER_AUTONOMY_STANDARD_PATH = "docs/reference/CVF_WORKER_AUTONOMY_DISPATCH_PROMPT_STANDARD_2026-06-01.md"
HOOK_CHAIN_PATH = "governance/compat/run_local_governance_hook_chain.py"
THIS_SCRIPT_PATH = "governance/compat/check_work_order_dispatch_quality.py"
FILE_SIZE_REGISTRY_PATH = "governance/compat/CVF_GOVERNED_FILE_SIZE_EXCEPTION_REGISTRY.json"
NEAR_THRESHOLD_PLAN_MARKER = "Near-Threshold Owner Maintainability Plan"
NEAR_THRESHOLD_TEMPLATE_OWNER_MARKER = "Near-Threshold Template Owner Discipline"
FULFILLMENT_MANIFEST_MARKER = "Work-Order Fulfillment Manifest"
COMMIT_MODE_ANCHOR_MARKER = "Commit Mode And Base-Anchor Lifecycle"
EXPORT_SURFACE_DECISION_MARKER = "Export Surface Decision"
NEXT_TRANCHE_AUDIT_MINI_PACKAGE_MARKER = "Next-Tranche Audit Mini-Package"
DISPATCH_PACKET_LEARNING_MARKER = "Dispatch Packet Authoring Learning Promotion"
NEGATIVE_SEARCH_COLLISION_MARKER = "Negative Search And Collision Discipline"
SINGLE_AGENT_MULTI_ROLE_MARKER = "Single-Agent Multi-Role Control Block"
INTAKE_ROLE_ROUTING_MARKER = "Intake Role Routing Decision"
EVIDENCE_REUSE_ENCODING_PLAN_MARKER = "Evidence Reuse And Encoding Plan"
WORKER_RETURN_PACKET_SHAPE_CONTRACT_MARKER = "Worker Return Packet Shape Contract"
WORKER_RETURN_FULL_GATE_PROFILE = "WORKER_RETURN_FULL_GATE_V1"
WORKER_RETURN_FAST_DOC_PROFILE = "WORKER_RETURN_FAST_DOC_V1"
REQUIRED_PROOF_ATOMIC_LITERAL_MARKER = "Required Proof Manifest Atomic Literal Discipline"
LEGACY_COVERAGE_DISPOSITION_MARKER = "Legacy Absorption Coverage Index Disposition"
PROVIDER_MEMORY_AUTHORITY_BOUNDARY_MARKER = "Provider Memory Authority Boundary"
EVIDENCE_REUSE_ENCODING_STANDARD_PATH = (
    "docs/reference/CVF_PRIOR_VERIFICATION_REUSE_AND_UNICODE_EVIDENCE_HANDLING_STANDARD_2026-06-11.md"
)
ALLOWED_COMMIT_MODES = {
    "WORKER_MAY_COMMIT",
    "WORKER_MUST_NOT_COMMIT",
}
ALLOWED_SOURCE_VERIFICATION_DISPOSITIONS = {
    "ACCEPT",
    "REJECT",
    "BLOCKED_SOURCE_NOT_FOUND",
}
DEFERRED_SOURCE_VERIFICATION_RE = re.compile(
    r"\b("
    r"ACCEPT_PENDING_WORKER|PENDING_WORKER|UNVERIFIED|TBD|TODO|"
    r"confirm later|confirm field name|verify during implementation|"
    r"worker to verify|to be confirmed|inferred|stale-memory|placeholder|assume"
    r")\b",
    re.IGNORECASE,
)
NEGATIVE_SEARCH_CLAIM_RE = re.compile(
    r"\bNOT\s+FOUND\b|\bBLOCKED_SOURCE_NOT_FOUND\b",
    re.IGNORECASE,
)
PROVIDER_SPECIFIC_MEMORY_CONTEXT_RE = re.compile(
    r"\b("
    r"provider[- ]specific|agent[- ]private|provider[- ]local|agent[- ]local|"
    r"not\s+CVF\s+source\s+authority|NOT_CVF_SOURCE"
    r")\b",
    re.IGNORECASE,
)
LEGACY_COVERAGE_SCOPE_RE = re.compile(
    r"\b("
    r"foundation[- ]plane|foundation[- ]roadmap|foundation[- ]system|"
    r"plane[- ]upgrade|workflow[- ]chain|workflow[- ]system|"
    r"control[- ]plane|execution[- ]plane|learning[- ]plane|memory|"
    r"knowledge|scan|corpus|document[- ]intelligence|model[- ]gateway|"
    r"provider[- ]routing|trust[- ]sandbox|agent[- ]operation[- ]trace|"
    r"co[- ]work|cowork"
    r")\b",
    re.IGNORECASE,
)
LEGACY_ADJACENT_RE = re.compile(
    r"\b("
    r"legacy|legacy[- ]adjacent|legacy[- ]absorption|legacy[- ]coverage|"
    r"prior[- ]absorption|CVF_Important|Knowledge Absorption Blind[- ]Spot"
    r")\b|\.private_reference/legacy|CVF_LEGACY_ABSORPTION_COVERAGE_INDEX_2026-06-13\.md",
    re.IGNORECASE,
)
LEGACY_COVERAGE_NOT_APPLICABLE_RE = re.compile(
    r"\bNOT_APPLICABLE_WITH_REASON\b|\bN/A with reason\b",
    re.IGNORECASE,
)
LEGACY_COVERAGE_ROW_RE = re.compile(
    r"\b(?:MGW|MEM|SCAN|FPC|AOT|SLI|DIR-DICE|ERH|LHW|GC)-\d{3}\b",
    re.IGNORECASE,
)
NEGATIVE_SEARCH_TOKEN_STOPWORDS = {
    "ACCEPT",
    "BLOCKED_SOURCE_NOT_FOUND",
    "CLOSED_PASS",
    "CLOSED_PASS_BOUNDED",
    "DISPATCHED",
    "DISPATCH_READY",
    "DOCS",
    "DOCUMENTATION",
    "EXTENSIONS",
    "EXTERNAL",
    "FOUND",
    "GOVERNANCE",
    "HOLD",
    "JSON",
    "NOT",
    "READY",
    "REJECT",
    "SOURCE",
    "SOURCES",
    "TEST",
    "TESTS",
}
VERIFIED_LINE_RE = re.compile(r"\bline\s+(\d+)\b", re.IGNORECASE)
IMPLEMENTATION_ROLE_TOKENS = {"worker", "implementer", "executor", "builder", "coder"}
REVIEW_ROLE_TOKENS = {"reviewer", "committer", "closer", "auditor"}
ORCHESTRATION_ROLE_TOKENS = {"orchestrator", "planner", "dispatcher"}
ROLE_ROUTING_MODES = {
    "SINGLE_AGENT_SINGLE_ROLE",
    "SINGLE_AGENT_MULTI_ROLE",
    "MULTI_AGENT_MULTI_ROLE",
    "MULTI_AGENT_SINGLE_ROLE",
}
WORKER_RETURN_FULL_GATE_REQUIRED_TERMS = (
    f"contractProfile: {WORKER_RETURN_FULL_GATE_PROFILE}",
    "requiredGate:",
    "run_worker_return_fast_gate.py",
    "individualCheckerSubstitution: FORBIDDEN",
    "workerReturnSkeleton: CHECKER_SAFE_SKELETON_REQUIRED",
)
WORKER_RETURN_FAST_DOC_REQUIRED_TERMS = (
    f"contractProfile: {WORKER_RETURN_FAST_DOC_PROFILE}",
    "scopeClassification: DOCUMENTATION_AND_EVIDENCE_ONLY_NO_COMMIT",
    "requiredGate:", "run_worker_return_fast_gate.py",
    "individualCheckerSubstitution: FORBIDDEN",
    "workerReturnSkeleton: CHECKER_SAFE_SKELETON_REQUIRED",
    "publicSyncDisposition: FORBIDDEN",
    "liveRuntimeDisposition: FORBIDDEN",
    "checkerMutationDisposition: FORBIDDEN",
    "workerSelfSelection: FORBIDDEN",
)
EVIDENCE_REUSE_VERIFICATION_MODES = {
    "REUSE_PRIOR_VERIFICATION",
    "RECOMPUTE_REQUIRED",
    "REVIEWER_RECOMPUTE_ONLY",
}
PENDING_ROLE_ROUTING_MODES = {
    "HOLD_PENDING_OPERATOR_DECISION",
    "BLOCKED_PENDING_OPERATOR_DECISION",
    "PARKED_PENDING_OPERATOR_DECISION",
}

REQUIRED_SOURCE_COLUMNS = (
    "Claimed item",
    "Source file",
    "Verified line/section",
    "Verified path or symbol",
    "Owning interface/function/schema",
    "Disposition",
)

PATH_RE = re.compile(
    r"`((?:docs|governance|EXTENSIONS|CVF_SESSION|scripts|sdk|\.github|\.private_reference)/[^`|)]+)`"
    r"|((?:docs|governance|EXTENSIONS|CVF_SESSION|scripts|sdk|\.github|\.private_reference)/[^`\s|)]+)"
)
ROOT_GOVERNANCE_PATH_RE = re.compile(
    r"`((?:AGENTS\.md|CLAUDE\.md|README\.md|\.gitignore|CVF_SESSION_MEMORY\.md|AGENT_HANDOFF[^`|)]+\.md))`"
    r"|(?<![A-Za-z0-9_./])((?:AGENTS\.md|CLAUDE\.md|README\.md|\.gitignore|CVF_SESSION_MEMORY\.md|AGENT_HANDOFF[A-Za-z0-9_.-]*\.md))(?![A-Za-z0-9_./])"
)
LHW_RE = re.compile(r"LHW[-_]?(\d+)(?!\d)", re.IGNORECASE)
IMPORTANT_FULL_SCAN_AUDIT_PATH = "docs/audits/CVF_IMPORTANT_FULL_FILE_SCAN_BLINDSPOT_RECORD_2026-05-31.md"



IMPLEMENTATION_MODULES = (
    "check_work_order_dispatch_quality_core.py",
    "check_work_order_dispatch_quality_artifacts.py",
    "check_work_order_dispatch_quality_range.py",
)


def _load_implementation_modules() -> None:
    """Load split implementation files into this module's public API."""
    module_dir = Path(__file__).resolve().parent
    for module_name in IMPLEMENTATION_MODULES:
        module_path = module_dir / module_name
        source = module_path.read_text(encoding="utf-8")
        exec(compile(source, str(module_path), "exec"), globals())


_load_implementation_modules()

def _print_report(report: dict[str, Any], base: str, head: str, base_source: str) -> None:
    print("=== CVF Work Order Dispatch Quality Gate ===")
    print(f"Range: {base}..{head}")
    print(f"Base source: {base_source}")
    print(f"Policy: {report['policy']}")
    print(f"Files checked: {report['checkedFileCount']}")
    print(f"Violations: {report['violationCount']}")
    print(f"Marker violations: {report['markerViolationCount']}")

    if report["checkedFiles"]:
        print("\nChecked dispatch artifacts:")
        for path in report["checkedFiles"]:
            print(f"  - {path}")
    else:
        print("\nNo changed work-order, roadmap, or fast-lane review artifacts required dispatch-quality validation.")

    if report["violations"]:
        print("\nDispatch-quality violations:")
        for violation in report["violations"]:
            print(f"  - {violation['path']}")
            for issue in violation["issues"]:
                print(f"    - {issue}")

    if report["markerViolations"]:
        print("\nGuard wiring marker violations:")
        for path, markers in report["markerViolations"].items():
            print(f"  - {path}")
            for marker in markers:
                print(f"    - missing marker `{marker}`")

    if report["compliant"]:
        print("\nCOMPLIANT - dispatch-quality gates are satisfied for checked artifacts.")
    else:
        print("\nVIOLATION - keep the artifact in HOLD/DRAFT or fix the missing dispatch evidence before execution.")


def _run_check(base: str | None, head: str | None) -> tuple[dict[str, Any], str, str, str]:
    resolved_base, resolved_head, base_source = _resolve_range(base, head)
    changed = _get_changed(resolved_base, resolved_head)
    report = _classify(sorted(changed), base_ref=resolved_base)
    return report, resolved_base, resolved_head, base_source


def main() -> int:
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(errors="replace")
    if hasattr(sys.stderr, "reconfigure"):
        sys.stderr.reconfigure(errors="replace")

    parser = argparse.ArgumentParser(description="Enforce CVF work-order dispatch quality gates")
    parser.add_argument("--base", default=None)
    parser.add_argument("--head", default=None)
    parser.add_argument("--json", action="store_true")
    parser.add_argument("--enforce", action="store_true")
    args = parser.parse_args()

    try:
        report, base, head, base_source = _run_check(args.base, args.head)
    except RuntimeError as exc:
        print(str(exc), file=sys.stderr)
        return 2

    if args.json:
        print(json.dumps(report, indent=2))
    else:
        _print_report(report, base, head, base_source)

    return 1 if args.enforce and not report["compliant"] else 0


if __name__ == "__main__":
    raise SystemExit(main())
