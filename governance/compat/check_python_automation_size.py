#!/usr/bin/env python3
"""
Validate governed Python automation file size against the active CVF thresholds.
"""

from __future__ import annotations

import argparse
import json
import subprocess
import sys
from pathlib import Path
from typing import Any

REPO_ROOT = Path(__file__).resolve().parents[2]
COMPAT_DIR = Path(__file__).resolve().parent
if str(COMPAT_DIR) not in sys.path:
    sys.path.insert(0, str(COMPAT_DIR))

from policy_baseline import load_json_policy_baseline

DEFAULT_REGISTRY = REPO_ROOT / "governance" / "compat" / "CVF_PYTHON_AUTOMATION_SIZE_EXCEPTION_REGISTRY.json"
SCOPES = ("scripts", "governance/compat")
ALLOWED_STATUSES = {"ACTIVE_EXCEPTION", "SUPERSEDED", "RESOLVED"}

# Per-class thresholds (operator-confirmed GFS-PY-T1, 2026-06-25). The flat
# softThresholdLines/hardThresholdLines fields are retained for backward
# compatibility and as the fallback when a file matches no specific class.
PYTHON_FILE_CLASSES = (
    "python_checker",
    "python_test",
    "python_library_helper",
    "python_cli_orchestrator",
)
DEFAULT_CLASS_THRESHOLDS = {
    "python_checker": {"softThresholdLines": 700, "hardThresholdLines": 1000},
    "python_test": {"softThresholdLines": 900, "hardThresholdLines": 1200},
    "python_library_helper": {"softThresholdLines": 600, "hardThresholdLines": 900},
    "python_cli_orchestrator": {"softThresholdLines": 500, "hardThresholdLines": 800},
}
NEAR_HARD_MARGIN_LINES = 25
NEAR_HARD_MIN_SHRINK_LINES = 50


def _rel(path: Path) -> str:
    return str(path.relative_to(REPO_ROOT)).replace("\\", "/")


def _classify_python(rel_path: str) -> str:
    """Classify a governed Python file into a size class.

    Pure path-based: a test by name or `/tests/` location is `python_test`;
    a `governance/compat/check_*.py` is a `python_checker`; a
    `governance/compat/run_*.py` or any `scripts/*.py` is a
    `python_cli_orchestrator`; any remaining `governance/compat/*.py` is a
    `python_library_helper`.
    """
    low = rel_path.lower()
    name = Path(rel_path).name.lower()
    if name.startswith("test_") or name.endswith("_test.py") or "/tests/" in low or "/test/" in low:
        return "python_test"
    if rel_path.startswith("governance/compat/") and name.startswith("check_"):
        return "python_checker"
    if rel_path.startswith("governance/compat/") and name.startswith("run_"):
        return "python_cli_orchestrator"
    if rel_path.startswith("scripts/"):
        return "python_cli_orchestrator"
    if rel_path.startswith("governance/compat/"):
        return "python_library_helper"
    # Fallback for any in-scope file outside the named patterns.
    return "python_library_helper"


def _resolve_class_thresholds(registry: dict[str, Any], file_class: str) -> tuple[int, int]:
    """Return (soft, hard) for a class, preferring registry overrides."""
    overrides = registry.get("classThresholds", {})
    merged = dict(DEFAULT_CLASS_THRESHOLDS.get(file_class, {}))
    if isinstance(overrides, dict) and isinstance(overrides.get(file_class), dict):
        merged.update(overrides[file_class])
    soft = int(merged.get("softThresholdLines", 0) or 0)
    hard = int(merged.get("hardThresholdLines", 0) or 0)
    return soft, hard


def _head_line_count(rel_path: str) -> int | None:
    proc = subprocess.run(
        ["git", "show", f"HEAD:{rel_path}"],
        cwd=REPO_ROOT,
        capture_output=True,
        text=True,
        encoding="utf-8",
        errors="replace",
    )
    if proc.returncode != 0:
        return None
    if not proc.stdout:
        return 0
    return proc.stdout.count("\n") + (0 if proc.stdout.endswith("\n") else 1)


