---
tranche: W7-T5
control: GC-018
title: GC-018 Continuation Candidate — Autonomy Lock Policy (P6) + Review 16 Spec Inference Integration
date: 2026-03-28
status: AUTHORIZED
---

# GC-018 Continuation Candidate — W7-T5

Memory class: FULL_RECORD

> Parent roadmap: `docs/roadmaps/CVF_W7_R14_R15_R16_INTEGRATION_ROADMAP_2026-03-25.md`
> Gates required: P2 ✓, P3 ✓, P6 (CP1 delivers), P8 (satisfied by CP2 design)

---

## Continuation Candidate

- **Candidate ID**: GC018-W7-T5-SPEC-INFERENCE-AUTONOMY-LOCK-2026-03-28
- **Date**: 2026-03-28
- **Proposed scope**: Deliver P6 (Autonomy Lock Policy — Agent Builder default assisted mode, autonomous escalation protocol, policy gate requirements) as CP1. Then deliver Review 16 Spec Inference integration (StructuredSpec schema, inference protocol, policy enforcement) as CP2 — satisfying P8 by design isolation (Spec Inference is kept isolated from overlapping runtime/model components). P8 is a design constraint that CP2 must respect, not a pre-existing deliverable.
- **Continuation class**: STRUCTURAL
- **Why now**: W7-T4 closed. P6 and P8 are the remaining gates for W7-T5. P6 can be delivered as CP1 of this tranche (same pattern as T3 delivering P2+P4). P8 is satisfied by the isolation design of CP2.
- **Active-path impact**: LIMITED — design-phase contracts and governance documents only
- **Risk if deferred**: Spec Inference remains undefined; W7-T8 (Agent Builder) cannot define autonomous mode without P6 being locked

## Depth Audit

| Criterion | Score |
|---|---|
| Risk reduction | 2 |
| Decision value | 2 |
| Machine enforceability | 2 |
| Operational efficiency | 2 |
| Portfolio priority | 2 |
| **Total** | **10** |

- **Decision**: CONTINUE
- **Reason**: P6 (Autonomy Lock) is a hard prerequisite for any autonomous agent action across all W7 tranches. Delivering it alongside Spec Inference is efficient — the autonomy lock policy is directly relevant to Spec-driven agent behavior.

## Authorization Boundary

- **Authorized now**: YES
- **Next batch name**: W7-T5 Autonomy Lock Policy + Spec Inference Integration
- **Deliverables**:
  - CP1 (Full Lane): Autonomy Lock Policy — P6 gate delivery
  - CP2 (Full Lane): Spec Inference Integration Contract — StructuredSpec schema, inference protocol, policy enforcement; P8 satisfied by isolation design
  - CP3: Closure review + GC-026 sync + roadmap update
