# A/B Test Review

> **Domain:** Product & UX  
> **Difficulty:** Medium  
> **CVF Version:** v1.5.2  
> **Skill Version:** 1.0.1  
> **Last Updated:** 2026-02-07
> **Inspired by:** antigravity-awesome-skills/ab-testing

## 📌 Prerequisites

Không yêu cầu.

---

## 🎯 Mục đích

Đánh giá thiết kế và kết quả của A/B test. Đảm bảo test được setup đúng cách và kết quả có statistical significance.

**Khi nào nên dùng:**
- Trước khi launch A/B test mới
- Phân tích kết quả sau khi test xong
- Review test design từ team
- Quyết định scale hay kill variant

---

## 📋 Form Input

| Field | Bắt buộc | Mô tả |
|-------|----------|-------|
| **Tên Test** | ✅ | Mô tả ngắn experiment |
| **Hypothesis** | ✅ | "Nếu... thì... vì..." |
| **Metric chính (OKR)** | ✅ | Conversion, Revenue, Engagement, etc. |
| **Control vs Variant** | ✅ | Mô tả sự khác biệt |
| **Sample Size** | ❌ | Số users trong mỗi variant |
| **Duration** | ❌ | Thời gian chạy test |
| **Results Data** | ❌ | Conversion rates, uplift % |

---

## ✅ Checklist Trước khi Test

### Hypothesis Quality
- [ ] Hypothesis có clear và testable?
- [ ] Có "Why" - lý do expect change?
- [ ] Có measurable outcome?
- [ ] Có reasonable timeframe?

### Test Design
- [ ] Chỉ test 1 biến duy nhất (isolated)?
- [ ] Sample size đủ lớn cho statistical power?
- [ ] User assignment random và fair?
- [ ] No selection bias trong audience?

### Metrics
- [ ] Primary metric có được define rõ?
- [ ] Có secondary/guardrail metrics?
- [ ] Tracking đã implement và test?
- [ ] Baseline data có sẵn?

### Technical Setup
- [ ] No bugs/errors trong variant?
- [ ] Đã QA test cả control và variant?
- [ ] Tracking events fire đúng?
- [ ] No audience overlap với tests khác?

---

## ✅ Checklist Review Results

### Statistical Validity
- [ ] Sample size đủ (power ≥80%)?
- [ ] Statistical significance (p < 0.05)?
- [ ] Confidence interval có narrow?
- [ ] Đã chạy đủ lâu (≥ 1-2 business cycles)?

### Result Interpretation
- [ ] Effect size có meaningful (>5%)?
- [ ] Results consistent across segments?
- [ ] No novelty effect (stable over time)?
- [ ] Guardrail metrics không bị ảnh hưởng xấu?


---

## ⚠️ Lỗi Thường Gặp

| Lỗi | Impact | Fix |
|-----|--------|-----|
| **Peeking early** | False positives | Wait for full sample size |
| **Too many variants** | Diluted power | Max 2-3 variants |
| **Testing too many things** | Unclear learnings | One change at a time |
| **Too short duration** | Novelty effect | Min 2 weeks |
| **Wrong metric** | Misleading results | Focus on business outcome |
| **Ignoring segments** | Miss insights | Segment analysis |
| **No hypothesis** | Random testing | Start with "why" |

---

## 💡 Tips & Examples

### Hypothesis Template:
```
If we [CHANGE],
then [METRIC] will [INCREASE/DECREASE] by [X%],
because [REASONING].

Example:
"If we add trust badges on checkout page,
then conversion rate will increase by 5%,
because users feel more secure about payment."
```

### Sample Size Calculator:
```
Minimum sample per variant:
- Small effect (5%): ~3,000 users
- Medium effect (10%): ~800 users
- Large effect (20%): ~200 users

(Assuming baseline 5% conversion, 80% power, 95% confidence)
```

### Duration Guidelines:
| Traffic | Minimum Duration |
|---------|-----------------|
| High (10k+/day) | 1-2 weeks |
| Medium (1k/day) | 2-4 weeks |
| Low (<1k/day) | 4+ weeks |

### Reading Results:
```
✅ WINNER if:
- p-value < 0.05 (95% confidence)
- Uplift > 5% (practical significance)
- Consistent over time
- No negative guardrail impact

❌ LOSER if:
- Significant negative effect
- Negative guardrail impact
- Segment analysis shows harm

🤷 INCONCLUSIVE if:
- No statistical significance
- Sample too small
- Mixed results across segments
```

---

## 📤 Expected Output từ AI

Khi paste spec này vào AI, bạn sẽ nhận được:

1. **Test Assessment** - Overall quality rating
2. **Hypothesis Review** - Clarity và testability
3. **Sample Size Check** - Power analysis
4. **Results Analysis** - Statistical interpretation
5. **Segment Analysis** - Breakdown by user types
6. **Recommendation** - Ship / Iterate / Kill
7. **Next Steps** - Follow-up experiments

---

## 📊 Ví dụ thực tế

### Input mẫu:
```
Test: CTA "Dùng thử 14 ngày" vs "Book demo"
Baseline conversion: 3.2%
Sample: Control 8,400 / Variant 8,350
Duration: 21 ngày
Result: Variant 3.8% (+18.7%), p=0.03
Guardrail: Bounce +1% (ns)
```

### Output mẫu:
```markdown
# A/B Test Review

## Verdict
Winner: Variant (CTA "Dùng thử 14 ngày")

## Stats
- Uplift: +18.7%
- p-value: 0.03
- Power: 82%

## Recommendation
Ship 100% và test lại headline trong 2 tuần.
```

### Đánh giá:
- ✅ Có đủ sample và p-value
- ✅ Guardrail không bị ảnh hưởng
- ✅ Recommendation rõ ràng
- **Kết quả: ACCEPT**

## 🔗 Related Skills
- [Feature Prioritization (RICE/ICE)](./feature_prioritization.skill.md)
- [User Persona Development](./user_persona_development.skill.md)

## 📜 Version History

| Version | Date | Changes |
|---|---|---|
| 1.0.1 | 2026-02-07 | Domain refinement: examples + flow alignment |
| 1.0.0 | 2026-02-07 | Initial standardized metadata + example/related sections |

## 🔗 Next Step

Sau khi hoàn thành **A/B Test Review**, cập nhật roadmap theo dữ liệu:
→ [Feature Prioritization (RICE/ICE)](./feature_prioritization.skill.md)

---

*CVF Skill Library v1.5.2 | Product & UX Domain*
