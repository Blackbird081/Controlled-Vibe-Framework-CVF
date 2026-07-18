#!/usr/bin/env python3
"""
CVF Agent Autorun Workflow Gate

Runs the phase-specific guard bundle agents must pass before dispatch,
implementation, closure, or push. The wrapper does not replace the underlying
guards; it makes the autorun stop points explicit and repeatable.
"""

from __future__ import annotations

import argparse
from concurrent.futures import ThreadPoolExecutor, as_completed
from dataclasses import dataclass
import hashlib
import json
import subprocess
import sys
import time
from pathlib import Path

try:
    import run_agent_commit_steward_preflight as steward
except ModuleNotFoundError:  # imported as governance.compat.run_agent_autorun_workflow_gate
    from governance.compat import run_agent_commit_steward_preflight as steward


REPO_ROOT = Path(__file__).resolve().parents[2]
DEFAULT_RECEIPT_DIR = REPO_ROOT / ".cvf" / "runtime" / "autorun-receipts"
RECEIPT_SCHEMA = "cvf.autorun.pass-receipt.v1"

try:
    from agent_autorun_command_catalog import (
        GateCommand,
        GateResult,
        GitStatusResult,
        PRE_PUSH_COMMANDS,
        RANGE_GATE_NAMES,
        _common_commands,
        _pre_implementation_commands,
    )
except ModuleNotFoundError:  # imported as governance.compat.run_agent_autorun_workflow_gate
    from governance.compat.agent_autorun_command_catalog import (
        GateCommand,
        GateResult,
        GitStatusResult,
        PRE_PUSH_COMMANDS,
        RANGE_GATE_NAMES,
        _common_commands,
        _pre_implementation_commands,
    )

def _execute(index: int, command: GateCommand) -> GateResult:
    started = time.perf_counter()
    proc = subprocess.run(
        list(command.command),
        cwd=REPO_ROOT,
        text=True,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
    )
    return GateResult(
        index=index,
        name=command.name,
        command=command.command,
        returncode=proc.returncode,
        duration_s=time.perf_counter() - started,
        output=proc.stdout or "",
    )


def _print_result(result: GateResult, *, show_success_output: bool) -> None:
    status = "PASS" if result.returncode == 0 else "FAIL"
    print(f"[{status}] {result.name} ({result.duration_s:.2f}s)")
    if result.output and (show_success_output or result.returncode != 0):
        print(result.output.rstrip())


def _run_commands(
    commands: tuple[GateCommand, ...],
    *,
    parallel: bool,
    max_workers: int,
) -> tuple[GateResult, ...]:
    if not commands:
        return ()
    if not parallel:
        results: list[GateResult] = []
        for index, command in enumerate(commands, start=1):
            print(f"\n=== {command.name} ===")
            print(" ".join(command.command))
            result = _execute(index, command)
            _print_result(result, show_success_output=True)
            results.append(result)
        return tuple(results)

    worker_count = max(1, min(max_workers, len(commands)))
    print(
        f"\n=== parallel autorun bundle: {len(commands)} commands, "
        f"max_workers={worker_count} ==="
    )
    results: list[GateResult] = []
    with ThreadPoolExecutor(max_workers=worker_count) as executor:
        futures = [
            executor.submit(_execute, index, command)
            for index, command in enumerate(commands, start=1)
        ]
        for future in as_completed(futures):
            result = future.result()
            _print_result(result, show_success_output=False)
            results.append(result)
    return tuple(sorted(results, key=lambda item: item.index))


def _command_manifest_hash(commands: tuple[GateCommand, ...]) -> str:
    payload = [
        {"name": command.name, "command": list(command.command)}
        for command in commands
    ]
    encoded = json.dumps(payload, sort_keys=True, separators=(",", ":")).encode("utf-8")
    return hashlib.sha256(encoded).hexdigest()


def _worktree_fingerprint(base: str, head: str) -> str:
    plan = steward.build_path_plan(base, head)
    digest = hashlib.sha256()
    for path in plan.changed_paths:
        digest.update(path.encode("utf-8", errors="replace"))
        digest.update(b"\0")
        full = REPO_ROOT / path
        if full.is_file():
            digest.update(hashlib.sha256(full.read_bytes()).digest())
        else:
            digest.update(b"<missing-or-directory>")
        digest.update(b"\0")
    return digest.hexdigest()


def _receipt_path(phase: str, receipt_dir: Path) -> Path:
    return receipt_dir / f"{phase}.json"


def _receipt_context(
    phase: str,
    base: str,
    head: str,
    base_sha: str,
    head_sha: str,
    commands: tuple[GateCommand, ...],
) -> dict[str, str]:
    return {
        "phase": phase,
        "base": base,
        "head": head,
        "baseSha": base_sha,
        "headSha": head_sha,
        "commandManifestHash": _command_manifest_hash(commands),
        "worktreeFingerprint": _worktree_fingerprint(base, head),
    }


