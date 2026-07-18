# CVF Model Gateway C-02 Provider Routing Boundary Rewrite Plan - 2026-06-14

Memory class: FULL_RECORD

Status: COMPLETE_PENDING_REVIEW

docType: reference

Date: 2026-06-14

Worker: Claude

dispatchBaseHead: `21f49ec5`

executionBaseHead: `3623d43f`

closureBaseHead: REVIEWER_CAPTURE_AFTER_WORKER_RETURN

Commit mode: WORKER_MUST_NOT_COMMIT

rawMemoryReleased=false

Fresh rewrite authority:
`docs/work_orders/CVF_AGENT_WORK_ORDER_MODEL_GATEWAY_C02_PROVIDER_ROUTING_BOUNDARY_REWRITE_FOR_CLAUDE_2026-06-14.md`

Old held packet (NOT resumed):
`docs/work_orders/CVF_AGENT_WORK_ORDER_MODEL_GATEWAY_EPF_PROVIDER_ROUTING_BOUNDARY_PLANNING_FOR_CLAUDE_2026-06-13.md`

## Public Export Disposition

DEFERRED_PRIVATE_ONLY

Reason: private provenance planning rewrite. Public-sync is not authorized by
this work order.

## Claim Boundary

This plan authorizes only documentation/planning decisions for the C-02 Model
Gateway provider routing boundary rewrite. It does not implement Model Gateway,
EPF provider routing, dynamic model registry, strategy engine, feedback loop,
AI Gateway environment signal capture, or any runtime/provider/live component.
No runtime/source/test mutation, provider/API call, package install, public-sync,
registry mutation, or autonomous mutation is authorized. WORKER_MUST_NOT_COMMIT.

---

## Purpose

Produce the fresh C-02 Model Gateway provider-routing boundary rewrite plan that
replaces the old held C-02 packet. The plan uses the completed Model Gateway
legacy recheck (`MGW-001`), current Model Gateway source, and Execution Plane
Foundation wrapper anchors to define planning boundaries only.

This is a documentation/planning artifact. It does not authorize implementation.

## Scope / Applies To

Applies to: C-02 provider routing boundary planning for
`EXTENSIONS/CVF_MODEL_GATEWAY/`. Governs the accepted legacy value map from
`docs/reference/CVF_MODEL_GATEWAY_LEGACY_ABSORPTION_RECHECK_PLAN_2026-06-13.md`
and defines scope decisions for strategy layer, routing policy engine, dynamic
model registry, integration flow, gateway interface, and AI Gateway deferral.

Does NOT authorize runtime/source/test mutation, provider/API use, public-sync,
package install, registry mutation, or AI Gateway absorption.

---

## 1. Source Authority Table

| Source | Role | Disposition |
| --- | --- | --- |
| `docs/work_orders/CVF_AGENT_WORK_ORDER_MODEL_GATEWAY_C02_PROVIDER_ROUTING_BOUNDARY_REWRITE_FOR_CLAUDE_2026-06-14.md` | Fresh C-02 dispatch authority and scope | ACCEPT |
| `docs/reference/CVF_MODEL_GATEWAY_LEGACY_ABSORPTION_RECHECK_PLAN_2026-06-13.md` | Accepted/deferred/rejected legacy value map; 12 accepted value keys; C-02 Resume Decision | ACCEPT |
| `docs/reference/CVF_LEGACY_ABSORPTION_COVERAGE_INDEX_2026-06-13.md` | `MGW-001` coverage row; `PARTIAL_RECHECK_REQUIRED` status | ACCEPT |
| `docs/reviews/CVF_MODEL_GATEWAY_LEGACY_ABSORPTION_COVERAGE_INDEX_COMPLETION_2026-06-13.md` | Codex reviewer closure; C-02 rewrite requirement; five disposition areas | ACCEPT |
| `docs/reviews/CVF_LEGACY_COVERAGE_INDEX_DISPATCH_GUARD_HARDENING_COMPLETION_2026-06-14.md` | Guard hardening `CLOSED_PASS_BOUNDED`; dispatch guard active | ACCEPT |
| `EXTENSIONS/CVF_MODEL_GATEWAY/src/routing-policy.ts` | Current `RoutingRequest`, `RoutingDecision`, `RoutingPolicyEngine`, `buildRoutingPolicyContractSnapshot` | ACCEPT |
| `EXTENSIONS/CVF_MODEL_GATEWAY/src/provider-capability-registry.ts` | Current `PROVIDER_CAPABILITY_REGISTRY` (provider-method capability lookup) | ACCEPT |
| `EXTENSIONS/CVF_MODEL_GATEWAY/src/provider-registry.ts` | Current `ProviderRegistry` (runtime provider store; `ProviderRecord`, `ProviderModel`) | ACCEPT |
| `EXTENSIONS/CVF_MODEL_GATEWAY/src/provider-method-contract.ts` | Current `ProviderMethodContract`, `ProviderCapabilityFile`, `ProviderMethodName` | ACCEPT |
| `EXTENSIONS/CVF_MODEL_GATEWAY/src/provider-method-gate.ts` | Current `ProviderMethodGate` helpers and `UnsupportedMethodError` | ACCEPT |
| `EXTENSIONS/CVF_MODEL_GATEWAY/src/provider-health.ts` | Current `ProviderHealthMonitor`, `ProviderHealthRecord` | ACCEPT |
| `EXTENSIONS/CVF_MODEL_GATEWAY/src/gateway-policy.ts` | Current `GatewayPolicyContext`, `GatewayPolicyResult`, `isPolicyAllowed` | ACCEPT |
| `EXTENSIONS/CVF_MODEL_GATEWAY/src/stream-contract.ts` | Current `StreamContract`, `StreamCapableProvider`, `StreamRequest` | ACCEPT |
| `EXTENSIONS/CVF_MODEL_GATEWAY/src/embedding-contract.ts` | Current `EmbeddingContract`, `EmbeddingCapableProvider`, `EmbeddingRequest` | ACCEPT |
| `EXTENSIONS/CVF_MODEL_GATEWAY/src/index.ts` | Exported Model Gateway barrel surface | ACCEPT |
| `EXTENSIONS/CVF_MODEL_GATEWAY/README.md` | Guard-contract boundary description | ACCEPT |
| `EXTENSIONS/CVF_EXECUTION_PLANE_FOUNDATION/README.md` | EPF purpose; `CVF_MODEL_GATEWAY` as gateway-facing wrapper anchor | ACCEPT |
| `EXTENSIONS/CVF_EXECUTION_PLANE_FOUNDATION/src/index.ts` (line 713) | `modelGateway` coordination anchor in `EXECUTION_PLANE_FOUNDATION_COORDINATION` | ACCEPT |

