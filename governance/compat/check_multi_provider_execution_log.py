#!/usr/bin/env python3
"""
CVF Multi-Provider Execution Log Gate

Enforces the mandatory reporting contract for mixed-provider, multi-agent, and
IDE-extension execution sessions.
"""

from __future__ import annotations

import argparse
import datetime as dt
import json
import os
import re
import subprocess
import sys
from pathlib import Path
from typing import Any

try:
    from guard_binding_catalog import has_binding_marker
except ModuleNotFoundError:
    from governance.compat.guard_binding_catalog import has_binding_marker


REPO_ROOT = Path(__file__).resolve().parents[2]
STANDARD_PATH = "docs/reference/CVF_IDE_EXTENSION_MULTI_PROVIDER_EXECUTION_LOG_STANDARD_2026-05-29.md"
THIS_SCRIPT_PATH = "governance/compat/check_multi_provider_execution_log.py"
AUTORUN_PATH = "governance/compat/run_agent_autorun_workflow_gate.py"
HOOK_CHAIN_PATH = "governance/compat/run_local_governance_hook_chain.py"
DEFAULT_BASE_CANDIDATES = ("origin/main", "origin/master", "main", "master")

AUTHORIZED_SURFACES = (
    "VS_CODE_EXTENSION_CODEX",
    "VS_CODE_EXTENSION_CLAUDE_CODE",
    "VS_CODE_EXTENSION_QWEN_CODE",
    "ANTIGRAVITY",
    "CLI",
    "MCP_CLIENT",
    "BROWSER_AGENT",
    "DIRECT_PROVIDER_SCRIPT",
    "LOCAL_SHELL",
    "UNKNOWN_OPERATOR_REPORTED",
)

EVIDENCE_BASIS = (
    "OPERATOR_REPORTED",
    "GIT_VERIFIED",
    "TEST_VERIFIED",
    "RECEIPT_VERIFIED",
    "DIFF_VERIFIED",
    "COST_LEDGER_VERIFIED",
    "UNVERIFIED_REPORTED",
)

ATTRIBUTION_BLOCK_HEADERS = (
    "Artifact or range",
    "Roadmap/order author",
    "Worker/executor",
    "Reviewer/closer",
    "Provider/model",
    "Execution surface",
    "Evidence basis",
    "Attribution boundary",
)

LOG_PATH_RE = re.compile(r"^docs/logs/CVF_MULTI_PROVIDER_EXECUTION_LOG_.+\.md$")
PIPE_TABLE_RE = re.compile(r"^\|.+\|$", re.MULTILINE)


