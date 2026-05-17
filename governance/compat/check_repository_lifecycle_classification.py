#!/usr/bin/env python3
"""
CVF Repository Lifecycle Classification Compatibility Gate
"""

from __future__ import annotations

import argparse
import datetime as dt
import json
from pathlib import Path
from typing import Any


REPO_ROOT = Path(__file__).resolve().parents[2]
ROOT_REGISTRY_PATH = REPO_ROOT / "governance" / "compat" / "CVF_ROOT_FOLDER_LIFECYCLE_REGISTRY.json"
EXTENSION_REGISTRY_PATH = REPO_ROOT / "governance" / "compat" / "CVF_EXTENSION_LIFECYCLE_REGISTRY.json"
CLASSIFICATION_DOC_PATH = REPO_ROOT / "docs" / "reference" / "CVF_REPOSITORY_LIFECYCLE_CLASSIFICATION.md"
GUARD_DOC_PATH = REPO_ROOT / "governance" / "toolkit" / "05_OPERATION" / "CVF_REPOSITORY_LIFECYCLE_CLASSIFICATION_GUARD.md"
HOOK_CHAIN_PATH = REPO_ROOT / "governance" / "compat" / "run_local_governance_hook_chain.py"
WORKFLOW_PATH = REPO_ROOT / ".github" / "workflows" / "documentation-testing.yml"

ALLOWED_CLASSES = {
    "ACTIVE_CANONICAL",
    "MERGED_RETAINED",
    "FROZEN_REFERENCE",
    "RETIRE_CANDIDATE",
}


def _rel(path: Path) -> str:
    return path.relative_to(REPO_ROOT).as_posix()


def _read(path: Path) -> str:
    if not path.exists() or path.is_dir():
        return ""
    return path.read_text(encoding="utf-8")


def _read_json(path: Path) -> dict[str, Any]:
    return json.loads(path.read_text(encoding="utf-8"))


def _visible_root_dirs() -> list[str]:
    return sorted([child.name for child in REPO_ROOT.iterdir() if child.is_dir()], key=str.lower)


def _extension_dirs() -> list[str]:
    extensions_root = REPO_ROOT / "EXTENSIONS"
    if not extensions_root.exists():
        return []
    return sorted([child.name for child in extensions_root.iterdir() if child.is_dir()], key=str.lower)


