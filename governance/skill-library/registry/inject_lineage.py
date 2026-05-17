#!/usr/bin/env python3
"""
inject_lineage.py — Add data lineage (origin) tags to .gov.md files.

Detects skill origin based on content patterns and filename conventions,
then injects Origin row into the Governance table.

Usage:
    python inject_lineage.py --detect             # Detect and inject origins
    python inject_lineage.py --detect --dry-run   # Preview
    python inject_lineage.py --report             # Report lineage distribution
"""

from __future__ import annotations

import argparse
import re
import sys
from collections import Counter
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parents[3]
USER_REGISTRY_PATH = ROOT_DIR / "governance" / "skill-library" / "registry" / "user-skills"
SKILL_LIBRARY_PATH = ROOT_DIR / "EXTENSIONS" / "CVF_v1.5.2_SKILL_LIBRARY_FOR_END_USERS"

# Domains that were created as original CVF skills (numbered sequences)
ORIGINAL_CVF_DOMAINS = {
    "ai_ml_evaluation",
    "application_development",
    "business_strategy",
    "content_writing",
    "financial_analysis",
    "hr_operations",
    "legal_compliance",
    "tech_review",
    "web_templates",
}

# Known imported skill patterns (from awesome-cursorrules and similar)
IMPORTED_PATTERNS = [
    "adaptyv", "andrew_kane", "ccxt_php", "lazyllm", "litestream",
    "moai_domain", "onchainkit", "penpot", "refly", "tidb_test",
    "hugging_face", "numerai", "octocode", "montecarlo", "healthcheck",
    "playwriter", "dyadmulti",
]


def detect_origin(gov_path: Path, skill_path: Path | None) -> tuple[str, str]:
    """Detect origin based on filename patterns and content.
    Returns (origin_tag, origin_source).
    """
    name = gov_path.stem.lower()

    # Check if it's in an original CVF numbered domain
    if skill_path and skill_path.parent.name in ORIGINAL_CVF_DOMAINS:
        # Numbered files (01_, 02_, etc.) are original curated
        skill_name = skill_path.stem
        if re.match(r"^\d{2}_", skill_name):
            return ("CURATED", "CVF Original")

    # Check imported patterns
    for pattern in IMPORTED_PATTERNS:
        if pattern in name:
            return ("IMPORTED", "awesome-cursorrules")

    # Check content for adaptation markers
    if skill_path and skill_path.exists():
        content = skill_path.read_text(encoding="utf-8")
        if "CVF Version" in content and "Skill Version" in content:
            # Has CVF headers → adapted
            if any(p in name for p in IMPORTED_PATTERNS):
                return ("ADAPTED", "awesome-cursorrules + CVF format")
            return ("ADAPTED", "external + CVF format")

    # Default: if has CVF sections, likely adapted from external
    return ("ADAPTED", "external source")


def extract_source_link(gov_path: Path) -> Path | None:
    """Resolve the source .skill.md path from .gov.md."""
    text = gov_path.read_text(encoding="utf-8")
    lines = text.splitlines()
    in_source = False
    for line in lines:
        if line.strip() == "## Source":
            in_source = True
            continue
        if in_source and line.startswith("## "):
            break
        if in_source:
            m = re.search(r"\[[^\]]+\]\(([^)]+)\)", line)
            if m:
                link = m.group(1).strip()
                resolved = (gov_path.parent / link).resolve()
                return resolved if resolved.exists() else None
    return None


def has_origin_row(gov_path: Path) -> bool:
    """Check if .gov.md already has Origin row."""
    text = gov_path.read_text(encoding="utf-8")
    return "| Origin |" in text


def inject_origin(gov_path: Path, origin: str, source: str, dry_run: bool = False) -> bool:
    """Inject Origin row into Governance table."""
    text = gov_path.read_text(encoding="utf-8")
    icon = {
        "CURATED": "📝",
        "IMPORTED": "📥",
        "ADAPTED": "🔄",
        "GENERATED": "🤖",
        "VALIDATED": "✅",
    }.get(origin, "🔘")

    origin_row = f"| Origin | {icon} {origin} |"
    source_row = f"| Origin Source | {source} |"

    if "| Origin |" in text:
        # Update existing
        text = re.sub(r"\| Origin \|[^\n]+\|", origin_row, text)
        text = re.sub(r"\| Origin Source \|[^\n]+\|", source_row, text)
    else:
        # Insert after Autonomy row
        if "| Autonomy |" in text:
            text = text.replace(
                "| Autonomy |",
                "| Autonomy |",
                1,
            )
            # Find Autonomy line and add after it
            lines = text.splitlines()
            new_lines = []
            for line in lines:
                new_lines.append(line)
                if "| Autonomy |" in line and "Field" not in line:
                    new_lines.append(origin_row)
                    new_lines.append(source_row)
            text = "\n".join(new_lines)

    if dry_run:
        print(f"  [{origin}] {gov_path.name} <- {source}")
        return True

    gov_path.write_text(text, encoding="utf-8")
    return True


def main() -> int:
    parser = argparse.ArgumentParser(description="CVF Data Lineage Injector")
    parser.add_argument("--detect", action="store_true", help="Detect and inject origins")
    parser.add_argument("--report", action="store_true", help="Report lineage distribution")
    parser.add_argument("--dry-run", action="store_true", help="Preview without writing")
    args = parser.parse_args()

    if not args.detect and not args.report:
        parser.print_help()
        return 0

    gov_files = sorted(USER_REGISTRY_PATH.glob("USR-*.gov.md"))
    counts: Counter = Counter()

    for gf in gov_files:
        skill_path = extract_source_link(gf)
        origin, source = detect_origin(gf, skill_path)
        counts[origin] += 1

        if args.detect:
            inject_origin(gf, origin, source, dry_run=args.dry_run)

    print(f"\nLineage Distribution ({len(gov_files)} files):")
    for tag in ["CURATED", "IMPORTED", "ADAPTED", "GENERATED", "VALIDATED"]:
        icon = {"CURATED": "📝", "IMPORTED": "📥", "ADAPTED": "🔄", "GENERATED": "🤖", "VALIDATED": "✅"}.get(tag, "🔘")
        print(f"  {icon} {tag}: {counts.get(tag, 0)}")

    return 0


if __name__ == "__main__":
    sys.exit(main())
