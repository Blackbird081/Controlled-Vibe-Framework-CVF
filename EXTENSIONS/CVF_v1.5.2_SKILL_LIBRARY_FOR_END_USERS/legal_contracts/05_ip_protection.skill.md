# IP Protection

> **Domain:** Legal & Contracts  
> **Difficulty:** ⭐⭐ Medium  
> **CVF Version:** v1.5.2  
> **Skill Version:** 1.0.0  
> **Last Updated:** 2026-02-07

---

## 📌 Prerequisites

Không yêu cầu.

---

## 🎯 Mục đích

**Khi nào dùng:**

- Đánh giá IP assets của công ty
- Lập strategy bảo vệ IP
- Chuẩn bị cho M&A/investment
- Review IP risks

**Không phù hợp khi:**

- Filing patents → Cần IP attorney
- IP litigation → Cần legal team

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

- UAT Record: [05_ip_protection](../../../governance/skill-library/uat/results/UAT-05_ip_protection.md)
- UAT Objective: Skill phải đạt chuẩn output theo CVF + không vượt quyền

---

## 📋 Form Input

| Field | Mô tả | Bắt buộc | Ví dụ |
|-------|-------|:--------:|-------|
| **Company/Product** | Tên | ✅ | "TechStart SaaS" |
| **IP Assets** | Tài sản IP | ✅ | "Source code, brand, algorithms" |
| **Business model** | Cách kiếm tiền | ✅ | "SaaS subscription" |
| **Team structure** | Ai làm gì | ❌ | "5 devs, 2 designers" |

---

## ✅ Expected Output

- IP Inventory list
- Protection strategy
- Risk assessment
- Action items

---

## 🔍 Cách đánh giá

**Checklist:**

- [ ] Identify tất cả IP types
- [ ] Protection methods phù hợp
- [ ] Risks được highlight
- [ ] Action items practical

**Red flags:**

- ⚠️ Miss key IP types
- ⚠️ Wrong protection method

---

## ⚠️ Common Failures

| Lỗi thường gặp | Cách phòng tránh |
|---|---|
| Thiếu dữ liệu đầu vào quan trọng | Bổ sung đầy đủ thông tin theo Form Input |
| Kết luận chung chung | Yêu cầu nêu rõ tiêu chí và hành động cụ thể |

---

## 💡 Tips

1. **Map all IP** — Code, designs, data, processes
2. **Employment agreements** — IP assignment clauses
3. **Document creation dates** — Establishes ownership
4. **Trade secrets** — Not everything needs patent

---

## 🔗 Next Step

Sau khi hoàn thành **IP Protection**, tiếp tục với:
→ [Compliance Checklist](./04_compliance_checklist.skill.md)

---

*IP Protection Skill — CVF v1.5.2*

---

## 📊 Ví dụ thực tế

### Input mẫu

```
IP Assets: source code, logo, brand name "StockFlow", domain stockflow.vn
Team: 6 employees + 2 contractors
Open-source: dùng 12 libs (MIT/Apache)
```

### Output mẫu

```markdown
# IP Protection Plan

- Trademark: đăng ký nhãn hiệu "StockFlow"
- IP Assignment: ký agreement với contractors
- OSS Audit: kiểm tra license + attribution
- Brand: đăng ký domain .com/.vn
```

### Đánh giá

- ✅ Bao phủ trademark + code ownership
- ✅ Kiểm soát OSS license
- ✅ Hành động ưu tiên rõ
- **Kết quả: ACCEPT**

## 🔗 Related Skills

- [Compliance Checklist](./04_compliance_checklist.skill.md)
- [Contract Review](./01_contract_review.skill.md)

## 📜 Version History

| Version | Date | Changes |
|---|---|---|
| 1.0.1 | 2026-02-07 | Domain refinement: examples + flow alignment |
| 1.0.0 | 2026-02-07 | Initial standardized metadata + example/related sections |

## 🔗 Next Step: Contract Review

Sau khi hoàn thành **IP Protection**, quay lại rà soát hợp đồng:
→ [Contract Review](./01_contract_review.skill.md)

---

*CVF Skill Library v1.5.2 | Legal & Contracts Domain*

<!-- Text Encoding Exception: pre-existing localized text and symbols are retained; this repair changes only navigation or Markdown structure. -->
