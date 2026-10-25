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
SCENARIO_DOC_REL_PATH = "docs/reference/CVF_CONFORMANCE_SCENARIOS.md"
SCENARIO_REGISTRY_REL_PATH = "docs/reference/CVF_CONFORMANCE_SCENARIOS.json"
PUBLIC_SCENARIO_DOC_MARKERS = (
    "give the conformance runner a stable scenario registry",
    "machine-readable registry: `docs/reference/CVF_CONFORMANCE_SCENARIOS.json`",
)


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


def _public_projection_error() -> str | None:
    try:
        from guard_binding_catalog import require_public_projection
    except ModuleNotFoundError:
        from governance.compat.guard_binding_catalog import require_public_projection
    try:
        require_public_projection(REPO_ROOT)
    except ValueError as exc:
        return str(exc)
    return None


def _validate_public_registry(registry: Any, violations: list[dict[str, str]], path: str) -> int:
    if not isinstance(registry, dict):
        violations.append({
            "type": "invalid_registry_shape",
            "path": path,
            "message": "Public conformance scenario registry must be an object.",
        })
        return 0

    for field in ("schemaVersion", "wave", "requestId"):
        if not isinstance(registry.get(field), str) or not registry[field].strip():
            violations.append({
                "type": "invalid_registry_field",
                "path": path,
                "message": f"Public conformance scenario registry field `{field}` must be non-empty text.",
            })

    scenarios = registry.get("scenarios")
    if not isinstance(scenarios, list) or not scenarios:
        violations.append({
            "type": "invalid_scenarios_shape",
            "path": path,
            "message": "Public conformance scenario registry must declare a non-empty scenarios array.",
        })
        return 0

    scenario_ids: list[str] = []
    required_text_fields = ("scenarioId", "title", "objective", "workdir")
    for index, scenario in enumerate(scenarios):
        if not isinstance(scenario, dict):
            violations.append({
                "type": "invalid_scenario_entry",
                "path": path,
                "message": f"Scenario entry at index {index} must be an object.",
            })
            continue
        for field in required_text_fields:
            value = scenario.get(field)
            if not isinstance(value, str) or not value.strip():
                violations.append({
                    "type": "invalid_scenario_field",
                    "path": path,
                    "message": f"Scenario entry at index {index} requires non-empty `{field}` text.",
                })
        scenario_id = scenario.get("scenarioId")
        if isinstance(scenario_id, str) and scenario_id.strip():
            scenario_ids.append(scenario_id)
        command = scenario.get("command")
        if not isinstance(command, list) or not command or any(
            not isinstance(part, str) or not part.strip() for part in command
        ):
            violations.append({
                "type": "invalid_scenario_command",
                "path": path,
                "message": f"Scenario entry at index {index} requires a non-empty string command array.",
            })

    if len(scenario_ids) != len(set(scenario_ids)):
        violations.append({
            "type": "duplicate_scenario_id",
            "path": path,
            "message": "Conformance scenario registry contains duplicate scenario IDs.",
        })
    return len(scenarios)


def _build_public_report() -> dict[str, Any]:
    violations: list[dict[str, str]] = []
    mismatch = _public_projection_error()
    if mismatch:
        violations.append({
            "type": "public_carrier_mismatch",
            "path": "AGENTS.md",
            "message": mismatch,
        })

    registry_path = REPO_ROOT / SCENARIO_REGISTRY_REL_PATH
    scenario_doc_path = REPO_ROOT / SCENARIO_DOC_REL_PATH
    for path in (registry_path, scenario_doc_path):
        if not path.is_file():
            violations.append({
                "type": "required_public_file_missing",
                "path": str(path.relative_to(REPO_ROOT)).replace("\\", "/"),
                "message": "Required public conformance scenario owner is missing.",
            })

    if scenario_doc_path.is_file():
        scenario_doc = scenario_doc_path.read_text(encoding="utf-8", errors="replace")
        for marker in PUBLIC_SCENARIO_DOC_MARKERS:
            if marker not in " ".join(scenario_doc.split()):
                violations.append({
                    "type": "missing_public_scenario_doc_marker",
                    "path": SCENARIO_DOC_REL_PATH,
                    "message": f"Public conformance scenario reference is missing marker `{marker}`.",
                })

    scenario_count = 0
    if registry_path.is_file():
        try:
            registry = json.loads(registry_path.read_text(encoding="utf-8"))
        except (OSError, json.JSONDecodeError) as exc:
            registry = None
            violations.append({
                "type": "invalid_registry_json",
                "path": SCENARIO_REGISTRY_REL_PATH,
                "message": f"Public conformance scenario registry is unreadable JSON: {exc}.",
            })
        scenario_count = _validate_public_registry(registry, violations, SCENARIO_REGISTRY_REL_PATH)

    return {
        "profile": "public",
        "scenarioRegistryPath": SCENARIO_REGISTRY_REL_PATH,
        "scenarioCount": scenario_count,
        "registrySchemaStatus": "checked",
        "privateReportSummaryComparison": "not_applicable_public_profile",
        "privateCommandExecution": "not_run_public_profile",
        "claimBoundary": "PUBLIC_SCENARIO_REGISTRY_SCHEMA_ONLY_NOT_PRIVATE_CONFORMANCE_RESULT",
        "violationCount": len(violations),
        "violations": violations,
        "compliant": len(violations) == 0,
    }


def _build_report(profile: str = "private") -> dict[str, Any]:
    if profile not in {"private", "public"}:
        raise ValueError(f"Unsupported conformance artifact profile: {profile}")
    if profile == "public":
        return _build_public_report()
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
        if report.get("profile") == "public":
            print("\nCOMPLIANT — Public scenario registry schema and identity checks passed; private report/summary comparison was not assessed.")
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
    parser.add_argument("--profile", choices=("private", "public"), default="private")
    args = parser.parse_args()

    report = _build_report(profile=args.profile)
    if args.json:
        print(json.dumps(report, indent=2))
    else:
        _print_report(report)

    if args.enforce and not report["compliant"]:
        return 2
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

# Text Encoding Exception: existing CLI report symbols are retained; profile controls use ASCII.
