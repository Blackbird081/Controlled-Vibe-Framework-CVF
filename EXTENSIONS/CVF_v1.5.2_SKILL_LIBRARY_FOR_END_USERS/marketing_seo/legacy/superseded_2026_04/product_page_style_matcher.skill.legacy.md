# Product Page Style Matcher

> **Domain:** Marketing & SEO  
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

Cho một sản phẩm/dịch vụ cụ thể, tự động match UI style, landing page structure, và color palette phù hợp nhất. Dựa trên 96 product types đã được map sẵn.

**Khi nào nên dùng:**
- Client cung cấp brief sản phẩm, cần nhanh chóng đề xuất style
- Pitch cho client mới — cần visual direction nhanh
- So sánh style phù hợp giữa nhiều options
- Tạo mood board nhanh

**Không phù hợp khi:**
- Client đã có brand guide hoàn chỉnh
- Thiết kế art/creative không theo business rules

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

- UAT Record: [product_page_style_matcher](../../../governance/skill-library/uat/results/UAT-product_page_style_matcher.md)
- UAT Objective: Skill phải đạt chuẩn output theo CVF + không vượt quyền

---

## 📋 Form Input

| Field | Bắt buộc | Mô tả | Ví dụ |
|-------|----------|-------|-------|
| **Sản phẩm/dịch vụ** | ✅ | Mô tả sản phẩm | "Online yoga classes for beginners" |
| **Ngành** | ✅ | Vertical market | "Fitness & Wellness" |
| **Đối tượng** | ❌ | Target customers | "Phụ nữ 30-50, busy professionals" |
| **Budget feel** | ❌ | Low-cost, mid-range, premium | "Premium nhưng accessible" |
| **References** | ❌ | Sites yêu thích | "Like calm.com vibe" |

---

## ✅ Expected Output

```
PRODUCT STYLE MATCH: [Sản phẩm]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PRODUCT: Online Yoga Classes
CATEGORY: Fitness & Wellness → Sub: Online Education

MATCHED STYLE: Soft Organic UI
  Keywords: Warm, calming, breathable, nature-inspired
  CSS: border-radius: 24px, background: gradient(warm), shadow: soft

MATCHED COLORS:
  Primary:   #8B9E82 (Sage)
  Secondary: #E8D5B7 (Warm Sand)
  CTA:       #C67C4E (Warm Terracotta)
  Background: #FBF8F4 (Cream)
  Text:       #3D3D3D (Warm Dark)

MATCHED LANDING PATTERN:
  Hero (video bg) → Benefits (3 cards) → Instructor intro
  → Class preview → Testimonials → Pricing → FAQ

MATCHED TYPOGRAPHY:
  Heading: DM Serif Display (editorial, warm)
  Body: Source Sans 3 (clean, readable)

CONFIDENCE: 92% match
SIMILAR PRODUCTS USING THIS STYLE:
  • Calm.com — meditation/wellness
  • Headspace — mindfulness
  • Alo Moves — yoga platform
```

---

## 🔍 Cách đánh giá

**Checklist Accept/Reject:**

- [ ] Product correctly categorized
- [ ] Style match phù hợp product + audience
- [ ] Colors have hex codes + emotional rationale
- [ ] Landing pattern included
- [ ] Typography pairing included
- [ ] Similar products listed (validation)
- [ ] Confidence score provided

**Red flags (cần Reject):**
- ⚠️ Tech/SaaS style cho wellness product
- ⚠️ Dark mode default cho health/wellness
- ⚠️ Mismatch giữa style và target audience
- ⚠️ Generic output không specific product

---

## ⚠️ Common Failures

| Lỗi thường gặp | Cách phòng tránh |
|----------------|------------------|
| One-size-fits-all | Map product type → specific style |
| Ignore budget positioning | Premium ≠ budget-friendly aesthetics |
| Wrong competitor references | Use same vertical, same price point |
| Match style to industry only | Consider audience age, tech literacy |
| Forget mobile-first | Most wellness traffic = mobile |

---

## 💡 Tips

1. **Product type > Personal preference** — Data-driven matching
2. **Competitor validation** — If top 3 competitors use similar style = safe
3. **Audience age matters** — GenZ: bold/playful, Boomer: clean/simple
4. **Budget signals** — Gold accent = premium, Bright CTA = value/deal
5. **Quick pitch** — Use output directly in client presentations

### Product Category Quick Map:
```
SaaS B2B:       Clean Minimal + Blue       (Trust)
E-commerce:     White Clean + Orange CTA    (Action)
Beauty/Spa:     Soft Pink + Gold            (Premium)
Fitness:        Dark + Neon Green           (Energy)
Healthcare:     Blue + White                (Trust)
Food/Restaurant: Warm + Photography-heavy   (Appetite)
Finance:        Navy + Dark                 (Stability)
Education:      Bright + Playful            (Engagement)
Luxury:         Black + Gold + Serif        (Exclusivity)
```

---

## 📊 Ví dụ thực tế

### Input:
```
Sản phẩm: Artisan coffee subscription box
Ngành: Food & Beverage / E-commerce
Đối tượng: Coffee enthusiasts 25-40, urban
Budget feel: Premium craft
```

### Output tóm tắt:
```
Style: Artisan Warm — Photography-heavy, craft textures
Colors: Deep Coffee #3E2723 + Cream #FFF8E1 + Gold #D4A574
Landing: Hero (product beauty shot) → Story → Subscription plans → Reviews
Typography: Playfair Display + Lato
Similar: Blue Bottle, Atlas Coffee Club, Trade Coffee
Confidence: 88% match
```

### Đánh giá: ✅ ACCEPT

---

## 🔗 Related Skills

- [Conversion Landing Optimizer](./conversion_landing_optimizer.skill.md)
- [Landing Page](../web_development/01_landing_page.skill.md)
- [CVF Web UX Redesign System](../product_ux/cvf_web_ux_redesign_system.skill.md)

---

*CVF Skill Library v1.5.2 | Marketing & SEO Domain | Adapted from UI UX Pro Max (MIT)*
