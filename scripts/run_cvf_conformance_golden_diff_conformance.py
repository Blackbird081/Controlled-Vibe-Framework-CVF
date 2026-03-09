#!/usr/bin/env python3
"""
Run the canonical Wave 1 golden-diff gate and emit the markdown diff report.
"""

from __future__ import annotations

import subprocess
import sys
from pathlib import Path


REPO_ROOT = Path(__file__).resolve().parents[1]
GATE = REPO_ROOT / "governance" / "compat" / "check_conformance_golden_diff.py"
REPORT = REPO_ROOT / "docs" / "reviews" / "cvf_phase_governance" / "CVF_CONFORMANCE_DIFF_REPORT_2026-03-07.md"


def main() -> int:
    process = subprocess.run(
        [sys.executable, str(GATE), "--report-output", str(REPORT), "--enforce"],
        cwd=REPO_ROOT,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        text=True,
        encoding="utf-8",
        errors="replace",
    )
    sys.stdout.write(process.stdout)
    return process.returncode


if __name__ == "__main__":
    raise SystemExit(main())
