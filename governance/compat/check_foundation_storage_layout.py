#!/usr/bin/env python3
"""
CVF Foundation Storage Layout Gate

Enforces stable folder/index discipline for durable governance foundation files.
"""

from __future__ import annotations

import argparse
import json
import os
import re
import subprocess
import sys
from pathlib import Path
from typing import Any

try:
    from guard_binding_catalog import has_binding_marker
except ModuleNotFoundError:
    from governance.compat.guard_binding_catalog import has_binding_marker


REPO_ROOT = Path(__file__).resolve().parents[2]
STANDARD_PATH = "docs/reference/foundation_storage/CVF_FOUNDATION_FILE_STORAGE_AND_INDEX_STANDARD.md"
README_PATH = "docs/reference/foundation_storage/README.md"
THIS_SCRIPT_PATH = "governance/compat/check_foundation_storage_layout.py"
AUTORUN_PATH = "governance/compat/run_agent_autorun_workflow_gate.py"
HOOK_CHAIN_PATH = "governance/compat/run_local_governance_hook_chain.py"
DEFAULT_BASE_CANDIDATES = ("origin/main", "origin/master", "main", "master")

WORK_ORDER_PREFIX = "docs/work_orders/"
REFERENCE_PREFIX = "docs/reference/"
ARCHIVE_MARKERS = ("/archive/", "\\archive\\")
DATE_RE = re.compile(r"(?:19|20)\d{2}-\d{2}-\d{2}")
STORAGE_BLOCK = "## Foundation Storage Layout Block"

FOUNDATION_WORK_MARKERS = (
    "foundation",
    "durable governance",
    "central core",
    "local view",
    "docs/reference/",
    "work_order_template",
    "addendum",
    "template",
    "standard",
)

FOUNDATION_ACTION_MARKERS = (
    "refactor",
    "split",
    "relocate",
    "move",
    "create folder",
    "new folder",
    "folder index",
    "front door",
    "storage layout",
    "stable path",
    "date policy",
)

NA_LINE_RE = re.compile(r"(?im)^\s*[-|].{0,40}N/A\s+with\s+reason\b")
INLINE_CODE_RE = re.compile(r"`[^`\n]+`")


def _is_in_code_fence(lines: list[str], target_idx: int) -> bool:
    """Return True if the line at target_idx is inside a markdown code fence."""
    fence_count = 0
    for i, line in enumerate(lines):
        stripped = line.strip()
        if stripped.startswith("```") or stripped.startswith("~~~"):
            fence_count += 1
        if i == target_idx:
            break
    return (fence_count % 2) == 1


def _strip_non_signal_text(text: str) -> str:
    """Remove code fences, inline-code/cited-filename spans, and
    N/A-with-reason lines before bare-word marker matching, so incidental
    words in cited filenames or template row labels do not count as real
    foundation-work signal."""
    lines = text.splitlines()
    kept: list[str] = []
    for idx, line in enumerate(lines):
        if _is_in_code_fence(lines, idx):
            continue
        if NA_LINE_RE.match(line):
            continue
        kept.append(INLINE_CODE_RE.sub(" ", line))
    return "\n".join(kept)


