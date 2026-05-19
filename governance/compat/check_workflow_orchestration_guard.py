#!/usr/bin/env python3
"""CVF workflow orchestration guard.

This gate keeps GitHub workflow YAML thin and routed through canonical CVF
runner scripts. It prevents static governance checks from drifting into
duplicated, workflow-local command lists.
"""

from __future__ import annotations

import argparse
import datetime as dt
import json
import sys
from pathlib import Path
from typing import Any


REPO_ROOT = Path(__file__).resolve().parents[2]
POLICY = "governance/toolkit/05_OPERATION/CVF_WORKFLOW_ORCHESTRATION_GUARD.md"

REQUIRED_COMMANDS: dict[str, list[str]] = {
    ".github/workflows/public-surface.yml": [
        "python scripts/check_public_surface.py",
    ],
    ".github/workflows/cvf-static-ci.yml": [
        "python scripts/run_cvf_static_ci_gate.py --json",
    ],
    ".github/workflows/cvf-protected-live-release-gate.yml": [
        "python scripts/run_cvf_release_gate_bundle.py --json",
    ],
    ".github/workflows/ci.yml": [
        "python governance/compat/run_local_governance_hook_chain.py --hook pre-commit",
        "npm run test:run",
        "npm run build",
    ],
    ".github/workflows/cvf-web-ci.yml": [
        "check_core_compat.py",
        "npm run lint -- --max-warnings=0",
        "npm run build",
        "npm run test:run",
        "npm run test:coverage",
    ],
    "scripts/run_cvf_static_ci_gate.py": [
        "check_public_surface",
        "check_workflow_orchestration_guard",
        "check_web_build",
        "check_web_typecheck",
        "check_secrets",
        "check_docs_governance_compat",
        "check_static_governance_tests",
    ],
    "governance/compat/run_local_governance_hook_chain.py": [
        "check_workflow_orchestration_guard.py",
    ],
}

WORKFLOW_DIR = REPO_ROOT / ".github" / "workflows"
FRAGMENTED_STATIC_TEST_MARKERS = (
    "src/lib/front-door-rewrite-regression.test.ts",
    "src/lib/front-door-template-standard.test.ts",
    "src/lib/skill-corpus-governance.test.ts",
    "src/lib/skill-template-map.test.ts",
)


def _read(rel_path: str) -> str:
    path = REPO_ROOT / rel_path
    if not path.exists() or path.is_dir():
        return ""
    return path.read_text(encoding="utf-8", errors="replace")


def _normalize(text: str) -> str:
    return " ".join(text.replace("\\", "/").split())


def _check_required_commands() -> list[dict[str, str]]:
    violations: list[dict[str, str]] = []
    for rel_path, fragments in REQUIRED_COMMANDS.items():
        text = _read(rel_path)
        if not text:
            violations.append(
                {
                    "path": rel_path,
                    "issue": "required workflow or runner file is missing",
                }
            )
            continue
        normalized = _normalize(text)
        for fragment in fragments:
            if _normalize(fragment) not in normalized:
                violations.append(
                    {
                        "path": rel_path,
                        "issue": f"missing canonical command fragment: {fragment}",
                    }
                )
    return violations


def _check_fragmented_static_tests() -> list[dict[str, str]]:
    violations: list[dict[str, str]] = []
    if not WORKFLOW_DIR.exists():
        return violations
    workflow_files = sorted(
        path for path in WORKFLOW_DIR.iterdir()
        if path.is_file() and path.suffix in {".yml", ".yaml"}
    )
    for path in workflow_files:
        rel_path = str(path.relative_to(REPO_ROOT)).replace("\\", "/")
        text = path.read_text(encoding="utf-8", errors="replace")
        for marker in FRAGMENTED_STATIC_TEST_MARKERS:
            if marker in text:
                violations.append(
                    {
                        "path": rel_path,
                        "issue": (
                            "static governance test list is duplicated in workflow YAML; "
                            f"route through scripts/run_cvf_static_ci_gate.py instead ({marker})"
                        ),
                    }
                )
    return violations


def run_check() -> dict[str, Any]:
    violations = [
        *_check_required_commands(),
        *_check_fragmented_static_tests(),
    ]
    return {
        "timestamp": dt.datetime.now(dt.timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z"),
        "policy": POLICY,
        "requiredSurfaceCount": len(REQUIRED_COMMANDS),
        "fragmentedMarkerCount": len(FRAGMENTED_STATIC_TEST_MARKERS),
        "violationCount": len(violations),
        "violations": violations,
        "compliant": len(violations) == 0,
    }


def _print_report(report: dict[str, Any]) -> None:
    print("=== CVF Workflow Orchestration Guard ===")
    print(f"Policy: {report['policy']}")
    print(f"Required surfaces: {report['requiredSurfaceCount']}")
    print(f"Fragmented static markers blocked: {report['fragmentedMarkerCount']}")
    print(f"Violations: {report['violationCount']}")
    if report["violations"]:
        print("\nViolations:")
        for violation in report["violations"]:
            print(f"  - {violation['path']}: {violation['issue']}")
    if report["compliant"]:
        print("\nCOMPLIANT - workflow orchestration remains routed through canonical CVF runners.")
    else:
        print("\nVIOLATION - workflow logic is missing or fragmented.")
        print("Action required: route CI checks through the canonical runner scripts before pushing.")


def main() -> int:
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(errors="replace")
    if hasattr(sys.stderr, "reconfigure"):
        sys.stderr.reconfigure(errors="replace")

    parser = argparse.ArgumentParser(description="CVF workflow orchestration guard")
    parser.add_argument("--json", action="store_true", help="Emit JSON report")
    parser.add_argument("--enforce", action="store_true", help="Exit non-zero on violations")
    args = parser.parse_args()

    report = run_check()
    if args.json:
        print(json.dumps(report, indent=2, ensure_ascii=False))
    else:
        _print_report(report)

    if args.enforce and not report["compliant"]:
        return 2
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
