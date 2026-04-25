# Web ARIA & Keyboard Audit

> **Domain:** Web Development  
> **Difficulty:** ⭐⭐⭐ Advanced  
> **CVF Version:** v1.5.2  
> **Skill Version:** 1.0.0  
> **Last Updated:** 2026-02-22  
> **Inspired by:** [UI UX Pro Max](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill) (MIT License)

---

## 📌 Prerequisites

Khuyến khích hoàn thành trước:
- [Accessibility Audit](../product_ux/accessibility_audit.skill.md) — Hiểu WCAG cơ bản

---

## 🎯 Mục đích

Kiểm tra ARIA labels, keyboard navigation, semantic HTML, focus management, skip links, và screen reader compatibility. Chuyên sâu hơn Accessibility Audit — tập trung vào kỹ thuật implementation.

**Khi nào nên dùng:**
- Build custom components (dropdown, modal, tabs...)
- Audit ARIA implementation hiện tại
- Compliance requirement (ADA, Section 508)
- Screen reader testing

**Không phù hợp khi:**
- Chỉ dùng native HTML elements (đã semantic sẵn)
- Visual design audit (dùng Accessibility Audit)

---

## 🛡️ Governance Summary (CVF Autonomous)

| Field | Value |
|-------|-------|
| Risk Level | R2 |
| Allowed Roles | User, Reviewer, Lead |
| Allowed Phases | Build, Review |
| Authority Scope | Tactical |
| Autonomy | Semi-auto + Review |
| Audit Hooks | Input completeness, Output structure, Scope guard |

---

## ⛔ Execution Constraints

- Không thực thi ngoài phạm vi được khai báo
- Tự động dừng nếu thiếu input bắt buộc
- Với rủi ro R2: semi-auto, cần review
- Không ghi/đổi dữ liệu hệ thống nếu chưa được xác nhận

---

## ✅ Validation Hooks

- Check đủ input bắt buộc trước khi bắt đầu
- Check output đúng format đã định nghĩa
- Check không vượt scope và không tạo hành động ngoài yêu cầu
- Check output có bước tiếp theo cụ thể

---

## 🧪 UAT Binding

- UAT Record: [web_aria_keyboard_audit](../../../governance/skill-library/uat/results/UAT-web_aria_keyboard_audit.md)
- UAT Objective: Skill phải đạt chuẩn output theo CVF + không vượt quyền

---

## 📋 Form Input

| Field | Bắt buộc | Mô tả | Ví dụ |
|-------|----------|-------|-------|
| **URL/Code** | ✅ | Link hoặc code cần audit | "https://myapp.com" |
| **Components** | ✅ | Custom components cần check | "Modal, Dropdown, Tab panel, Toast" |
| **Framework** | ❌ | React, Vue, vanilla... | "React + shadcn/ui" |
| **Screen readers** | ❌ | Target screen readers | "NVDA, VoiceOver" |
| **Compliance** | ❌ | Compliance target | "WCAG 2.1 AA" |

---

## ✅ Expected Output

```
ARIA & KEYBOARD AUDIT: [Project Name]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🔴 CRITICAL:
1. Modal: No focus trap — Tab escapes modal
   → Fix: Add focus trap (see focus-trap library)
2. Dropdown: Missing role="listbox" + aria-expanded
   → Fix: role="listbox", aria-expanded="true/false"

🟡 HIGH:
3. Skip link missing
   → Fix: <a href="#main" className="sr-only focus:not-sr-only">
4. Tab panel: aria-selected not synced
   → Fix: aria-selected="true" on active tab

🟢 MEDIUM:
5. Toast: No aria-live region
   → Fix: aria-live="polite" role="status"
6. Icons: Decorative icons missing aria-hidden
   → Fix: aria-hidden="true" on decorative SVGs

KEYBOARD NAVIGATION:
  ✅ Enter/Space activates buttons
  ❌ Escape doesn't close modal
  ❌ Arrow keys don't navigate menu items
  ✅ Tab order follows visual order
  ❌ No visible focus indicator on cards

SEMANTIC HTML:
  ❌ <div> used instead of <nav>
  ❌ <div> used instead of <main>
  ✅ <button> used correctly
  ❌ <a> without href (should be button)

SCORE: 4/10 → Target: 8/10
```

---

## 🔍 Cách đánh giá

**Checklist Accept/Reject:**

- [ ] Tất cả custom components có ARIA roles
- [ ] `aria-expanded`, `aria-selected`, `aria-hidden` đúng state
- [ ] Keyboard navigation hoạt động (Tab, Enter, Escape, Arrows)
- [ ] Focus trap trong modals/dialogs
- [ ] Skip link present
- [ ] `aria-live` cho dynamic content
- [ ] Semantic HTML (nav, main, aside, button)
- [ ] Score provided với fixes prioritized

**Red flags (cần Reject):**
- ⚠️ Không có focus trap trong modal
- ⚠️ Không test với screen reader thực tế
- ⚠️ Chỉ list issues mà không có fix instructions
- ⚠️ Thiếu keyboard navigation testing

---

## ⚠️ Common Failures

| Lỗi thường gặp | Cách phòng tránh |
|----------------|------------------|
| `div` thay vì `button` | Native HTML > ARIA |
| aria-label trùng visible text | Dùng `aria-labelledby` |
| Focus trap thiếu trong modal | Dùng `focus-trap-react` lib |
| `tabindex` > 0 | Chỉ dùng 0 hoặc -1 |
| aria-hidden trên focusable | Sẽ confuse screen readers |

---

## 💡 Tips

1. **Native HTML first** — `<button>` tốt hơn `<div role="button">`
2. **`tabindex="-1"`** — Programmatic focus, không trong tab order
3. **`aria-live="polite"`** — Cho notifications, `"assertive"` cho errors
4. **Test thật** — Browser devtools ≠ NVDA/VoiceOver testing
5. **WAI-ARIA Patterns** — Luôn follow [APG patterns](https://www.w3.org/WAI/ARIA/apg/patterns/)

---

## 📊 Ví dụ thực tế

### Input:
```
URL: React SaaS dashboard
Components: Modal, Dropdown menu, Data table, Toast notifications
Framework: React + Radix UI
Compliance: WCAG 2.1 AA
```

### Output tóm tắt:
```
Radix UI components: mostly compliant ✅
Custom data table: needs aria-sort, aria-rowcount
Toast: needs aria-live region
Modal: focus trap OK (Radix built-in)
Score: 7/10 — minor fixes needed
```

### Đánh giá: ✅ ACCEPT

---

## 🔗 Related Skills

- [Accessibility Audit](../product_ux/accessibility_audit.skill.md)
- [CSS Animation & Performance](./09_css_animation_performance.skill.md)

---

*CVF Skill Library v1.5.2 | Web Development Domain | Adapted from UI UX Pro Max (MIT)*
