#!/usr/bin/env python3
"""
CVF Dispatch Prompt Envelope Checker

Validates that dispatch-ready CVF work orders include a Dispatch Prompt
Envelope section with all required fields, or an explicit N/A with reason.

Standard: docs/reference/CVF_AGENT_DISPATCH_PROMPT_ENVELOPE_STANDARD_2026-06-15.md

A dispatch-ready work order that lacks a ## Dispatch Prompt Envelope section
with required fields, or an explicit N/A with reason, fails this gate and
must remain in HOLD or DRAFT until corrected.

Exit codes:
  0  all checked work orders are compliant (or no dispatch-ready work orders
     were changed)
  1  one or more dispatch-ready work orders fail the envelope check

Usage:
  python governance/compat/check_dispatch_prompt_envelope.py
  python governance/compat/check_dispatch_prompt_envelope.py --base <SHA> --head HEAD
  python governance/compat/check_dispatch_prompt_envelope.py --base <SHA> --head HEAD --enforce
"""

from __future__ import annotations

import argparse
import os
import re
import subprocess
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]
STANDARD_PATH = (
    "docs/reference/CVF_AGENT_DISPATCH_PROMPT_ENVELOPE_STANDARD_2026-06-15.md"
)
ENVELOPE_SECTION_MARKER = "## Dispatch Prompt Envelope"
MISSION_SECTION_PATTERN = re.compile(r"^##\s+(?:1\.\s+)?Mission\s*$", re.MULTILINE)
PURPOSE_SECTION_PATTERN = re.compile(r"^##\s+Purpose\s*$", re.MULTILINE)
FIRST_SECTION_PATTERN = re.compile(r"^##\s+.+$", re.MULTILINE)
READ_FIRST_MAX_LINE = 25
# NA_STANDALONE_PATTERN matches N/A with reason only when it appears as a
# standalone declaration at the start of the section (possibly preceded by
# whitespace or a bullet), NOT when it appears as a value inside a field line
# (e.g. "Current-time notes: N/A with reason: ...").
# We recognize standalone N/A when the phrase appears on a line that does NOT
# begin with a recognized field keyword followed by a colon.
FIELD_LINE_PATTERN = re.compile(
    r"^(?:Role|Canonical packet|Commit mode|executionBaseHead|Current-time notes"
    r"|Do-not-misread notes|Required first actions|Return contract)\s*:",
    re.IGNORECASE,
)
NA_WITH_REASON_PATTERN = re.compile(r"\bN/A\s+with\s+reason\b", re.IGNORECASE)

# Required envelope fields. Each entry is (field_label, aliases).
# A field is satisfied when any alias appears inside the envelope section
# (case-insensitive substring match).
REQUIRED_FIELDS: list[tuple[str, tuple[str, ...]]] = [
    ("Role", ("Role:",)),
    ("Canonical packet", ("Canonical packet:",)),
    ("Commit mode", ("Commit mode:",)),
    ("executionBaseHead", ("executionBaseHead", "execution base head")),
    ("Current-time notes", ("Current-time notes:",)),
    ("Do-not-misread notes", ("Do-not-misread notes:",)),
    ("Required first actions", ("Required first actions:",)),
    ("Return contract", ("Return contract:",)),
]

# Prohibited content patterns applied to the envelope section body.
# Each tuple is (compiled_pattern, violation_message).
PROHIBITED_PATTERNS: list[tuple[re.Pattern[str], str]] = [
    (
        re.compile(
            r"adds?\s+(?:new\s+)?scope|expands?\s+scope|broaden(?:s|ing)?\s+scope",
            re.IGNORECASE,
        ),
        "envelope must not add or expand scope",
    ),
]

READINESS_CLAIM_PATTERN = re.compile(
    r"production[- ]ready|public[- ]ready|hosted[- ]ready|live[- ]proven"
    r"|production readiness|public readiness|hosted freshness|live governance proof",
    re.IGNORECASE,
)

READINESS_NEGATION_PATTERN = re.compile(
    r"\b(?:no|not|do not|must not|without|never)\b|not claimed|not claim"
    r"|do-not-misread|forbidden",
    re.IGNORECASE,
)

DEFAULT_BASE_CANDIDATES = ("origin/main", "origin/master", "main", "master")


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


