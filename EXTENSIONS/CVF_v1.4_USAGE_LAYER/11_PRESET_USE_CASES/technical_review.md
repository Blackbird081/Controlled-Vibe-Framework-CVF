# 🔍 Technical Review Preset

**CVF v1.4 – Usage Layer**

---

## Mục tiêu

Preset này dùng khi người dùng cần **review kỹ thuật** về code, architecture, hoặc technical decisions.

---

## Khi nào dùng

- Code review
- Architecture review
- Security assessment
- Performance analysis
- Best practices check

---

## Intent Template

```
INTENT:
Tôi cần review [code/architecture/design] về [mục tiêu review]

CONTEXT:
- Loại: [code/architecture/security/performance]
- Stack: [languages, frameworks]
- Focus areas: [liệt kê ưu tiên]
- Constraints: [performance targets, security requirements]

SUCCESS CRITERIA:
- Issues được categorize theo severity
- Có actionable recommendations
- Highlight cả positive patterns
```

---

## Output Format kỳ vọng

```markdown
## Technical Review: [Subject]

### Summary
- **Overall Quality:** [Good/Needs Improvement/Critical Issues]
- **Critical Issues:** [số]
- **Warnings:** [số]
- **Suggestions:** [số]

### Critical Issues 🔴
1. **[Issue Title]**
   - Location: [file/line/component]
   - Problem: [mô tả]
   - Recommendation: [cách fix]
   - Impact: [nếu không fix]

### Warnings 🟡
1. **[Warning Title]**
   - [Details...]

### Suggestions 🟢
1. **[Suggestion Title]**
   - [Details...]

### Positive Patterns ✅
- [Pattern 1]
- [Pattern 2]

### Next Steps
1. [Priority 1 action]
2. [Priority 2 action]
```

---

## Ví dụ thực tế

### Ví dụ 1: Code Review

```
INTENT:
Tôi cần review Python code cho authentication module.

CONTEXT:
- Stack: Python 3.11, FastAPI, JWT
- Focus: Security, best practices
- Size: ~500 lines

SUCCESS CRITERIA:
- Identify security vulnerabilities
- Check OWASP compliance
- Suggest improvements
```

### Ví dụ 2: Architecture Review

```
INTENT:
Tôi cần review microservices architecture proposal.

CONTEXT:
- Stack: Kubernetes, gRPC, PostgreSQL
- Scale target: 10M requests/day
- Team size: 8 developers

SUCCESS CRITERIA:
- Evaluate scalability
- Identify single points of failure
- Check operational complexity
```

### Ví dụ 3: Performance Review

```
INTENT:
Tôi cần review database queries cho optimization.

CONTEXT:
- Database: PostgreSQL 15
- Problem: Slow queries (> 5s)
- Tables: 10M+ rows

SUCCESS CRITERIA:
- Identify slow queries
- Suggest index improvements
- Estimate performance gain
```

---

## Điều KHÔNG nên làm

❌ "Code này có bug không?" (quá chung)  
❌ "Review và fix luôn cho tôi" (CVF không execute code)  
❌ "Hãy khen code của tôi" (bias request)  

---

## Review Types hỗ trợ

| Type | Focus | Output |
|------|-------|--------|
| **Code Review** | Quality, patterns, bugs | Issues + recommendations |
| **Security Review** | Vulnerabilities, OWASP | Risk assessment |
| **Architecture Review** | Scalability, maintainability | Trade-offs analysis |
| **Performance Review** | Bottlenecks, optimization | Prioritized fixes |
| **API Review** | Contract, consistency | Breaking changes |

---

## Severity Levels

| Level | Icon | Meaning |
|-------|:----:|---------|
| Critical | 🔴 | Must fix before deploy |
| Warning | 🟡 | Should fix, technical debt |
| Suggestion | 🟢 | Nice to have, improvements |
| Info | ℹ️ | FYI, no action needed |

---

*Preset này thuộc CVF v1.4 Usage Layer*