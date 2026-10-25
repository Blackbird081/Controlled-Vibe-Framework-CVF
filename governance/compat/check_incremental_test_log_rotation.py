#!/usr/bin/env python3
"""
CVF Incremental Test Log Rotation Guard

Ensures the active incremental test log stays within the
approved active-window thresholds and that archive files
follow the canonical naming/location model.

Policy:
  governance/toolkit/05_OPERATION/CVF_INCREMENTAL_TEST_LOG_ROTATION_GUARD.md
"""

from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path


REPO_ROOT = Path(__file__).resolve().parents[2]
ACTIVE_LOG_PATH = REPO_ROOT / "docs" / "CVF_INCREMENTAL_TEST_LOG.md"
ARCHIVE_DIR = REPO_ROOT / "docs" / "logs"
ARCHIVE_PATTERN = re.compile(r"^CVF_INCREMENTAL_TEST_LOG_ARCHIVE_\d{4}_PART_\d{2}\.md$")
POLICY_PATH = "governance/toolkit/05_OPERATION/CVF_INCREMENTAL_TEST_LOG_ROTATION_GUARD.md"
MAX_ACTIVE_LINES = 3000
MAX_ACTIVE_BATCHES = 100
PUBLIC_LOG_BATCH_PATTERN = re.compile(r"^## Batch:", re.MULTILINE)
PUBLIC_REQUIRED_FILES = (
    "docs/CVF_INCREMENTAL_TEST_LOG.md",
    "governance/toolkit/05_OPERATION/CVF_INCREMENTAL_TEST_LOG_ROTATION_GUARD.md",
    "governance/compat/CVF_ACTIVE_WINDOW_REGISTRY.json",
    "governance/toolkit/05_OPERATION/CVF_ACTIVE_WINDOW_REGISTRY_GUARD.md",
    "docs/reference/CVF_ACTIVE_WINDOW_CLASSIFICATION.md",
)
PUBLIC_LOG_REQUIRED_MARKERS = (
    "# CVF Incremental Test Log",
    "Memory class: SUMMARY_RECORD",
    "Status: CURRENT",
    "public-sync test activity for changed source/test batches",
    "intentionally compact and does not mirror private provenance logs",
    "## Scope / Target / Owner Boundary",
    "## Protocol / Contract / Requirements",
    "## Evidence / Verification",
    "Raw provider transcripts, private handoffs, and private provenance logs remain outside this public log.",
    "## Claim Boundary",
)
PUBLIC_ROTATION_GUARD_REQUIRED_MARKERS = (
    "docs/CVF_INCREMENTAL_TEST_LOG.md",
    "active file line count `> 3000`",
    "active batch count `> 100`",
    "CVF_INCREMENTAL_TEST_LOG_ARCHIVE_<YYYY>_PART_<NN>.md",
    "The active file stays the first file every tester must read.",
)
PUBLIC_WINDOW_FIELDS = {
    "id": "incremental_test_log_active_window",
    "windowClass": "GLOBAL_APPEND_ONLY_LOG_WINDOW",
    "activePath": "docs/CVF_INCREMENTAL_TEST_LOG.md",
    "archiveDir": "docs/logs",
    "archivePattern": r"^CVF_INCREMENTAL_TEST_LOG_ARCHIVE_\d{4}_PART_\d{2}\.md$",
    "rotationGuard": "governance/toolkit/05_OPERATION/CVF_INCREMENTAL_TEST_LOG_ROTATION_GUARD.md",
    "rotationCheck": "governance/compat/check_incremental_test_log_rotation.py",
    "protectionMode": "PERMANENT_ACTIVE_WINDOW",
    "status": "ACTIVE",
}


def _count_lines(path: Path) -> int:
    return len(path.read_text(encoding="utf-8").splitlines())


def _count_batches(path: Path) -> int:
    content = path.read_text(encoding="utf-8")
    return len(re.findall(r"^## \[\d{4}-\d{2}-\d{2}\] Batch:", content, re.MULTILINE))


def _collect_archives() -> list[Path]:
    if not ARCHIVE_DIR.exists():
        return []
    return sorted(
        [
            path
            for path in ARCHIVE_DIR.glob("CVF_INCREMENTAL_TEST_LOG_ARCHIVE_*.md")
            if path.is_file()
        ]
    )


def _require_public_projection() -> str | None:
    try:
        from guard_binding_catalog import require_public_projection
    except ModuleNotFoundError:
        from governance.compat.guard_binding_catalog import require_public_projection
    try:
        require_public_projection(REPO_ROOT)
    except ValueError as exc:
        return str(exc)
    return None


