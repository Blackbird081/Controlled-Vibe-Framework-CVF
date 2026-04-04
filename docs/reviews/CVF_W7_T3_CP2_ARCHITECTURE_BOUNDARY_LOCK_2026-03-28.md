---
tranche: W7-T3
checkpoint: CP2
title: Architecture Boundary Lock — Planner/Runtime/Memory Plane Assignments
date: 2026-03-28
status: DELIVERED
gate: P4
---

# W7-T3 / CP2 — Architecture Boundary Lock

Memory class: FULL_RECORD

> Lane: Fast Lane (GC-021) — additive within W7-T3 authorized scope

---

## 1. Final Boundary Statement (P4)

The following assignments are locked and non-negotiable for all W7 integration work:

```
CONTROL PLANE (CPF)  — DESIGN phase
  ├── Planner contracts (PlannedAction schema, design-time only)
  ├── Decision Engine (bounded by R0-R3 risk gate, after Trace is stable)
  └── E2E Flow reference (CVF_MASTER_ARCHITECTURE_WHITEPAPER v2.2-W4T11)

EXECUTION PLANE (EPF) — BUILD phase
  ├── Runtime (single runtime line; no parallel stack)
  ├── Artifact tracking (routed through execution.audit.summary.contract.ts)
  ├── Trace management (routed through EPF audit path)
  └── Spec Policy enforcement (StructuredSpec lives inside policy.gate.contract.ts)

GOVERNANCE LAYER (GEF) — REVIEW/GOVERNANCE
  ├── Skill Model (.skill.md governance artifacts)
  ├── Skill Registry (single GEF registry)
  └── Agent Builder (assisted-by-default; autonomous locked by G5/P6)

LEARNING PLANE (LPF) — LEARN phase
  ├── Eval Loop (real-time; evaluation.engine.contract.ts)
  └── Memory Loop (deferred; gated by G6/P5 — real trace required)
```

---

## 2. Canonical Handoff Contract

The sole authorized cross-boundary path from Control Plane to Execution Plane:

```
CPF: ControlPlaneConsumerPipelineContract
  → produces: ControlPlaneConsumerPackage
    → consumed by: EPF ExecutionPipelineContract
      → produces: ExecutionPipelineReceipt
```

No W7 integration concept may cross the CPF→EPF boundary through any other path. Any new W7 cross-plane handoff must extend this existing contract chain, not bypass it.

---

## 3. Violation Detection Criteria

A W7-T4+ implementation is in violation of P4 if any of the following are true:

| Violation | Description |
|---|---|
| Planner in BUILD | PlannedAction contract executed in EPF without CPF→EPF handoff |
| Runtime in DESIGN | Runtime logic placed in CPF DESIGN phase contracts |
| Parallel runtime stack | Any new runtime path not routed through EPF `execution.pipeline.contract.ts` |
| Memory Loop without trace | LPF `learning.loop.contract.ts` activated without real trace signal (G6 violation) |
| Spec outside Policy Gate | StructuredSpec logic runs parallel to EPF `policy.gate.contract.ts` (G8 violation) |
| Unauthorized cross-boundary | Any CPF→EPF call not through `ControlPlaneConsumerPipelineContract` chain |

---

## 4. P4 Gate Satisfaction

Gate P4 (Architecture boundary lock — Planner in Control Plane DESIGN, Runtime in Execution Plane BUILD) is **SATISFIED** by this document.

- Plane assignments are explicit and non-contradictory
- Canonical handoff contract identified (existing; no new contract needed)
- Violation detection criteria defined for W7-T4+ implementation review
- Combined with P2 (CP1): all W7-T4+ implementation tranches are now unblocked
