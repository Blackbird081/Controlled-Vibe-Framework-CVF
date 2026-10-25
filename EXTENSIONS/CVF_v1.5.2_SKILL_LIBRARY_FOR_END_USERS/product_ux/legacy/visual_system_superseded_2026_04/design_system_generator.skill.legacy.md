# Design System Generator

> **Domain:** Product & UX  
> **Difficulty:** ⭐⭐⭐ Advanced  
> **CVF Version:** v1.5.2  
> **Skill Version:** 1.0.0  
> **Last Updated:** 2026-02-22  
> **Inspired by:** [UI UX Pro Max](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill) (MIT License)

---

## 📌 Prerequisites

Khuyến khích hoàn thành trước:

- [UI Style Selection](./ui_style_selection.skill.md) — Hiểu styles
- [Color Palette Generator](./color_palette_generator.skill.md) — Hiểu color theory
- [Typography Pairing](./typography_pairing.skill.md) — Hiểu typography

---

## 🎯 Mục đích

Sinh ra **design system hoàn chỉnh** từ mô tả sản phẩm: bao gồm UI pattern, style, bảng màu, typography, effects, và anti-patterns. Đây là skill tổng hợp kết hợp 5 domain (product, style, color, landing, typography).

**Khi nào nên dùng:**

- Khởi đầu dự án hoàn toàn mới
- Cần design system nhất quán cho team
- Muốn document design decisions cho stakeholders
- Chuyển từ prototype → production

**Không phù hợp khi:**

- Đã có design system hoàn chỉnh (Figma/Storybook)
- Chỉ cần adjust component nhỏ

---

## 🛡️ Governance Summary (CVF Autonomous)

| Field | Value |
|-------|-------|
| Risk Level | R2 |
| Allowed Roles | User, Reviewer, Lead |
| Allowed Phases | Design, Build |
| Authority Scope | Strategic |
| Autonomy | Semi-auto + Review |
| Audit Hooks | Input completeness, Output structure, Scope guard, Quality check |

---

## ⛔ Execution Constraints

- Không thực thi ngoài phạm vi được khai báo
- Tự động dừng nếu thiếu input bắt buộc
- Với rủi ro R2: semi-auto + human review
- Không ghi/đổi dữ liệu hệ thống nếu chưa được xác nhận
- Output cần review trước khi team adopt

---

## ✅ Validation Hooks

- Check đủ input bắt buộc trước khi bắt đầu
- Check output đúng format đã định nghĩa
- Check coverage: pattern + style + colors + typography + effects + anti-patterns
- Check không vượt scope và không tạo hành động ngoài yêu cầu
- Check output có bước tiếp theo cụ thể

---

## 🧪 UAT Binding

- UAT Record: [design_system_generator](../../../governance/skill-library/uat/results/UAT-design_system_generator.md)
- UAT Objective: Design system output phải đầy đủ 6 sections, phù hợp ngành

---

## 📋 Form Input

| Field | Bắt buộc | Mô tả | Ví dụ |
|-------|----------|-------|-------|
| **Tên dự án** | ✅ | Project name | "Serenity Spa" |
| **Loại sản phẩm** | ✅ | SaaS, e-commerce, landing... | "Beauty/Spa booking platform" |
| **Ngành** | ✅ | Healthcare, Fintech, Beauty... | "Beauty & Wellness" |
| **Đối tượng** | ✅ | Target users | "Phụ nữ 25-45, thành thị, thu nhập trung-cao" |
| **Tech stack** | ❌ | React, Next.js, Vue... | "Next.js + Tailwind" |
| **Pages chính** | ❌ | Các trang cần build | "Home, Services, Booking, Contact" |
| **Brand assets** | ❌ | Logo, colors đã có | "Logo có, chưa có color guide" |
| **References** | ❌ | Websites tham khảo | "<https://example.com> — thích style này" |

---

## ✅ Expected Output

**Kết quả bạn sẽ nhận được:**

