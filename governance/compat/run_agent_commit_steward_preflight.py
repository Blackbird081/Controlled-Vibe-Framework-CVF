#!/usr/bin/env python3
"""
CVF Agent Commit Steward Preflight

Runs the phase-appropriate pre-commit/pre-handoff checks and reports commit
shape risks before an agent spends time in a failing git commit attempt.
"""

from __future__ import annotations

import argparse
from dataclasses import dataclass
import subprocess
import sys
from pathlib import Path
import re


REPO_ROOT = Path(__file__).resolve().parents[2]
STANDARD_PATH = "docs/reference/CVF_AGENT_COMMIT_STEWARD_PROTOCOL_STANDARD_2026-06-15.md"

SESSION_PREFIXES = (
    "CVF_SESSION/",
    "CVF_SESSION_MEMORY.md",
)
MATERIAL_SESSION_SUBPREFIXES = (
    "CVF_SESSION/agent_workspace/",
)
HANDOFF_PREFIXES = (
    "AGENT_HANDOFF",
    "CVF_SESSION/handoffs/",
)
AGENTS_PATH = "AGENTS.md"
HANDOFF_REFERENCE_RE = re.compile(r"AGENT_HANDOFF(?:_V\d+_\d{4}-\d{2}-\d{2})?\.md")


@dataclass(frozen=True)
class Command:
    name: str
    args: tuple[str, ...]


@dataclass(frozen=True)
class PathPlan:
    changed_paths: tuple[str, ...]
    material_paths: tuple[str, ...]
    protected_session_paths: tuple[str, ...]
    trace_artifact_paths: tuple[str, ...]
    mixed_material_and_session: bool
    exact_manifest_collision_risk: bool
    handoff_sync_only: bool


def _configure_stdout() -> None:
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    if hasattr(sys.stderr, "reconfigure"):
        sys.stderr.reconfigure(encoding="utf-8", errors="replace")


def _run_raw(args: tuple[str, ...]) -> subprocess.CompletedProcess[str]:
    return subprocess.run(
        list(args),
        cwd=REPO_ROOT,
        text=True,
        encoding="utf-8",
        errors="replace",
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
    )


def _run(command: Command) -> int:
    print(f"\n=== {command.name} ===")
    print(" ".join(command.args))
    proc = _run_raw(command.args)
    if proc.stdout:
        print(proc.stdout.rstrip())
    if proc.returncode == 0:
        print(f"PASS: {command.name}")
    else:
        print(f"FAIL: {command.name} exited {proc.returncode}")
    return proc.returncode


def _git_output(*args: str, check: bool = True) -> str:
    proc = subprocess.run(
        ["git", *args],
        cwd=REPO_ROOT,
        text=True,
        encoding="utf-8",
        errors="replace",
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
    )
    if check and proc.returncode != 0:
        message = proc.stderr.strip() or proc.stdout.strip()
        raise RuntimeError(message or f"git {' '.join(args)} failed")
    return proc.stdout.strip()


def _short_ref(ref: str) -> str:
    return _git_output("rev-parse", "--short", ref)


def _status_paths() -> tuple[str, ...]:
    out = _git_output("status", "--short")
    paths: set[str] = set()
    for line in out.splitlines():
        if not line.strip():
            continue
        path = line[3:].strip() if len(line) > 2 and line[2] == " " else line[2:].strip()
        if " -> " in path:
            path = path.split(" -> ", 1)[1]
        paths.add(path.replace("\\", "/"))
    return tuple(sorted(paths))


def _range_paths(base: str, head: str) -> tuple[str, ...]:
    out = _git_output("diff", "--name-only", f"{base}..{head}", check=False)
    return tuple(sorted(path.replace("\\", "/") for path in out.splitlines() if path.strip()))


def _is_protected_session_path(path: str) -> bool:
    if path.startswith(MATERIAL_SESSION_SUBPREFIXES):
        return False
    return path.startswith(SESSION_PREFIXES) or path.startswith(HANDOFF_PREFIXES)


