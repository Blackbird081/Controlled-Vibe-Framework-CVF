# Contract Review

> **Domain:** Legal & Contracts  
> **Difficulty:** ⭐⭐ Medium  
> **CVF Version:** v1.5.2  
> **Skill Version:** 1.0.0  
> **Last Updated:** 2026-02-06

---

## 📌 Prerequisites

> Không yêu cầu

---

## 🎯 Mục đích

**Khi nào dùng skill này:**

- Review hợp đồng từ đối tác/vendor
- Identify key terms và risks
- Chuẩn bị negotiation points
- So sánh với standard terms

**Không phù hợp khi:**

- Cần legal advice chính thức → Hỏi luật sư
- Draft hợp đồng mới → Dùng templates khác
- Disputes/litigation → Cần legal team

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

- UAT Record: [01_contract_review](../../../governance/skill-library/uat/results/UAT-01_contract_review.md)
- UAT Objective: Skill phải đạt chuẩn output theo CVF + không vượt quyền

---

## 📋 Form Input

| Field | Mô tả | Bắt buộc | Ví dụ |
|-------|-------|:--------:|-------|
| **Loại hợp đồng** | Type of contract | ✅ | "Service Agreement" |
| **Nội dung hợp đồng** | Full text hoặc key sections | ✅ | "[Paste contract text]" |
| **Vai trò của bạn** | Bên nào trong hợp đồng | ✅ | "Bên mua dịch vụ" |
| **Mục đích chính** | Bạn muốn focus vào gì | ✅ | "Identify risks, negotiation points" |
| **Industry context** | Ngành nghề | ❌ | "SaaS, B2B" |

---

## ✅ Expected Output

**Kết quả bạn sẽ nhận được:**

- Summary of key terms
- Risk analysis
- Negotiation points
- Recommended modifications

**Cấu trúc output:**

```
CONTRACT REVIEW

1. Contract Summary
2. Key Terms Analysis
   - Payment terms
   - Duration/Termination
   - Liability/Indemnification
   - IP/Confidentiality
3. Risk Assessment (High/Medium/Low)
4. Recommended Changes
5. Questions for Counterparty
```

---

## 🔍 Cách đánh giá

**Checklist Accept/Reject:**

- [ ] Identify đúng các key terms
- [ ] Risk assessment hợp lý
- [ ] Recommendations cụ thể
- [ ] Xét đến context của bạn (buyer/seller)
- [ ] Highlight clauses bất thường
- [ ] Language dễ hiểu (không quá legal jargon)

**Red flags (cần Reject):**

- ⚠️ Miss major risk clauses
- ⚠️ Provide legal advice definitively
- ⚠️ Không xét đến vai trò của bạn
- ⚠️ Quá general, không specific

---

## ⚠️ Common Failures

| Lỗi thường gặp | Cách phòng tránh |
|----------------|------------------|
| Miss hidden clauses | Review toàn bộ contract |
| Overestimate/underestimate risks | Get second opinion |
| Focus sai priorities | Clarify mục đích upfront |
| Too legalistic | Request plain language |

---

## 💡 Tips

1. **Read everything** — Hidden terms thường ở appendix
2. **Compare với standard** — Industry benchmarks
3. **Focus on exit** — Termination clauses quan trọng
4. **Ask "what if"** — Failure scenarios
5. **Always get lawyer review** — AI là starting point

---

## 📊 Ví dụ thực tế

### Input mẫu

```
Loại hợp đồng: SaaS B2B
Term: 12 tháng, auto-renew
SLA: 99.5%
Liability cap: không nêu
Governing law: Singapore
```

### Output mẫu

```markdown
# Contract Review Summary

## Red Flags
- Không có liability cap
- Termination chỉ cho bên cung cấp
- SLA có nhưng không có service credit

## Recommendations
1. Thêm liability cap = 12 tháng phí
2. Mutual termination với notice 30 ngày
3. Add service credit 5-10% nếu SLA fail

## Questions
- Dữ liệu khách hàng lưu ở đâu?
- Có quyền audit bảo mật không?
```

### Đánh giá

- ✅ Nhận diện điều khoản rủi ro
- ✅ Khuyến nghị cụ thể để đàm phán
- ✅ Có câu hỏi làm rõ
- **Kết quả: ACCEPT**

## 🔗 Related Skills

- [NDA Template](./02_nda_template.skill.md)
- [Terms of Service](./03_terms_of_service.skill.md)

## 📜 Version History

| Version | Date | Changes |
|---|---|---|
| 1.0.1 | 2026-02-07 | Domain refinement: examples + flow alignment |
| 1.0.0 | 2026-02-07 | Initial standardized metadata + example/related sections |

## 🔗 Next Step

Sau khi hoàn thành **Contract Review**, tiếp tục với:
→ [NDA Template](./02_nda_template.skill.md)

---

*CVF Skill Library v1.5.2 | Legal & Contracts Domain*
