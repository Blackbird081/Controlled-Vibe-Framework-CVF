# CVF LHW14-T2 Spec-Change Workflow Advisory Connector Spec

Memory class: FULL_RECORD

Status: ACTIVE

Wave: LHW14 (T2 ACTIVE; T1 CLOSED_PASS_BOUNDED)

docType: connector_spec

Date: 2026-05-29

---

## Purpose

This connector defines a documentation-only advisory that helps Orchestrators
decide whether to pause and require spec review before acting on a spec-change
event. It normalizes the combined posture of LHW11-T2
`specChangeGovernanceDecision`, LHW11-T2 `rollbackRecommended`, and LHW7-T3
`faultToRespecAdvisoryType` into a named `specChangeWorkflowAdvisoryType` and
plain-language `workflowPauseAdvisory`.

## Scope / Applies To

Applies to LHW14-T2 spec-change workflow advisory. Target owner surface:
documentation-only connector specs and Orchestrator planning records. It does
not change runtime source, provider behavior, receipt envelopes, spec
enforcement, governance override, or workflow execution.

---

## S1 — Purpose and Gap Citation

Source gap: LH1 `OpenSpec` PARTIALLY_ABSORBED trigger (line 140) —
"Reopen only if spec-change workflow is selected." LHW11-T2
`specChangeGovernanceDecision` defines governance decisions for spec-change
events (6 values). LHW11-T2 `rollbackRecommended` provides a boolean rollback
signal. LHW7-T3 `faultToRespecAdvisoryType` (6 values) identifies the fault
category triggering the change. No connector maps these three surfaces into a
named workflow advisory that tells an Orchestrator whether to pause and require
spec review before acting.

Without this connector, Orchestrators must manually judge when a spec-change
governance decision warrants a workflow pause — inconsistent across sessions
and agents.

This connector normalizes the workflow posture into a machine-readable advisory
vocabulary. It does NOT enforce spec-change behavior or authorize governance
override. The workflow advisory is a governance planning record.
`runtimeExecutionAuthorized=false`.

Invariant: `runtimeExecutionAuthorized=false`.

Authority chain:
- LHW14 roadmap: `docs/roadmaps/CVF_LHW14_WORKFLOW_CONNECTOR_WAVE14_ROADMAP_2026-05-29.md`
- LHW14 GC-018: `docs/baselines/CVF_GC018_LHW14_WORKFLOW_CONNECTOR_WAVE14_2026-05-29.md`
- LHW11-T2 spec: `docs/reference/CVF_LHW11_T2_SPEC_CHANGE_GOVERNANCE_DECISION_CONNECTOR_SPEC_2026-05-28.md`
- LHW7-T3 spec: `docs/reference/CVF_LHW7_T3_FAILURE_SIM_SPEC_CHANGE_REINTAKE_CONNECTOR_SPEC_2026-05-28.md`
- LH1 ledger: `docs/reference/archive/CVF_LEGACY_HARVEST_CLOSEOUT_LEDGER_2026-05-25.md` — `OpenSpec` trigger at line 140
- T1 gate: `docs/reviews/CVF_LHW14_T1_AGENT_MEMORY_CAPTURE_PACKAGING_ADVISORY_CONNECTOR_COMPLETION_2026-05-29.md` CLOSED_PASS_BOUNDED

## S2 — Governance Decision → Workflow Advisory Mapping

This connector maps LHW11-T2 `specChangeGovernanceDecision` ×
`rollbackRecommended` × LHW7-T3 `faultToRespecAdvisoryType` →
`specChangeWorkflowAdvisoryType` + `workflowPauseAdvisory`.

`specChangeGovernanceDecision` and `rollbackRecommended` values are taken from
LHW11-T2 S2 and S3. `faultToRespecAdvisoryType` values are taken from LHW7-T3
S2 and S3.

