#!/usr/bin/env python
"""CVF Skill Planner — generate Skill Execution Plans from task descriptions.

Combines search + reasoning to produce a structured plan with skills
grouped by CVF phases, dependencies, and effort estimates.

Usage:
    python plan_skills.py --task "Tạo e-commerce mobile app cho thời trang"
    python plan_skills.py --task "fintech dashboard" --output plan.md
    python plan_skills.py --task "healthcare patient portal" --format json
"""
from __future__ import annotations

import argparse
import csv
import json
import re
import sys
from datetime import datetime
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

# Effort estimates by difficulty
EFFORT_MAP = {
    "Easy": 0.5,     # hours
    "Medium": 1.0,
    "Advanced": 2.0,
}


def load_csv(path: Path) -> List[Dict[str, str]]:
    if not path.exists():
        print(f"❌ File not found: {path}", file=sys.stderr)
        sys.exit(1)
    with open(path, encoding="utf-8") as f:
        return list(csv.DictReader(f))


def load_index_map(path: Path) -> Dict[str, Dict[str, str]]:
    rows = load_csv(path)
    return {row["skill_id"]: row for row in rows}


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


def detect_industry(task: str, rules: List[Dict[str, str]]) -> Tuple[str, Dict[str, str], float]:
    """Detect industry and best matching rule."""
    task_lower = normalize(task)
    best_rule = None
    best_score = 0.0
    best_industry = "Generic"

    for rule in rules:
        pattern = rule["task_pattern"]
        industry = rule["industry"]
        score = 0.0

        # Pattern match
        parts = [p.strip() for p in pattern.split("|")]
        for p in parts:
            if p.lower() in task_lower:
                score += 10.0

        # Industry name match
        if industry.lower() in task_lower:
            score += 5.0

        # Partial industry words
        for w in industry.lower().split():
            if w in task_lower and len(w) >= 3:
                score += 2.0

        if score > best_score:
            best_score = score
            best_rule = rule
            best_industry = industry

    if best_rule is None:
        # Fallback to generic "new project"
        for rule in rules:
            if rule["industry"] == "Generic" and "new project" in rule["task_pattern"]:
                best_rule = rule
                break

    return best_industry, best_rule, best_score


def get_first_phase(phases_str: str) -> str:
    phases = [p.strip().lower() for p in phases_str.split(",")]
    earliest = min(phases, key=lambda p: PHASE_ORDER.get(p, 99))
    return earliest.capitalize()


def build_plan(
    task: str,
    rule: Dict[str, str],
    skill_index: Dict[str, Dict[str, str]],
    max_skills: int = 15,
) -> Dict:
    """Build a structured Skill Execution Plan."""
    industry = rule["industry"]
    rationale = rule["rationale"]
    skill_ids = rule["skill_chain"].split("|")[:max_skills]

    # Build phase groups
    phases: Dict[str, List[Dict]] = {}
    step = 0
    total_effort = 0.0

    for sid in skill_ids:
        info = skill_index.get(sid)
        if not info:
            continue

        phase = get_first_phase(info.get("phases", "Build"))
        if phase not in phases:
            phases[phase] = []

        step += 1
        difficulty = info.get("difficulty", "Medium")
        effort = EFFORT_MAP.get(difficulty, 1.0)
        total_effort += effort

        phases[phase].append({
            "step": step,
            "skill_id": sid,
            "skill_name": info.get("skill_name", sid),
            "risk_level": info.get("risk_level", "R1"),
            "difficulty": difficulty,
            "description": info.get("description", ""),
            "file_path": info.get("file_path", ""),
            "effort_hours": effort,
        })

    # Sort phases
    sorted_phases = []
    for phase_name in sorted(phases.keys(), key=lambda p: PHASE_ORDER.get(p.lower(), 99)):
        sorted_phases.append({
            "phase": phase_name,
            "skills": phases[phase_name],
        })

    # Effort in days (assume 6 productive hours)
    effort_days = max(1, round(total_effort / 6))
    effort_range = f"{effort_days}-{effort_days + 1} days"

    return {
        "task": task,
        "industry": industry,
        "generated": datetime.now().strftime("%Y-%m-%d"),
        "total_skills": step,
        "estimated_effort": effort_range,
        "total_hours": round(total_effort, 1),
        "rationale": rationale,
        "phases": sorted_phases,
    }