def _agents_change_is_handoff_routing_only(base: str) -> bool:
    before = _git_output("show", f"{base}:{AGENTS_PATH}", check=False)
    agents_file = REPO_ROOT / AGENTS_PATH
    if not before or not agents_file.exists():
        return False
    after = agents_file.read_text(encoding="utf-8", errors="replace")

    def normalize(text: str) -> str:
        normalized = HANDOFF_REFERENCE_RE.sub("AGENT_HANDOFF_ACTIVE.md", text)
        return normalized.replace("\r\n", "\n").strip()

    return before != after and normalize(before) == normalize(after)


def _is_active_handoff_path(path: str) -> bool:
    return path.startswith("AGENT_HANDOFF") and path.endswith(".md")


def _has_agent_operation_trace(path: str) -> bool:
    full = REPO_ROOT / path
    if not full.exists() or full.is_dir() or not path.endswith(".md"):
        return False
    text = full.read_text(encoding="utf-8", errors="replace")
    return "## Agent Operation Trace Block" in text and "Actual changed set" in text


def build_path_plan(base: str, head: str) -> PathPlan:
    changed = set(_range_paths(base, head))
    changed.update(_status_paths())
    changed_paths = tuple(sorted(changed))
    has_session_companion = any(_is_protected_session_path(path) for path in changed_paths)
    agents_is_session_router = (
        AGENTS_PATH in changed_paths
        and has_session_companion
        and _agents_change_is_handoff_routing_only(base)
    )
    protected = tuple(
        path
        for path in changed_paths
        if _is_protected_session_path(path) or (path == AGENTS_PATH and agents_is_session_router)
    )
    material = tuple(path for path in changed_paths if path not in protected)
    trace_artifacts = tuple(path for path in changed_paths if _has_agent_operation_trace(path))
    mixed = bool(protected and material)
    exact_manifest_collision_risk = mixed and bool(trace_artifacts)
    handoff_sync_only = bool(changed_paths) and all(
        _is_active_handoff_path(path) for path in changed_paths
    )
    return PathPlan(
        changed_paths=changed_paths,
        material_paths=material,
        protected_session_paths=protected,
        trace_artifact_paths=trace_artifacts,
        mixed_material_and_session=mixed,
        exact_manifest_collision_risk=exact_manifest_collision_risk,
        handoff_sync_only=handoff_sync_only,
    )


def _recommended_mode(plan: PathPlan) -> str:
    if plan.handoff_sync_only:
        return "handoff-sync"
    if plan.protected_session_paths and not plan.material_paths:
        return "session-sync"
    if plan.mixed_material_and_session:
        return "split: material first, session-sync/handoff-sync second"
    if plan.material_paths:
        return "phase-specific material mode"
    return "no changed paths detected"


def _print_path_plan(plan: PathPlan) -> None:
    print("\n=== commit shape plan ===")
    print(f"Changed paths: {len(plan.changed_paths)}")
    for path in plan.changed_paths:
        print(f"  - {path}")
    print(f"Material paths: {len(plan.material_paths)}")
    for path in plan.material_paths:
        print(f"  + {path}")
    print(f"Protected session/handoff paths: {len(plan.protected_session_paths)}")
    for path in plan.protected_session_paths:
        print(f"  ! {path}")
    print(f"Agent Operation Trace exact-manifest artifacts: {len(plan.trace_artifact_paths)}")
    for path in plan.trace_artifact_paths:
        print(f"  * {path}")
    if plan.mixed_material_and_session:
        print("Split recommendation: material commit first, session/handoff sync commit second.")
    else:
        print("Split recommendation: N/A with reason: changed paths are not mixed material/session.")
    print(f"Recommended steward lane: {_recommended_mode(plan)}")


