#!/usr/bin/env python3
"""
CVF Progress Tracker Sync Compatibility Gate

Ensures that registered governed worklines update their canonical tracker and
leave one short standardized sync note whenever tranche/authorization posture
changes are introduced.
"""

from __future__ import annotations

import argparse
import datetime as dt
import json
import os
import re
import subprocess
import sys
from pathlib import Path
from typing import Any


REPO_ROOT = Path(__file__).resolve().parents[2]
DEFAULT_BASE_CANDIDATES = ("origin/main", "origin/master", "main", "master")

GUARD_PATH = "governance/toolkit/05_OPERATION/CVF_PROGRESS_TRACKER_SYNC_GUARD.md"
TEMPLATE_PATH = "docs/reference/CVF_GC026_PROGRESS_TRACKER_SYNC_TEMPLATE.md"
REGISTRY_PATH = "governance/compat/CVF_PROGRESS_TRACKER_REGISTRY.json"
MASTER_POLICY_PATH = "governance/toolkit/02_POLICY/CVF_MASTER_POLICY.md"
CONTROL_MATRIX_PATH = "docs/reference/CVF_GOVERNANCE_CONTROL_MATRIX.md"
BOOTSTRAP_PATH = "docs/reference/CVF_SESSION_GOVERNANCE_BOOTSTRAP.md"
HOOK_CHAIN_PATH = "governance/compat/run_local_governance_hook_chain.py"
WORKFLOW_PATH = ".github/workflows/documentation-testing.yml"
THIS_SCRIPT_PATH = "governance/compat/check_progress_tracker_sync.py"

REQUIRED_FILES = (
    GUARD_PATH,
    TEMPLATE_PATH,
    REGISTRY_PATH,
    MASTER_POLICY_PATH,
    CONTROL_MATRIX_PATH,
    BOOTSTRAP_PATH,
    HOOK_CHAIN_PATH,
    WORKFLOW_PATH,
)

REQUIRED_MARKERS: dict[str, tuple[str, ...]] = {
    GUARD_PATH: (
        "Control ID:",
        "GC-026",
        TEMPLATE_PATH,
        "Whenever a governed tranche, continuation packet, closure packet, or equivalent workline state change is completed",
        "current active tranche",
        "last canonical closure",
        THIS_SCRIPT_PATH,
    ),
    TEMPLATE_PATH: (
        "GC-026 Progress Tracker Sync Note",
        "- Workline:",
        "- Trigger source:",
        "- Previous pointer:",
        "- New pointer:",
        "- Last canonical closure:",
        "- Current active tranche:",
        "- Next governed move:",
        "- Canonical tracker updated:",
    ),
    MASTER_POLICY_PATH: (
        "Progress tracker sync is mandatory after any governed tranche or authorization state change that alters canonical progress posture",
        GUARD_PATH,
        TEMPLATE_PATH,
        THIS_SCRIPT_PATH,
    ),
    CONTROL_MATRIX_PATH: (
        "GC-026",
        GUARD_PATH,
        TEMPLATE_PATH,
        REGISTRY_PATH,
        THIS_SCRIPT_PATH,
    ),
    BOOTSTRAP_PATH: (
        "GC-026",
        "bootstrap depends on tracker freshness",
    ),
    HOOK_CHAIN_PATH: (
        THIS_SCRIPT_PATH,
    ),
    WORKFLOW_PATH: (
        THIS_SCRIPT_PATH,
        "progress-tracker-sync",
        "Progress Tracker Sync",
    ),
}

SYNC_NOTE_MARKERS = (
    "GC-026 Progress Tracker Sync Note",
    "- Workline:",
    "- Trigger source:",
    "- Previous pointer:",
    "- New pointer:",
    "- Last canonical closure:",
    "- Current active tranche:",
    "- Next governed move:",
    "- Canonical tracker updated:",
)


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


def _get_last_commit() -> dict[str, str] | None:
    code, out, _ = _run_git(["log", "-1", "--format=%H|%s"])
    if code != 0 or not out or "|" not in out:
        return None
    sha, message = out.split("|", 1)
    return {"sha": sha.strip(), "message": message.strip()}


