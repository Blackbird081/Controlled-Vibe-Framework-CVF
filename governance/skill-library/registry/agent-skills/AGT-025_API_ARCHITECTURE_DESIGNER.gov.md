# AGT-025: API Architecture Designer

> **Version:** 1.0.0  
> **Status:** Active  
> **Risk Level:** R1 – Low  
> **Autonomy:** Auto + Audit  
> **Category:** App Development  
> **Provenance:** claudekit-skills/backend-development + claude-code-templates/agents (davila7/claude-code-templates, mrgoonie/claudekit-skills)

---

## 📋 Overview

Framework-level methodology for **designing production-grade APIs** — choosing the right style (REST/GraphQL/gRPC), structuring endpoints, defining error contracts, and applying microservices patterns. Not a reference doc — a decision engine that guides the agent through architecture choices with trade-off analysis.

**Key Principle:** API design is a set of irreversible decisions. Get the architecture right before writing code.

---

## 🎯 Capabilities

### API Style Decision Matrix

| Need | Choose | Why |
|------|--------|-----|
| Public-facing CRUD | **REST** | Universal client support, caching, stateless |
| Flexible client queries | **GraphQL** | Avoid over/under-fetching, client-driven schema |
| Internal service-to-service | **gRPC** | Binary protocol, streaming, code generation |
| Real-time bidirectional | **WebSocket** | Low latency, persistent connection |
| Event-driven async | **Message Queue** (Kafka/RabbitMQ) | Decoupled, resilient |

### REST API Design Methodology

```
1. Resource Identification
   └─ Nouns, not verbs: /users, /orders, /products
   └─ Hierarchical: /users/{id}/orders
   └─ Max 3 levels deep

2. HTTP Method Mapping
   └─ GET (read), POST (create), PUT (full update), PATCH (partial), DELETE

3. Response Envelope
   └─ Success: { data, meta, pagination }
   └─ Error: { error: { code, message, details, requestId } }

4. Versioning Strategy
   └─ URL path (/v1/) for breaking changes
   └─ Header (Accept-Version) for minor versions

5. Pagination
   └─ Cursor-based for infinite scroll (recommended)
   └─ Offset-based for page navigation
```

### GraphQL Design Methodology

```
1. Schema-First Design
   └─ Define types → Queries → Mutations → Subscriptions
   └─ Input types for mutations (not individual args)

2. Federation Strategy (Microservices)
   └─ Entity boundaries = service boundaries
   └─ @key directive for cross-service references

3. Performance Guards
   └─ Query depth limiting (max 10)
   └─ Query complexity analysis
   └─ DataLoader for N+1 prevention
   └─ Persisted queries for production
```

### Error Handling Contract

```typescript
// Standard Error Response
interface APIError {
  error: {
    code: string;        // Machine-readable: "VALIDATION_ERROR"
    message: string;     // Human-readable: "Email is required"
    details?: object[];  // Field-level errors
    requestId: string;   // For tracing
    timestamp: string;   // ISO 8601
  };
}

// HTTP Status Mapping
// 400 → Validation errors (client can fix)
// 401 → Authentication required
// 403 → Authorization denied
// 404 → Resource not found
// 409 → Conflict (duplicate, version mismatch)
// 422 → Unprocessable (business logic rejection)
// 429 → Rate limited (include Retry-After header)
// 500 → Internal error (log, don't expose details)
```

### Microservices Patterns

| Pattern | When to Use | Trade-off |
|---------|-------------|-----------|
| **API Gateway** | Multiple backend services | Single entry point, but single point of failure |
| **BFF (Backend for Frontend)** | Different clients need different shapes | Optimal per-client, but more maintenance |
| **CQRS** | Read/write patterns differ significantly | Scale independently, but eventual consistency |
| **Event Sourcing** | Need complete audit trail | Full history, but complex queries |
| **Saga Pattern** | Distributed transactions | Eventual consistency, but compensating actions |
| **Circuit Breaker** | Downstream service failures | Graceful degradation, but complexity |

### Implementation Checklist

```
API Design:
  □ Choose style (REST/GraphQL/gRPC) based on use case
  □ Define resource/schema structure
  □ Design error response contract
  □ Add input validation (Zod/Joi/class-validator)
  □ Implement rate limiting
  □ Add authentication (OAuth 2.1 + JWT)
  □ Write OpenAPI/GraphQL schema documentation
  □ Set up API versioning strategy

Quality:
  □ Add request/response logging
  □ Implement health check endpoint (/health)
  □ Add request ID tracing (X-Request-ID)
  □ Set up CORS properly
  □ Add compression (gzip/brotli)
  □ Implement idempotency keys for POST/PUT
  □ Load test critical endpoints
```

---

## 🔐 CVF Governance

### Authority Mapping

| Role | Permission |
|------|-----------|
| Orchestrator | Full: design API architecture, choose patterns |
| Architect | Full: define schemas, review patterns |
| Builder | Execute: implement designed APIs |
| Reviewer | Audit: verify API design quality |

### Phase Applicability

| Phase | Usage |
|-------|-------|
| A – Discovery | Identify API requirements, choose style |
| B – Design | Define schemas, error contracts, patterns |
| C – Build | Implement APIs following design |
| D – Review | Audit API quality, security |

### Constraints

- MUST choose API style based on decision matrix, not preference
- MUST define error contract before implementation
- MUST include rate limiting for all public APIs
- MUST document all endpoints (OpenAPI/GraphQL introspection)
- R1 classification: design guidance, no external I/O

---

## 🔗 Dependencies

- **AGT-023** (Systematic Debugging) — Debug API issues
- **AGT-027** (Security & Auth Guard) — Authentication patterns
- **AGT-028** (Database Schema Architect) — Data layer design

---

## 📊 Validation

### Success Criteria

| Criterion | Target |
|-----------|--------|
| API consistency score | ≥90% adherence to chosen style guide |
| Error handling coverage | 100% endpoints have error contracts |
| Documentation coverage | 100% endpoints documented |
| Breaking change prevention | Version strategy in place |

### UAT Link

`governance/skill-library/uat/results/UAT-AGT-025.md`

---

## 📚 Attribution

- **Source:** [mrgoonie/claudekit-skills](https://github.com/mrgoonie/claudekit-skills) — backend-development (API design, architecture)
- **Source:** [davila7/claude-code-templates](https://github.com/davila7/claude-code-templates) — API agents and patterns
- **Pattern Type:** Framework-level API architecture methodology
- **CVF Adaptation:** Added governance constraints, decision matrices, risk classification, implementation checklists
- **License:** MIT (sources) → CC BY-NC-ND 4.0 (CVF adaptation)

---

*Last Updated: February 17, 2026*