def _run_git(args: list[str]) -> tuple[int, str, str]:
    proc = subprocess.run(
        ["git", *args],
        cwd=REPO_ROOT,
        text=True,
        encoding="utf-8",
        errors="replace",
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


def _add(violations: list[dict[str, str]], path: str, issue_type: str, message: str) -> None:
    violations.append({"path": path, "type": issue_type, "message": message})


def _is_archive_path(path: str) -> bool:
    lowered = path.lower()
    return any(marker in lowered for marker in ARCHIVE_MARKERS)


def _is_deleted(statuses: list[str]) -> bool:
    return bool(statuses) and all(status.startswith("D") for status in statuses)


def _is_reference_family_file(path: str) -> bool:
    if not path.startswith(REFERENCE_PREFIX) or _is_archive_path(path) or not path.endswith(".md"):
        return False
    rel = path[len(REFERENCE_PREFIX) :]
    return "/" in rel


def _validate_standard(path: str, text: str) -> list[dict[str, str]]:
    violations: list[dict[str, str]] = []
    required = (
        "Status: ACTIVE_STANDARD",
        "## Work Order Requirement",
        "## Machine Enforcement",
        THIS_SCRIPT_PATH,
        "Foundation Storage Layout Block",
    )
    for marker in required:
        if marker not in text:
            _add(violations, path, "standard_marker_missing", f"missing marker `{marker}`")
    return violations


def _validate_binding(path: str, text: str) -> list[dict[str, str]]:
    violations: list[dict[str, str]] = []
    if path == AUTORUN_PATH and not has_binding_marker(path, THIS_SCRIPT_PATH, text):
        _add(violations, path, "autorun_binding_missing", f"autorun gate must run `{THIS_SCRIPT_PATH}`")
    if path == HOOK_CHAIN_PATH and not has_binding_marker(path, THIS_SCRIPT_PATH, text):
        _add(violations, path, "hook_binding_missing", f"local hook chain must run `{THIS_SCRIPT_PATH}`")
    return violations


def _validate_reference_family_folder(
    path: str,
    changed_paths: dict[str, list[str]],
    violations: list[dict[str, str]],
) -> None:
    if not _is_reference_family_file(path):
        return
    folder = path.rsplit("/", 1)[0]
    readme = f"{folder}/README.md"
    if not (REPO_ROOT / readme).exists() and readme not in changed_paths:
        _add(
            violations,
            path,
            "foundation_folder_readme_missing",
            "stable docs/reference family folders must include a README.md front door",
        )
    filename = path.rsplit("/", 1)[1]
    if filename != "README.md" and DATE_RE.search(filename):
        _add(
            violations,
            path,
            "dated_stable_foundation_file",
            "stable docs/reference family files must not use dated duplicate filenames; use git history plus completion evidence",
        )


def _work_order_needs_storage_block(text: str) -> bool:
    lowered = _strip_non_signal_text(text).lower()
    has_foundation_subject = any(marker in lowered for marker in FOUNDATION_WORK_MARKERS)
    has_action = any(marker in lowered for marker in FOUNDATION_ACTION_MARKERS)
    return has_foundation_subject and has_action


def _validate_work_order(path: str, text: str) -> list[dict[str, str]]:
    violations: list[dict[str, str]] = []
    if not path.startswith(WORK_ORDER_PREFIX) or not path.endswith(".md") or _is_archive_path(path):
        return violations
    if _work_order_needs_storage_block(text) and STORAGE_BLOCK not in text:
        _add(
            violations,
            path,
            "foundation_storage_layout_block_missing",
            "work orders that create, split, relocate, or refactor durable governance foundation files must include `## Foundation Storage Layout Block`",
        )
    return violations


def _validate_path_with_text(path: str, text: str) -> list[dict[str, str]]:
    violations: list[dict[str, str]] = []
    if path == STANDARD_PATH:
        violations.extend(_validate_standard(path, text))
    if path in {AUTORUN_PATH, HOOK_CHAIN_PATH}:
        violations.extend(_validate_binding(path, text))
    violations.extend(_validate_work_order(path, text))
    return violations


def _validate_changed(changed_paths: dict[str, list[str]]) -> list[dict[str, str]]:
    paths_to_check = set(changed_paths)
    for path in (STANDARD_PATH, README_PATH, AUTORUN_PATH, HOOK_CHAIN_PATH):
        if (REPO_ROOT / path).exists():
            paths_to_check.add(path)

    violations: list[dict[str, str]] = []
    for path in sorted(paths_to_check):
        statuses = changed_paths.get(path, [])
        if _is_deleted(statuses):
            continue
        full = REPO_ROOT / path
        if not full.exists() or not path.endswith(".md") and path not in {AUTORUN_PATH, HOOK_CHAIN_PATH}:
            continue
        if _is_reference_family_file(path):
            _validate_reference_family_folder(path, changed_paths, violations)
        violations.extend(_validate_path_with_text(path, _read_rel(path)))
    return violations


def _build_report(base: str | None, head: str | None) -> dict[str, Any]:
    resolved_base, resolved_head, base_source = _resolve_range(base, head)
    range_changed = _get_changed_name_status(resolved_base, resolved_head)
    worktree_changed = _get_worktree_name_status()
    changed_paths = _merge_changed_maps(range_changed, worktree_changed)
    violations = _validate_changed(changed_paths)
    return {
        "base": resolved_base,
        "head": resolved_head,
        "baseSource": base_source,
        "changedPaths": changed_paths,
        "violations": violations,
        "compliant": not violations,
    }


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="Enforce CVF foundation storage layout")
    parser.add_argument("--base", default=None)
    parser.add_argument("--head", default="HEAD")
    parser.add_argument("--json", action="store_true")
    parser.add_argument("--enforce", action="store_true")
    args = parser.parse_args(argv)

    report = _build_report(args.base, args.head)
    if args.json:
        print(json.dumps(report, indent=2, sort_keys=True))
    else:
        print("=== CVF Foundation Storage Layout Gate ===")
        print(f"Base: {report['base']} ({report['baseSource']})")
        print(f"Head: {report['head']}")
        print(f"Changed paths checked: {len(report['changedPaths'])}")
        if report["violations"]:
            print("\nViolations:")
            for issue in report["violations"]:
                print(f"- {issue['path']}: {issue['type']} - {issue['message']}")
            print("\nVIOLATION - repair foundation storage/index layout before proceeding.")
        else:
            print("\nCOMPLIANT - foundation storage layout gate is satisfied.")
    return 1 if args.enforce and report["violations"] else 0


if __name__ == "__main__":
    raise SystemExit(main())
