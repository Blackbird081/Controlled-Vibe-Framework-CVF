#!/usr/bin/env python3
"""
CVF Baseline Update Compatibility Gate

Ensures that every substantive fix/update has a corresponding baseline update
artifact so future reconciliation can compare against a stable checkpoint.

Policy: governance/toolkit/05_OPERATION/CVF_BASELINE_UPDATE_GUARD.md

Usage examples:
  python governance/compat/check_baseline_update_compat.py
  python governance/compat/check_baseline_update_compat.py --base origin/main --head HEAD
  python governance/compat/check_baseline_update_compat.py --base <sha> --head <sha> --enforce
  python governance/compat/check_baseline_update_compat.py --json
"""

from __future__ import annotations

import argparse
import datetime as dt
import json
import os
import subprocess
import sys
from pathlib import Path
from typing import Any


REPO_ROOT = Path(__file__).resolve().parents[2]
DEFAULT_BASE_CANDIDATES = ("origin/main", "origin/master", "main", "master")

NON_SUBSTANTIVE_PREFIXES = (
    "docs/baselines/",
    "docs/assessments/",
    "docs/reviews/",
    "docs/roadmaps/",
    "docs/logs/",
    "docs/guides/",
    "docs/tutorials/",
    "docs/cheatsheets/",
    "docs/case-studies/",
    "docs/concepts/",
)

NON_SUBSTANTIVE_EXACT = {
    "docs/CVF_INCREMENTAL_TEST_LOG.md",
    "docs/BUG_HISTORY.md",
    "CHANGELOG.md",
}

BASELINE_ARTIFACT_PREFIXES = (
    "docs/baselines/",
    "docs/assessments/",
    "docs/reviews/",
)

BASELINE_ARTIFACT_EXACT = {
    "docs/baselines/README.md",
    "docs/assessments/README.md",
    "docs/reviews/cvf_phase_governance/README.md",
}


def _run_git(args: list[str]) -> tuple[int, str, str]:
    proc = subprocess.run(
        ["git", *args],
        cwd=REPO_ROOT,
        text=True,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
    )
    return proc.returncode, proc.stdout.strip(), proc.stderr.strip()


def _ref_exists(ref: str) -> bool:
    code, _, _ = _run_git(["rev-parse", "--verify", "--quiet", f"{ref}^{{commit}}"])
    return code == 0


def _discover_default_base(head: str) -> tuple[str, str]:
    env_base = os.getenv("CVF_COMPAT_BASE")
    if env_base:
        return env_base, "env:CVF_COMPAT_BASE"

    for ref in DEFAULT_BASE_CANDIDATES:
        if not _ref_exists(ref):
            continue
        code, out, _ = _run_git(["merge-base", ref, head])
        if code == 0 and out:
            return out, f"merge-base({ref},{head})"

    return "HEAD~1", "fallback:HEAD~1"


def _resolve_range(base: str | None, head: str | None) -> tuple[str, str, str]:
    resolved_head = head or "HEAD"
    if base:
        return base, resolved_head, "explicit:--base"
    resolved_base, source = _discover_default_base(resolved_head)
    return resolved_base, resolved_head, source


def _parse_name_status_output(output: str) -> dict[str, set[str]]:
    changed: dict[str, set[str]] = {}

    for raw_line in output.splitlines():
        if not raw_line.strip():
            continue
        parts = raw_line.split("\t")
        status = parts[0].strip()
        if status.startswith("R") or status.startswith("C"):
            if len(parts) < 3:
                continue
            path = parts[2]
        else:
            if len(parts) < 2:
                continue
            path = parts[1]
        normalized = path.replace("\\", "/").strip()
        changed.setdefault(normalized, set()).add(status)

    return changed


def _get_commits_in_range(base: str, head: str) -> list[dict[str, str]]:
    code, out, err = _run_git(["log", "--oneline", "--format=%H|%s", f"{base}..{head}"])
    if code != 0:
        raise RuntimeError(f"git log failed for range {base}..{head}: {err or out}")

    commits = []
    for line in out.splitlines():
        if "|" not in line:
            continue
        sha, message = line.split("|", 1)
        commits.append({"sha": sha.strip(), "message": message.strip()})
    return commits


def _get_changed_name_status(base: str, head: str) -> dict[str, set[str]]:
    code, out, err = _run_git(["diff", "--name-status", f"{base}..{head}"])
    if code != 0:
        raise RuntimeError(f"git diff failed for range {base}..{head}: {err or out}")
    return _parse_name_status_output(out)


def _get_worktree_name_status() -> dict[str, set[str]]:
    changed: dict[str, set[str]] = {}

    for args in (["diff", "--name-status"], ["diff", "--name-status", "--cached"]):
        code, out, _ = _run_git(args)
        if code == 0 and out:
            for path, statuses in _parse_name_status_output(out).items():
                changed.setdefault(path, set()).update(statuses)

    code, out, _ = _run_git(["ls-files", "--others", "--exclude-standard"])
    if code == 0 and out:
        for raw_line in out.splitlines():
            normalized = raw_line.replace("\\", "/").strip()
            if normalized:
                changed.setdefault(normalized, set()).add("A")

    return changed


