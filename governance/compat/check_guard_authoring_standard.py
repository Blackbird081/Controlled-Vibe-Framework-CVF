#!/usr/bin/env python3
"""
CVF Guard Authoring Standard Compatibility Gate

Enforces the GC-030 guard authoring standard for every new or materially
revised guard in governance/toolkit/05_OPERATION/.

Policy:
  governance/toolkit/05_OPERATION/CVF_GUARD_AUTHORING_STANDARD_GUARD.md

Usage:
  python governance/compat/check_guard_authoring_standard.py
  python governance/compat/check_guard_authoring_standard.py --enforce
  python governance/compat/check_guard_authoring_standard.py --base <BASE> --head <HEAD>
  python governance/compat/check_guard_authoring_standard.py --json
"""

from __future__ import annotations

import argparse
import datetime as dt
import json
import subprocess
import sys
from pathlib import Path
import re


REPO_ROOT = Path(__file__).resolve().parents[2]
GUARD_DIR = REPO_ROOT / "governance" / "toolkit" / "05_OPERATION"
README_PATH = REPO_ROOT / "README.md"
KB_PATH = REPO_ROOT / "docs" / "CVF_CORE_KNOWLEDGE_BASE.md"
CONTROL_MATRIX_PATH = REPO_ROOT / "docs" / "reference" / "CVF_GOVERNANCE_CONTROL_MATRIX.md"
MASTER_POLICY_PATH = REPO_ROOT / "governance" / "toolkit" / "02_POLICY" / "CVF_MASTER_POLICY.md"

POLICY = "governance/toolkit/05_OPERATION/CVF_GUARD_AUTHORING_STANDARD_GUARD.md"

REQUIRED_METADATA = (
    "Guard Class",
    "Status",
    "Applies to",
    "Enforced by",
)
REQUIRED_SECTIONS = (
    "Purpose",
    "Rule",
    "Enforcement Surface",
    "Related Artifacts",
    "Final Clause",
)
PATH_LIKE_SUFFIXES = (".py", ".md", ".json", ".yml", ".yaml", ".ps1", ".ts")


def _run_git(args: list[str]) -> tuple[int, str, str]:
    proc = subprocess.run(
        ["git", *args],
        cwd=REPO_ROOT,
        text=True,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
    )
    return proc.returncode, proc.stdout.strip(), proc.stderr.strip()


def _read(path: Path) -> str:
    if not path.exists() or path.is_dir():
        return ""
    return path.read_text(encoding="utf-8")


def _discover_all_guards() -> list[Path]:
    if not GUARD_DIR.exists():
        return []
    return sorted(path for path in GUARD_DIR.iterdir() if path.is_file() and path.name.endswith("_GUARD.md"))


def _normalize_rel(path: Path) -> str:
    return str(path.relative_to(REPO_ROOT)).replace("\\", "/")


def _get_changed_files(base: str | None, head: str | None) -> set[str]:
    changed: set[str] = set()

    if base and head:
        code, out, err = _run_git(["diff", "--name-only", f"{base}..{head}"])
        if code != 0:
            raise RuntimeError(f"git diff failed for range {base}..{head}: {err or out}")
        changed.update(line.replace("\\", "/").strip() for line in out.splitlines() if line.strip())

    for args in (["diff", "--name-only"], ["diff", "--name-only", "--cached"]):
        code, out, _ = _run_git(args)
        if code == 0 and out:
            changed.update(line.replace("\\", "/").strip() for line in out.splitlines() if line.strip())

    code, out, _ = _run_git(["ls-files", "--others", "--exclude-standard"])
    if code == 0 and out:
        changed.update(line.replace("\\", "/").strip() for line in out.splitlines() if line.strip())

    return changed


def _extract_metadata(text: str) -> dict[str, str]:
    metadata: dict[str, str] = {}
    for key in ("Control ID", *REQUIRED_METADATA):
        pattern = re.compile(rf"^\*\*{re.escape(key)}:\*\*\s+(.+?)\s*$", re.M)
        match = pattern.search(text)
        if match:
            metadata[key] = match.group(1).strip()
    return metadata


def _extract_control_id(metadata: dict[str, str]) -> str | None:
    raw = metadata.get("Control ID")
    if not raw:
        return None
    match = re.search(r"(GC-\d+)", raw)
    return match.group(1) if match else None


def _extract_enforced_paths(metadata: dict[str, str]) -> list[str]:
    value = metadata.get("Enforced by", "")
    return re.findall(r"`([^`]+)`", value)


