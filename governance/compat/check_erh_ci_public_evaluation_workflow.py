#!/usr/bin/env python3
"""Check ERH CI public-evaluation workflow chain readiness.

This guard is intentionally marker-based. It verifies that CVF can make a
bounded public-evaluation CI claim from existing source surfaces without
claiming production-grade CI, dependency-audit hardening, hosted freshness, or
ordinary live-provider CI execution.
"""

from __future__ import annotations

import argparse
import json
from pathlib import Path
from typing import Any


REPO_ROOT = Path(__file__).resolve().parents[2]
CHAIN_VERSION = "cvf.erhCiPublicEvaluationWorkflow.ci1.v1"

T2B_PLAN_PATH = "docs/reference/CVF_ERH_T2B_CI_HARDENING_PLAN_2026-06-04.md"
T2A_LEDGER_PATH = "docs/reference/CVF_ERH_T2A_ROUTE_GOVERNANCE_COVERAGE_LEDGER_2026-06-04.md"
T2C_WORKFLOW_PATH = "docs/reference/CVF_ERH_T2C_ROUTE_GOVERNANCE_PROOF_WORKFLOW_CHAIN_2026-06-04.md"
SYSTEM_LOOP_REGISTRY_PATH = "docs/reference/CVF_SYSTEM_LOOP_INTERLOCK_REGISTRY_2026-06-02.json"

WORKFLOW_MARKERS: dict[str, dict[str, list[str]]] = {
    ".github/workflows/cvf-ci.yml": {
        "main_ci_type_build_test": [
            "npx tsc --noEmit",
            "npm run build",
            "npm run test:run",
            "ci-passed:",
        ],
    },
    ".github/workflows/cvf-web-ci.yml": {
        "web_lint_and_coverage": [
            "npm run lint -- --max-warnings=0",
            "npm run test:coverage",
        ],
    },
    ".github/workflows/cvf-static-ci.yml": {
        "static_ci_gate": [
            "python scripts/run_cvf_static_ci_gate.py --json",
        ],
    },
    ".github/workflows/cvf-protected-live-release-gate.yml": {
        "protected_live_gate": [
            "workflow_dispatch:",
            "RUN_LIVE_GATE",
            "run_cvf_release_gate_bundle.py --json",
            "cvf-protected-live-release-gate-result.json",
        ],
    },
    ".github/workflows/documentation-testing.yml": {
        "docs_governance_chain": [
            "check_markdown_structural_completeness.py",
            "check_work_order_dispatch_quality.py",
            "markdown-lint",
        ],
    },
}

WEB_PACKAGE_PATH = "EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/package.json"
WEB_SCRIPT_REQUIREMENTS = {
    "lint": "eslint",
    "check": "tsc --noEmit",
    "build": "next build",
    "test:run": "vitest run",
    "test:coverage": "vitest run --coverage",
}

CLAIM_BOUNDARY = (
    "READY_WITH_BOUNDARIES: type/build/test, web lint/coverage visibility, "
    "static governance gate, docs governance lane, route-governance workflow "
    "traceability, and protected manual live release gate are source-visible. "
    "Not claimed: production-grade CI, dependency-audit hardening, public-doc "
    "drift hardening, hosted freshness, ordinary live-provider CI execution, "
    "or full public readiness."
)


def _read(path: str, repo_root: Path = REPO_ROOT) -> str:
    target = repo_root / path
    if not target.exists():
        return ""
    return target.read_text(encoding="utf-8", errors="replace")


def _marker_result(path: str, name: str, markers: list[str], repo_root: Path) -> dict[str, Any]:
    text = _read(path, repo_root)
    missing = [marker for marker in markers if marker not in text]
    return {
        "stage": name,
        "path": path,
        "status": "PASS" if text and not missing else "FAIL",
        "missing": missing if text else markers,
    }


def _check_workflows(repo_root: Path) -> list[dict[str, Any]]:
    stages: list[dict[str, Any]] = []
    for path, checks in WORKFLOW_MARKERS.items():
        for name, markers in checks.items():
            stages.append(_marker_result(path, name, markers, repo_root))
    return stages


