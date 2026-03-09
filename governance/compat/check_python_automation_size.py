#!/usr/bin/env python3
"""
Validate governed Python automation file size against the active CVF thresholds.
"""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path
from typing import Any


REPO_ROOT = Path(__file__).resolve().parents[2]
DEFAULT_REGISTRY = REPO_ROOT / "governance" / "compat" / "CVF_PYTHON_AUTOMATION_SIZE_EXCEPTION_REGISTRY.json"
SCOPES = ("scripts", "governance/compat")


def _rel(path: Path) -> str:
    return str(path.relative_to(REPO_ROOT)).replace("\\", "/")


def _read_json(path: Path) -> dict[str, Any]:
    return json.loads(path.read_text(encoding="utf-8"))


def _count_lines(path: Path) -> int:
    with path.open("r", encoding="utf-8", errors="replace") as handle:
        return sum(1 for _ in handle)


def _iter_governed_python_files() -> list[Path]:
    files: list[Path] = []
    for scope in SCOPES:
        files.extend(path for path in (REPO_ROOT / scope).rglob("*.py") if "__pycache__" not in path.parts)
    return sorted(set(files))


def build_report(registry_path: Path) -> dict[str, Any]:
    violations: list[dict[str, Any]] = []
    advisories: list[dict[str, Any]] = []

    if not registry_path.exists():
        return {
            "registryPath": _rel(registry_path),
            "violationCount": 1,
            "advisoryCount": 0,
            "violations": [
                {
                    "type": "registry_missing",
                    "path": _rel(registry_path),
                    "message": "Python automation size exception registry is missing.",
                }
            ],
            "advisories": [],
            "compliant": False,
        }

    registry = _read_json(registry_path)
    soft_threshold = int(registry.get("softThresholdLines", 600))
    hard_threshold = int(registry.get("hardThresholdLines", 1200))
    exception_map = {
        entry["path"]: entry
        for entry in registry.get("exceptions", [])
        if isinstance(entry, dict) and entry.get("path")
    }

    files_report: list[dict[str, Any]] = []

    for path in _iter_governed_python_files():
        rel_path = _rel(path)
        lines = _count_lines(path)
        exception = exception_map.get(rel_path)
        status = "ok"

        if exception:
            missing_fields = [
                field
                for field in ("approvedMaxLines", "status", "rationale", "requiredFollowup")
                if not exception.get(field)
            ]
            if missing_fields:
                violations.append(
                    {
                        "type": "exception_entry_incomplete",
                        "path": rel_path,
                        "message": f"Exception entry is missing required fields: {', '.join(missing_fields)}.",
                    }
                )
            approved_max = int(exception.get("approvedMaxLines", 0) or 0)
            if lines > approved_max:
                violations.append(
                    {
                        "type": "exception_approved_max_exceeded",
                        "path": rel_path,
                        "message": f"File has {lines} lines, exceeding approved exception maximum {approved_max}.",
                    }
                )
                status = "violation"
            else:
                status = "exception"
        else:
            if lines > hard_threshold:
                violations.append(
                    {
                        "type": "hard_threshold_exceeded_without_exception",
                        "path": rel_path,
                        "message": f"File has {lines} lines, exceeding hard threshold {hard_threshold} without an approved exception.",
                    }
                )
                status = "violation"
            elif lines > soft_threshold:
                violations.append(
                    {
                        "type": "soft_threshold_exceeded_without_exception",
                        "path": rel_path,
                        "message": f"File has {lines} lines, exceeding soft threshold {soft_threshold} without an approved exception.",
                    }
                )
                status = "violation"

        if status == "ok" and lines > max(soft_threshold - 100, 1):
            advisories.append(
                {
                    "type": "approaching_soft_threshold",
                    "path": rel_path,
                    "message": f"File has {lines} lines and is approaching soft threshold {soft_threshold}.",
                }
            )

        files_report.append(
            {
                "path": rel_path,
                "lines": lines,
                "status": status,
            }
        )

    return {
        "registryPath": _rel(registry_path),
        "softThresholdLines": soft_threshold,
        "hardThresholdLines": hard_threshold,
        "fileCount": len(files_report),
        "violationCount": len(violations),
        "advisoryCount": len(advisories),
        "files": files_report,
        "violations": violations,
        "advisories": advisories,
        "compliant": len(violations) == 0,
    }


def _print_report(report: dict[str, Any]) -> None:
    print("=== CVF Python Automation Size Guard ===")
    print(f"Registry: {report['registryPath']}")
    print(f"Governed files: {report.get('fileCount', 0)}")
    print(f"Soft threshold: {report.get('softThresholdLines', 'n/a')}")
    print(f"Hard threshold: {report.get('hardThresholdLines', 'n/a')}")
    print(f"Violations: {report['violationCount']}")
    print(f"Advisories: {report['advisoryCount']}")
    print("")
    print("Top governed files by line count:")
    for item in sorted(report.get("files", []), key=lambda row: row["lines"], reverse=True)[:10]:
        print(f"  - {item['path']}: {item['lines']} lines [{item['status']}]")

    if report["violations"]:
        print("\nViolations:")
        for violation in report["violations"]:
            print(f"  - {violation['path']} ({violation['type']}): {violation['message']}")
        print("\nFAIL - Governed Python automation violates the active size policy.")
        return

    if report["advisories"]:
        print("\nAdvisories:")
        for advisory in report["advisories"]:
            print(f"  - {advisory['path']} ({advisory['type']}): {advisory['message']}")

    print("\nCOMPLIANT — Governed Python automation is within the active size policy.")


def main() -> int:
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(errors="replace")
    if hasattr(sys.stderr, "reconfigure"):
        sys.stderr.reconfigure(errors="replace")

    parser = argparse.ArgumentParser(description="CVF governed Python automation size guard")
    parser.add_argument("--registry", default=str(DEFAULT_REGISTRY), help="Exception registry path")
    parser.add_argument("--json", action="store_true", help="Print JSON report")
    parser.add_argument("--enforce", action="store_true", help="Return non-zero when violations exist")
    args = parser.parse_args()

    registry_path = (REPO_ROOT / args.registry).resolve() if not Path(args.registry).is_absolute() else Path(args.registry)
    report = build_report(registry_path)

    if args.json:
        print(json.dumps(report, indent=2))
    else:
        _print_report(report)

    if args.enforce and not report["compliant"]:
        return 2
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
