# Data Lineage Specification

> **Created:** Feb 08, 2026  
> **Purpose:** Truy vết nguồn gốc (origin) của mỗi skill trong registry

---

## 1. Vấn Đề

124 skills hiện tại không ghi rõ **nguồn gốc**:

- Được import tự động từ external source?
- Viết thủ công bởi team?
- Đã qua UAT validation?

Thiếu lineage → không biết skill nào cần review kỹ hơn, skill nào đáng tin cậy.

---

## 2. Origin Tags

| Tag | Icon | Meaning |
|-----|------|---------|
| `CURATED` | 📝 | Viết thủ công bởi CVF team, đã review |
| `IMPORTED` | 📥 | Import từ external source (awesome-cursorrules, etc.) |
| `ADAPTED` | 🔄 | Import + chỉnh sửa cho CVF format |
| `GENERATED` | 🤖 | AI-generated, chưa manual review |
| `VALIDATED` | ✅ | Bất kỳ origin nào + đã qua UAT PASS |

---

## 3. Schema trong .gov.md

Thêm row `Origin` vào Governance table:

```markdown
## Governance

| Field | Value |
|-------|-------|
| Risk Level | R1 |
| Allowed Roles | User, Reviewer |
| Allowed Phases | Discovery, Design, Review |
| Decision Scope | Tactical |
| Autonomy | Auto + Audit |
| Origin | 📥 IMPORTED |
| Origin Source | awesome-cursorrules/general |
```

---

## 4. Trust Implications

| Origin | Default Trust | Review Required |
|--------|--------------|-----------------|
| CURATED | High | No (đã review khi viết) |
| IMPORTED | Low | Yes — cần adapt + review |
| ADAPTED | Medium | Có thể bypass nếu diff nhỏ |
| GENERATED | Very Low | Bắt buộc manual review |
| VALIDATED | High | No (đã qua UAT) |

---

## 5. Lineage Chain

Mỗi skill có chuỗi lineage:

```
External Source → IMPORTED → ADAPTED → UAT PASS → VALIDATED
                                ↓
                            CURATED (if written from scratch)
```

---

## 6. CLI Tool

`inject_lineage.py` sẽ bulk-add origin tags dựa trên phân tích hiện có:

```bash
# Detect origins based on content patterns
python inject_lineage.py --detect

# Set origin for specific files
python inject_lineage.py --set IMPORTED --source "awesome-cursorrules" --files USR-019_adaptyv.gov.md

# Report lineage distribution
python inject_lineage.py --report
```

---

## 7. Current State Analysis

Dựa trên `generate_user_skills.py` logs và content analysis:

- **~30 skills**: Original CVF format → CURATED
- **~80 skills**: Imported from awesome-cursorrules → IMPORTED
- **~14 skills**: Adapted after import → ADAPTED
- **0 skills**: AI-generated → GENERATED
- **0 skills**: UAT validated → NOT yet

> ⚠️ Lưu ý: Số liệu ước tính. Chạy `inject_lineage.py --detect` để xác nhận chính xác.