```
╔══════════════════════════════════════════════════════════════╗
║  DESIGN SYSTEM: Serenity Spa                                ║
╠══════════════════════════════════════════════════════════════╣
║                                                              ║
║  1. PATTERN: Hero-Centric + Social Proof                    ║
║     Conversion: Emotion-driven with trust elements           ║
║     CTA: Above fold, repeated after testimonials             ║
║     Sections: Hero → Services → Testimonials → Booking       ║
║                                                              ║
║  2. STYLE: Soft UI Evolution                                ║
║     Keywords: Soft shadows, subtle depth, organic shapes     ║
║     Performance: Excellent | Accessibility: WCAG AA          ║
║                                                              ║
║  3. COLORS:                                                  ║
║     Primary:    #E8B4B8 (Soft Pink)                         ║
║     Secondary:  #A8D5BA (Sage Green)                        ║
║     CTA:        #D4AF37 (Gold)                              ║
║     Background: #FFF5F5 (Warm White)                        ║
║     Text:       #2D3436 (Charcoal)                          ║
║                                                              ║
║  4. TYPOGRAPHY: Cormorant Garamond / Montserrat             ║
║     Mood: Elegant, calming, sophisticated                    ║
║     Google Fonts: [URL]                                      ║
║                                                              ║
║  5. KEY EFFECTS:                                            ║
║     Soft shadows + Smooth transitions (200-300ms)            ║
║     Gentle hover states + Organic border-radius              ║
║                                                              ║
║  6. ANTI-PATTERNS (AVOID):                                  ║
║     ✗ Bright neon colors                                     ║
║     ✗ Harsh animations                                       ║
║     ✗ Dark mode (conflicts with calming mood)                ║
║     ✗ AI purple/pink gradients (overused)                    ║
║                                                              ║
║  7. PRE-DELIVERY CHECKLIST:                                 ║
║     [ ] No emojis as icons (use SVG: Heroicons/Lucide)      ║
║     [ ] cursor-pointer on all clickable elements             ║
║     [ ] Hover states with smooth transitions                 ║
║     [ ] Responsive: 375px, 768px, 1024px, 1440px            ║
║     [ ] prefers-reduced-motion respected                     ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
```

---

## 🔍 Cách đánh giá

**Checklist Accept/Reject:**

- [ ] Có đủ 6 sections (Pattern, Style, Colors, Typography, Effects, Anti-patterns)
- [ ] Pattern phù hợp với loại sản phẩm
- [ ] Colors có hex codes + contrast ratios
- [ ] Typography có Google Fonts URL
- [ ] Anti-patterns specific cho ngành (không generic)
- [ ] Pre-delivery checklist included
- [ ] Actionable — team có thể implement ngay

**Red flags (cần Reject):**

- ⚠️ Thiếu bất kỳ section nào trong 6 sections
- ⚠️ Anti-patterns quá generic ("avoid bad design")
- ⚠️ Colors không có hex codes
- ⚠️ Không phù hợp ngành/đối tượng

---

## ⚠️ Common Failures

| Lỗi thường gặp | Cách phòng tránh |
|----------------|------------------|
| Output thiếu section | Check 6 mandatory sections |
| Quá generic, không specific ngành | Force industry-specific reasoning |
| Colors đẹp nhưng contrast thấp | Validate all contrast ratios |
| Anti-patterns thiếu | Yêu cầu ≥3 anti-patterns |
| Không actionable | Phải có CSS/Tailwind code snippets |

---

## 💡 Tips

1. **Design system = Source of Truth** — Team reference duy nhất
2. **Persist output** — Lưu thành `MASTER.md` cho dự án
3. **Page overrides** — Trang đặc biệt có thể override Master
4. **Review with team** — Design system cần consensus
5. **Iterate** — V1 không cần perfect, improve over time

---

## 📊 Ví dụ thực tế

### Input

```
Tên: FinTrack
Loại: Personal finance dashboard
Ngành: Fintech
Đối tượng: Millennials 25-35, tech-savvy
Stack: React + Tailwind + shadcn/ui
Pages: Dashboard, Transactions, Goals, Settings
```

### Output tóm tắt

```
Pattern: Dashboard-First + Onboarding Flow
Style: Clean Data UI (high contrast, dense but readable)
Colors: Navy #1E3A5F + Green #22C55E + White #FAFAFA
Typography: Inter / JetBrains Mono (code/numbers)
Effects: Micro-interactions, skeleton loading, smooth charts
Anti-patterns: ✗ Glassmorphism (blur = slow), ✗ Pastel (low contrast data)
```

### Đánh giá: ✅ ACCEPT

---

## 🔗 Related Skills

- [UI Style Selection](./ui_style_selection.skill.md)
- [Color Palette Generator](./color_palette_generator.skill.md)
- [Typography Pairing](./typography_pairing.skill.md)
- [Interaction Design Review](./interaction_design_review.skill.md)

---

*CVF Skill Library v1.5.2 | Product & UX Domain | Adapted from UI UX Pro Max (MIT)*
