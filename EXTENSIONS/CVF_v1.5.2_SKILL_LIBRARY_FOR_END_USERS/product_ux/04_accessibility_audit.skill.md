# Accessibility Audit (WCAG)

> **Domain:** Product & UX  
> **Difficulty:** Medium  
> **CVF Version:** v1.5.2  
> **Skill Version:** 1.0.1  
> **Last Updated:** 2026-02-07
> **Inspired by:** antigravity-awesome-skills/accessibility

## 📌 Prerequisites

Không yêu cầu.

---

## 🎯 Mục đích

Đánh giá website/app về accessibility theo WCAG guidelines. Đảm bảo sản phẩm có thể sử dụng được bởi mọi người, kể cả người có disabilities.

**Khi nào nên dùng:**
- Launch sản phẩm mới
- Audit compliance trước deadline
- Redesign UI components
- Nhận complaints từ users

---

## 🛡️ Governance Summary (CVF Autonomous)

| Field | Value |
|-------|-------|
| Risk Level | R1 |
| Allowed Roles | User, Reviewer |
| Allowed Phases | Discovery, Design, Review |
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

- UAT Record: [accessibility_audit](../../../governance/skill-library/uat/results/UAT-accessibility_audit.md)
- UAT Objective: Skill phải đạt chuẩn output theo CVF + không vượt quyền

---
## 📋 Form Input

| Field | Bắt buộc | Mô tả |
|-------|----------|-------|
| **URL/App** | ✅ | Link hoặc mô tả sản phẩm |
| **Target WCAG Level** | ✅ | A, AA, hoặc AAA |
| **Key Pages** | ✅ | Các trang quan trọng cần audit |
| **User Types** | ❌ | Visual, Hearing, Motor, Cognitive |
| **Industry** | ❌ | Healthcare, Finance, Education (có requirements riêng) |
| **Current Issues** | ❌ | Known problems nếu có |

---

## ✅ Checklist Đánh giá

### Perceivable (Có thể cảm nhận)
- [ ] **Text alternatives:** Images có alt text?
- [ ] **Captions:** Videos có subtitles/captions?
- [ ] **Color contrast:** Minimum 4.5:1 cho text?
- [ ] **Resize text:** Có thể zoom 200% không bị break?
- [ ] **Text spacing:** Có thể tăng line height, letter spacing?
- [ ] **Don't use color alone:** Info không chỉ rely on color?

### Operable (Có thể vận hành)
- [ ] **Keyboard:** Tất cả functions dùng được bằng keyboard?
- [ ] **Focus visible:** Focus indicator có visible?
- [ ] **Focus order:** Tab order có logical?
- [ ] **Skip links:** Có skip to main content?
- [ ] **No time limits:** Hoặc có thể extend?
- [ ] **No seizure risk:** Không flash > 3 lần/giây?
- [ ] **Multiple ways:** Có nhiều cách navigate (search, menu, sitemap)?

### Understandable (Có thể hiểu)
- [ ] **Language:** Page language có declared?
- [ ] **Predictable:** Navigation nhất quán across pages?
- [ ] **Input assistance:** Form errors có clear và helpful?
- [ ] **Error prevention:** Có confirmation cho actions quan trọng?

### Robust (Vững chắc)
- [ ] **Valid HTML:** Markup có valid?
- [ ] **ARIA:** Proper use của ARIA attributes?
- [ ] **Name, Role, Value:** All UI components có accessible name?

---

## ⚠️ Lỗi Thường Gặp

| Lỗi | Impact | WCAG | Fix |
|-----|--------|------|-----|
| **Missing alt text** | Screen reader can't read | 1.1.1 | Add descriptive alt |
| **Low contrast** | Hard to read | 1.4.3 | Min 4.5:1 ratio |
| **No focus styles** | Can't see keyboard focus | 2.4.7 | Add :focus styles |
| **Mouse-only** | Keyboard users blocked | 2.1.1 | Add keyboard handlers |
| **Missing labels** | Forms confusing | 1.3.1 | Add label elements |
| **Auto-playing media** | Distracting | 1.4.2 | Add pause control |
| **CAPTCHA** | Blocks assistive tech | - | Use accessible alternatives |

