#!/usr/bin/env python
"""Search CVF Skill Library using BM25 ranking.

Pure Python — no external dependencies required.

Usage:
    python search_skills.py "landing page conversion"
    python search_skills.py "security audit" --domain security_compliance
    python search_skills.py "design" --risk R0
    python search_skills.py "deploy" --phase Deploy
    python search_skills.py "testing" --json
    python search_skills.py "font" --top 3
"""
from __future__ import annotations

import argparse
import csv
import json
import sys
import time
from pathlib import Path
from typing import Dict, List, Optional

from bm25 import BM25

# Resolve paths
SCRIPT_DIR = Path(__file__).resolve().parent
REPO_ROOT = SCRIPT_DIR.parents[1]
DEFAULT_INDEX = (
    REPO_ROOT
    / "EXTENSIONS"
    / "CVF_v1.5.2_SKILL_LIBRARY_FOR_END_USERS"
    / "data"
    / "skills_index.csv"
)

# BM25 field weights
FIELD_WEIGHTS = {
    "skill_name": 3.0,
    "keywords": 2.5,
    "description": 2.0,
    "domain": 1.5,
    "phases": 1.0,
}

# Domain display names
DOMAIN_NAMES = {
    "ai_ml_evaluation": "AI/ML Evaluation",
    "app_development": "App Development",
    "business_analysis": "Business Analysis",
    "content_creation": "Content Creation",
    "finance_analytics": "Finance & Analytics",
    "hr_operations": "HR & Operations",
    "legal_contracts": "Legal & Contracts",
    "marketing_seo": "Marketing & SEO",
    "product_ux": "Product & UX",
    "security_compliance": "Security & Compliance",
    "technical_review": "Technical Review",
    "web_development": "Web Development",
}

# Difficulty icons
DIFFICULTY_ICONS = {
    "Easy": "⭐",
    "Medium": "⭐⭐",
    "Advanced": "⭐⭐⭐",
}


def load_index(path: Path) -> List[Dict[str, str]]:
    """Load skills_index.csv into list of dicts."""
    if not path.exists():
        print(f"❌ Index not found: {path}", file=sys.stderr)
        print("   Run: python tools/skill-index/generate_index.py", file=sys.stderr)
        sys.exit(1)

    with open(path, encoding="utf-8") as f:
        reader = csv.DictReader(f)
        return list(reader)


def build_engine(skills: List[Dict[str, str]]) -> BM25:
    """Build BM25 search engine from skills data."""
    engine = BM25(k1=1.5, b=0.75)
    fields = list(FIELD_WEIGHTS.keys())
    engine.index(skills, fields, FIELD_WEIGHTS)
    return engine


def filter_skills(
    skills: List[Dict[str, str]],
    domain: Optional[str] = None,
    risk: Optional[str] = None,
    phase: Optional[str] = None,
    difficulty: Optional[str] = None,
) -> List[Dict[str, str]]:
    """Pre-filter skills before search."""
    result = skills

    if domain:
        domain_lower = domain.lower().replace(" ", "_").replace("&", "")
        result = [s for s in result if domain_lower in s["domain"].lower()]

    if risk:
        risk_upper = risk.upper()
        result = [s for s in result if s["risk_level"].upper() == risk_upper]

    if phase:
        phase_lower = phase.lower()
        result = [s for s in result if phase_lower in s["phases"].lower()]

    if difficulty:
        diff_lower = difficulty.lower()
        result = [s for s in result if s["difficulty"].lower() == diff_lower]

    return result


def search(
    query: str,
    skills: List[Dict[str, str]],
    top_n: int = 10,
    domain: Optional[str] = None,
    risk: Optional[str] = None,
    phase: Optional[str] = None,
    difficulty: Optional[str] = None,
) -> List[Dict]:
    """Search skills and return ranked results."""
    # Apply filters
    filtered = filter_skills(skills, domain, risk, phase, difficulty)
    if not filtered:
        return []

    # Build engine on filtered set
    engine = build_engine(filtered)

    # Search
    results = engine.search(query, top_n=top_n)

    # Build result objects
    output = []
    for idx, score in results:
        skill = filtered[idx]
        output.append({
            "rank": len(output) + 1,
            "score": round(score, 2),
            "skill_id": skill["skill_id"],
            "skill_name": skill["skill_name"],
            "domain": skill["domain"],
            "domain_display": DOMAIN_NAMES.get(skill["domain"], skill["domain"]),
            "difficulty": skill["difficulty"],
            "risk_level": skill["risk_level"],
            "phases": skill["phases"],
            "description": skill["description"],
            "file_path": skill["file_path"],
        })

    return output


