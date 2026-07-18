#!/usr/bin/env python3
"""CVF Governed Artifact Checker Read-Ahead Guard.

Requires changed governed execution artifacts to record the checker source
surfaces and literal tokens reviewed before authoring. The guard cannot prove
temporal order; it enforces a durable packet field that prevents hidden
"write first, discover checker constants later" closure churn.
"""

from __future__ import annotations

import argparse
import re
import subprocess
import sys
from dataclasses import dataclass
from pathlib import Path


REPO_ROOT = Path(__file__).resolve().parents[2]

REQUIRED_HEADING = "## Checker Source Read-Ahead Block"
REQUIRED_FIELDS = (
    "applicableCheckersRead",
    "literalTokensReviewed",
    "gateRunPurpose",
    "claimBoundary",
)
APPLICABLE_PREFIXES = (
    "docs/baselines/",
    "docs/work_orders/",
    "docs/reviews/",
    "docs/roadmaps/",
)
ARCHIVE_MARKER = "/archive/"
CHECKER_PATH_RE = re.compile(r"governance/compat/check_[A-Za-z0-9_]+\.py")
EMPTY_VALUE_TOKENS = {
    "",
    "none",
    "n/a",
    "not_applicable",
    "not_applicable_with_reason",
}
CONFIRMATION_TOKENS = (
    "confirm",
    "confirmation",
    "evidence",
    "not first discovery",
    "not discovery",
)


@dataclass(frozen=True)
class Violation:
    path: str
    code: str
    message: str


def _configure_stdout() -> None:
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    if hasattr(sys.stderr, "reconfigure"):
        sys.stderr.reconfigure(encoding="utf-8", errors="replace")


def _run_git(args: tuple[str, ...], *, check: bool = False) -> str:
    proc = subprocess.run(
        ["git", *args],
        cwd=REPO_ROOT,
        text=True,
        encoding="utf-8",
        errors="replace",
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
    )
    if check and proc.returncode != 0:
        raise RuntimeError(proc.stderr.strip() or proc.stdout.strip())
    return proc.stdout.strip()


def _status_paths() -> tuple[str, ...]:
    output = _run_git(("status", "--short"))
    paths: set[str] = set()
    for line in output.splitlines():
        if not line.strip():
            continue
        path = line[3:].strip() if len(line) > 2 and line[2] == " " else line[2:].strip()
        if " -> " in path:
            path = path.split(" -> ", 1)[1]
        paths.add(path.replace("\\", "/"))
    return tuple(sorted(paths))


def _range_paths(base: str, head: str) -> tuple[str, ...]:
    output = _run_git(("diff", "--name-only", f"{base}..{head}"))
    return tuple(sorted(path.replace("\\", "/") for path in output.splitlines() if path.strip()))


def changed_paths(base: str, head: str) -> tuple[str, ...]:
    paths = set(_range_paths(base, head))
    paths.update(_status_paths())
    return tuple(sorted(paths))


def _is_applicable_path(path: str) -> bool:
    normalized = path.replace("\\", "/")
    return (
        normalized.endswith(".md")
        and normalized.startswith(APPLICABLE_PREFIXES)
        and ARCHIVE_MARKER not in normalized
    )


def _read_text(path: str) -> str:
    full = REPO_ROOT / path
    if not full.is_file():
        return ""
    return full.read_text(encoding="utf-8", errors="replace")


def _extract_section(text: str, heading: str) -> str:
    pattern = re.compile(
        rf"^{re.escape(heading)}\s*$([\s\S]*?)(?=^##\s+|\Z)",
        re.MULTILINE,
    )
    match = pattern.search(text)
    return match.group(1).strip() if match else ""


def _field_rows(section: str) -> dict[str, str]:
    rows: dict[str, str] = {}
    for line in section.splitlines():
        stripped = line.strip()
        if not stripped.startswith("|"):
            continue
        cells = [cell.strip().strip("`") for cell in stripped.strip("|").split("|")]
        if cells and all(set(cell.replace(":", "").strip()) <= {"-"} for cell in cells if cell):
            continue
        if len(cells) < 2 or cells[0].lower() == "field":
            continue
        rows[cells[0]] = cells[1]
    return rows


