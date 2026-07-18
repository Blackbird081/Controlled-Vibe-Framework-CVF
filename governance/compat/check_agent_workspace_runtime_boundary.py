#!/usr/bin/env python3
"""CVF Agent Workspace Runtime Boundary Gate."""

from __future__ import annotations

import argparse
import subprocess
import sys
from pathlib import Path

try:
    from guard_binding_catalog import has_binding_marker
except ModuleNotFoundError:
    from governance.compat.guard_binding_catalog import has_binding_marker


REPO_ROOT = Path(__file__).resolve().parents[2]

CONTRACT = "docs/reference/agent_workspace/CVF_AGENT_WORKSPACE_RUNTIME_EXPANSION_READINESS_CONTRACT.md"
OPERATOR_VIEW_PLAN = "docs/reference/agent_workspace/CVF_AGENT_WORKSPACE_OPERATOR_VIEW_PLAN.md"
REFERENCE_README = "docs/reference/agent_workspace/README.md"
DESIGN_STANDARD = "docs/reference/agent_workspace/CVF_AGENT_INTERACTION_WORKSPACE_DESIGN_STANDARD.md"
TOPOLOGY_CONTRACT = "docs/reference/agent_workspace/CVF_AGENT_WORKSPACE_STATE_TOPOLOGY_CONTRACT.md"
OPTION_MATRIX = "docs/reference/agent_workspace/CVF_AGENT_WORKSPACE_OPTION_READINESS_MATRIX.md"
QUEUE_ROOT = "CVF_SESSION/agent_workspace/runtime_queue"
QUEUE_README = f"{QUEUE_ROOT}/README.md"
QUEUES_README = f"{QUEUE_ROOT}/queues/README.md"
STATE_ITEMS_DIR = "CVF_SESSION/agent_workspace/state/items/"
STATE_AGGREGATE = "CVF_SESSION/agent_workspace/ACTIVE_AGENT_WORKSPACE_STATE.json"
AGENTS_PATH = "AGENTS.md"
THIS_SCRIPT_PATH = "governance/compat/check_agent_workspace_runtime_boundary.py"
AUTORUN_PATH = "governance/compat/run_agent_autorun_workflow_gate.py"
HOOK_CHAIN_PATH = "governance/compat/run_local_governance_hook_chain.py"
DEFAULT_BASE_CANDIDATES = ("origin/main", "origin/master", "main", "master")

QUEUE_FAMILIES = ("intake", "dispatch", "review", "session_sync", "parked")


def _repo(path: str) -> Path:
    return REPO_ROOT / path


def _read_text(path: str) -> str:
    file_path = _repo(path)
    if not file_path.exists() or file_path.is_dir():
        return ""
    return file_path.read_text(encoding="utf-8", errors="replace")


def _git_changed_paths(base: str | None, head: str) -> list[str]:
    base_ref = base
    if not base_ref:
        for candidate in DEFAULT_BASE_CANDIDATES:
            result = subprocess.run(
                ["git", "rev-parse", "--verify", candidate],
                cwd=REPO_ROOT,
                capture_output=True,
                text=True,
            )
            if result.returncode == 0:
                base_ref = candidate
                break
    if not base_ref:
        base_ref = "HEAD"
    result = subprocess.run(
        ["git", "diff", "--name-only", f"{base_ref}..{head}"],
        cwd=REPO_ROOT,
        capture_output=True,
        text=True,
    )
    if result.returncode != 0:
        return []
    return [line.strip().replace("\\", "/") for line in result.stdout.splitlines() if line.strip()]


def _validate_paths() -> list[str]:
    required = (
        CONTRACT,
        OPERATOR_VIEW_PLAN,
        REFERENCE_README,
        DESIGN_STANDARD,
        TOPOLOGY_CONTRACT,
        OPTION_MATRIX,
        QUEUE_README,
        QUEUES_README,
        THIS_SCRIPT_PATH,
    )
    violations: list[str] = []
    for path in required:
        if not _repo(path).exists():
            violations.append(f"required agent workspace runtime boundary path missing: {path}")
    for family in QUEUE_FAMILIES:
        path = f"{QUEUE_ROOT}/queues/{family}/README.md"
        if not _repo(path).exists():
            violations.append(f"required queue-family pointer missing: {path}")
    return violations


