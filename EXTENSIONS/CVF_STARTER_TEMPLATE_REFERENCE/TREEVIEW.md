# CVF Starter Template — Tree View

```
cvf-starter-template/
│
├── README.md                           # Project documentation
├── REVIEW_BASELINE.md                  # Independent code review report
├── TREEVIEW.md                         # This file
│
└── src/
    ├── package.json                    # Dependencies & scripts
    ├── package-lock.json
    ├── tsconfig.json                   # TypeScript config
    ├── .env.example                    # Environment variables template
    ├── app.ts                          # Entry point — creates orchestrator
    ├── server.ts                       # Express API server
    │
    ├── config/
    │   ├── app.config.ts               # Port, env, project name
    │   ├── model.config.ts             # Approved models + max risk levels
    │   ├── ai-role.config.ts           # AI role parameters (temp, maxTokens)
    │   └── cvf.config.ts               # CVF framework flags
    │
    ├── core/
    │   ├── execution-context.ts        # Execution state, metadata, cost tracking
    │   ├── execution-state-machine.ts  # State transitions (incl. FAILED)
    │   ├── execution-lock.ts           # Concurrency lock (with timeout)
    │   ├── error.types.ts              # Custom CVF error classes
    │   ├── logger.ts                   # Simple static logger
    │   ├── structured-logger.ts        # JSON structured logger
    │   ├── metrics.service.ts          # Counter-based metrics
    │   ├── rate-limit.service.ts       # Time-window rate limiter
    │   ├── idempotency.service.ts      # Duplicate request guard (with TTL)
    │   ├── replay-protection.ts        # Timestamp + nonce validation
    │   ├── audit-integrity.ts          # SHA-256 hash for audit records
    │   ├── cvf-integrity-check.ts      # File checksum validation
    │   ├── lifecycle-hooks.ts          # Before/after/error hooks
    │   └── tool-policy.ts              # Role-based tool authorization
    │
    ├── cvf/
    │   ├── cvf-orchestrator.ts         # Main orchestration engine
    │   ├── risk-classifier.service.ts  # Keyword-based risk classification
    │   ├── risk-escalation.service.ts  # HIGH risk blocking
    │   ├── governance-gate.service.ts  # Provider/model approval gate
    │   ├── validator-trigger.service.ts # Output validation trigger
    │   ├── audit.service.ts            # Audit record creation
    │   ├── budget-guard.service.ts     # Daily cost cap enforcement
    │   ├── freeze-guard.service.ts     # Consecutive failure freeze
    │   ├── policy-engine.service.ts    # Policy rule enforcement
    │   ├── quarantine.service.ts       # Output quarantine
    │   └── model-autoscale.service.ts  # Model downgrade on high usage
    │
    ├── ai/
    │   ├── ai.interface.ts             # AIRole interface & config
    │   ├── ai.factory.ts               # Role factory (planner/analyst/validator)
    │   ├── providers/
    │   │   ├── provider.interface.ts   # AIProvider interface (single source of truth)
    │   │   ├── openai.provider.ts      # OpenAI implementation
    │   │   ├── claude.provider.ts      # Claude implementation
    │   │   └── gemini.provider.ts      # Gemini implementation
    │   └── roles/
    │       ├── role-executor.registry.ts # Role-to-executor mapping
    │       ├── planner.service.ts      # Planner AI role
    │       ├── analyst.service.ts      # Analyst AI role
    │       └── validator.service.ts    # Validator AI role
    │
    ├── workflows/
    │   └── sample.workflow.ts          # Example workflow using orchestrator
    │
    ├── tools/
    │   └── tool.registry.ts            # Tool registration & lookup
    │
    ├── database/
    │   ├── audit.repository.ts         # Audit record storage
    │   └── cost.repository.ts          # Cost record storage (with getDailyCost)
    │
    ├── utils/
    │   ├── encryption.ts               # AES-256-CTR + HMAC authentication
    │   ├── token-estimator.ts          # Token count estimation (Latin + CJK)
    │   ├── cost-calculator.ts          # Cost calculation per model
    │   └── api-key-rotation.ts         # Round-robin key rotation (with validation)
    │
    ├── uat/
    │   ├── uat-runner.ts               # UAT scenario runner
    │   ├── certification.service.ts    # Freeze certification gate
    │   └── compliance-report.service.ts # Real compliance checks
    │
    ├── version/
    │   ├── version-lock.ts             # Version locking
    │   ├── freeze-metadata.ts          # Freeze metadata generation
    │   └── deployment-gate.ts          # Deployment guard (requires certification)
    │
    ├── server/
    │   └── health.controller.ts        # Health check endpoint handler
    │
    ├── infrastructure/
    │   └── container.ts                # Simple DI container
    │
    ├── adapters/                       # (empty — reserved for external integrations)
    │
    └── docker/
        └── Dockerfile                  # Production Docker image
```

---

## Execution Flow

```
REQUEST
  → Replay Protection (timestamp + nonce)
  → Idempotency Check
  → Execution Lock
  → Risk Classification (LOW / MEDIUM / HIGH)
  → Risk Escalation (block HIGH if needed)
  → Governance Gate (provider + model approval)
  → Policy Engine (custom rules)
  → Budget Guard (daily cost cap)
  → Freeze Guard (consecutive failure check)
  → AI Execution (OpenAI / Claude / Gemini)
  → Cost Recording
  → Output Validation (HIGH risk only)
  → Audit Logging
  → Complete
```

**On Failure:** Record failure → Freeze if ≥ 3 consecutive fails → Audit failed execution
