# Landing Page Pattern

> **Domain:** Web Development  
> **Difficulty:** ⭐ Easy  
> **CVF Version:** v1.5.2  
> **Skill Version:** 1.0.0  
> **Last Updated:** 2026-02-22  
> **Inspired by:** [UI UX Pro Max](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill) (MIT License)

---

## 📌 Prerequisites

Không yêu cầu.

---

## 🎯 Mục đích

Chọn pattern/structure tối ưu cho landing page dựa trên mục đích kinh doanh. Dựa trên 30+ patterns đã được validate (Hero-Centric, Funnel, Comparison Table, Waitlist, Bento Grid, v.v.).

**Khi nào nên dùng:**
- Build landing page mới, chưa biết structure
- Redesign landing page hiện tại (conversion thấp)
- Cần justify layout decisions
- Compare patterns cho A/B test

**Không phù hợp khi:**
- Build full web app (nhiều trang)
- Landing page đã convert tốt rồi

---

## 🛡️ Governance Summary (CVF Autonomous)

| Field | Value |
|-------|-------|
| Risk Level | R0 |
| Allowed Roles | User, Reviewer |
| Allowed Phases | Discovery, Design |
| Authority Scope | Tactical |
| Autonomy | Auto |
| Audit Hooks | Input completeness, Output structure |

---

## ⛔ Execution Constraints

- Không thực thi ngoài phạm vi được khai báo
- Tự động dừng nếu thiếu input bắt buộc
- Với rủi ro R0: fully auto
- Không ghi/đổi dữ liệu hệ thống nếu chưa được xác nhận

---

## ✅ Validation Hooks

- Check đủ input bắt buộc trước khi bắt đầu
- Check output đúng format đã định nghĩa
- Check không vượt scope và không tạo hành động ngoài yêu cầu
- Check output có bước tiếp theo cụ thể

---

## 🧪 UAT Binding

- UAT Record: [landing_page_pattern](../../../governance/skill-library/uat/results/UAT-landing_page_pattern.md)
- UAT Objective: Skill phải đạt chuẩn output theo CVF + không vượt quyền

---

## 📋 Form Input

| Field | Bắt buộc | Mô tả | Ví dụ |
|-------|----------|-------|-------|
| **Mục đích** | ✅ | Lead gen, sales, waitlist, launch... | "Thu email đăng ký early access" |
| **Sản phẩm** | ✅ | Loại sản phẩm/dịch vụ | "SaaS project management tool" |
| **Đối tượng** | ✅ | Target audience | "Startup founders, 25-40" |
| **CTA mong muốn** | ❌ | Action chính | "Start Free Trial" |
| **Đã có content** | ❌ | Testimonials, stats, logos... | "Có 3 testimonials + 2 client logos" |
| **Số sections ước** | ❌ | Preference | "5-7 sections" |

---

## ✅ Expected Output

```
LANDING PAGE PATTERN: [Project Name]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

RECOMMENDED: Hero-Centric + Social Proof
CONVERSION TYPE: Emotion-driven with trust elements
CTA STRATEGY: Above fold + after testimonials + footer

SECTION ORDER:
┌─────────────────────────────────────┐
│ 1. Hero (Headline + CTA + Visual)   │  ← First impression
├─────────────────────────────────────┤
│ 2. Social Proof (logos + stats)     │  ← Build trust
├─────────────────────────────────────┤
│ 3. Problem → Solution              │  ← Empathy
├─────────────────────────────────────┤
│ 4. Features (3-4 with icons)       │  ← Value props
├─────────────────────────────────────┤
│ 5. Testimonials (3 reviews)        │  ← Social proof
├─────────────────────────────────────┤
│ 6. Pricing (if applicable)         │  ← Clarity
├─────────────────────────────────────┤
│ 7. FAQ (5-7 items)                 │  ← Overcome objections
├─────────────────────────────────────┤
│ 8. Final CTA + Footer              │  ← Close
└─────────────────────────────────────┘

CONVERSION TIPS:
• Headline ≤ 12 words, benefit-first
• CTA appear ≥ 3 times
• Form fields ≤ 3 (email, name, company)
• Urgency: "Limited spots" / countdown
• Mobile: CTA sticky bottom bar

ALTERNATIVES:
  2nd: Funnel Pattern — If multi-step conversion
  3rd: Comparison Table — If vs competitors is key
```

---

## 🔍 Cách đánh giá

**Checklist Accept/Reject:**

- [ ] Pattern phù hợp mục đích (lead gen ≠ sales ≠ waitlist)
- [ ] Section order có logic flow
- [ ] CTA strategy rõ ràng (vị trí, frequency)
- [ ] Conversion tips actionable
- [ ] Alternatives provided (≥2)
- [ ] Mobile-specific notes included

**Red flags (cần Reject):**
- ⚠️ CTA chỉ xuất hiện 1 lần
- ⚠️ Pricing trước Social Proof (chưa build trust)
- ⚠️ Quá nhiều sections (>10 = overwhelming)
- ⚠️ Không có mobile strategy

---

## ⚠️ Common Failures

| Lỗi thường gặp | Cách phòng tránh |
|----------------|------------------|
| Headline quá dài/vague | ≤ 12 từ, focus benefit |
| CTA thiếu urgency | Thêm social proof/countdown |
| Quá nhiều options | 1 primary CTA, 1 secondary |
| Mobile bị quên | Design mobile-first |
| No social proof | Logos, stats, testimonials |

---

## 💡 Tips

1. **Rule of 3** — 3 features, 3 testimonials, 3 pricing plans
2. **F-pattern** — Users scan left→right, top→bottom
3. **Above the fold** — CTA + headline + value prop visible without scroll
4. **Exit intent** — Popup khi user chuẩn bị rời trang
5. **Video hero** — Tăng engagement nhưng cần optimize loading

---

## 📊 Ví dụ thực tế

### Input:
```
Mục đích: Thu email early access cho AI writing tool
Sản phẩm: AI copywriting assistant
Đối tượng: Content marketers, bloggers
CTA: "Join Waitlist"
Đã có: 500 beta users, 3 testimonials
```

### Output tóm tắt:
```
Pattern: Waitlist + Social Proof
Sections: Hero → "500+ đã join" → Demo video → Features → Testimonials → Waitlist form → FAQ
CTA: "Join 500+ Writers on the Waitlist"
Mobile: Sticky bottom CTA bar
```

### Đánh giá: ✅ ACCEPT

---

## 🔗 Related Skills

- [Landing Page](./01_landing_page.skill.md)
- [Conversion Landing Optimizer](../marketing_seo/conversion_landing_optimizer.skill.md)

---

*CVF Skill Library v1.5.2 | Web Development Domain | Adapted from UI UX Pro Max (MIT)*
