# React Performance Audit

> **Domain:** Web Development  
> **Difficulty:** ⭐⭐⭐ Advanced  
> **CVF Version:** v1.5.2  
> **Skill Version:** 1.0.0  
> **Last Updated:** 2026-02-22  
> **Inspired by:** [UI UX Pro Max](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill) (MIT License)

---

## 📌 Prerequisites

Không yêu cầu. Hữu ích nếu đã biết React basics.

---

## 🎯 Mục đích

Audit React/Next.js apps cho render waterfalls, bundle size, Suspense boundaries, memo usage, re-render prevention, và caching strategies.

**Khi nào nên dùng:**
- App React/Next.js chậm, cần tìm bottleneck
- Bundle size quá lớn
- Components re-render không cần thiết
- Lighthouse performance score thấp

**Không phù hợp khi:**
- App không dùng React/Next.js
- Backend/API performance issues (khác skill)
- CSS-only performance issues (dùng CSS Animation & Performance)

---

## 🛡️ Governance Summary (CVF Autonomous)

| Field | Value |
|-------|-------|
| Risk Level | R2 |
| Allowed Roles | User, Reviewer, Lead |
| Allowed Phases | Build, Review, Optimize |
| Authority Scope | Tactical |
| Autonomy | Semi-auto + Review |
| Audit Hooks | Input completeness, Output structure, Scope guard |

---

## ⛔ Execution Constraints

- Không thực thi ngoài phạm vi được khai báo
- Tự động dừng nếu thiếu input bắt buộc
- Với rủi ro R2: semi-auto, cần human review
- Không ghi/đổi dữ liệu hệ thống nếu chưa được xác nhận

---

## ✅ Validation Hooks

- Check đủ input bắt buộc trước khi bắt đầu
- Check output đúng format đã định nghĩa
- Check không vượt scope và không tạo hành động ngoài yêu cầu
- Check output có bước tiếp theo cụ thể

---

## 🧪 UAT Binding

- UAT Record: [react_performance_audit](../../../governance/skill-library/uat/results/UAT-react_performance_audit.md)
- UAT Objective: Skill phải đạt chuẩn output theo CVF + không vượt quyền

---

## 📋 Form Input

| Field | Bắt buộc | Mô tả | Ví dụ |
|-------|----------|-------|-------|
| **Code/Repo** | ✅ | Source code hoặc repo URL | "Paste component code" |
| **Framework** | ✅ | React, Next.js, Remix... | "Next.js 15 App Router" |
| **Symptoms** | ✅ | Vấn đề performance cụ thể | "Slow page load, UI lag on interactions" |
| **Bundle size** | ❌ | Current bundle nếu biết | "2.3MB gzipped" |
| **Lighthouse** | ❌ | Current scores | "Performance: 45" |
| **Key pages** | ❌ | Trang cần optimize | "Dashboard, Product list" |

---

## ✅ Expected Output

```
REACT PERFORMANCE AUDIT: [Project Name]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🔴 RENDER WATERFALL:
1. Dashboard fetches 5 APIs sequentially
   → Fix: Promise.all() or React Suspense parallel
2. Parent re-renders cascade to 47 children
   → Fix: React.memo() on stable components

🟡 BUNDLE SIZE:
3. moment.js (300KB) loaded for date formatting
   → Fix: Replace with date-fns (tree-shakeable) or dayjs (2KB)
4. Entire icon library imported
   → Fix: Import individual icons: import { Search } from 'lucide-react'

🟡 RE-RENDERS:
5. Context updates trigger full tree re-render
   → Fix: Split contexts by update frequency
6. Inline objects/functions in JSX
   → Fix: useMemo/useCallback for reference stability

🟢 CACHING:
7. No data caching — API called on every mount
   → Fix: React Query / SWR with staleTime
8. Images not optimized
   → Fix: Next.js <Image> with priority + sizes

📊 IMPACT ESTIMATE:
  Bundle:     2.3MB → 0.8MB (-65%)
  LCP:        4.2s → 1.8s (-57%)
  Re-renders: 47 → 12 per interaction (-74%)
  Lighthouse: 45 → ~85

PRIORITY ORDER:
  1. Bundle (moment → dayjs) — Quick win, huge impact
  2. Waterfall → parallel fetch — Core perf boost
  3. Context splitting — Reduces cascading re-renders
  4. Image optimization — LCP improvement
```

---

## 🔍 Cách đánh giá

**Checklist Accept/Reject:**

- [ ] Render waterfall issues identified
- [ ] Bundle size analysis với specific packages
- [ ] Re-render issues with React.memo/useMemo solutions
- [ ] Caching strategy recommended
- [ ] Impact estimates (before/after)
- [ ] Priority order for fixes
- [ ] Framework-specific optimizations (Next.js: ISR, Streaming...)

**Red flags (cần Reject):**
- ⚠️ Generic advice ("use memo") without specific component
- ⚠️ Không có impact estimates
- ⚠️ Thiếu bundle analysis
- ⚠️ Recommend premature optimization (memo everything)

---

## ⚠️ Common Failures

| Lỗi thường gặp | Cách phòng tránh |
|----------------|------------------|
| memo() everywhere | Chỉ memo khi có measurable improvement |
| Huge context provider | Split by update frequency |
| Import entire libraries | Tree-shake, named imports |
| No Suspense boundaries | Wrap data-fetching components |
| Client-side everything | Server Components khi có thể (Next.js) |

---

## 💡 Tips

1. **Measure first** — React DevTools Profiler trước optimize
2. **Server Components** — Default trong Next.js App Router
3. **React Query > useEffect** — Built-in caching, dedup, retry
4. **Dynamic imports** — `React.lazy()` cho heavy components
5. **Bundle analyzer** — `@next/bundle-analyzer` để visualize

### Quick Wins Cheat Sheet:
```
1. moment → dayjs/date-fns         → -300KB
2. lodash → lodash-es (tree-shake) → -70KB
3. Full icon import → individual   → -200KB
4. No next/image → next/image      → LCP -50%
5. No Suspense → Suspense          → FCP -30%
```

---

## 📊 Ví dụ thực tế

### Input:
```
Framework: Next.js 15 App Router
Symptoms: Dashboard takes 5s to load, UI freezes on filter changes
Bundle: 2.1MB gzipped
Lighthouse Performance: 38
Key pages: /dashboard, /products
```

### Output tóm tắt:
```
Root cause: 4 sequential API calls + moment.js + no memo
Fix 1: Parallel fetch with Suspense → LCP -2s
Fix 2: dayjs instead of moment → Bundle -300KB
Fix 3: memo ProductCard (renders 200 items) → Filter interaction smooth
Estimated improvement: Lighthouse 38 → 78
```

### Đánh giá: ✅ ACCEPT

---

## 🔗 Related Skills

- [CSS Animation & Performance](./09_css_animation_performance.skill.md)
- [Dashboard](./03_dashboard.skill.md)

---

*CVF Skill Library v1.5.2 | Web Development Domain | Adapted from UI UX Pro Max (MIT)*
