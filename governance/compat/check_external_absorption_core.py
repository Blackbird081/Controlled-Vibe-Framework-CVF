#!/usr/bin/env python3
"""
CVF External Absorption Core Guard.

Changed governed Markdown artifacts that absorb an external repo or copied
folder must carry the invariant external absorption core block, real corpus
evidence, and owner-surface disposition evidence. This is forward-only and does
not reopen historical artifacts outside the changed set.
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
THIS_SCRIPT_PATH = "governance/compat/check_external_absorption_core.py"

CORE_SECTION = "## External Absorption Core"
CORPUS_SECTION = "## Corpus Completeness And Report Integrity"
INTAKE_SECTION = "## External Knowledge Intake Routing"
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

REQUIRED_FIELDS = (
    "Standard",
    "Input root or repository",
    "Enumeration command",
    "Manifest artifact or inline manifest",
    "Processing ledger artifact or inline ledger",
    "Ledger terminal statuses",
    "Disposition taxonomy",
    "Owner-surface map",
    "Unresolved items",
    "Completion claim boundary",
)

REQUIRED_LEDGER_STATUSES = (
    "READ",
    "ADAPTED",
    "DEFERRED",
    "REJECTED",
    "NO_NEW_VALUE",
    "BLOCKED_UNREADABLE",
)

REQUIRED_DISPOSITIONS = (
    "ABSORB",
    "ADAPT",
    "DEFER",
    "REJECT",
    "BLOCK",
    "NO_NEW_VALUE",
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
    if not _is_governed_markdown(path):
        return False
    if path.replace("\\", "/") == CHAIN_MAP_PATH:
        return False
    if path == STANDARD_PATH:
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
    upper_path = path.replace("\\", "/").upper()
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


def _normalize_cell(cell: str) -> str:
    cell = cell.strip().strip("`").strip()
    return re.sub(r"\s+", " ", cell).casefold()


def _field_rows(section: str) -> dict[str, str]:
    field_values: dict[str, str] = {}
    for row in _table_rows(section):
        if len(row) < 2 or _is_separator_row(row):
            continue
        field = _normalize_cell(row[0])
        if field in {"field", "required field"}:
            continue
        field_values[field] = row[1].strip()
    return field_values


def _clean_value(value: str) -> str:
    return re.sub(r"\s+", " ", value.strip().strip("`").strip())


def _is_empty_or_na(value: str) -> bool:
    cleaned = _clean_value(value).casefold()
    return cleaned in {"", "n/a", "none", "tbd", "todo", "not applicable"}


def _has_any_path_or_inline_table(value: str) -> bool:
    cleaned = _clean_value(value).casefold()
    return (
        "/" in cleaned
        or "\\" in cleaned
        or "inline" in cleaned
        or "table" in cleaned
        or ".md" in cleaned
        or ".json" in cleaned
    )


def _validate_core_section(path: str, section: str) -> list[dict[str, str]]:
    violations: list[dict[str, str]] = []
    fields = _field_rows(section)

    for field in REQUIRED_FIELDS:
        normalized = _normalize_cell(field)
        value = fields.get(normalized, "")
        if _is_empty_or_na(value):
            violations.append({
                "path": path,
                "type": "external_absorption_core_field_missing",
                "message": f"`{CORE_SECTION}` row `{field}` must be present and non-empty",
            })

    standard = fields.get(_normalize_cell("Standard"), "")
    if STANDARD_PATH not in standard:
        violations.append({
            "path": path,
            "type": "external_absorption_core_standard_missing",
            "message": f"`{CORE_SECTION}` must cite `{STANDARD_PATH}`",
        })

    manifest = fields.get(_normalize_cell("Manifest artifact or inline manifest"), "")
    if manifest and not _has_any_path_or_inline_table(manifest):
        violations.append({
            "path": path,
            "type": "external_absorption_core_manifest_not_reviewable",
            "message": "manifest row must cite an artifact path or inline table",
        })

    ledger = fields.get(_normalize_cell("Processing ledger artifact or inline ledger"), "")
    if ledger and not _has_any_path_or_inline_table(ledger):
        violations.append({
            "path": path,
            "type": "external_absorption_core_ledger_not_reviewable",
            "message": "processing ledger row must cite an artifact path or inline table",
        })

    statuses = fields.get(_normalize_cell("Ledger terminal statuses"), "")
    for status in REQUIRED_LEDGER_STATUSES:
        if status not in statuses:
            violations.append({
                "path": path,
                "type": "external_absorption_core_status_missing",
                "message": f"ledger status taxonomy must include `{status}`",
            })

    dispositions = fields.get(_normalize_cell("Disposition taxonomy"), "")
    for disposition in REQUIRED_DISPOSITIONS:
        if disposition not in dispositions:
            violations.append({
                "path": path,
                "type": "external_absorption_core_disposition_missing",
                "message": f"disposition taxonomy must include `{disposition}`",
            })

    owner_map = fields.get(_normalize_cell("Owner-surface map"), "")
    if owner_map and not (
        "/" in owner_map
        or "BLOCKED_SOURCE_NOT_FOUND" in owner_map
        or "inline" in owner_map.casefold()
    ):
        violations.append({
            "path": path,
            "type": "external_absorption_core_owner_surface_missing",
            "message": "owner-surface map must cite a CVF path, inline table, or BLOCKED_SOURCE_NOT_FOUND",
        })

    section_lowered = section.casefold()
    if any(token in section_lowered for token in ("<repo", "<filesystem", "<path", "<bounded", "<cvf", "<0", "todo", "tbd")):
        violations.append({
            "path": path,
            "type": "external_absorption_core_placeholder_residue",
            "message": "`External Absorption Core` contains placeholder residue",
        })

    return violations


def _validate_standard(path: str, text: str) -> list[dict[str, str]]:
    violations: list[dict[str, str]] = []
    required = (
        "Status: ACTIVE_REFERENCE",
        "## Central Core",
        "## Required Artifact Block",
        "## Required Ledger Semantics",
        "## Machine Guard",
        "## External Knowledge Intake Routing",
        THIS_SCRIPT_PATH,
        CHAIN_MAP_PATH,
        CORE_SECTION,
        "Corpus Completeness And Report Integrity",
    )
    for marker in required:
        if marker not in text:
            violations.append({
                "path": path,
                "type": "external_absorption_core_standard_marker_missing",
                "message": f"standard missing marker `{marker}`",
            })
    return violations


def _corpus_verdict(section: str) -> str:
    match = re.search(r"^\s*-\s*Corpus verdict:\s*([A-Z_]+)", section, re.M)
    return match.group(1) if match else ""


def check_text(path: str, text: str) -> list[dict[str, str]]:
    if not _is_applicable(path, text):
        return []
    if path.replace("\\", "/") == STANDARD_PATH:
        return _validate_standard(path, text)

    violations: list[dict[str, str]] = []
    if CORE_SECTION not in text:
        violations.append({
            "path": path,
            "type": "external_absorption_core_section_missing",
            "message": f"external absorption artifact must include `{CORE_SECTION}`",
        })
    else:
        violations.extend(_validate_core_section(path, _extract_section(text, CORE_SECTION)))

    if CORPUS_SECTION not in text:
        violations.append({
            "path": path,
            "type": "external_absorption_core_corpus_missing",
            "message": f"external absorption artifact must include `{CORPUS_SECTION}`",
        })
    else:
        corpus_section = _extract_section(text, CORPUS_SECTION)
        if _corpus_verdict(corpus_section) == "NOT_APPLICABLE_WITH_REASON":
            violations.append({
                "path": path,
                "type": "external_absorption_core_corpus_na_invalid",
                "message": "external absorption cannot use Corpus verdict NOT_APPLICABLE_WITH_REASON",
            })

    if INTAKE_SECTION not in text:
        violations.append({
            "path": path,
            "type": "external_absorption_core_intake_missing",
            "message": f"external absorption artifact must include `{INTAKE_SECTION}`",
        })

    if CHAIN_MAP_PATH not in text:
        violations.append({
            "path": path,
            "type": "external_absorption_core_chain_map_missing",
            "message": f"external absorption artifact must cite `{CHAIN_MAP_PATH}`",
        })

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
    parser = argparse.ArgumentParser(description="CVF External Absorption Core Guard")
    parser.add_argument("--base", default=None)
    parser.add_argument("--head", default=None)
    parser.add_argument("--enforce", action="store_true")
    parser.add_argument("--json", action="store_true")
    args = parser.parse_args()

    result = run_check(args.base, args.head)

    print("=== CVF External Absorption Core Guard ===")
    print(f"Range: {result['base']}..{result['head']} ({result['baseSource']})")
    print(f"Checked artifacts: {len(result['checked'])}")
    print(f"Violations: {len(result['violations'])}")
    if args.json:
        print(json.dumps(result, indent=2))

    if result["violations"]:
        for item in result["violations"]:
            print(f"- {item['path']}: {item['type']} - {item['message']}")
        if args.enforce:
            print("VIOLATION - external absorption core evidence is incomplete.")
            return 1

    print("COMPLIANT - external absorption core evidence is aligned.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
