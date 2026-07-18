#!/usr/bin/env python3
"""CVF Source Intake Decision Packet Preflight Checker.

Checks changed governed Markdown artifacts (docs/baselines/, docs/work_orders/,
docs/reviews/, docs/roadmaps/) that opt in via the applicability marker
`Source intake decision packet: REQUIRED` for the required
`## Source Intake Decision Packet` fields, required co-sections, and the
escalation rule for `OWNER_SURFACE_NOT_FOUND` / `NEW_FINDING` dispositions.

Standard: docs/reference/external_agent_review/CVF_KIOD_R8_SOURCE_INTAKE_DECISION_PACKET_STANDARD.md
"""
from __future__ import annotations

import argparse
import re
import subprocess
import sys
from pathlib import Path
from typing import Any

REPO_ROOT = Path(__file__).resolve().parents[2]

STANDARD_PATH = (
    "docs/reference/external_agent_review/"
    "CVF_KIOD_R8_SOURCE_INTAKE_DECISION_PACKET_STANDARD.md"
)

APPLICABLE_DIRS = (
    "docs/baselines/",
    "docs/work_orders/",
    "docs/reviews/",
    "docs/roadmaps/",
)
ARCHIVE_MARKER = "/archive/"

APPLICABILITY_MARKER = "Source intake decision packet: REQUIRED"
REQUIRED_SECTION = "## Source Intake Decision Packet"

REQUIRED_FIELDS = (
    "Decision packet standard",
    "Input root or repository",
    "Bounded scope",
    "Enumeration authority",
    "Owner-surface taxonomy",
    "Pre-scan packet source",
    "Overlap routing matrix",
    "Negative-search evidence",
    "Core disposition",
    "Value conversion requirement",
    "Overlap classification requirement",
    "Worker output path",
    "Forbidden scope",
    "Claim boundary",
)

REQUIRED_CO_SECTIONS = (
    "## External Knowledge Intake Routing",
    "## External Absorption Core",
    "## External Absorption Value Conversion Matrix",
    "## Overlap And Novelty Classification",
)

ESCALATION_TOKENS = ("OWNER_SURFACE_NOT_FOUND", "NEW_FINDING")
NEGATIVE_SEARCH_HINTS = ("negative-search", "negative search", "search command", "rg ", "grep ")
NEXT_ACTION_HINTS = (
    "next governed action",
    "route to",
    "follow-up work order",
    "follow-up roadmap",
    "kiod-r4",
    "decision packet",
)

EMPTY_VALUE_TOKENS = {"", "n/a", "none", "tbd", "todo"}

SECTION_PATTERN_TEMPLATE = r"^{heading}\s*$([\s\S]*?)(?=^##\s+|\Z)"

# The marker only counts as a real applicability declaration when it appears
# as its own standalone line (optionally bulleted), not when it is quoted
# inside a table cell or backtick-delimited literal-token list elsewhere in
# the document (see CVF_GOVERNED_ARTIFACT_LITERAL_FORMAT_GOTCHAS_2026-06-25.md
# item 5: quoting a real marker inside backticks can false-trigger a bare
# substring match).
STANDALONE_MARKER_PATTERN = re.compile(
    r"^\s*[-*]?\s*" + re.escape(APPLICABILITY_MARKER) + r"\s*$",
    re.MULTILINE,
)


def _has_standalone_marker(text: str) -> bool:
    return bool(STANDALONE_MARKER_PATTERN.search(text))


def _configure_stdout() -> None:
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(errors="replace")
    if hasattr(sys.stderr, "reconfigure"):
        sys.stderr.reconfigure(errors="replace")


def _run_git(args: list[str]) -> str:
    proc = subprocess.run(
        ["git", *args],
        cwd=REPO_ROOT,
        text=True,
        encoding="utf-8",
        errors="replace",
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
    )
    return proc.stdout.strip()


def _get_range_paths(base: str, head: str) -> list[str]:
    out = _run_git(["diff", "--name-only", f"{base}..{head}"])
    return [p.replace("\\", "/") for p in out.splitlines() if p.strip()]


def _get_status_paths() -> list[str]:
    out = _run_git(["status", "--short"])
    paths: list[str] = []
    for line in out.splitlines():
        if not line.strip():
            continue
        raw = line[3:].strip() if len(line) > 2 and line[2] == " " else line[2:].strip()
        if " -> " in raw:
            raw = raw.split(" -> ", 1)[1]
        paths.append(raw.replace("\\", "/"))
    return paths


def _changed_paths(base: str | None, head: str | None) -> list[str]:
    paths: set[str] = set()
    if base and head:
        paths.update(_get_range_paths(base, head))
    paths.update(_get_status_paths())
    return sorted(paths)


def _is_applicable_path(path: str) -> bool:
    norm = path.replace("\\", "/")
    return (
        norm.endswith(".md")
        and ARCHIVE_MARKER not in norm
        and norm.startswith(APPLICABLE_DIRS)
    )


def _read(path: str) -> str:
    full = REPO_ROOT / path
    if not full.is_file():
        return ""
    return full.read_text(encoding="utf-8", errors="replace")


