#!/usr/bin/env python3
"""
Import and shortlist skills from SkillsMP for CVF governance intake.

Requires:
- SKILLSMP_API_KEY environment variable (Bearer token)

Outputs:
- governance/skill-library/registry/external-sources/skillsmp/skillsmp_shortlist.json
- governance/skill-library/registry/external-sources/skillsmp/skillsmp_shortlist.csv
- governance/skill-library/registry/external-sources/skillsmp/skillsmp_shortlist.md
"""

from __future__ import annotations

import argparse
import csv
import json
import os
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Tuple
from urllib.parse import urlparse

import urllib.parse
import urllib.request


ROOT_DIR = Path(__file__).resolve().parents[3]
OUTPUT_DIR = (
    ROOT_DIR
    / "governance"
    / "skill-library"
    / "registry"
    / "external-sources"
    / "skillsmp"
)

BASE_URL = "https://skillsmp.com/api/v1"

PRIORITY_QUERIES = [
    "app development",
    "software architecture",
    "backend",
    "frontend",
    "api design",
    "database schema",
    "testing",
    "devops",
    "cloud",
    "mobile app",
    "web app",
    "code review",
]

SECONDARY_QUERIES = [
    "ai evaluation",
    "prompt evaluation",
    "security audit",
    "privacy policy",
    "legal contract",
    "finance analysis",
    "hr operations",
    "marketing seo",
    "content writing",
    "product ux",
    "user research",
    "business analysis",
]

CVF_DOMAIN_MAP: List[Tuple[str, List[str]]] = [
    ("app_development", ["development", "frontend", "backend", "api", "database", "testing", "devops", "cloud", "mobile"]),
    ("web_development", ["frontend", "backend", "api", "development"]),
    ("technical_review", ["testing", "security", "backend", "frontend", "devops"]),
    ("ai_ml_evaluation", ["ai-ml", "data"]),
    ("security_compliance", ["security"]),
    ("product_ux", ["design", "product"]),
    ("marketing_seo", ["marketing"]),
    ("content_creation", ["writing", "design"]),
    ("finance_analytics", ["finance"]),
    ("legal_contracts", ["legal"]),
    ("hr_operations", ["hr"]),
    ("business_analysis", ["management", "productivity", "research", "sales", "support"]),
]

QUERY_DOMAIN_MAP = {
    "ai evaluation": "ai_ml_evaluation",
    "prompt evaluation": "ai_ml_evaluation",
    "security audit": "security_compliance",
    "privacy policy": "security_compliance",
    "legal contract": "legal_contracts",
    "finance analysis": "finance_analytics",
    "hr operations": "hr_operations",
    "marketing seo": "marketing_seo",
    "content writing": "content_creation",
    "product ux": "product_ux",
    "user research": "product_ux",
    "business analysis": "business_analysis",
}


def get_api_key() -> str:
    key = os.environ.get("SKILLSMP_API_KEY", "").strip()
    if not key:
        raise RuntimeError("Missing SKILLSMP_API_KEY environment variable")
    return key


def fetch_json(path: str, params: Dict[str, Any] | None = None) -> Dict[str, Any]:
    url = f"{BASE_URL}{path}"
    if params:
        url = f"{url}?{urllib.parse.urlencode(params)}"

    request = urllib.request.Request(url)
    request.add_header("Authorization", f"Bearer {get_api_key()}")
    request.add_header("Accept", "application/json")
    request.add_header("User-Agent", "CVF-Registry-Importer/1.0")

    try:
        with urllib.request.urlopen(request, timeout=30) as response:
            status = response.getcode()
            body = response.read().decode("utf-8")
    except Exception as exc:
        raise RuntimeError(f"SkillsMP API error: {exc}") from exc

    if status != 200:
        raise RuntimeError(f"SkillsMP API error {status}: {body}")

    data = json.loads(body)
    if isinstance(data, dict) and data.get("success") is False:
        raise RuntimeError(f"SkillsMP API error: {data}")
    return data


def search_skills(query: str, limit: int = 100, sort_by: str = "stars") -> List[Dict[str, Any]]:
    try:
        payload = fetch_json(
            "/skills/search",
            params={"q": query, "limit": limit, "sortBy": sort_by},
        )
    except RuntimeError:
        return []
    data = payload.get("data") if isinstance(payload, dict) else None
    if isinstance(data, list):
        return data
    if isinstance(data, dict) and isinstance(data.get("skills"), list):
        return data["skills"]
    if isinstance(payload, dict) and isinstance(payload.get("skills"), list):
        return payload["skills"]
    return []


