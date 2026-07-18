#!/usr/bin/env python3
"""
CVF DICE Machine-Candidate Gate.

FPC-T3-C02 guard for changed DICE/DIR source, tests, and contract artifacts.
When the changed range touches DICE or DIR surfaces, the gate verifies that the
focused DICE-MC-01 through DICE-MC-10 marker suite is present and passing.

This gate is read-only. It does not modify DICE runtime behavior, invoke
providers, inspect external app trees, run OCR, or authorize downstream adapter
work.
"""

from __future__ import annotations

import argparse
import datetime as dt
import json
import os
import re
import subprocess
from pathlib import Path
from typing import Any


REPO_ROOT = Path(__file__).resolve().parents[2]
DEFAULT_BASE_CANDIDATES = ("origin/main", "origin/master", "main", "master")

DICE_SOURCE_PATH = "EXTENSIONS/CVF_EXTRACTION_FOUNDATION/src/document_intelligence_control_envelope.py"
DICE_TEST_PATH = "EXTENSIONS/CVF_EXTRACTION_FOUNDATION/tests/test_document_intelligence_control_envelope.py"

DICE_DIR_APPLICABLE_PATHS: tuple[str, ...] = (
    "EXTENSIONS/CVF_EXTRACTION_FOUNDATION/src/document_intelligence_control_envelope.py",
    "EXTENSIONS/CVF_EXTRACTION_FOUNDATION/tests/test_document_intelligence_control_envelope.py",
    "EXTENSIONS/CVF_EXTRACTION_FOUNDATION/src/document_intelligence_router.py",
    "EXTENSIONS/CVF_EXTRACTION_FOUNDATION/tests/test_document_intelligence_router.py",
    "docs/reference/CVF_DOCUMENT_INTELLIGENCE_CONTROL_ENVELOPE_CONTRACT_MATRIX_2026-06-13.md",
    "docs/work_orders/CVF_AGENT_WORK_ORDER_DICE_T0_DOCUMENT_INTELLIGENCE_CONTROL_ENVELOPE_CONTRACT_MATRIX_FOR_CLAUDE_2026-06-13.md",
    "docs/work_orders/CVF_AGENT_WORK_ORDER_DICE_T1_DOCUMENT_INTELLIGENCE_CONTROL_ENVELOPE_RUNTIME_FOR_CLAUDE_2026-06-13.md",
    "docs/reviews/CVF_DICE_T0_DOCUMENT_INTELLIGENCE_CONTROL_ENVELOPE_CONTRACT_MATRIX_COMPLETION_2026-06-13.md",
    "docs/reviews/CVF_DICE_T1_DOCUMENT_INTELLIGENCE_CONTROL_ENVELOPE_RUNTIME_COMPLETION_2026-06-13.md",
)

REQUIRED_DICE_MC_MARKERS = tuple(f"DICE-MC-{index:02d}" for index in range(1, 11))


def _run_command(args: list[str]) -> tuple[int, str, str]:
    proc = subprocess.run(
        args,
        cwd=REPO_ROOT,
        text=True,
        encoding="utf-8",
        errors="replace",
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
    )
    return proc.returncode, proc.stdout or "", proc.stderr or ""


def _run_git(args: list[str]) -> tuple[int, str, str]:
    code, out, err = _run_command(["git", *args])
    return code, out.strip(), err.strip()


def _ref_exists(ref: str) -> bool:
    code, _, _ = _run_git(["rev-parse", "--verify", "--quiet", f"{ref}^{{commit}}"])
    return code == 0


def _discover_default_base(head: str) -> tuple[str, str]:
    env_base = os.getenv("CVF_COMPAT_BASE")
    if env_base:
        return env_base, "env:CVF_COMPAT_BASE"
    for ref in DEFAULT_BASE_CANDIDATES:
        if not _ref_exists(ref):
            continue
        code, out, _ = _run_git(["merge-base", ref, head])
        if code == 0 and out:
            return out, f"merge-base({ref},{head})"
    return "HEAD~1", "fallback:HEAD~1"


