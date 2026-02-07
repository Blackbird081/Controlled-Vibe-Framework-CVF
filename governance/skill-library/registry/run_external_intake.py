#!/usr/bin/env python3
"""
One-command pipeline for external skill intake.
"""

from __future__ import annotations

import argparse
import os
import subprocess
import sys
from pathlib import Path


ROOT_DIR = Path(__file__).resolve().parents[3]
GOV_ROOT = ROOT_DIR / "governance" / "skill-library"


def run_step(label: str, args: list[str]) -> None:
    print(f"\n==> {label}")
    result = subprocess.call(args)
    if result != 0:
        raise SystemExit(result)


def main() -> int:
    parser = argparse.ArgumentParser(description="Run external intake pipeline end-to-end.")
    parser.add_argument("--limit", type=int, default=50, help="Total skills to import.")
    parser.add_argument("--per-category", type=int, default=50, help="Items per query/category.")
    args = parser.parse_args()

    if not os.environ.get("SKILLSMP_API_KEY"):
        raise SystemExit("Missing SKILLSMP_API_KEY environment variable.")

    py = sys.executable
    run_step("Import shortlist (SkillsMP)", [
        py,
        str(GOV_ROOT / "registry" / "import_skillsmp.py"),
        "--limit",
        str(args.limit),
        "--per-category",
        str(args.per_category),
    ])

    run_step("Convert shortlist → CVF skills", [
        py,
        str(GOV_ROOT / "registry" / "convert_shortlist_to_cvf.py"),
        "--limit",
        str(args.limit),
    ])

    run_step("Inject autonomous extension", [
        py,
        str(GOV_ROOT / "registry" / "inject_autonomous_extension.py"),
    ])

    run_step("Generate mapping records", [
        py,
        str(GOV_ROOT / "registry" / "generate_mapping_records.py"),
    ])

    run_step("Generate UAT records", [
        py,
        str(GOV_ROOT / "uat" / "generate_uat_records.py"),
    ])

    run_step("Score UAT records", [
        py,
        str(GOV_ROOT / "uat" / "score_uat.py"),
    ])

    run_step("Validate skill specs", [
        py,
        str(ROOT_DIR / "tools" / "skill-validation" / "validate_skills.py"),
        "--root",
        str(ROOT_DIR / "EXTENSIONS" / "CVF_v1.5.2_SKILL_LIBRARY_FOR_END_USERS"),
    ])

    run_step("Generate governance registry", [
        py,
        str(GOV_ROOT / "registry" / "generate_user_skills.py"),
    ])

    run_step("Validate governance registry", [
        py,
        str(GOV_ROOT / "registry" / "validate_registry.py"),
    ])

    print("\n✅ External intake pipeline completed.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
