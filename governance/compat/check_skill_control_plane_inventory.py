#!/usr/bin/env python3
"""Check the generated CVF Skill Control Plane inventory and drift rules."""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

HELPER_DIR = Path(__file__).resolve().parent
if str(HELPER_DIR) not in sys.path:
    sys.path.insert(0, str(HELPER_DIR))

from generate_skill_control_plane_inventory import (  # noqa: E402
    INVENTORY_PATH,
    validate_inventory_matches_sources,
)


def check(inventory_path: Path = INVENTORY_PATH) -> list[str]:
    """Return inventory or cross-surface drift violations."""
    return validate_inventory_matches_sources(inventory_path=inventory_path)


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(
        description="Validate the generated Skill Control Plane inventory"
    )
    parser.add_argument("--inventory-path", type=Path, default=INVENTORY_PATH)
    parser.add_argument("--enforce", action="store_true")
    args = parser.parse_args(argv)

    print("=== CVF Skill Control Plane Inventory Check ===")
    print(f"Inventory: {args.inventory_path.as_posix()}")
    violations = check(args.inventory_path)
    print(f"Violations: {len(violations)}")
    if violations:
        for violation in violations:
            print(f"  - {violation}")
        print("\nVIOLATION - skill control plane inventory is not aligned.")
        return 1 if args.enforce else 0
    print("\nCOMPLIANT - skill control plane inventory is aligned.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
