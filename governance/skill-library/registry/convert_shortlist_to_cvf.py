#!/usr/bin/env python3
"""
Convert SkillsMP shortlist into CVF skill files (v1.5.2 library).

Rules:
- CVF is the canonical base.
- Avoid duplicate repos (one skill per repo).
- For near-duplicates, prefer richer descriptions.
- Generate CVF-compliant .skill.md files with required sections.
"""

from __future__ import annotations

import argparse
import json
import re
from collections import defaultdict
from dataclasses import dataclass
from datetime import date
from pathlib import Path
from typing import Dict, List, Optional, Tuple
from urllib.parse import urlparse


ROOT_DIR = Path(__file__).resolve().parents[3]
SHORTLIST_PATH = ROOT_DIR / "governance" / "skill-library" / "registry" / "external-sources" / "skillsmp" / "skillsmp_shortlist.json"
SKILL_ROOT = ROOT_DIR / "EXTENSIONS" / "CVF_v1.5.2_SKILL_LIBRARY_FOR_END_USERS"
MAP_OUTPUT = ROOT_DIR / "governance" / "skill-library" / "registry" / "external-sources" / "skillsmp" / "skillsmp_to_cvf_map.md"

TODAY = date(2026, 2, 7)

DOMAIN_RISK_MAP = {
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

DOMAIN_PHASES_MAP = {
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


@dataclass
class SkillCandidate:
    name: str
    description: str
    source: str
    cvf_domain: str
    score: float
    matched_query: str
    repo_key: str
    raw: Dict[str, object]


def load_shortlist(path: Path) -> List[Dict[str, object]]:
    payload = json.loads(path.read_text(encoding="utf-8"))
    return payload.get("skills", [])


def normalize_name(value: str) -> str:
    value = value.lower().strip()
    value = re.sub(r"[^a-z0-9]+", "_", value)
    return value.strip("_")


def repo_key_from_source(source: str) -> str:
    if not source:
        return ""
    parsed = urlparse(source)
    if parsed.netloc and "github.com" in parsed.netloc.lower():
        parts = [p for p in parsed.path.split("/") if p]
        if len(parts) >= 2:
            return f"{parts[0].lower()}/{parts[1].lower()}"
    match = re.search(r"github\\.com/([^/]+)/([^/]+)", source, re.IGNORECASE)
    if match:
        return f"{match.group(1).lower()}/{match.group(2).lower()}"
    return source.split("?")[0].lower()


def choose_best(candidates: List[SkillCandidate]) -> SkillCandidate:
    candidates.sort(key=lambda x: (len(x.description or ""), x.score), reverse=True)
    return candidates[0]


def dedupe_candidates(candidates: List[SkillCandidate]) -> List[SkillCandidate]:
    by_repo: Dict[str, List[SkillCandidate]] = defaultdict(list)
    for cand in candidates:
        by_repo[cand.repo_key or cand.name.lower()].append(cand)

    chosen = [choose_best(group) for group in by_repo.values()]

    by_name: Dict[str, List[SkillCandidate]] = defaultdict(list)
    for cand in chosen:
        by_name[normalize_name(cand.name)].append(cand)

    return [choose_best(group) for group in by_name.values()]


def parse_difficulty(domain: str) -> Tuple[str, str]:
    if domain in {"security_compliance", "legal_contracts", "finance_analytics"}:
        return "Advanced", "⭐⭐⭐"
    if domain in {"app_development", "technical_review", "web_development"}:
        return "Medium", "⭐⭐"
    return "Easy", "⭐"


def domain_title(domain: str) -> str:
    return domain.replace("_", " ").title()


def ensure_domain_dir(domain: str) -> Path:
    path = SKILL_ROOT / domain
    path.mkdir(parents=True, exist_ok=True)
    return path


def domain_uses_numbers(domain_path: Path) -> bool:
    files = list(domain_path.glob("*.skill.md"))
    if not files:
        return False
    with_numbers = [f for f in files if re.match(r"^\\d+_", f.name)]
    return len(with_numbers) >= max(1, len(files) // 2)


def next_domain_index(domain_path: Path) -> int:
    indices = []
    for file in domain_path.glob("*.skill.md"):
        match = re.match(r"^(\\d+)_", file.name)
        if match:
            indices.append(int(match.group(1)))
    return max(indices) + 1 if indices else 1


def slugify(name: str) -> str:
    slug = normalize_name(name)
    return slug or "skill"


def pick_related_skills(domain_path: Path, exclude: str, limit: int = 2) -> List[Tuple[str, str]]:
    options = []
    for file in sorted(domain_path.glob("*.skill.md")):
        if file.name == exclude:
            continue
        title = extract_title(file)
        options.append((title, file.name))
    return options[:limit]


def extract_title(path: Path) -> str:
    for line in path.read_text(encoding="utf-8", errors="ignore").splitlines():
        if line.startswith("# "):
            return line.replace("# ", "").strip()
    return path.stem.replace(".skill", "").replace("_", " ").title()


def format_title(name: str) -> str:
    if not name:
        return "External Skill"
    words = re.split(r"[\\s_\\-]+", name.strip())
    return " ".join([w.capitalize() for w in words if w])


def render_skill_content(candidate: SkillCandidate, filename: str, related: List[Tuple[str, str]]) -> str:
    difficulty_label, difficulty_stars = parse_difficulty(candidate.cvf_domain)
    title = format_title(candidate.name)
    description = candidate.description.strip() or f"Skill hỗ trợ {title} theo chuẩn CVF."
    description = description.replace("\n", " ").strip()

    related_lines = "\n".join([f"- [{title}](./{fname})" for title, fname in related]) or "- [App Requirements Spec](./01_app_requirements_spec.skill.md)"
    source_line = f"- Nguồn tham khảo: {candidate.source}" if candidate.source else "- Nguồn tham khảo: SkillsMP"
    uat_record = f"../../../governance/skill-library/uat/results/UAT-{slugify(candidate.name)}.md"
    risk_level = DOMAIN_RISK_MAP.get(candidate.cvf_domain, "R1")
    allowed_phases = DOMAIN_PHASES_MAP.get(candidate.cvf_domain, "Discovery, Design")
    autonomy = RISK_AUTONOMY.get(risk_level, "Human confirmation required")
    authority_scope = "Informational" if risk_level == "R0" else "Tactical" if risk_level in {"R1", "R2"} else "Strategic"

    return f"""# {title}

> **Domain:** {domain_title(candidate.cvf_domain)}  
> **Difficulty:** {difficulty_stars} {difficulty_label} — [Xem criteria](../DIFFICULTY_GUIDE.md)  
> **CVF Version:** v1.5.2  
> **Skill Version:** 1.0.0  
> **Last Updated:** {TODAY.isoformat()}

---

## 📌 Prerequisites

Không yêu cầu bắt buộc. Nên chuẩn bị bối cảnh ngắn gọn về dự án để AI hiểu đúng phạm vi.

---

## 🎯 Mục đích

> {description}

**Khi nào dùng skill này:**
- Cần {title} với tiêu chí rõ ràng
- Muốn chuẩn hóa quy trình trước khi thực thi
- Muốn đầu ra có cấu trúc, dễ review

**Không phù hợp khi:**
- Thiếu thông tin đầu vào tối thiểu
- Mục tiêu đang mơ hồ, chưa thống nhất

---

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
- UAT Record: [{slugify(candidate.name)}]({uat_record})
- UAT Objective: Skill phải đạt chuẩn output theo CVF + không vượt quyền

---

## 📋 Form Input

| Field | Mô tả | Bắt buộc | Ví dụ |
|-------|-------|:--------:|-------|
| **Objective** | Mục tiêu chính | ✅ | "{title} cho sản phẩm SaaS nhỏ" |
| **Context** | Bối cảnh dự án | ✅ | "Team 3 người, deadline 2 tuần" |
| **Constraints** | Ràng buộc kỹ thuật | ✅ | "Chỉ dùng stack hiện có" |
| **Input Data** | Dữ liệu liên quan | ❌ | "Repo hiện tại, tài liệu liên quan" |
| **Output Format** | Định dạng mong muốn | ❌ | "Checklist + đề xuất" |

---

## ✅ Expected Output

**Kết quả bạn sẽ nhận được:**

```markdown
# {title} Output

## Summary
- Goal: [Objective]
- Context: [Context]
- Constraints: [Constraints]

## Key Findings
1. [Finding 1]
2. [Finding 2]
3. [Finding 3]

## Recommendations
- [Recommendation 1]
- [Recommendation 2]

## Next Steps
- [Action 1]
- [Action 2]
```

---

## 🔍 Cách đánh giá

**Checklist Accept/Reject:**

- [ ] Mục tiêu rõ ràng, bám sát bối cảnh
- [ ] Đầu ra có cấu trúc, dễ hiểu
- [ ] Có khuyến nghị cụ thể, hành động được
- [ ] Không vượt quá phạm vi yêu cầu

**Red flags (cần Reject):**
- ⚠️ Output chung chung, không actionable
- ⚠️ Bỏ qua constraints hoặc context
- ⚠️ Tự ý mở rộng scope

---

## ⚠️ Common Failures

| Lỗi thường gặp | Cách phòng tránh |
|----------------|------------------|
| Thiếu context | Yêu cầu input tối thiểu trước khi xử lý |
| Output quá dài | Tóm tắt trước, chi tiết sau |
| Không có action | Bắt buộc đề xuất bước tiếp theo |

---

## 💡 Tips

- Ưu tiên bối cảnh ngắn, rõ, có ràng buộc
- Đưa ra 2-3 khuyến nghị khả thi nhất
- Nếu thiếu dữ liệu, hỏi lại trước khi trả lời
{source_line}

---

## 📊 Ví dụ thực tế

**Input mẫu:**
```text
Objective: {title} cho ứng dụng quản lý công việc
Context: Startup 5 người, cần go-live 3 tuần
Constraints: Không đổi stack, ưu tiên tốc độ triển khai
Output Format: Checklist + đề xuất
```

**Output mẫu:**
```markdown
# {title} Output

## Summary
- Goal: {title} cho ứng dụng quản lý công việc
- Context: Startup 5 người, go-live 3 tuần
- Constraints: Giữ nguyên stack, ưu tiên tốc độ

## Key Findings
1. Quy trình hiện thiếu bước review rủi ro
2. Chưa có tiêu chí đo lường thành công
3. Thiếu checklist QA tối thiểu

## Recommendations
- Chuẩn hóa checklist triển khai
- Xác định KPI trước khi build

## Next Steps
- Thống nhất scope MVP
- Tạo checklist review lần 1
```

---

## 🔗 Related Skills

{related_lines}

---

## 🔗 Next Step

Áp dụng output vào kế hoạch thực thi hoặc chuyển sang skill tiếp theo trong domain.

---

## 📜 Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | {TODAY.isoformat()} | Initial CVF skill (imported from SkillsMP) |
"""


def write_skill(domain_path: Path, filename: str, content: str) -> None:
    path = domain_path / filename
    path.write_text(content, encoding="utf-8")


def build_candidates(raw_skills: List[Dict[str, object]]) -> List[SkillCandidate]:
    candidates = []
    for entry in raw_skills:
        name = str(entry.get("name") or "").strip() or "External Skill"
        description = str(entry.get("description") or "").strip()
        source = str(entry.get("source") or "").strip()
        cvf_domain = str(entry.get("cvf_domain") or "app_development").strip()
        score = float(entry.get("score") or 0)
        matched_query = str(entry.get("matched_query") or "")
        repo_key = repo_key_from_source(source)
        candidates.append(
            SkillCandidate(
                name=name,
                description=description,
                source=source,
                cvf_domain=cvf_domain,
                score=score,
                matched_query=matched_query,
                repo_key=repo_key,
                raw=entry,
            )
        )
    return candidates


def main() -> int:
    parser = argparse.ArgumentParser(description="Convert SkillsMP shortlist to CVF skills.")
    parser.add_argument("--limit", type=int, default=50, help="Max skills to import.")
    parser.add_argument("--dry-run", action="store_true", help="Do not write files.")
    args = parser.parse_args()

    if not SHORTLIST_PATH.exists():
        raise SystemExit(f"Missing shortlist: {SHORTLIST_PATH}")

    raw_skills = load_shortlist(SHORTLIST_PATH)
    candidates = build_candidates(raw_skills)
    deduped = dedupe_candidates(candidates)
    deduped.sort(key=lambda x: x.score, reverse=True)
    selected = deduped[: args.limit]

    created = []
    for cand in selected:
        domain_path = ensure_domain_dir(cand.cvf_domain)
        use_numbers = domain_uses_numbers(domain_path)
        if use_numbers:
            index = next_domain_index(domain_path)
            filename_base = f"{index:02d}_{slugify(cand.name)}.skill.md"
        else:
            filename_base = f"{slugify(cand.name)}.skill.md"

        existing = {f.name for f in domain_path.glob("*.skill.md")}
        filename = filename_base
        counter = 2
        while filename in existing:
            if use_numbers:
                filename = f"{index:02d}_{slugify(cand.name)}_{counter}.skill.md"
            else:
                filename = f"{slugify(cand.name)}_{counter}.skill.md"
            counter += 1

        related = pick_related_skills(domain_path, filename)
        content = render_skill_content(cand, filename, related)

        if not args.dry_run:
            write_skill(domain_path, filename, content)

        created.append((cand, domain_path.name, filename))

    map_lines = [
        "# SkillsMP → CVF Skill Import Map",
        "",
        f"> **Total Imported:** {len(created)}  ",
        f"> **Generated:** {TODAY.isoformat()}  ",
        "",
        "| # | CVF Domain | CVF File | Skill Name | Source | Query | Score |",
        "|---|------------|----------|------------|--------|-------|-------|",
    ]
    for idx, (cand, domain, filename) in enumerate(created, start=1):
        source = cand.source or "-"
        query = cand.matched_query or "-"
        map_lines.append(
            f"| {idx} | {domain} | {filename} | {cand.name} | {source} | {query} | {cand.score:.2f} |"
        )

    if not args.dry_run:
        MAP_OUTPUT.write_text("\n".join(map_lines) + "\n", encoding="utf-8")

    print(f"Selected: {len(selected)}")
    print(f"Written: {len(created)}")
    print(f"Map: {MAP_OUTPUT}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
