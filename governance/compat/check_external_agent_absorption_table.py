#!/usr/bin/env python3
"""
CVF external-agent absorption table guard.

Changed external-return absorption reviews must include the Required
Absorption Table defined by the EARC workflow. The guard is range-aware and
forward-only: it checks changed review/audit packets, staged files, and
untracked files, but does not reopen historical artifacts outside the changed
set.
"""

from __future__ import annotations

import argparse
import os
import re
import subprocess
from pathlib import Path


REPO_ROOT = Path(__file__).resolve().parents[2]
STANDARD_PATH = (
    "docs/reference/external_agent_review/"
    "CVF_EXTERNAL_AGENT_FINDING_ABSORPTION_WORKFLOW.md"
)

REQUIRED_SECTION = "## Required Absorption Table"
EXPLICIT_REQUIRED_MARKER = "External absorption review: REQUIRED"
REQUIRED_COLUMNS = (
    "External item ID",
    "External claim summary",
    "Source basis",
    "CVF verification surface",
    "CVF disposition",
    "Owner artifact",
    "Next action",
    "Claim boundary",
)

DEFAULT_BASE_CANDIDATES = ("origin/main", "origin/master", "main", "master")
COMPLETION_PATH_MARKERS = ("_COMPLETION_", "_WORKER_RETURN_")
ABSORPTION_PATH_MARKERS = (
    "EXTERNAL_RETURN_ABSORPTION",
    "EXTERNAL_FINDING_ABSORPTION",
)
COMPLETE_STATUS_PATTERN = re.compile(
    r"^Status:\s*.*(CLOSED|COMPLETE|COMPLETE_PENDING_REVIEW).*$",
    re.IGNORECASE | re.MULTILINE,
)
SECTION_HEADING_PATTERN = re.compile(r"^##\s+Required Absorption Table\s*$", re.MULTILINE)
NEXT_SECTION_PATTERN = re.compile(r"^##\s+.+$", re.MULTILINE)


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


def _discover_default_base(head: str) -> str:
    env_base = os.getenv("CVF_COMPAT_BASE")
    if env_base:
        return env_base
    for ref in DEFAULT_BASE_CANDIDATES:
        if not _ref_exists(ref):
            continue
        code, out, _ = _run_git(["merge-base", ref, head])
        if code == 0 and out:
            return out
    return "HEAD~1"


def _add_changed_path(changed: list[str], path: str) -> None:
    path = path.replace("\\", "/").strip()
    if (
        path.endswith(".md")
        and path.startswith(("docs/reviews/", "docs/audits/"))
        and "/archive/" not in path
        and path not in changed
    ):
        changed.append(path)


def _get_changed_paths(base: str, head: str) -> list[str]:
    changed: list[str] = []

    if base != head:
        code, out, _ = _run_git(["diff", "--name-status", f"{base}..{head}"])
        if code == 0:
            for line in out.splitlines():
                parts = line.split("\t")
                if len(parts) < 2:
                    continue
                status = parts[0].strip()
                path = parts[2] if status.startswith(("R", "C")) and len(parts) > 2 else parts[1]
                _add_changed_path(changed, path)

    for args in (["diff", "--name-status"], ["diff", "--name-status", "--cached"]):
        code, out, _ = _run_git(args)
        if code != 0 or not out:
            continue
        for line in out.splitlines():
            parts = line.split("\t")
            if len(parts) < 2:
                continue
            status = parts[0].strip()
            path = parts[2] if status.startswith(("R", "C")) and len(parts) > 2 else parts[1]
            _add_changed_path(changed, path)

    code, out, _ = _run_git(["ls-files", "--others", "--exclude-standard"])
    if code == 0 and out:
        for line in out.splitlines():
            _add_changed_path(changed, line)

    return changed


def _read_file(path: str) -> str:
    full = REPO_ROOT / path
    if not full.is_file():
        return ""
    return full.read_text(encoding="utf-8", errors="replace")


def _is_applicable(path: str, text: str) -> bool:
    normalized_path = path.replace("\\", "/")
    upper_path = normalized_path.upper()
    if not normalized_path.startswith(("docs/reviews/", "docs/audits/")):
        return False
    if "/archive/" in normalized_path:
        return False
    if EXPLICIT_REQUIRED_MARKER in text:
        return True
    if any(marker in upper_path for marker in COMPLETION_PATH_MARKERS):
        return False
    if not COMPLETE_STATUS_PATTERN.search(text):
        return False
    return any(marker in upper_path for marker in ABSORPTION_PATH_MARKERS)


def _extract_required_table_section(text: str) -> str:
    match = SECTION_HEADING_PATTERN.search(text)
    if not match:
        return ""
    start = match.end()
    next_match = NEXT_SECTION_PATTERN.search(text, start)
    end = next_match.start() if next_match else len(text)
    return text[start:end]


def _normalize_cell(cell: str) -> str:
    cell = cell.strip().strip("`").strip()
    return re.sub(r"\s+", " ", cell).casefold()


def _table_rows(section: str) -> list[list[str]]:
    rows: list[list[str]] = []
    for line in section.splitlines():
        stripped = line.strip()
        if not stripped.startswith("|") or not stripped.endswith("|"):
            continue
        cells = [cell.strip() for cell in stripped.strip("|").split("|")]
        rows.append(cells)
    return rows


def check_text(path: str, text: str) -> list[str]:
    if not _is_applicable(path, text):
        return []

    violations: list[str] = []
    section = _extract_required_table_section(text)
    if not section:
        return [
            f"{path}: missing `{REQUIRED_SECTION}` for external-agent absorption review"
        ]

    rows = _table_rows(section)
    if len(rows) < 3:
        return [f"{path}: `{REQUIRED_SECTION}` must contain a header and data row"]

    header = {_normalize_cell(cell) for cell in rows[0]}
    missing = [
        column for column in REQUIRED_COLUMNS if _normalize_cell(column) not in header
    ]
    if missing:
        violations.append(
            f"{path}: `{REQUIRED_SECTION}` missing columns: {', '.join(missing)}"
        )

    data_rows = rows[2:]
    if not any(any(cell.strip() for cell in row) for row in data_rows):
        violations.append(f"{path}: `{REQUIRED_SECTION}` has no data rows")

    return violations


def check_paths(paths: list[str]) -> list[str]:
    violations: list[str] = []
    for path in paths:
        text = _read_file(path)
        if not text:
            continue
        violations.extend(check_text(path, text))
    return violations


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Check external-agent absorption reviews for Required Absorption Table"
    )
    parser.add_argument("--base", default=None)
    parser.add_argument("--head", default="HEAD")
    parser.add_argument("--enforce", action="store_true")
    args = parser.parse_args()

    base = args.base or _discover_default_base(args.head)
    paths = _get_changed_paths(base, args.head)
    violations = check_paths(paths)

    if violations:
        print("FAIL: external-agent absorption table guard")
        print(f"Standard: {STANDARD_PATH}")
        for violation in violations:
            print(f"- {violation}")
        return 1 if args.enforce else 0

    print("PASS: external-agent absorption table guard")
    if paths:
        print(f"Checked {len(paths)} changed review/audit file(s).")
    else:
        print("No changed external-agent review/audit files required checking.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