def _get_last_commit_name_status() -> dict[str, set[str]]:
    code, out, err = _run_git(["diff-tree", "--no-commit-id", "--name-status", "-r", "HEAD"])
    if code != 0:
        raise RuntimeError(f"git diff-tree failed for HEAD: {err or out}")
    return _parse_name_status_output(out)


def _merge_changed_maps(*maps: dict[str, set[str]]) -> dict[str, list[str]]:
    merged: dict[str, set[str]] = {}
    for changed_map in maps:
        for path, statuses in changed_map.items():
            merged.setdefault(path, set()).update(statuses)
    return {path: sorted(statuses) for path, statuses in sorted(merged.items())}


def _read_text(path: str) -> str:
    abs_path = REPO_ROOT / path
    if not abs_path.exists() or abs_path.is_dir():
        return ""
    return abs_path.read_text(encoding="utf-8")


def _load_registry() -> dict[str, Any]:
    return json.loads(_read_text(REGISTRY_PATH))


def _baseline_has_sync_note(path: str) -> bool:
    if not path.startswith("docs/baselines/"):
        return False
    text = _read_text(path)
    return all(marker in text for marker in SYNC_NOTE_MARKERS)


def _classify(commits: list[dict[str, str]], changed_paths: dict[str, list[str]]) -> dict[str, Any]:
    missing_files = [path for path in REQUIRED_FILES if not (REPO_ROOT / path).exists()]

    marker_violations: dict[str, list[str]] = {}
    for path, markers in REQUIRED_MARKERS.items():
        text = _read_text(path)
        missing_markers = [marker for marker in markers if marker not in text]
        if missing_markers:
            marker_violations[path] = missing_markers

    registry = _load_registry()
    workline_reports: list[dict[str, Any]] = []
    for entry in registry.get("worklines", []):
        trigger_patterns = [re.compile(pattern) for pattern in entry.get("triggerRegexes", [])]
        commit_patterns = [re.compile(pattern) for pattern in entry.get("commitRegexes", [])]

        triggered_files = [
            path for path in changed_paths
            if any(pattern.search(path) for pattern in trigger_patterns)
        ]
        triggered_commits = [
            commit["message"] for commit in commits
            if any(pattern.search(commit["message"]) for pattern in commit_patterns)
        ]
        triggered = bool(triggered_files or triggered_commits)

        tracker_path = entry["tracker"]
        tracker_updated = tracker_path in changed_paths
        sync_note_files = [path for path in changed_paths if _baseline_has_sync_note(path)]

        workline_report = {
            "id": entry["id"],
            "tracker": tracker_path,
            "triggered": triggered,
            "triggeredFiles": triggered_files,
            "triggeredCommits": triggered_commits,
            "trackerUpdated": tracker_updated,
            "syncNoteFiles": sync_note_files,
            "compliant": (not triggered) or (tracker_updated and bool(sync_note_files)),
        }
        workline_reports.append(workline_report)

    compliant = not missing_files and not marker_violations and all(item["compliant"] for item in workline_reports)

    return {
        "requiredFileCount": len(REQUIRED_FILES),
        "missingFiles": missing_files,
        "missingFileCount": len(missing_files),
        "markerViolations": marker_violations,
        "markerViolationCount": len(marker_violations),
        "worklines": workline_reports,
        "compliant": compliant,
        "changedFiles": list(changed_paths.keys()),
        "totalCommits": len(commits),
    }


