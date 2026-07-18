#!/usr/bin/env python3
"""
CVF Public Catalog Update Advisory Checker

Advisory (non-blocking) check. When a commit adds files that indicate a
capability tranche was closed (CLOSURE, COMPLETION, DELIVERED keywords in
docs/reviews/ or docs/baselines/) but the public technical catalog was NOT
touched in the same commit, emit a reminder to update the catalog.

This implements the GC-024 catalog update rule from CLAUDE.md.
Does not block commits — exits 0 always. The advisory is printed to stdout
so the agent sees it in the commit output.

Public catalog target (public-sync):
  docs/reference/CVF_TECHNICAL_PRODUCT_CATALOG_2026-05-18.md
  (tracked here as a known path; update this list if the catalog is renamed)
"""

from __future__ import annotations

import re
import subprocess
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]

# Keywords in committed file names that signal a tranche closure
CLOSURE_KEYWORDS = [
    "CLOSURE",
    "COMPLETION",
    "COMPLETE",
]

# Paths that count as "catalog touched" — if any of these appear in the diff,
# the advisory is suppressed.
CATALOG_PATHS = [
    "docs/reference/CVF_TECHNICAL_PRODUCT_CATALOG_2026-05-18.md",
]

# Directories whose new files trigger the check
TRIGGER_DIRS = [
    "docs/reviews/",
    "docs/baselines/",
]


def _get_diff_files() -> list[str]:
    """Return list of files changed in the current staged index (HEAD..index)."""
    result = subprocess.run(
        ["git", "diff", "--cached", "--name-only"],
        cwd=REPO_ROOT,
        text=True,
        capture_output=True,
    )
    if result.returncode != 0:
        return []
    return [f.strip() for f in result.stdout.splitlines() if f.strip()]


def _file_is_trigger(path: str) -> bool:
    in_trigger_dir = any(path.startswith(d) for d in TRIGGER_DIRS)
    if not in_trigger_dir:
        return False
    name = Path(path).name.upper()
    return any(kw in name for kw in CLOSURE_KEYWORDS)


def main() -> int:
    print("=== CVF Public Catalog Update Advisory ===")

    diff_files = _get_diff_files()

    trigger_files = [f for f in diff_files if _file_is_trigger(f)]
    catalog_touched = any(
        any(cat in f for cat in CATALOG_PATHS) for f in diff_files
    )

    if not trigger_files:
        print("No tranche closure files detected in this commit. Catalog advisory skipped.")
        return 0

    print(f"Tranche closure files detected ({len(trigger_files)}):")
    for f in trigger_files:
        print(f"  ~ {f}")

    if catalog_touched:
        print("Public catalog was updated in this commit. Advisory satisfied.")
        return 0

    # Advisory — never blocks
    print()
    print("ADVISORY [!] Public catalog not updated in this commit.")
    print()
    print("  The following tranche closure files were added without a")
    print("  corresponding update to the public technical catalog:")
    for f in trigger_files:
        print(f"  ~ {f}")
    print()
    print("  Per the GC-024 catalog update rule (CLAUDE.md), every agent")
    print("  that delivers a new capability tranche must update the catalog")
    print("  before closing the tranche.")
    print()
    print("  Catalog to update (public-sync repo):")
    for cat in CATALOG_PATHS:
        print(f"  -> {cat}")
    print()
    print("  If this tranche adds no new proven capability, note N/A explicitly")
    print("  in the tranche closure packet.")
    print()
    print("  This advisory does not block the commit.")

    return 0  # Always exits 0 — advisory only


if __name__ == "__main__":
    raise SystemExit(main())
