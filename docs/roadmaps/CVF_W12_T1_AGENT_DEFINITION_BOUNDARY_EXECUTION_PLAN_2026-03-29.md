# CVF W12-T1 Execution Plan — Agent Definition Boundary Convergence

Memory class: SUMMARY_RECORD

> Date: 2026-03-29
> Tranche: W12-T1 — Agent Definition Boundary Convergence
> Authorization: `docs/reviews/CVF_GC018_CONTINUATION_CANDIDATE_W12_T1_AGENT_DEFINITION_BOUNDARY_2026-03-29.md`
> GC-026 auth sync: `docs/baselines/CVF_GC026_TRACKER_SYNC_W12_T1_AUTHORIZATION_2026-03-29.md`
> Continuation class: REALIZATION
> Risk class: R1 — new contract in existing module; additive only

---

## Scope Summary

Create `AgentDefinitionBoundaryContract` in `EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION` — the canonical governed boundary contract for agent definition authority. This closes the last PARTIAL item in the whitepaper merge map (v3.1-W10T1, Section 5).

The contract follows the exact W8-T1 boundary contract pattern: types, helper functions, contract class with `now()` injection and deterministic hash IDs, factory function.

---

## CP1 — Fast Lane (GC-021): AgentDefinitionBoundaryContract

**Deliverable:** `EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION/src/agent.definition.boundary.contract.ts`

**Contract methods:**
1. `registerDefinition(input)` — registers an agent with name, role, declared capabilities, declared domains; returns typed `AgentDefinitionRecord`
2. `validateCapability(agentId, capability, registered)` — validates that a capability is within the agent's declared scope; returns `CapabilityValidationResult`
3. `resolveScope(agentId, registered)` — resolves the full capability scope for an agent; returns `AgentScopeResolution`
4. `auditDefinitions(registered)` — generates a governance snapshot of all registered definitions; returns `AgentDefinitionAudit`

**Supporting files:**
- `EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION/tests/agent.definition.boundary.contract.test.ts` (dedicated, GC-023)
- `EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION/src/index.ts` — W12-T1 export block added
- `governance/compat/CVF_TEST_PARTITION_OWNERSHIP_REGISTRY.json` — W12-T1 partition entry added

**Governance artifacts:**
- `docs/audits/CVF_W12_T1_CP1_AGENT_DEFINITION_BOUNDARY_AUDIT_2026-03-29.md`
- `docs/reviews/CVF_GC021_W12_T1_CP1_AGENT_DEFINITION_BOUNDARY_REVIEW_2026-03-29.md`
- `docs/baselines/CVF_W12_T1_CP1_AGENT_DEFINITION_BOUNDARY_DELTA_2026-03-29.md`

---

## CP2 — Closure

**Deliverables:**
- `docs/reviews/CVF_W12_T1_TRANCHE_CLOSURE_REVIEW_2026-03-29.md`
- `docs/baselines/CVF_GC026_TRACKER_SYNC_W12_T1_CLOSURE_2026-03-29.md`
- `docs/reference/CVF_WHITEPAPER_PROGRESS_TRACKER.md` updated + GC-026 closure sync in same commit
- `AGENT_HANDOFF.md` updated

---

## Pass Conditions

| # | Condition | Verification |
|---|---|---|
| 1 | `AgentDefinitionBoundaryContract` created with registerDefinition, validateCapability, resolveScope, auditDefinitions | contract file exists |
| 2 | Dedicated test file (not index.test.ts); all tests pass | test file exists; npm test passes |
| 3 | CPF test count increases from 2110 | test run confirms |
| 4 | Export added to CPF index.ts | index.ts diff |
| 5 | Test partition entry added to registry | registry diff |
| 6 | No existing contracts changed | diff confirms |
| 7 | `now()` injection pattern followed; all hash IDs are deterministic | code review |
| 8 | Whitepaper merge map row for Agent Definition updated to SUBSTANTIALLY DELIVERED | whitepaper diff |
| 9 | No W7 chain destabilization | all W7 tests still pass |

---

## Execution Order

1. CP1 → commit (Fast Lane) — contract + tests + index.ts export + partition entry + governance docs
2. CP2 → commit — closure review + GC-026 closure sync + tracker update + whitepaper merge map update + AGENT_HANDOFF
3. Push all commits
