#!/usr/bin/env python3
from __future__ import annotations

import argparse
import datetime as dt
import json
import re
import sys
from pathlib import Path
from typing import Any


REPO_ROOT = Path(__file__).resolve().parents[2]
REGISTRY_PATH = REPO_ROOT / "governance" / "compat" / "CVF_SURFACE_SCAN_REGISTRY.json"
GUARD_PATH = REPO_ROOT / "governance" / "toolkit" / "05_OPERATION" / "CVF_SURFACE_SCAN_CONTINUITY_GUARD.md"
HANDOFF_PATH = REPO_ROOT / "AGENT_HANDOFF.md"
TRACKER_PATH = REPO_ROOT / "docs" / "reference" / "CVF_WHITEPAPER_PROGRESS_TRACKER.md"
BOOTSTRAP_PATH = REPO_ROOT / "docs" / "reference" / "CVF_SESSION_GOVERNANCE_BOOTSTRAP.md"
CONTEXT_MODEL_PATH = REPO_ROOT / "docs" / "reference" / "CVF_CONTEXT_CONTINUITY_MODEL.md"
HOOK_CHAIN_PATH = REPO_ROOT / "governance" / "compat" / "run_local_governance_hook_chain.py"
WORKFLOW_PATH = REPO_ROOT / ".github" / "workflows" / "documentation-testing.yml"
THIS_SCRIPT_PATH = "governance/compat/check_surface_scan_registry.py"

ALLOWED_STATUSES = {
    "FULLY_CLOSED",
    "PARTIALLY_CLOSED",
    "OPEN_CANDIDATE",
    "NOT_YET_SCANNED",
    "CLOSED_BY_DEFAULT",
}
REQUIRED_SURFACE_IDS = {
    "cpf_batch_barrel_families",
    "epf_dispatch_batch_wave",
    "gef_plane_scan",
    "lpf_plane_scan",
    "relocation_lane",
}
REQUIRED_SURFACE_FIELDS = (
    "id",
    "surfaceClass",
    "status",
    "lastScannedAt",
    "scopePaths",
    "canonicalSource",
    "nextAction",
    "reopenCondition",
    "evidenceRefs",
)
DATE_PATTERN = re.compile(r"^\d{4}-\d{2}-\d{2}$")


def _required_files() -> tuple[Path, ...]:
    return (
        REGISTRY_PATH,
        GUARD_PATH,
        HANDOFF_PATH,
        TRACKER_PATH,
        BOOTSTRAP_PATH,
        CONTEXT_MODEL_PATH,
        HOOK_CHAIN_PATH,
        WORKFLOW_PATH,
    )


def _required_markers() -> dict[Path, tuple[str, ...]]:
    return {
        GUARD_PATH: (
            "GC-041",
            "governance/compat/CVF_SURFACE_SCAN_REGISTRY.json",
            "AGENT_HANDOFF.md",
            "docs/reference/CVF_WHITEPAPER_PROGRESS_TRACKER.md",
            THIS_SCRIPT_PATH,
        ),
        HANDOFF_PATH: (
            "governance/compat/CVF_SURFACE_SCAN_REGISTRY.json",
            "Do not open a fresh tranche before consulting the canonical scan continuity registry.",
        ),
        TRACKER_PATH: (
            "governance/compat/CVF_SURFACE_SCAN_REGISTRY.json",
            "Canonical scan continuity registry",
        ),
        BOOTSTRAP_PATH: (
            "GC-041",
            "governance/compat/CVF_SURFACE_SCAN_REGISTRY.json",
        ),
        CONTEXT_MODEL_PATH: (
            "scan continuity registry",
        ),
        HOOK_CHAIN_PATH: (
            THIS_SCRIPT_PATH,
        ),
        WORKFLOW_PATH: (
            THIS_SCRIPT_PATH,
            "surface-scan-continuity",
            "Surface Scan Continuity",
        ),
    }


def _rel(path: Path) -> str:
    return path.relative_to(REPO_ROOT).as_posix()


def _read(path: Path) -> str:
    if not path.exists() or path.is_dir():
        return ""
    return path.read_text(encoding="utf-8", errors="replace")


def _read_json(path: Path) -> dict[str, Any]:
    return json.loads(path.read_text(encoding="utf-8"))


