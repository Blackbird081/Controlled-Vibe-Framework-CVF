# ⚠️ Risk Assessment Template

**Domain:** Business  
**Preset:** `analysis`

---

## Mô tả ngắn

Đánh giá rủi ro của dự án, quyết định hoặc thay đổi, với phân loại và đề xuất giảm thiểu.

---

## Khi nào dùng

- Trước khi launch dự án mới
- Đánh giá thay đổi lớn
- Chuẩn bị cho board presentation
- Due diligence

---

## Form Fields

| Field | Required | Type | Mô tả |
|-------|:--------:|------|-------|
| Chủ đề đánh giá | ✅ | text | Dự án/quyết định cần đánh giá |
| Bối cảnh | ✅ | textarea | Mô tả tình huống |
| Stakeholders | ❌ | textarea | Ai bị ảnh hưởng |
| Timeline | ❌ | text | Thời gian thực hiện |
| Risk tolerance | ❌ | select | Low / Medium / High |

---

## Intent Pattern

```
INTENT:
Tôi muốn đánh giá rủi ro của [chủ đề đánh giá].

CONTEXT:
- Mô tả: [mô tả dự án/quyết định]
- Stakeholders: [ai bị ảnh hưởng]
- Timeline: [thời gian]
- Risk tolerance: [mức chấp nhận rủi ro]

SUCCESS CRITERIA:
- Xác định 5-10 rủi ro chính
- Phân loại theo mức độ (Cao/Trung bình/Thấp)
- Đề xuất mitigation cho mỗi rủi ro
```

---

## Output Expected

```markdown
## Đánh giá rủi ro: [Chủ đề]

### Risk Matrix

| Rủi ro | Xác suất | Ảnh hưởng | Mức độ | Mitigation |
|--------|:--------:|:---------:|:------:|------------|
| R1: [tên] | Cao | Cao | 🔴 Critical | [action] |
| R2: [tên] | Trung bình | Cao | 🟡 High | [action] |
| R3: [tên] | Thấp | Trung bình | 🟢 Medium | [action] |

### Top 3 Critical Risks
1. **[Risk 1]** - [Chi tiết và impact]
2. **[Risk 2]** - [Chi tiết và impact]
3. **[Risk 3]** - [Chi tiết và impact]

### Mitigation Plan
| Priority | Action | Owner | Timeline |
|:--------:|--------|-------|----------|
| 1 | [action] | [who] | [when] |

### Contingency Plan
[Kế hoạch dự phòng nếu rủi ro xảy ra]

### Recommendations
[Có nên tiến hành hay không, với điều kiện gì]
```

---

## Examples

### Ví dụ 1: Rủi ro dự án IT

```
INTENT:
Tôi muốn đánh giá rủi ro của dự án migration lên cloud.

CONTEXT:
- Dự án: Migrate on-premise system sang AWS
- Timeline: 6 tháng
- Stakeholders: 200 users nội bộ, 50 integrations
- Risk tolerance: Medium

SUCCESS CRITERIA:
- Identify technical, operational, security risks
- Prioritize theo impact to business
- Mitigation plan khả thi
```

---

*Template thuộc CVF v1.5 UX Platform*