---

## 2. Legacy Coverage Disposition

Coverage index row: `MGW-001`

Coverage index file: `docs/reference/CVF_LEGACY_ABSORPTION_COVERAGE_INDEX_2026-06-13.md` (line 78)

Prior absorption: LHW17 T2 absorbed 4 source files (Routing Layer + Strategy
Layer advisory). Bounded recheck 2026-06-14 found 12 additional accepted value
keys beyond LHW17 T2. Codex reviewer remediation added one missed mini-gateway
interface row (`MODEL_GATEWAY_INTERFACE.md`), yielding 12 accepted value keys
total.

C-02 Resume Decision: `RESUME_WITH_REWRITE`

Source: `docs/reference/CVF_MODEL_GATEWAY_LEGACY_ABSORPTION_RECHECK_PLAN_2026-06-13.md` line 182.

Required dispositions per this plan (per work order and completion review):

| Required area | Source requirement |
| --- | --- |
| Strategy-layer depth (Execution Planner, Strategy Taxonomy, Feedback Loop, Strategy Registry) | recheck plan accepted values; completion review lines 139-144 |
| Routing-policy-engine pipeline (PolicyDecision, merge engine, escalation, constraint conflict) | recheck plan `routingPolicyEnginePluggablePipeline` |
| Dynamic model registry (tier model, health monitoring, findOptimal) | recheck plan `dynamicModelRegistryWithHealthMonitoring` |
| Integration-flow and gateway-interface boundary | recheck plan `integrationFlowResponsibilityBoundary`, `gatewayUnifiedInterfaceBoundary` |
| AI Gateway deferral re-state | recheck plan `allAIGatewayFamilyContent`; LHW17 T2 explicit deferral |

Old held packet status: NOT resumed. The old C-02 packet
(`docs/work_orders/CVF_AGENT_WORK_ORDER_MODEL_GATEWAY_EPF_PROVIDER_ROUTING_BOUNDARY_PLANNING_FOR_CLAUDE_2026-06-13.md`)
was current-source-only and did not incorporate legacy value keys. This plan is
written entirely from the fresh work order and bounded recheck evidence.

---

## 3. Current Owner Surface Map

The following table maps the 12 accepted legacy value keys to their current
owner surfaces in `EXTENSIONS/CVF_MODEL_GATEWAY/src/` and related extensions.

