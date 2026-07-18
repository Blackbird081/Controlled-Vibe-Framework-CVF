# CVF LHW10-T1 Workflow Transition Enforcement Advisory Connector Spec

Memory class: FULL_RECORD

Status: ACTIVE

docType: connector_spec

Date: 2026-05-28

Contract version: `cvf.workflowTransitionEnforcementAdvisory.lhw10.t1.v1`

---

## Purpose

This connector binds W1 `WorkflowStateMachineProjection.finalState` + WR1
`WorkflowRequestedTransitionDisposition` (4 values) + WR1 `WorkflowRecoveryAction`
(4 values) + LHW7-T1 `reEntryAdvisoryType` (5 values) into a transition
enforcement advisory packet for Orchestrator-readable workflow transition control.

## Scope / Applies-To

Applies to: CVF workflow transition enforcement advisory surface.

Target: documentation-only connector spec binding W1, WR1, and LHW7-T1 surfaces.

Owner: CVF session-continuity and roadmap steering surface.

## S1 — Purpose and Claim Boundary

### Purpose

This connector binds W1 `WorkflowStateMachineProjection.finalState` + WR1
`WorkflowRequestedTransitionDisposition` (4 values) + WR1 `WorkflowRecoveryAction`
(4 values) + LHW7-T1 `reEntryAdvisoryType` (5 values) into a transition
enforcement advisory packet.

The connector maps transition disposition × recovery action → a named
`transitionEnforcementAdvisoryType` + `invalidTransitionDisposition` +
`enforcementRecommendation` + `reEntryGuidance`.

This closes the gap where no standard maps transition disposition × recovery
action → a named enforcement advisory type for Orchestrator-readable workflow
transition control.

### Claim Boundary

This connector is a documentation-only normalization artifact. It does not
execute workflow transitions, modify workflow state, or enforce transitions at
runtime.

`runtimeExecutionAuthorized=false`

The connector produces a planning packet for Orchestrator review. It does not
claim:

- Workflow transition execution
- Workflow state mutation
- Route-level invalid-transition blocking
- Memory reinjection
- Receipt envelope extension
- Provider behavior change
- Public-sync update
- Hosted readiness
- Production readiness
- Public release readiness

Prior `reEntryAdvisoryType` does not override `escalate_to_governance`. When
`recoveryAction=escalate_to_governance`, the enforcement advisory type is
`escalated_blocked` regardless of prior re-entry guidance.

## S2 — Transition Disposition × Recovery Action → Enforcement Advisory Mapping

Input tuple: WR1 `WorkflowRequestedTransitionDisposition` × WR1
`WorkflowRecoveryAction` × LHW7-T1 `reEntryAdvisoryType` →
`transitionEnforcementAdvisoryType` + `invalidTransitionDisposition` +
`enforcementRecommendation` + `reEntryGuidance`.

All input tokens are used verbatim from their source surfaces.

