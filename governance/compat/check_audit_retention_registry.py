#!/usr/bin/env python3
"""
CVF Audit Retention Registry Compatibility Gate

Validates the stricter retention classification for `docs/audits/` so the
generic archive flow can distinguish:
- recent active audits
- historical retain-evidence audits
- historical audits that are safe to archive
"""

from __future__ import annotations

import argparse
import datetime as dt
import importlib.util
import json
import sys
from pathlib import Path
from typing import Any
from unittest.mock import patch


REPO_ROOT = Path(__file__).resolve().parents[2]
ARCHIVE_MODULE_PATH = REPO_ROOT / "scripts" / "cvf_active_archive.py"
REQUIRED_CLASS_IDS = {
    "ACTIVE_RECENT_AUDIT",
    "RETAIN_EVIDENCE_AUDIT",
    "SAFE_TO_ARCHIVE_AUDIT",
}


def _load_archive_module():
    spec = importlib.util.spec_from_file_location("cvf_active_archive", ARCHIVE_MODULE_PATH)
    if spec is None or spec.loader is None:
        raise RuntimeError(f"Unable to load archive module from {ARCHIVE_MODULE_PATH}")
    module = importlib.util.module_from_spec(spec)
    sys.modules.setdefault(spec.name, module)
    spec.loader.exec_module(module)
    return module


ARCHIVE_MODULE = _load_archive_module()


def _rel(path: Path) -> str:
    return path.relative_to(REPO_ROOT).as_posix()


def _registry_path() -> Path:
    return REPO_ROOT / "governance" / "compat" / "CVF_AUDIT_RETENTION_REGISTRY.json"


def _active_window_registry_path() -> Path:
    return REPO_ROOT / "governance" / "compat" / "CVF_ACTIVE_WINDOW_REGISTRY.json"


def _audits_root() -> Path:
    return REPO_ROOT / "docs" / "audits"


def _read_json(path: Path) -> dict[str, Any]:
    return json.loads(path.read_text(encoding="utf-8"))


def _normalize_registry_paths(raw_paths: list[Any], violations: list[dict[str, str]]) -> list[str]:
    normalized: list[str] = []
    seen: set[str] = set()
    cutoff = dt.datetime.now() - dt.timedelta(days=ARCHIVE_MODULE.AGE_THRESHOLD_DAYS)

    for entry in raw_paths:
        if not isinstance(entry, str) or not entry:
            violations.append(
                {
                    "type": "invalid_registry_entry",
                    "path": _rel(_registry_path()),
                    "message": "retainEvidencePaths entries must be non-empty strings.",
                }
            )
            continue

        candidate = entry.replace("\\", "/")
        if candidate in seen:
            violations.append(
                {
                    "type": "duplicate_retain_evidence_path",
                    "path": _rel(_registry_path()),
                    "message": f"Duplicate retain-evidence audit path `{candidate}`.",
                }
            )
            continue
        seen.add(candidate)
        normalized.append(candidate)

        if not candidate.startswith("docs/audits/"):
            violations.append(
                {
                    "type": "invalid_retain_evidence_scope",
                    "path": _rel(_registry_path()),
                    "message": f"Retain-evidence path `{candidate}` must stay under `docs/audits/`.",
                }
            )
            continue

        candidate_path = REPO_ROOT / Path(candidate)
        if not candidate_path.exists():
            violations.append(
                {
                    "type": "missing_retain_evidence_file",
                    "path": _rel(_registry_path()),
                    "message": f"Retain-evidence path `{candidate}` does not exist.",
                }
            )
            continue

        file_date = ARCHIVE_MODULE.extract_date_from_filename(candidate_path.name)
        if file_date is None:
            violations.append(
                {
                    "type": "retain_evidence_missing_date_suffix",
                    "path": _rel(_registry_path()),
                    "message": f"Retain-evidence path `{candidate}` is missing a dated filename suffix.",
                }
            )
            continue

        if file_date > cutoff:
            violations.append(
                {
                    "type": "retain_evidence_not_historical",
                    "path": _rel(_registry_path()),
                    "message": f"Retain-evidence path `{candidate}` is still within the active date window.",
                }
            )

    return normalized


