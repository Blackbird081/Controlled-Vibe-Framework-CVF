#!/usr/bin/env python3
"""
CVF Forbidden Filesystem State Gate (Fix B)

Runs at pre-implementation phase. Reads all active work orders in the
current diff range (or all DISPATCHED work orders if no range) and checks
whether any files listed under "Forbidden Path Manifest" already exist in the
working tree (tracked or untracked) before a worker begins implementation.

If a forbidden path is already present on disk when a worker starts, that
signals a prior out-of-scope write (e.g., a previous tranche leaked files)
that must be resolved before implementation proceeds.

Root cause this guard prevents:
  Worker creates forbidden-path files during a prior tranche or session.
  The files survive as untracked artifacts. The next work order's
  pre-implementation gate passes silently because no guard checked disk state.
  Worker completes their tranche; forbidden files get swept into the commit.
"""

from __future__ import annotations

import argparse
import os
import re
import subprocess
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]
STANDARD_PATH = "docs/reference/CVF_AGENT_WORK_ORDER_TEMPLATE_2026-05-19.md"

DISPATCHED_STATUSES = {"DISPATCHED_TO_WORKER", "IMPLEMENTATION_COMPLETE_PENDING_REVIEW"}

FORBIDDEN_SECTION_MARKER = "## Forbidden Path Manifest"
FORBIDDEN_FILESYSTEM_STATE_MARKER = "## Forbidden Filesystem State At Dispatch"


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


def _read(rel: str) -> str:
    try:
        return (REPO_ROOT / rel).read_text(encoding="utf-8", errors="replace")
    except Exception:
        return ""


def _exists_on_disk(rel: str) -> bool:
    """True if path exists as file or directory in working tree."""
    return (REPO_ROOT / rel).exists()


def _extract_status(text: str) -> str:
    for line in text.splitlines():
        line = line.strip()
        if line.lower().startswith("status:"):
            return line.split(":", 1)[1].strip()
    return ""


def _is_dispatched(text: str) -> bool:
    status = _extract_status(text).upper()
    return any(s in status for s in DISPATCHED_STATUSES)


def _extract_forbidden_paths(text: str) -> list[str]:
    """Extract paths from the Forbidden Path Manifest table."""
    idx = text.find(FORBIDDEN_SECTION_MARKER)
    if idx == -1:
        return []
    section = text[idx:]
    paths: list[str] = []
    for line in section.splitlines()[1:]:
        # Stop at next ## section
        if line.startswith("## ") and FORBIDDEN_SECTION_MARKER not in line:
            break
        # Extract first backtick-quoted token from table row
        m = re.search(r"`([^`]+)`", line)
        if m and "|" in line:
            raw = m.group(1).strip().rstrip("/")
            if raw and not raw.startswith("#"):
                paths.append(raw)
    return paths


def _normalize(path: str) -> str:
    return path.replace("\\", "/").strip().rstrip("/")


def _path_matches(candidate: str, pattern: str) -> bool:
    """True if candidate starts with pattern (handles directory prefixes)."""
    c = _normalize(candidate)
    p = _normalize(pattern)
    return c == p or c.startswith(p + "/")


def _get_active_work_orders(base: str | None, head: str) -> list[str]:
    """Return paths of work order files changed in range or all DISPATCHED ones."""
    work_orders: list[str] = []

    if base:
        code, out, _ = _run_git(["diff", "--name-only", f"{base}..{head}"])
        if code == 0:
            for line in out.splitlines():
                p = _normalize(line)
                if "docs/work_orders/" in p and p.endswith(".md"):
                    work_orders.append(p)

    # Also include all staged/untracked work order files
    for args in (["diff", "--name-only", "--cached"], ["ls-files", "--others", "--exclude-standard"]):
        code, out, _ = _run_git(args)
        if code == 0:
            for line in out.splitlines():
                p = _normalize(line)
                if "docs/work_orders/" in p and p.endswith(".md") and p not in work_orders:
                    work_orders.append(p)

    # If no range-specific work orders, fall back to all DISPATCHED work orders on disk
    if not work_orders:
        wo_dir = REPO_ROOT / "docs" / "work_orders"
        if wo_dir.is_dir():
            for f in wo_dir.glob("*.md"):
                work_orders.append(str(f.relative_to(REPO_ROOT)).replace("\\", "/"))

    return work_orders


def _check(base: str | None, head: str, enforce: bool) -> dict:
    work_order_paths = _get_active_work_orders(base, head)
    violations: list[dict] = []
    checked: list[str] = []

    for wo_path in work_order_paths:
        text = _read(wo_path)
        if not text:
            continue
        if not _is_dispatched(text):
            continue

        forbidden = _extract_forbidden_paths(text)
        if not forbidden:
            continue

        checked.append(wo_path)
        present_forbidden: list[str] = []
        for fp in forbidden:
            # Skip glob/wildcard patterns — only check literal paths
            if "*" in fp or "?" in fp:
                continue
            if _exists_on_disk(fp):
                present_forbidden.append(fp)

        if present_forbidden:
            violations.append({
                "path": wo_path,
                "issues": [
                    "Forbidden path(s) already exist on disk before implementation: "
                    + ", ".join(present_forbidden)
                    + ". Resolve (remove or govern) before starting implementation.",
            ]})

    result = {
        "gate": "forbidden-filesystem-state",
        "standard": STANDARD_PATH,
        "workOrdersChecked": len(checked),
        "violations": len(violations),
        "details": violations,
    }
    return result


def main() -> int:
    parser = argparse.ArgumentParser(description="CVF Forbidden Filesystem State Gate")
    parser.add_argument("--base", default=None)
    parser.add_argument("--head", default="HEAD")
    parser.add_argument("--enforce", action="store_true")
    args = parser.parse_args()

    result = _check(args.base, args.head, args.enforce)

    print("=== CVF Forbidden Filesystem State Gate ===")
    print(f"Work orders checked: {result['workOrdersChecked']}")
    print(f"Violations: {result['violations']}")

    if result["details"]:
        for v in result["details"]:
            print(f"\n  - {v['path']}")
            for issue in v["issues"]:
                print(f"    - {issue}")

    if result["violations"] == 0:
        print("\nCOMPLIANT - no forbidden paths present on disk for active work orders.")
        return 0

    print("\nVIOLATION - forbidden files present on disk; resolve before implementation.")
    return 1 if args.enforce else 0


if __name__ == "__main__":
    sys.exit(main())
