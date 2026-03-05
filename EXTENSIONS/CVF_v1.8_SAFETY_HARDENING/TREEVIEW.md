# CVF v1.8 — Implementation Treeview (Reference)

> **Source:** `CVF AI Runtime/TREEVIEW.md`
> **Status:** Reference only — future implementation target
> **Note:** This is the planned TypeScript file structure when v1.8 is implemented in code

---

```
EXTENSIONS/CVF_v1.8_SAFETY_HARDENING/
│
├── core/
│   ├── governance/
│   │   ├── policy.engine.ts
│   │   ├── policy.binding.ts
│   │   ├── governance.constants.ts
│   │   ├── governance.types.ts
│   │   └── escalation.controller.ts
│   │
│   ├── lifecycle/
│   │   ├── lifecycle.controller.ts
│   │   ├── phase.guard.ts
│   │   ├── execution.context.ts
│   │   └── execution.id.ts
│   │
│   ├── risk/
│   │   ├── risk.scorer.ts          ← implements Risk Score formula from GOVERNANCE_MODEL.md
│   │   ├── risk.lock.ts            ← immutable after RISK_ASSESSMENT phase
│   │   ├── severity.matrix.ts
│   │   └── risk.types.ts
│   │
│   ├── mutation/
│   │   ├── mutation.guard.ts
│   │   ├── mutation.sandbox.ts
│   │   ├── mutation.budget.ts      ← enforces budget limits per mode
│   │   ├── snapshot.enforcer.ts
│   │   └── mutation.types.ts
│   │
│   ├── verification/
│   │   ├── verification.engine.ts
│   │   ├── proof.of.correctness.ts
│   │   ├── phase.exit.criteria.ts
│   │   └── verification.types.ts
│   │
│   ├── anomaly/
│   │   ├── anomaly.detector.ts
│   │   ├── behavior.drift.monitor.ts
│   │   └── anomaly.types.ts
│   │
│   ├── rollback/
│   │   ├── rollback.manager.ts
│   │   └── rollback.snapshot.ts
│   │
│   └── registry/
│       ├── skill.registry.ts
│       └── binding.registry.ts
│
├── intelligence/
│   ├── reasoning_gate/
│   │   ├── controlled.reasoning.ts
│   │   └── reasoning.types.ts
│   │
│   └── role_lock/
│       ├── role.lock.ts
│       └── role.types.ts
│
├── telemetry/
│   ├── execution.audit.log.ts
│   ├── mutation.metrics.ts
│   ├── stability.index.ts     ← implements Stability Index formula from GOVERNANCE_MODEL.md
│   └── drift.report.ts
│
└── README.md
```

---

> **Implementation guidance:** Start with v1.7.1 codebase. Map each v1.7.1 module to its v1.8 equivalent per ARCHITECTURE.md. Do not build parallel implementation (ADR-010).
