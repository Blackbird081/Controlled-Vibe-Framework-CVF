#!/usr/bin/env python3
"""
CVF Fast Lane Governance Compatibility Gate

Ensures that the lightweight governance chain stays aligned:
- fast-lane guard exists
- fast-lane templates exist
- master policy references the guard
- control matrix registers the control
- local hook chain runs this gate

This gate enforces repo-level alignment for the fast-lane standard.
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

FAST_LANE_GUARD_PATH = "governance/toolkit/05_OPERATION/CVF_FAST_LANE_GOVERNANCE_GUARD.md"
FAST_LANE_AUDIT_TEMPLATE_PATH = "docs/reference/CVF_FAST_LANE_AUDIT_TEMPLATE.md"
FAST_LANE_REVIEW_TEMPLATE_PATH = "docs/reference/CVF_FAST_LANE_REVIEW_TEMPLATE.md"
MASTER_POLICY_PATH = "governance/toolkit/02_POLICY/CVF_MASTER_POLICY.md"
CONTROL_MATRIX_PATH = "docs/reference/CVF_GOVERNANCE_CONTROL_MATRIX.md"
HOOK_CHAIN_PATH = "governance/compat/run_local_governance_hook_chain.py"
THIS_SCRIPT_PATH = "governance/compat/check_fast_lane_governance_compat.py"

REQUIRED_FILES = (
    FAST_LANE_GUARD_PATH,
    FAST_LANE_AUDIT_TEMPLATE_PATH,
    FAST_LANE_REVIEW_TEMPLATE_PATH,
    MASTER_POLICY_PATH,
    CONTROL_MATRIX_PATH,
    HOOK_CHAIN_PATH,
)

REQUIRED_MARKERS: dict[str, tuple[str, ...]] = {
    FAST_LANE_GUARD_PATH: (
        "Fast Lane",
        "Full Lane",
        "already-authorized tranche",
        "no physical merge",
        "no runtime authority or control boundary changes",
        "no target-state claim is widened",
        "Lane Selection Is Not Memory Classification",
        "GC-022",
    ),
    FAST_LANE_AUDIT_TEMPLATE_PATH: (
        "Eligibility Check",
        "Why Fast Lane Is Safe",
        "FAST LANE READY",
        "ESCALATE TO FULL LANE",
        "Default output memory class for the filled audit: `FULL_RECORD` under `GC-022`",
    ),
    FAST_LANE_REVIEW_TEMPLATE_PATH: (
        "Qualification Check",
        "Review Verdict",
        "APPROVE",
        "ESCALATE TO FULL LANE",
        "Default output memory class for the filled review: `FULL_RECORD` under `GC-022`",
    ),
    MASTER_POLICY_PATH: (
        "Fast-lane governance is allowed only for low-risk additive work inside an already-authorized tranche",
        "Fast-lane selection controls evidence burden only; durable memory class is still governed separately by `GC-022`.",
        FAST_LANE_GUARD_PATH,
        FAST_LANE_AUDIT_TEMPLATE_PATH,
        FAST_LANE_REVIEW_TEMPLATE_PATH,
    ),
    CONTROL_MATRIX_PATH: (
        "GC-021",
        "`GC-021` and `GC-022` are intentionally separate: lane selection sets evidence burden, while memory governance sets durable storage class for each artifact.",
        FAST_LANE_GUARD_PATH,
        FAST_LANE_AUDIT_TEMPLATE_PATH,
        FAST_LANE_REVIEW_TEMPLATE_PATH,
    ),
    HOOK_CHAIN_PATH: (
        THIS_SCRIPT_PATH,
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
    print("=== CVF Fast Lane Governance Compatibility Gate ===")
    print(f"Range: {base}..{head}")
    print(f"Base source: {base_source}")
    print(f"Required files checked: {report['requiredFileCount']}")
    print(f"Relevant fast-lane files changed: {report['relevantChangedFileCount']}")
    print(f"Missing files: {report['missingFileCount']}")
    print(f"Marker violations: {report['markerViolationCount']}")

    if report["relevantChangedFiles"]:
        print("\nRelevant fast-lane files changed:")
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
        print("\n✅ COMPLIANT — Fast-lane guard, templates, policy, control-matrix, and hook-chain alignment is intact.")
        return

    print("\n❌ VIOLATION — Fast-lane governance chain is incomplete or misaligned.")
    print("   Action required:")
    print(f"   1. Ensure {FAST_LANE_GUARD_PATH} defines the fast-lane eligibility and full-lane triggers.")
    print(f"   2. Ensure {FAST_LANE_AUDIT_TEMPLATE_PATH} and {FAST_LANE_REVIEW_TEMPLATE_PATH} exist.")
    print(f"   3. Ensure {MASTER_POLICY_PATH} and {CONTROL_MATRIX_PATH} reference the same fast-lane chain truthfully.")
    print(f"   4. Ensure {HOOK_CHAIN_PATH} runs {THIS_SCRIPT_PATH}.")


def main() -> int:
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(errors="replace")
    if hasattr(sys.stderr, "reconfigure"):
        sys.stderr.reconfigure(errors="replace")

    parser = argparse.ArgumentParser(description="CVF fast-lane governance compatibility gate")
    parser.add_argument("--base", default=None, help="Git base ref (default: auto-detect merge-base, then fallback HEAD~1)")
    parser.add_argument("--head", default=None, help="Git head ref (default: HEAD)")
    parser.add_argument("--enforce", action="store_true", help="Return non-zero (exit 2) when the fast-lane chain is incomplete or misaligned")
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
        "policy": FAST_LANE_GUARD_PATH,
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
