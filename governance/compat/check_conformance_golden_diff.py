#!/usr/bin/env python3
"""
CVF Conformance Golden Diff Gate

Compares the current canonical Wave 1 registry/summary with the frozen golden baseline
and emits a reviewable diff report.
"""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path
from typing import Any


REPO_ROOT = Path(__file__).resolve().parents[2]
REGISTRY_PATH = REPO_ROOT / "docs" / "reference" / "CVF_CONFORMANCE_SCENARIOS.json"
SUMMARY_PATH = REPO_ROOT / "docs" / "reviews" / "cvf_phase_governance" / "CVF_CROSS_EXTENSION_CONFORMANCE_SUMMARY_2026-03-07.json"
BASELINE_PATH = REPO_ROOT / "docs" / "baselines" / "CVF_CONFORMANCE_GOLDEN_BASELINE_2026-03-07.json"
DEFAULT_REPORT_PATH = REPO_ROOT / "docs" / "reviews" / "cvf_phase_governance" / "CVF_CONFORMANCE_DIFF_REPORT_2026-03-07.md"


def _read_json(path: Path) -> dict[str, Any]:
    return json.loads(path.read_text(encoding="utf-8"))


def _rel(path: Path) -> str:
    return str(path.relative_to(REPO_ROOT)).replace("\\", "/")


