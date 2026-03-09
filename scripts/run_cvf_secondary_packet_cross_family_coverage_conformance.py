#!/usr/bin/env python3
"""
Validate that all secondary packet postures carry cross-family runtime coverage.
"""

from __future__ import annotations

import subprocess
import sys
import os
from pathlib import Path


REPO_ROOT = Path(__file__).resolve().parents[1]
RELEASE_GATE = REPO_ROOT / "scripts" / "run_cvf_runtime_evidence_release_gate.py"
PRODUCTION_PACKET = REPO_ROOT / "scripts" / "run_cvf_production_candidate_packet_conformance.py"
AUDIT_PACKET = REPO_ROOT / "scripts" / "run_cvf_internal_audit_packet_conformance.py"
ONBOARDING_PACKET = REPO_ROOT / "scripts" / "run_cvf_enterprise_onboarding_packet_conformance.py"


def _run(command: list[str], env_overrides: dict[str, str] | None = None) -> None:
    env = os.environ.copy()
    if env_overrides:
        env.update(env_overrides)
    process = subprocess.run(
        command,
        cwd=REPO_ROOT,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        text=True,
        encoding="utf-8",
        errors="replace",
        env=env,
    )
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(errors="replace")
    sys.stdout.write(process.stdout)
    if process.returncode != 0:
        raise SystemExit(process.returncode)


def main() -> int:
    if os.environ.get("CVF_SKIP_RUNTIME_EVIDENCE_RELEASE_GATE") != "1":
        _run([sys.executable, str(RELEASE_GATE)])
    shared_env = {"CVF_SKIP_RUNTIME_EVIDENCE_RELEASE_GATE": "1"}
    _run([sys.executable, str(PRODUCTION_PACKET)], env_overrides=shared_env)
    _run([sys.executable, str(AUDIT_PACKET)], env_overrides=shared_env)
    _run([sys.executable, str(ONBOARDING_PACKET)], env_overrides=shared_env)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
