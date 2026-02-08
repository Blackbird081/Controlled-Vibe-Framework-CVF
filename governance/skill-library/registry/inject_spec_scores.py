#!/usr/bin/env python3
"""
inject_spec_scores.py — Inject Spec Score blocks into .gov.md files.

Reads spec_metrics_report.json from the reports directory and injects
a ## Spec Score section into each .gov.md file with score, quality,
and per-section breakdown.

Usage:
    python inject_spec_scores.py              # Inject into all .gov.md
    python inject_spec_scores.py --dry-run    # Preview changes
    python inject_spec_scores.py --domain X   # Filter by domain
"""

from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parents[3]
USER_REGISTRY_PATH = ROOT_DIR / "governance" / "skill-library" / "registry" / "user-skills"
REPORTS_DIR = ROOT_DIR / "governance" / "skill-library" / "registry" / "reports"
SKILL_LIBRARY_PATH = ROOT_DIR / "EXTENSIONS" / "CVF_v1.5.2_SKILL_LIBRARY_FOR_END_USERS"


def load_metrics() -> dict:
    """Load the spec_metrics_report.json and index by skill filename."""
    report_path = REPORTS_DIR / "spec_metrics_report.json"
    if not report_path.exists():
        print(f"ERROR: {report_path} not found. Run report_spec_metrics.py first.")
        sys.exit(1)
    data = json.loads(report_path.read_text(encoding="utf-8"))
    # Index by skill_id (filename stem)
    index = {}
    for skill in data.get("skills", []):
        index[skill["skill_id"]] = skill
    return index


def extract_source_skill_id(gov_path: Path) -> str | None:
    """Extract the .skill.md filename from ## Source link in .gov.md."""
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
                # Return just the stem (no extension path)
                return Path(link).stem
    return None


def build_spec_score_block(skill_data: dict) -> str:
    """Build the ## Spec Score markdown block."""
    score = skill_data["spec_score"]
    quality = skill_data["spec_quality"]
    gate = skill_data["spec_gate"]
    
    icon = {"Excellent": "✅", "Good": "🟢", "Needs Review": "⚠️", "Not Ready": "❌"}.get(quality, "🔘")
    
    lines = [
        "",
        "---",
        "",
        "## Spec Score",
        "",
        "| Metric | Value |",
        "|--------|-------|",
        f"| Score | {score}/100 |",
        f"| Quality | {icon} {quality} |",
        f"| Gate | {gate} |",
    ]
    
    # Add breakdown if available
    breakdown = skill_data.get("score_breakdown", {})
    if breakdown:
        lines.append("")
        lines.append("**Section Breakdown:**")
        lines.append("")
        lines.append("| Section | Points | Status |")
        lines.append("|---------|--------|--------|")
        for section, info in sorted(breakdown.items()):
            if isinstance(info, dict):
                pts = info.get("score", info.get("points", 0))
                max_pts = info.get("max", 0)
                status = info.get("status", "")
                status_icon = {"PASS": "✅", "WEAK": "⚠️", "POOR": "🟡", "MISSING": "❌"}.get(status, "")
                lines.append(f"| {section} | {pts}/{max_pts} | {status_icon} {status} |")
    
    # Add improvement hints
    hints = skill_data.get("improvement_hints", "")
    if hints:
        lines.append("")
        lines.append(f"**Improvements:** {hints}")
    
    lines.append("")
    return "\n".join(lines)


def inject_score(gov_path: Path, skill_data: dict, dry_run: bool = False) -> bool:
    """Inject or replace ## Spec Score block in .gov.md. Returns True if changed."""
    text = gov_path.read_text(encoding="utf-8")
    new_block = build_spec_score_block(skill_data)
    
    if "## Spec Score" in text:
        # Replace existing block — find from ## Spec Score to next ## or ## Version Lock
        pattern = r"\n---\n\n## Spec Score\n.*?(?=\n---\n\n## |\Z)"
        new_text = re.sub(pattern, new_block, text, count=1, flags=re.DOTALL)
    else:
        # Insert before ## Version Lock if it exists, otherwise before ## UAT Binding
        if "## Version Lock" in text:
            new_text = text.replace("\n---\n\n## Version Lock", new_block + "\n---\n\n## Version Lock")
        elif "## UAT Binding" in text:
            new_text = text.replace("\n---\n\n## UAT Binding", new_block + "\n---\n\n## UAT Binding")
        else:
            new_text = text.rstrip() + "\n" + new_block
    
    if new_text == text:
        return False
    
    if dry_run:
        print(f"  [DRY-RUN] Would update {gov_path.name}")
        return True
    
    gov_path.write_text(new_text, encoding="utf-8")
    return True


def main() -> int:
    parser = argparse.ArgumentParser(description="Inject Spec Scores into .gov.md files")
    parser.add_argument("--dry-run", action="store_true", help="Preview without writing")
    parser.add_argument("--domain", help="Filter by domain name")
    args = parser.parse_args()
    
    metrics = load_metrics()
    gov_files = sorted(USER_REGISTRY_PATH.glob("USR-*.gov.md"))
    
    if args.domain:
        gov_files = [f for f in gov_files if args.domain.lower() in f.name.lower()]
    
    updated = 0
    skipped = 0
    no_match = 0
    
    for gf in gov_files:
        skill_id = extract_source_skill_id(gf)
        if not skill_id or skill_id not in metrics:
            no_match += 1
            continue
        
        if inject_score(gf, metrics[skill_id], dry_run=args.dry_run):
            updated += 1
        else:
            skipped += 1
    
    verb = "Would update" if args.dry_run else "Updated"
    print(f"\n{verb}: {updated} files")
    print(f"Skipped (no change): {skipped}")
    if no_match:
        print(f"No metrics match: {no_match}")
    
    return 0


if __name__ == "__main__":
    sys.exit(main())
