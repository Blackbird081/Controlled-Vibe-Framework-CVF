#!/usr/bin/env python3
"""
Clean user skills registry (USR-*.gov.md + INDEX.md).
Used to avoid count mismatches when regenerating registry.
"""

from __future__ import annotations

import argparse
from pathlib import Path


ROOT_DIR = Path(__file__).resolve().parents[3]
USER_REGISTRY_PATH = ROOT_DIR / "governance" / "skill-library" / "registry" / "user-skills"


def main() -> int:
    parser = argparse.ArgumentParser(description="Clean user registry files.")
    parser.add_argument("--dry-run", action="store_true", help="List files without deleting.")
    args = parser.parse_args()

    if not USER_REGISTRY_PATH.exists():
        print(f"Missing directory: {USER_REGISTRY_PATH}")
        return 1

    files = sorted(USER_REGISTRY_PATH.glob("USR-*.gov.md"))
    index_file = USER_REGISTRY_PATH / "INDEX.md"

    print(f"Found {len(files)} user registry files.")
    if args.dry_run:
        for path in files:
            print(f"- {path.name}")
        if index_file.exists():
            print(f"- {index_file.name}")
        return 0

    for path in files:
        path.unlink(missing_ok=True)
    if index_file.exists():
        index_file.unlink()

    print("OK: Cleaned user registry.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
