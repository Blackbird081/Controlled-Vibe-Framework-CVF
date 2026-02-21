# CSS Animation & Performance

> **Domain:** Web Development  
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

Review CSS animations, transitions, và performance: GPU-accelerated properties, `prefers-reduced-motion`, duration ranges, skeleton loading, và jank prevention.

**Khi nào nên dùng:**
- UI có nhiều animations cần optimize
- Performance audit (FPS drops, jank)
- Accessibility check cho motion sensitivity
- Review animation library usage

**Không phù hợp khi:**
- App không có animations
- Backend performance issues

---

## 🛡️ Governance Summary (CVF Autonomous)

| Field | Value |
|-------|-------|
| Risk Level | R1 |
| Allowed Roles | User, Reviewer |
| Allowed Phases | Build, Review |
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

- UAT Record: [css_animation_performance](../../../governance/skill-library/uat/results/UAT-css_animation_performance.md)
- UAT Objective: Skill phải đạt chuẩn output theo CVF + không vượt quyền

---

## 📋 Form Input

| Field | Bắt buộc | Mô tả | Ví dụ |
|-------|----------|-------|-------|
| **URL/Code** | ✅ | Link hoặc code cần review | Paste component code |
| **Animation types** | ✅ | Loại animations đang dùng | "Page transitions, hover effects, loading" |
| **Framework** | ❌ | CSS, Framer Motion, GSAP... | "Tailwind + Framer Motion" |
| **Performance goals** | ❌ | FPS, LCP targets | "60fps, no jank" |
| **Devices** | ❌ | Target devices | "Low-end Android + iPhone" |

---

## ✅ Expected Output

```
CSS ANIMATION AUDIT: [Project Name]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

GPU-ACCELERATED ✅:
  • transform: translateX(), scale(), rotate()
  • opacity transitions
  • will-change: transform (used sparingly)

NON-GPU ❌ (causes reflow):
  1. width animation on sidebar → Use transform: scaleX()
  2. height animation on accordion → Use max-height + overflow
  3. margin-top on scroll → Use transform: translateY()

DURATION REVIEW:
  ✅ Hover effects: 150ms — OK
  ❌ Page transitions: 800ms — Too slow (max 300ms)
  ✅ Loading spinner: 1000ms loop — OK
  ❌ Dropdown: 50ms — Too fast (min 100ms)

REDUCED MOTION:
  ❌ @media (prefers-reduced-motion: reduce) NOT found!
  → Fix: Add media query, replace animations with instant state changes

SKELETON LOADING:
  ✅ Skeleton on data fetch — Good
  ❌ No skeleton on image load — Add placeholder

PERFORMANCE METRICS:
  Frame rate:     45fps during transitions ❌ (target: 60fps)
  Layout shifts:  3 detected ❌
  Paint area:     Full repaint on scroll ❌

SCORE: 5/10 → Target: 8/10
```

---

## 🔍 Cách đánh giá

**Checklist Accept/Reject:**

- [ ] Animations dùng GPU-accelerated properties (transform, opacity)
- [ ] Không animate width, height, margin, padding
- [ ] Duration 150-300ms cho interactions
- [ ] `prefers-reduced-motion` query present
- [ ] `will-change` dùng đúng chỗ (không overuse)
- [ ] Skeleton loading cho async content
- [ ] No layout shift từ animations
- [ ] Score + prioritized fixes

**Red flags (cần Reject):**
- ⚠️ Animate width/height gây reflow
- ⚠️ Không có `prefers-reduced-motion`
- ⚠️ Duration > 500ms cho interaction animations
- ⚠️ `will-change` trên tất cả elements

---

## ⚠️ Common Failures

| Lỗi thường gặp | Cách phòng tránh |
|----------------|------------------|
| Animate `left/top` | Dùng `transform: translate()` |
| `will-change` overuse | Chỉ dùng khi thật sự cần |
| No reduced motion | Luôn add media query |
| Flash of unstyled state | Animation start từ current state |
| Too many simultaneous | Stagger animations |

---

## 💡 Tips

1. **GPU properties only** — `transform`, `opacity`, `filter`
2. **150-300ms sweet spot** — Fast enough nhưng visible
3. **Stagger animations** — 50ms delay giữa items = polished
4. **`animation-fill-mode: both`** — Prevent flash back
5. **Measure first** — Chrome DevTools Performance tab trước optimize

### Performance Property Cheat Sheet:
```
✅ FAST (GPU-accelerated):
  transform, opacity, filter, clip-path

❌ SLOW (causes layout/paint):
  width, height, margin, padding
  top, left, right, bottom
  font-size, border-width
```

---

## 📊 Ví dụ thực tế

### Input:
```
Code: React component with sidebar toggle + page transitions
Framework: Framer Motion + Tailwind
Performance: Users report lag on mobile
```

### Output tóm tắt:
```
🔴 sidebar: animate width → use translateX
🔴 no prefers-reduced-motion
🟡 page transition: 500ms → reduce to 250ms
🟢 hover effects: 150ms transform+opacity — OK
Fix priority: sidebar > reduced-motion > duration
```

### Đánh giá: ✅ ACCEPT

---

## 🔗 Related Skills

- [React Performance Audit](./10_react_performance_audit.skill.md)
- [Icon System Review](./11_icon_system_review.skill.md)

---

*CVF Skill Library v1.5.2 | Web Development Domain | Adapted from UI UX Pro Max (MIT)*
