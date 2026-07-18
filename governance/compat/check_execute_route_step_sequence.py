#!/usr/bin/env python3
"""CVF execute route step sequence guard."""

from __future__ import annotations

import argparse
import datetime as dt
import json
import sys
from pathlib import Path
from typing import Any


REPO_ROOT = Path(__file__).resolve().parents[2]
POLICY = "governance/toolkit/05_OPERATION/CVF_EXECUTE_ROUTE_STEP_SEQUENCE_GUARD.md"
DEFAULT_ROUTE_PATH = "EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/app/api/execute/route.ts"
DEFAULT_REGISTRY_PATH = "governance/compat/CVF_EXECUTE_ROUTE_STEP_SEQUENCE_REGISTRY.json"
VALID_SELECTORS = {"first", "last"}


def _read_text(path: Path) -> str:
    if not path.exists() or path.is_dir():
        return ""
    return path.read_text(encoding="utf-8", errors="replace")


def _load_registry(path: Path) -> list[dict[str, Any]]:
    data = json.loads(path.read_text(encoding="utf-8"))
    if not isinstance(data, list):
        raise ValueError("execute route sequence registry must be a list")
    entries: list[dict[str, Any]] = []
    for index, item in enumerate(data):
        if not isinstance(item, dict):
            raise ValueError(f"registry entry {index} must be an object")
        entries.append(item)
    return entries


def _ignored_line(line: str) -> bool:
    stripped = line.strip()
    return stripped.startswith("import ") or stripped.startswith("//")


def _find_call_line(lines: list[str], pattern: str, selector: str) -> int | None:
    matches: list[int] = []
    for line_number, line in enumerate(lines, 1):
        if _ignored_line(line):
            continue
        if pattern in line:
            matches.append(line_number)
    if not matches:
        return None
    return matches[0] if selector == "first" else matches[-1]


def _registry_violations(entries: list[dict[str, Any]]) -> list[dict[str, Any]]:
    violations: list[dict[str, Any]] = []
    seen_orders: set[int] = set()
    for index, entry in enumerate(entries):
        order = entry.get("order")
        step_name = entry.get("stepName")
        pattern = entry.get("callPattern")
        selector = entry.get("selector")
        if not isinstance(order, int):
            violations.append({"rule": "registry", "entry": index, "issue": "order must be an integer"})
        elif order in seen_orders:
            violations.append({"rule": "registry", "entry": index, "issue": f"duplicate order {order}"})
        else:
            seen_orders.add(order)
        if not isinstance(step_name, str) or not step_name:
            violations.append({"rule": "registry", "entry": index, "issue": "stepName must be a non-empty string"})
        if not isinstance(pattern, str) or not pattern:
            violations.append({"rule": "registry", "entry": index, "issue": "callPattern must be a non-empty string"})
        if selector not in VALID_SELECTORS:
            violations.append({"rule": "registry", "entry": index, "issue": "selector must be first or last"})
    return violations


def _step_result(entry: dict[str, Any], selected_line: int | None) -> dict[str, Any]:
    confirmed_line = entry.get("confirmedLine")
    return {
        "order": entry.get("order"),
        "stepName": entry.get("stepName"),
        "callPattern": entry.get("callPattern"),
        "selector": entry.get("selector"),
        "confirmedLine": confirmed_line,
        "selectedLine": selected_line,
        "lineMatchesRegistry": selected_line == confirmed_line if isinstance(confirmed_line, int) else None,
    }


