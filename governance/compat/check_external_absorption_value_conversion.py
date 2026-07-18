#!/usr/bin/env python3
"""
CVF External Absorption Value Conversion Guard.

Changed governed Markdown artifacts that absorb an external repo or copied
folder must classify useful knowledge beyond "pattern adapted": doctrine,
package, runtime, checker, rejected direct import, or no package/runtime value.
The guard is forward-only and range-aware.
"""

from __future__ import annotations

import argparse
import json
import os
import re
import subprocess
from pathlib import Path
from typing import Any


REPO_ROOT = Path(__file__).resolve().parents[2]
DEFAULT_BASE_CANDIDATES = ("origin/main", "origin/master", "main", "master")

STANDARD_PATH = "docs/reference/external_agent_review/CVF_EXTERNAL_ABSORPTION_CORE_STANDARD.md"
CHAIN_MAP_PATH = "docs/reference/external_agent_review/CVF_EXTERNAL_KNOWLEDGE_ABSORPTION_CHAIN_MAP.md"
THIS_SCRIPT_PATH = "governance/compat/check_external_absorption_value_conversion.py"
CORE_SCRIPT_PATH = "governance/compat/check_external_absorption_core.py"

CORE_SECTION = "## External Absorption Core"
VALUE_SECTION = "## External Absorption Value Conversion Matrix"
EXPLICIT_REQUIRED_MARKER = "External absorption core: REQUIRED"
ARCHIVE_MARKER = "/archive/"

GOVERNED_PREFIXES = (
    "docs/audits/",
    "docs/baselines/",
    "docs/reference/external_agent_review/",
    "docs/reviews/",
    "docs/roadmaps/",
    "docs/work_orders/",
)

SOURCE_MARKERS = (
    ".private_reference/legacy/",
    ".private_reference/external_repos/",
)

ABSORPTION_TEXT_MARKERS = (
    "external absorption",
    "external repo or copied folder",
    "external repository",
    "copied folder",
    "operator-provided external folder",
    "source-verified absorption",
)

ABSORPTION_PATH_MARKERS = (
    "ABSORPTION",
    "EXTERNAL",
    "REABSORPTION",
)

REQUIRED_COLUMNS = (
    "Source item",
    "Value extracted",
    "Conversion lane",
    "CVF target surface",
    "Next governed action",
    "Runtime/package boundary",
)

REQUIRED_LANES = (
    "DOCTRINE_ADAPTED",
    "PACKAGE_CANDIDATE",
    "RUNTIME_CANDIDATE",
    "CHECKER_CANDIDATE",
    "REJECT_DIRECT_IMPORT",
    "NO_PACKAGE_OR_RUNTIME_VALUE",
)

CANDIDATE_LANES = (
    "PACKAGE_CANDIDATE",
    "RUNTIME_CANDIDATE",
    "CHECKER_CANDIDATE",
)

PLACEHOLDER_TOKENS = (
    "<source",
    "<value",
    "<lane",
    "<cvf",
    "<next",
    "<boundary",
    "todo",
    "tbd",
)


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


def _is_governed_markdown(path: str) -> bool:
    normalized = path.replace("\\", "/")
    return (
        normalized.endswith(".md")
        and ARCHIVE_MARKER not in normalized
        and any(normalized.startswith(prefix) for prefix in GOVERNED_PREFIXES)
    )


def _is_applicable(path: str, text: str) -> bool:
    normalized = path.replace("\\", "/")
    if not _is_governed_markdown(normalized):
        return False
    if normalized == CHAIN_MAP_PATH:
        return False
    if normalized == STANDARD_PATH:
        return True
    if THIS_SCRIPT_PATH in text and "## Core Guard Self-Protection Authorization" in text:
        return False
    if EXPLICIT_REQUIRED_MARKER in text:
        return True
    if any(marker in text for marker in SOURCE_MARKERS):
        return True
    lowered = text.casefold()
    if "github.com/" in lowered and any(
        marker in lowered for marker in ABSORPTION_TEXT_MARKERS
    ):
        return True
    upper_path = normalized.upper()
    return (
        any(marker in upper_path for marker in ABSORPTION_PATH_MARKERS)
        and any(marker in lowered for marker in ABSORPTION_TEXT_MARKERS)
    )


