#!/usr/bin/env python3
"""
CVF Conformance Trace Rotation Guard
"""

from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path


REPO_ROOT = Path(__file__).resolve().parents[2]
ACTIVE_TRACE = REPO_ROOT / "docs" / "reviews" / "cvf_phase_governance" / "CVF_CONFORMANCE_TRACE_2026-03-07.md"
ARCHIVE_DIR = REPO_ROOT / "docs" / "reviews" / "cvf_phase_governance" / "logs"
ARCHIVE_PATTERN = re.compile(r"^CVF_CONFORMANCE_TRACE_ARCHIVE_\d{4}_PART_\d{2}\.md$")
POLICY_PATH = "governance/toolkit/05_OPERATION/CVF_CONFORMANCE_TRACE_ROTATION_GUARD.md"
MAX_ACTIVE_LINES = 1200
MAX_ACTIVE_BATCHES = 60
ARCHIVE_INDEX_MARKER = "## Archive Index"


def _count_lines(path: Path) -> int:
    return len(path.read_text(encoding="utf-8").splitlines())


def _count_batches(path: Path) -> int:
    content = path.read_text(encoding="utf-8")
    return len(re.findall(r"^## Batch \d+ - ", content, re.MULTILINE))


def _collect_archives() -> list[Path]:
    if not ARCHIVE_DIR.exists():
        return []
    return sorted(
        path for path in ARCHIVE_DIR.glob("CVF_CONFORMANCE_TRACE_ARCHIVE_*.md") if path.is_file()
    )


def _validate() -> dict[str, object]:
    violations: list[dict[str, str]] = []

    if not ACTIVE_TRACE.exists():
        violations.append({"type": "missing_active_trace", "message": "Active conformance trace is missing."})
        return {
            "activeTracePath": str(ACTIVE_TRACE.relative_to(REPO_ROOT)).replace("\\", "/"),
            "archiveDir": str(ARCHIVE_DIR.relative_to(REPO_ROOT)).replace("\\", "/"),
            "activeLineCount": 0,
            "activeBatchCount": 0,
            "archiveCount": 0,
            "archiveFiles": [],
            "violations": violations,
            "violationCount": len(violations),
            "compliant": False,
        }

    content = ACTIVE_TRACE.read_text(encoding="utf-8")
    active_line_count = len(content.splitlines())
    active_batch_count = _count_batches(ACTIVE_TRACE)
    archives = _collect_archives()

    if ARCHIVE_INDEX_MARKER not in content:
        violations.append(
            {
                "type": "missing_archive_index",
                "message": "Active conformance trace does not expose an archive index section.",
            }
        )

    if active_line_count > MAX_ACTIVE_LINES:
        violations.append(
            {
                "type": "active_line_threshold",
                "message": f"Active conformance trace has {active_line_count} lines, exceeding {MAX_ACTIVE_LINES}.",
            }
        )

    if active_batch_count > MAX_ACTIVE_BATCHES:
        violations.append(
            {
                "type": "active_batch_threshold",
                "message": f"Active conformance trace has {active_batch_count} batches, exceeding {MAX_ACTIVE_BATCHES}.",
            }
        )

    archive_files: list[str] = []
    for archive in archives:
        archive_files.append(str(archive.relative_to(REPO_ROOT)).replace("\\", "/"))
        if not ARCHIVE_PATTERN.match(archive.name):
            violations.append(
                {
                    "type": "archive_naming",
                    "message": f"`{archive.name}` does not match the required archive naming pattern.",
                }
            )

    return {
        "activeTracePath": str(ACTIVE_TRACE.relative_to(REPO_ROOT)).replace("\\", "/"),
        "archiveDir": str(ARCHIVE_DIR.relative_to(REPO_ROOT)).replace("\\", "/"),
        "activeLineCount": active_line_count,
        "activeBatchCount": active_batch_count,
        "archiveCount": len(archives),
        "archiveFiles": archive_files,
        "violations": violations,
        "violationCount": len(violations),
        "compliant": len(violations) == 0,
    }


def _print(report: dict[str, object]) -> None:
    print("=== CVF Conformance Trace Rotation Guard ===")
    print(f"Active trace: {report['activeTracePath']}")
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
        print("\n✅ COMPLIANT — Active conformance trace is within rotation thresholds.")
    else:
        print("\n❌ VIOLATION — Conformance trace rotation is required or archive metadata is invalid.")
        print(f"   See: {POLICY_PATH}")


def main() -> int:
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(errors="replace")
    if hasattr(sys.stderr, "reconfigure"):
        sys.stderr.reconfigure(errors="replace")

    parser = argparse.ArgumentParser(description="CVF conformance trace rotation guard")
    parser.add_argument("--enforce", action="store_true")
    parser.add_argument("--json", action="store_true")
    args = parser.parse_args()

    report = _validate()
    if args.json:
        print(json.dumps(report, indent=2))
    else:
        _print(report)

    if args.enforce and not report["compliant"]:
        return 2
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
