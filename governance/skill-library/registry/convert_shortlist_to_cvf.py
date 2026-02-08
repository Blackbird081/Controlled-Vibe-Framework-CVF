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
from datetime import date, datetime, timezone
from pathlib import Path
from typing import Dict, List, Optional, Tuple
from urllib.parse import urlparse


ROOT_DIR = Path(__file__).resolve().parents[3]
SHORTLIST_PATH = ROOT_DIR / "governance" / "skill-library" / "registry" / "external-sources" / "skillsmp" / "skillsmp_shortlist.json"
SKILL_ROOT = ROOT_DIR / "EXTENSIONS" / "CVF_v1.5.2_SKILL_LIBRARY_FOR_END_USERS"
MAP_OUTPUT = ROOT_DIR / "governance" / "skill-library" / "registry" / "external-sources" / "skillsmp" / "skillsmp_to_cvf_map.md"
EXTERNAL_INDEX_PATH = ROOT_DIR / "governance" / "skill-library" / "registry" / "external-sources" / "index.json"

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

DOMAIN_EXAMPLES: Dict[str, Dict[str, object]] = {
    "app_development": {
        "objective": "Thiết kế API cho ứng dụng quản lý dự án",
        "context": "Team 4 dev, cần MVP trong 6 tuần",
        "constraints": "Giữ stack Node/React, ưu tiên scale",
        "findings": [
            "Thiếu tiêu chí phân ranh quyền truy cập",
            "Luồng dữ liệu chưa có chuẩn versioning",
            "Thiếu quy ước error handling thống nhất",
        ],
    },
    "web_development": {
        "objective": "Thiết kế kiến trúc web app cho hệ thống báo cáo",
        "context": "User 5k/ngày, dashboard cập nhật theo giờ",
        "constraints": "Ưu tiên tốc độ tải và cache",
        "findings": [
            "Thiếu phân tách layer dữ liệu và UI",
            "Chưa có chiến lược caching rõ ràng",
            "Thiếu kiểm soát performance trên mobile",
        ],
    },
    "ai_ml_evaluation": {
        "objective": "Đánh giá prompt cho chatbot CSKH",
        "context": "Dữ liệu hội thoại đa ngành, cần đo độ chính xác",
        "constraints": "Không lưu dữ liệu nhạy cảm",
        "findings": [
            "Thiếu tiêu chí đánh giá nhất quán",
            "Chưa có benchmark mẫu theo domain",
            "Output chưa gắn với KPI chất lượng",
        ],
    },
    "business_analysis": {
        "objective": "Phân tích chiến lược mở rộng thị trường",
        "context": "SME Việt, ngân sách 50k USD",
        "constraints": "Dữ liệu thị trường hạn chế",
        "findings": [
            "Giả định thị trường chưa được xác thực",
            "Thiếu so sánh rủi ro theo kịch bản",
            "Chưa có KPI đo hiệu quả triển khai",
        ],
    },
    "content_creation": {
        "objective": "Xây dựng series blog onboarding cho SaaS",
        "context": "Sản phẩm B2B, tập trung chuyển đổi trial",
        "constraints": "Giữ brand voice hiện có",
        "findings": [
            "Thông điệp giá trị chưa nhất quán",
            "Thiếu call-to-action theo từng bài",
            "Chưa có guideline tone/format thống nhất",
        ],
    },
    "marketing_seo": {
        "objective": "Audit SEO cho landing page sản phẩm",
        "context": "Traffic 30k/tháng, conversion thấp",
        "constraints": "Không đổi domain, chỉ tối ưu on-page",
        "findings": [
            "Thiếu cấu trúc heading logic",
            "Meta description chưa bám keyword",
            "Tốc độ tải trang chưa đạt chuẩn",
        ],
    },
    "product_ux": {
        "objective": "Thiết kế flow onboarding cho mobile app",
        "context": "Người dùng mới rơi nhiều ở bước 2",
        "constraints": "Giữ nguyên core feature",
        "findings": [
            "Thiếu bước giải thích giá trị trước khi đăng ký",
            "Luồng hiện quá dài, chưa có skip option",
            "Chưa có thử nghiệm A/B cho bản mới",
        ],
    },
    "finance_analytics": {
        "objective": "Phân tích cash flow 6 tháng",
        "context": "Startup SaaS đang đốt tiền cao",
        "constraints": "Dữ liệu kế toán chưa chuẩn hóa",
        "findings": [
            "Chi phí vận hành tăng nhanh theo quý",
            "Chưa có dự báo dòng tiền theo kịch bản",
            "Thiếu kiểm soát churn ảnh hưởng doanh thu",
        ],
    },
    "legal_contracts": {
        "objective": "Review NDA cho hợp tác đối tác",
        "context": "Đối tác quốc tế, thời hạn 12 tháng",
        "constraints": "Không thay đổi điều khoản core",
        "findings": [
            "Phạm vi bảo mật chưa rõ ràng",
            "Thiếu điều khoản xử lý vi phạm",
            "Không nêu rõ quyền sở hữu IP",
        ],
    },
    "hr_operations": {
        "objective": "Viết JD cho vị trí Product Manager",
        "context": "Công ty scale nhanh, team 10 người",
        "constraints": "Ưu tiên ứng viên có background SaaS",
        "findings": [
            "Tiêu chí đầu vào chưa đo lường được",
            "Thiếu mô tả trách nhiệm theo KPI",
            "Chưa nêu rõ lộ trình phát triển",
        ],
    },
    "security_compliance": {
        "objective": "Audit bảo mật cho API gateway",
        "context": "Hệ thống nhiều microservices",
        "constraints": "Không downtime",
        "findings": [
            "Thiếu kiểm soát rate-limit theo tenant",
            "Chưa có log/trace đầy đủ cho audit",
            "Chính sách token rotation chưa rõ",
        ],
    },
    "technical_review": {
        "objective": "Review PR cho flow xác thực",
        "context": "Repo lớn, nhiều contributor",
        "constraints": "Không đổi logic cốt lõi",
        "findings": [
            "Thiếu test cho edge cases",
            "Chưa có logging cho lỗi auth",
            "Không có guideline rollback",
        ],
    },
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


def external_key_for_skill(source: str, name: str) -> str:
    repo_key = repo_key_from_source(source)
    if repo_key:
        return repo_key
    name_key = normalize_name(name)
    if name_key:
        return f"name:{name_key}"
    return ""


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


def pick_best_existing(paths: List[Path]) -> Path:
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


def normalize_text(text: str) -> str:
    return re.sub(r"\\s+", " ", text or "").strip()


def description_snippet(text: str, limit: int = 140) -> str:
    text = normalize_text(text)
    if not text:
        return ""
    for sep in [". ", "; ", " - ", " — "]:
        if sep in text:
            text = text.split(sep, 1)[0].strip()
            break
    if len(text) > limit:
        text = text[:limit].rsplit(" ", 1)[0].strip() + "..."
    return text


def matched_query_hint(query: str) -> str:
    query = (query or "").strip()
    if not query:
        return ""
    return f"- Keyword focus: {query}"


def render_skill_content(candidate: SkillCandidate, filename: str, related: List[Tuple[str, str]]) -> str:
    difficulty_label, difficulty_stars = parse_difficulty(candidate.cvf_domain)
    title = format_title(candidate.name)
    description = candidate.description.strip() or f"Skill hỗ trợ {title} theo chuẩn CVF."
    description = description.replace("\n", " ").strip()
    snippet = description_snippet(candidate.description)
    query_hint = matched_query_hint(candidate.matched_query)
    domain_example = DOMAIN_EXAMPLES.get(candidate.cvf_domain, {})
    example_objective = domain_example.get("objective") or f"{title} cho ứng dụng quản lý công việc"
    example_context = domain_example.get("context") or snippet or f"Startup 5 người, cần triển khai {title.lower()} trong 3 tuần"
    example_constraints = domain_example.get("constraints") or "Không đổi stack, ưu tiên tốc độ triển khai"
    findings = domain_example.get("findings") or []
    finding_1 = findings[0] if len(findings) > 0 else (snippet or "Quy trình hiện thiếu bước review rủi ro")
    finding_2 = findings[1] if len(findings) > 1 else f"Chưa có tiêu chí đo lường thành công cho {title.lower()}"
    finding_3 = findings[2] if len(findings) > 2 else "Thiếu checklist QA tối thiểu"

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
{query_hint}
{source_line}

---

## 📊 Ví dụ thực tế

**Input mẫu:**
```text
Objective: {example_objective}
Context: {example_context}
Constraints: {example_constraints}
Output Format: Checklist + đề xuất
```

**Output mẫu:**
```markdown
# {title} Output

## Summary
- Goal: {example_objective}
- Context: {example_context}
- Constraints: {example_constraints}

## Key Findings
1. {finding_1}
2. {finding_2}
3. {finding_3}

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
        repo_key = str(entry.get("repo_key") or "") or repo_key_from_source(source)
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


def load_external_index() -> Dict[str, object]:
    if not EXTERNAL_INDEX_PATH.exists():
        return {"repos": {}}
    try:
        payload = json.loads(EXTERNAL_INDEX_PATH.read_text(encoding="utf-8"))
        if isinstance(payload, dict) and isinstance(payload.get("repos"), dict):
            return payload
    except json.JSONDecodeError:
        pass
    return {"repos": {}}


def update_external_imports(created: List[Tuple[SkillCandidate, str, str]]) -> None:
    index = load_external_index()
    repos = index.setdefault("repos", {})
    now = datetime.now(timezone.utc).isoformat()
    for cand, domain, filename in created:
        repo_key = cand.repo_key or external_key_for_skill(cand.source, cand.name)
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
            "source_types": ["skillsmp"],
            "best_score": 0,
            "best_desc_len": 0,
        }
        entry["imported"] = True
        entry["last_seen"] = now
        entry["last_imported"] = now
        if cand.source and cand.source not in entry["sources"]:
            entry["sources"].append(cand.source)
        if cand.name and cand.name not in entry["names"]:
            entry["names"].append(cand.name)
        if cand.raw.get("id") and cand.raw.get("id") not in entry["skillsmp_ids"]:
            entry["skillsmp_ids"].append(cand.raw.get("id"))
        cvf_file = f"{domain}/{filename}"
        if cvf_file not in entry["cvf_files"]:
            entry["cvf_files"].append(cvf_file)
        score = float(cand.score or 0)
        desc_len = len((cand.description or "").strip())
        if score > float(entry.get("best_score") or 0):
            entry["best_score"] = round(score, 2)
        if desc_len > int(entry.get("best_desc_len") or 0):
            entry["best_desc_len"] = desc_len
        repos[repo_key] = entry

    EXTERNAL_INDEX_PATH.parent.mkdir(parents=True, exist_ok=True)
    EXTERNAL_INDEX_PATH.write_text(json.dumps(index, ensure_ascii=False, indent=2), encoding="utf-8")


def main() -> int:
    parser = argparse.ArgumentParser(description="Convert SkillsMP shortlist to CVF skills.")
    parser.add_argument("--limit", type=int, default=50, help="Max skills to import.")
    parser.add_argument("--dry-run", action="store_true", help="Do not write files.")
    parser.add_argument("--refresh-template", action="store_true", help="Re-render existing files using the current template.")
    args = parser.parse_args()

    if not SHORTLIST_PATH.exists():
        raise SystemExit(f"Missing shortlist: {SHORTLIST_PATH}")

    raw_skills = load_shortlist(SHORTLIST_PATH)
    candidates = build_candidates(raw_skills)
    deduped = dedupe_candidates(candidates)
    deduped.sort(key=lambda x: x.score, reverse=True)
    selected = deduped[: args.limit]

    created = []
    existing_by_domain: Dict[Path, Dict[str, List[Path]]] = {}
    for cand in selected:
        domain_path = ensure_domain_dir(cand.cvf_domain)
        if domain_path not in existing_by_domain:
            existing_map: Dict[str, List[Path]] = defaultdict(list)
            for file in domain_path.glob("*.skill.md"):
                existing_map[base_slug_from_filename(file.name)].append(file)
            existing_by_domain[domain_path] = existing_map
        else:
            existing_map = existing_by_domain[domain_path]

        base_slug = slugify(cand.name)
        existing_matches = existing_map.get(base_slug, [])
        if existing_matches:
            best_existing = pick_best_existing(existing_matches)
            best_content = best_existing.read_text(encoding="utf-8", errors="ignore")
            should_update = args.refresh_template or len(cand.description or "") > description_score(best_content)
            if should_update:
                related = pick_related_skills(domain_path, best_existing.name)
                content = render_skill_content(cand, best_existing.name, related)
                if not args.dry_run:
                    write_skill(domain_path, best_existing.name, content)
            created.append((cand, domain_path.name, best_existing.name))
            continue

        use_numbers = domain_uses_numbers(domain_path)
        if use_numbers:
            index = next_domain_index(domain_path)
            filename_base = f"{index:02d}_{slugify(cand.name)}.skill.md"
        else:
            filename_base = f"{slugify(cand.name)}.skill.md"

        filename = filename_base

        related = pick_related_skills(domain_path, filename)
        content = render_skill_content(cand, filename, related)

        if not args.dry_run:
            write_skill(domain_path, filename, content)

        created.append((cand, domain_path.name, filename))
        existing_map.setdefault(base_slug, []).append(domain_path / filename)

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
        update_external_imports(created)

    print(f"Selected: {len(selected)}")
    print(f"Written: {len(created)}")
    print(f"Map: {MAP_OUTPUT}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
