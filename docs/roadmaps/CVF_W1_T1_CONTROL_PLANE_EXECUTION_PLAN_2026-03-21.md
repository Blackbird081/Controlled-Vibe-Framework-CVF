# CVF W1-T1 Control-Plane Execution Plan

> Date: 2026-03-21  
> Parent roadmap: `docs/roadmaps/CVF_WHITEPAPER_COMPLETION_ROADMAP_2026-03-21.md`  
> Authorization packet: `docs/reviews/CVF_GC018_CONTINUATION_CANDIDATE_W1_T1_2026-03-21.md`  
> Tranche packet: `docs/reviews/CVF_WHITEPAPER_FIRST_TRANCHE_PACKET_2026-03-21.md`  
> Status: `AUTHORIZED TRANCHE — EXECUTION NOT STARTED`

---

## 1. Purpose

This plan defines the execution shape for the first authorized whitepaper-completion tranche:

- `W1-T1 — Control-Plane Foundation`

The goal is to move the highest-value control-plane blocks from concept-only status into governed, reviewable package surfaces without breaking the current active path.

---

## 2. Authorized Scope

Authorized by `GC-018`:

- one bounded implementation tranche limited to `control-plane foundation`

Still required before any major structural change:

- `GC-019` audit
- independent review
- explicit execution decision

Out of scope for this tranche:

- execution-plane completion
- learning-plane completion
- proposal-only governance subsystems
- big-bang control-plane rewrite

---

## 3. Tranche Work Items

### CP1 — Control-Plane Foundation Shell

Change class:

- `coordination package`

Target:

- proposed package shell `EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION`

Scope:

- stable entrypoints for:
  - intent intake / constraint extraction
  - knowledge retrieval
  - context freezing / deterministic packaging
  - governance-canvas reporting

Notes:

- preserve source-module lineage
- do not physically merge the source modules in this step
- do not pull `CVF_v1.7_CONTROLLED_INTELLIGENCE` into the initial package body

Status:

- `READY FOR GC-019`

### CP2 — Knowledge And Context Wrapper Alignment

Change class:

- `wrapper/re-export alignment`

Scope:

- make knowledge/context entrypoints explicit and consistent with the `CVF_PLANE_FACADES` contract
- keep runtime compatibility with current active-path usage

Status:

- `DEFER UNTIL CP1 DECISION`

### CP3 — Governance-Canvas Reporting Integration

Change class:

- `coordination package`

Scope:

- connect control-plane outputs to reportable governance-canvas surfaces
- make tranche evidence reviewable without changing the active-path governance core

Status:

- `DEFER UNTIL CP1 DECISION`

### CP4 — Selected Controlled-Intelligence Surface Alignment

Change class:

- `wrapper/re-export` or `defer`

Scope:

- only selected control-oriented surfaces
- likely candidates:
  - policy/risk mapping references
  - context segmentation interfaces
  - reasoning-boundary surfaces that matter for the control-plane narrative

Guardrail:

- no physical move of active-path critical `CVF_v1.7_CONTROLLED_INTELLIGENCE` files in the first sub-batch

Status:

- `LATE-TRANCHE CANDIDATE`

### CP5 — Tranche Closure Review

Scope:

- tranche receipts
- test evidence
- whitepaper readout uplift proposal
- closure / defer decisions for unfinished sub-items

Status:

- `END-OF-TRANCHE`

---

## 4. Recommended Execution Order

1. `CP1` — Control-Plane Foundation Shell
2. `CP2` — Knowledge And Context Wrapper Alignment
3. `CP3` — Governance-Canvas Reporting Integration
4. `CP4` — Selected Controlled-Intelligence Surface Alignment
5. `CP5` — Tranche Closure Review

---

## 5. Why CP1 Comes First

`CP1` is the safest first move because it:

- creates one concrete control-plane package surface
- preserves lineage of the strongest existing modules
- avoids premature physical merge pressure
- keeps active-path critical `CVF_v1.7_CONTROLLED_INTELLIGENCE` logic out of the first structural move

---

## 6. Expected Evidence Chain

For `CP1`, the minimum evidence chain is:

1. `GC-019` structural audit packet
2. independent review packet
3. explicit execution decision
4. implementation delta
5. tranche-local tests and closure receipts

---

## 7. Final Readout

> `W1-T1` is now authorized, and `CP1 — Control-Plane Foundation Shell` is the correct first governed change inside the tranche.
