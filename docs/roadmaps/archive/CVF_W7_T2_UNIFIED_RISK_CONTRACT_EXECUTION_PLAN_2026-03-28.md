---
tranche: W7-T2
title: Execution Plan — Unified Risk Contract (R0-R3)
date: 2026-03-28
authorization: docs/reviews/CVF_GC018_CONTINUATION_CANDIDATE_W7_T2_UNIFIED_RISK_CONTRACT_2026-03-28.md
---

# W7-T2 Execution Plan — Unified Risk Contract (R0-R3)

Memory class: SUMMARY_RECORD

> Parent roadmap: `docs/roadmaps/CVF_W7_R14_R15_R16_INTEGRATION_ROADMAP_2026-03-25.md`
> Gate: P3

---

## Tranche Boundary

Define the unified R0-R3 risk contract that all W7 integration concepts (Skill, Capability, PlannedAction, StructuredSpec) must satisfy before implementation.

**In scope:**
- R0-R3 risk level definitions (canonical, authoritative)
- Per-concept risk field schema (what fields each concept must carry)
- Enforcement behavior per risk level (guard activation, policy gate response, escalation)

**Out of scope:**
- TypeScript contract implementation (W7-T4+)
- Guard binding matrix (W7-T3)
- Any runtime or memory loop activation

---

## CP1 — R0-R3 Risk Contract Schema (Full Lane)

Deliver canonical risk level definitions + risk field schema:
- Risk levels R0-R3 defined with guard activation rules
- Required risk fields for Skill, Capability, PlannedAction, StructuredSpec
- Enforcement behavior matrix per risk level

---

## CP2 — Risk Field Application Matrix (Fast Lane / GC-021)

Deliver per-concept risk field application matrix:
- Default risk classification per concept type
- Escalation triggers per concept
- Interaction with existing CVF Policy Gate (`policy.gate.contract.ts`)

---

## CP3 — Tranche Closure

Required artifacts:
- W7-T2 closure review
- W7 roadmap P3 status update
- GC-026 closure sync
- AGENT_HANDOFF update (W7-T3 now unblocked pending P2)

---

## Status Log

| CP | Status |
|---|---|
| GC-018 authorization | AUTHORIZED 2026-03-28 |
| CP1 | PENDING |
| CP2 | PENDING |
| CP3 | PENDING |
