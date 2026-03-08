#!/usr/bin/env python3
"""Precompute the CVF v1.2.2 focused conformance suite once for Wave 1 reuse."""

from __future__ import annotations

import json
import subprocess
import sys
from pathlib import Path


REPO_ROOT = Path(__file__).resolve().parents[1]
V122_ROOT = REPO_ROOT / "EXTENSIONS" / "CVF_v1.2.2_SKILL_GOVERNANCE_ENGINE"
CACHE_OUTPUT = (
    REPO_ROOT
    / "docs"
    / "reviews"
    / "cvf_phase_governance"
    / "CVF_V122_CONFORMANCE_CACHE_2026-03-07.json"
)
RAW_OUTPUT = (
    REPO_ROOT
    / "docs"
    / "reviews"
    / "cvf_phase_governance"
    / "CVF_V122_CONFORMANCE_RAW_2026-03-07.json"
)

SCENARIO_TO_TEST_FILE = {
    "CF-009": "tests/skill.misuse.conformance.test.ts",
    "CF-013": "tests/skill.deprecation.conformance.test.ts",
    "CF-014": "tests/skill.successor.conformance.test.ts",
    "CF-015": "tests/skill.phase-compat.conformance.test.ts",
    "CF-016": "tests/skill.upgrade-orchestration.conformance.test.ts",
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
        cwd=V122_ROOT,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        text=True,
        encoding="utf-8",
        errors="replace",
    )
    if proc.returncode != 0:
        print(proc.stdout.strip())
        return proc.returncode

    raw = json.loads(RAW_OUTPUT.read_text(encoding="utf-8"))
    by_name = {Path(result["name"]).as_posix(): result for result in raw.get("testResults", [])}
    suite_results = {}
    for scenario_id, relative_path in SCENARIO_TO_TEST_FILE.items():
        test_path = (V122_ROOT / relative_path).resolve().as_posix()
        result = by_name.get(test_path)
        if result is None:
            raise SystemExit(f"Missing v1.2.2 conformance result for {scenario_id} -> {relative_path}")
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
        "cacheId": "CVF_V122_CONFORMANCE_CACHE_2026-03-07",
        "workdir": "EXTENSIONS/CVF_v1.2.2_SKILL_GOVERNANCE_ENGINE",
        "suiteResult": "PASS" if raw.get("success") else "FAIL",
        "scenarioCount": len(suite_results),
        "scenarios": suite_results,
    }
    CACHE_OUTPUT.write_text(json.dumps(cache_payload, indent=2, ensure_ascii=True) + "\n", encoding="utf-8")
    print(f"Wrote v1.2.2 conformance cache: {CACHE_OUTPUT.relative_to(REPO_ROOT).as_posix()}")
    print(f"Scenario entries: {len(suite_results)}")
    print(f"Suite result: {cache_payload['suiteResult']}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
