#!/usr/bin/env python3
"""
CVF Agent Push Readiness Preview

Runs a small read-only preview before a provenance/public push attempt so
late marker, continuity, and commit-shape failures surface before the full
pre-push gate cascade.
"""

from __future__ import annotations

import argparse
from dataclasses import asdict, dataclass
import json
import subprocess
import sys
import time
from pathlib import Path

try:
    import run_agent_commit_steward_preflight as steward
except ModuleNotFoundError:  # imported as governance.compat.run_agent_push_readiness_preview
    from governance.compat import run_agent_commit_steward_preflight as steward


REPO_ROOT = Path(__file__).resolve().parents[2]
DEFAULT_UPSTREAM_AHEAD_LIMIT = 2


@dataclass(frozen=True)
class PreviewResult:
    label: str
    command: tuple[str, ...]
    returncode: int
    duration_s: float
    status: str
    output: str


@dataclass(frozen=True)
class ShapeResult:
    changed_paths: tuple[str, ...]
    material_paths: tuple[str, ...]
    protected_session_paths: tuple[str, ...]
    trace_artifact_paths: tuple[str, ...]
    mixed_material_and_session: bool
    exact_manifest_collision_risk: bool
    recommended_lane: str
    status: str


def _configure_stdout() -> None:
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    if hasattr(sys.stderr, "reconfigure"):
        sys.stderr.reconfigure(encoding="utf-8", errors="replace")


def _run_command(label: str, command: tuple[str, ...]) -> PreviewResult:
    started = time.perf_counter()
    proc = subprocess.run(
        list(command),
        cwd=REPO_ROOT,
        text=True,
        encoding="utf-8",
        errors="replace",
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
    )
    status = "PASS" if proc.returncode == 0 else "FAIL"
    return PreviewResult(
        label=label,
        command=command,
        returncode=proc.returncode,
        duration_s=time.perf_counter() - started,
        status=status,
        output=(proc.stdout or "").strip(),
    )


def _git_output(*args: str, check: bool = False) -> tuple[int, str]:
    proc = subprocess.run(
        ["git", *args],
        cwd=REPO_ROOT,
        text=True,
        encoding="utf-8",
        errors="replace",
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
    )
    output = (proc.stdout or "").strip()
    if check and proc.returncode != 0:
        raise RuntimeError(output or f"git {' '.join(args)} failed")
    return proc.returncode, output


def _short_ref(ref: str) -> str:
    return _git_output("rev-parse", "--short", ref, check=True)[1]


def _parse_behind_ahead(counts: str) -> tuple[int, int] | None:
    parts = counts.split()
    if len(parts) != 2:
        return None
    try:
        return int(parts[0]), int(parts[1])
    except ValueError:
        return None


def _upstream_status(ahead_limit: int) -> PreviewResult:
    started = time.perf_counter()
    upstream_code, upstream = _git_output(
        "rev-parse", "--abbrev-ref", "--symbolic-full-name", "@{u}"
    )
    if upstream_code != 0:
        return PreviewResult(
            label="upstream tracking branch",
            command=("git", "rev-parse", "--abbrev-ref", "--symbolic-full-name", "@{u}"),
            returncode=1,
            duration_s=time.perf_counter() - started,
            status="FAIL",
            output=upstream or "no upstream tracking branch",
        )
    counts_code, counts = _git_output("rev-list", "--left-right", "--count", f"{upstream}...HEAD")
    status = "PASS" if counts_code == 0 else "FAIL"
    output = f"upstream={upstream}"
    if counts:
        output = f"{output}; behind_ahead={counts}"
        parsed = _parse_behind_ahead(counts)
        if parsed:
            _behind, ahead = parsed
            if ahead > ahead_limit:
                status = "FAIL"
                output = (
                    f"{output}; VIOLATION: upstream push debt exceeds "
                    f"limit {ahead_limit}. Push or record the blocker before "
                    "opening another governed tranche."
                )
    return PreviewResult(
        label="upstream tracking branch",
        command=("git", "rev-list", "--left-right", "--count", f"{upstream}...HEAD"),
        returncode=counts_code if status == "PASS" else 1,
        duration_s=time.perf_counter() - started,
        status=status,
        output=output,
    )


def _shape_result(base: str, head: str) -> ShapeResult:
    plan = steward.build_path_plan(base, head)
    if plan.exact_manifest_collision_risk or plan.mixed_material_and_session:
        status = "FAIL"
    else:
        status = "PASS"
    return ShapeResult(
        changed_paths=plan.changed_paths,
        material_paths=plan.material_paths,
        protected_session_paths=plan.protected_session_paths,
        trace_artifact_paths=plan.trace_artifact_paths,
        mixed_material_and_session=plan.mixed_material_and_session,
        exact_manifest_collision_risk=plan.exact_manifest_collision_risk,
        recommended_lane=steward._recommended_mode(plan),
        status=status,
    )


