# CVF v1.2.2 — Skill Governance Engine
# Structure: All components are under /skill_system/ or dedicated top-level folders

/cvf
│
├── /core
│   ├── constitution.ts
│   ├── phase.manager.ts
│   ├── governance.kernel.ts
│   └── runtime.orchestrator.ts
│
├── /skill_system
│   │
│   ├── /spec
│   │   ├── skill.schema.yaml
│   │   ├── skill.versioning.policy.yaml
│   │   └── skill.maturity.model.yaml
│   │
│   ├── /static
│   │   ├── /ai_research
│   │   ├── /application
│   │   └── registry.json
│   │
│   ├── /dynamic
│   │   ├── /sandbox
│   │   ├── /approved
│   │   └── registry.json
│   │
│   ├── /external_adapter
│   │   ├── skills_sh.adapter.ts
│   │   ├── github.adapter.ts
│   │   └── integrity.verifier.ts
│   │
│   ├── /governance
│   │   ├── skill.validator.ts
│   │   ├── skill.normalizer.ts
│   │   ├── risk.scorer.ts
│   │   ├── domain.guard.ts
│   │   ├── policy.binding.ts
│   │   ├── contract.enforcer.ts
│   │   └── approval.workflow.ts
│   │
│   ├── /fusion              ← Skill selection intelligence (unique to v1.2.2)
│   │   ├── candidate.search.ts
│   │   ├── semantic.rank.ts
│   │   ├── historical.weight.ts
│   │   ├── cost.optimizer.ts
│   │   └── final.selector.ts
│   │
│   └── /execution
│       ├── execution.planner.ts
│       ├── tool.router.ts
│       ├── execution.guard.ts
│       └── execution.logger.ts
│
├── /evolution_engine        ← Dynamic skill evolution (unique to v1.2.2)
│   ├── experience.collector.ts
│   ├── trace.analyzer.ts
│   ├── pattern.distiller.ts
│   ├── dynamic_skill.generator.ts
│   ├── skill.probation.manager.ts
│   └── governance.submitter.ts
│
├── /intent
│   ├── intent.classifier.ts
│   └── intent.domain.mapper.ts
│
├── /policy
│   ├── global.policy.yaml
│   ├── domain.policy.yaml
│   ├── risk.matrix.yaml
│   └── cost.control.policy.yaml
│
├── /internal_ledger
│   ├── skill_usage.log
│   ├── risk_decision.log
│   ├── dynamic_promotion.log
│   ├── execution_trace.log
│   └── audit.snapshot.ts
│
└── README.md