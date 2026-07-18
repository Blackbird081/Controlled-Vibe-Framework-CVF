# CVF LHW11-T2 Spec-Change Governance Decision Connector Spec

Memory class: FULL_RECORD

docType: connector_spec

Contract version: `cvf.specChangeGovernanceDecision.lhw11.t2.v1`

Date: 2026-05-28

Status: ACTIVE

---

## Purpose

This connector binds LHW7-T3 `faultToRespecAdvisoryType` (6 values) × LHW10-T1 `transitionEnforcementAdvisoryType` × LHW3-T3 `changePacketStatus` (3 values) into a spec-change governance decision packet for Orchestrator-readable spec-change control.

## Scope / Applies To

Applies to: CVF spec-change governance decision surface. Target: documentation-only connector spec. No runtime enforcement.

---

## S1 — Purpose and Claim Boundary

### Purpose

This connector binds LHW7-T3 `faultToRespecAdvisoryType` (6 values) × LHW10-T1 `transitionEnforcementAdvisoryType` × LHW3-T3 `changePacketStatus` (3 values) into a spec-change governance decision packet.

The connector maps input combinations → a named `specChangeGovernanceDecision` + `rollbackRecommended` boolean.

This closes the gap where no standard maps failure-triggered spec changes and transition posture into a named governance decision and rollback recommendation.

### Claim Boundary

This connector is a documentation-only normalization artifact. It does not execute spec changes, modify workflow state, or recommend runtime rollback actions.

`runtimeExecutionAuthorized=false`

The connector produces a planning packet for Orchestrator review. It does not claim:

- Spec-change execution or re-intake automation
- Workflow state mutation or rollback execution
- Memory reinjection or receipt envelope extension
- Provider behavior changes
- Hosted, production, or public release readiness

---

## S2 — Spec-Change Governance Decision Mapping

Input: LHW7-T3 `faultToRespecAdvisoryType` × LHW10-T1 `transitionEnforcementAdvisoryType` × LHW3-T3 `changePacketStatus` → `specChangeGovernanceDecision` + `rollbackRecommended`.

BLOCKED tier: transition enforcement advisory type is ∈ `{escalated_blocked, transition_resume_blocked, invalid_transition_blocked, deferred_gate_resume_blocked}`.

| `faultToRespecAdvisoryType` | transition posture | `changePacketStatus` | `specChangeGovernanceDecision` | `rollbackRecommended` |
| --- | --- | --- | --- | --- |
| `spec_exception_required` | BLOCKED tier | `pending_approval` | `spec_change_blocked_rollback_required` | true |
| `spec_route_constraint_update` | BLOCKED tier | `pending_approval` | `spec_change_blocked_rollback_required` | true |
| `spec_retry_boundary_update` | not BLOCKED | `pending_approval` | `spec_change_pending_approval` | false |
| `spec_fallback_model_update` | not BLOCKED | `pending_approval` | `spec_change_pending_approval` | false |
| `spec_success_criteria_tighten` | any | `pending_approval` | `spec_change_review_required` | false |
| `spec_human_gate_insertion` | any | `pending_approval` | `spec_change_human_gate_required` | false |
| any | any | `rejected` | `spec_change_rejected_revert` | true |
| any | not BLOCKED | `approved` | `spec_change_approved_proceed` | false |

---

## S3 — Spec-Change Governance Decision Packet Minimum Fields

A spec-change governance decision packet must include:

- `contractVersion`: `cvf.specChangeGovernanceDecision.lhw11.t2.v1`
- `faultToRespecAdvisoryType`: from LHW7-T3 (6 values)
- `transitionEnforcementAdvisoryType`: from LHW10-T1
- `changePacketStatus`: from LHW3-T3 (`pending_approval`, `approved`, `rejected`)
- `specChangeGovernanceDecision`: derived from S2 mapping (new doc-only field)
- `rollbackRecommended`: derived boolean (new doc-only field)
- `runtimeExecutionAuthorized`: `false` (literal invariant)
- `boundaries`: array of explicit boundary statements

Example packet:

```json
{
  "contractVersion": "cvf.specChangeGovernanceDecision.lhw11.t2.v1",
  "faultToRespecAdvisoryType": "spec_exception_required",
  "transitionEnforcementAdvisoryType": "escalated_blocked",
  "changePacketStatus": "pending_approval",
  "specChangeGovernanceDecision": "spec_change_blocked_rollback_required",
  "rollbackRecommended": true,
  "runtimeExecutionAuthorized": false,
  "boundaries": [
    "This connector does not execute spec changes or rollbacks.",
    "This connector is a documentation-only planning record."
  ]
}
```

---

## S4 — Boundary Table

