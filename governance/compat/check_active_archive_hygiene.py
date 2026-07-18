#!/usr/bin/env python3
"""
CVF Active Archive Hygiene Compatibility Gate

Fast, hook-safe drift detector for dated operational docs that have aged out of
the active window but still live outside archive folders. This checker does not
move files and does not run the expensive reference-impact scan. Archive moves
remain owned by scripts/cvf_active_archive.py.
"""

from __future__ import annotations

import argparse
import datetime as dt
import json
import re
import subprocess
import sys
from pathlib import Path
from typing import Any


REPO_ROOT = Path(__file__).resolve().parents[2]
MANAGED_ROOTS = ("docs", "ECOSYSTEM/strategy")
ARCHIVE_FOLDER = "archive"
AGE_THRESHOLD_DAYS = 10
MANAGED_EXTENSIONS = {".md", ".json"}
DATE_PATTERNS = (
    re.compile(r"(\d{4}-\d{2}-\d{2})"),
    re.compile(r"(\d{4}_\d{2}_\d{2})"),
)
EXCLUDED_PATH_PREFIXES = (
    "docs/logs/",
    "docs/reviews/cvf_phase_governance/logs/",
)
PERMANENT_FILES = {
    "README.md",
    "CVF_STRATEGIC_SUMMARY.md",
    "CVF_UNIFIED_ROADMAP_2026.md",
    "CVF_WHITEPAPER_COMPLETION_ROADMAP_2026-03-21.md",
    "CVF_SYSTEM_UNIFICATION_REMEDIATION_ROADMAP_2026-03-19.md",
}
PERMANENT_PATHS = {
    "docs/reference/CVF_MASTER_ARCHITECTURE_WHITEPAPER.md",
    "docs/reference/CVF_WHITEPAPER_PROGRESS_TRACKER.md",
    "docs/baselines/CVF_CORE_COMPAT_BASELINE.md",
    "docs/baselines/CVF_CONFORMANCE_GOLDEN_BASELINE_2026-03-07.json",
    "docs/baselines/CVF_TESTER_BASELINE_2026-02-25.md",
    "docs/baselines/README.md",
    "docs/reference/CVF_NON_CODER_VALUE_GUARD_PROPOSAL_2026-04-14.md",
    "docs/reference/CVF_WORKER_AUTONOMY_DISPATCH_PROMPT_STANDARD_2026-06-01.md",
    "docs/assessments/CVF_EXECUTIVE_VALUE_PRIORITIZATION_NOTE_2026-04-13.md",
    "docs/roadmaps/CVF_GRAPHIFY_LLM_POWERED_PALACE_SYNTHESIS_ONLY_ROADMAP_2026-04-13.md",
    "AGENT_HANDOFF.md",
}
ACTIVE_WINDOW_REGISTRY_PATH = REPO_ROOT / "governance" / "compat" / "CVF_ACTIVE_WINDOW_REGISTRY.json"
AUDIT_RETENTION_REGISTRY_PATH = REPO_ROOT / "governance" / "compat" / "CVF_AUDIT_RETENTION_REGISTRY.json"
REVIEW_RETENTION_REGISTRY_PATH = REPO_ROOT / "governance" / "compat" / "CVF_REVIEW_RETENTION_REGISTRY.json"
ACTIVE_ARCHIVE_BASELINE_PATH = REPO_ROOT / "governance" / "compat" / "CVF_ACTIVE_ARCHIVE_BASELINE.json"


def _rel(path: Path) -> str:
    return path.relative_to(REPO_ROOT).as_posix()


def _read_json(path: Path) -> dict[str, Any]:
    if not path.exists():
        return {}
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError):
        return {}


def _extract_date(filename: str) -> dt.datetime | None:
    for pattern in DATE_PATTERNS:
        match = pattern.search(filename)
        if not match:
            continue
        try:
            return dt.datetime.strptime(match.group(1).replace("_", "-"), "%Y-%m-%d")
        except ValueError:
            continue
    return None


def _is_archive_path(path: Path) -> bool:
    return ARCHIVE_FOLDER in path.parts


def _is_excluded(rel_path: str) -> bool:
    return any(rel_path.startswith(prefix) for prefix in EXCLUDED_PATH_PREFIXES)


