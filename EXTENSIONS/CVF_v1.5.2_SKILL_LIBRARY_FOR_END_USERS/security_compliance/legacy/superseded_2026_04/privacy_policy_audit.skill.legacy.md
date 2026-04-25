# Privacy Policy Audit

> **Domain:** Security & Compliance  
> **Difficulty:** Easy  
> **CVF Version:** v1.5.2  
> **Skill Version:** 1.0.1  
> **Last Updated:** 2026-02-07
> **Inspired by:** antigravity-awesome-skills/privacy-policy

## 📌 Prerequisites

Không yêu cầu.

---

## 🎯 Mục đích

Đánh giá và cải thiện Privacy Policy. Đảm bảo policy compliant với regulations và understandable cho users.

**Khi nào nên dùng:**
- Tạo privacy policy mới
- Annual review
- Sau khi add features mới
- Trước khi expand markets

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

- UAT Record: [privacy_policy_audit](../../../governance/skill-library/uat/results/UAT-privacy_policy_audit.md)
- UAT Objective: Skill phải đạt chuẩn output theo CVF + không vượt quyền

---
## 📋 Form Input

| Field | Bắt buộc | Mô tả |
|-------|----------|-------|
| **Current Policy URL** | ✅ | Link to policy (hoặc paste text) |
| **Business Type** | ✅ | E-commerce, SaaS, Mobile app |
| **Target Markets** | ✅ | US, EU, APAC, Global |
| **Data Collected** | ✅ | Types of personal data |
| **Third Party Services** | ❌ | Analytics, payments, ads |
| **Special Data** | ❌ | Health, children, financial |

---

## ✅ Checklist - Required Elements

### Identity & Contact
- [ ] Company name và legal entity?
- [ ] Contact information (email, address)?
- [ ] DPO contact (if applicable)?

### Data Collection
- [ ] What data is collected?
- [ ] How is data collected?
- [ ] Is collection automatic or user-provided?
- [ ] Categories clear (personal, usage, device)?

### Purpose & Use
- [ ] Why data is collected?
- [ ] How data is used?
- [ ] Secondary uses disclosed?

### Legal Basis (GDPR)
- [ ] Legal basis for each processing?
- [ ] Consent mechanism explained?
- [ ] Legitimate interest explained?

### Data Sharing
- [ ] Who data is shared with?
- [ ] Third party categories named?
- [ ] Cross-border transfers disclosed?
- [ ] Data processors listed?

### Retention
- [ ] How long data is kept?
- [ ] Retention criteria explained?
- [ ] Deletion process?

### User Rights
- [ ] Access rights explained?
- [ ] Correction rights?
- [ ] Deletion rights?
- [ ] Opt-out rights?
- [ ] How to exercise rights?

### Security
- [ ] Security measures described?
- [ ] Breach notification process?

### Updates
- [ ] Last updated date?
- [ ] How changes are communicated?
- [ ] Version history?

---

## ✅ Checklist - Regional Requirements

### GDPR (EU)
- [ ] All Article 13/14 information?
- [ ] DPO contact if required?
- [ ] Supervisory authority info?

### CCPA (California)
- [ ] "Do Not Sell My Info" link?
- [ ] Categories of data collected/sold?
- [ ] Consumer rights listed?
- [ ] Toll-free number?

### LGPD (Brazil)
- [ ] Legal basis for processing?
- [ ] Data subject rights?
- [ ] DPO (Encarregado) info?

### PDPA (Vietnam/Singapore)
- [ ] Consent requirements?
- [ ] Access and correction rights?
- [ ] Withdrawal of consent?

---

## ⚠️ Lỗi Thường Gặp

| Lỗi | Risk | Fix |
|-----|------|-----|
| **Too legal/complex** | Users don't read | Plain language |
| **Outdated** | Non-compliance | Update regularly |
| **Missing services** | Inaccurate | List all third parties |
| **No contact info** | Regulatory issue | Add DPO/contact |
| **Hidden location** | Trust issue | Visible in footer |
| **Copy-paste** | Doesn't fit | Customize for business |

