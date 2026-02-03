# A/B Test Review

> **Domain:** Product & UX  
> **Difficulty:** Medium  
> **CVF Version:** v1.5.2  
> **Inspired by:** antigravity-awesome-skills/ab-testing

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

### Next Steps
- [ ] Có clear recommendation (ship/iterate/kill)?
- [ ] Learnings được documented?
- [ ] Follow-up tests được plan?

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

*CVF Skill Library v1.5.2 | Product & UX Domain*
