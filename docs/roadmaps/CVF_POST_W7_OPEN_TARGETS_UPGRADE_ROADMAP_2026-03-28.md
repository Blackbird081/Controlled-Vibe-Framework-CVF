# CVF Post-W7 Open Targets Upgrade Roadmap

Memory class: SUMMARY_RECORD

> Date: 2026-03-28
> Scope: convert the post-W7 partial / proposal / merge-target / performance backlog into one governed, phased planning baseline
> Decision baseline: `docs/reviews/CVF_MULTI_AGENT_DECISION_PACK_POST_W7_OPEN_TARGETS_2026-03-28.md`
> EA validation anchor: `docs/reviews/CVF_EA_DECISION_PACK_VALIDATION_POST_W7_OPEN_TARGETS_2026-03-28.md`
> Authorization posture: planning-only; no implementation starts before fresh `GC-018` continuation authorization

---

## 1. Objective

Turn the remaining post-W7 open architecture targets into a controlled upgrade sequence that:

- preserves the delivered `v3.0-W7T10` baseline
- avoids a bundled omnibus continuation wave
- prioritizes boundary clarification before deeper merge work
- establishes measurement truth before performance claims
- keeps every future expansion auditable, reversible, and scope-bounded

---

## 2. Canonical Baseline Lock

The following are fixed for this roadmap and may not be re-opened implicitly:

- current authoritative baseline remains `docs/reference/CVF_MASTER_ARCHITECTURE_WHITEPAPER.md` at `v3.5-W30T1`
- current active tranche remains `NONE`
- no implementation work starts without fresh `GC-018`
- no omnibus post-W7 continuation candidate is allowed
- one structural proposal family per future `GC-018`
- `Candidate C` is a parallel prerequisite workstream, not a competing structural family
- `Agent Definition` is excluded from the first structural wave unless blocking dependency is proven with code-traceable evidence
- `L0-L4` risk-model migration remains out of scope unless opened as a separate justified proposal
- performance targets stay `PROPOSAL ONLY` until benchmark evidence exists

---

## 3. Proposal Family Classification

| Family | Scope | Current Canonical Decision | Role in Roadmap |
|---|---|---|---|
| `Candidate A` | Trust / Isolation + Model Gateway boundary convergence | `GO WITH FIXES` | first structural family |
| `Candidate B` | RAG + Context Engine convergence | `GO WITH FIXES` | second structural family / fallback reconsideration path |
| `Candidate C` | Performance benchmark harness + acceptance-policy baseline | `GO WITH FIXES` | parallel prerequisite workstream |
| `Candidate D` | Reputation + Task Marketplace learning expansion | `HOLD` | later-wave expansion only |

---

## 4. Mandatory Gates Before Any New Wave

All phases below are gated by these conditions:

- `G1` fresh `GC-018` packet per family before any implementation
- `G2` explicit `keep / retire / merge-into` ownership map in every new `GC-018`
- `G3` explicit `not in this wave` exclusions in every new `GC-018`
- `G4` inter-family dependency declaration in every new `GC-018`
- `G5` W7 dependency-chain impact assessment for any family that touches `Runtime -> Artifact -> Trace -> Planner -> Decision -> Eval/Builder -> Memory`
- `G6` no benchmark numbers promoted into baseline truth before measurement evidence exists
- `G7` any gateway-facing family must state which AI Gateway / Knowledge Layer contracts are fixed inputs and which are in scope
- `G8` any later-wave learning expansion must remain downstream of the first structural family and the performance baseline
- `G9` every fresh `GC-018` must pass the quality-first decision gate using the active canonical quality assessment; remediation-first is the default when active quality posture is below threshold

If any required gate is missing, the affected phase remains `HOLD`.

---

## 5. Official Phase Sequence

