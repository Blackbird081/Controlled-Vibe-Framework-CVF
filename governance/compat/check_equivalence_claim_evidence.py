#!/usr/bin/env python3
"""
CVF Equivalence Claim Evidence Checker (EQC-T1)

Scans changed docs/reviews/*.md files and changed docs/work_orders/*.md files
that contain a worker-return block for equivalence-claim phrases used near a
named source-file reference without an adjacent evidence-command or
disposition-token pair.

This checker proves nothing about whether the underlying claim is true; it
only fails when an equivalence claim lacks adjacent evidence.

No network or provider call is made. Static-pattern text scan only.
Mirrors check_rescan_intelligence_hardening.py structural pattern.
"""

from __future__ import annotations

import argparse
import datetime as dt
import json
import os
import re
import subprocess
import sys
from pathlib import Path
from typing import Any


REPO_ROOT = Path(__file__).resolve().parents[2]
DEFAULT_BASE_CANDIDATES = ("origin/main", "origin/master", "main", "master")

THIS_SCRIPT_PATH = "governance/compat/check_equivalence_claim_evidence.py"

# Closed phrase list from GC-018 EQC-T1 baseline Decision section.
EQUIVALENCE_PHRASES: tuple[str, ...] = (
    "verbatim",
    "identical",
    "no new field",
    "maps to existing",
    "same as",
    "reused exactly",
)

# Disposition tokens that satisfy the evidence requirement without a command.
DISPOSITION_TOKENS: tuple[str, ...] = (
    "MATCH",
    "ADAPTED_WITH_REASON",
    "NEW_FIELD_INTRODUCED",
    "NOT_LITERAL_WITH_REASON",
)

# Evidence-command patterns accepted as proof.
EVIDENCE_COMMAND_PATTERNS: tuple[str, ...] = (
    r"\brg\s+",
    r"\bgit\s+diff\s+--no-index\b",
    r"\bgit\s+diff\b",
    r"\|\s*---\s*\|",   # markdown table row separator (table evidence)
)

# Path-like token pattern: backtick-quoted string that looks like a file path
# (contains a slash or dot-extension) or a contract name (snake/kebab-case).
PATH_LIKE_RE = re.compile(
    r"`(?:[A-Za-z0-9_./-]+/[A-Za-z0-9_./-]+|[A-Za-z0-9_-]+\.[A-Za-z]{1,6})`"
)

# Worker-return block marker (case-insensitive).
WORKER_RETURN_MARKERS = (
    "Worker Status",
    "worker status",
    "COMPLETE_PENDING_REVIEW",
    "BLOCKED_WITH_REASON",
    "COMPLETE_WITH_LIMITATIONS_PENDING_REVIEW",
)

# Character window around a phrase match to search for adjacent evidence.
EVIDENCE_WINDOW = 400

ARCHIVE_MARKER = "/archive/"
APPLICABLE_REVIEWS_GLOB = "docs/reviews/"
APPLICABLE_WORK_ORDERS_GLOB = "docs/work_orders/"


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
        path = path.replace("\\", "/")
        changed.setdefault(path, set()).add(status)
    return changed


def _get_changed_name_status(base: str, head: str) -> dict[str, set[str]]:
    code, out, err = _run_git(["diff", "--name-status", f"{base}..{head}"])
    if code != 0:
        raise RuntimeError(f"git diff failed for {base}..{head}: {err}")
    return _parse_name_status_output(out)


def _get_worktree_name_status() -> dict[str, set[str]]:
    code, out, err = _run_git(["status", "--short"])
    if code != 0:
        raise RuntimeError(f"git status failed: {err}")
    changed: dict[str, set[str]] = {}
    for raw_line in out.splitlines():
        if not raw_line.strip():
            continue
        status = raw_line[:2].strip() or raw_line[:2]
        path = raw_line[3:].strip()
        if " -> " in path:
            path = path.split(" -> ", 1)[1]
        path = path.replace("\\", "/")
        changed.setdefault(path, set()).add(status)
    return changed


