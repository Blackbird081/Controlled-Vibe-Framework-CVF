# Color Palette Generator

> **Domain:** Product & UX  
> **Difficulty:** ⭐⭐ Medium  
> **CVF Version:** v1.5.2  
> **Skill Version:** 1.0.0  
> **Last Updated:** 2026-02-22  
> **Inspired by:** [UI UX Pro Max](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill) (MIT License)

---

## 📌 Prerequisites

Không yêu cầu.

---

## 🎯 Mục đích

Sinh bảng màu hoàn chỉnh cho sản phẩm dựa trên loại sản phẩm và ngành. Bao gồm Primary, Secondary, CTA, Background, Text, Border — tất cả với hex codes và contrast ratios.

**Khi nào nên dùng:**
- Bắt đầu dự án mới, chưa có brand colors
- Redesign brand identity
- Cần bảng màu phù hợp ngành cụ thể
- Kiểm tra contrast ratio hiện tại

**Không phù hợp khi:**
- Đã có brand guidelines hoàn chỉnh với color tokens
- Chỉ cần adjust 1-2 màu nhỏ

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

- UAT Record: [color_palette_generator](../../../governance/skill-library/uat/results/UAT-color_palette_generator.md)
- UAT Objective: Skill phải đạt chuẩn output theo CVF + không vượt quyền

---

## 📋 Form Input

| Field | Bắt buộc | Mô tả | Ví dụ |
|-------|----------|-------|-------|
| **Loại sản phẩm** | ✅ | SaaS, e-commerce, spa, clinic... | "Healthcare SaaS" |
| **Ngành** | ✅ | Fintech, Beauty, Education... | "Y tế" |
| **Mood** | ✅ | Cảm giác muốn truyền tải | "Tin cậy, sạch, chuyên nghiệp" |
| **Existing colors** | ❌ | Màu đã có (nếu có) | "#2D3748 (brand blue)" |
| **Dark/Light** | ❌ | Theme preference | "Light mode chủ đạo" |
| **Accessibility** | ❌ | WCAG level mong muốn | "WCAG AA" |

---

## ✅ Expected Output

**Kết quả bạn sẽ nhận được:**

```
COLOR PALETTE: [Project Name]
─────────────────────────────────────────
Primary:     #2D3748  (Trust Blue)      — Brand identity, headers
Secondary:   #4A90D9  (Sky Blue)        — Links, accents
CTA:         #38A169  (Success Green)   — Buttons, conversion
Background:  #F7FAFC  (Clean White)     — Main background
Surface:     #EDF2F7  (Light Gray)      — Cards, sections
Text:        #1A202C  (Dark Charcoal)   — Body text
Muted:       #718096  (Gray)            — Secondary text
Border:      #E2E8F0  (Light Border)    — Dividers, outlines
Error:       #E53E3E  (Red)             — Errors, warnings
Success:     #38A169  (Green)           — Success states
─────────────────────────────────────────
CONTRAST RATIOS:
  Text on BG:     12.6:1  ✅ AAA
  Muted on BG:     4.8:1  ✅ AA
  CTA on White:    4.6:1  ✅ AA
─────────────────────────────────────────
NOTES:
  • Palette optimized for Healthcare trust
  • Avoid red as primary (medical anxiety)
  • Green CTA = positive action association
```

---

## 🔍 Cách đánh giá

**Checklist Accept/Reject:**

- [ ] Có đủ 8+ color tokens (primary, secondary, CTA, bg, text, border, error, success)
- [ ] Tất cả colors có hex codes
- [ ] Contrast ratios đạt WCAG AA (4.5:1 cho text)
- [ ] Palette phù hợp mood/ngành
- [ ] Có notes giải thích lý do chọn
- [ ] Anti-patterns được liệt kê

**Red flags (cần Reject):**
- ⚠️ Primary color quá neon/sáng cho professional app
- ⚠️ Contrast ratio dưới 4.5:1
- ⚠️ Thiếu error/success states
- ⚠️ Không có dark mode variant

---

## ⚠️ Common Failures

| Lỗi thường gặp | Cách phòng tránh |
|----------------|------------------|
| Dùng quá nhiều màu (>10 chính) | Giới hạn 6-8 core colors |
| Contrast ratio thấp | Check tất cả text/bg combos |
| Màu đẹp nhưng không phù hợp ngành | Map ngành → color mood trước |
| Bỏ qua dark mode | Luôn provide dark variant |
| CTA color lẫn với background | CTA phải contrast mạnh |

---

## 💡 Tips

1. **60-30-10 rule** — 60% neutral, 30% primary, 10% accent
2. **Ngành Healthcare** — Avoid đỏ mạnh (anxiety), prefer xanh (trust)
3. **Ngành Fintech** — Navy/dark blue = stability, green = growth
4. **Ngành Beauty** — Soft pink, sage green, gold accents
5. **Always check grayscale** — Palette vẫn phải readable khi mất màu

---

## 📊 Ví dụ thực tế

### Input:
```
Loại sản phẩm: Beauty Spa booking platform
Ngành: Beauty/Wellness
Mood: Calming, premium, feminine
Accessibility: WCAG AA
```

### Output tóm tắt:
```
Primary:    #E8B4B8 (Soft Pink)      — Brand warmth
Secondary:  #A8D5BA (Sage Green)     — Balance, nature
CTA:        #D4AF37 (Gold)           — Premium action
Background: #FFF5F5 (Warm White)     — Soft, inviting
Text:       #2D3436 (Charcoal)       — Readable, not harsh
```

### Đánh giá: ✅ ACCEPT — Phù hợp ngành Beauty, contrast đạt AA

---

## 🔗 Related Skills

- [UI Style Selection](./ui_style_selection.skill.md)
- [Typography Pairing](./typography_pairing.skill.md)
- [Design System Generator](./design_system_generator.skill.md)

---

*CVF Skill Library v1.5.2 | Product & UX Domain | Adapted from UI UX Pro Max (MIT)*
