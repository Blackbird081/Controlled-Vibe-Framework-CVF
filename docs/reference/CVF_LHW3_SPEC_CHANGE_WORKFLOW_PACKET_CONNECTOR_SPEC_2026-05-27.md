# CVF LHW3 Spec-Change Workflow Packet Connector Spec

Memory class: FULL_RECORD

Status: CLOSED_PASS_BOUNDED

docType: reference

Date: 2026-05-27

Contract version: `cvf.specChangeWorkflowPacketConnector.lhw3.t3.v1`

---

## Purpose

This connector defines the documentation standard for converting a mid-workflow
spec-change request into an MA1-compatible governance change packet. It binds
W1 workflow phase vocabulary to MA1 role-transfer sections so a change request
has an approver role, delta scope, and re-entry phase token before any agent
continues work.

## Scope / Applies-To

Applies to CVF workflow-chain handoffs that already use W1 phase tokens and MA1
multi-role transfer packets. This is documentation-only. It does not extend W1
runtime behavior, mutate workflow state, enforce route-level phase gates, or
change any receipt envelope.

## S1 — Purpose And Claim Boundary

This connector is a normative mapping from spec-change requests arising at W1
phase boundaries to MA1-compatible governance change packets.

It is not a W1 runtime extension, workflow mutation authority, or spec-change
enforcement engine.

`runtimeExecutionAuthorized=false` is preserved. A change packet is a governance
record only. Accepting a change packet does not automatically mutate a running
workflow state; it creates an authorized re-entry point that Orchestrator must
act on explicitly.

## S2 — W1 Phase To Change-Trigger Table And Packet Shape

Notation: R = required, O = optional, N/A = not applicable.

| W1 phase | Change allowed? | Approver role | MA1 sections R/O/N/A | Re-entry phase token |
| --- | --- | --- | --- | --- |
| `intake_pending` | Allowed; spec not yet committed | Orchestrator | R: `##0 Surface Fidelity Gate`, `##2 Transfer Objective`, `##3 Source Packet`; O: `##1 Authority Chain`, `##4 Role Assignment`; N/A: `##8 Integration Decision`, `##9 Completion Evidence` | `intake_pending` |
| `design_ready` | Allowed with Reviewer sign-off | Reviewer | R: `##0 Surface Fidelity Gate`, `##2 Transfer Objective`, `##3 Source Packet`, `##8 Integration Decision`; O: `##9 Completion Evidence`; N/A: none | `design_ready` |
| `build_running` | Requires pause plus Reviewer and Auditor review | Reviewer + Auditor | R: `##0 Surface Fidelity Gate`, `##2 Transfer Objective`, `##3 Source Packet`, `##8 Integration Decision`, `##9 Completion Evidence`; O: `##7 Dissent And Review Ledger`; N/A: none | `design_ready` |
| `review_pending` | Blocked until review completes; urgent cases escalate to governance | Governance escalation | R: `##0 Surface Fidelity Gate`, `##8 Integration Decision`, `##9 Completion Evidence`; O: `##7 Dissent And Review Ledger`; N/A: `##5 Execution Instructions`, `##6 Role Output Schema` | `design_ready` |
| `freeze_ready` | Blocked; reopen via WR1 `invalid_from_current_state` escalation | Auditor + Orchestrator | R: `##0 Surface Fidelity Gate`, `##7 Dissent And Review Ledger`, `##8 Integration Decision`, `##9 Completion Evidence`; O: none; N/A: `##5 Execution Instructions`, `##6 Role Output Schema` | Determined by governance |
| `completed` | Not applicable; create a new workflow instance | Orchestrator | R: `##1 Authority Chain`, `##2 Transfer Objective`, `##10 Claim Boundary`; O: `##3 Source Packet`; N/A: `##5 Execution Instructions`, `##8 Integration Decision` | New workflow instance |

## S3 — Change Packet Minimum Field List

Every spec-change packet must contain:

- `changeId`: unique token for this change request
- `requestingActor`: actor initiating the change
- `currentPhase`: W1 phase token at time of request
- `deltaDescription`: one-sentence summary of what changed in the spec
- `affectedPhaseRange`: which W1 phases must re-run after the change
- `approverRole`: which role must sign MA1 `##8 Integration Decision`
- `reEntryPhaseToken`: the W1 phase token where workflow re-enters after approval
- `changePacketStatus`: `pending_approval` | `approved` | `rejected`