| `disposition` | `recoveryAction` | Prior `reEntryAdvisoryType` | `transitionEnforcementAdvisoryType` | `invalidTransitionDisposition` | `enforcementRecommendation` | `reEntryGuidance` |
| --- | --- | --- | --- | --- | --- | --- |
| `valid_from_current_state` | `resume_from_checkpoint` | `safe_reentry` | `safe_transition_resume` | `none` | Allow transition. Resume from last checkpoint. | Safe re-entry confirmed. No re-approval required. |
| `valid_from_current_state` | `resume_from_checkpoint` | `reapproval_required` | `transition_resume_with_reapproval` | `none` | Allow transition after re-approval. Resume from last checkpoint. | Re-approval required before re-entry. |
| `valid_from_current_state` | `resume_from_checkpoint` | `blocked_no_reentry` | `transition_resume_blocked` | `none` | Block transition. Re-entry blocked by prior tool bridge advisory. | Re-entry blocked. Escalate to governance. |
| `valid_from_current_state` | `resume_from_checkpoint` | `blocked_pending_reviewer` | `transition_resume_hold_reviewer` | `none` | Hold transition. Pending reviewer gate. | Re-entry pending reviewer gate. |
| `valid_from_current_state` | `resume_from_checkpoint` | `escalated_no_reentry` | `escalated_blocked` | `none` | Block transition. Escalated to governance. | Re-entry escalated. No re-entry allowed. |
| `valid_from_current_state` | `hold_for_reviewer_gate` | any | `hold_for_reviewer` | `none` | Hold transition. Pending reviewer gate. | Reviewer gate required before transition. |
| `valid_from_current_state` | `escalate_to_governance` | any | `escalated_blocked` | `none` | Block transition. Escalate to governance. | Governance escalation required. No transition allowed. |
| `valid_from_current_state` | `request_human_review` | any | `human_review_required` | `none` | Hold transition. Request human review. | Human review required before transition. |
| `invalid_from_current_state` | `resume_from_checkpoint` | any | `invalid_transition_blocked` | `invalid_from_current_state` | Block transition. Invalid from current state. | Transition invalid from current state. Resume not allowed. |
| `invalid_from_current_state` | `hold_for_reviewer_gate` | any | `invalid_transition_hold_reviewer` | `invalid_from_current_state` | Block transition. Hold for reviewer gate. | Invalid transition. Reviewer gate required. |
| `invalid_from_current_state` | `escalate_to_governance` | any | `escalated_blocked` | `invalid_from_current_state` | Block transition. Escalate to governance. | Invalid transition escalated. No transition allowed. |
| `invalid_from_current_state` | `request_human_review` | any | `invalid_transition_human_review` | `invalid_from_current_state` | Block transition. Request human review. | Invalid transition. Human review required. |
| `configured_deferred_gate` | `resume_from_checkpoint` | any | `deferred_gate_resume_blocked` | `configured_deferred_gate` | Block transition. Configured deferred gate active. | Deferred gate active. Resume not allowed until gate cleared. |
| `configured_deferred_gate` | `hold_for_reviewer_gate` | any | `deferred_gate_hold_reviewer` | `configured_deferred_gate` | Hold transition. Deferred gate + reviewer gate. | Deferred gate active. Reviewer gate required. |
| `configured_deferred_gate` | `escalate_to_governance` | any | `escalated_blocked` | `configured_deferred_gate` | Block transition. Escalate to governance. | Deferred gate escalated. No transition allowed. |
| `configured_deferred_gate` | `request_human_review` | any | `deferred_gate_human_review` | `configured_deferred_gate` | Hold transition. Deferred gate + human review. | Deferred gate active. Human review required. |
| `no_requested_transition` | `resume_from_checkpoint` | any | `no_transition_resume_allowed` | `none` | Allow resume. No transition requested. | No transition requested. Resume from checkpoint allowed. |
| `no_requested_transition` | `hold_for_reviewer_gate` | any | `no_transition_hold_reviewer` | `none` | Hold for reviewer gate. No transition requested. | No transition requested. Reviewer gate required. |
| `no_requested_transition` | `escalate_to_governance` | any | `escalated_blocked` | `none` | Block. Escalate to governance. | No transition requested. Governance escalation required. |
| `no_requested_transition` | `request_human_review` | any | `no_transition_human_review` | `none` | Hold for human review. No transition requested. | No transition requested. Human review required. |

### Mapping Notes

- When `recoveryAction=escalate_to_governance`, the enforcement advisory type is
  always `escalated_blocked` regardless of disposition or prior re-entry
  guidance.
- When `disposition=valid_from_current_state` and
  `recoveryAction=resume_from_checkpoint`, the enforcement advisory type depends
  on prior `reEntryAdvisoryType`.
- When `disposition=invalid_from_current_state` or
  `disposition=configured_deferred_gate`, the `invalidTransitionDisposition`
  field is set to the disposition value; otherwise it is `none`.
- When `disposition=no_requested_transition`, the enforcement advisory allows
  resume but may still require reviewer gate or human review depending on
  `recoveryAction`.

## S3 — Minimum Fields

A transition enforcement advisory packet must include:

- `contractVersion`: `cvf.workflowTransitionEnforcementAdvisory.lhw10.t1.v1`
- `workflowId`: from W1 `WorkflowStateMachineProjection.workflowId`
- `currentState`: from WR1 `WorkflowRecoveryReadout.currentState`
- `requestedTransitionDisposition`: from WR1
  `WorkflowRequestedTransitionReadout.disposition` (4 values:
  `valid_from_current_state`, `invalid_from_current_state`,
  `configured_deferred_gate`, `no_requested_transition`)
- `recoveryAction`: from WR1 `WorkflowRecoveryReadout.recoveryAction` (4 values:
  `resume_from_checkpoint`, `hold_for_reviewer_gate`, `escalate_to_governance`,
  `request_human_review`)
- `priorReEntryAdvisoryType`: from LHW7-T1 (5 values: `safe_reentry`,
  `reapproval_required`, `blocked_no_reentry`, `blocked_pending_reviewer`,
  `escalated_no_reentry`); may be `null` if no prior re-entry advisory exists
- `transitionEnforcementAdvisoryType`: derived from S2 mapping (new doc-only
  field)
- `invalidTransitionDisposition`: `none` when disposition is
  `valid_from_current_state` or `no_requested_transition`; otherwise set to the
  disposition value
