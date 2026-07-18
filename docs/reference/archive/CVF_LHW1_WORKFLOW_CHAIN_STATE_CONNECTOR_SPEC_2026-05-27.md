# CVF LHW1 Workflow Chain State Connector — Specification

Memory class: FULL_RECORD

docType: reference

Status: ACTIVE

Contract version: `cvf.workflowChainStateConnector.lhw1.t2.v1`

Date: 2026-05-27

Authority: `docs/work_orders/CVF_WO_LHW1_T2_WORKFLOW_CHAIN_STATE_CONNECTOR_2026-05-27.md`

---

## Purpose

A normative document binding the CVF five-phase workflow chain to role
assignments, MA1-compatible transfer packet fields, evidence receipts, and
recovery states. It extends the T1 product skill pack connector pattern to
cover inter-phase state transitions and cross-role handoffs.

`W1 workflow-resolver.ts` and `WR1 workflowRecoveryReadout` are the runtime
authority for phase projection and recovery classification. This connector
extends that pattern to a cross-workflow standard without modifying either
runtime surface. It is not a runtime scheduler, not a role-enforcement gate,
and not a receipt envelope extension.

## Scope

Applies to all CVF governed workflows that use the W1 five-phase vocabulary.

Source authority:

- W1: `docs/reviews/CVF_W1_WORKFLOW_STATE_MACHINE_ENFORCEMENT_COMPLETION_2026-05-24.md`
- WR1: `docs/reviews/archive/CVF_WR1_WORKFLOW_RECOVERY_STATE_PROOF_COMPLETION_2026-05-25.md`
- MA1: `docs/reference/CVF_INTERNAL_MULTI_AGENT_WORK_TRANSFER_PACKET_STANDARD_2026-05-26.md`
- T1: `docs/reference/CVF_LHW1_PRODUCT_SKILL_PACK_WORKFLOW_CONNECTOR_SPEC_2026-05-27.md`

---

## Section 1 — Purpose and Claim Boundary

This connector is a documentation artifact. It does not modify
`workflow-resolver.ts`, `workflowRecoveryReadout`, `/api/execute`, or any
receipt envelope field. Role assignment, dissent handling, and evidence
requirements defined here are document-only standards until a future tranche
implements runtime enforcement.

Runtime boundaries:

- `W1 workflow-resolver.ts` owns phase-state projection. This connector
  references W1 phases verbatim; it does not override them.
- `WR1 workflowRecoveryReadout` owns recovery classification. This connector
  cross-references WR1 transition classes; it does not re-implement them.
- MA1 packet structure is referenced by section number only; this connector
  does not redefine the MA1 template.

---

## Section 2 — Phase-to-Role Assignment Table

Uses W1 vocabulary verbatim. No invented phase tokens.

| Phase token | Phase name | Primary role | Supporting roles | Evidence to enter |
|---|---|---|---|---|
| `intake_pending` | Intake | Orchestrator | Non-coder submitter | Workflow request present; context profile readiness confirmed |
| `design_ready` | Design | Implementer | Orchestrator | Intake package complete; skill pack selected per T1 connector |
| `build_running` | Build | Implementer | — | Design spec confirmed; T1 execution policy applied |
| `review_pending` | Review | Reviewer | Auditor | Build output present; receipt issued by route |
| `freeze_ready` | Freeze | Orchestrator + Auditor | Reviewer | Review PASS; all acceptance criteria met |
| `completed` | Completed | (closed) | — | Freeze authorized; receipt final |

---

## Section 3 — MA1-Compatible Role Transfer Packet Fields

Reference MA1 section numbers from the canonical standard. Do not re-define
the MA1 structure. For each phase transition, notation: R = Required,
O = Optional, N/A = Not applicable.

| MA1 section | `intake_pending` | `design_ready` | `build_running` | `review_pending` | `freeze_ready` |
|---|---|---|---|---|---|
| `## 0 Surface Fidelity Gate` | R | R | R | R | R |
| `## 1 Authority Chain` | R | R | R | R | R |
| `## 2 Transfer Objective` | R | R | R | R | R |
| `## 3 Source Packet` | R | R | O | O | N/A |
| `## 4 Role Assignment` | R | R | R | R | R |
| `## 5 Execution Instructions` | O | R | R | N/A | N/A |
| `## 6 Role Output Schema` | N/A | O | R | R | R |
| `## 7 Dissent And Review Ledger` | N/A | O | O | R | R |
| `## 8 Integration Decision` | N/A | N/A | O | R | R |
| `## 9 Completion Evidence` | N/A | N/A | N/A | O | R |