These fields are documentation-only minimum requirements. They do not extend
`GovernanceEvidenceReceipt` or any existing receipt envelope.

## S3A — New Doc-Only Fields Table

| New doc-only field | Purpose | Not sourced from runtime? | Runtime claim blocked? | Validation expectation |
| --- | --- | --- | --- | --- |
| `changeId` | stable ID for the change packet | Yes | Yes | present in connector examples/checklist |
| `requestingActor` | actor initiating the change | Yes | Yes | present in connector examples/checklist |
| `currentPhase` | W1 phase token at request time | Yes | Yes | value must source-verify against W1 phase tokens |
| `deltaDescription` | one-sentence change summary | Yes | Yes | present in connector examples/checklist |
| `affectedPhaseRange` | W1 phases requiring re-run | Yes | Yes | values must source-verify against W1 phase tokens |
| `approverRole` | role signing MA1 `##8 Integration Decision` | Yes | Yes | role label is doc-only unless sourced elsewhere |
| `reEntryPhaseToken` | W1 phase token for re-entry | Yes | Yes | value must source-verify against W1 phase tokens |
| `changePacketStatus` | change packet disposition | Yes | Yes | doc-only enum: `pending_approval` / `approved` / `rejected` |

## S4 — Source Verification Table

| Claimed item | Source file | Verified line/section | Verified path or symbol | Owning interface/function/schema | Disposition |
| --- | --- | --- | --- | --- | --- |
| W1 phase tokens | `docs/reference/CVF_LHW1_WORKFLOW_CHAIN_STATE_CONNECTOR_SPEC_2026-05-27.md` | lines 68-73 | `intake_pending`, `design_ready`, `build_running`, `review_pending`, `freeze_ready`, `completed` | LHW1-T2 phase-to-role assignment table | ACCEPT |
| Existing workflow transitions | `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/lib/workflows/workflow.product.create_product_brief.v1.json` | lines 17-18, 35-36, 53-54, 71-72, 89-90 | `fromState` / `toState` transition records | product brief workflow JSON | ACCEPT |
| MA1 sections | `docs/reference/CVF_INTERNAL_MULTI_AGENT_WORK_TRANSFER_PACKET_STANDARD_2026-05-26.md` | lines 53, 66, 77, 84, 92, 104, 114, 127, 134, 142, 151 | `##0 Surface Fidelity Gate` through `##10 Claim Boundary` | MA1 packet standard | ACCEPT |
| Runtime execution boundary | `docs/reference/CVF_LHW2_TOOL_APPROVAL_MA1_HANDOFF_CONNECTOR_SPEC_2026-05-27.md` | line 48 | `runtimeExecutionAuthorized=false` | LHW2-T3 tool-approval MA1 handoff connector boundary | ACCEPT |
| T1 gate | `docs/reviews/CVF_LHW3_T1_OPERATIONAL_FAILURE_TREND_READOUT_CONNECTOR_COMPLETION_2026-05-27.md` | line 5 and disposition section | `CLOSED_PASS_BOUNDED` | LHW3-T1 completion review | ACCEPT |
| T2 gate | `docs/reviews/CVF_LHW3_T2_REQUEST_CLARIFICATION_RE_INTAKE_LOOP_CONNECTOR_COMPLETION_2026-05-27.md` | line 5 and disposition section | `CLOSED_PASS_BOUNDED` | LHW3-T2 completion review | ACCEPT |

## S5 — Runtime-Enforcement Boundary Table

| Behavior | Current status | Future path |
| --- | --- | --- |
| W1 phase state projection | Runtime (workflow-resolver.ts) | Stable |
| MA1 transfer packet structure | Document standard (MA1) | Stable |
| Change packet field validation | Document-only | Future: MA1 packet validator |
| Phase-boundary change gate enforcement | Document-only | Future: route-level phase gate |
| Approver role signal | Document-only | Future: governance review queue |
| Spec-change re-entry execution | Document-only | Future: workflow re-entry executor |

## Claim Boundary

LHW3-T3 is a documentation connector spec. It does not claim W1/MA1 runtime
extension, workflow mutation authority, spec-change enforcement, execution
authority, receipt envelope extension, provider behavior, hosted readiness,
production readiness, or public release readiness.