| Accepted value key | Legacy source file | Current owner surface | Coverage | Gap for C-02 |
| --- | --- | --- | --- | --- |
| `gatewayThreeLayerArchitectureBoundary` | `CVF_ARCHITECTURE.md` | No explicit C-02 architecture boundary artifact | GAP | C-02 must define 3-layer boundary (Execution Design / Model Control / Execution Layer) |
| `executionStrategyTaxonomy` | `CVF_EXECUTION_STRATEGY_MODEL.md` | No strategy taxonomy (SINGLE_SHOT/ITERATIVE/MULTI_STEP/PARALLEL/TREE) in current source | GAP | C-02 must scope strategy taxonomy inclusion or deferral |
| `executionPlannerStepLifecycle` | `CVF_EXECUTION_PLANNER.md` | No Execution Planner (strategy-to-plan DAG, step expansion) in current source | GAP | C-02 must scope Execution Planner inclusion or deferral |
| `executionEngineStepLifecycleModel` | `CVF_EXECUTION_ENGINE.md` | EPF `pipeline-chain-orchestrator.ts` covers batch pipeline; no step lifecycle (PENDING/READY/RUNNING/SUCCESS/FAILURE) in Model Gateway source | PARTIAL | C-02 must confirm step lifecycle owner boundary |
| `feedbackLoopWeightedScoringModel` | `CVF_FEEDBACK_LOOP.md` | No feedback-to-routing loop (w1/w2/w3 scoring, moving average) in current Model Gateway or EPF source | GAP | C-02 must scope feedback loop inclusion or deferral |
| `observabilityThreeLayerDecomposition` | `CVF_EXECUTION_OBSERVABILITY.md` | `CVF_v1.8.1_ADAPTIVE_OBSERVABILITY_RUNTIME` covers telemetry; `gateway-receipt.ts` covers per-call evidence; step/model-level layered decomposition not in Model Gateway source | PARTIAL | C-02 may note observability gap without scoping implementation |
| `integrationFlowResponsibilityBoundary` | `CVF_INTEGRATION_FLOW.md` | No single Model Gateway planning artifact maps input/event/planner/engine/state/observability/feedback/strategy-registry chain | GAP | C-02 must define integration-flow responsibility boundary scope |
| `routingContextFullInterface` | `CVF_MODEL_ROUTER_SPEC.md` | `RoutingRequest` (routing-policy.ts line 7) exists but lacks `execution_stage`, `complexity_score`, `risk_score`, `required_capabilities`, `cost_budget`, `latency_budget_ms` fields; `RoutingDecision` lacks `fallback_chain` | PARTIAL | C-02 must scope full RoutingContext / decision pipeline extension |
| `routingPolicyEnginePluggablePipeline` | `CVF_ROUTING_POLICY_ENGINE.md` | `RoutingPolicyEngine.decide()` (routing-policy.ts line 67) has no pluggable policy pipeline, no `PolicyDecision` interface, no merge engine, no escalation policy | GAP | C-02 must scope routing policy engine pipeline inclusion or deferral |
| `dynamicModelRegistryWithHealthMonitoring` | `CVF_MODEL_REGISTRY_SERVICE.md` | `PROVIDER_CAPABILITY_REGISTRY` covers provider-method capabilities; `ProviderRegistry` covers runtime provider store with health state; no tier model, no findOptimal query, no static+runtime merge strategy | PARTIAL | C-02 must distinguish capability registry from future dynamic model registry |
| `gatewayFiveComponentLayeredArchitecture` | `MODEL_GATEWAY_ARCHITECTURE.md` | No explicit 5-component (Adapter / Routing / Execution / Telemetry / Gateway API) layered architecture artifact | GAP | C-02 must incorporate 5-component layer model in architecture boundary section |
| `gatewayUnifiedInterfaceBoundary` | `MODEL_GATEWAY_INTERFACE.md` | `embedding-contract.ts`, `stream-contract.ts`, `provider-health.ts` cover fragments; no unified `execute_model / execute_model_stream / generate_embedding / gateway_health` interface boundary planned | PARTIAL | C-02 must scope unified gateway interface boundary |

Epistemic process comparison: The prediction (strategy layer, routing policy
engine, dynamic registry, and integration/interface gaps) was confirmed. Current
source inspection with legacy context reveals:

- `RoutingPolicyEngine` exists (`routing-policy.ts:60`) but lacks pluggable
  policy pipeline.
- `PROVIDER_CAPABILITY_REGISTRY` exists (`provider-capability-registry.ts:43`)
  but is a static method-capability table, not a tier-based dynamic registry.
- No Execution Planner, Strategy Taxonomy, or Feedback Loop surface exists in
  any governed Model Gateway or EPF source file.
- Streaming (`stream-contract.ts:8`), embedding (`embedding-contract.ts:8`),
  and health (`provider-health.ts:18`) contracts exist but are not unified under
  a single gateway interface boundary.

No current source surface was found that fully owns a required legacy value,
so no narrowing of the next tranche recommendation is required. All 12 accepted
value keys remain as planning inputs to this C-02 rewrite plan.

---

## 4. Accepted Legacy Value Mapping

