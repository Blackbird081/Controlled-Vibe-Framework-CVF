#!/usr/bin/env python3
"""
Run the multi-runtime remediation evidence export path and validate the release packet.
"""

from __future__ import annotations

import subprocess
import sys
from pathlib import Path


REPO_ROOT = Path(__file__).resolve().parents[1]
MANIFEST_SCRIPT = REPO_ROOT / "scripts" / "export_cvf_multi_runtime_evidence_manifest.py"
PACKET_SCRIPT = REPO_ROOT / "scripts" / "export_cvf_release_packet.py"
PACKET_PATH = REPO_ROOT / "docs" / "reviews" / "cvf_phase_governance" / "CVF_RELEASE_APPROVAL_PACKET_LOCAL_BASELINE_2026-03-07.md"
ENTERPRISE_GATE = REPO_ROOT / "governance" / "compat" / "check_enterprise_evidence_pack.py"


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
    _run([sys.executable, str(MANIFEST_SCRIPT)])
    _run([sys.executable, str(PACKET_SCRIPT), "--output", str(PACKET_PATH)])
    _run([sys.executable, str(ENTERPRISE_GATE), "--packet", str(PACKET_PATH), "--enforce"])
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
