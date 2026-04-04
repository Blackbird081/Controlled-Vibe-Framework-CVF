#!/usr/bin/env python3
"""
CVF Exception Registry Integrity Guard (GC-023 companion).

Validates that the CVF_GOVERNED_FILE_SIZE_EXCEPTION_REGISTRY.json
is internally consistent and that no entry exceeds the per-class
maxApprovableLines ceiling. Existing exception entries are treated as
governed records and may not be self-authorized through the normal
commit path.

Catches:
  - approvedMaxLines > maxApprovableLines (bump cap exceeded)
  - approvedMaxLines <= hardThresholdLines (exception not needed)
  - missing maxAllowedBumpPercent on a threshold class
  - new exception entries added without manual review
  - approvedMaxLines changed from the committed baseline
  - missing required fields
  - duplicate path entries
  - status not in allowed values

Usage:
  python governance/compat/check_governed_exception_registry.py [--enforce]
"""

from __future__ import annotations

import argparse
import json
import subprocess
import sys
from pathlib import Path
from typing import Any

REPO_ROOT = Path(__file__).resolve().parents[2]
DEFAULT_REGISTRY = (
    REPO_ROOT / "governance" / "compat" / "CVF_GOVERNED_FILE_SIZE_EXCEPTION_REGISTRY.json"
)
ALLOWED_STATUSES = {"ACTIVE_EXCEPTION", "SUPERSEDED", "RESOLVED"}
REQUIRED_FIELDS = ("path", "fileClass", "approvedMaxLines", "status", "rationale", "requiredFollowup")


def _read_registry(path: Path) -> dict[str, Any]:
    return json.loads(path.read_text(encoding="utf-8"))


def _read_head_registry(registry_path: Path) -> dict[str, Any] | None:
    try:
        rel_path = registry_path.resolve().relative_to(REPO_ROOT)
    except ValueError:
        return None

    proc = subprocess.run(
        ["git", "show", f"HEAD:{rel_path.as_posix()}"],
        cwd=REPO_ROOT,
        capture_output=True,
        text=True,
        encoding="utf-8",
        errors="replace",
        check=False,
    )
    if proc.returncode != 0:
        return None

    try:
        return json.loads(proc.stdout)
    except json.JSONDecodeError:
        return None


