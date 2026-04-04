# CVF GC-018 Continuation Candidate — W17-T1: Agent Registration Batch Contract

Memory class: FULL_RECORD

> Date: 2026-03-30
> Tranche: W17-T1 — Agent Registration Batch Contract
> Class: REALIZATION
> Quality gate: `docs/assessments/CVF_POST_W16_CONTINUATION_QUALITY_ASSESSMENT_2026-03-30.md` (9.67/10 EXCELLENT — EXPAND_NOW)
> Baseline: W16-T1 CLOSED DELIVERED — Whitepaper v3.3-W15T1; CPF 2222 tests, 0 failures

---

## Candidate Summary

`AgentRegistrationBatchContract` batches `AgentDefinitionInput[]` through `registerDefinition()` of `AgentDefinitionBoundaryContract` (W12-T1) into a governed batch summary. This closes the final unbatched surface of the W12-T1 family — all four methods (`registerDefinition`, `validateCapability`, `resolveScope`, `auditDefinitions`) will have governed batch contracts.

---

## Depth Audit

| Audit dimension | Finding | Score |
|---|---|---|
| Surface clarity | `registerDefinition()` returns `AgentDefinitionRecord`; batch aggregates input array with duplicate detection via `definitionHash` | 9/10 |
| Status model | `RegistrationStatus: "REGISTERED" \| "DUPLICATE"` — duplicate = same `definitionHash` already present in batch run | 9/10 |
| Tie-break precedence | `REGISTERED > DUPLICATE` — at least one new registration dominates | 9/10 |
| Pattern conformance | Identical to W13-T1 / W14-T1 / W15-T1; deterministic hash + now() injection | 10/10 |
| Risk | R1 — additive; no existing contract modified; W12-T1 fixed input READ_ONLY | 10/10 |
| Complexity | Low — known pattern; no new architecture concepts | 9/10 |

**Depth audit: 9.3/10 — CONTINUE**

---

## Scope Declaration

### In scope (W17-T1)
- `AgentRegistrationBatchContract` class with `batch(inputs, registered)` method
- `RegistrationStatus: "REGISTERED" | "DUPLICATE"` type
- `AgentRegistrationResult` interface (per-input result with status, record, reason, resultHash)
- `AgentRegistrationBatch` interface (batch summary with counts, dominantStatus, batchHash, batchId)
- Dedicated test file (26 tests minimum)
- index.ts export block
- Registry partition entry

### Not in scope (W17-T1)
- Modification of `AgentDefinitionBoundaryContract` (W12-T1) — READ_ONLY fixed input
- Modification of W13-T1 / W14-T1 / W15-T1 contracts
- Any EPF / GEF / LPF changes
- Whitepaper update (separate tranche if needed)

---

## Dependency Declaration

- Fixed input: `AgentDefinitionBoundaryContract` from `agent.definition.boundary.contract.ts` (W12-T1) — type-only import; `AgentDefinitionInput`, `AgentDefinitionRecord`
- Fixed input: `computeDeterministicHash` from `CVF_v1.9_DETERMINISTIC_REPRODUCIBILITY`

---

## Pass Conditions

| # | Condition |
|---|---|
| 1 | `AgentRegistrationBatchContract` created with `batch()` method |
| 2 | Dedicated test file; all tests pass |
| 3 | CPF test count increases from 2222 |
| 4 | Export added to CPF index.ts |
| 5 | Test partition entry added to registry |
| 6 | No existing contracts changed |
| 7 | `now()` injection; `batchId` ≠ `batchHash`; deterministic counts; duplicate detection by `definitionHash` |

---

## Authorization Decision

**W17-T1 GC-018 AUTHORIZED**

- Continuation class: REALIZATION
- Risk class: R1
- Quality gate: 9.67/10 EXCELLENT — EXPAND_NOW
- Depth audit: 9.3/10 — CONTINUE
- Lane: Full Lane (GC-019) — new contract and module creation
- Fixed input: `AgentDefinitionBoundaryContract` (W12-T1) — READ_ONLY
