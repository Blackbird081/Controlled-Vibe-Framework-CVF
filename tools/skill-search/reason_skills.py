#!/usr/bin/env python
"""CVF Skill Reasoning Engine — auto-suggest skill chains by industry + task.

Matches user's task description against industry reasoning rules,
then outputs an ordered skill chain grouped by CVF phases.

Usage:
    python reason_skills.py "fintech dashboard"
    python reason_skills.py "beauty spa landing page"
    python reason_skills.py "mobile app for healthcare" --json
"""
from __future__ import annotations

import argparse
import csv
import json
import re
import sys
from pathlib import Path
from typing import Dict, List, Optional, Tuple

# Resolve paths
SCRIPT_DIR = Path(__file__).resolve().parent
REPO_ROOT = SCRIPT_DIR.parents[1]
DATA_DIR = (
    REPO_ROOT
    / "EXTENSIONS"
    / "CVF_v1.5.2_SKILL_LIBRARY_FOR_END_USERS"
    / "data"
)
REASONING_CSV = DATA_DIR / "skill_reasoning.csv"
INDEX_CSV = DATA_DIR / "skills_index.csv"

# Phase ordering
PHASE_ORDER = {
    "discovery": 0,
    "design": 1,
    "build": 2,
    "review": 3,
    "deploy": 4,
    "optimize": 5,
}


def load_reasoning_rules(path: Path) -> List[Dict[str, str]]:
    """Load skill_reasoning.csv."""
    if not path.exists():
        print(f"❌ Reasoning rules not found: {path}", file=sys.stderr)
        sys.exit(1)
    with open(path, encoding="utf-8") as f:
        return list(csv.DictReader(f))


def load_skill_index(path: Path) -> Dict[str, Dict[str, str]]:
    """Load skills_index.csv as dict keyed by skill_id."""
    if not path.exists():
        print(f"❌ Skill index not found: {path}", file=sys.stderr)
        sys.exit(1)
    with open(path, encoding="utf-8") as f:
        reader = csv.DictReader(f)
        return {row["skill_id"]: row for row in reader}


def normalize(text: str) -> str:
    """Normalize text for matching: lowercase, remove hyphens, map Vietnamese."""
    text = text.lower().replace("-", "").replace("_", " ")
    vi_map = {
        "thời trang": "fashion", "thương mại điện tử": "ecommerce",
        "sức khỏe": "healthcare", "y tế": "healthcare", "giáo dục": "education",
        "du lịch": "travel", "nhà hàng": "restaurant", "bất động sản": "realestate",
        "làm đẹp": "beauty", "trò chơi": "gaming", "tin tức": "media news",
        "tài chính": "fintech", "ngân hàng": "banking",
    }
    for vi, en in vi_map.items():
        if vi in text:
            text += " " + en
    return text


def match_rules(
    task: str, rules: List[Dict[str, str]]
) -> List[Tuple[Dict[str, str], float]]:
    """Match task description against reasoning rules. Returns (rule, score) pairs."""
    task_lower = normalize(task)
    matches: List[Tuple[Dict[str, str], float]] = []

    for rule in rules:
        pattern = rule["task_pattern"]
        industry = rule["industry"].lower()

        # Score based on pattern match + industry match
        score = 0.0

        # Check task_pattern (regex-style with | as OR)
        pattern_parts = [p.strip() for p in pattern.split("|")]
        pattern_matches = sum(1 for p in pattern_parts if p.lower() in task_lower)
        if pattern_matches > 0:
            score += pattern_matches * 10.0

        # Check industry name in task
        if industry in task_lower:
            score += 5.0

        # Partial industry keyword match
        industry_words = industry.split()
        for w in industry_words:
            if w.lower() in task_lower and len(w) >= 3:
                score += 2.0

        if score > 0:
            matches.append((rule, score))

    # Sort by score descending
    matches.sort(key=lambda x: x[1], reverse=True)
    return matches


def get_first_phase(phases_str: str) -> str:
    """Get the earliest phase from a comma-separated phases string."""
    phases = [p.strip().lower() for p in phases_str.split(",")]
    earliest = min(phases, key=lambda p: PHASE_ORDER.get(p, 99))
    return earliest.capitalize()


