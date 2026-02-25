# Controlled Vibe Framework (CVF) v1.7.0

> **AI Governance Framework** — Policy-driven controls for AI-generated proposals with full audit trail, risk management, and simulation capabilities.

## Quick Start

```bash
# Install
npm install

# Setup database
npx prisma db push

# Run tests (71 tests, 9 suites)
npm test

# Type check
npm run typecheck

# Start development server
npm run dev
```

## Architecture

```
Client → [Zod Validation] → [JWT Auth + RBAC] → [Rate Limiter]
                                    ↓
                           [Lifecycle Engine]
                            ↓         ↓
                    [Policy Engine] [Event Bus]
                     ↓        ↓
              [Cost Guard] [Risk Engine]
                            ↓
                     [Prisma → SQLite]
```

**See [ARCHITECTURE DIAGRAM](./ARCHITECTURE%20DIAGRAM) for full Mermaid diagrams.**

## Features

### Core Engine
- **5-step lifecycle**: validate → policy → approve → execute → journal
- **Immutable policy registry** with SHA-256 hash verification
- **Safe default**: proposals with no matching rule → `pending` (not auto-approved)
- **Dependency Injection** container for testability
- **Typed Event Bus** with 6 event types for observability

### Security
- **Input Validation**: 14 Zod v4 schemas at every boundary
- **Authentication**: HMAC-SHA256 JWT + PBKDF2 password hashing (100K iterations)
- **Authorization**: RBAC with 3 roles (admin, operator, viewer) and 11 permissions
- **Rate Limiting**: Sliding window with presets (60/30/10 req/min)
- **Secure Cookies**: `httpOnly`, `secure`, `sameSite: strict`

### AI Governance
- **Pipeline**: policy check → generate → track usage → audit log
- **Multi-provider**: OpenClaw, Direct LLM, Local providers
- **Token budgets**: per-provider spending limits

### Data Layer
- **Prisma v7** with SQLite (6 models)
- **Repository Pattern**: interfaces → Prisma implementations
- **Migration-ready**: Easily swap database via `prisma.config.ts`

### Testing
- **71 tests** across 9 suites covering:
  - State machine, policy executor, policy hash
  - Safety guard, input validation (Zod)
  - Authentication (JWT, passwords, RBAC)
  - Rate limiting, event bus, DI container
- **CI/CD**: GitHub Actions on Node.js 20.x + 22.x

## Project Structure

See **[TREEVIEW.md](./TREEVIEW.md)** for the complete annotated file tree.

| Directory | Purpose |
|-----------|---------|
| `core/` | Lifecycle engine, DI container, event bus |
| `policy/` | Policy registry, executor, cost guard, risk engine |
| `ai/` | AI governance, provider adapters, usage tracking |
| `simulation/` | Proposal replay, policy diff, snapshots |
| `security/` | JWT auth, rate limiter, env config |
| `validation/` | 14 Zod v4 schemas |
| `repositories/` | Data access interfaces + Prisma implementations |
| `cvf-ui/` | Next.js dashboard with API routes |
| `tests/` | Vitest test suites (71 tests) |

## Environment Variables

```env
NODE_ENV=development
DATABASE_URL="file:./dev.db"
JWT_SECRET=your-secret-key
JWT_EXPIRY_SECONDS=3600
OPENAI_API_KEY=sk-...
AI_MAX_TOKENS_PER_DAY=100000
AI_MAX_COST_PER_DAY_USD=50
```

## API Endpoints

| Method | Route | Auth | Validation |
|--------|-------|------|------------|
| `POST` | `/api/proposals` | `proposal:create` | `CreateProposalRequestSchema` |
| `GET` | `/api/proposals` | `proposal:read` | — |
| `POST` | `/api/auth/login` | — | `LoginRequestSchema` |
| `GET` | `/api/audit` | `audit:read` | — |
| `GET` | `/api/policies` | `policy:read` | — |
| `POST` | `/api/policies` | `policy:create` | `RegisterPolicySchema` |

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Language | TypeScript (strict mode) |
| Framework | Next.js (App Router) |
| Database | Prisma v7 + SQLite |
| Validation | Zod v4 |
| Testing | Vitest |
| Auth | Node.js `crypto` (HMAC-SHA256, PBKDF2) |
| CI/CD | GitHub Actions |

## License

MIT