def _is_empty_like(value: str) -> bool:
    normalized = value.strip().strip("`").lower()
    return normalized in EMPTY_VALUE_TOKENS or normalized.startswith("n/a with reason")


def check_text(path: str, text: str) -> list[Violation]:
    violations: list[Violation] = []
    if REQUIRED_HEADING not in text:
        return [
            Violation(
                path,
                "checker_read_ahead_block_missing",
                f"changed governed artifact must include `{REQUIRED_HEADING}`",
            )
        ]
    section = _extract_section(text, REQUIRED_HEADING)
    rows = _field_rows(section)
    for field in REQUIRED_FIELDS:
        if field not in rows:
            violations.append(
                Violation(
                    path,
                    "checker_read_ahead_field_missing",
                    f"`{REQUIRED_HEADING}` missing field `{field}`",
                )
            )
    checker_value = rows.get("applicableCheckersRead", "")
    checker_paths = tuple(dict.fromkeys(CHECKER_PATH_RE.findall(checker_value)))
    if not checker_paths:
        violations.append(
            Violation(
                path,
                "checker_read_ahead_no_checker_path",
                "`applicableCheckersRead` must name at least one `governance/compat/check_*.py` path",
            )
        )
    for checker_path in checker_paths:
        if not (REPO_ROOT / checker_path).is_file():
            violations.append(
                Violation(
                    path,
                    "checker_read_ahead_checker_missing",
                    f"`applicableCheckersRead` cites missing checker `{checker_path}`",
                )
            )
    literal_value = rows.get("literalTokensReviewed", "")
    if _is_empty_like(literal_value):
        violations.append(
            Violation(
                path,
                "checker_read_ahead_tokens_missing",
                "`literalTokensReviewed` must name literal headings, fields, enums, or regex-sensitive tokens reviewed",
            )
        )
    purpose_value = rows.get("gateRunPurpose", "")
    if _is_empty_like(purpose_value):
        violations.append(
            Violation(
                path,
                "checker_read_ahead_purpose_missing",
                "`gateRunPurpose` must state the gate is confirmation/evidence, not first discovery",
            )
        )
    elif not any(token in purpose_value.lower() for token in CONFIRMATION_TOKENS):
        violations.append(
            Violation(
                path,
                "checker_read_ahead_purpose_not_confirmatory",
                "`gateRunPurpose` must explicitly frame gate runs as confirmation/evidence, not first discovery",
            )
        )
    claim_boundary_value = rows.get("claimBoundary", "")
    if _is_empty_like(claim_boundary_value):
        violations.append(
            Violation(
                path,
                "checker_read_ahead_claim_boundary_missing",
                "`claimBoundary` must bound the read-ahead evidence claim",
            )
        )
    return violations


def check_path(path: str) -> list[Violation]:
    if not _is_applicable_path(path):
        return []
    return check_text(path, _read_text(path))


def main() -> int:
    _configure_stdout()
    parser = argparse.ArgumentParser(description="Check governed artifact checker read-ahead blocks.")
    parser.add_argument("--base", default="HEAD")
    parser.add_argument("--head", default="HEAD")
    parser.add_argument("--enforce", action="store_true")
    args = parser.parse_args()

    paths = tuple(path for path in changed_paths(args.base, args.head) if _is_applicable_path(path))
    violations: list[Violation] = []
    for path in paths:
        violations.extend(check_path(path))

    print("=== CVF Governed Artifact Checker Read-Ahead Guard ===")
    print(f"Range: {args.base}..{args.head}")
    print(f"Checked governed artifacts: {len(paths)}")
    print(f"Violations: {len(violations)}")
    if paths:
        print("\nChecked paths:")
        for path in paths:
            print(f"  - {path}")
    if violations:
        print("\nViolations:")
        for violation in violations:
            print(f"  - {violation.path}: {violation.code} - {violation.message}")
        if args.enforce:
            return 1
    if not violations:
        print("\nCOMPLIANT - checker read-ahead blocks are present and reviewable.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
