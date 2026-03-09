#!/usr/bin/env python3
"""
Run one cross-family packet gate across all canonical packet postures.
"""

from __future__ import annotations

import argparse
import os
import subprocess
import sys
from pathlib import Path


REPO_ROOT = Path(__file__).resolve().parents[1]
BOOTSTRAP = REPO_ROOT / "scripts" / "run_cvf_packet_posture_state_bootstrap.py"
PACKETS = (
    REPO_ROOT / "docs" / "reviews" / "cvf_phase_governance" / "CVF_RELEASE_APPROVAL_PACKET_LOCAL_BASELINE_2026-03-07.md",
    REPO_ROOT / "docs" / "reviews" / "cvf_phase_governance" / "CVF_RELEASE_REVIEW_PACKET_PRODUCTION_CANDIDATE_2026-03-07.md",
    REPO_ROOT / "docs" / "reviews" / "cvf_phase_governance" / "CVF_INTERNAL_AUDIT_PACKET_2026-03-07.md",
    REPO_ROOT / "docs" / "reviews" / "cvf_phase_governance" / "CVF_ENTERPRISE_ONBOARDING_PACKET_2026-03-07.md",
)


def _run(command: list[str]) -> None:
    process = subprocess.run(
        command,
        cwd=REPO_ROOT,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        text=True,
        encoding="utf-8",
        errors="replace",
    )
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(errors="replace")
    sys.stdout.write(process.stdout)
    if process.returncode != 0:
        raise SystemExit(process.returncode)


def main() -> int:
    parser = argparse.ArgumentParser(description="Run one packet gate across all canonical packet postures.")
    parser.add_argument("--gate", required=True, help="Relative path to the governance compat gate")
    args = parser.parse_args()

    gate = Path(args.gate)
    if not gate.is_absolute():
        gate = (REPO_ROOT / gate).resolve()

    if os.environ.get("CVF_SKIP_PACKET_POSTURE_STATE_BOOTSTRAP") != "1":
        _run([sys.executable, str(BOOTSTRAP)])

    for packet in PACKETS:
        _run([sys.executable, str(gate), "--packet", str(packet), "--enforce"])
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
