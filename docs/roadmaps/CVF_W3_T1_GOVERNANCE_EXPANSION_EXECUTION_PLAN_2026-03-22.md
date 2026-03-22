# CVF W3-T1 Governance-Expansion Execution Plan

> Date: 2026-03-22  
> Parent roadmap: `docs/roadmaps/CVF_WHITEPAPER_COMPLETION_ROADMAP_2026-03-21.md`  
> Authorization packet: `docs/reviews/CVF_GC018_CONTINUATION_CANDIDATE_W3_T1_2026-03-22.md`  
> Tranche packet: `docs/reviews/CVF_W3_T1_GOVERNANCE_EXPANSION_TRANCHE_PACKET_2026-03-22.md`  
> Status: `AUTHORIZED TRANCHE — CP1 IMPLEMENTED / TRANCHE CLOSED`

---

## 1. Purpose

This plan defines the execution shape for the next authorized whitepaper-completion tranche:

- `W3-T1 — Governance Expansion Foundation`

The goal is to converge the remaining operational governance modules into one governed package surface while explicitly documenting which proposal-only governance targets remain deferred.

## 2. Authorized Scope

Authorized by `GC-018`:

- one bounded implementation tranche limited to `governance expansion foundation`

Still required before any major structural change:

- `GC-019` audit
- independent review
- explicit execution decision

Out of scope for this tranche:

- `CVF Watchdog` implementation
- `Audit / Consensus` implementation
- any reopening of closed `W1-T1` or `W2-T1`
- learning-plane work

## 3. Tranche Work Items

### CP1 — Governance Expansion Foundation Shell

Change class:

- `coordination package`

Target:

- package shell `EXTENSIONS/CVF_GOVERNANCE_EXPANSION_FOUNDATION`

Scope:

- stable entrypoints for:
  - governance CLI
  - graph governance
  - phase-governance protocol
  - skill-governance engine

Notes:

- preserve source-module lineage
- do not physically merge source modules in this step
- explicitly record already-consolidated governance targets and explicitly deferred concept-only targets

Status:

- `IMPLEMENTED`

### Tranche Closure

Scope:

- tranche receipts
- test evidence
- explicit defer decisions for concept-only targets with no operational source

Status:

- `IMPLEMENTED`

## 4. Recommended Execution Order

1. `CP1` — Governance Expansion Foundation Shell
2. Tranche Closure

## 5. Why CP1 Comes First

`CP1` is the correct first move because it:

- gives the governance-expansion line one concrete package surface
- preserves lineage for existing operational modules
- avoids false claims that concept-only targets have become modules

## 6. Expected Evidence Chain

For `CP1`, the minimum evidence chain is:

1. `GC-019` structural audit packet
2. independent review packet
3. explicit execution decision
4. implementation delta
5. tranche-local tests and closure receipts

## 7. Final Readout

> `W3-T1` is authorized and implemented as a closed governance-expansion foundation tranche for operational governance modules only, with concept-only `Watchdog` and `Audit / Consensus` targets explicitly deferred.

Canonical closure anchors:

- `docs/reviews/CVF_W3_T1_GOVERNANCE_EXPANSION_TRANCHE_CLOSURE_REVIEW_2026-03-22.md`
- `docs/baselines/CVF_W3_T1_GOVERNANCE_EXPANSION_TRANCHE_CLOSURE_DELTA_2026-03-22.md`
