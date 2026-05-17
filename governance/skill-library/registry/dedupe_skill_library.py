#!/usr/bin/env python3
"""
Remove duplicate skills in the v1.5.2 skill library.
Keeps the best candidate (richer description), removes suffix variants (_2, _3, ...).
"""

from __future__ import annotations

import argparse
import re
from collections import defaultdict
from pathlib import Path
from typing import Dict, List, Tuple


ROOT_DIR = Path(__file__).resolve().parents[3]
SKILL_ROOT = ROOT_DIR / "EXTENSIONS" / "CVF_v1.5.2_SKILL_LIBRARY_FOR_END_USERS"


def base_slug_from_filename(filename: str) -> str:
    stem = filename.replace(".skill.md", "").replace(".skill", "")
    stem = re.sub(r"^\d+_", "", stem)
    stem = re.sub(r"_\d+$", "", stem)
    return stem


def description_score(text: str) -> int:
    match = re.search(r"##\s+🎯\s+Mục đích([\s\S]*?)(?=##\s+)", text)
    if match:
        return len(match.group(0))
    return len(text)


def pick_best(paths: List[Path]) -> Path:
    def sort_key(path: Path) -> Tuple[int, int, int, str]:
        content = path.read_text(encoding="utf-8", errors="ignore")
        score = description_score(content)
        stem = path.stem.replace(".skill", "")
        suffix_match = re.search(r"_(\d+)$", stem)
        suffix = int(suffix_match.group(1)) if suffix_match else 0
        index_match = re.match(r"^(\d+)_", path.name)
        index = int(index_match.group(1)) if index_match else 999
        return (-score, suffix, index, path.name)

    return sorted(paths, key=sort_key)[0]


def main() -> int:
    parser = argparse.ArgumentParser(description="Deduplicate CVF skill library files.")
    parser.add_argument("--dry-run", action="store_true", help="List duplicates without deleting.")
    args = parser.parse_args()

    if not SKILL_ROOT.exists():
        print(f"Missing skill library: {SKILL_ROOT}")
        return 1

    removed_total = 0
    dup_groups = 0

    for domain_dir in sorted(SKILL_ROOT.iterdir()):
        if not domain_dir.is_dir():
            continue
        files = list(domain_dir.glob("*.skill.md"))
        if not files:
            continue
        by_slug: Dict[str, List[Path]] = defaultdict(list)
        for file in files:
            by_slug[base_slug_from_filename(file.name)].append(file)

        for slug, group in by_slug.items():
            if len(group) <= 1:
                continue
            dup_groups += 1
            best = pick_best(group)
            to_remove = [p for p in group if p != best]
            if args.dry_run:
                print(f"[{domain_dir.name}] {slug} -> keep {best.name}, remove {len(to_remove)}")
            else:
                for path in to_remove:
                    path.unlink(missing_ok=True)
                removed_total += len(to_remove)
                print(f"[{domain_dir.name}] {slug} -> keep {best.name}, removed {len(to_remove)}")

    if args.dry_run:
        print(f"Found {dup_groups} duplicate groups.")
    else:
        print(f"OK: Removed {removed_total} duplicate files across {dup_groups} groups.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
