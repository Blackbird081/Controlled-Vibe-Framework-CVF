#!/usr/bin/env python3
"""CVF Dispatch Scaffold Provenance Checker.

Range-aware checker that fails changed dispatch-ready baselines/work orders
missing the `Scaffold Provenance Block`, missing required fields, retaining
placeholder values, or claiming provenance without a helper command or
manual-edit disposition.

Standard: docs/reference/work_order_authoring/CVF_DISPATCH_SCAFFOLD_PROVENANCE_STANDARD.md
"""

from __future__ import annotations

import argparse
import re
import subprocess
import sys
from dataclasses import dataclass
from pathlib import Path


REPO_ROOT = Path(__file__).resolve().parents[2]

REQUIRED_HEADING = "## Scaffold Provenance Block"
REQUIRED_FIELDS = (
    "scaffoldHelperCommand",
    "generatedProfile",
    "generatedSkeletonStatus",
    "manualEditsAfterScaffold",
    "checkerReadAheadConfirmation",
    "docOnlyNewFields",
    "claimBoundary",
)
APPLICABLE_PREFIXES = (
    "docs/baselines/",
    "docs/work_orders/",
)
ARCHIVE_MARKER = "/archive/"
DISPATCH_STATUS_MARKERS = (
    "Status: DISPATCH_READY",
    "Status: DISPATCHED",
)
VALID_SKELETON_STATUSES = (
    "USED_AS_STARTING_POINT",
    "GENERATED_BUT_REPLACED",
    "NOT_USED_WITH_REASON",
)
PLACEHOLDER_TOKENS = ("FILL_ME", "WORKER_MUST_CAPTURE_AT_START")
HELPER_CMD_RE = re.compile(r"build_dispatch_packet_scaffold\.py")
CODE_FENCE_RE = re.compile(r"```[\s\S]*?```", re.DOTALL)


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


def _is_dispatch_ready(text: str) -> bool:
    return any(marker in text for marker in DISPATCH_STATUS_MARKERS)


def _read_text(path: str) -> str:
    full = REPO_ROOT / path
    if not full.is_file():
        return ""
    return full.read_text(encoding="utf-8", errors="replace")


def _strip_code_fences(text: str) -> str:
    return CODE_FENCE_RE.sub("", text)


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


def _is_placeholder(value: str) -> bool:
    return any(token in value for token in PLACEHOLDER_TOKENS)


def check_text(path: str, text: str) -> list[Violation]:
    violations: list[Violation] = []
    if not _is_dispatch_ready(text):
        return []
    clean_text = _strip_code_fences(text)
    if REQUIRED_HEADING not in clean_text:
        return [
            Violation(
                path,
                "scaffold_provenance_block_missing",
                f"changed dispatch-ready artifact must include `{REQUIRED_HEADING}`",
            )
        ]
    section = _extract_section(clean_text, REQUIRED_HEADING)
    rows = _field_rows(section)
    for field in REQUIRED_FIELDS:
        if field not in rows:
            violations.append(
                Violation(
                    path,
                    "scaffold_provenance_field_missing",
                    f"`{REQUIRED_HEADING}` missing field `{field}`",
                )
            )
    for field in REQUIRED_FIELDS:
        value = rows.get(field, "")
        if field in rows and _is_placeholder(value):
            violations.append(
                Violation(
                    path,
                    "scaffold_provenance_field_placeholder",
                    f"`{REQUIRED_HEADING}` field `{field}` retains placeholder value",
                )
            )
    skeleton_status = rows.get("generatedSkeletonStatus", "")
    if skeleton_status and skeleton_status not in VALID_SKELETON_STATUSES:
        violations.append(
            Violation(
                path,
                "scaffold_provenance_invalid_skeleton_status",
                f"`generatedSkeletonStatus` must be one of {VALID_SKELETON_STATUSES}, got `{skeleton_status}`",
            )
        )
    helper_cmd = rows.get("scaffoldHelperCommand", "")
    if helper_cmd and not HELPER_CMD_RE.search(helper_cmd):
        violations.append(
            Violation(
                path,
                "scaffold_provenance_no_helper_command",
                "`scaffoldHelperCommand` must reference `build_dispatch_packet_scaffold.py`",
            )
        )
    return violations


def check_path(path: str) -> list[Violation]:
    if not _is_applicable_path(path):
        return []
    text = _read_text(path)
    if not _is_dispatch_ready(text):
        return []
    return check_text(path, text)


def main() -> int:
    _configure_stdout()
    parser = argparse.ArgumentParser(description="Check dispatch scaffold provenance blocks.")
    parser.add_argument("--base", default="HEAD")
    parser.add_argument("--head", default="HEAD")
    parser.add_argument("--enforce", action="store_true")
    args = parser.parse_args()

    all_paths = changed_paths(args.base, args.head)
    paths = tuple(path for path in all_paths if _is_applicable_path(path))
    violations: list[Violation] = []
    for path in paths:
        violations.extend(check_path(path))

    print("=== CVF Dispatch Scaffold Provenance Checker ===")
    print(f"Range: {args.base}..{args.head}")
    print(f"Checked dispatch artifacts: {len(paths)}")
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
        print("\nCOMPLIANT - dispatch scaffold provenance blocks are present and reviewable.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