def _resolve_range(base: str | None, head: str | None) -> tuple[str, str, str]:
    resolved_head = head or "HEAD"
    if base:
        return base, resolved_head, "explicit:--base"
    resolved_base, source = _discover_default_base(resolved_head)
    return resolved_base, resolved_head, source


def _parse_name_status_output(output: str) -> dict[str, set[str]]:
    changed: dict[str, set[str]] = {}
    for raw_line in output.splitlines():
        if not raw_line.strip():
            continue
        parts = raw_line.split("\t")
        status = parts[0].strip()
        if status.startswith(("R", "C")):
            if len(parts) < 3:
                continue
            path = parts[2]
        else:
            if len(parts) < 2:
                continue
            path = parts[1]
        normalized = path.replace("\\", "/").strip()
        changed.setdefault(normalized, set()).add(status)
    return changed


def _get_changed_name_status(base: str, head: str) -> dict[str, set[str]]:
    code, out, err = _run_git(["diff", "--name-status", f"{base}..{head}"])
    if code != 0:
        raise RuntimeError(f"git diff failed for range {base}..{head}: {err or out}")
    return _parse_name_status_output(out)


def _get_worktree_name_status() -> dict[str, set[str]]:
    changed: dict[str, set[str]] = {}
    for args in (["diff", "--name-status"], ["diff", "--name-status", "--cached"]):
        code, out, _ = _run_git(args)
        if code == 0 and out:
            for path, statuses in _parse_name_status_output(out).items():
                changed.setdefault(path, set()).update(statuses)
    code, out, _ = _run_git(["ls-files", "--others", "--exclude-standard"])
    if code == 0 and out:
        for raw_line in out.splitlines():
            normalized = raw_line.replace("\\", "/").strip()
            if normalized:
                changed.setdefault(normalized, set()).add("A")
    return changed


def _merge_changed_maps(*maps: dict[str, set[str]]) -> dict[str, list[str]]:
    merged: dict[str, set[str]] = {}
    for item in maps:
        for path, statuses in item.items():
            merged.setdefault(path, set()).update(statuses)
    return {path: sorted(statuses) for path, statuses in sorted(merged.items())}


def _read_rel(path: str) -> str:
    return (REPO_ROOT / path).read_text(encoding="utf-8", errors="replace")


def _is_applicable(path: str) -> bool:
    normalized = path.replace("\\", "/")
    if "/archive/" in normalized:
        return False
    return normalized in DICE_DIR_APPLICABLE_PATHS


def _line_number_for_pattern(text: str, pattern: str) -> str:
    match = re.search(re.escape(pattern), text)
    if match is None:
        return "0"
    return str(text.count("\n", 0, match.start()) + 1)


def diagnose_dice_machine_candidate_markers(test_text: str) -> list[dict[str, str]]:
    violations: list[dict[str, str]] = []
    for marker in REQUIRED_DICE_MC_MARKERS:
        if marker not in test_text:
            violations.append(
                {
                    "path": DICE_TEST_PATH,
                    "line": "0",
                    "type": "dice_mc_marker_missing",
                    "marker": marker,
                    "message": f"{DICE_TEST_PATH}: missing required {marker} marker",
                }
            )
            continue
        test_pattern = marker.replace("-", "_")
        if test_pattern not in test_text:
            violations.append(
                {
                    "path": DICE_TEST_PATH,
                    "line": _line_number_for_pattern(test_text, marker),
                    "type": "dice_mc_test_function_missing",
                    "marker": marker,
                    "message": (
                        f"{DICE_TEST_PATH}: {marker} marker exists but no "
                        f"test function containing {test_pattern} was found"
                    ),
                }
            )
    return violations


def _run_focused_pytest() -> dict[str, Any]:
    command = ["python", "-m", "pytest", DICE_TEST_PATH, "-q"]
    code, out, err = _run_command(command)
    return {
        "command": " ".join(command),
        "returncode": code,
        "stdout": out,
        "stderr": err,
        "passed": code == 0,
    }


