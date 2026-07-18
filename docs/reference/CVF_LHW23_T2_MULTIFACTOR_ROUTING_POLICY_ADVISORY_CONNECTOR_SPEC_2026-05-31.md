# CVF LHW23 T2 Multi-Factor Routing Policy Advisory Connector Spec

Contract ID: `cvf.multifactorRoutingPolicyAdvisory.lhw23.t2.v1`

Memory class: POINTER_RECORD

Status: CLOSED_PASS_BOUNDED

Date: 2026-05-31

Wave: LHW23 T2

GC-018: `docs/baselines/CVF_GC018_LHW23_ROUTING_REGISTRY_INTELLIGENCE_2026-05-31.md`

`runtimeExecutionAuthorized=false`

---

## Purpose

Section: S1

Publish a documentation-only connection-point schema for Multi-Factor Routing Policies.
This spec establishes an advisory mapping to connect legacy decision engine concepts with the active `EXTENSIONS/CVF_MODEL_GATEWAY/src/routing-policy.ts` and `EXTENSIONS/CVF_ECO_v2.2_GOVERNANCE_CLI/src/execute.client.ts` surfaces.

No runtime codebase, routing policy class, or provider resolution logic is modified.

## Scope / Applies To

Applies to private-provenance documentation for model gateway routing and provider resolution. No runtime routing engine, scoring weights, or active routing policy execution is authorized.

## S2. Design

### Legacy Routing Policy Engine

Source: `.private_reference/legacy/CVF_Important/ADDING_MODEL_ROUTER/CVF_ROUTING_POLICY_ENGINE.md`

1. **Multi-Factor Decision System**: Selection does not depend on a single parameter (such as a simple complexity threshold). It resolves dynamically based on a score derived from multiple weighted factors:
   - **Complexity**: Estimate token budget and reasoning depth.
   - **Risk Level**: Evaluate security boundaries and capability sensitivity.
   - **Execution Stage**: Planning vs execution vs reviewing stages.
   - **Cost Budget**: Max token limits and cost constraints.
   - **Reliability/Health**: Previous provider error rates and latency diagnostics.
2. **Pluggable Policies**: Support registering independent routing strategies that can override the default routing logic depending on the active session context.
3. **Adaptive Scoring**: Calibrate model selection scores based on feedback from the Learning Plane.

## S3. Contract

The publication fields for Multi-Factor Routing Policy advisory are:

```typescript
multifactorRoutingPolicyAdvisoryType:
  "cvf.multifactorRoutingPolicyAdvisory.lhw23.t2.v1"
routingPolicySpec: {
  routingContext: {
    complexityScore: number // 0.0 to 1.0 task complexity estimate
    riskLevel: "R0" | "R1" | "R2" | "R3"
    executionStage: "PLANNING" | "EXECUTION" | "REVIEWING"
    costBudgetLimit: number
  }
  policyScoringWeights: {
    complexityWeight: number
    riskWeight: number
    costWeight: number
    reliabilityWeight: number
  }
  advisoryOnly: true
  runtimeExecutionAuthorized: false
}
```

These publication fields represent design parameters and are not added to runtime routing policies.

## S4. Integration Guidance

- Future routing policy engines should pass the `routingContext` through the scoring weights to evaluate compatible provider models from the Model Registry.
- Integrate the resolved provider with `EXTENSIONS/CVF_ECO_v2.2_GOVERNANCE_CLI/src/execute.client.ts` `resolveProviderForRole` where CLI-level provider routing already exists.
- Ensure that if reliability drops (diagnosed via latency/timeouts), the weights adaptively shift to higher-health providers.

## S5. Verification Matrix

| Claim | Source anchor | Result |
| --- | --- | --- |
| Legacy Routing Policy Engine exists | `ADDING_MODEL_ROUTER/CVF_ROUTING_POLICY_ENGINE.md` | PASS |
| Multi-factor scoring factors verified | `CVF_ROUTING_POLICY_ENGINE.md` Section 4 | PASS |
| Current routing policy exists | `routing-policy.ts` `RoutingPolicyEngine` | PASS |
| Current role provider resolver exists | `execute.client.ts` `resolveProviderForRole` | PASS |
| This tranche modifies execute client or routing policies | Git diff name status | N/A with reason: documentation-only wave |

## Public Export Disposition

DEFERRED_PRIVATE_ONLY - this connector spec remains in private provenance documentation. No public-sync export is authorized.

## Claim Boundary

This spec publishes a source-verified documentation schema only. It does not claim runtime scoring logic execution, dynamic routing context parsing, CLI provider-routing overrides, public readiness, or production readiness.
