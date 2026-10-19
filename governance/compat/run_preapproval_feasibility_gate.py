#!/usr/bin/env python3
"""Explicit before-approval caller for the opt-in preapproval feasibility protocol.

Prints the typed receipt and exits 0 only for FEASIBLE or the action-scoped
FEASIBLE_FOR_INTEGRATED_ROOT_BUILD (shown with runtimeReadiness=false, never a
grant). HOLD exits 2 and INVALID exits 1. Every invocation re-reads and re-validates all bytes; there is no
interactive prompt, cached PASS, grant write or effect admission.
"""
from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

COMPAT_DIR = Path(__file__).resolve().parent
if str(COMPAT_DIR) not in sys.path:
    sys.path.insert(0, str(COMPAT_DIR))

import preapproval_feasibility_contract as contract  # noqa: E402

EXIT_CODES = {"FEASIBLE": 0, contract.ROOT_BUILD_DISPOSITION: 0, "INVALID": 1, "HOLD": 2}


def main(argv: list[str] | None = None) -> int:
    for stream in (sys.stdout, sys.stderr):
        if hasattr(stream, "reconfigure"):
            stream.reconfigure(encoding="utf-8", errors="replace")
    parser = argparse.ArgumentParser(description="Evaluate one marked proposal before it is presented for approval.")
    parser.add_argument("--proposal")
    parser.add_argument("--approval-target")
    parser.add_argument("--repo-root", default=str(contract.REPO_ROOT))
    parser.add_argument("--json", action="store_true", help="print only the typed JSON receipt")
    args = parser.parse_args(argv)
    receipt = contract.evaluate(Path(args.repo_root), args.proposal, args.approval_target, explicit=True)
    if not args.json:
        scoped = " runtimeReadiness=false" if receipt["technicalDisposition"] == contract.ROOT_BUILD_DISPOSITION else ""
        print(f"technicalDisposition={receipt['technicalDisposition']} coverageDisposition={receipt['coverageDisposition']} effectAdmission=false operatorApprovalRequired=true{scoped}")
    print(json.dumps(receipt, indent=2, sort_keys=True, ensure_ascii=True))
    return EXIT_CODES.get(receipt["technicalDisposition"], 1)


if __name__ == "__main__":
    raise SystemExit(main())
