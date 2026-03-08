#!/usr/bin/env python3
"""
Run Wave 1 conformance and downstream gates sequentially to avoid report/summary race conditions.
"""

from __future__ import annotations

import subprocess
import sys
from pathlib import Path


REPO_ROOT = Path(__file__).resolve().parents[1]
CONFORMANCE = REPO_ROOT / "scripts" / "run_cvf_cross_extension_conformance.py"
CONSISTENCY = REPO_ROOT / "governance" / "compat" / "check_conformance_artifact_consistency.py"
GOLDEN_DIFF = REPO_ROOT / "governance" / "compat" / "check_conformance_golden_diff.py"
RELEASE_GATE = REPO_ROOT / "governance" / "compat" / "check_conformance_release_grade.py"
DOCS_GATE = REPO_ROOT / "governance" / "compat" / "check_docs_governance_compat.py"
TEST_DOC_GATE = REPO_ROOT / "governance" / "compat" / "check_test_doc_compat.py"
REPORT = REPO_ROOT / "docs" / "reviews" / "cvf_phase_governance" / "CVF_CROSS_EXTENSION_CONFORMANCE_REPORT_2026-03-07.md"
SUMMARY = REPO_ROOT / "docs" / "reviews" / "cvf_phase_governance" / "CVF_CROSS_EXTENSION_CONFORMANCE_SUMMARY_2026-03-07.json"
DIFF_REPORT = REPO_ROOT / "docs" / "reviews" / "cvf_phase_governance" / "CVF_CONFORMANCE_DIFF_REPORT_2026-03-07.md"
RELEASE_REPORT = REPO_ROOT / "docs" / "reviews" / "cvf_phase_governance" / "CVF_CONFORMANCE_RELEASE_GATE_REPORT_2026-03-07.md"


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
    _run([sys.executable, str(CONFORMANCE), "--output", str(REPORT), "--summary-output", str(SUMMARY)])
    _run([sys.executable, str(CONSISTENCY), "--enforce"])
    _run([sys.executable, str(GOLDEN_DIFF), "--report-output", str(DIFF_REPORT), "--enforce"])
    _run([sys.executable, str(RELEASE_GATE), "--report-output", str(RELEASE_REPORT), "--enforce"])
    _run([sys.executable, str(DOCS_GATE), "--enforce"])
    _run([sys.executable, str(TEST_DOC_GATE), "--base", "HEAD", "--head", "HEAD", "--enforce"])
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
