# Error Handling UX

> **Domain:** Product & UX  
> **Difficulty:** Easy  
> **CVF Version:** v1.5.2  
> **Skill Version:** 1.0.1  
> **Last Updated:** 2026-02-07
> **Inspired by:** antigravity-awesome-skills/error-handling

## 📌 Prerequisites

Không yêu cầu.

---

## 🎯 Mục đích

Đánh giá và cải thiện cách sản phẩm handle errors, exceptions, và edge cases. Good error UX giúp users recover và maintain trust.

**Khi nào nên dùng:**

- High error rates trong analytics
- Negative feedback về confusing errors
- Before launch quality check
- Empty states không clear

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

- UAT Record: [error_handling_ux](../../../governance/skill-library/uat/results/UAT-error_handling_ux.md)
- UAT Objective: Skill phải đạt chuẩn output theo CVF + không vượt quyền

---

## 📋 Form Input

| Field | Bắt buộc | Mô tả |
|-------|----------|-------|
| **Product/Feature** | ✅ | Mô tả sản phẩm/tính năng |
| **Error Types** | ✅ | Validation, System, Network, etc. |
| **Current Error Messages** | ✅ | Paste actual messages |
| **Error Frequency** | ❌ | How often errors occur |
| **User Feedback** | ❌ | Complaints về errors |

---

## ✅ Checklist Đánh giá

### Message Quality

- [ ] Có nói LÝ DO lỗi xảy ra?
- [ ] Dùng ngôn ngữ human-friendly (không technical)?
- [ ] Có cung cấp GIẢI PHÁP?
- [ ] Có specific (không generic "Something went wrong")?
- [ ] Tone có phù hợp (không blame user)?

### Visual Design

- [ ] Error có visible và noticeable?
- [ ] Có sử dụng color coding (red for errors)?
- [ ] Có icon hỗ trợ nhận diện?
- [ ] Không intrusive quá (blocking entire screen)?
- [ ] Positioned gần related element?

### Recovery Path

- [ ] User có clear next action?
- [ ] Có "Try again" option?
- [ ] Data đã nhập có được preserve?
- [ ] Có contact support option nếu cần?
- [ ] Có skip/bypass option nếu non-critical?

### Prevention

- [ ] Có inline validation (real-time)?
- [ ] Có input hints/examples?
- [ ] Constraints prevent invalid input?
- [ ] Confirmation cho destructive actions?

### Empty States

- [ ] Empty state có friendly message?
- [ ] Có guide user what to do?
- [ ] Có illustration/visual?
- [ ] Có CTA để populate data?

---

## ⚠️ Lỗi Thường Gặp

| Lỗi | Impact | Fix |
|-----|--------|-----|
| **"Error 500"** | User confused | Human-readable message |
| **Blame user** | Trust damage | Positive, helpful tone |
| **No solution** | User stuck | Include next steps |
| **Hidden errors** | User lost | Visible, clear placement |
| **Data lost** | Frustration | Preserve form data |
| **Generic message** | No action | Be specific |
| **Technical jargon** | Confusion | Plain language |

---

## 💡 Tips & Examples

### Error Message Formula

```
What happened + Why it happened + How to fix it

❌ "Error 404"
✅ "Page not found. This page may have moved or been deleted.
   Try searching for what you need, or go back to homepage."

❌ "Invalid input"
✅ "Please enter a valid email address (example: name@company.com)"

❌ "Request failed"
✅ "We couldn't connect to the server. Check your internet 
   connection and try again."
```

### Tone Guidelines

```
❌ "You entered an invalid password"
✅ "That password doesn't match our records"

❌ "Error: required field empty"
✅ "Please fill in your email address to continue"

❌ "Failed to load"
✅ "Taking longer than expected... Retrying"
```

### Error Types & Handling

| Type | Example | Best Practice |
|------|---------|---------------|
| **Validation** | Invalid email | Inline, real-time feedback |
| **Authentication** | Wrong password | Gentle, offer recovery |
| **Permission** | No access | Explain why, offer action |
| **Network** | No connection | Show cached/retry option |
| **System** | Server error | Apologize, auto-retry |
| **Not Found** | 404 | Helpful navigation options |

### Empty State Best Practices

```markdown
## Elements of a Good Empty State:
1. 🖼️ Illustration (friendly, relevant)
2. 📝 Headline explaining state
3. 💬 Brief description  
4. 🔘 Primary CTA to fix it

Example (Empty inbox):
[Illustration of empty mailbox]
"No messages yet"
"When you receive messages, they'll appear here."
[Send a message] button
```

### Error Prevention

```
Input Masks: Phone number (xxx) xxx-xxxx
Character counters: 45/280 characters
Password requirements: ✅ 8+ chars ❌ special char
Confirmation dialogs: "Are you sure?"
Undo options: "Message deleted. Undo"
```

---

## 📤 Expected Output từ AI

Khi paste spec này vào AI, bạn sẽ nhận được:

1. **Error UX Score** - Overall rating
2. **Message Rewrites** - Improved versions
3. **Gap Analysis** - Missing elements
4. **Recovery Flow** - Suggested paths
5. **Prevention Recommendations** - Proactive measures
6. **Empty State Suggestions** - Designs
7. **Testing Checklist** - Edge cases to cover

---

## 🔗 Next Step

Sau khi hoàn thành **Error Handling UX**, tiếp tục với:
→ [User Persona Development](./user_persona_development.skill.md)

---

*CVF Skill Library v1.5.2 | Product & UX Domain*

---

## 📊 Ví dụ thực tế

### Input mẫu

```
Error cases: duplicate SKU, sync conflict (offline), upload timeout
User type: Warehouse staff
```

### Output mẫu

```markdown
# Error UX Spec

## Duplicate SKU
Message: "SKU đã tồn tại. Bạn muốn cập nhật hay tạo SKU mới?"
Actions: [Update] [Create new]

## Sync Conflict
Message: "Có thay đổi mới trên server. Chọn bản bạn muốn giữ."
Actions: [Giữ bản của tôi] [Dùng bản server]

## Upload Timeout
Message: "Kết nối yếu. Thử lại trong 30s?"
Actions: [Retry] [Save draft]
```

### Đánh giá

- ✅ Rõ nguyên nhân + hướng xử lý
- ✅ Có hành động phục hồi
- ✅ Ngôn ngữ thân thiện
- **Kết quả: ACCEPT**

## 🔗 Related Skills

- [Accessibility Audit (WCAG)](./accessibility_audit.skill.md)
- [Onboarding Experience Review](./onboarding_experience_review.skill.md)

## 📜 Version History

| Version | Date | Changes |
|---|---|---|
| 1.0.1 | 2026-02-07 | Domain refinement: examples + flow alignment |
| 1.0.0 | 2026-02-07 | Initial standardized metadata + example/related sections |

## 🔗 Next Step: Onboarding Experience Review

Sau khi hoàn thành **Error Handling UX**, tiếp tục với:
→ [Onboarding Experience Review](./onboarding_experience_review.skill.md)

---

*CVF Skill Library v1.5.2 | Product & UX Domain*

<!-- Text Encoding Exception: pre-existing localized text and symbols are retained; this repair changes only navigation or Markdown structure. -->
