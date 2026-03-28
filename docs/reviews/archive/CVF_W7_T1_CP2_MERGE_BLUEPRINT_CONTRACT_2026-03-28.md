---
tranche: W7-T1
checkpoint: CP2
title: Merge Blueprint Contract — W7 Integration Dependency Chain
date: 2026-03-28
status: DELIVERED
gate: P2-precursor, P3-precursor, P5
---

# W7-T1 / CP2 — Merge Blueprint Contract

Memory class: FULL_RECORD

> Lane: Fast Lane (GC-021) — additive governance document within W7-T1 authorized scope

---

## 1. Implementation Order (Fixed)

```
W7-T4 (Runtime)
  → W7-T4 (Artifact)
    → W7-T4 (Trace)
      → W7-T7 (Planner)
        → W7-T7 (Decision Engine)
          → W7-T8 (Eval/Builder)
            → W7-T9 (Memory Loop)
```

This ordering is **non-negotiable**. Each step must be verified stable before the next begins.

---

## 2. Tranche Dependency Map

| Tranche | Scope | Prerequisite Tranches | Blocking Condition |
|---|---|---|---|
| W7-T2 | Unified risk contract (R0-R3) | W7-T1 | P1 satisfied (this document) |
| W7-T3 | Guard binding + architecture boundary lock | W7-T1, W7-T2 | P3 satisfied |
| W7-T4 | Review 14 core: Skill Formation | W7-T1, W7-T2, W7-T3 | P1, P2, P3 all satisfied |
| W7-T5 | Review 16 isolated: Spec Inference + Spec Policy | W7-T1, W7-T2, W7-T3 | P2, P3, P6, P8 satisfied |
| W7-T6 | Review 15 phase 1: Runtime + Artifact + Trace | W7-T1, W7-T2, W7-T3 | P2, P3, P4, P5 satisfied |
| W7-T7 | Review 15 phase 2: Planner + Decision Engine | W7-T6 | W7-T6 closed (Trace stable) |
| W7-T8 | Review 16 remaining: Builder + Eval Loop + Registry | W7-T4, W7-T7 | P1, P2, P3, P6 satisfied |
| W7-T9 | Memory Loop activation | W7-T7 | P5: real Decision logs + real Trace outputs exist |
| W7-T10 | Wave closure + tracker sync | All prior | All W7-T1..W7-T9 closed |

---

## 3. Blocking Conditions Per Transition

### Runtime → Artifact
- EPF `execution.streaming.contract.ts` stable
- No parallel runtime stack active

### Artifact → Trace
- Artifact tracking schema agreed (outputs routed through EPF `execution.audit.summary.contract.ts`)
- No trace writes bypass EPF audit path

### Trace → Planner
- Trace is real (not synthetic) — verified by LPF `learning.observability.contract.ts` signal
- Planner placed in CPF DESIGN phase only

### Planner → Decision Engine
- Planner contracts finalized in CPF
- Decision Engine carries R0-R3 risk fields (P3 satisfied via W7-T2)
- Guard binding matrix complete (P2 satisfied via W7-T3)

### Decision Engine → Eval/Builder
- Decision logs are real and persisted through EPF audit path
- Agent Builder confirmed assisted-by-default; P6 gate status checked

### Eval/Builder → Memory Loop
- Real Trace AND real Decision logs available (P5)
- No synthetic learning path active
- LPF `learning.loop.contract.ts` activation gated explicitly

---

## 4. Mandatory Evidence Hooks

Per each transition, the following evidence must be present before marking transition COMPLETE:

| Transition | Required Evidence |
|---|---|
| W7-T2 start | P1 this document (satisfied) |
| W7-T3 start | P3 unified risk contract artifact |
| W7-T4 start | P2 guard binding matrix + P1 + P3 |
| W7-T6 start | P4 architecture boundary lock statement |
| W7-T7 start | W7-T6 closure review, Trace confirmed real |
| W7-T9 start | Decision log persistence verification, P5 evidence |

---

## 5. P2/P3 Readiness Hooks

This blueprint creates the prerequisites that W7-T2 and W7-T3 must satisfy:

- **P3 (Unified risk contract)**: W7-T2 must produce R0-R3 risk field definitions for Skill, Capability, PlannedAction, StructuredSpec. Evidence: updated contracts with risk fields + guard enforcement tests.
- **P2 (Guard binding matrix)**: W7-T3 must produce a complete matrix: 8 shared guards + 15 runtime preset mappings. Evidence: guard matrix document + architecture boundary lock statement.

W7-T4+ tranches are **hard-blocked** until both P2 and P3 are documented and reviewed.
