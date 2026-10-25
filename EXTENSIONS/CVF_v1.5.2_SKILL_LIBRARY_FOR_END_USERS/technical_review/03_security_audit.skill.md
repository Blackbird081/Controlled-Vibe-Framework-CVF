# Security Audit

> **Domain:** Technical Review  
> **Difficulty:** ⭐⭐⭐ Advanced  
> **CVF Version:** v1.5.2
> **Skill Version:** 1.0.0  
> **Last Updated:** 2026-02-07

---

## 📌 Prerequisites

Không yêu cầu.

---

## 🎯 Mục đích

**Khi nào dùng skill này:**

- Security review for applications
- Identify vulnerabilities
- Check compliance requirements
- Pre-launch security checklist
- Third-party integration security

**Không phù hợp khi:**

- Penetration testing → Cần security tools
- Compliance certification → Cần auditors
- Incident response → Need real-time analysis

---

## 🛡️ Governance Summary (CVF Autonomous)

| Field | Value |
|-------|-------|
| Risk Level | R1 |
| Allowed Roles | User, Reviewer |
| Allowed Phases | Build, Review |
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

- UAT Record: [03_security_audit](../../../governance/skill-library/uat/results/UAT-03_security_audit.md)
- UAT Objective: Skill phải đạt chuẩn output theo CVF + không vượt quyền

---

## 📋 Form Input

| Field | Mô tả | Bắt buộc | Ví dụ |
|-------|-------|:--------:|-------|
| **System description** | What to audit | ✅ | "Web app with user auth, payments" |
| **Tech stack** | Technologies used | ✅ | "Next.js, Node.js, PostgreSQL, Stripe" |
| **Data handled** | Sensitive data types | ✅ | "PII, payment info, health data" |
| **Current measures** | Security already in place | ❌ | "SSL, JWT auth, encrypted at rest" |
| **Compliance needs** | Regulations to follow | ❌ | "GDPR, PCI-DSS" |
| **Threat model** | Known threats | ❌ | "Concerned about data breaches" |

---

## ✅ Expected Output

**Kết quả:**

- Security assessment by area
- Vulnerabilities found (OWASP categorized)
- Risk ratings
- Remediation recommendations
- Compliance gaps

**Cấu trúc output:**

```
SECURITY AUDIT REPORT

1. EXECUTIVE SUMMARY
   - Overall security posture
   - Critical findings count
   - Top risks

2. SCOPE
   - What was reviewed
   - Limitations

3. FINDINGS BY CATEGORY

   AUTHENTICATION & ACCESS
   - [Finding + Risk Level + Remediation]
   
   DATA PROTECTION
   - [Finding + Risk Level + Remediation]
   
   INPUT VALIDATION
   - [Finding + Risk Level + Remediation]
   
   API SECURITY
   - [Finding + Risk Level + Remediation]
   
   INFRASTRUCTURE
   - [Finding + Risk Level + Remediation]

4. COMPLIANCE GAPS
   - GDPR: [gaps]
   - PCI-DSS: [gaps]

5. RISK SUMMARY
   | Finding | Risk | Impact | Likelihood | Priority |
   
6. REMEDIATION ROADMAP
   - Immediate (Week 1)
   - Short-term (Month 1)
   - Long-term (Quarter 1)
```

---

## 🔍 Cách đánh giá

**Checklist Accept/Reject:**

- [ ] Covers OWASP Top 10
- [ ] Risk levels appropriate
- [ ] Remediation actionable
- [ ] Considers compliance
- [ ] Prioritized findings
- [ ] No false sense of security

**Red flags (cần Reject):**

- ⚠️ Missing critical areas
- ⚠️ Vague remediations
- ⚠️ Underestimated risks
- ⚠️ Ignores compliance requirements

---

## ⚠️ Common Failures

| Lỗi thường gặp | Cách phòng tránh |
|----------------|------------------|
| Surface-level review | Provide detailed tech stack |
| Missing auth issues | Explicitly describe auth flow |
| Generic OWASP list | Ask for specific to your stack |
| Ignores compliance | State regulations upfront |

---

## 💡 Tips

1. **Describe auth flow** — Most vulns here
2. **List all data types** — Especially PII
3. **Include infrastructure** — Cloud config matters
4. **State compliance needs** — GDPR, HIPAA, etc.
5. **Share current measures** — Avoid redundant findings

---

## 📊 Ví dụ thực tế

### Input mẫu

