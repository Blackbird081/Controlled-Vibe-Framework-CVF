#!/usr/bin/env python3
"""
Emit or create an L1 worker-return scaffold.

Safety boundary: this helper only prints a skeleton or creates one new markdown
file under docs/reviews/. It refuses overwrite and paths outside docs/reviews/.
It does not stage, commit, apply patches, run provider calls, or make a closure
decision.
"""

from __future__ import annotations

import argparse
import sys
from pathlib import Path


REPO_ROOT = Path(__file__).resolve().parents[2]
ALLOWED_DIR = "docs/reviews/"
SCAFFOLD_TODO = "TODO: worker fills this section before returning for review."
SCAFFOLD_TABLE_TODO = "TODO: fill before review"
FULL_PROFILE = "WORKER_RETURN_FULL_GATE_V1"
FAST_DOC_PROFILE = "WORKER_RETURN_FAST_DOC_V1"

WORKER_RETURN_SCAFFOLD_SECTIONS = (
    "Source Inventory",
    "Purpose",
    "Scope / Methodology",
    "Findings / Position",
    "Risk / Corrective Action",
    "Claim Boundary",
    "Checker Source Read-Ahead Block",
    "Gate Evidence",
    "Actual Changed Set",
    "Core Guard Self-Protection Authorization",
    "External Knowledge Intake Routing",
    "Rescan Intelligence Hardening",
    "Corpus Completeness And Report Integrity",
    "Finding-To-Governance Learning Disposition",
    "Epistemic Process Block",
    "Worker Experience Retrospective",
    "Worker Return Scaffold Effectiveness Measurement",
    "Worker Return Jurisdiction Block",
    "Agent Operation Trace Block",
    "Delta Execution Claim Boundary Control Block",
    "Public Export Disposition",
    "git status --short",
    "Changed Files",
    "Command Evidence",
    "No-Commit Statement",
    "Machine Closure Package",
)
FAST_DOC_SCAFFOLD_SECTIONS = tuple(
    section
    for section in WORKER_RETURN_SCAFFOLD_SECTIONS
    if section
    not in {
        "External Knowledge Intake Routing",
        "Rescan Intelligence Hardening",
        "Corpus Completeness And Report Integrity",
    }
)