def _extract_section(text: str, header: str) -> str:
    marker = f"{header}\n"
    start = text.find(marker)
    if start == -1:
        return ""
    section_start = start + len(marker)
    next_header = text.find("\n## ", section_start)
    if next_header == -1:
        return text[section_start:]
    return text[section_start:next_header]


def _table_rows(section: str) -> list[list[str]]:
    rows: list[list[str]] = []
    for line in section.splitlines():
        stripped = line.strip()
        if not stripped.startswith("|") or not stripped.endswith("|"):
            continue
        rows.append([cell.strip() for cell in stripped.strip("|").split("|")])
    return rows


def _is_separator_row(row: list[str]) -> bool:
    return all(re.fullmatch(r":?-{3,}:?", cell.strip()) for cell in row)


def _clean(value: str) -> str:
    return re.sub(r"\s+", " ", value.strip().strip("`").strip())


def _is_empty_or_na(value: str) -> bool:
    cleaned = _clean(value).casefold()
    return cleaned in {"", "n/a", "none", "not applicable"}


def _header_map(row: list[str]) -> dict[str, int]:
    return {_clean(cell).casefold(): idx for idx, cell in enumerate(row)}


def _validate_value_section(path: str, section: str) -> list[dict[str, str]]:
    violations: list[dict[str, str]] = []
    rows = [row for row in _table_rows(section) if not _is_separator_row(row)]
    if not rows:
        return [{
            "path": path,
            "type": "external_absorption_value_conversion_table_missing",
            "message": f"`{VALUE_SECTION}` must contain a reviewable table",
        }]

    headers = _header_map(rows[0])
    for column in REQUIRED_COLUMNS:
        if column.casefold() not in headers:
            violations.append({
                "path": path,
                "type": "external_absorption_value_conversion_column_missing",
                "message": f"value conversion matrix missing column `{column}`",
            })
    if violations:
        return violations

    body = rows[1:]
    lane_idx = headers["conversion lane"]
    next_idx = headers["next governed action"]
    boundary_idx = headers["runtime/package boundary"]
    target_idx = headers["cvf target surface"]
    value_idx = headers["value extracted"]

    lane_text = "\n".join(row[lane_idx] for row in body if len(row) > lane_idx)
    for lane in REQUIRED_LANES:
        if lane not in lane_text:
            violations.append({
                "path": path,
                "type": "external_absorption_value_conversion_lane_missing",
                "message": f"value conversion matrix must include lane `{lane}`",
            })

    row_count = 0
    for row in body:
        if len(row) <= max(lane_idx, next_idx, boundary_idx, target_idx, value_idx):
            continue
        lane = row[lane_idx]
        if not lane or lane.casefold() == "conversion lane":
            continue
        row_count += 1
        unknown = [token for token in re.findall(r"\b[A-Z][A-Z0-9_]{3,}\b", lane) if token not in REQUIRED_LANES]
        if unknown:
            violations.append({
                "path": path,
                "type": "external_absorption_value_conversion_lane_unknown",
                "message": f"value conversion lane contains unknown token(s): {', '.join(sorted(set(unknown)))}",
            })
        if any(candidate in lane for candidate in CANDIDATE_LANES):
            if _is_empty_or_na(row[next_idx]):
                violations.append({
                    "path": path,
                    "type": "external_absorption_value_conversion_next_action_missing",
                    "message": f"candidate lane `{lane}` must name the next governed action",
                })
            if _is_empty_or_na(row[boundary_idx]):
                violations.append({
                    "path": path,
                    "type": "external_absorption_value_conversion_boundary_missing",
                    "message": f"candidate lane `{lane}` must state the runtime/package boundary",
                })
            if _is_empty_or_na(row[target_idx]):
                violations.append({
                    "path": path,
                    "type": "external_absorption_value_conversion_target_missing",
                    "message": f"candidate lane `{lane}` must name a CVF target surface or pending owner",
                })
            if _is_empty_or_na(row[value_idx]):
                violations.append({
                    "path": path,
                    "type": "external_absorption_value_conversion_value_missing",
                    "message": f"candidate lane `{lane}` must describe the extracted value",
                })

    if row_count == 0:
        violations.append({
            "path": path,
            "type": "external_absorption_value_conversion_no_rows",
            "message": "value conversion matrix must contain at least one body row",
        })

    lowered = section.casefold()
    for token in PLACEHOLDER_TOKENS:
        if token in lowered:
            violations.append({
                "path": path,
                "type": "external_absorption_value_conversion_placeholder_residue",
                "message": "`External Absorption Value Conversion Matrix` contains placeholder residue",
            })
            break

    return violations


