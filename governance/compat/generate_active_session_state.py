#!/usr/bin/env python3
"""Generate ACTIVE_SESSION_STATE from core source plus per-entry sources."""

from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path
from typing import Any


REPO_ROOT = Path(__file__).resolve().parents[2]
STATE_PATH = REPO_ROOT / "CVF_SESSION" / "ACTIVE_SESSION_STATE.json"
SOURCE_DIR = REPO_ROOT / "CVF_SESSION" / "state"
CORE_PATH = SOURCE_DIR / "ACTIVE_SESSION_STATE_CORE.json"
ENTRIES_DIR = SOURCE_DIR / "entries"
BOOTSTRAP_PATH = REPO_ROOT / "CVF_SESSION" / "ACTIVE_SESSION_BOOTSTRAP_READ_MODEL.json"
SOURCE_ONLY_ENTRY_FIELDS = {"stateOrder", "stateKey"}
CORE_KEY_COUNT = 49

BOOTSTRAP_FIELDS = (
    "schemaVersion",
    "currentMode",
    "activeHandoff",
    "nextAllowedMove",
    "activeStateRegistry",
    "activeSessionFrontDoor",
    "freezePosture",
    "activeReviewQueue",
)
BOOTSTRAP_CLAIM_BOUNDARY = (
    "Compact bootstrap read model for startup facts only. "
    "For complete canonical state, read activeStateRegistry."
)
CVF_ACTIVE_SESSION_BOOTSTRAP_READ_MODEL_MAX_BYTES = 4096


def entry_filename(state_key: str) -> str:
    slug = re.sub(r"[^a-zA-Z0-9_.-]+", "-", state_key.strip()).strip("-")
    if not slug:
        raise ValueError("state entry key cannot produce an empty filename")
    return f"{slug}.json"


def render_json(value: Any, *, ascii_only: bool = False) -> str:
    return json.dumps(value, ensure_ascii=ascii_only, indent=2) + "\n"


def source_entry(state_key: str, value: Any, order: int) -> dict[str, Any]:
    return {
        "stateOrder": order,
        "stateKey": state_key,
        "value": value,
    }


def aggregate_entry(entry: dict[str, Any]) -> tuple[str, Any]:
    state_key = entry.get("stateKey")
    if not isinstance(state_key, str) or not state_key:
        raise ValueError("active session state entry source missing non-empty stateKey")
    if "value" not in entry:
        raise ValueError(f"{state_key}: active session state entry source missing value")
    return state_key, entry["value"]


def build_state(core: dict[str, Any], entries: list[dict[str, Any]]) -> dict[str, Any]:
    state = dict(core)
    ordered_entries = sorted(
        entries,
        key=lambda item: (item.get("stateOrder", 10**9), item.get("stateKey", "")),
    )
    for entry in ordered_entries:
        state_key, value = aggregate_entry(entry)
        if state_key in state:
            raise ValueError(f"{state_key}: active session state key exists in core and entry sources")
        state[state_key] = value
    return state


def load_json(path: Path) -> Any:
    return json.loads(path.read_text(encoding="utf-8"))


def load_source_entries(entries_dir: Path = ENTRIES_DIR) -> list[dict[str, Any]]:
    if not entries_dir.exists():
        raise FileNotFoundError(f"active session entries directory not found: {entries_dir}")
    entries = []
    for path in sorted(entries_dir.glob("*.json")):
        entry = load_json(path)
        if not isinstance(entry, dict):
            raise ValueError(f"{path}: active session entry source must be a JSON object")
        entries.append(entry)
    return entries


def load_source_state(
    core_path: Path = CORE_PATH,
    entries_dir: Path = ENTRIES_DIR,
) -> dict[str, Any]:
    if not core_path.exists():
        raise FileNotFoundError(f"active session core source not found: {core_path}")
    core = load_json(core_path)
    if not isinstance(core, dict):
        raise ValueError(f"{core_path}: active session core source must be a JSON object")
    return build_state(core, load_source_entries(entries_dir))


