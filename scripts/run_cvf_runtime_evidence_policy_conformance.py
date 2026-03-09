#!/usr/bin/env python3
"""
Regenerate runtime evidence artifacts and validate cross-family release-policy posture.
"""

from __future__ import annotations

import subprocess
import sys
import os
from pathlib import Path


REPO_ROOT = Path(__file__).resolve().parents[1]
RELEASE_GATE = REPO_ROOT / "scripts" / "run_cvf_runtime_evidence_release_gate.py"
POLICY_GATE = REPO_ROOT / "governance" / "compat" / "check_runtime_evidence_release_policy.py"
PACKET_PATH = REPO_ROOT / "docs" / "reviews" / "cvf_phase_governance" / "CVF_RELEASE_APPROVAL_PACKET_LOCAL_BASELINE_2026-03-07.md"


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
    if os.environ.get("CVF_SKIP_RUNTIME_EVIDENCE_RELEASE_GATE") != "1":
        _run([sys.executable, str(RELEASE_GATE)])
    _run([sys.executable, str(POLICY_GATE), "--packet", str(PACKET_PATH), "--enforce"])
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
