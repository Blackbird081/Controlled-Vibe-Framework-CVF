# CVF GC-018 Continuation Candidate — W15-T1: Agent Definition Audit Batch Contract

Memory class: FULL_RECORD

> Date: 2026-03-30
> Candidate: W15-T1 — Agent Definition Audit Batch Contract
> Continuation class: REALIZATION
> Quality assessment: `docs/assessments/CVF_POST_W13_CONTINUATION_QUALITY_ASSESSMENT_2026-03-30.md` (9.03/10 EXCELLENT)
> Pre-GC-018 quality-first decision: EXPAND_NOW
> Dependent surface (fixed input): `EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION/src/agent.definition.boundary.contract.ts` (W12-T1 — READ_ONLY)

---

## 1. Continuation Justification

### Why Now

W14-T1 delivered `AgentScopeResolutionBatchContract` — the governed batch aggregation surface for `AgentScopeResolution[]` produced by the `resolveScope()` method of `AgentDefinitionBoundaryContract` (W12-T1). The W14-T1 GC-018 explicitly deferred the remaining batch surface:

> `AgentDefinitionAuditBatchContract` — deferred to W15-T1 or later

`AgentDefinitionBoundaryContract` exposes one remaining output surface without a governed batch aggregation layer:

- `auditDefinitions(registered: AgentDefinitionRecord[])` → `AgentDefinitionAudit` — audit snapshot output; no batch contract exists

W15-T1 closes this final gap by delivering `AgentDefinitionAuditBatchContract` — the governed batch surface for `AgentDefinitionAudit[]`. This completes the W12-T1 agent definition family and mirrors the W13-T1 / W14-T1 delivery pattern.

### Quality Gate

Quality posture: 9.03/10 EXCELLENT — EXPAND_NOW confirmed. No remediation-first trigger. See `docs/assessments/CVF_POST_W13_CONTINUATION_QUALITY_ASSESSMENT_2026-03-30.md`.

---

## 2. Proposed Scope

### New Surface

`AgentDefinitionAuditBatchContract` in `CVF_CONTROL_PLANE_FOUNDATION`:

```
AgentDefinitionAuditBatch {
  batchId: string                  // distinct from batchHash; seeded "w15-t1-cp1-agent-def-audit-batch-id" prefix
  batchHash: string                // seeded "w15-t1-cp1-agent-def-audit-batch" prefix; deterministic over sorted auditHashes + createdAt
  createdAt: string                // from injected now()
  totalAudits: number              // audits.length
  totalAgentsAcrossAudits: number  // sum of audit.totalAgents across all audits in batch
}
```

Factory: `createAgentDefinitionAuditBatchContract(deps?)`

Note: `AgentDefinitionAudit` has no status enum — aggregate is by `totalAgents` count, not dominant status. This differentiates W15-T1 from W13-T1 (dominant capability status) and W14-T1 (dominant scope resolution status).

---

## 3. Depth Audit

| Criterion | Score | Notes |
|---|---|---|
| Technical necessity | 9/10 | Closes the last W12-T1 batch gap; explicitly deferred in W14-T1 GC-018 |
| Architectural fit | 9/10 | Additive-only in CPF; follows established batch contract pattern |
| Risk | 9/10 | R1 — no existing contracts touched; W12-T1 surface READ_ONLY |
| Governance readiness | 9/10 | 9.03/10 EXCELLENT quality posture; execution plan clear |
| Scope boundedness | 9/10 | Single new contract + tests; no inter-plane dependencies; no dominant status complexity |

**Depth audit score: 9.0/10 — CONTINUE**

---

## 4. Authorization Boundary

**YES — W15-T1 is authorized.**

Authorization conditions:
- `AgentDefinitionBoundaryContract` (W12-T1) is a fixed READ_ONLY input; no modifications permitted
- `AgentDefinitionAuditBatchContract` must be additive-only in CPF
- `batchId` must be distinct from `batchHash` (different seed-prefix pattern — same rule as W13-T1 / W14-T1)
- Empty batch must return `totalAudits=0`, `totalAgentsAcrossAudits=0`, valid deterministic hashes
- All test files must be dedicated (no `index.test.ts` additions — GC-024)
- All governance artifacts (audit, review, delta, GC-026 sync) must be delivered in the same CP

---

## 5. Ownership Map

### New Surfaces (W15-T1 owns)

| Surface | Type | Action |
|---|---|---|
| `EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION/src/agent.definition.audit.batch.contract.ts` | CONTRACT | CREATE |
| `EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION/tests/agent.definition.audit.batch.contract.test.ts` | TEST | CREATE |
| `EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION/src/index.ts` | EXPORT UPDATE | APPEND W15-T1 block |
| `governance/compat/CVF_TEST_PARTITION_OWNERSHIP_REGISTRY.json` | REGISTRY | ADD W15-T1 partition entry |

### Fixed Inputs (READ_ONLY — W15-T1 must not modify)

| Surface | Owner | Reason |
|---|---|---|
| `src/agent.definition.boundary.contract.ts` | W12-T1 | Canonical boundary contract; fixed input |
| `src/agent.definition.capability.batch.contract.ts` | W13-T1 | Sibling batch contract; READ_ONLY |
| `src/agent.scope.resolution.batch.contract.ts` | W14-T1 | Sibling batch contract; READ_ONLY |

---

## 6. Not In This Wave

- Any modification to `AgentDefinitionBoundaryContract` — forbidden in this wave
- Any new method added to `AgentDefinitionBoundaryContract` — forbidden in this wave
- Any EPF, LPF, or GEF surface changes
- Architecture whitepaper update — not required (additive-only REALIZATION)
- Any future W16+ candidates — not authorized here

---

## 7. Dependency Declaration

| Dependency | Type | Status |
|---|---|---|
| `AgentDefinitionBoundaryContract` (W12-T1) | Fixed input | CLOSED DELIVERED — READ_ONLY |
| `AgentDefinitionCapabilityBatchContract` (W13-T1) | Sibling reference | CLOSED DELIVERED — pattern reference only |
| `AgentScopeResolutionBatchContract` (W14-T1) | Sibling reference | CLOSED DELIVERED — pattern reference only |
| `computeDeterministicHash` (CVF_v1.9 deterministic reproducibility) | Utility | STABLE — no change required |

---

## 8. Pass Conditions

| # | Condition |
|---|---|
| 1 | `AgentDefinitionAuditBatchContract` created with `batch()` method returning `AgentDefinitionAuditBatch` |
| 2 | Dedicated test file; all tests pass |
| 3 | CPF test count increases from 2196 |
| 4 | Export added to CPF `index.ts` |
| 5 | Test partition entry added to registry |
| 6 | No existing contracts changed |
| 7 | `now()` injection; `batchId` ≠ `batchHash`; deterministic `totalAgentsAcrossAudits` |
