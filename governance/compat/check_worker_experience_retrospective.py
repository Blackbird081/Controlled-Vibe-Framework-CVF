#!/usr/bin/env python3
"""
CVF Worker Experience Retrospective Capture Checker (AAF-T5).

Enforces a small, deterministic worker-experience retrospective token on
self-declared worker-return artifacts, so CVF captures worker friction even when
the worker passes every gate. Friction signal that previously survived only when
an operator or reviewer asked in chat now lives in the governed return packet.

Eligibility is narrow on purpose. The token is required only on a file that
self-declares as a worker-return artifact, never on advisory/classification
packets, completion reviews, reference standards, baselines, or work orders that
merely discuss worker returns. This avoids the worktree-mode contamination
problem where a co-present file from another batch would otherwise be scanned.

This module is the source of truth for the worker-experience contract. The AAF
helper (`run_agent_automation_assist.py`) imports these symbols for early
read-only diagnostics rather than duplicating them.
"""

from __future__ import annotations

import argparse
import re
import subprocess
import sys
from dataclasses import dataclass, field
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]

# --- Contract vocabulary (AAF-T5) ---------------------------------------------

RETRO_TOKEN = "WORKER_EXPERIENCE_RETRO:"
RETRO_NA_TOKEN = "WORKER_EXPERIENCE_RETRO_NA_WITH_REASON:"
SELF_DECLARE_MARKER = "Self-declared worker-return artifact: yes"
RESPONDS_TO_MARKER = "Responds to work order:"
STATUS_PENDING = "Status: COMPLETE_PENDING_REVIEW"
STATUS_BLOCKED = "Status: BLOCKED_WITH_REASON"

# The exact asserting no-friction reason. A bare NA token is rejected so the
# absence of friction is an explicit, falsifiable claim rather than a reflexive
# paste.
RETRO_NA_REQUIRED_REASON = (
    "no friction beyond normal gates; no gate surprise, no helper gap, "
    "no worktree contamination this return"
)

RETRO_FIELDS = (
    "frictionLevel:",
    "frictionType:",
    "observedStep:",
    "preventiveControlCandidate:",
)

FRICTION_LEVELS = ("NONE", "LOW", "MEDIUM", "HIGH", "BLOCKING")
FRICTION_TYPES = (
    "NONE",
    "GATE_SURPRISE",
    "SCOPE_AMBIGUITY",
    "SOURCE_DISCOVERY",
    "WORKTREE_CONTAMINATION",
    "HELPER_GAP",
    "LATENCY",
    "KEYWORD_TRAP",
    "ENUM_OR_TOKEN_MISMATCH",
    "OTHER",
)
PREVENTIVE_CONTROL_CANDIDATES = (
    "NONE",
    "INDEX_UPDATE",
    "HELPER_DIAGNOSTIC",
    "CHECKER",
    "WORK_ORDER_TEMPLATE",
    "STANDARD_UPDATE",
    "DEFER",
)

# Files that must never be treated as worker-return artifacts even if they
# contain worker-return vocabulary, because they only discuss it.
EXCLUDED_DOCTYPES = (
    "docType: review_context",
    "docType: reference",
    "docType: baseline",
    "docType: work_order",
)
EXCLUDED_PATH_SUBSTRINGS = (
    "_COMPLETION_",
    "_CODEX_REBUTTAL_",
    "_CLAUDE_REBUTTAL_RESPONSE_",
    "_CODEX_CLASSIFICATION_",
    "_FOR_CODEX_",
    "/baselines/",
    "/work_orders/",
)


@dataclass(frozen=True)
class RetroDiagnostic:
    path: str
    eligible: bool
    issues: tuple[str, ...] = field(default_factory=tuple)

    @property
    def is_clean(self) -> bool:
        return self.eligible and not self.issues


def _configure_stdout() -> None:
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    if hasattr(sys.stderr, "reconfigure"):
        sys.stderr.reconfigure(encoding="utf-8", errors="replace")


def is_eligible_worker_return(path: str, text: str) -> bool:
    """A file is an eligible worker-return artifact only when it self-declares.

    The excluded path/doctype classes never qualify even with worker-return
    vocabulary or quoted marker text. Otherwise, explicit
    `Self-declared worker-return artifact: yes` qualifies, or the Status +
    Responds-to-work-order pair qualifies.
    """
    normalized_path = path.replace("\\", "/")
    if not normalized_path.startswith("docs/reviews/"):
        return False
    if not path.endswith(".md"):
        return False
    if any(d in text for d in EXCLUDED_DOCTYPES):
        return False
    if any(s in path for s in EXCLUDED_PATH_SUBSTRINGS):
        return False
    if SELF_DECLARE_MARKER in text:
        return True
    has_status = STATUS_PENDING in text or STATUS_BLOCKED in text
    return has_status and RESPONDS_TO_MARKER in text


