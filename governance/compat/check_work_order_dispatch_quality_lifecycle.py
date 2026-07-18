#!/usr/bin/env python3
"""
CVF Dispatch Quality - Lifecycle and Status Validators

Behavior-preserving lifecycle/status helpers extracted from the dispatch-quality
monolith as GFS-PY T2. These functions keep the original failure messages and
status-token behavior; they do not introduce new validation semantics.
"""

from __future__ import annotations

import re
from collections.abc import Callable

from check_work_order_dispatch_quality_tables import _parse_any_markdown_tables, _row_value


PENDING_DEPENDENCY_LANGUAGE_RE = re.compile(
    r"\bCLOSED_PASS(?:_BOUNDED)?\b[\s\S]{0,180}\b("
    r"pending|required before|must be reviewer-committed before|"
    r"reviewer commit required|before\s+(?:worker\s+)?execution|"
    r"pending implementation|pending reviewer commit"
    r")\b"
    r"|"
    r"\b("
    r"pending|required before|must be reviewer-committed before|"
    r"reviewer commit required|before\s+(?:worker\s+)?execution|"
    r"pending implementation|pending reviewer commit"
    r")\b[\s\S]{0,180}\bCLOSED_PASS(?:_BOUNDED)?\b",
    re.IGNORECASE,
)
FINDING_MARKERS = ("## Quality Findings", "## Findings", "## Known Issues", "Known Issues", "| Finding |", "finding |")
FINDING_LEARNING_SECTION = "## Finding-To-Governance Learning Disposition"


def _extract_status(text: str) -> str:
    match = re.search(r"^Status:\s*(.+?)\s*$", text, re.MULTILINE | re.IGNORECASE)
    return match.group(1).strip() if match else ""


def _is_dispatch_status(status: str) -> bool:
    normalized = status.upper()
    return "DISPATCHED" in normalized or "READY" in normalized or "CLOSED" in normalized


def _is_hold_status(status: str) -> bool:
    return "HOLD" in status.upper() or "PROPOSED" in status.upper() or "DRAFT" in status.upper()


def _is_closed_status(status: str) -> bool:
    normalized = status.strip().upper()
    return re.match(r"^CLOSED(?:\b|_)", normalized) is not None


def _validate_status_token_hygiene(text: str, artifact_label: str) -> list[str]:
    status = _extract_status(text)
    normalized = status.upper()
    if _is_hold_status(status) and re.search(r"(?:^|_)CLOSED(?:\b|_)", normalized):
        return [
            f"{artifact_label} hold/draft/proposed status must not contain `CLOSED`; "
            "use PASS or SATISFIED wording for prerequisite status tokens"
        ]
    return []


def _validate_closed_artifact_finality(text: str, artifact_label: str) -> list[str]:
    issues: list[str] = []
    status = _extract_status(text)
    if not _is_closed_status(status):
        return issues
    open_rows = re.findall(r"(?m)^\|.*\|\s*OPEN\s*\|\s*$", text)
    if open_rows:
        issues.append(
            f"closed {artifact_label} contains {len(open_rows)} table row(s) still marked OPEN"
        )
    unchecked_items = re.findall(r"(?m)^\s*[-*]\s+\[\s\]\s+", text)
    if unchecked_items:
        issues.append(
            f"closed {artifact_label} contains {len(unchecked_items)} unchecked checklist item(s)"
        )
    stale_resolution_rows = re.findall(
        r"(?im)^\|.*\|\s*(?:HOLD(?:_[A-Z0-9_]+)?|PENDING(?:_[A-Z0-9_]+)?|READY_FOR_DISPATCH)\s*\|\s*$",
        text,
    )
    if stale_resolution_rows:
        issues.append(
            f"closed {artifact_label} contains {len(stale_resolution_rows)} table row(s) "
            "still marked HOLD/PENDING/READY_FOR_DISPATCH"
        )
    if artifact_label == "work order":
        stale_work_order_phrases = sorted(
            {
                match.group(0)
                for pattern in (
                    r"\bremains\s+on\s+HOLD\b",
                    r"\bwhile\s+on\s+HOLD\b",
                    r"\bnot\s+ready\s+for\s+worker\s+execution\b",
                    r"\bnot\s+dispatch(?:ed|able)?\b",
                )
                for match in re.finditer(pattern, text, re.IGNORECASE)
            }
        )
        if stale_work_order_phrases:
            issues.append(
                "closed work order contains stale hold/dispatch-blocking prose: "
                + ", ".join(stale_work_order_phrases)
            )
    return issues


