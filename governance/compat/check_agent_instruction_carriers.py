#!/usr/bin/env python3
"""CVF Agent Instruction Carrier Compaction Gate (ACRC-T2B).

Enforces line/byte budgets on the three active instruction carriers and the
routing index, byte-identical preimage archives, full AGENTS heading coverage
in the routing index, required direct machine-reader literals per carrier,
rejection of reintroduced unconditional full-read wording, and its own
binding in the autorun/hook/CI catalogs.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import re
import sys
from pathlib import Path

try:
    from active_continuity_read_budget import check_unconditional_full_read_wording
except ModuleNotFoundError:
    from governance.compat.active_continuity_read_budget import check_unconditional_full_read_wording


REPO_ROOT = Path(__file__).resolve().parents[2]
THIS_SCRIPT_PATH = "governance/compat/check_agent_instruction_carriers.py"
DOCUMENTATION_CI_PATH = ".github/workflows/documentation-testing.yml"

AGENTS_PATH = "AGENTS.md"
CLAUDE_PATH = "CLAUDE.md"
DOWNSTREAM_TEMPLATE_PATH = "governance/toolkit/05_OPERATION/CVF_DOWNSTREAM_AGENTS_TEMPLATE.md"
ROUTING_INDEX_PATH = "docs/reference/CVF_AGENT_INSTRUCTION_CARRIER_ROUTING_INDEX_2026-08-11.md"
AGENTS_ARCHIVE_PATH = "docs/reference/archive/AGENTS_FULL_PRE_T2B_2026-08-11.md"
CLAUDE_ARCHIVE_PATH = "docs/reference/archive/CLAUDE_FULL_PRE_T2B_2026-08-11.md"
TEMPLATE_ARCHIVE_PATH = "docs/reference/archive/CVF_DOWNSTREAM_AGENTS_TEMPLATE_FULL_PRE_T2B_2026-08-11.md"

# Pinned preimage hashes (raw filesystem bytes at ACRC-T2B executionBaseHead).
AGENTS_PREIMAGE_SHA256 = "605b32534c7898117f0cbfd7747253243c342cf1619df02e96a4691507573855"
CLAUDE_PREIMAGE_SHA256 = "5d918333045b248beb1d3acbe9fb984da45298cf5348abe0a107593ee0c8c7c1"
TEMPLATE_PREIMAGE_SHA256 = "7f545fa243754cd3066f3b4264959f4b7f9bd3fa2f348bd1b99cc21483e34a74"
BUDGETS: tuple[tuple[str, int, int], ...] = (
    (AGENTS_PATH, 220, 20480),
    (CLAUDE_PATH, 160, 16384),
    (DOWNSTREAM_TEMPLATE_PATH, 180, 20480),
    (ROUTING_INDEX_PATH, 300, 32768),
)
ARCHIVE_BINDINGS: tuple[tuple[str, str, str], ...] = (
    (AGENTS_PATH, AGENTS_ARCHIVE_PATH, AGENTS_PREIMAGE_SHA256),
    (CLAUDE_PATH, CLAUDE_ARCHIVE_PATH, CLAUDE_PREIMAGE_SHA256),
    (DOWNSTREAM_TEMPLATE_PATH, TEMPLATE_ARCHIVE_PATH, TEMPLATE_PREIMAGE_SHA256),
)

# All 38 pre-compaction AGENTS.md level-two headings the routing index must
# cover exactly once, as a `| <heading> |` table cell.
REQUIRED_AGENTS_HEADINGS: tuple[str, ...] = (
    "Session Memory Front Door", "Mandatory Startup Acknowledgment",
    "Guard Orientation Index", "Mandatory Provider-Specific Agent Memory Boundary",
    "Mandatory F-1 Diminishing Returns Stop Rule", "Mandatory Public Export Disposition Guard",
    "Critical Repository Boundary", "UI / Web Design Contract",
    "Mandatory Live Governance Proof", "Mandatory Live Run Diagnostics",
    "Mandatory ADIF Defect Registry Disclosure", "Mandatory Value-Parked Lane Reopen Discipline",
    "Mandatory Work Order Source Verification", "Governed Artifact Literal-Format Gotchas",
    "Mandatory Work Order Closure Quality Gate", "Mandatory Roadmap Closure Freshness Guard",
    "Mandatory Work Order Dependency Release Evidence", "Mandatory Governed File Maintainability Planning",
    "Mandatory Text Encoding And Symbol Discipline", "Mandatory JSON Generated Aggregate Discipline",
    "Mandatory Agent Autorun Workflow Control", "Mandatory Agent Handoff Boundary Contract Guard",
    "Mandatory Agent Interaction Workspace Design Boundary",
    "Mandatory Agent Workspace State Generated Aggregate Guard",
    "Mandatory Agent Workspace Skeleton Guard", "Mandatory Agent Workspace Runtime Boundary Guard",
    "Mandatory IDE Extension Multi-Provider Execution Log Guard",
    "Mandatory Finding-To-Governance Learning Trigger Guard", "Mandatory Learning Signal Intake Bridge",
    "Mandatory External Repository Absorption Entry Rule",
    "Mandatory Knowledge Absorption Blind-Spot Prevention",
    "Mandatory Corpus Completeness And Report Integrity",
    "Mandatory Corpus-To-Knowledge-Map Reconciliation", "Mandatory Corpus Intelligence Classification",
    "Mandatory Corpus Search And Filter Readiness", "Mandatory Corpus Scan Registry Consultation",
    "Mandatory System Loop Interlock", "Latest Closed Continuation Roadmap",
)

AGENTS_DIRECT_LITERALS: tuple[str, ...] = (
    "CVF_SESSION_MEMORY.md", "CVF_SESSION/ACTIVE_SESSION_STATE.json",
    "Mandatory Agent Workspace State Generated Aggregate Guard",
    "CVF_SESSION/agent_workspace/ACTIVE_AGENT_WORKSPACE_STATE.json",
    "governance/compat/check_agent_workspace_state.py",
    "docs/reference/agent_workspace/CVF_AGENT_WORKSPACE_STATE_LANE_TAXONOMY.md",
    "docs/reference/agent_workspace/CVF_AGENT_WORKSPACE_STATE_ITEM_TEMPLATE.json",
    "Mandatory Agent Workspace Skeleton Guard", "CVF_SESSION/agent_workspace/workspace/README.md",
    "governance/compat/check_agent_workspace_skeleton.py",
    "Mandatory Agent Workspace Runtime Boundary Guard",
    "docs/reference/agent_workspace/CVF_AGENT_WORKSPACE_RUNTIME_EXPANSION_READINESS_CONTRACT.md",
    "CVF_SESSION/agent_workspace/runtime_queue/README.md",
    "docs/reference/agent_workspace/CVF_AGENT_WORKSPACE_OPERATOR_VIEW_PLAN.md",
    "governance/compat/check_agent_workspace_runtime_boundary.py",
    "governance/compat/check_public_export_disposition.py",
    "governance/compat/check_corpus_completeness_report_integrity.py",
    "governance/compat/check_corpus_to_knowledge_map_reconciliation.py",
)
CLAUDE_DIRECT_LITERALS: tuple[str, ...] = (
    "NOT_CVF_SOURCE", "CVF_SESSION_MEMORY.md", "CVF_SESSION/ACTIVE_SESSION_STATE.json",
    "governance/compat/check_corpus_completeness_report_integrity.py",
    "governance/compat/check_corpus_to_knowledge_map_reconciliation.py",
)
TEMPLATE_ROLE_TOKENS: tuple[str, ...] = (
    "ORCHESTRATOR", "SPEC_AUTHOR", "WORK_ORDER_AUTHOR", "IMPLEMENTATION_WORKER",
    "REVIEWER", "CLOSER", "SESSION_SYNC_STEWARD",
)
TEMPLATE_REHYDRATION_TOKENS: tuple[str, ...] = (
    "Mandatory Continuity Rehydration", "new or resumed chat/session",
    "new tranche or work order", "Do not rely on chat history",
    "BLOCKED_CONTINUITY_DRIFT",
)
TEMPLATE_GOLDEN_HEADING = "### Governance Latency and Approval Continuity"
TEMPLATE_GOLDEN_PHRASES: tuple[str, ...] = (
    "dependent same-scope repairs", "real boundary change",
    "consolidated review of relevant records", "REVIEW_COST_ESCALATION_REQUIRED",
    "avoidable operator wait",
)
TEMPLATE_PHASE_CHAIN = "INTAKE -> DESIGN -> SPEC -> WORK_ORDER -> BUILD -> REVIEW -> FREEZE"
TEMPLATE_SUBSTITUTION_TOKENS: tuple[str, ...] = (
    "{{CVF_CORE_PATH}}", "{{CVF_CORE_COMMIT}}", "{{BOOTSTRAP_DATE}}", "{{PROJECT_NAME}}",
)
TEMPLATE_MAX_FIRST_READ_PATHS = 12
FIRST_READ_ITEM_RE = re.compile(r"(?m)^\d+\. `")
SELF_BINDING_CATALOGS: tuple[str, ...] = (
    "governance/compat/agent_autorun_command_catalog.py",
    "governance/compat/local_governance_hook_catalog_pre_commit.py",
    "governance/compat/local_governance_hook_catalog_reviewer_fast.py",
    "governance/compat/local_governance_hook_catalog_pre_push.py",
    DOCUMENTATION_CI_PATH,
)


# A violation is a (path, kind, message) tuple; a Report is simply a list of them.
Violation = tuple[str, str, str]


def _configure_stdout() -> None:
    for stream in (sys.stdout, sys.stderr):
        if hasattr(stream, "reconfigure"):
            stream.reconfigure(encoding="utf-8", errors="replace")


def _read_bytes(path: str) -> bytes | None:
    full = REPO_ROOT / path
    if not full.is_file():
        return None
    try:
        return full.read_bytes()
    except OSError:
        return None


def _read_text(path: str) -> str:
    raw = _read_bytes(path)
    return raw.decode("utf-8", errors="replace") if raw is not None else ""


def _sha256(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()

def _add(violations: list[Violation], path: str, kind: str, message: str) -> None:
    violations.append((path, kind, message))

def _check_literals_present(
    violations: list[Violation], path: str, text: str, literals: tuple[str, ...], kind: str, noun: str
) -> None:
    for literal in literals:
        if literal not in text:
            _add(violations, path, kind, f"`{path}` is missing required {noun} `{literal}`")


def _check_budgets(violations: list[Violation]) -> None:
    for path, max_lines, max_bytes in BUDGETS:
        raw = _read_bytes(path)
        if raw is None:
            _add(violations, path, "carrier_missing", f"required surface `{path}` is missing or unreadable")
            continue
        try:
            text = raw.decode("utf-8", errors="strict")
        except UnicodeDecodeError as exc:
            _add(violations, path, "carrier_encoding_invalid", f"`{path}` is not strict UTF-8: {exc}")
            continue
        if not all(ord(ch) < 128 for ch in text):
            _add(violations, path, "carrier_not_ascii", f"`{path}` contains non-ASCII characters")
        line_count = len(text.splitlines())
        byte_count = len(raw)
        if line_count > max_lines:
            _add(violations, path, "carrier_over_line_budget", f"`{path}` has {line_count} lines, exceeding budget of {max_lines}")
        if byte_count > max_bytes:
            _add(violations, path, "carrier_over_byte_budget", f"`{path}` has {byte_count} bytes, exceeding budget of {max_bytes}")

def _check_archives(violations: list[Violation]) -> None:
    for source_path, archive_path, expected_sha in ARCHIVE_BINDINGS:
        archive_raw = _read_bytes(archive_path)
        if archive_raw is None:
            _add(violations, archive_path, "archive_missing", f"required preimage archive `{archive_path}` is missing or unreadable")
            continue
        actual_sha = _sha256(archive_raw)
        if actual_sha != expected_sha:
            _add(violations, archive_path, "archive_hash_mismatch", f"`{archive_path}` sha256 `{actual_sha}` does not match pinned preimage `{expected_sha}` for source `{source_path}`")

def _check_routing_index(violations: list[Violation]) -> None:
    text = _read_text(ROUTING_INDEX_PATH)
    if not text:
        _add(violations, ROUTING_INDEX_PATH, "routing_index_missing", f"routing index `{ROUTING_INDEX_PATH}` is missing or unreadable")
        return
    for required in REQUIRED_AGENTS_HEADINGS:
        count = len(re.findall(r"^\|\s*" + re.escape(required) + r"\s*\|", text, re.MULTILINE))
        if count == 0:
            _add(violations, ROUTING_INDEX_PATH, "routing_index_heading_missing", f"routing index is missing required heading route `{required}`")
        elif count > 1:
            _add(violations, ROUTING_INDEX_PATH, "routing_index_heading_duplicated", f"routing index covers heading `{required}` {count} times; expected exactly once")
    archive_paths = (AGENTS_ARCHIVE_PATH, CLAUDE_ARCHIVE_PATH, TEMPLATE_ARCHIVE_PATH)
    _check_literals_present(violations, ROUTING_INDEX_PATH, text, archive_paths, "routing_index_archive_path_missing", "archive path")
    hashes = (AGENTS_PREIMAGE_SHA256, CLAUDE_PREIMAGE_SHA256, TEMPLATE_PREIMAGE_SHA256)
    _check_literals_present(violations, ROUTING_INDEX_PATH, text, hashes, "routing_index_preimage_hash_missing", "pinned preimage hash")

def _check_downstream_template(violations: list[Violation]) -> None:
    path = DOWNSTREAM_TEMPLATE_PATH
    text = _read_text(path)
    if not text:
        _add(violations, path, "carrier_missing", f"downstream template `{path}` is missing or unreadable")
        return
    _check_literals_present(violations, path, text, TEMPLATE_ROLE_TOKENS, "template_role_token_missing", "role token")
    _check_literals_present(violations, path, text, TEMPLATE_REHYDRATION_TOKENS, "template_rehydration_token_missing", "rehydration token")
    _check_literals_present(violations, path, text, (TEMPLATE_PHASE_CHAIN,), "template_phase_chain_missing", "seven-step phase chain")
    _check_literals_present(violations, path, text, TEMPLATE_SUBSTITUTION_TOKENS, "template_substitution_token_missing", "substitution token")
    _check_literals_present(violations, path, text, TEMPLATE_GOLDEN_PHRASES, "template_golden_phrase_missing", "golden-harness phrase")
    heading_count = len(re.findall(re.escape(TEMPLATE_GOLDEN_HEADING), text))
    if heading_count != 1:
        _add(violations, path, "template_golden_heading_count", f"downstream template must carry `{TEMPLATE_GOLDEN_HEADING}` exactly once; found {heading_count}")
    first_read_count = len(FIRST_READ_ITEM_RE.findall(text))
    if first_read_count > TEMPLATE_MAX_FIRST_READ_PATHS:
        _add(violations, path, "template_first_read_over_budget", f"downstream template lists {first_read_count} first-read items, exceeding {TEMPLATE_MAX_FIRST_READ_PATHS}")


def _check_read_wording(violations: list[Violation]) -> None:
    for path in (AGENTS_PATH, CLAUDE_PATH, DOWNSTREAM_TEMPLATE_PATH, ROUTING_INDEX_PATH):
        text = _read_text(path)
        if not text:
            continue
        for message in check_unconditional_full_read_wording(path, text):
            _add(violations, path, "unconditional_full_read_wording", message)


def _check_self_binding(violations: list[Violation]) -> None:
    for catalog_path in SELF_BINDING_CATALOGS:
        text = _read_text(catalog_path)
        if THIS_SCRIPT_PATH not in text:
            _add(violations, catalog_path, "self_binding_missing", f"`{catalog_path}` does not bind `{THIS_SCRIPT_PATH}`")

def run() -> list[Violation]:
    violations: list[Violation] = []
    _check_budgets(violations)
    _check_archives(violations)
    _check_routing_index(violations)
    _check_literals_present(violations, AGENTS_PATH, _read_text(AGENTS_PATH), AGENTS_DIRECT_LITERALS, "direct_literal_missing", "direct literal")
    _check_literals_present(violations, CLAUDE_PATH, _read_text(CLAUDE_PATH), CLAUDE_DIRECT_LITERALS, "direct_literal_missing", "direct literal")
    _check_downstream_template(violations)
    _check_read_wording(violations)
    _check_self_binding(violations)
    return violations

def _report_json(violations: list[Violation]) -> dict:
    return {
        "violations": [{"path": p, "kind": k, "message": m} for p, k, m in violations],
        "isClean": not violations,
    }

def main(argv: list[str] | None = None) -> int:
    _configure_stdout()
    parser = argparse.ArgumentParser(description="CVF agent instruction carrier compaction gate.")
    parser.add_argument("--enforce", action="store_true")
    parser.add_argument("--json", action="store_true")
    parser.add_argument("--base", default=None, help="accepted for gate-chain uniformity; unused")
    parser.add_argument("--head", default=None, help="accepted for gate-chain uniformity; unused")
    args = parser.parse_args(argv)

    violations = run()

    if args.json:
        print(json.dumps(_report_json(violations), indent=2))
    else:
        print("=== CVF Agent Instruction Carrier Compaction Gate ===")
        print(f"Violations: {len(violations)}")
        for p, k, m in violations:
            print(f"  - {p}: {k}: {m}")
        if not violations:
            print("COMPLIANT - instruction carriers, archives, and routing index are aligned.")
        else:
            print("VIOLATION - instruction carrier compaction contract is not satisfied.")

    if violations:
        return 1 if args.enforce else 0
    return 0


if __name__ == "__main__":
    sys.exit(main())
