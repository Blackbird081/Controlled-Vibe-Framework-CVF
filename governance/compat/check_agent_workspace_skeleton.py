#!/usr/bin/env python3
"""CVF Agent Workspace Skeleton Gate."""

from __future__ import annotations

import argparse
import subprocess
import sys
from pathlib import Path

try:
    from guard_binding_catalog import effective_binding_text
except ModuleNotFoundError:
    from governance.compat.guard_binding_catalog import effective_binding_text


REPO_ROOT = Path(__file__).resolve().parents[2]
SKELETON_ROOT = "CVF_SESSION/agent_workspace/workspace"
SKELETON_README = f"{SKELETON_ROOT}/README.md"
LANES_README = f"{SKELETON_ROOT}/lanes/README.md"
LANES = (
    "intake",
    "dispatch",
    "execution",
    "worker_return",
    "review",
    "accepted_material",
    "session_sync",
    "parked",
    "blocked",
    "archive_ready",
)
REFERENCE_README = "docs/reference/agent_workspace/README.md"
DESIGN_STANDARD = "docs/reference/agent_workspace/CVF_AGENT_INTERACTION_WORKSPACE_DESIGN_STANDARD.md"
TOPOLOGY_CONTRACT = "docs/reference/agent_workspace/CVF_AGENT_WORKSPACE_STATE_TOPOLOGY_CONTRACT.md"
STATE_AGGREGATE = "CVF_SESSION/agent_workspace/ACTIVE_AGENT_WORKSPACE_STATE.json"
AGENTS_PATH = "AGENTS.md"
THIS_SCRIPT_PATH = "governance/compat/check_agent_workspace_skeleton.py"
AUTORUN_PATH = "governance/compat/run_agent_autorun_workflow_gate.py"
HOOK_CHAIN_PATH = "governance/compat/run_local_governance_hook_chain.py"


def _repo(path: str) -> Path:
    return REPO_ROOT / path


def _read_text(path: str) -> str:
    file_path = _repo(path)
    if not file_path.exists() or file_path.is_dir():
        return ""
    return file_path.read_text(encoding="utf-8", errors="replace")


def _git_changed_paths(base: str | None, head: str) -> list[str]:
    if not base:
        base = "HEAD"
    result = subprocess.run(
        ["git", "diff", "--name-only", f"{base}..{head}"],
        cwd=REPO_ROOT,
        capture_output=True,
        text=True,
    )
    if result.returncode != 0:
        return []
    return [line.strip().replace("\\", "/") for line in result.stdout.splitlines() if line.strip()]


def _validate_paths() -> list[str]:
    required = [SKELETON_README, LANES_README]
    required.extend(f"{SKELETON_ROOT}/lanes/{lane}/README.md" for lane in LANES)
    violations: list[str] = []
    for path in required:
        if not _repo(path).exists():
            violations.append(f"required agent workspace skeleton path missing: {path}")
    return violations


def _validate_markers() -> list[str]:
    markers = {
        SKELETON_README: (
            "Status: ACTIVE_SKELETON",
            REFERENCE_README,
            TOPOLOGY_CONTRACT,
            STATE_AGGREGATE,
            THIS_SCRIPT_PATH,
            "not runtime queues",
            "Public Export Disposition",
        ),
        LANES_README: (
            "Status: ACTIVE_INDEX",
            "CVF_SESSION/agent_workspace/state/items/",
            "not runtime",
        ),
        REFERENCE_README: (
            SKELETON_README,
            LANES_README,
            THIS_SCRIPT_PATH,
        ),
        DESIGN_STANDARD: (
            SKELETON_README,
            THIS_SCRIPT_PATH,
        ),
        TOPOLOGY_CONTRACT: (
            SKELETON_README,
            THIS_SCRIPT_PATH,
        ),
        AGENTS_PATH: (
            "Mandatory Agent Workspace Skeleton Guard",
            SKELETON_README,
            THIS_SCRIPT_PATH,
        ),
        AUTORUN_PATH: (THIS_SCRIPT_PATH,),
        HOOK_CHAIN_PATH: (THIS_SCRIPT_PATH,),
    }
    violations: list[str] = []
    for path, required_markers in markers.items():
        text = effective_binding_text(path, _read_text(path))
        for marker in required_markers:
            if marker not in text:
                violations.append(f"{path} missing marker `{marker}`")
    return violations


def run_check(base: str | None, head: str) -> tuple[list[str], int]:
    changed_paths = _git_changed_paths(base, head)
    violations: list[str] = []
    violations.extend(_validate_paths())
    violations.extend(_validate_markers())
    return violations, len(changed_paths)


def main() -> int:
    parser = argparse.ArgumentParser(description="Validate CVF agent workspace skeleton")
    parser.add_argument("--base", default=None)
    parser.add_argument("--head", default="HEAD")
    parser.add_argument("--enforce", action="store_true")
    args = parser.parse_args()

    violations, changed_count = run_check(args.base, args.head)
    print("=== CVF Agent Workspace Skeleton Gate ===")
    print(f"Skeleton: {SKELETON_ROOT}")
    print(f"Changed paths checked: {changed_count}")
    print(f"Violations: {len(violations)}")
    if violations:
        for violation in violations:
            print(f"  - {violation}")
        return 1 if args.enforce else 0
    print()
    print("COMPLIANT - agent workspace skeleton is aligned.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
