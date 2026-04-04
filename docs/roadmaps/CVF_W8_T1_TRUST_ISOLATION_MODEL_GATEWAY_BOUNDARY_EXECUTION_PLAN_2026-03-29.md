# CVF W8-T1 Execution Plan — Trust Isolation and Model Gateway Boundary Convergence

Memory class: SUMMARY_RECORD

> Date: 2026-03-29
> Wave: W8 — Tranche: T1
> GC-018 authorization: `docs/reviews/CVF_GC018_CONTINUATION_CANDIDATE_W8_T1_TRUST_ISOLATION_MODEL_GATEWAY_BOUNDARY_2026-03-29.md`
> GC-026 authorization sync: `docs/baselines/CVF_GC026_TRACKER_SYNC_W8_T1_AUTHORIZATION_2026-03-29.md`
> Baseline: v3.0-W7T10 — FIXED, do not modify
> Architecture boundary lock: `docs/reviews/CVF_W7_T3_CP2_ARCHITECTURE_BOUNDARY_LOCK_2026-03-28.md`

---

## 1. Objective

Deliver the first structural post-W7 wave by:

1. consolidating the fragmented trust/isolation boundary into a single, machine-enforceable contract surface
2. freezing model-gateway / Knowledge Layer contract surfaces (FIXED INPUT vs IN SCOPE)
3. providing code-traceable evidence for every boundary decision
4. leaving the W7 v3.0-W7T10 baseline READ_ONLY — no structural modification to the 7-link chain

---

## 2. Hard Constraints (non-negotiable)

| Constraint | Source |
|---|---|
| No structural modification to Runtime→Artifact→Trace→Planner→Decision→Eval/Builder→Memory chain | W7-T3 CP2 boundary lock |
| No Agent Definition merge work | Decision pack pass condition 3 |
| No L0–L4 risk-model migration | Decision pack pass condition 8 |
| No Candidate B (RAG/Context) work | Downstream dependent |
| All new test files are dedicated (not added to index.test.ts) | GC-024 |
| Trust/isolation contracts are ADDITIVE to CPF — do not restructure existing gateway consumer pipelines | GC-018 W8-T1 authorization |
| If any W7 chain link shows STRUCTURAL impact during execution: stop and escalate | GC-018 W8-T1 non-destabilization posture |

---

## 3. Scope Definition

### In Scope

| Item | Description |
|---|---|
| Trust domain declaration | Single contract surface that owns the decision: full Safety Runtime vs lightweight Guard SDK |
| Isolation contract consolidation | Single interface declaring isolation scope (workspace / agent / capability), breach detection, enforcement modes |
| Trust propagation gating | When graph-based trust propagation is permitted vs blocked vs governance-gated |
| Model-gateway surface classification | Every AI Gateway contract surface classified FIXED INPUT or IN SCOPE per decision pack pass condition 4 |
| Knowledge Layer entrypoint declaration | Define the canonical Knowledge Layer → AI Gateway handoff surface (currently undefined) |
| Model-gateway execution authority declaration | Declare which aspects of model invocation authority belong to Control Plane vs Execution Plane |
| W7 chain impact assessment document | Formal proof that all 7 chain links remain READ_ONLY or ADDITIVE |
| Updated governance control matrix | Add control entry for trust/isolation/gateway ownership enforcement |

### Out of Scope

| Item | Reason |
|---|---|
| Agent Definition merge work | Pass condition 3 — excluded unless blocking dependency proven |
| L0–L4 migration | Pass condition 8 — requires separate proposal |
| RAG/Context Engine work | Candidate B scope |
| Candidate D learning expansion | HOLD |
| Benchmark performance claims as baseline | Candidate C scope (W8-T2) |
| Restructuring existing gateway consumer pipelines (ai.gateway.contract.ts, gateway.auth.contract.ts, etc.) | These are FIXED INPUT — W8-T1 classifies, does not restructure |

---

## 4. Target State After W8-T1

### Trust / Isolation Boundary

Current:
- TWO trust lines: `CVF_v1.7.1_SAFETY_RUNTIME` (full) + `CVF_ECO_v2.0_AGENT_GUARD_SDK` (lightweight)
- Isolation: `workspace.isolation.guard.ts` (runtime) + `CVF_WORKSPACE_ISOLATION_GUARD.md` (policy) — not unified

Target:
- One consolidated boundary contract (`trust.isolation.boundary.contract.ts` in CPF)
- Trust domain decision criteria: code-traceable rule for full vs lightweight
- Unified isolation interface: one contract surface for all isolation enforcement modes
- Trust propagation gate: explicit allow/block/governance-gate criteria

### Model-Gateway / Knowledge Layer Boundary

Current:
- 80+ consumer pipeline contracts exist but NOT unified
- No model-facing boundary contract
- No Knowledge Layer entrypoint defined
- No execution authority declaration

Target:
- Classification document: every gateway surface marked FIXED INPUT (with reference) or IN SCOPE (with W8-T1 ownership)
- Knowledge Layer boundary contract (`model.gateway.boundary.contract.ts` in CPF)
- Execution authority statement: Control Plane owns design-time gating; Execution Plane owns build-time invocation
- All surfaces declared ADDITIVE to CPF→EPF canonical handoff

---

## 5. Control Point Structure

### CP1 — Full Lane: Trust/Isolation Consolidated Boundary Contract

Lane: Full Lane (new cross-plane concept)

Deliverables:
- `EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION/src/trust.isolation.boundary.contract.ts` — new contract
- `EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION/tests/trust.isolation.boundary.contract.test.ts` — dedicated test file
- `docs/audits/CVF_W8_T1_CP1_TRUST_ISOLATION_BOUNDARY_AUDIT_{DATE}.md`
- `docs/reviews/CVF_GC019_W8_T1_CP1_TRUST_ISOLATION_BOUNDARY_REVIEW_{DATE}.md`
- `docs/baselines/CVF_W8_T1_CP1_TRUST_ISOLATION_BOUNDARY_DELTA_{DATE}.md`

