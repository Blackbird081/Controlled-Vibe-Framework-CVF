#!/usr/bin/env python3
"""
Generate SKILL_MAPPING_RECORD files for all CVF skills.
"""

from __future__ import annotations

import re
from datetime import date, timedelta
from pathlib import Path
from typing import Dict, List


ROOT_DIR = Path(__file__).resolve().parents[3]
SKILL_ROOT = ROOT_DIR / "EXTENSIONS" / "CVF_v1.5.2_SKILL_LIBRARY_FOR_END_USERS"
OUTPUT_DIR = ROOT_DIR / "governance" / "skill-library" / "registry" / "mapping-records"

TODAY = date(2026, 2, 7)
NEXT_REVIEW = TODAY + timedelta(days=180)

DOMAIN_RISK_MAP: Dict[str, str] = {
    "ai_ml_evaluation": "R1",
    "app_development": "R1",
    "business_analysis": "R1",
    "content_creation": "R0",
    "finance_analytics": "R2",
    "hr_operations": "R2",
    "legal_contracts": "R2",
    "marketing_seo": "R1",
    "product_ux": "R1",
    "security_compliance": "R2",
    "technical_review": "R1",
    "web_development": "R1",
}


def parse_metadata(text: str) -> Dict[str, str]:
    def match(pattern: str) -> str:
        found = re.search(pattern, text, re.MULTILINE)
        return found.group(1).strip() if found else ""

    return {
        "title": match(r"^#\s+(.+)$"),
        "domain": match(r">\s*\*\*Domain:\*\*\s*(.+)$"),
        "cvf_version": match(r">\s*\*\*CVF Version:\*\*\s*(.+)$"),
        "skill_version": match(r">\s*\*\*Skill Version:\*\*\s*(.+)$"),
        "last_updated": match(r">\s*\*\*Last Updated:\*\*\s*(.+)$"),
    }


def extract_form_inputs(text: str) -> List[str]:
    if "## 📋 Form Input" not in text:
        return []
    section = text.split("## 📋 Form Input", 1)[-1]
    if "## " in section:
        section = section.split("## ", 1)[0]
    lines = [line.strip() for line in section.splitlines() if line.strip().startswith("|")]
    if len(lines) < 3:
        return []
    inputs = []
    for line in lines[2:]:
        parts = [p.strip() for p in line.strip("|").split("|")]
        if parts and parts[0]:
            field = re.sub(r"\*\*", "", parts[0]).strip()
            inputs.append(field)
    return inputs


def extract_governance(text: str) -> Dict[str, str]:
    def row(label: str) -> str:
        found = re.search(rf"\\|\\s*{re.escape(label)}\\s*\\|\\s*([^|]+)\\|", text)
        if not found:
            return ""
        value = found.group(1) if found.group(1) else ""
        return value.strip()

    return {
        "risk_level": row("Risk Level"),
        "allowed_roles": row("Allowed Roles"),
        "allowed_phases": row("Allowed Phases"),
        "authority_scope": row("Authority Scope"),
        "autonomy": row("Autonomy"),
    }


def extract_source(text: str) -> str:
    for line in text.splitlines():
        if line.strip().startswith("- Nguồn tham khảo:"):
            return line.split(":", 1)[1].strip()
    return "Internal CVF"


def risk_level_for_domain(domain_slug: str) -> str:
    return DOMAIN_RISK_MAP.get(domain_slug, "R1")


def checkbox_line(label: str, checked: bool) -> str:
    return f"- {'☑' if checked else '☐'} {label}"