```
System: Healthcare appointment booking app
Tech stack: React, Node.js Express, MongoDB, AWS
Data handled: Patient PII, health records, appointment history
Current measures: HTTPS, JWT tokens, bcrypt passwords
Compliance: HIPAA required
Threat model: Concerned about data breaches, unauthorized access
```

### Output mẫu

```
SECURITY AUDIT: Healthcare Booking App

1. EXECUTIVE SUMMARY
━━━━━━━━━━━━━━━━━━━━━━━━━
Overall Posture: MEDIUM RISK
Critical Findings: 3
High Findings: 4

Top Risks:
• Health records not encrypted at rest
• No audit logging for data access
• JWT tokens don't expire

2. SCOPE
   - Application security review
   - HIPAA compliance check
   - Limitations: No penetration testing

3. FINDINGS

   AUTHENTICATION & ACCESS
   ━━━━━━━━━━━━━━━━━━━━━━━━━
   🔴 CRITICAL: JWT tokens never expire
      Risk: Stolen tokens valid forever
      HIPAA: §164.312(d) - Session management
      Fix: Implement 15-min access + refresh tokens
   
   🟠 HIGH: No MFA for healthcare data access
      Risk: Single factor compromise
      HIPAA: Recommended under §164.312(d)
      Fix: Require MFA for providers/admin
   
   DATA PROTECTION
   ━━━━━━━━━━━━━━━━━━━━━━━━━
   🔴 CRITICAL: Health records not encrypted at rest
      Risk: Data breach exposes PHI
      HIPAA: §164.312(a)(2)(iv) - Encryption
      Fix: Enable MongoDB encryption, AWS KMS
   
   🔴 CRITICAL: No field-level encryption for SSN
      Risk: DB compromise = full exposure
      Fix: Client-side encryption for sensitive fields
   
   🟠 HIGH: Backups not encrypted
      Risk: Backup theft = data breach
      Fix: Enable AWS backup encryption
   
   ACCESS LOGGING
   ━━━━━━━━━━━━━━━━━━━━━━━━━
   🟠 HIGH: No audit trail for PHI access
      Risk: Can't detect/investigate breaches
      HIPAA: §164.312(b) - Audit controls
      Fix: Implement comprehensive audit logging
   
   API SECURITY
   ━━━━━━━━━━━━━━━━━━━━━━━━━
   🟡 MEDIUM: No rate limiting
      Risk: Brute force attacks
      Fix: Implement rate limiting (100 req/min)
   
   🟡 MEDIUM: Verbose error messages
      Risk: Information disclosure
      Fix: Generic errors in production

4. HIPAA COMPLIANCE GAPS
━━━━━━━━━━━━━━━━━━━━━━━━━
   ❌ §164.312(a) - Access Control
      - Missing: Role-based access audit
   
   ❌ §164.312(b) - Audit Controls
      - Missing: PHI access logging
   
   ❌ §164.312(e) - Transmission Security
      - OK: HTTPS in place ✓
   
   ❌ §164.312(a)(2)(iv) - Encryption
      - Missing: At-rest encryption

5. RISK SUMMARY
   | Finding | Risk | Priority |
   |---------|------|----------|
   | No encryption at rest | Critical | P0 |
   | JWT no expiry | Critical | P0 |
   | No audit logging | High | P1 |
   | No MFA | High | P1 |

6. REMEDIATION ROADMAP

   IMMEDIATE (Week 1):
   • Implement JWT expiry (access: 15min, refresh: 7d)
   • Enable MongoDB encryption
   
   SHORT-TERM (Month 1):
   • Implement audit logging
   • Add MFA for providers
   • Field-level encryption for SSN
   
   LONG-TERM (Quarter 1):
   • Full HIPAA compliance review
   • Security training for team
   • Penetration testing
```

### Đánh giá

- ✅ Covers authentication, data, logging, API
- ✅ HIPAA gaps clearly mapped
- ✅ Risk levels appropriate
- ✅ Remediation với timeline
- ✅ Prioritized by severity
- **Kết quả: ACCEPT**

---

---

## 🔗 Related Skills

- [Architecture Review](./02_architecture_review.skill.md)
- [Code Review](./01_code_review.skill.md)

## 📜 Version History

| Version | Date | Changes |
|---|---|---|
| 1.0.1 | 2026-02-07 | Domain refinement: flow alignment + metadata |
| 1.0.0 | 2026-02-07 | Initial standardized metadata + example/related sections |

## 🔗 Next Step

Sau khi hoàn thành **Security Audit**, quay lại kiểm tra code:
→ [Code Review](./01_code_review.skill.md)

---

*CVF Skill Library v1.5.2 | Technical Review Domain*
