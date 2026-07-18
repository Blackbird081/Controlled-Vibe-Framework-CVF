# CVF LHW7-T1 Workflow Recovery → Tool Bridge Re-Entry Connector Spec

Memory class: FULL_RECORD

docType: reference

Contract version: `cvf.workflowRecoveryToolReEntry.lhw7.t1.v1`

Date: 2026-05-28

Status: CLOSED_PASS_BOUNDED

---

## Purpose

Connector spec binding WR1 `WorkflowRecoveryAction` + `lastRestorableCheckpoint`
→ LHW6-T1 `bridgeAdvisoryType` → TA1 `ToolActionApprovalState` into an
Orchestrator-readable re-entry advisory packet. Answers whether prior tool
approval survives a workflow restart.

## Scope / Applies To

Applies to: Orchestrator agents handling WR1 recovery readouts where the
restarted step contains a tool call. Documentation-only; no runtime enforcement.

---

## S1 — Purpose and Claim Boundary

This connector is a normative documentation standard binding WR1
`WorkflowRecoveryAction` + WR1 `lastRestorableCheckpoint` → LHW6-T1
`bridgeAdvisoryType` → TA1 `ToolActionApprovalState` into a single
Orchestrator-readable re-entry advisory packet.

### Problem it solves

When WR1 determines that a workflow step must be restarted via
`resume_from_checkpoint`, the step may contain a tool call that was previously
approved via TA1. Neither WR1, LHW6-T1, nor TA1 individually answers:

> "Is the prior approval still valid after a restart, or must re-approval
> be obtained before tool dispatch?"

This connector answers that question without executing anything.

### What this connector is not

- Not a WR1, TA1, or LHW6-T1 runtime extension.
- Not a tool re-executor or workflow re-executor.
- Not a memory reinjection path.

Explicit invariants:

- "This connector does not re-execute tool calls."
- "The re-entry packet is a non-blocking governance planning record."
- "Prior `approvalState` does not automatically survive a workflow restart."
- `runtimeExecutionAuthorized=false` is invariant throughout.

T1 gate confirmed: `docs/reviews/CVF_LHW7_T1_FAST_LANE_AUDIT_2026-05-28.md`
— Status: FAST_LANE_READY.

---

## S2 — Re-Entry Advisory Mapping

Input tuple: WR1 `recoveryAction` × LHW6-T1 `bridgeAdvisoryType` × TA1
`approvalState` → `reEntryAdvisoryType` + `approvalReuseAdvisory` +
first-run guidance.

All input tokens are used verbatim from their source surfaces.

| `recoveryAction` | `bridgeAdvisoryType` | `approvalState` | `reEntryAdvisoryType` | `approvalReuseAdvisory` | First-run guidance |
| --- | --- | --- | --- | --- | --- |
| `resume_from_checkpoint` | `advisory_allowed` | `not_required` | `safe_reentry` | `no_reapproval_needed` | Step is safe to restart. Tool surface is read-only. No re-approval required. |
| `resume_from_checkpoint` | `hold_for_approval` | `pending_approval` | `reapproval_required` | `prior_approval_invalidated_by_restart` | Tool approval was pending. Restart invalidates prior approval request. Obtain fresh approval before dispatch. |
| `resume_from_checkpoint` | `hold_for_approval` | `satisfied_but_not_executable` | `reapproval_required` | `satisfied_state_does_not_survive_restart` | Prior approval was satisfied but not yet executed. Satisfied state does not survive restart. Re-obtain approval. |
| `resume_from_checkpoint` | `hold_for_approval` | `incomplete_approval` | `reapproval_required` | `prior_approval_invalidated_by_restart` | Incomplete approval does not survive restart. Restart from approval-request stage. |
| `resume_from_checkpoint` | `blocked` | `blocked_by_policy` | `blocked_no_reentry` | `policy_block_survives_restart` | Policy block is structural and not cleared by restart. Escalate before any re-entry. |
| `resume_from_checkpoint` | `blocked` | `blocked_before_approval` | `blocked_no_reentry` | `policy_block_survives_restart` | Blocked before approval. Restart does not unblock. Governance review required. |
| `hold_for_reviewer_gate` | any | any | `blocked_pending_reviewer` | `approval_suspended_while_gate_held` | Recovery action requires reviewer gate. All tool approvals suspended until gate clears. |
| `escalate_to_governance` | any | any | `escalated_no_reentry` | `approval_moot_escalation_required` | Recovery escalated to governance. Tool re-entry is not permitted until escalation resolves. |
| `request_human_review` | `hold_for_approval` | any | `blocked_pending_human_review` | `approval_deferred_to_human` | Human review required before any re-entry. Do not dispatch tool call. |
| `request_human_review` | `advisory_allowed` | `not_required` | `safe_reentry_after_human_review` | `human_review_required_first` | Tool is read-only but recovery action requires human review. Safe to re-enter after review completes. |

