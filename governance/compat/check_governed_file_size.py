#!/usr/bin/env python3
"""
CVF governed file size guard.

Keeps governed files reviewable by enforcing class-specific line-count
thresholds with an explicit exception registry for legacy debt.
"""

from __future__ import annotations

import argparse
import json
import subprocess
import sys
from pathlib import Path
from typing import Any


REPO_ROOT = Path(__file__).resolve().parents[2]
DEFAULT_REGISTRY = REPO_ROOT / "governance" / "compat" / "CVF_GOVERNED_FILE_SIZE_EXCEPTION_REGISTRY.json"
POLICY_PATH = "governance/toolkit/05_OPERATION/CVF_GOVERNED_FILE_SIZE_GUARD.md"
EXCLUDED_PREFIXES = (
    "docs/logs/",
    "docs/reviews/cvf_phase_governance/logs/",
    "governance/compat/",
    "scripts/",
)
EXCLUDED_EXACT = {
    "docs/CVF_INCREMENTAL_TEST_LOG.md",
}
CODE_EXTENSIONS = {".ts", ".tsx", ".js", ".jsx"}
MARKDOWN_EXTENSIONS = {".md"}


def _rel(path: Path) -> str:
    return str(path.relative_to(REPO_ROOT)).replace("\\", "/")


def _read_json(path: Path) -> dict[str, Any]:
    return json.loads(path.read_text(encoding="utf-8"))


def _count_lines(path: Path) -> int:
    with path.open("r", encoding="utf-8", errors="replace") as handle:
        return sum(1 for _ in handle)


def _git_files(args: list[str]) -> list[str]:
    proc = subprocess.run(
        ["git", *args],
        cwd=REPO_ROOT,
        capture_output=True,
        text=True,
        check=True,
    )
    return [line.strip() for line in proc.stdout.splitlines() if line.strip()]


def _iter_candidate_files() -> list[Path]:
    tracked = set(_git_files(["ls-files"]))
    untracked = set(_git_files(["ls-files", "--others", "--exclude-standard"]))
    files: list[Path] = []
    for rel_path in sorted(tracked | untracked):
        path = REPO_ROOT / rel_path
        if path.is_file():
            files.append(path)
    return files


def _is_excluded(rel_path: str) -> bool:
    if rel_path in EXCLUDED_EXACT:
        return True
    if any(rel_path.startswith(prefix) for prefix in EXCLUDED_PREFIXES):
        return True
    if "/archive/" in rel_path:
        return True
    return False


def _classify(rel_path: str) -> str | None:
    if _is_excluded(rel_path):
        return None

    suffix = Path(rel_path).suffix.lower()
    lower = rel_path.lower()

    if suffix in MARKDOWN_EXTENSIONS:
        return "active_markdown"

    if suffix not in CODE_EXTENSIONS:
        return None

    if ".test." in lower or "/tests/" in lower:
        return "test_code"

    if suffix in {".tsx", ".jsx"}:
        return "frontend_component"

    return "general_source"