def _field_value(block: str, field_label: str) -> str:
    # Use [ \t]* (not \s*) after the label so an empty value does not greedily
    # consume the newline and capture the next line's content.
    pattern = re.compile(
        rf"^[ \t]*(?:[-*][ \t]+)?{re.escape(field_label)}[ \t]*(.*)$",
        re.MULTILINE,
    )
    m = pattern.search(block)
    return m.group(1).strip() if m else ""


def _extract_retro_block(text: str) -> str:
    """Return the structured retro block text from the token to the next blank
    line or fence end, enough to read the four fields."""
    idx = text.find(RETRO_TOKEN)
    if idx == -1:
        return ""
    return text[idx : idx + 1200]


def diagnose(path: str, text: str) -> RetroDiagnostic:
    if not is_eligible_worker_return(path, text):
        return RetroDiagnostic(path=path, eligible=False)

    struct_count = text.count(RETRO_TOKEN)
    na_count = text.count(RETRO_NA_TOKEN)
    has_struct = struct_count > 0
    has_na = na_count > 0
    issues: list[str] = []

    if not has_struct and not has_na:
        issues.append(
            f"missing worker-experience token: add `{RETRO_TOKEN}` block or "
            f"`{RETRO_NA_TOKEN}` asserting line"
        )
        return RetroDiagnostic(path=path, eligible=True, issues=tuple(issues))

    if struct_count + na_count > 1:
        issues.append(
            "multiple worker-experience tokens present; include exactly one"
        )

    if has_na:
        na_value = _field_value(text, RETRO_NA_TOKEN)
        if na_value != RETRO_NA_REQUIRED_REASON:
            issues.append(
                "bare or non-asserting `WORKER_EXPERIENCE_RETRO_NA_WITH_REASON`; "
                "use the exact asserting reason"
            )

    if has_struct:
        block = _extract_retro_block(text)
        for f in RETRO_FIELDS:
            if f not in block:
                issues.append(f"structured retro missing field `{f}`")
        level = _field_value(block, "frictionLevel:")
        ftype = _field_value(block, "frictionType:")
        step = _field_value(block, "observedStep:")
        cand = _field_value(block, "preventiveControlCandidate:")
        if level and level not in FRICTION_LEVELS:
            issues.append(f"invalid frictionLevel `{level}`")
        if ftype and ftype not in FRICTION_TYPES:
            issues.append(f"invalid frictionType `{ftype}`")
        if cand and cand not in PREVENTIVE_CONTROL_CANDIDATES:
            issues.append(f"invalid preventiveControlCandidate `{cand}`")
        if "observedStep:" in block and not step:
            issues.append("empty observedStep in structured retro")

    return RetroDiagnostic(path=path, eligible=True, issues=tuple(issues))


def _git_output(*args: str) -> str:
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


def _changed_md_paths(base: str, head: str) -> tuple[str, ...]:
    paths: set[str] = set()
    rng = _git_output("diff", "--name-only", f"{base}..{head}")
    for line in rng.splitlines():
        if line.strip():
            paths.add(line.replace("\\", "/"))
    status = _git_output("status", "--short")
    for line in status.splitlines():
        if not line.strip():
            continue
        p = line[2:].strip() if len(line) > 2 else line.strip()
        if " -> " in p:
            p = p.split(" -> ", 1)[1]
        paths.add(p.replace("\\", "/"))
    return tuple(sorted(p for p in paths if p.endswith(".md")))


def _read(path: str) -> str:
    full = REPO_ROOT / path
    if not full.exists() or full.is_dir():
        return ""
    return full.read_text(encoding="utf-8", errors="replace")


def run(base: str, head: str) -> list[RetroDiagnostic]:
    results: list[RetroDiagnostic] = []
    for path in _changed_md_paths(base, head):
        d = diagnose(path, _read(path))
        if d.eligible:
            results.append(d)
    return results


def main(argv: list[str] | None = None) -> int:
    _configure_stdout()
    parser = argparse.ArgumentParser(
        description="CVF worker-experience retrospective capture checker."
    )
    parser.add_argument("--base", default="HEAD")
    parser.add_argument("--head", default="HEAD")
    parser.add_argument("--enforce", action="store_true")
    args = parser.parse_args(argv)

    print("=== CVF Worker Experience Retrospective Capture Gate ===")
    diagnostics = run(args.base, args.head)
    violations = [d for d in diagnostics if not d.is_clean]

    print(f"Eligible worker-return artifacts checked: {len(diagnostics)}")
    if not violations:
        print("PASS: all eligible worker-return artifacts carry a valid token.")
        return 0

    print(f"Violations: {len(violations)}")
    for d in violations:
        for issue in d.issues:
            print(f"  - {d.path}: {issue}")
    print(
        "VIOLATION - add a valid WORKER_EXPERIENCE_RETRO block or the exact "
        "WORKER_EXPERIENCE_RETRO_NA_WITH_REASON assertion."
    )
    return 1 if args.enforce else 0


if __name__ == "__main__":
    raise SystemExit(main())