| `specChangeGovernanceDecision` | `rollbackRecommended` | `faultToRespecAdvisoryType` scope | `specChangeWorkflowAdvisoryType` | `workflowPauseAdvisory` |
| --- | --- | --- | --- | --- |
| `spec_change_blocked_rollback_required` | `true` | `spec_exception_required` or `spec_route_constraint_update` | `workflow_pause_rollback_required` | Pause all downstream work; initiate rollback before any spec change proceeds |
| `spec_change_pending_approval` | `false` | `spec_retry_boundary_update` or `spec_fallback_model_update` | `workflow_pause_review_required` | Pause until human reviewer approves spec change |
| `spec_change_review_required` | `false` | `spec_success_criteria_tighten` | `workflow_proceed_with_caution` | Proceed; log change packet; monitor for fault reintake |
| `spec_change_approved_proceed` | `false` | any | `workflow_proceed_clear` | Proceed; no pause required |
| `spec_change_human_gate_required` | `false` | `spec_human_gate_insertion` | `workflow_pause_human_gate` | Pause until human gate is resolved; spec change requires gate insertion |
| `spec_change_rejected_revert` | `true` | any | `workflow_pause_revert` | Pause all downstream work; revert spec change |

Key invariant: "This connector does not enforce spec-change behavior. The
workflow advisory is a governance planning record. `runtimeExecutionAuthorized=false`."

## S3 — Workflow Advisory Packet Minimum Fields

All fields are documentation-only advisory fields.

| Field | Source | Invariant | Notes |
| --- | --- | --- | --- |
| `specChangeGovernanceDecision` | LHW11-T2 S3 | verbatim from LHW11-T2 | One of 6 LHW11-T2 values |
| `rollbackRecommended` | LHW11-T2 S3 | boolean field | From LHW11-T2 `rollbackRecommended`; treated as boolean, not false invariant |
| `faultToRespecAdvisoryType` | LHW7-T3 S3 | verbatim from LHW7-T3 | One of 6 LHW7-T3 values |
| `specChangeWorkflowAdvisoryType` | N/A — new doc-only | — | One of 6 workflow advisory values from S2 |
| `workflowPauseAdvisory` | N/A — new doc-only | — | Plain-language pause guidance from S2 |
| `runtimeExecutionAuthorized` | N/A — new doc-only | `=false` | Connector invariant |

## S4 — Boundary Table

| Surface | Status | Notes |
| --- | --- | --- |
| LHW11-T2 `specChangeGovernanceDecision` (6 values) | Doc-only | Source: LHW11-T2 S2; no runtime source |
| LHW11-T2 `rollbackRecommended` | Doc-only | Source: LHW11-T2 S3; boolean field |
| LHW7-T3 `faultToRespecAdvisoryType` (6 values) | Doc-only | Source: LHW7-T3 S3 line 112; no runtime source |
| `specChangeWorkflowAdvisoryType` (new) | Doc-only | Defined in this connector; no runtime source |
| `workflowPauseAdvisory` (new) | Doc-only | Defined in this connector; no runtime source |
| Spec-change enforcement | Not authorized | `runtimeExecutionAuthorized=false` |
| Governance override | Not authorized | Advisory only |
| Workflow execution | Not authorized | Planning record only |

## S5 — Source Verification Table

