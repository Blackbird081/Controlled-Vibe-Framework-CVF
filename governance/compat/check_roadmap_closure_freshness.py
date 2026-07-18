#!/usr/bin/env python3
"""
CVF Roadmap Closure Freshness Checker

Validates changed active roadmap files for same-file closure-state drift:
when a roadmap's Machine Closure Package cites the roadmap's own top-of-file
Status value, the cited value must match the actual top Status exactly.

This is intentionally narrow. It does not try to infer closure state across the
whole repository; it catches the repeated self-reference drift class that made
closed roadmaps advertise stale or conflicting status strings to later agents.
"""

from __future__ import annotations

import argparse
import os
import re
import subprocess
import sys
from pathlib import Path


REPO_ROOT = Path(__file__).resolve().parents[2]
DEFAULT_BASE_CANDIDATES = ("origin/main", "origin/master", "main", "master")
STANDARD_PATH = "docs/reference/roadmap_closure_freshness/CVF_ROADMAP_CLOSURE_FRESHNESS_STANDARD.md"

ROADMAP_PREFIX = "docs/roadmaps/"
ARCHIVE_MARKER = "/archive/"
STATUS_RE = re.compile(r"(?im)^Status:\s*(.+?)\s*$")
SECTION_RE = re.compile(r"(?m)^##\s+(.+?)\s*$")
STATUS_TOKEN_RE = re.compile(r"Status:\s*`?([A-Za-z0-9_:-]+)`?", re.IGNORECASE)


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


def _parse_name_status(output: str) -> dict[str, set[str]]:
    changed: dict[str, set[str]] = {}
    for raw in output.splitlines():
        parts = raw.split("\t")
        if len(parts) < 2:
            continue
        status = parts[0].strip()
        path = parts[2] if status.startswith(("R", "C")) and len(parts) > 2 else parts[1]
        normalized = path.replace("\\", "/").strip()
        if normalized:
            changed.setdefault(normalized, set()).add(status)
    return changed


def _merge_status(target: dict[str, set[str]], source: dict[str, set[str]]) -> None:
    for path, statuses in source.items():
        target.setdefault(path, set()).update(statuses)


def _get_changed(base: str, head: str) -> dict[str, set[str]]:
    changed: dict[str, set[str]] = {}
    code, out, err = _run_git(["diff", "--name-status", f"{base}..{head}"])
    if code != 0:
        raise RuntimeError(f"git diff failed for range {base}..{head}: {err or out}")
    _merge_status(changed, _parse_name_status(out))

    for args in (["diff", "--name-status"], ["diff", "--name-status", "--cached"]):
        code, out, _ = _run_git(args)
        if code == 0 and out:
            _merge_status(changed, _parse_name_status(out))

    code, out, _ = _run_git(["ls-files", "--others", "--exclude-standard"])
    if code == 0 and out:
        for raw in out.splitlines():
            path = raw.replace("\\", "/").strip()
            if path:
                changed.setdefault(path, set()).add("A")
    return changed


def _read_rel(path: str) -> str:
    full = REPO_ROOT / path
    if not full.exists() or full.is_dir():
        return ""
    return full.read_text(encoding="utf-8", errors="replace")


def _is_active_roadmap(path: str) -> bool:
    normalized = path.replace("\\", "/")
    return (
        normalized.startswith(ROADMAP_PREFIX)
        and normalized.endswith(".md")
        and ARCHIVE_MARKER not in normalized
    )


def _extract_status(text: str) -> str:
    match = STATUS_RE.search(text)
    return match.group(1).strip() if match else ""


def _extract_section(text: str, heading: str) -> str:
    matches = list(SECTION_RE.finditer(text))
    for idx, match in enumerate(matches):
        if match.group(1).strip().lower() != heading.lower():
            continue
        start = match.end()
        end = matches[idx + 1].start() if idx + 1 < len(matches) else len(text)
        return text[start:end].strip()
    return ""


def _split_table_row(raw: str) -> list[str]:
    stripped = raw.strip()
    if not stripped.startswith("|") or not stripped.endswith("|"):
        return []
    return [cell.strip() for cell in stripped.strip("|").split("|")]


def _row_self_references(row: list[str], path: str) -> bool:
    joined = " | ".join(row)
    basename = path.rsplit("/", 1)[-1]
    return (
        "Roadmap state" in row[0]
        and (
            path in joined
            or basename in joined
            or re.search(r"\bthis\s+(?:file|roadmap)\b", joined, re.IGNORECASE)
        )
    )


def validate_roadmap_closure_freshness(path: str, text: str) -> list[str]:
    """Return freshness violations for one roadmap file."""
    issues: list[str] = []
    if not _is_active_roadmap(path):
        return issues

    top_status = _extract_status(text)
    if not top_status:
        return [f"{path}: roadmap is missing a top-of-file `Status:` line"]

    package = _extract_section(text, "Machine Closure Package")
    if not package:
        return issues

    for raw in package.splitlines():
        row = _split_table_row(raw)
        if len(row) < 4 or row[0].strip("- ") in {"Closure item", "---"}:
            continue
        if not _row_self_references(row, path):
            continue
        evidence = row[2]
        for cited_status in STATUS_TOKEN_RE.findall(evidence):
            if cited_status != top_status:
                issues.append(
                    f"{path}: Machine Closure Package Roadmap state cites "
                    f"`Status: {cited_status}` but top-of-file Status is "
                    f"`{top_status}`"
                )
    return issues


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--base", help="Base commit/ref for changed-file discovery")
    parser.add_argument("--head", help="Head commit/ref for changed-file discovery")
    parser.add_argument("--paths", nargs="*", help="Explicit paths to check")
    parser.add_argument("--enforce", action="store_true", help="Exit non-zero on violations")
    args = parser.parse_args(argv)

    if args.paths:
        paths = [path.replace("\\", "/") for path in args.paths]
        base, head, source = "<paths>", "<paths>", "explicit:--paths"
    else:
        base, head, source = _resolve_range(args.base, args.head)
        paths = sorted(_get_changed(base, head).keys())

    checked = 0
    violations: list[str] = []
    for path in paths:
        if not _is_active_roadmap(path):
            continue
        text = _read_rel(path)
        if not text:
            continue
        checked += 1
        violations.extend(validate_roadmap_closure_freshness(path, text))

    print("=== CVF Roadmap Closure Freshness Gate ===")
    print(f"Range: {base}..{head}")
    print(f"Base source: {source}")
    print(f"Standard: {STANDARD_PATH}")
    print(f"Changed roadmaps checked: {checked}")
    print(f"Violations: {len(violations)}")
    for issue in violations:
        print(f"  - {issue}")

    if violations:
        if args.enforce:
            print("\nNON-COMPLIANT - roadmap closure freshness drift detected.")
            return 1
        print("\nADVISORY - roadmap closure freshness drift detected.")
        return 0

    print("\nCOMPLIANT - changed roadmap closure state is self-consistent.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