| # | Accepted value key | Maps to | Planning action |
| --- | --- | --- | --- |
| 1 | `gatewayThreeLayerArchitectureBoundary` | Architecture boundary section in this plan | INCLUDE_IN_BOUNDARY |
| 2 | `executionStrategyTaxonomy` | Strategy Layer scope decision | DEFER_WITH_REASON (requires separate implementation GC-018) |
| 3 | `executionPlannerStepLifecycle` | Strategy Layer scope decision | DEFER_WITH_REASON (no current owner; requires separate implementation GC-018) |
| 4 | `executionEngineStepLifecycleModel` | Strategy Layer scope decision | DEFER_WITH_REASON (EPF batch pipeline exists; step lifecycle boundary requires reconciliation in EPF planning tranche, not C-02) |
| 5 | `feedbackLoopWeightedScoringModel` | Strategy Layer scope decision | DEFER_WITH_REASON (requires separate implementation GC-018; feedback-to-routing loop has no current owner surface) |
| 6 | `observabilityThreeLayerDecomposition` | C-02 does not scope observability implementation; CVF_v1.8.1 covers base telemetry | OUT_OF_SCOPE (observability layer decomposition belongs in CVF_v1.8.x planning, not Model Gateway C-02) |
| 7 | `integrationFlowResponsibilityBoundary` | Integration Flow and Gateway Interface scope decision | INCLUDE_IN_BOUNDARY (advisory only: define responsibility chain for C-02 architecture section) |
| 8 | `routingContextFullInterface` | Routing Policy Engine scope decision | INCLUDE_IN_BOUNDARY (advisory: note current gap and recommend inclusion in next implementation tranche) |
| 9 | `routingPolicyEnginePluggablePipeline` | Routing Policy Engine scope decision | INCLUDE_IN_BOUNDARY (advisory: recommend pluggable pipeline as future implementation prerequisite) |
| 10 | `dynamicModelRegistryWithHealthMonitoring` | Dynamic Model Registry scope decision | INCLUDE_IN_BOUNDARY (advisory: distinguish static registry from future dynamic registry; recommend boundary definition in next tranche) |
| 11 | `gatewayFiveComponentLayeredArchitecture` | Architecture boundary section | INCLUDE_IN_BOUNDARY |
| 12 | `gatewayUnifiedInterfaceBoundary` | Integration Flow and Gateway Interface scope decision | INCLUDE_IN_BOUNDARY (advisory: note gap between current fragment contracts and unified gateway interface boundary) |

---

## 5. Boundary Disposition Matrix

| C-02 scope area | Disposition | Reason |
| --- | --- | --- |
| Architecture boundary (3-layer and 5-component models) | `INCLUDE_IN_BOUNDARY` | Directly sourced from two accepted legacy value keys; defines planning context for all other scope decisions |
| Routing policy engine pipeline (pluggable policies, merge, escalation) | `INCLUDE_IN_BOUNDARY` | Current `RoutingPolicyEngine` lacks pluggable policy pipeline; accepted value key is a clear gap with bounded planning scope; no implementation authorized here |
| Full RoutingContext and decision pipeline extension | `INCLUDE_IN_BOUNDARY` | Current `RoutingRequest` lacks execution-stage, complexity-score, risk-score fields; accepted value key; advisory boundary only |
| Dynamic model registry (tier model, findOptimal, static+runtime merge) | `INCLUDE_IN_BOUNDARY` | Current `PROVIDER_CAPABILITY_REGISTRY` is static method-capability table; accepted value key; advisory boundary only; distinguishes current registry from future registry |
| Unified gateway interface boundary (execute/stream/embedding/health) | `INCLUDE_IN_BOUNDARY` | Fragment contracts exist; no unified boundary; accepted value key; advisory boundary only |
| Integration-flow responsibility boundary | `INCLUDE_IN_BOUNDARY` | No current planning artifact maps the full component chain; advisory definition only |
| Strategy taxonomy (SINGLE_SHOT through TREE) | `DEFER_WITH_REASON` | No current owner; requires separate implementation GC-018; belongs in future Strategy Layer planning tranche |
| Execution Planner (strategy-to-plan DAG) | `DEFER_WITH_REASON` | No current owner; requires separate implementation GC-018; significant implementation scope beyond C-02 planning |
| Execution Engine step lifecycle (PENDING/READY/RUNNING) | `DEFER_WITH_REASON` | EPF batch pipeline exists; step lifecycle owner boundary must be reconciled in EPF planning tranche, not here |
| Feedback loop / weighted scoring | `DEFER_WITH_REASON` | No current owner surface; requires separate implementation GC-018; feedback-to-routing loop is a significant future capability |
| Observability layer decomposition | `OUT_OF_SCOPE` | CVF_v1.8.1 covers base telemetry; step/model-level decomposition belongs in CVF_v1.8.x planning, not Model Gateway C-02 |
| AI Gateway environment signal capture | `OUT_OF_SCOPE` | `DEFERRED_PRIVATE_ONLY` per LHW17 T2 explicit deferral; requires separate operator privacy/GDPR authorization |
| Runtime/source/test implementation of any component | `FORBIDDEN_SCOPE` | This plan is documentation/planning only; implementation requires a future implementation GC-018 |

---

## 6. Strategy Layer Scope Decision

Decision: **DEFER_WITH_REASON** for all strategy-layer depth components.

Affected accepted value keys:
- `executionStrategyTaxonomy` (SINGLE_SHOT/ITERATIVE/MULTI_STEP/PARALLEL/TREE)
- `executionPlannerStepLifecycle` (strategy-to-plan DAG, dependency graph, constraint-aware expansion)
- `executionEngineStepLifecycleModel` (PENDING/READY/RUNNING/SUCCESS/FAILURE lifecycle)
- `feedbackLoopWeightedScoringModel` (w1/w2/w3 scoring, moving average, feedback-to-routing)

Rationale:

1. No current owner surface exists in `EXTENSIONS/CVF_MODEL_GATEWAY/src/` or
   `EXTENSIONS/CVF_EXECUTION_PLANE_FOUNDATION/src/` for Execution Planner,
   Strategy Taxonomy, or Feedback Loop. Creating these requires a new extension
   or significant source addition -- implementation scope that requires a future
   GC-018.

