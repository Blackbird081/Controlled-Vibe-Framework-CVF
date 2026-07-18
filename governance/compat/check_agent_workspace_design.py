#!/usr/bin/env python3
"""
CVF Agent Workspace Design Gate.

Enforces the pre-build workspace design control block for any changed work
order that proposes, designs, builds, or modifies an agent-interaction
workspace surface.
"""

from __future__ import annotations

import argparse
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
STANDARD_PATH = "docs/reference/agent_workspace/CVF_AGENT_INTERACTION_WORKSPACE_DESIGN_STANDARD.md"
README_PATH = "docs/reference/agent_workspace/README.md"
CONTRACT_PATH = "docs/reference/CVF_AHB_T2_AGENT_HANDOFF_CONTRACT_RATIFICATION_2026-06-16.md"
THIS_SCRIPT_PATH = "governance/compat/check_agent_workspace_design.py"
AUTORUN_PATH = "governance/compat/run_agent_autorun_workflow_gate.py"
HOOK_CHAIN_PATH = "governance/compat/run_local_governance_hook_chain.py"
DEFAULT_BASE_CANDIDATES = ("origin/main", "origin/master", "main", "master")

WORK_ORDER_PREFIX = "docs/work_orders/"
REVIEW_PREFIX = "docs/reviews/"
ARCHIVE_MARKER = "/archive/"
CONTROL_BLOCK = "Agent Workspace Design Control Block"
DISPATCH_READY_TOKENS = (
    "Status: DISPATCH_READY",
    "Status: DISPATCHED",
    "Status: READY_FOR_REVIEW",
    "Status: APPROVED_FOR_EXECUTION",
    "Status: CLOSED_PASS_BOUNDED",
)

WORKSPACE_MARKERS = (
    "agent-interaction workspace",
    "agent interaction workspace",
    "agent_workspace",
    "Agent Workspace Design",
    "workspace design",
    "workspace build",
    "workspace foundation",
    "workspace runtime",
    "workspace queue",
    "workspace inbox",
    "agent-to-agent workspace",
    "Claude/Codex/other-agent",
    "AHB-Tn",
)

REQUIRED_BLOCK_FIELDS = (
    "Workspace purpose",
    "Contract source",
    "Front door",
    "Storage class",
    "Handoff fields",
    "State ownership",
    "Guard owner",
    "Build boundary",
)

REQUIRED_BLOCK_SOURCES = (
    CONTRACT_PATH,
    README_PATH,
    STANDARD_PATH,
)

BUILD_BOUNDARY_MARKERS = (
    "runtime source",
    "provider proof",
    "public-sync",
    "registry edits",
)

COMPLETION_MARKERS = (
    "Agent Workspace Design Checker Evidence",
    THIS_SCRIPT_PATH,
    "Agent Workspace Design Control Block",
)


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


def _normalize(path: str) -> str:
    return path.replace("\\", "/").strip()


def _parse_name_status(output: str) -> dict[str, set[str]]:
    changed: dict[str, set[str]] = {}
    for raw_line in output.splitlines():
        parts = raw_line.split("\t")
        if len(parts) < 2:
            continue
        status = parts[0].strip()
        path = parts[2] if status.startswith(("R", "C")) and len(parts) > 2 else parts[1]
        normalized = _normalize(path)
        if normalized:
            changed.setdefault(normalized, set()).add(status)
    return changed


def _get_changed(base: str, head: str) -> dict[str, list[str]]:
    merged: dict[str, set[str]] = {}
    code, out, err = _run_git(["diff", "--name-status", f"{base}..{head}"])
    if code != 0:
        raise RuntimeError(f"git diff failed for range {base}..{head}: {err or out}")
    for path, statuses in _parse_name_status(out).items():
        merged.setdefault(path, set()).update(statuses)
    for args in (["diff", "--name-status"], ["diff", "--name-status", "--cached"]):
        code, out, _ = _run_git(args)
        if code == 0 and out:
            for path, statuses in _parse_name_status(out).items():
                merged.setdefault(path, set()).update(statuses)
    code, out, _ = _run_git(["ls-files", "--others", "--exclude-standard"])
    if code == 0 and out:
        for raw_line in out.splitlines():
            path = _normalize(raw_line)
            if path:
                merged.setdefault(path, set()).add("A")
    return {path: sorted(statuses) for path, statuses in sorted(merged.items())}


