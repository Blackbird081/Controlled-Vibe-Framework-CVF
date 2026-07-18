#!/usr/bin/env python3
"""
CVF Delta mutating profile boundary guard.

Changed governed Markdown artifacts that define, dispatch, review, or close a
Delta mutating-profile boundary must include a control block that makes fixed
target, approval evidence, caller path input, command authority, receipt chain,
claim boundary, and forbidden expansion explicit.
"""

from __future__ import annotations

import argparse
import os
import re
import subprocess
from pathlib import Path


REPO_ROOT = Path(__file__).resolve().parents[2]

REQUIRED_SECTION = "## Delta Mutating Profile Boundary Control Block"
EXPLICIT_REQUIRED_MARKER = "Delta mutating profile boundary: REQUIRED"
REQUIRED_FIELDS = (
    "profileScope",
    "fixedTargetPolicy",
    "approvalEvidenceSource",
    "callerPathInput",
    "commandAuthority",
    "receiptChain",
    "claimBoundary",
    "forbiddenExpansion",
)
CALLER_PATH_ALLOWED_MARKERS = (
    "NO_CALLER_PATH_INPUT",
    "CALLER_PATH_INPUT_FORBIDDEN",
    "N/A with reason",
)
EMPTY_VALUES = {"", "n/a", "none", "tbd", "todo", "pending"}

DEFAULT_BASE_CANDIDATES = ("origin/main", "origin/master", "main", "master")
GOVERNED_PREFIXES = (
    "docs/reviews/",
    "docs/audits/",
    "docs/work_orders/",
    "docs/baselines/",
    "docs/roadmaps/",
    "docs/reference/",
)
BOUNDARY_PATH_MARKERS = (
    "DELTA_T4",
    "MUTATING_PROFILE",
    "MUTATING-PROFILE",
    "APPROVAL_BACKED_MUTATING",
)
BOUNDARY_TEXT_MARKERS = (
    "delta mutating profile",
    "mutating profile boundary",
    "mutating-profile boundary",
    "approval-backed mutating profile",
    "approval backed mutating profile",
    "approval-backed mutation",
    "approval backed mutation",
    "caller path input",
    "fixed target",
)
SECTION_HEADING_PATTERN = re.compile(
    r"^##\s+Delta Mutating Profile Boundary Control Block\s*$",
    re.MULTILINE,
)
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


def _is_governed_markdown_path(path: str) -> bool:
    normalized = path.replace("\\", "/").strip()
    return (
        normalized.endswith(".md")
        and normalized.startswith(GOVERNED_PREFIXES)
        and "/archive/" not in normalized
    )


def _add_changed_path(changed: list[str], path: str) -> None:
    normalized = path.replace("\\", "/").strip()
    if _is_governed_markdown_path(normalized) and normalized not in changed:
        changed.append(normalized)


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
    if not _is_governed_markdown_path(normalized_path):
        return False
    if EXPLICIT_REQUIRED_MARKER in text:
        return True
    if any(marker in upper_path for marker in BOUNDARY_PATH_MARKERS):
        return True
    lowered = text.casefold()
    return any(marker in lowered for marker in BOUNDARY_TEXT_MARKERS)


def _extract_required_section(text: str) -> str:
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


def _is_separator_row(row: list[str]) -> bool:
    return all(re.fullmatch(r":?-{3,}:?", cell.strip()) for cell in row)


def _field_rows(section: str) -> dict[str, str]:
    field_values: dict[str, str] = {}
    for row in _table_rows(section):
        if len(row) < 2 or _is_separator_row(row):
            continue
        field = _normalize_cell(row[0])
        if field in {"field", "required field"}:
            continue
        value = row[1].strip()
        field_values[field] = value
    return field_values


def _clean_value(value: str) -> str:
    value = value.strip().strip("`").strip()
    return re.sub(r"\s+", " ", value)


def _is_empty_value(value: str) -> bool:
    cleaned = _clean_value(value).casefold()
    if "n/a with reason" in cleaned:
        return False
    return cleaned in EMPTY_VALUES


def _has_allowed_caller_path_marker(value: str) -> bool:
    normalized = _clean_value(value).casefold()
    return any(marker.casefold() in normalized for marker in CALLER_PATH_ALLOWED_MARKERS)


def check_text(path: str, text: str) -> list[str]:
    if not _is_applicable(path, text):
        return []

    violations: list[str] = []
    section = _extract_required_section(text)
    if not section:
        violations.append(f"{path}: missing `{REQUIRED_SECTION}`")
        return violations

    fields = _field_rows(section)
    missing = [
        field for field in REQUIRED_FIELDS if _normalize_cell(field) not in fields
    ]
    if missing:
        violations.append(
            f"{path}: `{REQUIRED_SECTION}` missing rows: {', '.join(missing)}"
        )

    for field in REQUIRED_FIELDS:
        normalized = _normalize_cell(field)
        value = fields.get(normalized, "")
        if _is_empty_value(value):
            violations.append(
                f"{path}: `{REQUIRED_SECTION}` row `{field}` must be non-empty"
            )

    caller_path = fields.get(_normalize_cell("callerPathInput"), "")
    if caller_path and not _has_allowed_caller_path_marker(caller_path):
        violations.append(
            f"{path}: `callerPathInput` must contain `NO_CALLER_PATH_INPUT`, "
            "`CALLER_PATH_INPUT_FORBIDDEN`, or `N/A with reason`"
        )

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
        description="Check Delta mutating-profile artifacts for boundary evidence"
    )
    parser.add_argument("--base", default=None)
    parser.add_argument("--head", default="HEAD")
    parser.add_argument("--enforce", action="store_true")
    args = parser.parse_args()

    base = args.base or _discover_default_base(args.head)
    paths = _get_changed_paths(base, args.head)
    violations = check_paths(paths)

    if violations:
        print("FAIL: Delta mutating profile boundary guard")
        for violation in violations:
            print(f"- {violation}")
        return 1 if args.enforce else 0

    print("PASS: Delta mutating profile boundary guard")
    if paths:
        print(f"Checked {len(paths)} changed governed Markdown file(s).")
    else:
        print("No changed Delta mutating profile boundary files required checking.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
