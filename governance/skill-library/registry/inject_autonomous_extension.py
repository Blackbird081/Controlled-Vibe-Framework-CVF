#!/usr/bin/env python3
"""
Inject CVF Autonomous Extension block into skill files that don't have it.
"""

from __future__ import annotations

import re
from datetime import date
from pathlib import Path
from typing import Dict


ROOT_DIR = Path(__file__).resolve().parents[3]
SKILL_ROOT = ROOT_DIR / "EXTENSIONS" / "CVF_v1.5.2_SKILL_LIBRARY_FOR_END_USERS"
TODAY = date(2026, 2, 7)

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

DOMAIN_PHASES_MAP: Dict[str, str] = {
    "ai_ml_evaluation": "Discovery, Design, Review",
    "app_development": "Discovery, Design, Build",
    "business_analysis": "Discovery",
    "content_creation": "Discovery, Design",
    "finance_analytics": "Discovery, Review",
    "hr_operations": "Discovery, Review",
    "legal_contracts": "Discovery, Review",
    "marketing_seo": "Discovery, Design",
    "product_ux": "Discovery, Design, Review",
    "security_compliance": "Design, Review",
    "technical_review": "Build, Review",
    "web_development": "Design, Build",
}

RISK_AUTONOMY = {
    "R0": "Auto",
    "R1": "Auto + Audit",
    "R2": "Human confirmation required",
    "R3": "Suggest-only",
    "R4": "Blocked",
}


def slug_to_domain(name: str) -> str:
    return name.lower().strip().replace(" ", "_")


def build_block(domain: str, skill_id: str) -> str:
    risk_level = DOMAIN_RISK_MAP.get(domain, "R1")
    allowed_phases = DOMAIN_PHASES_MAP.get(domain, "Discovery, Design")
    autonomy = RISK_AUTONOMY.get(risk_level, "Human confirmation required")
    authority_scope = "Informational" if risk_level == "R0" else "Tactical" if risk_level in {"R1", "R2"} else "Strategic"
    uat_record = f"../../../governance/skill-library/uat/results/UAT-{skill_id}.md"

    return f"""
## 🛡️ Governance Summary (CVF Autonomous)

| Field | Value |
|-------|-------|
| Risk Level | {risk_level} |
| Allowed Roles | User, Reviewer |
| Allowed Phases | {allowed_phases} |
| Authority Scope | {authority_scope} |
| Autonomy | {autonomy} |
| Audit Hooks | Input completeness, Output structure, Scope guard |

---

## ⛔ Execution Constraints

- Không thực thi ngoài phạm vi được khai báo
- Tự động dừng nếu thiếu input bắt buộc
- Với rủi ro {risk_level}: {autonomy.lower()}
- Không ghi/đổi dữ liệu hệ thống nếu chưa được xác nhận

---

## ✅ Validation Hooks

- Check đủ input bắt buộc trước khi bắt đầu
- Check output đúng format đã định nghĩa
- Check không vượt scope và không tạo hành động ngoài yêu cầu
- Check output có bước tiếp theo cụ thể

---

## 🧪 UAT Binding

- Template: [AGENT_AI_UAT_CVF_TEMPLATE](../../../governance/skill-library/uat/AGENT_AI_UAT_CVF_TEMPLATE.md)
- UAT Record: [{skill_id}]({uat_record})
- UAT Objective: Skill phải đạt chuẩn output theo CVF + không vượt quyền

---
""".lstrip()


def insert_block(text: str, block: str, skill_id: str) -> str:
    if "## 🛡️ Governance Summary (CVF Autonomous)" in text:
        lines = text.splitlines()
        has_uat = any("UAT Record:" in line for line in lines)
        updated_lines = []
        inserted = False
        uat_line = f"- UAT Record: [{skill_id}](../../../governance/skill-library/uat/results/UAT-{skill_id}.md)"
        for line in lines:
            if line.strip() == "\\1":
                continue
            updated_lines.append(line)
            if (not has_uat) and line.strip().startswith("- Template:") and not inserted:
                updated_lines.append(uat_line)
                inserted = True
        return "\n".join(updated_lines)

    form_idx = text.find("## 📋 Form Input")
    if form_idx != -1:
        return text[:form_idx] + block + text[form_idx:]

    output_idx = text.find("## ✅ Expected Output")
    if output_idx != -1:
        return text[:output_idx] + block + text[output_idx:]

    return text.rstrip() + "\n\n---\n\n" + block


def extract_domain(text: str, fallback: str) -> str:
    match = re.search(r">\\s*\\*\\*Domain:\\*\\*\\s*(.+)$", text, re.MULTILINE)
    if match:
        return slug_to_domain(match.group(1))
    return fallback


def main() -> int:
    skill_files = list(SKILL_ROOT.rglob("*.skill.md"))
    updated = 0

    for path in skill_files:
        text = path.read_text(encoding="utf-8")
        skill_id = path.stem.replace(".skill", "")
        domain = extract_domain(text, path.parent.name)
        block = build_block(domain, skill_id)
        new_text = insert_block(text, block, skill_id)
        if new_text != text:
            path.write_text(new_text, encoding="utf-8")
            updated += 1

    print(f"Updated {updated} skill files.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