def _has_valid_seed_authorization(exception: dict[str, Any]) -> bool:
    """True when an exception is seeded by an existing GC-018 baseline file.

    The cited `seedAuthorization` must be a repo-relative path that exists, so a
    self-authored exception cannot bypass review by naming a missing file.
    """
    seed = str(exception.get("seedAuthorization", "")).strip()
    if not seed:
        return False
    seed_path = (REPO_ROOT / seed.replace("\\", "/"))
    return seed_path.is_file()


def _is_authorized_ratchet_down(baseline_entry: dict[str, Any], current_entry: dict[str, Any]) -> bool:
    """True when the only change is lowering approvedMaxLines on a seeded entry.

    A split tranche shrinks a monolith and tightens its cap to the new line
    count. That is the intended outcome, not silent drift, so it is allowed when
    the exception is seedAuthorization-backed and every other field is identical
    and the new cap is strictly smaller. Raising the cap or editing any other
    field still requires explicit human review.
    """
    if not _has_valid_seed_authorization(current_entry):
        return False
    base_cap = baseline_entry.get("approvedMaxLines")
    new_cap = current_entry.get("approvedMaxLines")
    if not isinstance(base_cap, int) or not isinstance(new_cap, int):
        return False
    if new_cap >= base_cap:
        return False
    # Every field other than approvedMaxLines must be unchanged.
    base_rest = {key: value for key, value in baseline_entry.items() if key != "approvedMaxLines"}
    current_rest = {key: value for key, value in current_entry.items() if key != "approvedMaxLines"}
    return base_rest == current_rest


def _changed_paths_against_head() -> set[str]:
    changed: set[str] = set()
    for args in (["diff", "--name-only"], ["diff", "--name-only", "--cached"]):
        proc = subprocess.run(
            ["git", *args],
            cwd=REPO_ROOT,
            capture_output=True,
            text=True,
            encoding="utf-8",
            errors="replace",
        )
        if proc.returncode == 0 and proc.stdout:
            changed.update(line.strip().replace("\\", "/") for line in proc.stdout.splitlines() if line.strip())
    proc = subprocess.run(
        ["git", "ls-files", "--others", "--exclude-standard"],
        cwd=REPO_ROOT,
        capture_output=True,
        text=True,
        encoding="utf-8",
        errors="replace",
    )
    if proc.returncode == 0 and proc.stdout:
        changed.update(line.strip().replace("\\", "/") for line in proc.stdout.splitlines() if line.strip())
    return changed


def _read_json(path: Path) -> dict[str, Any]:
    return json.loads(path.read_text(encoding="utf-8"))


def _count_lines(path: Path) -> int:
    with path.open("r", encoding="utf-8", errors="replace") as handle:
        return sum(1 for _ in handle)


def _iter_governed_python_files() -> list[Path]:
    files: list[Path] = []
    for scope in SCOPES:
        files.extend(path for path in (REPO_ROOT / scope).rglob("*.py") if "__pycache__" not in path.parts)
    return sorted(set(files))


