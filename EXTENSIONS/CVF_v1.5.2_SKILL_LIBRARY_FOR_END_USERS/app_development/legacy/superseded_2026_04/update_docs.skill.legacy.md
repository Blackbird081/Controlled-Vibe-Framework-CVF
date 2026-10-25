# Update Docs

> **Domain:** App Development  
> **Difficulty:** ⭐⭐ Medium — [Xem criteria](../DIFFICULTY_GUIDE.md)  
> **CVF Version:** v1.5.2  
> **Skill Version:** 1.0.0  
> **Last Updated:** 2026-02-07

---

## 📌 Prerequisites

Không yêu cầu bắt buộc. Nên chuẩn bị bối cảnh ngắn gọn về dự án để AI hiểu đúng phạm vi.

---

## 🎯 Mục đích

> This skill should be used when the user asks to "update documentation for my changes", "check docs for this PR", "what docs need updating", "sync docs with code", "scaffold docs for this feature", "document this feature", "review docs completeness", "add docs for this change", "what documentation is affected", "docs impact", or mentions "docs/", "docs/01-app", "docs/02-pages", "MDX", "documentation update", "API reference", ".mdx files". Provides guided workflow for updating Next.js documentation based on code changes.

**Khi nào dùng skill này:**

- Cần Update Docs với tiêu chí rõ ràng
- Muốn chuẩn hóa quy trình trước khi thực thi
- Muốn đầu ra có cấu trúc, dễ review

**Không phù hợp khi:**

- Thiếu thông tin đầu vào tối thiểu
- Mục tiêu đang mơ hồ, chưa thống nhất

---

## 🛡️ Governance Summary (CVF Autonomous)

| Field | Value |
|-------|-------|
| Risk Level | R1 |
| Allowed Roles | User, Reviewer |
| Allowed Phases | Discovery, Design, Build |
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

- UAT Record: [update_docs](../../../governance/skill-library/uat/results/UAT-update_docs.md)
- UAT Objective: Skill phải đạt chuẩn output theo CVF + không vượt quyền

---

## 📋 Form Input

| Field | Mô tả | Bắt buộc | Ví dụ |
|-------|-------|:--------:|-------|
| **Objective** | Mục tiêu chính | ✅ | "Update Docs cho sản phẩm SaaS nhỏ" |
| **Context** | Bối cảnh dự án | ✅ | "Team 3 người, deadline 2 tuần" |
| **Constraints** | Ràng buộc kỹ thuật | ✅ | "Chỉ dùng stack hiện có" |
| **Input Data** | Dữ liệu liên quan | ❌ | "Repo hiện tại, tài liệu liên quan" |
| **Output Format** | Định dạng mong muốn | ❌ | "Checklist + đề xuất" |

---

## ✅ Expected Output

**Kết quả bạn sẽ nhận được:**

```markdown
# Update Docs Output

## Summary
- Goal: [Objective]
- Context: [Context]
- Constraints: [Constraints]

## Key Findings
1. [Finding 1]
2. [Finding 2]
3. [Finding 3]

## Recommendations
- [Recommendation 1]
- [Recommendation 2]

## Next Steps
- [Action 1]
- [Action 2]
```

---

## 🔍 Cách đánh giá

**Checklist Accept/Reject:**

- [ ] Mục tiêu rõ ràng, bám sát bối cảnh
- [ ] Đầu ra có cấu trúc, dễ hiểu
- [ ] Có khuyến nghị cụ thể, hành động được
- [ ] Không vượt quá phạm vi yêu cầu

**Red flags (cần Reject):**

- ⚠️ Output chung chung, không actionable
- ⚠️ Bỏ qua constraints hoặc context
- ⚠️ Tự ý mở rộng scope

---

## ⚠️ Common Failures

| Lỗi thường gặp | Cách phòng tránh |
|----------------|------------------|
| Thiếu context | Yêu cầu input tối thiểu trước khi xử lý |
| Output quá dài | Tóm tắt trước, chi tiết sau |
| Không có action | Bắt buộc đề xuất bước tiếp theo |

---

## 💡 Tips

- Ưu tiên bối cảnh ngắn, rõ, có ràng buộc
- Đưa ra 2-3 khuyến nghị khả thi nhất
- Nếu thiếu dữ liệu, hỏi lại trước khi trả lời
- Nguồn tham khảo: <https://github.com/vercel/next.js/tree/canary/.claude/skills/update-docs>

---

## 📊 Ví dụ thực tế

**Input mẫu:**

```text
Objective: Update Docs cho ứng dụng quản lý công việc
Context: Startup 5 người, cần go-live 3 tuần
Constraints: Không đổi stack, ưu tiên tốc độ triển khai
Output Format: Checklist + đề xuất
```

**Output mẫu:**

```markdown
# Update Docs Output

## Summary
- Goal: Update Docs cho ứng dụng quản lý công việc
- Context: Startup 5 người, go-live 3 tuần
- Constraints: Giữ nguyên stack, ưu tiên tốc độ

## Key Findings
1. Quy trình hiện thiếu bước review rủi ro
2. Chưa có tiêu chí đo lường thành công
3. Thiếu checklist QA tối thiểu

## Recommendations
- Chuẩn hóa checklist triển khai
- Xác định KPI trước khi build

## Next Steps
- Thống nhất scope MVP
- Tạo checklist review lần 1
```

---

## 🔗 Related Skills

- [App Requirements Spec](./01_app_requirements_spec.skill.md)
- [Tech Stack Selection](./02_tech_stack_selection.skill.md)

---

## 🔗 Next Step

Áp dụng output vào kế hoạch thực thi hoặc chuyển sang skill tiếp theo trong domain.

---

## 📜 Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2026-02-07 | Initial CVF skill (imported from SkillsMP) |