def _run_git(args: list[str]) -> tuple[int, str, str]:
    proc = subprocess.run(
        ["git", *args],
        cwd=REPO_ROOT,
        text=True,
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


def _parse_name_status_output(output: str) -> dict[str, set[str]]:
    changed: dict[str, set[str]] = {}
    for raw_line in output.splitlines():
        if not raw_line.strip():
            continue
        parts = raw_line.split("\t")
        status = parts[0].strip()
        if status.startswith("R") or status.startswith("C"):
            if len(parts) < 3:
                continue
            path = parts[2]
        else:
            if len(parts) < 2:
                continue
            path = parts[1]
        normalized = path.replace("\\", "/").strip()
        changed.setdefault(normalized, set()).add(status)
    return changed


def _get_changed_name_status(base: str, head: str) -> dict[str, set[str]]:
    code, out, err = _run_git(["diff", "--name-status", f"{base}..{head}"])
    if code != 0:
        raise RuntimeError(f"git diff failed for range {base}..{head}: {err or out}")
    return _parse_name_status_output(out)


def _get_worktree_name_status() -> dict[str, set[str]]:
    changed: dict[str, set[str]] = {}
    for args in (["diff", "--name-status"], ["diff", "--name-status", "--cached"]):
        code, out, _ = _run_git(args)
        if code == 0 and out:
            for path, statuses in _parse_name_status_output(out).items():
                changed.setdefault(path, set()).update(statuses)

    code, out, _ = _run_git(["ls-files", "--others", "--exclude-standard"])
    if code == 0 and out:
        for raw_line in out.splitlines():
            normalized = raw_line.replace("\\", "/").strip()
            if normalized:
                changed.setdefault(normalized, set()).add("A")
    return changed


def _merge_changed_maps(*maps: dict[str, set[str]]) -> dict[str, list[str]]:
    merged: dict[str, set[str]] = {}
    for item in maps:
        for path, statuses in item.items():
            merged.setdefault(path, set()).update(statuses)
    return {path: sorted(statuses) for path, statuses in sorted(merged.items())}


def _read_rel(path: str) -> str:
    return (REPO_ROOT / path).read_text(encoding="utf-8")


def _has_any(text: str, values: tuple[str, ...]) -> bool:
    return any(value in text for value in values)


def _add(violations: list[dict[str, str]], path: str, issue_type: str, message: str) -> None:
    violations.append({"path": path, "type": issue_type, "message": message})


def _validate_standard(path: str, text: str) -> list[dict[str, str]]:
    violations: list[dict[str, str]] = []
    required = (
        "Status: canonical execution-log standard",
        "## Authorized Execution Surface Values",
        "## Required Session Log Fields",
        "## Execution Attribution Block",
        "## PASS And Quality Boundary",
        "## Direct Provider Proof Rule",
        "## Cost And Quality Attribution Rule",
        "## Finding-To-Rule Disposition",
        "## Violation Conditions",
        THIS_SCRIPT_PATH,
    )
    for marker in required:
        if marker not in text:
            _add(violations, path, "standard_marker_missing", f"missing marker `{marker}`")
    for surface in AUTHORIZED_SURFACES:
        if surface not in text:
            _add(violations, path, "authorized_surface_missing", f"missing authorized surface `{surface}`")
    for basis in EVIDENCE_BASIS:
        if basis not in text:
            _add(violations, path, "evidence_basis_missing", f"missing evidence basis `{basis}`")
    return violations


def _validate_session_log(path: str, text: str) -> list[dict[str, str]]:
    violations: list[dict[str, str]] = []
    required_sections = (
        "## Execution Surface Summary",
        "## Execution Attribution Block",
        "## Commit Evidence",
        "## Quality Findings",
        "## Cost And ROI Boundary",
        "## Claim Boundary",
    )
    for section in required_sections:
        if section not in text:
            _add(violations, path, "session_log_section_missing", f"missing section `{section}`")

    if not PIPE_TABLE_RE.search(text):
        _add(violations, path, "session_log_table_missing", "missing pipe-table execution evidence")

    header_requirements = ("Provider/model", "Role", "Evidence basis", "Boundary")
    for marker in header_requirements:
        if marker not in text:
            _add(violations, path, "execution_surface_header_missing", f"missing table header `{marker}`")

    for marker in ATTRIBUTION_BLOCK_HEADERS:
        if marker not in text:
            _add(
                violations,
                path,
                "execution_attribution_header_missing",
                f"missing Execution Attribution Block header `{marker}`",
            )

    if "tool surface" not in text.lower():
        _add(violations, path, "tool_surface_missing", "missing tool surface / invocation surface field")

    if not _has_any(text, AUTHORIZED_SURFACES):
        _add(
            violations,
            path,
            "authorized_surface_value_missing",
            "no authorized execution surface value found",
        )
    if not _has_any(text, EVIDENCE_BASIS):
        _add(violations, path, "evidence_basis_value_missing", "no evidence basis value found")

    if "UNKNOWN_OPERATOR_REPORTED" in text and "operator-reported" not in text.lower():
        _add(
            violations,
            path,
            "operator_report_boundary_missing",
            "UNKNOWN_OPERATOR_REPORTED requires explicit operator-reported boundary text",
        )

    direct_provider_terms = ("DIRECT_PROVIDER_SCRIPT", "direct provider", "provider endpoint")
    if any(term.lower() in text.lower() for term in direct_provider_terms):
        lowered = text.lower()
        if "provider method capability proof" not in lowered:
            _add(
                violations,
                path,
                "direct_provider_method_boundary_missing",
                "direct-provider proof must be labeled provider method capability proof",
            )
        if "governed cvf route" not in lowered and "/api/execute" not in text:
            _add(
                violations,
                path,
                "governed_route_boundary_missing",
                "direct-provider proof must distinguish governed CVF route or /api/execute proof",
            )

    if "CLOSED_PASS" in text and "hook PASS" in text and "not prove" not in text:
        _add(
            violations,
            path,
            "pass_quality_boundary_missing",
            "CLOSED_PASS/hook PASS language must state that PASS does not prove quality/readiness",
        )

    cost_text = text.lower()
    if "cost" in cost_text and "unknown" not in cost_text and "token" not in cost_text:
        _add(
            violations,
            path,
            "cost_evidence_boundary_missing",
            "cost claims must include token evidence, cost source, or explicit unknown boundary",
        )
    return violations


def _validate_binding(path: str, text: str) -> list[dict[str, str]]:
    violations: list[dict[str, str]] = []
    if path == AUTORUN_PATH and not has_binding_marker(path, THIS_SCRIPT_PATH, text):
        _add(violations, path, "autorun_binding_missing", f"autorun gate must run `{THIS_SCRIPT_PATH}`")
    if path == HOOK_CHAIN_PATH and not has_binding_marker(path, THIS_SCRIPT_PATH, text):
        _add(violations, path, "hook_binding_missing", f"local hook chain must run `{THIS_SCRIPT_PATH}`")
    return violations


def _validate_path(path: str) -> list[dict[str, str]]:
    if not (REPO_ROOT / path).exists():
        return []
    text = _read_rel(path)
    violations: list[dict[str, str]] = []
    if path == STANDARD_PATH:
        violations.extend(_validate_standard(path, text))
    if LOG_PATH_RE.match(path):
        violations.extend(_validate_session_log(path, text))
    if path in {AUTORUN_PATH, HOOK_CHAIN_PATH}:
        violations.extend(_validate_binding(path, text))
    return violations


def _classify(changed_paths: dict[str, list[str]]) -> dict[str, Any]:
    paths_to_check = set(changed_paths)
    if (REPO_ROOT / STANDARD_PATH).exists():
        paths_to_check.add(STANDARD_PATH)
    if (REPO_ROOT / AUTORUN_PATH).exists():
        paths_to_check.add(AUTORUN_PATH)
    if (REPO_ROOT / HOOK_CHAIN_PATH).exists():
        paths_to_check.add(HOOK_CHAIN_PATH)

    scoped_paths = sorted(
        path
        for path in paths_to_check
        if path == STANDARD_PATH
        or path in {AUTORUN_PATH, HOOK_CHAIN_PATH}
        or LOG_PATH_RE.match(path)
    )

    violations: list[dict[str, str]] = []
    for path in scoped_paths:
        statuses = changed_paths.get(path, [])
        if statuses and all(status.startswith("D") for status in statuses):
            continue
        violations.extend(_validate_path(path))

    return {
        "filesChecked": scoped_paths,
        "fileCount": len(scoped_paths),
        "violationCount": len(violations),
        "violations": violations,
        "compliant": len(violations) == 0,
    }


def _print_report(report: dict[str, Any], base: str, head: str, base_source: str) -> None:
    print("=== CVF Multi-Provider Execution Log Gate ===")
    print(f"Range: {base}..{head}")
    print(f"Base source: {base_source}")
    print(f"Files checked: {report['fileCount']}")
    print(f"Violations: {report['violationCount']}")
    if report["filesChecked"]:
        print("\nFiles checked:")
        for path in report["filesChecked"]:
            print(f"  - {path}")
    if report["violations"]:
        print("\nViolations:")
        for violation in report["violations"]:
            print(f"  - {violation['path']} ({violation['type']}): {violation['message']}")
    if report["compliant"]:
        print("\nCOMPLIANT - multi-provider execution log guard is satisfied.")
    else:
        print("\nVIOLATION - fix multi-provider execution log or guard binding defects.")
        print(f"See: {STANDARD_PATH}")


def main() -> int:
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(errors="replace")
    if hasattr(sys.stderr, "reconfigure"):
        sys.stderr.reconfigure(errors="replace")

    parser = argparse.ArgumentParser(description="Enforce CVF multi-provider execution log guard")
    parser.add_argument("--base", default=None)
    parser.add_argument("--head", default=None)
    parser.add_argument("--json", action="store_true")
    parser.add_argument("--enforce", action="store_true")
    args = parser.parse_args()

    base, head, base_source = _resolve_range(args.base, args.head)
    try:
        range_changes = _get_changed_name_status(base, head)
    except RuntimeError as exc:
        print(str(exc), file=sys.stderr)
        return 1
    changed_paths = _merge_changed_maps(range_changes, _get_worktree_name_status())
    classified = _classify(changed_paths)
    report = {
        "timestamp": dt.datetime.now(dt.timezone.utc)
        .replace(microsecond=0)
        .isoformat()
        .replace("+00:00", "Z"),
        "range": {"base": base, "head": head, "baseSource": base_source},
        "standard": STANDARD_PATH,
        **classified,
    }

    if args.json:
        print(json.dumps(report, indent=2))
    else:
        _print_report(report, base, head, base_source)

    if args.enforce and not classified["compliant"]:
        return 2
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