def bootstrap_from_current(
    state_path: Path = STATE_PATH,
    core_path: Path = CORE_PATH,
    entries_dir: Path = ENTRIES_DIR,
    *,
    core_key_count: int = CORE_KEY_COUNT,
) -> None:
    state = load_json(state_path)
    if not isinstance(state, dict):
        raise ValueError(f"{state_path}: active session aggregate must be a JSON object")

    items = list(state.items())
    if core_key_count <= 0 or core_key_count > len(items):
        raise ValueError("core_key_count must split at least one key and leave no invalid range")

    core_path.parent.mkdir(parents=True, exist_ok=True)
    entries_dir.mkdir(parents=True, exist_ok=True)
    for stale in entries_dir.glob("*.json"):
        stale.unlink()

    core = dict(items[:core_key_count])
    core_path.write_text(render_json(core, ascii_only=True), encoding="utf-8")

    seen: set[str] = set()
    for order, (state_key, value) in enumerate(items[core_key_count:], start=core_key_count + 1):
        filename = entry_filename(state_key)
        if filename in seen:
            raise ValueError(f"duplicate active session entry source filename: {filename}")
        seen.add(filename)
        (entries_dir / filename).write_text(
            render_json(source_entry(state_key, value, order), ascii_only=True),
            encoding="utf-8",
        )


def generate_bootstrap_read_model(
    state_path: Path = STATE_PATH,
    bootstrap_path: Path = BOOTSTRAP_PATH,
) -> None:
    state = load_json(state_path)
    if not isinstance(state, dict):
        raise ValueError(f"{state_path}: active session aggregate must be a JSON object")
    model: dict[str, Any] = {}
    for field in BOOTSTRAP_FIELDS:
        if field in state:
            model[field] = state[field]
    model["claimBoundary"] = BOOTSTRAP_CLAIM_BOUNDARY
    bootstrap_path.parent.mkdir(parents=True, exist_ok=True)
    bootstrap_path.write_text(render_json(model), encoding="utf-8")


def validate_bootstrap_read_model_matches_sources(
    state_path: Path = STATE_PATH,
    bootstrap_path: Path = BOOTSTRAP_PATH,
) -> list[str]:
    if not bootstrap_path.exists():
        return [f"bootstrap read model is missing: {bootstrap_path.relative_to(REPO_ROOT).as_posix()}"]
    violations: list[str] = []
    try:
        state = load_json(state_path)
        bootstrap = load_json(bootstrap_path)
    except (OSError, json.JSONDecodeError, ValueError) as exc:
        return [f"bootstrap read model load failed: {exc}"]
    if not isinstance(state, dict) or not isinstance(bootstrap, dict):
        return ["bootstrap read model or aggregate is not a JSON object"]
    for field in BOOTSTRAP_FIELDS:
        if field in state and bootstrap.get(field) != state[field]:
            violations.append(
                f"bootstrap read model field `{field}` does not match aggregate; "
                "run `python governance/compat/generate_active_session_state.py --generate` "
                "to regenerate"
            )
    return violations


def generate_aggregate(
    state_path: Path = STATE_PATH,
    core_path: Path = CORE_PATH,
    entries_dir: Path = ENTRIES_DIR,
    bootstrap_path: Path = BOOTSTRAP_PATH,
) -> None:
    state = load_source_state(core_path, entries_dir)
    state_path.write_text(render_json(state), encoding="utf-8")
    generate_bootstrap_read_model(state_path, bootstrap_path)


def validate_aggregate_matches_sources(
    state_path: Path = STATE_PATH,
    core_path: Path = CORE_PATH,
    entries_dir: Path = ENTRIES_DIR,
) -> list[str]:
    if not core_path.exists() and not entries_dir.exists():
        return []
    try:
        generated = load_source_state(core_path, entries_dir)
        current = load_json(state_path)
    except (OSError, json.JSONDecodeError, ValueError) as exc:
        return [f"active session state source/aggregate load failed: {exc}"]
    if current != generated:
        return [
            "ACTIVE_SESSION_STATE.json drifted from generated sources; "
            "run `python governance/compat/generate_active_session_state.py --generate` "
            "after editing CVF_SESSION/state sources"
        ]
    return []


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Generate or validate ACTIVE_SESSION_STATE from split source files"
    )
    action = parser.add_mutually_exclusive_group(required=True)
    action.add_argument("--bootstrap-from-current", action="store_true")
    action.add_argument("--generate", action="store_true")
    action.add_argument("--check", action="store_true")
    args = parser.parse_args()

    if args.bootstrap_from_current:
        bootstrap_from_current()
        print(f"Bootstrapped active session state sources under {SOURCE_DIR.relative_to(REPO_ROOT)}")
        return 0
    if args.generate:
        generate_aggregate()
        print(f"Generated {STATE_PATH.relative_to(REPO_ROOT)}")
        return 0

    violations = validate_aggregate_matches_sources()
    violations.extend(validate_bootstrap_read_model_matches_sources())
    if violations:
        print("Active session state drift violations:")
        for violation in violations:
            print(f"  - {violation}")
        return 1
    print("ACTIVE_SESSION_STATE aggregate and bootstrap read model match generated sources.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