def _load_valid_receipt(path: Path, expected: dict[str, str]) -> tuple[bool, str]:
    if not path.is_file():
        return False, "receipt missing"
    try:
        payload = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as exc:
        return False, f"receipt unreadable: {exc}"
    if payload.get("schema") != RECEIPT_SCHEMA or payload.get("status") != "PASS":
        return False, "receipt schema or status mismatch"
    for key, value in expected.items():
        if payload.get(key) != value:
            return False, f"receipt {key} mismatch"
    return True, "exact receipt context match"


def _write_receipt(
    path: Path,
    context: dict[str, str],
    results: tuple[GateResult, ...],
    total_duration_s: float,
) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    payload = {
        "schema": RECEIPT_SCHEMA,
        "status": "PASS",
        **context,
        "totalDurationSeconds": round(total_duration_s, 3),
        "checks": [
            {
                "name": result.name,
                "command": list(result.command),
                "durationSeconds": round(result.duration_s, 3),
                "status": "PASS",
            }
            for result in results
        ],
    }
    temp_path = path.with_suffix(".tmp")
    temp_path.write_text(json.dumps(payload, indent=2) + "\n", encoding="utf-8")
    temp_path.replace(path)


def _git_status_short() -> GitStatusResult:
    proc = subprocess.run(
        ["git", "status", "--short"],
        cwd=REPO_ROOT,
        text=True,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
    )
    return GitStatusResult(
        returncode=proc.returncode,
        stdout=proc.stdout.strip(),
        stderr=proc.stderr.strip(),
    )


def _closure_worktree_finality_failures() -> int:
    status = _git_status_short()
    if status.stderr:
        print("Git status diagnostics:")
        print(status.stderr)
    if status.returncode != 0:
        print("FAIL: git status --short failed during closure finality.")
        return 1
    if status.stdout:
        print(status.stdout)
        print(
            "FAIL: pre-closure cannot claim CLOSED while worktree changes are "
            "uncommitted, untracked, or otherwise unresolved."
        )
        return 1
    print("PASS: worktree is clean for closure claim finality.")
    return 0


def _git_rev_parse(ref: str) -> str:
    proc = subprocess.run(
        ["git", "rev-parse", "--short", ref],
        cwd=REPO_ROOT,
        text=True,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
    )
    if proc.returncode != 0:
        raise RuntimeError(proc.stdout.strip() or f"failed to resolve {ref}")
    return proc.stdout.strip()


def _git_diff_name_status(base: str, head: str) -> str:
    proc = subprocess.run(
        ["git", "diff", "--name-status", f"{base}..{head}"],
        cwd=REPO_ROOT,
        text=True,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
    )
    if proc.returncode != 0:
        return proc.stdout.strip()
    return proc.stdout.strip()


def _range_shape_preflight(phase: str, base: str, head: str) -> int:
    if phase not in {"pre-closure", "pre-push"}:
        return 0

    plan = steward.build_path_plan(base, head)
    if not plan.exact_manifest_collision_risk:
        return 0

    print("\n=== committed range shape preflight ===")
    print(
        "FAIL: range mixes Agent Operation Trace exact-manifest artifacts with "
        "protected session/handoff paths."
    )
    print("This range is not valid closure evidence for a single exact-manifest batch.")
    print("Run split ranges instead: material range first, then closure/session range.")
    print(f"Recommended steward lane: {steward._recommended_mode(plan)}")
    if plan.trace_artifact_paths:
        print("Trace artifacts:")
        for path in plan.trace_artifact_paths:
            print(f"  - {path}")
    if plan.protected_session_paths:
        print("Protected session/handoff paths:")
        for path in plan.protected_session_paths:
            print(f"  - {path}")
    return 1


def _default_base_for_phase(phase: str) -> str:
    if phase in {"pre-closure", "pre-push"}:
        return "HEAD~1"
    return "HEAD"


