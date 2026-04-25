# GDPR Compliance Review

> **Domain:** Security & Compliance  
> **Difficulty:** Advanced  
> **CVF Version:** v1.5.2  
> **Skill Version:** 1.0.1  
> **Last Updated:** 2026-02-07
> **Inspired by:** antigravity-awesome-skills/gdpr

## 📌 Prerequisites

Không yêu cầu.

---

## 🎯 Mục đích

Đánh giá website/app về GDPR compliance. Đảm bảo xử lý personal data đúng quy định của European Union.

**Khi nào nên dùng:**
- Launch sản phẩm có EU users
- Annual compliance audit
- Sau data breach
- Before fundraising/acquisition

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

- UAT Record: [gdpr_compliance_review](../../../governance/skill-library/uat/results/UAT-gdpr_compliance_review.md)
- UAT Objective: Skill phải đạt chuẩn output theo CVF + không vượt quyền

---
## 📋 Form Input

| Field | Bắt buộc | Mô tả |
|-------|----------|-------|
| **Website/App** | ✅ | URL hoặc app name |
| **Data Collected** | ✅ | Types of personal data |
| **Processing Purpose** | ✅ | Why data is collected |
| **Third Parties** | ✅ | Analytics, payment, ads, etc. |
| **User Geography** | ❌ | EU users? |
| **Current Measures** | ❌ | Existing compliance efforts |

---

## ✅ Checklist - GDPR Principles

### Lawfulness, Fairness, Transparency (Art. 5)
- [ ] Có legal basis cho mỗi processing activity?
- [ ] Privacy policy có clear và accessible?
- [ ] Users được inform về data processing?
- [ ] Language có understandable (không legal jargon)?

### Purpose Limitation (Art. 5)
- [ ] Data chỉ dùng cho stated purposes?
- [ ] Có inform nếu purpose changes?
- [ ] No secondary use without consent?

### Data Minimization (Art. 5)
- [ ] Chỉ collect data cần thiết?
- [ ] Không collect "just in case"?
- [ ] Form fields có minimal?

### Accuracy (Art. 5)
- [ ] Users có thể update their data?
- [ ] Có process để keep data accurate?
- [ ] Incorrect data được rectify/delete?

### Storage Limitation (Art. 5)
- [ ] Retention periods defined?
- [ ] Data deleted when no longer needed?
- [ ] Có data deletion procedures?

### Integrity & Confidentiality (Art. 5)
- [ ] Appropriate security measures?
- [ ] Encryption for sensitive data?
- [ ] Access controls implemented?
- [ ] Breach notification plan?

---

## ✅ Checklist - User Rights

### Right to Access (Art. 15)
- [ ] Users có thể request their data?
- [ ] Process to fulfill requests trong 30 days?
- [ ] Data provided in readable format?

### Right to Rectification (Art. 16)
- [ ] Users có thể correct their data?
- [ ] Easy process to update info?

### Right to Erasure (Art. 17)
- [ ] Users có thể delete their data?
- [ ] "Delete account" option available?
- [ ] Data deleted from backups too?

### Right to Data Portability (Art. 20)
- [ ] Users có thể export their data?
- [ ] Export trong machine-readable format (JSON/CSV)?

### Right to Object (Art. 21)
- [ ] Users có thể opt-out of marketing?
- [ ] Easy unsubscribe process?

---

## ✅ Checklist - Consent

### Valid Consent (Art. 7)
- [ ] Consent là freely given?
- [ ] Consent là specific và informed?
- [ ] Clear affirmative action (no pre-ticked)?
- [ ] Có thể withdraw consent easily?
- [ ] Consent recorded và auditable?

### Cookie Consent
- [ ] Cookie banner trước khi set cookies?
- [ ] Option to accept/reject?
- [ ] Granular choices (essential/analytics/marketing)?
- [ ] Easy to change preferences?
- [ ] No cookie walls blocking content?

---

## ⚠️ Lỗi Thường Gặp

