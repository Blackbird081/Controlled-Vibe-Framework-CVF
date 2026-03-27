#!/usr/bin/env python3
"""
CVF test partition ownership guard.

Prevents tests that were intentionally extracted into canonical files
from being reintroduced into legacy monolithic test files.
"""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path
from typing import Any

REPO_ROOT = Path(__file__).resolve().parents[2]
COMPAT_DIR = Path(__file__).resolve().parent
if str(COMPAT_DIR) not in sys.path:
    sys.path.insert(0, str(COMPAT_DIR))

from policy_baseline import load_json_policy_baseline

DEFAULT_REGISTRY = REPO_ROOT / "governance" / "compat" / "CVF_TEST_PARTITION_OWNERSHIP_REGISTRY.json"
POLICY_PATH = "governance/toolkit/05_OPERATION/CVF_TEST_PARTITION_OWNERSHIP_GUARD.md"


def _rel(path: Path) -> str:
    return str(path.relative_to(REPO_ROOT)).replace("\\", "/")


def _read_json(path: Path) -> dict[str, Any]:
    return json.loads(path.read_text(encoding="utf-8"))


def build_report(registry_path: Path) -> dict[str, Any]:
    violations: list[dict[str, str]] = []
    partitions_report: list[dict[str, Any]] = []

    if not registry_path.exists():
        return {
            "policyPath": POLICY_PATH,
            "registryPath": str(registry_path),
            "violationCount": 1,
            "violations": [
                {
                    "type": "registry_missing",
                    "path": str(registry_path),
                    "message": "Test partition ownership registry is missing.",
                }
            ],
            "partitions": [],
            "compliant": False,
        }

    registry = _read_json(registry_path)
    partitions = registry.get("partitions", [])
    baseline_registry, baseline_source = load_json_policy_baseline(registry_path)
    baseline_partitions = {
        entry["scope"]: entry
        for entry in baseline_registry.get("partitions", [])
        if isinstance(entry, dict) and entry.get("scope")
    } if baseline_registry else {}
    current_partitions_by_scope: dict[str, dict[str, Any]] = {}
    seen_scopes: set[str] = set()

    for partition in partitions:
        scope = partition.get("scope", "")
        canonical_file = partition.get("canonicalFile", "")
        forbidden_files = partition.get("forbiddenFiles", [])
        forbidden_patterns = partition.get("forbiddenPatterns", [])

        if scope:
            if scope in seen_scopes:
                violations.append(
                    {
                        "type": "duplicate_scope",
                        "path": canonical_file or "<missing>",
                        "message": f"Duplicate partition scope `{scope}` in ownership registry.",
                    }
                )
            seen_scopes.add(scope)

        missing_fields = [
            field
            for field, value in (
                ("scope", scope),
                ("canonicalFile", canonical_file),
                ("forbiddenFiles", forbidden_files),
                ("forbiddenPatterns", forbidden_patterns),
            )
            if not value
        ]
        if missing_fields:
            violations.append(
                {
                    "type": "registry_entry_incomplete",
                    "path": canonical_file or "<missing>",
                    "message": f"Partition entry is missing required fields: {', '.join(missing_fields)}.",
                }
            )
            continue

        current_partitions_by_scope[scope] = partition

        baseline_entry = baseline_partitions.get(scope)
        if baseline_entry is not None and partition != baseline_entry:
            violations.append(
                {
                    "type": "partition_mutated_from_baseline",
                    "path": canonical_file,
                    "message": (
                        f"Ownership partition `{scope}` differs from the protected baseline. "
                        "Existing partition rules may not be self-authorized in the normal commit path."
                    ),
                }
            )

        canonical_path = REPO_ROOT / canonical_file
        if not canonical_path.exists():
            violations.append(
                {
                    "type": "canonical_file_missing",
                    "path": canonical_file,
                    "message": f"Canonical test file for `{scope}` is missing.",
                }
            )
            continue

        forbidden_hits: list[dict[str, Any]] = []
        for forbidden_file in forbidden_files:
            forbidden_path = REPO_ROOT / forbidden_file
            if not forbidden_path.exists():
                violations.append(
                    {
                        "type": "forbidden_file_missing",
                        "path": forbidden_file,
                        "message": f"Forbidden legacy file for `{scope}` is missing.",
                    }
                )
                continue

            content = forbidden_path.read_text(encoding="utf-8", errors="replace")
            hits = [pattern for pattern in forbidden_patterns if pattern in content]
            if hits:
                forbidden_hits.append(
                    {
                        "path": forbidden_file,
                        "patterns": hits,
                    }
                )
                violations.append(
                    {
                        "type": "forbidden_pattern_reintroduced",
                        "path": forbidden_file,
                        "message": (
                            f"Forbidden test ownership patterns reappeared for `{scope}`: {', '.join(hits)}."
                        ),
                    }
                )

        partitions_report.append(
            {
                "scope": scope,
                "canonicalFile": canonical_file,
                "forbiddenFiles": forbidden_files,
                "forbiddenPatternCount": len(forbidden_patterns),
                "violatingFiles": forbidden_hits,
            }
        )

    for scope, baseline_entry in baseline_partitions.items():
        if scope not in current_partitions_by_scope:
            violations.append(
                {
                    "type": "partition_removed_from_baseline",
                    "path": baseline_entry.get("canonicalFile", "<missing>"),
                    "message": f"Ownership partition `{scope}` was removed from the protected baseline.",
                }
            )

    return {
        "policyPath": POLICY_PATH,
        "registryPath": _rel(registry_path),
        "baselineSource": baseline_source,
        "partitionCount": len(partitions_report),
        "violationCount": len(violations),
        "violations": violations,
        "partitions": partitions_report,
        "compliant": len(violations) == 0,
    }


def _print_report(report: dict[str, Any]) -> None:
    print("=== CVF Test Partition Ownership Guard ===")
    print(f"Registry: {report['registryPath']}")
    print(f"Protected baseline: {report.get('baselineSource') or 'none'}")
    print(f"Policy: {report['policyPath']}")
    print(f"Partitions checked: {report.get('partitionCount', 0)}")
    print(f"Violations: {report['violationCount']}")

    if report["partitions"]:
        print("\nPartitions:")
        for partition in report["partitions"]:
            print(f"  - {partition['scope']}: {partition['canonicalFile']}")

    if report["violations"]:
        print("\nViolations:")
        for violation in report["violations"]:
            print(f"  - {violation['path']} ({violation['type']}): {violation['message']}")
        print("\nFAIL - Canonical test partition ownership was violated.")
        return

    print("\nCOMPLIANT — Canonical test partition ownership is intact.")


def main() -> int:
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(errors="replace")
    if hasattr(sys.stderr, "reconfigure"):
        sys.stderr.reconfigure(errors="replace")

    parser = argparse.ArgumentParser(description="CVF test partition ownership guard")
    parser.add_argument("--registry", default=str(DEFAULT_REGISTRY), help="Ownership registry path")
    parser.add_argument("--json", action="store_true", help="Print JSON report")
    parser.add_argument("--enforce", action="store_true", help="Return non-zero on violation")
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
