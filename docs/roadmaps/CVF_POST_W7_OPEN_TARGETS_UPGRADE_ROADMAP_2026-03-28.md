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

- current authoritative baseline remains `docs/reference/CVF_MASTER_ARCHITECTURE_WHITEPAPER.md` at `v3.0-W7T10`
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

If any required gate is missing, the affected phase remains `HOLD`.

---

## 5. Official Phase Sequence

| Phase | Scope | Initial Decision | Required Gates | Exit Criteria |
|---|---|---|---|---|
| `P0` | Governance hardening for next-wave drafting | `GO` | `G1-G4` | exclusion template, dependency declaration pattern, and drafting rules are committed as reusable canon |
| `P1` | `Candidate A` authorization packet drafting | `GO WITH FIXES` | `G1-G5`, `G7` | one bounded `GC-018` candidate for Trust / Isolation + Model Gateway boundary convergence is review-ready |
| `P2` | `Candidate C` instrumentation-only authorization packet drafting | `GO WITH FIXES` | `G1`, `G4`, `G6` | one bounded `GC-018` candidate for measurement / benchmark harness is review-ready |
| `P3` | `Candidate A` first-wave execution if authorized | `GO WITH FIXES` | `P1 closed`, `G5`, `G7` | boundary contracts are clarified without destabilizing the W7 chain; closure review complete |
| `P4` | `Candidate B` authorization and execution planning | `GO WITH FIXES` | `P2 in motion or closed`, `P3 closed or formally deferred`, `G1-G4`, `G7` | one bounded `GC-018` candidate for RAG + Context convergence is review-ready with declared gateway assumptions |
| `P5` | `Candidate D` later-wave intake | `HOLD -> GO` | `P3` and `P4` in motion or closed, `G1-G4`, `G8` | learning expansion may be evaluated as a later governed wave |

---

## 6. Detailed Phase Definition

### 6.1 Phase `P0` — Governance Hardening for Drafting Discipline

Deliverables:

- canonical exclusion template for `not in this wave`
- canonical dependency declaration pattern for future `GC-018` packets
- roadmap-to-authorization drafting checklist for post-W7 families

Success rule:

- future `GC-018` packets can be written without ambiguity about exclusions, dependencies, or ownership transfer

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
- trace-backed latency / throughput evidence

Hard boundary:

- this phase does not change whitepaper performance numbers into current truth by itself

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
2. Draft the first bounded `GC-018` packet for `Candidate A`.
3. Draft the instrumentation-only `GC-018` packet for `Candidate C` in parallel.
4. Re-open `Candidate B` only after the `Candidate A` impact posture is known.

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
| `P0` governance hardening tranche | PENDING |
| `P1` Candidate A authorization packet | PENDING |
| `P2` Candidate C authorization packet | PENDING |
| `P3` Candidate A execution wave | HOLD — requires fresh `GC-018` |
| `P4` Candidate B structural follow-on | HOLD — depends on `Candidate A` posture |
| `P5` Candidate D learning expansion | HOLD — later wave only |
