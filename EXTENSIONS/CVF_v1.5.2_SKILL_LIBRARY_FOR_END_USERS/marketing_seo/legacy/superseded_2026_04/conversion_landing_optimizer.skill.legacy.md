# Conversion Landing Optimizer

> **Domain:** Marketing & SEO  
> **Difficulty:** ⭐⭐ Medium  
> **CVF Version:** v1.5.2  
> **Skill Version:** 1.0.0  
> **Last Updated:** 2026-02-22  
> **Inspired by:** [UI UX Pro Max](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill) (MIT License)

---

## 📌 Prerequisites

Khuyến khích:

- [Landing Page](../web_development/01_landing_page.skill.md) — Hiểu landing page basics

---

## 🎯 Mục đích

Tối ưu landing page cho conversion rate: CTA placement, urgency elements, social proof positioning, form field optimization, và A/B test readiness.

**Khi nào nên dùng:**

- Landing page có traffic nhưng conversion thấp
- Redesign landing page cho campaign mới
- A/B test optimization
- Muốn data-driven CRO recommendations

**Không phù hợp khi:**

- Landing page chưa có traffic (optimize sau khi có data)
- Blog/content pages (khác mục đích)

---

## 🛡️ Governance Summary (CVF Autonomous)

| Field | Value |
|-------|-------|
| Risk Level | R1 |
| Allowed Roles | User, Reviewer |
| Allowed Phases | Design, Build, Optimize |
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

- UAT Record: [conversion_landing_optimizer](../../../governance/skill-library/uat/results/UAT-conversion_landing_optimizer.md)
- UAT Objective: Skill phải đạt chuẩn output theo CVF + không vượt quyền

---

## 📋 Form Input

| Field | Bắt buộc | Mô tả | Ví dụ |
|-------|----------|-------|-------|
| **URL** | ✅ | Landing page URL | "<https://myproduct.com/pricing>" |
| **Conversion goal** | ✅ | CTA mong muốn | "Sign up for free trial" |
| **Current metrics** | ✅ | Bounce rate, conversion rate | "Bounce: 65%, Conv: 1.2%" |
| **Traffic source** | ❌ | Organic, paid, social | "Google Ads + organic" |
| **Audience** | ❌ | Target audience | "SMB owners, 30-45" |
| **Competitors** | ❌ | Top competitors | "Competitor A conv: 3.5%" |

---

## ✅ Expected Output

```
CONVERSION AUDIT: [URL]
━━━━━━━━━━━━━━━━━━━━━━━━━━━

CURRENT: 1.2% conversion | 65% bounce
TARGET:  3.0% conversion | 45% bounce

🔴 HIGH IMPACT FIXES:

1. CTA VISIBILITY (est. +0.8% conv)
   Problem: CTA "below fold" — only visible after scroll
   Fix: Add CTA in hero section, above fold
   A/B test: Hero with CTA vs current

2. FORM FRICTION (est. +0.5% conv)
   Problem: 7 form fields → overwhelming
   Fix: Reduce to 3 fields (email, name, company)
   Later: Capture rest via onboarding flow

3. SOCIAL PROOF PLACEMENT (est. +0.3% conv)
   Problem: Testimonials at bottom (80% don't scroll there)
   Fix: Move logos + "500+ companies trust us" below hero

🟡 MEDIUM IMPACT:

4. URGENCY (est. +0.2% conv)
   Add: "Limited spots" or countdown for deadline
   Note: Must be genuine — fake urgency hurts trust

5. MOBILE CTA (est. +0.2% conv)
   Add: Sticky bottom CTA bar on mobile
   Config: Semi-transparent, 60px height, single button

🟢 LOW IMPACT:

6. PAGE SPEED
   Current: 3.8s LCP → optimize to < 2.5s
   Fix: Compress hero image, lazy load below fold

A/B TEST PLAN:
  Test 1: CTA above fold (1 week)
  Test 2: 3 vs 7 form fields (1 week)
  Test 3: Social proof position (1 week)
  Measure: Sign-up rate, time on page, scroll depth

PROJECTED: 1.2% → 2.5-3.2% conversion
```

---

## 🔍 Cách đánh giá

**Checklist Accept/Reject:**

- [ ] Current metrics acknowledged
- [ ] Fixes ranked by estimated impact
- [ ] Each fix has specific implementation
- [ ] A/B test plan included
- [ ] Projected improvement estimated
- [ ] Mobile-specific optimizations
- [ ] Page speed considered

**Red flags (cần Reject):**

- ⚠️ Generic "improve CTA" without specifics
- ⚠️ No impact estimates
- ⚠️ Recommend fake urgency/countdown
- ⚠️ Bỏ qua mobile optimization

---

## ⚠️ Common Failures

| Lỗi thường gặp | Cách phòng tránh |
|----------------|------------------|
| Too many changes at once | A/B test 1 change at a time |
| Fake urgency | Only genuine scarcity/deadlines |
| CTA text vague | "Start Free Trial" > "Submit" |
| Ignore page speed | Speed affects conversion directly |
| Desktop-only thinking | 60%+ traffic from mobile |

---

## 💡 Tips

1. **Single CTA focus** — 1 primary action per page
2. **3-field max** — Email, Name, Company (capture more later)
3. **Above the fold** — CTA + headline + value prop visible
4. **Social proof early** — Logos/stats before features
5. **Measure everything** — UTM params, event tracking, heatmaps

---

## 📊 Ví dụ thực tế

### Input

```
URL: https://mycrm.com/trial
Goal: Start free trial
Metrics: Bounce 70%, Conv 0.8%
Traffic: 60% Google Ads, 40% organic
Audience: Sales managers at SMBs
```

### Output tóm tắt

```
Fix 1: Hero CTA "Start 14-day Free Trial — No credit card" (+0.6%)
Fix 2: Form 5 fields → 2 (email, company) (+0.4%)
Fix 3: Add "2,500+ sales teams trust us" under hero (+0.3%)
Fix 4: Mobile sticky CTA bar (+0.2%)
Projected: 0.8% → 2.0-2.3%
A/B test: 3 sequential tests, 1 week each
```

### Đánh giá: ✅ ACCEPT

---

## 🔗 Related Skills

- [Landing Page](../web_development/01_landing_page.skill.md)
- [Landing Page Pattern](../web_development/07_landing_page_pattern.skill.md)
- [Product Page Style Matcher](./product_page_style_matcher.skill.md)

---

*CVF Skill Library v1.5.2 | Marketing & SEO Domain | Adapted from UI UX Pro Max (MIT)*
