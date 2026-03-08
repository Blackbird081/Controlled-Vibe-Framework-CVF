#!/usr/bin/env python3
"""Read a precomputed packet posture cache for a single Wave 1 scenario."""

from __future__ import annotations

import argparse
import json
import os
import subprocess
import sys
from pathlib import Path


REPO_ROOT = Path(__file__).resolve().parents[1]
CACHE_OUTPUT = (
    REPO_ROOT
    / "docs"
    / "reviews"
    / "cvf_phase_governance"
    / "CVF_PACKET_POSTURE_STATE_CACHE_2026-03-07.json"
)
BOOTSTRAP_SCRIPT = REPO_ROOT / "scripts" / "run_cvf_packet_posture_state_bootstrap.py"


def ensure_cache() -> None:
    if os.environ.get("CVF_SKIP_PACKET_POSTURE_STATE_BOOTSTRAP") == "1" and CACHE_OUTPUT.exists():
        return
    proc = subprocess.run(
        [sys.executable, str(BOOTSTRAP_SCRIPT)],
        cwd=REPO_ROOT,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        text=True,
        encoding="utf-8",
        errors="replace",
    )
    if proc.returncode != 0:
        print(proc.stdout.strip())
        raise SystemExit(proc.returncode)


def main() -> int:
    parser = argparse.ArgumentParser(description="Read a cached packet posture result.")
    parser.add_argument("--scenario-id", required=True)
    args = parser.parse_args()

    ensure_cache()
    cache = json.loads(CACHE_OUTPUT.read_text(encoding="utf-8"))
    scenario = cache.get("scenarios", {}).get(args.scenario_id)
    if scenario is None:
        print(f"Scenario not found in packet posture cache: {args.scenario_id}")
        return 2

    print(f"=== CVF packet posture cache: {args.scenario_id} ===")
    print(f"Cache: {CACHE_OUTPUT.relative_to(REPO_ROOT).as_posix()}")
    print(f"Command: {scenario['command']}")
    print(f"Status: {scenario['status']}")
    print("")
    print(scenario["output"])
    return 0 if scenario["status"] == "passed" else 2


if __name__ == "__main__":
    raise SystemExit(main())
