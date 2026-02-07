# UX Heuristic Evaluation

> **Domain:** Product & UX  
> **Difficulty:** Medium  
> **CVF Version:** v1.5.2  
> **Skill Version:** 1.0.1  
> **Last Updated:** 2026-02-07
> **Inspired by:** antigravity-awesome-skills/ux-heuristics

## 📌 Prerequisites

Không yêu cầu.

---

## 🎯 Mục đích

Đánh giá UI/UX dựa trên Nielsen's 10 Usability Heuristics và các principles khác. Nhanh chóng identify usability issues mà không cần user testing.

**Khi nào nên dùng:**
- Review UI design trước development
- Audit sản phẩm hiện có
- Trước user testing (đã fix obvious issues)
- Training UX team

---

## 📋 Form Input

| Field | Bắt buộc | Mô tả |
|-------|----------|-------|
| **Product URL/Screenshots** | ✅ | Link hoặc attach screenshots |
| **Product Type** | ✅ | Web, Mobile app, Desktop, etc. |
| **Target Users** | ✅ | Ai sẽ sử dụng sản phẩm này |
| **Key Tasks** | ✅ | 3-5 tasks chính users cần làm |
| **Known Issues** | ❌ | Vấn đề đã biết |
| **Competitor** | ❌ | So sánh với ai |

---

## ✅ Checklist - Nielsen's 10 Heuristics

### 1. Visibility of System Status
- [ ] System có show current state?
- [ ] Loading indicators có visible?
- [ ] Progress feedback cho long operations?
- [ ] Success/error messages có clear?

### 2. Match Between System and Real World
- [ ] Language có familiar với users?
- [ ] Icons có intuitive?
- [ ] Metaphors có phù hợp?
- [ ] Information order có logical (real-world)?

### 3. User Control and Freedom
- [ ] Có Undo/Redo?
- [ ] Có Cancel options?
- [ ] Easy to exit unwanted states?
- [ ] No dead ends?

### 4. Consistency and Standards
- [ ] UI patterns nhất quán?
- [ ] Terminology nhất quán?
- [ ] Follow platform conventions?
- [ ] Same actions, same locations?

### 5. Error Prevention
- [ ] Confirmation cho destructive actions?
- [ ] Input validation có helpful?
- [ ] Constraints prevent errors?
- [ ] Defaults có safe?

### 6. Recognition Rather Than Recall
- [ ] Options visible (not hidden)?
- [ ] Instructions visible when needed?
- [ ] Context help available?
- [ ] Recent/suggested items shown?

### 7. Flexibility and Efficiency
- [ ] Có shortcuts cho experts?
- [ ] Có personalization/customization?
- [ ] Frequent actions có easy access?
- [ ] Có accelerators?

### 8. Aesthetic and Minimalist Design
- [ ] No irrelevant information?
- [ ] Visual hierarchy clear?
- [ ] Whitespace used well?
- [ ] Every element serves purpose?

### 9. Help Users Recognize and Recover
- [ ] Error messages có clear?
- [ ] Có suggest solution?
- [ ] Non-technical language?
- [ ] Có recovery path?

### 10. Help and Documentation
- [ ] Help có available?
- [ ] Easy to search?
- [ ] Task-focused?
- [ ] Concise và actionable?

---

## ⚠️ Lỗi Thường Gặp

| Heuristic | Common Violation | Fix |
|-----------|-----------------|-----|
| **Visibility** | No loading state | Add spinner/progress |
| **Match** | Tech jargon | Use user's language |
| **Control** | No way back | Add back/cancel |
| **Consistency** | Different button styles | Create design system |
| **Prevention** | Delete without confirm | Add confirmation |
| **Recognition** | Hidden navigation | Make persistent nav |
| **Flexibility** | No keyboard shortcuts | Add for power users |
| **Minimalist** | Cluttered UI | Remove or hide |
| **Errors** | "Error 500" | Explain và offer help |
| **Help** | No help docs | Add contextual help |

---

## 💡 Tips & Examples

### Severity Rating Scale:
| Rating | Description | Action |
|--------|-------------|--------|
| 0 | Not a problem | N/A |
| 1 | Cosmetic only | Fix if time |
| 2 | Minor problem | Low priority |
| 3 | Major problem | High priority |
| 4 | Catastrophe | Must fix before launch |

### Evaluation Template:
```markdown
## Issue #[N]

**Heuristic:** [Which heuristic violated]
**Location:** [Where in the UI]
**Severity:** [0-4]

**Problem:**
[Description of the issue]

**Recommendation:**
[How to fix it]

**Screenshot:**
[Attach if possible]
```

### Quick Checklist for Each Screen:
```
□ Can user tell where they are?
□ Can user tell what to do?
□ Can user tell what happened?
□ Can user undo/go back?
□ Is it clear what's clickable?
```

### Heuristic Evaluation Process:
1. **Define scope:** Which screens to evaluate
2. **First pass:** Go through each heuristic
3. **Task flow:** Complete key user tasks
4. **Document issues:** Use consistent format
5. **Rate severity:** Prioritize fixes
6. **Report:** Group by heuristic or screen

---

## 📤 Expected Output từ AI

Khi paste spec này vào AI, bạn sẽ nhận được:

1. **UX Score** - Overall usability rating
2. **Heuristic Breakdown** - Score per heuristic
3. **Issue List** - Problems found
4. **Severity Rating** - Priority matrix
5. **Fix Recommendations** - How to address each
6. **Best Practices** - What they're doing right
7. **Action Plan** - Prioritized improvements

---

## 🔗 Next Step

Sau khi hoàn thành **UX Heuristic Evaluation**, tiếp tục với:
→ [User Flow Analysis](./user_flow_analysis.skill.md)

---

*CVF Skill Library v1.5.2 | Product & UX Domain*

---

## 📊 Ví dụ thực tế

### Input mẫu:
```
Màn hình: Inventory List (web)
Nhiệm vụ chính: tìm SKU + lọc theo kho
```

### Output mẫu:
```markdown
# Heuristic Review

| Heuristic | Issue | Severity |
|---|---|---|
| Visibility | Không có loading state khi filter | Medium |
| Consistency | "Kho" vs "Chi nhánh" dùng lẫn | Low |
| Error Prevention | Xóa item không có confirm | High |

## Quick Fixes
- Thêm skeleton loader
- Chuẩn hóa label "Kho"
- Confirm modal + undo 5s
```

### Đánh giá:
- ✅ Phân loại severity rõ ràng
- ✅ Có action nhanh để fix
- ✅ Mapping đúng heuristic
- **Kết quả: ACCEPT**

## 🔗 Related Skills
- [User Flow Analysis](./user_flow_analysis.skill.md)
- [Accessibility Audit (WCAG)](./accessibility_audit.skill.md)

## 📜 Version History

| Version | Date | Changes |
|---|---|---|
| 1.0.1 | 2026-02-07 | Domain refinement: examples + flow alignment |
| 1.0.0 | 2026-02-07 | Initial standardized metadata + example/related sections |

## 🔗 Next Step

Sau khi hoàn thành **UX Heuristic Evaluation**, tiếp tục với:
→ [Accessibility Audit (WCAG)](./accessibility_audit.skill.md)

---

*CVF Skill Library v1.5.2 | Product & UX Domain*
