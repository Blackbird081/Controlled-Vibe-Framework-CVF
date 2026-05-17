# 📊 Report Writing Template

**Domain:** Content  
**Preset:** `content`

---

## Mô tả ngắn

Tạo business reports chuyên nghiệp cho meetings, stakeholders, hoặc documentation.

---

## Khi nào dùng

- Weekly/Monthly reports
- Project status updates
- Analysis reports
- Executive summaries

---

## Form Fields

| Field | Required | Type | Mô tả |
|-------|:--------:|------|-------|
| Report topic | ✅ | text | Chủ đề report |
| Audience | ✅ | select | Executive/Team/Client |
| Data points | ✅ | textarea | Key data để include |
| Period | ❌ | text | Timeframe |

---

## Intent Pattern

```
INTENT:
Tôi cần tạo report về [topic].

CONTEXT:
- Topic: [chủ đề report]
- Audience: [executive/team/client]
- Data: [key data points]
- Period: [timeframe]

SUCCESS CRITERIA:
- Executive summary trong 1 paragraph
- Data visualization suggestions
- Actionable insights
```

---

## Output Expected

```markdown
# [Report Title]
**Period:** [timeframe] | **Author:** [name]

## Executive Summary
[Key takeaways trong 3-5 câu]

## Key Metrics
| Metric | Current | Previous | Change |
|--------|:-------:|:--------:|:------:|
| [M1] | X | Y | +Z% |

## Highlights
- ✅ [Achievement 1]
- ✅ [Achievement 2]

## Challenges
- ⚠️ [Challenge 1]

## Recommendations
1. [Action item]

## Next Steps
[Planned actions]
```

---

*Template thuộc CVF v1.5 UX Platform*
