# API Security Checklist

> **Domain:** Security & Compliance  
> **Difficulty:** Medium  
> **CVF Version:** v1.5.2  
> **Skill Version:** 1.0.1  
> **Last Updated:** 2026-02-07
> **Inspired by:** antigravity-awesome-skills/api-security

## 📌 Prerequisites

Không yêu cầu.

---

## 🎯 Mục đích

Đánh giá security của API endpoints. Đảm bảo APIs protected against common vulnerabilities và follow best practices.

**Khi nào nên dùng:**

- Trước khi launch APIs mới
- Security audit định kỳ
- Sau khi phát hiện vulnerabilities
- Third-party API integration review

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

- UAT Record: [api_security_checklist](../../../governance/skill-library/uat/results/UAT-api_security_checklist.md)
- UAT Objective: Skill phải đạt chuẩn output theo CVF + không vượt quyền

---

## 📋 Form Input

| Field | Bắt buộc | Mô tả |
|-------|----------|-------|
| **API Endpoints** | ✅ | List các endpoints cần audit |
| **Authentication Type** | ✅ | JWT, OAuth, API Key, etc. |
| **API Type** | ✅ | REST, GraphQL, gRPC |
| **Data Sensitivity** | ✅ | PII, Financial, Healthcare, etc. |
| **Current Security Measures** | ❌ | Existing security implementations |
| **Known Vulnerabilities** | ❌ | Previous issues |

---

## ✅ Checklist Đánh giá

### Authentication & Authorization

- [ ] Có authentication cho tất cả sensitive endpoints?
- [ ] Strong password/token policies?
- [ ] OAuth/JWT implemented correctly?
- [ ] Token expiration hợp lý (access < 1 hour)?
- [ ] Refresh token rotation?
- [ ] Role-based access control (RBAC)?
- [ ] No privilege escalation?

### Input Validation

- [ ] All input validated (whitelist approach)?
- [ ] SQL injection protected (parameterized queries)?
- [ ] XSS protected (output encoding)?
- [ ] Request size limits?
- [ ] Content-type validation?
- [ ] Path traversal protected?

### Rate Limiting & Throttling

- [ ] Rate limiting per user/IP?
- [ ] Brute force protection (login attempts)?
- [ ] DDoS protection?
- [ ] Exponential backoff responses?

### Data Protection

- [ ] HTTPS only (TLS 1.2+)?
- [ ] Sensitive data encrypted at rest?
- [ ] No sensitive data in URLs/logs?
- [ ] Proper error messages (no stack traces)?
- [ ] Response không leak internal info?

### Headers & CORS

- [ ] Proper CORS configuration?
- [ ] Security headers (X-Content-Type-Options, etc.)?
- [ ] No CORS wildcard (*) for sensitive APIs?
- [ ] Cache-Control cho sensitive responses?

### Logging & Monitoring

- [ ] Authentication events logged?
- [ ] Failed requests logged?
- [ ] No sensitive data in logs?
- [ ] Alerting cho suspicious activity?

---

## ⚠️ Lỗi Thường Gặp (OWASP Top 10 API)

| Vulnerability | Impact | Fix |
|---------------|--------|-----|
| **BOLA** (Broken Object Level Auth) | Access others' data | Check ownership every request |
| **Broken Authentication** | Account takeover | Strong auth, MFA |
| **Excessive Data Exposure** | Data leak | Return only needed fields |
| **Lack of Resources & Rate Limiting** | DoS/brute force | Implement rate limits |
| **BFLA** (Broken Function Level Auth) | Privilege escalation | RBAC, check permissions |
| **Mass Assignment** | Modify protected fields | Whitelist allowed fields |
| **Security Misconfiguration** | Various attacks | Security hardening |
| **Injection** | RCE, data theft | Input validation, parameterized |
| **Improper Asset Management** | Shadow API attacks | API inventory |
| **Insufficient Logging** | No forensics | Comprehensive logging |

---

## 💡 Tips & Examples

### JWT Best Practices

