#!/usr/bin/env python3
"""
Export the canonical Wave 1 golden decision baseline from the current registry + summary.
"""

from __future__ import annotations

import argparse
import json
from pathlib import Path
from typing import Any


REPO_ROOT = Path(__file__).resolve().parents[1]
REGISTRY_PATH = REPO_ROOT / "docs" / "reference" / "CVF_CONFORMANCE_SCENARIOS.json"
SUMMARY_PATH = REPO_ROOT / "docs" / "reviews" / "cvf_phase_governance" / "CVF_CROSS_EXTENSION_CONFORMANCE_SUMMARY_2026-03-07.json"
DEFAULT_OUTPUT = REPO_ROOT / "docs" / "baselines" / "CVF_CONFORMANCE_GOLDEN_BASELINE_2026-03-07.json"


def _read_json(path: Path) -> dict[str, Any]:
    return json.loads(path.read_text(encoding="utf-8"))


def _rel(path: Path) -> str:
    return str(path.relative_to(REPO_ROOT)).replace("\\", "/")


def build_baseline() -> dict[str, Any]:
    registry = _read_json(REGISTRY_PATH)
    summary = _read_json(SUMMARY_PATH)

    summary_results = {item["scenarioId"]: item for item in summary.get("results", [])}

    scenarios: list[dict[str, Any]] = []
    for item in registry.get("scenarios", []):
        summary_item = summary_results.get(item["scenarioId"], {})
        scenarios.append(
            {
                "scenarioId": item["scenarioId"],
                "title": item["title"],
                "objective": item["objective"],
                "workdir": item["workdir"],
                "command": item["command"],
                "dependencyGroup": summary_item.get("dependencyGroup"),
                "expectedResult": summary_item.get("result", "PASS"),
            }
        )

    dependency_groups = [
        {
            "groupId": item["groupId"],
            "title": item["title"],
            "bootstrapCommand": item["bootstrapCommand"],
            "workdir": item["workdir"],
            "expectedResult": item["result"],
        }
        for item in summary.get("dependencyGroups", [])
    ]

    return {
        "schemaVersion": "2026-03-07",
        "wave": "WAVE_1",
        "baselineType": "golden-decision-baseline",
        "sourceRegistry": _rel(REGISTRY_PATH),
        "sourceSummary": _rel(SUMMARY_PATH),
        "scenarioCount": len(scenarios),
        "expectedOverallResult": summary.get("overallResult", "PASS"),
        "dependencyGroups": dependency_groups,
        "scenarios": scenarios,
    }


def main() -> int:
    parser = argparse.ArgumentParser(description="Export CVF conformance golden baseline")
    parser.add_argument("--output", default=str(DEFAULT_OUTPUT), help="Output JSON path")
    parser.add_argument("--allow-overwrite", action="store_true", help="Allow overwriting an existing baseline file")
    args = parser.parse_args()

    output_path = Path(args.output).resolve()
    if output_path.exists() and not args.allow_overwrite:
        raise SystemExit(f"Refusing to overwrite existing baseline: {output_path}")

    baseline = build_baseline()
    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(json.dumps(baseline, indent=2) + "\n", encoding="utf-8")

    print(f"Exported conformance golden baseline: {_rel(output_path)}")
    print(f"Scenario count: {baseline['scenarioCount']}")
    print(f"Expected overall result: {baseline['expectedOverallResult']}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
