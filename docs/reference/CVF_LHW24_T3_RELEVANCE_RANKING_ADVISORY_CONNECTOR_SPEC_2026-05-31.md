# CVF LHW24 T3 Relevance Ranking Advisory Connector Spec

Contract ID: `cvf.relevanceRankingAdvisory.lhw24.t3.v1`

Memory class: POINTER_RECORD

Status: CLOSED_PASS_BOUNDED

Date: 2026-05-31

Wave: LHW24 T3

GC-018: `docs/baselines/CVF_GC018_LHW24_LEARNING_LOOP_COMPLETION_2026-05-31.md`

`runtimeExecutionAuthorized=false`

---

## Purpose

Section: S1

Publish a documentation-only connection-point schema for relevance scoring of memory/context packages. This tranche documents advisory ranking inputs/outputs without changing runtime packaging or retrieval.

No runtime context packager mutation, reranking execution, or route change is authorized in this wave.

## Scope / Applies To

Applies to private-provenance documentation for CVF learning/memory packaging. No autonomous mutation, no runtime ranking execution, and no public-sync export.

## S2. Design

### Existing Context Packaging Surface

Source: `EXTENSIONS/CVF_LEARNING_PLANE_FOUNDATION/src/memory-context-packager.ts`
Source: `EXTENSIONS/CVF_LEARNING_PLANE_FOUNDATION/src/learning-signal-intake-bridge.ts`

- `packageMemoryContext` already assembles context packages with token budgeting.
- LearningSignalIntakeBridge enforces `autonomousMutationAuthorized=false`.

### Advisory Ranking Mapping

Legacy concept: `.private_reference/legacy/CVF_Important/ADDING_CONTEXT ENGINE/CONTEXT PACKAGER.md`

Ranking intent (advisory only):

1. Accept candidate memory/context items and signals (task, role, risk, relevance hints).
2. Produce ordered scores and rationale.
3. Do not alter runtime packaging or reinjection in LHW24; capture ranking metadata only.

## S3. Contract

```typescript
relevanceRankingAdvisoryType:
  "cvf.relevanceRankingAdvisory.lhw24.t3.v1"
relevanceRankingSpec: {
  rankingInputs: {
    memoryCandidates: Array<{ id: string; tier: string; tokens: number }>
    signals: Array<{ name: string; value: string }>
  }
  rankingOutput: {
    relevanceScores: Array<{ id: string; score: number; rationale?: string }>
    tieBreakPolicy?: "recency" | "risk" | "governed_override"
  }
  advisoryOnly: true
  runtimeExecutionAuthorized: false
}
```

These fields are not wired to `packageMemoryContext` or any runtime reinjection in LHW24.

## S4. Integration Guidance

- Keep ranking advisory; do not change selection or reinjection behavior.
- Preserve `autonomousMutationAuthorized=false` when signals traverse LearningSignalIntakeBridge.
- Record rationale for governance review; execution remains unchanged.

## S5. Verification Matrix

| Claim | Source anchor | Result |
| --- | --- | --- |
| Context packager exists | `memory-context-packager.ts` | PASS |
| Learning-signal intake exists | `learning-signal-intake-bridge.ts` | PASS |
| Legacy context packager concept exists | `CONTEXT PACKAGER.md` | PASS |
| This tranche modifies runtime code | Git diff name status | N/A with reason: documentation-only wave |

## Public Export Disposition

DEFERRED_PRIVATE_ONLY - private provenance documentation. No public-sync export is authorized.

## Claim Boundary

This spec publishes a source-verified documentation schema only. It does not claim runtime relevance scoring, reinjection, public readiness, or production readiness.
