#!/usr/bin/env python3
"""
CVF Conformance Release-Grade Gate

Determines whether the current canonical Wave 1 conformance state is strong enough
to be treated as release-grade for governance purposes.
"""

from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path
from typing import Any


REPO_ROOT = Path(__file__).resolve().parents[2]
SUMMARY_PATH = REPO_ROOT / "docs" / "reviews" / "cvf_phase_governance" / "CVF_CROSS_EXTENSION_CONFORMANCE_SUMMARY_2026-03-07.json"
DIFF_REPORT_PATH = REPO_ROOT / "docs" / "reviews" / "cvf_phase_governance" / "CVF_CONFORMANCE_DIFF_REPORT_2026-03-07.md"
PROFILE_PATH = REPO_ROOT / "docs" / "reference" / "CVF_CONFORMANCE_RELEASE_GRADE_PROFILE_2026-03-08.json"
DEFAULT_REPORT_PATH = REPO_ROOT / "docs" / "reviews" / "cvf_phase_governance" / "CVF_CONFORMANCE_RELEASE_GATE_REPORT_2026-03-07.md"


def _read_text(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def _read_json(path: Path) -> dict[str, Any]:
    return json.loads(_read_text(path))


def _rel(path: Path) -> str:
    return str(path.relative_to(REPO_ROOT)).replace("\\", "/")


def _extract_diff_status(report_text: str) -> str | None:
    match = re.search(r"- Result: `([^`]+)`", report_text)
    return match.group(1) if match else None


def build_report() -> dict[str, Any]:
    violations: list[dict[str, str]] = []

    for required in (SUMMARY_PATH, DIFF_REPORT_PATH, PROFILE_PATH):
        if not required.exists():
            violations.append(
                {
                    "type": "required_file_missing",
                    "path": _rel(required),
                    "message": "Required release-grade input artifact is missing.",
                }
            )

    if violations:
        return {
            "summaryPath": _rel(SUMMARY_PATH),
            "diffReportPath": _rel(DIFF_REPORT_PATH),
            "profilePath": _rel(PROFILE_PATH),
            "scenarioCount": 0,
            "dependencyGroupCount": 0,
            "familyCount": 0,
            "violationCount": len(violations),
            "violations": violations,
            "compliant": False,
            "decision": "HOLD",
        }

    summary = _read_json(SUMMARY_PATH)
    diff_report = _read_text(DIFF_REPORT_PATH)
    profile = _read_json(PROFILE_PATH)
    diff_status = _extract_diff_status(diff_report)

    scenario_count = int(summary.get("scenarioCount", 0))
    result_count = len(summary.get("results", []))
    dependency_groups = summary.get("dependencyGroups", [])
    failing_groups = [item["groupId"] for item in dependency_groups if item.get("result") != "PASS"]
    summary_results = {item["scenarioId"]: item for item in summary.get("results", [])}
    family_reports: list[dict[str, Any]] = []
    covered_scenarios: list[str] = []
    duplicate_scenarios: set[str] = set()
    seen_scenarios: set[str] = set()
    total_critical_anchor_count = 0
    covered_critical_anchor_count = 0
    total_coverage_group_count = 0
    passing_coverage_group_count = 0

    if summary.get("overallResult") != "PASS":
        violations.append(
            {
                "type": "overall_result_not_pass",
                "path": _rel(SUMMARY_PATH),
                "message": "Canonical Wave 1 overall result is not PASS.",
            }
        )

    if scenario_count <= 0:
        violations.append(
            {
                "type": "scenario_count_empty",
                "path": _rel(SUMMARY_PATH),
                "message": "Canonical Wave 1 scenario count must be greater than zero.",
            }
        )

    if result_count != scenario_count:
        violations.append(
            {
                "type": "result_count_mismatch",
                "path": _rel(SUMMARY_PATH),
                "message": "Summary result count does not match scenarioCount.",
            }
        )

    if not dependency_groups:
        violations.append(
            {
                "type": "dependency_groups_missing",
                "path": _rel(SUMMARY_PATH),
                "message": "Release-grade conformance requires explicit dependency group results.",
            }
        )

    if failing_groups:
        violations.append(
            {
                "type": "dependency_group_failures",
                "path": _rel(SUMMARY_PATH),
                "message": f"Dependency groups not passing: {', '.join(failing_groups)}",
            }
        )

    if not summary.get("requestId"):
        violations.append(
            {
                "type": "missing_request_id",
                "path": _rel(SUMMARY_PATH),
                "message": "Summary is missing requestId for traceability.",
            }
        )

    if not summary.get("traceBatch"):
        violations.append(
            {
                "type": "missing_trace_batch",
                "path": _rel(SUMMARY_PATH),
                "message": "Summary is missing traceBatch for traceability.",
            }
        )

    if diff_status != "NO DIFF":
        violations.append(
            {
                "type": "golden_diff_not_clean",
                "path": _rel(DIFF_REPORT_PATH),
                "message": "Golden diff report does not show NO DIFF.",
            }
        )

    required_families = [family for family in profile.get("requiredFamilies", []) if family.get("requiredForReleaseGrade", False)]
    minimum_required_family_count = int(profile.get("minimumRequiredFamilyCount", 0))
    if len(required_families) < minimum_required_family_count:
        violations.append(
            {
                "type": "required_family_count_below_threshold",
                "path": _rel(PROFILE_PATH),
                "message": f"Required family count {len(required_families)} is below threshold {minimum_required_family_count}.",
            }
        )

    for family in profile.get("requiredFamilies", []):
        family_id = family["familyId"]
        scenario_ids = family.get("scenarioIds", [])
        minimum_scenario_count = int(family.get("minimumScenarioCount", 0))
        critical_anchor_ids = family.get("criticalAnchorScenarioIds", [])
        coverage_groups = family.get("requiredCoverageGroups", [])
        missing = [scenario_id for scenario_id in scenario_ids if scenario_id not in summary_results]
        failing = [
            scenario_id
            for scenario_id in scenario_ids
            if scenario_id in summary_results and summary_results[scenario_id].get("result") != "PASS"
        ]
        missing_critical_anchors = [scenario_id for scenario_id in critical_anchor_ids if scenario_id not in summary_results]
        failing_critical_anchors = [
            scenario_id
            for scenario_id in critical_anchor_ids
            if scenario_id in summary_results and summary_results[scenario_id].get("result") != "PASS"
        ]
        total_critical_anchor_count += len(critical_anchor_ids)
        covered_critical_anchor_count += len(
            [
                scenario_id
                for scenario_id in critical_anchor_ids
                if scenario_id in summary_results and summary_results[scenario_id].get("result") == "PASS"
            ]
        )
        coverage_group_reports: list[dict[str, Any]] = []
        for coverage_group in coverage_groups:
            group_id = coverage_group["groupId"]
            group_scenario_ids = coverage_group.get("scenarioIds", [])
            minimum_passing_scenario_count = int(coverage_group.get("minimumPassingScenarioCount", 0))
            passing_group_scenario_ids = [
                scenario_id
                for scenario_id in group_scenario_ids
                if scenario_id in summary_results and summary_results[scenario_id].get("result") == "PASS"
            ]
            missing_group_scenario_ids = [scenario_id for scenario_id in group_scenario_ids if scenario_id not in summary_results]
            total_coverage_group_count += 1
            if len(passing_group_scenario_ids) >= minimum_passing_scenario_count and not missing_group_scenario_ids:
                passing_coverage_group_count += 1
                group_status = "PASS"
            else:
                group_status = "HOLD"
            coverage_group_reports.append(
                {
                    "groupId": group_id,
                    "title": coverage_group["title"],
                    "scenarioCount": len(group_scenario_ids),
                    "minimumPassingScenarioCount": minimum_passing_scenario_count,
                    "passingScenarioIds": passing_group_scenario_ids,
                    "missingScenarioIds": missing_group_scenario_ids,
                    "status": group_status,
                }
            )
        for scenario_id in scenario_ids:
            if scenario_id in seen_scenarios:
                duplicate_scenarios.add(scenario_id)
            else:
                seen_scenarios.add(scenario_id)
                covered_scenarios.append(scenario_id)
        family_reports.append(
            {
                "familyId": family_id,
                "title": family["title"],
                "requiredForReleaseGrade": bool(family.get("requiredForReleaseGrade", False)),
                "scenarioCount": len(scenario_ids),
                "minimumScenarioCount": minimum_scenario_count,
                "criticalAnchorCount": len(critical_anchor_ids),
                "coverageGroupCount": len(coverage_groups),
                "missingScenarioIds": missing,
                "failingScenarioIds": failing,
                "missingCriticalAnchorScenarioIds": missing_critical_anchors,
                "failingCriticalAnchorScenarioIds": failing_critical_anchors,
                "coverageGroups": coverage_group_reports,
                "status": "PASS"
                if not missing
                and not failing
                and not missing_critical_anchors
                and not failing_critical_anchors
                and all(group["status"] == "PASS" for group in coverage_group_reports)
                else "HOLD",
            }
        )
        if family.get("requiredForReleaseGrade", False):
            if len(scenario_ids) < minimum_scenario_count:
                violations.append(
                    {
                        "type": "required_family_breadth_below_threshold",
                        "path": _rel(PROFILE_PATH),
                        "message": f"{family_id} breadth {len(scenario_ids)} is below minimumScenarioCount {minimum_scenario_count}.",
                    }
                )
            if missing:
                violations.append(
                    {
                        "type": "required_family_missing_scenarios",
                        "path": _rel(PROFILE_PATH),
                        "message": f"{family_id} missing scenarios from canonical summary: {', '.join(missing)}",
                    }
                )
            if failing:
                violations.append(
                    {
                        "type": "required_family_failing_scenarios",
                        "path": _rel(SUMMARY_PATH),
                        "message": f"{family_id} contains non-PASS scenarios: {', '.join(failing)}",
                    }
                )
            if profile.get("requireCriticalAnchorCoverage", False):
                if not critical_anchor_ids:
                    violations.append(
                        {
                            "type": "required_family_missing_critical_anchor_policy",
                            "path": _rel(PROFILE_PATH),
                            "message": f"{family_id} does not declare criticalAnchorScenarioIds.",
                        }
                    )
                if missing_critical_anchors:
                    violations.append(
                        {
                            "type": "required_family_missing_critical_anchor_scenarios",
                            "path": _rel(PROFILE_PATH),
                            "message": f"{family_id} missing critical anchor scenarios from canonical summary: {', '.join(missing_critical_anchors)}",
                        }
                    )
                if failing_critical_anchors:
                    violations.append(
                        {
                            "type": "required_family_failing_critical_anchor_scenarios",
                            "path": _rel(SUMMARY_PATH),
                            "message": f"{family_id} contains non-PASS critical anchor scenarios: {', '.join(failing_critical_anchors)}",
                        }
                    )
            if profile.get("requireCoverageGroupThresholds", False):
                if not coverage_groups:
                    violations.append(
                        {
                            "type": "required_family_missing_coverage_group_policy",
                            "path": _rel(PROFILE_PATH),
                            "message": f"{family_id} does not declare requiredCoverageGroups.",
                        }
                    )
                for group_report in coverage_group_reports:
                    if group_report["missingScenarioIds"]:
                        violations.append(
                            {
                                "type": "required_family_missing_coverage_group_scenarios",
                                "path": _rel(PROFILE_PATH),
                                "message": (
                                    f"{family_id}.{group_report['groupId']} is missing scenarios from canonical summary: "
                                    f"{', '.join(group_report['missingScenarioIds'])}"
                                ),
                            }
                        )
                    if len(group_report["passingScenarioIds"]) < group_report["minimumPassingScenarioCount"]:
                        violations.append(
                            {
                                "type": "required_family_failing_coverage_group_threshold",
                                "path": _rel(SUMMARY_PATH),
                                "message": (
                                    f"{family_id}.{group_report['groupId']} has only {len(group_report['passingScenarioIds'])} "
                                    f"PASS scenarios but requires {group_report['minimumPassingScenarioCount']}."
                                ),
                            }
                        )

    if profile.get("requireDisjointFamilyCoverage", False) and duplicate_scenarios:
        violations.append(
            {
                "type": "family_coverage_overlap",
                "path": _rel(PROFILE_PATH),
                "message": f"Release-grade family coverage overlaps on scenarios: {', '.join(sorted(duplicate_scenarios))}",
            }
        )

    minimum_covered_scenario_count = int(profile.get("minimumCoveredScenarioCount", 0))
    if len(covered_scenarios) < minimum_covered_scenario_count:
        violations.append(
            {
                "type": "covered_scenario_count_below_threshold",
                "path": _rel(PROFILE_PATH),
                "message": f"Covered scenario count {len(covered_scenarios)} is below threshold {minimum_covered_scenario_count}.",
            }
        )

    uncovered_summary_scenarios = [scenario_id for scenario_id in summary_results if scenario_id not in seen_scenarios]
    if not uncovered_summary_scenarios and len(covered_scenarios) != scenario_count:
        uncovered_summary_scenarios = []
    if uncovered_summary_scenarios:
        violations.append(
            {
                "type": "summary_scenarios_outside_release_grade_profile",
                "path": _rel(PROFILE_PATH),
                "message": f"Canonical summary contains scenarios outside release-grade profile coverage: {', '.join(uncovered_summary_scenarios)}",
            }
        )

    return {
        "summaryPath": _rel(SUMMARY_PATH),
        "diffReportPath": _rel(DIFF_REPORT_PATH),
        "profilePath": _rel(PROFILE_PATH),
        "scenarioCount": scenario_count,
        "dependencyGroupCount": len(dependency_groups),
        "familyCount": len(family_reports),
        "familyReports": family_reports,
        "minimumRequiredFamilyCount": minimum_required_family_count,
        "coveredScenarioCount": len(covered_scenarios),
        "minimumCoveredScenarioCount": minimum_covered_scenario_count,
        "duplicateCoverageScenarioCount": len(duplicate_scenarios),
        "criticalAnchorCount": total_critical_anchor_count,
        "coveredCriticalAnchorCount": covered_critical_anchor_count,
        "coverageGroupCount": total_coverage_group_count,
        "passingCoverageGroupCount": passing_coverage_group_count,
        "overallResult": summary.get("overallResult"),
        "diffStatus": diff_status or "UNKNOWN",
        "decision": "RELEASE-GRADE PASS" if not violations else "HOLD",
        "violationCount": len(violations),
        "violations": violations,
        "compliant": len(violations) == 0,
    }


def _render_markdown(report: dict[str, Any]) -> str:
    lines = [
        "# CVF Conformance Release-Grade Gate Report (2026-03-07)",
        "",
        f"- Summary: `{report['summaryPath']}`",
        f"- Golden diff report: `{report['diffReportPath']}`",
        f"- Release-grade profile: `{report['profilePath']}`",
        f"- Scenario count: `{report['scenarioCount']}`",
        f"- Dependency groups: `{report['dependencyGroupCount']}`",
        f"- Capability families: `{report['familyCount']}`",
        f"- Minimum required families: `{report['minimumRequiredFamilyCount']}`",
        f"- Covered scenarios: `{report['coveredScenarioCount']}` / minimum `{report['minimumCoveredScenarioCount']}`",
        f"- Duplicate coverage scenarios: `{report['duplicateCoverageScenarioCount']}`",
        f"- Critical anchors: `{report['coveredCriticalAnchorCount']}` / `{report['criticalAnchorCount']}`",
        f"- Coverage groups: `{report['passingCoverageGroupCount']}` / `{report['coverageGroupCount']}`",
        f"- Overall result: `{report.get('overallResult', 'UNKNOWN')}`",
        f"- Golden diff status: `{report.get('diffStatus', 'UNKNOWN')}`",
        f"- Decision: `{report['decision']}`",
        "",
    ]

    lines.append("## Capability Families")
    lines.append("")
    for family in report.get("familyReports", []):
        lines.append(
            f"- `{family['familyId']}`: `{family['status']}` "
            f"(scenarios=`{family['scenarioCount']}`, minimum=`{family['minimumScenarioCount']}`, anchors=`{family['criticalAnchorCount']}`, groups=`{family['coverageGroupCount']}`, missing=`{len(family['missingScenarioIds'])}`, failing=`{len(family['failingScenarioIds'])}`, anchor-missing=`{len(family['missingCriticalAnchorScenarioIds'])}`, anchor-failing=`{len(family['failingCriticalAnchorScenarioIds'])}`)"
        )
        for group in family.get("coverageGroups", []):
            lines.append(
                f"  - `{group['groupId']}`: `{group['status']}` "
                f"(pass=`{len(group['passingScenarioIds'])}`, minimum=`{group['minimumPassingScenarioCount']}`, missing=`{len(group['missingScenarioIds'])}`)"
            )
    lines.append("")

    if report["violations"]:
        lines.append("## Violations")
        lines.append("")
        for violation in report["violations"]:
            lines.append(f"- `{violation['type']}` in `{violation['path']}`: {violation['message']}")
        lines.append("")
    else:
        lines.append("## Status")
        lines.append("")
        lines.append("- Canonical Wave 1 is release-grade: overall PASS, dependency groups PASS, and golden diff is clean.")
        lines.append("")

    return "\n".join(lines)


def main() -> int:
    parser = argparse.ArgumentParser(description="CVF conformance release-grade gate")
    parser.add_argument("--report-output", default=str(DEFAULT_REPORT_PATH), help="Markdown report output path")
    parser.add_argument("--enforce", action="store_true", help="Return non-zero when release-grade conditions are not met")
    args = parser.parse_args()

    report = build_report()
    report_output = Path(args.report_output).resolve()
    report_output.parent.mkdir(parents=True, exist_ok=True)
    report_output.write_text(_render_markdown(report) + "\n", encoding="utf-8")

    print("=== CVF Conformance Release-Grade Gate ===")
    print(f"Summary: {report['summaryPath']}")
    print(f"Golden diff report: {report['diffReportPath']}")
    print(f"Release-grade profile: {report['profilePath']}")
    print(f"Scenario count: {report['scenarioCount']}")
    print(f"Dependency groups: {report['dependencyGroupCount']}")
    print(f"Capability families: {report['familyCount']}")
    print(f"Covered scenarios: {report['coveredScenarioCount']}/{report['minimumCoveredScenarioCount']}")
    print(f"Duplicate coverage scenarios: {report['duplicateCoverageScenarioCount']}")
    print(f"Critical anchors: {report['coveredCriticalAnchorCount']}/{report['criticalAnchorCount']}")
    print(f"Coverage groups: {report['passingCoverageGroupCount']}/{report['coverageGroupCount']}")
    print(f"Decision: {report['decision']}")
    print(f"Violations: {report['violationCount']}")

    if args.enforce and not report["compliant"]:
        print("\nFAIL — Canonical Wave 1 is not release-grade.")
        return 2

    print("\nCOMPLIANT — Canonical Wave 1 is release-grade.")
    return 0


if __name__ == "__main__":
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(errors="replace")
    if hasattr(sys.stderr, "reconfigure"):
        sys.stderr.reconfigure(errors="replace")
    raise SystemExit(main())
