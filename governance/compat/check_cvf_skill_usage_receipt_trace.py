#!/usr/bin/env python3
"""Check CVF ASSF skill usage receipt trace blocks in changed artifacts.

The checker is intentionally narrow. It does not detect every provider-side or
agent-side skill invocation. It requires a trace block when a changed governed
artifact claims CVF-owned ASSF/runtime package use and consumes that result as
CVF work evidence.
"""

from __future__ import annotations

import argparse
import json
import re
import subprocess
import sys
from dataclasses import dataclass
from pathlib import Path
from typing import Any


REPO_ROOT = Path(__file__).resolve().parents[2]
DEFAULT_BASE_CANDIDATES = ("origin/main", "origin/master", "main", "master")

APPLICABLE_PREFIXES = (
    "docs/baselines/",
    "docs/work_orders/",
    "docs/reviews/",
    "docs/reference/",
    "docs/roadmaps/",
    "AGENT_HANDOFF",
)

ARCHIVE_MARKER = "/archive/"
TRACE_HEADING = "## CVF Skill Usage Receipt Trace"
NEXT_HEADING_RE = re.compile(r"^##\s+", re.MULTILINE)

USAGE_PATTERNS = (
    re.compile(
        r"\b(?:used|invoked|called|ran|executed|loaded|opened)\b.{0,90}"
        r"\b(?:CVF\s+skill|CVF-owned\s+skill|ASSF\s+skill|"
        r"ASSF\s+runtime\s+package|runtime\s+package\s+body|"
        r"CVF\s+runtime\s+package|package\s+SKILL\.md)\b",
        re.IGNORECASE,
    ),
    re.compile(
        r"\b(?:cvfSkillUsed|assfSkillUsed|cvfRuntimePackageUsed)\s*[:=]\s*"
        r"(?:true|yes|USED_WITH_RECEIPT)\b",
        re.IGNORECASE,
    ),
    re.compile(
        r"\b(?:CVF skill used|ASSF skill used|Runtime package used)\s*:\s*\S+",
        re.IGNORECASE,
    ),
)

GUARDRAIL_MARKERS = (
    "must",
    "should",
    "when ",
    "if ",
    "do not",
    "does not",
    "must not",
    "no cvf skill",
    "not used",
    "not use",
    "without",
    "forbid",
    "guard",
    "checker",
    "trigger",
    "example",
    "template",
)

REQUIRED_ROWS = (
    "Usage disposition",
    "CVF skill id",
    "Package root",
    "Invocation context",
    "Receipt evidence",
    "Output consumed by CVF",
    "Truth packet or source path",
    "Authority boundary",
)

USED_TOKEN = "USED_WITH_RECEIPT"
NOT_USED_TOKEN = "NOT_USED_WITH_REASON"


@dataclass(frozen=True)
class Violation:
    path: str
    message: str


def _run_git(args: list[str]) -> tuple[int, str, str]:
    try:
        completed = subprocess.run(
            ["git", *args],
            cwd=REPO_ROOT,
            check=False,
            text=True,
            encoding="utf-8",
            errors="replace",
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
        )
    except FileNotFoundError:
        return 127, "", "git not found"
    return completed.returncode, completed.stdout or "", completed.stderr or ""


def _default_base() -> str:
    for candidate in DEFAULT_BASE_CANDIDATES:
        code, _, _ = _run_git(["rev-parse", "--verify", candidate])
        if code == 0:
            return candidate
    return "HEAD"


def changed_files(base: str, head: str) -> list[str]:
    code, stdout, stderr = _run_git(
        ["diff", "--name-only", "--diff-filter=ACMR", base, head]
    )
    if code != 0:
        raise RuntimeError(stderr.strip() or f"git diff failed for {base}..{head}")
    return [line.strip().replace("\\", "/") for line in stdout.splitlines() if line.strip()]


def is_applicable_path(path: str) -> bool:
    normalized = path.replace("\\", "/")
    if ARCHIVE_MARKER in normalized:
        return False
    if not normalized.endswith(".md"):
        return False
    return normalized.startswith(APPLICABLE_PREFIXES)


def _is_guardrail_line(line: str) -> bool:
    lowered = line.lower()
    return any(marker in lowered for marker in GUARDRAIL_MARKERS)


def has_cvf_skill_usage_claim(text: str) -> bool:
    for raw_line in text.splitlines():
        line = raw_line.strip()
        if not line or _is_guardrail_line(line):
            continue
        if any(pattern.search(line) for pattern in USAGE_PATTERNS):
            return True
    return False


