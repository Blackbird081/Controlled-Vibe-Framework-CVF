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
import hashlib
import json
import os
import re
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Tuple
from urllib.parse import urlparse

import urllib.parse
import urllib.request


ROOT_DIR = Path(__file__).resolve().parents[3]
SKILL_LIBRARY_PATH = ROOT_DIR / "EXTENSIONS" / "CVF_v1.5.2_SKILL_LIBRARY_FOR_END_USERS"
OUTPUT_DIR = (
    ROOT_DIR
    / "governance"
    / "skill-library"
    / "registry"
    / "external-sources"
    / "skillsmp"
)
RAW_DIR = OUTPUT_DIR / "raw"
EXTERNAL_INDEX_PATH = ROOT_DIR / "governance" / "skill-library" / "registry" / "external-sources" / "index.json"

BASE_URL = "https://skillsmp.com/api/v1"
SOURCE_NAME = "skillsmp"
API_KEY_OVERRIDE: str | None = None

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
    if API_KEY_OVERRIDE:
        return API_KEY_OVERRIDE
    key = os.environ.get("SKILLSMP_API_KEY", "").strip()
    if not key:
        raise RuntimeError("Missing SKILLSMP_API_KEY environment variable or --api-key")
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


def normalize_name(value: str) -> str:
    value = value.lower().strip()
    value = re.sub(r"[^a-z0-9]+", "_", value)
    return value.strip("_")


def normalize_text(value: str) -> str:
    value = (value or "").lower().strip()
    value = re.sub(r"[^a-z0-9]+", " ", value)
    return re.sub(r"\\s+", " ", value).strip()


def description_fingerprint(text: str) -> str:
    normalized = normalize_text(text)
    if not normalized:
        return ""
    digest = hashlib.sha1(normalized.encode("utf-8")).hexdigest()
    return digest[:12]


def token_set(text: str, max_tokens: int = 80) -> List[str]:
    normalized = normalize_text(text)
    if not normalized:
        return []
    tokens = [t for t in normalized.split(" ") if len(t) > 2]
    if not tokens:
        return []
    unique = []
    seen = set()
    for tok in tokens:
        if tok in seen:
            continue
        unique.append(tok)
        seen.add(tok)
        if len(unique) >= max_tokens:
            break
    return unique


def jaccard_similarity(a: List[str], b: List[str]) -> float:
    if not a or not b:
        return 0.0
    set_a = set(a)
    set_b = set(b)
    inter = set_a.intersection(set_b)
    union = set_a.union(set_b)
    if not union:
        return 0.0
    return len(inter) / len(union)


def extract_title(text: str) -> str:
    match = re.search(r"^#\s+(.+)$", text, re.MULTILINE)
    return match.group(1).strip() if match else ""


