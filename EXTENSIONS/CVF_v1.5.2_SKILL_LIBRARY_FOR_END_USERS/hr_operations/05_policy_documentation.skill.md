# Policy Documentation

> **Domain:** HR & Operations  
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
- Viết chính sách mới cho công ty
- Cập nhật policy hiện có
- Chuẩn hóa format tài liệu nội bộ
- Communicate changes cho employees

**Không phù hợp khi:**
- Cần legal contracts — Cần luật sư review
- Compliance documentation — Cần compliance officer
- Technical guidelines — Dùng technical docs skills

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

- UAT Record: [05_policy_documentation](../../../governance/skill-library/uat/results/UAT-05_policy_documentation.md)
- UAT Objective: Skill phải đạt chuẩn output theo CVF + không vượt quyền

---
## 📋 Form Input

| Field | Mô tả | Bắt buộc | Ví dụ |
|-------|-------|:--------:|-------|
| **Policy topic** | Chủ đề chính sách | ✅ | "Remote Work Policy" |
| **Purpose** | Mục đích của policy | ✅ | "Guidelines cho làm việc từ xa" |
| **Scope** | Ai áp dụng | ✅ | "Tất cả full-time employees" |
| **Key rules** | Các quy định chính | ✅ | "Max 3 days remote/week" |
| **Exceptions** | Ngoại lệ nếu có | ❌ | "C-level có thể approve thêm" |
| **Effective date** | Ngày có hiệu lực | ❌ | "2026-03-01" |

---

## ✅ Expected Output

**Kết quả bạn sẽ nhận được:**
- Policy document hoàn chỉnh
- Ngôn ngữ clear, professional
- Format chuẩn, dễ reference

**Cấu trúc output:**
```
[COMPANY] POLICY: [TOPIC]

1. Purpose
2. Scope
3. Definitions (if needed)
4. Policy Details
5. Exceptions/Special Cases
6. Responsibilities
7. Violations & Consequences
8. Related Policies
9. Revision History
```

---

## 🔍 Cách đánh giá

**Checklist Accept/Reject:**

- [ ] Purpose rõ ràng, dễ hiểu
- [ ] Scope xác định ai được áp dụng
- [ ] Rules cụ thể, không ambiguous
- [ ] Language professional, neutral
- [ ] Có consequences cho violations
- [ ] Format consistent, scannable

**Red flags (cần Reject):**
- ⚠️ Quá vague, room for interpretation
- ⚠️ Too harsh/too lenient tone
- ⚠️ Missing key scenarios
- ⚠️ Conflicting với policies khác

---

## ⚠️ Common Failures

| Lỗi thường gặp | Cách phòng tránh |
|----------------|------------------|
| Too vague | Dùng specific examples |
| Overly complex | Simple language, bullet points |
| Missing edge cases | Think through scenarios |
| No enforcement | Include consequences section |

---

## 💡 Tips

1. **Start with "Why"** — Purpose quan trọng
2. **Use simple language** — Avoid jargon
3. **Include examples** — Clarify ambiguous cases
4. **Get feedback** — From affected employees
5. **Review regularly** — Update khi cần

---

## 📊 Ví dụ thực tế

### Input mẫu:
```
Policy topic: Work From Home Policy
Purpose: Enable flexible working while maintaining productivity
Scope: All full-time employees after probation
Key rules:
  - Max 2 days WFH per week
  - Must be available 9AM-5PM
  - Need manager approval cho ngày WFH
  - Certain roles must be in office (reception, warehouse)
Exceptions: Special circumstances với HR approval
Effective date: 2026-03-01
```

### Output mẫu:
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[COMPANY NAME] POLICY
WORK FROM HOME POLICY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Effective Date: March 1, 2026
Policy Number: HR-2026-003
Last Reviewed: February 6, 2026

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. PURPOSE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
This policy provides guidelines for work from home 
arrangements, enabling flexible working while 
maintaining team productivity and collaboration.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
2. SCOPE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
This policy applies to:
• All full-time employees
• After completion of probation period (3 months)

This policy does NOT apply to:
• Part-time employees
• Contractors
• Roles requiring on-site presence (see Section 4.4)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
3. DEFINITIONS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• WFH: Work From Home - working from a location 
  outside the company office
• Core hours: 9:00 AM - 5:00 PM local time
• Hybrid: Combination of office and remote work

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
4. POLICY DETAILS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

4.1 WFH Allowance
• Maximum 2 days per week for WFH
• WFH days phải được schedule trước

4.2 Availability Requirements
• Must be available during core hours (9AM-5PM)
• Respond to messages within 30 minutes
• Have reliable internet connection
• Attend all scheduled meetings (camera on when possible)

4.3 Request Process
• Submit request to manager at least 24 hours in advance
• Use [HR System] for tracking
• Manager approval required

4.4 On-Site Required Roles
The following roles are NOT eligible for WFH:
• Reception/Front desk
• Warehouse staff
• on-site support technicians

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
5. EXCEPTIONS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Special circumstances may warrant additional WFH:
• Medical reasons (with documentation)
• Family emergencies
• Other approved by HR Director

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
6. RESPONSIBILITIES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Employees:
• Request WFH in advance
• Maintain productivity
• Be available during core hours

Managers:
• Approve/deny requests fairly
• Monitor team productivity
• Ensure adequate office coverage

HR:
• Maintain policy
• Handle exceptions
• Track compliance

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
7. VIOLATIONS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Non-compliance may result in:
• First offense: Verbal warning
• Second offense: Written warning
• Third offense: WFH privileges revoked
• Continued violations: Disciplinary action

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
8. RELATED POLICIES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• Attendance Policy (HR-2025-001)
• IT Security Policy (IT-2025-002)
• Equipment Usage Policy (IT-2025-003)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
9. REVISION HISTORY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
| Version | Date       | Changes            |
|---------|------------|--------------------|
| 1.0     | 2026-02-06 | Initial release    |

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
APPROVAL
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Approved by: [HR Director Name]
Date: [Date]
```

### Đánh giá:
- ✅ Clear purpose và scope
- ✅ Specific rules với numbers
- ✅ Professional language
- ✅ Includes consequences
- **Kết quả: ACCEPT**

---

---

## 🔗 Related Skills
- [Job Description](./01_job_description.skill.md)
- [Onboarding Checklist](./04_onboarding_checklist.skill.md)

## 📜 Version History

| Version | Date | Changes |
|---|---|---|
| 1.0.1 | 2026-02-07 | Domain refinement: flow alignment + metadata |
| 1.0.0 | 2026-02-07 | Initial standardized metadata + example/related sections |

## 🔗 Next Step

Sau khi hoàn thành **Policy Documentation**, tiếp tục với:
→ [Job Description](./01_job_description.skill.md)

---

*CVF Skill Library v1.5.2 | HR & Operations Domain*