def _get_changed_work_orders(base: str, head: str) -> list[str]:
    """Return repo-relative paths of changed docs/work_orders/*.md files."""
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
                path = path.replace("\\", "/").strip()
                if path.startswith("docs/work_orders/") and path.endswith(".md"):
                    changed.append(path)

    for args in (["diff", "--name-status"], ["diff", "--name-status", "--cached"]):
        code, out, _ = _run_git(args)
        if code == 0 and out:
            for line in out.splitlines():
                parts = line.split("\t")
                if len(parts) < 2:
                    continue
                status = parts[0].strip()
                path = parts[2] if status.startswith(("R", "C")) and len(parts) > 2 else parts[1]
                path = path.replace("\\", "/").strip()
                if path.startswith("docs/work_orders/") and path.endswith(".md") and path not in changed:
                    changed.append(path)

    code, out, _ = _run_git(["ls-files", "--others", "--exclude-standard"])
    if code == 0 and out:
        for line in out.splitlines():
            path = line.replace("\\", "/").strip()
            if path.startswith("docs/work_orders/") and path.endswith(".md") and path not in changed:
                changed.append(path)

    return changed


def _read_file(path: str) -> str:
    full = REPO_ROOT / path
    if not full.is_file():
        return ""
    try:
        return full.read_text(encoding="utf-8", errors="replace")
    except OSError:
        return ""


def _is_dispatch_ready(text: str) -> bool:
    """Return True if the work order's Status marks it as dispatch-ready."""
    match = re.search(r"^Status:\s*(.+?)\s*$", text, re.MULTILINE | re.IGNORECASE)
    if not match:
        return False
    status = match.group(1).upper()
    return bool(re.search(r"\b(DISPATCH(?:ED|_READY)?|DISPATCHED_TO_WORKER|READY)\b", status))


def _extract_envelope_section(text: str) -> str:
    """Return the body of ## Dispatch Prompt Envelope, up to the next ## section."""
    if ENVELOPE_SECTION_MARKER not in text:
        return ""
    after = text.split(ENVELOPE_SECTION_MARKER, 1)[1]
    lines: list[str] = []
    for line in after.splitlines():
        if line.startswith("## ") and lines:
            break
        lines.append(line)
    return "\n".join(lines)


def _check_read_first_placement(text: str) -> list[str]:
    """Return placement issues for the dispatch prompt envelope section."""
    issues: list[str] = []
    marker_index = text.find(ENVELOPE_SECTION_MARKER)
    if marker_index < 0:
        return issues

    marker_line = text[:marker_index].count("\n") + 1
    if marker_line > READ_FIRST_MAX_LINE:
        issues.append(
            f"`{ENVELOPE_SECTION_MARKER}` must be read-first near the top of "
            f"the work order (line {marker_line}, max {READ_FIRST_MAX_LINE})"
        )

    first_section_match = FIRST_SECTION_PATTERN.search(text)
    if first_section_match and first_section_match.group(0).strip() != ENVELOPE_SECTION_MARKER:
        issues.append(
            f"`{ENVELOPE_SECTION_MARKER}` must be the first `##` section in "
            "delegated dispatch-ready work orders"
        )

    purpose_match = PURPOSE_SECTION_PATTERN.search(text)
    if purpose_match and marker_index > purpose_match.start():
        issues.append(
            f"`{ENVELOPE_SECTION_MARKER}` must appear before `## Purpose` in "
            "delegated dispatch-ready work orders"
        )

    mission_match = MISSION_SECTION_PATTERN.search(text)
    if mission_match and marker_index > mission_match.start():
        issues.append(
            f"`{ENVELOPE_SECTION_MARKER}` must appear before `## 1. Mission` "
            "or `## Mission` in delegated dispatch-ready work orders"
        )

    return issues


def _is_na_section(section_text: str) -> bool:
    """Return True if the section declares a standalone N/A with reason.

    A standalone N/A is one that appears on a line that is NOT a field value
    (i.e., not "Field label: N/A with reason: ..."). If every N/A reference
    is embedded in a field value, the section is not treated as N/A-exempt.
    """
    for line in section_text.splitlines():
        stripped = line.strip()
        if stripped.startswith(("-", "*")):
            stripped = stripped[1:].strip()
        if not NA_WITH_REASON_PATTERN.search(stripped):
            continue
        if FIELD_LINE_PATTERN.match(stripped):
            continue
        return True
    return False


