#!/usr/bin/env python3
"""
CVF Session Governance Bootstrap Compatibility Gate

Ensures that the GC-025 session-start routing chain stays aligned:
- bootstrap guard exists
- canonical bootstrap reference exists
- policy and control matrix reference GC-025 consistently
- docs index points to the bootstrap reference
- local hook chain and CI workflow enforce this compatibility gate
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

BOOTSTRAP_GUARD_PATH = "governance/toolkit/05_OPERATION/CVF_SESSION_GOVERNANCE_BOOTSTRAP_GUARD.md"
BOOTSTRAP_REFERENCE_PATH = "docs/reference/CVF_SESSION_GOVERNANCE_BOOTSTRAP.md"
ARTIFACT_AUTHORING_STANDARD_PATH = "docs/reference/CVF_GOVERNED_ARTIFACT_AUTHORING_STANDARD.md"
MASTER_POLICY_PATH = "governance/toolkit/02_POLICY/CVF_MASTER_POLICY.md"
CONTROL_MATRIX_PATH = "docs/reference/CVF_GOVERNANCE_CONTROL_MATRIX.md"
DOCS_INDEX_PATH = "docs/INDEX.md"
HOOK_CHAIN_PATH = "governance/compat/run_local_governance_hook_chain.py"
WORKFLOW_PATH = ".github/workflows/documentation-testing.yml"
THIS_SCRIPT_PATH = "governance/compat/check_session_governance_bootstrap.py"

REQUIRED_FILES = (
    BOOTSTRAP_GUARD_PATH,
    BOOTSTRAP_REFERENCE_PATH,
    MASTER_POLICY_PATH,
    CONTROL_MATRIX_PATH,
    DOCS_INDEX_PATH,
    HOOK_CHAIN_PATH,
    WORKFLOW_PATH,
)

REQUIRED_MARKERS: dict[str, tuple[str, ...]] = {
    BOOTSTRAP_GUARD_PATH: (
        "Control ID:",
        "GC-025",
        BOOTSTRAP_REFERENCE_PATH,
        "GC-032",
        ARTIFACT_AUTHORING_STANDARD_PATH,
        "Always-On Bootstrap",
        "Trigger-Based Controls",
        "Task-Class Routing",
        "Do not read every governance guard in full by default",
        THIS_SCRIPT_PATH,
    ),
    BOOTSTRAP_REFERENCE_PATH: (
        "Always-On Bootstrap",
        "Current Canonical Status First",
        "Trigger-Based Controls",
        "Task-Class Routing",
        "Memory / Handoff / Bootstrap Separation",
        "If Unsure",
        "GC-018",
        "GC-019",
        "GC-020",
        "GC-023",
        "GC-024",
        "GC-032",
        ARTIFACT_AUTHORING_STANDARD_PATH,
        "docs/reference/CVF_WHITEPAPER_PROGRESS_TRACKER.md",
        "docs/roadmaps/CVF_WHITEPAPER_COMPLETION_ROADMAP_2026-03-21.md",
    ),
    MASTER_POLICY_PATH: (
        "Session governance bootstrap is mandatory before governed work starts or resumes in a fresh session",
        BOOTSTRAP_GUARD_PATH,
        BOOTSTRAP_REFERENCE_PATH,
        THIS_SCRIPT_PATH,
    ),
    CONTROL_MATRIX_PATH: (
        "GC-025",
        BOOTSTRAP_GUARD_PATH,
        BOOTSTRAP_REFERENCE_PATH,
        THIS_SCRIPT_PATH,
    ),
    DOCS_INDEX_PATH: (
        "reference/CVF_SESSION_GOVERNANCE_BOOTSTRAP.md",
    ),
    HOOK_CHAIN_PATH: (
        THIS_SCRIPT_PATH,
    ),
    WORKFLOW_PATH: (
        THIS_SCRIPT_PATH,
        "session-governance-bootstrap",
        "Session Governance Bootstrap",
    ),
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


def _get_changed_files(base: str, head: str) -> list[str]:
    code, out, err = _run_git(["diff", "--name-only", f"{base}..{head}"])
    if code != 0:
        raise RuntimeError(f"git diff failed for range {base}..{head}: {err or out}")
    return [line.replace("\\", "/").strip() for line in out.splitlines() if line.strip()]


def _get_worktree_changed_files() -> list[str]:
    files: set[str] = set()
    for args in (["diff", "--name-only"], ["diff", "--name-only", "--cached"]):
        code, out, _ = _run_git(args)
        if code == 0 and out:
            for line in out.splitlines():
                normalized = line.replace("\\", "/").strip()
                if normalized:
                    files.add(normalized)
    code, out, _ = _run_git(["ls-files", "--others", "--exclude-standard"])
    if code == 0 and out:
        for line in out.splitlines():
            normalized = line.replace("\\", "/").strip()
            if normalized:
                files.add(normalized)
    return sorted(files)


def _read_text(path: str) -> str:
    abs_path = REPO_ROOT / path
    if not abs_path.exists() or abs_path.is_dir():
        return ""
    return abs_path.read_text(encoding="utf-8")


def _classify(changed_files: list[str]) -> dict[str, Any]:
    missing_files = [path for path in REQUIRED_FILES if not (REPO_ROOT / path).exists()]

    marker_violations: dict[str, list[str]] = {}
    for path, markers in REQUIRED_MARKERS.items():
        text = _read_text(path)
        missing_markers = [marker for marker in markers if marker not in text]
        if missing_markers:
            marker_violations[path] = missing_markers

    relevant_changed_files = [
        path for path in changed_files
        if path in REQUIRED_FILES or path == THIS_SCRIPT_PATH
    ]

    compliant = not missing_files and not marker_violations

    return {
        "requiredFileCount": len(REQUIRED_FILES),
        "missingFiles": missing_files,
        "missingFileCount": len(missing_files),
        "markerViolations": marker_violations,
        "markerViolationCount": len(marker_violations),
        "relevantChangedFiles": relevant_changed_files,
        "relevantChangedFileCount": len(relevant_changed_files),
        "compliant": compliant,
        "changedFiles": changed_files,
    }


def _print_report(report: dict[str, Any], base: str, head: str, base_source: str) -> None:
    print("=== CVF Session Governance Bootstrap Compatibility Gate ===")
    print(f"Range: {base}..{head}")
    print(f"Base source: {base_source}")
    print(f"Required files checked: {report['requiredFileCount']}")
    print(f"Relevant GC-025 files changed: {report['relevantChangedFileCount']}")
    print(f"Missing files: {report['missingFileCount']}")
    print(f"Marker violations: {report['markerViolationCount']}")

    if report["relevantChangedFiles"]:
        print("\nRelevant GC-025 files changed:")
        for path in report["relevantChangedFiles"]:
            print(f"  - {path}")

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

    if report["compliant"]:
        print("\n✅ COMPLIANT — GC-025 session bootstrap, routing references, policy, docs index, hook-chain, and CI alignment is intact.")
        return

    print("\n❌ VIOLATION — GC-025 session bootstrap chain is incomplete or misaligned.")
    print("   Action required:")
    print(f"   1. Ensure {BOOTSTRAP_GUARD_PATH} exists and defines the canonical bootstrap-loading rule.")
    print(f"   2. Ensure {BOOTSTRAP_REFERENCE_PATH} defines the canonical always-on bootstrap and trigger-based routing.")
    print(f"   3. Ensure {MASTER_POLICY_PATH}, {CONTROL_MATRIX_PATH}, and {DOCS_INDEX_PATH} reference the same GC-025 chain.")
    print(f"   4. Ensure {HOOK_CHAIN_PATH} and {WORKFLOW_PATH} run {THIS_SCRIPT_PATH}.")


def main() -> int:
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(errors="replace")
    if hasattr(sys.stderr, "reconfigure"):
        sys.stderr.reconfigure(errors="replace")

    parser = argparse.ArgumentParser(description="CVF Session Governance Bootstrap compatibility gate")
    parser.add_argument("--base", default=None, help="Git base ref (default: auto-detect merge-base, then fallback HEAD~1)")
    parser.add_argument("--head", default=None, help="Git head ref (default: HEAD)")
    parser.add_argument("--enforce", action="store_true", help="Return non-zero (exit 2) when the GC-025 chain is incomplete or misaligned")
    parser.add_argument("--json", action="store_true", help="Print JSON report to stdout instead of text")
    parser.add_argument("--write-report", default=None, help="Optional output path for JSON report file")
    args = parser.parse_args()

    base, head, base_source = _resolve_range(args.base, args.head)

    try:
        changed_files = _get_changed_files(base, head)
    except RuntimeError as exc:
        if args.base:
            fallback_base = "HEAD~1"
            try:
                changed_files = _get_changed_files(fallback_base, head)
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

    worktree_files = _get_worktree_changed_files()
    if worktree_files:
        changed_files = sorted(set(changed_files) | set(worktree_files))

    classified = _classify(changed_files)
    report = {
        "timestamp": dt.datetime.now(dt.timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z"),
        "range": {"base": base, "head": head, "baseSource": base_source},
        "policy": BOOTSTRAP_GUARD_PATH,
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