2. The Execution Engine step lifecycle overlaps with EPF batch pipeline contracts
   (`pipeline-chain-orchestrator.ts`). Reconciling the boundary between EPF
   dispatch and a Model Gateway step lifecycle is an EPF planning concern, not a
   Model Gateway C-02 planning concern.

3. Strategy layer depth components interact with each other (taxonomy -> planner
   -> engine -> feedback loop) and cannot be individually scoped without a full
   strategy-plane planning packet. C-02 is a routing-boundary planning packet,
   not a strategy-plane planning packet.

Deferral condition: future Strategy Layer planning tranche, with a new GC-018
that cites this deferral and the accepted legacy value keys above as input. No
implementation of strategy taxonomy, execution planner, step lifecycle, or
feedback loop is authorized by this plan.

Advisory note for the future implementation tranche: The accepted legacy value
keys provide a documented starting point. The Execution Planner, Strategy
Taxonomy, and Feedback Loop are defined in the legacy files listed in section 3
and absorbed into the coverage index under the accepted value keys. Future
implementation workers must read the recheck plan, this C-02 rewrite plan, and
the coverage index before opening a new strategy-plane implementation GC-018.

---

## 7. Routing Policy Engine Scope Decision

Decision: **INCLUDE_IN_BOUNDARY** (advisory/planning only; no implementation authorized).

Affected accepted value keys:
- `routingPolicyEnginePluggablePipeline`
- `routingContextFullInterface`

Current source state:

`RoutingPolicyEngine` (`routing-policy.ts:60`) implements a single `decide()`
method that filters providers by policy, health, and quota. There is no pluggable
policy pipeline, no `PolicyDecision` interface, no stage-based policy, no
complexity-score or risk-score routing, no merge engine, and no escalation
policy. `RoutingRequest` (`routing-policy.ts:7`) lacks `execution_stage`,
`complexity_score`, `risk_score`, `required_capabilities`, `cost_budget`,
`latency_budget_ms`, and `fallback_chain`.

Legacy-accepted gap:

The legacy `CVF_ROUTING_POLICY_ENGINE.md` defines a `PolicyDecision` interface,
a policy pipeline order (Base, Stage, Risk, Cost policies), a merge engine, an
escalation policy, and a constraint conflict resolution mechanism. The legacy
`CVF_MODEL_ROUTER_SPEC.md` defines a full `RoutingContext` interface and a
decision pipeline (Risk Override, Stage Mapping, Capability Filtering, Complexity
Filtering, Constraint Filtering, Optimization, Fallback Chain).

Planning boundary recommendation:

The C-02 next implementation tranche should:

1. Extend `RoutingRequest` to include execution-stage, complexity-score,
   risk-score, required-capabilities, cost-budget, latency-budget-ms, and
   fallback-chain fields (or a `RoutingContext` wrapper).
2. Extend `RoutingPolicyEngine` to support a pluggable policy pipeline with
   a `PolicyDecision` interface, stage-based policies, a merge engine, and
   an escalation policy.
3. Keep `GatewayPolicyContext` as the upstream governance boundary; routing
   policy engine is a downstream selection refinement.

This boundary recommendation is advisory only. Implementation requires a fresh
GC-018 with source verification of every named field and interface.

---

## 8. Dynamic Model Registry Scope Decision

Decision: **INCLUDE_IN_BOUNDARY** (advisory/planning only; no implementation authorized).

Affected accepted value key:
- `dynamicModelRegistryWithHealthMonitoring`

Current source state:

`PROVIDER_CAPABILITY_REGISTRY` (`provider-capability-registry.ts:43`) is a
static constant array of provider-method capability entries. It covers which
methods (complete/stream/tool_call/etc.) each model supports. It does not
include a tier model, pricing, performance limits, a `findOptimal` query, or
runtime metric merging.

`ProviderRegistry` (`provider-registry.ts:31`) is a runtime map of
`ProviderRecord` entries. It supports `listRoutable()` and `isRoutable()` but
does not support tier-based selection, dynamic health metrics beyond the binary
`isUsable()` check in `ProviderHealthMonitor`, or a `findOptimal` query.

`ProviderHealthMonitor` (`provider-health.ts:18`) tracks consecutive failures and
rate-limit state. It provides `isUsable()` for binary usability gating.

Legacy-accepted gap:

The legacy `CVF_MODEL_REGISTRY_SERVICE.md` defines a `Model` entity with tier,
capabilities, pricing, performance limits, health metrics, and status. It defines
a `findOptimal` query interface and a static+runtime merge strategy. This is
substantially richer than the current provider-method capability registry.

Planning boundary recommendation:

The distinction between current surfaces and the future dynamic model registry is:

| Current surface | Scope | Future registry scope |
| --- | --- | --- |
| `PROVIDER_CAPABILITY_REGISTRY` | Static per-model method capability | Dynamic per-model tier, pricing, limits, health state |
| `ProviderRegistry` | Runtime provider store (status, risk class, credential IDs) | Adds dynamic health metrics, `findOptimal` query |
| `ProviderHealthMonitor` | Binary usability from consecutive failure tracking | Integration with dynamic metric merging |