def _validate_closed_roadmap_status_residue(text: str) -> list[str]:
    issues: list[str] = []
    status = _extract_status(text)
    if not _is_closed_status(status):
        return issues
    residue_patterns = (
        r"\bWORK_ORDER_READY\b",
        r"\bREADY_FOR_IMPLEMENTATION\b",
        r"\bHOLD_UNTIL_[A-Z0-9_]+\b",
        r"\bHOLD\s+until\b",
    )
    residues = sorted(
        {
            match.group(0)
            for pattern in residue_patterns
            for match in re.finditer(pattern, text, re.IGNORECASE)
        }
    )
    if residues:
        issues.append(
            "closed roadmap contains stale dispatch/hold status residue: "
            + ", ".join(residues)
        )
    return issues


def _validate_fast_lane_status_consistency(text: str) -> list[str]:
    issues: list[str] = []
    status = _extract_status(text).upper()
    if status in {"ACTIVE", "DRAFT", "HOLD"} and re.search(
        r"(?im)^\s*(?:\*\*)?(?:Disposition|Decision|Position)\s*(?:\*\*)?\s*:\s*(?:\*\*)?(?:FAST_LANE_PASS|PASS|APPROVE|ACCEPT)",
        text,
    ):
        issues.append(
            "fast-lane audit status is still ACTIVE/DRAFT/HOLD while disposition or decision is pass/approve"
        )
    return issues


def _validate_dispatch_pending_dependency_language(text: str, artifact_label: str) -> list[str]:
    text = re.split(r"(?im)^##\s+.*Reviewer Closure Conversion.*$", text, maxsplit=1)[0]
    filtered_lines = [
        line
        for line in text.splitlines()
        if "forbiddenClosedEquivalentResidue" not in line
        and "pendingStatusTokensAllowedBeforeReview" not in line
    ]
    windows: list[str] = []
    for index, line in enumerate(filtered_lines):
        if not re.search(r"\b(?:Prerequisite|Prerequisites|Predecessor|Dependency|CLOSED_PASS)\b", line, re.IGNORECASE):
            continue
        next_line = filtered_lines[index + 1] if index + 1 < len(filtered_lines) else ""
        windows.append(f"{line} {next_line}".strip())
    if not any(PENDING_DEPENDENCY_LANGUAGE_RE.search(window) for window in windows):
        return []
    return [
        f"dispatch/ready {artifact_label} contains pending predecessor release language next to "
        "`CLOSED_PASS` evidence; keep status HOLD/DRAFT until the prerequisite closure commit exists"
    ]


def _validate_ready_dependency_release(
    text: str,
    commit_contains_path: Callable[[str, str], bool],
) -> list[str]:
    issues: list[str] = []
    issues.extend(_validate_dispatch_pending_dependency_language(text, "work order"))
    for row in (row for table in _parse_any_markdown_tables(text) for row in table):
        disposition = _row_value(row, "Disposition").strip().strip("`").upper()
        joined = " ".join(row.values())
        if disposition == "REQUIRED":
            issues.append(
                "dispatch/ready work order contains unresolved prerequisite disposition `REQUIRED`; "
                "release HOLD only after replacing it with source-backed ACCEPT evidence per "
                "docs/reference/CVF_WORK_ORDER_DEPENDENCY_RELEASE_EVIDENCE_STANDARD_2026-06-03.md"
            )
            break
        if disposition == "ACCEPT":
            continue
        if re.search(r"\bafter\s+(?:closure|T\d+\s+closure|[A-Z0-9_-]+\s+closure)\b", joined, re.IGNORECASE):
            issues.append(
                "dispatch/ready work order contains stale dependency placeholder prose such as `after closure`; "
                "cite the closed artifact path and commit before dispatch per "
                "docs/reference/CVF_WORK_ORDER_DEPENDENCY_RELEASE_EVIDENCE_STANDARD_2026-06-03.md"
            )
            break
    for match in re.finditer(
        r"`(?P<path>(?:docs|governance|EXTENSIONS|CVF_SESSION|scripts|sdk|\.github|\.private_reference)/[^`]+)`"
        r"[^\n`]*\bat commit\s+`(?P<commit>[0-9a-f]{7,40})`",
        text,
        re.IGNORECASE,
    ):
        path = match.group("path")
        commit = match.group("commit")
        if not commit_contains_path(commit, path):
            issues.append(
                "dispatch/ready work order cites dependency artifact "
                f"`{path}` at commit `{commit}`, but that commit does not contain the path; "
                "cite the closure commit that contains the prerequisite artifact per "
                "docs/reference/CVF_WORK_ORDER_DEPENDENCY_RELEASE_EVIDENCE_STANDARD_2026-06-03.md"
            )
    return issues


