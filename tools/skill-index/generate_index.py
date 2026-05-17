#!/usr/bin/env python
"""Generate skills_index.csv from .skill.md files.

Scans all domain folders in the CVF Skill Library, parses metadata
from each .skill.md file, and writes a structured CSV index.

Usage:
    python generate_index.py
    python generate_index.py --output custom_path.csv
    python generate_index.py --validate  # Check CSV vs files on disk
"""
from __future__ import annotations

import argparse
import csv
import re
import sys
from pathlib import Path
from typing import Dict, List, Optional

# Resolve paths
SCRIPT_DIR = Path(__file__).resolve().parent
REPO_ROOT = SCRIPT_DIR.parents[1]
SKILL_LIBRARY = REPO_ROOT / "EXTENSIONS" / "CVF_v1.5.2_SKILL_LIBRARY_FOR_END_USERS"
DEFAULT_OUTPUT = SKILL_LIBRARY / "data" / "skills_index.csv"

# Domains to scan (alphabetical)
DOMAINS = [
    "ai_ml_evaluation",
    "app_development",
    "business_analysis",
    "content_creation",
    "finance_analytics",
    "hr_operations",
    "legal_contracts",
    "marketing_seo",
    "product_ux",
    "security_compliance",
    "technical_review",
    "web_development",
]

# Metadata patterns
RE_TITLE = re.compile(r"^#\s+(.+)$", re.MULTILINE)
RE_DOMAIN = re.compile(r"\*\*Domain:\*\*\s*(.+)", re.IGNORECASE)
RE_DIFFICULTY = re.compile(r"\*\*Difficulty:\*\*\s*(.+)", re.IGNORECASE)
RE_RISK = re.compile(r"\|\s*Risk Level\s*\|\s*(R[0-3])\s*\|", re.IGNORECASE)
RE_PHASES = re.compile(r"\|\s*Allowed Phases\s*\|\s*(.+?)\s*\|", re.IGNORECASE)
RE_PURPOSE_SECTION = re.compile(
    r"##\s+.*(?:Mục đích|Purpose).*?\n(.*?)(?=\n##|\Z)", re.DOTALL | re.IGNORECASE
)

# Stopwords for keyword extraction
STOPWORDS_VI = {
    "và", "cho", "của", "các", "với", "được", "để", "trong", "theo",
    "khi", "không", "là", "có", "này", "từ", "một", "những", "hoặc",
    "nếu", "đã", "sẽ", "tới", "bao", "gồm", "nào", "về", "như",
    "cần", "thể", "đó", "qua", "tại", "giữa", "sau", "trước",
    "bằng", "đến", "lại", "ra", "lên", "vào", "mà",
}
STOPWORDS_EN = {
    "the", "a", "an", "and", "or", "for", "to", "of", "in", "on",
    "at", "by", "with", "from", "as", "is", "are", "was", "were",
    "be", "been", "being", "have", "has", "had", "do", "does", "did",
    "will", "would", "shall", "should", "may", "might", "can", "could",
    "not", "no", "but", "if", "then", "than", "that", "this", "these",
    "those", "it", "its", "my", "your", "our", "their", "his", "her",
    "we", "you", "they", "he", "she", "all", "each", "every", "both",
    "few", "more", "most", "other", "some", "such", "only", "own",
    "so", "up", "out", "into", "over", "after", "before", "between",
    "under", "again", "further", "also", "how", "when", "where", "why",
    "what", "which", "who", "whom", "very", "too", "just", "about",
}
STOPWORDS = STOPWORDS_VI | STOPWORDS_EN


def read_text(path: Path) -> str:
    return path.read_text(encoding="utf-8", errors="ignore")


def extract_title(text: str) -> str:
    m = RE_TITLE.search(text)
    return m.group(1).strip() if m else ""


def extract_field(text: str, pattern: re.Pattern) -> str:
    m = pattern.search(text)
    return m.group(1).strip() if m else ""


def clean_difficulty(raw: str) -> str:
    """Extract difficulty level from raw string like '⭐⭐ Medium'."""
    raw_lower = raw.lower()
    if "advanced" in raw_lower or "hard" in raw_lower:
        return "Advanced"
    if "medium" in raw_lower:
        return "Medium"
    if "easy" in raw_lower:
        return "Easy"
    # Count stars
    stars = raw.count("⭐")
    if stars >= 3:
        return "Advanced"
    if stars == 2:
        return "Medium"
    if stars == 1:
        return "Easy"
    return raw.strip()


def extract_description(text: str) -> str:
    """First meaningful line from Mục đích section."""
    m = RE_PURPOSE_SECTION.search(text)
    if not m:
        return ""
    body = m.group(1).strip()
    for line in body.splitlines():
        line = line.strip()
        # Skip empty, markdown artifacts, headers
        if not line or line.startswith("#") or line.startswith("---"):
            continue
        # Skip "Khi nào nên dùng" or "Không phù hợp khi" headers
        if line.startswith("**Khi nào") or line.startswith("**Không phù hợp"):
            continue
        # Clean markdown formatting
        line = re.sub(r"\*\*(.+?)\*\*", r"\1", line)
        line = re.sub(r"\[(.+?)\]\(.+?\)", r"\1", line)
        line = line.lstrip("- ")
        if len(line) > 10:
            return line[:200]
    return ""