def _load_active_window_paths() -> set[str]:
    registry = _read_json(ACTIVE_WINDOW_REGISTRY_PATH)
    return {
        entry["activePath"]
        for entry in registry.get("windows", [])
        if isinstance(entry, dict)
        and entry.get("status") == "ACTIVE"
        and entry.get("protectionMode") == "PERMANENT_ACTIVE_WINDOW"
        and isinstance(entry.get("activePath"), str)
    }


def _load_retained_paths() -> set[str]:
    retained: set[str] = set()
    for path in (AUDIT_RETENTION_REGISTRY_PATH, REVIEW_RETENTION_REGISTRY_PATH):
        registry = _read_json(path)
        retained.update(
            entry
            for entry in registry.get("retainEvidencePaths", [])
            if isinstance(entry, str) and entry
        )
    return retained


def _load_baseline_blocked_paths() -> set[str]:
    baseline = _read_json(ACTIVE_ARCHIVE_BASELINE_PATH)
    blocked: set[str] = set()
    for path, record in baseline.get("files", {}).items():
        if (
            isinstance(path, str)
            and isinstance(record, dict)
            and record.get("bucket") == "archive_candidate"
            and record.get("blocked") is True
        ):
            blocked.add(path)
    return blocked


def _iter_managed_files() -> list[Path]:
    files: list[Path] = []
    for root in MANAGED_ROOTS:
        root_path = REPO_ROOT / root
        if not root_path.exists():
            continue
        for path in root_path.rglob("*"):
            if not path.is_file():
                continue
            if path.suffix.lower() not in MANAGED_EXTENSIONS:
                continue
            if _is_archive_path(path):
                continue
            files.append(path)
    return files


def _run_git(args: list[str]) -> tuple[int, str]:
    proc = subprocess.run(
        ["git", *args],
        cwd=REPO_ROOT,
        text=True,
        encoding="utf-8",
        errors="replace",
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
    )
    return proc.returncode, (proc.stdout or "").strip()


def _changed_paths() -> set[str]:
    changed: set[str] = set()
    for args in (["diff", "--name-only"], ["diff", "--name-only", "--cached"]):
        code, out = _run_git(args)
        if code == 0 and out:
            changed.update(line.replace("\\", "/").strip() for line in out.splitlines() if line.strip())

    code, out = _run_git(["ls-files", "--others", "--exclude-standard"])
    if code == 0 and out:
        changed.update(line.replace("\\", "/").strip() for line in out.splitlines() if line.strip())
    return changed


def build_report(
    *,
    max_stale: int = 10,
    fail_on_changed_stale: bool = True,
    fail_on_backlog: bool = False,
) -> dict[str, Any]:
    now = dt.datetime.now(dt.timezone.utc).replace(microsecond=0)
    cutoff = dt.datetime.now().replace(hour=0, minute=0, second=0, microsecond=0) - dt.timedelta(
        days=AGE_THRESHOLD_DAYS
    )
    active_window_paths = _load_active_window_paths()
    retained_paths = _load_retained_paths()
    baseline_blocked_paths = _load_baseline_blocked_paths()
    changed_paths = _changed_paths()

    active_recent: list[str] = []
    stale_actionable: list[str] = []
    stale_blocked: list[str] = []
    stale_retained: list[str] = []
    permanent: list[str] = []
    non_dated: list[str] = []
    changed_stale: list[str] = []

    for path in _iter_managed_files():
        rel_path = _rel(path)
        if _is_excluded(rel_path):
            continue

        if path.name in PERMANENT_FILES or rel_path in PERMANENT_PATHS or rel_path in active_window_paths:
            permanent.append(rel_path)
            continue

        file_date = _extract_date(path.name)
        if file_date is None:
            non_dated.append(rel_path)
            continue

        if file_date >= cutoff:
            active_recent.append(rel_path)
            continue

        if rel_path in retained_paths:
            stale_retained.append(rel_path)
            continue

        if rel_path in baseline_blocked_paths:
            stale_blocked.append(rel_path)
            continue

        stale_actionable.append(rel_path)
        if rel_path in changed_paths:
            changed_stale.append(rel_path)

    violations: list[dict[str, str]] = []
    backlog_exceeds_threshold = len(stale_actionable) > max_stale
    if fail_on_backlog and backlog_exceeds_threshold:
        violations.append(
            {
                "type": "active_archive_backlog_exceeds_threshold",
                "message": (
                    f"{len(stale_actionable)} stale dated docs remain active; "
                    f"threshold is {max_stale}. Run scripts/cvf_active_archive.py --execute."
                ),
            }
        )
    if fail_on_changed_stale and changed_stale:
        violations.append(
            {
                "type": "changed_stale_dated_docs",
                "message": (
                    f"{len(changed_stale)} changed stale dated docs remain outside archive. "
                    "Archive or refresh the active window before committing."
                ),
            }
        )

    return {
        "timestamp": now.isoformat().replace("+00:00", "Z"),
        "cutoffDate": cutoff.strftime("%Y-%m-%d"),
        "ageThresholdDays": AGE_THRESHOLD_DAYS,
        "managedRoots": list(MANAGED_ROOTS),
        "maxStale": max_stale,
        "failOnChangedStale": fail_on_changed_stale,
        "failOnBacklog": fail_on_backlog,
        "backlogExceedsThreshold": backlog_exceeds_threshold,
        "activeRecentCount": len(active_recent),
        "staleActionableCount": len(stale_actionable),
        "staleBlockedCount": len(stale_blocked),
        "staleRetainedCount": len(stale_retained),
        "changedStaleCount": len(changed_stale),
        "permanentCount": len(permanent),
        "nonDatedCount": len(non_dated),
        "sampleStaleActionable": sorted(stale_actionable)[:50],
        "sampleChangedStale": sorted(changed_stale)[:50],
        "violationCount": len(violations),
        "violations": violations,
        "compliant": not violations,
    }


