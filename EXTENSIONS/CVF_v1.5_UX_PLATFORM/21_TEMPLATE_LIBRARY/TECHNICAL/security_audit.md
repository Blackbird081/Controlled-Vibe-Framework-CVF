# 🔐 Security Audit Template

**Domain:** Technical  
**Preset:** `technical`

---

## Mô tả ngắn

Đánh giá bảo mật của hệ thống, code, hoặc infrastructure.

---

## Khi nào dùng

- Pre-launch security review
- Penetration test preparation
- Compliance audit
- Security incident review

---

## Form Fields

| Field | Required | Type | Mô tả |
|-------|:--------:|------|-------|
| Scope | ✅ | textarea | Phạm vi audit |
| Type | ✅ | select | Code/Infra/API/All |
| Compliance | ❌ | multiselect | OWASP/PCI/HIPAA |
| Known issues | ❌ | textarea | Vấn đề đã biết |

---

## Intent Pattern

```
INTENT:
Tôi cần security audit cho [scope].

CONTEXT:
- Scope: [mô tả phạm vi]
- Type: [code/infrastructure/API/all]
- Tech Stack: [technologies]
- Compliance requirements: [OWASP/PCI/etc.]
- Known issues: [nếu có]

SUCCESS CRITERIA:
- Vulnerabilities categorized theo CVSS
- OWASP Top 10 checklist
- Remediation recommendations
- Priority-based action plan
```

---

## Output Expected

```markdown
## Security Audit: [Scope]

### Executive Summary
- **Risk Level:** [Critical/High/Medium/Low]
- **Critical Vulnerabilities:** [số]
- **High Vulnerabilities:** [số]

### OWASP Top 10 Checklist
| Category | Status | Notes |
|----------|:------:|-------|
| A01 - Broken Access Control | ⚠️ | [notes] |
| A02 - Cryptographic Failures | ✅ | [notes] |
| A03 - Injection | ❌ | [notes] |
| ... | ... | ... |

### Critical Vulnerabilities
1. **[Vuln Name]**
   - CVSS: 9.8
   - Location: [where]
   - Impact: [what could happen]
   - Remediation: [how to fix]

### High Vulnerabilities
1. **[Vuln]** - [details]

### Remediation Roadmap
| Priority | Vulnerability | Effort | Deadline |
|:--------:|---------------|:------:|----------|
| 1 | [vuln] | 1 day | Immediate |
| 2 | [vuln] | 3 days | 1 week |

### Compliance Status
[Status vs required compliance]
```

---

## Examples

### Ví dụ: API Security

```
INTENT:
Tôi cần security audit cho REST API.

CONTEXT:
- Scope: Payment gateway API
- Type: API
- Tech: Node.js, JWT, PostgreSQL
- Compliance: PCI-DSS Level 2

SUCCESS CRITERIA:
- OWASP API Top 10 check
- Authentication/Authorization review
- Data protection assessment
```

---

*Template thuộc CVF v1.5 UX Platform*
