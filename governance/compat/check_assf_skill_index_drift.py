#!/usr/bin/env python3
"""CVF ASSF Skill Index Drift Checker.

Fails with exit code 1 if the committed
``docs/reference/agent_system_skills/generated/skill-index.json``
diverges from what the generator would produce from the current per-entry
registry sources.

This checker never writes to the filesystem.
"""

from __future__ import annotations

import sys
from pathlib import Path

_COMPAT_DIR = Path(__file__).resolve().parent
if str(_COMPAT_DIR) not in sys.path:
    sys.path.insert(0, str(_COMPAT_DIR))

from generate_assf_skill_index import (  # noqa: E402
    ENTRIES_DIR,
    INDEX_PATH,
    validate_index_matches_sources,
)


def check(
    index_path: Path = INDEX_PATH,
    entries_dir: Path = ENTRIES_DIR,
) -> list[str]:
    """Return drift violations. Empty list means the index is in sync."""
    return validate_index_matches_sources(index_path, entries_dir)


def main() -> int:
    print("=== CVF ASSF Skill Index Drift Check ===")
    violations = check()
    if violations:
        print("DRIFT VIOLATIONS:")
        for v in violations:
            print(f"  - {v}")
        print(
            "\nFAIL - skill index is out of sync with registry entry sources.\n"
            "Run: python governance/compat/generate_assf_skill_index.py --generate"
        )
        return 1
    print("PASS - skill index is in sync with registry entry sources.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
