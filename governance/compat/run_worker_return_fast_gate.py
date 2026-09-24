#!/usr/bin/env python3
"""
CVF Worker Return Fast Gate.

One command for no-commit workers and reviewers to catch common return defects
before the full closure chain: focused tests, generated-registry drift,
reviewer-fast structural gates, changed source/test registry coverage, and
whitespace diff hygiene.
"""

from __future__ import annotations

import argparse
from dataclasses import dataclass
import subprocess
import sys
import time
from pathlib import Path


REPO_ROOT = Path(__file__).resolve().parents[2]


def _configure_stdout() -> None:
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    if hasattr(sys.stderr, "reconfigure"):
        sys.stderr.reconfigure(encoding="utf-8", errors="replace")


@dataclass(frozen=True)
class FastGateCommand:
    name: str
    command: tuple[str, ...]


def build_commands(
    pytest_targets: tuple[str, ...] = (), active_work_order: str | None = None
) -> tuple[FastGateCommand, ...]:
    commands: list[FastGateCommand] = []
    if pytest_targets:
        commands.append(
            FastGateCommand(
                "focused pytest targets",
                ("python", "-m", "pytest", *pytest_targets, "-q"),
            )
        )
    probe_admission_command = [
        "python",
        "governance/compat/check_independent_review_probe_admission.py",
        "--enforce",
        "--changed-lane-only",
    ]
    quality_command = [
        "python",
        "governance/compat/check_worker_return_quality_gate.py",
        "--enforce",
    ]
    if active_work_order:
        probe_admission_command += ["--active-work-order", active_work_order]
        quality_command += ["--active-work-order", active_work_order]
    commands.extend(
        [
            FastGateCommand(
                "corpus scan registry aggregate drift",
                ("python", "governance/compat/generate_corpus_scan_registry.py", "--check"),
            ),
            FastGateCommand(
                "epistemic process packet",
                ("python", "governance/compat/check_epistemic_process_packet.py", "--enforce"),
            ),
            FastGateCommand("worker-return quality gate", tuple(quality_command)),
            FastGateCommand("independent review probe admission", tuple(probe_admission_command)),
            FastGateCommand(
                "reviewer-fast governance gate",
                ("python", "governance/compat/run_local_governance_hook_chain.py", "--hook", "reviewer-fast"),
            ),
            FastGateCommand("git diff whitespace check", ("git", "diff", "--check")),
        ]
    )
    return tuple(commands)


def _run(command: FastGateCommand) -> int:
    print(f"\n=== {command.name} ===")
    print(" ".join(command.command))
    start = time.perf_counter()
    proc = subprocess.run(
        list(command.command),
        cwd=REPO_ROOT,
        text=True,
        encoding="utf-8",
        errors="replace",
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
    )
    elapsed = time.perf_counter() - start
    if proc.stdout:
        print(proc.stdout.rstrip())
    if proc.returncode == 0:
        print(f"PASS: {command.name} ({elapsed:.2f}s)")
    else:
        print(f"FAIL: {command.name} exited {proc.returncode} ({elapsed:.2f}s)")
    return proc.returncode


def main() -> int:
    _configure_stdout()
    parser = argparse.ArgumentParser(description="Run the CVF worker-return fast gate")
    parser.add_argument(
        "--pytest-target",
        action="append",
        default=[],
        help="Focused pytest path/module to run before reviewer-fast. Repeat for multiple targets.",
    )
    parser.add_argument(
        "--active-work-order",
        default=None,
        help=(
            "Repo-relative path of the work order currently being executed. "
            "Forwarded as --active-work-order to the worker-return quality "
            "checker (exact bound return must exist and pass) and to the "
            "independent-probe-admission checker (return stays in the changed "
            "lane, even while untracked)."
        ),
    )
    args = parser.parse_args()

    print("=== CVF Worker Return Fast Gate ===")
    print("Purpose: fail early on worker-return defects before full closure gates.")
    failures = 0
    total_start = time.perf_counter()
    for command in build_commands(tuple(args.pytest_target), args.active_work_order):
        if _run(command) != 0:
            failures += 1
    elapsed = time.perf_counter() - total_start
    if failures:
        print(f"\nVIOLATION: worker-return fast gate blocked by {failures} failure(s) in {elapsed:.2f}s.")
        return 1
    print(f"\nCOMPLIANT: worker-return fast gate passed in {elapsed:.2f}s.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
