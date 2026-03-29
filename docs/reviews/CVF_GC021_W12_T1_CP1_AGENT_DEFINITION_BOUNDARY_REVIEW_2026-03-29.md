# CVF GC-021 Fast Lane Review — W12-T1 CP1: Agent Definition Boundary Contract

Memory class: FULL_RECORD

> Date: 2026-03-29
> Tranche: W12-T1 — Agent Definition Boundary Convergence
> CP: CP1 — Fast Lane (GC-021)
> Authorization: `docs/reviews/CVF_GC018_CONTINUATION_CANDIDATE_W12_T1_AGENT_DEFINITION_BOUNDARY_2026-03-29.md`
> Audit: `docs/audits/CVF_W12_T1_CP1_AGENT_DEFINITION_BOUNDARY_AUDIT_2026-03-29.md`
> Delta: `docs/baselines/CVF_W12_T1_CP1_AGENT_DEFINITION_BOUNDARY_DELTA_2026-03-29.md`

---

## Fast Lane Eligibility

- Continuation class: REALIZATION
- Risk class: R1 — new contract; additive; no existing contract changes
- GC-021 threshold: R0/R1 additive work inside an authorized tranche qualifies for Fast Lane
- Eligibility: CONFIRMED

---

## Change Summary

Created `AgentDefinitionBoundaryContract` in `EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION` — the canonical governed boundary contract for agent definition authority. Closes the last PARTIAL item in the whitepaper merge map (Section 5).

### Files Changed

| File | Change |
|---|---|
| `EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION/src/agent.definition.boundary.contract.ts` | CREATED (212 lines) |
| `EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION/tests/agent.definition.boundary.contract.test.ts` | CREATED (232 lines, dedicated GC-023) |
| `EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION/src/index.ts` | ADDITIVE EXPORT — W12-T1 block appended (737 → 754 lines) |
| `governance/compat/CVF_TEST_PARTITION_OWNERSHIP_REGISTRY.json` | ADDITIVE ENTRY — W12-T1 partition |

### Contract Capabilities

1. `registerDefinition(input)` — registers agent with name, role, capabilities, domains; returns `AgentDefinitionRecord` with deterministic `agentId` and `definitionHash`
2. `validateCapability(agentId, capability, record?)` — validates capability is in declared scope; returns `CapabilityValidationResult` with WITHIN_SCOPE / OUT_OF_SCOPE / UNDECLARED_AGENT status
3. `resolveScope(agentId, record?)` — resolves full authorized scope; returns `AgentScopeResolution` with RESOLVED / EMPTY_SCOPE / UNDECLARED_AGENT status
4. `auditDefinitions(registered)` — governance snapshot of all registered definitions; returns `AgentDefinitionAudit`

### Governance Invariants Enforced

- Agent cannot self-extend capability scope (OUT_OF_SCOPE for unlisted capabilities)
- Agent with no registration is UNDECLARED_AGENT — distinct from EMPTY_SCOPE
- Capability scope is immutable once registered (copy stored internally)
- All hash IDs are deterministic and distinct from their hash siblings

---

## Test Results

| Scope | Tests | Result |
|---|---|---|
| `agent.definition.boundary.contract.test.ts` | 36 | ALL PASS |
| CPF full suite (parallel) | 2146 | 2145 pass + 1 pre-existing flaky in `gateway.consumer.test.ts` (confirmed passes in isolation) |

---

## No-Regression Confirmation

- No existing contracts changed: CONFIRMED
- No existing tests changed: CONFIRMED
- W7 chain impact: NONE
- `index.test.ts` frozen: CONFIRMED (not touched)

---

## Review Verdict

**FAST LANE APPROVED — CP1 deliverable accepted**

All 9 pass conditions from the GC-018 authorization satisfied. R1 additive-only contract. 36 new tests. No violations.