def _validate_markers() -> list[str]:
    markers = {
        CONTRACT: (
            "Status: ACTIVE_CONTRACT",
            "QUEUE_SKELETON_ONLY",
            "Runtime Expansion Control Block",
            QUEUE_README,
            OPERATOR_VIEW_PLAN,
            THIS_SCRIPT_PATH,
            "does not build a runtime queue",
        ),
        OPERATOR_VIEW_PLAN: (
            "Status: ACTIVE_PLAN",
            CONTRACT,
            "read model only",
            STATE_AGGREGATE,
            THIS_SCRIPT_PATH,
        ),
        QUEUE_README: (
            "Status: ACTIVE_QUEUE_SKELETON",
            "QUEUE_SKELETON_ONLY",
            CONTRACT,
            OPERATOR_VIEW_PLAN,
            THIS_SCRIPT_PATH,
            "not an executable queue",
            "No scheduler",
            "Public Export Disposition",
        ),
        QUEUES_README: (
            "Status: ACTIVE_INDEX",
            "QUEUE_SKELETON_ONLY",
            STATE_ITEMS_DIR,
            STATE_AGGREGATE,
        ),
        REFERENCE_README: (
            CONTRACT,
            OPERATOR_VIEW_PLAN,
            QUEUE_README,
            THIS_SCRIPT_PATH,
        ),
        DESIGN_STANDARD: (
            CONTRACT,
            OPERATOR_VIEW_PLAN,
            QUEUE_README,
            THIS_SCRIPT_PATH,
            "Runtime Expansion Control Block",
        ),
        TOPOLOGY_CONTRACT: (
            CONTRACT,
            OPERATOR_VIEW_PLAN,
            QUEUE_README,
            THIS_SCRIPT_PATH,
        ),
        OPTION_MATRIX: (
            "AHB-Tn.8",
            "AHB-Tn.9",
            "AHB-Tn.10",
            CONTRACT,
            QUEUE_README,
            OPERATOR_VIEW_PLAN,
        ),
        AGENTS_PATH: (
            "Mandatory Agent Workspace Runtime Boundary Guard",
            CONTRACT,
            QUEUE_README,
            OPERATOR_VIEW_PLAN,
            THIS_SCRIPT_PATH,
        ),
    }
    violations: list[str] = []
    for path, required_markers in markers.items():
        text = _read_text(path)
        for marker in required_markers:
            if marker not in text:
                violations.append(f"{path} missing marker `{marker}`")

    for family in QUEUE_FAMILIES:
        path = f"{QUEUE_ROOT}/queues/{family}/README.md"
        text = _read_text(path)
        for marker in ("Status: ACTIVE_QUEUE_POINTER", "QUEUE_SKELETON_ONLY", f"Mapped lane: `{family}`"):
            if marker not in text:
                violations.append(f"{path} missing marker `{marker}`")
    return violations


def _validate_binding() -> list[str]:
    violations: list[str] = []
    for path in (AUTORUN_PATH, HOOK_CHAIN_PATH):
        text = _read_text(path)
        if not has_binding_marker(path, THIS_SCRIPT_PATH, text):
            violations.append(f"{path} does not run {THIS_SCRIPT_PATH}")
    return violations


def run_check(base: str | None, head: str) -> tuple[list[str], int]:
    changed_paths = _git_changed_paths(base, head)
    violations: list[str] = []
    violations.extend(_validate_paths())
    violations.extend(_validate_markers())
    violations.extend(_validate_binding())
    return violations, len(changed_paths)


def main() -> int:
    parser = argparse.ArgumentParser(description="Validate CVF agent workspace runtime boundary")
    parser.add_argument("--base", default=None)
    parser.add_argument("--head", default="HEAD")
    parser.add_argument("--enforce", action="store_true")
    args = parser.parse_args()

    violations, changed_count = run_check(args.base, args.head)
    print("=== CVF Agent Workspace Runtime Boundary Gate ===")
    print(f"Contract: {CONTRACT}")
    print(f"Queue skeleton: {QUEUE_README}")
    print(f"Changed paths checked: {changed_count}")
    print(f"Violations: {len(violations)}")
    if violations:
        for violation in violations:
            print(f"  - {violation}")
        return 1 if args.enforce else 0
    print()
    print("COMPLIANT - agent workspace runtime boundary is aligned.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