Use tokens verbatim. Do not substitute synonyms for `recoveryAction`,
`bridgeAdvisoryType`, or `approvalState` values.

---

## S3 — Re-Entry Packet Minimum Fields

Every Workflow Recovery → Tool Bridge Re-Entry advisory packet must contain
the following fields. All fields are doc-only. `runtimeExecutionAuthorized=false`
is invariant. The packet does not extend `GovernanceEvidenceReceipt` or any
existing receipt envelope type.

- `reEntryPacketId`: unique token for this re-entry record (doc-only)
- `recoveredStepId`: from WR1 `lastRestorableCheckpoint.stepId` (or `null` if
  no checkpoint)
- `recoveryAction`: from WR1 `WorkflowRecoveryAction`
  — values: `resume_from_checkpoint`, `hold_for_reviewer_gate`,
    `escalate_to_governance`, `request_human_review`
- `bridgeAdvisoryType`: from LHW6-T1
  — values: `advisory_allowed`, `hold_for_approval`, `blocked`
- `approvalState`: from TA1 `ToolActionApprovalState`
  — values: `not_required`, `pending_approval`, `satisfied_but_not_executable`,
    `blocked_before_approval`, `blocked_by_policy`, `incomplete_approval`
- `reEntryAdvisoryType`: derived from S2 mapping (new doc-only field)
  — values: `safe_reentry`, `reapproval_required`, `blocked_no_reentry`,
    `blocked_pending_reviewer`, `escalated_no_reentry`,
    `blocked_pending_human_review`, `safe_reentry_after_human_review`
- `approvalReuseAdvisory`: derived from S2 mapping (new doc-only field)
  — values: `no_reapproval_needed`, `prior_approval_invalidated_by_restart`,
    `satisfied_state_does_not_survive_restart`, `policy_block_survives_restart`,
    `approval_suspended_while_gate_held`, `approval_moot_escalation_required`,
    `approval_deferred_to_human`, `human_review_required_first`
- `runtimeExecutionAuthorized`: always `false`
- `safeMessage`: plain-language guidance from S2 first-run guidance column

---

## S4 — Boundary Table

| Surface | Doc-only | Runtime-proven (source) |
| --- | --- | --- |
| `WorkflowRecoveryAction` type and values | — | Yes — `workflow-resolver.ts` lines 50–54 |
| `WorkflowRecoveryReadout.lastRestorableCheckpoint` | — | Yes — `workflow-resolver.ts` line 89 |
| `WorkflowRecoveryReadout.recoveryAction` | — | Yes — `workflow-resolver.ts` line 92 |
| `ToolActionApprovalState` type and values | — | Yes — `tool-action-taxonomy.ts` lines 64–70 |
| `bridgeAdvisoryType` and its three values | — | Yes — LHW6-T1 spec S4, line 80 |
| `reEntryAdvisoryType` field and values | New doc-only field | — |
| `approvalReuseAdvisory` field and values | New doc-only field | — |
| Re-entry packet as a whole | Doc-only planning record | — |
| Re-entry execution / tool dispatch | Not authorized | Not authorized |
| Memory reinjection | Not authorized | Not authorized |
| Provider behavior | Not changed | N/A |