def _section_body(section: str) -> list[str]:
    if section == "Source Inventory":
        return ["| File | Action |", "|---|---|", f"| {SCAFFOLD_TABLE_TODO} | READ |"]
    if section == "Gate Evidence":
        return [
            "| Command | Result |",
            "|---|---|",
            "| `python governance/compat/run_worker_return_fast_gate.py` | TODO_PASS_FAIL_BLOCKED |",
            "",
            "receiptEvidence: CVF_RECEIPT_PRESENT - TODO_receipt_or_reason",
        ]
    if section == "Actual Changed Set":
        return [
            "- `TODO/path/to/changed-file.ext`",
            "",
            "List real paths; do not replace this with prose.",
        ]
    if section == "Checker Source Read-Ahead Block":
        return [
            "| Field | Value |",
            "|---|---|",
            f"| applicableCheckersRead | {SCAFFOLD_TABLE_TODO}: list `governance/compat/check_*.py` paths actually read |",
            f"| literalTokensReviewed | {SCAFFOLD_TABLE_TODO}: exact headings, table labels, enum tokens, or regex-sensitive words reviewed |",
            f"| gateRunPurpose | {SCAFFOLD_TABLE_TODO}: state confirmation/evidence after reading checker source ahead of writing |",
            f"| claimBoundary | {SCAFFOLD_TABLE_TODO}: bound what this read-ahead block does and does not cover |",
        ]
    if section == "Core Guard Self-Protection Authorization":
        return [
            "Authorized guard-maintenance scope: TODO or N/A with reason",
            "",
            "Protected paths:",
            "- `TODO/protected/path.py`",
            "",
            "Operator authorization: TODO or N/A with reason",
            "",
            "Rollback boundary: TODO or N/A with reason",
        ]
    if section == "External Knowledge Intake Routing":
        return [
            "| Field | Value |",
            "|---|---|",
            "| Chain map | `docs/reference/external_agent_review/CVF_EXTERNAL_KNOWLEDGE_ABSORPTION_CHAIN_MAP.md` |",
            "| Input type | operator-provided external comparison, critique, or recommendation |",
            "| Chain map route | TODO or N/A with reason: describe how operator/external input reached this worker return |",
            "| Matching local-view guard | `governance/compat/check_external_knowledge_intake_routing.py` |",
            "| Owner surface | this worker return |",
            "| Disposition | TODO or N/A with reason |",
            "| Claim boundary | CVF source authority remains repo-governed surfaces only |",
        ]
    if section == "Rescan Intelligence Hardening":
        return [
            "- Rescan intelligence verdict: NOT_APPLICABLE_WITH_REASON",
            "",
            "Reason: N/A with reason: this worker return is not a rescan, intake-refresh, or source-backed reassessment output.",
        ]
    if section == "Corpus Completeness And Report Integrity":
        return [
            "- Corpus verdict: NOT_APPLICABLE_WITH_REASON - N/A with reason: no corpus completeness claim in this worker return.",
        ]
    if section == "Conditional Controls Disposition":
        return ["conditionalControlsDisposition: EKI_NA; RIH_NA; CCRI_NA"]
    if section == "Finding-To-Governance Learning Disposition":
        return [
            "| Finding | Defect class | Learning lane | Disposition | Next control action | Handled or deferred |",
            "|---|---|---|---|---|---|",
            "| N/A with reason: no new repeated or non-obvious defect observed yet | ORCHESTRATOR_PACKET_GAP | GOVERNANCE_CONTROL_PLANE | N/A_WITH_REASON | Replace this row if a real finding exists | deferred until worker completion evidence exists |",
        ]
    if section == "Epistemic Process Block":
        return [
            "Epistemic Process Applicability: EPISTEMIC_PROCESS_NA_WITH_REASON: scaffold placeholder; replace if the worker return makes evidence comparison, contradiction, or claim-update assertions.",
        ]
    if section == "Worker Experience Retrospective":
        return [
            "WORKER_EXPERIENCE_RETRO_NA_WITH_REASON - TODO or replace with concise retrospective.",
        ]
    if section == "Worker Return Scaffold Effectiveness Measurement":
        return [
            "| Measurement | Result |",
            "|---|---|",
            "| scaffoldUsedBeforeLongDraft | TODO_YES_NO |",
            "| scaffoldMissingSectionFound | TODO_NONE_OR_SECTION |",
            "| firstWorkerReturnFastGateResult | TODO_PASS_FAIL_BLOCKED |",
            "| postScaffoldManualRepairCount | TODO_NUMBER |",
        ]
    if section == "Worker Return Jurisdiction Block":
        return [
            "| Field | Disposition |",
            "|---|---|",
            "| capturedArtifacts | TODO_actual_worker_owned_paths |",
            "| capturedOperations | TODO_commands_or_N/A_with_reason |",
            "| deferredOperations | TODO_reviewer_or_orchestrator_owned_operations |",
            "| outOfScopeRequests | TODO_or_N/A_with_reason |",
            "| reviewerActionNeeded | TODO_review_commit_or_scope_decision |",
        ]
    if section == "Agent Operation Trace Block":
        return [
            "| Field | Evidence |",
            "|---|---|",
            f"| Actor | {SCAFFOLD_TABLE_TODO} |",
            f"| Provider or surface | {SCAFFOLD_TABLE_TODO} |",
            f"| Session or invocation | {SCAFFOLD_TABLE_TODO} |",
            f"| Working directory | {SCAFFOLD_TABLE_TODO} |",
            f"| Command or tool surface | {SCAFFOLD_TABLE_TODO} |",
            f"| Target paths | {SCAFFOLD_TABLE_TODO} |",
            f"| Allowed scope source | {SCAFFOLD_TABLE_TODO} |",
            f"| Before status evidence | {SCAFFOLD_TABLE_TODO} |",
            f"| After status evidence | {SCAFFOLD_TABLE_TODO} |",
            f"| Diff evidence | {SCAFFOLD_TABLE_TODO} |",
            f"| Approval boundary | {SCAFFOLD_TABLE_TODO} |",
            f"| Claim boundary | {SCAFFOLD_TABLE_TODO} |",
            "| Agent type | worker |",
            f"| Invocation ID | {SCAFFOLD_TABLE_TODO} |",
            f"| Expected manifest | {SCAFFOLD_TABLE_TODO} |",
            f"| Actual changed set | {SCAFFOLD_TABLE_TODO} |",
            "| Manifest delta | TODO_MATCH_OR_EXPLAIN |",
            "| Deletion or rename disposition | N/A with reason: no deletion or rename in this scaffold |",
        ]
    if section == "Delta Execution Claim Boundary Control Block":
        return [
            "| Field | Disposition |",
            "|---|---|",
            f"| claimScope | {SCAFFOLD_TABLE_TODO} |",
            "| claimDisposition | BOUNDED_CLAIM_WITH_EVIDENCE or N/A with reason |",
            "| receiptEvidence | CVF_RECEIPT_PRESENT or N/A with reason |",
            "| actionEvidence | ACTION_EVIDENCE_PRESENT or N/A with reason |",
            f"| invocationBoundary | {SCAFFOLD_TABLE_TODO} |",
            "| interceptionBoundary | no IDE, shell, git, filesystem, provider, CLI, MCP, Web runtime, or adapter interception claim unless explicitly authorized |",
            f"| claimLanguage | {SCAFFOLD_TABLE_TODO} |",
            f"| forbiddenExpansion | {SCAFFOLD_TABLE_TODO} |",
        ]
    if section == "Public Export Disposition":
        return [
            "DEFERRED_PRIVATE_ONLY",
            "",
            "Reason: worker return in private provenance workspace; no public-sync authorization.",
        ]
    if section == "Command Evidence":
        return [
            "| Command | Result |",
            "|---|---|",
            "| `python governance/compat/run_worker_return_fast_gate.py` | TODO_PASS_FAIL_BLOCKED |",
            "",
            "LAST-MILE FINALIZATION: before returning this packet for review, replace every",
            "`TODO_PASS_FAIL_BLOCKED`, `TODO_YES_NO`, `TODO_NONE_OR_SECTION`, and",
            f"`{SCAFFOLD_TABLE_TODO}` placeholder with the actual first-run and final-run",
            "fast-gate result, the actual final status output, and real changed-set/diff",
            "evidence captured after edits are complete. Do not leave a scaffold",
            "placeholder token anywhere in the returned packet.",
        ]
    if section == "git status --short":
        return [
            "```",
            f"{SCAFFOLD_TABLE_TODO}: paste `git status --short` output here",
            "```",
        ]
    if section == "Changed Files":
        return [
            f"{SCAFFOLD_TABLE_TODO}: list changed files with `git diff --name-status` evidence.",
        ]
    if section == "No-Commit Statement":
        return [
            "WORKER_MUST_NOT_COMMIT honored: HEAD unchanged; no git commit performed by",
            "worker. Reviewer/closer owns material commit.",
        ]
    if section == "Machine Closure Package":
        return [
            "| Artifact | Evidence | Disposition |",
            "|---|---|---|",
            "| Worker return status | `Status: TODO_WORKER_STATUS` | pending reviewer closure; worker must not mark closed-equivalent unless authorized |",
            "| Work order status | `dispatchWorkOrder: TODO_WORK_ORDER_PATH` | N/A with reason: reviewer/closer owns closure conversion |",
            "| Changed set | `## Actual Changed Set` | must list real paths before review |",
            "| Gate evidence | `## Gate Evidence` | must record pass/fail/blocked before review |",
        ]
    return [SCAFFOLD_TODO]


