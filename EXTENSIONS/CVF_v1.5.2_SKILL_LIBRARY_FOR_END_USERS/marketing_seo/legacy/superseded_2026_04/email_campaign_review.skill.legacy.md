# Email Campaign Review

> **Domain:** Marketing & SEO  
> **Difficulty:** Easy  
> **CVF Version:** v1.5.2  
> **Skill Version:** 1.0.1  
> **Last Updated:** 2026-02-07
> **Inspired by:** antigravity-awesome-skills/email-marketing

## 📌 Prerequisites

Không yêu cầu.

---

## 🎯 Mục đích

Đánh giá email marketing campaign về mặt deliverability, engagement, và conversion. Tối ưu để cải thiện open rate và click-through rate.

**Khi nào nên dùng:**

- Review email trước khi send
- Open rate hoặc CTR thấp
- Audit email sequence/flow
- Setup email marketing mới

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

- UAT Record: [email_campaign_review](../../../governance/skill-library/uat/results/UAT-email_campaign_review.md)
- UAT Objective: Skill phải đạt chuẩn output theo CVF + không vượt quyền

---

## 📋 Form Input

| Field | Bắt buộc | Mô tả |
|-------|----------|-------|
| **Email Content** | ✅ | Paste full email (subject + body) |
| **Email Type** | ✅ | Newsletter, Promotional, Transactional, Nurture |
| **Target Audience** | ✅ | Segment này là ai? |
| **Campaign Goal** | ✅ | CTR, Sales, Engagement, Re-engagement |
| **Current Metrics** | ❌ | Open rate, CTR hiện tại (nếu có) |
| **Send Time** | ❌ | Ngày/giờ dự định gửi |

---

## ✅ Checklist Đánh giá

### Subject Line

- [ ] Dưới 50 ký tự (hiển thị đầy đủ mobile)?
- [ ] Có tạo curiosity/urgency?
- [ ] Không có spam trigger words?
- [ ] Preview text có complementary?
- [ ] Personalization nếu có data?

### Email Body - Content

- [ ] Above the fold có compelling?
- [ ] Single focus/goal?
- [ ] Easy to scan (headers, bullets)?
- [ ] Tone phù hợp với audience?
- [ ] Personalization elements?

### Design & Layout

- [ ] Mobile-responsive?
- [ ] Text-to-image ratio balanced (60:40)?
- [ ] Images có alt text?
- [ ] Color contrast tốt?
- [ ] Font size readable (min 14px mobile)?

### Call to Action

- [ ] CTA rõ ràng và nổi bật?
- [ ] Button thay vì text link?
- [ ] Action-oriented text?
- [ ] Chỉ 1 primary CTA?
- [ ] Above the fold hoặc easily visible?

### Deliverability

- [ ] Không có broken links?
- [ ] From name recognizable?
- [ ] Reply-to address valid?
- [ ] Unsubscribe link present?
- [ ] Physical address (nếu required)?

### Technical

- [ ] Tested across email clients (Gmail, Outlook, Apple)?
- [ ] Dark mode compatible?
- [ ] No broken images?
- [ ] Links work and tracked?

---

## ⚠️ Lỗi Thường Gặp

| Lỗi | Impact | Fix |
|-----|--------|-----|
| **Long subject line** | Truncated on mobile | Keep under 50 chars |
| **Spam trigger words** | Goes to spam | Avoid FREE, URGENT, $$$ |
| **No CTA** | No action | Add clear button |
| **Image-only email** | Blocked images = blank | Use text + images |
| **Too many CTAs** | Confusion | Focus on 1 primary |
| **No personalization** | Lower engagement | Use name, behavior data |
| **Wrong send time** | Low opens | Test optimal times |

---

## 💡 Tips & Examples

### Subject Line Formulas

```
❌ "Newsletter #45 - February Update"
✅ "Your special 24-hour access is waiting ⏰"

❌ "Check out our products!"  
✅ "[Name], I picked these just for you"

❌ "SALE! BIG DISCOUNTS! FREE SHIPPING!"
✅ "Members-only: 30% off ends tonight"
```

### Email Benchmarks by Industry

| Industry | Avg Open Rate | Avg CTR |
|----------|--------------|---------|
| E-commerce | 15-20% | 2-3% |
| SaaS | 20-25% | 3-5% |
| Media | 20-22% | 4-5% |
| Non-profit | 25-30% | 3-4% |

### Best Send Times

- **B2B:** Tuesday-Thursday, 10AM-2PM
- **B2C:** Weekend, 8AM or 8PM
- **E-commerce:** Thursday-Friday for weekend sales

### Email Length Guidelines

| Type | Ideal Length |
|------|-------------|
| Promotional | 50-125 words |
| Newsletter | 200-300 words |
| Transactional | As short as possible |
| Nurture/Educational | 200-400 words |

---

## 📤 Expected Output từ AI

Khi paste spec này vào AI, bạn sẽ nhận được:

1. **Email Score** - Overall rating (/10)
2. **Subject Line Analysis** - Effectiveness + alternatives
3. **Content Review** - Clarity, engagement, CTA
4. **Deliverability Check** - Spam score, issues
5. **Mobile Preview** - How it looks on mobile
6. **Recommendations** - Specific improvements
7. **Rewritten Version** - Optimized email

---

## 📊 Ví dụ thực tế

### Input mẫu

```
Sequence: 3 email onboarding (Day 0/2/5)
Open rate 22%, Click 1.8%
Goal: kích hoạt trial trong 7 ngày
```

### Output mẫu

```markdown
# Email Review

## Issues
- Không cá nhân hóa theo ngành
- Thiếu hướng dẫn 1 bước hành động

## Revised Sequence
Day 0: "3 bước setup kho trong 10 phút"
Day 2: "Mẫu file nhập kho + video 2 phút"
Day 5: "Case study giảm sai số xuống 2%"

## Targets
Open > 30%, Click > 4%, Activation > 15%
```

### Đánh giá

- ✅ Insight rõ về funnel
- ✅ Sequence thực tế, dễ triển khai
- ✅ Target đo được
- **Kết quả: ACCEPT**

## 🔗 Related Skills

- [Social Media Ad Review](./social_media_ad_review.skill.md)
- [Competitor Analysis](./competitor_analysis.skill.md)

## 📜 Version History

| Version | Date | Changes |
|---|---|---|
| 1.0.1 | 2026-02-07 | Domain refinement: examples + flow alignment |
| 1.0.0 | 2026-02-07 | Initial standardized metadata + example/related sections |

## 🔗 Next Step

Sau khi hoàn thành **Email Campaign Review**, quay lại đánh giá thị trường theo quý:
→ [Competitor Analysis](./competitor_analysis.skill.md)

---

*CVF Skill Library v1.5.2 | Marketing & SEO Domain*