def _print_report(report: dict[str, Any]) -> None:
    print("=== CVF Active Archive Hygiene Gate ===")
    print(f"Cutoff date: {report['cutoffDate']} (> {report['ageThresholdDays']} days old)")
    print(f"Active recent: {report['activeRecentCount']}")
    print(f"Stale retained evidence: {report['staleRetainedCount']}")
    print(f"Stale blocked by baseline screening: {report['staleBlockedCount']}")
    print(f"Stale actionable: {report['staleActionableCount']} (threshold {report['maxStale']})")
    if report["backlogExceedsThreshold"] and not report["failOnBacklog"]:
        print(
            "Advisory: stale actionable backlog exceeds threshold, but unchanged "
            "global backlog is not a commit blocker. Classify retained evidence or "
            "archive in a dedicated maintenance batch."
        )
    print(f"Changed stale: {report['changedStaleCount']}")
    print(f"Permanent: {report['permanentCount']}")
    print(f"Non-dated kept: {report['nonDatedCount']}")
    if report["sampleStaleActionable"]:
        print("\nSample stale actionable files:")
        for path in report["sampleStaleActionable"][:20]:
            print(f"  - {path}")
    if report["violations"]:
        print("\nViolations:")
        for violation in report["violations"]:
            print(f"  - {violation['type']}: {violation['message']}")
        print("\nVIOLATION - active/archive hygiene backlog needs cleanup.")
        return
    print("\nCOMPLIANT - active/archive hygiene is within threshold.")


def main() -> int:
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(errors="replace")
    if hasattr(sys.stderr, "reconfigure"):
        sys.stderr.reconfigure(errors="replace")

    parser = argparse.ArgumentParser(description="Fast CVF active archive hygiene check")
    parser.add_argument("--max-stale", type=int, default=10, help="Maximum active stale docs allowed.")
    parser.add_argument(
        "--fail-on-changed-stale",
        action="store_true",
        help="Deprecated compatibility flag; changed stale files fail by default.",
    )
    parser.add_argument(
        "--allow-changed-stale",
        action="store_true",
        help="Do not fail when the current working tree changes stale dated docs outside archive.",
    )
    parser.add_argument(
        "--fail-on-backlog",
        action="store_true",
        help="Fail when unchanged stale actionable backlog exceeds --max-stale.",
    )
    parser.add_argument("--enforce", action="store_true", help="Return non-zero when hygiene violations exist.")
    parser.add_argument("--json", action="store_true", help="Print JSON report.")
    args = parser.parse_args()

    report = build_report(
        max_stale=args.max_stale,
        fail_on_changed_stale=not args.allow_changed_stale,
        fail_on_backlog=args.fail_on_backlog,
    )
    if args.json:
        print(json.dumps(report, indent=2))
    else:
        _print_report(report)
    if args.enforce and not report["compliant"]:
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
