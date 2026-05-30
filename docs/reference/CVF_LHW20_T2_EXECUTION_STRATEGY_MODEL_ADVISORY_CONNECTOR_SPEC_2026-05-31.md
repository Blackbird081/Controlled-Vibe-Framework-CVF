# CVF LHW20 T2 — Execution Strategy Model Advisory Connector Spec

Contract ID: `cvf.executionStrategyModelAdvisory.lhw20.t2.v1`

Memory class: CONNECTOR_SPEC

Status: CLOSED_PASS_BOUNDED

Date: 2026-05-31

Wave: LHW20 T2

GC-018: `docs/baselines/CVF_GC018_LHW20_CVF_IMPORTANT_DEEP_SCAN_WAVE_2026-05-31.md`

runtimeExecutionAuthorized: false

---

## Purpose

Document the Execution Strategy Model from `CVF_EXECUTION_STRATEGY_MODEL.md` — a taxonomy of how tasks are executed (not which model is used). This enables future implementation of strategy-aware execution in CVF, where task complexity and risk determine execution pattern.

## Scope / Applies To

Any future CVF surface that selects or orchestrates execution patterns. Currently CVF runs the same sequential 5-phase pipeline for all requests. This spec establishes the advisory boundary for strategy-aware execution.

## CVF Owner Surfaces

| Concept | Current CVF owner |
| --- | --- |
| Execution orchestration | `pipeline-chain-orchestrator.ts` (extends to) |
| Strategy selection | `resolveProviderForRole()` WCE W3 (partial — role-based, not strategy-based) |
| Strategy observability | `pipelineChainReadout` Delta D1 |
| Strategy feedback | `orchestratorFeedback` OFB-1 (advisory signal exists) |

---

## Advisory Type

`executionStrategyModelAdvisoryType`

---

## Canonical Strategy Taxonomy

**Source:** `CVF_EXECUTION_STRATEGY_MODEL.md` + `CVF_MODEL_GATEWAY_SPEC.md`

### Level 1 — Execution Patterns

| Pattern | Description | CVF equivalent | Gap |
| --- | --- | --- | --- |
| `SINGLE_SHOT` | 1 request → 1 response | Current default | None — already the base case |
| `ITERATIVE` | Loop with refinement until condition | EL-3 retry loop (partial) | No explicit termination condition |
| `MULTI_STEP` | Sequential steps with distinct goals | `pipeline-chain-orchestrator.ts` 5-phase | Fixed phases; no dynamic step definition |
| `PARALLEL` | Multiple executions concurrently for consensus | NOT in CVF | Requires new orchestration |
| `TREE` | Explore multiple reasoning paths, select best | NOT in CVF | Requires branching orchestration |

### Level 2 — Enhancement Techniques

| Technique | Description | CVF equivalent |
| --- | --- | --- |
| `SELF_REFLECTION` | Output reviewed and refined by same model | NOT in CVF |
| `VERIFICATION` | Output validated before acceptance | Review phase (partial) |
| `DECOMPOSITION` | Task split into subtasks | EL-3 `decomposedWorkOrders` (advisory) |
| `TOOL_USE` | External tools invoked during execution | MCP tools (Delta D2/D3) |
| `ROLE_SPLIT` | Planner + Executor + Reviewer roles | 5-phase pipeline (structural, not strategy) |

### Level 3 — Constraints

```
{
  "latency": "low | medium | high",
  "cost": "low | flexible",
  "quality": "standard | high | critical"
}
```

CVF equivalent: `cvfRiskLevel` (R0-R3) is the current quality/risk constraint. No latency or cost constraint in current execution path.

---

## Strategy Object (canonical format advisory)

```typescript
interface ExecutionStrategy {
  strategyId: string;
  pattern: 'SINGLE_SHOT' | 'ITERATIVE' | 'MULTI_STEP' | 'PARALLEL' | 'TREE';
  techniques: Array<'SELF_REFLECTION' | 'VERIFICATION' | 'DECOMPOSITION' | 'TOOL_USE' | 'ROLE_SPLIT'>;
  constraints: { latency: string; cost: string; quality: string };
}
```

---

## Strategy Selection Advisory

Deterministic rule-based selection (v1 — do not use ML for this):

```
IF complexity = low AND risk = R0 → SINGLE_SHOT
IF complexity = medium AND risk = R1 → MULTI_STEP (existing pipeline)
IF complexity = high AND risk = R2 → MULTI_STEP + VERIFICATION + DECOMPOSITION
IF risk = R3 → PARALLEL (consensus) + VERIFICATION
```

**CVF gap:** Current pipeline always uses the equivalent of `MULTI_STEP` regardless of task complexity. No strategy selection logic.

---

## Implementation Path Advisory

Enabling Execution Strategy Model in CVF requires:

1. Add `executionStrategy` field to `/api/execute` request body (advisory, not enforced)
2. Extend `pipeline-chain-orchestrator.ts` to accept strategy hint
3. Add strategy selection logic in `resolveProviderForRole()` or new `resolveExecutionStrategy()` function
4. Add `executionStrategyReadout` to ALLOW response (same pattern as CBP-1, OFB-1)

This is a separate implementation tranche — not in this wave.

---

## Related Artifacts

- GC-018: `docs/baselines/CVF_GC018_LHW20_CVF_IMPORTANT_DEEP_SCAN_WAVE_2026-05-31.md`
- Source: `.private_reference/legacy/CVF_Important/ADDING_MODEL GATEWAY/CVF_EXECUTION_STRATEGY_MODEL.md`
- Source: `.private_reference/legacy/CVF_Important/ADDING_MODEL GATEWAY/CVF_MODEL_GATEWAY_SPEC.md`
- LHW17 T2: `docs/reference/CVF_LHW17_T2_MODEL_GATEWAY_UNIFICATION_ADVISORY_CONNECTOR_SPEC_2026-05-30.md`
- Pipeline orchestrator: `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/lib/pipeline-chain-orchestrator.ts`

## Claim Boundary

Advisory only. No strategy selection implemented in this wave. `PARALLEL` and `TREE` patterns require new orchestration architecture — separate GC-018 required.

## Invariants

- `runtimeExecutionAuthorized=false`
- R0-R3 preserved
- No route.ts change
- No orchestrator change
