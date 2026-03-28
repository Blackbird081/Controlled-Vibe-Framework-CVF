#!/usr/bin/env python3
"""
CVF Active Window Registry Compatibility Gate

Validates the canonical registry for active trace/log windows that must stay
protected from generic archive cleanup and ensures dedicated rotation guards
are registered in that machine-readable surface.
"""

from __future__ import annotations

import argparse
import datetime as dt
import json
import re
import sys
from pathlib import Path
from typing import Any


REPO_ROOT = Path(__file__).resolve().parents[2]
COMPAT_DIR = Path(__file__).resolve().parent
if str(COMPAT_DIR) not in sys.path:
    sys.path.insert(0, str(COMPAT_DIR))

from policy_baseline import load_json_policy_baseline

REGISTRY_PATH = REPO_ROOT / "governance" / "compat" / "CVF_ACTIVE_WINDOW_REGISTRY.json"
GUARD_DOC_PATH = REPO_ROOT / "governance" / "toolkit" / "05_OPERATION" / "CVF_ACTIVE_WINDOW_REGISTRY_GUARD.md"
ACTIVE_ARCHIVE_GUARD_PATH = REPO_ROOT / "governance" / "toolkit" / "05_OPERATION" / "CVF_ACTIVE_ARCHIVE_GUARD.md"
HOOK_CHAIN_PATH = REPO_ROOT / "governance" / "compat" / "run_local_governance_hook_chain.py"
WORKFLOW_PATH = REPO_ROOT / ".github" / "workflows" / "documentation-testing.yml"
WINDOW_CLASSIFICATION_PATH = REPO_ROOT / "docs" / "reference" / "CVF_ACTIVE_WINDOW_CLASSIFICATION.md"
ROTATION_GUARD_DIR = REPO_ROOT / "governance" / "toolkit" / "05_OPERATION"

ALLOWED_PROTECTION_MODES = {"PERMANENT_ACTIVE_WINDOW"}
ALLOWED_STATUSES = {"ACTIVE", "SUPERSEDED", "RETIRED"}
ROTATION_GUARD_GLOB = "CVF_*ROTATION_GUARD.md"
ACTIVE_WINDOW_TRIGGER_MARKERS = (
    "canonical entrypoint",
    "active working window",
    "current working window",
)


def _rel(path: Path) -> str:
    return path.relative_to(REPO_ROOT).as_posix()


def _read(path: Path) -> str:
    if not path.exists() or path.is_dir():
        return ""
    return path.read_text(encoding="utf-8")


def _read_json(path: Path) -> dict[str, Any]:
    return json.loads(path.read_text(encoding="utf-8"))


def _extract_active_path_from_rotation_guard(guard_path: Path) -> str | None:
    text = _read(guard_path)
    lowered = text.lower()
    if not any(marker in lowered for marker in ACTIVE_WINDOW_TRIGGER_MARKERS):
        return None

    applies_match = re.search(r"^\*\*Applies to:\*\*\s+(.+)$", text, re.M)
    if not applies_match:
        return None
    paths = re.findall(r"`([^`]+)`", applies_match.group(1))
    for candidate in paths:
        normalized = candidate.replace("\\", "/")
        if "*" in normalized:
            continue
        if not normalized.endswith(".md"):
            continue
        if "/logs/" in normalized or "/archive/" in normalized:
            continue
        return normalized
    return None


def _discover_rotation_guard_windows() -> list[dict[str, str]]:
    discovered: list[dict[str, str]] = []
    for guard_path in sorted(ROTATION_GUARD_DIR.glob(ROTATION_GUARD_GLOB)):
        active_path = _extract_active_path_from_rotation_guard(guard_path)
        if not active_path:
            continue
        discovered.append(
            {
                "guard": _rel(guard_path),
                "activePath": active_path,
            }
        )
    return discovered