---

## 💡 Tips & Examples

### WCAG Levels:
| Level | Description | Required For |
|-------|-------------|--------------|
| **A** | Basic minimum | All websites |
| **AA** | Standard (recommended) | Government, Enterprise |
| **AAA** | Excellent | Specialized audiences |

### Color Contrast Check:
```
Text size < 18px (or 14px bold):
  ✅ Normal: 4.5:1 minimum
  ✅ Enhanced: 7:1 for AAA

Large text ≥ 18px (or 14px bold):
  ✅ Normal: 3:1 minimum
  ✅ Enhanced: 4.5:1 for AAA
```

### Free Testing Tools:
| Tool | Purpose |
|------|---------|
| **WAVE** | Browser extension for quick checks |
| **axe DevTools** | Detailed component testing |
| **Lighthouse** | Built into Chrome DevTools |
| **NVDA/VoiceOver** | Actual screen reader testing |
| **Color Contrast Checker** | WebAIM's color tool |

### ARIA Best Practices:
```html
<!-- Good: Native HTML first -->
<button>Click me</button>

<!-- If custom element needed, use ARIA -->
<div role="button" tabindex="0" 
     aria-label="Click me">Click</div>

<!-- Common ARIA attributes -->
aria-label="Description"
aria-describedby="helper-text-id"
aria-hidden="true" (decorative only)
aria-live="polite" (dynamic content)
```

### Quick Keyboard Test:
1. Press **Tab** - Can you reach all interactive elements?
2. Press **Enter/Space** - Can you activate buttons/links?
3. Press **Escape** - Can you close modals/popups?
4. Press **Arrow keys** - Can you navigate menus?
5. Is **focus visible** at all times?

---

## 📤 Expected Output từ AI

Khi paste spec này vào AI, bạn sẽ nhận được:

1. **Compliance Score** - Overall WCAG compliance %
2. **Issue List** - Violations grouped by WCAG criteria
3. **Severity Ranking** - Critical, Major, Minor
4. **Fix Recommendations** - How to resolve each issue
5. **Priority Matrix** - What to fix first
6. **Testing Checklist** - How to verify fixes
7. **Remediation Timeline** - Estimated effort

---

## 🔗 Next Step

Sau khi hoàn thành **Accessibility Audit (WCAG)**, tiếp tục với:
→ [A/B Test Review](./ab_test_review.skill.md)

---

*CVF Skill Library v1.5.2 | Product & UX Domain*

---

## 📊 Ví dụ thực tế

### Input mẫu:
```
Trang: Dashboard StockFlow
Scope: Sidebar + table + filter modal
Tools: Lighthouse + axe
```

### Output mẫu:
```markdown
# Accessibility Findings

## Violations
- WCAG 1.4.3 Contrast: text xám trên nền #F5F5F5 (ratio 2.8:1)
- WCAG 2.1.1 Keyboard: filter modal không focus trap
- WCAG 4.1.2 Labels: input search thiếu aria-label

## Fixes
- Đổi text thành #333, nâng contrast > 4.5:1
- Thêm focus trap + ESC close
- Bổ sung aria-label="Search SKU"
```

### Đánh giá:
- ✅ Map đúng WCAG
- ✅ Fix cụ thể, khả thi
- ✅ Có tool kiểm chứng
- **Kết quả: ACCEPT**

## 🔗 Related Skills
- [UX Heuristic Evaluation](./ux_heuristic_evaluation.skill.md)
- [Error Handling UX](./error_handling_ux.skill.md)

## 📜 Version History

| Version | Date | Changes |
|---|---|---|
| 1.0.1 | 2026-02-07 | Domain refinement: examples + flow alignment |
| 1.0.0 | 2026-02-07 | Initial standardized metadata + example/related sections |

## 🔗 Next Step

Sau khi hoàn thành **Accessibility Audit (WCAG)**, tiếp tục với:
→ [Error Handling UX](./error_handling_ux.skill.md)

---

*CVF Skill Library v1.5.2 | Product & UX Domain*