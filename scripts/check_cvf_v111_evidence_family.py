#!/usr/bin/env python3
"""
Validate that the multi-runtime evidence manifest includes the v1.1.1 phase governance family.
"""

from __future__ import annotations

import json
from pathlib import Path


REPO_ROOT = Path(__file__).resolve().parents[1]
MANIFEST_PATH = REPO_ROOT / "docs" / "reviews" / "cvf_phase_governance" / "CVF_W4_MULTI_RUNTIME_EVIDENCE_MANIFEST_2026-03-07.json"


def main() -> int:
    manifest = json.loads(MANIFEST_PATH.read_text(encoding="utf-8"))
    entries = {entry["runtimeFamily"]: entry for entry in manifest.get("entries", [])}
    family = entries.get("CVF_v1.1.1_PHASE_GOVERNANCE_PROTOCOL")
    if not family:
        raise SystemExit("Missing runtime family: CVF_v1.1.1_PHASE_GOVERNANCE_PROTOCOL")
    if family.get("versionToken") != "v1.1.1":
        raise SystemExit("Unexpected versionToken for CVF_v1.1.1_PHASE_GOVERNANCE_PROTOCOL")
    if family.get("adapter") != "PHASE_GOVERNANCE_RUNTIME_EVIDENCE":
        raise SystemExit("Unexpected adapter for CVF_v1.1.1_PHASE_GOVERNANCE_PROTOCOL")
    if family.get("receiptCount") != 3:
        raise SystemExit("Unexpected receiptCount for CVF_v1.1.1_PHASE_GOVERNANCE_PROTOCOL")
    print("PASS - v1.1.1 phase governance evidence family is present in the multi-runtime manifest.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