C-02 planning boundary: the next implementation tranche must extend the registry
layer to include a tier-based Model entity, a `findOptimal` query interface, and
a static+runtime merge strategy. This is a new registry-plane extension on top
of the current `provider-capability-registry.ts` and `provider-registry.ts`, not
a replacement.

Implementation requires a fresh GC-018 citing this plan and the accepted value
key `dynamicModelRegistryWithHealthMonitoring`.

---

## 9. Integration Flow And Gateway Interface Scope Decision

Decision: **INCLUDE_IN_BOUNDARY** (advisory/planning only; no implementation authorized).

Affected accepted value keys:
- `integrationFlowResponsibilityBoundary`
- `gatewayUnifiedInterfaceBoundary`

Current source state:

The `EXTENSIONS/CVF_MODEL_GATEWAY/src/index.ts` barrel exports:
- `GatewayPolicyContext`, `GatewayPolicyResult`, `isPolicyAllowed` (gateway policy)
- `RoutingRequest`, `RoutingDecision`, `RoutingPolicyEngine`, `buildRoutingPolicyContractSnapshot` (routing)
- `ProviderRegistry`, `ProviderRecord`, `ProviderModel` (provider registry)
- `ProviderHealthMonitor` (health)
- `StreamContract`, `StreamCapableProvider` (stream)
- `EmbeddingContract`, `EmbeddingCapableProvider` (embedding)
- `PROVIDER_CAPABILITY_REGISTRY`, `ProviderMethodContract` (capability registry)

These are individual contracts and helpers. There is no single unified gateway
interface that combines `execute_model`, `execute_model_stream`,
`generate_embedding`, and `gateway_health` into one coherent entry point with
standard error format, credential shielding, validation, usage logging, and API
versioning.

Legacy-accepted gap:

The legacy `MODEL_GATEWAY_INTERFACE.md` (accepted key `gatewayUnifiedInterfaceBoundary`,
reviewer-remediated) defines unified methods: `execute_model`,
`execute_model_stream`, `generate_embedding`, `gateway_health`, a standard error
format, credential shielding, validation, usage logging, and API versioning.

The legacy `CVF_INTEGRATION_FLOW.md` (accepted key `integrationFlowResponsibilityBoundary`)
defines an end-to-end component responsibility chain: input -> event -> planner
-> engine -> state -> observability -> feedback -> strategy-registry.

Planning boundary recommendation:

For the next implementation tranche, C-02 recommends defining:

1. A unified gateway entry point that combines the current fragment contracts
   (`stream-contract.ts`, `embedding-contract.ts`, provider health) into a single
   `execute_model / execute_model_stream / generate_embedding / gateway_health`
   interface with standard error format and credential shielding.
2. A responsibility-chain boundary document that maps the integration-flow
   component sequence (input -> routing -> execution -> observability -> feedback)
   to current owner surfaces and gaps, so that future strategy-layer and registry
   work can be scoped against a stable chain.

Note: the integration-flow chain in the legacy file includes Execution Planner,
Strategy Registry, and Feedback Loop components that are deferred in section 6.
The gateway interface boundary recommendation does not require those deferred
components to be implemented first; it defines the entry point and chain boundary
independently.

Implementation requires a fresh GC-018 citing this plan and the accepted value
keys `integrationFlowResponsibilityBoundary` and `gatewayUnifiedInterfaceBoundary`.

---

## 10. AI Gateway Deferral

Decision: **OUT_OF_SCOPE** (deferral maintained per LHW17 T2 explicit decision).

Legacy family: `ADDING_AI GATEWAY/` (12 files including `AI_GATEWAY_MINIMAL_SPEC.md`).

Deferred value: `allAIGatewayFamilyContent` -- environment signal capture (audio,
screen, clipboard, file), agent runtime, context model, action dispatcher, event
dispatcher, event model, execution architecture.

Deferral authority: LHW17 T2 explicit deferral at
`docs/baselines/archive/CVF_GC018_LHW17_CVF_IMPORTANT_ABSORPTION_WAVE_2026-05-30.md`
(line 76) -- privacy/GDPR risk.

This C-02 rewrite plan does not absorb, scope, or plan any AI Gateway family
content. Environment signal capture and OS/endpoint control setup are not
authorized without separate operator privacy/GDPR authorization.

Restate condition: a future operator-authorized absorption wave for the AI Gateway
family requires:
1. Explicit operator instruction citing the LHW17 T2 deferral and acknowledging
   the privacy/GDPR risk.
2. A new GC-018 or equivalent governed work order.
3. A fresh legacy absorption worker return for all 12 AI Gateway family files.

This deferral is a scope label, not a value judgment on the AI Gateway family's
architectural quality. The family is eligible for a separate governed absorption
wave when operator authorization is granted.

---

## 11. Implementation Prerequisite Map

The following implementation prerequisites must be satisfied before any next
tranche implementation work order is dispatched. No implementation is authorized
by this plan.

