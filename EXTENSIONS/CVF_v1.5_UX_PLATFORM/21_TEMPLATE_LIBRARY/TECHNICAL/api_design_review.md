# 📡 API Design Review Template

**Domain:** Technical  
**Preset:** `technical`

---

## Mô tả ngắn

Review thiết kế API về consistency, usability, và best practices.

---

## Khi nào dùng

- New API design review
- API versioning decisions
- Breaking changes assessment
- Developer experience improvement

---

## Form Fields

| Field | Required | Type | Mô tả |
|-------|:--------:|------|-------|
| API Spec | ✅ | textarea/file | OpenAPI/Swagger hoặc mô tả |
| Type | ✅ | select | REST/GraphQL/gRPC |
| Audience | ❌ | text | Internal/External/Partner |
| Existing APIs | ❌ | textarea | APIs hiện có để compare |

---

## Intent Pattern

```
INTENT:
Tôi cần review thiết kế API [tên API].

CONTEXT:
- Type: [REST/GraphQL/gRPC]
- Spec: [OpenAPI spec hoặc mô tả endpoints]
- Audience: [internal/external/partner]
- Current APIs: [APIs hiện có để maintain consistency]

SUCCESS CRITERIA:
- Consistency check
- Naming conventions
- Error handling review
- Versioning strategy
- Security considerations
```

---

## Output Expected

```markdown
## API Design Review: [API Name]

### Overall Assessment
- **Score:** [A/B/C/D]
- **Consistency:** [Good/Needs Work]
- **Developer Experience:** [Good/Needs Work]

### Endpoint Review
| Endpoint | Method | Issues | Recommendation |
|----------|:------:|--------|----------------|
| `/users` | GET | ✅ OK | - |
| `/user/create` | POST | ⚠️ Naming | Use `/users` |

### Naming Conventions
- ✅ [What's good]
- ⚠️ [What needs improvement]

### Request/Response Patterns
[Consistency analysis]

### Error Handling
| Case | Current | Recommended |
|------|---------|-------------|
| Not Found | 200 + error | 404 |
| Validation | 500 | 400 + details |

### Security
- Authentication: [review]
- Authorization: [review]
- Rate Limiting: [review]

### Versioning Strategy
[Current vs recommended]

### Breaking Changes
[Potential breaking changes if any]

### Recommendations
1. [High priority]
2. [Medium priority]
```

---

## Examples

### Ví dụ: E-commerce API

```
INTENT:
Tôi cần review thiết kế REST API cho e-commerce platform.

CONTEXT:
- Type: REST
- Endpoints: Orders, Products, Users, Payments
- Audience: External developers (marketplace)
- Current: Legacy v1 API đang deprecate

SUCCESS CRITERIA:
- RESTful best practices
- Pagination standards
- Error response format
- SDK-friendliness
```

---

*Template thuộc CVF v1.5 UX Platform*
