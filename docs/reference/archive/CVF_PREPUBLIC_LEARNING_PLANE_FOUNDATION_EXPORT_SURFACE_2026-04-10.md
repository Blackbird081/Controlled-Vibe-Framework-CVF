# CVF Pre-Public Export Surface — Learning Plane Foundation

Memory class: POINTER_RECORD

> Package: `cvf-learning-plane-foundation` v0.1.0
> Directory: `EXTENSIONS/CVF_LEARNING_PLANE_FOUNDATION`
> exportReadiness: `CANDIDATE` (Phase B)
> Date: 2026-04-10

---

## Export Map

| Export key | Entry point |
|------------|-------------|
| `"."` | `./src/index.ts` |

Single default export — all contracts accessible via `import { ... } from 'cvf-learning-plane-foundation'`.

---

## Public Contract Families (via `src/index.ts`)

**Evaluation Engine family:**
- `EvaluationEngineConsumerPipelineContract`, `EvaluationEngineConsumerPipelineBatchContract` + factory functions + types

**TruthScore family:**
- `TruthScoreConsumerPipelineContract`, `TruthScoreConsumerPipelineBatchContract` + factory functions + types

**PatternDetection family:**
- `PatternDetectionConsumerPipelineContract`, `PatternDetectionConsumerPipelineBatchContract` + factory functions + types

**Additional learning plane contracts** (full barrel — all contracts in `src/index.ts`): Storage, Observability, GovernanceSignal, and remaining consumer pipeline families.

No internal cross-package imports. No private implementation details leak through the barrel.

---

## Publication Boundary

**Included in `npm pack`** (via `files` field):
- `README.md`, `src/`

**`npm pack --dry-run`**: PASS (verified 2026-04-10)
**`npm run check`** (typecheck + vitest): PASS — 1465 tests, 0 failures

---

*Surface document date: 2026-04-10*
*Status: CANDIDATE — not yet published*
