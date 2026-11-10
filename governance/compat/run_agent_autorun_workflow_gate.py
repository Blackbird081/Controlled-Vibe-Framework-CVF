#!/usr/bin/env python3
"""Public compatibility entrypoint: private provenance autorun is unavailable."""
from __future__ import annotations

import json
import sys


def main(argv: list[str] | None = None) -> int:
    args = sys.argv[1:] if argv is None else argv
    result = {
        "status": "BLOCKED",
        "code": "PUBLIC_CORE_AUTORUN_UNSUPPORTED",
        "message": "The provenance autorun bundle requires private authority and is not distributed in public CVF.",
        "nextStep": "For a downstream project, use python scripts/lib/downstream_governance/cvf_downstream_gate_runner.py run --phase <phase> --project-root <project> with its installed profile. This is a separate project contract, not a provenance gate substitute.",
        "executedGates": [],
        "receiptWritten": False,
    }
    if "--json" in args:
        print(json.dumps(result, sort_keys=True))
    else:
        print(f"{result['code']}: {result['message']}\n{result['nextStep']}", file=sys.stderr)
    return 2


if __name__ == "__main__":
    raise SystemExit(main())