def generate_markdown(plan: Dict) -> str:
    """Generate markdown Skill Execution Plan."""
    lines = []
    lines.append("# Skill Execution Plan")
    lines.append("")
    lines.append(f"> **Task:** {plan['task']}")
    lines.append(f"> **Industry:** {plan['industry']}")
    lines.append(f"> **Generated:** {plan['generated']}")
    lines.append(f"> **Total Skills:** {plan['total_skills']}")
    lines.append(f"> **Estimated Effort:** {plan['estimated_effort']} (~{plan['total_hours']}h)")
    lines.append("")
    lines.append("---")
    lines.append("")

    for phase_obj in plan["phases"]:
        phase = phase_obj["phase"]
        skills = phase_obj["skills"]
        lines.append(f"## Phase: {phase} ({len(skills)} skills)")
        lines.append("")

        for skill in skills:
            lines.append(f"### {skill['step']}. {skill['skill_name']}")
            lines.append("")
            lines.append(f"- **File:** `{skill['file_path']}`")
            lines.append(f"- **Risk:** {skill['risk_level']} | **Difficulty:** {skill['difficulty']} | **~{skill['effort_hours']}h**")
            if skill["description"]:
                lines.append(f"- **Purpose:** {skill['description'][:150]}")
            lines.append("")

        lines.append("---")
        lines.append("")

    # Dependencies
    lines.append("## Dependencies")
    lines.append("")
    total = plan["total_skills"]
    if total >= 2:
        lines.append(f"- Skills should be executed in order within each phase")
        lines.append(f"- Phase transitions: complete all skills in current phase before moving to next")
        if total >= 4:
            lines.append(f"- Style decisions (steps 1-3) inform all subsequent design choices")
    lines.append("")

    # Rationale
    lines.append("## Rationale")
    lines.append("")
    lines.append(f"> {plan['rationale']}")
    lines.append("")
    lines.append("---")
    lines.append("")
    lines.append(f"*Generated by CVF Skill Planner | {plan['generated']}*")

    return "\n".join(lines)


def print_plan(plan: Dict) -> None:
    """Print plan to terminal (condensed format)."""
    print(f"\n📋 SKILL EXECUTION PLAN")
    print(f"━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
    print(f"  Task:     {plan['task']}")
    print(f"  Industry: {plan['industry']}")
    print(f"  Skills:   {plan['total_skills']}")
    print(f"  Effort:   {plan['estimated_effort']} (~{plan['total_hours']}h)")
    print()

    for phase_obj in plan["phases"]:
        phase = phase_obj["phase"]
        skills = phase_obj["skills"]
        print(f"  ── Phase: {phase} ({len(skills)} skills) ──")
        for skill in skills:
            risk = skill["risk_level"]
            diff = skill["difficulty"]
            print(f"    {skill['step']}. {skill['skill_name']} ({risk}, {diff})")
            if skill["description"]:
                desc = skill["description"][:70]
                print(f"       → {desc}")
        print()

    print(f"  💡 {plan['rationale']}")
    print()


def main():
    parser = argparse.ArgumentParser(
        description="📋 CVF Skill Planner — Generate Skill Execution Plans",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  %(prog)s --task "Tạo e-commerce mobile app cho thời trang"
  %(prog)s --task "fintech dashboard" --output plan.md
  %(prog)s --task "healthcare patient portal" --format json
  %(prog)s --task "beauty spa booking" --max 5
        """,
    )
    parser.add_argument("--task", "-t", required=True, help="Task description")
    parser.add_argument("--output", "-o", type=Path, help="Save plan to file")
    parser.add_argument("--format", "-f", choices=["md", "json", "terminal"], default="terminal", help="Output format")
    parser.add_argument("--max", "-m", type=int, default=15, help="Max skills (default: 15)")

    args = parser.parse_args()

    # Load data
    rules = load_csv(REASONING_CSV)
    skill_index = load_index_map(INDEX_CSV)

    # Detect industry + match rule
    industry, rule, score = detect_industry(args.task, rules)

    if not rule:
        print(f"\n❌ Could not match task: \"{args.task}\"")
        print("   Try including an industry or task keyword.")
        sys.exit(1)

    # Build plan
    plan = build_plan(args.task, rule, skill_index, max_skills=args.max)

    # Output
    if args.format == "json":
        output = json.dumps(plan, ensure_ascii=False, indent=2)
        if args.output:
            args.output.write_text(output, encoding="utf-8")
            print(f"✅ Plan saved to: {args.output}")
        else:
            print(output)

    elif args.format == "md":
        md = generate_markdown(plan)
        if args.output:
            args.output.parent.mkdir(parents=True, exist_ok=True)
            args.output.write_text(md, encoding="utf-8")
            print(f"✅ Plan saved to: {args.output}")
        else:
            print(md)

    else:  # terminal
        print_plan(plan)
        if args.output:
            md = generate_markdown(plan)
            args.output.parent.mkdir(parents=True, exist_ok=True)
            args.output.write_text(md, encoding="utf-8")
            print(f"  📄 Also saved to: {args.output}")


if __name__ == "__main__":
    main()
