# CVF LHW17 T2 — Model Gateway Unification Advisory Connector Spec

Contract ID: `cvf.modelGatewayUnificationAdvisory.lhw17.t2.v1`

Memory class: CONNECTOR_SPEC

Status: CLOSED_PASS_BOUNDED

Date: 2026-05-30

Wave: LHW17 T2

GC-018: `docs/baselines/CVF_GC018_LHW17_CVF_IMPORTANT_ABSORPTION_WAVE_2026-05-30.md`

runtimeExecutionAuthorized: false

---

## Purpose

Resolve the EA duplicate-module finding for Reviews 7/8/9 by defining the unified Model
Gateway architecture boundary as a single advisory connector spec. Establishes Routing Layer
+ Strategy Layer as the canonical two-layer structure against existing CVF owner surfaces.

## Scope / Applies To

Applies to any future CVF surface that routes model/provider requests or orchestrates
execution strategy. Does NOT authorize runtime gateway unification implementation in this wave.

## Source

- `.private_reference/legacy/CVF_Important/ADDING_MINI_MODEL GATEWAY/Thong_tin.md`
- `.private_reference/legacy/CVF_Important/ADDING_MINI_MODEL GATEWAY/MODEL_ADAPTER_MODEL.md`
- `.private_reference/legacy/CVF_Important/ADDING_MODEL GATEWAY/CVF_MODEL_GATEWAY_SPEC.md`
- `.private_reference/legacy/CVF_Important/ADDING_MODEL_ROUTER/CVF_MODEL_ROUTER_SPEC.md`

EA finding: `EA_CROSS_CHECK_ASSESSMENT.md` — Review 7, 8, and 9 overlap heavily; must be
unified into one `CVF_MODEL_GATEWAY` with 2 sub-layers. Router is sub-component of Gateway,
not top-level module. Outstanding since 2026-03-21.

---

## Purpose

Resolves the EA duplicate-module finding for Reviews 7/8/9 by defining the unified Model
Gateway architecture boundary — Routing Layer + Strategy Layer — as a single advisory connector
spec against existing CVF owner surfaces. This is documentation-only.

---

## CVF Owner Surfaces

| Layer | Owner module |
| --- | --- |
| Model Adapter (provider-agnostic) | `CVF_v1.7.3_RUNTIME_ADAPTER_HUB` |
| Per-role routing | WCE W3 `resolveProviderForRole()` in `execute.client.ts` |
| Strategy / orchestration | `pipeline-chain-orchestrator.ts` (EL wave, `CVF_v1.6_AGENT_PLATFORM`) |
| Provider method coverage | T4 `CVF_ECO_v1.2_LLM_RISK_ENGINE` + PM wave live proofs |
| Observability | `CVF_v1.8.1_ADAPTIVE_OBSERVABILITY_RUNTIME` |

---

## Advisory Type

`modelGatewayUnificationAdvisoryType`

---

## Unified Architecture Boundary

### Principle (from source + EA recommendation)

> Agents must never call providers directly.
> All AI compute requests route through the Model Gateway API.
> The Gateway is NOT a proxy — it is a governed compute abstraction layer.

```
Agent Runtime
      │
      ▼
Model Gateway API   ← single entry point
      │
      ├── Routing Layer    (which provider/model for this request)
      │         └── resolveProviderForRole() [WCE W3]
      │
      └── Strategy Layer   (when/how to execute, chain, observe)
                └── pipeline-chain-orchestrator.ts [EL wave]
```

### Sub-Layer 1: Routing Layer

**Source:** `ADDING_MINI_MODEL GATEWAY` (Review 7) + `ADDING_MODEL_ROUTER` (Review 9).
EA decision: Router is sub-component inside Gateway, not top-level module.

**Responsibilities:**
- Model Adapter — normalize provider API differences (already in `CVF_v1.7.3_RUNTIME_ADAPTER_HUB`)
- Per-role routing — select provider based on CVFRole (already in WCE W3)
- Fallback strategy — deferred; requires separate GC-018 for fallback policy engine

**Advisory boundary:** Routing Layer is substantially absorbed. Remaining gap is a formal
Routing Policy Engine (priority, cost-based fallback) — deferred as a separate live-proof
roadmap post-LHW.

### Sub-Layer 2: Strategy Layer

**Source:** `ADDING_MODEL GATEWAY` (Review 8) — Execution Strategy, Planner, Feedback Loop.
EA decision: Strategy Layer is the other half of the unified gateway.

**Responsibilities:**
- Pipeline chain orchestration — partially absorbed (`pipeline-chain-orchestrator.ts`)
- Execution strategy selection (cheap/strong/long-context) — advisory only; not implemented
- Feedback loop (token usage, latency, cost tracking) — deferred; `CVF_v1.8.1` covers
  observability telemetry but feedback-to-routing loop is not wired

**Advisory boundary:** Strategy Layer foundation exists. Full strategy planner and
feedback-to-routing loop are eligible for a separate live-proof roadmap post-LHW.

---

## Advisory Readout Fields

When a future runtime surface absorbs this spec, the governance evidence receipt SHOULD surface:

```typescript
modelGatewayUnificationAdvisoryType: "cvf.modelGatewayUnificationAdvisory.lhw17.t2.v1"
gatewayAdvisory: {
  routingLayerStatus: "ABSORBED" | "PARTIAL" | "DEFERRED"
  strategyLayerStatus: "ABSORBED" | "PARTIAL" | "DEFERRED"
  routingOwner: string    // e.g. "resolveProviderForRole / CVF_v1.7.3_RUNTIME_ADAPTER_HUB"
  strategyOwner: string   // e.g. "pipeline-chain-orchestrator.ts"
  unificationNote: string // advisory boundary note
}
```

---

## EA Finding Resolution

| EA Finding | Resolution |
| --- | --- |
| Reviews 7+8+9 must be one module | Unified into single Gateway = Routing Layer + Strategy Layer |
| Router must be sub-component of Gateway | Router (`resolveProviderForRole`) is sub-layer, not top-level |
| No parallel runtime competing with CVF | `runtimeExecutionAuthorized=false`; CVF_v1.7.3 is the single adapter surface |

---

## Related Artifacts

- GC-018: `docs/baselines/CVF_GC018_LHW17_CVF_IMPORTANT_ABSORPTION_WAVE_2026-05-30.md`
- Source: `.private_reference/legacy/CVF_Important/ADDING_MINI_MODEL GATEWAY/`
- Source: `.private_reference/legacy/CVF_Important/ADDING_MODEL GATEWAY/`
- EA finding: `.private_reference/legacy/CVF_Important/REVIEW FOLDER/EA_CROSS_CHECK_ASSESSMENT.md`
- WCE W3: `EXTENSIONS/CVF_ECO_v2.2_GOVERNANCE_CLI/src/execute.client.ts` (`resolveProviderForRole`)

## Claim Boundary

This spec is documentation-only advisory. It does not prove runtime gateway unification,
hosted readiness, production readiness, or public release readiness. Full gateway runtime
unification requires a separate governed tranche.

## Invariants

- `runtimeExecutionAuthorized=false`
- Risk model: R0-R3 (L0-L4 must NOT appear)
- No route.ts change
- No receipt-envelope extension
- No database/persistence change
- No public release readiness claim