def _section(text: str, heading: str) -> str:
    markers = list(re.finditer(rf"^{re.escape(heading)}\s*$", text, flags=re.MULTILINE))
    if not markers:
        return ""
    marker = markers[-1]
    next_heading = NEXT_HEADING_RE.search(text, marker.end())
    end = next_heading.start() if next_heading else len(text)
    return text[marker.end() : end].strip()


def _table_rows(section: str) -> dict[str, str]:
    rows: dict[str, str] = {}
    for line in section.splitlines():
        stripped = line.strip()
        if not stripped.startswith("|") or stripped.startswith("|---"):
            continue
        cells = [cell.strip() for cell in stripped.strip("|").split("|")]
        if len(cells) < 2:
            continue
        if cells[0].lower() == "field":
            continue
        rows[cells[0]] = cells[1]
    return rows


def validate_trace_section(path: str, text: str, *, usage_claimed: bool) -> list[Violation]:
    violations: list[Violation] = []
    section = _section(text, TRACE_HEADING)
    if usage_claimed and not section:
        return [
            Violation(
                path,
                f"CVF ASSF skill usage claim requires `{TRACE_HEADING}` block",
            )
        ]
    if not section:
        return []

    rows = _table_rows(section)
    for row in [row for row in REQUIRED_ROWS if row not in rows]:
        violations.append(Violation(path, f"`{TRACE_HEADING}` missing row: {row}"))

    disposition = rows.get("Usage disposition", "")
    if usage_claimed and disposition != USED_TOKEN:
        violations.append(
            Violation(
                path,
                f"`Usage disposition` must be `{USED_TOKEN}` when CVF skill use is claimed",
            )
        )
    if disposition and disposition not in {USED_TOKEN, NOT_USED_TOKEN}:
        violations.append(
            Violation(
                path,
                f"`Usage disposition` must be `{USED_TOKEN}` or `{NOT_USED_TOKEN}`",
            )
        )

    if disposition == USED_TOKEN:
        for row in REQUIRED_ROWS[1:]:
            value = rows.get(row, "")
            if not value or value.upper().startswith("N/A"):
                violations.append(Violation(path, f"`{row}` must be concrete for `{USED_TOKEN}`"))
        receipt = rows.get("Receipt evidence", "")
        if "sha256:" not in receipt and "skillUsageReceipt" not in receipt:
            violations.append(
                Violation(
                    path,
                    "`Receipt evidence` must cite a sha256 receiptId or skillUsageReceipt output",
                )
            )
        boundary = rows.get("Authority boundary", "")
        if "does not grant authority" not in boundary:
            violations.append(
                Violation(
                    path,
                    "`Authority boundary` must state `does not grant authority`",
                )
            )
    return violations


def check_text(path: str, text: str) -> list[Violation]:
    usage_claimed = has_cvf_skill_usage_claim(text)
    return validate_trace_section(path, text, usage_claimed=usage_claimed)


def check_paths(paths: list[str]) -> list[Violation]:
    violations: list[Violation] = []
    for path in paths:
        if not is_applicable_path(path):
            continue
        full = REPO_ROOT / path
        if not full.exists() or full.is_dir():
            continue
        text = full.read_text(encoding="utf-8", errors="replace")
        violations.extend(check_text(path, text))
    return violations


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Check CVF skill usage receipt trace blocks"
    )
    parser.add_argument("--base", default=None)
    parser.add_argument("--head", default="HEAD")
    parser.add_argument("--enforce", action="store_true")
    parser.add_argument("--json", action="store_true")
    args = parser.parse_args()

    base = args.base or _default_base()
    try:
        paths = changed_files(base, args.head)
        violations = check_paths(paths)
    except RuntimeError as exc:
        print(f"ERROR: {exc}", file=sys.stderr)
        return 2

    payload: dict[str, Any] = {
        "base": base,
        "head": args.head,
        "checkedFiles": [path for path in paths if is_applicable_path(path)],
        "violations": [violation.__dict__ for violation in violations],
    }
    if args.json:
        print(json.dumps(payload, indent=2))
        return 1 if violations and args.enforce else 0

    print("=== CVF Skill Usage Receipt Trace Check ===")
    print(f"Range: {base}..{args.head}")
    print(f"Files checked: {len(payload['checkedFiles'])}")
    if violations:
        print(f"Violations: {len(violations)}")
        for violation in violations:
            print(f"  - {violation.path}: {violation.message}")
        print("\nFAIL - CVF skill use is not receipt-traceable.")
        return 1 if args.enforce else 0

    print("PASS - CVF skill usage receipt trace boundary is satisfied.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
