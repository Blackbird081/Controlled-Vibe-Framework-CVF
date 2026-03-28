---
tranche: W7-T3
checkpoint: CP1
title: Guard Binding Matrix — 8 Shared Guards + 15 Runtime Preset Mappings
date: 2026-03-28
status: DELIVERED
gate: P2
---

# W7-T3 / CP1 — Guard Binding Matrix

Memory class: FULL_RECORD

> Authorization: `docs/reviews/CVF_GC018_CONTINUATION_CANDIDATE_W7_T3_GUARD_BINDING_BOUNDARY_LOCK_2026-03-28.md`
> Execution plan: `docs/roadmaps/CVF_W7_T3_GUARD_BINDING_BOUNDARY_LOCK_EXECUTION_PLAN_2026-03-28.md`

---

## 1. Eight Shared Guards

These guards apply universally to all W7 integration concepts. Every W7 concept contract (W7-T4+) must declare which guards are active for each operation.

| # | Guard Name | Trigger Condition | Enforcement Contract | Failure Behavior |
|---|---|---|---|---|
| G1 | `RISK_CLASSIFICATION_GUARD` | Always — every W7 concept operation | W7RiskFields.riskLevel present | Reject operation — missing risk declaration is a hard block |
| G2 | `POLICY_GATE_GUARD` | riskLevel >= R2 | EPF `policy.gate.contract.ts` | DENY → hard block; PASS → continue with audit trail |
| G3 | `OWNERSHIP_REGISTRY_GUARD` | Concept first accessed | W7-T1 canonical ownership map | Block if concept not in canonical map — prevent rogue concept registration |
| G4 | `BOUNDARY_CROSSING_GUARD` | CPF→EPF or EPF→LPF handoff | CPF `consumer.pipeline.contract.ts` → EPF `execution.pipeline.contract.ts` | Block cross-boundary access that bypasses the established handoff contract |
| G5 | `AUTONOMY_LOCK_GUARD` | Agent Builder autonomous mode requested | P6 gate (policy gate + confidence check + escalation path) | Hard block autonomous mode until P6 gate explicitly passes |
| G6 | `TRACE_EXISTENCE_GUARD` | Memory Loop activation requested | LPF `learning.observability.contract.ts` signal — real trace required | Block Memory Loop until real trace output confirmed (P5) |
| G7 | `DEPENDENCY_ORDER_GUARD` | Integration step transition | W7-T1 merge blueprint dependency chain | Block out-of-order integration — Runtime must precede Artifact, Trace, Planner, etc. |
| G8 | `SPEC_ISOLATION_GUARD` | StructuredSpec operation that touches runtime | P8 gate — Spec Inference must operate inside Policy Gate only | Block any Spec Inference path that runs parallel to or outside Policy Gate |

### Guard Applicability by Concept

| Concept | Always Active | Conditional |
|---|---|---|
| Skill | G1, G3 | G2 (R2+), G5 (autonomous mode) |
| Capability | G1, G3 | G2 (R2+), G4 (cross-plane), G5 (multi-agent) |
| PlannedAction | G1, G3, G4, G7 | G2 (R2+), G5 (autonomous) |
| StructuredSpec | G1, G3, G8 | G2 (R2+), G5 (code gen autonomous) |
| Memory Loop | G6 | G7 (dependency order) |

---

## 2. Fifteen Runtime Preset Mappings

Each preset defines the exact guards activated for a given concept × scenario combination.

| # | Concept | Scenario | Risk | Guards Activated | Existing CVF Contract Binding |
|---|---|---|---|---|---|
| P-01 | Skill | Read-only `.skill.md` access | R0 | G3 only | GEF governance checkpoint |
| P-02 | Skill | Extraction from conversation | R1 | G1, G3 | LPF `learning.observability.contract.ts` (advisory signal) |
| P-03 | Skill | Governance registry mutation | R2 | G1, G2, G3 | EPF `policy.gate.contract.ts` + GEF `governance.audit.signal.contract.ts` |
| P-04 | Skill | Autonomous agent action | R3 | G1, G2, G3, G5 | EPF `policy.gate.contract.ts` + GEF `watchdog.escalation.contract.ts` |
| P-05 | Capability | Schema / definition read | R0 | G3 only | GEF governance checkpoint |
| P-06 | Capability | Scoped single-plane invocation | R1 | G1, G3 | LPF `learning.observability.contract.ts` (advisory signal) |
| P-07 | Capability | Cross-plane or multi-agent coordination | R3 | G1, G2, G3, G4, G5 | EPF `policy.gate.contract.ts` + GEF `watchdog.escalation.contract.ts` + CPF→EPF handoff verification |
| P-08 | PlannedAction | DESIGN-phase plan definition | R0 | G3, G4, G7 | CPF `consumer.pipeline.contract.ts` boundary check |
| P-09 | PlannedAction | Single-step bounded execution | R1 | G1, G3, G4, G7 | LPF `learning.observability.contract.ts` (advisory) + dependency order check |
| P-10 | PlannedAction | Multi-step execution | R2 | G1, G2, G3, G4, G7 | EPF `policy.gate.contract.ts` + GEF `governance.audit.log.contract.ts` |
| P-11 | PlannedAction | Autonomous multi-step without checkpoint | R3 | G1, G2, G3, G4, G5, G7 | EPF `policy.gate.contract.ts` + GEF `watchdog.escalation.contract.ts` + human checkpoint required |
| P-12 | StructuredSpec | Spec definition / schema read | R0 | G3, G8 | GEF governance checkpoint + spec isolation verified |
| P-13 | StructuredSpec | External dependency resolution | R1 | G1, G3, G8 | LPF `learning.observability.contract.ts` (advisory) |
| P-14 | StructuredSpec | Policy enforcement rules applied | R2 | G1, G2, G3, G8 | EPF `policy.gate.contract.ts` (spec lives inside gate) + GEF `governance.audit.signal.contract.ts` |
| P-15 | StructuredSpec | Autonomous code generation | R3 | G1, G2, G3, G5, G8 | EPF `policy.gate.contract.ts` + GEF `watchdog.escalation.contract.ts` + spec isolation enforced |

---

## 3. P2 Gate Satisfaction

Gate P2 (Guard binding matrix complete — 8 shared guards + 15 runtime preset mapping) is **SATISFIED** by this document.

- 8 shared guards defined with trigger conditions, enforcement contracts, and failure behaviors
- 15 runtime presets covering all four W7 concepts across their full risk scenario range
- All enforcement routes through existing EPF/GEF contracts — no new guard infrastructure required
- Guard applicability table explicitly maps which guards are always-active vs conditional per concept
