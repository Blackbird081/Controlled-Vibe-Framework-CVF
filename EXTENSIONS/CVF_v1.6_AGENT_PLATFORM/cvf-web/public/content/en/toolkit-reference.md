# CVF Toolkit Reference — Governance Engine Example

> 📘 **Reference Implementation** — This is a learning resource, not the production runtime.

## What Is This?

The CVF Toolkit Reference is a **TypeScript-based governance enforcement engine** that demonstrates how to implement CVF governance concepts in code. It includes:

- **Risk Classifier** — Contextual risk assessment (R0–R4) with domain, environment, and capability escalation
- **Phase Controller** — Sequential P0→P6 lifecycle with freeze protocol
- **Governance Guard** — Central enforcement orchestrator checking risk + phase + operator + change + freeze + environment
- **Skill Registry** — Register, query, and deactivate governance-controlled skills
- **Operator Policy** — Role hierarchy enforcement (VIEWER → ANALYST → REVIEWER → APPROVER → ADMIN)
- **Change Controller** — Full change lifecycle (draft → submitted → approved → implemented → frozen)
- **Audit Logger** — Non-bypassable event logging with PII sanitization
- **AI Provider Abstraction** — Model-agnostic AI interface (OpenAI, Claude, Gemini)

## Architecture

```
02_TOOLKIT_CORE/        → Enforcement engine (TypeScript)
  ├── interfaces.ts     → All shared types (single source of truth)
  ├── errors.ts         → 12 error classes (CVF_ERR_001–012)
  ├── cvf.config.ts     → Centralized configuration
  ├── governance.guard.ts → Central enforcement
  ├── risk.classifier.ts → Risk computation
  ├── phase.controller.ts → Phase state machine
  ├── skill.registry.ts → Skill management
  ├── operator.policy.ts → Role enforcement
  ├── change.controller.ts → Change lifecycle
  ├── audit.logger.ts   → Audit trail
  └── audit.sanitizer.ts → PII redaction

03_ADAPTER_LAYER/       → External bridges
07_AI_PROVIDER_ABSTRACTION/ → Multi-provider AI
04_EXTENSION_LAYER/     → Domain plugins (financial, dexter)
```

## Risk Levels

| Level | Name | Environment Cap | Requirements |
|-------|------|----------------|-------------|
| **R0** | Passive | Allowed everywhere | — |
| **R1** | Low | Allowed everywhere | — |
| **R2** | Moderate | dev + staging | UAT |
| **R3** | High | dev only | UAT + Approval + Freeze |
| **R4** | Critical | Blocked | UAT + Multi-Approval + Freeze |

## Phase Model (P0–P6)

```
P0_DESIGN → P1_BUILD → P2_INTERNAL_VALIDATION → P3_UAT → P4_APPROVED → P5_PRODUCTION → P6_FROZEN
```

- Sequential only (no phase skipping)
- R3/R4 must freeze before production
- Only ADMIN can rollback P6 → P0

## Governance Flow

```
Skill Request
    │
    ├── SkillRegistry.get(skillId)     → Validate skill exists & active
    ├── RiskClassifier.classify()      → Compute risk level
    ├── PhaseController.validate()     → Check phase gate
    ├── OperatorPolicy.check()         → Verify role permissions
    ├── ChangeController.validate()    → Check change compliance
    ├── FreezeProtocol.check()         → Verify freeze status
    ├── EnvironmentCap.validate()      → Check env restrictions
    │
    ▼
GovernanceDecision { allowed, riskLevel, reasons }
    │
    ▼
AuditLogger.log()
```

## Test Coverage

| Metric | Value |
|--------|-------|
| Test Suites | 9 passed |
| Tests | 111 passed |
| Statements | 98.31% |
| Branches | 86.15% |
| Functions | 100% |
| Lines | 98.29% |

## When to Use This

- ✅ Learning how to implement governance enforcement in TypeScript
- ✅ Understanding CVF risk/phase/skill/change patterns
- ✅ Reference architecture for building your own governance engine
- ❌ Not for production use — use the CVF Web Platform instead

## Location

```
EXTENSIONS/CVF_TOOLKIT_REFERENCE/
```

**Related:** [CVF Web Platform](/docs/web-ui-setup) | [Governance Model](/docs/governance-model) | [Risk Model](/docs/risk-model)