---

## S5 — Source Verification Table

| Token | Source file | Line/section | Interface/type | Location in connector | Decision |
| --- | --- | --- | --- | --- | --- |
| `WorkflowRecoveryAction` type | `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/lib/workflows/workflow-resolver.ts` | line 50 | `WorkflowRecoveryAction` | S2/S3 `recoveryAction` | ACCEPT |
| `resume_from_checkpoint` | same | line 51 | `WorkflowRecoveryAction` value | S2 mapping | ACCEPT |
| `hold_for_reviewer_gate` | same | line 52 | `WorkflowRecoveryAction` value | S2 mapping | ACCEPT |
| `escalate_to_governance` | same | line 53 | `WorkflowRecoveryAction` value | S2 mapping | ACCEPT |
| `request_human_review` | same | line 54 | `WorkflowRecoveryAction` value | S2 mapping | ACCEPT |
| `lastRestorableCheckpoint` field | same | line 89 | `WorkflowRecoveryReadout` | S3 `recoveredStepId` source | ACCEPT |
| `validationGate` field | same | line 91 | `WorkflowRecoveryReadout` | S2 context | ACCEPT |
| `recoveryAction` field | same | line 92 | `WorkflowRecoveryReadout` | S3 packet field | ACCEPT |
| `ToolActionApprovalState` type | `governance/contracts/tool-action-taxonomy.ts` | lines 64–70 | `ToolActionApprovalState` | S2/S3 `approvalState` | ACCEPT |
| `not_required` | same | line 65 | `ToolActionApprovalState` value | S2 mapping | ACCEPT |
| `pending_approval` | same | line 66 | `ToolActionApprovalState` value | S2 mapping | ACCEPT |
| `satisfied_but_not_executable` | same | line 67 | `ToolActionApprovalState` value | S2 mapping | ACCEPT |
| `blocked_before_approval` | same | line 68 | `ToolActionApprovalState` value | S2 mapping | ACCEPT |
| `blocked_by_policy` | same | line 69 | `ToolActionApprovalState` value | S2 mapping | ACCEPT |
| `incomplete_approval` | same | line 70 | `ToolActionApprovalState` value | S2 mapping | ACCEPT |
| `bridgeAdvisoryType` token | `docs/reference/CVF_LHW6_TOOL_RUNTIME_BRIDGE_ADVISORY_CONNECTOR_SPEC_2026-05-28.md` | S4 field list line 80 | LHW6-T1 advisory packet | S2/S3 `bridgeAdvisoryType` | ACCEPT |
| `advisory_allowed` value | same | S4 field list line 80 | `bridgeAdvisoryType` enum value | S2 mapping | ACCEPT |
| `hold_for_approval` value | same | S4 field list line 80 | `bridgeAdvisoryType` enum value | S2 mapping | ACCEPT |
| `blocked` value | same | S4 field list line 80 | `bridgeAdvisoryType` enum value | S2 mapping | ACCEPT |
| `reEntryAdvisoryType` | N/A — new doc-only field | S3 new doc-only fields | doc-only; no runtime source | S2/S3 derived field | ACCEPT |
| `approvalReuseAdvisory` | N/A — new doc-only field | S3 new doc-only fields | doc-only; no runtime source | S2/S3 derived field | ACCEPT |

## Claim Boundary

This connector normalizes the handoff between three existing proven surfaces.
It does not claim tool re-execution, workflow re-execution, memory reinjection,
CLI execution, MCP bridging, approval automation, receipt-envelope extension,
provider behavior change, public-sync work, hosted readiness, production
readiness, or public release readiness.
