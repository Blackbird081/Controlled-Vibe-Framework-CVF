"""
CVF ERH-AUD1 CVF-Web Dependency Audit Workflow Checker

Verifies that the ERH-AUD1 dependency audit remediation artifacts exist,
contain a valid decision marker, and that the next-auth beta marker was not
silently removed during audit remediation.

GC-052 connection: erh-cvf-web-dependency-audit-workflow
"""

import argparse
import re
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent.parent

WORKFLOW_CHAIN_PATH = REPO_ROOT / "docs/reference/CVF_ERH_AUD1_CVF_WEB_DEPENDENCY_AUDIT_WORKFLOW_CHAIN_2026-06-04.md"
LEDGER_PATH = REPO_ROOT / "docs/reference/CVF_ERH_AUD1_CVF_WEB_DEPENDENCY_AUDIT_REMEDIATION_LEDGER_2026-06-04.md"
PACKAGE_JSON_PATH = REPO_ROOT / "EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/package.json"

ALLOWED_DECISIONS = {
    "AUDIT_CLEAN_PASS",
    "AUDIT_REDUCED_WITH_RESIDUALS",
    "AUDIT_BLOCKED_MAJOR_OR_RUNTIME",
    "AUDIT_BLOCKED_REGISTRY_OR_TESTS",
}

DECISION_PATTERN = re.compile(r"Decision:\s*`?(" + "|".join(ALLOWED_DECISIONS) + r")`?")
LEDGER_MARKER_PATTERN = re.compile(r"ERH_AUD1_DECISION:\s*(" + "|".join(ALLOWED_DECISIONS) + r")")
NEXT_AUTH_BETA_PATTERN = re.compile(r'"next-auth":\s*"\^5\.\d+\.\d+-beta\.\d+"')


def check(enforce: bool = False) -> list[str]:
    violations = []

    # Check 1: workflow chain reference exists and has valid decision
    if not WORKFLOW_CHAIN_PATH.exists():
        violations.append(f"MISSING: {WORKFLOW_CHAIN_PATH.relative_to(REPO_ROOT)}")
    else:
        content = WORKFLOW_CHAIN_PATH.read_text(encoding="utf-8")
        if not DECISION_PATTERN.search(content):
            violations.append(
                f"NO_VALID_DECISION in {WORKFLOW_CHAIN_PATH.relative_to(REPO_ROOT)}: "
                f"must contain 'Decision: <one of {sorted(ALLOWED_DECISIONS)}>'"
            )

    # Check 2: ledger exists with machine marker
    if not LEDGER_PATH.exists():
        violations.append(f"MISSING: {LEDGER_PATH.relative_to(REPO_ROOT)}")
    else:
        ledger = LEDGER_PATH.read_text(encoding="utf-8")
        if not LEDGER_MARKER_PATTERN.search(ledger):
            violations.append(
                f"NO_LEDGER_MARKER in {LEDGER_PATH.relative_to(REPO_ROOT)}: "
                "must contain 'ERH_AUD1_DECISION: <decision>'"
            )

    # Check 3: next-auth beta marker must still be present — AUD1 does not migrate auth
    if PACKAGE_JSON_PATH.exists():
        pkg = PACKAGE_JSON_PATH.read_text(encoding="utf-8")
        if not NEXT_AUTH_BETA_PATTERN.search(pkg):
            violations.append(
                f"NEXT_AUTH_BETA_MARKER_MISSING in {PACKAGE_JSON_PATH.relative_to(REPO_ROOT)}: "
                "AUD1 must not migrate or remove next-auth; "
                "if intentionally migrated, open ERH-DEP2 work order first"
            )

    return violations


def main() -> None:
    parser = argparse.ArgumentParser(description="CVF ERH-AUD1 dependency audit workflow checker")
    parser.add_argument("--enforce", action="store_true", help="Exit non-zero on violations")
    args = parser.parse_args()

    violations = check(enforce=args.enforce)

    if violations:
        print(f"ERH-AUD1 DEPENDENCY AUDIT WORKFLOW: {len(violations)} violation(s)")
        for v in violations:
            print(f"  - {v}")
        if args.enforce:
            sys.exit(1)
    else:
        print("ERH-AUD1 DEPENDENCY AUDIT WORKFLOW: PASS — audit workflow chain and ledger valid")


if __name__ == "__main__":
    main()