| Prerequisite | For | Required action before dispatch |
| --- | --- | --- |
| Fresh GC-018 citing this plan | Any C-02 implementation tranche | GC-018 must name this plan as prior C-02 rewrite authority |
| Source verification of every named interface | Routing Policy Engine extension; Dynamic Model Registry; Gateway Interface | Work order must verify `RoutingRequest`, `RoutingPolicyEngine`, `PROVIDER_CAPABILITY_REGISTRY`, `ProviderRegistry` line/section before claiming extension scope |
| EPF boundary reconciliation | Execution Engine step lifecycle | EPF planning tranche must define step lifecycle owner boundary before Model Gateway step lifecycle scope is claimed |
| Strategy layer planning packet | Execution Planner, Strategy Taxonomy, Feedback Loop, Strategy Registry | Separate GC-018 for strategy-plane; cites accepted value keys 2-5 in this plan |
| Operator privacy/GDPR authorization | AI Gateway family | Explicit operator instruction; new GC-018 for AI Gateway absorption wave |
| Legacy Coverage Index update | After C-02 implementation tranche closes | `MGW-001` status must be upgraded from `PARTIAL_RECHECK_REQUIRED` to `COVERED_SOURCE_BACKED` with source evidence |
| Codex reviewer acceptance of this plan | All | No implementation dispatched until Codex reviews and accepts this worker return |

---

## 12. Recommended Next Tranche

Recommended disposition: `NEXT_TRANCHE_WORK_ORDER_READY_AFTER_CODEX_REVIEW`

The strongest authorized result of this worker plan is a planning recommendation
for Codex to review and accept. Implementation is not authorized by this plan.

Recommended next tranche scope (for Codex to authorize via a fresh GC-018 after
accepting this plan):

C-02 Implementation Tranche -- Provider Routing Boundary Implementation

Priority 1 (core routing boundary):
- Extend `RoutingRequest` and `RoutingDecision` to include execution-stage,
  complexity-score, risk-score, required-capabilities, cost-budget,
  latency-budget-ms, and fallback-chain (or a `RoutingContext` wrapper).
- Extend `RoutingPolicyEngine` to support a pluggable policy pipeline with
  stage-based and cost-based policies, a merge engine, and an escalation policy.

Priority 2 (registry boundary):
- Define a `DynamicModelRegistry` extension on top of the current
  `provider-capability-registry.ts` and `provider-registry.ts` to support
  tier-based model selection, `findOptimal` query, and static+runtime merge.

Priority 3 (gateway interface boundary):
- Define a unified gateway interface layer combining `execute_model`,
  `execute_model_stream`, `generate_embedding`, `gateway_health` with
  credential shielding and standard error format.
- Define a responsibility-chain boundary document.

Deferred to a separate strategy-plane tranche:
- Execution Planner, Strategy Taxonomy, Feedback Loop, Strategy Registry, and
  Execution Engine step lifecycle.

Deferred pending operator authorization:
- AI Gateway family (environment signal capture).

---

## 13. Forbidden Scope

The following are explicitly forbidden from the C-02 rewrite plan and any
next tranche dispatched under it without a separate fresh GC-018:

- Runtime/source/test mutation in `EXTENSIONS/` (any file).
- Model Gateway implementation.
- EPF implementation.
- Provider/API calls, live governance proof.
- Provider/model addition, package install, secret inspection.
- Public-sync or public catalog claim.
- Registry mutation (legacy coverage index, corpus scan registry).
- Session-state, handoff, front-door, or active review queue mutation.
- AI Gateway environment signal absorption, OS audit/control setup, endpoint
  monitoring.
- Strategy Layer implementation (Execution Planner, Feedback Loop, Strategy
  Taxonomy, Strategy Registry).
- Co-work product development, high-risk promotion, autonomous mutation.
- Claiming this plan constitutes implementation readiness.

---

## 14. Claim Boundary

This rewrite plan:

- IS a documentation/planning artifact scoped to C-02 provider routing boundary.
- IS sourced from the work order, recheck plan (`MGW-001`), coverage index, and
  current Model Gateway source.
- IS NOT an implementation plan, implementation authorization, or implementation
  readiness claim.
- IS NOT a runtime, provider, cost, quality, benchmark, public readiness, or
  production readiness claim.
- IS NOT an authorization for AI Gateway absorption, strategy-layer implementation,
  EPF step lifecycle implementation, or any forbidden scope above.
- DOES NOT release `rawMemoryReleased=false`.
- DOES NOT authorize commits. WORKER_MUST_NOT_COMMIT.

C-02 remains planning-only. Every implementation candidate named in this plan
requires a fresh GC-018 before a work order can be dispatched.

---

## 15. Public Export Disposition

DEFERRED_PRIVATE_ONLY

Reason: private provenance planning rewrite for C-02 Model Gateway provider
routing boundary. Public-sync is not authorized by this work order or this plan.

---

## Epistemic Process Block

Epistemic Process Applicability: HIGH_EVIDENCE