| Boundary | Rationale | Enforcement |
| --- | --- | --- |
| No spec-change execution | This is a documentation-only connector | No `.ts`/`.tsx`/`.js`/`.py` file in diff |
| No workflow state mutation | This is a documentation-only connector | No `EXTENSIONS/` file in diff |
| `runtimeExecutionAuthorized=false` | Literal invariant | S3 example packet |

---

## S5 — Source Verification Table

| Claimed item | Source file | Verified line/section | Verified path or symbol | Owning interface/function/schema | Disposition |
| --- | --- | --- | --- | --- | --- |
| `faultToRespecAdvisoryType` field | `docs/reference/CVF_LHW7_T3_FAILURE_SIM_SPEC_CHANGE_REINTAKE_CONNECTOR_SPEC_2026-05-28.md` | S3 line 112 | `faultToRespecAdvisoryType` | LHW7-T3 doc-only field | ACCEPT |
| `spec_exception_required` value | `docs/reference/CVF_LHW7_T3_FAILURE_SIM_SPEC_CHANGE_REINTAKE_CONNECTOR_SPEC_2026-05-28.md` | S2 line 75 | `faultToRespecAdvisoryType` | LHW7-T3 S2 mapping | ACCEPT |
| `spec_retry_boundary_update` value | `docs/reference/CVF_LHW7_T3_FAILURE_SIM_SPEC_CHANGE_REINTAKE_CONNECTOR_SPEC_2026-05-28.md` | S2 line 76 | `faultToRespecAdvisoryType` | LHW7-T3 S2 mapping | ACCEPT |
| `spec_success_criteria_tighten` value | `docs/reference/CVF_LHW7_T3_FAILURE_SIM_SPEC_CHANGE_REINTAKE_CONNECTOR_SPEC_2026-05-28.md` | S2 lines 77-78 | `faultToRespecAdvisoryType` | LHW7-T3 S2 mapping | ACCEPT |
| `spec_human_gate_insertion` value | `docs/reference/CVF_LHW7_T3_FAILURE_SIM_SPEC_CHANGE_REINTAKE_CONNECTOR_SPEC_2026-05-28.md` | S2 line 79 | `faultToRespecAdvisoryType` | LHW7-T3 S2 mapping | ACCEPT |
| `spec_route_constraint_update` value | `docs/reference/CVF_LHW7_T3_FAILURE_SIM_SPEC_CHANGE_REINTAKE_CONNECTOR_SPEC_2026-05-28.md` | S2 line 80 | `faultToRespecAdvisoryType` | LHW7-T3 S2 mapping | ACCEPT |
| `spec_fallback_model_update` value | `docs/reference/CVF_LHW7_T3_FAILURE_SIM_SPEC_CHANGE_REINTAKE_CONNECTOR_SPEC_2026-05-28.md` | S2 line 81 | `faultToRespecAdvisoryType` | LHW7-T3 S2 mapping | ACCEPT |
| `transitionEnforcementAdvisoryType` field | `docs/reference/CVF_LHW10_T1_WORKFLOW_TRANSITION_ENFORCEMENT_ADVISORY_CONNECTOR_SPEC_2026-05-28.md` | S3 line 137 | `transitionEnforcementAdvisoryType` | LHW10-T1 doc-only field | ACCEPT |
| `escalated_blocked` value | `docs/reference/CVF_LHW10_T1_WORKFLOW_TRANSITION_ENFORCEMENT_ADVISORY_CONNECTOR_SPEC_2026-05-28.md` | S2 lines 88, 90, 94, 98, 102 | `transitionEnforcementAdvisoryType` | LHW10-T1 S2 mapping | ACCEPT |
| `pending_approval` value | `docs/reference/archive/CVF_LHW3_SPEC_CHANGE_WORKFLOW_PACKET_CONNECTOR_SPEC_2026-05-27.md` | S3 line 67 | `changePacketStatus` | LHW3-T3 doc-only field | ACCEPT |
| `approved` value | `docs/reference/archive/CVF_LHW3_SPEC_CHANGE_WORKFLOW_PACKET_CONNECTOR_SPEC_2026-05-27.md` | S3 line 67 | `changePacketStatus` | LHW3-T3 doc-only field | ACCEPT |
| `rejected` value | `docs/reference/archive/CVF_LHW3_SPEC_CHANGE_WORKFLOW_PACKET_CONNECTOR_SPEC_2026-05-27.md` | S3 line 67 | `changePacketStatus` | LHW3-T3 doc-only field | ACCEPT |
| `specChangeGovernanceDecision` field | N/A — new doc-only field | S3 new fields | `specChangeGovernanceDecision` | new doc-only field | ACCEPT |
| `rollbackRecommended` field | N/A — new doc-only field | S3 new fields | `rollbackRecommended` | new doc-only field | ACCEPT |

---

## Claim Boundary

This connector is a documentation-only normalization artifact. It does not execute spec changes, modify workflow state, or recommend runtime rollback actions.

`runtimeExecutionAuthorized=false`
