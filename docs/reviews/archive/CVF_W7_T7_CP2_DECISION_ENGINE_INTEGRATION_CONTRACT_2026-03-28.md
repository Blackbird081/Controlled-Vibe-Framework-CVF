---
tranche: W7-T7
checkpoint: CP2
title: Decision Engine Integration Contract
date: 2026-03-28
status: DELIVERED
---

# W7-T7 / CP2 — Decision Engine Integration Contract

Memory class: FULL_RECORD

> Lane: Full Lane (GC-019)
> Phase: CPF DESIGN (per P4 boundary lock — Decision Engine is the resolution step of the Planner phase)
> Authorization: `docs/reviews/CVF_GC018_CONTINUATION_CANDIDATE_W7_T7_PLANNER_DECISION_ENGINE_2026-03-28.md`

---

## 1. W7DecisionRecord Schema

```
W7DecisionRecord {
  id: string                          // deterministic hash from (plannerRef + decidedAt + decisionEngineId)
  phase: 'DESIGN'                     // hard-locked — Decision Engine operates in CPF DESIGN phase
  plannerRef: string                  // parent W7PlannerRecord ID (required — G7 blocking condition)
  packageRef: string                  // ControlPlaneConsumerPackage ID consumed from CPF
  decisionEngineId: string            // agent or process identifier
  decidedAt: string                   // ISO 8601
  riskLevel: W7RiskLevel              // must be >= the highest riskLevel in the consumed PlannedActions
  guardPreset: DecisionGuardPreset    // P-08 | P-09 | P-10 | P-11
  outcome: W7DecisionOutcome          // APPROVED | MODIFIED | REJECTED | ESCALATED
  approvedActions: string[]           // actionIds from W7PlannerRecord approved for execution
  modifiedActions: W7ActionModification[] // actions approved with modifications
  rejectedActions: string[]           // actionIds rejected with rationale
  rationale: string                   // max 400 chars
  status: 'deciding' | 'resolved' | 'escalated'
  escalationRef?: string              // GEF escalation record ref (required when outcome = ESCALATED)
  policyGateRef?: string              // EPF policy gate receipt (required when riskLevel >= R2)
}

W7ActionModification {
  actionId: string
  modification: string               // what was changed (max 200 chars)
  newRiskLevel?: W7RiskLevel         // if risk was reassessed
}
```

---

## 2. Decision Engine Input Protocol

The Decision Engine activates ONLY after a `W7PlannerRecord` with `status: forwarded` exists AND its `ControlPlaneConsumerPackage` is confirmed in CPF (G7 blocking condition).

```
Decision Engine input path:
  W7PlannerRecord (status: forwarded)
    + ControlPlaneConsumerPackage (from CPF)
    → Decision Engine resolves each W7PlannedAction
    → Produces W7DecisionRecord with outcome
    → W7DecisionRecord.status transitions to 'resolved'
```

---

## 3. Risk-Aware Decision Making

The Decision Engine MUST:

1. **Inherit minimum risk**: `W7DecisionRecord.riskLevel` = `max(riskLevel)` across all planned actions
2. **Apply guard presets per action**: each action resolved independently against its `guardPreset`
3. **Policy gate for R2+**: if any action is R2 or higher, EPF `policy.gate.contract.ts` is invoked before `outcome` is set
4. **Escalate for R3**: R3 actions MUST produce `outcome: ESCALATED` unless all 5 P6 autonomy preconditions pass; `escalationRef` required
5. **Never approve actions violating dependency order**: an action that would trigger a G7 violation must be `REJECTED`

---

## 4. Outcome Semantics

| Outcome | Meaning | Guard Behavior |
|---|---|---|
| APPROVED | All approved actions may proceed to execution | G7 releases downstream dependency lock |
| MODIFIED | Actions approved with changes; modified risk may change guard preset | G7 releases with modified scope |
| REJECTED | No actions forwarded; Planner must re-plan | G7 does NOT release; upstream trace remains available |
| ESCALATED | R3 action present; human checkpoint required | G5 locks execution; GEF watchdog active |

`status: resolved` is only set for APPROVED or MODIFIED outcomes. ESCALATED remains `status: escalated` until human checkpoint clears it.

---

## 5. Guard Binding

All guards from the Planner's P-08→P-11 presets carry forward to the Decision Engine. Additionally:

- G2 (POLICY_GATE_GUARD): activated when any action is R2+ — policy gate receipt required
- G5 (AUTONOMY_LOCK_GUARD): activated on any R3 action — hard block until P6 autonomy preconditions pass
- G7 (DEPENDENCY_ORDER_GUARD): Decision cannot produce `status: resolved` without valid `W7PlannerRecord` as input

---

## 6. CPF Integration

The Decision Engine's `W7DecisionRecord` with `status: resolved` and `outcome: APPROVED | MODIFIED` is the blocking condition for the Eval/Builder layer (W7-T8). This is enforced by G7 at the Decision→Eval/Builder transition in the dependency order protocol (W7-T6/CP1).

No new CPF interface needed — `W7DecisionRecord` is registered via the existing CPF ownership registry (G3).