| Phase | Scope | Initial Decision | Required Gates | Exit Criteria |
|---|---|---|---|---|
| `P0` | Governance hardening for next-wave drafting | `GO` | `G1-G4` | exclusion template, dependency declaration pattern, and drafting rules are committed as reusable canon |
| `P1` | `Candidate A` authorization packet drafting | `GO WITH FIXES` | `G1-G5`, `G7`, `G9` | one bounded `GC-018` candidate for Trust / Isolation + Model Gateway boundary convergence is review-ready |
| `P2` | `Candidate C` instrumentation-only performance baseline workstream | `GO WITH FIXES` | `G1`, `G4`, `G6`, `G9` | benchmark harness, acceptance-policy baseline, first governed evidence batch, and closure review are committed without promoting baseline truth |
| `P3` | `Candidate A` first-wave execution if authorized | `GO WITH FIXES` | `P1 closed`, `G5`, `G7` | boundary contracts are clarified without destabilizing the W7 chain; closure review complete |
| `P4` | `Candidate B` authorization and execution planning | `GC-018 AUTHORIZED — W9-T1` | `P2 in motion or closed`, `P3 closed or formally deferred`, `G1-G4`, `G7`, `G9` | one bounded `GC-018` candidate for RAG + Context convergence is review-ready with declared gateway assumptions |
| `P5` | `Candidate D` later-wave intake | `GC-018 AUTHORIZED — W10-T1` | `P3` and `P4` in motion or closed, `G1-G4`, `G8`, `G9` | learning expansion may be evaluated as a later governed wave |

---

## 6. Detailed Phase Definition

### 6.1 Phase `P0` — Governance Hardening for Drafting Discipline

Deliverables:

- canonical exclusion template for `not in this wave`
- canonical dependency declaration pattern for future `GC-018` packets
- roadmap-to-authorization drafting checklist for post-W7 families
- `GC-032` governed artifact authoring standard wired into bootstrap, policy, and repo gates

Success rule:

- future `GC-018` packets can be written without ambiguity about exclusions, dependencies, ownership transfer, or typed-evidence discipline
- future `GC-018` packets must also record whether CVF should remediate quality first or expand now

### 6.2 Phase `P1` — Candidate A Authorization Preparation

Scope:

- trust / isolation boundary clarification
- model-gateway convergence boundary
- AI Gateway / Knowledge Layer contract freeze declaration

Must include:

- W7 impact assessment for the full dependency chain
- explicit proof of what is out of scope
- explicit statement that `Agent Definition` is excluded unless blocking dependency is proven
- rollback and non-destabilization posture

Decision branch:

- if the impact assessment is acceptable, `Candidate A` remains the first structural wave
- if the impact assessment shows unacceptable W7 destabilization risk, `Candidate B` becomes the default reconsideration path in the next decision cycle

### 6.3 Phase `P2` — Candidate C Parallel Performance Baseline

Scope:

- representative execution paths
- instrumentation hooks
- benchmark harness
- acceptance-policy baseline
- first governed evidence batch with harness-derived provenance (`reportId`, `reportHash`, `runId`, `measurementId`, `traceId`)

Hard boundary:

- this phase does not change whitepaper performance numbers into current truth by itself
- trace-backed production evidence and any promotion to `BASELINE TRUTH` remain a future governed wave

### 6.4 Phase `P3` — Candidate A Execution Wave

Allowed outcomes:

- strengthen boundary contracts
- consolidate trust / isolation ownership
- reduce ambiguity between governance authority and model-gateway execution surfaces

Not allowed in this phase unless separately authorized:

- `Agent Definition` merge
- `L0-L4` migration
- broad RAG/context convergence work
- reputation / marketplace expansion

### 6.5 Phase `P4` — Candidate B Structural Follow-on

Scope:

- RAG convergence
- Context Engine convergence
- deterministic context packaging normalization
- gateway-assumption alignment against the outcome of `Candidate A`

Entry rule:

- `Candidate B` must state whether it is consuming a stabilized `Candidate A` output or proceeding because `Candidate A` was deferred

### 6.6 Phase `P5` — Candidate D Later-Wave Expansion

Scope:

- reputation signal
- task marketplace integration
- learning-plane merge target expansion

Entry rule:

- may not displace unresolved boundary clarification or missing performance baseline work

---

## 7. Dependency Rule

Execution order is fixed at the family level:

`P0 governance hardening -> P1 Candidate A auth -> P2 Candidate C auth (parallel-capable) -> P3 Candidate A wave -> P4 Candidate B wave -> P5 Candidate D wave`

Non-negotiable transitions:

- no `Candidate A` wave without W7 impact assessment
- no `Candidate B` wave without declared gateway assumptions
- no `Candidate D` wave before the first structural family and performance baseline are underway or closed
- no risk-model migration hidden inside any of the above phases

---

## 8. Deliverables Per Phase

Minimum deliverable set:

- one roadmap or execution-plan artifact for the active phase
- one family-bounded `GC-018` continuation candidate
- one ownership / dependency / exclusion map
- one closure review packet for any closed phase
- one `GC-026` sync note + tracker update when a governed phase closes

