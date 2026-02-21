# UI Pre-Delivery Checklist

> **Domain:** App Development  
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

Checklist kiểm tra cuối cùng trước khi ship UI code. Validates visual quality, interaction, dark/light mode, layout responsiveness, và accessibility.

**Khi nào nên dùng:**
- Trước khi merge PR có UI changes
- Trước khi deploy lên production
- Code review cho frontend
- QA handoff

**Không phù hợp khi:**
- Backend-only changes
- Documentation updates

---

## 🛡️ Governance Summary (CVF Autonomous)

| Field | Value |
|-------|-------|
| Risk Level | R1 |
| Allowed Roles | User, Reviewer |
| Allowed Phases | Build, Review, Deploy |
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

- UAT Record: [ui_pre_delivery_checklist](../../../governance/skill-library/uat/results/UAT-ui_pre_delivery_checklist.md)
- UAT Objective: Skill phải đạt chuẩn output theo CVF + không vượt quyền

---

## 📋 Form Input

| Field | Bắt buộc | Mô tả | Ví dụ |
|-------|----------|-------|-------|
| **URL/Code** | ✅ | Link hoặc code cần check | "https://staging.myapp.com" |
| **Pages changed** | ✅ | Trang/components đã thay đổi | "Home page hero, nav dropdown" |
| **Framework** | ❌ | React, Vue, HTML... | "Next.js + Tailwind" |
| **Dark mode** | ❌ | Có support dark mode? | "Yes" |

---

## ✅ Pre-Delivery Checklist

### 🎨 Visual Quality

- [ ] **No emojis as icons** — Use SVG (Heroicons/Lucide)
- [ ] **Consistent icon set** — All from same library
- [ ] **Brand logos correct** — Verified from Simple Icons
- [ ] **Hover states** don't cause layout shift
- [ ] **Theme colors** used directly (`bg-primary`) not `var()` wrapper
- [ ] **Consistent spacing** — 4px/8px grid system

### 🖱️ Interaction

- [ ] **All clickable elements** have `cursor-pointer`
- [ ] **Hover states** provide clear visual feedback
- [ ] **Transitions** are smooth (150-300ms)
- [ ] **Focus states** visible for keyboard navigation
- [ ] **Loading states** for async operations
- [ ] **Error states** clear and helpful

### 🌙 Light/Dark Mode

- [ ] **Light mode** text has sufficient contrast (4.5:1 minimum)
- [ ] **Glass/transparent** elements visible in light mode
- [ ] **Borders** visible in both modes
- [ ] **Images** look good in both modes
- [ ] **Test both modes** before delivery

### 📐 Layout

- [ ] **Floating elements** have proper spacing from edges
- [ ] **No content** hidden behind fixed navbars
- [ ] **Responsive** at 375px, 768px, 1024px, 1440px
- [ ] **No horizontal scroll** on mobile
- [ ] **Safe area** respected (notched phones)

### ♿ Accessibility

- [ ] **All images** have alt text
- [ ] **Form inputs** have labels
- [ ] **Color** is not the only indicator
- [ ] **`prefers-reduced-motion`** respected
- [ ] **Touch targets** ≥ 44x44px on mobile

---

## ✅ Expected Output

```
PRE-DELIVERY CHECK: [Project Name]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

VISUAL:     ✅ 6/6 passed
INTERACTION: ❌ 4/6 (cursor-pointer missing on 3 cards, no loading state)
LIGHT/DARK:  ✅ 5/5 passed
LAYOUT:      ❌ 4/5 (horizontal scroll at 375px)
A11Y:        ❌ 3/5 (2 images no alt, reduced-motion not handled)

OVERALL: 22/27 (81%) — NEEDS FIXES

BLOCKERS (must fix before ship):
1. cursor-pointer on ProductCard, CategoryTag, UserAvatar
2. Horizontal scroll at 375px — overflow-x: hidden on container
3. Alt text on hero image + profile placeholder

NICE-TO-HAVE (fix in next sprint):
4. Loading state on "Add to Cart" button
5. prefers-reduced-motion for carousel

VERDICT: ❌ FIX BLOCKERS → RECHECK → SHIP
```

---

## 🔍 Cách đánh giá

**Scoring:**
- 100% = Ship immediately
- 80-99% = Fix blockers then ship
- 60-79% = Significant work needed
- < 60% = Not ready

**Gate rules:**
- Any CRITICAL (accessibility, broken on mobile) = BLOCK
- All interaction basics (cursor, hover, focus) = REQUIRED
- Dark mode issues = BLOCK if app supports dark mode

---

## ⚠️ Common Failures

| Lỗi thường gặp | Cách phòng tránh |
|----------------|------------------|
| Submit sáng, quên test dark | Always test both modes |
| Mobile chỉ test portrait | Test landscape too |
| Quên cursor-pointer | Global CSS: clickable → pointer |
| Alt text "image" | Descriptive alt: "Dashboard monthly revenue chart" |
| Ship without loading states | Every button with async action needs loading |

---

## 💡 Tips

1. **Automate** — ESLint rules for a11y (eslint-plugin-jsx-a11y)
2. **Browser extension** — axe DevTools for quick a11y scan
3. **Chrome Device Toolbar** — Test responsive nhanh
4. **Lighthouse CI** — Automated score check in CI/CD
5. **Screenshot testing** — Visual regression với Percy/Chromatic

---

## 📊 Ví dụ thực tế

### Input:
```
URL: https://staging.myshop.com
Changed: Product listing page, cart sidebar
Framework: Next.js + Tailwind
Dark mode: Yes
```

### Output tóm tắt:
```
Visual: 6/6 ✅
Interaction: 5/6 ❌ (cart sidebar no loading)
Light/Dark: 4/5 ❌ (cart badge invisible in light)
Layout: 5/5 ✅
A11y: 5/5 ✅
Overall: 25/27 (93%) — Fix 2 items → Ship
```

### Đánh giá: ✅ ACCEPT

---

## 🔗 Related Skills

- [Interaction Design Review](../product_ux/interaction_design_review.skill.md)
- [Accessibility Audit](../product_ux/accessibility_audit.skill.md)
- [Dark/Light Mode Audit](../product_ux/dark_light_mode_audit.skill.md)

---

*CVF Skill Library v1.5.2 | App Development Domain | Adapted from UI UX Pro Max (MIT)*
