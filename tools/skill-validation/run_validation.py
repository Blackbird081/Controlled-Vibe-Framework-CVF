#!/usr/bin/env python
from __future__ import annotations

import argparse
import subprocess
import sys
from pathlib import Path


ROOT_DIR = Path(__file__).resolve().parents[2]
DEFAULT_SKILL_ROOT = ROOT_DIR / "EXTENSIONS" / "CVF_v1.5.2_SKILL_LIBRARY_FOR_END_USERS"
GOV_ROOT = ROOT_DIR / "governance" / "skill-library"


def run_step(label: str, args: list[str]) -> None:
    print(f"\n==> {label}")
    result = subprocess.call(args)
    if result != 0:
        raise SystemExit(result)


def main() -> int:
    parser = argparse.ArgumentParser(description="Run consolidated CVF skill validation pipeline.")
    parser.add_argument("--root", type=str, default=str(DEFAULT_SKILL_ROOT), help="Skill library root path.")
    parser.add_argument("--json", type=str, default="", help="Optional JSON report output path.")
    parser.add_argument("--strict", action="store_true", help="Treat warnings as errors.")
    parser.add_argument("--with-governance", action="store_true", help="Validate governance registry as well.")
    parser.add_argument("--with-spec-metrics", action="store_true", help="Generate spec metrics report.")
    args = parser.parse_args()

    validate_args = [
        sys.executable,
        str(ROOT_DIR / "tools" / "skill-validation" / "validate_skills.py"),
        "--root",
        args.root,
    ]
    if args.json:
        validate_args.extend(["--json", args.json])
    if args.strict:
        validate_args.append("--strict")

    run_step("Validate skill specs", validate_args)

    if args.with_spec_metrics:
        run_step("Generate spec metrics", [
            sys.executable,
            str(GOV_ROOT / "registry" / "report_spec_metrics.py"),
        ])

    if args.with_governance:
        run_step("Validate governance registry", [
            sys.executable,
            str(GOV_ROOT / "registry" / "validate_registry.py"),
        ])

    print("\nOK: Validation pipeline complete.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
