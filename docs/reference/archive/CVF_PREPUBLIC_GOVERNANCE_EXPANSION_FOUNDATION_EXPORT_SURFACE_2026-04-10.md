# CVF Pre-Public Export Surface — Governance Expansion Foundation

Memory class: POINTER_RECORD

> Package: `cvf-governance-expansion-foundation` v0.1.0
> Directory: `EXTENSIONS/CVF_GOVERNANCE_EXPANSION_FOUNDATION`
> exportReadiness: `CANDIDATE` (Phase B)
> Date: 2026-04-10

---

## Export Map

| Export key | Entry point |
|------------|-------------|
| `"."` | `./src/index.ts` |

Single default export — all contracts accessible via `import { ... } from 'cvf-governance-expansion-foundation'`.

---

## Public Contract Families (via `src/index.ts`)

**Watchdog Pulse family:**
- `WatchdogPulseConsumerPipelineContract`, `WatchdogPulseConsumerPipelineBatchContract` + factory functions + types

**Watchdog Escalation family:**
- `WatchdogEscalationConsumerPipelineContract`, `WatchdogEscalationConsumerPipelineBatchContract` + factory functions + types

**Governance Audit Signal family:**
- `GovernanceAuditSignalConsumerPipelineBatchContract` + factory function + types

All governance expansion contracts exported from `src/` barrel. No internal cross-package imports.

---

## Publication Boundary

**Included in `npm pack`** (via `files` field):
- `README.md`, `src/`

**`npm pack --dry-run`**: PASS (verified 2026-04-10)
**`npm run check`** (typecheck + vitest): PASS — 625 tests, 0 failures

---

*Surface document date: 2026-04-10*
*Status: CANDIDATE — not yet published*