def _merge_current_state() -> dict[str, Any]:
    registry = _read_json(REGISTRY_PATH)
    summary = _read_json(SUMMARY_PATH)
    summary_results = {item["scenarioId"]: item for item in summary.get("results", [])}

    scenarios: list[dict[str, Any]] = []
    for item in registry.get("scenarios", []):
        result = summary_results.get(item["scenarioId"], {})
        scenarios.append(
            {
                "scenarioId": item["scenarioId"],
                "title": item["title"],
                "objective": item["objective"],
                "workdir": item["workdir"],
                "command": item["command"],
                "dependencyGroup": result.get("dependencyGroup"),
                "expectedResult": result.get("result"),
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
        "scenarioCount": len(scenarios),
        "expectedOverallResult": summary.get("overallResult"),
        "scenarios": scenarios,
        "dependencyGroups": dependency_groups,
    }


def _index(items: list[dict[str, Any]], key: str) -> dict[str, dict[str, Any]]:
    return {item[key]: item for item in items}


def build_diff() -> dict[str, Any]:
    baseline = _read_json(BASELINE_PATH)
    current = _merge_current_state()

    baseline_ids = [item["scenarioId"] for item in baseline.get("scenarios", [])]
    current_ids = [item["scenarioId"] for item in current.get("scenarios", [])]

    added = [sid for sid in current_ids if sid not in baseline_ids]
    removed = [sid for sid in baseline_ids if sid not in current_ids]

    reordered = []
    if not added and not removed and baseline_ids != current_ids:
        reordered = current_ids

    changed_scenarios: list[dict[str, Any]] = []
    baseline_index = _index(baseline.get("scenarios", []), "scenarioId")
    current_index = _index(current.get("scenarios", []), "scenarioId")

    scenario_fields = ["title", "objective", "workdir", "command", "dependencyGroup", "expectedResult"]
    for scenario_id in [sid for sid in current_ids if sid in baseline_index]:
        changes = {}
        for field in scenario_fields:
            if baseline_index[scenario_id].get(field) != current_index[scenario_id].get(field):
                changes[field] = {
                    "baseline": baseline_index[scenario_id].get(field),
                    "current": current_index[scenario_id].get(field),
                }
        if changes:
            changed_scenarios.append({"scenarioId": scenario_id, "changes": changes})

    baseline_groups = _index(baseline.get("dependencyGroups", []), "groupId")
    current_groups = _index(current.get("dependencyGroups", []), "groupId")
    baseline_group_ids = list(baseline_groups.keys())
    current_group_ids = list(current_groups.keys())

    added_groups = [gid for gid in current_group_ids if gid not in baseline_groups]
    removed_groups = [gid for gid in baseline_group_ids if gid not in current_groups]

    changed_groups: list[dict[str, Any]] = []
    group_fields = ["title", "bootstrapCommand", "workdir", "expectedResult"]
    for group_id in [gid for gid in current_group_ids if gid in baseline_groups]:
        changes = {}
        for field in group_fields:
            if baseline_groups[group_id].get(field) != current_groups[group_id].get(field):
                changes[field] = {
                    "baseline": baseline_groups[group_id].get(field),
                    "current": current_groups[group_id].get(field),
                }
        if changes:
            changed_groups.append({"groupId": group_id, "changes": changes})

    overall_changed = baseline.get("expectedOverallResult") != current.get("expectedOverallResult")
    count_changed = baseline.get("scenarioCount") != current.get("scenarioCount")

    return {
        "baselinePath": _rel(BASELINE_PATH),
        "registryPath": _rel(REGISTRY_PATH),
        "summaryPath": _rel(SUMMARY_PATH),
        "reportPath": _rel(DEFAULT_REPORT_PATH),
        "overallChanged": overall_changed,
        "scenarioCountChanged": count_changed,
        "addedScenarios": added,
        "removedScenarios": removed,
        "reorderedScenarioIds": reordered,
        "changedScenarios": changed_scenarios,
        "addedDependencyGroups": added_groups,
        "removedDependencyGroups": removed_groups,
        "changedDependencyGroups": changed_groups,
    }


def _render_markdown(diff: dict[str, Any]) -> str:
    lines = [
        "# CVF Conformance Diff Report (2026-03-07)",
        "",
        f"- Baseline: `{diff['baselinePath']}`",
        f"- Registry: `{diff['registryPath']}`",
        f"- Summary: `{diff['summaryPath']}`",
        "",
    ]

    has_diff = any(
        [
            diff["overallChanged"],
            diff["scenarioCountChanged"],
            diff["addedScenarios"],
            diff["removedScenarios"],
            diff["reorderedScenarioIds"],
            diff["changedScenarios"],
            diff["addedDependencyGroups"],
            diff["removedDependencyGroups"],
            diff["changedDependencyGroups"],
        ]
    )

    lines.append(f"- Result: `{'DIFF DETECTED' if has_diff else 'NO DIFF'}`")
    lines.append("")

    if diff["overallChanged"]:
        lines.append("## Overall Result Drift")
        lines.append("")
        lines.append("- `expectedOverallResult` changed from the frozen baseline.")
        lines.append("")

    if diff["scenarioCountChanged"]:
        lines.append("## Scenario Count Drift")
        lines.append("")
        lines.append("- `scenarioCount` changed from the frozen baseline.")
        lines.append("")

    if diff["addedScenarios"] or diff["removedScenarios"] or diff["reorderedScenarioIds"]:
        lines.append("## Scenario Set Drift")
        lines.append("")
        if diff["addedScenarios"]:
            lines.append(f"- Added scenarios: `{', '.join(diff['addedScenarios'])}`")
        if diff["removedScenarios"]:
            lines.append(f"- Removed scenarios: `{', '.join(diff['removedScenarios'])}`")
        if diff["reorderedScenarioIds"]:
            lines.append("- Scenario order changed without add/remove.")
        lines.append("")

    if diff["changedScenarios"]:
        lines.append("## Scenario Metadata Drift")
        lines.append("")
        for item in diff["changedScenarios"]:
            lines.append(f"- `{item['scenarioId']}`")
            for field, change in item["changes"].items():
                lines.append(f"  - `{field}`: baseline=`{change['baseline']}` current=`{change['current']}`")
        lines.append("")

    if diff["addedDependencyGroups"] or diff["removedDependencyGroups"] or diff["changedDependencyGroups"]:
        lines.append("## Dependency Group Drift")
        lines.append("")
        if diff["addedDependencyGroups"]:
            lines.append(f"- Added groups: `{', '.join(diff['addedDependencyGroups'])}`")
        if diff["removedDependencyGroups"]:
            lines.append(f"- Removed groups: `{', '.join(diff['removedDependencyGroups'])}`")
        for item in diff["changedDependencyGroups"]:
            lines.append(f"- `{item['groupId']}`")
            for field, change in item["changes"].items():
                lines.append(f"  - `{field}`: baseline=`{change['baseline']}` current=`{change['current']}`")
        lines.append("")

    if not has_diff:
        lines.append("## Status")
        lines.append("")
        lines.append("- Current canonical Wave 1 state matches the frozen golden baseline.")
        lines.append("")

    return "\n".join(lines)


def main() -> int:
    parser = argparse.ArgumentParser(description="CVF conformance golden diff gate")
    parser.add_argument("--report-output", default=str(DEFAULT_REPORT_PATH), help="Markdown diff report output path")
    parser.add_argument("--enforce", action="store_true", help="Return non-zero when a diff is detected")
    args = parser.parse_args()

    diff = build_diff()
    report_output = Path(args.report_output).resolve()
    report_output.parent.mkdir(parents=True, exist_ok=True)
    report_output.write_text(_render_markdown(diff) + "\n", encoding="utf-8")

    has_diff = any(
        [
            diff["overallChanged"],
            diff["scenarioCountChanged"],
            diff["addedScenarios"],
            diff["removedScenarios"],
            diff["reorderedScenarioIds"],
            diff["changedScenarios"],
            diff["addedDependencyGroups"],
            diff["removedDependencyGroups"],
            diff["changedDependencyGroups"],
        ]
    )

    print("=== CVF Conformance Golden Diff Gate ===")
    print(f"Baseline: {diff['baselinePath']}")
    print(f"Report: {_rel(report_output)}")
    print(f"Diff detected: {'YES' if has_diff else 'NO'}")

    if args.enforce and has_diff:
        print("\nFAIL — Current canonical Wave 1 state drifted from the frozen golden baseline.")
        return 2

    print("\nCOMPLIANT — Current canonical Wave 1 state matches the frozen golden baseline.")
    return 0


if __name__ == "__main__":
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(errors="replace")
    if hasattr(sys.stderr, "reconfigure"):
        sys.stderr.reconfigure(errors="replace")
    raise SystemExit(main())
