#!/usr/bin/env python3
"""
Run the local remediation-export conformance path:
- generate a canonical file-backed remediation receipt artifact
- export it into a markdown evidence log
- validate that the export contains the expected summary markers
"""

from __future__ import annotations

import os
import subprocess
import sys
from pathlib import Path


REPO_ROOT = Path(__file__).resolve().parents[1]
EXTENSION_ROOT = REPO_ROOT / "EXTENSIONS" / "CVF_v1.9_DETERMINISTIC_REPRODUCIBILITY"
ARTIFACT_PATH = REPO_ROOT / "docs" / "reviews" / "cvf_phase_governance" / "CVF_W4_REMEDIATION_RECEIPTS_LOCAL_BASELINE_2026-03-07.json"
LOG_PATH = REPO_ROOT / "docs" / "reviews" / "cvf_phase_governance" / "CVF_W4_REMEDIATION_RECEIPT_LOG_2026-03-07.md"


def _run(command: list[str], cwd: Path, env: dict[str, str] | None = None) -> str:
    resolved = command[:]
    if sys.platform.startswith("win"):
        if resolved[0] == "npx":
            resolved[0] = "npx.cmd"
        elif resolved[0] == "npm":
            resolved[0] = "npm.cmd"
    if resolved[0] == "python":
        resolved[0] = sys.executable

    proc = subprocess.run(
        resolved,
        cwd=cwd,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        text=True,
        encoding="utf-8",
        errors="replace",
        env=env,
        check=False,
    )
    if proc.returncode != 0:
        raise SystemExit(proc.stdout)
    return proc.stdout


def main() -> int:
    ARTIFACT_PATH.parent.mkdir(parents=True, exist_ok=True)
    if ARTIFACT_PATH.exists():
        ARTIFACT_PATH.unlink()
    if LOG_PATH.exists():
        LOG_PATH.unlink()

    env = os.environ.copy()
    env["CVF_REMEDIATION_ARTIFACT_PATH"] = str(ARTIFACT_PATH)
    _run(
        ["npx", "vitest", "run", "tests/cross-extension-remediation-export.conformance.test.ts"],
        cwd=EXTENSION_ROOT,
        env=env,
    )
    _run(
        [
            "python",
            "scripts/export_cvf_remediation_receipt_log.py",
            "--input",
            str(ARTIFACT_PATH),
            "--output",
            str(LOG_PATH),
        ],
        cwd=REPO_ROOT,
    )

    exported = LOG_PATH.read_text(encoding="utf-8")
    required_markers = [
        "## Action Summary",
        "- INTERRUPTED: `3`",
        "- RESUMED: `3`",
        "## Receipts",
        "`proposal-remediation-export-001`",
    ]
    missing = [marker for marker in required_markers if marker not in exported]
    if missing:
        raise SystemExit(f"Missing remediation export markers: {missing}")

    print(f"Generated remediation artifact: {ARTIFACT_PATH.relative_to(REPO_ROOT).as_posix()}")
    print(f"Generated remediation log: {LOG_PATH.relative_to(REPO_ROOT).as_posix()}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
