# 📊 Market Research Template

**Domain:** Business  
**Preset:** `analysis`

---

## Mô tả ngắn

Nghiên cứu thị trường, phân tích xu hướng, customer segments và cơ hội.

---

## Khi nào dùng

- Trước khi enter thị trường mới
- Đánh giá potential của segment
- Chuẩn bị business plan
- Investor due diligence

---

## Form Fields

| Field | Required | Type | Mô tả |
|-------|:--------:|------|-------|
| Thị trường | ✅ | text | Thị trường cần nghiên cứu |
| Địa lý | ✅ | text | Khu vực địa lý |
| Câu hỏi chính | ✅ | textarea | Muốn biết gì về thị trường |
| Dữ liệu có sẵn | ❌ | textarea | Data đã có |
| Timeframe | ❌ | text | Giai đoạn quan tâm |

---

## Intent Pattern

```
INTENT:
Tôi muốn nghiên cứu thị trường [thị trường] tại [địa lý].

CONTEXT:
- Thị trường: [mô tả thị trường]
- Địa lý: [khu vực]
- Câu hỏi chính: [liệt kê câu hỏi]
- Dữ liệu có sẵn: [nếu có]
- Timeframe: [giai đoạn]

SUCCESS CRITERIA:
- Market size estimation
- Key trends và drivers
- Customer segments
- Entry barriers và opportunities
```

---

## Output Expected

```markdown
## Market Research: [Thị trường] - [Địa lý]

### Market Overview
- **Size**: [estimate]
- **Growth rate**: [%/năm]
- **Stage**: [emerging/growing/mature/declining]

### Key Trends
1. **[Trend 1]** - [impact]
2. **[Trend 2]** - [impact]

### Customer Segments
| Segment | Size | Needs | Willingness to Pay |
|---------|:----:|-------|:------------------:|
| [S1] | 30% | ... | High |
| [S2] | 50% | ... | Medium |

### Competitive Landscape
[Overview của các players]

### Entry Barriers
- [Barrier 1]
- [Barrier 2]

### Opportunities
1. **[Opportunity 1]** - [why]
2. **[Opportunity 2]** - [why]

### Recommendations
[Có nên enter, nếu có thì focus segment nào]
```

---

## Examples

### Ví dụ 1: EdTech

```
INTENT:
Tôi muốn nghiên cứu thị trường online learning tại Việt Nam.

CONTEXT:
- Thị trường: Online education cho K12
- Địa lý: Việt Nam
- Câu hỏi: Market size? Key players? Parent willingness to pay?
- Timeframe: 2024-2026

SUCCESS CRITERIA:
- TAM, SAM, SOM estimate
- Top 5 players và market share
- 3 underserved segments
```

---

*Template thuộc CVF v1.5 UX Platform*