def _print_report(report: dict[str, Any], base: str, head: str, base_source: str) -> None:
    print("=== CVF Progress Tracker Sync Gate ===")
    print(f"Range: {base}..{head}")
    print(f"Base source: {base_source}")
    print(f"Required files checked: {report['requiredFileCount']}")
    print(f"Missing files: {report['missingFileCount']}")
    print(f"Marker violations: {report['markerViolationCount']}")
    print(f"Worklines checked: {len(report['worklines'])}")

    if report["missingFiles"]:
        print("\nMissing required files:")
        for path in report["missingFiles"]:
            print(f"  - {path}")

    if report["markerViolations"]:
        print("\nMarker violations:")
        for path, markers in report["markerViolations"].items():
            print(f"  - {path}")
            for marker in markers:
                print(f"    missing: {marker}")

    for workline in report["worklines"]:
        print(f"\nWorkline: {workline['id']}")
        print(f"  triggered: {'YES' if workline['triggered'] else 'NO'}")
        print(f"  tracker updated: {'YES' if workline['trackerUpdated'] else 'NO'}")
        print(f"  sync note files: {len(workline['syncNoteFiles'])}")
        if workline["triggeredFiles"]:
            print("  triggered files:")
            for path in workline["triggeredFiles"]:
                print(f"    - {path}")
        if workline["triggeredCommits"]:
            print("  triggered commits:")
            for message in workline["triggeredCommits"]:
                print(f"    - {message}")
        if workline["syncNoteFiles"]:
            print("  sync note files:")
            for path in workline["syncNoteFiles"]:
                print(f"    - {path}")

    if report["compliant"]:
        print("\n✅ COMPLIANT — Progress trackers and tracker-sync notes are aligned for triggered worklines.")
        return

    print("\n❌ VIOLATION — At least one triggered workline changed governed tranche posture without a canonical tracker sync.")
    print("   Action required:")
    print(f"   1. Update the registered tracker (for example `docs/reference/CVF_WHITEPAPER_PROGRESS_TRACKER.md`).")
    print(f"   2. Add a short sync note using {TEMPLATE_PATH}.")
    print(f"   3. Keep bootstrap-facing pointers truthful so {BOOTSTRAP_PATH} remains reliable.")


def main() -> int:
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(errors="replace")
    if hasattr(sys.stderr, "reconfigure"):
        sys.stderr.reconfigure(errors="replace")

    parser = argparse.ArgumentParser(description="CVF progress tracker sync compatibility gate")
    parser.add_argument("--base", default=None, help="Git base ref (default: auto-detect merge-base, then fallback HEAD~1)")
    parser.add_argument("--head", default=None, help="Git head ref (default: HEAD)")
    parser.add_argument("--enforce", action="store_true", help="Return non-zero (exit 2) when GC-026 is incomplete or misaligned")
    parser.add_argument("--json", action="store_true", help="Print JSON report to stdout instead of text")
    parser.add_argument("--write-report", default=None, help="Optional output path for JSON report file")
    args = parser.parse_args()

    base, head, base_source = _resolve_range(args.base, args.head)

    try:
        commits = _get_commits_in_range(base, head)
        changed_map = _get_changed_name_status(base, head)
    except RuntimeError as exc:
        if args.base:
            fallback_base = "HEAD~1"
            try:
                commits = _get_commits_in_range(fallback_base, head)
                changed_map = _get_changed_name_status(fallback_base, head)
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

    worktree_map = _get_worktree_name_status()
    merged = _merge_changed_maps(changed_map, worktree_map)

    if not commits and not merged:
        last_commit = _get_last_commit()
        if last_commit is not None:
            commits = [last_commit]
            merged = _merge_changed_maps(_get_last_commit_name_status())
            base_source = "last-commit-fallback"

    classified = _classify(commits, merged)
    report = {
        "timestamp": dt.datetime.now(dt.timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z"),
        "range": {"base": base, "head": head, "baseSource": base_source},
        "policy": GUARD_PATH,
        **classified,
    }

    if args.write_report:
        out_path = Path(args.write_report)
        if not out_path.is_absolute():
            out_path = (REPO_ROOT / out_path).resolve()
        out_path.parent.mkdir(parents=True, exist_ok=True)
        out_path.write_text(json.dumps(report, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")

    if args.json:
        print(json.dumps(report, indent=2, ensure_ascii=False))
    else:
        _print_report(report, base, head, base_source)

    if args.enforce and not report["compliant"]:
        return 2
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
