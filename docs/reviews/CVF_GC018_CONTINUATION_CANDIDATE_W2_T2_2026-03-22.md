# CVF GC-018 Continuation Candidate — W2-T2 Execution Dispatch Bridge

Memory class: FULL_RECORD

> Governance control: `GC-018`
> Date: `2026-03-22`
> Type: continuation candidate — new tranche authorization request
> Parent roadmap: `docs/roadmaps/CVF_WHITEPAPER_COMPLETION_ROADMAP_2026-03-21.md`
> Predecessor tranche: `W1-T3 — Usable Design/Orchestration Slice` (CLOSED through CP5)
> Scope anchor: `docs/reviews/CVF_WHITEPAPER_SCOPE_CLARIFICATION_PACKET_2026-03-22.md` Priority 3

---

## 1. Authorization Request

Open `W2-T2` as the next bounded realization-first execution-plane tranche to deliver **one usable execution dispatch bridge slice**.

This follows the roadmap delivery order item #3:

> selective execution deepening only where it unlocks a real consumer path

---

## 2. Justification

### Why now

- `W1-T3` delivered a usable design/orchestration slice: `OrchestrationContract` produces `TaskAssignment[]` with `executionAuthorizationHash` per task
- `W2-T1` delivered the execution-plane foundation shell: guard engine, policy contract surface, authorization boundary surface
- No contract exists to bridge the control-plane orchestration output to the execution-plane guard/policy infrastructure
- The gap is HIGH priority per `docs/reviews/CVF_W1_T3_TRANCHE_CLOSURE_REVIEW_2026-03-22.md` Section 6
- This is exactly the "selective execution deepening where it unlocks a real consumer path" described in the Scope Clarification Packet

### What this delivers

One usable execution dispatch bridge that:

1. converts `TaskAssignment[]` from `OrchestrationContract` into guard evaluation contexts and runs them through `GuardRuntimeEngine` — producing a `DispatchResult` with ALLOW/BLOCK/ESCALATE per task
2. applies a `PolicyGateContract` on the dispatch result to produce a governed `PolicyDecision` (allow/deny/review/sandbox) per assignment
3. proves the full INTAKE → DESIGN → ORCHESTRATION → DISPATCH consumer path end-to-end using a `DesignConsumptionReceipt` from W1-T3

### What this does NOT deliver

- actual task execution (no runtime invocation, no LLM calls)
- MCP bridge internals (deferred in W2-T1)
- learning-plane integration
- multi-agent parallel dispatch

### Why this is Priority 3 (Selective Execution Deepening) not W3+

The Scope Clarification Packet Priority 3 requires:
- one real consumer path unlocked or simplified — YES: `DesignConsumptionReceipt` → `ExecutionBridgeReceipt`
- one runtime behavior materially improved — YES: guard engine now evaluates task assignments at dispatch boundary
- no tranche that only adds another wrapper layer — YES: `DispatchContract` runs actual `GuardRuntimeEngine.evaluate()` per task

---

## 3. Scope Boundary

### In scope

- new `EXTENSIONS/CVF_EXECUTION_PLANE_FOUNDATION/src/dispatch.contract.ts`
- new `EXTENSIONS/CVF_EXECUTION_PLANE_FOUNDATION/src/policy.gate.contract.ts`
- new `EXTENSIONS/CVF_EXECUTION_PLANE_FOUNDATION/src/execution.bridge.consumer.contract.ts`
- barrel export updates in `src/index.ts`
- tests for each new contract (target: ~27 new tests)
- tranche-local governance docs

### Out of scope

- actual task execution or LLM invocation
- MCP bridge internals
- physical moves of any source module
- control-plane contract changes
- learning-plane feedback
- UI/non-coder layer changes

---

## 4. Existing Ingredients

