#!/usr/bin/env python3
"""
Generate governance registry files for v1.5.2 user skills.
Each .gov.md file is a lightweight governance metadata record.
"""

import os
import re
from pathlib import Path

# Configuration
ROOT_DIR = Path(__file__).resolve().parents[3]
SKILL_LIBRARY_PATH = ROOT_DIR / "EXTENSIONS" / "CVF_v1.5.2_SKILL_LIBRARY_FOR_END_USERS"
OUTPUT_PATH = ROOT_DIR / "governance" / "skill-library" / "registry" / "user-skills"

# Domain → Default Risk Level mapping
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

# Domain → Allowed Phases mapping
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

def extract_skill_name(filepath: Path) -> str:
    """Extract skill name from file, reading the first H1 header."""
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
            match = re.search(r'^#\s+(.+)$', content, re.MULTILINE)
            if match:
                return match.group(1).strip()
    except Exception as e:
        print(f"Error reading {filepath}: {e}")
    
    # Fallback: use filename
    name = filepath.stem.replace('.skill', '')
    name = re.sub(r'^\d+_', '', name)  # Remove leading numbers
    return name.replace('_', ' ').title()

def extract_difficulty(filepath: Path) -> str:
    """Extract difficulty from skill file."""
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
            if "⭐⭐⭐" in content:
                return "Advanced"
            elif "⭐⭐" in content:
                return "Medium"
            elif "⭐" in content:
                return "Easy"
    except:
        pass
    return "Medium"

def generate_gov_file(skill_path: Path, skill_id: int):
    """Generate a governance registry file for a skill."""
    
    domain = skill_path.parent.name
    skill_name = extract_skill_name(skill_path)
    difficulty = extract_difficulty(skill_path)
    risk_level = DOMAIN_RISK_MAP.get(domain, "R1")
    phases = DOMAIN_PHASES_MAP.get(domain, "Discovery, Design")
    
    # Generate filename
    filename_base = skill_path.stem.replace('.skill', '')
    gov_filename = f"USR-{skill_id:03d}_{filename_base}.gov.md"
    
    # Relative path to skill file (from registry/user-skills)
    rel_path = Path(os.path.relpath(skill_path, OUTPUT_PATH)).as_posix()
    
    # Determine autonomy based on risk level
    autonomy_map = {"R0": "Auto", "R1": "Auto + Audit", "R2": "Human confirmation required", "R3": "Suggest only", "R4": "Blocked"}
    autonomy = autonomy_map.get(risk_level, "Human confirmation required")
    
    # Generate content
    content = f"""# USR-{skill_id:03d}: {skill_name}

> **Type:** User Skill  
> **Domain:** {domain.replace('_', ' ').title()}  
> **Difficulty:** {difficulty}  
> **Status:** Active

---

## Source

→ [{skill_path.name}]({rel_path})

---

## Governance

| Field | Value |
|-------|-------|
| Risk Level | {risk_level} |
| Allowed Roles | User, Reviewer |
| Allowed Phases | {phases} |
| Decision Scope | {("Informational" if risk_level == "R0" else "Tactical" if risk_level in ["R1", "R2"] else "Strategic")} |
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
    
    # Write file
    output_file = OUTPUT_PATH / gov_filename
    with open(output_file, 'w', encoding='utf-8') as f:
        f.write(content)
    
    return gov_filename

def main():
    # Ensure output directory exists
    OUTPUT_PATH.mkdir(parents=True, exist_ok=True)
    
    # Find all skill files
    skill_files = sorted(SKILL_LIBRARY_PATH.rglob("*.skill.md"))
    
    print(f"Found {len(skill_files)} skill files")
    print("-" * 50)
    
    generated = []
    for i, skill_path in enumerate(skill_files, start=1):
        filename = generate_gov_file(skill_path, i)
        generated.append(filename)
        print(f"[{i:03d}] {filename}")
    
    print("-" * 50)
    print(f"Generated {len(generated)} governance files")
    
    # Create index file
    index_content = f"""# User Skills Registry Index

> **Total Skills:** {len(generated)}  
> **Generated:** Auto-generated from v1.5.2 SKILL_LIBRARY  
> **Last Updated:** Feb 07, 2026

---

## Skills by Domain

"""
    
    # Group by domain
    domains = {}
    for skill_path in skill_files:
        domain = skill_path.parent.name
        if domain not in domains:
            domains[domain] = []
        domains[domain].append(skill_path)
    
    skill_idx = 1
    for domain in sorted(domains.keys()):
        index_content += f"\n### {domain.replace('_', ' ').title()} ({len(domains[domain])} skills)\n\n"
        for skill_path in sorted(domains[domain]):
            filename_base = skill_path.stem.replace('.skill', '')
            gov_file = f"USR-{skill_idx:03d}_{filename_base}.gov.md"
            skill_name = extract_skill_name(skill_path)
            index_content += f"- [{gov_file}](./{gov_file}) - {skill_name}\n"
            skill_idx += 1
    
    with open(OUTPUT_PATH / "INDEX.md", 'w', encoding='utf-8') as f:
        f.write(index_content)
    
    print(f"Created INDEX.md")

if __name__ == "__main__":
    main()
