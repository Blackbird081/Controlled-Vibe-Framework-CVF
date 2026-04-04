# CVF W14-T1 Execution Plan — Agent Scope Resolution Batch Contract

Memory class: SUMMARY_RECORD

> Date: 2026-03-30
> Tranche: W14-T1 — Agent Scope Resolution Batch Contract
> Authorization: `docs/reviews/CVF_GC018_CONTINUATION_CANDIDATE_W14_T1_AGENT_SCOPE_RESOLUTION_BATCH_2026-03-30.md`
> Quality assessment: `docs/assessments/CVF_POST_W13_CONTINUATION_QUALITY_ASSESSMENT_2026-03-30.md` (9.03/10 EXCELLENT)
> Branch: `cvf-next`

---

## Tranche Objective

Deliver `AgentScopeResolutionBatchContract` in CPF — the governed batch aggregation surface for `AgentScopeResolution[]` produced by the `resolveScope()` method of `AgentDefinitionBoundaryContract` (W12-T1). This closes the scope-resolution batch gap and mirrors the W13-T1 delivery pattern.

---

## Fixed Input

- `EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION/src/agent.definition.boundary.contract.ts` (W12-T1)
  - READ_ONLY; provides `AgentScopeResolution`, `ScopeResolutionStatus`
  - `ScopeResolutionStatus`: `"RESOLVED" | "EMPTY_SCOPE" | "UNDECLARED_AGENT"`

---

## Control Points

### CP1 — Full Lane (GC-019): AgentScopeResolutionBatchContract

#### Deliverables

1. `EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION/src/agent.scope.resolution.batch.contract.ts`
2. `EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION/tests/agent.scope.resolution.batch.contract.test.ts`
3. `EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION/src/index.ts` — W14-T1 export block appended
4. `governance/compat/CVF_TEST_PARTITION_OWNERSHIP_REGISTRY.json` — W14-T1 partition entry added
5. `docs/audits/CVF_W14_T1_CP1_AGENT_SCOPE_RESOLUTION_BATCH_AUDIT_2026-03-30.md`
6. `docs/reviews/CVF_GC019_W14_T1_CP1_AGENT_SCOPE_RESOLUTION_BATCH_REVIEW_2026-03-30.md`
7. `docs/baselines/CVF_W14_T1_CP1_AGENT_SCOPE_RESOLUTION_BATCH_DELTA_2026-03-30.md`
8. `docs/baselines/CVF_GC026_TRACKER_SYNC_W14_T1_CP1_DONE_2026-03-30.md`

#### Contract Interface

```typescript
export interface AgentScopeResolutionBatch {
  batchId: string;
  createdAt: string;
  totalResults: number;
  results: AgentScopeResolution[];
  resolvedCount: number;
  emptyScopeCount: number;
  undeclaredAgentCount: number;
  dominantStatus: ScopeResolutionStatus | "EMPTY";
  batchHash: string;
}

export interface AgentScopeResolutionBatchContractDependencies {
  now?: () => string;
}
```

#### Dominant Status Logic

- If `totalResults === 0` → `dominantStatus: "EMPTY"`
- Tie-break precedence: `RESOLVED` > `EMPTY_SCOPE` > `UNDECLARED_AGENT`
- Highest-count wins; tie resolved by precedence order

#### Hash Rules

- `batchHash`: `computeDeterministicHash("scope-resolution-batch:" + sortedResolutionHashes.join(","))`
- `batchId`: `computeDeterministicHash("scope-resolution-batch-id:" + batchHash)`
- `batchId !== batchHash` always (different seed prefixes guarantee this)

#### Test Coverage (minimum 6 describe groups)

| Group | Coverage |
|---|---|
| empty batch | `totalResults === 0`; `dominantStatus === "EMPTY"`; counts all zero |
| counts | correct `resolvedCount`, `emptyScopeCount`, `undeclaredAgentCount` |
| dominant status | each status wins; tie-break RESOLVED > EMPTY_SCOPE > UNDECLARED_AGENT |
| determinism | same inputs → same `batchHash`; different inputs → different hash |
| factory | `createAgentScopeResolutionBatchContract` returns working instance |
| output shape | `batchId !== batchHash`; `totalResults === results.length`; `createdAt` from `now()` |

### CP2 — Tranche Closure Review

#### Deliverables

1. `docs/reviews/CVF_W14_T1_TRANCHE_CLOSURE_REVIEW_2026-03-30.md`
2. `docs/baselines/CVF_GC026_TRACKER_SYNC_W14_T1_CLOSED_DELIVERED_2026-03-30.md`
3. `docs/reference/CVF_WHITEPAPER_PROGRESS_TRACKER.md` — W14-T1 row → CLOSED DELIVERED
4. `AGENT_HANDOFF.md` — W14-T1 CLOSED DELIVERED; no active tranche

---

## Pass Conditions (all 7 must satisfy for CP1 exit)

| # | Condition |
|---|---|
| 1 | `AgentScopeResolutionBatchContract` created with `batch()` method returning `AgentScopeResolutionBatch` |
| 2 | Dedicated test file; all tests pass |
| 3 | CPF test count increases from 2170 |
| 4 | Export added to CPF `index.ts` |
| 5 | Test partition entry added to registry |
| 6 | No existing contracts changed |
| 7 | `now()` injection; `batchId` ≠ `batchHash`; deterministic counts and `dominantStatus` |

---

## Constraints

- `agent.definition.boundary.contract.ts` — READ_ONLY; no modifications
- `agent.definition.capability.batch.contract.ts` — READ_ONLY; pattern reference only
- No `index.test.ts` additions (GC-023)
- All tests in dedicated file; all governance artifacts delivered in same CP commit