def _compute_dynamic_blocked_audits() -> tuple[set[str], dict[str, int]]:
    cutoff = dt.datetime.now() - dt.timedelta(days=ARCHIVE_MODULE.AGE_THRESHOLD_DAYS)
    with patch.object(ARCHIVE_MODULE, "PROJECT_ROOT", REPO_ROOT), patch.object(
        ARCHIVE_MODULE, "ACTIVE_WINDOW_REGISTRY_PATH", _active_window_registry_path()
    ), patch.object(ARCHIVE_MODULE, "AUDIT_RETENTION_REGISTRY_PATH", _registry_path()):
        ARCHIVE_MODULE.load_active_window_paths.cache_clear()
        ARCHIVE_MODULE.load_audit_retain_evidence_paths.cache_clear()
        scan = ARCHIVE_MODULE.scan_root(_audits_root(), cutoff)
        candidates = scan.archive_candidates

        with patch.object(ARCHIVE_MODULE, "load_audit_retain_evidence_paths", return_value=set()):
            risks, _ = ARCHIVE_MODULE.build_full_plan(cutoff, {"docs/audits": scan}, candidates)

        blocked = {
            rel_path
            for rel_path, risk in risks.items()
            if risk.blocked
        }
        counts = {
            "activeRecentCount": len(scan.active),
            "retainEvidenceCandidateCount": len(blocked),
            "safeToArchiveCount": sum(1 for rel_path in risks if rel_path not in blocked),
        }

        ARCHIVE_MODULE.load_active_window_paths.cache_clear()
        ARCHIVE_MODULE.load_audit_retain_evidence_paths.cache_clear()
        return blocked, counts


def build_report() -> dict[str, Any]:
    timestamp = dt.datetime.now(dt.timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")
    violations: list[dict[str, str]] = []
    registry_path = _registry_path()

    if not registry_path.exists():
        return {
            "timestamp": timestamp,
            "registryPath": _rel(registry_path),
            "violationCount": 1,
            "violations": [
                {
                    "type": "registry_missing",
                    "path": _rel(registry_path),
                    "message": "Audit retention registry is missing.",
                }
            ],
            "compliant": False,
        }

    registry = _read_json(registry_path)
    classes = registry.get("classes", [])
    if not isinstance(classes, list):
        violations.append(
            {
                "type": "invalid_classes_shape",
                "path": _rel(registry_path),
                "message": "Registry `classes` must be an array.",
            }
        )
        classes = []

    class_ids = {entry.get("id") for entry in classes if isinstance(entry, dict) and entry.get("id")}
    missing_class_ids = sorted(REQUIRED_CLASS_IDS - class_ids)
    for class_id in missing_class_ids:
        violations.append(
            {
                "type": "missing_required_class",
                "path": _rel(registry_path),
                "message": f"Audit retention registry is missing required class `{class_id}`.",
            }
        )

    retain_paths = registry.get("retainEvidencePaths", [])
    if not isinstance(retain_paths, list):
        violations.append(
            {
                "type": "invalid_retain_evidence_shape",
                "path": _rel(registry_path),
                "message": "Registry `retainEvidencePaths` must be an array.",
            }
        )
        retain_paths = []

    normalized_retain_paths = _normalize_registry_paths(retain_paths, violations)

    summary = registry.get("summary", {})
    if isinstance(summary, dict):
        summary_count = summary.get("retainEvidenceCount")
        if summary_count is not None and summary_count != len(normalized_retain_paths):
            violations.append(
                {
                    "type": "retain_evidence_count_mismatch",
                    "path": _rel(registry_path),
                    "message": (
                        "Registry summary retainEvidenceCount does not match the number of "
                        f"retainEvidencePaths ({summary_count} != {len(normalized_retain_paths)})."
                    ),
                }
            )

    dynamic_blocked, dynamic_counts = _compute_dynamic_blocked_audits()
    missing_registry_paths = sorted(dynamic_blocked - set(normalized_retain_paths))
    for path in missing_registry_paths:
        violations.append(
            {
                "type": "missing_dynamic_retain_evidence_entry",
                "path": _rel(registry_path),
                "message": (
                    f"Historical audit `{path}` is dynamically blocked from archive by live references "
                    "but is not registered as retain-evidence."
                ),
            }
        )

    return {
        "timestamp": timestamp,
        "registryPath": _rel(registry_path),
        "requiredClassIds": sorted(REQUIRED_CLASS_IDS),
        "registeredRetainEvidenceCount": len(normalized_retain_paths),
        "dynamicCounts": dynamic_counts,
        "missingDynamicRetainEvidencePaths": missing_registry_paths,
        "violationCount": len(violations),
        "violations": violations,
        "compliant": not violations,
    }


def main() -> int:
    parser = argparse.ArgumentParser(description="Validate the CVF audit retention registry.")
    parser.add_argument("--enforce", action="store_true", help="Return non-zero exit code on violations.")
    args = parser.parse_args()

    report = build_report()
    print(json.dumps(report, indent=2))
    if args.enforce and not report["compliant"]:
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
