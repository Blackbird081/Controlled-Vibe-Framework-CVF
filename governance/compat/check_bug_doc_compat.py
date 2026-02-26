#!/usr/bin/env python3
"""
CVF Bug Documentation Compatibility Gate

Ensures that every bug-fix commit has a corresponding entry in docs/BUG_HISTORY.md
to prevent repeated debug loops and enforce knowledge documentation.

Policy: governance/toolkit/05_OPERATION/CVF_BUG_DOCUMENTATION_GUARD.md

Usage examples:
  python governance/compat/check_bug_doc_compat.py
  python governance/compat/check_bug_doc_compat.py --base origin/main --head HEAD
  python governance/compat/check_bug_doc_compat.py --base <sha> --head <sha> --enforce
  python governance/compat/check_bug_doc_compat.py --json
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
BUG_HISTORY_PATH = "docs/BUG_HISTORY.md"

# Patterns in commit messages that indicate a bug fix
BUG_FIX_PATTERNS = [
    r"^fix[\(:]",        # fix: or fix(scope):
    r"^bugfix[\(:]",     # bugfix: or bugfix(scope):
    r"^hotfix[\(:]",     # hotfix: or hotfix(scope):
    r"BUG-\d+",          # BUG-001, BUG-002, etc.
]

BUG_FIX_RE = re.compile("|".join(BUG_FIX_PATTERNS), re.IGNORECASE)


def _run_git(args: list[str]) -> tuple[int, str, str]:
    proc = subprocess.run(
        ["git", *args],
        cwd=REPO_ROOT,
        text=True,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
    )
    return proc.returncode, proc.stdout.strip(), proc.stderr.strip()


def _resolve_range(base: str | None, head: str | None) -> tuple[str, str]:
    resolved_head = head or "HEAD"
    if base:
        return base, resolved_head
    return "HEAD~1", resolved_head


def _get_commits_in_range(base: str, head: str) -> list[dict[str, str]]:
    """Get commit hashes and messages in the given range."""
    code, out, err = _run_git([
        "log", "--oneline", "--format=%H|%s", f"{base}..{head}"
    ])
    if code != 0:
        raise RuntimeError(f"git log failed for range {base}..{head}: {err or out}")

    commits = []
    for line in out.splitlines():
        if "|" in line:
            sha, message = line.split("|", 1)
            commits.append({"sha": sha.strip(), "message": message.strip()})
    return commits


def _get_changed_files(base: str, head: str) -> list[str]:
    """Get list of changed files in the given range."""
    code, out, err = _run_git(["diff", "--name-only", f"{base}..{head}"])
    if code != 0:
        raise RuntimeError(f"git diff failed for range {base}..{head}: {err or out}")
    return [line.replace("\\", "/").strip() for line in out.splitlines() if line.strip()]


def _find_fix_commits(commits: list[dict[str, str]]) -> list[dict[str, str]]:
    """Filter commits that look like bug fixes."""
    return [c for c in commits if BUG_FIX_RE.search(c["message"])]


def _check_bug_history_updated(changed_files: list[str]) -> bool:
    """Check if BUG_HISTORY.md was modified in the change set."""
    normalized = [f.replace("\\", "/") for f in changed_files]
    return BUG_HISTORY_PATH in normalized


def _count_bug_entries() -> int:
    """Count the number of BUG-XXX entries in BUG_HISTORY.md."""
    bug_history = REPO_ROOT / BUG_HISTORY_PATH
    if not bug_history.exists():
        return 0
    content = bug_history.read_text(encoding="utf-8")
    return len(re.findall(r"### BUG-\d+", content))


def _classify(
    commits: list[dict[str, str]],
    changed_files: list[str],
) -> dict[str, Any]:
    """Classify the commit range for bug documentation compliance."""
    fix_commits = _find_fix_commits(commits)
    bug_history_updated = _check_bug_history_updated(changed_files)
    total_bug_entries = _count_bug_entries()

    has_fixes = len(fix_commits) > 0
    compliant = not has_fixes or bug_history_updated

    return {
        "totalCommits": len(commits),
        "fixCommits": fix_commits,
        "fixCommitCount": len(fix_commits),
        "bugHistoryUpdated": bug_history_updated,
        "totalBugEntries": total_bug_entries,
        "compliant": compliant,
        "changedFiles": changed_files,
    }


def _print_report(report: dict[str, Any], base: str, head: str) -> None:
    """Print a human-readable report."""
    print("=== CVF Bug Documentation Gate ===")
    print(f"Range: {base}..{head}")
    print(f"Total commits: {report['totalCommits']}")
    print(f"Bug fix commits: {report['fixCommitCount']}")

    if report["fixCommits"]:
        print("\nDetected bug fix commits:")
        for fc in report["fixCommits"]:
            print(f"  - {fc['sha'][:8]} {fc['message']}")

    print(f"\nBUG_HISTORY.md updated: {'YES' if report['bugHistoryUpdated'] else 'NO'}")
    print(f"Total bug entries in history: {report['totalBugEntries']}")

    if report["compliant"]:
        print("\n✅ COMPLIANT — All bug fixes are documented.")
    else:
        print("\n❌ VIOLATION — Bug fix detected without BUG_HISTORY.md update!")
        print("   Action required: Add a BUG-XXX entry to docs/BUG_HISTORY.md")
        print("   See: governance/toolkit/05_OPERATION/CVF_BUG_DOCUMENTATION_GUARD.md")


def main() -> int:
    parser = argparse.ArgumentParser(
        description="CVF Bug Documentation compatibility gate"
    )
    parser.add_argument(
        "--base", default=None,
        help="Git base ref (default: HEAD~1)"
    )
    parser.add_argument(
        "--head", default=None,
        help="Git head ref (default: HEAD)"
    )
    parser.add_argument(
        "--enforce", action="store_true",
        help="Return non-zero (exit 2) when bug fix lacks documentation"
    )
    parser.add_argument(
        "--json", action="store_true",
        help="Print JSON report to stdout instead of text"
    )
    parser.add_argument(
        "--write-report", default=None,
        help="Optional output path for JSON report file"
    )
    args = parser.parse_args()

    base, head = _resolve_range(args.base, args.head)

    try:
        commits = _get_commits_in_range(base, head)
        changed_files = _get_changed_files(base, head)
    except RuntimeError as exc:
        if args.base:
            fallback_base = "HEAD~1"
            try:
                commits = _get_commits_in_range(fallback_base, head)
                changed_files = _get_changed_files(fallback_base, head)
                print(
                    f"Warning: primary range failed ({exc}); fallback to {fallback_base}..{head}",
                    file=sys.stderr,
                )
                base = fallback_base
            except RuntimeError as fallback_exc:
                print(str(fallback_exc), file=sys.stderr)
                return 1
        else:
            print(str(exc), file=sys.stderr)
            return 1

    classified = _classify(commits, changed_files)
    report = {
        "timestamp": dt.datetime.now(dt.timezone.utc)
            .replace(microsecond=0).isoformat().replace("+00:00", "Z"),
        "range": {"base": base, "head": head},
        "policy": "governance/toolkit/05_OPERATION/CVF_BUG_DOCUMENTATION_GUARD.md",
        **classified,
    }

    if args.write_report:
        out_path = Path(args.write_report)
        if not out_path.is_absolute():
            out_path = (REPO_ROOT / out_path).resolve()
        out_path.parent.mkdir(parents=True, exist_ok=True)
        out_path.write_text(json.dumps(report, indent=2), encoding="utf-8")

    if args.json:
        print(json.dumps(report, indent=2))
    else:
        _print_report(report, base, head)

    if args.enforce and not classified["compliant"]:
        return 2

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
