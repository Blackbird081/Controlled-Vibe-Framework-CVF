# CVF Whitepaper W0 Scoped Backlog — 2026-03-21

> Date: 2026-03-21  
> Parent roadmap: `docs/roadmaps/CVF_WHITEPAPER_COMPLETION_ROADMAP_2026-03-21.md`  
> Authorization basis: `docs/reviews/CVF_GC018_CONTINUATION_CANDIDATE_W1_2026-03-21.md`  
> Scope: `W0 discovery and scoping only`

---

## Purpose

This backlog ranks the remaining whitepaper-completion gaps by:

- execution value
- codebase foundation strength
- governance safety
- tranche suitability

It does **not** authorize implementation.

---

## Ranked Gap Inventory

| Rank | Gap | Whitepaper mapping | Existing codebase foundation | W0 readout |
|---|---|---|---|---|
| `1` | Control-plane foundation | `AI Gateway`, `Knowledge Layer`, `Context Builder & Packager` | `CVF_ECO_v1.0_INTENT_VALIDATION`, `CVF_ECO_v1.4_RAG_PIPELINE`, `CVF_ECO_v2.1_GOVERNANCE_CANVAS`, `CVF_v1.9_DETERMINISTIC_REPRODUCIBILITY`, `CVF_v1.7_CONTROLLED_INTELLIGENCE` | `READY FOR FIRST TRANCHE PACKET` |
| `2` | Execution system-reality completion | `Command Runtime`, `MCP Bridge`, remaining execution-plane completion | `CVF_ECO_v2.5_MCP_SERVER`, `CVF_MODEL_GATEWAY`, `CVF_v1.7.3_RUNTIME_ADAPTER_HUB` | `READY AFTER FIRST TRANCHE` |
| `3` | Learning observability completion | `Truth Model`, `Evaluation Engine`, observability-aligned learning loop | `CVF_AGENT_LEDGER`, `CVF_v1.8.1_ADAPTIVE_OBSERVABILITY_RUNTIME` | `KEEP AS SECOND-WAVE OR LATE-TRANCHE CANDIDATE` |
| `4` | Governance target expansion | `Audit / Consensus`, `CVF Watchdog` | limited direct code foundation in current baseline; mostly proposal-level | `DEFER UNTIL STRONGER NEED OR SEPARATE FOUNDATION` |

---

## Why Rank 1 Comes First

The control-plane foundation is the best first tranche because:

- it closes the largest central whitepaper gap
- it has the strongest cluster of existing modules
- it improves the architecture without forcing immediate deep physical restructuring
- it creates prerequisites for later execution-plane and learning-plane completion

---

## Candidate Foundations By Ranked Gap

### Rank 1 — Control-plane foundation

Evidence-backed module set:

- `EXTENSIONS/CVF_ECO_v1.0_INTENT_VALIDATION`
- `EXTENSIONS/CVF_ECO_v1.4_RAG_PIPELINE`
- `EXTENSIONS/CVF_ECO_v2.1_GOVERNANCE_CANVAS`
- `EXTENSIONS/CVF_v1.9_DETERMINISTIC_REPRODUCIBILITY`
- `EXTENSIONS/CVF_v1.7_CONTROLLED_INTELLIGENCE`

W0 conclusion:

- enough code foundation exists to package a bounded first tranche
- the tranche should focus on `knowledge + context + intent` convergence first
- the dedicated `AI Gateway` should remain a scoped design objective inside the tranche, not an uncontrolled full build commitment

### Rank 2 — Execution system reality

Evidence-backed module set:

- `EXTENSIONS/CVF_ECO_v2.5_MCP_SERVER`
- `EXTENSIONS/CVF_MODEL_GATEWAY`
- `EXTENSIONS/CVF_v1.7.3_RUNTIME_ADAPTER_HUB`

W0 conclusion:

- strong foundation exists
- best treated as the second tranche after the control-plane foundation clarifies upstream contracts

### Rank 3 — Learning observability

Evidence-backed module set:

- `EXTENSIONS/CVF_AGENT_LEDGER`
- `EXTENSIONS/CVF_v1.8.1_ADAPTIVE_OBSERVABILITY_RUNTIME`

W0 conclusion:

- foundation exists, but the whitepaper itself says learning should come later
- keep this as a later tranche unless a new reassessment changes priority

### Rank 4 — Governance target expansion

Target blocks:

- `Audit / Consensus`
- `CVF Watchdog`

W0 conclusion:

- current baseline has insufficient implementation foundation for a safe near-term tranche
- keep deferred until either:
  - a dedicated foundation packet is produced, or
  - a later tranche demonstrates operational need

---

## W0 Output

The scoped backlog supports this next governed move:

- prepare one first-tranche packet for the **control-plane foundation**

It explicitly does **not** support:

- opening multiple tranches at once
- opening governance expansion and learning expansion in the same batch
- treating proposal-only subsystems as implementation-ready

---

## Final W0 Ranking

1. `Control-plane foundation`
2. `Execution system-reality completion`
3. `Learning observability completion`
4. `Governance target expansion` — deferred