Expected Result / Prediction: Current source would show provider registry,
capability registry, routing policy, health, stream, and embedding primitives,
but the completed legacy recheck would still require planning dispositions for
strategy layer depth, routing-policy-engine pipeline, dynamic model registry,
integration-flow boundary, and unified gateway-interface boundary. The prediction
also held that no current source surface would fully own a required legacy value,
meaning no narrowing of the next tranche recommendation would be needed.

Evidence Comparison: Prediction confirmed. Source inspection verified:
- `RoutingPolicyEngine` (`routing-policy.ts:60`) exists but has no pluggable
  policy pipeline, no `PolicyDecision` interface, no merge engine, no escalation
  policy, and no stage-based or complexity-score routing.
- `PROVIDER_CAPABILITY_REGISTRY` (`provider-capability-registry.ts:43`) is a
  static method-capability table; no tier model, no findOptimal query, no dynamic
  health metric merging.
- No Execution Planner, Strategy Taxonomy, or Feedback Loop surface found in
  `EXTENSIONS/CVF_MODEL_GATEWAY/src/` or `EXTENSIONS/CVF_EXECUTION_PLANE_FOUNDATION/src/`.
- Fragment contracts (`stream-contract.ts:8`, `embedding-contract.ts:8`,
  `provider-health.ts:18`) exist but are not unified under a single gateway
  interface boundary.
All five required disposition areas (strategy-layer, routing-policy-engine,
dynamic model registry, integration-flow, gateway-interface) required planning
disposition. None was already fully addressed by current source.

Contradiction Or Gap Disposition: No contradictions found. One boundary
clarification recorded: observability layer decomposition is OUT_OF_SCOPE for
C-02 (belongs in CVF_v1.8.x planning), not DEFER_WITH_REASON, because CVF_v1.8.1
already owns the base telemetry surface. This distinction is narrower than the
recheck plan's gap notation, but does not contradict it.

Claim Update: C-02 remains planning-only. All 12 accepted value keys retain
their planning-input status. Implementation of any strategy or registry component
requires a fresh GC-018. No implementation candidate is ready for immediate
dispatch without Codex review and acceptance of this worker return first.

---

## Agent Operation Trace Block

| Field | Evidence |
| --- | --- |
| Actor | Claude (worker) |
| Provider or surface | Claude Code CLI / VSCode extension |
| Session or invocation | dispatchBaseHead `21f49ec5`; executionBaseHead `3623d43f` |
| Working directory | `d:\UNG DUNG AI\TOOL AI 2026\Controlled-Vibe-Framework-CVF` |
| Command or tool surface | Read (required first reads: session memory, active state, work order, coverage index, recheck plan, completion reviews, guard completion, all 9 Model Gateway source files, EPF source anchor); Bash (git rev-parse HEAD, git status --short, git diff --check, reviewer-fast gate runs); Write (this plan file; worker return file) |
| Target paths | `docs/reference/CVF_MODEL_GATEWAY_C02_PROVIDER_ROUTING_BOUNDARY_REWRITE_PLAN_2026-06-14.md`; `docs/reviews/CVF_MODEL_GATEWAY_C02_PROVIDER_ROUTING_BOUNDARY_REWRITE_WORKER_RETURN_2026-06-14.md` |
| Allowed scope source | Work order `docs/work_orders/CVF_AGENT_WORK_ORDER_MODEL_GATEWAY_C02_PROVIDER_ROUTING_BOUNDARY_REWRITE_FOR_CLAUDE_2026-06-14.md`; operator instruction 2026-06-14 |
| Before status evidence | HEAD `3623d43f`; clean worktree before worker writes |
| After status evidence | HEAD unchanged at `3623d43f`; only two untracked worker deliverable files created |
| Diff evidence | No runtime/source/test mutation; governance markdown files only; `git diff --name-status HEAD` shows no staged changes |
| Approval boundary | Fresh C-02 documentation/planning rewrite; no implementation, provider/live proof, public-sync, runtime mutation, or registry mutation authorized |
| Claim boundary | C-02 rewrite plan and worker return only. No implementation, runtime, provider, cost, quality, or public-sync claim. |
| Agent type | Claude |
| Invocation ID | executionBaseHead `3623d43f` |
| Expected manifest | `docs/reference/CVF_MODEL_GATEWAY_C02_PROVIDER_ROUTING_BOUNDARY_REWRITE_PLAN_2026-06-14.md` (this file); `docs/reviews/CVF_MODEL_GATEWAY_C02_PROVIDER_ROUTING_BOUNDARY_REWRITE_WORKER_RETURN_2026-06-14.md` |
| Actual changed set | `docs/reference/CVF_MODEL_GATEWAY_C02_PROVIDER_ROUTING_BOUNDARY_REWRITE_PLAN_2026-06-14.md`; `docs/reviews/CVF_MODEL_GATEWAY_C02_PROVIDER_ROUTING_BOUNDARY_REWRITE_WORKER_RETURN_2026-06-14.md` |
| Manifest delta | MATCH -- actual changed set equals expected manifest; two files created; no additions, deletions, or renames |
| Deletion or rename disposition | N/A with reason: no protected path deleted or renamed; two new files created |
