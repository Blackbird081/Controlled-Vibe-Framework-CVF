#!/usr/bin/env python3
"""
CVF ERH-SAF2 Output Safety Workflow Chain Checker

Verifies that the SAF2 output safety workflow chain is correctly wired:
  1. output-validator.ts contains the ERH_SAF2_MARKER.
  2. output-validator.ts exports GOVERNANCE_OUTPUT_PATTERNS.
  3. output-validator.ts exports isGovernanceOutputUnsafe function.
  4. execute route.ts contains the OUTPUT_SAFETY_TRIGGERED audit event.
  5. OUTPUT_SAFETY_TRIGGERED fires before retry exhaustion.
  6. OUTPUT_SAFETY_TRIGGERED is emitted once on first detection, including retry output.
  6. Regression corpus test file exists.
  7. Workflow-chain reference document exists.
  8. Ledger document exists.

ERH_SAF2_CHECKER_VERSION: 2026-06-05
"""

from __future__ import annotations

import argparse
import re
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]

OUTPUT_VALIDATOR_TS = REPO_ROOT / "EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/lib/output-validator.ts"
ROUTE_TS = REPO_ROOT / "EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/app/api/execute/route.ts"
REGRESSION_TEST_TS = REPO_ROOT / "EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/lib/safety-workflow-chain.regression.test.ts"
WORKFLOW_CHAIN_DOC = REPO_ROOT / "docs/reference/CVF_ERH_SAF2_OUTPUT_SAFETY_AND_REGRESSION_CORPUS_2026-06-05.md"
LEDGER_DOC = REPO_ROOT / "docs/reference/CVF_ERH_SAF2_OUTPUT_SAFETY_AND_REGRESSION_CORPUS_LEDGER_2026-06-05.md"

SAF2_MARKER = re.compile(r"ERH_SAF2_MARKER\s*:\s*GOVERNANCE_OUTPUT_SAFETY_ACTIVE", re.IGNORECASE)
GOVERNANCE_PATTERNS_EXPORT = re.compile(r"export\s+const\s+GOVERNANCE_OUTPUT_PATTERNS\s*:", re.MULTILINE)
IS_GOVERNANCE_UNSAFE_EXPORT = re.compile(r"export\s+function\s+isGovernanceOutputUnsafe\s*\(", re.MULTILINE)
OUTPUT_SAFETY_TRIGGERED = re.compile(r"eventType\s*:\s*['\"]OUTPUT_SAFETY_TRIGGERED['\"]")
OUTPUT_VALIDATION_EXHAUSTED = re.compile(r"eventType\s*:\s*['\"]OUTPUT_VALIDATION_EXHAUSTED['\"]")
OUTPUT_SAFETY_EMIT_HELPER = re.compile(r"const\s+emitOutputSafetyTriggered\s*=\s*async\s*\(", re.MULTILINE)
OUTPUT_SAFETY_EMIT_GUARD = re.compile(r"outputSafetyAuditEmitted\s*\|\|\s*!validation\.issues\.includes\(['\"]UNSAFE_CONTENT['\"]\)")
OUTPUT_SAFETY_EMIT_CALL = re.compile(r"await\s+emitOutputSafetyTriggered\s*\(")
REGRESSION_CORPUS_MARKER = re.compile(r"ERH_SAF2_REGRESSION_CORPUS_MARKER\s*:\s*ACTIVE", re.IGNORECASE)
SAF2_WORKFLOW_MARKER = re.compile(r"ERH_SAF2_DECISION\s*:", re.IGNORECASE)
SAF2_LEDGER_MARKER = re.compile(r"ERH_SAF2_LEDGER_VERSION\s*:", re.IGNORECASE)


def _triggered_before_exhausted(route_text: str) -> tuple[bool, str]:
    """
    Verify OUTPUT_SAFETY_TRIGGERED appears before OUTPUT_VALIDATION_EXHAUSTED
    in the route source — confirming the event fires before retry exhaustion.
    """
    pos_triggered = route_text.find("OUTPUT_SAFETY_TRIGGERED")
    pos_exhausted = route_text.find("OUTPUT_VALIDATION_EXHAUSTED")

    if pos_triggered < 0:
        return False, "OUTPUT_SAFETY_TRIGGERED not found in route"
    if pos_exhausted < 0:
        return False, "OUTPUT_VALIDATION_EXHAUSTED not found in route (expected to still exist)"
    if pos_triggered < pos_exhausted:
        return True, ""
    return False, (
        f"OUTPUT_SAFETY_TRIGGERED (pos {pos_triggered}) appears after "
        f"OUTPUT_VALIDATION_EXHAUSTED (pos {pos_exhausted}); "
        "must fire before retry exhaustion"
    )


