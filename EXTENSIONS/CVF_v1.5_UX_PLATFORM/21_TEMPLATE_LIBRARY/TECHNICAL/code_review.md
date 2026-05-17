# 🔍 Code Review Template

**Domain:** Technical  
**Preset:** `technical`

---

## Mô tả ngắn

Review code về quality, patterns, bugs, và best practices.

---

## Khi nào dùng

- Pull request review
- Code audit
- Refactoring assessment
- Onboarding review

---

## Form Fields

| Field | Required | Type | Mô tả |
|-------|:--------:|------|-------|
| Code/File | ✅ | textarea/file | Code cần review |
| Language | ✅ | select | Python/JS/Go/etc. |
| Focus areas | ❌ | multiselect | Security/Performance/Style |
| Context | ❌ | textarea | Mục đích của code |

---

## Intent Pattern

```
INTENT:
Tôi cần review code [ngôn ngữ] về [focus areas].

CONTEXT:
- Language: [ngôn ngữ]
- Framework: [nếu có]
- Mục đích: [code này làm gì]
- Size: [số lines ước tính]
- Focus: [security/performance/style/bugs]

SUCCESS CRITERIA:
- Issues categorized theo severity
- Actionable recommendations
- Highlight positive patterns
```

---

## Output Expected

```markdown
## Code Review: [File/Module]

### Summary
- **Overall Quality:** [Good/Needs Improvement/Critical Issues]
- **Critical Issues:** [số]
- **Warnings:** [số]
- **Suggestions:** [số]

### Critical Issues 🔴
1. **[Issue Title]**
   - Location: `line X-Y`
   - Problem: [mô tả]
   - Fix: [cách fix]

### Warnings 🟡
1. **[Warning]** - [chi tiết]

### Suggestions 🟢
1. **[Suggestion]** - [chi tiết]

### Positive Patterns ✅
- [Pattern 1]
- [Pattern 2]

### Next Steps
1. [Priority action]
```

---

## Examples

### Ví dụ: Python API

```
INTENT:
Tôi cần review code Python về security và best practices.

CONTEXT:
- Language: Python 3.11
- Framework: FastAPI
- Mục đích: Authentication module
- Focus: Security, OWASP compliance

SUCCESS CRITERIA:
- Identify security vulnerabilities
- Check input validation
- Review error handling
```

---

*Template thuộc CVF v1.5 UX Platform*