def run_check(
    route_path: Path | None = None,
    registry_path: Path | None = None,
    *,
    route_text: str | None = None,
    registry_entries: list[dict[str, Any]] | None = None,
) -> dict[str, Any]:
    route = route_path or REPO_ROOT / DEFAULT_ROUTE_PATH
    registry = registry_path or REPO_ROOT / DEFAULT_REGISTRY_PATH
    entries = registry_entries if registry_entries is not None else _load_registry(registry)
    registry_issues = _registry_violations(entries)
    ordered_entries = sorted(entries, key=lambda item: item.get("order") if isinstance(item.get("order"), int) else 999999)
    base_text = route_text if route_text is not None else _read_text(route)
    supplementary_texts: list[str] = []
    if route_text is None and route.suffix == ".ts" and route.name == "route.ts":
        helper_path = route.with_name("route-final-response.ts")
        if helper_path.exists():
            supplementary_texts.append(_read_text(helper_path))

    combined_text = "\n".join([base_text, *supplementary_texts])
    lines = combined_text.splitlines()

    violations: list[dict[str, Any]] = [*registry_issues]
    steps: list[dict[str, Any]] = []
    previous_line: int | None = None
    previous_step: str | None = None

    if route_text is None and not route.exists():
        violations.append({"rule": "route", "file": str(route), "issue": "route file missing"})

    for entry in ordered_entries:
        selector = entry.get("selector")
        pattern = entry.get("callPattern")
        selected_line = None
        if isinstance(selector, str) and isinstance(pattern, str) and selector in VALID_SELECTORS:
            selected_line = _find_call_line(lines, pattern, selector)
        step = _step_result(entry, selected_line)
        steps.append(step)

        if selected_line is None:
            violations.append(
                {
                    "rule": "missing_step",
                    "order": entry.get("order"),
                    "stepName": entry.get("stepName"),
                    "callPattern": pattern,
                    "selector": selector,
                    "issue": "selected call pattern not found",
                }
            )
            continue
        if previous_line is not None and selected_line <= previous_line:
            violations.append(
                {
                    "rule": "order",
                    "order": entry.get("order"),
                    "stepName": entry.get("stepName"),
                    "selectedLine": selected_line,
                    "previousStepName": previous_step,
                    "previousLine": previous_line,
                    "issue": "selected occurrence is not after previous canonical step",
                }
            )
        previous_line = selected_line
        previous_step = entry.get("stepName") if isinstance(entry.get("stepName"), str) else None

    return {
        "timestamp": dt.datetime.now(dt.timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z"),
        "policy": POLICY,
        "routePath": str(route),
        "registryPath": str(registry),
        "routeLineCount": len(lines),
        "stepCount": len(ordered_entries),
        "steps": steps,
        "violationCount": len(violations),
        "violations": violations,
        "compliant": len(violations) == 0,
    }


def _print_report(report: dict[str, Any]) -> None:
    print("=== CVF Execute Route Step Sequence Guard ===")
    print(f"Policy: {report['policy']}")
    print(f"Route: {report['routePath']}")
    print(f"Registry: {report['registryPath']}")
    print(f"Route lines: {report['routeLineCount']}")
    print(f"Steps: {report['stepCount']}")
    print(f"Violations: {report['violationCount']}")
    for step in report["steps"]:
        print(
            f"  {step['order']}. {step['stepName']} "
            f"{step['selector']} -> line {step['selectedLine']} "
            f"(registry {step['confirmedLine']})"
        )
    if report["violations"]:
        print("\nViolations:")
        for violation in report["violations"]:
            print(f"  - {violation['rule']} {violation.get('stepName', '')}: {violation['issue']}")
    if report["compliant"]:
        print("\nCOMPLIANT - execute route step sequence is aligned.")
    else:
        print("\nVIOLATION - execute route step sequence drift detected.")


def _resolve_path(value: str) -> Path:
    path = Path(value)
    return path if path.is_absolute() else REPO_ROOT / path


def main() -> int:
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(errors="replace")
    if hasattr(sys.stderr, "reconfigure"):
        sys.stderr.reconfigure(errors="replace")

    parser = argparse.ArgumentParser(description="Check CVF execute route step ordering")
    parser.add_argument("--route-path", default=DEFAULT_ROUTE_PATH)
    parser.add_argument("--registry", default=DEFAULT_REGISTRY_PATH)
    parser.add_argument("--check", action="store_true", help="Compatibility no-op; default mode is non-enforcing")
    parser.add_argument("--enforce", action="store_true")
    parser.add_argument("--json", action="store_true")
    args = parser.parse_args()

    report = run_check(_resolve_path(args.route_path), _resolve_path(args.registry))
    if args.json:
        print(json.dumps(report, indent=2, ensure_ascii=False))
    else:
        _print_report(report)
    return 2 if args.enforce and not report["compliant"] else 0


if __name__ == "__main__":
    raise SystemExit(main())
