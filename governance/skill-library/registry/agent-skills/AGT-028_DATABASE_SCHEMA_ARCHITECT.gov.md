# AGT-028: Database Schema Architect

Text Encoding Exception: preserves pre-existing Unicode punctuation and symbols during semantic-preserving structural normalization.

> **Version:** 1.0.0
> **Status:** Active
> **Category:** App Development — Data Layer
> **Provenance:** claudekit-skills/databases (mrgoonie/claudekit-skills)

---

## Source

- **Source:** [mrgoonie/claudekit-skills](https://github.com/mrgoonie/claudekit-skills) — databases (MongoDB, PostgreSQL, schema design, optimization)
- **Source:** [davila7/claude-code-templates](https://github.com/davila7/claude-code-templates) — database agents and migration patterns
- **Pattern Type:** Framework-level database architecture methodology
- **CVF Adaptation:** Added governance constraints, decision trees, migration workflow, optimization protocol
- **License:** MIT (sources) → CC BY-NC-ND 4.0 (CVF adaptation)

---

## Capability

Database design methodology that guides agents through **schema design, database selection, migration strategy, and query optimization**. Provides decision frameworks not reference docs — the agent uses trade-off analysis to choose between relational vs document models, design indexes, and plan migrations.

**Key Principle:** Schema design is the foundation. A bad schema choice creates performance debt that compounds with scale.

### Database Selection Decision Tree

```
CHOOSING A DATABASE?
│
├─ Need ACID transactions + complex joins?
│   └─ PostgreSQL
│       └─ Financial, e-commerce, ERP, CRM
│
├─ Schema changes frequently + nested data?
│   └─ MongoDB
│       └─ CMS, catalogs, user profiles, IoT
│
├─ Need both? (common in modern apps)
│   └─ PostgreSQL (primary) + MongoDB (flexibility)
│       └─ PostgreSQL: users, orders, payments
│       └─ MongoDB: product catalogs, content, logs
│
├─ Key-value caching + sessions?
│   └─ Redis
│       └─ Sessions, caching, rate limiting, queues
│
├─ Full-text search + analytics?
│   └─ Elasticsearch / OpenSearch
│       └─ Search, log aggregation, metrics
│
└─ Time-series data?
    └─ TimescaleDB (Postgres extension) / InfluxDB
        └─ IoT sensors, monitoring, financial ticks
```

### Schema Design Patterns

#### Relational (PostgreSQL)

```
Normalization Levels:
  1NF → Eliminate repeating groups → Atomic values
  2NF → Remove partial dependencies → Full key dependency
  3NF → Remove transitive dependencies → Direct key dependency

  Rule: Normalize to 3NF, then selectively denormalize for performance

Common Patterns:
  ┌─────────────┐     ┌──────────────┐     ┌─────────────┐
  │   users      │     │   orders      │     │ order_items  │
  │─────────────│     │──────────────│     │─────────────│
  │ id (PK)     │──┐  │ id (PK)      │──┐  │ id (PK)     │
  │ email (UQ)  │  └─>│ user_id (FK) │  └─>│ order_id(FK)│
  │ name        │     │ status       │     │ product_id  │
  │ created_at  │     │ total        │     │ quantity    │
  └─────────────┘     │ created_at   │     │ price       │
                      └──────────────┘     └─────────────┘

Key Constraints:
  □ Every table has a PRIMARY KEY (use UUID or SERIAL)
  □ FOREIGN KEY for every relationship
  □ UNIQUE constraint on natural keys (email, slug)
  □ NOT NULL on required fields
  □ CHECK constraints for business rules
  □ DEFAULT values for timestamps, status
```

#### Document (MongoDB)

```
Embedding vs Referencing:

  EMBED when:
    □ 1-to-few relationship (user → addresses, max ~5)
    □ Data always accessed together
    □ Child doesn't exist independently
    □ Document stays under 16MB

  REFERENCE when:
    □ 1-to-many (user → orders, potentially 1000s)
    □ Many-to-many (students ↔ courses)
    □ Child accessed independently
    □ Frequently updated subdocuments

Example — E-commerce Product:
  {
    _id: ObjectId("..."),
    name: "MacBook Pro",
    slug: "macbook-pro",
    price: { amount: 2499, currency: "USD" },
    // EMBED: few variants, always shown
    variants: [
      { sku: "MBP-16-512", storage: "512GB", color: "Silver" },
      { sku: "MBP-16-1TB", storage: "1TB", color: "Space Gray" }
    ],
    // EMBED: small, rarely changes
    specs: { processor: "M4 Pro", ram: "18GB", display: "16-inch" },
    // REFERENCE: many reviews, accessed separately
    category_id: ObjectId("..."),
    // Don't embed: reviews grow unbounded
  }
```

### Index Strategy

```
PostgreSQL Index Types:
  B-tree (default)  → Equality, range, sort (most queries)
  Hash              → Equality only (rarely better than B-tree)
  GIN               → JSONB, arrays, full-text search
  GiST              → Geometry, range types

MongoDB Index Types:
  Single field       → { email: 1 }
  Compound          → { status: 1, createdAt: -1 }
  Text              → { name: "text", description: "text" }
  Geospatial        → { location: "2dsphere" }

Indexing Rules:
  □ Index all foreign keys (PostgreSQL)
  □ Index fields used in WHERE/FIND clauses
  □ Compound index: filter fields first, sort fields last
  □ Cover queries when possible (include all selected fields)
  □ Monitor with EXPLAIN ANALYZE (PG) / explain() (Mongo)

Anti-Patterns:
  ✗ Index every field (write overhead)
  ✗ Unused indexes (bloat, slower writes)
  ✗ Missing index on FK (slow joins)
  ✗ Wrong compound index order (selectivity matters)
```

### Migration Strategy

```
Migration Workflow:
  1. Generate migration file (timestamped)
     └─ 20260217_001_add_user_avatar.sql

  2. Write UP migration (forward)
     └─ ALTER TABLE users ADD COLUMN avatar_url TEXT;

  3. Write DOWN migration (rollback)
     └─ ALTER TABLE users DROP COLUMN avatar_url;

  4. Test migration on staging (ALWAYS)
     └─ Run UP → verify → run DOWN → verify → run UP again

  5. Apply to production
     └─ During low-traffic window
     └─ With application backward-compatible

Rules:
  □ NEVER modify a deployed migration (create new one)
  □ ALWAYS write rollback migration
  □ ALWAYS test on staging first
  □ Small, focused migrations (one concern each)
  □ No data + schema changes in same migration
  □ Lock-safe: avoid long table locks on large tables
     └─ PostgreSQL: CREATE INDEX CONCURRENTLY
     └─ ADD COLUMN with DEFAULT in PG 11+ is instant
```

### Query Optimization Workflow

```
SLOW QUERY DETECTED?
│
├─ 1. Measure: EXPLAIN ANALYZE (PG) / .explain("executionStats") (Mongo)
│
├─ 2. Check scan type:
│   ├─ Seq Scan / COLLSCAN → Missing index
│   ├─ Index Scan → OK, check rows filtered
│   └─ Index Only Scan → Optimal (covering index)
│
├─ 3. Check rows:
│   ├─ Rows estimated >> actual → Stale statistics
│   │   └─ ANALYZE table (PG) / compact+reindex (Mongo)
│   └─ Too many rows returned → Add WHERE / limit
│
├─ 4. Fix:
│   ├─ Add missing index
│   ├─ Rewrite query (avoid SELECT *, use specific columns)
│   ├─ Add connection pooling (pgBouncer)
│   └─ Consider materialized view for complex aggregations
│
└─ 5. Verify: re-run EXPLAIN, confirm improvement
```

### Connection Management

| Setting | Dev | Staging | Production |
|---------|-----|---------|------------|
| Pool size | 5 | 20 | 50-100 |
| Idle timeout | 30s | 30s | 10s |
| Connection timeout | 5s | 3s | 2s |
| Statement timeout | — | 30s | 10s |
| Tool | Direct | pgBouncer | pgBouncer (transaction mode) |

---

## Governance

| Field | Value |
|-------|-------|
| Risk Level | **R1 – Low** |
| Autonomy | Auto + Audit |
| Category | App Development — Data Layer |

### Authority Mapping

| Role | Permission |
|------|-----------|
| Orchestrator | Full: choose database, approve schema |
| Architect | Full: design schema, define indexes, migration strategy |
| Builder | Execute: implement schema, write queries |
| Reviewer | Audit: review schema design, migration safety |

### Phase Applicability

| Phase | Usage |
|-------|-------|
| A – Discovery | Identify data requirements, choose database |
| B – Design | Schema design, index strategy (PRIMARY) |
| C – Build | Implement schema, write migrations |
| D – Review | Audit schema quality, query performance |

---

## Risk Justification

- R1 classification: design guidance, no direct database access
- MUST use decision tree for database selection (not preference)
- MUST normalize to 3NF before considering denormalization
- MUST write rollback for every migration
- MUST test migrations on staging before production
- MUST index all foreign keys and common query fields
- MUST NOT run data mutations in schema migrations

---

## Constraints

- MUST use decision tree for database selection (not preference)
- MUST normalize to 3NF before considering denormalization
- MUST write rollback for every migration
- MUST test migrations on staging before production
- MUST index all foreign keys and common query fields
- MUST NOT run data mutations in schema migrations
- R1 classification: design guidance, no direct database access

---

## Dependencies

- **AGT-025** (API Architecture) — API ↔ database alignment
- **AGT-023** (Systematic Debugging) — Debug query issues
- **AGT-027** (Security & Auth Guard) — Data protection, encryption

---

## Validation

### Success Criteria

| Criterion | Target |
|-----------|--------|
| Schema normalization | 3NF baseline |
| Migration rollback coverage | 100% migrations have DOWN |
| Index coverage | All FKs and common queries indexed |
| Query performance | P95 <100ms for standard queries |
| Migration test coverage | 100% tested on staging |

---

## UAT Binding

**UAT Link:** `governance/skill-library/uat/results/UAT-AGT-028.md`

**PASS criteria:**
- [ ] Schema normalized to 3NF baseline
- [ ] 100% of migrations have a DOWN/rollback
- [ ] All foreign keys and common query fields indexed
- [ ] 100% of migrations tested on staging before production

**FAIL criteria:**
- [ ] Migration deployed without a rollback path
- [ ] Migration applied to production without staging test
- [ ] Data mutation bundled into a schema migration
- [ ] Foreign key missing an index

---

*Last Updated: February 17, 2026*
