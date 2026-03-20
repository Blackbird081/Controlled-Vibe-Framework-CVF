#!/usr/bin/env python3
"""
CVF Release Manifest Consistency Gate

Ensures the Phase 5 release/reference docs stay internally consistent:
- required canonical docs exist
- manifest evidence anchors resolve to real paths
- inventory path anchors resolve to real paths
- maturity matrix mentions every manifest version token
- key entrypoints reference the canonical manifest trio

Usage:
  python governance/compat/check_release_manifest_consistency.py
  python governance/compat/check_release_manifest_consistency.py --enforce
  python governance/compat/check_release_manifest_consistency.py --json
"""

from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path
from typing import Any


REPO_ROOT = Path(__file__).resolve().parents[2]
MANIFEST_PATH = REPO_ROOT / "docs" / "reference" / "CVF_RELEASE_MANIFEST.md"
INVENTORY_PATH = REPO_ROOT / "docs" / "reference" / "CVF_MODULE_INVENTORY.md"
MATURITY_PATH = REPO_ROOT / "docs" / "reference" / "CVF_MATURITY_MATRIX.md"
VERSIONING_PATH = REPO_ROOT / "docs" / "VERSIONING.md"
DOCS_INDEX_PATH = REPO_ROOT / "docs" / "INDEX.md"
REFERENCE_README_PATH = REPO_ROOT / "docs" / "reference" / "README.md"
ROOT_README_PATH = REPO_ROOT / "README.md"
ADR_PATH = REPO_ROOT / "docs" / "CVF_ARCHITECTURE_DECISIONS.md"

REQUIRED_FILES = [
    MANIFEST_PATH,
    INVENTORY_PATH,
    MATURITY_PATH,
    VERSIONING_PATH,
    DOCS_INDEX_PATH,
    REFERENCE_README_PATH,
    ROOT_README_PATH,
    ADR_PATH,
]

MANIFEST_REFERENCES = [
    "docs/reference/CVF_RELEASE_MANIFEST.md",
    "docs/reference/CVF_MODULE_INVENTORY.md",
    "docs/reference/CVF_MATURITY_MATRIX.md",
]