def _classify(changed_paths: dict[str, list[str]], *, run_pytest: bool) -> dict[str, Any]:
    applicable_paths = [
        path
        for path, statuses in sorted(changed_paths.items())
        if _is_applicable(path) and not all(status.startswith("D") for status in statuses)
    ]
    violations: list[dict[str, str]] = []
    pytest_result: dict[str, Any] | None = None
    if applicable_paths:
        test_path = REPO_ROOT / DICE_TEST_PATH
        if not test_path.exists():
            violations.append(
                {
                    "path": DICE_TEST_PATH,
                    "line": "0",
                    "type": "dice_mc_test_file_missing",
                    "message": f"{DICE_TEST_PATH}: required DICE-MC focused test file is missing",
                }
            )
        else:
            violations.extend(diagnose_dice_machine_candidate_markers(_read_rel(DICE_TEST_PATH)))
        if run_pytest and not violations:
            pytest_result = _run_focused_pytest()
            if not pytest_result["passed"]:
                violations.append(
                    {
                        "path": DICE_TEST_PATH,
                        "line": "0",
                        "type": "dice_mc_focused_pytest_failed",
                        "message": (
                            f"{DICE_TEST_PATH}: focused DICE-MC pytest failed "
                            f"with return code {pytest_result['returncode']}"
                        ),
                    }
                )
    return {
        "checkedPaths": applicable_paths,
        "changedPaths": changed_paths,
        "requiredMarkers": list(REQUIRED_DICE_MC_MARKERS),
        "pytest": pytest_result,
        "violations": violations,
        "violationCount": len(violations),
        "compliant": not violations,
    }


def _print_report(report: dict[str, Any], base: str, head: str, range_source: str) -> None:
    print("=== CVF DICE Machine-Candidate Gate ===")
    print(f"Range: {base}..{head} ({range_source})")
    print(f"Changed paths: {len(report['changedPaths'])}")
    print(f"Checked DICE/DIR paths: {len(report['checkedPaths'])}")
    print(f"Required DICE-MC markers: {len(report['requiredMarkers'])}")
    print(f"Violations: {len(report['violations'])}")
    if report["pytest"] is not None:
        print(f"Focused pytest: returncode={report['pytest']['returncode']}")
    if report["violations"]:
        print("\nViolations:")
        for item in report["violations"]:
            print(f"  - {item['message']}")
    if report["compliant"]:
        print("\nCOMPLIANT - DICE-MC machine-candidate coverage is aligned.")
    else:
        print("\nVIOLATION - DICE/DIR changes must preserve DICE-MC focused coverage.")


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Validate DICE-MC focused machine-candidate coverage for changed DICE/DIR paths"
    )
    parser.add_argument("--base", default=None, help="Optional git base ref")
    parser.add_argument("--head", default=None, help="Optional git head ref")
    parser.add_argument("--enforce", action="store_true",
                        help="Return non-zero when violations exist")
    parser.add_argument("--json", action="store_true", help="Print JSON report")
    parser.add_argument("--no-pytest", action="store_true",
                        help="Check marker coverage without running focused pytest")
    args = parser.parse_args()

    try:
        base, head, range_source = _resolve_range(args.base, args.head)
        changed_paths = _merge_changed_maps(
            _get_changed_name_status(base, head),
            _get_worktree_name_status(),
        )
        report = _classify(changed_paths, run_pytest=not args.no_pytest)
    except RuntimeError as exc:
        print(str(exc))
        return 1

    report["timestamp"] = (
        dt.datetime.now(dt.timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")
    )
    report["range"] = {"base": base, "head": head, "source": range_source}
    if args.json:
        print(json.dumps(report, indent=2, ensure_ascii=False))
    else:
        _print_report(report, base, head, range_source)
    if args.enforce and not report["compliant"]:
        return 2
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
