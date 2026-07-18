# CVF LHW22 T1 UCO Capability Constraint Advisory Connector Spec

Contract ID: `cvf.ucoCapabilityConstraintAdvisory.lhw22.t1.v1`

Memory class: POINTER_RECORD

Status: CLOSED_PASS_BOUNDED

Date: 2026-05-31

Wave: LHW22 T1

GC-018: `docs/baselines/CVF_GC018_LHW22_AGENT_INTELLIGENCE_FOUNDATIONS_2026-05-31.md`

`runtimeExecutionAuthorized=false`

---

## Purpose

Section: S1

Publish a documentation-only connection-point schema for execution-scoped Unified Constraint Objects (UCO). 
This tranche establishes an advisory mapping to connect the legacy trust/isolation UCO concepts with the active `EXTENSIONS/CVF_GUARD_CONTRACT/` surfaces.

No runtime contract mutation, route change, or provider behavior change is authorized.

## Scope / Applies To

Applies to private-provenance documentation for the CVF governance and validation layer. No runtime UCO enforcement or execution-plane adaptation is authorized.

## S2. Design

### Legacy Trust & Isolation Layer (UCO Concept)

Source: `.private_reference/legacy/CVF_Important/ADDING_TRUST & ISOLATION LAYER/CVF_TRUST_AND_ISOLATION_LAYER.md`
Source: `.private_reference/legacy/CVF_Important/ADDING_TRUST & ISOLATION LAYER/CVF_CAPABILITY_INTEGRATION_SPEC.md`

1. **Boundary over Behavior**: Controlled via boundaries + explicit constraints instead of prompts.
2. **Zero Implicit Trust**: No agent, tool, or context is implicitly trusted.
3. **Execution-Scoped Authority**: Authority belongs strictly to the execution context.
4. **No Free-form Tools**: Every tool maps to one or more capabilities. No `allowed_tools` or `denied_tools` list is used.

### UCO Structure Absorption

The canonical UCO structure is defined as:

```json
{
  "execution_id": "exec_123",
  "agent_id": "agent_xyz",
  "session_id": "session_abc",
  "capabilities": [
    {
      "name": "filesystem.read",
      "scope": "/data/*",
      "constraints": {
        "rate_limit": "10/min",
        "timeout": "3s",
        "max_retries": 1
      }
    }
  ],
  "global_limits": {
    "max_calls": 5,
    "time_budget": "10s",
    "token_budget": 3000
  },
  "context_access": "restricted",
  "secret_scope": "execution_only"
}
```

## S3. Contract

The publication fields for UCO constraint capability-based mapping are:

```typescript
ucoCapabilityConstraintAdvisoryType:
  "cvf.ucoCapabilityConstraintAdvisory.lhw22.t1.v1"
ucoConstraintSpec: {
  executionId: string
  agentId: string
  sessionId: string
  capabilities: Array<{
    name: string
    scope: string
    constraints: {
      rateLimit?: string
      timeout?: string
      maxRetries?: number
    }
  }>
  globalLimits: {
    maxCalls: number
    timeBudget: string
    tokenBudget: number
  }
  contextAccess: "restricted" | "unrestricted"
  secretScope: "execution_only" | "global"
  advisoryOnly: true
  runtimeExecutionAuthorized: false
}
```

These publication fields represent future design targets and are not added to the runtime codebase in LHW22.

## S4. Integration Guidance

- Future execution environments should fetch the UCO by `execution_id` before permitting tool resolution.
- Enforce capability boundaries strictly through future governed runtime contracts; current `EXTENSIONS/CVF_GUARD_CONTRACT/` source exposes agent capability slots under `AgentRegistration.capabilities`, not a UCO runtime gate.
- Do not rely on LLM prompts to enforce file path scopes or request timeouts; use the UCO constraints as hard boundaries.

## S5. Verification Matrix

| Claim | Source anchor | Result |
| --- | --- | --- |
| Legacy UCO architecture exists | `CVF_TRUST_AND_ISOLATION_LAYER.md` Section 1 | PASS |
| Legacy UCO schema and rules exist | `CVF_CAPABILITY_INTEGRATION_SPEC.md` Section 2 | PASS |
| Current governed capability contract exists | `governed-capability.contract.ts` lines 43-61 | PASS |
| Current agent registration has capabilities | `types.ts` `AgentRegistration.capabilities` | PASS |
| This tranche modifies any code files | Git diff name status | N/A with reason: documentation-only wave |

## Public Export Disposition

DEFERRED_PRIVATE_ONLY - this connector spec remains in private provenance documentation. No public-sync export is authorized.

## Claim Boundary

This spec publishes a source-verified documentation schema only. It does not claim runtime UCO enforcement, execute route response modifications, capability gate runtime changes, public readiness, or production readiness.