Contract scope:
- `TrustDomainDeclaration` — full runtime vs lightweight SDK decision interface
- `IsolationScopeContract` — workspace / agent / capability isolation with breach detection
- `TrustPropagationGate` — allow / block / governance-gate decision surface
- All operations are READ_ONLY on existing W7 contracts (read and classify; do not restructure)

Exit criteria:
- All trust/isolation operations have exactly one traceable contract surface
- Trust domain split decision is code-traceable
- Isolation enforcement modes are unified in one interface
- Dedicated test file passes (0 failures)
- W7 chain links remain READ_ONLY or ADDITIVE (verified in audit doc)

### CP2 — Full Lane: Model-Gateway / Knowledge Layer Boundary Declaration

Lane: Full Lane (new module — first declaration of model-gateway boundary)

Deliverables:
- `EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION/src/model.gateway.boundary.contract.ts` — new contract
- `EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION/tests/model.gateway.boundary.contract.test.ts` — dedicated test file
- `docs/reviews/CVF_W8_T1_GATEWAY_SURFACE_CLASSIFICATION_{DATE}.md` — FIXED INPUT vs IN SCOPE classification document
- `docs/audits/CVF_W8_T1_CP2_MODEL_GATEWAY_BOUNDARY_AUDIT_{DATE}.md`
- `docs/reviews/CVF_GC019_W8_T1_CP2_MODEL_GATEWAY_BOUNDARY_REVIEW_{DATE}.md`
- `docs/baselines/CVF_W8_T1_CP2_MODEL_GATEWAY_BOUNDARY_DELTA_{DATE}.md`

Contract scope:
- `ModelGatewayBoundaryDeclaration` — per-surface classification: FIXED_INPUT | IN_SCOPE
- `KnowledgeLayerEntrypoint` — canonical Knowledge Layer → AI Gateway handoff interface
- `ModelGatewayExecutionAuthority` — Control Plane (design-time) vs Execution Plane (build-time) responsibility split
- Must be ADDITIVE to CPF→EPF handoff (`ControlPlaneConsumerPipelineContract` → `ExecutionPipelineContract`)

Exit criteria:
- Every AI Gateway surface explicitly classified
- Knowledge Layer entrypoint defined and owned
- Execution authority declared without restructuring W7 handoff
- Dedicated test file passes (0 failures)
- Candidate B gateway stability output ready (declares which surfaces are stable inputs for downstream)

### CP3 — Closure

Deliverables:
- `docs/reviews/CVF_W8_T1_TRANCHE_CLOSURE_REVIEW_{DATE}.md`
- `docs/baselines/CVF_GC026_TRACKER_SYNC_W8_T1_CLOSURE_{DATE}.md`
- Updated `AGENT_HANDOFF.md` — W8-T1 CLOSED DELIVERED
- Updated `docs/roadmaps/CVF_POST_W7_OPEN_TARGETS_UPGRADE_ROADMAP_2026-03-28.md` — P3 status to CLOSED
- Candidate B readiness statement: gateway stability declared; Candidate B can declare its gateway assumptions against W8-T1 output

Exit criteria:
- CP1 + CP2 both closed with 0 failures
- Candidate B gateway stability output confirmed
- W8-T1 closure review signed off
- GC-026 closure sync committed

---

## 6. Dependency Rule

```
CP1 (trust/isolation contract) → CP2 (gateway boundary declaration, reads CP1 output) → CP3 (closure)
W8-T2 (performance harness) runs parallel — independent of CP1/CP2 content
```

CP2 is blocked until CP1 exits (gateway declaration must reference the trust/isolation boundary).

---

## 7. W7 Chain Impact Assessment

| Chain Link | Impact | Justification |
|---|---|---|
| Runtime | READ_ONLY | Reads existing runtime surfaces to define trust domain; no contract restructuring |
| Artifact | READ_ONLY | Reads artifact staging to assess isolation scope |
| Trace | READ_ONLY | Reads trace surfaces for dependency mapping |
| Planner | READ_ONLY | Confirms governance authority scope; no modification |
| Decision | ADDITIVE | New boundary freeze declarations are new artifacts in the decision chain; do not restructure existing decision contracts |
| Eval/Builder | NONE | Not in scope |
| Memory | NONE | Not in scope |

Non-destabilization posture: if any STRUCTURAL impact is discovered during CP1 or CP2 execution, stop immediately and escalate; Candidate B becomes default reconsideration path per roadmap section 6.2.

---

## 8. Required Evidence Per CP

| CP | Schema/contract tests | Guard-path tests | Dependency impact evidence |
|---|---|---|---|
| CP1 | trust.isolation.boundary.contract.test.ts | isolation breach detection | W7 chain READ_ONLY confirmation in audit doc |
| CP2 | model.gateway.boundary.contract.test.ts | gateway surface classification verifiable | ADDITIVE-only evidence vs CPF→EPF handoff |
| CP3 | all CP1+CP2 tests passing | n/a | full closure review |

---

## 9. Status Log

| Item | Status |
|---|---|
| GC-018 W8-T1 authorization | DONE — 2026-03-29 |
| GC-026 authorization sync | DONE — 2026-03-29 |
| P0 governance hardening | DONE — 2026-03-29 |
| Execution plan committed | DONE — 2026-03-29 |
| CP1 — Trust/Isolation boundary contract | PENDING |
| CP2 — Model-Gateway/Knowledge-Layer boundary declaration | HOLD — requires CP1 |
| CP3 — Closure review | HOLD — requires CP1+CP2 |
