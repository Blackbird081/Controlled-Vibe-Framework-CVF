#!/usr/bin/env python3
"""CVF Agent Workspace State Gate."""

from __future__ import annotations

import argparse
import json
import subprocess
import sys
from pathlib import Path
from typing import Any

try:
    from governance.compat.generate_agent_workspace_state import (
        REQUIRED_ITEM_FIELDS,
        validate_aggregate_matches_sources,
    )
except ModuleNotFoundError:  # direct script execution from governance/compat
    from generate_agent_workspace_state import (
        REQUIRED_ITEM_FIELDS,
        validate_aggregate_matches_sources,
    )

try:
    from guard_binding_catalog import has_binding_marker
except ModuleNotFoundError:
    from governance.compat.guard_binding_catalog import has_binding_marker


REPO_ROOT = Path(__file__).resolve().parents[2]
STATE_PATH = "CVF_SESSION/agent_workspace/ACTIVE_AGENT_WORKSPACE_STATE.json"
SOURCE_DIR = "CVF_SESSION/agent_workspace/state"
ITEMS_DIR = "CVF_SESSION/agent_workspace/state/items"
CORE_PATH = "CVF_SESSION/agent_workspace/state/ACTIVE_AGENT_WORKSPACE_STATE_CORE.json"
FRONT_DOOR_PATH = "docs/reference/agent_workspace/README.md"
DESIGN_STANDARD_PATH = "docs/reference/agent_workspace/CVF_AGENT_INTERACTION_WORKSPACE_DESIGN_STANDARD.md"
TOPOLOGY_CONTRACT_PATH = "docs/reference/agent_workspace/CVF_AGENT_WORKSPACE_STATE_TOPOLOGY_CONTRACT.md"
LANE_TAXONOMY_PATH = "docs/reference/agent_workspace/CVF_AGENT_WORKSPACE_STATE_LANE_TAXONOMY.md"
ITEM_TEMPLATE_PATH = "docs/reference/agent_workspace/CVF_AGENT_WORKSPACE_STATE_ITEM_TEMPLATE.json"
GENERATOR_PATH = "governance/compat/generate_agent_workspace_state.py"
THIS_SCRIPT_PATH = "governance/compat/check_agent_workspace_state.py"
AUTORUN_PATH = "governance/compat/run_agent_autorun_workflow_gate.py"
HOOK_CHAIN_PATH = "governance/compat/run_local_governance_hook_chain.py"
AGENTS_PATH = "AGENTS.md"
DEFAULT_BASE_CANDIDATES = ("origin/main", "origin/master", "main", "master")


def _repo(path: str) -> Path:
    return REPO_ROOT / path


def _read_text(path: str) -> str:
    file_path = _repo(path)
    if not file_path.exists() or file_path.is_dir():
        return ""
    return file_path.read_text(encoding="utf-8", errors="replace")


def _load_json(path: str) -> tuple[Any | None, str | None]:
    file_path = _repo(path)
    if not file_path.exists():
        return None, f"{path} is missing"
    try:
        return json.loads(file_path.read_text(encoding="utf-8")), None
    except json.JSONDecodeError as exc:
        return None, f"{path} invalid JSON: {exc}"


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


def _validate_static_paths() -> list[str]:
    required = (
        STATE_PATH,
        CORE_PATH,
        ITEMS_DIR,
        FRONT_DOOR_PATH,
        DESIGN_STANDARD_PATH,
        TOPOLOGY_CONTRACT_PATH,
        LANE_TAXONOMY_PATH,
        ITEM_TEMPLATE_PATH,
        GENERATOR_PATH,
        THIS_SCRIPT_PATH,
    )
    violations: list[str] = []
    for path in required:
        if not _repo(path).exists():
            violations.append(f"required agent workspace state path missing: {path}")
    return violations