def extract_keywords(title: str, domain: str, description: str, text: str) -> List[str]:
    """Extract meaningful keywords from title, domain, description."""
    words = set()

    # Title words
    for w in re.findall(r"[a-zA-ZÀ-ỹ]{3,}", title):
        words.add(w.lower())

    # Domain words
    for part in domain.split("_"):
        if len(part) >= 2:
            words.add(part.lower())

    # Description words (first 300 chars)
    for w in re.findall(r"[a-zA-ZÀ-ỹ]{3,}", description[:300]):
        words.add(w.lower())

    # Remove stopwords
    words -= STOPWORDS

    # Add domain as-is
    words.add(domain)

    return sorted(words)


def parse_skill_file(path: Path, domain: str) -> Optional[Dict[str, str]]:
    """Parse a .skill.md file and extract structured metadata."""
    text = read_text(path)

    title = extract_title(text)
    if not title:
        print(f"  ⚠️  No title found: {path.name}", file=sys.stderr)
        return None

    difficulty_raw = extract_field(text, RE_DIFFICULTY)
    difficulty = clean_difficulty(difficulty_raw) if difficulty_raw else "Medium"

    risk_level = extract_field(text, RE_RISK) or "R1"
    phases_raw = extract_field(text, RE_PHASES)
    phases = phases_raw if phases_raw else "Discovery,Design,Build,Review"

    description = extract_description(text)
    keywords = extract_keywords(title, domain, description, text)

    rel_path = f"{domain}/{path.name}"
    skill_id = f"{domain}/{path.stem.replace('.skill', '')}"

    return {
        "skill_id": skill_id,
        "domain": domain,
        "skill_name": title,
        "difficulty": difficulty,
        "risk_level": risk_level,
        "phases": phases,
        "keywords": ",".join(keywords),
        "description": description,
        "file_path": rel_path,
    }


def generate_index(output_path: Path) -> List[Dict[str, str]]:
    """Scan all domains, parse skills, write CSV."""
    all_skills: List[Dict[str, str]] = []
    domain_counts: Dict[str, int] = {}

    print(f"📂 Scanning: {SKILL_LIBRARY}")
    print()

    for domain in DOMAINS:
        domain_dir = SKILL_LIBRARY / domain
        if not domain_dir.is_dir():
            print(f"  ⚠️  Domain dir not found: {domain}")
            continue

        files = sorted(domain_dir.glob("*.skill.md"))
        domain_counts[domain] = len(files)
        print(f"  {domain}: {len(files)} files")

        for f in files:
            record = parse_skill_file(f, domain)
            if record:
                all_skills.append(record)

    # Sort by domain, then skill_name
    all_skills.sort(key=lambda x: (x["domain"], x["skill_name"]))

    # Write CSV
    output_path.parent.mkdir(parents=True, exist_ok=True)
    fieldnames = [
        "skill_id", "domain", "skill_name", "difficulty",
        "risk_level", "phases", "keywords", "description", "file_path",
    ]

    with open(output_path, "w", encoding="utf-8", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(all_skills)

    print()
    print(f"✅ Generated: {output_path}")
    print(f"   Total skills: {len(all_skills)}")
    print()
    print("📊 Per-domain breakdown:")
    for domain, count in sorted(domain_counts.items()):
        indexed = sum(1 for s in all_skills if s["domain"] == domain)
        status = "✅" if count == indexed else f"⚠️ {count} files / {indexed} indexed"
        print(f"   {domain}: {indexed} {status}")

    return all_skills


def validate_index(csv_path: Path) -> bool:
    """Validate CSV against actual files on disk."""
    if not csv_path.exists():
        print(f"❌ CSV not found: {csv_path}")
        return False

    with open(csv_path, encoding="utf-8") as f:
        reader = csv.DictReader(f)
        rows = list(reader)

    errors = 0
    # Check each row's file exists
    for row in rows:
        file_path = SKILL_LIBRARY / row["file_path"]
        if not file_path.exists():
            print(f"❌ File missing: {row['file_path']}")
            errors += 1

    # Check for files not in CSV
    csv_paths = {row["file_path"] for row in rows}
    for domain in DOMAINS:
        domain_dir = SKILL_LIBRARY / domain
        if not domain_dir.is_dir():
            continue
        for f in domain_dir.glob("*.skill.md"):
            rel = f"{domain}/{f.name}"
            if rel not in csv_paths:
                print(f"❌ File not indexed: {rel}")
                errors += 1

    if errors:
        print(f"\n❌ Validation failed: {errors} errors")
        return False
    else:
        print(f"\n✅ Validation passed: {len(rows)} skills, 0 errors")
        return True


def main():
    parser = argparse.ArgumentParser(description="Generate CVF skills_index.csv")
    parser.add_argument(
        "--output", "-o",
        type=Path,
        default=DEFAULT_OUTPUT,
        help=f"Output CSV path (default: {DEFAULT_OUTPUT})",
    )
    parser.add_argument(
        "--validate", "-v",
        action="store_true",
        help="Validate existing CSV against files on disk",
    )
    args = parser.parse_args()

    if args.validate:
        ok = validate_index(args.output)
        sys.exit(0 if ok else 1)

    skills = generate_index(args.output)
    # Auto-validate after generation
    print()
    validate_index(args.output)


if __name__ == "__main__":
    main()
