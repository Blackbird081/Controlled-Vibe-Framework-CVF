#!/usr/bin/env python3
"""
CVF As-Built System Catalog Generator

Deterministically assembles the compact per-entity JSON source files under
docs/reference/system_architecture_catalog/entries/ into the generated
aggregate docs/reference/system_architecture_catalog/CVF_AS_BUILT_SYSTEM_CATALOG_AGGREGATE.json,
and the compact GAP entries under docs/reference/system_chain/gaps/entries/
into docs/reference/system_chain/gaps/CVF_SYSTEM_CHAIN_GAP_INDEX.json.

Determinism contract (ASC-T0 Decision 1): UTF-8, LF line endings, no trailing
whitespace per line, single trailing newline, entries sorted by stableId
regardless of source-file creation order, sha256 recomputed over the
normalized form. Source-only metadata (on-disk filename, creation order) is
stripped from generated output.

This generator is read-plus-write only for its two owned generated output
paths. It does not modify any compact source entry, any R91-owned path, or
any other governed artifact.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import sys
from pathlib import Path
from typing import Any

REPO_ROOT = Path(__file__).resolve().parents[2]

CATALOG_ENTRIES_DIR = REPO_ROOT / "docs/reference/system_architecture_catalog/entries"
CATALOG_AGGREGATE_PATH = (
    REPO_ROOT / "docs/reference/system_architecture_catalog/CVF_AS_BUILT_SYSTEM_CATALOG_AGGREGATE.json"
)
CATALOG_SCHEMA_VERSION = "cvf.as_built_system_catalog.schema.v0"

GAP_ENTRIES_DIR = REPO_ROOT / "docs/reference/system_chain/gaps/entries"
GAP_INDEX_PATH = REPO_ROOT / "docs/reference/system_chain/gaps/CVF_SYSTEM_CHAIN_GAP_INDEX.json"
GAP_INDEX_SCHEMA_VERSION = "cvf.system_chain_gap_index.v1"


def _normalize_text(text: str) -> str:
    """Apply the ASC-T0 determinism contract: LF endings, no trailing
    whitespace per line, single trailing newline."""
    lines = text.replace("\r\n", "\n").replace("\r", "\n").split("\n")
    stripped = [line.rstrip() for line in lines]
    while stripped and stripped[-1] == "":
        stripped.pop()
    return "\n".join(stripped) + "\n"


def _read_entries(entries_dir: Path) -> list[dict[str, Any]]:
    entities: list[dict[str, Any]] = []
    if not entries_dir.is_dir():
        return entities
    for path in sorted(entries_dir.glob("*.json")):
        text = path.read_text(encoding="utf-8")
        entity = json.loads(text)
        entities.append(entity)
    return entities


def _sort_key(entity: dict[str, Any]) -> str:
    return str(entity.get("stableId", ""))


def _write_deterministic_json(path: Path, payload: dict[str, Any]) -> str:
    raw = json.dumps(payload, indent=2, ensure_ascii=False, sort_keys=False)
    normalized = _normalize_text(raw)
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_bytes(normalized.encode("utf-8"))
    return hashlib.sha256(normalized.encode("utf-8")).hexdigest()


def build_catalog_aggregate() -> tuple[dict[str, Any], str]:
    entities = sorted(_read_entries(CATALOG_ENTRIES_DIR), key=_sort_key)
    payload = {
        "schemaVersion": CATALOG_SCHEMA_VERSION,
        "generatedBy": "governance/compat/generate_as_built_system_catalog.py",
        "sourceDir": "docs/reference/system_architecture_catalog/entries/",
        "entityCount": len(entities),
        "entities": entities,
    }
    sha256 = _write_deterministic_json(CATALOG_AGGREGATE_PATH, payload)
    return payload, sha256


def build_gap_index() -> tuple[dict[str, Any], str]:
    gaps = sorted(_read_entries(GAP_ENTRIES_DIR), key=_sort_key)
    counts_by_status: dict[str, int] = {}
    for gap in gaps:
        status = str(gap.get("currentStatus", "UNKNOWN"))
        counts_by_status[status] = counts_by_status.get(status, 0) + 1
    payload = {
        "schemaVersion": GAP_INDEX_SCHEMA_VERSION,
        "generatedBy": "governance/compat/generate_as_built_system_catalog.py",
        "sourceDir": "docs/reference/system_chain/gaps/entries/",
        "gapCount": len(gaps),
        "countsByStatus": counts_by_status,
        "gaps": gaps,
    }
    sha256 = _write_deterministic_json(GAP_INDEX_PATH, payload)
    return payload, sha256


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--target",
        choices=("catalog", "gaps", "all"),
        default="all",
        help="Which generated output to (re)build.",
    )
    parser.add_argument("--json", action="store_true", help="Print a JSON summary report.")
    args = parser.parse_args(argv)

    report: dict[str, Any] = {"generator": "governance/compat/generate_as_built_system_catalog.py"}

    if args.target in ("catalog", "all"):
        payload, sha256 = build_catalog_aggregate()
        report["catalog"] = {
            "path": str(CATALOG_AGGREGATE_PATH.relative_to(REPO_ROOT)).replace("\\", "/"),
            "entityCount": payload["entityCount"],
            "sha256": sha256,
        }

    if args.target in ("gaps", "all"):
        payload, sha256 = build_gap_index()
        report["gaps"] = {
            "path": str(GAP_INDEX_PATH.relative_to(REPO_ROOT)).replace("\\", "/"),
            "gapCount": payload["gapCount"],
            "sha256": sha256,
        }

    if args.json:
        print(json.dumps(report, indent=2))
    else:
        print("=== CVF As-Built System Catalog Generator ===")
        if "catalog" in report:
            print(
                f"Catalog aggregate: {report['catalog']['path']} "
                f"({report['catalog']['entityCount']} entities, sha256={report['catalog']['sha256'][:12]}...)"
            )
        if "gaps" in report:
            print(
                f"Gap index: {report['gaps']['path']} "
                f"({report['gaps']['gapCount']} gaps, sha256={report['gaps']['sha256'][:12]}...)"
            )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