---

## Section 4 — Dissent and Review Handoff Requirements

### Reviewer dissent at `review_pending`

If the Reviewer does not pass the build output:

1. Record the dissent in MA1 `## 7 Dissent And Review Ledger` with role
   position, counter-position, and evidence.
2. The Orchestrator reads the dissent entry and decides: `ACCEPT`, `REJECT`,
   `MERGE`, or `DEFER`.
3. If deferred: transition to WR1 `configured_deferred_gate`; do not advance
   to `freeze_ready`. WR1 will classify the next requested transition as
   `hold_for_reviewer_gate`.
4. If accepted: Orchestrator re-dispatches the Implementer to address the
   dissent; `build_running` phase reopens.

### Deferred gate (WR1 pattern)

Map deferred reviewer gate to WR1 `configured_deferred_gate`. Do not
redefine recovery logic; reference the WR1 completion review for transition
classification rules. The `lastRestorableCheckpoint` is the most recently
completed reachable phase before the deferred gate.

### Auditor challenge at `freeze_ready`

Before authorizing `freeze_ready → completed`, the Auditor must confirm:

- Review PASS is documented in MA1 `## 9 Completion Evidence`.
- All acceptance criteria in the T1 connector `evidenceRequired` list are met.
- No open dissent entry in MA1 `## 7` has `UNRESOLVED` disposition.
- Final receipt fields match `evidenceRequired` from the T1 connector.

---

## Section 5 — Recovery State Binding

Map WR1 `workflowRecoveryReadout` transition classes to this phase table:

| WR1 transition class | Phase table action | Responsible role |
|---|---|---|
| `no_requested_transition` | Hold current phase; no advance | Current primary role |
| `configured_deferred_gate` | Hold at `review_pending`; do not advance to `freeze_ready` | Reviewer |
| `valid_from_current_state` | Advance to next phase per Section 2 table | Primary role of target phase |
| `invalid_from_current_state` | `escalate_to_governance`; role must not proceed | Orchestrator |

`lastRestorableCheckpoint` rule: the most recently completed reachable phase
is the restore point. Recovery resumes from that phase forward; it does not
skip phases.

`canReinject: false` is preserved from all upstream receipts. No recovery
path may reinject raw receipt data into the provider prompt.

---

## Section 6 — Evidence Receipt Binding

Minimum receipt fields required at each phase boundary. Reference existing
`GovernanceEvidenceReceipt` field names only. No new envelope fields.

| Phase boundary | Required receipt fields |
|---|---|
| `intake_pending` → `design_ready` | `evidenceActor`, `evidenceNotes` (intake package contents) |
| `design_ready` → `build_running` | `evidenceActor`, `evidenceNotes` (design spec confirmation) |
| `build_running` → `review_pending` | `receiptRequired: true`, `evidenceTimestamp`, `evidenceActor` |
| `review_pending` → `freeze_ready` | `receiptRequired: true`, `evidenceActor` (Reviewer PASS), `evidenceNotes` (review findings) |
| `freeze_ready` → `completed` | `receiptRequired: true`, `evidenceTimestamp`, `evidenceActor` (Auditor + Orchestrator), `canReinject: false` |

`canReinject: false` must be explicitly set in all final receipts. This
restates the WR1 and VI3 boundary; no phase transition in this connector
relaxes it.

---

## Section 7 — Runtime-Enforcement Boundary Table

| Behavior | Current status | Future path |
|---|---|---|
| Phase state projection | Runtime (W1) | Stable |
| Recovery checkpoint readout | Runtime (WR1) | Stable |
| Role assignment enforcement | Document-only | Future: role-gate in `/api/execute` |
| MA1 packet validation | Document-only | Future: MA1 schema validator |
| Dissent recording | Document-only | Future: dissent field in GovernanceEvidenceReceipt |
| Cross-workflow phase binding | Document-only | Future: multi-workflow state machine |

Do not label any row "Runtime" unless a closed PASS tranche implements it.

---

## Claim Boundary

This connector is a documentation artifact only. It does not claim runtime
phase enforcement, role-gate implementation, MA1 packet runtime validation,
dissent receipt field implementation, multi-workflow state machine runtime,
memory reinjection, receipt envelope extension, hosted readiness, production
readiness, or public release readiness.

Contract version: `cvf.workflowChainStateConnector.lhw1.t2.v1`.
