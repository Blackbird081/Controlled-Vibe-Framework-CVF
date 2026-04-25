# Landing Page CRO

> **Domain:** Marketing & SEO  
> **Difficulty:** Medium  
> **CVF Version:** v1.5.2  
> **Skill Version:** 1.0.1  
> **Last Updated:** 2026-02-07
> **Inspired by:** antigravity-awesome-skills/page-cro

## 📌 Prerequisites

Không yêu cầu.

---

## 🎯 Mục đích

Đánh giá và tối ưu landing page để tăng Conversion Rate (CRO). Phát hiện friction points và đề xuất improvements.

**Khi nào nên dùng:**
- Landing page có traffic nhưng ít conversions
- Trước khi launch campaign mới
- A/B testing planning
- Redesign landing page

---

## 🛡️ Governance Summary (CVF Autonomous)

| Field | Value |
|-------|-------|
| Risk Level | R1 |
| Allowed Roles | User, Reviewer |
| Allowed Phases | Discovery, Design |
| Authority Scope | Tactical |
| Autonomy | Auto + Audit |
| Audit Hooks | Input completeness, Output structure, Scope guard |

---

## ⛔ Execution Constraints

- Không thực thi ngoài phạm vi được khai báo
- Tự động dừng nếu thiếu input bắt buộc
- Với rủi ro R1: auto + audit
- Không ghi/đổi dữ liệu hệ thống nếu chưa được xác nhận

---

## ✅ Validation Hooks

- Check đủ input bắt buộc trước khi bắt đầu
- Check output đúng format đã định nghĩa
- Check không vượt scope và không tạo hành động ngoài yêu cầu
- Check output có bước tiếp theo cụ thể

---

## 🧪 UAT Binding

- UAT Record: [landing_page_cro](../../../governance/skill-library/uat/results/UAT-landing_page_cro.md)
- UAT Objective: Skill phải đạt chuẩn output theo CVF + không vượt quyền

---
## 📋 Form Input

| Field | Bắt buộc | Mô tả |
|-------|----------|-------|
| **Landing Page URL** | ✅ | Link trang cần đánh giá |
| **Mục tiêu conversion** | ✅ | Sign up, Purchase, Download, Contact |
| **Target Audience** | ✅ | Đối tượng mục tiêu |
| **Traffic Source** | ❌ | Paid ads, Organic, Email, Social |
| **Current Conversion Rate** | ❌ | % hiện tại (nếu có) |
| **Industry Benchmark** | ❌ | Average CR trong ngành |

---

## ✅ Checklist Đánh giá

### Above the Fold (Vùng đầu tiên)
- [ ] Headline có compelling và clear value proposition?
- [ ] Subheadline có giải thích rõ hơn?
- [ ] Hero image/video có relevant?
- [ ] Primary CTA có visible ngay?
- [ ] Trust badges/logos có hiển thị?

### Value Proposition
- [ ] Có trả lời "Why should I care?" trong 5 giây?
- [ ] Benefits > Features?
- [ ] Unique Selling Point có rõ ràng?
- [ ] Có differentiation so với competitors?

### Social Proof
- [ ] Có testimonials/reviews?
- [ ] Có customer logos/numbers?
- [ ] Có case studies/results?
- [ ] Có media mentions/awards?

### Form/CTA Optimization
- [ ] Form có ít fields nhất có thể?
- [ ] CTA button có nổi bật (size, color, contrast)?
- [ ] CTA text có action-oriented?
- [ ] Có multiple CTAs (cho long pages)?
- [ ] Không có competing CTAs?

### Trust & Credibility
- [ ] Có guarantee/refund policy?
- [ ] Có security badges (nếu payment)?
- [ ] Có contact information visible?
- [ ] Có privacy policy link?

### Mobile Experience
- [ ] Responsive design?
- [ ] Tap targets đủ lớn (44x44px)?
- [ ] Form easy to fill trên mobile?
- [ ] Page speed < 3s on mobile?

### Friction Reduction
- [ ] Không có distracting navigation?
- [ ] Không có pop-ups gây phiền?
- [ ] Không có unnecessary steps?
- [ ] Page load nhanh?

