---
tranche: W7-T7
checkpoint: CP1
title: Planner Integration Contract
date: 2026-03-28
status: DELIVERED
---

# W7-T7 / CP1 — Planner Integration Contract

Memory class: FULL_RECORD

> Lane: Full Lane (GC-019)
> Phase: CPF DESIGN (per P4 boundary lock)
> Authorization: `docs/reviews/CVF_GC018_CONTINUATION_CANDIDATE_W7_T7_PLANNER_DECISION_ENGINE_2026-03-28.md`

---

## 1. W7PlannerRecord Schema

```
W7PlannerRecord {
  id: string                          // deterministic hash from (traceRef + plannedAt + plannerId)
  phase: 'DESIGN'                     // hard-locked — Planner operates in CPF DESIGN phase only
  traceRef: string                    // parent W7TraceRecord ID (required — G7 blocking condition)
  plannerId: string                   // agent or process identifier
  plannedAt: string                   // ISO 8601
  riskLevel: W7RiskLevel              // R0 | R1 | R2 | R3
  guardPreset: PlannerGuardPreset     // P-08 | P-09 | P-10 | P-11 (PlannedAction presets)
  plannedActions: W7PlannedAction[]   // ordered list of proposed actions
  outputPackageRef: string            // ControlPlaneConsumerPackage ID produced
  status: 'planning' | 'proposed' | 'forwarded' | 'rejected'
  policyGateRef?: string              // EPF policy gate receipt ref (required when riskLevel >= R2)
}

W7PlannedAction {
  actionId: string                    // deterministic hash from (plannerId + actionIndex + plannedAt)
  actionType: string                  // e.g. 'execute_skill', 'invoke_capability', 'generate_spec'
  riskLevel: W7RiskLevel             // per-action risk classification
  guardPreset: PlannerGuardPreset
  rationale: string                  // max 200 chars
  dependsOn: string[]                // actionIds this action depends on (within same plan)
}
```

---

## 2. Planner Input Protocol

The Planner activates ONLY after a `W7TraceRecord` exists for the target execution (G7 blocking condition). It reads the trace to build its plan — it does NOT read `W7RuntimeRecord` or `W7ArtifactRecord` directly.

```
Planner input path:
  W7TraceRecord (emitted by Runtime/Trace)
    → Planner reads events + artifactRef
    → Builds W7PlannerRecord with proposed actions
    → Outputs ControlPlaneConsumerPackage (CPF handoff)
```

The Planner has NO direct access to:
- Runtime internal state (G4 BOUNDARY_CROSSING_GUARD)
- Raw artifact content (reads via Trace reference only)
- Decision Engine state (G7 — Decision requires Planner output, not the reverse)

---

## 3. Planner Output — CPF Handoff

The Planner's canonical output is a `ControlPlaneConsumerPackage` deposited into CPF. This is the existing CVF handoff contract — no new interface needed.

```
W7PlannerRecord.outputPackageRef
  → ControlPlaneConsumerPackage (existing CPF contract)
    → consumed by Decision Engine (W7-T7/CP2)
    → enforced by G7: Decision cannot activate without this package present
```

`W7PlannerRecord.status` transitions to `forwarded` once the `ControlPlaneConsumerPackage` is confirmed in CPF.

---

## 4. Guard Binding

| Preset | Scenario | Guards |
|---|---|---|
| P-08 | PlannedAction R0 — DESIGN phase read | G3, G4, G7 |
| P-09 | PlannedAction R1 — proposal with advisory | G1, G3, G4, G7 |
| P-10 | PlannedAction R2 — policy gate required | G1, G2, G3, G4, G7 |
| P-11 | PlannedAction R3 — hard block + autonomy lock | G1, G2, G3, G4, G5, G7 |

All four presets include G4 (boundary enforcement) and G7 (dependency order enforcement) — mandatory for Planner.

---

## 5. Boundary Constraints

- `phase: 'DESIGN'` hard-locks Planner to CPF — no Planner activity in EPF BUILD or LPF LEARN
- Planner CANNOT write to W7RuntimeRecord, W7ArtifactRecord, or W7TraceRecord (G3 ownership)
- Planner CANNOT invoke skills or capabilities directly — only proposes actions via W7PlannedAction
- G7 enforces: no `ControlPlaneConsumerPackage` output without valid `W7TraceRecord` as input