def parse_updated_at(skill: Dict[str, Any]) -> datetime | None:
    for key in ("updatedAt", "updated_at", "lastUpdated", "updated"):
        value = skill.get(key)
        if isinstance(value, str):
            try:
                return datetime.fromisoformat(value.replace("Z", "+00:00"))
            except ValueError:
                continue
        if isinstance(value, (int, float)):
            try:
                return datetime.fromtimestamp(value, tz=timezone.utc)
            except (OSError, OverflowError):
                continue
    return None


def extract_categories(skill: Dict[str, Any]) -> List[str]:
    raw = skill.get("categories") or skill.get("category") or []
    if isinstance(raw, str):
        return [raw]
    if isinstance(raw, list):
        return [str(x).lower() for x in raw]
    return []


def compute_score(skill: Dict[str, Any], priority_hit: bool) -> float:
    stars = float(skill.get("stars") or 0)
    updated = parse_updated_at(skill)
    recency_bonus = 0.0
    if updated:
        days = (datetime.now(timezone.utc) - updated).days
        recency_bonus = max(0.0, 365.0 - float(days)) / 365.0 * 100.0
    weight = 1.15 if priority_hit else 1.0
    return (stars * 1.0 + recency_bonus * 0.5) * weight


def map_to_cvf_domain(categories: List[str]) -> str:
    for domain, slugs in CVF_DOMAIN_MAP:
        if any(cat in slugs for cat in categories):
            return domain
    return "app_development"


def skill_key(skill: Dict[str, Any]) -> str:
    if skill.get("id"):
        return str(skill["id"])
    owner = skill.get("owner") or ""
    repo = skill.get("repo") or ""
    if owner and repo:
        return f"{owner}/{repo}"
    return json.dumps(skill, sort_keys=True)


def normalize_skill(skill: Dict[str, Any], priority_hit: bool, hint_domain: str | None, matched_query: str) -> Dict[str, Any]:
    categories = extract_categories(skill)
    owner = skill.get("owner") or skill.get("author") or ""
    repo = skill.get("repo") or ""
    source_url = skill.get("githubUrl") or skill.get("repoUrl") or skill.get("url") or skill.get("skillUrl") or ""
    if not source_url and owner and repo:
        source_url = f"https://github.com/{owner}/{repo}"

    updated = parse_updated_at(skill)
    cvf_domain = map_to_cvf_domain(categories)
    if not categories and hint_domain:
        cvf_domain = hint_domain
    return {
        "id": skill.get("id"),
        "name": skill.get("name") or skill.get("title") or f"{owner}/{repo}",
        "description": skill.get("description") or "",
        "owner": owner,
        "repo": repo,
        "stars": skill.get("stars") or 0,
        "forks": skill.get("forks") or 0,
        "updatedAt": updated.isoformat() if updated else None,
        "categories": categories,
        "platforms": skill.get("platforms") or [],
        "source": source_url,
        "cvf_domain": cvf_domain,
        "priority_hit": priority_hit,
        "score": round(compute_score(skill, priority_hit), 2),
        "matched_query": matched_query,
        "repo_key": repo_key_from_source(source_url),
    }


def repo_key_from_source(source: str) -> str:
    if not source:
        return ""
    parsed = urlparse(source)
    if parsed.netloc and "github.com" in parsed.netloc.lower():
        parts = [p for p in parsed.path.split("/") if p]
        if len(parts) >= 2:
            return f"{parts[0].lower()}/{parts[1].lower()}"
    return source.split("?")[0].lower()


def select_skills(skills: List[Dict[str, Any]], limit: int, priority_slugs: List[str]) -> List[Dict[str, Any]]:
    unique: Dict[str, Dict[str, Any]] = {}
    for skill in skills:
        key = skill_key(skill)
        current = unique.get(key)
        if not current or skill["score"] > current["score"]:
            unique[key] = skill

    deduped_by_repo: Dict[str, Dict[str, Any]] = {}
    for skill in unique.values():
        repo_key = skill.get("repo_key") or ""
        if not repo_key:
            repo_key = skill_key(skill)
        current = deduped_by_repo.get(repo_key)
        if not current:
            deduped_by_repo[repo_key] = skill
            continue
        if len(skill.get("description", "")) > len(current.get("description", "")) or skill["score"] > current["score"]:
            deduped_by_repo[repo_key] = skill

    deduped = list(deduped_by_repo.values())
    priority_candidates = [s for s in deduped if s["priority_hit"]]
    secondary_candidates = [s for s in deduped if not s["priority_hit"]]

    priority_candidates.sort(key=lambda x: x["score"], reverse=True)
    secondary_candidates.sort(key=lambda x: x["score"], reverse=True)

    target_priority = int(limit * 0.6)
    selected = priority_candidates[:target_priority]

    remaining = limit - len(selected)
    selected.extend(secondary_candidates[:remaining])

    if len(selected) < limit:
        rest = [s for s in deduped if s not in selected]
        rest.sort(key=lambda x: x["score"], reverse=True)
        selected.extend(rest[: (limit - len(selected))])

    return selected[:limit]