def check(violations: list[str]) -> None:
    # 1. output-validator.ts checks
    if not OUTPUT_VALIDATOR_TS.exists():
        violations.append(f"missing output-validator: {OUTPUT_VALIDATOR_TS.relative_to(REPO_ROOT)}")
        return

    ov_text = OUTPUT_VALIDATOR_TS.read_text(encoding="utf-8")

    if not SAF2_MARKER.search(ov_text):
        violations.append(
            f"output-validator missing ERH_SAF2_MARKER: {OUTPUT_VALIDATOR_TS.relative_to(REPO_ROOT)}"
        )

    if not GOVERNANCE_PATTERNS_EXPORT.search(ov_text):
        violations.append(
            f"output-validator missing export GOVERNANCE_OUTPUT_PATTERNS: {OUTPUT_VALIDATOR_TS.relative_to(REPO_ROOT)}"
        )

    if not IS_GOVERNANCE_UNSAFE_EXPORT.search(ov_text):
        violations.append(
            f"output-validator missing export isGovernanceOutputUnsafe: {OUTPUT_VALIDATOR_TS.relative_to(REPO_ROOT)}"
        )

    # 2. route.ts checks
    if not ROUTE_TS.exists():
        violations.append(f"missing execute route: {ROUTE_TS.relative_to(REPO_ROOT)}")
    else:
        route_text = ROUTE_TS.read_text(encoding="utf-8")

        if not OUTPUT_SAFETY_TRIGGERED.search(route_text):
            violations.append(
                f"execute route missing OUTPUT_SAFETY_TRIGGERED audit event: {ROUTE_TS.relative_to(REPO_ROOT)}"
            )
        else:
            ok, msg = _triggered_before_exhausted(route_text)
            if not ok:
                violations.append(f"{msg}: {ROUTE_TS.relative_to(REPO_ROOT)}")

        if not OUTPUT_SAFETY_EMIT_HELPER.search(route_text):
            violations.append(
                f"execute route missing emitOutputSafetyTriggered helper: {ROUTE_TS.relative_to(REPO_ROOT)}"
            )
        if not OUTPUT_SAFETY_EMIT_GUARD.search(route_text):
            violations.append(
                f"execute route missing first-detection emit guard for UNSAFE_CONTENT: {ROUTE_TS.relative_to(REPO_ROOT)}"
            )
        if len(OUTPUT_SAFETY_EMIT_CALL.findall(route_text)) < 2:
            violations.append(
                "execute route must call emitOutputSafetyTriggered after initial and retry validations: "
                f"{ROUTE_TS.relative_to(REPO_ROOT)}"
            )

    # 3. Regression corpus test file
    if not REGRESSION_TEST_TS.exists():
        violations.append(
            f"missing regression corpus test: {REGRESSION_TEST_TS.relative_to(REPO_ROOT)}"
        )
    else:
        reg_text = REGRESSION_TEST_TS.read_text(encoding="utf-8")
        if not REGRESSION_CORPUS_MARKER.search(reg_text):
            violations.append(
                f"regression corpus test missing ERH_SAF2_REGRESSION_CORPUS_MARKER: "
                f"{REGRESSION_TEST_TS.relative_to(REPO_ROOT)}"
            )

    # 4. Workflow-chain reference document
    if not WORKFLOW_CHAIN_DOC.exists():
        violations.append(
            f"missing workflow-chain reference: {WORKFLOW_CHAIN_DOC.relative_to(REPO_ROOT)}"
        )
    else:
        wf_text = WORKFLOW_CHAIN_DOC.read_text(encoding="utf-8")
        if not SAF2_WORKFLOW_MARKER.search(wf_text):
            violations.append(
                f"workflow-chain reference missing ERH_SAF2_DECISION marker: "
                f"{WORKFLOW_CHAIN_DOC.relative_to(REPO_ROOT)}"
            )

    # 5. Ledger document
    if not LEDGER_DOC.exists():
        violations.append(f"missing SAF2 ledger: {LEDGER_DOC.relative_to(REPO_ROOT)}")
    else:
        ledger_text = LEDGER_DOC.read_text(encoding="utf-8")
        if not SAF2_LEDGER_MARKER.search(ledger_text):
            violations.append(
                f"SAF2 ledger missing ERH_SAF2_LEDGER_VERSION marker: "
                f"{LEDGER_DOC.relative_to(REPO_ROOT)}"
            )


def main() -> int:
    parser = argparse.ArgumentParser(description="CVF ERH-SAF2 Output Safety Workflow Chain Checker")
    parser.add_argument("--enforce", action="store_true", help="Exit 1 on violations")
    args = parser.parse_args()

    violations: list[str] = []
    check(violations)

    print("=== CVF ERH-SAF2 Output Safety Workflow Chain Checker ===")
    print(f"Violations: {len(violations)}")

    if violations:
        print("\nViolations:")
        for v in violations:
            print(f"  - {v}")
        if args.enforce:
            print("\nVIOLATION - SAF2 output safety workflow chain is not correctly wired.")
            return 1
        print("\nWARNING - SAF2 output safety workflow chain has issues (not enforced).")
        return 0

    print("\nCOMPLIANT - SAF2 output safety workflow chain is correctly wired.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
