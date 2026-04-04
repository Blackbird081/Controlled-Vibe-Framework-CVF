# CVF W17-T1 Execution Plan — Agent Registration Batch Contract

Memory class: SUMMARY_RECORD

> Date: 2026-03-30
> Tranche: W17-T1 — Agent Registration Batch Contract
> Authorization: `docs/reviews/CVF_GC018_CONTINUATION_CANDIDATE_W17_T1_AGENT_REGISTRATION_BATCH_2026-03-30.md`
> Quality gate: `docs/assessments/CVF_POST_W16_CONTINUATION_QUALITY_ASSESSMENT_2026-03-30.md` (9.67/10 EXCELLENT)

---

## Objective

Create `AgentRegistrationBatchContract` in CPF — the batch aggregation surface for `registerDefinition()` from `AgentDefinitionBoundaryContract` (W12-T1). This closes the final unbatched surface of the W12-T1 family.

---

## Control Points

| CP | Gate | Description |
|---|---|---|
| CP1 | Full Lane (GC-019) | Implement `AgentRegistrationBatchContract` + tests + audit + review + delta + GC-026 sync |
| CP2 | Tranche Closure | Closure review + GC-026 closed sync + tracker/handoff update |

---

## CP1 Deliverables

### Implementation

File: `EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION/src/agent.registration.batch.contract.ts`

Types:
- `RegistrationStatus: "REGISTERED" | "DUPLICATE"` — duplicate = same `definitionHash` already seen in batch run
- `AgentRegistrationResult` — per-input result: `resultId`, `processedAt`, `agentId`, `name`, `status`, `reason`, `record`, `resultHash`
- `AgentRegistrationBatch` — summary: `batchId`, `createdAt`, `totalResults`, `registeredCount`, `duplicateCount`, `dominantStatus`, `results`, `batchHash`
- `AgentRegistrationBatchContractDependencies` — `now?: () => string`
- `ScopeRegistrationBatchDominantStatus: "REGISTERED" | "DUPLICATE" | "EMPTY"`

Class: `AgentRegistrationBatchContract`
- `batch(inputs: AgentDefinitionInput[], boundary: AgentDefinitionBoundaryContract): AgentRegistrationBatch`
- Dominant status tie-break: `REGISTERED > DUPLICATE`
- Empty batch: `dominantStatus = "EMPTY"`

Factory: `createAgentRegistrationBatchContract`

### Tests

File: `EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION/tests/agent.registration.batch.contract.test.ts`

Test groups (26 tests target):
1. Empty batch — 4 tests
2. Registration counts — 4 tests
3. Dominant status + tie-break (REGISTERED > DUPLICATE) — 8 tests
4. Determinism — 5 tests
5. Factory — 2 tests
6. Output shape — 3 tests

### Governance artifacts
- `docs/audits/CVF_W17_T1_CP1_AGENT_REGISTRATION_BATCH_AUDIT_2026-03-30.md`
- `docs/reviews/CVF_GC019_W17_T1_CP1_AGENT_REGISTRATION_BATCH_REVIEW_2026-03-30.md`
- `docs/baselines/CVF_W17_T1_CP1_AGENT_REGISTRATION_BATCH_DELTA_2026-03-30.md`
- `docs/baselines/CVF_GC026_TRACKER_SYNC_W17_T1_CP1_DONE_2026-03-30.md`

---

## Fixed Inputs (READ-ONLY)

- `EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION/src/agent.definition.boundary.contract.ts` (W12-T1)
- `EXTENSIONS/CVF_v1.9_DETERMINISTIC_REPRODUCIBILITY/core/deterministic.hash.ts`

---

## Exit Criteria

- CPF test count: 2222 → 2248 (+26, 0 failures)
- All 7 pass conditions from GC-018 satisfied
- Closure review signed off