def _has_pending_content_status(statuses: set[str]) -> bool:
    return bool(statuses) and not statuses <= {"R"}


def _validate_pending_artifact_evidence_finality(path: str, text: str, statuses: set[str]) -> list[str]:
    if not _has_pending_content_status(statuses):
        return []
    issues: list[str] = []
    if re.search(
        r"git\s+status\s+--short[^\n\r]{0,120}(?:\u2192|->|:)\s*(?:`?clean`?|clean\b|worktree\s+clean)",
        text,
        re.IGNORECASE,
    ):
        issues.append(
            "pending changed artifact records `git status --short` as clean even though the artifact "
            "itself is not committed; record the actual pending status or commit first"
        )
    if re.search(
        r"(?:run_agent_autorun_workflow_gate|check_work_order_dispatch_quality|check_[A-Za-z0-9_]+)"
        r"[^\n\r]{0,180}--base\s+HEAD~1\s+--head\s+HEAD",
        text,
        re.IGNORECASE,
    ):
        issues.append(
            "pending changed artifact cites `--base HEAD~1 --head HEAD` gate evidence that does not "
            "prove the pending artifact; use a working-tree-aware validation or commit the artifact "
            "and rerun the real changed range"
        )
    if re.search(r"\bstaged\s+for\s+review\b", text, re.IGNORECASE) and "A" not in statuses and "M" not in statuses:
        issues.append(
            "artifact claims it is staged for review, but git status does not show staged content for this path"
        )
    if re.search(r"(?im)^\s*[-*]\s+`?git\s+status\s+--short`?\s*(?:->|\u2192|:)", text) and path not in text:
        issues.append(
            "pending changed artifact records `git status --short` but omits its own pending path; "
            "record the actual pending status line for this artifact"
        )
    return issues


def _is_finding_bearing(text: str) -> bool:
    return any(marker in text for marker in FINDING_MARKERS)


def _validate_self_reported_gate_evidence_consistency(text: str) -> list[str]:
    issues: list[str] = []
    status = _extract_status(text).upper()
    blocking_status = any(token in status for token in ("BLOCKED", "HOLD"))
    gate_failures = re.findall(
        r"(?im)^\s*[-*]\s+`[^`\n]*(?:check_work_order_dispatch_quality|run_agent_autorun_workflow_gate|"
        r"check_corpus_completeness_report_integrity|check_corpus_to_knowledge_map_reconciliation)"
        r"[^`\n]*`\s*(?:->|\u2192|:)\s*(?:`?FAIL`?|FAILED\b)",
        text,
    )
    if gate_failures and not blocking_status:
        issues.append(
            "artifact records a failed self-reported governance gate while status is not BLOCKED/HOLD; "
            "repair allowed-scope failures and rerun, or mark the artifact BLOCKED with return action"
        )
    if (
        _is_finding_bearing(text)
        and FINDING_LEARNING_SECTION not in text
        and re.search(
            r"(?im)^\s*[-*]\s+`[^`\n]*run_agent_autorun_workflow_gate[^`\n]*`\s*(?:->|\u2192|:)\s*(?:`?PASS`?|PASSED\b)",
            text,
        )
    ):
        issues.append(
            "artifact records autorun gate PASS but is finding-bearing without "
            "`## Finding-To-Governance Learning Disposition`; rerun after adding the required section"
        )
    return issues