def _validate_standard(path: str, text: str) -> list[dict[str, str]]:
    violations: list[dict[str, str]] = []
    required = (
        "Status: ACTIVE_REFERENCE",
        "## Required Value Conversion Matrix",
        VALUE_SECTION,
        THIS_SCRIPT_PATH,
        CORE_SCRIPT_PATH,
        "PACKAGE_CANDIDATE",
        "RUNTIME_CANDIDATE",
        "CHECKER_CANDIDATE",
        "NO_PACKAGE_OR_RUNTIME_VALUE",
    )
    for marker in required:
        if marker not in text:
            violations.append({
                "path": path,
                "type": "external_absorption_value_conversion_standard_marker_missing",
                "message": f"standard missing marker `{marker}`",
            })
    return violations


def check_text(path: str, text: str) -> list[dict[str, str]]:
    if not _is_applicable(path, text):
        return []
    if path.replace("\\", "/") == STANDARD_PATH:
        return _validate_standard(path, text)

    violations: list[dict[str, str]] = []
    if CORE_SECTION not in text:
        violations.append({
            "path": path,
            "type": "external_absorption_value_conversion_core_missing",
            "message": f"value conversion requires paired `{CORE_SECTION}`",
        })
    if VALUE_SECTION not in text:
        violations.append({
            "path": path,
            "type": "external_absorption_value_conversion_section_missing",
            "message": f"external absorption artifact must include `{VALUE_SECTION}`",
        })
    else:
        violations.extend(_validate_value_section(path, _extract_section(text, VALUE_SECTION)))
    return violations


def run_check(base: str | None = None, head: str | None = None) -> dict[str, Any]:
    resolved_base, resolved_head, base_source = _resolve_range(base, head)
    try:
        committed = _get_changed_name_status(resolved_base, resolved_head)
    except RuntimeError:
        committed = {}
    worktree = _get_worktree_name_status()
    changed = _merge_changed_maps(committed, worktree)

    checked: list[str] = []
    violations: list[dict[str, str]] = []
    for path in sorted(changed):
        if not _is_governed_markdown(path):
            continue
        full = REPO_ROOT / path
        if not full.exists() or full.is_dir():
            continue
        text = _read_rel(path)
        if not _is_applicable(path, text):
            continue
        checked.append(path)
        violations.extend(check_text(path, text))

    return {
        "base": resolved_base,
        "head": resolved_head,
        "baseSource": base_source,
        "checked": checked,
        "violations": violations,
    }


def main() -> int:
    parser = argparse.ArgumentParser(description="CVF External Absorption Value Conversion Guard")
    parser.add_argument("--base", default=None)
    parser.add_argument("--head", default=None)
    parser.add_argument("--enforce", action="store_true")
    parser.add_argument("--json", action="store_true")
    args = parser.parse_args()

    result = run_check(args.base, args.head)

    print("=== CVF External Absorption Value Conversion Guard ===")
    print(f"Range: {result['base']}..{result['head']} ({result['baseSource']})")
    print(f"Checked artifacts: {len(result['checked'])}")
    print(f"Violations: {len(result['violations'])}")
    if args.json:
        print(json.dumps(result, indent=2))

    if result["violations"]:
        for item in result["violations"]:
            print(f"- {item['path']}: {item['type']} - {item['message']}")
        if args.enforce:
            print("VIOLATION - external absorption value conversion evidence is incomplete.")
            return 1

    print("COMPLIANT - external absorption value conversion evidence is aligned.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
