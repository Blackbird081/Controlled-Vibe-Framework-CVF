# Terms of Service Review

> **Domain:** Security & Compliance  
> **Difficulty:** Easy  
> **CVF Version:** v1.5.2  
> **Skill Version:** 1.0.1  
> **Last Updated:** 2026-02-07
> **Inspired by:** antigravity-awesome-skills/terms-of-service

## 📌 Prerequisites

Không yêu cầu.

---

## 🎯 Mục đích

Đánh giá và cải thiện Terms of Service (ToS). Đảm bảo ToS protect business while remaining fair và understandable cho users.

**Khi nào nên dùng:**

- Tạo ToS cho product mới
- Annual review
- Feature/policy changes
- International expansion

---

## 🛡️ Governance Summary (CVF Autonomous)

| Field | Value |
|-------|-------|
| Risk Level | R2 |
| Allowed Roles | User, Reviewer |
| Allowed Phases | Design, Review |
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

- UAT Record: [terms_of_service_review](../../../governance/skill-library/uat/results/UAT-terms_of_service_review.md)
- UAT Objective: Skill phải đạt chuẩn output theo CVF + không vượt quyền

---

## 📋 Form Input

| Field | Bắt buộc | Mô tả |
|-------|----------|-------|
| **Current ToS URL** | ✅ | Link hoặc paste ToS |
| **Service Type** | ✅ | SaaS, Marketplace, App |
| **Business Model** | ✅ | Subscription, Free, One-time |
| **Target Markets** | ✅ | US, EU, Global |
| **Key Risks** | ❌ | Main concerns to address |
| **User Types** | ❌ | B2B, B2C, Mixed |

---

## ✅ Checklist - Essential Sections

### Service Description

- [ ] What service is provided?
- [ ] Service limitations stated?
- [ ] Availability expectations?
- [ ] Service modifications reserved?

### User Responsibilities

- [ ] Account requirements?
- [ ] Acceptable use defined?
- [ ] Prohibited activities listed?
- [ ] Content guidelines?

### Payment Terms (if applicable)

- [ ] Pricing clearly stated?
- [ ] Billing cycle explained?
- [ ] Refund policy?
- [ ] Price change notice?
- [ ] Cancellation process?

### Intellectual Property

- [ ] Service IP ownership?
- [ ] User content rights?
- [ ] License grants clear?
- [ ] Trademark usage?

### Liability & Disclaimers

- [ ] Warranty disclaimers?
- [ ] Limitation of liability?
- [ ] Indemnification clauses?
- [ ] Force majeure?

### Termination

- [ ] Termination rights (both sides)?
- [ ] Effect of termination?
- [ ] Data after termination?
- [ ] Surviving provisions?

### Dispute Resolution

- [ ] Governing law?
- [ ] Jurisdiction?
- [ ] Arbitration clause (if used)?
- [ ] Class action waiver (if applicable)?

### General

- [ ] Effective date?
- [ ] Modification process?
- [ ] Entire agreement clause?
- [ ] Severability?
- [ ] Assignment?

---

## ✅ Checklist - User-Friendliness

### Readability

- [ ] Plain language used?
- [ ] Short paragraphs?
- [ ] Sectioned with headers?
- [ ] No unnecessary legal jargon?

### Accessibility

- [ ] Easy to find on website?
- [ ] Table of contents?
- [ ] Searchable (not image/PDF)?
- [ ] Mobile-friendly format?

### Fairness

- [ ] Balanced rights (not one-sided)?
- [ ] No surprise clauses?
- [ ] Reasonable limitations?
- [ ] Clear consumer rights?

---

## ⚠️ Lỗi Thường Gặp

| Lỗi | Risk | Fix |
|-----|------|-----|
| **Too one-sided** | Unenforceable | Balance rights |
| **Copy-paste generic** | Doesn't fit service | Customize |
| **Buried important terms** | User complaints | Highlight key points |
| **No dispute process** | Costly litigation | Add arbitration |
| **Vague on termination** | Confusion | Clear termination terms |
| **Missing for jurisdiction** | Legal gaps | Cover all markets |
| **Never updated** | Out of date | Regular reviews |

