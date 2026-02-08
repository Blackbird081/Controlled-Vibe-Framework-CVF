#!/usr/bin/env python3
"""
Clean mapping record outputs (SKILL-*.md).
"""

from __future__ import annotations

import argparse
from pathlib import Path


ROOT_DIR = Path(__file__).resolve().parents[3]
OUTPUT_DIR = ROOT_DIR / "governance" / "skill-library" / "registry" / "mapping-records"


def main() -> int:
    parser = argparse.ArgumentParser(description="Clean mapping records.")
    parser.add_argument("--dry-run", action="store_true", help="List files without deleting.")
    args = parser.parse_args()

    if not OUTPUT_DIR.exists():
        print(f"Missing directory: {OUTPUT_DIR}")
        return 1

    files = sorted(OUTPUT_DIR.glob("SKILL-*.md"))
    print(f"Found {len(files)} mapping records.")
    if args.dry_run:
        for path in files:
            print(f"- {path.name}")
        return 0

    for path in files:
        path.unlink(missing_ok=True)

    print("OK: Cleaned mapping records.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