def build_scaffold(title: str = "", profile: str = FULL_PROFILE) -> str:
    heading = title.strip() or "Worker Return Scaffold"
    lines = [
        f"# {heading}",
        "",
        "Memory class: FULL_RECORD",
        "",
        "docType: review",
        "",
        "Status: TODO_WORKER_STATUS",
        "",
        "Self-declared worker-return artifact: yes",
        "",
        "Responds to work order: `TODO_WORK_ORDER_PATH`",
        "",
        "dispatchWorkOrder: `TODO_WORK_ORDER_PATH`",
        "",
        "executionBaseHead: `TODO_EXECUTION_BASE_HEAD`",
        "",
        "rawMemoryReleased=false",
        f"contractProfile: {profile}",
        "",
        "NOTE: L1 scaffold only. Replace every TODO line before returning for review.",
        "",
    ]
    sections = WORKER_RETURN_SCAFFOLD_SECTIONS
    if profile == FAST_DOC_PROFILE:
        sections = FAST_DOC_SCAFFOLD_SECTIONS + ("Conditional Controls Disposition",)
    for section in sections:
        lines.append(f"## {section}")
        lines.append("")
        lines.extend(_section_body(section))
        lines.append("")
    return "\n".join(lines).rstrip() + "\n"


def _path_is_allowed(path: Path) -> bool:
    allowed_root = (REPO_ROOT / ALLOWED_DIR).resolve()
    try:
        resolved = path.resolve()
    except (OSError, RuntimeError):
        return False
    return resolved != allowed_root and allowed_root in resolved.parents


def write_scaffold(target: str, title: str = "", profile: str = FULL_PROFILE) -> Path:
    candidate = Path(target)
    if not candidate.is_absolute():
        candidate = REPO_ROOT / candidate
    if candidate.suffix.lower() != ".md":
        raise ValueError(f"target must be a .md file under {ALLOWED_DIR}: {target}")
    if not _path_is_allowed(candidate):
        raise ValueError(f"target must be inside {ALLOWED_DIR}: {target}")
    if candidate.exists():
        raise ValueError(f"refusing to overwrite existing file: {target}")
    candidate.parent.mkdir(parents=True, exist_ok=True)
    derived_title = title.strip() or candidate.stem.replace("_", " ")
    with open(candidate, "x", encoding="utf-8") as handle:
        handle.write(build_scaffold(derived_title, profile))
    return candidate


def main(argv: list[str] | None = None) -> int:
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    parser = argparse.ArgumentParser(description="Emit or write a worker-return scaffold")
    parser.add_argument("--emit", action="store_true", help="Print scaffold to stdout")
    parser.add_argument("--write", metavar="PATH", help="Create one new scaffold file")
    parser.add_argument("--title", default="", help="Optional scaffold title")
    parser.add_argument(
        "--profile",
        choices=(FULL_PROFILE, FAST_DOC_PROFILE),
        default=FULL_PROFILE,
        help="Worker-return contract profile",
    )
    args = parser.parse_args(argv)
    if args.emit == bool(args.write):
        print("VIOLATION: choose exactly one of --emit or --write", file=sys.stderr)
        return 2
    if args.emit:
        print(build_scaffold(args.title, args.profile), end="")
        return 0
    try:
        written = write_scaffold(args.write, args.title, args.profile)
    except ValueError as exc:
        print(f"VIOLATION: {exc}", file=sys.stderr)
        return 2
    print(f"Wrote worker-return scaffold: {written}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
