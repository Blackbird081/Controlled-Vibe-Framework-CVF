CVF_Kernel_Architecture/
│
├── README.md
│
├── kernel/
│   │
│   ├── 01_domain_lock/
│   │   ├── domain.types.ts
│   │   ├── domain.registry.ts
│   │   ├── domain.guard.ts
│   │   └── domain.map.ts
│   │
│   ├── 02_contract_runtime/
│   │   ├── contract.types.ts
│   │   ├── contract.validator.ts
│   │   └── contract.enforcer.ts
│   │
│   ├── 03_contamination_guard/
│   │   ├── risk.types.ts
│   │   ├── risk.matrix.ts
│   │   ├── risk_detector.ts
│   │   └── risk_scorer.ts
│   │
│   ├── 04_refusal_router/
│   │   ├── refusal.types.ts
│   │   ├── refusal.router.ts
│   │   ├── refusal.execution.ts
│   │   └── refusal.policy.ts
│   │
│   └── 05_creative_control/
│       ├── creative.types.ts
│       └── creative.controller.ts
│
├── runtime/
│   ├── execution_orchestrator.ts
│   ├── llm_adapter.ts
│   └── session_state.ts
│
└── internal_ledger/
    ├── lineage_tracker.ts
    ├── risk_evolution.ts
    └── boundary_snapshot.ts