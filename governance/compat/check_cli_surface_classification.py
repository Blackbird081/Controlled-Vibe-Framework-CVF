#!/usr/bin/env python3
"""Validate centralized CLI surface classification for governance helpers."""

from __future__ import annotations

import argparse
import datetime as dt
import json
from pathlib import Path
from typing import Any


REPO_ROOT = Path(__file__).resolve().parents[2]
REGISTRY_PATH = REPO_ROOT / "governance" / "compat" / "CVF_CLI_SURFACE_CLASSIFICATION_REGISTRY.json"

ALLOWED_CLASSIFICATIONS = {"CLI_REQUIRED", "CLI_OPTIONAL", "MODULE_ONLY"}
REQUIRED_ENTRY_FIELDS = {
    "path",
    "classification",
    "status",
    "ownerSurface",
    "reason",
    "evidence",
}


def _rel(path: Path) -> str:
    try:
        return path.relative_to(REPO_ROOT).as_posix()
    except ValueError:
        return path.as_posix()


def _read_json(path: Path) -> dict[str, Any]:
    return json.loads(path.read_text(encoding="utf-8"))


def _has_cli_entrypoint(text: str) -> bool:
    return "def main(" in text and "__main__" in text


def _add(violations: list[dict[str, str]], path: str, issue_type: str, message: str) -> None:
    violations.append({"path": path, "type": issue_type, "message": message})


def build_report(
    *,
    registry_path: Path = REGISTRY_PATH,
    repo_root: Path = REPO_ROOT,
) -> dict[str, Any]:
    violations: list[dict[str, str]] = []

    if not registry_path.exists():
        return {
            "timestamp": _timestamp(),
            "registryPath": _rel(registry_path) if registry_path.is_absolute() else registry_path.as_posix(),
            "checkedEntries": 0,
            "violationCount": 1,
            "violations": [
                {
                    "path": registry_path.as_posix(),
                    "type": "registry_missing",
                    "message": "CLI surface classification registry is missing.",
                }
            ],
            "compliant": False,
        }

    registry = _read_json(registry_path)
    entries = registry.get("entries", [])
    if not isinstance(entries, list):
        _add(violations, registry_path.as_posix(), "entries_not_list", "`entries` must be a list")
        entries = []

    seen_paths: set[str] = set()
    for index, entry in enumerate(entries, start=1):
        if not isinstance(entry, dict):
            _add(violations, registry_path.as_posix(), "entry_not_object", f"entry {index} must be an object")
            continue

        missing = sorted(field for field in REQUIRED_ENTRY_FIELDS if field not in entry)
        entry_path = str(entry.get("path", f"<entry:{index}>"))
        if missing:
            _add(
                violations,
                entry_path,
                "required_field_missing",
                "missing required field(s): " + ", ".join(missing),
            )
            continue

        normalized_path = entry_path.replace("\\", "/")
        if normalized_path in seen_paths:
            _add(violations, normalized_path, "duplicate_entry", "path is classified more than once")
        seen_paths.add(normalized_path)

        classification = entry.get("classification")
        if classification not in ALLOWED_CLASSIFICATIONS:
            _add(
                violations,
                normalized_path,
                "invalid_classification",
                f"classification `{classification}` is not allowed",
            )
            continue

        if not entry.get("reason") or not str(entry.get("reason")).strip():
            _add(violations, normalized_path, "reason_missing", "classification reason must be non-empty")
        evidence = entry.get("evidence")
        if not isinstance(evidence, list) or not evidence:
            _add(violations, normalized_path, "evidence_missing", "evidence must be a non-empty list")

        source_path = repo_root / normalized_path
        if not source_path.exists() or source_path.is_dir():
            _add(violations, normalized_path, "classified_path_missing", "classified source file is missing")
            continue

        text = source_path.read_text(encoding="utf-8", errors="replace")
        has_cli = _has_cli_entrypoint(text)
        if classification == "CLI_REQUIRED" and not has_cli:
            _add(
                violations,
                normalized_path,
                "cli_required_without_entrypoint",
                "CLI_REQUIRED files must define main() and a __main__ entrypoint",
            )
        if classification == "MODULE_ONLY" and has_cli:
            _add(
                violations,
                normalized_path,
                "module_only_has_entrypoint",
                "MODULE_ONLY files must remain import-only and use their parent CLI surface",
            )

    return {
        "timestamp": _timestamp(),
        "registryPath": _rel(registry_path) if registry_path.is_absolute() else registry_path.as_posix(),
        "checkedEntries": len(entries),
        "violationCount": len(violations),
        "violations": violations,
        "compliant": not violations,
    }


def _timestamp() -> str:
    return dt.datetime.now(dt.timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")


def _print_report(report: dict[str, Any]) -> None:
    print("=== CVF CLI Surface Classification Gate ===")
    print(f"Registry: {report['registryPath']}")
    print(f"Checked entries: {report['checkedEntries']}")
    print(f"Violations: {report['violationCount']}")
    if report["violations"]:
        print()
        for violation in report["violations"]:
            print(f"- {violation['path']}: {violation['type']} - {violation['message']}")
    else:
        print()
        print("COMPLIANT - CLI surface classifications are aligned.")


def main() -> int:
    parser = argparse.ArgumentParser(description="Check CLI surface classification registry")
    parser.add_argument("--registry-path", default=str(REGISTRY_PATH), help="Registry JSON path")
    parser.add_argument("--enforce", action="store_true", help="Return non-zero when violations exist")
    parser.add_argument("--json", action="store_true", help="Print JSON report")
    args = parser.parse_args()

    report = build_report(registry_path=Path(args.registry_path))
    if args.json:
        print(json.dumps(report, indent=2, ensure_ascii=False))
    else:
        _print_report(report)
    if args.enforce and not report["compliant"]:
        return 2
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