def build_report() -> dict[str, Any]:
    violations: list[dict[str, str]] = []
    discovered_windows = _discover_rotation_guard_windows()

    if not REGISTRY_PATH.exists():
        return {
            "timestamp": dt.datetime.now(dt.timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z"),
            "registryPath": _rel(REGISTRY_PATH),
            "discoveredRotationWindows": discovered_windows,
            "violationCount": 1,
            "violations": [
                {
                    "type": "registry_missing",
                    "path": _rel(REGISTRY_PATH),
                    "message": "Active window registry is missing.",
                }
            ],
            "compliant": False,
        }

    registry = _read_json(REGISTRY_PATH)
    baseline_registry, baseline_source = load_json_policy_baseline(REGISTRY_PATH)
    classes = registry.get("classes", [])
    windows = registry.get("windows", [])
    class_ids: set[str] = set()
    window_ids: set[str] = set()
    active_paths: set[str] = set()
    rotation_guards: set[str] = set()
    window_map_by_guard: dict[str, dict[str, Any]] = {}

    if not isinstance(classes, list) or not isinstance(windows, list):
        violations.append(
            {
                "type": "invalid_registry_shape",
                "path": _rel(REGISTRY_PATH),
                "message": "Registry must expose `classes[]` and `windows[]` arrays.",
            }
        )
        classes = []
        windows = []

    for entry in classes:
        if not isinstance(entry, dict):
            violations.append(
                {
                    "type": "invalid_class_entry",
                    "path": _rel(REGISTRY_PATH),
                    "message": "Class entries must be objects.",
                }
            )
            continue
        class_id = entry.get("id", "")
        if not class_id:
            violations.append(
                {
                    "type": "missing_class_id",
                    "path": _rel(REGISTRY_PATH),
                    "message": "Class entry is missing `id`.",
                }
            )
            continue
        if class_id in class_ids:
            violations.append(
                {
                    "type": "duplicate_class_id",
                    "path": _rel(REGISTRY_PATH),
                    "message": f"Duplicate active window class id `{class_id}`.",
                }
            )
        class_ids.add(class_id)
        if not entry.get("description"):
            violations.append(
                {
                    "type": "missing_class_description",
                    "path": _rel(REGISTRY_PATH),
                    "message": f"Active window class `{class_id}` is missing `description`.",
                }
            )

    for entry in windows:
        if not isinstance(entry, dict):
            violations.append(
                {
                    "type": "invalid_window_entry",
                    "path": _rel(REGISTRY_PATH),
                    "message": "Window entries must be objects.",
                }
            )
            continue

        missing = [
            field
            for field in (
                "id",
                "windowClass",
                "activePath",
                "archiveDir",
                "archivePattern",
                "rotationGuard",
                "rotationCheck",
                "rotationScript",
                "protectionMode",
                "status",
            )
            if not entry.get(field)
        ]
        if missing:
            violations.append(
                {
                    "type": "missing_window_field",
                    "path": _rel(REGISTRY_PATH),
                    "message": f"Window entry is missing required fields: {', '.join(missing)}.",
                }
            )
            continue

        window_id = entry["id"]
        window_class = entry["windowClass"]
        active_path = entry["activePath"]
        archive_pattern = entry["archivePattern"]
        rotation_guard = entry["rotationGuard"]

        if window_id in window_ids:
            violations.append(
                {
                    "type": "duplicate_window_id",
                    "path": _rel(REGISTRY_PATH),
                    "message": f"Duplicate active window id `{window_id}`.",
                }
            )
        window_ids.add(window_id)

        if active_path in active_paths:
            violations.append(
                {
                    "type": "duplicate_active_path",
                    "path": _rel(REGISTRY_PATH),
                    "message": f"Duplicate active window path `{active_path}`.",
                }
            )
        active_paths.add(active_path)

        if rotation_guard in rotation_guards:
            violations.append(
                {
                    "type": "duplicate_rotation_guard",
                    "path": _rel(REGISTRY_PATH),
                    "message": f"Multiple active windows point to the same rotation guard `{rotation_guard}`.",
                }
            )
        rotation_guards.add(rotation_guard)
        window_map_by_guard[rotation_guard] = entry

        if window_class not in class_ids:
            violations.append(
                {
                    "type": "unknown_window_class",
                    "path": _rel(REGISTRY_PATH),
                    "message": f"Window `{window_id}` uses unknown class `{window_class}`.",
                }
            )

        if entry["protectionMode"] not in ALLOWED_PROTECTION_MODES:
            violations.append(
                {
                    "type": "invalid_protection_mode",
                    "path": _rel(REGISTRY_PATH),
                    "message": f"Window `{window_id}` uses invalid protection mode `{entry['protectionMode']}`.",
                }
            )

        if entry["status"] not in ALLOWED_STATUSES:
            violations.append(
                {
                    "type": "invalid_window_status",
                    "path": _rel(REGISTRY_PATH),
                    "message": f"Window `{window_id}` uses invalid status `{entry['status']}`.",
                }
            )

        for ref in (entry["activePath"], entry["archiveDir"], entry["rotationGuard"], entry["rotationCheck"], entry["rotationScript"]):
            if not (REPO_ROOT / ref).exists():
                violations.append(
                    {
                        "type": "missing_referenced_path",
                        "path": _rel(REGISTRY_PATH),
                        "message": f"Window `{window_id}` references missing path `{ref}`.",
                    }
                )

        if "/logs/" in active_path or "/archive/" in active_path:
            violations.append(
                {
                    "type": "invalid_active_path_zone",
                    "path": _rel(REGISTRY_PATH),
                    "message": f"Window `{window_id}` active path points into archive/log storage `{active_path}`.",
                }
            )

        try:
            re.compile(archive_pattern)
        except re.error as exc:
            violations.append(
                {
                    "type": "invalid_archive_pattern",
                    "path": _rel(REGISTRY_PATH),
                    "message": f"Window `{window_id}` has invalid archivePattern: {exc}.",
                }
            )

    for discovered in discovered_windows:
        registered = window_map_by_guard.get(discovered["guard"])
        if not registered:
            violations.append(
                {
                    "type": "rotation_guard_not_registered",
                    "path": discovered["guard"],
                    "message": (
                        f"Rotation guard `{discovered['guard']}` exposes canonical active window "
                        f"`{discovered['activePath']}` but is not registered in `{_rel(REGISTRY_PATH)}`."
                    ),
                }
            )
            continue
        if registered["activePath"] != discovered["activePath"]:
            violations.append(
                {
                    "type": "rotation_guard_active_path_mismatch",
                    "path": discovered["guard"],
                    "message": (
                        f"Rotation guard `{discovered['guard']}` exposes active path "
                        f"`{discovered['activePath']}` but registry records `{registered['activePath']}`."
                    ),
                }
            )

    if baseline_registry:
        baseline_windows = {
            entry["id"]: entry
            for entry in baseline_registry.get("windows", [])
            if isinstance(entry, dict) and entry.get("id")
        }
        current_windows = {
            entry["id"]: entry
            for entry in windows
            if isinstance(entry, dict) and entry.get("id")
        }
        for window_id, baseline_entry in baseline_windows.items():
            current_entry = current_windows.get(window_id)
            if current_entry is None:
                violations.append(
                    {
                        "type": "window_removed_from_baseline",
                        "path": _rel(REGISTRY_PATH),
                        "message": f"Active window `{window_id}` was removed from the protected baseline.",
                    }
                )
            elif current_entry != baseline_entry:
                violations.append(
                    {
                        "type": "window_mutated_from_baseline",
                        "path": _rel(REGISTRY_PATH),
                        "message": (
                            f"Active window `{window_id}` differs from the protected baseline. "
                            "Existing active-window entries may not be silently mutated in the normal commit path."
                        ),
                    }
                )

    helper_texts = {
        _rel(GUARD_DOC_PATH): _read(GUARD_DOC_PATH),
        _rel(ACTIVE_ARCHIVE_GUARD_PATH): _read(ACTIVE_ARCHIVE_GUARD_PATH),
        _rel(HOOK_CHAIN_PATH): _read(HOOK_CHAIN_PATH),
        _rel(WORKFLOW_PATH): _read(WORKFLOW_PATH),
        _rel(WINDOW_CLASSIFICATION_PATH): _read(WINDOW_CLASSIFICATION_PATH),
    }

    for helper_path, marker in (
        (_rel(GUARD_DOC_PATH), _rel(REGISTRY_PATH)),
        (_rel(ACTIVE_ARCHIVE_GUARD_PATH), _rel(REGISTRY_PATH)),
        (_rel(HOOK_CHAIN_PATH), "check_active_window_registry.py"),
        (_rel(WORKFLOW_PATH), "check_active_window_registry.py"),
        (_rel(WINDOW_CLASSIFICATION_PATH), _rel(REGISTRY_PATH)),
    ):
        if marker not in helper_texts.get(helper_path, ""):
            violations.append(
                {
                    "type": "helper_marker_missing",
                    "path": helper_path,
                    "message": f"Required marker `{marker}` is missing from `{helper_path}`.",
                }
            )

    return {
        "timestamp": dt.datetime.now(dt.timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z"),
        "registryPath": _rel(REGISTRY_PATH),
        "baselineSource": baseline_source,
        "classCount": len(classes),
        "windowCount": len(windows),
        "discoveredRotationWindows": discovered_windows,
        "violationCount": len(violations),
        "violations": violations,
        "compliant": len(violations) == 0,
    }


def _print_report(report: dict[str, Any]) -> None:
    print("=== CVF Active Window Registry Gate ===")
    print(f"Registry: {report['registryPath']}")
    print(f"Classes: {report['classCount']}")
    print(f"Windows: {report['windowCount']}")
    print(f"Discovered rotation windows: {len(report['discoveredRotationWindows'])}")
    print(f"Violations: {report['violationCount']}")

    if report["discoveredRotationWindows"]:
        print("\nDiscovered rotation windows:")
        for entry in report["discoveredRotationWindows"]:
            print(f"  - {entry['guard']} -> {entry['activePath']}")

    if report["violations"]:
        print("\nViolations:")
        for violation in report["violations"]:
            print(f"  - {violation['type']}: {violation['message']}")

    if report["compliant"]:
        print("\n✅ COMPLIANT — active window registry, classification, and archive protection are aligned.")
    else:
        print("\n❌ VIOLATION — active window registry or protected active-window alignment is broken.")


def main() -> int:
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(errors="replace")
    if hasattr(sys.stderr, "reconfigure"):
        sys.stderr.reconfigure(errors="replace")

    parser = argparse.ArgumentParser(description="CVF active window registry compatibility gate")
    parser.add_argument("--enforce", action="store_true")
    parser.add_argument("--json", action="store_true")
    args = parser.parse_args()

    report = build_report()
    if args.json:
        print(json.dumps(report, indent=2, ensure_ascii=False))
    else:
        _print_report(report)

    if args.enforce and not report["compliant"]:
        return 2
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