---

## 💡 Tips & Examples

### ToS Structure

```markdown
1. Acceptance of Terms
2. Service Description
3. User Accounts
4. Acceptable Use
5. User Content
6. Intellectual Property
7. Payment & Subscription
8. Termination
9. Disclaimers
10. Limitation of Liability
11. Indemnification
12. Dispute Resolution
13. General Provisions
14. Contact Information
```

### Key Clause Examples

**Limitation of Liability:**

```
TO THE MAXIMUM EXTENT PERMITTED BY LAW, OUR TOTAL 
LIABILITY TO YOU FOR ALL CLAIMS ARISING FROM OR 
RELATING TO THE SERVICE SHALL NOT EXCEED THE 
AMOUNT YOU PAID US IN THE 12 MONTHS PRECEDING 
THE CLAIM.
```

**Modification Clause:**

```
We may modify these Terms at any time. We will notify 
you of material changes by email or in-service notice 
at least 30 days before they take effect. Your 
continued use after the changes take effect constitutes 
acceptance of the modified Terms.
```

**Termination:**

```
Either party may terminate this agreement at any time 
for any reason by providing 30 days written notice. 
We may terminate immediately if you breach these Terms. 
Upon termination, your right to use the service ends, 
but sections [X, Y, Z] survive termination.
```

### User-Friendly Approaches

```
✅ TL;DR summaries at section start
✅ Icons for different section types
✅ Examples of prohibited activities
✅ FAQs alongside legal text
✅ Version history accessible
```

### Regional Considerations

| Region | Requirement |
|--------|-------------|
| **EU** | Clear, understandable language; fair terms |
| **California** | Cancellation rights; auto-renewal disclosure |
| **Australia** | Consumer guarantees can't be excluded |
| **UK** | Unfair terms unenforceable |

---

## 📤 Expected Output từ AI

Khi paste spec này vào AI, bạn sẽ nhận được:

1. **ToS Score** - Overall quality rating
2. **Coverage Analysis** - What's included/missing
3. **Readability Score** - User-friendliness
4. **Risk Assessment** - Potential legal issues
5. **Fairness Review** - Balance of rights
6. **Improvement Suggestions** - Section rewrites
7. **Regional Compliance** - Market-specific gaps

---

## 🔗 Next Step

Sau khi hoàn thành **Terms of Service Review**, tiếp tục với:
→ [Data Handling Review](./data_handling_review.skill.md)

---

*CVF Skill Library v1.5.2 | Security & Compliance Domain*

---

## 📊 Ví dụ thực tế

### Input mẫu

```
Product: StockFlow (B2B SaaS)
Plans: monthly/annual
SLA: 99.5%
Billing: auto-renew
```

### Output mẫu

```markdown
# ToS Review

## Missing/Weak Clauses
- Limitation of liability chưa có cap
- Termination & data export không rõ
- Acceptable use chưa cấm scraping

## Recommendations
- Add liability cap = 12 months fees
- Clarify data export within 30 ngày sau khi hủy
- Add AUP section: no scraping, no abuse
```

### Đánh giá

- ✅ Bám đúng rủi ro pháp lý
- ✅ Khuyến nghị cụ thể
- ✅ Dễ cập nhật vào ToS
- **Kết quả: ACCEPT**

## 🔗 Related Skills

- [GDPR Compliance Review](./gdpr_compliance_review.skill.md)
- [Incident Response Plan](./incident_response_plan.skill.md)

## 📜 Version History

| Version | Date | Changes |
|---|---|---|
| 1.0.1 | 2026-02-07 | Domain refinement: examples + flow alignment |
| 1.0.0 | 2026-02-07 | Initial standardized metadata + example/related sections |

## 🔗 Next Step: Incident Response Plan

Sau khi hoàn thành **Terms of Service Review**, tiếp tục với:
→ [Incident Response Plan](./incident_response_plan.skill.md)

---

*CVF Skill Library v1.5.2 | Security & Compliance Domain*

<!-- Text Encoding Exception: pre-existing localized text and symbols are retained; this repair changes only navigation or Markdown structure. -->
