#!/usr/bin/env python3
"""Check ASSF external-agent metadata readout boundary.

This checker is read-only. It verifies that the metadata readout helper emits
only the field families authorized by the ASSF external-agent readout boundary
and keeps adapter behavior explicitly unimplemented.
"""

from __future__ import annotations

import argparse
import sys
from pathlib import Path
from typing import Any

_COMPAT_DIR = Path(__file__).resolve().parent
if str(_COMPAT_DIR) not in sys.path:
    sys.path.insert(0, str(_COMPAT_DIR))

from run_assf_external_agent_metadata_readout import (  # noqa: E402
    ADAPTER_IMPLEMENTATION,
    ALLOWED_SKILL_FIELDS,
    INDEX_PATH,
    build_metadata_readout,
)


REQUIRED_BOUNDARY_PHRASES = (
    "does not implement CLI/MCP adapter behavior",
    "execute package instruction bodies",
    "mutate ASSF registry or generated-index sources",
    "call providers",
)


def _flatten_allowed_families(value: Any) -> set[str]:
    if not isinstance(value, dict):
        return set()
    fields: set[str] = set()
    for family_fields in value.values():
        if isinstance(family_fields, list):
            fields.update(str(item) for item in family_fields)
    return fields


def check_payload(payload: dict[str, Any]) -> list[str]:
    """Return readout-boundary violations for a serialized payload."""
    violations: list[str] = []
    allowed_fields = set(ALLOWED_SKILL_FIELDS)

    if payload.get("adapterImplementation") != ADAPTER_IMPLEMENTATION:
        violations.append(
            "adapterImplementation must remain "
            f"{ADAPTER_IMPLEMENTATION!r}"
        )

    family_fields = _flatten_allowed_families(payload.get("allowedFieldFamilies"))
    if family_fields != allowed_fields:
        missing = sorted(allowed_fields - family_fields)
        extra = sorted(family_fields - allowed_fields)
        if missing:
            violations.append(f"allowedFieldFamilies missing fields: {missing}")
        if extra:
            violations.append(f"allowedFieldFamilies contains extra fields: {extra}")

    boundary = str(payload.get("claimBoundary", ""))
    for phrase in REQUIRED_BOUNDARY_PHRASES:
        if phrase not in boundary:
            violations.append(f"claimBoundary missing required phrase: {phrase}")

    items = payload.get("items")
    if not isinstance(items, list):
        violations.append("items must be a list")
        return violations

    for index, item in enumerate(items):
        if not isinstance(item, dict):
            violations.append(f"items[{index}] must be an object")
            continue
        item_fields = set(str(key) for key in item)
        extra = sorted(item_fields - allowed_fields)
        if extra:
            skill_id = item.get("skillId", f"items[{index}]")
            violations.append(f"{skill_id}: non-allowlisted fields emitted: {extra}")

    return violations


def check(index_path: Path = INDEX_PATH) -> list[str]:
    """Build the current readout and return boundary violations."""
    payload = build_metadata_readout(index_path=index_path, max_results=10000).to_dict()
    return check_payload(payload)


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Check ASSF external-agent metadata readout boundary"
    )
    parser.add_argument("--index-path", type=Path, default=INDEX_PATH)
    parser.add_argument(
        "--enforce",
        action="store_true",
        help="Return nonzero on violations. Kept for consistency with hooks.",
    )
    args = parser.parse_args()

    print("=== CVF ASSF External-Agent Metadata Readout Check ===")
    violations = check(index_path=args.index_path)
    if violations:
        print("READOUT VIOLATIONS:")
        for violation in violations:
            print(f"  - {violation}")
        print("\nFAIL - ASSF external-agent metadata readout is not bounded.")
        return 1

    print("PASS - ASSF external-agent metadata readout is bounded.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
