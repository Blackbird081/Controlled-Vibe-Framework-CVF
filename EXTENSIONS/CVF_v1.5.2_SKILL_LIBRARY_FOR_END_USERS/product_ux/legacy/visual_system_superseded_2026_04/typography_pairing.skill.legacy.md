# Typography Pairing

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

Chọn cặp font (heading + body) phù hợp cho sản phẩm, kèm Google Fonts URL, CSS import, và Tailwind config. Dựa trên 57+ font pairings đã được curate.

**Khi nào nên dùng:**

- Bắt đầu dự án mới, chưa chọn font
- Redesign typography hiện tại
- Cần font pairing phù hợp ngành/mood cụ thể
- Optimize readability cho content-heavy sites

**Không phù hợp khi:**

- Đã có brand guidelines với font cố định
- Dùng custom/proprietary fonts

---

## 🛡️ Governance Summary (CVF Autonomous)

| Field | Value |
|-------|-------|
| Risk Level | R0 |
| Allowed Roles | User, Reviewer |
| Allowed Phases | Discovery, Design |
| Authority Scope | Tactical |
| Autonomy | Auto + Audit |
| Audit Hooks | Input completeness, Output structure, Scope guard |

---

## ⛔ Execution Constraints

- Không thực thi ngoài phạm vi được khai báo
- Tự động dừng nếu thiếu input bắt buộc
- Với rủi ro R0: auto
- Không ghi/đổi dữ liệu hệ thống nếu chưa được xác nhận

---

## ✅ Validation Hooks

- Check đủ input bắt buộc trước khi bắt đầu
- Check output đúng format đã định nghĩa
- Check không vượt scope và không tạo hành động ngoài yêu cầu
- Check output có bước tiếp theo cụ thể

---

## 🧪 UAT Binding

- UAT Record: [typography_pairing](../../../governance/skill-library/uat/results/UAT-typography_pairing.md)
- UAT Objective: Skill phải đạt chuẩn output theo CVF + không vượt quyền

---

## 📋 Form Input

| Field | Bắt buộc | Mô tả | Ví dụ |
|-------|----------|-------|-------|
| **Mood** | ✅ | Cảm giác mong muốn | "Elegant, professional, modern" |
| **Ngành** | ✅ | Lĩnh vực sản phẩm | "Luxury fashion e-commerce" |
| **Content type** | ❌ | Long-form, data, marketing... | "Blog + documentation" |
| **Language** | ❌ | Ngôn ngữ nội dung | "Vietnamese + English" |
| **Performance** | ❌ | Priority: speed vs aesthetics | "Performance first" |
| **Existing font** | ❌ | Font đang dùng (nếu có) | "Inter cho body" |

---

## ✅ Expected Output

**Kết quả bạn sẽ nhận được:**

```
TYPOGRAPHY PAIRING: [Project Name]
─────────────────────────────────────────
HEADING: Cormorant Garamond (Serif)
  Weight: 600, 700
  Mood: Elegant, sophisticated, editorial
  Best for: Luxury, wellness, editorial

BODY: Montserrat (Sans-serif)
  Weight: 400, 500, 600
  Mood: Clean, readable, universal
  Best for: All content types

IMPORT:
  <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@600;700&family=Montserrat:wght@400;500;600&display=swap" rel="stylesheet">

TAILWIND CONFIG:
  fontFamily: {
    heading: ['Cormorant Garamond', 'serif'],
    body: ['Montserrat', 'sans-serif'],
  }

SCALE:
  H1: 2.5rem/3rem  (heading, 700)
  H2: 2rem/2.5rem  (heading, 600)
  H3: 1.5rem/2rem  (heading, 600)
  Body: 1rem/1.5rem (body, 400)
  Small: 0.875rem   (body, 400)
─────────────────────────────────────────
ALTERNATIVES:
  2nd: Playfair Display + Lato — More dramatic contrast
  3rd: DM Serif Display + DM Sans — Matched family
```

---

## 🔍 Cách đánh giá

**Checklist Accept/Reject:**

- [ ] Heading + Body font pairing hài hòa
- [ ] Google Fonts URL chính xác
- [ ] Tailwind config snippet sẵn dùng
- [ ] Type scale rõ ràng (H1-H3, body, small)
- [ ] Font weights specified
- [ ] Alternatives provided (ít nhất 2)
- [ ] Phù hợp ngành/mood

**Red flags (cần Reject):**

- ⚠️ Dùng > 3 fonts (performance)
- ⚠️ Heading + body quá giống → thiếu hierarchy
- ⚠️ Font không support Vietnamese characters
- ⚠️ Thiếu font weight cho bold/medium

---

## ⚠️ Common Failures

| Lỗi thường gặp | Cách phòng tránh |
|----------------|------------------|
| Font không support tiếng Việt | Check Vietnamese character set |
| Quá nhiều font weights (>6) | Giới hạn 3-4 weights |
| Display font dùng cho body | Display fonts chỉ cho headings |
| Font size quá nhỏ (< 16px body) | Body text ≥ 16px |
| Không có fallback fonts | Luôn include system fallbacks |

---

## 💡 Tips

1. **Serif + Sans-serif** = Classic pairing an toàn nhất
2. **Cùng họ font** (DM Serif + DM Sans) = guaranteed harmony
3. **Max 2 fonts, 4 weights** = optimal performance
4. **Vietnamese check** — Nhiều Google Fonts không support tiếng Việt đầy đủ
5. **`font-display: swap`** = không block rendering khi font loading

---

## 📊 Ví dụ thực tế

### Input

```
Mood: Playful, friendly, startup
Ngành: EdTech SaaS
Content: Landing page + dashboard
Language: Vietnamese + English
```

### Output tóm tắt

```
Heading: Space Grotesk (Sans) — Geometric, techy, playful
Body: Inter (Sans) — Ultra-readable, variable weight
Scale: H1=2.25rem, Body=1rem
Google Fonts: ✅ Vietnamese support
```

### Đánh giá: ✅ ACCEPT

---

## 🔗 Related Skills

- [UI Style Selection](./ui_style_selection.skill.md)
- [Color Palette Generator](./color_palette_generator.skill.md)
- [Design System Generator](./design_system_generator.skill.md)

---

*CVF Skill Library v1.5.2 | Product & UX Domain | Adapted from UI UX Pro Max (MIT)*
