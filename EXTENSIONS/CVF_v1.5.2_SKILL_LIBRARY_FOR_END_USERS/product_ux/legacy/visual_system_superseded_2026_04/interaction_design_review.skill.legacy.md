# Interaction Design Review

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

Đánh giá các tương tác UI/UX: touch targets, cursor states, hover feedback, loading states, focus rings, transition timing. Đảm bảo mọi interaction đạt chuẩn chuyên nghiệp.

**Khi nào nên dùng:**
- Review UI trước khi launch
- Kiểm tra mobile touch experience
- Audit interaction patterns sau redesign
- Nhận feedback "UI không responsive/mượt"

**Không phù hợp khi:**
- Chỉ cần review content/copy
- Backend-only review

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

- UAT Record: [interaction_design_review](../../../governance/skill-library/uat/results/UAT-interaction_design_review.md)
- UAT Objective: Skill phải đạt chuẩn output theo CVF + không vượt quyền

---

## 📋 Form Input

| Field | Bắt buộc | Mô tả | Ví dụ |
|-------|----------|-------|-------|
| **URL/Code** | ✅ | Link hoặc code cần review | "https://myapp.com" |
| **Platform** | ✅ | Web, iOS, Android | "Web responsive" |
| **Key flows** | ✅ | Flows quan trọng cần check | "Login, Checkout, Search" |
| **Known issues** | ❌ | Vấn đề đã biết | "Buttons khó nhấn trên mobile" |
| **Target devices** | ❌ | Thiết bị mục tiêu | "iPhone 14, Galaxy S24" |

---

## ✅ Expected Output

**Kết quả bạn sẽ nhận được:**

### Interaction Audit Report

```
INTERACTION AUDIT: [Project Name]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🔴 CRITICAL Issues:
1. Touch targets < 44x44px on 3 buttons
   → Fix: min-height: 44px, min-width: 44px

🟡 HIGH Issues:
2. No cursor-pointer on 5 clickable elements
   → Fix: cursor: pointer on all interactive
3. Focus ring invisible on dark background
   → Fix: outline: 2px solid currentColor, offset: 2px

🟢 MEDIUM Issues:
4. Transition duration inconsistent (100ms-500ms)
   → Fix: Standardize 150-300ms
5. Loading state missing on form submit
   → Fix: Add spinner + disabled state

📊 SCORES:
  Touch & Mobile:  6/10
  Cursor & States:  7/10
  Focus & A11y:     5/10
  Animation:        8/10
  Loading States:   4/10
  Overall:          6/10
```

---

## 🔍 Cách đánh giá

**Checklist Accept/Reject:**

- [ ] Touch targets ≥ 44x44px (mobile)
- [ ] `cursor-pointer` trên tất cả interactive elements
- [ ] Hover states cung cấp visual feedback
- [ ] Focus rings visible cho keyboard navigation
- [ ] Transitions smooth (150-300ms)
- [ ] Loading states cho async actions
- [ ] Error states rõ ràng
- [ ] `prefers-reduced-motion` respected

**Red flags (cần Reject):**
- ⚠️ Touch targets < 30px (unusable)
- ⚠️ Không có focus indicators
- ⚠️ Animation > 500ms (sluggish feel)
- ⚠️ No loading state trên form submissions

---

## ⚠️ Common Failures

| Lỗi thường gặp | Cách phòng tránh |
|----------------|------------------|
| Touch targets quá nhỏ | Min 44x44px, padding if needed |
| Thiếu cursor-pointer | Global rule: interactive → pointer |
| Focus styles bị remove | Dùng `:focus-visible` thay vì remove `:focus` |
| Hover gây layout shift | Dùng transform/opacity, không width/margin |
| Flash of unstyled content | Skeleton loading pattern |

---

## 💡 Tips

1. **44px rule** — Apple & Google đều recommend 44px min touch
2. **150-300ms** — Sweet spot cho transitions
3. **`:focus-visible`** — Chỉ show focus ring khi keyboard, ẩn khi click
4. **Skeleton > Spinner** — User perceive loading nhanh hơn
5. **Micro-interactions** — Subtle feedback = professional feel

---

## 📊 Ví dụ thực tế

### Input:
```
URL: https://myshop.com
Platform: Web responsive (mobile-first)
Key flows: Product search, Add to cart, Checkout
Known issues: Customers complain about checkout on phone
```

### Output tóm tắt:
```
🔴 CRITICAL: Checkout button 32x32px → cần 44x44px
🟡 HIGH: 12 elements thiếu cursor-pointer
🟡 HIGH: Focus ring bị outline:none
🟢 MEDIUM: Transition 500ms trên dropdown → giảm 200ms
Overall: 5/10 → Target: 8/10
```

### Đánh giá: ✅ ACCEPT — Actionable với prioritized fixes

---

## 🔗 Related Skills

- [Accessibility Audit](./accessibility_audit.skill.md)
- [Dark/Light Mode Audit](./dark_light_mode_audit.skill.md)
- [UX Heuristic Evaluation](./ux_heuristic_evaluation.skill.md)

---

*CVF Skill Library v1.5.2 | Product & UX Domain | Adapted from UI UX Pro Max (MIT)*
