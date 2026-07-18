#!/usr/bin/env python3
"""
CVF DIR-T1 Scan Disposition Overlap Checker

Fails if any Document Intelligence Router AuthorizationGate value overlaps an
EXA-T2 ScanRouteDisposition value.
"""

from __future__ import annotations

import sys
from pathlib import Path
from typing import get_args


REPO_ROOT = Path(__file__).resolve().parents[2]
EXTRACTION_SRC = REPO_ROOT / "EXTENSIONS" / "CVF_EXTRACTION_FOUNDATION" / "src"


def _load_values() -> tuple[set[str], set[str]]:
    sys.path.insert(0, str(EXTRACTION_SRC))
    from document_intelligence_router import AuthorizationGate  # noqa: PLC0415
    from scan_route_decision import ScanRouteDisposition  # noqa: PLC0415

    return set(get_args(AuthorizationGate)), set(get_args(ScanRouteDisposition))


def main() -> int:
    print("=== CVF DIR-T1 Scan Disposition Overlap Gate ===")
    print("Policy: docs/reference/CVF_DOCUMENT_INTELLIGENCE_ROUTER_CONTRACT_MATRIX_2026-06-13.md")

    gate_values, scan_values = _load_values()
    overlap = gate_values & scan_values

    print(f"AuthorizationGate values: {len(gate_values)}")
    print(f"ScanRouteDisposition values: {len(scan_values)}")
    print(f"Overlap count: {len(overlap)}")

    if overlap:
        print("\nVIOLATION - router gate re-encodes scan disposition values.")
        for value in sorted(overlap):
            print(f"  - {value}")
        return 1

    print("\nCOMPLIANT - DIR authorization gates are disjoint from scan dispositions.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