def _validate_public() -> dict[str, object]:
    violations: list[dict[str, str]] = []
    mismatch = _require_public_projection()
    if mismatch:
        violations.append({
            "type": "public_carrier_mismatch",
            "message": mismatch,
        })

    required_paths = {rel: REPO_ROOT / rel for rel in PUBLIC_REQUIRED_FILES}
    missing = [rel for rel, path in required_paths.items() if not path.is_file()]
    for rel_path in missing:
        violations.append({
            "type": "missing_public_required_file",
            "message": f"Required public incremental-log contract file is missing: `{rel_path}`.",
        })
    if missing:
        return {
            "profile": "public",
            "activeLogPath": "docs/CVF_INCREMENTAL_TEST_LOG.md",
            "archiveDir": "docs/logs",
            "activeLineCount": 0,
            "activeBatchCount": 0,
            "archiveCount": None,
            "archiveFiles": [],
            "archiveScanStatus": "not_applicable_private_archives",
            "violations": violations,
            "violationCount": len(violations),
            "compliant": False,
        }

    active_text = required_paths["docs/CVF_INCREMENTAL_TEST_LOG.md"].read_text(encoding="utf-8", errors="replace")
    policy_text = required_paths[
        "governance/toolkit/05_OPERATION/CVF_INCREMENTAL_TEST_LOG_ROTATION_GUARD.md"
    ].read_text(encoding="utf-8", errors="replace")
    normalized_active_text = " ".join(active_text.split())
    normalized_policy_text = " ".join(policy_text.split())
    for marker in PUBLIC_LOG_REQUIRED_MARKERS:
        if " ".join(marker.split()) not in normalized_active_text:
            violations.append({
                "type": "missing_public_log_contract_marker",
                "message": f"Public incremental test log is missing required marker `{marker}`.",
            })
    for marker in PUBLIC_ROTATION_GUARD_REQUIRED_MARKERS:
        if " ".join(marker.split()) not in normalized_policy_text:
            violations.append({
                "type": "missing_public_rotation_contract_marker",
                "message": f"Public rotation guard is missing required marker `{marker}`.",
            })

    active_line_count = len(active_text.splitlines())
    active_batch_count = len(PUBLIC_LOG_BATCH_PATTERN.findall(active_text))
    if active_batch_count == 0:
        violations.append({
            "type": "missing_public_batch_entry",
            "message": "Compact public incremental test log must retain at least one `## Batch:` entry.",
        })
    if active_line_count > MAX_ACTIVE_LINES:
        violations.append({
            "type": "active_line_threshold",
            "message": f"Public active log has {active_line_count} lines, exceeding the {MAX_ACTIVE_LINES}-line threshold.",
        })
    if active_batch_count > MAX_ACTIVE_BATCHES:
        violations.append({
            "type": "active_batch_threshold",
            "message": f"Public active log has {active_batch_count} batches, exceeding the {MAX_ACTIVE_BATCHES}-batch threshold.",
        })

    registry_path = required_paths["governance/compat/CVF_ACTIVE_WINDOW_REGISTRY.json"]
    try:
        registry = json.loads(registry_path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as exc:
        registry = {}
        violations.append({
            "type": "invalid_public_window_registry",
            "message": f"Public active-window registry is unreadable JSON: {exc}.",
        })
    classes = registry.get("classes", []) if isinstance(registry, dict) else []
    windows = registry.get("windows", []) if isinstance(registry, dict) else []
    if not isinstance(classes, list) or not any(
        isinstance(item, dict) and item.get("id") == "GLOBAL_APPEND_ONLY_LOG_WINDOW" for item in classes
    ):
        violations.append({
            "type": "missing_public_window_class",
            "message": "Public active-window registry must declare GLOBAL_APPEND_ONLY_LOG_WINDOW.",
        })
    matching_windows = [
        item for item in windows
        if isinstance(item, dict) and item.get("activePath") == PUBLIC_WINDOW_FIELDS["activePath"]
    ] if isinstance(windows, list) else []
    if len(matching_windows) != 1:
        violations.append({
            "type": "public_window_registration_count",
            "message": "Public active-window registry must contain exactly one incremental test-log window.",
        })
    elif any(matching_windows[0].get(field) != expected for field, expected in PUBLIC_WINDOW_FIELDS.items()):
        violations.append({
            "type": "public_window_registration_mismatch",
            "message": "Public incremental test-log window fields do not match its declared rotation contract.",
        })

    return {
        "profile": "public",
        "activeLogPath": "docs/CVF_INCREMENTAL_TEST_LOG.md",
        "archiveDir": "docs/logs",
        "activeLineCount": active_line_count,
        "activeBatchCount": active_batch_count,
        "archiveCount": None,
        "archiveFiles": [],
        "archiveScanStatus": "not_applicable_private_archives",
        "publicWindowRegistrationStatus": "checked",
        "privateRotationExecutionStatus": "not_applicable_private_effect_executor",
        "privateArchiveEvidenceStatus": "not_applicable_public_profile",
        "claimBoundary": "PUBLIC_COMPACT_LOG_CONTRACT_AND_SIZE_ONLY_NOT_PRIVATE_ARCHIVE_READINESS",
        "violations": violations,
        "violationCount": len(violations),
        "compliant": len(violations) == 0,
    }


def _validate(profile: str = "private") -> dict[str, object]:
    if profile not in {"private", "public"}:
        raise ValueError(f"Unsupported incremental test-log profile: {profile}")
    if profile == "public":
        return _validate_public()
    violations: list[dict[str, str]] = []

    if not ACTIVE_LOG_PATH.exists():
        violations.append(
            {
                "type": "missing_active_log",
                "message": "docs/CVF_INCREMENTAL_TEST_LOG.md is missing.",
            }
        )
        return {
            "activeLogPath": str(ACTIVE_LOG_PATH.relative_to(REPO_ROOT)).replace("\\", "/"),
            "archiveDir": str(ARCHIVE_DIR.relative_to(REPO_ROOT)).replace("\\", "/"),
            "activeLineCount": 0,
            "activeBatchCount": 0,
            "archiveCount": 0,
            "archiveFiles": [],
            "violations": violations,
            "violationCount": len(violations),
            "compliant": False,
        }

    active_line_count = _count_lines(ACTIVE_LOG_PATH)
    active_batch_count = _count_batches(ACTIVE_LOG_PATH)
    archives = _collect_archives()

    if active_line_count > MAX_ACTIVE_LINES:
        violations.append(
            {
                "type": "active_line_threshold",
                "message": (
                    f"Active log has {active_line_count} lines, exceeding the {MAX_ACTIVE_LINES}-line threshold."
                ),
            }
        )

    if active_batch_count > MAX_ACTIVE_BATCHES:
        violations.append(
            {
                "type": "active_batch_threshold",
                "message": (
                    f"Active log has {active_batch_count} batch entries, exceeding the {MAX_ACTIVE_BATCHES}-batch threshold."
                ),
            }
        )

    archive_files: list[str] = []
    for archive in archives:
        archive_files.append(str(archive.relative_to(REPO_ROOT)).replace("\\", "/"))
        if not ARCHIVE_PATTERN.match(archive.name):
            violations.append(
                {
                    "type": "archive_naming",
                    "message": (
                        f"`{archive.name}` does not match the required archive naming pattern."
                    ),
                }
            )

    return {
        "activeLogPath": str(ACTIVE_LOG_PATH.relative_to(REPO_ROOT)).replace("\\", "/"),
        "archiveDir": str(ARCHIVE_DIR.relative_to(REPO_ROOT)).replace("\\", "/"),
        "activeLineCount": active_line_count,
        "activeBatchCount": active_batch_count,
        "archiveCount": len(archives),
        "archiveFiles": archive_files,
        "violations": violations,
        "violationCount": len(violations),
        "compliant": len(violations) == 0,
    }


def _print_report(report: dict[str, object]) -> None:
    print("=== CVF Incremental Test Log Rotation Guard ===")
    print(f"Active log: {report['activeLogPath']}")
    print(f"Archive dir: {report['archiveDir']}")
    print(f"Active line count: {report['activeLineCount']}")
    print(f"Active batch count: {report['activeBatchCount']}")
    print(f"Archive files: {report['archiveCount']}")

    if report["archiveFiles"]:
        print("\nArchive files:")
        for archive in report["archiveFiles"]:
            print(f"  - {archive}")

    if report["violations"]:
        print("\nViolations:")
        for violation in report["violations"]:
            print(f"  - {violation['type']}: {violation['message']}")

    if report["compliant"]:
        print("\n✅ COMPLIANT — Active incremental test log is within rotation thresholds.")
    else:
        print("\n❌ VIOLATION — Incremental test log rotation is required or archive naming is invalid.")
        print(f"   See: {POLICY_PATH}")


def main() -> int:
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(errors="replace")
    if hasattr(sys.stderr, "reconfigure"):
        sys.stderr.reconfigure(errors="replace")

    parser = argparse.ArgumentParser(
        description="CVF incremental test log rotation guard"
    )
    parser.add_argument("--enforce", action="store_true", help="Exit 2 on violation")
    parser.add_argument("--json", action="store_true", help="Print JSON instead of text")
    parser.add_argument("--profile", choices=("private", "public"), default="private")
    args = parser.parse_args()

    report = _validate(profile=args.profile)

    if args.json:
        print(json.dumps(report, indent=2))
    else:
        _print_report(report)

    if args.enforce and not report["compliant"]:
        return 2
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