def _read_rel(path: str) -> str:
    return (REPO_ROOT / path).read_text(encoding="utf-8", errors="replace")


def _add(violations: list[dict[str, str]], path: str, issue_type: str, message: str) -> None:
    violations.append({"path": path, "type": issue_type, "message": message})


def _is_deleted(statuses: list[str]) -> bool:
    return bool(statuses) and all(status.startswith("D") for status in statuses)


def _is_archive_path(path: str) -> bool:
    return ARCHIVE_MARKER in path.lower()


def _extract_section(text: str, heading_fragment: str) -> str:
    pattern = re.compile(
        rf"^##\s+.*{re.escape(heading_fragment)}.*$([\s\S]*?)(?=^##\s+|\Z)",
        re.MULTILINE | re.IGNORECASE,
    )
    match = pattern.search(text)
    return match.group(1) if match else ""


def _mentions_workspace(text: str) -> bool:
    return any(marker.lower() in text.lower() for marker in WORKSPACE_MARKERS)


def _requires_workspace_control(path: str, text: str) -> bool:
    if not path.startswith(WORK_ORDER_PREFIX) or not path.endswith(".md") or _is_archive_path(path):
        return False
    return _mentions_workspace(text) and any(token in text for token in DISPATCH_READY_TOKENS)


def _validate_standard(path: str, text: str) -> list[dict[str, str]]:
    violations: list[dict[str, str]] = []
    required = (
        "Status: ACTIVE_STANDARD_AND_MACHINE_ENFORCED",
        README_PATH,
        CONTRACT_PATH,
        THIS_SCRIPT_PATH,
        CONTROL_BLOCK,
        "## Machine Enforcement",
        "## Work Order Requirement",
    )
    for marker in required:
        if marker not in text:
            _add(violations, path, "standard_marker_missing", f"missing marker `{marker}`")
    return violations


def _validate_readme(path: str, text: str) -> list[dict[str, str]]:
    violations: list[dict[str, str]] = []
    required = (
        "Status: ACTIVE_INDEX",
        STANDARD_PATH,
        CONTRACT_PATH,
        THIS_SCRIPT_PATH,
        "Agent Workspace Design Control Block",
    )
    for marker in required:
        if marker not in text:
            _add(violations, path, "workspace_readme_marker_missing", f"missing marker `{marker}`")
    return violations


def _validate_binding(path: str, text: str) -> list[dict[str, str]]:
    violations: list[dict[str, str]] = []
    if path == AUTORUN_PATH and not has_binding_marker(path, THIS_SCRIPT_PATH, text):
        _add(violations, path, "autorun_binding_missing", f"autorun gate must run `{THIS_SCRIPT_PATH}`")
    if path == HOOK_CHAIN_PATH and not has_binding_marker(path, THIS_SCRIPT_PATH, text):
        _add(violations, path, "hook_binding_missing", f"local hook chain must run `{THIS_SCRIPT_PATH}`")
    return violations


def _validate_control_block(path: str, text: str) -> list[dict[str, str]]:
    violations: list[dict[str, str]] = []
    block = _extract_section(text, CONTROL_BLOCK)
    if not block:
        _add(
            violations,
            path,
            "agent_workspace_design_control_block_missing",
            f"workspace work orders must include `## {CONTROL_BLOCK}`",
        )
        return violations

    lowered_block = block.lower()
    for field in REQUIRED_BLOCK_FIELDS:
        if field.lower() not in lowered_block:
            _add(
                violations,
                path,
                "agent_workspace_design_field_missing",
                f"control block missing `{field}`",
            )

    for source in REQUIRED_BLOCK_SOURCES:
        if source not in block:
            _add(
                violations,
                path,
                "agent_workspace_design_source_missing",
                f"control block must cite `{source}`",
            )

    for marker in BUILD_BOUNDARY_MARKERS:
        if marker not in lowered_block:
            _add(
                violations,
                path,
                "agent_workspace_build_boundary_incomplete",
                f"Build boundary must explicitly account for `{marker}`",
            )
    return violations


