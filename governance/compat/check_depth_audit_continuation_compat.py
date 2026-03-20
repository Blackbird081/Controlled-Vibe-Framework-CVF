#!/usr/bin/env python3
"""
CVF Depth Audit Continuation Compatibility Gate

Ensures that once the system-unification roadmap is materially delivered,
any further substantive active-path change leaves a reviewable GC-018
continuation checkpoint instead of silently reopening roadmap deepening.

Policy anchors:
  - governance/toolkit/05_OPERATION/CVF_DEPTH_AUDIT_GUARD.md
  - docs/reference/CVF_GOVERNANCE_CONTROL_MATRIX.md#GC-018

Usage examples:
  python governance/compat/check_depth_audit_continuation_compat.py
  python governance/compat/check_depth_audit_continuation_compat.py --base origin/main --head HEAD
  python governance/compat/check_depth_audit_continuation_compat.py --base <sha> --head <sha> --enforce
  python governance/compat/check_depth_audit_continuation_compat.py --json
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

ROADMAP_PATH = "docs/roadmaps/CVF_SYSTEM_UNIFICATION_REMEDIATION_ROADMAP_2026-03-19.md"

ACTIVE_PATH_PREFIXES = (
    "EXTENSIONS/CVF_GUARD_CONTRACT/",
    "EXTENSIONS/CVF_v1.1.1_PHASE_GOVERNANCE_PROTOCOL/",
    "EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/",
)

NON_SUBSTANTIVE_ACTIVE_MARKERS = (
    "/__tests__/",
    "/fixtures/",
    "/mocks/",
    "/coverage/",
)

NON_SUBSTANTIVE_ACTIVE_SUFFIXES = (
    ".test.ts",
    ".test.tsx",
    ".spec.ts",
    ".spec.tsx",
    ".md",
    ".snap",
)

CHECKPOINT_DOC_PREFIXES = (
    "docs/baselines/",
    "docs/reviews/",
    "docs/reference/",
)

CHECKPOINT_DOC_EXACT = {
    ROADMAP_PATH,
}

CHECKPOINT_IGNORE_EXACT = {
    "docs/CVF_INCREMENTAL_TEST_LOG.md",
    "docs/baselines/README.md",
}

DEPTH_AUDIT_MARKERS = (
    "GC-018",
    "Depth Audit",
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


def _merge_changed_maps(*maps: dict[str, set[str]]) -> dict[str, list[str]]:
    merged: dict[str, set[str]] = {}
    for changed_map in maps:
        for path, statuses in changed_map.items():
            merged.setdefault(path, set()).update(statuses)
    return {path: sorted(statuses) for path, statuses in sorted(merged.items())}


def _is_deleted_only(statuses: list[str]) -> bool:
    return all(status.startswith("D") for status in statuses)


def _is_substantive_active_path(path: str, statuses: list[str]) -> bool:
    if _is_deleted_only(statuses):
        return False
    if not any(path.startswith(prefix) for prefix in ACTIVE_PATH_PREFIXES):
        return False
    if any(marker in path for marker in NON_SUBSTANTIVE_ACTIVE_MARKERS):
        return False
    if path.endswith(NON_SUBSTANTIVE_ACTIVE_SUFFIXES):
        return False
    return True


def _is_checkpoint_doc(path: str, statuses: list[str]) -> bool:
    if _is_deleted_only(statuses):
        return False
    if path in CHECKPOINT_IGNORE_EXACT:
        return False
    if path in CHECKPOINT_DOC_EXACT:
        return True
    return any(path.startswith(prefix) for prefix in CHECKPOINT_DOC_PREFIXES)


def _read_text(path: str) -> str:
    abs_path = REPO_ROOT / path
    if not abs_path.exists() or abs_path.is_dir():
        return ""
    return abs_path.read_text(encoding="utf-8")


def _roadmap_is_materially_delivered() -> bool:
    text = _read_text(ROADMAP_PATH)
    if not text:
        return False
    return "`MATERIALLY DELIVERED`" in text


def _contains_depth_audit_marker(path: str) -> bool:
    text = _read_text(path)
    if not text:
        return False
    return any(marker in text for marker in DEPTH_AUDIT_MARKERS)


def _classify(commits: list[dict[str, str]], changed_paths: dict[str, list[str]]) -> dict[str, Any]:
    active_paths = {
        path: statuses
        for path, statuses in changed_paths.items()
        if not _is_deleted_only(statuses)
    }

    materially_delivered = _roadmap_is_materially_delivered()
    substantive_active_paths = [
        path for path, statuses in active_paths.items()
        if _is_substantive_active_path(path, statuses)
    ]
    checkpoint_docs = [
        path for path, statuses in active_paths.items()
        if _is_checkpoint_doc(path, statuses)
    ]
    roadmap_updated = ROADMAP_PATH in checkpoint_docs
    gc18_linked_docs = [
        path for path in checkpoint_docs
        if _contains_depth_audit_marker(path)
    ]

    requires_checkpoint = materially_delivered and len(substantive_active_paths) > 0
    compliant = (not requires_checkpoint) or (
        roadmap_updated and len(gc18_linked_docs) > 0
    )

    return {
        "totalCommits": len(commits),
        "roadmapMateriallyDelivered": materially_delivered,
        "requiresCheckpoint": requires_checkpoint,
        "substantiveActivePaths": substantive_active_paths,
        "substantiveActivePathCount": len(substantive_active_paths),
        "checkpointDocsUpdated": checkpoint_docs,
        "checkpointDocCount": len(checkpoint_docs),
        "roadmapUpdated": roadmap_updated,
        "gc18LinkedDocs": gc18_linked_docs,
        "gc18LinkedDocCount": len(gc18_linked_docs),
        "compliant": compliant,
        "changedFiles": list(changed_paths.keys()),
    }


def _print_report(report: dict[str, Any], base: str, head: str, base_source: str) -> None:
    print("=== CVF Depth Audit Continuation Gate ===")
    print(f"Range: {base}..{head}")
    print(f"Base source: {base_source}")
    print(f"Total commits: {report['totalCommits']}")
    print(f"Roadmap materially delivered: {report['roadmapMateriallyDelivered']}")
    print(f"Substantive active-path files changed: {report['substantiveActivePathCount']}")
    print(f"Checkpoint docs updated: {report['checkpointDocCount']}")
    print(f"GC-018 linked docs updated: {report['gc18LinkedDocCount']}")

    if report["substantiveActivePaths"]:
        print("\nSubstantive active-path files:")
        for path in report["substantiveActivePaths"]:
            print(f"  - {path}")

    if report["checkpointDocsUpdated"]:
        print("\nCheckpoint docs updated:")
        for path in report["checkpointDocsUpdated"]:
            print(f"  - {path}")

    if report["gc18LinkedDocs"]:
        print("\nGC-018 linked docs:")
        for path in report["gc18LinkedDocs"]:
            print(f"  - {path}")

    if report["compliant"]:
        if report["requiresCheckpoint"]:
            print("\n✅ COMPLIANT — Post-closure active-path change includes a reviewable GC-018 continuation checkpoint.")
        else:
            print("\n✅ SKIP — No post-closure active-path continuation checkpoint required in this range.")
        return

    print("\n❌ VIOLATION — Post-closure active-path change lacks a reviewable GC-018 continuation checkpoint.")
    print("   Action required:")
    print(f"   1. Update {ROADMAP_PATH} with the latest continuation decision.")
    print("   2. Add or update at least one docs/baselines/, docs/reviews/, or docs/reference/ artifact")
    print("      that explicitly references GC-018 or contains a Depth Audit record.")
    print("   3. Re-run the local governance hook chain before pushing.")


def main() -> int:
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(errors="replace")
    if hasattr(sys.stderr, "reconfigure"):
        sys.stderr.reconfigure(errors="replace")

    parser = argparse.ArgumentParser(
        description="CVF depth-audit continuation compatibility gate"
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
        help="Return non-zero (exit 2) when a post-closure active-path change lacks a GC-018 checkpoint"
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
        "policy": "governance/toolkit/05_OPERATION/CVF_DEPTH_AUDIT_GUARD.md",
        "controlId": "GC-018",
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
