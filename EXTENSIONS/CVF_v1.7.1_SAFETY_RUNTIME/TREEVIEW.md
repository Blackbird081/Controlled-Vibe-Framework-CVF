# CVF Project Tree — v1.7.0

```
cvf/
├── .env                           # Environment variables
├── .github/workflows/ci.yml       # CI/CD pipeline
├── .prettierrc                    # Prettier config
├── .prettierignore
├── eslint.config.mjs              # ESLint flat config
├── package.json                   # Root package.json
├── tsconfig.json                  # Strict TS config + path aliases
├── vitest.config.ts               # Test runner config
├── prisma.config.ts               # Prisma v7 datasource config
├── prisma/
│   └── schema.prisma              # 6 models: Proposal, Journal, Policy, Audit, Budget, Snapshot
│
├── types/
│   └── index.ts                   # 30+ shared types (single source of truth)
│
├── core/                          # ── Core Engine ──
│   ├── lifecycle.engine.ts        # 5-step proposal lifecycle
│   ├── proposal.store.ts          # Immutable proposal storage
│   ├── state.store.ts             # State management
│   ├── execution.boundary.ts      # Error boundary wrapper
│   ├── container.ts               # Dependency Injection container
│   └── event-bus.ts               # Typed event bus (6 event types)
│
├── policy/                        # ── Policy Engine ──
│   ├── policy.registry.ts         # Immutable version registry
│   ├── policy.executor.ts         # Rule evaluation (default: pending)
│   ├── policy.hash.ts             # SHA-256 integrity verification
│   ├── approval.state-machine.ts  # State transitions
│   ├── execution.journal.ts       # Execution audit trail
│   ├── cost.guard.ts              # 6-level cost validation
│   ├── risk.engine.ts             # 4-level risk scoring
│   └── reward.engine.ts           # Reward system
│
├── ai/                            # ── AI Governance ──
│   ├── ai.governance.ts           # Pipeline: policy → generate → track → audit
│   ├── provider.policy.ts         # Keyword blocking + content policy
│   ├── provider.types.ts          # Provider type definitions
│   ├── audit.logger.ts            # AI generation audit log
│   ├── usage.tracker.ts           # Token usage tracking
│   ├── direct.provider.adapter.ts # Direct LLM adapter
│   └── openclaw.adapter.ts        # OpenClaw AI adapter
│
├── simulation/                    # ── Simulation Layer ──
│   ├── simulation.engine.ts       # Replay proposals with new policies
│   ├── proposal.snapshot.ts       # Snapshot storage
│   ├── policy.diff.ts             # Policy change impact analysis
│   ├── replay.service.ts          # Replay orchestration
│   └── sandbox.mode.ts            # Sandbox toggle
│
├── adapters/openclaw/             # ── OpenClaw Adapter ──
│   ├── openclaw.adapter.ts        # NLP → structured proposal
│   ├── intent.parser.ts           # AI + deterministic fallback
│   ├── safety.guard.ts            # Token budget enforcement
│   ├── provider.registry.ts       # Dual provider (cheap/strong)
│   ├── openclaw.config.ts         # Configuration
│   ├── proposal.builder.ts        # Proposal construction
│   ├── cvf.contract.ts            # CVF API contract
│   ├── response.formatter.ts      # Response formatting
│   ├── telemetry.hook.ts          # Telemetry collection
│   └── types/                     # OpenClaw-specific types
│
├── security/                      # ── Security Layer ──
│   ├── auth.ts                    # HMAC-SHA256 JWT + PBKDF2 + RBAC
│   ├── rate-limiter.ts            # Sliding window (3 presets)
│   └── env.config.ts              # Zod-validated env config
│
├── validation/                    # ── Input Validation ──
│   └── schemas.ts                 # 14 Zod v4 schemas
│
├── repositories/                  # ── Data Layer ──
│   ├── interfaces.ts              # 6 repository interfaces
│   ├── prisma.proposal.ts         # Prisma implementation
│   ├── prisma.journal.ts          # Prisma implementation
│   ├── prisma.snapshot.ts         # Prisma implementation
│   └── index.ts                   # Barrel export
│
├── tests/                         # ── Test Suite (71 tests) ──
│   ├── state-machine.test.ts      # 7 tests
│   ├── policy-hash.test.ts        # 6 tests
│   ├── safety-guard.test.ts       # 8 tests
│   ├── policy-executor.test.ts    # 8 tests
│   ├── validation.test.ts         # 13 tests
│   ├── auth.test.ts               # 11 tests
│   ├── rate-limiter.test.ts       # 5 tests
│   ├── event-bus.test.ts          # 7 tests
│   └── container.test.ts          # 6 tests
│
└── cvf-ui/                        # ── Next.js Dashboard ──
    ├── app/
    │   ├── layout.tsx             # Root layout with sidebar
    │   ├── page.tsx               # Dashboard (stats, table, feed)
    │   ├── api/
    │   │   ├── middleware.ts       # Validation + Auth + Rate limit
    │   │   ├── proposals/route.ts # CRUD with RBAC
    │   │   ├── auth/login/route.ts# JWT login endpoint
    │   │   ├── audit/route.ts     # Audit log API
    │   │   └── policies/route.ts  # Policy management API
    │   ├── audit/page.tsx
    │   ├── execution/page.tsx
    │   ├── project-builder/page.tsx
    │   └── settings/page.tsx
    ├── components/
    │   ├── Sidebar.tsx            # Navigation sidebar
    │   ├── StatCard.tsx           # Statistics card
    │   ├── StatusBadge.tsx        # Status indicator
    │   ├── ProposalCard.tsx
    │   ├── RiskBadge.tsx
    │   ├── ApprovalActions.tsx
    │   ├── CostEstimator.tsx
    │   ├── ExecutionStatus.tsx
    │   └── ProviderSelector.tsx
    ├── styles/
    │   └── design-system.css      # Dark theme design system
    ├── lib/
    │   ├── db.ts                  # Prisma client singleton
    │   ├── auth.ts                # Auth helpers
    │   └── roles.ts               # Role definitions
    ├── budget/                    # Budget engine + policies
    ├── hooks/                     # React hooks (proposal, audit, AI)
    ├── services/                  # API service layer
    ├── cvf-api/                   # Legacy controllers
    ├── middleware.ts              # Next.js middleware
    └── server.ts                  # Legacy Express server
```