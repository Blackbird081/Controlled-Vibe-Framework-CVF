# CVF W13-T1 Execution Plan — Agent Definition Capability Batch Contract

Memory class: SUMMARY_RECORD

> Date: 2026-03-30
> Tranche: W13-T1 — Agent Definition Capability Batch Contract
> GC-018: `docs/reviews/CVF_GC018_CONTINUATION_CANDIDATE_W13_T1_AGENT_DEFINITION_CAPABILITY_BATCH_2026-03-30.md`
> Branch: `cvf-next`
> Continuation class: REALIZATION

---

## Scope

Create `AgentDefinitionCapabilityBatchContract` in CPF — a governed batch contract that aggregates `CapabilityValidationResult[]` into a canonical batch summary, extending the W12-T1 boundary contract output surface.

---

## Pass Conditions

1. `AgentDefinitionCapabilityBatchContract` produces deterministic `batchHash` for identical `CapabilityValidationResult[]` inputs
2. Counts (`withinScopeCount`, `outOfScopeCount`, `undeclaredAgentCount`) are accurate for all status combinations including empty batch
3. `dominantStatus` reflects the most frequent `CapabilityValidationStatus` (tie-broken: WITHIN_SCOPE > OUT_OF_SCOPE > UNDECLARED_AGENT); returns `"EMPTY"` for empty batch
4. `batchId ≠ batchHash` — batchId is derived from batchHash + createdAt
5. Dedicated test file per GC-023 (not added to `index.test.ts`)
6. CPF barrel export complete — no broken imports
7. Test partition registry updated

---

## Contract Interface Design

```typescript
export type CapabilityBatchDominantStatus =
  | CapabilityValidationStatus
  | "EMPTY";

export interface AgentDefinitionCapabilityBatch {
  batchId: string;
  batchHash: string;
  createdAt: string;
  totalResults: number;
  withinScopeCount: number;
  outOfScopeCount: number;
  undeclaredAgentCount: number;
  dominantStatus: CapabilityBatchDominantStatus;
}

export interface AgentDefinitionCapabilityBatchContractDependencies {
  now?: () => string;
}
```

Dominant status tie-break precedence: `WITHIN_SCOPE > OUT_OF_SCOPE > UNDECLARED_AGENT`

---

## Control Points

### CP1 — AgentDefinitionCapabilityBatchContract (Full Lane GC-019)

Lane: Full Lane (new concept/module in new tranche)

Deliverables:
- `EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION/src/agent.definition.capability.batch.contract.ts`
- `EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION/tests/agent.definition.capability.batch.contract.test.ts`
- `docs/audits/CVF_W13_T1_CP1_AGENT_DEF_CAP_BATCH_AUDIT_2026-03-30.md` (FULL_RECORD)
- `docs/reviews/CVF_GC019_W13_T1_CP1_AGENT_DEF_CAP_BATCH_REVIEW_2026-03-30.md` (FULL_RECORD)
- `docs/baselines/CVF_W13_T1_CP1_AGENT_DEF_CAP_BATCH_DELTA_2026-03-30.md` (SUMMARY_RECORD)
- `docs/baselines/CVF_GC026_TRACKER_SYNC_W13_T1_CP1_DONE_2026-03-30.md` (SUMMARY_RECORD)
- Updated CPF barrel exports (`EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION/src/index.ts`)
- Updated test partition registry (`governance/compat/CVF_TEST_PARTITION_OWNERSHIP_REGISTRY.json`)
- Updated incremental test log (`docs/CVF_INCREMENTAL_TEST_LOG.md`)
- Updated whitepaper progress tracker (`docs/reference/CVF_WHITEPAPER_PROGRESS_TRACKER.md`)
- Updated AGENT_HANDOFF (`AGENT_HANDOFF.md`)

Pass conditions: 1–7 all satisfied; CPF test count > 2144; 0 failures

### CP2 — Tranche Closure Review

Lane: N/A

Deliverables:
- `docs/reviews/CVF_W13_T1_TRANCHE_CLOSURE_REVIEW_2026-03-30.md` (FULL_RECORD)
- `docs/baselines/CVF_GC026_TRACKER_SYNC_W13_T1_CLOSED_DELIVERED_2026-03-30.md` (SUMMARY_RECORD)
- Updated whitepaper progress tracker (W13-T1 row → CLOSED DELIVERED)
- Updated AGENT_HANDOFF (W13-T1 CLOSED DELIVERED)

---

## Fixed Inputs (READ_ONLY — must not be modified)

- `EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION/src/agent.definition.boundary.contract.ts` (W12-T1)
- All other existing CPF contracts
- W7 schema chain (Runtime → Memory)

---

## Test Commands

```bash
cd EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION && npm run check && npm test
```

---

## Commit Format

```
feat(W13-T1/CP1): AgentDefinitionCapabilityBatchContract — Full Lane

Tranche: W13-T1 — Agent Definition Capability Batch Contract
Control point: CP1 — AgentDefinitionCapabilityBatchContract
Lane: Full Lane (GC-019)

Contract: aggregates CapabilityValidationResult[] → AgentDefinitionCapabilityBatch
  (withinScopeCount, outOfScopeCount, undeclaredAgentCount, dominantStatus)
Tests: N new (M CPF total, 0 failures)
Governance artifacts: audit, review, delta, GC-026 sync
```