def build_report(registry_path: Path) -> dict[str, Any]:
    violations: list[dict[str, Any]] = []
    advisories: list[dict[str, Any]] = []

    if not registry_path.exists():
        return {
            "registryPath": _rel(registry_path),
            "violationCount": 1,
            "advisoryCount": 0,
            "violations": [
                {
                    "type": "registry_missing",
                    "path": _rel(registry_path),
                    "message": "Python automation size exception registry is missing.",
                }
            ],
            "advisories": [],
            "compliant": False,
        }

    registry = _read_json(registry_path)
    baseline_registry, baseline_source = load_json_policy_baseline(registry_path)
    soft_threshold = int(registry.get("softThresholdLines", 600))
    hard_threshold = int(registry.get("hardThresholdLines", 1200))
    raw_exceptions = [
        entry
        for entry in registry.get("exceptions", [])
        if isinstance(entry, dict) and entry.get("path")
    ]
    exception_map = {entry["path"]: entry for entry in raw_exceptions}
    seen_paths: set[str] = set()

    for exception in raw_exceptions:
        path_key = exception["path"]
        if path_key in seen_paths:
            violations.append(
                {
                    "type": "duplicate_exception_path",
                    "path": path_key,
                    "message": f"Duplicate Python automation size exception entry for `{path_key}`.",
                }
            )
        seen_paths.add(path_key)
        status = exception.get("status", "")
        if status and status not in ALLOWED_STATUSES:
            violations.append(
                {
                    "type": "invalid_exception_status",
                    "path": path_key,
                    "message": f"Exception entry uses invalid status `{status}`.",
                }
            )

    if baseline_registry:
        for threshold_field, current_value in (
            ("softThresholdLines", soft_threshold),
            ("hardThresholdLines", hard_threshold),
        ):
            baseline_value = int(baseline_registry.get(threshold_field, current_value))
            if baseline_value != current_value:
                violations.append(
                    {
                        "type": "threshold_changed_from_baseline",
                        "path": _rel(registry_path),
                        "message": (
                            f"`{threshold_field}` changed from baseline value {baseline_value} "
                            f"to {current_value}. Python automation size policy thresholds require "
                            "explicit human-reviewed governance change."
                        ),
                    }
                )

        baseline_exceptions = {
            entry["path"]: entry
            for entry in baseline_registry.get("exceptions", [])
            if isinstance(entry, dict) and entry.get("path")
        }
        for path_key, baseline_entry in baseline_exceptions.items():
            current_entry = exception_map.get(path_key)
            if current_entry is None:
                violations.append(
                    {
                        "type": "exception_removed_from_baseline",
                        "path": path_key,
                        "message": "Python automation size exception was removed from the protected baseline.",
                    }
                )
            elif current_entry != baseline_entry:
                if _is_authorized_ratchet_down(baseline_entry, current_entry):
                    # Lowering approvedMaxLines on a seedAuthorization-backed
                    # exception (and changing nothing else) is the intended
                    # split outcome: as a monolith shrinks, its cap tightens.
                    # Raising the cap or changing any other field still fails.
                    continue
                violations.append(
                    {
                        "type": "exception_mutated_from_baseline",
                        "path": path_key,
                        "message": (
                            "Python automation size exception differs from the protected baseline. "
                            "Registry mutations require explicit human review, except lowering "
                            "approvedMaxLines on a seedAuthorization-backed exception."
                        ),
                    }
                )

        for path_key in exception_map:
            if path_key not in baseline_exceptions:
                if _has_valid_seed_authorization(exception_map[path_key]):
                    # A legacy-debt exception seeded by an authorized GC-018 is a
                    # human-reviewed governance change, not a silent self-grant.
                    continue
                violations.append(
                    {
                        "type": "new_exception_requires_manual_review",
                        "path": path_key,
                        "message": (
                            "New Python automation size exceptions may not be self-authorized in the "
                            "normal commit path. Seed legacy exceptions through an authorized GC-018 "
                            "with a `seedAuthorization` GC-018 baseline path that exists in the repo."
                        ),
                    }
                )

    files_report: list[dict[str, Any]] = []
    changed_paths = _changed_paths_against_head()

    for path in _iter_governed_python_files():
        rel_path = _rel(path)
        lines = _count_lines(path)
        file_class = _classify_python(rel_path)
        class_soft, class_hard = _resolve_class_thresholds(registry, file_class)
        # Fall back to the flat thresholds only when a class has no resolved value.
        soft = class_soft or soft_threshold
        hard = class_hard or hard_threshold
        exception = exception_map.get(rel_path)
        status = "ok"
        is_changed = rel_path in changed_paths

        if exception:
            missing_fields = [
                field
                for field in ("approvedMaxLines", "status", "rationale", "requiredFollowup")
                if not exception.get(field)
            ]
            if missing_fields:
                violations.append(
                    {
                        "type": "exception_entry_incomplete",
                        "path": rel_path,
                        "message": f"Exception entry is missing required fields: {', '.join(missing_fields)}.",
                    }
                )
            approved_max = int(exception.get("approvedMaxLines", 0) or 0)
            if lines > approved_max:
                violations.append(
                    {
                        "type": "exception_approved_max_exceeded",
                        "path": rel_path,
                        "message": f"File has {lines} lines, exceeding approved exception maximum {approved_max}.",
                    }
                )
                status = "violation"
            else:
                status = "exception"
                # Touch rule: an excepted (over-threshold) file may be read freely,
                # but if it is modified in this batch it must not silently grow.
                # Net line delta versus HEAD must be <= 0 UNLESS approvedMaxLines
                # was raised in the same governance change (a human-reviewed bump
                # protected by the registry baseline check above). New logic
                # otherwise belongs in a split/helper module, not the monolith.
                if is_changed:
                    previous_lines = _head_line_count(rel_path)
                    baseline_entry = None
                    if baseline_registry:
                        baseline_entry = {
                            entry["path"]: entry
                            for entry in baseline_registry.get("exceptions", [])
                            if isinstance(entry, dict) and entry.get("path")
                        }.get(rel_path)
                    # A freshly seeded exception (absent from the registry
                    # baseline) is a one-time governance bump authorized by its
                    # seedAuthorization GC-018; the touch rule applies only to
                    # exceptions that already existed in the baseline.
                    if baseline_entry is None and _has_valid_seed_authorization(exception):
                        authorized_bump = True
                    else:
                        baseline_approved_max = (
                            int(baseline_entry.get("approvedMaxLines", approved_max) or approved_max)
                            if baseline_entry
                            else approved_max
                        )
                        authorized_bump = approved_max > baseline_approved_max
                    if previous_lines is not None and lines > previous_lines and not authorized_bump:
                        violations.append(
                            {
                                "type": "exception_file_grew_on_touch",
                                "path": rel_path,
                                "message": (
                                    f"Excepted file grew from {previous_lines} to {lines} lines when touched "
                                    "without a same-batch approvedMaxLines increase. An already-excepted oversized "
                                    "Python file may be read freely, but a batch that modifies it must not increase "
                                    "its line count (net delta must be <= 0) unless approvedMaxLines is raised in the "
                                    "same governance change; add new logic in a split/helper module instead."
                                ),
                            }
                        )
                        status = "violation"
        else:
            if lines > hard:
                violations.append(
                    {
                        "type": "hard_threshold_exceeded_without_exception",
                        "path": rel_path,
                        "message": (
                            f"File has {lines} lines, exceeding hard threshold {hard} for class "
                            f"`{file_class}` without an approved exception."
                        ),
                    }
                )
                status = "violation"
            elif is_changed and lines >= max(1, hard - NEAR_HARD_MARGIN_LINES):
                # Near-hard and touched: require shrink evidence in the same batch.
                previous_lines = _head_line_count(rel_path)
                shrink = (previous_lines - lines) if previous_lines is not None else 0
                if shrink < NEAR_HARD_MIN_SHRINK_LINES:
                    violations.append(
                        {
                            "type": "near_hard_threshold_touched_without_shrink",
                            "path": rel_path,
                            "message": (
                                f"File has {lines} lines and is within {NEAR_HARD_MARGIN_LINES} lines of the "
                                f"hard threshold {hard} for class `{file_class}`. A batch that touches it must "
                                f"split/extract into a new module or shrink it by at least "
                                f"{NEAR_HARD_MIN_SHRINK_LINES} lines."
                            ),
                        }
                    )
                    status = "violation"
                else:
                    advisories.append(
                        {
                            "type": "near_hard_threshold_shrink_present",
                            "path": rel_path,
                            "message": (
                                f"File has {lines} lines near hard threshold {hard} for class `{file_class}`, "
                                f"but a meaningful shrink ({shrink} lines) is present."
                            ),
                        }
                    )
                    status = "advisory"
            elif lines > soft:
                advisories.append(
                    {
                        "type": "soft_threshold_exceeded",
                        "path": rel_path,
                        "message": (
                            f"File has {lines} lines, exceeding advisory threshold {soft} for class "
                            f"`{file_class}`."
                        ),
                    }
                )
                status = "advisory"

        files_report.append(
            {
                "path": rel_path,
                "fileClass": file_class,
                "lines": lines,
                "softThresholdLines": soft,
                "hardThresholdLines": hard,
                "status": status,
            }
        )

    return {
        "registryPath": _rel(registry_path),
        "baselineSource": baseline_source,
        "softThresholdLines": soft_threshold,
        "hardThresholdLines": hard_threshold,
        "classThresholds": {
            cls: dict(zip(("softThresholdLines", "hardThresholdLines"), _resolve_class_thresholds(registry, cls)))
            for cls in PYTHON_FILE_CLASSES
        },
        "fileCount": len(files_report),
        "violationCount": len(violations),
        "advisoryCount": len(advisories),
        "files": files_report,
        "violations": violations,
        "advisories": advisories,
        "compliant": len(violations) == 0,
    }


