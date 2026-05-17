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
    parser.add_argument("--min-stars", type=int, default=10, help="Minimum stars to keep.")
    parser.add_argument("--min-desc", type=int, default=120, help="Minimum description length to keep.")
    parser.add_argument("--similarity-threshold", type=float, default=0.86, help="Jaccard similarity threshold.")
    parser.add_argument("--allow-missing-source", action="store_true", help="Allow skills without source URL.")
    parser.add_argument("--api-key", type=str, default="", help="SkillsMP API key (optional).")
    parser.add_argument("--refresh-template", action="store_true", help="Re-render existing skills from shortlist.")
    args = parser.parse_args()

    if not os.environ.get("SKILLSMP_API_KEY") and not args.api_key:
        raise SystemExit("Missing SKILLSMP_API_KEY environment variable.")

    py = sys.executable
    import_args = [
        py,
        str(GOV_ROOT / "registry" / "import_skillsmp.py"),
        "--limit",
        str(args.limit),
        "--per-category",
        str(args.per_category),
        "--min-stars",
        str(args.min_stars),
        "--min-desc",
        str(args.min_desc),
        "--similarity-threshold",
        str(args.similarity_threshold),
    ]
    if args.api_key:
        import_args.extend(["--api-key", args.api_key])
    if not args.allow_missing_source:
        import_args.append("--require-source")
    run_step("Import shortlist (SkillsMP)", import_args)

    convert_args = [
        py,
        str(GOV_ROOT / "registry" / "convert_shortlist_to_cvf.py"),
        "--limit",
        str(args.limit),
    ]
    if args.refresh_template:
        convert_args.append("--refresh-template")
    run_step("Convert shortlist -> CVF skills", convert_args)

    run_step("Deduplicate skill library", [
        py,
        str(GOV_ROOT / "registry" / "dedupe_skill_library.py"),
    ])

    run_step("Inject autonomous extension", [
        py,
        str(GOV_ROOT / "registry" / "inject_autonomous_extension.py"),
    ])

    run_step("Clean mapping records", [
        py,
        str(GOV_ROOT / "registry" / "clean_mapping_records.py"),
    ])

    run_step("Clean UAT results", [
        py,
        str(GOV_ROOT / "uat" / "clean_uat_results.py"),
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

    run_step("Clean user registry", [
        py,
        str(GOV_ROOT / "registry" / "clean_user_registry.py"),
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

    print("\nOK: External intake pipeline completed.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
