# Business Plan

> **Domain:** Business Analysis  
> **Difficulty:** ⭐ Easy — [Xem criteria](../DIFFICULTY_GUIDE.md)  
> **CVF Version:** v1.5.2  
> **Skill Version:** 1.0.0  
> **Last Updated:** 2026-02-07

---

## 📌 Prerequisites

Không yêu cầu bắt buộc. Nên chuẩn bị bối cảnh ngắn gọn về dự án để AI hiểu đúng phạm vi.

---

## 🎯 Mục đích

> Write, structure, and update a business plan for a solopreneur. Use when creating a plan from scratch, updating an existing plan after a pivot or new phase, or preparing a plan to share with investors, partners, or even just to clarify your own strategy. Covers executive summary, market analysis, competitive positioning, revenue model, operations plan, financial projections, and risk assessment — all adapted for a one-person business. Trigger on "write a business plan", "business plan", "create my plan", "business plan template", "update my business plan", "plan for my business", "investor pitch plan".

**Khi nào dùng skill này:**

- Cần Business Plan với tiêu chí rõ ràng
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
| Allowed Phases | Discovery |
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

- Template: [AGENT_AI_UAT_CVF_TEMPLATE](../../../governance/skill-library/uat/AGENT_AI_UAT_CVF_TEMPLATE.md)
- UAT Record: [business_plan](../../../governance/skill-library/uat/results/UAT-business_plan.md)
- UAT Objective: Skill phải đạt chuẩn output theo CVF + không vượt quyền

---

## 📋 Form Input

| Field | Mô tả | Bắt buộc | Ví dụ |
|-------|-------|:--------:|-------|
| **Objective** | Mục tiêu chính | ✅ | "Business Plan cho sản phẩm SaaS nhỏ" |
| **Context** | Bối cảnh dự án | ✅ | "Team 3 người, deadline 2 tuần" |
| **Constraints** | Ràng buộc kỹ thuật | ✅ | "Chỉ dùng stack hiện có" |
| **Input Data** | Dữ liệu liên quan | ❌ | "Repo hiện tại, tài liệu liên quan" |
| **Output Format** | Định dạng mong muốn | ❌ | "Checklist + đề xuất" |

---

## ✅ Expected Output

**Kết quả bạn sẽ nhận được:**

```markdown
# Business Plan Output

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
- Keyword focus: business analysis
- Nguồn tham khảo: <https://github.com/openclaw/skills/tree/main/skills/jk-0001/business-plan>

---

## 📊 Ví dụ thực tế

**Input mẫu:**

```text
Objective: Phân tích chiến lược mở rộng thị trường
Context: SME Việt, ngân sách 50k USD
Constraints: Dữ liệu thị trường hạn chế
Output Format: Checklist + đề xuất
```

**Output mẫu:**

```markdown
# Business Plan Output

## Summary
- Goal: Phân tích chiến lược mở rộng thị trường
- Context: SME Việt, ngân sách 50k USD
- Constraints: Dữ liệu thị trường hạn chế

## Key Findings
1. Giả định thị trường chưa được xác thực
2. Thiếu so sánh rủi ro theo kịch bản
3. Chưa có KPI đo hiệu quả triển khai

## Recommendations
- Chuẩn hóa checklist triển khai
- Xác định KPI trước khi build

## Next Steps
- Thống nhất scope MVP
- Tạo checklist review lần 1
```

---

## 🔗 Related Skills

- [Strategy Analysis](./01_strategy_analysis.skill.md)
- [Risk Assessment](./02_risk_assessment.skill.md)

---

## 🔗 Next Step

Áp dụng output vào kế hoạch thực thi hoặc chuyển sang skill tiếp theo trong domain.

---

## 📜 Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2026-02-07 | Initial CVF skill (imported from SkillsMP) |