---

## ⚠️ Lỗi Thường Gặp

| Lỗi | Impact | Fix |
|-----|--------|-----|
| **No clear CTA above fold** | -30% conversions | Move CTA up, make it prominent |
| **Too many form fields** | -10% per extra field | Remove optional fields |
| **Slow page load** | -7% per second | Optimize images, lazy load |
| **Generic headline** | Low engagement | Write benefit-focused headline |
| **No social proof** | Low trust | Add testimonials, logos |
| **Competing CTAs** | Confusion | Focus on 1 primary action |
| **No mobile optimization** | 50%+ traffic lost | Responsive redesign |
| **Weak CTA button** | Low click rate | Contrasting color, action verb |

---

## 💡 Tips & Examples

### Conversion Rate Benchmarks by Industry:
| Industry | Average CR | Good CR |
|----------|-----------|---------|
| E-commerce | 2-3% | 5%+ |
| SaaS | 3-5% | 7%+ |
| Lead Gen | 5-10% | 15%+ |
| Finance | 2-5% | 8%+ |

### CTA Button Best Practices:
```
❌ "Submit" (quá generic)
❌ "Click Here" (không có value)
✅ "Get My Free Guide" (benefit + action)
✅ "Start Free Trial" (low risk + action)
✅ "Join 10,000+ Members" (social proof + action)
```

### Headline Formula cho Landing Page:
```
[Outcome] + [Timeframe] + [Risk Reducer]

"Double Your Sales in 30 Days — Guaranteed"
"Learn Spanish in 3 Months — Free First Lesson"
"Save $500/month — No Credit Card Required"
```

### High-Converting Page Structure:
1. **Hero**: Compelling headline + CTA
2. **Problem**: Agitate the pain
3. **Solution**: Your offering
4. **Benefits**: 3-5 key benefits với icons
5. **Social Proof**: Testimonials, logos
6. **How It Works**: 3 simple steps
7. **FAQ**: Handle objections
8. **Final CTA**: Repeat with urgency

---

## 📤 Expected Output từ AI

Khi paste spec này vào AI, bạn sẽ nhận được:

1. **CRO Score** - Điểm đánh giá tổng thể (/100)
2. **Above the Fold Analysis** - Review hero section
3. **Friction Points** - Barriers to conversion
4. **Quick Wins** - Easy fixes for immediate impact
5. **Priority Recommendations** - Ranked by impact
6. **A/B Test Suggestions** - Test ideas

---

## 📊 Ví dụ thực tế

### Input mẫu:
```
Traffic: 20k visits/mo
Conversion: 1.1% → trial
CTA: "Book demo"
Form: 9 fields
Heatmap: 65% drop ở pricing section
```

### Output mẫu:
```markdown
# CRO Plan

## Hypotheses
H1: Giảm form còn 4 fields tăng CVR 20%
H2: Đưa pricing xuống dưới testimonials giảm drop 10%
H3: Sticky CTA "Dùng thử 14 ngày" tăng CTR 15%

## A/B Tests
- Variant A: form 4 fields, CTA trial
- Variant B: thêm proof (logos + case)

## KPI
Primary: Trial conversion
Secondary: CTA CTR, form completion
```

### Đánh giá:
- ✅ Có giả thuyết đo được
- ✅ Test plan rõ ràng
- ✅ KPI phù hợp
- **Kết quả: ACCEPT**

## 🔗 Related Skills
- [Copywriting Evaluation](./copywriting_evaluation.skill.md)
- [Pricing Strategy Review](./pricing_strategy_review.skill.md)

## 📜 Version History

| Version | Date | Changes |
|---|---|---|
| 1.0.1 | 2026-02-07 | Domain refinement: examples + flow alignment |
| 1.0.0 | 2026-02-07 | Initial standardized metadata + example/related sections |

## 🔗 Next Step

Sau khi hoàn thành **Landing Page CRO**, tiếp tục với:
→ [Pricing Strategy Review](./pricing_strategy_review.skill.md)

---

*CVF Skill Library v1.5.2 | Marketing & SEO Domain*