def build_report(registry_path: Path) -> dict[str, Any]:
    if not registry_path.exists():
        return {
            "registryPath": str(registry_path),
            "violationCount": 1,
            "advisoryCount": 0,
            "violations": [
                {
                    "type": "registry_missing",
                    "path": str(registry_path),
                    "message": "Governed file size exception registry is missing.",
                }
            ],
            "advisories": [],
            "compliant": False,
        }

    registry = _read_json(registry_path)
    thresholds = registry.get("thresholds", {})
    exception_map = {
        entry["path"]: entry
        for entry in registry.get("exceptions", [])
        if isinstance(entry, dict) and entry.get("path")
    }

    violations: list[dict[str, Any]] = []
    advisories: list[dict[str, Any]] = []
    files_report: list[dict[str, Any]] = []

    for path in _iter_candidate_files():
        rel_path = _rel(path)
        file_class = _classify(rel_path)
        if not file_class:
            continue

        threshold = thresholds.get(file_class, {})
        soft = int(threshold.get("softThresholdLines", 0) or 0)
        hard = int(threshold.get("hardThresholdLines", 0) or 0)
        lines = _count_lines(path)
        exception = exception_map.get(rel_path)
        status = "ok"

        if exception:
            missing_fields = [
                field
                for field in ("fileClass", "approvedMaxLines", "status", "rationale", "requiredFollowup")
                if not exception.get(field)
            ]
            if missing_fields:
                violations.append(
                    {
                        "type": "exception_entry_incomplete",
                        "path": rel_path,
                        "message": f"Exception entry is missing required fields: {', '.join(missing_fields)}.",
                    }
                )
                status = "violation"
            elif exception.get("fileClass") != file_class:
                violations.append(
                    {
                        "type": "exception_class_mismatch",
                        "path": rel_path,
                        "message": (
                            f"Exception class `{exception.get('fileClass')}` does not match detected class `{file_class}`."
                        ),
                    }
                )
                status = "violation"
            else:
                approved_max = int(exception.get("approvedMaxLines", 0) or 0)
                if lines > approved_max:
                    violations.append(
                        {
                            "type": "exception_approved_max_exceeded",
                            "path": rel_path,
                            "message": f"File has {lines} lines, exceeding approved exception maximum {approved_max}.",
                        }
                    )
                    status = "violation"
                else:
                    status = "exception"
        else:
            if hard and lines > hard:
                violations.append(
                    {
                        "type": "hard_threshold_exceeded_without_exception",
                        "path": rel_path,
                        "message": (
                            f"File has {lines} lines, exceeding hard threshold {hard} for class `{file_class}` without an approved exception."
                        ),
                    }
                )
                status = "violation"
            elif soft and lines > soft:
                advisories.append(
                    {
                        "type": "soft_threshold_exceeded",
                        "path": rel_path,
                        "message": (
                            f"File has {lines} lines, exceeding advisory threshold {soft} for class `{file_class}`."
                        ),
                    }
                )
                status = "advisory"

        files_report.append(
            {
                "path": rel_path,
                "fileClass": file_class,
                "lines": lines,
                "status": status,
                "softThresholdLines": soft,
                "hardThresholdLines": hard,
            }
        )

    return {
        "policyPath": POLICY_PATH,
        "registryPath": _rel(registry_path),
        "fileCount": len(files_report),
        "violationCount": len(violations),
        "advisoryCount": len(advisories),
        "files": files_report,
        "violations": violations,
        "advisories": advisories,
        "compliant": len(violations) == 0,
    }


def _print_report(report: dict[str, Any]) -> None:
    print("=== CVF Governed File Size Guard ===")
    print(f"Registry: {report['registryPath']}")
    print(f"Policy: {report['policyPath']}")
    print(f"Governed files checked: {report.get('fileCount', 0)}")
    print(f"Violations: {report['violationCount']}")
    print(f"Advisories: {report['advisoryCount']}")
    print("")
    print("Top governed files by line count:")
    for item in sorted(report.get("files", []), key=lambda row: row["lines"], reverse=True)[:10]:
        print(
            f"  - {item['path']}: {item['lines']} lines "
            f"[{item['fileClass']}, {item['status']}]"
        )

    if report["violations"]:
        print("\nViolations:")
        for violation in report["violations"]:
            print(f"  - {violation['path']} ({violation['type']}): {violation['message']}")
        print("\nFAIL - Governed file size policy is violated.")
        return

    if report["advisories"]:
        print("\nAdvisories:")
        for advisory in report["advisories"][:20]:
            print(f"  - {advisory['path']} ({advisory['type']}): {advisory['message']}")

    print("\nCOMPLIANT — Governed file size is within the active policy.")


def main() -> int:
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(errors="replace")
    if hasattr(sys.stderr, "reconfigure"):
        sys.stderr.reconfigure(errors="replace")

    parser = argparse.ArgumentParser(description="CVF governed file size guard")
    parser.add_argument("--registry", default=str(DEFAULT_REGISTRY), help="Exception registry path")
    parser.add_argument("--json", action="store_true", help="Print JSON report")
    parser.add_argument("--enforce", action="store_true", help="Return non-zero on violation")
    args = parser.parse_args()

    registry_path = (REPO_ROOT / args.registry).resolve() if not Path(args.registry).is_absolute() else Path(args.registry)
    report = build_report(registry_path)

    if args.json:
        print(json.dumps(report, indent=2))
    else:
        _print_report(report)

    if args.enforce and not report["compliant"]:
        return 2
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