def _merge_changed_maps(*maps: dict[str, set[str]]) -> dict[str, list[str]]:
    merged: dict[str, set[str]] = {}
    for changed_map in maps:
        for path, statuses in changed_map.items():
            merged.setdefault(path, set()).update(statuses)
    return {path: sorted(statuses) for path, statuses in sorted(merged.items())}


def _is_deleted_only(statuses: list[str]) -> bool:
    return all(status.startswith("D") for status in statuses)


def _is_non_substantive(path: str) -> bool:
    if path in NON_SUBSTANTIVE_EXACT:
        return True
    return any(path.startswith(prefix) for prefix in NON_SUBSTANTIVE_PREFIXES)


def _is_baseline_artifact(path: str) -> bool:
    if path in BASELINE_ARTIFACT_EXACT:
        return False
    if path.endswith("/ARCHIVE_INDEX.md") or path.endswith("/README.md"):
        return False
    return any(path.startswith(prefix) for prefix in BASELINE_ARTIFACT_PREFIXES)


def _classify(commits: list[dict[str, str]], changed_paths: dict[str, list[str]]) -> dict[str, Any]:
    active_paths = {
        path: statuses
        for path, statuses in changed_paths.items()
        if not _is_deleted_only(statuses)
    }

    substantive_files = [
        path for path in active_paths
        if not _is_non_substantive(path)
    ]
    baseline_artifacts = [
        path for path in active_paths
        if _is_baseline_artifact(path)
    ]

    has_substantive_update = len(substantive_files) > 0
    compliant = (not has_substantive_update) or len(baseline_artifacts) > 0

    return {
        "totalCommits": len(commits),
        "hasSubstantiveUpdate": has_substantive_update,
        "substantiveFiles": substantive_files,
        "substantiveFileCount": len(substantive_files),
        "baselineArtifactsUpdated": baseline_artifacts,
        "baselineArtifactCount": len(baseline_artifacts),
        "compliant": compliant,
        "changedFiles": list(changed_paths.keys()),
    }


def _print_report(report: dict[str, Any], base: str, head: str, base_source: str) -> None:
    print("=== CVF Baseline Update Gate ===")
    print(f"Range: {base}..{head}")
    print(f"Base source: {base_source}")
    print(f"Total commits: {report['totalCommits']}")
    print(f"Substantive files changed: {report['substantiveFileCount']}")
    print(f"Baseline artifacts updated: {report['baselineArtifactCount']}")

    if report["substantiveFiles"]:
        print("\nSubstantive changed files:")
        for path in report["substantiveFiles"]:
            print(f"  - {path}")

    if report["baselineArtifactsUpdated"]:
        print("\nBaseline update artifacts:")
        for path in report["baselineArtifactsUpdated"]:
            print(f"  - {path}")

    if report["compliant"]:
        if report["hasSubstantiveUpdate"]:
            print("\n✅ COMPLIANT — Substantive update includes baseline artifact update.")
        else:
            print("\n✅ SKIP — No substantive update detected in this range.")
    else:
        print("\n❌ VIOLATION — Substantive fix/update detected without baseline update artifact!")
        print("   Action required: add/update a file under docs/baselines/, docs/assessments/, or docs/reviews/")
        print("   See: governance/toolkit/05_OPERATION/CVF_BASELINE_UPDATE_GUARD.md")


def main() -> int:
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(errors="replace")
    if hasattr(sys.stderr, "reconfigure"):
        sys.stderr.reconfigure(errors="replace")

    parser = argparse.ArgumentParser(
        description="CVF baseline update compatibility gate"
    )
    parser.add_argument(
        "--base", default=None,
        help="Git base ref (default: auto-detect merge-base, then fallback HEAD~1)"
    )
    parser.add_argument(
        "--head", default=None,
        help="Git head ref (default: HEAD)"
    )
    parser.add_argument(
        "--enforce", action="store_true",
        help="Return non-zero (exit 2) when a substantive update lacks baseline artifact update"
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

    base, head, base_source = _resolve_range(args.base, args.head)

    try:
        commits = _get_commits_in_range(base, head)
        changed = _get_changed_name_status(base, head)
    except RuntimeError as exc:
        if args.base:
            fallback_base = "HEAD~1"
            try:
                commits = _get_commits_in_range(fallback_base, head)
                changed = _get_changed_name_status(fallback_base, head)
                print(
                    f"Warning: primary range failed ({exc}); fallback to {fallback_base}..{head}",
                    file=sys.stderr,
                )
                base = fallback_base
                base_source = "fallback-after-error:HEAD~1"
            except RuntimeError as fallback_exc:
                print(str(fallback_exc), file=sys.stderr)
                return 1
        else:
            print(str(exc), file=sys.stderr)
            return 1

    worktree_changed = _get_worktree_name_status()
    merged = _merge_changed_maps(changed, worktree_changed)

    classified = _classify(commits, merged)
    report = {
        "timestamp": dt.datetime.now(dt.timezone.utc)
            .replace(microsecond=0).isoformat().replace("+00:00", "Z"),
        "range": {"base": base, "head": head, "baseSource": base_source},
        "policy": "governance/toolkit/05_OPERATION/CVF_BASELINE_UPDATE_GUARD.md",
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
        _print_report(report, base, head, base_source)

    if args.enforce and not classified["compliant"]:
        return 2

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
