#!/usr/bin/env python3
"""
CVF Repository Exposure Classification Compatibility Gate
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
CLASSIFICATION_DOC_PATH = REPO_ROOT / "docs" / "reference" / "CVF_REPOSITORY_EXPOSURE_CLASSIFICATION.md"
GUARD_DOC_PATH = REPO_ROOT / "governance" / "toolkit" / "05_OPERATION" / "CVF_REPOSITORY_EXPOSURE_CLASSIFICATION_GUARD.md"
HOOK_CHAIN_PATH = REPO_ROOT / "governance" / "compat" / "run_local_governance_hook_chain.py"
WORKFLOW_PATH = REPO_ROOT / ".github" / "workflows" / "documentation-testing.yml"

ALLOWED_EXPOSURE_CLASSES = {
    "PUBLIC_DOCS_ONLY",
    "PUBLIC_EXPORT_CANDIDATE",
    "INTERNAL_ONLY",
    "PRIVATE_ENTERPRISE_ONLY",
}


def _rel(path: Path) -> str:
    return path.relative_to(REPO_ROOT).as_posix()


def _read(path: Path) -> str:
    if not path.exists() or path.is_dir():
        return ""
    return path.read_text(encoding="utf-8")


def _read_json(path: Path) -> dict[str, Any]:
    return json.loads(path.read_text(encoding="utf-8"))


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

    root_classes = root_registry.get("exposureClasses", [])
    extension_classes = extension_registry.get("exposureClasses", [])
    root_entries = root_registry.get("roots", [])
    extension_entries = extension_registry.get("extensions", [])
    classification_doc_text = _read(CLASSIFICATION_DOC_PATH)
    guard_doc_text = _read(GUARD_DOC_PATH)

    root_paths: set[str] = set()
    extension_paths: set[str] = set()

    for entry in root_classes:
        class_id = entry.get("id")
        if class_id not in ALLOWED_EXPOSURE_CLASSES:
            violations.append({"type": "invalid_root_exposure_class", "path": _rel(ROOT_REGISTRY_PATH), "message": f"Root exposure class `{class_id}` is invalid."})

    for entry in extension_classes:
        class_id = entry.get("id")
        if class_id not in ALLOWED_EXPOSURE_CLASSES:
            violations.append({"type": "invalid_extension_exposure_class", "path": _rel(EXTENSION_REGISTRY_PATH), "message": f"Extension exposure class `{class_id}` is invalid."})

    for entry in root_entries:
        path = entry.get("path")
        lifecycle_class = entry.get("lifecycleClass")
        exposure_class = entry.get("exposureClass")
        if not path or not lifecycle_class or not exposure_class:
            violations.append({"type": "missing_root_exposure_field", "path": _rel(ROOT_REGISTRY_PATH), "message": "Every root entry must declare `path`, `lifecycleClass`, and `exposureClass`."})
            continue
        if exposure_class not in ALLOWED_EXPOSURE_CLASSES:
            violations.append({"type": "invalid_root_entry_exposure", "path": _rel(ROOT_REGISTRY_PATH), "message": f"Root `{path}` uses invalid exposure class `{exposure_class}`."})
        if exposure_class == "PUBLIC_EXPORT_CANDIDATE" and lifecycle_class in {"FROZEN_REFERENCE", "RETIRE_CANDIDATE"}:
            violations.append({"type": "invalid_root_public_export_lifecycle_pair", "path": _rel(ROOT_REGISTRY_PATH), "message": f"Root `{path}` cannot be `PUBLIC_EXPORT_CANDIDATE` while lifecycle is `{lifecycle_class}`."})
        if path in root_paths:
            violations.append({"type": "duplicate_root_exposure_entry", "path": _rel(ROOT_REGISTRY_PATH), "message": f"Root `{path}` is classified more than once for exposure."})
        root_paths.add(path)

    for entry in extension_entries:
        path = entry.get("path")
        lifecycle_class = entry.get("lifecycleClass")
        exposure_class = entry.get("exposureClass")
        if not path or not lifecycle_class or not exposure_class:
            violations.append({"type": "missing_extension_exposure_field", "path": _rel(EXTENSION_REGISTRY_PATH), "message": "Every extension entry must declare `path`, `lifecycleClass`, and `exposureClass`."})
            continue
        if exposure_class not in ALLOWED_EXPOSURE_CLASSES:
            violations.append({"type": "invalid_extension_entry_exposure", "path": _rel(EXTENSION_REGISTRY_PATH), "message": f"Extension `{path}` uses invalid exposure class `{exposure_class}`."})
        if exposure_class == "PUBLIC_EXPORT_CANDIDATE" and lifecycle_class in {"FROZEN_REFERENCE", "RETIRE_CANDIDATE"}:
            violations.append({"type": "invalid_extension_public_export_lifecycle_pair", "path": _rel(EXTENSION_REGISTRY_PATH), "message": f"Extension `{path}` cannot be `PUBLIC_EXPORT_CANDIDATE` while lifecycle is `{lifecycle_class}`."})
        if path in extension_paths:
            violations.append({"type": "duplicate_extension_exposure_entry", "path": _rel(EXTENSION_REGISTRY_PATH), "message": f"Extension `{path}` is classified more than once for exposure."})
        extension_paths.add(path)

    for path in (CLASSIFICATION_DOC_PATH, GUARD_DOC_PATH, HOOK_CHAIN_PATH, WORKFLOW_PATH):
        if not path.exists():
            violations.append({"type": "required_artifact_missing", "path": _rel(path), "message": "Required repository exposure artifact is missing."})

    if "check_repository_exposure_classification.py" not in _read(HOOK_CHAIN_PATH):
        violations.append({"type": "hook_chain_missing_enforcement", "path": _rel(HOOK_CHAIN_PATH), "message": "Local hook chain does not run repository exposure classification."})
    if "check_repository_exposure_classification.py" not in _read(WORKFLOW_PATH):
        violations.append({"type": "workflow_missing_enforcement", "path": _rel(WORKFLOW_PATH), "message": "CI workflow does not run repository exposure classification."})
    if "private-by-default" not in classification_doc_text or "selective-publication-only" not in classification_doc_text:
        violations.append({"type": "classification_doc_missing_private_default_rule", "path": _rel(CLASSIFICATION_DOC_PATH), "message": "Exposure classification doc must state the `private-by-default, selective-publication-only` rule."})
    if "repository contents can be cloned as a whole" not in classification_doc_text:
        violations.append({"type": "classification_doc_missing_public_clone_implication", "path": _rel(CLASSIFICATION_DOC_PATH), "message": "Exposure classification doc must state that a public repository can be cloned as a whole."})
    if "does not itself authorize publication" not in guard_doc_text:
        violations.append({"type": "guard_doc_missing_non_authorization_clause", "path": _rel(GUARD_DOC_PATH), "message": "Exposure guard doc must state that classification alone does not authorize publication."})

    return {
        "timestamp": dt.datetime.now(dt.timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z"),
        "rootRegistryPath": _rel(ROOT_REGISTRY_PATH),
        "extensionRegistryPath": _rel(EXTENSION_REGISTRY_PATH),
        "rootExposureCount": len(root_paths),
        "extensionExposureCount": len(extension_paths),
        "violationCount": len(violations),
        "violations": violations,
        "compliant": not violations,
    }


def main() -> int:
    parser = argparse.ArgumentParser(description="Check repository exposure classification coverage")
    parser.add_argument("--enforce", action="store_true", help="Exit non-zero if violations exist")
    args = parser.parse_args()

    report = build_report()
    print("=== CVF Repository Exposure Classification Gate ===")
    print(f"Root registry: {report['rootRegistryPath']}")
    print(f"Extension registry: {report['extensionRegistryPath']}")
    print(f"Root entries checked: {report['rootExposureCount']}")
    print(f"Extension entries checked: {report['extensionExposureCount']}")
    print(f"Violations: {report['violationCount']}")
    print()
    if report["violations"]:
        for violation in report["violations"]:
            print(f"- {violation['type']}: {violation['message']}")
    else:
        print("? COMPLIANT - repository roots and extension roots are exposure-classified.")

    if args.enforce and not report["compliant"]:
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