| Module | Role in this tranche |
|---|---|
| `CVF_EXECUTION_PLANE_FOUNDATION` (W2-T1) | host package; guard engine, policy surface, authorization boundary |
| `CVF_CONTROL_PLANE_FOUNDATION` (W1-T3) | `OrchestrationContract` produces `TaskAssignment[]`; `DesignConsumerContract` produces `DesignConsumptionReceipt` |
| `CVF_ECO_v2.5_MCP_SERVER/sdk` | `GuardRuntimeEngine.evaluate()`, `GuardRequestContext`, `GuardPipelineResult` |
| `CVF_v1.9_DETERMINISTIC_REPRODUCIBILITY` | `computeDeterministicHash` for dispatch and gate hash |

---

## 5. Proposed Control Points

| CP | Name | Lane | Scope |
|---|---|---|---|
| CP1 | Dispatch Contract Baseline | Full Lane | `DispatchContract` — TaskAssignment[] → GuardEngine → DispatchResult per task |
| CP2 | Policy Gate Contract | Fast Lane | `PolicyGateContract` — DispatchResult → PolicyGateResult (allow/deny/review/sandbox per task) |
| CP3 | Execution Bridge Consumer Contract | Fast Lane | `ExecutionBridgeConsumerContract` — DesignConsumptionReceipt → DispatchResult → PolicyGateResult → ExecutionBridgeReceipt |
| CP4 | Tranche Closure Review | Full Lane | receipts, test evidence, remaining-gap notes, closure/defer decisions |

---

## 6. Governance Lane

- CP1: **Full Lane** (new contract baseline, establishes dispatch-phase contract pattern)
- CP2–CP3: **Fast Lane** eligible (additive contracts inside already-authorized tranche, no boundary changes)
- CP4: **Full Lane** (tranche closure, changes tranche state)

---

## 7. Risk Assessment

| Risk | Severity | Mitigation |
|---|---|---|
| dispatch contract crosses into actual task execution | HIGH | produce DispatchEntry with guard decision only — no runtime invocation |
| policy gate duplicates guard engine decision | LOW | guard engine evaluates guard rules; policy gate evaluates risk-level policy — different layers |
| bridge consumer imports from control plane in execution plane package | MEDIUM | import type only from control-plane contracts; no runtime coupling |
| test count insufficient to validate dispatch logic | LOW | target 10+ tests for CP1 covering ALLOW/BLOCK/ESCALATE paths |

---

## 8. Success Criteria

1. `DispatchContract.dispatch()` produces a `DispatchResult` from `TaskAssignment[]` with correct ALLOW/BLOCK/ESCALATE decisions from the guard engine
2. `PolicyGateContract.evaluate()` produces a `PolicyGateResult` with correct allow/deny/review/sandbox decisions per risk level
3. `ExecutionBridgeConsumerContract.bridge()` accepts a `DesignConsumptionReceipt` and produces an `ExecutionBridgeReceipt` proving the full path
4. all existing tests continue to pass (82 control-plane + 12 execution-plane = 94 total)
5. ~27 new tests added (target: 39 total execution-plane tests)
6. governance gates remain COMPLIANT

---

## 9. Depth Audit

- Risk reduction: `2` (closes HIGH gap from W1-T3 closure)
- Decision value: `3` (unlocks real dispatch boundary evaluation — first cross-plane consumer path)
- Machine enforceability: `2` (guard engine produces deterministic decisions)
- Operational efficiency: `2` (removes need for manual dispatch reasoning)
- Portfolio priority: `2` (Priority 3 from Scope Clarification Packet, directly follows P1 and P2 deliveries)
- Total: `11`
- Decision: `AUTHORIZE`

---

## 10. Authorization Decision

**AUTHORIZE** — `W2-T2` may proceed as a bounded realization-first execution-plane tranche for one usable execution dispatch bridge. The tranche stays inside the execution-plane dispatch boundary and does not enter actual task runtime invocation. Future work beyond this tranche requires fresh `GC-018`.