| Lỗi | Fine Risk | Fix |
|-----|-----------|-----|
| **No consent banner** | €20M or 4% | Add cookie consent |
| **Pre-ticked boxes** | High | Require active opt-in |
| **No privacy policy** | High | Create comprehensive policy |
| **No data deletion** | High | Implement right to erasure |
| **Ignoring DSR** | High | Process within 30 days |
| **Sharing without consent** | Very High | Get explicit consent |
| **Breach not reported** | €10M or 2% | 72-hour notification |

---

## 💡 Tips & Examples

### Legal Bases for Processing:
| Basis | Example |
|-------|---------|
| **Consent** | Marketing emails |
| **Contract** | Order fulfillment |
| **Legal Obligation** | Tax records |
| **Vital Interests** | Emergency contact |
| **Public Task** | Government services |
| **Legitimate Interest** | Fraud prevention |

### Privacy Policy Must-Haves:
```markdown
1. Identity of data controller
2. Contact details (DPO if applicable)
3. What data is collected
4. Why data is collected (purposes)
5. Legal basis for processing
6. Data retention periods
7. Third parties who receive data
8. User rights explained
9. How to exercise rights
10. Right to lodge complaint with supervisory authority
```

### Cookie Categories:
| Category | Consent Required | Example |
|----------|-----------------|---------|
| Essential | No | Session, security |
| Functional | Yes | Language, preferences |
| Analytics | Yes | Google Analytics |
| Marketing | Yes | Facebook Pixel, ads |

### Data Subject Request Response:
```markdown
## DSR Response Template

Dear [Name],

We confirm receipt of your data access request dated [date].

**Data we hold about you:**
- Account info: [details]
- Transaction history: [details]
- Marketing preferences: [details]

**Data sources:** Direct collection via website

**Third parties:** [list]

You may request rectification or erasure by contacting us.

[Signature, DPO name, contact]
```

---

## 📤 Expected Output từ AI

Khi paste spec này vào AI, bạn sẽ nhận được:

1. **Compliance Score** - Overall GDPR readiness
2. **Gap Analysis** - Missing requirements
3. **Risk Assessment** - Potential fine exposure
4. **Privacy Policy Review** - What's missing
5. **Cookie Audit** - Compliance status
6. **Remediation Plan** - Prioritized fixes
7. **Template Documents** - DSAR, policies

---

## 🔗 Next Step

Sau khi hoàn thành **GDPR Compliance Review**, tiếp tục với:
→ [API Security Checklist](./api_security_checklist.skill.md)

---

*CVF Skill Library v1.5.2 | Security & Compliance Domain*

---

## 📊 Ví dụ thực tế

### Input mẫu:
```
EU users: ~12%
Legal basis: contract + consent
Vendors: AWS (EU), Stripe (US)
DSAR process: chưa có
```

### Output mẫu:
```markdown
# GDPR Review

## Gaps
- Chưa có DSAR workflow (30 ngày)
- Không có DPA với Stripe
- Không có ROPA (record of processing)

## Remediation
- Create DSAR SOP + request form
- Sign DPA + SCC với vendor US
- Maintain processing register (data type, purpose, retention)
```

### Đánh giá:
- ✅ Xác định gaps cốt lõi
- ✅ Có biện pháp phù hợp GDPR
- ✅ Ưu tiên theo rủi ro
- **Kết quả: ACCEPT**

## 🔗 Related Skills
- [Privacy Policy Audit](./privacy_policy_audit.skill.md)
- [Terms of Service Review](./terms_of_service_review.skill.md)

## 📜 Version History

| Version | Date | Changes |
|---|---|---|
| 1.0.1 | 2026-02-07 | Domain refinement: examples + flow alignment |
| 1.0.0 | 2026-02-07 | Initial standardized metadata + example/related sections |

## 🔗 Next Step

Sau khi hoàn thành **GDPR Compliance Review**, tiếp tục với:
→ [Terms of Service Review](./terms_of_service_review.skill.md)

---

*CVF Skill Library v1.5.2 | Security & Compliance Domain*