def _read(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def _extract_table_rows(text: str, heading: str) -> list[list[str]]:
    lines = text.splitlines()
    inside = False
    table_lines: list[str] = []

    for line in lines:
        if line.strip() == heading:
            inside = True
            continue
        if inside:
            if line.startswith("#") and table_lines:
                break
            if line.strip().startswith("|"):
                table_lines.append(line)
            elif table_lines and not line.strip():
                break

    if len(table_lines) < 3:
        return []

    rows: list[list[str]] = []
    for line in table_lines[2:]:
        cells = [cell.strip() for cell in line.strip().strip("|").split("|")]
        rows.append(cells)
    return rows


def _extract_backtick_paths(value: str) -> list[str]:
    return re.findall(r"`([^`]+)`", value)


def _normalize_rel(path: Path) -> str:
    return str(path.relative_to(REPO_ROOT)).replace("\\", "/")


def _collect_manifest_versions(rows: list[list[str]]) -> list[str]:
    versions: list[str] = []
    for row in rows:
        if not row:
            continue
        versions.append(row[0])
    return versions


def _validate_required_files() -> list[dict[str, str]]:
    violations: list[dict[str, str]] = []
    for path in REQUIRED_FILES:
        if not path.exists():
            violations.append(
                {
                    "type": "required_file_missing",
                    "path": _normalize_rel(path),
                    "message": "Required Phase 5 canonical file is missing.",
                }
            )
    return violations


def _validate_entrypoint_references() -> list[dict[str, str]]:
    violations: list[dict[str, str]] = []
    checks = {
        VERSIONING_PATH: MANIFEST_REFERENCES,
        DOCS_INDEX_PATH: [
            "reference/CVF_RELEASE_MANIFEST.md",
            "reference/CVF_MODULE_INVENTORY.md",
            "reference/CVF_MATURITY_MATRIX.md",
        ],
        REFERENCE_README_PATH: [
            "CVF_RELEASE_MANIFEST.md",
            "CVF_MODULE_INVENTORY.md",
            "CVF_MATURITY_MATRIX.md",
        ],
        ROOT_README_PATH: [
            "docs/reference/CVF_RELEASE_MANIFEST.md",
            "docs/reference/CVF_MODULE_INVENTORY.md",
            "docs/VERSIONING.md",
        ],
        ADR_PATH: [
            "ADR-017",
            "docs/reference/CVF_RELEASE_MANIFEST.md",
            "docs/reference/CVF_MODULE_INVENTORY.md",
            "docs/reference/CVF_MATURITY_MATRIX.md",
        ],
    }

    for path, required_strings in checks.items():
        if not path.exists():
            continue
        content = _read(path)
        for required in required_strings:
            if required not in content:
                violations.append(
                    {
                        "type": "entrypoint_reference_missing",
                        "path": _normalize_rel(path),
                        "message": f"Missing required reference `{required}`.",
                    }
                )
    return violations


def _validate_path_cells(rows: list[list[str]], source: Path, cell_indexes: list[int]) -> list[dict[str, str]]:
    violations: list[dict[str, str]] = []
    for row in rows:
        for index in cell_indexes:
            if index >= len(row):
                continue
            for rel in _extract_backtick_paths(row[index]):
                target = (REPO_ROOT / rel).resolve()
                if not target.exists():
                    violations.append(
                        {
                            "type": "missing_anchor_path",
                            "path": _normalize_rel(source),
                            "message": f"Referenced path `{rel}` does not exist.",
                        }
                    )
    return violations


def _validate_maturity_mentions(manifest_versions: list[str], maturity_content: str) -> list[dict[str, str]]:
    violations: list[dict[str, str]] = []
    for version in manifest_versions:
        if version not in maturity_content:
            violations.append(
                {
                    "type": "maturity_mismatch",
                    "path": _normalize_rel(MATURITY_PATH),
                    "message": f"Maturity matrix does not mention manifest version token `{version}`.",
                }
            )
    return violations


def build_report() -> dict[str, Any]:
    violations = _validate_required_files()
    manifest_rows: list[list[str]] = []
    inventory_rows: list[list[str]] = []
    maturity_content = ""

    if MANIFEST_PATH.exists():
        manifest_content = _read(MANIFEST_PATH)
        manifest_heading = next(
            (line.strip() for line in manifest_content.splitlines() if line.startswith("## Current Operational Manifest (")),
            "## Current Operational Manifest (2026-03-07)",
        )
        manifest_rows = _extract_table_rows(manifest_content, manifest_heading)
        violations.extend(_validate_path_cells(manifest_rows, MANIFEST_PATH, [4]))

    if INVENTORY_PATH.exists():
        inventory_rows = _extract_table_rows(_read(INVENTORY_PATH), "## Inventory")
        violations.extend(_validate_path_cells(inventory_rows, INVENTORY_PATH, [0]))

    if MATURITY_PATH.exists():
        maturity_content = _read(MATURITY_PATH)

    if manifest_rows and maturity_content:
        violations.extend(_validate_maturity_mentions(_collect_manifest_versions(manifest_rows), maturity_content))

    violations.extend(_validate_entrypoint_references())

    return {
        "requiredFilesChecked": [_normalize_rel(path) for path in REQUIRED_FILES],
        "manifestRows": len(manifest_rows),
        "inventoryRows": len(inventory_rows),
        "violationCount": len(violations),
        "violations": violations,
        "compliant": len(violations) == 0,
    }


def _print_report(report: dict[str, Any]) -> None:
    print("=== CVF Release Manifest Consistency Gate ===")
    print(f"Required files checked: {len(report['requiredFilesChecked'])}")
    print(f"Manifest rows: {report['manifestRows']}")
    print(f"Inventory rows: {report['inventoryRows']}")
    print(f"Violations: {report['violationCount']}")

    if report["violations"]:
        print("\nViolations:")
        for violation in report["violations"]:
            print(f"  - {violation['path']} ({violation['type']}): {violation['message']}")
        print("\n❌ VIOLATION — Release manifest/inventory/maturity references are inconsistent.")
    else:
        print("\n✅ COMPLIANT — Release manifest, inventory, maturity matrix, and entrypoints are aligned.")


def main() -> int:
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(errors="replace")
    if hasattr(sys.stderr, "reconfigure"):
        sys.stderr.reconfigure(errors="replace")

    parser = argparse.ArgumentParser(description="CVF release manifest consistency gate")
    parser.add_argument("--enforce", action="store_true", help="Return non-zero when violations exist")
    parser.add_argument("--json", action="store_true", help="Print JSON report")
    args = parser.parse_args()

    report = build_report()

    if args.json:
        print(json.dumps(report, indent=2))
    else:
        _print_report(report)

    if args.enforce and not report["compliant"]:
        return 2
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
