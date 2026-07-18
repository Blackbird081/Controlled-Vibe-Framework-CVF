#!/usr/bin/env python3
"""Generate ACTIVE_AGENT_WORKSPACE_STATE from split workspace state sources."""

from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path
from typing import Any


REPO_ROOT = Path(__file__).resolve().parents[2]
WORKSPACE_ROOT = REPO_ROOT / "CVF_SESSION" / "agent_workspace"
STATE_PATH = WORKSPACE_ROOT / "ACTIVE_AGENT_WORKSPACE_STATE.json"
SOURCE_DIR = WORKSPACE_ROOT / "state"
CORE_PATH = SOURCE_DIR / "ACTIVE_AGENT_WORKSPACE_STATE_CORE.json"
ITEMS_DIR = SOURCE_DIR / "items"
SOURCE_ONLY_ITEM_FIELDS = {"stateOrder"}

REQUIRED_CORE_FIELDS = (
    "schemaVersion",
    "status",
    "frontDoor",
    "designStandard",
    "topologyContract",
    "handoffContract",
    "generatedBy",
    "checker",
    "claimBoundary",
    "items",
)

REQUIRED_ITEM_FIELDS = (
    "workspaceItemId",
    "lane",
    "itemKind",
    "status",
    "ownerRole",
    "route",
    "rolePattern",
    "phase",
    "baseHead",
    "changedSetScope",
    "traceScope",
    "commitOwner",
    "sourceWorkOrder",
    "evidencePaths",
    "claimBoundary",
    "nextMoveImpact",
    "resumeCondition",
    "supersedes",
    "archivePolicy",
)

LANE_VALUES = {
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
}

ITEM_KIND_VALUES = {
    "intake",
    "dispatch",
    "worker_return",
    "review",
    "accepted_material",
    "session_sync",
    "parked",
    "decision",
    "repair",
    "blocked",
    "archive_ready",
}

OWNER_ROLE_VALUES = {
    "dispatcher",
    "worker",
    "reviewer",
    "closer",
    "session_sync_steward",
    "operator",
}

ROUTE_VALUES = {
    "SINGLE_AGENT_SINGLE_ROLE",
    "SINGLE_AGENT_MULTI_ROLE",
    "MULTI_AGENT_SINGLE_ROLE",
    "MULTI_AGENT_MULTI_ROLE",
}

PHASE_VALUES = {
    "dispatch_authoring",
    "execution",
    "review",
    "repair",
    "closure",
    "session_sync",
    "parked",
    "archive",
}

STATUS_VALUES = {
    "INTAKE_READY",
    "DISPATCH_READY",
    "IN_PROGRESS",
    "COMPLETE_PENDING_REVIEW",
    "REVIEW_REQUESTED",
    "ACCEPTED_PENDING_COMMIT",
    "CLOSED_PASS_BOUNDED",
    "PARKED_PENDING_OPERATOR_DECISION",
    "DEFERRED",
    "BLOCKED",
    "ARCHIVE_READY",
}


def render_json(value: Any, *, ascii_only: bool = False) -> str:
    return json.dumps(value, ensure_ascii=ascii_only, indent=2) + "\n"


def item_filename(workspace_item_id: str) -> str:
    slug = re.sub(r"[^a-zA-Z0-9_.-]+", "-", workspace_item_id.strip()).strip("-")
    if not slug:
        raise ValueError("workspaceItemId cannot produce an empty filename")
    return f"{slug}.json"


def load_json(path: Path) -> Any:
    return json.loads(path.read_text(encoding="utf-8"))


def _require_object(value: Any, path: Path, label: str) -> dict[str, Any]:
    if not isinstance(value, dict):
        raise ValueError(f"{path}: {label} must be a JSON object")
    return value


def _validate_core(core: dict[str, Any], path: Path) -> None:
    for field in REQUIRED_CORE_FIELDS:
        if field not in core:
            raise ValueError(f"{path}: workspace state core missing `{field}`")
    if core["status"] != "ACTIVE_AGENT_WORKSPACE_STATE":
        raise ValueError(f"{path}: status must be ACTIVE_AGENT_WORKSPACE_STATE")
    if core["items"] != []:
        raise ValueError(f"{path}: source core `items` must be an empty list")