- `enforcementRecommendation`: human-readable recommendation from S2 mapping
- `reEntryGuidance`: human-readable re-entry guidance from S2 mapping
- `runtimeExecutionAuthorized`: `false` (literal invariant)
- `boundaries`: array of explicit boundary statements

Example packet:

```json
{
  "contractVersion": "cvf.workflowTransitionEnforcementAdvisory.lhw10.t1.v1",
  "workflowId": "workflow.product.create_product_brief.v1",
  "currentState": "review_pending",
  "requestedTransitionDisposition": "valid_from_current_state",
  "recoveryAction": "resume_from_checkpoint",
  "priorReEntryAdvisoryType": "safe_reentry",
  "transitionEnforcementAdvisoryType": "safe_transition_resume",
  "invalidTransitionDisposition": "none",
  "enforcementRecommendation": "Allow transition. Resume from last checkpoint.",
  "reEntryGuidance": "Safe re-entry confirmed. No re-approval required.",
  "runtimeExecutionAuthorized": false,
  "boundaries": [
    "This connector does not execute workflow transitions or modify workflow state.",
    "This connector does not enforce transitions at runtime.",
    "This connector produces a planning packet for Orchestrator review only."
  ]
}
```

## S4 — Boundary Table

| Boundary | Rationale | Enforcement |
| --- | --- | --- |
| No workflow transition execution | This is a documentation-only connector | No `.ts`/`.tsx`/`.js`/`.py` file in diff |
| No workflow state mutation | This is a documentation-only connector | No `EXTENSIONS/` file in diff |
| No route-level invalid-transition blocking | This is a documentation-only connector | No `/api/execute` route change |
| No memory reinjection | This is a documentation-only connector | No memory adapter change |
| No receipt envelope extension | This is a documentation-only connector | No receipt schema change |
| No provider behavior change | This is a documentation-only connector | No provider adapter change |
| No public-sync update | This is a documentation-only connector | No public-sync repo push |
| No hosted readiness | This is a documentation-only connector | No hosted deployment |
| No production readiness | This is a documentation-only connector | No production deployment |
| No public release readiness | This is a documentation-only connector | No public release claim |
| `runtimeExecutionAuthorized=false` | Literal invariant | S3 example packet |
| Prior `reEntryAdvisoryType` does not override `escalate_to_governance` | Governance escalation takes precedence | S2 mapping rows |

## S5 — Source Verification Table