def _validate_work_order(path: str, text: str) -> list[dict[str, str]]:
    if not _requires_workspace_control(path, text):
        return []
    return _validate_control_block(path, text)


def _validate_completion(path: str, text: str) -> list[dict[str, str]]:
    violations: list[dict[str, str]] = []
    if not path.startswith(REVIEW_PREFIX) or not path.endswith(".md") or _is_archive_path(path):
        return violations
    if "AHB-Tn.2" not in text or "Status: CLOSED_PASS_BOUNDED" not in text:
        return violations
    for marker in COMPLETION_MARKERS:
        if marker not in text:
            _add(violations, path, "agent_workspace_completion_evidence_missing", f"missing marker `{marker}`")
    return violations


def _validate_path(path: str, statuses: list[str]) -> list[dict[str, str]]:
    if _is_deleted(statuses):
        return []
    full = REPO_ROOT / path
    if not full.exists():
        return []
    text = _read_rel(path)
    violations: list[dict[str, str]] = []
    if path == STANDARD_PATH:
        violations.extend(_validate_standard(path, text))
    if path == README_PATH:
        violations.extend(_validate_readme(path, text))
    if path in {AUTORUN_PATH, HOOK_CHAIN_PATH}:
        violations.extend(_validate_binding(path, text))
    violations.extend(_validate_work_order(path, text))
    violations.extend(_validate_completion(path, text))
    return violations


def _validate_changed(changed_paths: dict[str, list[str]]) -> list[dict[str, str]]:
    paths = set(changed_paths)
    for path in (STANDARD_PATH, README_PATH, AUTORUN_PATH, HOOK_CHAIN_PATH):
        if (REPO_ROOT / path).exists():
            paths.add(path)
    violations: list[dict[str, str]] = []
    for path in sorted(paths):
        statuses = changed_paths.get(path, [])
        violations.extend(_validate_path(path, statuses))
    return violations


def _build_report(base: str | None, head: str | None) -> dict[str, Any]:
    resolved_base, resolved_head, base_source = _resolve_range(base, head)
    changed_paths = _get_changed(resolved_base, resolved_head)
    violations = _validate_changed(changed_paths)
    return {
        "base": resolved_base,
        "head": resolved_head,
        "baseSource": base_source,
        "changedPaths": changed_paths,
        "violations": violations,
        "compliant": not violations,
    }


def main(argv: list[str] | None = None) -> int:
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(errors="replace")
    parser = argparse.ArgumentParser(description="Enforce CVF agent workspace design control block")
    parser.add_argument("--base", default=None)
    parser.add_argument("--head", default="HEAD")
    parser.add_argument("--json", action="store_true")
    parser.add_argument("--enforce", action="store_true")
    args = parser.parse_args(argv)

    try:
        report = _build_report(args.base, args.head)
    except RuntimeError as exc:
        print(str(exc), file=sys.stderr)
        return 2

    if args.json:
        print(json.dumps(report, indent=2, sort_keys=True))
    else:
        print("=== CVF Agent Workspace Design Gate ===")
        print(f"Standard: {STANDARD_PATH}")
        print(f"Base: {report['base']} ({report['baseSource']})")
        print(f"Head: {report['head']}")
        print(f"Changed paths checked: {len(report['changedPaths'])}")
        if report["violations"]:
            print("\nViolations:")
            for issue in report["violations"]:
                print(f"- {issue['path']}: {issue['type']} - {issue['message']}")
            print("\nVIOLATION - repair agent workspace design control evidence before proceeding.")
        else:
            print("\nCOMPLIANT - agent workspace design gate is satisfied.")
    return 1 if args.enforce and report["violations"] else 0


if __name__ == "__main__":
    raise SystemExit(main())
