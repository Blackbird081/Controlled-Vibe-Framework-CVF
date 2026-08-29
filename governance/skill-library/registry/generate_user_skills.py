#!/usr/bin/env python3
# Text Encoding Exception: preserves source-faithful Unicode from accepted skill metadata.
"""
Generate governance registry files for v1.5.2 user skills.
Each .gov.md file is a lightweight governance metadata record.

This module computes the ENTIRE desired manifest (every record's filename +
exact content, plus the exact INDEX.md content) in memory before touching any
file on disk, then reconciles the output directory to that manifest:
  - add records that are desired but missing
  - update records whose content differs from desired
  - delete existing USR-*.gov.md records that are no longer desired
  - always deterministically rewrite INDEX.md from scratch
  - leave any unrelated file in the output directory untouched

Modes:
  (default)    Apply the reconciliation using atomic per-file replacement.
  --dry-run    Compute and print the plan. Zero writes.
  --check      Compute the plan; exit 0 if no drift, exit 1 if drift exists.
               Zero writes.
  --output-dir Override the output directory (e.g. for isolated testing).
"""

from __future__ import annotations

import argparse
import os
import re
import sys
import tempfile
from dataclasses import dataclass, field
from pathlib import Path
from typing import Dict, List, Optional

# Configuration
ROOT_DIR = Path(__file__).resolve().parents[3]
SKILL_LIBRARY_PATH = ROOT_DIR / "EXTENSIONS" / "CVF_v1.5.2_SKILL_LIBRARY_FOR_END_USERS"
OUTPUT_PATH = ROOT_DIR / "governance" / "skill-library" / "registry" / "user-skills"

# Fixed literal so re-running apply on an unchanged source tree produces a
# byte-identical INDEX.md (must NOT be derived from "today's date").
INDEX_LAST_UPDATED = "Feb 07, 2026"

# Domain -> Default Risk Level mapping
DOMAIN_RISK_MAP = {
    "ai_ml_evaluation": "R1",      # Advisory - suggestions for AI/ML
    "app_development": "R1",       # Advisory - design recommendations
    "business_analysis": "R1",     # Advisory - analysis output
    "content_creation": "R0",      # Informational - content generation
    "finance_analytics": "R2",     # Medium - business impact
    "hr_operations": "R2",         # Medium - HR decisions
    "legal_contracts": "R2",       # Medium - legal implications
    "marketing_seo": "R1",         # Advisory - marketing suggestions
    "product_ux": "R1",            # Advisory - UX recommendations
    "security_compliance": "R2",   # Medium - security implications
    "technical_review": "R1",      # Advisory - code review
    "web_development": "R1",       # Advisory - development guidance
}

# Domain -> Allowed Phases mapping
DOMAIN_PHASES_MAP = {
    "ai_ml_evaluation": "Discovery, Design, Review",
    "app_development": "Discovery, Design",
    "business_analysis": "Discovery",
    "content_creation": "Discovery, Design, Build",
    "finance_analytics": "Discovery, Review",
    "hr_operations": "Discovery, Review",
    "legal_contracts": "Discovery, Review",
    "marketing_seo": "Discovery, Design",
    "product_ux": "Discovery, Design, Review",
    "security_compliance": "Design, Review",
    "technical_review": "Build, Review",
    "web_development": "Design, Build",
}

AUTONOMY_MAP = {
    "R0": "Auto",
    "R1": "Auto + Audit",
    "R2": "Human confirmation required",
    "R3": "Suggest only",
    "R4": "Blocked",
}


class SkillRenderError(Exception):
    """Raised when a source skill file cannot be read/rendered."""


def extract_skill_name(filepath: Path) -> str:
    """Extract skill name from file, reading the first H1 header."""
    content = filepath.read_text(encoding="utf-8")
    match = re.search(r'^#\s+(.+)$', content, re.MULTILINE)
    if match:
        return match.group(1).strip()

    # Fallback: use filename
    name = filepath.stem.replace('.skill', '')
    name = re.sub(r'^\d+_', '', name)  # Remove leading numbers
    return name.replace('_', ' ').title()


def extract_difficulty(content: str) -> str:
    """Extract difficulty from skill file content."""
    if "⭐⭐⭐" in content:
        return "Advanced"
    elif "⭐⭐" in content:
        return "Medium"
    elif "⭐" in content:
        return "Easy"
    return "Medium"


@dataclass
class SkillRecord:
    skill_id: int
    skill_path: Path
    domain: str
    skill_name: str
    difficulty: str
    risk_level: str
    phases: str
    gov_filename: str
    rel_path: str


@dataclass
class Manifest:
    """The complete desired state, computed entirely in memory."""
    records: List[SkillRecord] = field(default_factory=list)
    # gov_filename -> exact file content
    file_contents: Dict[str, str] = field(default_factory=dict)
    index_content: str = ""


