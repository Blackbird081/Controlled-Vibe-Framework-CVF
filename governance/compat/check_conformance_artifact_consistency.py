#!/usr/bin/env python3
"""
CVF Conformance Artifact Consistency Gate

Ensures the canonical conformance registry, markdown report, and JSON summary stay aligned.
"""

from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path
from typing import Any


REPO_ROOT = Path(__file__).resolve().parents[2]
SCENARIO_REGISTRY_PATH = REPO_ROOT / "docs" / "reference" / "CVF_CONFORMANCE_SCENARIOS.json"
REPORT_PATH = REPO_ROOT / "docs" / "reviews" / "cvf_phase_governance" / "CVF_CROSS_EXTENSION_CONFORMANCE_REPORT_2026-03-07.md"
SUMMARY_PATH = REPO_ROOT / "docs" / "reviews" / "cvf_phase_governance" / "CVF_CROSS_EXTENSION_CONFORMANCE_SUMMARY_2026-03-07.json"


def _read(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def _read_json(path: Path) -> dict[str, Any]:
    return json.loads(_read(path))


def _normalize_rel(path: Path) -> str:
    return str(path.relative_to(REPO_ROOT)).replace("\\", "/")


def _extract_report_table_ids(report_text: str) -> list[str]:
    return re.findall(r"^\| `(CF-[^`]+)` \|", report_text, re.MULTILINE)


def _extract_report_overall(report_text: str) -> str | None:
    match = re.search(r"- overall result: `([^`]+)`", report_text)
    return match.group(1) if match else None


def _build_report() -> dict[str, Any]:
    violations: list[dict[str, str]] = []

    for required in [SCENARIO_REGISTRY_PATH, REPORT_PATH, SUMMARY_PATH]:
        if not required.exists():
            violations.append(
                {
                    "type": "required_file_missing",
                    "path": _normalize_rel(required),
                    "message": "Required conformance artifact is missing.",
                }
            )

    if violations:
        return {"violationCount": len(violations), "violations": violations, "compliant": False}

    registry = _read_json(SCENARIO_REGISTRY_PATH)
    summary = _read_json(SUMMARY_PATH)
    report_text = _read(REPORT_PATH)

    scenario_ids = [item["scenarioId"] for item in registry.get("scenarios", [])]
    if len(scenario_ids) != len(set(scenario_ids)):
        violations.append(
            {
                "type": "duplicate_scenario_id",
                "path": _normalize_rel(SCENARIO_REGISTRY_PATH),
                "message": "Conformance scenario registry contains duplicate scenario IDs.",
            }
        )

    summary_ids = [item["scenarioId"] for item in summary.get("results", [])]
    report_ids = _extract_report_table_ids(report_text)

    if scenario_ids != summary_ids:
        violations.append(
            {
                "type": "summary_registry_mismatch",
                "path": _normalize_rel(SUMMARY_PATH),
                "message": "Scenario order/content in summary does not match canonical scenario registry.",
            }
        )

    if scenario_ids != report_ids:
        violations.append(
            {
                "type": "report_registry_mismatch",
                "path": _normalize_rel(REPORT_PATH),
                "message": "Scenario order/content in report does not match canonical scenario registry.",
            }
        )

    expected_overall = "PASS" if all(item.get("result") == "PASS" for item in summary.get("results", [])) else "FAIL"
    if summary.get("overallResult") != expected_overall:
        violations.append(
            {
                "type": "summary_overall_mismatch",
                "path": _normalize_rel(SUMMARY_PATH),
                "message": "Summary overallResult does not match per-scenario results.",
            }
        )

    report_overall = _extract_report_overall(report_text)
    if report_overall != summary.get("overallResult"):
        violations.append(
            {
                "type": "report_overall_mismatch",
                "path": _normalize_rel(REPORT_PATH),
                "message": "Report overall result does not match summary overallResult.",
            }
        )

    if summary.get("scenarioRegistry") != _normalize_rel(SCENARIO_REGISTRY_PATH):
        violations.append(
            {
                "type": "summary_registry_anchor_mismatch",
                "path": _normalize_rel(SUMMARY_PATH),
                "message": "Summary does not point to the canonical scenario registry path.",
            }
        )

    return {
        "scenarioRegistryPath": _normalize_rel(SCENARIO_REGISTRY_PATH),
        "reportPath": _normalize_rel(REPORT_PATH),
        "summaryPath": _normalize_rel(SUMMARY_PATH),
        "scenarioCount": len(scenario_ids),
        "violationCount": len(violations),
        "violations": violations,
        "compliant": len(violations) == 0,
    }


def _print_report(report: dict[str, Any]) -> None:
    print("=== CVF Conformance Artifact Consistency Gate ===")
    print(f"Scenario count: {report.get('scenarioCount', 0)}")
    print(f"Violations: {report['violationCount']}")
    if report["violations"]:
        print("\nViolations:")
        for violation in report["violations"]:
            print(f"  - {violation['path']} ({violation['type']}): {violation['message']}")
        print("\nFAIL — Conformance artifacts are not internally aligned.")
    else:
        print("\nCOMPLIANT — Scenario registry, JSON summary, and markdown report are aligned.")


def main() -> int:
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(errors="replace")
    if hasattr(sys.stderr, "reconfigure"):
        sys.stderr.reconfigure(errors="replace")

    parser = argparse.ArgumentParser(description="CVF conformance artifact consistency gate")
    parser.add_argument("--enforce", action="store_true", help="Return non-zero when violations exist")
    parser.add_argument("--json", action="store_true", help="Print JSON report")
    args = parser.parse_args()

    report = _build_report()
    if args.json:
        print(json.dumps(report, indent=2))
    else:
        _print_report(report)

    if args.enforce and not report["compliant"]:
        return 2
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
