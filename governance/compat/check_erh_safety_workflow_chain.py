#!/usr/bin/env python3
"""
CVF ERH-SAF1 Safety Workflow Chain Checker

Verifies that the SAF1 safety workflow chain is correctly wired:
  1. Workflow-chain reference document exists with machine marker.
  2. Safety ledger document exists with machine marker.
  3. safety-workflow-chain.ts helper exists and contains the SAF1 marker.
  4. execute route.ts imports the SAF1 helper (not safety-status.ts directly).
  5. execute route.ts does not directly import 'use client' safety-status.ts.
  6. safety-status.ts retains 'use client' directive (not stripped by SAF1).
  7. ERH-SAF1 decision marker present in workflow-chain reference.
  8. execute route order remains DLP -> SAF1 -> legacy safety -> provider.

ERH_SAF1_CHECKER_VERSION: 2026-06-04
"""

from __future__ import annotations

import argparse
import re
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]

WORKFLOW_CHAIN_DOC = REPO_ROOT / "docs/reference/CVF_ERH_SAF1_SAFETY_WORKFLOW_CHAIN_2026-06-04.md"
LEDGER_DOC = REPO_ROOT / "docs/reference/CVF_ERH_SAF1_SAFETY_WORKFLOW_LEDGER_2026-06-04.md"
HELPER_TS = REPO_ROOT / "EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/lib/safety-workflow-chain.ts"
ROUTE_TS = REPO_ROOT / "EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/app/api/execute/route.ts"
SAFETY_STATUS_TS = REPO_ROOT / "EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/lib/safety-status.ts"

SAF1_WORKFLOW_MARKER = re.compile(r"ERH_SAF1_DECISION\s*:", re.IGNORECASE)
SAF1_LEDGER_MARKER = re.compile(r"ERH_SAF1_LEDGER_VERSION\s*:", re.IGNORECASE)
SAF1_HELPER_MARKER = re.compile(r"ERH_SAF1_MARKER\s*:\s*SAFETY_WORKFLOW_CHAIN_ACTIVE", re.IGNORECASE)
SAF1_ROUTE_IMPORT = re.compile(r"from\s+['\"]@/lib/safety-workflow-chain['\"]")
SAF1_ROUTE_CALL = re.compile(r"runSafetyWorkflowChain\s*\(")
CLIENT_DIRECTIVE = re.compile(r"'use client'")
SAFETY_STATUS_DIRECT_IMPORT = re.compile(r"from\s+['\"]@/lib/safety-status['\"]")


def _ordered_route_markers(route_text: str) -> tuple[bool, list[str]]:
    markers = [
        ("DLP", "applyDLPFilter("),
        ("SAF1", "runSafetyWorkflowChain("),
        ("legacy safety", "applySafetyFilters(saf1Result.sanitized)"),
        ("provider", "routeWebProvider("),
    ]
    positions: list[tuple[str, int]] = [(label, route_text.find(token)) for label, token in markers]
    missing = [label for label, position in positions if position < 0]
    if missing:
        return False, [f"missing route-order marker: {label}" for label in missing]

    ordered = all(positions[i][1] < positions[i + 1][1] for i in range(len(positions) - 1))
    if ordered:
        return True, []

    rendered = " -> ".join(f"{label}@{position}" for label, position in positions)
    return False, [f"execute route SAF1 order is invalid; expected DLP -> SAF1 -> legacy safety -> provider, got {rendered}"]


def check(violations: list[str]) -> None:
    if not WORKFLOW_CHAIN_DOC.exists():
        violations.append(f"missing workflow-chain reference: {WORKFLOW_CHAIN_DOC.relative_to(REPO_ROOT)}")
        return

    wf_text = WORKFLOW_CHAIN_DOC.read_text(encoding="utf-8")
    if not SAF1_WORKFLOW_MARKER.search(wf_text):
        violations.append(
            f"workflow-chain reference missing ERH_SAF1_DECISION marker: {WORKFLOW_CHAIN_DOC.relative_to(REPO_ROOT)}"
        )

    if not LEDGER_DOC.exists():
        violations.append(f"missing safety ledger: {LEDGER_DOC.relative_to(REPO_ROOT)}")
    else:
        ledger_text = LEDGER_DOC.read_text(encoding="utf-8")
        if not SAF1_LEDGER_MARKER.search(ledger_text):
            violations.append(
                f"safety ledger missing ERH_SAF1_LEDGER_VERSION marker: {LEDGER_DOC.relative_to(REPO_ROOT)}"
            )

    if not HELPER_TS.exists():
        violations.append(f"missing SAF1 helper: {HELPER_TS.relative_to(REPO_ROOT)}")
    else:
        helper_text = HELPER_TS.read_text(encoding="utf-8")
        if not SAF1_HELPER_MARKER.search(helper_text):
            violations.append(
                f"SAF1 helper missing ERH_SAF1_MARKER: {HELPER_TS.relative_to(REPO_ROOT)}"
            )

    if not ROUTE_TS.exists():
        violations.append(f"missing execute route: {ROUTE_TS.relative_to(REPO_ROOT)}")
    else:
        route_text = ROUTE_TS.read_text(encoding="utf-8")
        if not SAF1_ROUTE_IMPORT.search(route_text):
            violations.append(
                f"execute route does not import safety-workflow-chain: {ROUTE_TS.relative_to(REPO_ROOT)}"
            )
        if not SAF1_ROUTE_CALL.search(route_text):
            violations.append(
                f"execute route does not call runSafetyWorkflowChain: {ROUTE_TS.relative_to(REPO_ROOT)}"
            )
        if SAFETY_STATUS_DIRECT_IMPORT.search(route_text):
            violations.append(
                f"execute route directly imports client-only safety-status.ts (forbidden): {ROUTE_TS.relative_to(REPO_ROOT)}"
            )
        route_order_ok, route_order_violations = _ordered_route_markers(route_text)
        if not route_order_ok:
            violations.extend(
                f"{message}: {ROUTE_TS.relative_to(REPO_ROOT)}"
                for message in route_order_violations
            )

    if not SAFETY_STATUS_TS.exists():
        violations.append(f"missing safety-status.ts (expected to still exist): {SAFETY_STATUS_TS.relative_to(REPO_ROOT)}")
    else:
        ss_text = SAFETY_STATUS_TS.read_text(encoding="utf-8")
        if not CLIENT_DIRECTIVE.search(ss_text):
            violations.append(
                f"safety-status.ts lost 'use client' directive — SAF1 may have broken UI scope: {SAFETY_STATUS_TS.relative_to(REPO_ROOT)}"
            )


def main() -> int:
    parser = argparse.ArgumentParser(description="CVF ERH-SAF1 Safety Workflow Chain Checker")
    parser.add_argument("--enforce", action="store_true", help="Exit 1 on violations")
    args = parser.parse_args()

    violations: list[str] = []
    check(violations)

    print("=== CVF ERH-SAF1 Safety Workflow Chain Checker ===")
    print(f"Violations: {len(violations)}")

    if violations:
        print("\nViolations:")
        for v in violations:
            print(f"  - {v}")
        if args.enforce:
            print("\nVIOLATION - SAF1 safety workflow chain is not correctly wired.")
            return 1
        print("\nWARNING - SAF1 safety workflow chain has issues (not enforced).")
        return 0

    print("\nCOMPLIANT - SAF1 safety workflow chain is correctly wired.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
