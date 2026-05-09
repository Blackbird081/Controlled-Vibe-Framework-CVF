# CVF ECO v1.0 — Intent Validation

> **Type:** Ecosystem Extension (Track III, Phase 2)
> **Status:** Active
> **Date:** 2026-03-09
> **Blueprint:** `docs/concepts/CVF_HIERARCHICAL_GOVERNANCE_PIPELINE.md` §5 (Triple-S)
> **Roadmap:** Task 2.1 — Intent Validation Module

---

## Purpose

Translates natural language "Vibes" (human intent) into enforceable governance constraints using the **Triple-S Architecture**:

```
S1: SEMANTIC  — Parse natural language → extract domain, action, limits
S2: SCHEMATIC — Convert to structured Policy JSON Schema
S3: STRICT    — Generate hard constraints injected into agent runtime
```

## Architecture

```
User Vibe (natural language)
     │
     ▼
┌─────────────────────────────┐
│  S1: Semantic Parser        │  → IntentResult { domain, action, object, limits }
│  (intent.parser.ts)         │
└──────────────┬──────────────┘
               ▼
┌─────────────────────────────┐
│  S2: Schema Mapper          │  → GovernanceRule[] with enforcement levels
│  (schema.mapper.ts)         │
└──────────────┬──────────────┘
               ▼
┌─────────────────────────────┐
│  S3: Constraint Generator   │  → RuntimeConstraint[] (injectable)
│  (constraint.generator.ts)  │
└──────────────┬──────────────┘
               ▼
┌─────────────────────────────┐
│  Pipeline Orchestrator      │  → ValidatedIntent (full pipeline result)
│  (intent.pipeline.ts)       │
└─────────────────────────────┘
```

## Files

```
CVF_ECO_v1.0_INTENT_VALIDATION/
├── README.md
├── package.json
├── tsconfig.json
├── vitest.config.ts
├── src/
│   ├── intent.parser.ts          — S1: Semantic layer
│   ├── schema.mapper.ts          — S2: Schematic layer
│   ├── constraint.generator.ts   — S3: Strict layer
│   ├── intent.pipeline.ts        — Orchestrator
│   ├── domain.registry.ts        — Domain definitions
│   └── types.ts                  — Shared types
└── tests/
    ├── intent.parser.test.ts
    ├── schema.mapper.test.ts
    ├── constraint.generator.test.ts
    └── intent.pipeline.test.ts
```

## Usage

```typescript
import { IntentPipeline } from './src/intent.pipeline';

const pipeline = new IntentPipeline();

const result = pipeline.validate(
  "Never let Agent spend over $50/day on ads without asking me"
);

// result.intent   → { domain: "finance", action: "payment", object: "ads", ... }
// result.rules    → [{ type: "HARD_BLOCK", condition: "spend > 50/day" }]
// result.constraints → [{ maxDailySpend: 50, requireApproval: true }]
```

## Enforcement Levels

| Level | Behavior | Use Case |
|-------|----------|----------|
| `HARD_BLOCK` | Auto-block, no override | Financial limits, data deletion |
| `HUMAN_IN_THE_LOOP` | Pause + approval required | Risky investments, external transfer |
| `LOG_ONLY` | Allow but record for audit | Low-risk actions, monitoring |

## Cross-Reference

| Document | Role |
|----------|------|
| `docs/concepts/CVF_HIERARCHICAL_GOVERNANCE_PIPELINE.md` | Architecture blueprint |
| `ECOSYSTEM/strategy/CVF_UNIFIED_ROADMAP_2026.md` | Roadmap context |
| `governance/.../CVF_ECOSYSTEM_GOVERNANCE_CONTRACT.md` | Parent governance contract |
| `EXTENSIONS/CVF_v1.7_CONTROLLED_INTELLIGENCE/` | Reasoning + policy binding |
| `EXTENSIONS/CVF_v1.6.1_GOVERNANCE_ENGINE/` | Policy engine (Python) |
