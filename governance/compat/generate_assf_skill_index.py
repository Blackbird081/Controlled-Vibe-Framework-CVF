#!/usr/bin/env python3
"""Generate the CVF ASSF skill index aggregate from per-skill registry sources.

ASSF-T2: reads every *.json entry under
``docs/reference/agent_system_skills/registry/entries/``, strips
source-only fields (``registryOrder``), sorts by ``registryOrder`` then
``skillId`` for a deterministic output, and writes
``docs/reference/agent_system_skills/generated/skill-index.json``.

This module never mutates any file outside the generated index, never
calls a provider or model, and never executes a prompt.
"""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path
from typing import Any

REPO_ROOT = Path(__file__).resolve().parents[2]

ENTRIES_DIR = (
    REPO_ROOT
    / "docs"
    / "reference"
    / "agent_system_skills"
    / "registry"
    / "entries"
)
INDEX_PATH = (
    REPO_ROOT
    / "docs"
    / "reference"
    / "agent_system_skills"
    / "generated"
    / "skill-index.json"
)

SOURCE_ONLY_FIELDS: frozenset[str] = frozenset({"registryOrder"})

_INDEX_HEADER: dict[str, Any] = {
    "claimBoundary": (
        "This index is metadata-only. It is not evidence of runtime activation, "
        "CLI/MCP adapter implementation, provider availability, or external-agent "
        "authorization. Loading this index never grants authority to commit, activate, "
        "execute a package instruction body, or expand external-agent scope."
    ),
    "generatedBy": "governance/compat/generate_assf_skill_index.py",
    "indexId": "cvf-assf-skill-index",
    "schemaVersion": "assf-t2-v1",
}


def render_json(value: Any) -> str:
    """Render value as deterministic, byte-stable JSON with trailing newline."""
    return json.dumps(value, ensure_ascii=False, indent=2, sort_keys=True) + "\n"


def aggregate_entry(entry: dict[str, Any]) -> dict[str, Any]:
    """Return a copy of entry with source-only fields removed."""
    return {k: v for k, v in entry.items() if k not in SOURCE_ONLY_FIELDS}


def load_json(path: Path) -> Any:
    return json.loads(path.read_text(encoding="utf-8"))


def load_source_entries(entries_dir: Path = ENTRIES_DIR) -> list[dict[str, Any]]:
    """Read all *.json skill source entries from entries_dir. No filesystem write."""
    if not entries_dir.exists():
        raise FileNotFoundError(
            f"registry entries directory not found: {entries_dir}"
        )
    entries: list[dict[str, Any]] = []
    for path in sorted(entries_dir.glob("*.json")):
        entry = load_json(path)
        if not isinstance(entry, dict):
            raise ValueError(f"{path}: skill entry must be a JSON object")
        entries.append(entry)
    return entries


def build_index(entries: list[dict[str, Any]]) -> dict[str, Any]:
    """Assemble the deterministic aggregate index dict from source entries."""
    ordered = sorted(
        entries,
        key=lambda e: (e.get("registryOrder", 10**9), str(e.get("skillId", ""))),
    )
    index: dict[str, Any] = dict(_INDEX_HEADER)
    index["skills"] = [aggregate_entry(e) for e in ordered]
    return index


def generate_index(
    index_path: Path = INDEX_PATH,
    entries_dir: Path = ENTRIES_DIR,
) -> None:
    """Load source entries and write the generated skill index. Writes index only."""
    entries = load_source_entries(entries_dir)
    index = build_index(entries)
    index_path.parent.mkdir(parents=True, exist_ok=True)
    index_path.write_text(render_json(index), encoding="utf-8")


def validate_index_matches_sources(
    index_path: Path = INDEX_PATH,
    entries_dir: Path = ENTRIES_DIR,
) -> list[str]:
    """Return a list of drift violation strings; empty list means in-sync."""
    if not entries_dir.exists():
        return []
    try:
        entries = load_source_entries(entries_dir)
        expected = build_index(entries)
    except (OSError, json.JSONDecodeError, ValueError) as exc:
        return [f"skill registry source load failed: {exc}"]
    if not index_path.exists():
        try:
            rel = index_path.relative_to(REPO_ROOT).as_posix()
        except ValueError:
            rel = str(index_path)
        return [
            f"generated skill index not found at {rel}; "
            "run `python governance/compat/generate_assf_skill_index.py --generate`"
        ]
    try:
        current = load_json(index_path)
    except (OSError, json.JSONDecodeError) as exc:
        return [f"generated skill index load failed: {exc}"]
    if current != expected:
        return [
            "docs/reference/agent_system_skills/generated/skill-index.json "
            "drifted from per-entry sources; "
            "run `python governance/compat/generate_assf_skill_index.py --generate` "
            "after editing docs/reference/agent_system_skills/registry/entries/"
        ]
    return []


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Generate or validate the CVF ASSF skill index aggregate"
    )
    action = parser.add_mutually_exclusive_group(required=True)
    action.add_argument(
        "--generate",
        action="store_true",
        help="Generate skill-index.json from registry entry sources",
    )
    action.add_argument(
        "--check",
        action="store_true",
        help="Validate that skill-index.json matches registry entry sources",
    )
    args = parser.parse_args()

    if args.generate:
        generate_index()
        print(f"Generated {INDEX_PATH.relative_to(REPO_ROOT).as_posix()}")
        return 0

    violations = validate_index_matches_sources()
    if violations:
        print("ASSF skill index drift violations:")
        for v in violations:
            print(f"  - {v}")
        return 1
    print("ASSF skill index matches per-entry sources.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
