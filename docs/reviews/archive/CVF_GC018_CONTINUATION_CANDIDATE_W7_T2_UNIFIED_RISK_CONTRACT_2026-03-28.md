---
tranche: W7-T2
control: GC-018
title: GC-018 Continuation Candidate — Unified Risk Contract (R0-R3)
date: 2026-03-28
status: AUTHORIZED
---

# GC-018 Continuation Candidate — W7-T2

Memory class: FULL_RECORD

> Parent roadmap: `docs/roadmaps/CVF_W7_R14_R15_R16_INTEGRATION_ROADMAP_2026-03-25.md`
> Gate required: P3

---

## Continuation Candidate

- **Candidate ID**: GC018-W7-T2-UNIFIED-RISK-CONTRACT-2026-03-28
- **Date**: 2026-03-28
- **Proposed scope**: Deliver unified R0-R3 risk contract for Skill, Capability, PlannedAction, StructuredSpec — satisfying P3 gate before any W7-T4+ implementation tranche
- **Continuation class**: STRUCTURAL
- **Why now**: P1 satisfied (W7-T1 closed). W7-T3 is blocked until P3 is satisfied alongside P2. Delivering P3 now clears the path for W7-T3 guard binding.
- **Active-path impact**: LIMITED — governance documents only; no code implementation
- **Risk if deferred**: W7-T3/T4+ remain hard-blocked; integration drift across Skill/Runtime risk models
- **Lateral alternative**: NO — P3 is a mandatory gate with no bypass path

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
- **Reason**: P3 (Unified risk contract) is a mandatory prerequisite for W7-T3 guard binding and all W7-T4+ implementation tranches. No implementation work can proceed without it.

## Authorization Boundary

- **Authorized now**: YES
- **Next batch name**: W7-T2 Unified Risk Contract (R0-R3)
- **Deliverables**: R0-R3 risk field definitions + enforcement behavior for Skill, Capability, PlannedAction, StructuredSpec

---

## Immediate Authorized Follow-up

1. Execute CP1 (Full Lane): R0-R3 risk field schema + enforcement behavior document
2. Execute CP2 (Fast Lane): Risk field application matrix per concept
3. Execute CP3: Closure review, W7 roadmap P3 status update, GC-026 sync
