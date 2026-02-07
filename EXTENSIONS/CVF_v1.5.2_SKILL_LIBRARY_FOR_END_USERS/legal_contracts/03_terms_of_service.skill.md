# Terms of Service

> **Domain:** Legal & Contracts  
> **Difficulty:** ⭐⭐⭐ Advanced  
> **CVF Version:** v1.5.2  
> **Skill Version:** 1.0.0  
> **Last Updated:** 2026-02-06

---

## 📌 Prerequisites

> Không yêu cầu (nhưng nên hiểu về sản phẩm và target market)

---

## 🎯 Mục đích

**Khi nào dùng skill này:**
- Launch sản phẩm/website mới
- Cập nhật ToS hiện có
- Mở rộng sang thị trường mới
- Thêm tính năng mới cần legal coverage

**Không phù hợp khi:**
- Regulated industries (finance, healthcare) → Cần specialist
- Multi-jurisdiction complex → Cần legal team
- Already have legal disputes → Cần luật sư

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

- UAT Record: [03_terms_of_service](../../../governance/skill-library/uat/results/UAT-03_terms_of_service.md)
- UAT Objective: Skill phải đạt chuẩn output theo CVF + không vượt quyền

---
## 📋 Form Input

| Field | Mô tả | Bắt buộc | Ví dụ |
|-------|-------|:--------:|-------|
| **Company name** | Tên công ty | ✅ | "TechStart Vietnam" |
| **Product/Service** | Sản phẩm là gì | ✅ | "SaaS project management tool" |
| **Target users** | Đối tượng sử dụng | ✅ | "Business users, B2B" |
| **Key features** | Tính năng chính | ✅ | "Task management, file storage, team chat" |
| **Pricing model** | Cách tính phí | ✅ | "Monthly subscription, tiered plans" |
| **Data handling** | Xử lý dữ liệu như nào | ✅ | "Store on cloud, backup daily" |
| **Jurisdictions** | Thị trường phục vụ | ❌ | "Vietnam, Singapore, Thailand" |

---

## ✅ Expected Output

**Kết quả bạn sẽ nhận được:**
- ToS draft đầy đủ
- Plain language explanations
- Customized cho product type

**Cấu trúc output:**
```
TERMS OF SERVICE

1. Introduction & Acceptance
2. Service Description
3. Account Terms
4. User Responsibilities
5. Payment Terms (if applicable)
6. Intellectual Property
7. Privacy & Data
8. Disclaimers & Limitations
9. Termination
10. Dispute Resolution
11. Changes to Terms
12. Contact Information
```

---

## 🔍 Cách đánh giá

**Checklist Accept/Reject:**

- [ ] Cover tất cả sections cần thiết
- [ ] Specific cho product type
- [ ] Plain language, user-friendly
- [ ] Liability limitations reasonable
- [ ] Privacy reference included
- [ ] Dispute resolution clear

**Red flags (cần Reject):**
- ⚠️ Copy-paste từ product khác không fit
- ⚠️ Missing critical sections
- ⚠️ Quá aggressive với users
- ⚠️ Conflict với local laws

---

## ⚠️ Common Failures

| Lỗi thường gặp | Cách phòng tránh |
|----------------|------------------|
| Generic, không fit product | Customize theo features |
| Too legal, users không hiểu | Plain language summaries |
| Missing jurisdiction | Specify governing law |
| Outdated for new features | Review khi add features |

---

## 💡 Tips

1. **Keep it readable** — Users should understand
2. **Highlight key points** — Summary at top
3. **Version and date** — Track changes
4. **Link to Privacy Policy** — Separate document
5. **Get lawyer review** — Before launch

---

## 📊 Ví dụ thực tế

### Input mẫu:
```
Product: StockFlow SaaS
Pricing: monthly + annual
Trial: 14 ngày
Data retention: 12 tháng sau hủy
```

### Output mẫu:
```markdown
# ToS Highlights

- Billing: auto-renew, invoice + VAT
- Termination: user có thể hủy bất kỳ lúc nào
- Data retention: 12 tháng, export trong 30 ngày
- Liability: cap = 12 tháng phí
- Acceptable use: no scraping, no abuse
```

### Đánh giá:
- ✅ Điều khoản phù hợp SaaS
- ✅ Retention rõ ràng
- ✅ Liability hợp lý
- **Kết quả: ACCEPT**

## 🔗 Related Skills
- [NDA Template](./02_nda_template.skill.md)
- [Compliance Checklist](./04_compliance_checklist.skill.md)

## 📜 Version History

| Version | Date | Changes |
|---|---|---|
| 1.0.1 | 2026-02-07 | Domain refinement: examples + flow alignment |
| 1.0.0 | 2026-02-07 | Initial standardized metadata + example/related sections |

## 🔗 Next Step

Sau khi hoàn thành **Terms of Service**, tiếp tục với:
→ [Compliance Checklist](./04_compliance_checklist.skill.md)

---

*CVF Skill Library v1.5.2 | Legal & Contracts Domain*