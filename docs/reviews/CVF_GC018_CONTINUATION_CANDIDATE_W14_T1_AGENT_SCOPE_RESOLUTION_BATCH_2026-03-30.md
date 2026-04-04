# CVF GC-018 Continuation Candidate — W14-T1: Agent Scope Resolution Batch Contract

Memory class: FULL_RECORD

> Date: 2026-03-30
> Candidate: W14-T1 — Agent Scope Resolution Batch Contract
> Continuation class: REALIZATION
> Quality assessment: `docs/assessments/CVF_POST_W13_CONTINUATION_QUALITY_ASSESSMENT_2026-03-30.md` (9.03/10 EXCELLENT)
> Pre-GC-018 quality-first decision: EXPAND_NOW
> Dependent surface (fixed input): `EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION/src/agent.definition.boundary.contract.ts` (W12-T1 — READ_ONLY)

---

## 1. Continuation Justification

### Why Now

W13-T1 delivered `AgentDefinitionCapabilityBatchContract` — the governed batch aggregation surface for `CapabilityValidationResult[]` produced by the `validateCapability` method of `AgentDefinitionBoundaryContract` (W12-T1).

`AgentDefinitionBoundaryContract` exposes two additional output surfaces that lack a governed batch aggregation layer:

1. `resolveScope(agentId)` → `AgentScopeResolution` — scope resolution output; no batch contract exists
2. `auditDefinitions()` → `AgentDefinitionAudit` — audit snapshot output; no batch contract exists

W14-T1 closes the first of these gaps by delivering `AgentScopeResolutionBatchContract` — the governed batch surface for `AgentScopeResolution[]`. This directly mirrors the W13-T1 delivery pattern and completes the W12-T1 scope resolution surface.

### Quality Gate

Quality posture: 9.03/10 EXCELLENT — EXPAND_NOW confirmed. No remediation-first trigger. See `docs/assessments/CVF_POST_W13_CONTINUATION_QUALITY_ASSESSMENT_2026-03-30.md`.

---

## 2. Proposed Scope

### New Surface

`AgentScopeResolutionBatchContract` in `CVF_CONTROL_PLANE_FOUNDATION`:

```
AgentScopeResolutionBatch {
  batchId: string           // distinct from batchHash; seeded "scope-resolution-batch-id:" prefix
  createdAt: string         // from injected now()
  totalResults: number
  results: AgentScopeResolution[]
  resolvedCount: number     // status === "RESOLVED"
  emptyScopeCount: number   // status === "EMPTY_SCOPE"
  undeclaredAgentCount: number // status === "UNDECLARED_AGENT"
  dominantStatus: ScopeResolutionStatus | "EMPTY" // tie-break: RESOLVED > EMPTY_SCOPE > UNDECLARED_AGENT
  batchHash: string         // seeded "scope-resolution-batch:" prefix; deterministic over sorted resultHashes
}
```

Factory: `createAgentScopeResolutionBatchContract(deps?)`

---

## 3. Depth Audit

| Criterion | Score | Notes |
|---|---|---|
| Technical necessity | 8/10 | Closes W12-T1 scope-resolution batch gap; mirrors W13-T1 pattern |
| Architectural fit | 9/10 | Additive-only in CPF; follows established batch contract pattern |
| Risk | 9/10 | R1 — no existing contracts touched; W12-T1 surface READ_ONLY |
| Governance readiness | 9/10 | 9.03/10 EXCELLENT quality posture; execution plan clear |
| Scope boundedness | 9/10 | Single new contract + tests; no inter-plane dependencies |

**Depth audit score: 8.8/10 — CONTINUE**

---

## 4. Authorization Boundary

**YES — W14-T1 is authorized.**

Authorization conditions:
- `AgentDefinitionBoundaryContract` (W12-T1) is a fixed READ_ONLY input; no modifications permitted
- `AgentScopeResolutionBatchContract` must be additive-only in CPF
- `batchId` must be distinct from `batchHash` (same seeded-prefix pattern as W13-T1)
- `dominantStatus` tie-break order: RESOLVED > EMPTY_SCOPE > UNDECLARED_AGENT
- Empty batch must return `dominantStatus: "EMPTY"` (no zero-count coercion)
- All test files must be dedicated (no `index.test.ts` additions — GC-023)
- All governance artifacts (audit, review, delta, GC-026 sync) must be delivered in the same CP

---

## 5. Ownership Map

### New Surfaces (W14-T1 owns)

| Surface | Type | Action |
|---|---|---|
| `EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION/src/agent.scope.resolution.batch.contract.ts` | CONTRACT | CREATE |
| `EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION/tests/agent.scope.resolution.batch.contract.test.ts` | TEST | CREATE |
| `EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION/src/index.ts` | EXPORT UPDATE | APPEND W14-T1 block |
| `governance/compat/CVF_TEST_PARTITION_OWNERSHIP_REGISTRY.json` | REGISTRY | ADD W14-T1 partition entry |

### Fixed Inputs (READ_ONLY — W14-T1 must not modify)

| Surface | Owner | Reason |
|---|---|---|
| `src/agent.definition.boundary.contract.ts` | W12-T1 | Canonical boundary contract; fixed input |
| `src/agent.definition.capability.batch.contract.ts` | W13-T1 | Sibling batch contract; READ_ONLY |

---

## 6. Not In This Wave

- `AgentDefinitionAuditBatchContract` — deferred to W15-T1 or later
- Any modification to `AgentDefinitionBoundaryContract` — forbidden in this wave
- Any new method added to `AgentDefinitionBoundaryContract` — forbidden in this wave
- Any EPF, LPF, or GEF surface changes
- Architecture whitepaper update — not required (additive-only)

---

## 7. Dependency Declaration

| Dependency | Type | Status |
|---|---|---|
| `AgentDefinitionBoundaryContract` (W12-T1) | Fixed input | CLOSED DELIVERED — READ_ONLY |
| `AgentDefinitionCapabilityBatchContract` (W13-T1) | Sibling reference | CLOSED DELIVERED — pattern reference only |
| `computeDeterministicHash` (CVF_v1.9 deterministic reproducibility) | Utility | STABLE — no change required |

---

## 8. Pass Conditions

| # | Condition |
|---|---|
| 1 | `AgentScopeResolutionBatchContract` created with `batch()` method returning `AgentScopeResolutionBatch` |
| 2 | Dedicated test file; all tests pass |
| 3 | CPF test count increases from 2170 |
| 4 | Export added to CPF `index.ts` |
| 5 | Test partition entry added to registry |
| 6 | No existing contracts changed |
| 7 | `now()` injection; `batchId` ≠ `batchHash`; deterministic counts and `dominantStatus` |
