# Pr Finalize

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

> Finalizes any PR for merge by verifying title/description match implementation AND performing code review for best practices. Use when asked to "finalize PR", "check PR description", "review commit message", before merging any PR, or when PR implementation changed during review. Do NOT use for extracting lessons (use learn-from-pr), writing tests (use write-tests-agent), or investigating build failures (use pr-build-status).

**Khi nào dùng skill này:**

- Cần Pr Finalize với tiêu chí rõ ràng
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

- UAT Record: [pr_finalize](../../../governance/skill-library/uat/results/UAT-pr_finalize.md)
- UAT Objective: Skill phải đạt chuẩn output theo CVF + không vượt quyền

---

## 📋 Form Input

| Field | Mô tả | Bắt buộc | Ví dụ |
|-------|-------|:--------:|-------|
| **Objective** | Mục tiêu chính | ✅ | "Pr Finalize cho sản phẩm SaaS nhỏ" |
| **Context** | Bối cảnh dự án | ✅ | "Team 3 người, deadline 2 tuần" |
| **Constraints** | Ràng buộc kỹ thuật | ✅ | "Chỉ dùng stack hiện có" |
| **Input Data** | Dữ liệu liên quan | ❌ | "Repo hiện tại, tài liệu liên quan" |
| **Output Format** | Định dạng mong muốn | ❌ | "Checklist + đề xuất" |

---

## ✅ Expected Output

**Kết quả bạn sẽ nhận được:**

```markdown
# Pr Finalize Output

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
- Nguồn tham khảo: <https://github.com/dotnet/maui/tree/main/.github/skills/pr-finalize>

---

## 📊 Ví dụ thực tế

**Input mẫu:**

```text
Objective: Pr Finalize cho ứng dụng quản lý công việc
Context: Startup 5 người, cần go-live 3 tuần
Constraints: Không đổi stack, ưu tiên tốc độ triển khai
Output Format: Checklist + đề xuất
```

**Output mẫu:**

```markdown
# Pr Finalize Output

## Summary
- Goal: Pr Finalize cho ứng dụng quản lý công việc
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
