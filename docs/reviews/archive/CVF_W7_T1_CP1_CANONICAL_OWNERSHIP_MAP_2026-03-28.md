---
tranche: W7-T1
checkpoint: CP1
title: Canonical Ownership Map — Review 14/15/16 Overlap Resolution
date: 2026-03-28
status: DELIVERED
gate: P1
---

# W7-T1 / CP1 — Canonical Ownership Map

Memory class: FULL_RECORD

> Authorization: `docs/reviews/CVF_GC018_CONTINUATION_CANDIDATE_W7_T0_R14_R15_R16_INTEGRATION_2026-03-26.md`
> Execution plan: `docs/roadmaps/CVF_W7_T1_CANONICAL_OWNERSHIP_MERGE_BLUEPRINT_EXECUTION_PLAN_2026-03-26.md`

---

## 1. Purpose

This document resolves concept ownership across overlapping proposals from Review 14 (Skill Formation), Review 15 (Multi-Agent Runtime), and Review 16 (Skill Creator / Spec Inference). Each concept is assigned exactly one canonical source, one owning plane/layer, and one governing control point. All duplicate lines are retired.

---

## 2. Canonical Ownership Map

| Concept | Decision | Canonical Source | Owning Plane | Governance Control | Retire Path |
|---|---|---|---|---|---|
| **Skill Model** | KEEP | `.skill.md` files in `tools/skills/` | Governance Layer (GEF) | GC-019 quality gate; skill schema validation | R14 alternate model proposals → retired, map to existing `.skill.md` schema |
| **Skill Registry** | KEEP | Skill catalog + search under `tools/` + Governance Layer registry | Governance Layer (GEF) | GEF `governance.checkpoint.contract.ts` guard scope | R16 distributed registry proposals → retired, merged into single GEF registry under `CVF_GOVERNANCE_EXPANSION_FOUNDATION` |
| **Execution Runtime** | KEEP | `CVF_EXECUTION_PLANE_FOUNDATION` (EPF) | Execution Plane (EPF) | EPF `execution.pipeline.contract.ts` + `policy.gate.contract.ts` | R15 parallel runtime stack proposals → retired; integrate into existing EPF contracts only |
| **E2E Flow** | KEEP | `docs/reference/CVF_MASTER_ARCHITECTURE_WHITEPAPER.md` (v2.2-W4T11) | Control Plane (CPF) | CPF orchestration contract (`orchestration.consumer.pipeline.contract.ts`) | R15/R16 alternative E2E flow diagrams → retired, superseded by whitepaper v2.2 |
| **Planner** | KEEP | CPF DESIGN phase — `ControlPlaneConsumerPipelineContract` path | Control Plane (CPF) | CPF `consumer.pipeline.contract.ts`; must remain in DESIGN, never in BUILD | R15 Planner-as-runtime proposals → retired; Planner stays in CPF DESIGN |
| **Decision Engine** | KEEP | CPF bounded under R0-R3 risk gating | Control Plane (CPF) | CPF risk contract; gate: Planner must be stable first | R15 autonomous Decision Engine proposals → retired pending Trace stability (P5) |
| **Spec Inference** | KEEP (isolated) | Integrated under existing Policy Gate (EPF) | Execution Plane (EPF) | EPF `policy.gate.contract.ts` (R16 Spec Policy boundary) | R16 Spec Inference as parallel stack → retired; spec logic lives inside Policy Gate only |
| **Agent Builder** | KEEP (assisted-only) | Governance Layer supervision under GEF | Governance Layer (GEF) | P6 gate: autonomous mode requires policy gate + confidence check + escalation path | R16 autonomous Builder proposals → blocked pending P6 satisfaction |
| **Eval Loop** | KEEP | `CVF_LEARNING_PLANE_FOUNDATION` (LPF) | Learning Plane (LPF) | LPF `evaluation.engine.contract.ts` + `evaluation.threshold.contract.ts` | R16 Eval Loop outside LPF → retired; real-time eval stays in LPF only |
| **Memory Loop** | KEEP (gated) | LPF — deferred activation | Learning Plane (LPF) | LPF `learning.loop.contract.ts`; P5 gate: requires real trace + decision logs | R15 Memory Loop without real traces → blocked; synthetic/fake learning path explicitly prohibited |

---

## 3. Boundary Statements

### Planner/Runtime Boundary (P4)

```
Planner     → Control Plane (CPF)  — DESIGN phase only
Runtime     → Execution Plane (EPF) — BUILD phase only
```

No plan execution may cross this boundary without an explicit CPF → EPF handoff contract. Existing CPF-to-EPF handoff is through `ControlPlaneConsumerPipelineContract → ExecutionPipelineContract`.

### Eval/Memory Boundary

```
Eval Loop   → LPF, real-time signal evaluation, no deferred state
Memory Loop → LPF, deferred, requires: real Decision logs + real Trace outputs
```

Memory Loop activation is explicitly blocked until P5 is satisfied. Eval Loop is live but restricted to LPF contracts.

### Skill/Registry Boundary

```
Skill Model    → GEF governance artifact (.skill.md), owned by Governance Layer
Skill Registry → single GEF registry, no parallel distribution lines
Agent Builder  → GEF supervision, assisted-by-default, autonomous mode gated by P6
```

---

## 4. Retired Concepts Summary

| Retired Line | Source Review | Why Retired |
|---|---|---|
| R14 alternate Skill Model | Review 14 | Duplicates existing `.skill.md` governance schema |
| R15 parallel runtime stack | Review 15 | Duplicates EPF; creates unsafe parallel enforcement |
| R15 Planner-as-runtime | Review 15 | Violates DESIGN/BUILD boundary (P4) |
| R15 Memory Loop (synthetic) | Review 15 | Prohibited: fake learning path; P5 not yet satisfied |
| R16 distributed Skill Registry | Review 16 | Duplicates GEF registry; creates distribution inconsistency |
| R16 Spec Inference as parallel stack | Review 16 | Must live inside existing Policy Gate, not alongside it |
| R16 autonomous Agent Builder | Review 16 | P6 gate not satisfied; autonomy lock in force |

---

## 5. P1 Gate Satisfaction

Gate P1 (Canonical ownership map approved — single source of truth per concept) is **SATISFIED** by this document.

All 10 concepts listed in Section 2 have:
- exactly one KEEP canonical source
- exactly one owning plane/layer
- exactly one governing control point
- explicit retire decisions for all duplicate lines

No concept has more than one canonical source after this map.
