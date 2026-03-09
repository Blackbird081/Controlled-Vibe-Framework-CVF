#!/usr/bin/env python3
"""
CVF Guard Registry Compatibility Gate

Ensures every guard file in governance/toolkit/05_OPERATION/*_GUARD.md
is registered in both:
  - README.md (Mandatory Guards table)
  - docs/CVF_CORE_KNOWLEDGE_BASE.md (Governance Guards table)

Policy:
  - governance/toolkit/05_OPERATION/CVF_GUARD_REGISTRY_GUARD.md

Usage:
  python governance/compat/check_guard_registry.py
  python governance/compat/check_guard_registry.py --enforce
  python governance/compat/check_guard_registry.py --json
"""

from __future__ import annotations

import argparse
import datetime as dt
import json
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]

GUARD_DIR = REPO_ROOT / "governance" / "toolkit" / "05_OPERATION"
README_PATH = REPO_ROOT / "README.md"
KB_PATH = REPO_ROOT / "docs" / "CVF_CORE_KNOWLEDGE_BASE.md"

POLICY = "governance/toolkit/05_OPERATION/CVF_GUARD_REGISTRY_GUARD.md"


def _discover_guards() -> list[str]:
    """Find all *_GUARD.md files in the guard directory."""
    if not GUARD_DIR.exists():
        return []
    guards = sorted(
        f.name for f in GUARD_DIR.iterdir()
        if f.is_file() and f.name.endswith("_GUARD.md")
    )
    return guards


def _check_file_mentions(filepath: Path, guard_names: list[str]) -> dict[str, bool]:
    """Check which guard names appear in a file's content."""
    if not filepath.exists():
        return {name: False for name in guard_names}

    content = filepath.read_text(encoding="utf-8", errors="replace")
    results = {}
    for name in guard_names:
        # Check for the filename itself (with or without path)
        results[name] = name in content
    return results


def _run_check() -> dict:
    """Run the full guard registry check."""
    guards = _discover_guards()
    readme_mentions = _check_file_mentions(README_PATH, guards)
    kb_mentions = _check_file_mentions(KB_PATH, guards)

    violations = []
    registered = []

    for guard in guards:
        in_readme = readme_mentions.get(guard, False)
        in_kb = kb_mentions.get(guard, False)

        if in_readme and in_kb:
            registered.append({
                "guard": guard,
                "readme": True,
                "knowledgeBase": True,
            })
        else:
            missing_in = []
            if not in_readme:
                missing_in.append("README.md")
            if not in_kb:
                missing_in.append("docs/CVF_CORE_KNOWLEDGE_BASE.md")
            violations.append({
                "guard": guard,
                "readme": in_readme,
                "knowledgeBase": in_kb,
                "missingIn": missing_in,
                "message": (
                    f"`{guard}` is not registered in: {', '.join(missing_in)}. "
                    "All guards MUST be listed in both README.md and "
                    "CVF_CORE_KNOWLEDGE_BASE.md."
                ),
            })

    return {
        "timestamp": (
            dt.datetime.now(dt.timezone.utc)
            .replace(microsecond=0)
            .isoformat()
            .replace("+00:00", "Z")
        ),
        "policy": POLICY,
        "guardDirectory": str(GUARD_DIR.relative_to(REPO_ROOT)),
        "totalGuards": len(guards),
        "registeredCount": len(registered),
        "violationCount": len(violations),
        "registered": registered,
        "violations": violations,
        "compliant": len(violations) == 0,
    }


def _print_report(report: dict) -> None:
    print("=== CVF Guard Registry Gate ===")
    print(f"Guard directory: {report['guardDirectory']}")
    print(f"Total guards found: {report['totalGuards']}")
    print(f"Registered in both files: {report['registeredCount']}")
    print(f"Violations: {report['violationCount']}")

    if report["registered"]:
        print("\n✅ Registered guards:")
        for item in report["registered"]:
            print(f"  - {item['guard']}")

    if report["violations"]:
        print("\n❌ Unregistered guards:")
        for violation in report["violations"]:
            missing = ", ".join(violation["missingIn"])
            print(f"  - {violation['guard']} — missing in: {missing}")

    if report["compliant"]:
        print(f"\n✅ COMPLIANT — All {report['totalGuards']} guards are registered in README.md and CVF_CORE_KNOWLEDGE_BASE.md.")
    else:
        print("\n❌ VIOLATION — Some guards are not registered.")
        print("   Action required:")
        print("   1. Add guard row to README.md → Mandatory Guards table")
        print("   2. Add guard row to docs/CVF_CORE_KNOWLEDGE_BASE.md → Governance Guards table")
        print(f"   See: {POLICY}")


def main() -> int:
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(errors="replace")
    if hasattr(sys.stderr, "reconfigure"):
        sys.stderr.reconfigure(errors="replace")

    parser = argparse.ArgumentParser(
        description="CVF guard registry compatibility gate"
    )
    parser.add_argument(
        "--enforce",
        action="store_true",
        help="Return non-zero (exit 2) when unregistered guards are found",
    )
    parser.add_argument(
        "--json",
        action="store_true",
        help="Print JSON report to stdout instead of text",
    )
    args = parser.parse_args()

    report = _run_check()

    if args.json:
        print(json.dumps(report, indent=2))
    else:
        _print_report(report)

    if args.enforce and not report["compliant"]:
        return 2

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