def _print_report(report: dict[str, Any]) -> None:
    print("=== CVF Python Automation Size Guard ===")
    print(f"Registry: {report['registryPath']}")
    print(f"Protected baseline: {report.get('baselineSource') or 'none'}")
    print(f"Governed files: {report.get('fileCount', 0)}")
    print("Per-class thresholds (soft/hard):")
    for cls, th in report.get("classThresholds", {}).items():
        print(f"  - {cls}: {th.get('softThresholdLines')}/{th.get('hardThresholdLines')}")
    print(f"Fallback flat threshold (soft/hard): {report.get('softThresholdLines', 'n/a')}/{report.get('hardThresholdLines', 'n/a')}")
    print(f"Violations: {report['violationCount']}")
    print(f"Advisories: {report['advisoryCount']}")
    print("")
    print("Top governed files by line count:")
    for item in sorted(report.get("files", []), key=lambda row: row["lines"], reverse=True)[:10]:
        cls = item.get("fileClass", "?")
        hard = item.get("hardThresholdLines", "?")
        print(f"  - {item['path']}: {item['lines']} lines [{cls}, hard {hard}, {item['status']}]")

    if report["violations"]:
        print("\nViolations:")
        for violation in report["violations"]:
            print(f"  - {violation['path']} ({violation['type']}): {violation['message']}")
        print("\nFAIL - Governed Python automation violates the active size policy.")
        return

    if report["advisories"]:
        print("\nAdvisories:")
        for advisory in report["advisories"]:
            print(f"  - {advisory['path']} ({advisory['type']}): {advisory['message']}")

    print("\nCOMPLIANT — Governed Python automation is within the active size policy.")


def main() -> int:
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(errors="replace")
    if hasattr(sys.stderr, "reconfigure"):
        sys.stderr.reconfigure(errors="replace")

    parser = argparse.ArgumentParser(description="CVF governed Python automation size guard")
    parser.add_argument("--registry", default=str(DEFAULT_REGISTRY), help="Exception registry path")
    parser.add_argument("--json", action="store_true", help="Print JSON report")
    parser.add_argument("--enforce", action="store_true", help="Return non-zero when violations exist")
    args = parser.parse_args()

    registry_path = (REPO_ROOT / args.registry).resolve() if not Path(args.registry).is_absolute() else Path(args.registry)
    report = build_report(registry_path)

    if args.json:
        print(json.dumps(report, indent=2))
    else:
        _print_report(report)

    if args.enforce and not report["compliant"]:
        return 2
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