def validate(registry_path: Path) -> dict[str, Any]:
    violations: list[dict[str, Any]] = []

    if not registry_path.exists():
        return {
            "registryPath": str(registry_path),
            "violationCount": 1,
            "violations": [{"type": "registry_missing", "message": "Registry file not found."}],
            "compliant": False,
        }

    registry = _read_registry(registry_path)
    head_registry = _read_head_registry(registry_path)
    thresholds: dict[str, Any] = registry.get("thresholds", {})
    exceptions: list[Any] = registry.get("exceptions", [])
    head_exceptions: dict[str, Any] = {}

    if head_registry:
        for entry in head_registry.get("exceptions", []):
            if isinstance(entry, dict) and entry.get("path"):
                head_exceptions[entry["path"]] = entry

    # ----- Check schema has required governance controls for each class -----
    for cls, cfg in thresholds.items():
        if "maxApprovableLines" not in cfg:
            violations.append({
                "type": "schema_missing_max_approvable",
                "message": (
                    f"Threshold class '{cls}' is missing 'maxApprovableLines'. "
                    "All threshold classes must define this ceiling."
                ),
            })
        if "maxAllowedBumpPercent" not in cfg:
            violations.append({
                "type": "schema_missing_max_bump_percent",
                "message": (
                    f"Threshold class '{cls}' is missing 'maxAllowedBumpPercent'. "
                    "All threshold classes must define this ceiling so GC-023 fails closed."
                ),
            })

    # ----- Check each exception entry -----
    seen_paths: dict[str, int] = {}

    for i, entry in enumerate(exceptions):
        if not isinstance(entry, dict):
            violations.append({"type": "malformed_entry", "message": f"Entry #{i} is not an object."})
            continue

        path_val: str = entry.get("path", "")
        label = path_val or f"<entry #{i}>"

        # Required fields
        for field in REQUIRED_FIELDS:
            if not entry.get(field):
                violations.append({
                    "type": "missing_required_field",
                    "path": label,
                    "message": f"Exception entry '{label}' is missing required field '{field}'.",
                })

        # Duplicate detection
        if path_val:
            if path_val in seen_paths:
                violations.append({
                    "type": "duplicate_path",
                    "path": label,
                    "message": f"Duplicate exception entry for '{path_val}' (first seen at index {seen_paths[path_val]}, repeated at index {i}).",
                })
            else:
                seen_paths[path_val] = i

        # Status validity
        status = entry.get("status", "")
        if status and status not in ALLOWED_STATUSES:
            violations.append({
                "type": "invalid_status",
                "path": label,
                "message": f"Status '{status}' is not allowed. Must be one of: {', '.join(sorted(ALLOWED_STATUSES))}.",
            })

        file_class: str = entry.get("fileClass", "")
        approved_max = entry.get("approvedMaxLines")
        if approved_max is None:
            continue  # already caught by required fields check

        try:
            approved_max = int(approved_max)
        except (TypeError, ValueError):
            violations.append({
                "type": "invalid_approved_max",
                "path": label,
                "message": f"'approvedMaxLines' value '{approved_max}' is not a valid integer.",
            })
            continue

        class_cfg = thresholds.get(file_class, {})
        hard = int(class_cfg.get("hardThresholdLines", 0) or 0)
        max_approvable = int(class_cfg.get("maxApprovableLines", 0) or 0)
        max_bump_pct = float(class_cfg.get("maxAllowedBumpPercent", 100) or 100)

        if not file_class or file_class not in thresholds:
            violations.append({
                "type": "unknown_file_class",
                "path": label,
                "message": f"Exception entry references unknown fileClass '{file_class}'.",
            })
            continue

        baseline_entry = head_exceptions.get(path_val)
        if head_registry and path_val and baseline_entry is None:
            violations.append({
                "type": "new_exception_requires_manual_review",
                "path": label,
                "message": (
                    "This exception entry does not exist in HEAD. Adding a governed file-size "
                    "exception requires explicit human review and must not be self-authorized "
                    "through the normal pre-commit path."
                ),
            })
        elif baseline_entry is not None:
            baseline_approved_max = baseline_entry.get("approvedMaxLines")
            if baseline_approved_max != approved_max:
                violations.append({
                    "type": "approved_max_changed_from_head",
                    "path": label,
                    "message": (
                        f"approvedMaxLines changed from HEAD value {baseline_approved_max} "
                        f"to {approved_max}. Existing governed exceptions are frozen in the "
                        "normal commit path and require explicit human-approved override."
                    ),
                })

        # Hard ceiling check: approvedMaxLines must not exceed maxApprovableLines
        if max_approvable and approved_max > max_approvable:
            violations.append({
                "type": "approved_max_exceeds_ceiling",
                "path": label,
                "message": (
                    f"approvedMaxLines={approved_max} exceeds maxApprovableLines={max_approvable} "
                    f"for fileClass '{file_class}'. "
                    "Raising the ceiling requires a schema change with explicit governance authorization."
                ),
            })

        # Pointless exception check: approvedMaxLines must be > hardThresholdLines
        if hard and approved_max <= hard:
            violations.append({
                "type": "exception_not_needed",
                "path": label,
                "message": (
                    f"approvedMaxLines={approved_max} does not exceed hardThresholdLines={hard} "
                    f"for class '{file_class}'. This exception entry is unnecessary."
                ),
            })

        # Suspicious bump check: approved is more than maxAllowedBumpPercent above hard
        if hard and max_bump_pct < 100:
            max_allowed_abs = int(hard * (1 + max_bump_pct / 100))
            if approved_max > max_allowed_abs:
                violations.append({
                    "type": "suspicious_bump",
                    "path": label,
                    "message": (
                        f"approvedMaxLines={approved_max} exceeds the allowed bump of "
                        f"{max_bump_pct}% above hardThresholdLines={hard} (max allowed: {max_allowed_abs}). "
                        "This requires explicit human approval, not agent self-authorization."
                    ),
                })

    return {
        "registryPath": str(registry_path),
        "violationCount": len(violations),
        "violations": violations,
        "compliant": len(violations) == 0,
    }


def _print_report(report: dict[str, Any]) -> None:
    print("=== CVF Exception Registry Integrity Guard ===")
    print(f"Registry: {report['registryPath']}")
    print(f"Violations: {report['violationCount']}")
    if report["violations"]:
        print("\nViolations:")
        for v in report["violations"]:
            path = v.get("path", "")
            loc = f" [{path}]" if path else ""
            print(f"  - [{v['type']}]{loc}: {v['message']}")
        print("\nFAIL - Exception registry integrity check failed.")
    else:
        print("\nCOMPLIANT — Exception registry is internally consistent.")


def main() -> int:
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(errors="replace")
    if hasattr(sys.stderr, "reconfigure"):
        sys.stderr.reconfigure(errors="replace")

    parser = argparse.ArgumentParser(description="CVF exception registry integrity guard")
    parser.add_argument("--registry", default=str(DEFAULT_REGISTRY), help="Registry path")
    parser.add_argument("--json", action="store_true", help="Print JSON output")
    parser.add_argument("--enforce", action="store_true", help="Return non-zero on violation")
    args = parser.parse_args()

    registry_path = (
        (REPO_ROOT / args.registry).resolve()
        if not Path(args.registry).is_absolute()
        else Path(args.registry)
    )
    report = validate(registry_path)

    if args.json:
        print(json.dumps(report, indent=2))
    else:
        _print_report(report)

    if args.enforce and not report["compliant"]:
        return 2
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