def _run_phase(
    phase: str,
    base: str | None,
    head: str,
    *,
    serial: bool = False,
    max_workers: int = 6,
    reuse_valid_receipt: bool = False,
    receipt_dir: Path = DEFAULT_RECEIPT_DIR,
) -> int:
    total_started = time.perf_counter()
    resolved_base = base or _default_base_for_phase(phase)
    print("=== CVF Agent Autorun Workflow Gate ===")
    print(f"Phase: {phase}")
    print("Policy: docs/reference/CVF_AGENT_AUTORUN_WORKFLOW_CONTROL_STANDARD_2026-05-28.md")
    print(f"Range: {resolved_base}..{head}")

    try:
        base_sha = _git_rev_parse(resolved_base)
        head_sha = _git_rev_parse(head)
    except RuntimeError as exc:
        print(f"FAIL: could not resolve autorun gate range: {exc}")
        return 1
    print(f"Base HEAD anchor: {base_sha}")
    print(f"Head anchor: {head_sha}")

    failures = 0
    common_commands: list[GateCommand] = list(_common_commands(resolved_base, head))

    # At pre-implementation, prepend phase-specific early-diagnostic commands
    # (forbidden filesystem state plus the AAF early diagnostics wire-in) so a
    # worker sees local defects before writing material files. See
    # _pre_implementation_commands for the per-command rationale.
    if phase == "pre-implementation":
        phase_commands = _pre_implementation_commands(resolved_base, head)
        common_commands[:0] = phase_commands

    if phase in {"pre-closure", "pre-push"} and base_sha == head_sha:
        print(
            "FAIL: closure/push autorun gates require a non-empty committed "
            "range. Pass --base <baseHead> --head HEAD or run after a commit "
            "with default HEAD~1..HEAD."
        )
        failures += 1
    elif phase in {"pre-closure", "pre-push"}:
        changed = _git_diff_name_status(resolved_base, head)
        print("\n=== committed range evidence ===")
        print(changed if changed else "No committed files changed in range.")
        if not changed:
            print("FAIL: closure/push range has no committed diff evidence.")
            failures += 1
        range_shape_failures = _range_shape_preflight(phase, resolved_base, head)
        if range_shape_failures:
            print(
                f"\nVIOLATION: {phase} blocked by committed range shape before "
                "running the full guard bundle."
            )
            return 1

    common_tuple = tuple(common_commands)
    trailing_commands = PRE_PUSH_COMMANDS if phase == "pre-push" else ()
    all_commands = common_tuple + trailing_commands
    context = _receipt_context(
        phase,
        resolved_base,
        head,
        base_sha,
        head_sha,
        all_commands,
    )
    receipt_path = _receipt_path(phase, receipt_dir)
    if reuse_valid_receipt:
        valid, reason = _load_valid_receipt(receipt_path, context)
        if valid:
            print(f"\nREUSED: {reason}: {receipt_path}")
            print(f"COMPLIANT: {phase} autorun gate passed from exact local PASS receipt.")
            return 0
        print(f"\nReceipt reuse unavailable ({reason}); running full autorun bundle.")

    results = _run_commands(
        common_tuple,
        parallel=not serial,
        max_workers=max_workers,
    )
    failures += sum(result.returncode != 0 for result in results)
    trailing_results = _run_commands(
        trailing_commands,
        parallel=False,
        max_workers=1,
    )
    failures += sum(result.returncode != 0 for result in trailing_results)
    all_results = results + trailing_results

    if phase == "pre-closure":
        print("\n=== closure worktree finality ===")
        failures += _closure_worktree_finality_failures()

    if failures:
        elapsed = time.perf_counter() - total_started
        print(
            f"\nVIOLATION: {phase} blocked by {failures} failing gate(s) "
            f"in {elapsed:.2f}s."
        )
        return 1

    elapsed = time.perf_counter() - total_started
    _write_receipt(receipt_path, context, all_results, elapsed)
    print(f"\nReceipt: {receipt_path}")
    print(f"COMPLIANT: {phase} autorun gate passed in {elapsed:.2f}s.")
    return 0


def main() -> int:
    parser = argparse.ArgumentParser(description="Run CVF agent autorun workflow gate")
    parser.add_argument(
        "--phase",
        choices=("pre-dispatch", "pre-implementation", "pre-closure", "pre-push"),
        required=True,
    )
    parser.add_argument(
        "--base",
        default=None,
        help="Base commit/ref for range-aware gates. Defaults to HEAD for pre-dispatch/pre-implementation and HEAD~1 for pre-closure/pre-push.",
    )
    parser.add_argument("--head", default="HEAD", help="Head commit/ref for range-aware gates.")
    parser.add_argument("--serial", action="store_true", help="Run commands serially for debugging.")
    parser.add_argument("--max-workers", type=int, default=6, help="Maximum parallel common checks.")
    parser.add_argument(
        "--reuse-valid-receipt",
        action="store_true",
        help="Reuse only an exact local PASS receipt; otherwise run the full bundle.",
    )
    parser.add_argument(
        "--receipt-dir",
        type=Path,
        default=DEFAULT_RECEIPT_DIR,
        help="Local ignored autorun receipt directory.",
    )
    args = parser.parse_args()
    return _run_phase(
        args.phase,
        args.base,
        args.head,
        serial=args.serial,
        max_workers=args.max_workers,
        reuse_valid_receipt=args.reuse_valid_receipt,
        receipt_dir=args.receipt_dir,
    )


if __name__ == "__main__":
    sys.exit(main())
