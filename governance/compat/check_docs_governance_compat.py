#!/usr/bin/env python3
"""
CVF Docs Governance Compatibility Gate

Ensures markdown files created or changed under docs/ follow the
approved root allowlist, taxonomy folders, and governance naming rules.

Policies:
  - governance/toolkit/05_OPERATION/CVF_DOCUMENT_NAMING_GUARD.md
  - governance/toolkit/05_OPERATION/CVF_DOCUMENT_STORAGE_GUARD.md

Usage examples:
  python governance/compat/check_docs_governance_compat.py
  python governance/compat/check_docs_governance_compat.py --base origin/main --head HEAD
  python governance/compat/check_docs_governance_compat.py --base <sha> --head <sha> --enforce
  python governance/compat/check_docs_governance_compat.py --json
"""

from __future__ import annotations

import argparse
import datetime as dt
import json
import os
import subprocess
import sys
from pathlib import Path
from typing import Any


REPO_ROOT = Path(__file__).resolve().parents[2]
POLICIES = [
    "governance/toolkit/05_OPERATION/CVF_DOCUMENT_NAMING_GUARD.md",
    "governance/toolkit/05_OPERATION/CVF_DOCUMENT_STORAGE_GUARD.md",
]
DEFAULT_BASE_CANDIDATES = ("origin/main", "origin/master", "main", "master")
ALLOWED_DOCS_FOLDERS = {
    "reference",
    "assessments",
    "baselines",
    "roadmaps",
    "reviews",
    "logs",
    "concepts",
    "guides",
    "tutorials",
    "cheatsheets",
    "case-studies",
}
GOVERNANCE_FOLDERS = {"reference", "assessments", "baselines", "roadmaps", "reviews", "logs"}
APPROVED_ROOT_FILES = {
    "BUG_HISTORY.md",
    "CHEAT_SHEET.md",
    "CVF_ARCHITECTURE_DECISIONS.md",
    "CVF_CORE_KNOWLEDGE_BASE.md",
    "CVF_INCREMENTAL_TEST_LOG.md",
    "GET_STARTED.md",
    "HOW_TO_APPLY_CVF.md",
    "INDEX.md",
    "VERSIONING.md",
    "VERSION_COMPARISON.md",
}
APPROVED_GENERIC_FILENAMES = {"README.md", "INDEX.md"}


def _run_git(args: list[str]) -> tuple[int, str, str]:
    proc = subprocess.run(
        ["git", *args],
        cwd=REPO_ROOT,
        text=True,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
    )
    return proc.returncode, proc.stdout.strip(), proc.stderr.strip()


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


def _get_commits_in_range(base: str, head: str) -> list[dict[str, str]]:
    code, out, err = _run_git(["log", "--oneline", "--format=%H|%s", f"{base}..{head}"])
    if code != 0:
        raise RuntimeError(f"git log failed for range {base}..{head}: {err or out}")

    commits = []
    for line in out.splitlines():
        if "|" not in line:
            continue
        sha, message = line.split("|", 1)
        commits.append({"sha": sha.strip(), "message": message.strip()})
    return commits


def _parse_name_status_output(output: str) -> dict[str, set[str]]:
    changed: dict[str, set[str]] = {}

    for raw_line in output.splitlines():
        if not raw_line.strip():
            continue
        parts = raw_line.split("\t")
        status = parts[0].strip()
        if status.startswith("R") or status.startswith("C"):
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
    for changed_map in maps:
        for path, statuses in changed_map.items():
            merged.setdefault(path, set()).update(statuses)
    return {path: sorted(statuses) for path, statuses in sorted(merged.items())}


def _validate_docs_path(path: str) -> list[dict[str, str]]:
    violations: list[dict[str, str]] = []
    normalized = path.replace("\\", "/")

    if not normalized.startswith("docs/") or not normalized.endswith(".md"):
        return violations

    relative = normalized[len("docs/") :]
    parts = relative.split("/")
    filename = parts[-1]

    if len(parts) == 1:
        if filename not in APPROVED_ROOT_FILES:
            violations.append(
                {
                    "path": normalized,
                    "type": "root_allowlist",
                    "message": (
                        f"`{normalized}` is in docs/ root but is not an approved root-level file. "
                        "Move it into the correct taxonomy folder."
                    ),
                }
            )
        return violations

    top_folder = parts[0]
    if top_folder not in ALLOWED_DOCS_FOLDERS:
        violations.append(
            {
                "path": normalized,
                "type": "taxonomy_folder",
                "message": (
                    f"`{normalized}` uses unsupported docs folder `{top_folder}`. "
                    "Use the taxonomy defined in docs/INDEX.md."
                ),
            }
        )
        return violations

    if top_folder in GOVERNANCE_FOLDERS:
        if filename not in APPROVED_GENERIC_FILENAMES and not filename.startswith("CVF_"):
            violations.append(
                {
                    "path": normalized,
                    "type": "governance_naming",
                    "message": (
                        f"`{normalized}` must use the `CVF_` prefix or an approved exception filename."
                    ),
                }
            )

    return violations