def build_report() -> dict[str, Any]:
    violations: list[dict[str, str]] = []
    required_files = _required_files()
    required_markers = _required_markers()

    missing_files = [_rel(path) for path in required_files if not path.exists()]
    for missing in missing_files:
        violations.append(
            {
                "type": "missing_required_file",
                "path": missing,
                "message": f"Required surface-scan continuity file is missing: `{missing}`.",
            }
        )

    for path, markers in required_markers.items():
        text = _read(path)
        if not text:
            continue
        for marker in markers:
            if marker not in text:
                violations.append(
                    {
                        "type": "missing_marker",
                        "path": _rel(path),
                        "message": f"`{_rel(path)}` is missing required marker: `{marker}`.",
                    }
                )

    registry = {"classes": [], "surfaces": []}
    if REGISTRY_PATH.exists():
        registry = _read_json(REGISTRY_PATH)

    classes = registry.get("classes", [])
    surfaces = registry.get("surfaces", [])
    if not isinstance(classes, list) or not isinstance(surfaces, list):
        violations.append(
            {
                "type": "invalid_registry_shape",
                "path": _rel(REGISTRY_PATH),
                "message": "Surface scan registry must expose `classes[]` and `surfaces[]` arrays.",
            }
        )
        classes = []
        surfaces = []

    class_ids: set[str] = set()
    for entry in classes:
        if not isinstance(entry, dict) or not entry.get("id") or not entry.get("description"):
            violations.append(
                {
                    "type": "invalid_class_entry",
                    "path": _rel(REGISTRY_PATH),
                    "message": "Each scan class entry must declare `id` and `description`.",
                }
            )
            continue
        class_ids.add(entry["id"])

    seen_surface_ids: set[str] = set()
    for entry in surfaces:
        if not isinstance(entry, dict):
            violations.append(
                {
                    "type": "invalid_surface_entry",
                    "path": _rel(REGISTRY_PATH),
                    "message": "Each scan surface entry must be an object.",
                }
            )
            continue

        missing = [field for field in REQUIRED_SURFACE_FIELDS if not entry.get(field)]
        if missing:
            violations.append(
                {
                    "type": "missing_surface_field",
                    "path": entry.get("id", "<missing-id>"),
                    "message": f"Surface entry is missing required fields: {', '.join(missing)}.",
                }
            )
            continue

        surface_id = entry["id"]
        if surface_id in seen_surface_ids:
            violations.append(
                {
                    "type": "duplicate_surface_id",
                    "path": surface_id,
                    "message": f"Duplicate surface id `{surface_id}` in scan registry.",
                }
            )
        seen_surface_ids.add(surface_id)

        if entry["surfaceClass"] not in class_ids:
            violations.append(
                {
                    "type": "unknown_surface_class",
                    "path": surface_id,
                    "message": f"Surface `{surface_id}` uses unknown class `{entry['surfaceClass']}`.",
                }
            )

        if entry["status"] not in ALLOWED_STATUSES:
            violations.append(
                {
                    "type": "invalid_surface_status",
                    "path": surface_id,
                    "message": f"Surface `{surface_id}` uses invalid status `{entry['status']}`.",
                }
            )

        if not DATE_PATTERN.match(str(entry["lastScannedAt"])):
            violations.append(
                {
                    "type": "invalid_scan_date",
                    "path": surface_id,
                    "message": f"Surface `{surface_id}` must use `YYYY-MM-DD` for `lastScannedAt`.",
                }
            )

        for field_name in ("scopePaths", "evidenceRefs"):
            values = entry.get(field_name, [])
            if not isinstance(values, list) or not values:
                violations.append(
                    {
                        "type": "invalid_path_list",
                        "path": surface_id,
                        "message": f"Surface `{surface_id}` must declare a non-empty `{field_name}` list.",
                    }
                )
                continue
            for rel_path in values:
                candidate = REPO_ROOT / rel_path
                if not candidate.exists():
                    violations.append(
                        {
                            "type": "missing_referenced_path",
                            "path": surface_id,
                            "message": f"Surface `{surface_id}` references missing path `{rel_path}` in `{field_name}`.",
                        }
                    )

        canonical_source = entry["canonicalSource"]
        if canonical_source not in entry["evidenceRefs"]:
            violations.append(
                {
                    "type": "canonical_source_not_in_evidence",
                    "path": surface_id,
                    "message": f"Surface `{surface_id}` must include `{canonical_source}` in `evidenceRefs`.",
                }
            )

    for required_id in sorted(REQUIRED_SURFACE_IDS):
        if required_id not in seen_surface_ids:
            violations.append(
                {
                    "type": "required_surface_missing",
                    "path": required_id,
                    "message": f"Canonical scan registry is missing required surface `{required_id}`.",
                }
            )

    return {
        "timestamp": dt.datetime.now(dt.timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z"),
        "registryPath": _rel(REGISTRY_PATH),
        "surfaceCount": len(surfaces),
        "surfaceIds": sorted(seen_surface_ids),
        "violationCount": len(violations),
        "violations": violations,
        "compliant": not violations,
    }


def _print_report(report: dict[str, Any]) -> None:
    print("=== CVF Surface Scan Continuity Gate ===")
    print(f"Registry: {report['registryPath']}")
    print(f"Surfaces: {report['surfaceCount']}")
    print(f"Violations: {report['violationCount']}")

    if report["violations"]:
        print("\n❌ Violations:")
        for violation in report["violations"]:
            print(f"  - [{violation['type']}] {violation['message']}")
    else:
        print("\n✅ COMPLIANT — canonical scan continuity registry and its continuity pointers are aligned.")


def main() -> int:
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(errors="replace")
    if hasattr(sys.stderr, "reconfigure"):
        sys.stderr.reconfigure(errors="replace")

    parser = argparse.ArgumentParser(description="Check surface scan continuity registry")
    parser.add_argument("--enforce", action="store_true")
    parser.add_argument("--json", action="store_true")
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
