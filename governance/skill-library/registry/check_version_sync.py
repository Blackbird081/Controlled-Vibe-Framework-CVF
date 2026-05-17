#!/usr/bin/env python3
"""
check_version_sync.py — Version Lock checker for CVF governance registry.

Compares .gov.md version_lock blocks against actual .skill.md files
to detect SYNCED / DRIFT / BROKEN / NOT_LOCKED states.

Usage:
    python check_version_sync.py                # Check all
    python check_version_sync.py --domain X     # Check one domain
    python check_version_sync.py --fix          # Auto-fix drifted locks
    python check_version_sync.py --fix --dry-run
    python check_version_sync.py --json         # JSON output
"""

from __future__ import annotations

import argparse
import hashlib
import json
import re
import sys
from dataclasses import dataclass, asdict
from datetime import date
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parents[3]
SKILL_LIBRARY_PATH = ROOT_DIR / "EXTENSIONS" / "CVF_v1.5.2_SKILL_LIBRARY_FOR_END_USERS"
USER_REGISTRY_PATH = ROOT_DIR / "governance" / "skill-library" / "registry" / "user-skills"

# ---------------------------------------------------------------------------
# Data structures
# ---------------------------------------------------------------------------

@dataclass
class LockResult:
    gov_file: str
    skill_file: str
    status: str             # SYNCED | DRIFT | BROKEN | NOT_LOCKED
    locked_version: str     # version in .gov.md (or "")
    locked_hash: str        # hash in .gov.md (or "")
    current_version: str    # version in .skill.md (or "")
    current_hash: str       # hash of .skill.md (or "")

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def compute_hash(path: Path) -> str:
    """Return first 6 hex chars of SHA-256."""
    content = path.read_bytes()
    return hashlib.sha256(content).hexdigest()[:6]


def extract_skill_version(path: Path) -> str:
    """Extract 'Skill Version: X.Y.Z' from .skill.md header."""
    text = path.read_text(encoding="utf-8")
    m = re.search(r"\*\*Skill Version:\*\*\s*([\d.]+)", text)
    return m.group(1) if m else ""


def extract_source_link(gov_path: Path) -> Path | None:
    """Resolve the source .skill.md from ## Source section."""
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
                return (gov_path.parent / link).resolve()
    return None


def extract_lock_block(gov_path: Path) -> tuple[str, str, str]:
    """Extract (version, hash, date) from ## Version Lock table.
    Returns ("", "", "") if block not found.
    """
    text = gov_path.read_text(encoding="utf-8")
    if "## Version Lock" not in text:
        return ("", "", "")

    version = ""
    hash_val = ""
    lock_date = ""

    for line in text.splitlines():
        if "| Skill Version |" in line and "Field" not in line:
            parts = [p.strip() for p in line.split("|")]
            version = parts[2] if len(parts) > 2 else ""
        if "| Skill Hash |" in line and "Field" not in line:
            parts = [p.strip() for p in line.split("|")]
            hash_val = parts[2] if len(parts) > 2 else ""
        if "| Locked At |" in line and "Field" not in line:
            parts = [p.strip() for p in line.split("|")]
            lock_date = parts[2] if len(parts) > 2 else ""

    return (version, hash_val, lock_date)


def build_lock_block(version: str, hash_val: str, status: str) -> str:
    """Generate ## Version Lock markdown block."""
    icon = {"SYNCED": "✅", "DRIFT": "⚠️", "BROKEN": "❌"}.get(status, "🔘")
    today = date.today().isoformat()
    return (
        "\n---\n\n"
        "## Version Lock\n\n"
        "| Field | Value |\n"
        "|-------|-------|\n"
        f"| Skill Version | {version} |\n"
        f"| Skill Hash | {hash_val} |\n"
        f"| Locked At | {today} |\n"
        f"| Lock Status | {icon} {status} |\n"
    )

# ---------------------------------------------------------------------------
# Core logic
# ---------------------------------------------------------------------------

