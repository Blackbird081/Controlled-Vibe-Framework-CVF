# Code Review

> **Domain:** Technical Review  
> **Difficulty:** ⭐⭐ Medium  
> **CVF Version:** v1.5.2
> **Skill Version:** 1.0.0  
> **Last Updated:** 2026-02-07

---

## 📌 Prerequisites

Không yêu cầu.

---

## 🎯 Mục đích

**Khi nào dùng skill này:**
- Review pull requests
- Đánh giá code changes
- Tìm bugs và issues
- Suggest improvements
- Check coding standards

**Không phù hợp khi:**
- Review kiến trúc hệ thống → Architecture Review
- Security-focused review → Security Audit
- Performance tuning → Cần profiling tools

---

## 📋 Form Input

| Field | Mô tả | Bắt buộc | Ví dụ |
|-------|-------|:--------:|-------|
| **Code/PR** | Code cần review | ✅ | [paste code or link] |
| **Context** | Mục đích của change | ✅ | "Add user authentication" |
| **Language** | Programming language | ✅ | "TypeScript" |
| **Focus areas** | Cần chú ý gì? | ❌ | "Security, error handling" |
| **Standards** | Coding standards | ❌ | "Airbnb style guide" |

---

## ✅ Expected Output

**Kết quả:**
- Summary of changes
- Issues found (categorized)
- Suggestions for improvement
- Overall assessment

**Cấu trúc output:**
```
CODE REVIEW REPORT

1. SUMMARY
   - What the code does
   - Files changed
   - Overall impression

2. CRITICAL ISSUES
   🔴 Issue 1: [description]
      Line X: [code]
      Fix: [suggestion]

3. MAJOR ISSUES
   🟠 Issue 1: [description]
      
4. MINOR ISSUES / SUGGESTIONS
   🟡 Suggestion 1: [description]

5. POSITIVE NOTES
   ✅ Good: [what was done well]

6. VERDICT
   [ ] Ready to merge
   [ ] Needs minor fixes
   [ ] Needs major revision
```

---

## 🔍 Cách đánh giá

**Checklist Accept/Reject:**

- [ ] All critical issues identified
- [ ] Suggestions are actionable
- [ ] Considers context provided
- [ ] Not too nitpicky
- [ ] Acknowledges good practices
- [ ] Clear verdict

**Red flags (cần Reject):**
- ⚠️ Missing obvious bugs
- ⚠️ Too vague suggestions
- ⚠️ Ignores context
- ⚠️ Only negative, no positives

---

## ⚠️ Common Failures

| Lỗi thường gặp | Cách phòng tránh |
|----------------|------------------|
| Review quá surface-level | Provide focus areas |
| Missing security issues | Explicitly ask for security check |
| Too many style nits | Specify focus on logic, not style |
| Ignores error handling | Include in focus areas |

---

## 💡 Tips

1. **Provide context** — Reviewer cần hiểu mục đích
2. **Specify focus** — Security? Performance? Logic?
3. **Include test files** — Để check coverage
4. **Mention standards** — Style guide nếu có
5. **Ask for alternatives** — "Is there a better way?"

---

## 📊 Ví dụ thực tế

### Input mẫu:
```
Code:
```typescript
async function login(email: string, password: string) {
  const user = await db.users.findOne({ email });
  if (user.password === password) {
    return { token: generateToken(user) };
  }
  return { error: 'Invalid' };
}
```

Context: User login endpoint
Language: TypeScript
Focus areas: Security, error handling
```

### Output mẫu:
```
CODE REVIEW: Login Function

1. SUMMARY
   Simple login function that checks password and returns token.
   Overall: Has significant security issues.

2. CRITICAL ISSUES
   
   🔴 Plain text password comparison
      Line 3: `user.password === password`
      Risk: Passwords stored/compared in plain text
      Fix: Use bcrypt.compare() with hashed passwords
      
   🔴 Timing attack vulnerability
      Risk: Password comparison time reveals info
      Fix: Use constant-time comparison

   🔴 No null check for user
      Line 2: `const user = await db.users.findOne`
      Risk: Will throw if user not found
      Fix: Add null check before accessing user.password

3. MAJOR ISSUES
   
   🟠 Generic error message not logged
      Risk: Can't debug failed logins
      Fix: Log attempt (without password) for monitoring

4. MINOR SUGGESTIONS
   
   🟡 Return consistent error structure
      Current: `{ error: 'Invalid' }`
      Suggest: Typed error with code
      
   🟡 Add rate limiting (outside this function)
      Prevent brute force attacks

5. POSITIVE NOTES
   ✅ Async/await used correctly
   ✅ Simple and readable

6. VERDICT
   ❌ Needs major revision
   
   Priority fixes:
   1. Hash passwords with bcrypt
   2. Add null check for user
   3. Use constant-time comparison
```

### Đánh giá:
- ✅ Found critical security issues
- ✅ Actionable fixes provided
- ✅ Prioritized by severity
- ✅ Also noted positives
- **Kết quả: ACCEPT**

---

---

## 🔗 Related Skills
- [Architecture Review](./02_architecture_review.skill.md)
- [Security Audit](./03_security_audit.skill.md)

## 📜 Version History

| Version | Date | Changes |
|---|---|---|
| 1.0.1 | 2026-02-07 | Domain refinement: flow alignment + metadata |
| 1.0.0 | 2026-02-07 | Initial standardized metadata + example/related sections |

## 🔗 Next Step

Sau khi hoàn thành **Code Review**, tiếp tục với:
→ [Architecture Review](./02_architecture_review.skill.md)

---

*CVF Skill Library v1.5.2 | Technical Review Domain*
