#!/usr/bin/env python3
"""CVF static CI gate.

This runner is intentionally non-live. It protects build, type, docs,
secret-scan, and static governance checks without requiring provider keys.
It is not a substitute for the full release gate.
"""

from __future__ import annotations

import argparse
import json
import os
import subprocess
import sys
from dataclasses import asdict
from datetime import date
from pathlib import Path

from run_cvf_release_gate_bundle import (
    CVF_WEB,
    REPO_ROOT,
    CheckResult,
    check_secrets,
    check_web_build,
    platform_cmd,
)
from check_provider_receipt_link_integrity import check_matrix as check_provider_receipt_links


STATIC_GOVERNANCE_TESTS = [
    "src/lib/front-door-rewrite-regression.test.ts",
    "src/lib/front-door-template-standard.test.ts",
    "src/lib/skill-corpus-governance.test.ts",
    "src/lib/skill-template-map.test.ts",
    "src/lib/server/web-governance-jobs.test.ts",
    "src/app/api/system/jobs/route.test.ts",
]

PUBLIC_WORKFLOW_REQUIREMENTS = {
    ".github/workflows/ci.yml": ("npm run test:run", "npm run build"),
    ".github/workflows/cvf-ci.yml": (
        "python ../../../scripts/run_cvf_static_ci_gate.py --json",
        "npm run test:run",
        "npm run build",
    ),
    ".github/workflows/cvf-static-ci.yml": ("python scripts/run_cvf_static_ci_gate.py --json",),
    ".github/workflows/cvf-web-ci.yml": ("npm run test:run", "npm run build"),
    ".github/workflows/public-sync-preflight.yml": ("check_cvf_public_sync_candidate.py",),
    ".github/workflows/public-surface.yml": ("python scripts/check_public_surface.py",),
}

PRIVATE_ONLY_WORKFLOW_MARKERS = ("run_local_governance_hook_chain.py",)


def run_cmd(cmd: list[str], cwd: Path | None = None, timeout: int = 300) -> tuple[int, str, str]:
    try:
        result = subprocess.run(
            platform_cmd(cmd),
            cwd=cwd,
            capture_output=True,
            text=True,
            encoding="utf-8",
            errors="replace",
            timeout=timeout,
        )
        return result.returncode, result.stdout, result.stderr
    except subprocess.TimeoutExpired:
        return 1, "", "Command timed out"
    except Exception as exc:
        return 1, "", str(exc)


def check_web_typecheck() -> CheckResult:
    name = "Web TypeScript check"
    code, stdout, stderr = run_cmd(["npx", "tsc", "--noEmit"], cwd=CVF_WEB, timeout=300)
    if code == 0:
        return CheckResult(name, "PASS", "Web TypeScript check clean")
    lines = (stdout + stderr).splitlines()
    detail = [line for line in lines if "error" in line.lower()][:12] or lines[-12:]
    return CheckResult(name, "FAIL", "Web TypeScript check failed", detail)


def check_docs_governance_compat() -> CheckResult:
    name = "Docs governance compatibility"
    script = REPO_ROOT / "governance" / "compat" / "check_docs_governance_compat.py"
    base = os.environ.get("BASE_SHA", "HEAD")
    head = os.environ.get("HEAD_SHA", "HEAD")
    code, stdout, stderr = run_cmd(
        [sys.executable, str(script), "--base", base, "--head", head, "--enforce"],
        cwd=REPO_ROOT,
        timeout=120,
    )
    if code == 0:
        return CheckResult(name, "PASS", "Docs governance compatibility passed", [f"range={base}..{head}"])
    lines = (stdout + stderr).splitlines()
    return CheckResult(name, "FAIL", "Docs governance compatibility failed", lines[-12:])


def check_public_surface() -> CheckResult:
    name = "Public surface guard"
    script = REPO_ROOT / "scripts" / "check_public_surface.py"
    code, stdout, stderr = run_cmd([sys.executable, str(script)], cwd=REPO_ROOT, timeout=120)
    output = (stdout + stderr).splitlines()
    if code == 0:
        return CheckResult(name, "PASS", "Public surface guard passed", output[-4:])
    return CheckResult(name, "FAIL", "Public surface guard failed", output[-12:])