def extract_source(text: str) -> str:
    for line in text.splitlines():
        line = line.strip()
        if line.startswith("- Nguồn tham khảo:") or line.startswith("- Source:"):
            return line.split(":", 1)[1].strip()
    return ""


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
    name = skill.get("name") or skill.get("title") or f"{owner}/{repo}"
    cvf_domain = map_to_cvf_domain(categories)
    if not categories and hint_domain:
        cvf_domain = hint_domain
    repo_key = external_key_for_skill(source_url, name)
    return {
        "id": skill.get("id"),
        "name": name,
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
        "repo_key": repo_key,
        "desc_fingerprint": description_fingerprint(skill.get("description") or ""),
        "desc_tokens": token_set(skill.get("description") or ""),
        "source_type": SOURCE_NAME,
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


def external_key_for_skill(source: str, name: str) -> str:
    repo_key = repo_key_from_source(source)
    if repo_key:
        return repo_key
    name_key = normalize_name(name)
    if name_key:
        return f"name:{name_key}"
    return ""


def load_existing_index() -> Tuple[set[str], set[str]]:
    repo_keys: set[str] = set()
    name_keys: set[str] = set()
    if not SKILL_LIBRARY_PATH.exists():
        return repo_keys, name_keys

    for path in SKILL_LIBRARY_PATH.rglob("*.skill.md"):
        text = path.read_text(encoding="utf-8", errors="ignore")
        title = extract_title(text) or path.stem
        name_keys.add(normalize_name(title))
        source = extract_source(text)
        if source:
            repo_keys.add(repo_key_from_source(source))
    return repo_keys, name_keys


def is_existing_skill(skill: Dict[str, Any], repo_keys: set[str], name_keys: set[str]) -> bool:
    repo_key = skill.get("repo_key") or repo_key_from_source(skill.get("source", ""))
    if repo_key and repo_key in repo_keys:
        return True
    name_key = normalize_name(str(skill.get("name") or ""))
    return bool(name_key) and name_key in name_keys


def load_external_index() -> Dict[str, Any]:
    if not EXTERNAL_INDEX_PATH.exists():
        return {"repos": {}}
    try:
        payload = json.loads(EXTERNAL_INDEX_PATH.read_text(encoding="utf-8"))
        if isinstance(payload, dict) and isinstance(payload.get("repos"), dict):
            return payload
        return {"repos": {}}
    except json.JSONDecodeError:
        return {"repos": {}}


def update_external_index(skills: List[Dict[str, Any]]) -> None:
    index = load_external_index()
    repos = index.setdefault("repos", {})
    now = datetime.now(timezone.utc).isoformat()
    for skill in skills:
        repo_key = skill.get("repo_key") or external_key_for_skill(skill.get("source", ""), skill.get("name", ""))
        if not repo_key:
            continue
        entry = repos.get(repo_key) or {
            "sources": [],
            "names": [],
            "skillsmp_ids": [],
            "first_seen": now,
            "last_seen": now,
            "imported": False,
            "cvf_files": [],
            "source_types": [],
            "desc_fingerprints": [],
            "desc_tokens": [],
            "best_score": 0,
            "best_desc_len": 0,
        }
        entry["last_seen"] = now
        source = skill.get("source") or ""
        if source and source not in entry["sources"]:
            entry["sources"].append(source)
        source_type = skill.get("source_type") or SOURCE_NAME
        if source_type and source_type not in entry["source_types"]:
            entry["source_types"].append(source_type)
        name = skill.get("name") or ""
        if name and name not in entry["names"]:
            entry["names"].append(name)
        skill_id = skill.get("id")
        if skill_id and skill_id not in entry["skillsmp_ids"]:
            entry["skillsmp_ids"].append(skill_id)
        desc_fp = skill.get("desc_fingerprint") or description_fingerprint(skill.get("description") or "")
        if desc_fp and desc_fp not in entry["desc_fingerprints"]:
            entry["desc_fingerprints"].append(desc_fp)
        desc_tokens = skill.get("desc_tokens") or token_set(skill.get("description") or "")
        if desc_tokens:
            entry["desc_tokens"].append(desc_tokens)
        score = float(skill.get("score") or 0)
        desc_len = len((skill.get("description") or "").strip())
        if score > float(entry.get("best_score") or 0):
            entry["best_score"] = round(score, 2)
        if desc_len > int(entry.get("best_desc_len") or 0):
            entry["best_desc_len"] = desc_len
        repos[repo_key] = entry

    EXTERNAL_INDEX_PATH.parent.mkdir(parents=True, exist_ok=True)
    EXTERNAL_INDEX_PATH.write_text(json.dumps(index, ensure_ascii=False, indent=2), encoding="utf-8")


def filter_quality(skills: List[Dict[str, Any]], min_stars: int, min_desc: int, require_source: bool) -> List[Dict[str, Any]]:
    filtered = []
    for skill in skills:
        if require_source and not skill.get("source"):
            continue
        if (skill.get("stars") or 0) < min_stars:
            continue
        if len((skill.get("description") or "").strip()) < min_desc:
            continue
        filtered.append(skill)
    return filtered


def build_external_name_index(index: Dict[str, Any]) -> Dict[str, str]:
    name_index: Dict[str, str] = {}
    repos = index.get("repos", {})
    if not isinstance(repos, dict):
        return name_index
    for repo_key, entry in repos.items():
        for name in entry.get("names", []) if isinstance(entry, dict) else []:
            name_key = normalize_name(str(name))
            if name_key and name_key not in name_index:
                name_index[name_key] = repo_key
    return name_index


def build_external_desc_index(index: Dict[str, Any]) -> set[str]:
    fingerprints: set[str] = set()
    repos = index.get("repos", {})
    if not isinstance(repos, dict):
        return fingerprints
    for entry in repos.values():
        if not isinstance(entry, dict):
            continue
        for fp in entry.get("desc_fingerprints", []):
            if fp:
                fingerprints.add(fp)
    return fingerprints


def build_external_token_index(index: Dict[str, Any]) -> List[List[str]]:
    tokens: List[List[str]] = []
    repos = index.get("repos", {})
    if not isinstance(repos, dict):
        return tokens
    for entry in repos.values():
        if not isinstance(entry, dict):
            continue
        for token_list in entry.get("desc_tokens", []):
            if isinstance(token_list, list) and token_list:
                tokens.append(token_list)
    return tokens


def should_skip_external(
    skill: Dict[str, Any],
    index: Dict[str, Any],
    name_index: Dict[str, str],
    desc_index: set[str],
    token_index: List[List[str]],
    similarity_threshold: float,
) -> bool:
    desc_fp = skill.get("desc_fingerprint") or description_fingerprint(skill.get("description") or "")
    if desc_fp and desc_fp in desc_index:
        return True
    if token_index:
        tokens = skill.get("desc_tokens") or token_set(skill.get("description") or "")
        if tokens:
            for existing in token_index:
                if jaccard_similarity(tokens, existing) >= similarity_threshold:
                    return True
    repo_key = skill.get("repo_key") or external_key_for_skill(skill.get("source", ""), skill.get("name", ""))
    repos = index.get("repos", {}) if isinstance(index, dict) else {}
    entry = repos.get(repo_key)
    if not entry:
        name_key = normalize_name(str(skill.get("name") or ""))
        repo_key = name_index.get(name_key)
        if repo_key:
            entry = repos.get(repo_key)
    if not entry:
        return False
    if entry.get("imported"):
        return True
    best_score = float(entry.get("best_score") or 0)
    best_desc = int(entry.get("best_desc_len") or 0)
    current_score = float(skill.get("score") or 0)
    current_desc = len((skill.get("description") or "").strip())
    if best_score >= current_score and best_desc >= current_desc:
        return True
    return False


def apply_similarity_filter(skills: List[Dict[str, Any]], threshold: float) -> Tuple[List[Dict[str, Any]], int]:
    if threshold <= 0:
        return skills, 0
    ranked = sorted(skills, key=lambda x: x.get("score", 0), reverse=True)
    kept: List[Dict[str, Any]] = []
    kept_tokens: List[List[str]] = []
    skipped = 0
    for skill in ranked:
        tokens = skill.get("desc_tokens") or token_set(skill.get("description") or "")
        if tokens:
            is_similar = False
            for existing in kept_tokens:
                if jaccard_similarity(tokens, existing) >= threshold:
                    is_similar = True
                    break
            if is_similar:
                skipped += 1
                continue
        kept.append(skill)
        if tokens:
            kept_tokens.append(tokens)
    return kept, skipped


def select_skills(skills: List[Dict[str, Any]], limit: int, priority_slugs: List[str]) -> List[Dict[str, Any]]:
    unique: Dict[str, Dict[str, Any]] = {}
    for skill in skills:
        key = skill_key(skill)
        current = unique.get(key)
        if not current or skill["score"] > current["score"]:
            unique[key] = skill

    deduped_by_desc: Dict[str, Dict[str, Any]] = {}
    for skill in unique.values():
        fp = skill.get("desc_fingerprint") or description_fingerprint(skill.get("description") or "")
        key = fp or skill_key(skill)
        current = deduped_by_desc.get(key)
        if not current or skill["score"] > current["score"]:
            deduped_by_desc[key] = skill

    deduped_by_repo: Dict[str, Dict[str, Any]] = {}
    for skill in deduped_by_desc.values():
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
    RAW_DIR.mkdir(parents=True, exist_ok=True)
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
    parser.add_argument("--min-stars", type=int, default=5, help="Minimum stars to keep.")
    parser.add_argument("--min-desc", type=int, default=80, help="Minimum description length to keep.")
    parser.add_argument("--require-source", action="store_true", help="Require source URL to keep.")
    parser.add_argument("--similarity-threshold", type=float, default=0.86, help="Jaccard similarity threshold to drop near-duplicates.")
    parser.add_argument("--api-key", type=str, default="", help="SkillsMP API key (optional).")
    args = parser.parse_args()
    if args.api_key:
        global API_KEY_OVERRIDE
        API_KEY_OVERRIDE = args.api_key.strip()

    priority = list(PRIORITY_QUERIES)
    secondary = list(SECONDARY_QUERIES)

    all_skills: List[Dict[str, Any]] = []
    raw_archive: Dict[str, Any] = {
        "generatedAt": datetime.now(timezone.utc).isoformat(),
        "source": SOURCE_NAME,
        "queries": {},
    }

    for query in priority + secondary:
        fetched = search_skills(query, limit=args.per_category, sort_by="stars")
        raw_archive["queries"][query] = fetched
        for skill in fetched:
            priority_hit = query in priority
            hint_domain = QUERY_DOMAIN_MAP.get(query, "app_development" if priority_hit else None)
            all_skills.append(normalize_skill(skill, priority_hit, hint_domain, query))

    if not all_skills:
        raise RuntimeError("No skills fetched from SkillsMP API. Check API key or categories.")

    RAW_DIR.mkdir(parents=True, exist_ok=True)
    timestamp = datetime.now(timezone.utc).strftime("%Y%m%d-%H%M%S")
    raw_path = RAW_DIR / f"skillsmp_raw_{timestamp}.json"
    raw_path.write_text(json.dumps(raw_archive, ensure_ascii=False, indent=2), encoding="utf-8")
    normalized_path = RAW_DIR / f"skillsmp_normalized_{timestamp}.json"
    normalized_path.write_text(json.dumps(all_skills, ensure_ascii=False, indent=2), encoding="utf-8")

    existing_repo_keys, existing_name_keys = load_existing_index()
    external_index = load_external_index()
    external_name_index = build_external_name_index(external_index)
    external_desc_index = build_external_desc_index(external_index)
    external_token_index = build_external_token_index(external_index)
    filtered = []
    skipped_existing = 0
    skipped_external = 0
    skipped_desc = 0
    skipped_similarity = 0
    for skill in all_skills:
        if is_existing_skill(skill, existing_repo_keys, existing_name_keys):
            skipped_existing += 1
            continue
        if should_skip_external(
            skill,
            external_index,
            external_name_index,
            external_desc_index,
            external_token_index,
            args.similarity_threshold,
        ):
            if skill.get("desc_fingerprint") in external_desc_index:
                skipped_desc += 1
            else:
                skipped_similarity += 1
            skipped_external += 1
            continue
        filtered.append(skill)

    if not filtered:
        raise RuntimeError("All fetched skills already exist in CVF library.")

    quality_filtered = filter_quality(filtered, args.min_stars, args.min_desc, args.require_source)
    if not quality_filtered:
        raise RuntimeError("All fetched skills were filtered out by quality gates.")

    similarity_filtered, skipped_near = apply_similarity_filter(quality_filtered, args.similarity_threshold)
    if not similarity_filtered:
        raise RuntimeError("All fetched skills were filtered out by similarity threshold.")

    selected = select_skills(similarity_filtered, args.limit, priority)
    write_outputs(selected, args.limit)
    update_external_index(all_skills)

    print(f"Fetched queries: {len(priority) + len(secondary)}")
    print(f"Total candidates: {len(all_skills)}")
    print(f"Skipped existing: {skipped_existing}")
    print(f"Skipped external: {skipped_external}")
    print(f"Skipped desc fingerprint: {skipped_desc}")
    print(f"Skipped similarity: {skipped_similarity}")
    print(f"Quality filtered: {len(quality_filtered)}")
    print(f"Similarity filtered: {len(similarity_filtered)} (skipped {skipped_near})")
    print(f"Selected: {len(selected)}")
    print(f"Output: {OUTPUT_DIR}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
