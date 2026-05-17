#!/usr/bin/env python3
from __future__ import annotations

import argparse
import datetime as dt
import json
import sys
from pathlib import Path


REPO_ROOT = Path(__file__).resolve().parents[2]
POLICY_PATH = "governance/toolkit/05_OPERATION/CVF_SHARED_BATCH_HELPER_ADOPTION_GUARD.md"
SHARED_BATCH_HELPER_PATH = "EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION/src/batch.contract.shared.ts"
SHARED_FIXTURE_HELPER_PATH = "EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION/tests/helpers/cpf.batch.contract.fixtures.ts"
GOVERNED_CONTRACT_FILES = [
    "EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION/src/agent.definition.capability.batch.contract.ts",
    "EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION/src/agent.scope.resolution.batch.contract.ts",
    "EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION/src/agent.registration.batch.contract.ts",
    "EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION/src/gateway.auth.batch.contract.ts",
    "EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION/src/route.match.batch.contract.ts",
    "EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION/src/reverse.prompting.batch.contract.ts",
    "EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION/src/design.batch.contract.ts",
    "EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION/src/orchestration.batch.contract.ts",
    "EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION/src/boardroom.batch.contract.ts",
    "EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION/src/boardroom.transition.gate.batch.contract.ts",
    "EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION/src/boardroom.round.batch.contract.ts",
    "EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION/src/boardroom.multi.round.batch.contract.ts",
]
GOVERNED_TEST_FILES = [
    "EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION/tests/agent.definition.capability.batch.contract.test.ts",
    "EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION/tests/agent.registration.batch.contract.test.ts",
    "EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION/tests/route.match.batch.contract.test.ts",
    "EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION/tests/orchestration.batch.contract.test.ts",
    "EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION/tests/boardroom.batch.contract.test.ts",
    "EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION/tests/boardroom.multi.round.batch.contract.test.ts",
]


def _read_text(rel_path: str) -> str:
    path = REPO_ROOT / rel_path
    if not path.exists():
        return ""
    return path.read_text(encoding="utf-8", errors="replace")


def _classify() -> dict:
    violations: list[dict[str, str]] = []

    helper_text = _read_text(SHARED_BATCH_HELPER_PATH)
    fixture_text = _read_text(SHARED_FIXTURE_HELPER_PATH)
    if not helper_text:
        violations.append({
            "type": "missing_shared_batch_helper",
            "path": SHARED_BATCH_HELPER_PATH,
            "message": f"{SHARED_BATCH_HELPER_PATH} is missing.",
        })
    if not fixture_text:
        violations.append({
            "type": "missing_shared_fixture_helper",
            "path": SHARED_FIXTURE_HELPER_PATH,
            "message": f"{SHARED_FIXTURE_HELPER_PATH} is missing.",
        })

    for rel_path in GOVERNED_CONTRACT_FILES:
        text = _read_text(rel_path)
        if not text:
            violations.append({
                "type": "missing_governed_contract",
                "path": rel_path,
                "message": f"{rel_path} is missing.",
            })
            continue
        if 'from "./batch.contract.shared"' not in text:
            violations.append({
                "type": "contract_missing_shared_helper_import",
                "path": rel_path,
                "message": f"{rel_path} must import ./batch.contract.shared.",
            })

    for rel_path in GOVERNED_TEST_FILES:
        text = _read_text(rel_path)
        if not text:
            violations.append({
                "type": "missing_governed_test",
                "path": rel_path,
                "message": f"{rel_path} is missing.",
            })
            continue
        if 'from "./helpers/cpf.batch.contract.fixtures"' not in text:
            violations.append({
                "type": "test_missing_shared_fixture_import",
                "path": rel_path,
                "message": f"{rel_path} must import ./helpers/cpf.batch.contract.fixtures.",
            })

    return {
        "timestamp": dt.datetime.now(dt.timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z"),
        "policy": POLICY_PATH,
        "sharedBatchHelper": SHARED_BATCH_HELPER_PATH,
        "sharedFixtureHelper": SHARED_FIXTURE_HELPER_PATH,
        "governedContractCount": len(GOVERNED_CONTRACT_FILES),
        "governedTestCount": len(GOVERNED_TEST_FILES),
        "violationCount": len(violations),
        "violations": violations,
        "compliant": not violations,
    }


def _print_report(report: dict) -> None:
    print("=== CVF CPF Shared Batch Helper Adoption Gate ===")
    print(f"Contracts governed: {report['governedContractCount']}")
    print(f"Tests governed: {report['governedTestCount']}")
    print(f"Violations: {report['violationCount']}")
    if report["violations"]:
        print("\n❌ Violations:")
        for violation in report["violations"]:
            print(f"  - [{violation['type']}] {violation['message']}")
    else:
        print("\n✅ COMPLIANT — governed CPF batch files adopt shared helpers.")


def main() -> int:
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(errors="replace")
    if hasattr(sys.stderr, "reconfigure"):
        sys.stderr.reconfigure(errors="replace")

    parser = argparse.ArgumentParser(description="Check CPF shared batch helper adoption")
    parser.add_argument("--enforce", action="store_true")
    parser.add_argument("--json", action="store_true")
    args = parser.parse_args()

    report = _classify()
    if args.json:
        print(json.dumps(report, indent=2))
    else:
        _print_report(report)

    if args.enforce and not report["compliant"]:
        return 2
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
