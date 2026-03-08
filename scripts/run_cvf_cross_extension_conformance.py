#!/usr/bin/env python3
"""
Run the first-wave CVF cross-extension conformance batch and emit canonical artifacts.
"""

from __future__ import annotations

import argparse
import json
import subprocess
import sys
import time
from dataclasses import dataclass
from pathlib import Path
from typing import Any
import os


REPO_ROOT = Path(__file__).resolve().parents[1]
SCENARIO_REGISTRY = REPO_ROOT / "docs" / "reference" / "CVF_CONFORMANCE_SCENARIOS.json"
DEFAULT_REPORT_OUTPUT = REPO_ROOT / "docs" / "reviews" / "cvf_phase_governance" / "CVF_CROSS_EXTENSION_CONFORMANCE_REPORT_2026-03-07.md"
DEFAULT_SUMMARY_OUTPUT = REPO_ROOT / "docs" / "reviews" / "cvf_phase_governance" / "CVF_CROSS_EXTENSION_CONFORMANCE_SUMMARY_2026-03-07.json"


@dataclass
class Scenario:
    scenario_id: str
    title: str
    objective: str
    command: list[str]
    workdir: Path
    dependency_group: str | None = None


@dataclass
class DependencyGroup:
    group_id: str
    title: str
    bootstrap_command: list[str]
    workdir: Path
    env_overrides: dict[str, str]


RUNTIME_EVIDENCE_RELEASE_GROUP = DependencyGroup(
    group_id="runtime_evidence_release_state",
    title="Shared runtime evidence release state",
    bootstrap_command=["python", "scripts/run_cvf_runtime_evidence_release_gate.py"],
    workdir=REPO_ROOT,
    env_overrides={"CVF_SKIP_RUNTIME_EVIDENCE_RELEASE_GATE": "1"},
)

PACKET_POSTURE_STATE_GROUP = DependencyGroup(
    group_id="packet_posture_state",
    title="Shared packet posture state",
    bootstrap_command=["python", "scripts/run_cvf_packet_posture_state_bootstrap.py"],
    workdir=REPO_ROOT,
    env_overrides={"CVF_SKIP_PACKET_POSTURE_STATE_BOOTSTRAP": "1"},
)

V19_CONFORMANCE_STATE_GROUP = DependencyGroup(
    group_id="v19_conformance_state",
    title="Shared CVF v1.9 conformance state",
    bootstrap_command=["python", "scripts/run_cvf_v19_conformance_state_bootstrap.py"],
    workdir=REPO_ROOT,
    env_overrides={"CVF_SKIP_V19_CONFORMANCE_BOOTSTRAP": "1"},
)

V171_CONFORMANCE_STATE_GROUP = DependencyGroup(
    group_id="v171_conformance_state",
    title="Shared CVF v1.7.1 conformance state",
    bootstrap_command=["python", "scripts/run_cvf_v171_conformance_state_bootstrap.py"],
    workdir=REPO_ROOT,
    env_overrides={"CVF_SKIP_V171_CONFORMANCE_BOOTSTRAP": "1"},
)

V122_CONFORMANCE_STATE_GROUP = DependencyGroup(
    group_id="v122_conformance_state",
    title="Shared CVF v1.2.2 focused conformance state",
    bootstrap_command=["python", "scripts/run_cvf_v122_conformance_state_bootstrap.py"],
    workdir=REPO_ROOT,
    env_overrides={"CVF_SKIP_V122_CONFORMANCE_BOOTSTRAP": "1"},
)


SCENARIO_DEPENDENCY_GROUPS: dict[str, DependencyGroup] = {
    scenario_id: RUNTIME_EVIDENCE_RELEASE_GROUP
    for scenario_id in (
        "CF-032",
        "CF-033",
        "CF-034",
        "CF-035",
        "CF-036",
        "CF-037",
        "CF-038",
        "CF-039",
        "CF-040",
        "CF-041",
    )
}

SCENARIO_DEPENDENCY_GROUPS.update(
    {
        scenario_id: PACKET_POSTURE_STATE_GROUP
        for scenario_id in (
        "CF-042",
        "CF-043",
        "CF-044",
        "CF-045",
        "CF-046",
        "CF-047",
        "CF-048",
        "CF-049",
        "CF-050",
        "CF-051",
        "CF-052",
        "CF-053",
        "CF-054",
        "CF-055",
        "CF-056",
        "CF-057",
        "CF-058",
        "CF-059",
        "CF-060",
        "CF-061",
        "CF-062",
        "CF-063",
        "CF-064",
        "CF-065",
        "CF-066",
        "CF-067",
        "CF-068",
        "CF-069",
        "CF-070",
        "CF-071",
        "CF-072",
        "CF-073",
        "CF-074",
        "CF-075",
        "CF-076",
        "CF-077",
        "CF-078",
        "CF-079",
        "CF-080",
        "CF-081",
        "CF-082",
        "CF-083",
        "CF-084",
        )
    }
)

