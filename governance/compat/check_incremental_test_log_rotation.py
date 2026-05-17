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


def _validate() -> dict[str, object]:
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
    args = parser.parse_args()

    report = _validate()

    if args.json:
        print(json.dumps(report, indent=2))
    else:
        _print_report(report)

    if args.enforce and not report["compliant"]:
        return 2
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