def _validate_guard(
    guard_path: Path,
    readme_text: str,
    kb_text: str,
    control_matrix_text: str,
    master_policy_text: str,
) -> list[str]:
    issues: list[str] = []
    text = _read(guard_path)
    rel_path = _normalize_rel(guard_path)

    if not re.search(r"^#\s+\S+", text, re.M):
        issues.append("missing top-level title")

    metadata = _extract_metadata(text)
    for key in REQUIRED_METADATA:
        if key not in metadata:
            issues.append(f"missing metadata field `{key}`")

    for section in REQUIRED_SECTIONS:
        if not re.search(rf"^##\s+{re.escape(section)}\s*$", text, re.M):
            issues.append(f"missing section `## {section}`")

    enforced_paths = _extract_enforced_paths(metadata)
    if "Enforced by" in metadata and not enforced_paths:
        issues.append("`Enforced by` must contain at least one backticked repo-relative path")
    for ref in enforced_paths:
        if not ref.endswith(PATH_LIKE_SUFFIXES):
            issues.append(f"`Enforced by` reference is not a file path: {ref}")
            continue
        candidate = REPO_ROOT / ref
        if not candidate.exists():
            issues.append(f"`Enforced by` reference does not exist: {ref}")

    control_id = _extract_control_id(metadata)
    if "Control ID" in metadata and not control_id:
        issues.append("`Control ID` must contain a `GC-###` token when declared")
    if control_id:
        if control_id not in control_matrix_text:
            issues.append(f"`{control_id}` missing from docs/reference/CVF_GOVERNANCE_CONTROL_MATRIX.md")
        if control_id not in master_policy_text:
            issues.append(f"`{control_id}` missing from governance/toolkit/02_POLICY/CVF_MASTER_POLICY.md")

    if guard_path.name not in readme_text:
        issues.append("guard filename missing from README.md")
    if guard_path.name not in kb_text:
        issues.append("guard filename missing from docs/CVF_CORE_KNOWLEDGE_BASE.md")

    if issues:
        return [f"{rel_path}: {issue}" for issue in issues]
    return []


def _run_check(base: str | None, head: str | None, check_all: bool) -> dict[str, object]:
    all_guards = _discover_all_guards()
    changed_files = _get_changed_files(base, head)
    target_guards = all_guards if check_all else [
        path for path in all_guards if _normalize_rel(path) in changed_files
    ]

    readme_text = _read(README_PATH)
    kb_text = _read(KB_PATH)
    control_matrix_text = _read(CONTROL_MATRIX_PATH)
    master_policy_text = _read(MASTER_POLICY_PATH)

    violations: list[dict[str, object]] = []
    for guard_path in target_guards:
        issues = _validate_guard(
            guard_path,
            readme_text,
            kb_text,
            control_matrix_text,
            master_policy_text,
        )
        if issues:
            violations.append(
                {
                    "guard": guard_path.name,
                    "path": _normalize_rel(guard_path),
                    "issues": issues,
                }
            )

    return {
        "timestamp": dt.datetime.now(dt.timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z"),
        "policy": POLICY,
        "totalGuards": len(all_guards),
        "checkedGuardCount": len(target_guards),
        "checkedGuards": [_normalize_rel(path) for path in target_guards],
        "changedGuardCount": len([path for path in all_guards if _normalize_rel(path) in changed_files]),
        "changedFiles": sorted(changed_files),
        "violationCount": len(violations),
        "violations": violations,
        "legacySkippedCount": max(len(all_guards) - len(target_guards), 0),
        "compliant": len(violations) == 0,
    }


def _print_report(report: dict[str, object], base: str | None, head: str | None, check_all: bool) -> None:
    print("=== CVF Guard Authoring Standard Gate ===")
    if base and head:
        print(f"Range: {base}..{head}")
    print(f"Policy: {report['policy']}")
    print(f"Total guards discovered: {report['totalGuards']}")
    print(f"Guards checked: {report['checkedGuardCount']}")
    print(f"Violations: {report['violationCount']}")

    if report["checkedGuards"]:
        print("\nChecked guards:")
        for path in report["checkedGuards"]:
            print(f"  - {path}")
    elif not check_all:
        print("\nNo changed or new guard files required GC-030 validation in this range.")

    if report["legacySkippedCount"]:
        print(f"\nLegacy guards skipped by GC-030 scope: {report['legacySkippedCount']}")

    if report["violations"]:
        print("\nViolations:")
        for violation in report["violations"]:
            print(f"  - {violation['path']}")
            for issue in violation["issues"]:
                print(f"    - {issue}")

    if report["compliant"]:
        print("\n✅ COMPLIANT — every checked guard satisfies the GC-030 authoring contract.")
    else:
        print("\n❌ VIOLATION — one or more checked guards do not satisfy the GC-030 authoring contract.")
        print("   Action required:")
        print("   1. Add the required metadata block.")
        print("   2. Add all mandatory sections.")
        print("   3. Ensure `Enforced by` points to existing repo paths.")
        print("   4. Register the guard in README.md and docs/CVF_CORE_KNOWLEDGE_BASE.md.")
        print("   5. If the guard claims a GC control ID, sync it with the control matrix and master policy.")


def main() -> int:
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(errors="replace")
    if hasattr(sys.stderr, "reconfigure"):
        sys.stderr.reconfigure(errors="replace")

    parser = argparse.ArgumentParser(description="CVF guard authoring standard compatibility gate")
    parser.add_argument("--base", default=None, help="Optional git base ref")
    parser.add_argument("--head", default=None, help="Optional git head ref")
    parser.add_argument("--all", action="store_true", help="Validate all guard files instead of only changed/new guards")
    parser.add_argument("--enforce", action="store_true", help="Return non-zero (exit 2) when violations are found")
    parser.add_argument("--json", action="store_true", help="Print JSON report to stdout instead of text")
    args = parser.parse_args()

    try:
        report = _run_check(args.base, args.head, args.all)
    except RuntimeError as exc:
        print(str(exc), file=sys.stderr)
        return 1

    if args.json:
        print(json.dumps(report, indent=2, ensure_ascii=False))
    else:
        _print_report(report, args.base, args.head, args.all)

    if args.enforce and not report["compliant"]:
        return 2
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