SCENARIO_DEPENDENCY_GROUPS.update(
    {
        scenario_id: V19_CONFORMANCE_STATE_GROUP
        for scenario_id in (
            "CF-011",
            "CF-019",
            "CF-020",
            "CF-021",
            "CF-022",
            "CF-023",
            "CF-024",
            "CF-025",
            "CF-026",
            "CF-028",
        )
    }
)

SCENARIO_DEPENDENCY_GROUPS.update(
    {
        scenario_id: V171_CONFORMANCE_STATE_GROUP
        for scenario_id in (
            "CF-012",
            "CF-017",
            "CF-018",
        )
    }
)

SCENARIO_DEPENDENCY_GROUPS.update(
    {
        scenario_id: V122_CONFORMANCE_STATE_GROUP
        for scenario_id in (
            "CF-009",
            "CF-013",
            "CF-014",
            "CF-015",
            "CF-016",
        )
    }
)


def _rel(path: Path) -> str:
    return str(path.relative_to(REPO_ROOT)).replace("\\", "/")


def _read_json(path: Path) -> dict[str, Any]:
    return json.loads(path.read_text(encoding="utf-8"))


def _load_scenarios() -> list[Scenario]:
    registry = _read_json(SCENARIO_REGISTRY)
    scenarios: list[Scenario] = []
    for item in registry.get("scenarios", []):
        dependency_group = SCENARIO_DEPENDENCY_GROUPS.get(item["scenarioId"])
        scenarios.append(
            Scenario(
                scenario_id=item["scenarioId"],
                title=item["title"],
                objective=item["objective"],
                command=item["command"],
                workdir=(REPO_ROOT / item["workdir"]).resolve(),
                dependency_group=dependency_group.group_id if dependency_group else None,
            )
        )
    return scenarios


def _resolve_command(command: list[str]) -> list[str]:
    if not command:
        return command
    head = command[0]
    if head == "python":
        return [sys.executable, *command[1:]]
    if sys.platform.startswith("win"):
        if head == "npm":
            return ["npm.cmd", *command[1:]]
        if head == "npx":
            return ["npx.cmd", *command[1:]]
    return command


def _run(command: list[str], workdir: Path, env_overrides: dict[str, str] | None = None) -> tuple[int, str, float]:
    started_at = time.perf_counter()
    env = os.environ.copy()
    if env_overrides:
        env.update(env_overrides)
    proc = subprocess.run(
        _resolve_command(command),
        cwd=workdir,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        text=True,
        encoding="utf-8",
        errors="replace",
        env=env,
    )
    duration_seconds = round(time.perf_counter() - started_at, 3)
    return proc.returncode, proc.stdout.strip(), duration_seconds


def build_summary(
    results: list[tuple[Scenario, int, str, float]],
    dependency_group_results: dict[str, tuple[DependencyGroup, int, str, float]],
) -> dict[str, Any]:
    overall_pass = all(code == 0 for _, code, _, _ in results)
    return {
        "requestId": "REQ-20260307-002",
        "traceBatch": "CVF_CROSS_EXTENSION_CONFORMANCE_BATCH_2026-03-07",
        "scenarioRegistry": _rel(SCENARIO_REGISTRY),
        "overallResult": "PASS" if overall_pass else "FAIL",
        "scenarioCount": len(results),
        "dependencyGroups": [
            {
                "groupId": group.group_id,
                "title": group.title,
                "bootstrapCommand": group.bootstrap_command,
                "workdir": _rel(group.workdir),
                "result": "PASS" if code == 0 else "FAIL",
                "exitCode": code,
                "durationSeconds": duration_seconds,
                "output": output,
            }
            for _, (group, code, output, duration_seconds) in sorted(dependency_group_results.items())
        ],
        "results": [
            {
                "scenarioId": scenario.scenario_id,
                "title": scenario.title,
                "objective": scenario.objective,
                "workdir": _rel(scenario.workdir),
                "command": scenario.command,
                "dependencyGroup": scenario.dependency_group,
                "result": "PASS" if code == 0 else "FAIL",
                "exitCode": code,
                "durationSeconds": duration_seconds,
                "output": output,
            }
            for scenario, code, output, duration_seconds in results
        ],
    }