---

## 💡 Tips & Examples

### Privacy Policy Structure:
```markdown
1. Introduction
   - Who we are
   - What this policy covers

2. Information We Collect
   - Information you provide
   - Information collected automatically
   - Information from third parties

3. How We Use Your Information
   - Primary uses
   - Secondary uses

4. Information Sharing
   - Third-party service providers
   - Legal requirements
   - Business transfers

5. Your Rights and Choices
   - Access and portability
   - Correction and deletion
   - Opt-out options

6. Data Security

7. International Transfers

8. Children's Privacy

9. Changes to This Policy

10. Contact Us
```

### Readability Tips:
```
✅ Short paragraphs (3-4 sentences)
✅ Bullet points for lists
✅ Headers for sections
✅ Plain language (no legalese)
✅ Reading level: 8th grade or lower
✅ Table of contents for long policies
```

### Third-Party Service Template:
```markdown
## Third-Party Services

| Service | Purpose | Data Shared |
|---------|---------|-------------|
| Google Analytics | Website analytics | IP, behavior |
| Stripe | Payments | Name, card info |
| Mailchimp | Email marketing | Email, name |
| Facebook Pixel | Advertising | Behavior, device |
```

### Contact Section Example:
```markdown
## Contact Us

**Data Controller:** [Company Name]
**Address:** [Full address]
**Email:** privacy@company.com
**Phone:** +1-xxx-xxx-xxxx

**Data Protection Officer:** [Name]
**DPO Email:** dpo@company.com

For EU residents, you have the right to lodge a 
complaint with your local supervisory authority.
```

---

## 📤 Expected Output từ AI

Khi paste spec này vào AI, bạn sẽ nhận được:

1. **Compliance Score** - Overall rating by regulation
2. **Missing Elements** - What's not covered
3. **Readability Score** - Comprehension level
4. **Third-Party Audit** - Services review
5. **Regional Gaps** - Market-specific issues
6. **Rewrite Suggestions** - Improved sections
7. **Implementation Checklist** - Next steps

---

## 🔗 Next Step

Sau khi hoàn thành **Privacy Policy Audit**, tiếp tục với:
→ [GDPR Compliance Review](./gdpr_compliance_review.skill.md)

---

*CVF Skill Library v1.5.2 | Security & Compliance Domain*

---

## 📊 Ví dụ thực tế

### Input mẫu:
```
Site: stockflow.vn
Policy version: 2023-01
Data collected: email, phone, device ID, usage logs
Vendors: GA, SendGrid, Stripe
```

### Output mẫu:
```markdown
# Privacy Policy Findings

## Missing Sections
- Legal basis cho xử lý dữ liệu
- Cookie/analytics disclosure
- Data retention & deletion

## Required Updates
- Add "Purpose + Legal basis" table
- Disclose third-party processors (GA/Stripe)
- Provide contact for data requests

## Priority
P0: Legal basis + cookie disclosure
P1: Retention & deletion timeline
```

### Đánh giá:
- ✅ Chỉ ra thiếu sót cụ thể
- ✅ Có ưu tiên rõ ràng
- ✅ Phù hợp dữ liệu thực tế
- **Kết quả: ACCEPT**

## 🔗 Related Skills
- [Data Handling Review](./data_handling_review.skill.md)
- [GDPR Compliance Review](./gdpr_compliance_review.skill.md)

## 📜 Version History

| Version | Date | Changes |
|---|---|---|
| 1.0.1 | 2026-02-07 | Domain refinement: examples + flow alignment |
| 1.0.0 | 2026-02-07 | Initial standardized metadata + example/related sections |

## 🔗 Next Step

Sau khi hoàn thành **Privacy Policy Audit**, tiếp tục với:
→ [GDPR Compliance Review](./gdpr_compliance_review.skill.md)

---

*CVF Skill Library v1.5.2 | Security & Compliance Domain*