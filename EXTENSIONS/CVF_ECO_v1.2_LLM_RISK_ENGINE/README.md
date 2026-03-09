# CVF ECO v1.2 — LLM Risk Engine

> **Type:** Ecosystem Extension (Track III, Phase 2)
> **Status:** Active
> **Date:** 2026-03-09
> **Blueprint:** `docs/concepts/CVF_HIERARCHICAL_GOVERNANCE_PIPELINE.md` §4-5
> **Roadmap:** Task 2.3 — LLM Risk Engine
> **Depends on:** `CVF_ECO_v1.0_INTENT_VALIDATION`, `CVF_ECO_v1.1_NL_POLICY`

---

## Purpose

Context-aware risk scoring engine that evaluates AI agent actions against governance policies. Produces risk assessments (R0-R3) with enforcement recommendations based on action context, domain sensitivity, historical patterns, and cumulative risk.

```text
Action Context
     │
     ▼
┌─────────────────────────────┐
│  Risk Scorer                │  → Base risk from domain + action type
│  (risk.scorer.ts)           │
└──────────────┬──────────────┘
               ▼
┌─────────────────────────────┐
│  Context Analyzer           │  → Contextual modifiers (time, frequency, target)
│  (context.analyzer.ts)      │
└──────────────┬──────────────┘
               ▼
┌─────────────────────────────┐
│  Risk Aggregator            │  → Cumulative risk tracking + session scoring
│  (risk.aggregator.ts)       │
└──────────────┬──────────────┘
               ▼
┌─────────────────────────────┐
│  Risk Assessment            │  → Final R0-R3 level + enforcement recommendation
│  (RiskAssessment output)    │
└─────────────────────────────┘
```

## Files

```text
CVF_ECO_v1.2_LLM_RISK_ENGINE/
├── README.md
├── package.json
├── tsconfig.json
├── vitest.config.ts
├── src/
│   ├── types.ts                  — Risk types + interfaces
│   ├── risk.scorer.ts            — Base risk scoring per domain/action
│   ├── context.analyzer.ts       — Contextual risk modifiers
│   └── risk.aggregator.ts        — Cumulative risk + session tracking
└── tests/
    ├── risk.scorer.test.ts
    ├── context.analyzer.test.ts
    └── risk.aggregator.test.ts
```

## Usage

```typescript
import { RiskScorer } from './src/risk.scorer';
import { ContextAnalyzer } from './src/context.analyzer';
import { RiskAggregator } from './src/risk.aggregator';

const scorer = new RiskScorer();
const analyzer = new ContextAnalyzer();
const aggregator = new RiskAggregator();

// Score a single action
const base = scorer.score({
  domain: "finance",
  action: "payment",
  target: "external_vendor",
  amount: 5000,
});

// Analyze context modifiers
const contextual = analyzer.analyze(base, {
  timeOfDay: "after_hours",
  frequency: 15,
  isFirstOccurrence: false,
});

// Track cumulative risk in session
aggregator.record(contextual);
const session = aggregator.getSessionRisk();
```

## Cross-Reference

| Document | Role |
|----------|------|
| `EXTENSIONS/CVF_ECO_v1.0_INTENT_VALIDATION/` | Upstream: provides intent + domain |
| `EXTENSIONS/CVF_ECO_v1.1_NL_POLICY/` | Upstream: provides policy rules |
| `docs/concepts/CVF_HIERARCHICAL_GOVERNANCE_PIPELINE.md` | Architecture blueprint (§4-5) |
