# CVF W15-T1 Execution Plan — Agent Definition Audit Batch Contract

Memory class: SUMMARY_RECORD

> Date: 2026-03-30
> Tranche: W15-T1 — Agent Definition Audit Batch Contract
> Authorization: `docs/reviews/CVF_GC018_CONTINUATION_CANDIDATE_W15_T1_AGENT_DEFINITION_AUDIT_BATCH_2026-03-30.md`
> Quality assessment: `docs/assessments/CVF_POST_W13_CONTINUATION_QUALITY_ASSESSMENT_2026-03-30.md` (9.03/10 EXCELLENT)
> Branch: `cvf-next`

---

## Tranche Objective

Deliver `AgentDefinitionAuditBatchContract` in CPF — the governed batch aggregation surface for `AgentDefinitionAudit[]` produced by the `auditDefinitions()` method of `AgentDefinitionBoundaryContract` (W12-T1). This closes the final batch gap in the W12-T1 agent definition family and completes the W12-T1 → W13-T1 → W14-T1 → W15-T1 delivery sequence.

---

## Fixed Input

- `EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION/src/agent.definition.boundary.contract.ts` (W12-T1)
  - READ_ONLY; provides `AgentDefinitionAudit`, `AgentDefinitionRecord`
  - `AgentDefinitionAudit`: `{ auditId, auditedAt, totalAgents, agents, auditHash }`
  - No status enum — aggregate is by `totalAgents` count

---

## Control Points

### CP1 — Full Lane (GC-019): AgentDefinitionAuditBatchContract

#### Deliverables

1. `EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION/src/agent.definition.audit.batch.contract.ts`
2. `EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION/tests/agent.definition.audit.batch.contract.test.ts`
3. `EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION/src/index.ts` — W15-T1 export block appended
4. `governance/compat/CVF_TEST_PARTITION_OWNERSHIP_REGISTRY.json` — W15-T1 partition entry added
5. `docs/audits/CVF_W15_T1_CP1_AGENT_DEFINITION_AUDIT_BATCH_AUDIT_2026-03-30.md`
6. `docs/reviews/CVF_GC019_W15_T1_CP1_AGENT_DEFINITION_AUDIT_BATCH_REVIEW_2026-03-30.md`
7. `docs/baselines/CVF_W15_T1_CP1_AGENT_DEF_AUDIT_BATCH_DELTA_2026-03-30.md`
8. `docs/baselines/CVF_GC026_TRACKER_SYNC_W15_T1_CP1_DONE_2026-03-30.md`

#### Contract Interface

```typescript
export interface AgentDefinitionAuditBatch {
  batchId: string;
  batchHash: string;
  createdAt: string;
  totalAudits: number;
  totalAgentsAcrossAudits: number;
}

export interface AgentDefinitionAuditBatchContractDependencies {
  now?: () => string;
}
```

#### Hash Rules

- `batchHash`: `computeDeterministicHash("w15-t1-cp1-agent-def-audit-batch", ...sortedAuditHashes, createdAt)`
- `batchId`: `computeDeterministicHash("w15-t1-cp1-agent-def-audit-batch-id", batchHash)`
- `batchId !== batchHash` always (different seed prefixes guarantee this)
- Empty batch: hash over empty list + createdAt → valid non-empty hashes; `totalAudits=0`, `totalAgentsAcrossAudits=0`

#### Test Coverage (minimum 6 describe groups)

| Group | Coverage |
|---|---|
| empty batch | `totalAudits === 0`; `totalAgentsAcrossAudits === 0`; valid hashes |
| single audit | correct `totalAudits=1`; correct `totalAgentsAcrossAudits` |
| multiple audits | sums `totalAgents` across all audits correctly |
| determinism | same inputs → same `batchHash` and `batchId`; different inputs → different hash |
| factory | `createAgentDefinitionAuditBatchContract` returns working instance |
| output shape | `batchId !== batchHash`; `totalAudits === audits.length`; `createdAt` from `now()` |

### CP2 — Tranche Closure Review

#### Deliverables

1. `docs/reviews/CVF_W15_T1_TRANCHE_CLOSURE_REVIEW_2026-03-30.md`
2. `docs/baselines/CVF_GC026_TRACKER_SYNC_W15_T1_CLOSURE_2026-03-30.md`
3. `docs/reference/CVF_WHITEPAPER_PROGRESS_TRACKER.md` — W15-T1 row → CLOSED DELIVERED
4. `AGENT_HANDOFF.md` — W15-T1 CLOSED DELIVERED; no active tranche

---

## Pass Conditions (all 7 must satisfy for CP1 exit)

| # | Condition |
|---|---|
| 1 | `AgentDefinitionAuditBatchContract` created with `batch()` method returning `AgentDefinitionAuditBatch` |
| 2 | Dedicated test file; all tests pass |
| 3 | CPF test count increases from 2196 |
| 4 | Export added to CPF `index.ts` |
| 5 | Test partition entry added to registry |
| 6 | No existing contracts changed |
| 7 | `now()` injection; `batchId` ≠ `batchHash`; deterministic `totalAgentsAcrossAudits` |

---

## Constraints

- `agent.definition.boundary.contract.ts` — READ_ONLY; no modifications
- `agent.definition.capability.batch.contract.ts` — READ_ONLY; pattern reference only
- `agent.scope.resolution.batch.contract.ts` — READ_ONLY; pattern reference only
- No `index.test.ts` additions (GC-024)
- All tests in dedicated file; all governance artifacts delivered in same CP commit
