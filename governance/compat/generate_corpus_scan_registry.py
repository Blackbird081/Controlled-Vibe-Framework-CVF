#!/usr/bin/env python3
"""Generate GC-051 corpus scan registry aggregates from per-entry sources."""

from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path
from typing import Any


REPO_ROOT = Path(__file__).resolve().parents[2]
REGISTRY_PATH = REPO_ROOT / "docs" / "corpus-intelligence" / "CVF_CORPUS_SCAN_REGISTRY.json"
SOURCE_DIR = REPO_ROOT / "docs" / "corpus-intelligence" / "registry"
HEADER_PATH = SOURCE_DIR / "CVF_CORPUS_SCAN_REGISTRY_HEADER.json"
ENTRIES_DIR = SOURCE_DIR / "entries"
SOURCE_ONLY_ENTRY_FIELDS = {"registryOrder"}


def entry_filename(entry_id: str) -> str:
    slug = re.sub(r"[^a-zA-Z0-9_.-]+", "-", entry_id.strip()).strip("-")
    if not slug:
        raise ValueError("registry entry id cannot produce an empty filename")
    return f"{slug}.json"


def render_json(value: Any, *, ascii_only: bool = False) -> str:
    return json.dumps(value, ensure_ascii=ascii_only, indent=2) + "\n"


def aggregate_header(registry: dict[str, Any]) -> dict[str, Any]:
    return {key: value for key, value in registry.items() if key != "corpora"}


def source_entry(entry: dict[str, Any], order: int) -> dict[str, Any]:
    sourced = {"registryOrder": order}
    sourced.update(entry)
    return sourced


def aggregate_entry(entry: dict[str, Any]) -> dict[str, Any]:
    return {
        key: value
        for key, value in entry.items()
        if key not in SOURCE_ONLY_ENTRY_FIELDS
    }


def build_registry(header: dict[str, Any], entries: list[dict[str, Any]]) -> dict[str, Any]:
    ordered_entries = sorted(
        entries,
        key=lambda item: (item.get("registryOrder", 10**9), item.get("id", "")),
    )
    registry = dict(header)
    registry["corpora"] = [aggregate_entry(entry) for entry in ordered_entries]
    return registry


def load_json(path: Path) -> Any:
    return json.loads(path.read_text(encoding="utf-8"))


def load_source_entries(entries_dir: Path = ENTRIES_DIR) -> list[dict[str, Any]]:
    if not entries_dir.exists():
        raise FileNotFoundError(f"registry entries directory not found: {entries_dir}")
    entries = []
    for path in sorted(entries_dir.glob("*.json")):
        entry = load_json(path)
        if not isinstance(entry, dict):
            raise ValueError(f"{path}: registry entry source must be a JSON object")
        entries.append(entry)
    return entries


def load_source_registry(
    header_path: Path = HEADER_PATH,
    entries_dir: Path = ENTRIES_DIR,
) -> dict[str, Any]:
    if not header_path.exists():
        raise FileNotFoundError(f"registry header source not found: {header_path}")
    header = load_json(header_path)
    if not isinstance(header, dict):
        raise ValueError(f"{header_path}: registry header source must be a JSON object")
    return build_registry(header, load_source_entries(entries_dir))


def bootstrap_from_current(
    registry_path: Path = REGISTRY_PATH,
    header_path: Path = HEADER_PATH,
    entries_dir: Path = ENTRIES_DIR,
) -> None:
    registry = load_json(registry_path)
    if not isinstance(registry, dict):
        raise ValueError(f"{registry_path}: registry aggregate must be a JSON object")
    corpora = registry.get("corpora")
    if not isinstance(corpora, list):
        raise ValueError(f"{registry_path}: registry aggregate `corpora` must be a list")

    header_path.parent.mkdir(parents=True, exist_ok=True)
    entries_dir.mkdir(parents=True, exist_ok=True)
    header_path.write_text(
        render_json(aggregate_header(registry), ascii_only=True),
        encoding="utf-8",
    )

    seen: set[str] = set()
    for index, entry in enumerate(corpora, start=1):
        if not isinstance(entry, dict):
            raise ValueError(f"{registry_path}: corpora[{index - 1}] must be a JSON object")
        entry_id = str(entry.get("id", "")).strip()
        if not entry_id:
            raise ValueError(f"{registry_path}: corpora[{index - 1}] missing id")
        filename = entry_filename(entry_id)
        if filename in seen:
            raise ValueError(f"duplicate registry entry source filename: {filename}")
        seen.add(filename)
        target = entries_dir / filename
        target.write_text(
            render_json(source_entry(entry, index), ascii_only=True),
            encoding="utf-8",
        )


def generate_aggregate(
    registry_path: Path = REGISTRY_PATH,
    header_path: Path = HEADER_PATH,
    entries_dir: Path = ENTRIES_DIR,
) -> None:
    registry = load_source_registry(header_path, entries_dir)
    registry_path.write_text(render_json(registry), encoding="utf-8")


def validate_aggregate_matches_sources(
    registry_path: Path = REGISTRY_PATH,
    header_path: Path = HEADER_PATH,
    entries_dir: Path = ENTRIES_DIR,
) -> list[str]:
    if not header_path.exists() and not entries_dir.exists():
        return []
    violations: list[str] = []
    try:
        generated = load_source_registry(header_path, entries_dir)
        current = load_json(registry_path)
    except (OSError, json.JSONDecodeError, ValueError) as exc:
        return [f"registry source/aggregate load failed: {exc}"]
    if current != generated:
        violations.append(
            "CVF_CORPUS_SCAN_REGISTRY.json drifted from per-entry sources; "
            "run `python governance/compat/generate_corpus_scan_registry.py --generate` "
            "after editing docs/corpus-intelligence/registry/ entries/header"
        )
    return violations


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Generate or validate the GC-051 corpus scan registry aggregate"
    )
    action = parser.add_mutually_exclusive_group(required=True)
    action.add_argument("--bootstrap-from-current", action="store_true")
    action.add_argument("--generate", action="store_true")
    action.add_argument("--check", action="store_true")
    args = parser.parse_args()

    if args.bootstrap_from_current:
        bootstrap_from_current()
        print(f"Bootstrapped registry source entries under {SOURCE_DIR.relative_to(REPO_ROOT)}")
        return 0
    if args.generate:
        generate_aggregate()
        print(f"Generated {REGISTRY_PATH.relative_to(REPO_ROOT)}")
        return 0

    violations = validate_aggregate_matches_sources()
    if violations:
        print("GC-051 registry aggregate drift violations:")
        for violation in violations:
            print(f"  - {violation}")
        return 1
    print("GC-051 registry aggregate matches per-entry sources.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