def build_report() -> dict[str, Any]:
    violations: list[dict[str, str]] = []

    if not ROOT_REGISTRY_PATH.exists():
        violations.append({"type": "root_registry_missing", "path": _rel(ROOT_REGISTRY_PATH), "message": "Root lifecycle registry is missing."})
    if not EXTENSION_REGISTRY_PATH.exists():
        violations.append({"type": "extension_registry_missing", "path": _rel(EXTENSION_REGISTRY_PATH), "message": "Extension lifecycle registry is missing."})
    if violations:
        return {
            "timestamp": dt.datetime.now(dt.timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z"),
            "violationCount": len(violations),
            "violations": violations,
            "compliant": False,
        }

    root_registry = _read_json(ROOT_REGISTRY_PATH)
    extension_registry = _read_json(EXTENSION_REGISTRY_PATH)
    root_classes = root_registry.get("lifecycleClasses", root_registry.get("classes", []))
    root_entries = root_registry.get("roots", [])
    ignored_roots = set(root_registry.get("ignoredRoots", []))
    extension_classes = extension_registry.get("lifecycleClasses", extension_registry.get("classes", []))
    extension_entries = extension_registry.get("extensions", [])

    root_paths: set[str] = set()
    extension_paths: set[str] = set()

    for entry in root_classes:
        class_id = entry.get("id")
        if class_id not in ALLOWED_CLASSES:
            violations.append({"type": "invalid_root_registry_class", "path": _rel(ROOT_REGISTRY_PATH), "message": f"Root lifecycle class `{class_id}` is invalid."})

    for entry in extension_classes:
        class_id = entry.get("id")
        if class_id not in ALLOWED_CLASSES:
            violations.append({"type": "invalid_extension_registry_class", "path": _rel(EXTENSION_REGISTRY_PATH), "message": f"Extension lifecycle class `{class_id}` is invalid."})

    for entry in root_entries:
        path = entry.get("path")
        lifecycle_class = entry.get("lifecycleClass")
        if not path or not lifecycle_class:
            violations.append({"type": "missing_root_field", "path": _rel(ROOT_REGISTRY_PATH), "message": "Every root entry must declare `path` and `lifecycleClass`."})
            continue
        if lifecycle_class not in ALLOWED_CLASSES:
            violations.append({"type": "invalid_root_class", "path": _rel(ROOT_REGISTRY_PATH), "message": f"Root `{path}` uses invalid lifecycle class `{lifecycle_class}`."})
        if path in root_paths:
            violations.append({"type": "duplicate_root_entry", "path": _rel(ROOT_REGISTRY_PATH), "message": f"Root `{path}` is classified more than once."})
        root_paths.add(path)

    for entry in extension_entries:
        path = entry.get("path")
        lifecycle_class = entry.get("lifecycleClass")
        if not path or not lifecycle_class:
            violations.append({"type": "missing_extension_field", "path": _rel(EXTENSION_REGISTRY_PATH), "message": "Every extension entry must declare `path` and `lifecycleClass`."})
            continue
        if lifecycle_class not in ALLOWED_CLASSES:
            violations.append({"type": "invalid_extension_class", "path": _rel(EXTENSION_REGISTRY_PATH), "message": f"Extension `{path}` uses invalid lifecycle class `{lifecycle_class}`."})
        if path in extension_paths:
            violations.append({"type": "duplicate_extension_entry", "path": _rel(EXTENSION_REGISTRY_PATH), "message": f"Extension `{path}` is classified more than once."})
        extension_paths.add(path)

    visible_roots = _visible_root_dirs()
    meaningful_roots = [name for name in visible_roots if name not in ignored_roots]
    for root_name in meaningful_roots:
        if root_name not in root_paths:
            violations.append({"type": "unclassified_root", "path": root_name, "message": f"Visible repository root `{root_name}` is not lifecycle-classified."})

    for classified_root in sorted(root_paths):
        if classified_root in ignored_roots:
            violations.append({"type": "ignored_root_classified", "path": _rel(ROOT_REGISTRY_PATH), "message": f"Ignored root `{classified_root}` should not appear in the root registry."})
        elif classified_root not in visible_roots:
            violations.append({"type": "stale_root_entry", "path": _rel(ROOT_REGISTRY_PATH), "message": f"Classified root `{classified_root}` does not exist on disk."})

    extension_dirs = _extension_dirs()
    for extension_name in extension_dirs:
        if extension_name not in extension_paths:
            violations.append({"type": "unclassified_extension", "path": extension_name, "message": f"Extension root `{extension_name}` is not lifecycle-classified."})

    for classified_extension in sorted(extension_paths):
        if classified_extension not in extension_dirs:
            violations.append({"type": "stale_extension_entry", "path": _rel(EXTENSION_REGISTRY_PATH), "message": f"Classified extension `{classified_extension}` does not exist on disk."})

    for path in (CLASSIFICATION_DOC_PATH, GUARD_DOC_PATH, HOOK_CHAIN_PATH, WORKFLOW_PATH):
        if not path.exists():
            violations.append({"type": "required_artifact_missing", "path": _rel(path), "message": "Required repository lifecycle artifact is missing."})

    if "check_repository_lifecycle_classification.py" not in _read(HOOK_CHAIN_PATH):
        violations.append({"type": "hook_chain_missing_enforcement", "path": _rel(HOOK_CHAIN_PATH), "message": "Local hook chain does not run repository lifecycle classification."})
    if "check_repository_lifecycle_classification.py" not in _read(WORKFLOW_PATH):
        violations.append({"type": "workflow_missing_enforcement", "path": _rel(WORKFLOW_PATH), "message": "CI workflow does not run repository lifecycle classification."})

    return {
        "timestamp": dt.datetime.now(dt.timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z"),
        "rootRegistryPath": _rel(ROOT_REGISTRY_PATH),
        "extensionRegistryPath": _rel(EXTENSION_REGISTRY_PATH),
        "visibleRootCount": len(meaningful_roots),
        "extensionRootCount": len(extension_dirs),
        "violationCount": len(violations),
        "violations": violations,
        "compliant": not violations,
    }


def main() -> int:
    parser = argparse.ArgumentParser(description="Check repository lifecycle classification coverage")
    parser.add_argument("--enforce", action="store_true", help="Exit non-zero if violations exist")
    args = parser.parse_args()

    report = build_report()
    print("=== CVF Repository Lifecycle Classification Gate ===")
    print(f"Root registry: {report['rootRegistryPath']}")
    print(f"Extension registry: {report['extensionRegistryPath']}")
    print(f"Visible roots checked: {report['visibleRootCount']}")
    print(f"Extension roots checked: {report['extensionRootCount']}")
    print(f"Violations: {report['violationCount']}")
    print()
    if report["violations"]:
        for violation in report["violations"]:
            print(f"- {violation['type']}: {violation['message']}")
    else:
        print("? COMPLIANT - repository roots and extension roots are lifecycle-classified.")

    if args.enforce and not report["compliant"]:
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