def print_results(results: List[Dict], query: str, elapsed_ms: float) -> None:
    """Pretty-print search results to terminal."""
    if not results:
        print(f"\n🔍 No results for \"{query}\"")
        print("   Try broader keywords or remove filters.")
        return

    print(f"\n🔍 Found {len(results)} skills for \"{query}\" ({elapsed_ms:.1f}ms):")
    print()

    for r in results:
        diff_icon = DIFFICULTY_ICONS.get(r["difficulty"], "")
        print(f"  {r['rank']}. [{r['score']:.1f}] {r['skill_id']}")
        print(f"     \"{r['skill_name']}\"")
        print(f"     {r['domain_display']} | {r['risk_level']} | {diff_icon} {r['difficulty']} | {r['phases']}")
        if r["description"]:
            desc = r["description"][:100]
            if len(r["description"]) > 100:
                desc += "..."
            print(f"     → {desc}")
        print()


def print_json(results: List[Dict], query: str, elapsed_ms: float) -> None:
    """Print results as JSON."""
    output = {
        "query": query,
        "elapsed_ms": round(elapsed_ms, 1),
        "count": len(results),
        "results": results,
    }
    print(json.dumps(output, ensure_ascii=False, indent=2))


def list_domains(skills: List[Dict[str, str]]) -> None:
    """List all domains with skill counts."""
    domain_counts: Dict[str, int] = {}
    for s in skills:
        d = s["domain"]
        domain_counts[d] = domain_counts.get(d, 0) + 1

    print("\n📂 CVF Skill Library Domains:")
    print()
    for domain in sorted(domain_counts.keys()):
        name = DOMAIN_NAMES.get(domain, domain)
        count = domain_counts[domain]
        print(f"  {name:25s} ({domain}) — {count} skills")
    print(f"\n  Total: {len(skills)} skills")


def main():
    parser = argparse.ArgumentParser(
        description="🔍 Search CVF Skill Library (BM25 ranking)",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  %(prog)s "landing page conversion"
  %(prog)s "security audit" --domain security_compliance
  %(prog)s "design" --risk R0
  %(prog)s "testing" --json --top 3
  %(prog)s --list-domains
        """,
    )
    parser.add_argument("query", nargs="?", help="Search query")
    parser.add_argument("--domain", "-d", help="Filter by domain")
    parser.add_argument("--risk", "-r", help="Filter by risk level (R0-R3)")
    parser.add_argument("--phase", "-p", help="Filter by CVF phase")
    parser.add_argument("--difficulty", help="Filter by difficulty (Easy/Medium/Advanced)")
    parser.add_argument("--top", "-n", type=int, default=10, help="Max results (default: 10)")
    parser.add_argument("--json", "-j", action="store_true", help="Output as JSON")
    parser.add_argument("--index", type=Path, default=DEFAULT_INDEX, help="Path to skills_index.csv")
    parser.add_argument("--list-domains", action="store_true", help="List all domains")

    args = parser.parse_args()

    # Load index
    skills = load_index(args.index)

    if args.list_domains:
        list_domains(skills)
        return

    if not args.query:
        parser.print_help()
        return

    # Search
    start = time.perf_counter()
    results = search(
        args.query,
        skills,
        top_n=args.top,
        domain=args.domain,
        risk=args.risk,
        phase=args.phase,
        difficulty=args.difficulty,
    )
    elapsed_ms = (time.perf_counter() - start) * 1000

    # Output
    if args.json:
        print_json(results, args.query, elapsed_ms)
    else:
        print_results(results, args.query, elapsed_ms)


if __name__ == "__main__":
    main()
