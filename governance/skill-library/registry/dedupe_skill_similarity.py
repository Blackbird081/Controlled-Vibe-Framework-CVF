#!/usr/bin/env python3
"""
Remove near-duplicate skills by description similarity (Jaccard).
Moves duplicates to a quarantine folder instead of deleting.
"""

from __future__ import annotations

import argparse
import re
import shutil
from dataclasses import dataclass
from pathlib import Path
from typing import Dict, List, Tuple


ROOT_DIR = Path(__file__).resolve().parents[3]
SKILL_ROOT = ROOT_DIR / "EXTENSIONS" / "CVF_v1.5.2_SKILL_LIBRARY_FOR_END_USERS"
DEFAULT_QUARANTINE = ROOT_DIR / "governance" / "skill-library" / "registry" / "dupe-quarantine"


@dataclass
class SkillDoc:
    path: Path
    domain: str
    title: str
    text: str
    tokens: List[str]
    quality_score: int


def normalize_text(value: str) -> str:
    value = (value or "").lower().strip()
    value = re.sub(r"[^a-z0-9]+", " ", value)
    return re.sub(r"\s+", " ", value).strip()


def token_set(text: str, max_tokens: int = 120) -> List[str]:
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


def extract_title(text: str, fallback: str) -> str:
    for line in text.splitlines():
        if line.startswith("# "):
            return line.replace("# ", "").strip()
    return fallback


def extract_purpose(text: str) -> str:
    match = re.search(r"##\s+🎯\s+Mục đích([\s\S]*?)(?=##\s+)", text)
    if match:
        return match.group(1).strip()
    return ""


def quality_score(text: str) -> int:
    purpose = extract_purpose(text)
    score = len(normalize_text(purpose)) if purpose else len(normalize_text(text))
    if "Nguồn tham khảo" in text or "Source:" in text:
        score += 50
    if "UAT Binding" in text:
        score += 30
    return score


def load_skills(full_document: bool) -> List[SkillDoc]:
    skills: List[SkillDoc] = []
    for domain_dir in sorted(SKILL_ROOT.iterdir()):
        if not domain_dir.is_dir():
            continue
        for file in sorted(domain_dir.glob("*.skill.md")):
            text = file.read_text(encoding="utf-8", errors="ignore")
            title = extract_title(text, file.stem.replace(".skill", "").replace("_", " ").title())
            purpose = extract_purpose(text)
            if full_document:
                content = text
            else:
                content = purpose if purpose else text
            tokens = token_set(content)
            skills.append(
                SkillDoc(
                    path=file,
                    domain=domain_dir.name,
                    title=title,
                    text=text,
                    tokens=tokens,
                    quality_score=quality_score(text),
                )
            )
    return skills


def move_to_quarantine(path: Path, quarantine_root: Path) -> Path:
    rel = path.relative_to(SKILL_ROOT)
    target = quarantine_root / rel
    target.parent.mkdir(parents=True, exist_ok=True)
    if target.exists():
        base = target.stem
        suffix = target.suffix
        idx = 2
        while True:
            candidate = target.with_name(f"{base}_dup{idx}{suffix}")
            if not candidate.exists():
                target = candidate
                break
            idx += 1
    shutil.move(str(path), str(target))
    return target


def dedupe_skills(
    skills: List[SkillDoc],
    threshold: float,
    cross_domain: bool,
) -> Tuple[List[SkillDoc], List[Tuple[SkillDoc, SkillDoc, float]]]:
    kept: List[SkillDoc] = []
    removed: List[Tuple[SkillDoc, SkillDoc, float]] = []
    if cross_domain:
        items = sorted(skills, key=lambda x: x.quality_score, reverse=True)
        for skill in items:
            best_sim = 0.0
            best_match = None
            for existing in kept:
                sim = jaccard_similarity(skill.tokens, existing.tokens)
                if sim > best_sim:
                    best_sim = sim
                    best_match = existing
                if sim >= threshold:
                    break
            if best_sim >= threshold and best_match:
                removed.append((skill, best_match, best_sim))
            else:
                kept.append(skill)
        return kept, removed

    by_domain: Dict[str, List[SkillDoc]] = {}
    for skill in skills:
        by_domain.setdefault(skill.domain, []).append(skill)

    for domain, items in by_domain.items():
        items.sort(key=lambda x: x.quality_score, reverse=True)
        domain_kept: List[SkillDoc] = []
        for skill in items:
            best_sim = 0.0
            best_match = None
            for existing in domain_kept:
                sim = jaccard_similarity(skill.tokens, existing.tokens)
                if sim > best_sim:
                    best_sim = sim
                    best_match = existing
                if sim >= threshold:
                    break
            if best_sim >= threshold and best_match:
                removed.append((skill, best_match, best_sim))
            else:
                domain_kept.append(skill)
        kept.extend(domain_kept)
    return kept, removed


def write_report(removed: List[Tuple[SkillDoc, SkillDoc, float]], report_path: Path) -> None:
    lines = [
        "# Similarity Dedupe Report",
        "",
        f"Total removed: {len(removed)}",
        "",
        "| Removed | Kept | Similarity | Domain |",
        "|---------|------|------------|--------|",
    ]
    for removed_skill, kept_skill, sim in removed:
        lines.append(
            f"| {removed_skill.path.name} | {kept_skill.path.name} | {sim:.2f} | {removed_skill.domain} |"
        )
    report_path.parent.mkdir(parents=True, exist_ok=True)
    report_path.write_text("\n".join(lines) + "\n", encoding="utf-8")


def main() -> int:
    parser = argparse.ArgumentParser(description="Deduplicate skills by similarity.")
    parser.add_argument("--threshold", type=float, default=0.40, help="Jaccard similarity threshold.")
    parser.add_argument("--dry-run", action="store_true", help="Only report duplicates.")
    parser.add_argument("--quarantine", type=str, default=str(DEFAULT_QUARANTINE), help="Quarantine folder.")
    parser.add_argument("--full-document", action="store_true", help="Use full document text for similarity.")
    parser.add_argument("--cross-domain", action="store_true", help="Compare across domains.")
    args = parser.parse_args()

    if not SKILL_ROOT.exists():
        print(f"Missing skill library: {SKILL_ROOT}")
        return 1

    skills = load_skills(args.full_document)
    kept, removed = dedupe_skills(skills, args.threshold, args.cross_domain)
    report_path = Path(args.quarantine) / "report.md"
    write_report(removed, report_path)

    if args.dry_run:
        print(f"Found {len(removed)} near-duplicates. Report: {report_path}")
        return 0

    quarantine_root = Path(args.quarantine)
    moved = 0
    for removed_skill, _, _ in removed:
        move_to_quarantine(removed_skill.path, quarantine_root)
        moved += 1

    print(f"Moved {moved} near-duplicates to {quarantine_root}")
    print(f"Report: {report_path}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
