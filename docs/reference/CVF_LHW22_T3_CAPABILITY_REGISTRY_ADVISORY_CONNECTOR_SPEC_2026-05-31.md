# CVF LHW22 T3 Capability Registry Advisory Connector Spec

Contract ID: `cvf.capabilityRegistryAdvisory.lhw22.t3.v1`

Memory class: POINTER_RECORD

Status: CLOSED_PASS_BOUNDED

Date: 2026-05-31

Wave: LHW22 T3

GC-018: `docs/baselines/CVF_GC018_LHW22_AGENT_INTELLIGENCE_FOUNDATIONS_2026-05-31.md`

`runtimeExecutionAuthorized=false`

---

## Purpose

Section: S1

Publish a documentation-only connection-point schema for task-to-capability-to-agent resolution registry.
This spec establishes an advisory mapping to align the legacy agent definition models with the active `EXTENSIONS/CVF_ECO_v2.3_AGENT_IDENTITY/` surfaces where agent registries and capabilities already exist.

No runtime codebase, agent registry database, or orchestration resolution logic is modified in this wave.

## Scope / Applies To

Applies to private-provenance documentation for agent identity and capability registration. No runtime agent scheduling, automatic dispatch, or dynamic routing is authorized.

## S2. Design

### Legacy Capability Registry Model

Source: `.private_reference/legacy/CVF_Important/ADDING_AGENT DEFINITION/CVF_CAPABILITY_REGISTRY_MODEL.md`

The legacy model establishes a clean abstraction between tasks and agents to decoupling agent routing from static tool definitions:

```yaml
capabilities:
  - id: string
    description: string
    mapped_agents:
      - agent_id
```

### Resolution Flow & Rules

1. **Resolution Flow**: Task → Capability → Agent.
   - When a task is assigned, the orchestrator determines which capability is required.
   - The capability registry is queried to find all agents that possess that capability.
   - The best-suited agent is selected based on orchestration priority.
2. **Cardinality Mapping Rules**:
   - One agent can register and hold multiple capabilities.
   - One capability can map to multiple agents.
3. **Orchestration Independence**: All final agent selection and load-balancing logic belongs strictly to the orchestrator, not to the registry itself.

## S3. Contract

The publication fields for Capability Registry advisory are:

```typescript
capabilityRegistryAdvisoryType:
  "cvf.capabilityRegistryAdvisory.lhw22.t3.v1"
capabilityRegistrySpec: {
  capabilities: Array<{
    id: string // Neutral capability ID (e.g. "filesystem.read")
    description: string // Description of the permitted boundary
    mappedAgents: string[] // List of agent IDs possessing this capability
  }>
  advisoryOnly: true
  runtimeExecutionAuthorized: false
}
```

These publication fields are not added to the active `IdentityManager` or agent registry codebase.

## S4. Integration Guidance

- When registering an agent via `IdentityManager.registerAgent()`, ensure that its `capabilities` field contains explicit neutral identifiers that match the capabilities listed in this registry.
- Avoid tight coupling of agent classes to specific tool lists. Resolve the execution requirements via neutral capabilities to maintain agent-neutral and client-neutral governance.
- Dynamic orchestration components can query the agent registry to filter capable agents before resolving selection scores.

## S5. Verification Matrix

| Claim | Source anchor | Result |
| --- | --- | --- |
| Legacy Capability Registry Model exists | `ADDING_AGENT DEFINITION/CVF_CAPABILITY_REGISTRY_MODEL.md` | PASS |
| Resolution Flow Task->Capability->Agent defined | `CVF_CAPABILITY_REGISTRY_MODEL.md` resolution flow | PASS |
| Current agent registry has capabilities | `agent.registry.ts` lines 17-33 | PASS |
| Current identity manager accepts capabilities | `identity.manager.ts` lines 21-24 | PASS |
| This tranche modifies identity manager or registry code | Git diff name status | N/A with reason: documentation-only wave |

## Public Export Disposition

DEFERRED_PRIVATE_ONLY - this connector spec remains in private provenance documentation. No public-sync export is authorized.

## Claim Boundary

This spec publishes a source-verified documentation schema only. It does not claim runtime agent routing, automated scheduling, registry database persistence, public readiness, or production readiness.
