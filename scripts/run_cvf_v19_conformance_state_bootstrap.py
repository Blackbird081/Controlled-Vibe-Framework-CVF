#!/usr/bin/env python3
"""Precompute the CVF v1.9 conformance suite once for Wave 1 reuse."""

from __future__ import annotations

import json
import subprocess
import sys
from pathlib import Path


REPO_ROOT = Path(__file__).resolve().parents[1]
V19_ROOT = REPO_ROOT / "EXTENSIONS" / "CVF_v1.9_DETERMINISTIC_REPRODUCIBILITY"
CACHE_OUTPUT = (
    REPO_ROOT
    / "docs"
    / "reviews"
    / "cvf_phase_governance"
    / "CVF_V19_CONFORMANCE_CACHE_2026-03-07.json"
)
RAW_OUTPUT = (
    REPO_ROOT
    / "docs"
    / "reviews"
    / "cvf_phase_governance"
    / "CVF_V19_CONFORMANCE_RAW_2026-03-07.json"
)

SCENARIO_TO_TEST_FILE = {
    "CF-011": "tests/replay.conformance.test.ts",
    "CF-019": "tests/cross-extension-audit-replay.conformance.test.ts",
    "CF-020": "tests/cross-extension-workflow-resume.conformance.test.ts",
    "CF-021": "tests/cross-extension-recovery-orchestration.conformance.test.ts",
    "CF-022": "tests/cross-extension-failure-classification.conformance.test.ts",
    "CF-023": "tests/cross-extension-remediation-policy.conformance.test.ts",
    "CF-024": "tests/cross-extension-remediation-execution.conformance.test.ts",
    "CF-025": "tests/cross-extension-remediation-adapter.conformance.test.ts",
    "CF-026": "tests/cross-extension-remediation-file-adapter.conformance.test.ts",
    "CF-028": "tests/cross-extension-remediation-release-adapter.conformance.test.ts",
}


def main() -> int:
    CACHE_OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    command = [
        "npx.cmd" if sys.platform.startswith("win") else "npx",
        "vitest",
        "run",
        *SCENARIO_TO_TEST_FILE.values(),
        "--reporter=json",
        "--outputFile",
        str(RAW_OUTPUT),
    ]
    proc = subprocess.run(
        command,
        cwd=V19_ROOT,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        text=True,
        encoding="utf-8",
        errors="replace",
    )
    output = proc.stdout.strip()
    if proc.returncode != 0:
        print(output)
        return proc.returncode

    raw = json.loads(RAW_OUTPUT.read_text(encoding="utf-8"))
    by_name = {Path(result["name"]).as_posix(): result for result in raw.get("testResults", [])}
    suite_results = {}
    for scenario_id, relative_path in SCENARIO_TO_TEST_FILE.items():
        test_path = (V19_ROOT / relative_path).resolve().as_posix()
        result = by_name.get(test_path)
        if result is None:
            raise SystemExit(f"Missing v1.9 conformance result for {scenario_id} -> {relative_path}")
        suite_results[scenario_id] = {
            "testFile": relative_path,
            "status": result["status"],
            "assertionCount": len(result.get("assertionResults", [])),
            "durationMs": round(sum(item.get("duration", 0) for item in result.get("assertionResults", [])), 3),
            "assertions": [
                {
                    "fullName": item["fullName"],
                    "status": item["status"],
                    "durationMs": round(item.get("duration", 0), 3),
                }
                for item in result.get("assertionResults", [])
            ],
        }

    cache_payload = {
        "cacheId": "CVF_V19_CONFORMANCE_CACHE_2026-03-07",
        "workdir": "EXTENSIONS/CVF_v1.9_DETERMINISTIC_REPRODUCIBILITY",
        "suiteResult": "PASS" if raw.get("success") else "FAIL",
        "scenarioCount": len(suite_results),
        "scenarios": suite_results,
    }
    CACHE_OUTPUT.write_text(json.dumps(cache_payload, indent=2, ensure_ascii=True) + "\n", encoding="utf-8")
    print(f"Wrote v1.9 conformance cache: {CACHE_OUTPUT.relative_to(REPO_ROOT).as_posix()}")
    print(f"Scenario entries: {len(suite_results)}")
    print(f"Suite result: {cache_payload['suiteResult']}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
