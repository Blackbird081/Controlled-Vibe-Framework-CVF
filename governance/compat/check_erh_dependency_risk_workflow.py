"""
CVF ERH-DEP1 Dependency Risk Workflow Chain Checker

Verifies that the ERH-DEP1 dependency risk workflow chain artifacts exist and
contain a valid decision marker. Does NOT inspect or modify package.json or
package-lock.json contents beyond checking that the next-auth beta marker line
is still present (no silent removal).

GC-052 connection: erh-dependency-risk-workflow-chain
"""

import argparse
import re
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent.parent

WORKFLOW_CHAIN_PATH = REPO_ROOT / "docs/reference/CVF_ERH_DEP1_DEPENDENCY_RISK_WORKFLOW_CHAIN_2026-06-04.md"
LEDGER_PATH = REPO_ROOT / "docs/reference/CVF_ERH_DEP1_DEPENDENCY_RISK_LEDGER_2026-06-04.md"
PACKAGE_JSON_PATH = REPO_ROOT / "EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/package.json"

ALLOWED_DECISIONS = {
    "ACCEPT_WITH_CAVEAT",
    "PUBLIC_CAVEAT_ONLY",
    "MIGRATION_REQUIRED_DEP2",
    "BLOCKED_NEEDS_OPERATOR",
}

DECISION_PATTERN = re.compile(r"Decision:\s*`?(" + "|".join(ALLOWED_DECISIONS) + r")`?")
LEDGER_MARKER_PATTERN = re.compile(r"ERH_DEP1_DECISION:\s*(" + "|".join(ALLOWED_DECISIONS) + r")")
NEXT_AUTH_BETA_PATTERN = re.compile(r'"next-auth":\s*"\^5\.\d+\.\d+-beta\.\d+"')


def check(enforce: bool) -> list[str]:
    violations = []

    # Check 1: workflow chain reference exists
    if not WORKFLOW_CHAIN_PATH.exists():
        violations.append(f"MISSING: {WORKFLOW_CHAIN_PATH.relative_to(REPO_ROOT)}")
    else:
        content = WORKFLOW_CHAIN_PATH.read_text(encoding="utf-8")
        if not DECISION_PATTERN.search(content):
            violations.append(
                f"NO_VALID_DECISION in {WORKFLOW_CHAIN_PATH.relative_to(REPO_ROOT)}: "
                f"must contain 'Decision: <one of {sorted(ALLOWED_DECISIONS)}>'"
            )

    # Check 2: ledger exists and has machine marker
    if not LEDGER_PATH.exists():
        violations.append(f"MISSING: {LEDGER_PATH.relative_to(REPO_ROOT)}")
    else:
        ledger_content = LEDGER_PATH.read_text(encoding="utf-8")
        if not LEDGER_MARKER_PATTERN.search(ledger_content):
            violations.append(
                f"NO_LEDGER_MARKER in {LEDGER_PATH.relative_to(REPO_ROOT)}: "
                f"must contain 'ERH_DEP1_DECISION: <decision>'"
            )

    # Check 3: package.json next-auth beta marker still present (not silently removed)
    if PACKAGE_JSON_PATH.exists():
        pkg_content = PACKAGE_JSON_PATH.read_text(encoding="utf-8")
        if not NEXT_AUTH_BETA_PATTERN.search(pkg_content):
            violations.append(
                f"NEXT_AUTH_BETA_MARKER_MISSING in {PACKAGE_JSON_PATH.relative_to(REPO_ROOT)}: "
                "expected next-auth beta range declaration; if intentionally migrated, "
                "open ERH-DEP2 work order first"
            )

    return violations


def main() -> None:
    parser = argparse.ArgumentParser(description="CVF ERH-DEP1 dependency risk workflow checker")
    parser.add_argument("--enforce", action="store_true", help="Exit non-zero on violations")
    args = parser.parse_args()

    violations = check(enforce=args.enforce)

    if violations:
        print(f"ERH-DEP1 DEPENDENCY RISK WORKFLOW: {len(violations)} violation(s)")
        for v in violations:
            print(f"  - {v}")
        if args.enforce:
            sys.exit(1)
    else:
        print("ERH-DEP1 DEPENDENCY RISK WORKFLOW: PASS — workflow chain and ledger valid")


if __name__ == "__main__":
    main()