def check_file(gov_path: Path) -> LockResult:
    """Check one .gov.md file against its .skill.md source."""
    skill_path = extract_source_link(gov_path)

    if skill_path is None or not skill_path.exists():
        return LockResult(
            gov_file=gov_path.name,
            skill_file=str(skill_path) if skill_path else "",
            status="BROKEN",
            locked_version="", locked_hash="",
            current_version="", current_hash="",
        )

    current_version = extract_skill_version(skill_path)
    current_hash = compute_hash(skill_path)

    locked_version, locked_hash, _ = extract_lock_block(gov_path)

    if not locked_version and not locked_hash:
        return LockResult(
            gov_file=gov_path.name,
            skill_file=skill_path.name,
            status="NOT_LOCKED",
            locked_version="", locked_hash="",
            current_version=current_version, current_hash=current_hash,
        )

    if locked_hash == current_hash:
        status = "SYNCED"
    else:
        status = "DRIFT"

    return LockResult(
        gov_file=gov_path.name,
        skill_file=skill_path.name,
        status=status,
        locked_version=locked_version, locked_hash=locked_hash,
        current_version=current_version, current_hash=current_hash,
    )


def fix_lock(gov_path: Path, result: LockResult, dry_run: bool = False) -> bool:
    """Inject or update ## Version Lock block. Returns True if changed."""
    if result.status == "BROKEN":
        return False

    text = gov_path.read_text(encoding="utf-8")
    new_block = build_lock_block(result.current_version, result.current_hash, "SYNCED")

    if "## Version Lock" in text:
        # Replace existing block
        pattern = r"\n---\n\n## Version Lock\n\n\|[^#]+"
        new_text = re.sub(pattern, new_block, text, count=1)
    else:
        # Append at end
        new_text = text.rstrip() + "\n" + new_block

    if dry_run:
        print(f"  [DRY-RUN] Would update {gov_path.name}")
        return True

    gov_path.write_text(new_text, encoding="utf-8")
    return True

# ---------------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------------

def main() -> int:
    parser = argparse.ArgumentParser(description="CVF Version Lock Checker")
    parser.add_argument("--domain", help="Filter by domain name")
    parser.add_argument("--fix", action="store_true", help="Auto-fix drifted/unlocked files")
    parser.add_argument("--dry-run", action="store_true", help="Preview fixes without writing")
    parser.add_argument("--json", action="store_true", dest="json_output", help="JSON output")
    args = parser.parse_args()

    gov_files = sorted(USER_REGISTRY_PATH.glob("USR-*.gov.md"))

    if args.domain:
        gov_files = [f for f in gov_files if args.domain.lower() in f.name.lower()]

    results: list[LockResult] = []
    for gf in gov_files:
        results.append(check_file(gf))

    # Summary
    counts = {"SYNCED": 0, "DRIFT": 0, "BROKEN": 0, "NOT_LOCKED": 0}
    for r in results:
        counts[r.status] = counts.get(r.status, 0) + 1

    if args.json_output:
        output = {
            "summary": counts,
            "total": len(results),
            "results": [asdict(r) for r in results],
        }
        print(json.dumps(output, indent=2))
        return 1 if counts["BROKEN"] > 0 else 0

    # Console output
    print(f"CVF Version Lock Check — {len(results)} governance files\n")
    print(f"  ✅ SYNCED:     {counts['SYNCED']}")
    print(f"  ⚠️  DRIFT:      {counts['DRIFT']}")
    print(f"  ❌ BROKEN:     {counts['BROKEN']}")
    print(f"  🔘 NOT_LOCKED: {counts['NOT_LOCKED']}")
    print()

    issues = [r for r in results if r.status in ("DRIFT", "BROKEN")]
    not_locked = [r for r in results if r.status == "NOT_LOCKED"]

    if issues:
        print("Issues:")
        for r in issues:
            icon = "⚠️" if r.status == "DRIFT" else "❌"
            print(f"  {icon} {r.gov_file} → {r.status}")
            if r.status == "DRIFT":
                print(f"     locked: v{r.locked_version} ({r.locked_hash})")
                print(f"     current: v{r.current_version} ({r.current_hash})")
        print()

    if not_locked and not args.fix:
        print(f"  ℹ️  {len(not_locked)} files have no version lock (run --fix to add)")
        print()

    # Fix mode
    if args.fix:
        fix_targets = [r for r in results if r.status in ("DRIFT", "NOT_LOCKED")]
        if not fix_targets:
            print("Nothing to fix — all files are SYNCED or BROKEN.")
            return 0

        fixed = 0
        for r in fix_targets:
            gov_path = USER_REGISTRY_PATH / r.gov_file
            if fix_lock(gov_path, r, dry_run=args.dry_run):
                fixed += 1

        verb = "Would fix" if args.dry_run else "Fixed"
        print(f"{verb} {fixed}/{len(fix_targets)} files.")

    return 1 if counts["BROKEN"] > 0 else 0


if __name__ == "__main__":
    sys.exit(main())
