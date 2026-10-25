# NDA Template

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

- Chia sẻ thông tin nhạy cảm với đối tác
- Trước khi pitching cho investors
- Thảo luận partnership hoặc M&A
- Thuê contractors/freelancers

**Không phù hợp khi:**

- Cần NDA cực kỳ chặt chẽ → Luật sư draft
- Nhiều bên (3+) → Cần format khác
- Cross-border phức tạp → Cần specialist

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

- UAT Record: [02_nda_template](../../../governance/skill-library/uat/results/UAT-02_nda_template.md)
- UAT Objective: Skill phải đạt chuẩn output theo CVF + không vượt quyền

---

## 📋 Form Input

| Field | Mô tả | Bắt buộc | Ví dụ |
|-------|-------|:--------:|-------|
| **Disclosing Party** | Bên tiết lộ thông tin | ✅ | "ABC Company" |
| **Receiving Party** | Bên nhận thông tin | ✅ | "XYZ Consulting" |
| **Purpose** | Mục đích chia sẻ | ✅ | "Đánh giá partnership potential" |
| **Type** | One-way hay Mutual | ✅ | "Mutual (2 chiều)" |
| **Duration** | Thời hạn bảo mật | ✅ | "3 năm" |
| **Jurisdiction** | Luật áp dụng | ❌ | "Việt Nam" |
| **Special terms** | Điều khoản đặc biệt | ❌ | "Không chia sẻ với subcontractors" |

---

## ✅ Expected Output

**Kết quả bạn sẽ nhận được:**

- NDA draft hoàn chỉnh
- Key clauses explained
- Customized theo input

**Cấu trúc output:**

```
NDA DOCUMENT

1. Parties
2. Definition of Confidential Information
3. Obligations of Receiving Party
4. Exclusions
5. Term and Termination
6. Return of Information
7. Remedies
8. General Provisions
9. Signatures
```

---

## 🔍 Cách đánh giá

**Checklist Accept/Reject:**

- [ ] Parties và purpose rõ ràng
- [ ] Definition of confidential info đủ rộng
- [ ] Exclusions hợp lý (public info, prior knowledge)
- [ ] Duration phù hợp context
- [ ] Return/destroy clause included
- [ ] Remedies clause có

**Red flags (cần Reject):**

- ⚠️ Definition quá hẹp hoặc quá rộng
- ⚠️ Thiếu exclusions quan trọng
- ⚠️ Không có remedies clause
- ⚠️ Missing signature blocks

---

## ⚠️ Common Failures

| Lỗi thường gặp | Cách phòng tránh |
|----------------|------------------|
| Definition quá vague | Specify categories rõ ràng |
| Duration quá dài | 2-5 năm là standard |
| Missing jurisdiction | Luôn specify |
| No return clause | Include destroy/return option |

---

## 💡 Tips

1. **Mutual vs One-way** — Mutual nếu cả 2 bên share
2. **Be specific about what's confidential** — Avoid disputes
3. **Standard exclusions** — Public info, required by law
4. **Consider trade secrets** — May need longer duration
5. **Always have lawyer review** — Before important deals

---

## 📊 Ví dụ thực tế

### Input mẫu

```
Type: Mutual NDA
Scope: chia sẻ tài liệu kỹ thuật + pricing
Term: 2 năm
Jurisdiction: Việt Nam
```

### Output mẫu

```markdown
# NDA Key Clauses

- Confidential Info: tài liệu kỹ thuật, kế hoạch giá, dữ liệu khách hàng
- Exclusions: public info, info có trước
- Term: 2 năm, survival 3 năm
- Disclosure: chỉ cho nhân viên cần biết
- Remedies: injunctive relief
```

### Đánh giá

- ✅ Đầy đủ điều khoản chuẩn
- ✅ Phạm vi bảo mật rõ
- ✅ Thời hạn hợp lý
- **Kết quả: ACCEPT**

## 🔗 Related Skills

- [Contract Review](./01_contract_review.skill.md)
- [Terms of Service](./03_terms_of_service.skill.md)

## 📜 Version History

| Version | Date | Changes |
|---|---|---|
| 1.0.1 | 2026-02-07 | Domain refinement: examples + flow alignment |
| 1.0.0 | 2026-02-07 | Initial standardized metadata + example/related sections |

## 🔗 Next Step

Sau khi hoàn thành **NDA Template**, tiếp tục với:
→ [Terms of Service](./03_terms_of_service.skill.md)

---

*CVF Skill Library v1.5.2 | Legal & Contracts Domain*