def _validate_item(item: dict[str, Any], path: Path) -> None:
    for field in REQUIRED_ITEM_FIELDS:
        value = item.get(field)
        if value is None or value == "":
            raise ValueError(f"{path}: workspace item missing `{field}`")
    if item["itemKind"] not in ITEM_KIND_VALUES:
        raise ValueError(f"{path}: itemKind `{item['itemKind']}` is not canonical")
    if item["lane"] not in LANE_VALUES:
        raise ValueError(f"{path}: lane `{item['lane']}` is not canonical")
    if item["ownerRole"] not in OWNER_ROLE_VALUES:
        raise ValueError(f"{path}: ownerRole `{item['ownerRole']}` is not canonical")
    if item["route"] not in ROUTE_VALUES:
        raise ValueError(f"{path}: route `{item['route']}` is not canonical")
    if item["phase"] not in PHASE_VALUES:
        raise ValueError(f"{path}: phase `{item['phase']}` is not canonical")
    if item["status"] not in STATUS_VALUES:
        raise ValueError(f"{path}: status `{item['status']}` is not canonical")
    if not isinstance(item["evidencePaths"], list) or not item["evidencePaths"]:
        raise ValueError(f"{path}: evidencePaths must be a non-empty list")
    if not all(isinstance(item_path, str) and item_path for item_path in item["evidencePaths"]):
        raise ValueError(f"{path}: evidencePaths entries must be non-empty strings")
    if not isinstance(item["supersedes"], list):
        raise ValueError(f"{path}: supersedes must be a list")
    if not all(isinstance(item_id, str) and item_id for item_id in item["supersedes"]):
        raise ValueError(f"{path}: supersedes entries must be non-empty strings")


def load_source_items(items_dir: Path = ITEMS_DIR) -> list[dict[str, Any]]:
    if not items_dir.exists():
        raise FileNotFoundError(f"agent workspace items directory not found: {items_dir}")
    items: list[dict[str, Any]] = []
    seen_ids: set[str] = set()
    for path in sorted(items_dir.glob("*.json")):
        item = _require_object(load_json(path), path, "workspace item source")
        _validate_item(item, path)
        item_id = item["workspaceItemId"]
        if item_id in seen_ids:
            raise ValueError(f"{path}: duplicate workspaceItemId `{item_id}`")
        seen_ids.add(item_id)
        items.append(item)
    return items


def aggregate_item(item: dict[str, Any]) -> dict[str, Any]:
    return {key: value for key, value in item.items() if key not in SOURCE_ONLY_ITEM_FIELDS}


def load_source_state(
    core_path: Path = CORE_PATH,
    items_dir: Path = ITEMS_DIR,
) -> dict[str, Any]:
    if not core_path.exists():
        raise FileNotFoundError(f"agent workspace core source not found: {core_path}")
    core = _require_object(load_json(core_path), core_path, "workspace state core")
    _validate_core(core, core_path)
    ordered_items = sorted(
        load_source_items(items_dir),
        key=lambda item: (item.get("stateOrder", 10**9), item.get("workspaceItemId", "")),
    )
    state = dict(core)
    state["items"] = [aggregate_item(item) for item in ordered_items]
    return state


def generate_aggregate(
    state_path: Path = STATE_PATH,
    core_path: Path = CORE_PATH,
    items_dir: Path = ITEMS_DIR,
) -> None:
    state = load_source_state(core_path, items_dir)
    state_path.parent.mkdir(parents=True, exist_ok=True)
    state_path.write_text(render_json(state), encoding="utf-8")


def validate_aggregate_matches_sources(
    state_path: Path = STATE_PATH,
    core_path: Path = CORE_PATH,
    items_dir: Path = ITEMS_DIR,
) -> list[str]:
    if not core_path.exists() and not items_dir.exists() and not state_path.exists():
        return []
    try:
        generated = load_source_state(core_path, items_dir)
        current = load_json(state_path)
    except (OSError, json.JSONDecodeError, ValueError) as exc:
        return [f"agent workspace state source/aggregate load failed: {exc}"]
    if current != generated:
        return [
            "ACTIVE_AGENT_WORKSPACE_STATE.json drifted from generated sources; "
            "run `python governance/compat/generate_agent_workspace_state.py --generate` "
            "after editing CVF_SESSION/agent_workspace/state sources"
        ]
    return []


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Generate or validate ACTIVE_AGENT_WORKSPACE_STATE from split source files"
    )
    action = parser.add_mutually_exclusive_group(required=True)
    action.add_argument("--generate", action="store_true")
    action.add_argument("--check", action="store_true")
    args = parser.parse_args()

    if args.generate:
        generate_aggregate()
        print(f"Generated {STATE_PATH.relative_to(REPO_ROOT)}")
        return 0

    violations = validate_aggregate_matches_sources()
    if violations:
        print("Agent workspace state aggregate drift violations:")
        for violation in violations:
            print(f"  - {violation}")
        return 1
    print("ACTIVE_AGENT_WORKSPACE_STATE aggregate matches generated sources.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