def _classify(
    commits: list[dict[str, str]],
    changed_paths: dict[str, list[str]],
) -> dict[str, Any]:
    docs_files = {
        path: statuses
        for path, statuses in changed_paths.items()
        if path.startswith("docs/")
        and path.endswith(".md")
        and not all(status.startswith("D") for status in statuses)
        and (REPO_ROOT / path).exists()
    }

    violations: list[dict[str, str]] = []
    for path in docs_files:
        violations.extend(_validate_docs_path(path))

    return {
        "totalCommits": len(commits),
        "docsFilesChecked": [
            {"path": path, "statuses": statuses} for path, statuses in docs_files.items()
        ],
        "docsFileCount": len(docs_files),
        "violationCount": len(violations),
        "violations": violations,
        "hasDocsActivity": len(docs_files) > 0,
        "compliant": len(violations) == 0,
        "changedFiles": list(changed_paths.keys()),
    }


def _print_report(report: dict[str, Any], base: str, head: str, base_source: str) -> None:
    print("=== CVF Docs Governance Gate ===")
    print(f"Range: {base}..{head}")
    print(f"Base source: {base_source}")
    print(f"Total commits: {report['totalCommits']}")
    print(f"Docs markdown files checked: {report['docsFileCount']}")
    print(f"Violations: {report['violationCount']}")

    if report["docsFilesChecked"]:
        print("\nDocs files checked:")
        for item in report["docsFilesChecked"]:
            status_text = ",".join(item["statuses"])
            print(f"  - {item['path']} [{status_text}]")

    if report["violations"]:
        print("\nViolations:")
        for violation in report["violations"]:
            print(f"  - {violation['path']} ({violation['type']}): {violation['message']}")

    if report["compliant"]:
        if report["hasDocsActivity"]:
            print("\n✅ COMPLIANT — Docs paths and filenames follow the active governance rules.")
        else:
            print("\n✅ SKIP — No docs markdown activity detected in this range.")
    else:
        print("\n❌ VIOLATION — Docs governance rules were violated.")
        print("   Action required: fix root placement, taxonomy folder, or filename prefix.")
        print("   See:")
        for policy in POLICIES:
            print(f"   - {policy}")


def main() -> int:
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(errors="replace")
    if hasattr(sys.stderr, "reconfigure"):
        sys.stderr.reconfigure(errors="replace")

    parser = argparse.ArgumentParser(
        description="CVF docs governance compatibility gate"
    )
    parser.add_argument(
        "--base",
        default=None,
        help="Git base ref (default: auto-detect merge-base, then fallback HEAD~1)",
    )
    parser.add_argument(
        "--head",
        default=None,
        help="Git head ref (default: HEAD)",
    )
    parser.add_argument(
        "--enforce",
        action="store_true",
        help="Return non-zero (exit 2) when docs governance rules are violated",
    )
    parser.add_argument(
        "--json",
        action="store_true",
        help="Print JSON report to stdout instead of text",
    )
    parser.add_argument(
        "--write-report",
        default=None,
        help="Optional output path for JSON report file",
    )
    args = parser.parse_args()

    base, head, base_source = _resolve_range(args.base, args.head)

    try:
        commits = _get_commits_in_range(base, head)
        range_changes = _get_changed_name_status(base, head)
    except RuntimeError as exc:
        if args.base:
            fallback_base = "HEAD~1"
            try:
                commits = _get_commits_in_range(fallback_base, head)
                range_changes = _get_changed_name_status(fallback_base, head)
                print(
                    f"Warning: primary range failed ({exc}); fallback to {fallback_base}..{head}",
                    file=sys.stderr,
                )
                base = fallback_base
                base_source = "fallback-after-error:HEAD~1"
            except RuntimeError as fallback_exc:
                print(str(fallback_exc), file=sys.stderr)
                return 1
        else:
            print(str(exc), file=sys.stderr)
            return 1

    worktree_changes = _get_worktree_name_status()
    changed_paths = _merge_changed_maps(range_changes, worktree_changes)

    classified = _classify(commits, changed_paths)
    report = {
        "timestamp": dt.datetime.now(dt.timezone.utc)
        .replace(microsecond=0)
        .isoformat()
        .replace("+00:00", "Z"),
        "range": {"base": base, "head": head, "baseSource": base_source},
        "policies": POLICIES,
        **classified,
    }

    if args.write_report:
        out_path = Path(args.write_report)
        if not out_path.is_absolute():
            out_path = (REPO_ROOT / out_path).resolve()
        out_path.parent.mkdir(parents=True, exist_ok=True)
        out_path.write_text(json.dumps(report, indent=2), encoding="utf-8")

    if args.json:
        print(json.dumps(report, indent=2))
    else:
        _print_report(report, base, head, base_source)

    if args.enforce and not classified["compliant"]:
        return 2

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
