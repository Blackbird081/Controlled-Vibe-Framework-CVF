#!/usr/bin/env python3
"""
Validate packet-specific transition prerequisites across local and secondary packet postures.
"""

from __future__ import annotations

import subprocess
import sys
from pathlib import Path


REPO_ROOT = Path(__file__).resolve().parents[1]
LOCAL_PACKET = REPO_ROOT / "scripts" / "run_cvf_cross_family_packet_coverage_conformance.py"
SECONDARY_PACKETS = REPO_ROOT / "scripts" / "run_cvf_secondary_packet_cross_family_coverage_conformance.py"


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
    _run([sys.executable, str(LOCAL_PACKET)])
    _run([sys.executable, str(SECONDARY_PACKETS)])
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
