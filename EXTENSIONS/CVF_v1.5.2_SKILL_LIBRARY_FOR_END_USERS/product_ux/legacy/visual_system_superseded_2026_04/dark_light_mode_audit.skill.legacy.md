# Dark/Light Mode Audit

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

Kiểm tra việc triển khai dark mode và light mode: text contrast, glass card opacity, border visibility, muted text readability, và OLED optimization.

**Khi nào nên dùng:**

- Vừa implement dark mode, cần verify
- Users complaint "khó đọc" ở 1 mode
- Audit trước khi launch theme switching
- Review glassmorphism/transparent elements cross-mode

**Không phù hợp khi:**

- App chỉ có single theme (không toggle)
- Backend-only project

---

## 🛡️ Governance Summary (CVF Autonomous)

| Field | Value |
|-------|-------|
| Risk Level | R1 |
| Allowed Roles | User, Reviewer |
| Allowed Phases | Design, Review |
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

- UAT Record: [dark_light_mode_audit](../../../governance/skill-library/uat/results/UAT-dark_light_mode_audit.md)
- UAT Objective: Skill phải đạt chuẩn output theo CVF + không vượt quyền

---

## 📋 Form Input

| Field | Bắt buộc | Mô tả | Ví dụ |
|-------|----------|-------|-------|
| **URL/Code** | ✅ | Link hoặc code cần audit | "<https://myapp.com>" |
| **Current modes** | ✅ | Modes đang support | "Dark + Light, auto-detect" |
| **Framework** | ❌ | CSS approach | "Tailwind dark: prefix" |
| **Key pages** | ❌ | Trang quan trọng | "Dashboard, Settings, Profile" |
| **Known issues** | ❌ | Vấn đề đã biết | "Cards invisible in dark mode" |

---

## ✅ Expected Output

**Audit Report cho mỗi mode:**

```
DARK/LIGHT MODE AUDIT: [Project Name]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📱 LIGHT MODE:
  ✅ Text contrast:     7.2:1 (AAA)
  ❌ Muted text:        3.8:1 (Below AA!)
  ✅ Borders visible:   Clear
  ❌ Glass cards:       Nearly invisible
  ✅ CTA buttons:       High contrast

🌙 DARK MODE:
  ✅ Text contrast:     8.1:1 (AAA)
  ✅ Muted text:        4.6:1 (AA)
  ❌ Borders:          Same as background!
  ✅ Glass cards:       Good opacity
  ❌ Images:           Too bright, no dimming

🖥️ OLED DARK:
  ⚠️ True black (#000) used — OK for OLED
  ❌ No dark gray alternative for LCD screens

FIXES NEEDED:
1. Light mode: Increase glass card opacity (0.1 → 0.3)
2. Light mode: Muted text #718096 → #4A5568 (4.5:1)
3. Dark mode: Border color #1A1A1A → #2D2D2D
4. Dark mode: Add image brightness filter (0.85)
```

---

## 🔍 Cách đánh giá

**Checklist Accept/Reject:**

- [ ] Light mode: text contrast ≥ 4.5:1 (AA)
- [ ] Dark mode: text contrast ≥ 4.5:1 (AA)
- [ ] Muted/secondary text ≥ 4.5:1 trên cả 2 modes
- [ ] Glass/transparent elements visible cả 2 modes
- [ ] Borders visible cả 2 modes
- [ ] Images/icons look good cả 2 modes
- [ ] Theme switch không gây flash/flicker
- [ ] `prefers-color-scheme` respected

**Red flags (cần Reject):**

- ⚠️ Contrast < 3:1 ở bất kỳ text nào
- ⚠️ Elements invisible ở 1 mode
- ⚠️ Flash of wrong theme on load
- ⚠️ Hardcoded colors (không dùng CSS vars/Tailwind dark:)

---

## ⚠️ Common Failures

| Lỗi thường gặp | Cách phòng tránh |
|----------------|------------------|
| Glass cards invisible in light mode | Tăng opacity, thêm border |
| Borders same as dark background | Dùng border color khác bg ≥ 15% |
| Muted text unreadable | Min 4.5:1 contrast cho cả 2 modes |
| White images trên white bg | Thêm subtle shadow/border |
| Theme flash on page load | Use system preference + localStorage |

---

## 💡 Tips

1. **CSS Custom Properties** — `--color-text`, `--color-bg` thay vì hardcode
2. **Tailwind `dark:` prefix** — Simplest dark mode approach
3. **Test ở brightness 50%** — Nhiều user giảm screen brightness
4. **OLED ≠ LCD dark** — True black (#000) saves OLED battery nhưng xấu trên LCD
5. **Transition theme** — `transition: background-color 200ms` cho smooth switch

---

## 📊 Ví dụ thực tế

### Input

```
URL: https://mydashboard.app
Current modes: Dark + Light with toggle
Framework: Next.js + Tailwind dark: prefix
Known issues: Cards disappear in light mode
```

### Output tóm tắt

```
Light mode: 3 issues (glass cards, muted text, icon contrast)
Dark mode: 2 issues (borders, image brightness)
Theme transition: OK (200ms, no flash)
Overall: 6/10 → Target: 9/10
Priority fix: Glass card opacity + border colors
```

### Đánh giá: ✅ ACCEPT — Clear fixes, prioritized

---

## 🔗 Related Skills

- [Accessibility Audit](./accessibility_audit.skill.md)
- [UI Style Selection](./ui_style_selection.skill.md)
- [Interaction Design Review](./interaction_design_review.skill.md)

---

*CVF Skill Library v1.5.2 | Product & UX Domain | Adapted from UI UX Pro Max (MIT)*
