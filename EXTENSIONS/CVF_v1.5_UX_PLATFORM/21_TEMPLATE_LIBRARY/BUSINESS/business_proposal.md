# 📝 Business Proposal Template

**Domain:** Business  
**Preset:** `content`

---

## Mô tả ngắn

Tạo proposal kinh doanh chuyên nghiệp cho partnership, investment hoặc project.

---

## Khi nào dùng

- Pitch đối tác/nhà đầu tư
- Proposal cho client
- Internal project approval
- Grant application

---

## Form Fields

| Field | Required | Type | Mô tả |
|-------|:--------:|------|-------|
| Tiêu đề proposal | ✅ | text | Tên dự án/đề xuất |
| Đối tượng | ✅ | text | Ai sẽ đọc proposal |
| Mục tiêu | ✅ | textarea | Muốn đạt được gì |
| Budget | ❌ | text | Ngân sách (nếu có) |
| Timeline | ❌ | text | Thời gian thực hiện |
| Bối cảnh | ❌ | textarea | Background info |

---

## Intent Pattern

```
INTENT:
Tôi cần tạo business proposal cho [tiêu đề proposal].

CONTEXT:
- Đối tượng: [ai sẽ đọc - CEO, investor, client]
- Mục tiêu: [muốn họ approve/invest/partner gì]
- Budget: [ngân sách dự kiến]
- Timeline: [thời gian thực hiện]
- Background: [bối cảnh dẫn đến proposal này]

SUCCESS CRITERIA:
- Professional format
- Clear value proposition
- Realistic projections
- Actionable next steps
```

---

## Output Expected

```markdown
# [Tiêu đề Proposal]

## Executive Summary
[1 page tóm tắt toàn bộ proposal]

## Problem Statement
[Vấn đề cần giải quyết]

## Proposed Solution
[Giải pháp đề xuất]

## Value Proposition
- **For [stakeholder 1]**: [benefit]
- **For [stakeholder 2]**: [benefit]

## Implementation Plan
| Phase | Activities | Timeline | Deliverables |
|:-----:|------------|----------|--------------|
| 1 | ... | 1-2 months | ... |
| 2 | ... | 3-4 months | ... |

## Budget
| Item | Cost |
|------|-----:|
| [Item 1] | $X |
| **Total** | **$Y** |

## ROI Projection
[Return on investment estimate]

## Team
[Key team members và roles]

## Next Steps
1. [Action 1]
2. [Action 2]

## Appendix
[Supporting materials]
```

---

## Examples

### Ví dụ 1: Partnership Proposal

```
INTENT:
Tôi cần tạo business proposal cho partnership với ngân hàng lớn.

CONTEXT:
- Đối tượng: C-level executives của VPBank
- Mục tiêu: Integrate payment gateway vào ecosystem của họ
- Budget: Revenue sharing model
- Timeline: 6 tháng integration
- Background: Fintech startup với 100k users

SUCCESS CRITERIA:
- Executive summary trong 1 page
- Clear revenue model
- Risk mitigation
- Proof of concept plan
```

---

*Template thuộc CVF v1.5 UX Platform*