def group_by_phase(
    skill_ids: List[str], skill_index: Dict[str, Dict[str, str]]
) -> Dict[str, List[Dict[str, str]]]:
    """Group skills by their earliest CVF phase."""
    phase_groups: Dict[str, List[Dict[str, str]]] = {}

    for sid in skill_ids:
        info = skill_index.get(sid)
        if not info:
            # Skill not found in index — skip
            continue

        phase = get_first_phase(info.get("phases", "Build"))
        if phase not in phase_groups:
            phase_groups[phase] = []
        phase_groups[phase].append(info)

    # Sort phases by order
    sorted_groups: Dict[str, List[Dict[str, str]]] = {}
    for phase in sorted(phase_groups.keys(), key=lambda p: PHASE_ORDER.get(p.lower(), 99)):
        sorted_groups[phase] = phase_groups[phase]

    return sorted_groups


def print_result(
    task: str,
    industry: str,
    phase_groups: Dict[str, List[Dict[str, str]]],
    rationale: str,
    total_skills: int,
) -> None:
    """Pretty-print reasoning result."""
    print(f"\n🧠 Industry detected: {industry}")
    print(f"📋 Recommended Skill Chain ({total_skills} skills):")
    print()

    step = 1
    for phase, skills in phase_groups.items():
        print(f"  Phase: {phase} ({len(skills)} skills)")
        for skill in skills:
            risk = skill.get("risk_level", "R1")
            diff = skill.get("difficulty", "Medium")
            name = skill.get("skill_name", skill["skill_id"])
            desc = skill.get("description", "")[:80]
            print(f"    {step}. {name} ({risk}, {diff})")
            if desc:
                print(f"       → {desc}")
            step += 1
        print()

    print(f"  💡 Rationale: {rationale}")
    print()


def print_json_result(
    task: str,
    industry: str,
    phase_groups: Dict[str, List[Dict[str, str]]],
    rationale: str,
) -> None:
    """Print reasoning result as JSON."""
    phases = []
    step = 1
    for phase, skills in phase_groups.items():
        phase_obj = {
            "phase": phase,
            "skills": [],
        }
        for skill in skills:
            phase_obj["skills"].append({
                "step": step,
                "skill_id": skill["skill_id"],
                "skill_name": skill.get("skill_name", ""),
                "risk_level": skill.get("risk_level", ""),
                "difficulty": skill.get("difficulty", ""),
                "file_path": skill.get("file_path", ""),
            })
            step += 1
        phases.append(phase_obj)

    output = {
        "task": task,
        "industry": industry,
        "rationale": rationale,
        "total_skills": step - 1,
        "phases": phases,
    }
    print(json.dumps(output, ensure_ascii=False, indent=2))


def main():
    parser = argparse.ArgumentParser(
        description="🧠 CVF Skill Reasoning Engine",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  %(prog)s "fintech dashboard"
  %(prog)s "beauty spa landing page"
  %(prog)s "mobile app for healthcare" --json
  %(prog)s "e-commerce product listing" --max 5
        """,
    )
    parser.add_argument("task", help="Task description (free text)")
    parser.add_argument("--json", "-j", action="store_true", help="Output as JSON")
    parser.add_argument("--max", "-m", type=int, default=15, help="Max skills in chain (default: 15)")
    parser.add_argument("--all-matches", action="store_true", help="Show all matching rules")

    args = parser.parse_args()

    # Load data
    rules = load_reasoning_rules(REASONING_CSV)
    skill_index = load_skill_index(INDEX_CSV)

    # Match rules
    matches = match_rules(args.task, rules)

    if not matches:
        print(f"\n❌ No matching rules for: \"{args.task}\"")
        print("   Try including an industry name (fintech, healthcare, ecommerce, saas, etc.)")
        print("   Or use a task keyword (dashboard, landing page, mobile app, etc.)")
        sys.exit(0)

    if args.all_matches:
        print(f"\n📊 All matching rules for \"{args.task}\":")
        for rule, score in matches[:10]:
            print(f"  [{score:.1f}] {rule['industry']}: {rule['task_pattern']}")
        print()

    # Use best match
    best_rule, best_score = matches[0]
    industry = best_rule["industry"]
    rationale = best_rule["rationale"]
    skill_chain = best_rule["skill_chain"].split("|")

    # Limit chain length
    skill_chain = skill_chain[: args.max]

    # Group by phase
    phase_groups = group_by_phase(skill_chain, skill_index)
    total_skills = sum(len(s) for s in phase_groups.values())

    # Output
    if args.json:
        print_json_result(args.task, industry, phase_groups, rationale)
    else:
        print_result(args.task, industry, phase_groups, rationale, total_skills)


if __name__ == "__main__":
    main()