def render_gov_content(record: SkillRecord) -> str:
    """Render the exact content for a single USR-*.gov.md record."""
    autonomy = AUTONOMY_MAP.get(record.risk_level, "Human confirmation required")
    decision_scope = (
        "Informational" if record.risk_level == "R0"
        else "Tactical" if record.risk_level in ("R1", "R2")
        else "Strategic"
    )

    header = (
        f"# USR-{record.skill_id:03d}: {record.skill_name}\n"
        "Text Encoding Exception: preserves source-faithful Unicode from accepted skill metadata.\n"
        "\n"
        "> **Type:** User Skill\n"
        f"> **Domain:** {record.domain.replace('_', ' ').title()}\n"
        f"> **Difficulty:** {record.difficulty}\n"
        "> **Status:** Active\n"
    )

    return header + f"""
---

## Source

→ [{record.skill_path.name}]({record.rel_path})

---

## Governance

| Field | Value |
|-------|-------|
| Risk Level | {record.risk_level} |
| Allowed Roles | User, Reviewer |
| Allowed Phases | {record.phases} |
| Decision Scope | {decision_scope} |
| Autonomy | {autonomy} |

---

## UAT Binding

**PASS criteria:**
- [ ] Output follows skill expected format
- [ ] Stays within declared scope
- [ ] References provided where applicable

**FAIL criteria:**
- [ ] Actions outside authority
- [ ] Missing required validation
- [ ] Hallucinated information
"""


def render_index_content(records: List[SkillRecord]) -> str:
    """Render the exact INDEX.md content for the given (ordered) records."""
    index_content = (
        "# User Skills Registry Index\n"
        "Text Encoding Exception: preserves source-faithful Unicode from accepted skill metadata.\n"
        "\n"
        f"> **Total Skills:** {len(records)}\n"
        "> **Generated:** Auto-generated from v1.5.2 SKILL_LIBRARY\n"
        f"> **Last Updated:** {INDEX_LAST_UPDATED}\n"
        "\n"
        "---\n"
        "\n"
        "## Skills by Domain\n"
        "\n"
    )

    domains: Dict[str, List[SkillRecord]] = {}
    for rec in records:
        domains.setdefault(rec.domain, []).append(rec)

    for domain in sorted(domains.keys()):
        domain_records = domains[domain]
        index_content += f"\n### {domain.replace('_', ' ').title()} ({len(domain_records)} skills)\n\n"
        for rec in domain_records:
            index_content += f"- [{rec.gov_filename}](./{rec.gov_filename}) - {rec.skill_name}\n"

    return index_content


def build_manifest(skill_library_path: Path, output_path: Path) -> Manifest:
    """
    Compute the ENTIRE desired manifest in memory. Raises SkillRenderError
    (before any mutation happens anywhere) if any source skill cannot be
    read/rendered.
    """
    skill_files = sorted(skill_library_path.rglob("*.skill.md"))

    records: List[SkillRecord] = []
    for i, skill_path in enumerate(skill_files, start=1):
        try:
            content = skill_path.read_text(encoding="utf-8")
            skill_name = extract_skill_name(skill_path)
            difficulty = extract_difficulty(content)
        except Exception as exc:  # noqa: BLE001 - re-raised as a typed error
            raise SkillRenderError(f"Failed to render {skill_path}: {exc}") from exc

        domain = skill_path.parent.name
        risk_level = DOMAIN_RISK_MAP.get(domain, "R1")
        phases = DOMAIN_PHASES_MAP.get(domain, "Discovery, Design")
        filename_base = skill_path.stem.replace('.skill', '')
        gov_filename = f"USR-{i:03d}_{filename_base}.gov.md"
        try:
            rel_path = Path(os.path.relpath(skill_path, output_path)).as_posix()
        except ValueError as exc:
            # e.g. source and output dirs on different Windows drives.
            raise SkillRenderError(
                f"Failed to compute relative path for {skill_path} "
                f"relative to {output_path}: {exc}"
            ) from exc

        records.append(SkillRecord(
            skill_id=i,
            skill_path=skill_path,
            domain=domain,
            skill_name=skill_name,
            difficulty=difficulty,
            risk_level=risk_level,
            phases=phases,
            gov_filename=gov_filename,
            rel_path=rel_path,
        ))

    file_contents = {}
    for rec in records:
        file_contents[rec.gov_filename] = render_gov_content(rec)

    index_content = render_index_content(records)

    return Manifest(records=records, file_contents=file_contents, index_content=index_content)


@dataclass
class Plan:
    to_add: List[str] = field(default_factory=list)
    to_update: List[str] = field(default_factory=list)
    to_delete: List[str] = field(default_factory=list)
    unchanged: List[str] = field(default_factory=list)
    index_changed: bool = False

    @property
    def has_drift(self) -> bool:
        return bool(self.to_add or self.to_update or self.to_delete or self.index_changed)