def _check_required_fields(section_text: str) -> list[str]:
    """Return list of missing required field labels."""
    lower = section_text.lower()
    missing: list[str] = []
    for label, aliases in REQUIRED_FIELDS:
        found = any(alias.lower() in lower for alias in aliases)
        if not found:
            missing.append(label)
    return missing


def _check_prohibited_content(section_text: str) -> list[str]:
    """Return list of prohibition violation messages."""
    violations: list[str] = []
    for pattern, message in PROHIBITED_PATTERNS:
        if pattern.search(section_text):
            violations.append(message)

    for line in section_text.splitlines():
        if not READINESS_CLAIM_PATTERN.search(line):
            continue
        if READINESS_NEGATION_PATTERN.search(line):
            continue
        violations.append(
            "envelope must not claim live-proven/production/public/hosted readiness"
        )
        break

    return violations


def check_work_order(path: str, text: str) -> list[str]:
    """
    Check a single work order for dispatch prompt envelope compliance.
    Returns a list of violation strings (empty = compliant).
    """
    issues: list[str] = []

    if not _is_dispatch_ready(text):
        return []

    if ENVELOPE_SECTION_MARKER not in text:
        issues.append(
            f"{path}: missing `{ENVELOPE_SECTION_MARKER}` section; "
            "add the envelope or explicit `N/A with reason`"
        )
        return issues

    placement_issues = _check_read_first_placement(text)
    for msg in placement_issues:
        issues.append(f"{path}: {msg}")

    section = _extract_envelope_section(text)

    if _is_na_section(section):
        # N/A with reason satisfies the requirement.
        return []

    # Check required fields are present.
    missing = _check_required_fields(section)
    if missing:
        issues.append(
            f"{path}: {ENVELOPE_SECTION_MARKER} is missing required field(s): "
            + ", ".join(missing)
            + "; add the field(s) or record `N/A with reason` for each"
        )

    # Check for prohibited content.
    prohibited = _check_prohibited_content(section)
    for msg in prohibited:
        issues.append(f"{path}: {ENVELOPE_SECTION_MARKER} violation -- {msg}")

    return issues


def main() -> int:
    parser = argparse.ArgumentParser(
        description="CVF Dispatch Prompt Envelope Gate -- validate dispatch-ready work orders."
    )
    parser.add_argument(
        "--base",
        default=None,
        help="Base commit ref for changed-file range (default: auto-discover).",
    )
    parser.add_argument(
        "--head",
        default="HEAD",
        help="Head commit ref (default: HEAD).",
    )
    parser.add_argument(
        "--enforce",
        action="store_true",
        help="Exit 1 on any violation. Without this flag the checker is advisory.",
    )
    args = parser.parse_args()

    resolved_head = args.head or "HEAD"
    resolved_base = args.base or _discover_default_base(resolved_head)

    print("=== CVF Dispatch Prompt Envelope Gate ===")
    print(f"Standard: {STANDARD_PATH}")
    print(f"Range: {resolved_base}..{resolved_head}")

    work_orders = _get_changed_work_orders(resolved_base, resolved_head)
    print(f"Changed work orders found: {len(work_orders)}")

    all_issues: list[str] = []
    checked = 0
    for path in work_orders:
        text = _read_file(path)
        if not text:
            continue
        checked += 1
        issues = check_work_order(path, text)
        all_issues.extend(issues)

    print(f"Dispatch-ready work orders checked: {checked}")
    print(f"Violations: {len(all_issues)}")

    if all_issues:
        print("\nViolations:")
        for issue in all_issues:
            print(f"  - {issue}")
        print(
            "\nAction: add a `## Dispatch Prompt Envelope` section with required fields "
            "or explicit `N/A with reason` before setting Status to DISPATCH_READY."
        )
        if args.enforce:
            return 1
        print("(Advisory mode: exiting 0. Add --enforce for CI / hook integration.)")
        return 0

    print(
        "\nCOMPLIANT - all changed dispatch-ready work orders carry a valid "
        "Dispatch Prompt Envelope or N/A with reason."
    )
    return 0


if __name__ == "__main__":
    sys.exit(main())