```
✅ Use RS256 (asymmetric) over HS256
✅ Short-lived access tokens (15min - 1hr)
✅ Long-lived refresh tokens (rotation)
✅ Store refresh tokens securely
✅ Validate all claims (iss, aud, exp)
✅ Don't store sensitive data in payload

❌ Don't use JWT for session management
❌ Don't store JWT in localStorage (XSS risk)
❌ Don't trust algorithm from header
```

### Rate Limiting Guidelines

```
Anonymous:     60 requests/minute
Authenticated: 600 requests/minute
Login:         5 attempts/15 minutes
Password Reset: 3 requests/hour
```

### Security Headers

```http
Strict-Transport-Security: max-age=31536000; includeSubDomains
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
Content-Security-Policy: default-src 'self'
X-XSS-Protection: 1; mode=block
Cache-Control: no-store (for sensitive responses)
```

### CORS Configuration

```javascript
// ❌ Bad - allows any origin
Access-Control-Allow-Origin: *

// ✅ Good - specific origins
Access-Control-Allow-Origin: https://trusted-domain.com
Access-Control-Allow-Methods: GET, POST
Access-Control-Allow-Headers: Content-Type, Authorization
```

### Error Response Best Practices

```json
// ❌ Bad - leaks info
{
  "error": "User admin@company.com not found in database users table"
}

// ✅ Good - generic
{
  "error": "Invalid credentials",
  "code": "AUTH_FAILED"
}
```

---

## 📤 Expected Output từ AI

Khi paste spec này vào AI, bạn sẽ nhận được:

1. **Security Score** - Overall API security rating
2. **Vulnerability Assessment** - OWASP Top 10 check
3. **Critical Issues** - Must-fix immediately
4. **Recommendations** - Security improvements
5. **Implementation Guide** - How to fix each issue
6. **Testing Checklist** - How to verify fixes
7. **Compliance Notes** - Regulatory considerations

---

## 🔗 Next Step

Sau khi hoàn thành **API Security Checklist**, tiếp tục với:
→ [GDPR Compliance Review](./gdpr_compliance_review.skill.md)

---

*CVF Skill Library v1.5.2 | Security & Compliance Domain*

---

## 📊 Ví dụ thực tế

### Input mẫu

```
API: StockFlow v1
Auth: JWT + refresh token
Endpoints: /auth/login, /inventory, /stock-movements, /reports/low-stock
Data sensitivity: PII + inventory
Current controls: HTTPS only, rate limit 60 rpm
Known issues: 429 spikes khi import hàng loạt
```

### Output mẫu

```markdown
# API Security Findings

## High
- /auth/login không có rate limit theo IP → brute force risk
- /reports/low-stock thiếu RBAC (staff vẫn truy cập)

## Medium
- Error response trả stack trace khi DB timeout
- Không có audit log cho admin actions

## Fix Plan
- Add rate limit 5 req/min/IP cho /auth/login
- Enforce role=manager cho /reports/*
- Replace error 500 with generic message + trace ID
- Log admin actions to audit table
```

### Đánh giá

- ✅ Chỉ ra lỗ hổng rõ ràng, có mức độ ưu tiên
- ✅ Đề xuất fix cụ thể, khả thi
- ✅ Có focus vào auth và RBAC
- **Kết quả: ACCEPT**

## 🔗 Related Skills

- [Data Handling Review](./data_handling_review.skill.md)
- [Incident Response Plan](./incident_response_plan.skill.md)

## 📜 Version History

| Version | Date | Changes |
|---|---|---|
| 1.0.1 | 2026-02-07 | Domain refinement: examples + flow alignment |
| 1.0.0 | 2026-02-07 | Initial standardized metadata + example/related sections |

## 🔗 Next Step: Data Handling Review

Sau khi hoàn thành **API Security Checklist**, tiếp tục với:
→ [Data Handling Review](./data_handling_review.skill.md)

---

*CVF Skill Library v1.5.2 | Security & Compliance Domain*

<!-- Text Encoding Exception: pre-existing localized text and symbols are retained; this repair changes only navigation or Markdown structure. -->