def compute_plan(manifest: Manifest, output_path: Path) -> Plan:
    """Diff the desired manifest against the current output directory state."""
    plan = Plan()

    existing_usr_files = set()
    if output_path.exists():
        existing_usr_files = {p.name for p in output_path.glob("USR-*.gov.md")}

    desired_names = set(manifest.file_contents.keys())

    for name in sorted(desired_names):
        desired_content = manifest.file_contents[name]
        target = output_path / name
        if name not in existing_usr_files:
            plan.to_add.append(name)
        else:
            try:
                current_content = target.read_text(encoding="utf-8")
            except Exception:
                current_content = None
            if current_content != desired_content:
                plan.to_update.append(name)
            else:
                plan.unchanged.append(name)

    for name in sorted(existing_usr_files - desired_names):
        plan.to_delete.append(name)

    index_path = output_path / "INDEX.md"
    if index_path.exists():
        try:
            current_index = index_path.read_text(encoding="utf-8")
        except Exception:
            current_index = None
        plan.index_changed = current_index != manifest.index_content
    else:
        plan.index_changed = True

    return plan


def print_plan(plan: Plan) -> None:
    print(f"To add:      {len(plan.to_add)}")
    print(f"To update:   {len(plan.to_update)}")
    print(f"To delete:   {len(plan.to_delete)}")
    print(f"Unchanged:   {len(plan.unchanged)}")
    print(f"Index changed: {plan.index_changed}")
    for name in plan.to_add:
        print(f"  + {name}")
    for name in plan.to_update:
        print(f"  ~ {name}")
    for name in plan.to_delete:
        print(f"  - {name}")


def _atomic_write(target: Path, content: str) -> None:
    """Write content to target atomically via temp file + os.replace."""
    target.parent.mkdir(parents=True, exist_ok=True)
    fd, tmp_path = tempfile.mkstemp(
        dir=str(target.parent), prefix=f".{target.name}.", suffix=".tmp"
    )
    try:
        with os.fdopen(fd, "w", encoding="utf-8", newline="\n") as f:
            f.write(content)
        os.replace(tmp_path, target)
    except BaseException:
        try:
            os.unlink(tmp_path)
        except OSError:
            pass
        raise


def apply_manifest(manifest: Manifest, plan: Plan, output_path: Path) -> None:
    """
    Apply add/update/delete operations for real, atomically per-file.
    The manifest must already be fully computed in memory (build_manifest
    raises before this is ever called if any source could not be rendered).
    """
    output_path.mkdir(parents=True, exist_ok=True)

    for name in plan.to_add + plan.to_update:
        _atomic_write(output_path / name, manifest.file_contents[name])

    for name in plan.to_delete:
        target = output_path / name
        try:
            target.unlink()
        except FileNotFoundError:
            pass

    if plan.index_changed:
        _atomic_write(output_path / "INDEX.md", manifest.index_content)


def parse_args(argv: Optional[List[str]] = None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Generate/reconcile user skills governance registry.")
    parser.add_argument(
        "--output-dir",
        type=str,
        default=None,
        help="Override the output directory (defaults to the real registry user-skills path).",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Compute the plan and print it. Zero writes.",
    )
    parser.add_argument(
        "--check",
        action="store_true",
        help="Compute the plan; exit nonzero if drift exists. Zero writes.",
    )
    return parser.parse_args(argv)


def main(argv: Optional[List[str]] = None) -> int:
    args = parse_args(argv)

    output_path = Path(args.output_dir).resolve() if args.output_dir else OUTPUT_PATH

    print(f"Skill library: {SKILL_LIBRARY_PATH}")
    print(f"Output dir:    {output_path}")

    try:
        manifest = build_manifest(SKILL_LIBRARY_PATH, output_path)
    except SkillRenderError as exc:
        print(f"ERROR: {exc}")
        print("Aborting before any mutation. Target directory left unchanged.")
        return 2

    print(f"Found {len(manifest.records)} skill files")
    print("-" * 50)

    plan = compute_plan(manifest, output_path)

    if args.dry_run:
        print("[dry-run] Computed plan (no writes performed):")
        print_plan(plan)
        return 0

    if args.check:
        print_plan(plan)
        if plan.has_drift:
            print("DRIFT DETECTED")
            return 1
        print("No drift. Registry matches desired manifest.")
        return 0

    # Apply mode.
    apply_manifest(manifest, plan, output_path)
    print("Applied reconciliation:")
    print_plan(plan)
    print(f"Generated {len(manifest.records)} governance files")
    print("Created/updated INDEX.md" if plan.index_changed else "INDEX.md unchanged")
    return 0


if __name__ == "__main__":
    sys.exit(main())