def write_outputs(skills: List[Dict[str, Any]], limit: int) -> None:
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    json_path = OUTPUT_DIR / "skillsmp_shortlist.json"
    csv_path = OUTPUT_DIR / "skillsmp_shortlist.csv"
    md_path = OUTPUT_DIR / "skillsmp_shortlist.md"

    skills_sorted = sorted(skills, key=lambda x: x["score"], reverse=True)

    json_path.write_text(
        json.dumps(
            {
                "generatedAt": datetime.now(timezone.utc).isoformat(),
                "total": len(skills_sorted),
                "limit": limit,
                "skills": skills_sorted,
            },
            ensure_ascii=False,
            indent=2,
        ),
        encoding="utf-8",
    )

    with csv_path.open("w", newline="", encoding="utf-8") as handle:
        writer = csv.DictWriter(
            handle,
            fieldnames=[
                "rank",
                "name",
                "owner",
                "repo",
                "stars",
                "updatedAt",
                "categories",
                "matched_query",
                "cvf_domain",
                "source",
                "score",
            ],
        )
        writer.writeheader()
        for idx, skill in enumerate(skills_sorted, start=1):
            writer.writerow(
                {
                    "rank": idx,
                    "name": skill["name"],
                    "owner": skill["owner"],
                    "repo": skill["repo"],
                    "stars": skill["stars"],
                    "updatedAt": skill["updatedAt"],
                    "categories": ",".join(skill["categories"]),
                    "matched_query": skill.get("matched_query", ""),
                    "cvf_domain": skill["cvf_domain"],
                    "source": skill["source"],
                    "score": skill["score"],
                }
            )

    domain_counts: Dict[str, int] = {}
    for skill in skills_sorted:
        domain_counts[skill["cvf_domain"]] = domain_counts.get(skill["cvf_domain"], 0) + 1

    md_lines = [
        "# SkillsMP Shortlist (CVF Intake)",
        "",
        f"> **Total Selected:** {len(skills_sorted)}  ",
        f"> **Generated:** {datetime.now(timezone.utc).strftime('%b %d, %Y')}  ",
        f"> **Priority:** App development (then existing CVF domains)",
        "",
        "## Distribution by CVF Domain",
        "",
    ]

    for domain, count in sorted(domain_counts.items(), key=lambda x: (-x[1], x[0])):
        md_lines.append(f"- {domain}: {count}")

    md_lines.extend(
        [
            "",
            "## Shortlist",
            "",
            "| Rank | Skill | Stars | Updated | Categories | Query | CVF Domain | Source |",
            "|------|-------|-------|---------|------------|-------|------------|--------|",
        ]
    )

    for idx, skill in enumerate(skills_sorted, start=1):
        categories = ", ".join(skill["categories"]) or "-"
        updated = skill["updatedAt"] or "-"
        source = skill["source"] or "-"
        matched_query = skill.get("matched_query") or "-"
        md_lines.append(
            f"| {idx} | {skill['name']} | {skill['stars']} | {updated} | {categories} | {matched_query} | {skill['cvf_domain']} | {source} |"
        )

    md_path.write_text("\n".join(md_lines) + "\n", encoding="utf-8")


def main() -> int:
    parser = argparse.ArgumentParser(description="Import SkillsMP skills for CVF intake.")
    parser.add_argument("--limit", type=int, default=50, help="Total skills to select.")
    parser.add_argument("--per-category", type=int, default=100, help="Items per category to fetch.")
    args = parser.parse_args()

    priority = list(PRIORITY_QUERIES)
    secondary = list(SECONDARY_QUERIES)

    all_skills: List[Dict[str, Any]] = []

    for query in priority + secondary:
        fetched = search_skills(query, limit=args.per_category, sort_by="stars")
        for skill in fetched:
            priority_hit = query in priority
            hint_domain = QUERY_DOMAIN_MAP.get(query, "app_development" if priority_hit else None)
            all_skills.append(normalize_skill(skill, priority_hit, hint_domain, query))

    if not all_skills:
        raise RuntimeError("No skills fetched from SkillsMP API. Check API key or categories.")

    selected = select_skills(all_skills, args.limit, priority)
    write_outputs(selected, args.limit)

    print(f"Fetched queries: {len(priority) + len(secondary)}")
    print(f"Total candidates: {len(all_skills)}")
    print(f"Selected: {len(selected)}")
    print(f"Output: {OUTPUT_DIR}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
