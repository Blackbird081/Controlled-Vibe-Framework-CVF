#!/usr/bin/env python3
"""CVF workflow orchestration guard.

This gate keeps GitHub workflow YAML thin and routed through canonical CVF
runner scripts. It prevents static governance checks from drifting into
duplicated, workflow-local command lists.
"""

from __future__ import annotations

import argparse
import datetime as dt
import json
import sys
from pathlib import Path
from typing import Any


REPO_ROOT = Path(__file__).resolve().parents[2]
POLICY = "governance/toolkit/05_OPERATION/CVF_WORKFLOW_ORCHESTRATION_GUARD.md"
REGISTRY_PATH = "governance/compat/CVF_WORKFLOW_ORCHESTRATION_REGISTRY.json"

WORKFLOW_DIR = REPO_ROOT / ".github" / "workflows"
FRAGMENTED_STATIC_TEST_MARKERS = (
    "src/lib/front-door-rewrite-regression.test.ts",
    "src/lib/front-door-template-standard.test.ts",
    "src/lib/skill-corpus-governance.test.ts",
    "src/lib/skill-template-map.test.ts",
)


def _read(rel_path: str) -> str:
    path = REPO_ROOT / rel_path
    if not path.exists() or path.is_dir():
        return ""
    return path.read_text(encoding="utf-8", errors="replace")


def _fragment_present(text: str, fragment: str) -> bool:
    tokens = fragment.replace("\\", "/").split()
    normalized = text.replace("\\", "/")
    return all(token in normalized for token in tokens)


def _load_required_commands() -> dict[str, list[str]]:
    registry_path = REPO_ROOT / REGISTRY_PATH
    data = json.loads(registry_path.read_text(encoding="utf-8"))
    if not isinstance(data, list):
        raise ValueError("workflow orchestration registry must be a list")

    commands: dict[str, list[str]] = {}
    for index, entry in enumerate(data):
        if not isinstance(entry, dict):
            raise ValueError(f"registry entry {index} must be an object")
        surface = entry.get("surface")
        fragments = entry.get("requiredFragments")
        added_at = entry.get("addedAt")
        added_by = entry.get("addedBy")
        if not isinstance(surface, str) or not surface:
            raise ValueError(f"registry entry {index} missing surface")
        if not isinstance(fragments, list) or not all(isinstance(item, str) and item for item in fragments):
            raise ValueError(f"registry entry {surface} missing requiredFragments")
        if not isinstance(added_at, str) or not added_at:
            raise ValueError(f"registry entry {surface} missing addedAt")
        if not isinstance(added_by, str) or not added_by:
            raise ValueError(f"registry entry {surface} missing addedBy")
        commands[surface] = fragments
    return commands


def _check_required_commands(
    required_commands: dict[str, list[str]],
    read_func: Any = _read,
) -> list[dict[str, str]]:
    violations: list[dict[str, str]] = []
    for rel_path, fragments in required_commands.items():
        text = read_func(rel_path)
        if not text:
            violations.append(
                {
                    "path": rel_path,
                    "issue": "required workflow or runner file is missing",
                }
            )
            continue
        for fragment in fragments:
            if not _fragment_present(text, fragment):
                violations.append(
                    {
                        "path": rel_path,
                        "issue": f"missing canonical command fragment: {fragment}",
                    }
                )
    return violations


def _check_fragmented_static_tests(
    workflow_texts: dict[str, str] | None = None,
) -> list[dict[str, str]]:
    violations: list[dict[str, str]] = []
    if workflow_texts is not None:
        items = sorted(workflow_texts.items())
        for rel_path, text in items:
            for marker in FRAGMENTED_STATIC_TEST_MARKERS:
                if marker in text:
                    violations.append(
                        {
                            "path": rel_path,
                            "issue": (
                                "static governance test list is duplicated in workflow YAML; "
                                f"route through scripts/run_cvf_static_ci_gate.py instead ({marker})"
                            ),
                        }
                    )
        return violations

    if not WORKFLOW_DIR.exists():
        return violations
    workflow_files = sorted(
        path for path in WORKFLOW_DIR.iterdir()
        if path.is_file() and path.suffix in {".yml", ".yaml"}
    )
    for path in workflow_files:
        rel_path = str(path.relative_to(REPO_ROOT)).replace("\\", "/")
        text = path.read_text(encoding="utf-8", errors="replace")
        for marker in FRAGMENTED_STATIC_TEST_MARKERS:
            if marker in text:
                violations.append(
                    {
                        "path": rel_path,
                        "issue": (
                            "static governance test list is duplicated in workflow YAML; "
                            f"route through scripts/run_cvf_static_ci_gate.py instead ({marker})"
                        ),
                    }
                )
    return violations


def run_check(
    required_commands: dict[str, list[str]] | None = None,
    read_func: Any = _read,
    workflow_texts: dict[str, str] | None = None,
) -> dict[str, Any]:
    commands = _load_required_commands() if required_commands is None else required_commands
    violations = [
        *_check_required_commands(commands, read_func),
        *_check_fragmented_static_tests(workflow_texts),
    ]
    return {
        "timestamp": dt.datetime.now(dt.timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z"),
        "policy": POLICY,
        "registryPath": REGISTRY_PATH,
        "requiredSurfaceCount": len(commands),
        "fragmentedMarkerCount": len(FRAGMENTED_STATIC_TEST_MARKERS),
        "violationCount": len(violations),
        "violations": violations,
        "compliant": len(violations) == 0,
    }


def _print_report(report: dict[str, Any]) -> None:
    print("=== CVF Workflow Orchestration Guard ===")
    print(f"Policy: {report['policy']}")
    print(f"Required surfaces: {report['requiredSurfaceCount']}")
    print(f"Fragmented static markers blocked: {report['fragmentedMarkerCount']}")
    print(f"Violations: {report['violationCount']}")
    if report["violations"]:
        print("\nViolations:")
        for violation in report["violations"]:
            print(f"  - {violation['path']}: {violation['issue']}")
    if report["compliant"]:
        print("\nCOMPLIANT - workflow orchestration remains routed through canonical CVF runners.")
    else:
        print("\nVIOLATION - workflow logic is missing or fragmented.")
        print("Action required: route CI checks through the canonical runner scripts before pushing.")


def _emit_receipt(report: dict[str, Any]) -> None:
    receipt_path = REPO_ROOT / "docs" / "evidence" / "workflow-orchestration-guard.jsonl"
    receipt_path.parent.mkdir(parents=True, exist_ok=True)
    line = json.dumps(
        {
            "timestamp": dt.datetime.now(dt.timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z"),
            "compliant": report["compliant"],
            "violationCount": report["violationCount"],
        },
        ensure_ascii=False,
    )
    with receipt_path.open("a", encoding="utf-8") as handle:
        handle.write(line + "\n")


def main() -> int:
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(errors="replace")
    if hasattr(sys.stderr, "reconfigure"):
        sys.stderr.reconfigure(errors="replace")

    parser = argparse.ArgumentParser(description="CVF workflow orchestration guard")
    parser.add_argument("--json", action="store_true", help="Emit JSON report")
    parser.add_argument("--enforce", action="store_true", help="Exit non-zero on violations")
    args = parser.parse_args()

    report = run_check()
    if args.enforce:
        _emit_receipt(report)
    if args.json:
        print(json.dumps(report, indent=2, ensure_ascii=False))
    else:
        _print_report(report)

    if args.enforce and not report["compliant"]:
        return 2
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
