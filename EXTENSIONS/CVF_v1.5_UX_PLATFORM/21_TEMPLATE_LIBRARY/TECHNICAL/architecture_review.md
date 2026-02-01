# 🏗️ Architecture Review Template

**Domain:** Technical  
**Preset:** `technical`

---

## Mô tả ngắn

Review kiến trúc hệ thống về scalability, maintainability, và tradeoffs.

---

## Khi nào dùng

- Design review meetings
- System redesign
- Scalability assessment
- Technical due diligence

---

## Form Fields

| Field | Required | Type | Mô tả |
|-------|:--------:|------|-------|
| Architecture mô tả | ✅ | textarea | Mô tả hoặc diagram |
| Tech stack | ✅ | textarea | Technologies used |
| Scale requirements | ❌ | text | Users, requests/sec |
| Pain points | ❌ | textarea | Vấn đề hiện tại |

---

## Intent Pattern

```
INTENT:
Tôi cần review kiến trúc hệ thống [tên hệ thống].

CONTEXT:
- Architecture: [mô tả hoặc diagram]
- Tech Stack: [liệt kê technologies]
- Scale: [users, traffic, data volume]
- Current issues: [pain points nếu có]

SUCCESS CRITERIA:
- Đánh giá scalability
- Identify single points of failure
- Evaluate operational complexity
- Recommendations có tính khả thi
```

---

## Output Expected

```markdown
## Architecture Review: [System Name]

### Overview Diagram
[Mô tả lại architecture]

### Evaluation Matrix

| Aspect | Score | Notes |
|--------|:-----:|-------|
| Scalability | ⭐⭐⭐ | [notes] |
| Reliability | ⭐⭐ | [notes] |
| Maintainability | ⭐⭐⭐ | [notes] |
| Security | ⭐⭐ | [notes] |
| Cost | ⭐⭐⭐ | [notes] |

### Critical Issues
1. **[Issue]** - [impact và recommendation]

### Single Points of Failure
- [SPOF 1]
- [SPOF 2]

### Scalability Analysis
[Bottlenecks và solutions]

### Recommendations
| Priority | Action | Effort | Impact |
|:--------:|--------|:------:|:------:|
| 1 | [action] | Medium | High |

### Trade-offs to Consider
[Các trade-offs khi implement recommendations]
```

---

## Examples

### Ví dụ: Microservices

```
INTENT:
Tôi cần review kiến trúc microservices của e-commerce platform.

CONTEXT:
- Architecture: 12 services, API Gateway, Event Bus
- Tech Stack: Kubernetes, gRPC, PostgreSQL, Redis
- Scale: 1M users, 10k orders/day
- Issues: Latency cao, deployment phức tạp

SUCCESS CRITERIA:
- Evaluate service boundaries
- Identify latency causes
- Simplification opportunities
```

---

*Template thuộc CVF v1.5 UX Platform*
