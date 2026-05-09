Controlled-Vibe-Framework-CVF/
│
├── core/
│   ├── governance/
│   │   ├── policy.binding.ts
│   │   ├── policy.engine.ts
│   │   ├── governance.constants.ts      ← aligned R2/R3 boundaries
│   │   ├── governance.types.ts
│   │   ├── risk.mapping.ts             ← R0-R3 ↔ riskScore 0.0-1.0
│   │   └── role.mapping.ts             ← CVF phases A/B/C/D ↔ AgentRole
│   │
│   ├── risk/
│   │   ├── risk.scorer.ts
│   │   ├── severity.matrix.ts
│   │   └── risk.types.ts
│   │
│   ├── rollback/
│   │   ├── rollback.snapshot.ts
│   │   └── rollback.manager.ts          ← persisted cvf_rollback.jsonl
│   │
│   └── registry/
│       ├── skill.registry.ts            ← Map-based, lookup by name/phase/category
│       └── binding.registry.ts          ← connects skills ↔ roles via CVF phases
│
├── intelligence/
│   ├── reasoning_gate/
│   │   ├── controlled.reasoning.ts      ← sanitizer → recursion → governance → entropy → prompt → snapshot
│   │   └── reasoning.types.ts
│   │
│   ├── input_boundary/                  ← NEW: hardening layer
│   │   └── prompt.sanitizer.ts          ← injection detection + STRIP/BLOCK/LOG
│   │
│   ├── role_transition_guard/
│   │   ├── role.types.ts                ← AgentRole enum (source of truth)
│   │   ├── role.graph.ts                ← re-export shim
│   │   ├── transition.validator.ts      ← AllowedTransitions
│   │   ├── recursion.guard.ts           ← NEW: max depth, oscillation, session lock
│   │   ├── loop.detector.ts
│   │   └── depth.limiter.ts
│   │
│   ├── context_segmentation/
│   │   ├── context.types.ts
│   │   ├── context.segmenter.ts
│   │   ├── context.pruner.ts
│   │   ├── session.fork.ts
│   │   ├── summary.injector.ts
│   │   └── memory.boundary.ts
│   │
│   ├── determinism_control/
│   │   ├── entropy.guard.ts             ← self-calculates variance
│   │   ├── temperature.policy.ts
│   │   ├── reasoning.mode.ts
│   │   └── reproducibility.snapshot.ts  ← promptHash + snapshotId + modelVersion
│   │
│   └── introspection/
│       ├── self.check.ts
│       ├── reasoning.audit.ts
│       ├── deviation.report.ts          ← keyword-based severity
│       └── correction.plan.ts           ← severity-driven approval
│
├── learning/
│   └── lessons_registry/
│       ├── lesson.schema.ts             ← severity, rootCause, preventionRule, riskLevel
│       ├── lesson.store.ts              ← persisted cvf_lessons.json
│       ├── lesson.signing.ts            ← NEW: integrity hash + verification
│       ├── rule.versioning.ts
│       ├── lesson.injector.ts
│       └── conflict.detector.ts         ← keyword similarity (Jaccard ≥ 40%) + rootCause
│
├── telemetry/
│   ├── mistake_rate_tracker.ts          ← persisted + time-windowed
│   ├── elegance_score_tracker.ts        ← weighted + trended + persisted
│   ├── verification_metrics.ts          ← time-tracked + persisted
│   ├── governance_audit_log.ts          ← append-only cvf_audit.jsonl
│   └── anomaly.detector.ts             ← NEW: NORMAL → STRICT → LOCKDOWN triggers
│
├── INTEGRATION.md                       ← how extension relates to CVF gốc
├── CHANGELOG.md
├── GOVERNANCE_DOCTRINE.md
├── MODULE SPECIFICATIONS.md
├── README.md
├── package.json
└── tsconfig.json