| Claimed item | Source file | Verified line/section | Verified path or symbol | Owning interface/function/schema | Disposition |
| --- | --- | --- | --- | --- | --- |
| `WorkflowStateMachineProjection` interface | `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/lib/workflows/workflow-resolver.ts` | line 39 | `export interface WorkflowStateMachineProjection` | `WorkflowStateMachineProjection` | ACCEPT |
| `WorkflowStateMachineProjection.finalState` | `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/lib/workflows/workflow-resolver.ts` | line 201 | `finalState: currentState` | `WorkflowStateMachineProjection` | ACCEPT |
| `WorkflowStateMachineProjection.workflowId` | `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/lib/workflows/workflow-resolver.ts` | line 40 | `readonly workflowId: string` | `WorkflowStateMachineProjection` | ACCEPT |
| `WorkflowRecoveryReadout` interface | `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/lib/workflows/workflow-resolver.ts` | line 85 | `export interface WorkflowRecoveryReadout` | `WorkflowRecoveryReadout` | ACCEPT |
| `WorkflowRecoveryReadout.currentState` | `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/lib/workflows/workflow-resolver.ts` | line 88 | `readonly currentState: string` | `WorkflowRecoveryReadout` | ACCEPT |
| `WorkflowRecoveryReadout.recoveryAction` | `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/lib/workflows/workflow-resolver.ts` | line 92 | `readonly recoveryAction: WorkflowRecoveryAction` | `WorkflowRecoveryReadout` | ACCEPT |
| `WorkflowRequestedTransitionReadout` interface | `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/lib/workflows/workflow-resolver.ts` | line 74 | `export interface WorkflowRequestedTransitionReadout` | `WorkflowRequestedTransitionReadout` | ACCEPT |
| `WorkflowRequestedTransitionReadout.disposition` | `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/lib/workflows/workflow-resolver.ts` | line 80 | `readonly disposition: WorkflowRequestedTransitionDisposition` | `WorkflowRequestedTransitionReadout` | ACCEPT |
| `WorkflowRecoveryAction` type | `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/lib/workflows/workflow-resolver.ts` | lines 50-54 | `export type WorkflowRecoveryAction` | `WorkflowRecoveryAction` | ACCEPT |
| `resume_from_checkpoint` value | `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/lib/workflows/workflow-resolver.ts` | line 51 | `WorkflowRecoveryAction` union type | `WorkflowRecoveryAction` | ACCEPT |
| `hold_for_reviewer_gate` value | `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/lib/workflows/workflow-resolver.ts` | line 52 | `WorkflowRecoveryAction` union type | `WorkflowRecoveryAction` | ACCEPT |
| `escalate_to_governance` value | `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/lib/workflows/workflow-resolver.ts` | line 53 | `WorkflowRecoveryAction` union type | `WorkflowRecoveryAction` | ACCEPT |
| `request_human_review` value | `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/lib/workflows/workflow-resolver.ts` | line 54 | `WorkflowRecoveryAction` union type | `WorkflowRecoveryAction` | ACCEPT |
| `WorkflowRequestedTransitionDisposition` type | `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/lib/workflows/workflow-resolver.ts` | lines 56-60 | `export type WorkflowRequestedTransitionDisposition` | `WorkflowRequestedTransitionDisposition` | ACCEPT |
| `valid_from_current_state` value | `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/lib/workflows/workflow-resolver.ts` | line 57 | `WorkflowRequestedTransitionDisposition` union type | `WorkflowRequestedTransitionDisposition` | ACCEPT |
| `invalid_from_current_state` value | `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/lib/workflows/workflow-resolver.ts` | line 58 | `WorkflowRequestedTransitionDisposition` union type | `WorkflowRequestedTransitionDisposition` | ACCEPT |
| `configured_deferred_gate` value | `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/lib/workflows/workflow-resolver.ts` | line 59 | `WorkflowRequestedTransitionDisposition` union type | `WorkflowRequestedTransitionDisposition` | ACCEPT |
| `no_requested_transition` value | `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/lib/workflows/workflow-resolver.ts` | line 60 | `WorkflowRequestedTransitionDisposition` union type | `WorkflowRequestedTransitionDisposition` | ACCEPT |
| `reEntryAdvisoryType` field | `docs/reference/CVF_LHW7_T1_WORKFLOW_RECOVERY_TOOL_REENTRY_CONNECTOR_SPEC_2026-05-28.md` | S3 lines 109-112 | doc-only field | LHW7-T1 connector | ACCEPT |
| `safe_reentry` value | `docs/reference/CVF_LHW7_T1_WORKFLOW_RECOVERY_TOOL_REENTRY_CONNECTOR_SPEC_2026-05-28.md` | S3 line 111 | `reEntryAdvisoryType` value | LHW7-T1 doc-only field | ACCEPT |
| `reapproval_required` value | `docs/reference/CVF_LHW7_T1_WORKFLOW_RECOVERY_TOOL_REENTRY_CONNECTOR_SPEC_2026-05-28.md` | S3 line 111 | `reEntryAdvisoryType` value | LHW7-T1 doc-only field | ACCEPT |
| `blocked_no_reentry` value | `docs/reference/CVF_LHW7_T1_WORKFLOW_RECOVERY_TOOL_REENTRY_CONNECTOR_SPEC_2026-05-28.md` | S3 line 111 | `reEntryAdvisoryType` value | LHW7-T1 doc-only field | ACCEPT |
| `blocked_pending_reviewer` value | `docs/reference/CVF_LHW7_T1_WORKFLOW_RECOVERY_TOOL_REENTRY_CONNECTOR_SPEC_2026-05-28.md` | S3 line 112 | `reEntryAdvisoryType` value | LHW7-T1 doc-only field | ACCEPT |
| `escalated_no_reentry` value | `docs/reference/CVF_LHW7_T1_WORKFLOW_RECOVERY_TOOL_REENTRY_CONNECTOR_SPEC_2026-05-28.md` | S3 line 112 | `reEntryAdvisoryType` value | LHW7-T1 doc-only field | ACCEPT |
| `transitionEnforcementAdvisoryType` field | N/A — new doc-only field | S3 new fields | doc-only | Transition enforcement advisory packet | ACCEPT |
| `invalidTransitionDisposition` field | N/A — new doc-only field | S3 new fields | doc-only | Transition enforcement advisory packet | ACCEPT |
| `enforcementRecommendation` field | N/A — new doc-only field | S3 new fields | doc-only | Transition enforcement advisory packet | ACCEPT |
| `reEntryGuidance` field | N/A — new doc-only field | S3 new fields | doc-only | Transition enforcement advisory packet | ACCEPT |
| `runtimeExecutionAuthorized=false` invariant | N/A — literal invariant | S3 example packet | literal false | Transition enforcement advisory packet | ACCEPT |

---

## Claim Boundary

This connector is a documentation-only normalization artifact. It does not
execute workflow transitions, modify workflow state, enforce transitions at
runtime, inject memory, extend receipt envelopes, change provider behavior,
update public-sync, or claim hosted/production/public release readiness.

`runtimeExecutionAuthorized=false`