def _merge_changed_maps(*maps: dict[str, set[str]]) -> dict[str, list[str]]:
    merged: dict[str, set[str]] = {}
    for changed in maps:
        for path, statuses in changed.items():
            merged.setdefault(path, set()).update(statuses)
    return {path: sorted(statuses) for path, statuses in sorted(merged.items())}


def _read_rel(path: str) -> str:
    return (REPO_ROOT / path).read_text(encoding="utf-8", errors="replace")


def _add(violations: list[dict[str, str]], path: str, vtype: str, message: str) -> None:
    violations.append({"path": path, "type": vtype, "message": message})


def _is_in_code_fence(lines: list[str], target_idx: int) -> bool:
    """Return True if the line at target_idx is inside a markdown code fence."""
    fence_count = 0
    for i, line in enumerate(lines):
        stripped = line.strip()
        if stripped.startswith("```") or stripped.startswith("~~~"):
            fence_count += 1
        if i == target_idx:
            break
    return (fence_count % 2) == 1


def _extract_paragraph_bounds(text: str, match_start: int) -> tuple[int, int]:
    """Return the (start, end) character offsets of the paragraph containing match_start."""
    # Paragraphs are separated by blank lines.
    para_start = text.rfind("\n\n", 0, match_start)
    para_start = para_start + 2 if para_start != -1 else 0
    para_end = text.find("\n\n", match_start)
    if para_end == -1:
        para_end = len(text)
    return para_start, para_end


def _has_path_like_in_paragraph(text: str, para_start: int, para_end: int) -> bool:
    """Return True when the paragraph contains a backtick-quoted path-like token."""
    para_text = text[para_start:para_end]
    return bool(PATH_LIKE_RE.search(para_text))


def _has_evidence_in_window(text: str, match_start: int) -> bool:
    """Return True when an evidence command or disposition token appears within
    EVIDENCE_WINDOW characters of match_start."""
    window_start = max(0, match_start - EVIDENCE_WINDOW)
    window_end = min(len(text), match_start + EVIDENCE_WINDOW)
    window = text[window_start:window_end]

    for token in DISPOSITION_TOKENS:
        if token in window:
            return True

    for pattern in EVIDENCE_COMMAND_PATTERNS:
        if re.search(pattern, window):
            return True

    return False


def _is_active_markdown(path: str) -> bool:
    if not path.endswith(".md"):
        return False
    normalized = path.replace("\\", "/")
    if ARCHIVE_MARKER in normalized:
        return False
    return normalized.startswith(APPLICABLE_REVIEWS_GLOB) or normalized.startswith(
        APPLICABLE_WORK_ORDERS_GLOB
    )


def _has_worker_return_block(text: str) -> bool:
    """Return True when the file contains a worker-return block marker."""
    for marker in WORKER_RETURN_MARKERS:
        if marker in text:
            return True
    return False


def _is_applicable(path: str, text: str) -> bool:
    normalized = path.replace("\\", "/")
    if not _is_active_markdown(path):
        return False
    if normalized.startswith(APPLICABLE_REVIEWS_GLOB):
        return True
    if normalized.startswith(APPLICABLE_WORK_ORDERS_GLOB):
        return _has_worker_return_block(text)
    return False


def _line_of_offset(text: str, offset: int) -> int:
    """Return 1-indexed line number for the given character offset."""
    return text[:offset].count("\n") + 1