def build_record(skill_id: str, text: str, path: Path) -> str:
    meta = parse_metadata(text)
    domain_slug = path.parent.name
    domain_display = meta["domain"] or domain_slug.replace("_", " ").title()
    governance = extract_governance(text)
    risk_level = governance["risk_level"] or risk_level_for_domain(domain_slug)
    allowed_roles = governance["allowed_roles"] or "User, Reviewer"
    allowed_phases = governance["allowed_phases"] or "Discovery, Design"
    authority_scope = governance["authority_scope"] or ("Informational" if risk_level == "R0" else "Tactical")
    autonomy = governance["autonomy"] or ("Auto + Audit" if risk_level == "R1" else "Human confirmation required")
    inputs = extract_form_inputs(text)
    source = extract_source(text)
    external = source != "Internal CVF"

    def has_role(role: str) -> bool:
        return role.lower() in allowed_roles.lower()

    def has_phase(phase: str) -> bool:
        return phase.lower() in allowed_phases.lower()

    scope_labels = {
        "Informational": authority_scope == "Informational",
        "Tactical": authority_scope == "Tactical",
        "Strategic": authority_scope == "Strategic",
    }

    risk_checks = {
        "R0": risk_level == "R0",
        "R1": risk_level == "R1",
        "R2": risk_level == "R2",
        "R3": risk_level == "R3",
        "R4": risk_level == "R4",
    }

    input_types = ", ".join(inputs) if inputs else "Objective, Context, Constraints"
    data_sensitivity = "Public" if risk_level == "R0" else "Internal" if risk_level == "R1" else "Restricted"
    output_persistence = "Logged"
    autonomy_level = "Autonomous" if risk_level == "R0" else "Conditional" if risk_level in {"R1", "R2"} else "None"

    return f"""# SKILL MAPPING RECORD — {meta['title'] or skill_id}

> **Skill ID:** {skill_id}  
> **Domain:** {domain_display}  
> **Generated:** {TODAY.isoformat()}

---

## 1. Skill Identity

- Skill ID: {skill_id}
- Skill Name: {meta['title'] or skill_id}
- Version: {meta['skill_version'] or "1.0.0"}
- Source:
  - URL / Repository: {source}
  - Original Author: External / Unknown
- Intake Date: {TODAY.isoformat()}
- Intake Owner: CVF Governance

---

## 2. Capability Summary

### 2.1 Core Capability
{meta['title'] or skill_id} theo chuẩn CVF, tạo output có cấu trúc và giới hạn phạm vi.

### 2.2 Inputs
- Input types: {input_types}
- Required data sensitivity level: {data_sensitivity}

### 2.3 Outputs
- Output types: Structured markdown
- Output persistence (ephemeral / logged / stored): {output_persistence}

### 2.4 Execution Model
- Invocation: Agent-invoked
- Execution: Sync
- Autonomy level: {autonomy_level}

---

## 3. CVF Risk Mapping

### 3.1 Assigned Risk Level
{checkbox_line("R0 – Informational (Read-only, no side effects)", risk_checks["R0"])}
{checkbox_line("R1 – Advisory (Suggestions only, human confirmation required)", risk_checks["R1"])}
{checkbox_line("R2 – Assisted Execution (Bounded actions, explicit invocation)", risk_checks["R2"])}
{checkbox_line("R3 – Autonomous Execution (Multi-step, requires authorization)", risk_checks["R3"])}
{checkbox_line("R4 – Critical / Blocked (Severe damage potential, execution blocked)", risk_checks["R4"])}

### 3.2 Risk Justification
Risk level {risk_level} phù hợp với domain {domain_display} và được ràng buộc bởi governance summary.

### 3.3 Failure Scenarios
- Primary failure mode: Output vượt scope / thiếu kiểm soát
- Secondary failure modes: Thiếu input hoặc diễn giải sai context

### 3.4 Blast Radius Assessment
- Scope of impact: {("Minimal" if risk_level == "R0" else "Limited" if risk_level == "R1" else "Moderate")}
- Reversibility: {("Easy" if risk_level in {"R0", "R1"} else "Moderate")}
- Data exposure risk: {data_sensitivity}

---

## 4. Authority Mapping
(Refer to CVF_SKILL_RISK_AUTHORITY_LINK.md)

### 4.1 Allowed Agent Roles
{checkbox_line("Orchestrator", has_role("User"))}
{checkbox_line("Architect", False)}
{checkbox_line("Builder", False)}
{checkbox_line("Reviewer", has_role("Reviewer"))}

### 4.2 Allowed CVF Phases
{checkbox_line("Discovery", has_phase("Discovery"))}
{checkbox_line("Design", has_phase("Design"))}
{checkbox_line("Build", has_phase("Build"))}
{checkbox_line("Review", has_phase("Review"))}

### 4.3 Decision Scope Influence
{checkbox_line("Informational", scope_labels["Informational"])}
{checkbox_line("Tactical", scope_labels["Tactical"])}
{checkbox_line("Strategic (requires human oversight)", scope_labels["Strategic"])}

### 4.4 Autonomy Constraints
- Invocation conditions: {autonomy}
- Explicit prohibitions: Không vượt scope, không tự hành động ngoài yêu cầu

Undefined authority is forbidden by default.

---

## 5. Adaptation Requirements

{checkbox_line("No adaptation required", not external)}
{checkbox_line("Capability narrowing required", external)}
{checkbox_line("Execution sandboxing required", False)}
{checkbox_line("Additional audit hooks required", False)}

Describe required adaptations clearly.

---

## 6. UAT & Validation Hooks

### 6.1 Required UAT Scenarios
- Normal operation: Happy path theo form input
- Boundary condition: Thiếu hoặc sai input bắt buộc
- Failure handling: Output vượt scope hoặc thiếu validation

### 6.2 Output Validation
- Acceptance criteria: Output đúng cấu trúc, bám scope, có next steps
- Rejection conditions: Không tuân thủ constraints hoặc output mơ hồ

---

## 7. Decision Record

### 7.1 Intake Outcome
{checkbox_line("Reject", False)}
{checkbox_line("Accept with Restrictions", True)}
{checkbox_line("Accept after Adaptation", False)}

### 7.2 Decision Rationale
Mapped into CVF governance with autonomous constraints enforced.

### 7.3 Decision Authority
- Name / Role: CVF Governance
- Date: {TODAY.isoformat()}
- Signature (if applicable):

---

## 8. Lifecycle Controls

### 8.1 Review Cycle
- Review interval: 6 months
- Next review date: {NEXT_REVIEW.isoformat()}

### 8.2 Deprecation Conditions
Nếu skill bị thay đổi scope hoặc vi phạm governance → deprecate.

---

## 9. Audit References

- Related CVF documents: CVF_RISK_AUTHORITY_MAPPING, CVF_AUTONOMOUS_EXTENSION
- Change log entries: -
- Incident references (if any): -

---

## 10. Final Assertion

By approving this record, the decision authority confirms that:
- The skill is bound to CVF governance
- Its risks are understood and accepted
- Its authority is explicitly constrained

Unrecorded usage of this skill constitutes a CVF violation.
"""


def main() -> int:
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    skill_files = sorted(SKILL_ROOT.rglob("*.skill.md"))
    for path in skill_files:
        skill_id = path.stem.replace(".skill", "")
        text = path.read_text(encoding="utf-8")
        record = build_record(skill_id, text, path)
        (OUTPUT_DIR / f"SKILL-{skill_id}.md").write_text(record, encoding="utf-8")
    print(f"Generated {len(skill_files)} mapping records.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