Minimum verification set:

- schema / contract tests for any touched surface
- guard-path tests for newly constrained boundaries
- dependency impact evidence for cross-plane changes
- benchmark evidence for any performance claim

---

## 9. Immediate Start Packet

1. Execute `P0` first so future `GC-018` packets inherit consistent exclusion and dependency discipline.
2. Read the active quality assessment and decide `REMEDIATE_FIRST` vs `EXPAND_NOW` before drafting any fresh `GC-018`.
3. Draft the first bounded `GC-018` packet for `Candidate A`.
4. Draft the instrumentation-only `GC-018` packet for `Candidate C` in parallel.
5. Re-open `Candidate B` only after the `Candidate A` impact posture is known.

Canonical source packet chain for this roadmap:

- `docs/reviews/CVF_MULTI_AGENT_INTAKE_REVIEW_POST_W7_OPEN_TARGETS_2026-03-28.md`
- `docs/reviews/CVF_MULTI_AGENT_REBUTTAL_POST_W7_OPEN_TARGETS_2026-03-28.md`
- `docs/reviews/CVF_MULTI_AGENT_DECISION_PACK_POST_W7_OPEN_TARGETS_2026-03-28.md`
- `docs/reviews/CVF_EA_DECISION_PACK_VALIDATION_POST_W7_OPEN_TARGETS_2026-03-28.md`

---

## 10. Status Log

