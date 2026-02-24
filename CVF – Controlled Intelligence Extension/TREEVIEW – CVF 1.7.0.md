Controlled-Vibe-Framework-CVF/
│
├── core/
│   ├── governance/
│   │   ├── policy.binding.ts
│   │   ├── policy.engine.ts
│   │   ├── governance.constants.ts
│   │   └── governance.types.ts
│   │
│   ├── risk/
│   │   ├── risk.scorer.ts
│   │   ├── severity.matrix.ts
│   │   └── risk.types.ts
│   │
│   ├── rollback/
│   │   ├── rollback.snapshot.ts
│   │   └── rollback.manager.ts
│   │
│   └── registry/
│       ├── skill.registry.ts
│       └── binding.registry.ts
│
├── intelligence/
│   ├── reasoning_gate/
│   │   ├── controlled.reasoning.ts      ← calls bindPolicy(), uses constants
│   │   └── reasoning.types.ts           ← removed policyCompliant field
│   │
│   ├── role_transition_guard/
│   │   ├── role.types.ts                ← AgentRole enum (source of truth)
│   │   ├── role.graph.ts                ← re-export shim only
│   │   ├── transition.validator.ts      ← AllowedTransitions (source of truth)
│   │   ├── loop.detector.ts
│   │   └── depth.limiter.ts
│   │
│   ├── context_segmentation/
│   │   ├── context.types.ts             ← NEW: shared types
│   │   ├── context.segmenter.ts         ← NEW: unified entry point
│   │   ├── context.pruner.ts
│   │   ├── session.fork.ts
│   │   ├── summary.injector.ts
│   │   └── memory.boundary.ts
│   │
│   ├── determinism_control/
│   │   ├── entropy.guard.ts
│   │   ├── temperature.policy.ts
│   │   ├── reasoning.mode.ts            ← import from role.types.ts
│   │   └── reproducibility.snapshot.ts
│   │
│   └── introspection/
│       ├── self.check.ts                ← upgraded: session + reasoning check
│       ├── reasoning.audit.ts           ← upgraded: calls bindPolicy directly
│       ├── deviation.report.ts          ← upgraded: keyword-based severity
│       └── correction.plan.ts           ← upgraded: severity-driven approval
│
├── learning/
│   └── lessons_registry/
│       ├── lesson.schema.ts             ← added: severity, rootCause, preventionRule, riskLevel
│       ├── lesson.store.ts
│       ├── rule.versioning.ts
│       ├── lesson.injector.ts           ← updated: injects rootCause + preventionRule
│       └── conflict.detector.ts
│
├── telemetry/
│   ├── mistake_rate_tracker.ts
│   ├── elegance_score_tracker.ts
│   ├── verification_metrics.ts
│   └── governance_audit_log.ts
│
├── FIX_ROADMAP_1.7.0.md
├── CHANGELOG.md
├── GOVERNANCE_DOCTRINE.md
├── MODULE SPECIFICATIONS.md
├── ENTERPRISE AUDIT SIMULATION.md
└── README.md

─────────────────────────────────────────
NOTE: transition.policy.ts đã bị deprecated — không sử dụng.
Có thể xóa an toàn khi cleanup.
─────────────────────────────────────────