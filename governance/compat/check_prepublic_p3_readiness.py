#!/usr/bin/env python3
"""
CVF Pre-Public P3 Readiness Gate
"""

from __future__ import annotations

import argparse
import datetime as dt
import json
from pathlib import Path
from typing import Any


REPO_ROOT = Path(__file__).resolve().parents[2]
PHASE_GATE_REGISTRY_PATH = REPO_ROOT / "governance" / "compat" / "CVF_PREPUBLIC_PHASE_GATE_REGISTRY.json"
ROOT_FILE_REGISTRY_PATH = REPO_ROOT / "governance" / "compat" / "CVF_ROOT_FILE_EXPOSURE_REGISTRY.json"
ROOT_REGISTRY_PATH = REPO_ROOT / "governance" / "compat" / "CVF_ROOT_FOLDER_LIFECYCLE_REGISTRY.json"
EXTENSION_REGISTRY_PATH = REPO_ROOT / "governance" / "compat" / "CVF_EXTENSION_LIFECYCLE_REGISTRY.json"
READINESS_DOC_PATH = REPO_ROOT / "docs" / "reference" / "CVF_PREPUBLIC_P3_READINESS.md"
DECISION_MEMO_PATH = REPO_ROOT / "docs" / "reference" / "CVF_PREPUBLIC_PUBLICATION_DECISION_MEMO_2026-04-02.md"
GUARD_DOC_PATH = REPO_ROOT / "governance" / "toolkit" / "05_OPERATION" / "CVF_PREPUBLIC_P3_READINESS_GUARD.md"
HOOK_CHAIN_PATH = REPO_ROOT / "governance" / "compat" / "run_local_governance_hook_chain.py"
WORKFLOW_PATH = REPO_ROOT / ".github" / "workflows" / "documentation-testing.yml"

REQUIRED_PHASES = {"P0", "P1", "P2"}
ALLOWED_PHASE_STATUSES = {"OPEN", "BLOCKED", "CLOSED"}
ALLOWED_EXPOSURE_CLASSES = {
    "PUBLIC_DOCS_ONLY",
    "PUBLIC_EXPORT_CANDIDATE",
    "INTERNAL_ONLY",
    "PRIVATE_ENTERPRISE_ONLY",
}
ALLOWED_PUBLIC_DOCS_AUDIT_STATUSES = {"CURATION_REQUIRED", "READY_FOR_PUBLIC_MIRROR"}
ALLOWED_EXPORT_READINESS = {"READY_FOR_EXPORT", "NEEDS_PACKAGING", "CONCEPT_ONLY"}


def _rel(path: Path) -> str:
    return path.relative_to(REPO_ROOT).as_posix()


def _read(path: Path) -> str:
    if not path.exists() or path.is_dir():
        return ""
    return path.read_text(encoding="utf-8")


def _read_json(path: Path) -> dict[str, Any]:
    return json.loads(path.read_text(encoding="utf-8"))


def _visible_root_files() -> list[str]:
    return sorted([child.name for child in REPO_ROOT.iterdir() if child.is_file()], key=str.lower)