def check_public_workflow_orchestration() -> CheckResult:
    name = "Public workflow orchestration guard"
    violations: list[str] = []
    for relative_path, required_fragments in PUBLIC_WORKFLOW_REQUIREMENTS.items():
        workflow_path = REPO_ROOT / relative_path
        if not workflow_path.is_file():
            violations.append(f"{relative_path}: workflow missing")
            continue
        text = workflow_path.read_text(encoding="utf-8")
        for marker in PRIVATE_ONLY_WORKFLOW_MARKERS:
            if marker in text:
                violations.append(f"{relative_path}: private-only marker present: {marker}")
        for fragment in required_fragments:
            if fragment not in text:
                violations.append(f"{relative_path}: missing public command fragment: {fragment}")
    if violations:
        return CheckResult(name, "FAIL", "Public workflow orchestration failed", violations[:12])
    return CheckResult(name, "PASS", "Public workflow orchestration passed", [f"Validated {len(PUBLIC_WORKFLOW_REQUIREMENTS)} public workflow owners"])


def check_static_governance_tests() -> CheckResult:
    name = "Static governance/unit tests"
    cmd = ["npx", "vitest", "run", *STATIC_GOVERNANCE_TESTS]
    code, stdout, stderr = run_cmd(cmd, cwd=CVF_WEB, timeout=300)
    output = (stdout + stderr).splitlines()
    if code == 0:
        summary = next((line for line in reversed(output) if "Test Files" in line or "Tests" in line), "")
        return CheckResult(name, "PASS", "Static governance/unit tests passed", [summary] if summary else [])
    failures = [line for line in output if "FAIL" in line or "Error" in line][:12] or output[-12:]
    return CheckResult(name, "FAIL", "Static governance/unit tests failed", failures)


def check_provider_receipt_link_integrity() -> CheckResult:
    name = "Provider receipt-link integrity"
    outcome = check_provider_receipt_links()
    if outcome.ok:
        detail = [row.reason for row in outcome.rows]
        return CheckResult(name, "PASS", "Provider receipt-link integrity passed", detail[:12])
    return CheckResult(name, "FAIL", "Provider receipt-link integrity failed", outcome.diagnostics[:12])


def run_checks() -> list[CheckResult]:
    return [
        check_public_surface(),
        check_public_workflow_orchestration(),
        check_web_build(False),
        check_web_typecheck(),
        check_secrets(False),
        check_docs_governance_compat(),
        check_static_governance_tests(),
        check_provider_receipt_link_integrity(),
    ]


def emit_text(results: list[CheckResult]) -> int:
    print("CVF STATIC CI GATE")
    print("=" * 68)
    for result in results:
        print(f"[{result.status:<4}] {result.name}")
        print(f"       {result.message}")
        for item in result.detail[:6]:
            print(f"       {item}")
    fails = sum(1 for result in results if result.status == "FAIL")
    print("-" * 68)
    print(f"PASS: {sum(1 for result in results if result.status == 'PASS')}  FAIL: {fails}")
    print(f"GATE RESULT: {'FAIL' if fails else 'PASS'}")
    return 1 if fails else 0


def emit_json(results: list[CheckResult]) -> int:
    fails = sum(1 for result in results if result.status == "FAIL")
    payload = {
        "date": date.today().isoformat(),
        "gate": "cvf_static_ci_gate",
        "live_provider_use": False,
        "gate_result": "FAIL" if fails else "PASS",
        "checks": [asdict(result) for result in results],
    }
    print(json.dumps(payload, indent=2))
    return 1 if fails else 0


def main() -> None:
    parser = argparse.ArgumentParser(description="CVF static CI gate")
    parser.add_argument("--json", action="store_true", dest="json_out", help="Emit machine-readable JSON")
    args = parser.parse_args()
    results = run_checks()
    sys.exit(emit_json(results) if args.json_out else emit_text(results))


if __name__ == "__main__":
    main()
