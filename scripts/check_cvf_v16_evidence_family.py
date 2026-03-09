#!/usr/bin/env python3
"""
Validate that the multi-runtime evidence manifest includes the v1.6 agent platform family.
"""

from __future__ import annotations

import json
from pathlib import Path


REPO_ROOT = Path(__file__).resolve().parents[1]
MANIFEST_PATH = REPO_ROOT / "docs" / "reviews" / "cvf_phase_governance" / "CVF_W4_MULTI_RUNTIME_EVIDENCE_MANIFEST_2026-03-07.json"


def main() -> int:
    manifest = json.loads(MANIFEST_PATH.read_text(encoding="utf-8"))
    entries = {entry["runtimeFamily"]: entry for entry in manifest.get("entries", [])}
    family = entries.get("CVF_v1.6_AGENT_PLATFORM")
    if not family:
        raise SystemExit("Missing runtime family: CVF_v1.6_AGENT_PLATFORM")
    if family.get("versionToken") != "v1.6":
        raise SystemExit("Unexpected versionToken for CVF_v1.6_AGENT_PLATFORM")
    if family.get("adapter") != "AGENT_PLATFORM_GOVERNANCE_EVIDENCE":
        raise SystemExit("Unexpected adapter for CVF_v1.6_AGENT_PLATFORM")
    if family.get("receiptCount") != 3:
        raise SystemExit("Unexpected receiptCount for CVF_v1.6_AGENT_PLATFORM")
    print("PASS - v1.6 agent platform evidence family is present in the multi-runtime manifest.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