def build_report() -> dict[str, Any]:
    violations: list[dict[str, str]] = []

    for path in (
        PHASE_GATE_REGISTRY_PATH,
        ROOT_FILE_REGISTRY_PATH,
        ROOT_REGISTRY_PATH,
        EXTENSION_REGISTRY_PATH,
        READINESS_DOC_PATH,
        DECISION_MEMO_PATH,
        GUARD_DOC_PATH,
        HOOK_CHAIN_PATH,
        WORKFLOW_PATH,
    ):
        if not path.exists():
            violations.append({"type": "required_artifact_missing", "path": _rel(path), "message": "Required P3 readiness artifact is missing."})

    if violations:
        return {
            "timestamp": dt.datetime.now(dt.timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z"),
            "violationCount": len(violations),
            "violations": violations,
            "compliant": False,
        }

    phase_registry = _read_json(PHASE_GATE_REGISTRY_PATH)
    root_file_registry = _read_json(ROOT_FILE_REGISTRY_PATH)
    root_registry = _read_json(ROOT_REGISTRY_PATH)
    extension_registry = _read_json(EXTENSION_REGISTRY_PATH)
    readiness_doc_text = _read(READINESS_DOC_PATH)
    decision_memo_text = _read(DECISION_MEMO_PATH)
    guard_doc_text = _read(GUARD_DOC_PATH)
    hook_chain_text = _read(HOOK_CHAIN_PATH)
    workflow_text = _read(WORKFLOW_PATH)

    phase_entries = phase_registry.get("phases", [])
    root_file_entries = root_file_registry.get("files", [])
    ignored_root_files = set(root_file_registry.get("ignoredRootFiles", []))
    root_entries = root_registry.get("roots", [])
    extension_entries = extension_registry.get("extensions", [])

    phase_names_seen: set[str] = set()
    root_file_paths_seen: set[str] = set()

    for status in phase_registry.get("allowedStatuses", []):
        status_id = status.get("id")
        if status_id not in ALLOWED_PHASE_STATUSES:
            violations.append({"type": "invalid_phase_status_id", "path": _rel(PHASE_GATE_REGISTRY_PATH), "message": f"Phase status `{status_id}` is invalid."})

    for entry in phase_entries:
        phase = entry.get("phase")
        status = entry.get("status")
        evidence = entry.get("evidence", [])
        if not phase or not status:
            violations.append({"type": "missing_phase_field", "path": _rel(PHASE_GATE_REGISTRY_PATH), "message": "Each phase entry must declare `phase` and `status`."})
            continue
        if status not in ALLOWED_PHASE_STATUSES:
            violations.append({"type": "invalid_phase_status", "path": _rel(PHASE_GATE_REGISTRY_PATH), "message": f"Phase `{phase}` uses invalid status `{status}`."})
        if phase in phase_names_seen:
            violations.append({"type": "duplicate_phase_entry", "path": _rel(PHASE_GATE_REGISTRY_PATH), "message": f"Phase `{phase}` appears more than once."})
        phase_names_seen.add(phase)
        if phase in REQUIRED_PHASES and status != "CLOSED":
            violations.append({"type": "phase_not_closed_for_p3", "path": _rel(PHASE_GATE_REGISTRY_PATH), "message": f"Phase `{phase}` must be `CLOSED` before `P3` readiness is satisfied."})
        if phase in REQUIRED_PHASES and not evidence:
            violations.append({"type": "phase_missing_evidence", "path": _rel(PHASE_GATE_REGISTRY_PATH), "message": f"Phase `{phase}` must cite evidence artifacts."})

    for required_phase in sorted(REQUIRED_PHASES):
        if required_phase not in phase_names_seen:
            violations.append({"type": "missing_required_phase", "path": _rel(PHASE_GATE_REGISTRY_PATH), "message": f"Required phase `{required_phase}` is missing from phase-gate registry."})

    for entry in root_file_entries:
        path = entry.get("path")
        exposure_class = entry.get("exposureClass")
        if not path or not exposure_class:
            violations.append({"type": "missing_root_file_field", "path": _rel(ROOT_FILE_REGISTRY_PATH), "message": "Each root file entry must declare `path` and `exposureClass`."})
            continue
        if exposure_class not in ALLOWED_EXPOSURE_CLASSES:
            violations.append({"type": "invalid_root_file_exposure", "path": _rel(ROOT_FILE_REGISTRY_PATH), "message": f"Root file `{path}` uses invalid exposure class `{exposure_class}`."})
        if path in root_file_paths_seen:
            violations.append({"type": "duplicate_root_file_entry", "path": _rel(ROOT_FILE_REGISTRY_PATH), "message": f"Root file `{path}` is classified more than once."})
        root_file_paths_seen.add(path)

    visible_root_files = _visible_root_files()
    for file_name in visible_root_files:
        if file_name in ignored_root_files:
            continue
        if file_name not in root_file_paths_seen:
            violations.append({"type": "unclassified_root_file", "path": file_name, "message": f"Visible root file `{file_name}` is not exposure-classified."})

    for entry in root_entries:
        path = entry.get("path")
        exposure_class = entry.get("exposureClass")
        if exposure_class == "PUBLIC_DOCS_ONLY":
            audit_status = entry.get("publicContentAuditStatus")
            audit_evidence = entry.get("publicContentAuditEvidence")
            if audit_status not in ALLOWED_PUBLIC_DOCS_AUDIT_STATUSES:
                violations.append({"type": "missing_public_docs_audit_status", "path": _rel(ROOT_REGISTRY_PATH), "message": f"PUBLIC_DOCS_ONLY root `{path}` must declare valid `publicContentAuditStatus`."})
            if not audit_evidence:
                violations.append({"type": "missing_public_docs_audit_evidence", "path": _rel(ROOT_REGISTRY_PATH), "message": f"PUBLIC_DOCS_ONLY root `{path}` must cite `publicContentAuditEvidence`."})

    for entry in extension_entries:
        path = entry.get("path")
        exposure_class = entry.get("exposureClass")
        if exposure_class == "PUBLIC_EXPORT_CANDIDATE":
            export_readiness = entry.get("exportReadiness")
            if export_readiness not in ALLOWED_EXPORT_READINESS:
                violations.append({"type": "missing_export_readiness", "path": _rel(EXTENSION_REGISTRY_PATH), "message": f"PUBLIC_EXPORT_CANDIDATE extension `{path}` must declare valid `exportReadiness`."})

    if "Re-assessment-By:" not in decision_memo_text:
        violations.append({"type": "decision_memo_missing_reassessment_boundary", "path": _rel(DECISION_MEMO_PATH), "message": "Publication decision memo must declare `Re-assessment-By:`."})
    if "`P3` must stay blocked" not in readiness_doc_text:
        violations.append({"type": "readiness_doc_missing_stop_boundary", "path": _rel(READINESS_DOC_PATH), "message": "P3 readiness reference must state that `P3` remains blocked until readiness conditions hold."})
    if "This guard does not itself authorize `P3`." not in guard_doc_text:
        violations.append({"type": "guard_doc_missing_non_authorization_clause", "path": _rel(GUARD_DOC_PATH), "message": "P3 readiness guard must state that it does not itself authorize `P3`."})
    if "check_prepublic_p3_readiness.py" not in hook_chain_text:
        violations.append({"type": "hook_chain_missing_enforcement", "path": _rel(HOOK_CHAIN_PATH), "message": "Local hook chain does not run pre-public P3 readiness."})
    if "check_prepublic_p3_readiness.py" not in workflow_text:
        violations.append({"type": "workflow_missing_enforcement", "path": _rel(WORKFLOW_PATH), "message": "CI workflow does not run pre-public P3 readiness."})

    return {
        "timestamp": dt.datetime.now(dt.timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z"),
        "phaseCount": len(phase_entries),
        "rootFileCount": len(root_file_paths_seen),
        "publicDocsRootCount": sum(1 for entry in root_entries if entry.get("exposureClass") == "PUBLIC_DOCS_ONLY"),
        "publicExportCandidateCount": sum(1 for entry in extension_entries if entry.get("exposureClass") == "PUBLIC_EXPORT_CANDIDATE"),
        "violationCount": len(violations),
        "violations": violations,
        "compliant": not violations,
    }


def main() -> int:
    parser = argparse.ArgumentParser(description="Check pre-public P3 readiness prerequisites")
    parser.add_argument("--enforce", action="store_true", help="Exit non-zero if violations exist")
    args = parser.parse_args()

    report = build_report()
    print("=== CVF Pre-Public P3 Readiness Gate ===")
    print(f"Phases checked: {report['phaseCount']}")
    print(f"Root files checked: {report['rootFileCount']}")
    print(f"PUBLIC_DOCS_ONLY roots checked: {report['publicDocsRootCount']}")
    print(f"PUBLIC_EXPORT_CANDIDATE extensions checked: {report['publicExportCandidateCount']}")
    print(f"Violations: {report['violationCount']}")
    print()
    if report["violations"]:
        for violation in report["violations"]:
            print(f"- {violation['type']}: {violation['message']}")
    else:
        print("? COMPLIANT - P3 preparation truth is explicit and machine-checked.")

    if args.enforce and not report["compliant"]:
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
