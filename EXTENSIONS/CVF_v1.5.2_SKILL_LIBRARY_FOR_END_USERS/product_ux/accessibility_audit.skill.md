# Accessibility Audit (WCAG)

> **Domain:** Product & UX  
> **Difficulty:** Medium  
> **CVF Version:** v1.5.2  
> **Inspired by:** antigravity-awesome-skills/accessibility

## 🎯 Mục đích

Đánh giá website/app về accessibility theo WCAG guidelines. Đảm bảo sản phẩm có thể sử dụng được bởi mọi người, kể cả người có disabilities.

**Khi nào nên dùng:**
- Launch sản phẩm mới
- Audit compliance trước deadline
- Redesign UI components
- Nhận complaints từ users

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

*CVF Skill Library v1.5.2 | Product & UX Domain*