def _check_web_scripts(repo_root: Path) -> dict[str, Any]:
    try:
        package = json.loads(_read(WEB_PACKAGE_PATH, repo_root))
    except json.JSONDecodeError:
        package = {}
    scripts = package.get("scripts", {}) if isinstance(package, dict) else {}
    missing = [
        name
        for name, expected in WEB_SCRIPT_REQUIREMENTS.items()
        if expected not in str(scripts.get(name, ""))
    ]
    return {
        "stage": "web_package_script_capabilities",
        "path": WEB_PACKAGE_PATH,
        "status": "PASS" if not missing else "FAIL",
        "missing": missing,
    }


def _check_route_governance_interlock(repo_root: Path) -> dict[str, Any]:
    required_paths = [T2A_LEDGER_PATH, T2C_WORKFLOW_PATH, SYSTEM_LOOP_REGISTRY_PATH]
    missing_paths = [path for path in required_paths if not (repo_root / path).exists()]
    registry_text = _read(SYSTEM_LOOP_REGISTRY_PATH, repo_root)
    missing_markers = [
        marker
        for marker in (
            "erh-route-ledger-to-route-governance-proof-workflow",
            "ERH_T2C_ROUTE_GOVERNANCE_PROOF_WORKFLOW",
        )
        if marker not in registry_text
    ]
    return {
        "stage": "route_governance_workflow_interlock",
        "path": SYSTEM_LOOP_REGISTRY_PATH,
        "status": "PASS" if not missing_paths and not missing_markers else "FAIL",
        "missing": missing_paths + missing_markers,
    }


def _check_plan_boundary(repo_root: Path) -> dict[str, Any]:
    text = _read(T2B_PLAN_PATH, repo_root)
    markers = [
        "Public docs must not say CI is production-grade",
        "coverage-threshold hardened",
        "dependency-audit hardened",
        "public-doc drift",
    ]
    missing = [marker for marker in markers if marker not in text]
    return {
        "stage": "public_claim_boundary",
        "path": T2B_PLAN_PATH,
        "status": "PASS" if text and not missing else "FAIL",
        "missing": missing if text else markers,
    }


def _optional_gap_inventory(repo_root: Path) -> dict[str, bool]:
    workflow_text = "\n".join(_read(path, repo_root) for path in WORKFLOW_MARKERS)
    return {
        "dependencyAuditHardened": "npm audit" in workflow_text,
        "publicDocDriftHardened": "public-doc drift" in workflow_text
        or "public docs drift" in workflow_text,
        "ordinaryLiveProviderCi": "RUN_LIVE_GATE" not in _read(
            ".github/workflows/cvf-protected-live-release-gate.yml", repo_root
        ),
    }


def evaluate(repo_root: Path = REPO_ROOT) -> dict[str, Any]:
    stages = [
        *_check_workflows(repo_root),
        _check_web_scripts(repo_root),
        _check_route_governance_interlock(repo_root),
        _check_plan_boundary(repo_root),
    ]
    failures = [stage for stage in stages if stage["status"] != "PASS"]
    return {
        "chainVersion": CHAIN_VERSION,
        "verdict": "READY_WITH_BOUNDARIES" if not failures else "BLOCKED",
        "stages": stages,
        "optionalGapsNotClaimed": _optional_gap_inventory(repo_root),
        "claimBoundary": CLAIM_BOUNDARY,
    }


def _print_text(report: dict[str, Any]) -> None:
    print("=== CVF ERH CI Public-Evaluation Workflow Chain Gate ===")
    print(f"Chain: {report['chainVersion']}")
    print(f"Verdict: {report['verdict']}")
    for stage in report["stages"]:
        print(f"- {stage['stage']}: {stage['status']} ({stage['path']})")
        if stage["missing"]:
            print(f"  missing: {', '.join(stage['missing'])}")
    print("Optional gaps not claimed:")
    for key, value in report["optionalGapsNotClaimed"].items():
        print(f"- {key}: {value}")
    print(report["claimBoundary"])


def main() -> int:
    parser = argparse.ArgumentParser(description="Check ERH CI public-evaluation workflow chain")
    parser.add_argument("--json", action="store_true", help="Emit JSON")
    parser.add_argument("--enforce", action="store_true", help="Exit non-zero on BLOCKED")
    args = parser.parse_args()

    report = evaluate()
    if args.json:
        print(json.dumps(report, indent=2))
    else:
        _print_text(report)
    return 1 if args.enforce and report["verdict"] == "BLOCKED" else 0


if __name__ == "__main__":
    raise SystemExit(main())
