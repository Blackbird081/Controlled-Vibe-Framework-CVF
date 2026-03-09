#!/usr/bin/env python3
"""Bootstrap the canonical packet postures once for downstream gate reuse."""

from __future__ import annotations

import os
import json
import subprocess
import sys
from pathlib import Path


REPO_ROOT = Path(__file__).resolve().parents[1]
LOCAL_PACKET = REPO_ROOT / "scripts" / "run_cvf_cross_family_packet_coverage_conformance.py"
SECONDARY_PACKETS = REPO_ROOT / "scripts" / "run_cvf_secondary_packet_cross_family_coverage_conformance.py"
PACKET_POSTURE_CACHE = (
    REPO_ROOT
    / "docs"
    / "reviews"
    / "cvf_phase_governance"
    / "CVF_PACKET_POSTURE_STATE_CACHE_2026-03-07.json"
)


def _run(command: list[str], env_overrides: dict[str, str] | None = None) -> tuple[int, str]:
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
    return process.returncode, process.stdout


def main() -> int:
    shared_env = {"CVF_SKIP_RUNTIME_EVIDENCE_RELEASE_GATE": "1"}
    local_code, local_output = _run([sys.executable, str(LOCAL_PACKET)], env_overrides=shared_env)
    if local_code != 0:
        raise SystemExit(local_code)
    secondary_code, secondary_output = _run([sys.executable, str(SECONDARY_PACKETS)], env_overrides=shared_env)
    if secondary_code != 0:
        raise SystemExit(secondary_code)
    PACKET_POSTURE_CACHE.write_text(
        json.dumps(
            {
                "cacheId": "CVF_PACKET_POSTURE_STATE_CACHE_2026-03-07",
                "scenarios": {
                    "CF-042": {
                        "status": "passed",
                        "command": "scripts/run_cvf_cross_family_packet_coverage_conformance.py",
                        "output": local_output.strip(),
                    },
                    "CF-043": {
                        "status": "passed",
                        "command": "scripts/run_cvf_secondary_packet_cross_family_coverage_conformance.py",
                        "output": secondary_output.strip(),
                    },
                },
            },
            indent=2,
            ensure_ascii=True,
        )
        + "\n",
        encoding="utf-8",
    )
    print(f"Wrote packet posture cache: {PACKET_POSTURE_CACHE.relative_to(REPO_ROOT).as_posix()}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
