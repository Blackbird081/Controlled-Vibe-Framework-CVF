# CVF W12-T1 CP1 — Agent Definition Boundary Contract Delta

Memory class: SUMMARY_RECORD

> Date: 2026-03-29
> Tranche: W12-T1 — Agent Definition Boundary Convergence
> CP: CP1 — Fast Lane (GC-021)
> Delta type: REALIZATION — new contract + tests + export + partition entry

---

## Delta Summary

| Field | Before | After |
|---|---|---|
| CPF test count | 2110 | 2146 (+36) |
| `AgentDefinitionBoundaryContract` | NOT EXISTS | CANONICALLY DELIVERED |
| CPF index.ts lines | 737 | 754 |
| Test partition entries | 140 | 141 |

---

## New Contract

| Contract | Module | File | Methods |
|---|---|---|---|
| `AgentDefinitionBoundaryContract` | CPF (Control Plane Foundation) | `agent.definition.boundary.contract.ts` | `registerDefinition`, `validateCapability`, `resolveScope`, `auditDefinitions` |

---

## New Types

| Type | Description |
|---|---|
| `AgentRole` | `"executor" \| "observer" \| "orchestrator" \| "reviewer" \| "coordinator"` |
| `CapabilityValidationStatus` | `"WITHIN_SCOPE" \| "OUT_OF_SCOPE" \| "UNDECLARED_AGENT"` |
| `ScopeResolutionStatus` | `"RESOLVED" \| "EMPTY_SCOPE" \| "UNDECLARED_AGENT"` |
| `AgentDefinitionInput` | Input to registerDefinition |
| `AgentDefinitionRecord` | Canonical governance record |
| `CapabilityValidationResult` | Result of validateCapability |
| `AgentScopeResolution` | Result of resolveScope |
| `AgentDefinitionAudit` | Governance snapshot |

---

## Key Governance Invariants

1. `OUT_OF_SCOPE` returned for any capability not in declared allowlist — self-extension blocked
2. `UNDECLARED_AGENT` returned for any agent not in the registry — distinct from `EMPTY_SCOPE`
3. Capabilities immutably stored at registration time
4. All hash IDs deterministic via `computeDeterministicHash()`; ID ≠ hash for all pairs

---

## Scope Boundary

- No existing contracts changed
- No existing tests changed
- Not in this CP: consumer pipeline bridges, physical module merge, capability docs integration
