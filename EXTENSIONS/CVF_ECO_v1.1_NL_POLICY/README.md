# CVF ECO v1.1 — Natural Language Policy

> **Type:** Ecosystem Extension (Track III, Phase 2)
> **Status:** Active
> **Date:** 2026-03-09
> **Blueprint:** `docs/concepts/CVF_HIERARCHICAL_GOVERNANCE_PIPELINE.md` §5-7
> **Roadmap:** Task 2.2 — Natural Language Policy
> **Depends on:** `CVF_ECO_v1.0_INTENT_VALIDATION`

---

## Purpose

Compiles natural language governance specifications ("Vibes") into structured **Policy-as-Code** documents that can be enforced at runtime. This is the bridge between human intent and machine-executable governance.

```text
Natural Language Spec (Vibe)
     │
     ▼
┌─────────────────────────────┐
│  Policy Compiler            │  → PolicyDocument with rules + metadata
│  (policy.compiler.ts)       │
└──────────────┬──────────────┘
               ▼
┌─────────────────────────────┐
│  Template Engine            │  → Pre-built policy templates (Finance, Privacy, etc.)
│  (template.engine.ts)       │
└──────────────┬──────────────┘
               ▼
┌─────────────────────────────┐
│  Policy Store               │  → Versioned policy storage + conflict detection
│  (policy.store.ts)          │
└──────────────┬──────────────┘
               ▼
┌─────────────────────────────┐
│  Policy Serializer          │  → JSON/YAML export for runtime consumption
│  (policy.serializer.ts)     │
└─────────────────────────────┘
```

## Files

```text
CVF_ECO_v1.1_NL_POLICY/
├── README.md
├── package.json
├── tsconfig.json
├── vitest.config.ts
├── src/
│   ├── types.ts                  — Policy types + interfaces
│   ├── policy.compiler.ts        — NL → PolicyDocument compiler
│   ├── template.engine.ts        — Pre-built policy templates
│   ├── policy.store.ts           — In-memory versioned store + conflict detect
│   └── policy.serializer.ts      — JSON export for runtime
└── tests/
    ├── policy.compiler.test.ts
    ├── template.engine.test.ts
    ├── policy.store.test.ts
    └── policy.serializer.test.ts
```

## Usage

```typescript
import { PolicyCompiler } from './src/policy.compiler';
import { TemplateEngine } from './src/template.engine';

const compiler = new PolicyCompiler();
const templates = new TemplateEngine();

// Compile from natural language
const policy = compiler.compile(
  "Never let any agent spend more than $500/day. " +
  "All external data transfers require my approval."
);

// Or use a pre-built template
const financePolicy = templates.instantiate("financial_governance", {
  max_daily_spend: 500,
  currency: "USD",
});
```

## Cross-Reference

| Document | Role |
|----------|------|
| `EXTENSIONS/CVF_ECO_v1.0_INTENT_VALIDATION/` | Upstream: parses vibes into intents |
| `docs/concepts/CVF_HIERARCHICAL_GOVERNANCE_PIPELINE.md` | Architecture blueprint (§5-7) |
| `governance/.../CVF_ECOSYSTEM_GOVERNANCE_CONTRACT.md` | Parent governance contract |
