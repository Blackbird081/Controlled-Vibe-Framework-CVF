#!/usr/bin/env python3
"""
CVF Dispatch Packet Author Fast Gate

One-command pre-return gate for authors producing GC-018 / work-order dispatch
packets. Run this before setting a packet's status to DISPATCHED, DISPATCH_READY,
or DISPATCHED_TO_WORKER.

Runs the five checks that have historically blocked Claude-authored packets:
  1. check_work_order_dispatch_quality   -- Worker Autonomy, dispatchBaseHead,
                                           Source Verification columns, disposition vocab
  2. check_markdown_structural_completeness -- required section presence
  3. check_agent_packet_authority_and_encoding -- encoding / authority hygiene
  4. check_agent_operation_trace         -- Agent Operation Trace manifest
  5. check_dispatch_prompt_envelope      -- Dispatch Prompt Envelope required fields or N/A

Exit codes:
  0  all checks passed -- packet is authoring-quality
  1  one or more checks failed -- keep packet in HOLD/DRAFT

Usage:
  python governance/compat/run_dispatch_packet_author_fast_gate.py
  python governance/compat/run_dispatch_packet_author_fast_gate.py --base <SHA> --head HEAD
  python governance/compat/run_dispatch_packet_author_fast_gate.py --base <SHA> --head HEAD --enforce

The gate defaults to --base HEAD --head HEAD (worktree/index validation) when
--base is not supplied, matching the same default used by the local hook chain.
Pass an explicit --base <SHA> to check a real changed range.

The --enforce flag is required for CI / pre-commit hook integration. Without it
the gate prints results but exits 0 (advisory mode). With it the gate exits 1
on any failure.
"""

from __future__ import annotations

import argparse
import subprocess
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]

GATE_COMMANDS = [
    {
        "label": "dispatch-quality",
        "cmd": [
            sys.executable,
            "governance/compat/check_work_order_dispatch_quality.py",
        ],
        "description": (
            "Worker Autonomy / No-Question Rule, dispatchBaseHead commit SHA, "
            "Source Verification canonical columns and disposition vocabulary"
        ),
    },
    {
        "label": "structural-completeness",
        "cmd": [
            sys.executable,
            "governance/compat/check_markdown_structural_completeness.py",
        ],
        "description": "Required section presence (Evidence Requirements, Review Gate, Closure Checklist, Return Conditions)",
    },
    {
        "label": "authority-and-encoding",
        "cmd": [
            sys.executable,
            "governance/compat/check_agent_packet_authority_and_encoding.py",
        ],
        "description": "Encoding hygiene and authority section presence",
    },
    {
        "label": "agent-operation-trace",
        "cmd": [
            sys.executable,
            "governance/compat/check_agent_operation_trace.py",
        ],
        "description": "Agent Operation Trace manifest completeness and MATCH verdict",
    },
    {
        "label": "dispatch-prompt-envelope",
        "cmd": [
            sys.executable,
            "governance/compat/check_dispatch_prompt_envelope.py",
        ],
        "description": (
            "Dispatch-ready work orders carry a Dispatch Prompt Envelope with required "
            "fields or explicit N/A with reason"
        ),
    },
]

SEPARATOR = "-" * 72


def _run_check(
    label: str,
    cmd: list[str],
    description: str,
    base: str,
    head: str,
    enforce: bool,
) -> bool:
    full_cmd = cmd + ["--base", base, "--head", head, "--enforce"]
    print(f"\n[{label}] {description}")
    print(f"  cmd: {' '.join(full_cmd)}")
    result = subprocess.run(
        full_cmd,
        cwd=str(REPO_ROOT),
        capture_output=False,
        text=True,
    )
    passed = result.returncode == 0
    status = "PASS" if passed else "FAIL"
    print(f"  => {status}")
    return passed


def main() -> int:
    parser = argparse.ArgumentParser(
        description="CVF dispatch packet author pre-return fast gate."
    )
    parser.add_argument(
        "--base",
        default="HEAD",
        help="Base commit ref for changed-file range (default: HEAD = worktree validation).",
    )
    parser.add_argument(
        "--head",
        default="HEAD",
        help="Head commit ref (default: HEAD).",
    )
    parser.add_argument(
        "--enforce",
        action="store_true",
        help="Exit 1 on failure. Without this flag the gate is advisory only.",
    )
    args = parser.parse_args()

    print(SEPARATOR)
    print("CVF Dispatch Packet Author Fast Gate")
    print(f"Range: {args.base}..{args.head}")
    print(
        "Rule: keep packet status in HOLD/DRAFT until all checks pass."
    )
    print(SEPARATOR)

    results: list[tuple[str, bool]] = []
    for gate in GATE_COMMANDS:
        passed = _run_check(
            label=gate["label"],
            cmd=gate["cmd"],
            description=gate["description"],
            base=args.base,
            head=args.head,
            enforce=args.enforce,
        )
        results.append((gate["label"], passed))

    print(f"\n{SEPARATOR}")
    all_pass = all(ok for _, ok in results)
    for label, ok in results:
        mark = "PASS" if ok else "FAIL"
        print(f"  {mark}  {label}")
    print(SEPARATOR)

    if all_pass:
        print("ALL CHECKS PASSED -- packet is authoring-quality.")
        print("You may set Status: DISPATCHED_TO_WORKER / DISPATCH_READY.")
        return 0

    failed = [label for label, ok in results if not ok]
    print(f"FAILED: {', '.join(failed)}")
    print(
        "Keep packet in HOLD/DRAFT and fix the findings above before dispatch."
    )
    if args.enforce:
        return 1
    print("(Advisory mode: exiting 0. Add --enforce for CI / hook integration.)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