| Claimed item | Source file | Verified line/section | Verified path or symbol | Owning interface/function/schema | Disposition |
| --- | --- | --- | --- | --- | --- |
| `specChangeGovernanceDecision` field | `docs/reference/CVF_LHW11_T2_SPEC_CHANGE_GOVERNANCE_DECISION_CONNECTOR_SPEC_2026-05-28.md` | S3 line 78 | `specChangeGovernanceDecision` | LHW11-T2 doc-only field | ACCEPT |
| `spec_change_blocked_rollback_required` | `docs/reference/CVF_LHW11_T2_SPEC_CHANGE_GOVERNANCE_DECISION_CONNECTOR_SPEC_2026-05-28.md` | S2 mapping table | `specChangeGovernanceDecision` value | LHW11-T2 S2 | ACCEPT |
| `spec_change_pending_approval` | `docs/reference/CVF_LHW11_T2_SPEC_CHANGE_GOVERNANCE_DECISION_CONNECTOR_SPEC_2026-05-28.md` | S2 mapping table | `specChangeGovernanceDecision` value | LHW11-T2 S2 | ACCEPT |
| `spec_change_review_required` | `docs/reference/CVF_LHW11_T2_SPEC_CHANGE_GOVERNANCE_DECISION_CONNECTOR_SPEC_2026-05-28.md` | S2 mapping table | `specChangeGovernanceDecision` value | LHW11-T2 S2 | ACCEPT |
| `spec_change_approved_proceed` | `docs/reference/CVF_LHW11_T2_SPEC_CHANGE_GOVERNANCE_DECISION_CONNECTOR_SPEC_2026-05-28.md` | S2 mapping table | `specChangeGovernanceDecision` value | LHW11-T2 S2 | ACCEPT |
| `spec_change_human_gate_required` | `docs/reference/CVF_LHW11_T2_SPEC_CHANGE_GOVERNANCE_DECISION_CONNECTOR_SPEC_2026-05-28.md` | S2 mapping table | `specChangeGovernanceDecision` value | LHW11-T2 S2 | ACCEPT |
| `spec_change_rejected_revert` | `docs/reference/CVF_LHW11_T2_SPEC_CHANGE_GOVERNANCE_DECISION_CONNECTOR_SPEC_2026-05-28.md` | S2 mapping table | `specChangeGovernanceDecision` value | LHW11-T2 S2 | ACCEPT |
| `rollbackRecommended` boolean field | `docs/reference/CVF_LHW11_T2_SPEC_CHANGE_GOVERNANCE_DECISION_CONNECTOR_SPEC_2026-05-28.md` | S3 line 79 | `rollbackRecommended` | LHW11-T2 doc-only field | ACCEPT |
| `faultToRespecAdvisoryType` field | `docs/reference/CVF_LHW7_T3_FAILURE_SIM_SPEC_CHANGE_REINTAKE_CONNECTOR_SPEC_2026-05-28.md` | S3 line 112 | `faultToRespecAdvisoryType` | LHW7-T3 doc-only field | ACCEPT |
| `spec_exception_required` | `docs/reference/CVF_LHW7_T3_FAILURE_SIM_SPEC_CHANGE_REINTAKE_CONNECTOR_SPEC_2026-05-28.md` | S2 line 75 | `faultToRespecAdvisoryType` value | LHW7-T3 S2 | ACCEPT |
| `spec_retry_boundary_update` | `docs/reference/CVF_LHW7_T3_FAILURE_SIM_SPEC_CHANGE_REINTAKE_CONNECTOR_SPEC_2026-05-28.md` | S2 line 76 | `faultToRespecAdvisoryType` value | LHW7-T3 S2 | ACCEPT |
| `spec_success_criteria_tighten` | `docs/reference/CVF_LHW7_T3_FAILURE_SIM_SPEC_CHANGE_REINTAKE_CONNECTOR_SPEC_2026-05-28.md` | S2 line 77 | `faultToRespecAdvisoryType` value | LHW7-T3 S2 | ACCEPT |
| `spec_human_gate_insertion` | `docs/reference/CVF_LHW7_T3_FAILURE_SIM_SPEC_CHANGE_REINTAKE_CONNECTOR_SPEC_2026-05-28.md` | S2 line 79 | `faultToRespecAdvisoryType` value | LHW7-T3 S2 | ACCEPT |
| `spec_route_constraint_update` | `docs/reference/CVF_LHW7_T3_FAILURE_SIM_SPEC_CHANGE_REINTAKE_CONNECTOR_SPEC_2026-05-28.md` | S2 line 80 | `faultToRespecAdvisoryType` value | LHW7-T3 S2 | ACCEPT |
| `spec_fallback_model_update` | `docs/reference/CVF_LHW7_T3_FAILURE_SIM_SPEC_CHANGE_REINTAKE_CONNECTOR_SPEC_2026-05-28.md` | S2 line 81 | `faultToRespecAdvisoryType` value | LHW7-T3 S2 | ACCEPT |
| LH1 `OpenSpec` trigger | `docs/reference/archive/CVF_LEGACY_HARVEST_CLOSEOUT_LEDGER_2026-05-25.md` | line 140 | `OpenSpec` | LH1 CVF ADD ledger | ACCEPT |

---

## Claim Boundary

`cvf.specChangeWorkflowAdvisory.lhw14.t2.v1` is a documentation-only
connector. It does not claim spec-change enforcement, governance override,
workflow execution, receipt envelope extension, provider behavior, hosted
readiness, production readiness, or public release readiness.
