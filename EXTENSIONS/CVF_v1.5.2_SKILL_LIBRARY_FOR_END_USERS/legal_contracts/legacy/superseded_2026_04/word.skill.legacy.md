# Word

> **Domain:** Legal Contracts  
> **Difficulty:** ⭐⭐⭐ Advanced — [Xem criteria](../DIFFICULTY_GUIDE.md)  
> **CVF Version:** v1.5.2  
> **Skill Version:** 1.0.0  
> **Last Updated:** 2026-02-07

---

## 📌 Prerequisites

Không yêu cầu bắt buộc. Nên chuẩn bị bối cảnh ngắn gọn về dự án để AI hiểu đúng phạm vi.

---

## 🎯 Mục đích

> Handle Word document (.docx) creation, editing, and analysis with high-fidelity visual review. Use for professional reports, legal documents, and tracked changes. Use proactively when quality and precise formatting are critical.  Examples: - user: "Create a professional report in Word" -> use python-docx with render loops - user: "Draft a legal contract with redlines" -> use ooxml redlining workflow - user: "Extract text from this DOCX while preserving structure" -> use pandoc markdown conversion

**Khi nào dùng skill này:**
- Cần Word với tiêu chí rõ ràng
- Muốn chuẩn hóa quy trình trước khi thực thi
- Muốn đầu ra có cấu trúc, dễ review

**Không phù hợp khi:**
- Thiếu thông tin đầu vào tối thiểu
- Mục tiêu đang mơ hồ, chưa thống nhất

---

## 🛡️ Governance Summary (CVF Autonomous)

| Field | Value |
|-------|-------|
| Risk Level | R2 |
| Allowed Roles | User, Reviewer |
| Allowed Phases | Discovery, Review |
| Authority Scope | Tactical |
| Autonomy | Human confirmation required |
| Audit Hooks | Input completeness, Output structure, Scope guard |

---

## ⛔ Execution Constraints

- Không thực thi ngoài phạm vi được khai báo
- Tự động dừng nếu thiếu input bắt buộc
- Với rủi ro R2: human confirmation required
- Không ghi/đổi dữ liệu hệ thống nếu chưa được xác nhận

---

## ✅ Validation Hooks

- Check đủ input bắt buộc trước khi bắt đầu
- Check output đúng format đã định nghĩa
- Check không vượt scope và không tạo hành động ngoài yêu cầu
- Check output có bước tiếp theo cụ thể

---

## 🧪 UAT Binding

- Template: [AGENT_AI_UAT_CVF_TEMPLATE](../../../governance/skill-library/uat/AGENT_AI_UAT_CVF_TEMPLATE.md)
- UAT Record: [word](../../../governance/skill-library/uat/results/UAT-word.md)
- UAT Objective: Skill phải đạt chuẩn output theo CVF + không vượt quyền

---

## 📋 Form Input

| Field | Mô tả | Bắt buộc | Ví dụ |
|-------|-------|:--------:|-------|
| **Objective** | Mục tiêu chính | ✅ | "Word cho sản phẩm SaaS nhỏ" |
| **Context** | Bối cảnh dự án | ✅ | "Team 3 người, deadline 2 tuần" |
| **Constraints** | Ràng buộc kỹ thuật | ✅ | "Chỉ dùng stack hiện có" |
| **Input Data** | Dữ liệu liên quan | ❌ | "Repo hiện tại, tài liệu liên quan" |
| **Output Format** | Định dạng mong muốn | ❌ | "Checklist + đề xuất" |

---

## ✅ Expected Output

**Kết quả bạn sẽ nhận được:**

```markdown
# Word Output

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
- Keyword focus: legal contract
- Nguồn tham khảo: https://github.com/IgorWarzocha/Opencode-Workflows/tree/master/cowork/.opencode/skill/word

---

## 📊 Ví dụ thực tế

**Input mẫu:**
```text
Objective: Review NDA cho hợp tác đối tác
Context: Đối tác quốc tế, thời hạn 12 tháng
Constraints: Không thay đổi điều khoản core
Output Format: Checklist + đề xuất
```

**Output mẫu:**
```markdown
# Word Output

## Summary
- Goal: Review NDA cho hợp tác đối tác
- Context: Đối tác quốc tế, thời hạn 12 tháng
- Constraints: Không thay đổi điều khoản core

## Key Findings
1. Phạm vi bảo mật chưa rõ ràng
2. Thiếu điều khoản xử lý vi phạm
3. Không nêu rõ quyền sở hữu IP

## Recommendations
- Chuẩn hóa checklist triển khai
- Xác định KPI trước khi build

## Next Steps
- Thống nhất scope MVP
- Tạo checklist review lần 1
```

---

## 🔗 Related Skills

- [Contract Review](./01_contract_review.skill.md)
- [NDA Template](./02_nda_template.skill.md)

---

## 🔗 Next Step

Áp dụng output vào kế hoạch thực thi hoặc chuyển sang skill tiếp theo trong domain.

---

## 📜 Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2026-02-07 | Initial CVF skill (imported from SkillsMP) |