def _extract_section(text: str, heading: str) -> str | None:
    pattern = re.compile(
        SECTION_PATTERN_TEMPLATE.format(heading=re.escape(heading)),
        re.MULTILINE,
    )
    match = pattern.search(text)
    if not match:
        return None
    return match.group(1)


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


def _normalize_cell(cell: str) -> str:
    cell = cell.strip().strip("`").strip()
    return re.sub(r"\s+", " ", cell).casefold()


def _field_rows(section: str) -> dict[str, str]:
    field_values: dict[str, str] = {}
    for row in _table_rows(section):
        if len(row) < 2 or _is_separator_row(row):
            continue
        field = _normalize_cell(row[0])
        if field in {"required field", "field"}:
            continue
        field_values[field] = row[1].strip()
    return field_values


def _clean_value(value: str) -> str:
    return re.sub(r"\s+", " ", value.strip().strip("`").strip())


def check_artifact(path: str) -> list[dict[str, Any]]:
    text = _read(path)
    if not text or not _has_standalone_marker(text):
        return []

    violations: list[dict[str, Any]] = []

    section = _extract_section(text, REQUIRED_SECTION)
    if section is None:
        violations.append({
            "path": path,
            "rule": "SIDP-01",
            "message": f"missing `{REQUIRED_SECTION}` despite applicability marker `{APPLICABILITY_MARKER}`",
        })
        section = ""

    fields = _field_rows(section)
    for field in REQUIRED_FIELDS:
        normalized = _normalize_cell(field)
        value = fields.get(normalized, "")
        if _clean_value(value).casefold() in EMPTY_VALUE_TOKENS:
            violations.append({
                "path": path,
                "rule": "SIDP-02",
                "message": f"`{REQUIRED_SECTION}` row `{field}` must be present and non-empty",
            })

    for co_section in REQUIRED_CO_SECTIONS:
        if co_section not in text:
            violations.append({
                "path": path,
                "rule": "SIDP-03",
                "message": f"missing required co-section `{co_section}`",
            })

    overlap_value = fields.get(_normalize_cell("Overlap routing matrix"), "")
    overlap_section = _extract_section(text, "## Overlap And Novelty Classification") or ""
    escalation_scope = "\n".join((overlap_value, overlap_section))
    triggered = [token for token in ESCALATION_TOKENS if token in escalation_scope]
    if triggered:
        evidence_scope = "\n".join((
            overlap_value,
            overlap_section,
            fields.get(_normalize_cell("Negative-search evidence"), ""),
            fields.get(_normalize_cell("Worker output path"), ""),
        )).lower()
        has_negative_search = any(hint in evidence_scope for hint in NEGATIVE_SEARCH_HINTS)
        has_next_action = any(hint in evidence_scope for hint in NEXT_ACTION_HINTS)
        if not has_negative_search or not has_next_action:
            violations.append({
                "path": path,
                "rule": "SIDP-04",
                "message": (
                    f"escalation token(s) {', '.join(triggered)} present without both "
                    "negative-search evidence and a concrete next governed action"
                ),
            })

    return violations


def _run_check(base: str | None, head: str | None) -> dict[str, Any]:
    paths = _changed_paths(base, head)
    applicable = [p for p in paths if _is_applicable_path(p)]
    all_violations: list[dict[str, Any]] = []
    for path in applicable:
        all_violations.extend(check_artifact(path))
    return {
        "standard": STANDARD_PATH,
        "checkedFileCount": len(applicable),
        "checkedFiles": applicable,
        "violationCount": len(all_violations),
        "violations": all_violations,
        "compliant": not all_violations,
    }


def _print_report(report: dict[str, Any], base: str | None, head: str | None) -> None:
    print("=== CVF Source Intake Decision Packet Preflight Checker ===")
    if base or head:
        print(f"Range: {base or '<worktree>'}..{head or '<worktree>'}")
    print(f"Standard: {report['standard']}")
    print(f"Files checked: {report['checkedFileCount']}")
    print(f"Violations: {report['violationCount']}")
    if report["checkedFiles"]:
        print("\nChecked artifacts:")
        for p in report["checkedFiles"]:
            print(f"  - {p}")
    if report["violations"]:
        print("\nViolations:")
        for v in report["violations"]:
            print(f"  - [{v['rule']}] {v['path']}: {v['message']}")
    if report["compliant"]:
        print("\nCOMPLIANT - source intake decision packet preflight gates satisfied.")
    else:
        print(
            "\nVIOLATION - repair missing decision-packet fields, co-sections, "
            "or escalation evidence before dispatch."
        )


def main() -> int:
    _configure_stdout()
    parser = argparse.ArgumentParser(
        description="Check CVF source intake decision packet preflight"
    )
    parser.add_argument("--base", default=None)
    parser.add_argument("--head", default=None)
    parser.add_argument("--enforce", action="store_true")
    args = parser.parse_args()
    report = _run_check(args.base, args.head)
    _print_report(report, args.base, args.head)
    return 1 if args.enforce and not report["compliant"] else 0


if __name__ == "__main__":
    raise SystemExit(main())