def _validate_aggregate() -> list[str]:
    state, error = _load_json(STATE_PATH)
    if error:
        return [error]
    if not isinstance(state, dict):
        return [f"{STATE_PATH} must be a JSON object"]
    violations: list[str] = []
    for field in (
        "schemaVersion",
        "status",
        "frontDoor",
        "designStandard",
        "topologyContract",
        "generatedBy",
        "checker",
        "claimBoundary",
        "items",
    ):
        if field not in state:
            violations.append(f"{STATE_PATH} missing `{field}`")
    if state.get("frontDoor") != FRONT_DOOR_PATH:
        violations.append(f"{STATE_PATH} frontDoor must be {FRONT_DOOR_PATH}")
    if state.get("topologyContract") != TOPOLOGY_CONTRACT_PATH:
        violations.append(f"{STATE_PATH} topologyContract must be {TOPOLOGY_CONTRACT_PATH}")
    if state.get("generatedBy") != GENERATOR_PATH:
        violations.append(f"{STATE_PATH} generatedBy must be {GENERATOR_PATH}")
    if state.get("checker") != THIS_SCRIPT_PATH:
        violations.append(f"{STATE_PATH} checker must be {THIS_SCRIPT_PATH}")
    items = state.get("items")
    if not isinstance(items, list):
        violations.append(f"{STATE_PATH} items must be a list")
        return violations
    seen_ids: set[str] = set()
    for index, item in enumerate(items):
        if not isinstance(item, dict):
            violations.append(f"{STATE_PATH} items[{index}] must be a JSON object")
            continue
        for field in REQUIRED_ITEM_FIELDS:
            if field not in item or item[field] in ("", None):
                violations.append(f"{STATE_PATH} items[{index}] missing `{field}`")
        item_id = item.get("workspaceItemId")
        if isinstance(item_id, str):
            if item_id in seen_ids:
                violations.append(f"{STATE_PATH} duplicate workspaceItemId `{item_id}`")
            seen_ids.add(item_id)
        if item.get("sourceWorkOrder") and str(item["sourceWorkOrder"]).startswith("CLAUDE"):
            violations.append(f"{STATE_PATH} items[{index}] sourceWorkOrder must be CVF-governed")
        supersedes = item.get("supersedes")
        if not isinstance(supersedes, list):
            violations.append(f"{STATE_PATH} items[{index}] supersedes must be a list")
        resume_condition = item.get("resumeCondition")
        if not isinstance(resume_condition, str) or not resume_condition:
            violations.append(f"{STATE_PATH} items[{index}] resumeCondition must be a non-empty string")
    return violations


def _validate_reference_markers() -> list[str]:
    markers = {
        FRONT_DOOR_PATH: (
            STATE_PATH,
            GENERATOR_PATH,
            THIS_SCRIPT_PATH,
            LANE_TAXONOMY_PATH,
            ITEM_TEMPLATE_PATH,
        ),
        DESIGN_STANDARD_PATH: (
            STATE_PATH,
            THIS_SCRIPT_PATH,
            LANE_TAXONOMY_PATH,
        ),
        TOPOLOGY_CONTRACT_PATH: (
            STATE_PATH,
            GENERATOR_PATH,
            THIS_SCRIPT_PATH,
            LANE_TAXONOMY_PATH,
            ITEM_TEMPLATE_PATH,
        ),
        LANE_TAXONOMY_PATH: (
            ITEM_TEMPLATE_PATH,
            THIS_SCRIPT_PATH,
            "Central Core",
            "Local View",
        ),
        AGENTS_PATH: (
            "Mandatory Agent Workspace State Generated Aggregate Guard",
            STATE_PATH,
            THIS_SCRIPT_PATH,
            LANE_TAXONOMY_PATH,
            ITEM_TEMPLATE_PATH,
        ),
    }
    violations: list[str] = []
    for path, required_markers in markers.items():
        text = _read_text(path)
        for marker in required_markers:
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
    violations.extend(_validate_static_paths())
    violations.extend(validate_aggregate_matches_sources())
    violations.extend(_validate_aggregate())
    violations.extend(_validate_reference_markers())
    violations.extend(_validate_binding())
    return violations, len(changed_paths)


def main() -> int:
    parser = argparse.ArgumentParser(description="Validate CVF agent workspace generated state")
    parser.add_argument("--base", default=None)
    parser.add_argument("--head", default="HEAD")
    parser.add_argument("--enforce", action="store_true")
    args = parser.parse_args()

    violations, changed_count = run_check(args.base, args.head)
    print("=== CVF Agent Workspace State Gate ===")
    print(f"State: {STATE_PATH}")
    print(f"Changed paths checked: {changed_count}")
    print(f"Violations: {len(violations)}")
    if violations:
        for violation in violations:
            print(f"  - {violation}")
        return 1 if args.enforce else 0
    print()
    print("COMPLIANT - agent workspace generated state is aligned.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
