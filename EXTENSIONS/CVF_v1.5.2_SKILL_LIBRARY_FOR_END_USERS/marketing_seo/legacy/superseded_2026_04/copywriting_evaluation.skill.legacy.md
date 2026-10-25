# Copywriting Evaluation

> **Domain:** Marketing & SEO  
> **Difficulty:** Easy  
> **CVF Version:** v1.5.2  
> **Skill Version:** 1.0.1  
> **Last Updated:** 2026-02-07
> **Inspired by:** antigravity-awesome-skills/copywriting

## 📌 Prerequisites

Không yêu cầu.

---

## 🎯 Mục đích

Đánh giá chất lượng copy marketing (headlines, ads, landing pages, emails) và đề xuất cải thiện để tăng conversion rate.

**Khi nào nên dùng:**

- Review copy trước khi launch campaign
- A/B test cần ý tưởng mới
- Copy hiện tại không convert
- Training team về copywriting

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

- UAT Record: [copywriting_evaluation](../../../governance/skill-library/uat/results/UAT-copywriting_evaluation.md)
- UAT Objective: Skill phải đạt chuẩn output theo CVF + không vượt quyền

---

## 📋 Form Input

| Field | Bắt buộc | Mô tả |
|-------|----------|-------|
| **Copy Text** | ✅ | Đoạn copy cần đánh giá |
| **Loại Copy** | ✅ | Headline, Ad, Email, Landing Page, etc. |
| **Target Audience** | ✅ | Đối tượng mục tiêu |
| **Mục tiêu CTA** | ✅ | Mua hàng, đăng ký, tải app, etc. |
| **Tone of Voice** | ❌ | Professional, Casual, Urgent, etc. |
| **Sản phẩm/Dịch vụ** | ❌ | Mô tả ngắn về offering |

---

## ✅ Checklist Đánh giá

### Clarity (Rõ ràng)

- [ ] Có thể hiểu trong 3 giây đầu tiên?
- [ ] Không có jargon phức tạp?
- [ ] Message chính có rõ ràng?
- [ ] Không có câu dài > 20 từ?

### Benefit-Focused (Lợi ích)

- [ ] Nói về LỢI ÍCH không chỉ tính năng?
- [ ] Giải quyết PAIN POINT của customer?
- [ ] Có "What's in it for me?" rõ ràng?
- [ ] Có proof/evidence hỗ trợ?

### Emotional Trigger (Cảm xúc)

- [ ] Có tạo cảm xúc (urgency, curiosity, fear, desire)?
- [ ] Power words được sử dụng?
- [ ] Có storytelling element?
- [ ] Có kết nối personal?

### Call to Action (CTA)

- [ ] CTA có rõ ràng và nổi bật?
- [ ] CTA có action-oriented verb?
- [ ] Chỉ có 1 CTA chính?
- [ ] Có urgency/scarcity nếu cần?

### Formatting (Trình bày)

- [ ] Dễ scan (bullets, short paragraphs)?
- [ ] Headlines có compelling?
- [ ] Whitespace phù hợp?
- [ ] Mobile-friendly?

---

## ⚠️ Lỗi Thường Gặp

| Lỗi | Ví dụ xấu | Cách fix |
|-----|-----------|----------|
| **Feature-focused** | "AI-powered platform" | "Save 10 hours/week with AI" |
| **No clear benefit** | "Our software is great" | "Double your sales in 30 days" |
| **Weak CTA** | "Click here" | "Start Free Trial Now" |
| **Too long** | Wall of text | Break into bullets, use headers |
| **No urgency** | "Sign up" | "Join 5,000+ users - Limited spots" |
| **Generic** | "Best in class" | "Rated #1 by 10,000 customers" |
| **No social proof** | Only claims | Add testimonials, numbers |

---

## 💡 Tips & Examples

### AIDA Formula

```
A - Attention: Hook that grabs attention
I - Interest: Make them curious  
D - Desire: Show benefits, create want
A - Action: Clear CTA
```

### Headline Formulas

**Problem-Agitate-Solution:**

```
Tired of [problem]? [Agitate pain]. [Solution].
"Tired of long meetings? 5-hour meetings kill productivity. 
Try async video updates."
```

**How To:**

```
How to [benefit] without [pain point]
"How to grow Instagram to 10K without posting daily"
```

**Number + Benefit:**

```
[Number] [Timeframe] to [Benefit]
"7 Days to Double Your Email Open Rates"
```

### Power Words

- **Urgency:** Now, Today, Limited, Last chance
- **Exclusivity:** Secret, Insider, VIP, Members-only
- **Value:** Free, Save, Bonus, Guaranteed
- **Emotion:** Amazing, Breakthrough, Revolutionary

---

## 📤 Expected Output từ AI

Khi paste spec này vào AI, bạn sẽ nhận được:

1. **Copy Score** - Điểm đánh giá tổng thể (/10)
2. **Strengths** - Điểm mạnh của copy
3. **Issues** - Vấn đề cần fix
4. **Rewritten Version** - Phiên bản đã cải thiện
5. **A/B Test Ideas** - Các variations để test

---

## 📊 Ví dụ thực tế

### Input mẫu

```
Trang: Landing "StockFlow"
Hero: "Quản lý kho dễ dàng cho mọi doanh nghiệp"
Sub: "Tối ưu tồn kho, giảm thất thoát"
CTA: "Book demo"
Metrics: Bounce 68%, CTR CTA 1.4%
```

### Output mẫu

```markdown
# Copy Review

## Issues
- Claim chung chung, thiếu số liệu
- CTA rào cản cao với SMB
- Chưa nhấn offline + barcode

## Rewrite
Hero: "Kiểm kho đa chi nhánh trong 30s, kể cả khi mất mạng"
Sub: "Barcode + đồng bộ tự động giúp giảm sai số xuống <2%"
CTA A: "Dùng thử 14 ngày"
CTA B: "Xem video 2 phút"

## Score
Clarity 6/10 → 8/10
Proof 3/10 → 7/10
```

### Đánh giá

- ✅ Nêu rõ pain + proof
- ✅ Có phương án CTA thay thế
- ✅ Dễ test A/B
- **Kết quả: ACCEPT**

## 🔗 Related Skills

- [Brand Voice Consistency](./brand_voice_consistency.skill.md)
- [Landing Page CRO](./landing_page_cro.skill.md)

## 📜 Version History

| Version | Date | Changes |
|---|---|---|
| 1.0.1 | 2026-02-07 | Domain refinement: examples + flow alignment |
| 1.0.0 | 2026-02-07 | Initial standardized metadata + example/related sections |

## 🔗 Next Step

Sau khi hoàn thành **Copywriting Evaluation**, tiếp tục với:
→ [Landing Page CRO](./landing_page_cro.skill.md)

---

*CVF Skill Library v1.5.2 | Marketing & SEO Domain*
