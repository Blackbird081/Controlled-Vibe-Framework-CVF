# Tutorial: App Development Skills from claudekit-skills & claude-code-templates (AGT-025 → AGT-029)

**Time:** 30 minutes  
**Level:** Intermediate → Advanced  
**Prerequisites:** [Agent Platform set up](agent-platform.md), [Intelligence Skills v1.6.3 (AGT-021–024)](intelligence-skills-v3.md)  
**What you'll learn:** How to use 5 new app development skills — API architecture, full-stack testing, security & auth, database schema design, and frontend component patterns

---

## Overview

CVF v1.6.4 expands from **24 to 29 agent tools** after deep analysis of [claudekit-skills](https://github.com/Blackbird081/claudekit-skills) and [claude-code-templates](https://github.com/Blackbird081/claude-code-templates). These 5 new skills bring **production-grade app development methodology** into CVF's governance framework:

| Skill | What It Does | Risk | When to Use |
|-------|-------------|------|-------------|
| 🏗️ **AGT-025: API Architecture Designer** | REST/GraphQL/gRPC decision, microservices patterns | R1 | When designing API endpoints or backend architecture |
| 🧪 **AGT-026: Full-Stack Testing Engine** | 70-20-10 pyramid, CI gates, flakiness mitigation | R2 | When setting up or improving test strategy |
| 🛡️ **AGT-027: Security & Auth Guard** | OWASP Top 10 defense, OAuth 2.1, auth selection tree | R2 | When implementing authentication or hardening security |
| 🗄️ **AGT-028: Database Schema Architect** | DB selection, schema design, indexing, migrations | R1 | When designing or optimizing database schemas |
| ⚛️ **AGT-029: Frontend Component Forge** | Component architecture, Suspense patterns, feature org | R1 | When building React/frontend component systems |

---

## Updated Risk Distribution (29 Skills)

```
R0 (5 skills) ─── R1 (10 skills) ─── R2 (10 skills) ─── R3 (4 skills)
Safe/Auto         Low/Auto           Medium/Supervised    High/Manual
```

| Risk | New Skills | Approval | Who Can Use |
|------|------------|----------|-------------|
| **R1** (AGT-025, 028, 029) | API Architecture, Database Schema, Frontend Components | Automatic | All |
| **R2** (AGT-026, 027) | Full-Stack Testing, Security & Auth | Supervised | Orchestrator, Builder |

---

## Skill 1: API Architecture Designer (AGT-025)

### What It Does
Comprehensive methodology for designing APIs with a **decision tree** that routes to the right architecture pattern (REST, GraphQL, or gRPC) based on project constraints.

### When to Use
- Starting a new backend service or microservice
- Migrating from monolith to microservices
- Choosing between REST, GraphQL, and gRPC
- Designing error handling contracts and versioning strategy

### Key Concept: API Style Decision Tree
```
Need real-time streaming? ──Yes──→ gRPC (Protocol Buffers)
         │No
Client needs flexible queries? ──Yes──→ GraphQL (Schema-first)
         │No
Standard CRUD with caching? ──Yes──→ REST (OpenAPI 3.1)
```

### Microservices Patterns Available
| Pattern | When | Example |
|---------|------|---------|
| API Gateway | Multiple clients, rate limiting | Kong, AWS API Gateway |
| BFF (Backend-for-Frontend) | Different UIs need different data shapes | Mobile BFF, Web BFF |
| CQRS | Read/write patterns differ significantly | Separate read/write models |
| Event Sourcing | Full audit trail required | Financial transactions |
| Saga | Distributed transactions | Cross-service orders |
| Circuit Breaker | Cascading failure prevention | Resilience4j, Polly |

### Chat Prompt Examples
```
"Design a REST API for a multi-tenant SaaS product catalog"
"Should I use GraphQL or REST for this mobile app with complex nested data?"
"Set up error handling contracts for our microservice API"
"Review my API versioning strategy — am I handling breaking changes correctly?"
```

---

## Skill 2: Full-Stack Testing Engine (AGT-026)

### What It Does
Enforces the **70-20-10 testing pyramid** with a 4-gate CI system that progressively validates code quality from unit tests through to production readiness.

### When to Use
- Setting up test infrastructure for a new project
- Improving test coverage and reducing flaky tests
- Building CI/CD quality gates
- Performance testing with load simulation

### Key Concept: Testing Pyramid 70-20-10
```
           ╱╲          E2E (10%)
          ╱  ╲         Playwright, critical paths only
         ╱    ╲
        ╱──────╲       Integration (20%)
       ╱        ╲      API contracts, DB queries
      ╱          ╲
     ╱────────────╲    Unit (70%)
    ╱              ╲   Vitest, pure functions, fast
```

### 4-Gate CI System
| Gate | Tests | Threshold | Blocks |
|------|-------|-----------|--------|
| **Gate 1** | Unit tests | 80% coverage | Merge to dev |
| **Gate 2** | Integration tests | All contracts pass | Merge to staging |
| **Gate 3** | E2E critical paths | 100% pass, ≤2% flaky | Deploy to staging |
| **Gate 4** | Load + security + a11y | p95 < 200ms, 0 critical | Deploy to prod |

### Flakiness Mitigation Protocol
```
1. Quarantine flaky test immediately (move to .flaky.test.ts)
2. Add retry(3) annotation with exponential backoff
3. Root cause → fix within 48 hours or delete
4. Track flakiness rate: target < 1% of all runs
```

### Chat Prompt Examples
```
"Set up a Vitest + Playwright testing pyramid for my Next.js app"
"My CI has 12% flaky tests — help me apply the flakiness mitigation protocol"
"Design integration tests for my REST API with database assertions"
"Create a k6 load test for checkout flow — target 1000 concurrent users"
```

---

## Skill 3: Security & Auth Guard (AGT-027)

### What It Does
Provides an **auth method selection decision tree** and **OWASP Top 10 defense matrix** for implementing production-grade authentication and security hardening.

### When to Use
- Implementing user authentication from scratch
- Adding OAuth, SSO, or multi-factor authentication
- Security auditing an existing application
- Hardening API endpoints and headers

### Key Concept: Auth Method Selection Tree
```
Internal users only? ──Yes──→ SSO / SAML
         │No
API-to-API? ──Yes──→ mTLS / API Key (rotation every 90 days)
         │No
Mobile app? ──Yes──→ OAuth 2.1 + PKCE
         │No
Quick onboarding priority? ──Yes──→ Magic Links (email-based)
         │No
High-security requirement? ──Yes──→ Passkeys (WebAuthn) + 2FA backup
         │No
Standard web app ──→ OAuth 2.1 + JWT (15m access / 7d refresh)
```

### OWASP Top 10 (2025) Defense Matrix
| # | Threat | Defense |
|---|--------|---------|
| A01 | Broken Access Control | RBAC enforcement, principle of least privilege |
| A02 | Cryptographic Failures | TLS 1.3+, AES-256-GCM, Argon2id for passwords |
| A03 | Injection | Parameterized queries, input validation, CSP |
| A07 | Auth Failures | Account lockout (5 attempts/15min), 2FA enforcement |

### Security Headers Checklist
```
Strict-Transport-Security: max-age=63072000; includeSubDomains; preload
Content-Security-Policy: default-src 'self'; script-src 'self'
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: camera=(), microphone=(), geolocation=()
X-XSS-Protection: 0  (rely on CSP instead)
Cross-Origin-Opener-Policy: same-origin
```

### Chat Prompt Examples
```
"Set up OAuth 2.1 with JWT for my Next.js app — 15-minute access tokens"
"Run a security audit against OWASP Top 10 for my Express.js API"
"Add rate limiting to my login endpoint — 5 attempts per 15 minutes"
"Implement passkey (WebAuthn) authentication as primary login method"
```

---

## Skill 4: Database Schema Architect (AGT-028)

### What It Does
Database selection decision tree and schema design methodology covering **relational (PostgreSQL)** and **document (MongoDB)** patterns, with indexing, migration, and optimization strategies.

### When to Use
- Choosing between PostgreSQL, MongoDB, Redis, or other databases
- Designing schemas for a new application
- Optimizing slow queries or adding indexes
- Planning database migrations safely

### Key Concept: Database Selection Tree
```
Need ACID transactions? ──Yes──→ PostgreSQL
         │No
Flexible/evolving schema? ──Yes──→ MongoDB
         │No
Key-value caching? ──Yes──→ Redis
         │No
Full-text search? ──Yes──→ Elasticsearch
         │No
Time-series data? ──Yes──→ TimescaleDB
```

### Schema Design Patterns
| Type | Pattern | Example |
|------|---------|---------|
| **Relational** | 3NF normalization | Users → Orders → Items (FK relationships) |
| **Document** | Embed if read together | `{ user: {...}, recentOrders: [...] }` |
| **Document** | Reference if independent | `{ userId: ObjectId, orderId: ObjectId }` |
| **Hybrid** | Denormalize for performance | Cache computed fields, invalidate on write |

### Index Strategy Quick Reference
| Query Pattern | PostgreSQL | MongoDB |
|--------------|-----------|---------|
| Exact match (=) | B-tree (default) | Single field |
| Range (>, <, BETWEEN) | B-tree | Single field |
| Full-text search | GIN (tsvector) | Text index |
| JSON/Array fields | GIN (jsonb) | Multikey |
| Geospatial | GiST (PostGIS) | 2dsphere |
| Composite queries | Multi-column B-tree | Compound index |

### Migration Workflow (5 Steps)
```
1. Schema version file → migrations/YYYYMMDD_description.sql
2. Review: check backward compatibility
3. Apply to staging with data verification
4. Blue-green deploy: old + new schema simultaneously
5. Cleanup: remove deprecated columns after 2 release cycles
```

### Chat Prompt Examples
```
"Design a PostgreSQL schema for a multi-tenant SaaS — users, teams, billing"
"Should I embed orders inside user documents or reference them separately?"
"Optimize this slow query — EXPLAIN ANALYZE shows sequential scan on 2M rows"
"Plan a zero-downtime migration to add a new nullable column with backfill"
```

---

## Skill 5: Frontend Component Forge (AGT-029)

### What It Does
Component architecture decision system for **React/Next.js** applications — covering feature organization, Suspense patterns, lazy loading, and design system integration.

### When to Use
- Setting up component architecture for a new React project
- Refactoring a component hierarchy that's grown unwieldy
- Adding code splitting and lazy loading
- Integrating a design system (MUI, Tailwind, Shadcn)

### Key Concept: Component Architecture Tree
```
Is it a page/route? ──────────────→ Route Component (app/page.tsx)
Is it a data container? ──────────→ Smart Component (use hooks, Suspense)
Is it a reusable UI piece? ───────→ Presentational Component (props only)
Is it a layout wrapper? ──────────→ Layout Component (app/layout.tsx)
Is it shared across features? ────→ Common Component (src/components/)
```

### Feature Directory Pattern
```
src/features/checkout/
├── components/        # Feature-specific UI
│   ├── CartSummary.tsx
│   ├── PaymentForm.tsx
│   └── OrderConfirmation.tsx
├── hooks/             # Feature logic
│   ├── useCart.ts
│   └── usePayment.ts
├── api/               # Feature API calls
│   └── checkout-api.ts
├── types/             # Feature types
│   └── checkout.types.ts
├── utils/             # Feature helpers
│   └── price-calculator.ts
└── index.ts           # Public API (barrel export)
```

### Three Component Patterns (TypeScript)

**1. Standard Presentational Component**
```typescript
interface ProductCardProps {
  title: string;
  price: number;
  imageUrl: string;
  onAddToCart: () => void;
}

export function ProductCard({ title, price, imageUrl, onAddToCart }: ProductCardProps) {
  return (
    <div className="product-card">
      <img src={imageUrl} alt={title} loading="lazy" />
      <h3>{title}</h3>
      <p>${price.toFixed(2)}</p>
      <button onClick={onAddToCart}>Add to Cart</button>
    </div>
  );
}
```

**2. Suspense Data Component**
```typescript
import { Suspense } from 'react';

function ProductList() {
  return (
    <Suspense fallback={<ProductSkeleton count={6} />}>
      <ProductListContent />
    </Suspense>
  );
}

async function ProductListContent() {
  const products = await fetchProducts();  // Server component data fetch
  return products.map(p => <ProductCard key={p.id} {...p} />);
}
```

**3. Lazy Route Component**
```typescript
import { lazy, Suspense } from 'react';

const CheckoutPage = lazy(() => import('./features/checkout/CheckoutPage'));

// In router:
<Route path="/checkout" element={
  <Suspense fallback={<PageSkeleton />}>
    <CheckoutPage />
  </Suspense>
} />
```

### Anti-Patterns (NEVER Do These)
| ❌ Don't | ✅ Do Instead |
|----------|--------------|
| Props drilling > 3 levels | Use Context or state management |
| Business logic in components | Extract to custom hooks |
| Inline styles everywhere | Use design tokens / CSS modules |
| Giant 500+ line components | Split into feature sub-components |
| Import from deep paths | Use barrel exports (index.ts) |
| useEffect for data fetching | Use React Query / SWR / Server Components |

### Chat Prompt Examples
```
"Set up a feature directory structure for an e-commerce checkout flow"
"Refactor this 400-line component into smaller pieces with proper separation"
"Add Suspense boundaries and loading skeletons to my product listing"
"Design a component hierarchy for a dashboard with 5 widget types"
```

---

## Skill Interaction Map

These 5 skills work together in the app development lifecycle:

```
  AGT-025 (API Design)
       │
       ├────→ AGT-028 (Database) ──── Schema supports API data model
       │
       ├────→ AGT-029 (Frontend) ──── Components consume API
       │
       ├────→ AGT-027 (Security) ──── Auth protects API endpoints
       │
       └────→ AGT-026 (Testing) ──── Tests validate entire stack
```

### Typical Workflow Example
```
1. AGT-025: Design REST API for user management
2. AGT-028: Create PostgreSQL schema (users, sessions, roles)
3. AGT-027: Add OAuth 2.1 + JWT authentication layer
4. AGT-029: Build React components (LoginForm, UserProfile, Dashboard)
5. AGT-026: Set up testing pyramid (unit → integration → E2E)
```

---

## Governance Integration

All 5 skills are governed under CVF's standard risk/authority model:

| Skill | Risk | Why This Risk Level |
|-------|------|-------------------|
| AGT-025 | R1 (Auto) | Architecture guidance only, no destructive operations |
| AGT-026 | R2 (Supervised) | Executes tests, modifies CI pipelines |
| AGT-027 | R2 (Supervised) | Security-critical, auth configuration changes |
| AGT-028 | R1 (Auto) | Schema design guidance, no direct DB mutations |
| AGT-029 | R1 (Auto) | Component architecture guidance, file generation |

### Escalation Rule
If AGT-025 recommends microservices + AGT-028 requires multi-database setup → **escalate to R3** (requires Orchestrator approval for cross-service deployment).

---

## What's Next?

- Explore the full `.gov.md` specifications in [Agent Skills Registry](../../../governance/skill-library/registry/agent-skills/INDEX.md)
- Combine with [AGT-023 Systematic Debugging](intelligence-skills-v3.md) for end-to-end development workflows
- Use [AGT-019 Skill Progressive Loader](using-new-skills-v2.md) to load only the skills you need for each task