| Item | Status |
|---|---|
| GC-027 intake review | DONE |
| GC-027 rebuttal | DONE |
| GC-027 canonical decision pack | DONE |
| EA validation and sign-off convergence | DONE |
| Post-W7 upgrade roadmap baseline drafted | DONE |
| `P0` governance hardening tranche | DONE |
| `P1` Candidate A authorization packet | DONE — W8-T1 GC-018 committed |
| `P2` Candidate C performance baseline workstream | CLOSED DELIVERED — W8-T2 |
| `P3` Candidate A execution wave | CLOSED DELIVERED — W8-T1 |
| `P4` Candidate B structural follow-on | READY FOR FRESH `GC-018` — upstream posture satisfied |
| `P5` Candidate D learning expansion | `CLOSED DELIVERED — W10-T1 Reputation Signal and Task Marketplace Learning Expansion; LPF 1333→1465 (+132 tests); all 7 pass conditions satisfied 2026-03-29` |
| `Post-P5` Whitepaper update (DOCUMENTATION class) | `CLOSED DELIVERED — W11-T1 whitepaper updated v3.0-W7T10 → v3.1-W10T1; all 9 pass conditions satisfied 2026-03-29` |
| `Post-P5` Agent Definition Boundary Convergence (REALIZATION class) | `CLOSED DELIVERED — W12-T1 AgentDefinitionBoundaryContract canonical; CPF 2144 tests; all 9 pass conditions satisfied 2026-03-29` |
| `Post-P5` Agent Definition Capability Batch (REALIZATION class) | `CLOSED DELIVERED — W13-T1 AgentDefinitionCapabilityBatchContract canonical; CPF 2170 tests (+26); all 7 pass conditions satisfied 2026-03-30` |
| `Post-P5` Agent Scope Resolution Batch (REALIZATION class) | `CLOSED DELIVERED — W14-T1 AgentScopeResolutionBatchContract canonical; CPF 2196 tests (+26); all 7 pass conditions satisfied 2026-03-30` |
| `Post-P5` Agent Definition Audit Batch (REALIZATION class) | `CLOSED DELIVERED — W15-T1 AgentDefinitionAuditBatchContract canonical; CPF 2222 tests (+26); all 7 pass conditions satisfied; W12-T1 agent definition family complete 2026-03-30` |
| `Post-P5` Whitepaper update v3.3-W15T1 (DOCUMENTATION class) | `CLOSED DELIVERED — W16-T1 whitepaper v3.3-W15T1 canonical; W13-T1/W14-T1/W15-T1 batch contracts reflected; CPF 2144→2222; all 7 pass conditions satisfied 2026-03-30` |
| `Post-P5` Agent Registration Batch (REALIZATION class) | `CLOSED DELIVERED — W17-T1 AgentRegistrationBatchContract canonical; CPF 2252 tests (+30); all 7 pass conditions satisfied; final W12-T1 registration surface closed 2026-03-30` |
| `Post-P5` Whitepaper update v3.4-W17T1 (DOCUMENTATION class) | `CLOSED DELIVERED — W18-T1 whitepaper v3.4-W17T1 canonical; W16-T1/W17-T1 reflected; CPF 2252; documentation-to-implementation gap closed; all 7 pass conditions satisfied 2026-03-30` |
| `Post-P5` Isolation Scope Batch (REALIZATION class) | `CLOSED DELIVERED — W19-T1 IsolationScopeBatchContract canonical; CPF 2278 tests (+26); all 7 pass conditions satisfied; W8-T1 trust isolation batch surface complete 2026-03-30` |
| `Post-P5` Trust Propagation Batch (REALIZATION class) | `CLOSED DELIVERED — W20-T1 TrustPropagationBatchContract canonical; CPF 2304 (+26); all 7 pass conditions satisfied; W8-T1 trust propagation batch surface closed 2026-03-30` |
| `Post-P5` Declare Trust Domain Batch (REALIZATION class) | `CLOSED DELIVERED — W21-T1 DeclareTrustDomainBatchContract canonical; CPF 2330 tests (+26); all 7 pass conditions satisfied; W8-T1 trust-isolation batch surface fully closed 2026-04-01` |
| `Post-P5` Gateway Auth Batch (REALIZATION class) | `CLOSED DELIVERED — W22-T1 GatewayAuthBatchContract canonical; CPF 2357 tests (+27); all 7 pass conditions satisfied 2026-04-01` |
| `Post-P5` AI Gateway Batch (REALIZATION class) | `CLOSED DELIVERED — W23-T1 AIGatewayBatchContract canonical; CPF 2385 tests (+28); all 7 pass conditions satisfied 2026-04-01` |
| `Post-P5` Gateway PII Detection Batch (REALIZATION class) | `CLOSED DELIVERED — W24-T1 GatewayPIIDetectionBatchContract canonical; CPF 2413 tests (+28); all 7 pass conditions satisfied 2026-04-01` |
| `Post-P5` Route Match Batch (REALIZATION class) | `CLOSED DELIVERED — W25-T1 RouteMatchBatchContract canonical; CPF 2440 tests (+27); all 7 pass conditions satisfied 2026-04-01` |
| `Post-P5` Orchestration Batch (REALIZATION class) | `CLOSED DELIVERED — W26-T1 OrchestrationBatchContract canonical; CPF 2473 tests (+33); all 7 pass conditions satisfied 2026-04-01` |
| `Post-P5` Design Batch (REALIZATION class) | `CLOSED DELIVERED — W27-T1 DesignBatchContract canonical; CPF 2507 tests (+34); all 7 pass conditions satisfied 2026-04-01` |
| `Post-P5` Reverse Prompting Batch (REALIZATION class) | `CLOSED DELIVERED — W28-T1 ReversePromptingBatchContract canonical; CPF 2538 tests (+31); all 7 pass conditions satisfied 2026-04-01` |
| `Post-P5` Boardroom Batch (REALIZATION class) | `CLOSED DELIVERED — W29-T1 BoardroomBatchContract canonical; CPF 2575 tests (+37); all 7 pass conditions satisfied 2026-04-01` |
| `Post-P5` Boardroom Transition Gate Batch (REALIZATION class) | `CLOSED DELIVERED — W30-T1 BoardroomTransitionGateBatchContract canonical; CPF 2615 tests (+40); all 7 pass conditions satisfied; GC-028 boardroom transition gate batch surface closed 2026-04-01` |
| `Post-P5` Architecture baseline sync refresh | `DONE — synchronized continuity refresh aligns whitepaper, tracker, handoff, roadmap, and quality-first baseline to W30-T1 / v3.5-W30T1 on 2026-04-01` |
| `Post-P5` Boardroom Round Batch (REALIZATION class) | `CLOSED DELIVERED — W31-T1 BoardroomRoundBatchContract canonical; CPF 2654 tests (+39); all 7 pass conditions satisfied; W1-T6 CP1 BoardroomRoundContract.openRound() batch surface closed 2026-04-01` |
| `Post-P5` Boardroom Multi-Round Batch (REALIZATION class) | `CLOSED DELIVERED — W32-T1 BoardroomMultiRoundBatchContract canonical; CPF 2691 tests (+37); all 7 pass conditions satisfied; W1-T6 CP2 BoardroomMultiRoundContract.summarize() batch surface closed 2026-04-01` |