def build_report(summary: dict[str, Any]) -> str:
    lines = [
        "# CVF Cross-Extension Conformance Report - 2026-03-07",
        "",
        "## Header",
        "",
        f"- requestId: `{summary['requestId']}`",
        f"- traceBatch: `{summary['traceBatch']}`",
        f"- scenario registry: `{summary['scenarioRegistry']}`",
        f"- machine summary: `docs/reviews/cvf_phase_governance/CVF_CROSS_EXTENSION_CONFORMANCE_SUMMARY_2026-03-07.json`",
        f"- overall result: `{summary['overallResult']}`",
        "",
        "## Dependency Groups",
        "",
        "| Group | Result | Duration (s) | Bootstrap Command |",
        "|---|---|---:|---|",
    ]

    for group in summary["dependencyGroups"]:
        command = " ".join(group["bootstrapCommand"])
        lines.append(
            f"| `{group['groupId']}` | `{group['result']}` | `{group['durationSeconds']}` | `{command}` |"
        )

    lines.extend([
        "",
        "## Scenario Results",
        "",
        "| Scenario | Title | Result | Duration (s) | Command |",
        "|---|---|---|---:|---|",
    ])

    for result in summary["results"]:
        command = " ".join(result["command"])
        lines.append(
            f"| `{result['scenarioId']}` | {result['title']} | `{result['result']}` | `{result['durationSeconds']}` | `{command}` |"
        )

    lines.extend(["", "## Execution Details", ""])
    for result in summary["results"]:
        lines.extend(
            [
                f"### {result['scenarioId']} — {result['title']}",
                "",
                f"- objective: {result['objective']}",
                f"- workdir: `{result['workdir']}`",
                f"- dependencyGroup: `{result['dependencyGroup'] or 'none'}`",
                f"- result: `{result['result']}`",
                f"- durationSeconds: `{result['durationSeconds']}`",
                "",
                "```text",
                result["output"],
                "```",
                "",
            ]
        )

    return "\n".join(lines)


def main() -> int:
    parser = argparse.ArgumentParser(description="Run the first-wave CVF cross-extension conformance batch.")
    parser.add_argument("--output", default=str(DEFAULT_REPORT_OUTPUT), help="Markdown report output path")
    parser.add_argument("--summary-output", default=str(DEFAULT_SUMMARY_OUTPUT), help="JSON summary output path")
    args = parser.parse_args()

    report_output = Path(args.output)
    if not report_output.is_absolute():
        report_output = (REPO_ROOT / report_output).resolve()
    report_output.parent.mkdir(parents=True, exist_ok=True)

    summary_output = Path(args.summary_output)
    if not summary_output.is_absolute():
        summary_output = (REPO_ROOT / summary_output).resolve()
    summary_output.parent.mkdir(parents=True, exist_ok=True)

    results: list[tuple[Scenario, int, str, float]] = []
    dependency_group_results: dict[str, tuple[DependencyGroup, int, str, float]] = {}
    for scenario in _load_scenarios():
        env_overrides: dict[str, str] | None = None
        if scenario.dependency_group:
            group = SCENARIO_DEPENDENCY_GROUPS[scenario.scenario_id]
            if group.group_id not in dependency_group_results:
                dependency_group_results[group.group_id] = _run(group.bootstrap_command, group.workdir, group.env_overrides)
                dependency_group_results[group.group_id] = (group, *dependency_group_results[group.group_id])
            group_result = dependency_group_results[group.group_id]
            if group_result[1] != 0:
                code = group_result[1]
                output = (
                    f"Dependency group bootstrap failed: {group.group_id}\n"
                    f"Bootstrap command: {' '.join(group.bootstrap_command)}\n\n"
                    f"{group_result[2]}"
                )
                duration_seconds = group_result[3]
                results.append((scenario, code, output, duration_seconds))
                continue
            env_overrides = group.env_overrides
        code, output, duration_seconds = _run(scenario.command, scenario.workdir, env_overrides)
        results.append((scenario, code, output, duration_seconds))

    summary = build_summary(results, dependency_group_results)
    report_output.write_text(build_report(summary), encoding="utf-8")
    summary_output.write_text(json.dumps(summary, indent=2, ensure_ascii=True) + "\n", encoding="utf-8")

    print(f"Wrote conformance report: {_rel(report_output)}")
    print(f"Wrote conformance summary: {_rel(summary_output)}")
    return 0 if summary["overallResult"] == "PASS" else 2


if __name__ == "__main__":
    raise SystemExit(main())
