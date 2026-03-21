# CVF W1-T1 Control-Plane Execution Plan

> Date: 2026-03-21  
> Parent roadmap: `docs/roadmaps/CVF_WHITEPAPER_COMPLETION_ROADMAP_2026-03-21.md`  
> Authorization packet: `docs/reviews/CVF_GC018_CONTINUATION_CANDIDATE_W1_T1_2026-03-21.md`  
> Tranche packet: `docs/reviews/CVF_WHITEPAPER_FIRST_TRANCHE_PACKET_2026-03-21.md`  
> Status: `AUTHORIZED TRANCHE — CP1 / CP2 IMPLEMENTED`

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

- package shell `EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION`

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

- `IMPLEMENTED`

### CP2 — Knowledge And Context Wrapper Alignment

Change class:

- `wrapper/re-export alignment`

Scope:

- make knowledge/context entrypoints explicit and consistent with the `CVF_PLANE_FACADES` contract
- keep runtime compatibility with current active-path usage

Status:

- `IMPLEMENTED`

### CP3 — Governance-Canvas Reporting Integration

Change class:

- `coordination package`

Scope:

- connect control-plane outputs to reportable governance-canvas surfaces
- make tranche evidence reviewable without changing the active-path governance core

Status:

- `READY AFTER CP2`

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

> `W1-T1` is authorized, and both `CP1` and `CP2` have now been implemented in their approved tranche-local forms.

## 8. Implementation Receipt

Implemented package:

- `EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION/`

Receipt highlights:

- source lineage preserved for:
  - `CVF_ECO_v1.0_INTENT_VALIDATION`
  - `CVF_ECO_v1.4_RAG_PIPELINE`
  - `CVF_ECO_v2.1_GOVERNANCE_CANVAS`
  - `CVF_v1.9_DETERMINISTIC_REPRODUCIBILITY`
- `CVF_v1.7_CONTROLLED_INTELLIGENCE` remains outside the initial package body
- package-local verification is green
- source-module regression verification is green

Evidence anchor:

- `docs/baselines/CVF_W1_T1_CP1_CONTROL_PLANE_IMPLEMENTATION_DELTA_2026-03-21.md`

## 9. Implementation Receipt

Implemented wrapper target:

- `EXTENSIONS/CVF_PLANE_FACADES/`

Receipt highlights:

- knowledge/context facade entrypoints now align to the `CP1` shell
- retrieval delegates through `CVF_CONTROL_PLANE_FOUNDATION`
- deterministic packaging hash aligns to the v1.9 line surfaced by the shell
- public facade signatures remain stable
- package-local verification is green
- regression verification against the preserved source lines is green

Evidence anchor:

- `docs/baselines/CVF_W1_T1_CP2_KNOWLEDGE_CONTEXT_IMPLEMENTATION_DELTA_2026-03-21.md`
