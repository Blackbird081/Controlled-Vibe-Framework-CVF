#!/usr/bin/env python3
"""
CVF Test Documentation Compatibility Gate

Ensures that every test-related commit has a corresponding batch entry
in docs/CVF_INCREMENTAL_TEST_LOG.md to maintain full test traceability.

Policy: governance/toolkit/05_OPERATION/CVF_TEST_DOCUMENTATION_GUARD.md

Usage examples:
  python governance/compat/check_test_doc_compat.py
  python governance/compat/check_test_doc_compat.py --base origin/main --head HEAD
  python governance/compat/check_test_doc_compat.py --base <sha> --head <sha> --enforce
  python governance/compat/check_test_doc_compat.py --json
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
TEST_LOG_PATH = "docs/CVF_INCREMENTAL_TEST_LOG.md"

# Patterns in commit messages that indicate test activity
TEST_COMMIT_PATTERNS = [
    r"^test[\(:]",           # test: or test(scope):
    r"^chore\(test",         # chore(test):
    r"\bregression\b",       # mentions regression
    r"\bcoverage\b",         # mentions coverage
]

# File patterns that indicate test activity
TEST_FILE_PATTERNS = [
    r"\.test\.tsx?$",        # *.test.ts, *.test.tsx
    r"\.spec\.tsx?$",        # *.spec.ts, *.spec.tsx
    r"vitest\.config",       # vitest config changes
    r"jest\.config",         # jest config changes
    r"playwright\.config",   # playwright config changes
]

TEST_COMMIT_RE = re.compile("|".join(TEST_COMMIT_PATTERNS), re.IGNORECASE)
TEST_FILE_RE = re.compile("|".join(TEST_FILE_PATTERNS), re.IGNORECASE)


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


def _find_test_commits(commits: list[dict[str, str]]) -> list[dict[str, str]]:
    """Filter commits that look like test activity based on message."""
    return [c for c in commits if TEST_COMMIT_RE.search(c["message"])]


def _find_test_files_changed(changed_files: list[str]) -> list[str]:
    """Find changed files that are test files."""
    return [f for f in changed_files if TEST_FILE_RE.search(f)]


def _check_test_log_updated(changed_files: list[str]) -> bool:
    """Check if CVF_INCREMENTAL_TEST_LOG.md was modified in the change set."""
    normalized = [f.replace("\\", "/") for f in changed_files]
    return TEST_LOG_PATH in normalized


def _count_batch_entries() -> int:
    """Count the number of batch entries in the test log."""
    test_log = REPO_ROOT / TEST_LOG_PATH
    if not test_log.exists():
        return 0
    content = test_log.read_text(encoding="utf-8")
    return len(re.findall(r"## \[\d{4}-\d{2}-\d{2}\] Batch:", content))


def _classify(
    commits: list[dict[str, str]],
    changed_files: list[str],
) -> dict[str, Any]:
    """Classify the commit range for test documentation compliance."""
    test_commits = _find_test_commits(commits)
    test_files_changed = _find_test_files_changed(changed_files)
    test_log_updated = _check_test_log_updated(changed_files)
    total_batch_entries = _count_batch_entries()

    has_test_activity = len(test_commits) > 0 or len(test_files_changed) > 0
    compliant = not has_test_activity or test_log_updated

    return {
        "totalCommits": len(commits),
        "testCommits": test_commits,
        "testCommitCount": len(test_commits),
        "testFilesChanged": test_files_changed,
        "testFileCount": len(test_files_changed),
        "testLogUpdated": test_log_updated,
        "totalBatchEntries": total_batch_entries,
        "hasTestActivity": has_test_activity,
        "compliant": compliant,
        "changedFiles": changed_files,
    }


def _print_report(report: dict[str, Any], base: str, head: str) -> None:
    """Print a human-readable report."""
    print("=== CVF Test Documentation Gate ===")
    print(f"Range: {base}..{head}")
    print(f"Total commits: {report['totalCommits']}")
    print(f"Test commits (by message): {report['testCommitCount']}")
    print(f"Test files changed: {report['testFileCount']}")

    if report["testCommits"]:
        print("\nDetected test commits:")
        for tc in report["testCommits"]:
            print(f"  - {tc['sha'][:8]} {tc['message']}")

    if report["testFilesChanged"]:
        print("\nChanged test files:")
        for tf in report["testFilesChanged"]:
            print(f"  - {tf}")

    print(f"\nCVF_INCREMENTAL_TEST_LOG.md updated: {'YES' if report['testLogUpdated'] else 'NO'}")
    print(f"Total batch entries in test log: {report['totalBatchEntries']}")

    if report["compliant"]:
        print("\n✅ COMPLIANT — All test activities are documented.")
    elif not report["hasTestActivity"]:
        print("\n✅ SKIP — No test activity detected in this range.")
    else:
        print("\n❌ VIOLATION — Test activity detected without CVF_INCREMENTAL_TEST_LOG.md update!")
        print("   Action required: Add a batch entry to docs/CVF_INCREMENTAL_TEST_LOG.md")
        print("   See: governance/toolkit/05_OPERATION/CVF_TEST_DOCUMENTATION_GUARD.md")


def main() -> int:
    parser = argparse.ArgumentParser(
        description="CVF Test Documentation compatibility gate"
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
        help="Return non-zero (exit 2) when test activity lacks documentation"
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
        "policy": "governance/toolkit/05_OPERATION/CVF_TEST_DOCUMENTATION_GUARD.md",
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
