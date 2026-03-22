# CVF W1-T2 Usable Intake Slice Execution Plan

> Date: `2026-03-22`  
> Parent roadmap: `docs/roadmaps/CVF_WHITEPAPER_COMPLETION_ROADMAP_2026-03-21.md`  
> Authorization packet: `docs/reviews/CVF_GC018_CONTINUATION_CANDIDATE_W1_T2_2026-03-22.md`  
> Tranche packet: `docs/reviews/CVF_W1_T2_USABLE_INTAKE_SLICE_PACKET_2026-03-22.md`  
> Status: `AUTHORIZED TRANCHE - EXECUTION PLAN OPEN / CP1 REVIEWABLE`

---

## 1. Purpose

This plan defines the execution shape for:

- `W1-T2 - Usable Intake Slice`

The tranche goal is to produce one control-plane slice that is operationally meaningful:

- one callable intake contract
- one deterministic packaged-context output
- one real downstream consumer path

This tranche should not be used to justify another shell-only closure.

---

## 2. Authorized Scope

Authorized by `GC-018`:

- one bounded realization-first control-plane tranche
- one tranche-local execution plan
- one or more `GC-019` packets inside the tranche

Still required before any implementation batch:

- `GC-019` audit
- independent review
- explicit execution decision

Out of scope for this tranche:

- learning-plane implementation
- `Watchdog`
- `Audit / Consensus`
- `AI Boardroom / Reverse Prompting`
- `CEO Orchestrator Agent`
- big-bang `AI Gateway` runtime rewrite
- shell-only tranche completion with no real consumer path

---

## 3. Tranche Work Items

### CP1 - Usable Intake Contract Baseline

Change class:

- `behavioral contract integration`

Scope:

- define one callable intake contract that is more than a re-export
- connect intent intake, knowledge retrieval, and deterministic context-packaging responsibilities behind one reviewable contract boundary
- keep the change bounded to source-backed modules already named in the tranche packet

Likely source-backed foundations:

- `EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION`
- `EXTENSIONS/CVF_PLANE_FACADES`
- `EXTENSIONS/CVF_ECO_v1.0_INTENT_VALIDATION`
- `EXTENSIONS/CVF_ECO_v1.4_RAG_PIPELINE`
- `EXTENSIONS/CVF_v1.9_DETERMINISTIC_REPRODUCIBILITY`

Guardrails:

- do not present `CP1` as full `AI Gateway` completion
- do not let the tranche end at contract naming only; later packets must prove usable output
- preserve current lineage and active-path compatibility while adding the new behavioral boundary

Status:

- `REVIEWABLE`

### CP2 - Unified Knowledge Retrieval Contract

Change class:

- `additive contract alignment`

Scope:

- make the retrieval side of the intake contract explicit and consumer-usable
- unify the retrieval handoff so the intake path does not depend on loose multi-surface calls

Status:

- `PLANNED`

### CP3 - Deterministic Context Packaging

Change class:

- `additive runtime integration`

Scope:

- produce deterministic packaged-context output for the intake contract
- make packaging semantics reviewable and testable at the tranche level

Status:

- `PLANNED`

### CP4 - Real Consumer Path Proof

Change class:

- `consumer-path integration`

Scope:

- connect one real downstream consumer path
- prove that the tranche output is operationally meaningful and not only internally well-structured

Status:

- `PLANNED`

### CP5 - Tranche Closure Review

Scope:

- tranche receipts
- test evidence
- remaining-gap notes against the whitepaper target-state
- closure / defer decisions for unfinished sub-items

Status:

- `PLANNED`

---

## 4. Recommended Execution Order

1. `CP1` - Usable Intake Contract Baseline
2. `CP2` - Unified Knowledge Retrieval Contract
3. `CP3` - Deterministic Context Packaging
4. `CP4` - Real Consumer Path Proof
5. `CP5` - Tranche Closure Review

---

## 5. Why CP1 Comes First

`CP1` is the right first packet because it forces the tranche to answer the most important question early:

- is there one actual intake contract that a caller can use?

If that answer is weak, the tranche should stop rather than accumulate more wrapper-level structure.

---

## 6. Expected Evidence Chain

For `CP1`, the minimum evidence chain is:

1. `GC-019` audit packet
2. independent review packet
3. explicit execution decision
4. implementation delta
5. tranche-local tests and receipt updates

---

## 7. Final Readout

> `W1-T2` is now execution-planned as a realization-first control-plane tranche. `CP1` is reviewable as the first bounded move toward one usable intake contract, while broader `AI Gateway` completion remains out of scope.