def _mode_commands(mode: str, base: str, head: str) -> tuple[Command, ...]:
    phase_by_mode = {
        "dispatch": "pre-dispatch",
        "implementation": "pre-implementation",
        "closure": "pre-closure",
        "push": "pre-push",
    }
    if mode in phase_by_mode:
        return (
            Command(
                f"autorun {phase_by_mode[mode]}",
                (
                    "python",
                    "governance/compat/run_agent_autorun_workflow_gate.py",
                    "--phase",
                    phase_by_mode[mode],
                    "--base",
                    base,
                    "--head",
                    head,
                    "--reuse-valid-receipt",
                ),
            ),
            Command("diff hygiene", ("git", "diff", "--check")),
        )
    if mode == "reviewer-return":
        return (
            Command(
                "worker return fast gate",
                ("python", "governance/compat/run_worker_return_fast_gate.py"),
            ),
            Command("diff hygiene", ("git", "diff", "--check")),
        )
    if mode == "session-sync":
        return (
            Command(
                "closure packaging preflight",
                (
                    "python",
                    "governance/compat/check_closure_packaging_preflight.py",
                    "--base",
                    base,
                    "--head",
                    head,
                    "--enforce",
                ),
            ),
            Command(
                "generated active session state check",
                ("python", "governance/compat/generate_active_session_state.py", "--check"),
            ),
            Command(
                "active session state compatibility",
                ("python", "governance/compat/check_active_session_state.py", "--enforce"),
            ),
            Command(
                "session mode consistency",
                ("python", "governance/compat/check_session_mode_consistency.py", "--enforce"),
            ),
            Command(
                "next-move freshness",
                ("python", "governance/compat/check_next_move_freshness.py", "--enforce"),
            ),
            Command("diff hygiene", ("git", "diff", "--check")),
        )
    if mode == "handoff-sync":
        return (
            Command(
                "active session state compatibility",
                ("python", "governance/compat/check_active_session_state.py", "--enforce"),
            ),
            Command("diff hygiene", ("git", "diff", "--check")),
        )
    raise ValueError(f"unsupported mode: {mode}")


def _validate_mode_shape(mode: str, base: str, head: str, plan: PathPlan, enforce: bool) -> int:
    failures = 0
    if mode in {"closure", "push"}:
        base_sha = _short_ref(base)
        head_sha = _short_ref(head)
        if base_sha == head_sha:
            print(
                "VIOLATION: closure/push stewardship requires a non-empty committed range."
            )
            failures += 1
    if mode == "session-sync" and plan.material_paths:
        print(
            "VIOLATION: session-sync mode has material paths. Use material mode first, "
            "then session-sync."
        )
        failures += 1
    if mode == "handoff-sync":
        if not plan.handoff_sync_only:
            print(
                "VIOLATION: handoff-sync mode must change only root active handoff "
                "files such as AGENT_HANDOFF_V18_2026-06-12.md."
            )
            failures += 1
    if plan.exact_manifest_collision_risk:
        message = (
            "HIGH-RISK SHAPE: Agent Operation Trace exact-manifest artifact is "
            "mixed with protected session/handoff paths."
        )
        print(message)
        if enforce:
            failures += 1
    return failures


def main() -> int:
    _configure_stdout()
    parser = argparse.ArgumentParser(
        description="Run the CVF agent-neutral commit steward preflight."
    )
    parser.add_argument(
        "--mode",
        choices=(
            "dispatch",
            "implementation",
            "reviewer-return",
            "closure",
            "push",
            "session-sync",
            "handoff-sync",
        ),
        required=True,
    )
    parser.add_argument("--base", default="HEAD", help="Base ref for range-aware checks.")
    parser.add_argument("--head", default="HEAD", help="Head ref for range-aware checks.")
    parser.add_argument("--enforce", action="store_true", help="Fail high-risk commit-shape conflicts.")
    parser.add_argument("--plan-only", action="store_true", help="Print shape plan without running gates.")
    args = parser.parse_args()

    print("=== CVF Agent Commit Steward Preflight ===")
    print(f"Standard: {STANDARD_PATH}")
    print(f"Mode: {args.mode}")
    print(f"Range: {args.base}..{args.head}")
    print(f"Base anchor: {_short_ref(args.base)}")
    print(f"Head anchor: {_short_ref(args.head)}")
    print(f"Enforce shape: {args.enforce}")

    plan = build_path_plan(args.base, args.head)
    _print_path_plan(plan)

    failures = _validate_mode_shape(args.mode, args.base, args.head, plan, args.enforce)
    if args.plan_only:
        if failures:
            print(f"\nVIOLATION: commit steward plan blocked by {failures} issue(s).")
            return 1
        print("\nCOMPLIANT: commit steward plan-only check completed.")
        return 0

    for command in _mode_commands(args.mode, args.base, args.head):
        if _run(command) != 0:
            failures += 1

    if failures:
        print(f"\nVIOLATION: commit steward preflight blocked by {failures} issue(s).")
        return 1
    print("\nCOMPLIANT: commit steward preflight passed.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