def check_text(path: str, text: str) -> list[dict[str, str]]:
    """Check a single file's text for unverified equivalence claims.

    Returns a list of violation dicts, each with keys:
      path, type, phrase, line, message
    """
    violations: list[dict[str, str]] = []
    if not _is_applicable(path, text):
        return violations

    lines = text.splitlines()

    for phrase in EQUIVALENCE_PHRASES:
        # Case-insensitive search for the phrase as a standalone word.
        pattern = re.compile(r"\b" + re.escape(phrase) + r"\b", re.IGNORECASE)
        for m in pattern.finditer(text):
            match_start = m.start()
            target_line_idx = text[:match_start].count("\n")

            # Skip occurrences inside code fences.
            if _is_in_code_fence(lines, target_line_idx):
                continue

            # Find the paragraph boundaries.
            para_start, para_end = _extract_paragraph_bounds(text, match_start)

            # Only flag if there is a path-like token in the same paragraph.
            if not _has_path_like_in_paragraph(text, para_start, para_end):
                continue

            # Check for adjacent evidence.
            if _has_evidence_in_window(text, match_start):
                continue

            line_no = _line_of_offset(text, match_start)
            _add(
                violations,
                path,
                "equivalence_claim_without_evidence",
                (
                    f"line {line_no}: phrase \"{phrase}\" appears near a path-like "
                    f"token in the same paragraph but no adjacent evidence-command "
                    f"(rg, git diff --no-index) or disposition token "
                    f"(MATCH, ADAPTED_WITH_REASON, NEW_FIELD_INTRODUCED, "
                    f"NOT_LITERAL_WITH_REASON) was found within {EVIDENCE_WINDOW} "
                    f"characters"
                ),
            )

    return violations


def _validate_path(path: str) -> list[dict[str, str]]:
    full = REPO_ROOT / path
    if not full.exists() or full.is_dir():
        return []
    text = _read_rel(path)
    return check_text(path, text)


def _classify(changed_paths: dict[str, list[str]]) -> dict[str, Any]:
    violations: list[dict[str, str]] = []
    scoped_paths = set(changed_paths)

    for path in sorted(scoped_paths):
        statuses = changed_paths.get(path, [])
        if statuses and all(status.startswith("D") for status in statuses):
            continue
        violations.extend(_validate_path(path))

    return {
        "checkedPaths": sorted(scoped_paths),
        "changedPaths": changed_paths,
        "violations": violations,
        "violationCount": len(violations),
        "compliant": not violations,
    }


def _print_report(report: dict[str, Any], base: str, head: str, range_source: str) -> None:
    print("=== CVF Equivalence Claim Evidence Checker (EQC-T1) ===")
    print(f"Range: {base}..{head} ({range_source})")
    print(f"Checker: {THIS_SCRIPT_PATH}")
    print(f"Changed paths: {len(report['changedPaths'])}")
    print(f"Checked paths: {len(report['checkedPaths'])}")
    print(f"Violations: {len(report['violations'])}")
    if report["violations"]:
        print("\nViolations:")
        for item in report["violations"]:
            print(f"  - {item['path']}: {item['type']} - {item['message']}")
    if report["compliant"]:
        print("\nCOMPLIANT - no unverified equivalence claims detected.")
    else:
        print(
            "\nVIOLATION - equivalence claim(s) without adjacent evidence detected."
        )


def main() -> int:
    parser = argparse.ArgumentParser(
        description=(
            "Detect equivalence-claim phrases near path-like tokens in changed "
            "docs/reviews and docs/work_orders files without adjacent evidence."
        )
    )
    parser.add_argument("--base", default=None, help="Optional git base ref")
    parser.add_argument("--head", default=None, help="Optional git head ref")
    parser.add_argument(
        "--enforce", action="store_true", help="Return non-zero when violations exist"
    )
    parser.add_argument("--json", action="store_true", help="Print JSON report")
    args = parser.parse_args()

    try:
        base, head, range_source = _resolve_range(args.base, args.head)
        changed_paths = _merge_changed_maps(
            _get_changed_name_status(base, head),
            _get_worktree_name_status(),
        )
        report = _classify(changed_paths)
    except RuntimeError as exc:
        print(str(exc), file=sys.stderr)
        return 1

    report["timestamp"] = (
        dt.datetime.now(dt.timezone.utc)
        .replace(microsecond=0)
        .isoformat()
        .replace("+00:00", "Z")
    )
    report["range"] = {"base": base, "head": head, "source": range_source}
    if args.json:
        print(json.dumps(report, indent=2, ensure_ascii=False))
    else:
        _print_report(report, base, head, range_source)
    if args.enforce and not report["compliant"]:
        return 2
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
