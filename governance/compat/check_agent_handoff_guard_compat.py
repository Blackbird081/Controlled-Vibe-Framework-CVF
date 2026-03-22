#!/usr/bin/env python3
"""
CVF Agent Handoff Guard Compatibility Gate

Ensures that the GC-020 handoff chain stays aligned:
- transition classification guard exists
- handoff guard references the transition guard
- canonical template references the transition guard
- master policy and governance control matrix reference the full chain
- local governance hook chain actually runs this gate

This gate enforces repo-level alignment for the handoff standard. It does not
claim to detect live chat pauses or agent switches by itself.
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

TRANSITION_GUARD_PATH = "governance/toolkit/05_OPERATION/CVF_AGENT_HANDOFF_TRANSITION_GUARD.md"
HANDOFF_GUARD_PATH = "governance/toolkit/05_OPERATION/CVF_AGENT_HANDOFF_GUARD.md"
HANDOFF_TEMPLATE_PATH = "docs/reference/CVF_AGENT_HANDOFF_TEMPLATE.md"
MASTER_POLICY_PATH = "governance/toolkit/02_POLICY/CVF_MASTER_POLICY.md"
CONTROL_MATRIX_PATH = "docs/reference/CVF_GOVERNANCE_CONTROL_MATRIX.md"
CONTEXT_MODEL_PATH = "docs/reference/CVF_CONTEXT_CONTINUITY_MODEL.md"
HOOK_CHAIN_PATH = "governance/compat/run_local_governance_hook_chain.py"
THIS_SCRIPT_PATH = "governance/compat/check_agent_handoff_guard_compat.py"

REQUIRED_FILES = (
    TRANSITION_GUARD_PATH,
    HANDOFF_GUARD_PATH,
    HANDOFF_TEMPLATE_PATH,
    MASTER_POLICY_PATH,
    CONTROL_MATRIX_PATH,
    CONTEXT_MODEL_PATH,
    HOOK_CHAIN_PATH,
)

REQUIRED_MARKERS: dict[str, tuple[str, ...]] = {
    TRANSITION_GUARD_PATH: (
        "Continue",
        "Pause",
        "Break",
        "Shift handoff",
        "Agent transfer",
        "Escalation handoff",
        "Closure",
        "Before writing a handoff",
    ),
    HANDOFF_GUARD_PATH: (
        TRANSITION_GUARD_PATH,
        HANDOFF_TEMPLATE_PATH,
        "Pause / Resume Interpretation",
        "context quality control by phase for multi-agent continuation",
    ),
    HANDOFF_TEMPLATE_PATH: (
        TRANSITION_GUARD_PATH,
        "When To Use",
        "Minimum Handoff Fields",
        "Phase-bounded context to load first",
        "context quality control by phase for multi-agent continuation",
    ),
    MASTER_POLICY_PATH: (
        "Agent handoff is mandatory whenever governed work pauses or transfers before closure",
        TRANSITION_GUARD_PATH,
        HANDOFF_GUARD_PATH,
        HANDOFF_TEMPLATE_PATH,
        CONTEXT_MODEL_PATH,
        "context quality control by phase for multi-agent continuation",
    ),
    CONTROL_MATRIX_PATH: (
        "GC-020",
        TRANSITION_GUARD_PATH,
        HANDOFF_GUARD_PATH,
        HANDOFF_TEMPLATE_PATH,
        CONTEXT_MODEL_PATH,
        "memory keeps durable truth, handoff compresses transition truth, and context loading should stay phase-bounded",
    ),
    CONTEXT_MODEL_PATH: (
        "memory = repository of facts, history, and durable evidence",
        "handoff = governance-filtered summary and transfer checkpoint",
        "context loading = phase-bounded loading of only what the current step needs",
        "handoff is context quality control by phase for multi-agent continuation",
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
    print("=== CVF Agent Handoff Guard Compatibility Gate ===")
    print(f"Range: {base}..{head}")
    print(f"Base source: {base_source}")
    print(f"Required files checked: {report['requiredFileCount']}")
    print(f"Relevant GC-020 files changed: {report['relevantChangedFileCount']}")
    print(f"Missing files: {report['missingFileCount']}")
    print(f"Marker violations: {report['markerViolationCount']}")

    if report["relevantChangedFiles"]:
        print("\nRelevant GC-020 files changed:")
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
        print("\n✅ COMPLIANT — GC-020 handoff transition, context-continuity model, guard, template, policy, and hook-chain alignment is intact.")
        return

    print("\n❌ VIOLATION — GC-020 handoff chain is incomplete or misaligned.")
    print("   Action required:")
    print(f"   1. Ensure {TRANSITION_GUARD_PATH} exists and defines the canonical transition taxonomy.")
    print(f"   2. Ensure {CONTEXT_MODEL_PATH} defines the canonical memory/handoff/context-loading model.")
    print(f"   3. Ensure {HANDOFF_GUARD_PATH}, {HANDOFF_TEMPLATE_PATH}, {MASTER_POLICY_PATH}, and")
    print(f"      {CONTROL_MATRIX_PATH} reference the same GC-020 chain truthfully.")
    print(f"   4. Ensure {HOOK_CHAIN_PATH} runs {THIS_SCRIPT_PATH}.")


def main() -> int:
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(errors="replace")
    if hasattr(sys.stderr, "reconfigure"):
        sys.stderr.reconfigure(errors="replace")

    parser = argparse.ArgumentParser(
        description="CVF Agent Handoff Guard compatibility gate"
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
        help="Return non-zero (exit 2) when the GC-020 chain is incomplete or misaligned"
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
        "timestamp": dt.datetime.now(dt.timezone.utc)
            .replace(microsecond=0).isoformat().replace("+00:00", "Z"),
        "range": {"base": base, "head": head, "baseSource": base_source},
        "policy": TRANSITION_GUARD_PATH,
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