def _preview_commands(base: str, head: str) -> tuple[tuple[str, tuple[str, ...]], ...]:
    return (
        ("git remote verification", ("git", "remote", "-v")),
        ("git status", ("git", "status", "--short")),
        (
            "generated active session state check",
            ("python", "governance/compat/generate_active_session_state.py", "--check"),
        ),
        (
            "active session state compatibility",
            ("python", "governance/compat/check_active_session_state.py", "--enforce"),
        ),
        (
            "session mode consistency",
            ("python", "governance/compat/check_session_mode_consistency.py", "--enforce"),
        ),
        (
            "next-move freshness",
            ("python", "governance/compat/check_next_move_freshness.py", "--enforce"),
        ),
        (
            "core guard self-protection",
            (
                "python",
                "governance/compat/check_core_guard_self_protection.py",
                "--base",
                base,
                "--head",
                head,
                "--enforce",
            ),
        ),
        (
            "active-window registry",
            ("python", "governance/compat/check_active_window_registry.py", "--enforce"),
        ),
        (
            "review retention registry",
            ("python", "governance/compat/check_review_retention_registry.py", "--enforce"),
        ),
        (
            "repository lifecycle classification",
            ("python", "governance/compat/check_repository_lifecycle_classification.py", "--enforce"),
        ),
        (
            "pre-public P3 readiness",
            ("python", "governance/compat/check_prepublic_p3_readiness.py", "--enforce"),
        ),
        (
            "knowledge absorption priority guard",
            (
                "python",
                "governance/compat/check_knowledge_absorption_priority_compat.py",
                "--base",
                base,
                "--head",
                head,
                "--enforce",
            ),
        ),
        (
            "public doc drift phrases",
            (
                "python",
                "governance/compat/check_public_doc_drift_phrases.py",
                "--base",
                base,
                "--head",
                head,
                "--enforce",
            ),
        ),
        (
            "governed file size",
            ("python", "governance/compat/check_governed_file_size.py", "--enforce"),
        ),
        (
            "governed python automation size",
            ("python", "governance/compat/check_python_automation_size.py", "--enforce"),
        ),
        ("diff hygiene", ("git", "diff", "--check")),
    )


def _run_preview(
    base: str,
    head: str,
    *,
    include_upstream: bool,
    upstream_ahead_limit: int,
) -> tuple[ShapeResult, tuple[PreviewResult, ...]]:
    _short_ref(base)
    _short_ref(head)
    results: list[PreviewResult] = []
    if include_upstream:
        results.append(_upstream_status(upstream_ahead_limit))
    for label, command in _preview_commands(base, head):
        results.append(_run_command(label, command))
    return _shape_result(base, head), tuple(results)


def _print_text(base: str, head: str, shape: ShapeResult, results: tuple[PreviewResult, ...]) -> None:
    print("=== CVF Agent Push Readiness Preview ===")
    print("Standard: docs/reference/CVF_AGENT_PUSH_READINESS_PREVIEW_STANDARD_2026-06-27.md")
    print(f"Range: {base}..{head}")
    print(f"Commit shape: {shape.status}; recommended lane={shape.recommended_lane}")
    print(f"Changed paths: {len(shape.changed_paths)}")
    for path in shape.changed_paths:
        print(f"  - {path}")
    if shape.mixed_material_and_session:
        print("FAIL: material paths are mixed with protected session/handoff paths.")
    if shape.exact_manifest_collision_risk:
        print("FAIL: exact-manifest trace artifacts are mixed with protected paths.")
    failures = 0 if shape.status == "PASS" else 1
    for result in results:
        print(f"[{result.status}] {result.label} ({result.duration_s:.2f}s)")
        if result.output and result.status == "FAIL":
            print(result.output)
        if result.status == "FAIL":
            failures += 1
    if failures:
        print(f"VIOLATION: push readiness preview found {failures} issue(s).")
    else:
        print("COMPLIANT: push readiness preview passed.")


def main() -> int:
    _configure_stdout()
    parser = argparse.ArgumentParser(description="Run CVF push readiness preview")
    parser.add_argument("--base", default="HEAD", help="Base ref for preview range.")
    parser.add_argument("--head", default="HEAD", help="Head ref for preview range.")
    parser.add_argument("--json", action="store_true", help="Emit machine-readable JSON.")
    parser.add_argument("--enforce", action="store_true", help="Exit nonzero on preview failures.")
    parser.add_argument(
        "--skip-upstream",
        action="store_true",
        help="Skip upstream tracking readout when previewing an untracked branch.",
    )
    parser.add_argument(
        "--upstream-ahead-limit",
        type=int,
        default=DEFAULT_UPSTREAM_AHEAD_LIMIT,
        help=(
            "Maximum allowed local commits ahead of upstream before preview fails. "
            "Default: 2, matching one material commit plus one session-sync commit."
        ),
    )
    args = parser.parse_args()

    try:
        shape, results = _run_preview(
            args.base,
            args.head,
            include_upstream=not args.skip_upstream,
            upstream_ahead_limit=args.upstream_ahead_limit,
        )
    except RuntimeError as exc:
        if args.json:
            print(json.dumps({"status": "FAIL", "error": str(exc)}, indent=2))
        else:
            print(f"FAIL: {exc}")
        return 1 if args.enforce else 0

    failures = (0 if shape.status == "PASS" else 1) + sum(
        result.status == "FAIL" for result in results
    )
    status = "PASS" if failures == 0 else "FAIL"
    if args.json:
        payload = {
            "status": status,
            "base": args.base,
            "head": args.head,
            "shape": asdict(shape),
            "checks": [asdict(result) for result in results],
        }
        print(json.dumps(payload, indent=2))
    else:
        _print_text(args.base, args.head, shape, results)
    if failures and args.enforce:
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
