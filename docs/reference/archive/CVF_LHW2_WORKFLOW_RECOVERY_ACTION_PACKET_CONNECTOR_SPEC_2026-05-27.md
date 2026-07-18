# CVF LHW2 Workflow Recovery Action Packet Connector — Specification

Memory class: FULL_RECORD

docType: reference

Status: ACTIVE

Contract version: `cvf.workflowRecoveryActionPacketConnector.lhw2.t2.v1`

Date: 2026-05-27

Authority: `docs/work_orders/CVF_WO_LHW2_T2_WORKFLOW_RECOVERY_ACTION_PACKET_CONNECTOR_2026-05-27.md`

---

## Purpose

A normative document mapping each WR1 workflow transition class to a concrete
MA1-compatible recovery action packet template. Closes the gap where WR1
classifies transition states (escalate, hold, advance, no-transition) but
provides no standard packet template for how those outcomes are communicated
to the Orchestrator or next role agent.

T1 gate: CLOSED_PASS (`cvf.memoryEventCaptureWorkflowReceiptLoopConnector.lhw2.t1.v1`).

## Scope

Source authority:

- WR1: `docs/reviews/archive/CVF_WR1_WORKFLOW_RECOVERY_STATE_PROOF_COMPLETION_2026-05-25.md`
- W1: `docs/reviews/CVF_W1_WORKFLOW_STATE_MACHINE_ENFORCEMENT_COMPLETION_2026-05-24.md`
- MA1: `docs/reference/CVF_INTERNAL_MULTI_AGENT_WORK_TRANSFER_PACKET_STANDARD_2026-05-26.md`
- LHW1-T2: `docs/reference/CVF_LHW1_WORKFLOW_CHAIN_STATE_CONNECTOR_SPEC_2026-05-27.md`
- LHW2 roadmap: `docs/roadmaps/CVF_LHW2_WORKFLOW_CONNECTOR_COMPLETION_ROADMAP_2026-05-27.md`

---

## S1 — Purpose and Claim Boundary

What this connector is: a normative doc mapping WR1 transition classes to
MA1-compatible recovery action packet templates.

What this connector is not: not a WR1 runtime extension; not a new workflow
orchestration engine; not route-level enforcement.

"WR1 `workflowRecoveryReadout` is the runtime authority for transition
classification; this connector extends that pattern to a standard recovery
packet shape usable by Orchestrator and role agents."

---

## S2 — WR1 Transition Class to Recovery Packet Mapping

WR1 transition class vocabulary is verbatim from
`docs/reviews/archive/CVF_WR1_WORKFLOW_RECOVERY_STATE_PROOF_COMPLETION_2026-05-25.md`.
MA1 section numbers (##0-##10) are from
`docs/reference/CVF_INTERNAL_MULTI_AGENT_WORK_TRANSFER_PACKET_STANDARD_2026-05-26.md`.

### `no_requested_transition` → Advisory Hold Packet

Packet type: `advisory_hold_packet`

When issued: no phase transition was requested; system in advisory steady state.

MA1 sections: R: ##0 (Surface Fidelity Gate), ##1 (Authority Chain),
##2 (Transfer Objective); O: ##3 (Source Packet — current phase record).

Minimum fields: `currentPhase` (W1 phase token), `readoutClass: no_requested_transition`,
`advisoryNote` (reason no transition was requested).

Next role action: acknowledge and continue; no phase advance required.

### `configured_deferred_gate` → Reviewer Gate Hold Packet

Packet type: `reviewer_gate_hold_packet`

When issued: a transition was requested but a configured reviewer gate is
required before the phase can advance.

MA1 sections: R: ##0 (Surface Fidelity Gate), ##1 (Authority Chain),
##2 (Transfer Objective), ##3 (Source Packet), ##4 (Role Assignment —
reviewer identity), ##7 (Dissent And Review Ledger), ##8 (Integration
Decision), ##9 (Completion Evidence).

Minimum fields: `currentPhase`, `readoutClass: configured_deferred_gate`,
`reviewerRole` (role that must respond), `gateCondition` (what the reviewer
must confirm), `action: hold_for_reviewer_gate`.

Next role action: Reviewer receives packet, records decision in MA1 ##7, and
records the gate-lift outcome in MA1 ##8 plus evidence in MA1 ##9.

### `valid_from_current_state` → Advance Packet

Packet type: `advance_packet`

When issued: the requested phase transition is valid from the current W1 state.

MA1 sections: R: ##0 (Surface Fidelity Gate), ##1 (Authority Chain),
##2 (Transfer Objective), ##3 (Source Packet), ##4 (Role Assignment),
##5 (Execution Instructions); O: ##9 (Completion Evidence).

Minimum fields: `currentPhase`, `nextPhase` (target W1 phase token),
`transitionToken`, `readoutClass: valid_from_current_state`.

Next role action: Implementer or Orchestrator executes the advance; records
completed phase in `lastRestorableCheckpoint`.

### `invalid_from_current_state` → Escalate-to-Governance Packet

Packet type: `escalate_to_governance_packet`

When issued: the requested transition is not valid from the current W1 phase;
possible workflow state corruption.

MA1 sections: R: ##0 (Surface Fidelity Gate), ##1 (Authority Chain),
##2 (Transfer Objective), ##3 (Source Packet), ##7 (Dissent And Review Ledger),
##8 (Integration Decision), ##10 (Claim Boundary).

Minimum fields: `currentPhase`, `attemptedTransition`, `reason`,
`readoutClass: invalid_from_current_state`, `action: escalate_to_governance`,
`stopCondition: do_not_advance_until_governance_review`.

Next role action: Orchestrator stops; does not advance phase; logs packet;
seeks governance review before any retry.

---

## S3 — `lastRestorableCheckpoint` to Restore Packet

`lastRestorableCheckpoint` is the most recently completed, reachable W1 phase
token (e.g., `design_ready` after `intake_pending` was successfully closed).

**What phase name is used as restore point:** the verbatim W1 phase token
stored in `lastRestorableCheckpoint` at the time WR1 was evaluated.

**How it feeds into a recovery packet:** the restore phase token populates
`##3 Source Packet` under the field `restoreFromPhase`. The advance packet
(for `valid_from_current_state`) or the escalation packet (for
`invalid_from_current_state`) must include `restoreFromPhase` in ##4.

**Evidence required before a restore can begin:**

- The WR1 readout must confirm the phase token is present in `lastRestorableCheckpoint`.
- The GovernanceEvidenceReceipt for the restore-phase must be locatable.
- The Orchestrator must confirm no conflicting phase advance is in flight.

**What the Orchestrator confirms before accepting:** phase token is the last
confirmed-closed W1 phase; receipt exists; no concurrent advance.

---

## S4 — Dissent and Escalation Handoff Rules

**When `invalid_from_current_state` triggers escalation:** The receiving
Orchestrator must not advance the phase. Log the escalation packet. Record
it in the MA1 ##7 Dissent And Review Ledger. Seek governance review and record
the decision in MA1 ##8 before any further action. Retrying the same transition
without governance clearance is a stop condition.

**When `configured_deferred_gate` triggers a hold:** The role that holds the
next action token is identified in the packet `reviewerRole` field. The gate
is lifted only by a Reviewer response recorded in MA1 ##8 Integration Decision
with supporting evidence in MA1 ##9 Completion Evidence. No other role may lift
the gate unilaterally.

**Minimum evidence Auditor must confirm before accepting an escalation packet:**

- `readoutClass: invalid_from_current_state` explicitly present.
- `action: escalate_to_governance` explicitly present.
- `stopCondition` field set and non-empty.
- No code file was modified to produce the packet.

---

## S5 — Runtime-Enforcement Boundary Table

| Behavior | Current status | Future path |
|---|---|---|
| WR1 transition classification (`workflowRecoveryReadout`) | Runtime (`workflow-resolver.ts`) | Stable |
| W1 phase state projection | Runtime (`workflow-resolver.ts`) | Stable |
| Recovery packet structure | Document-only | Future: MA1 packet validator |
| Restore point enforcement | Document-only | Future: route-level checkpoint restore |
| Escalation routing | Document-only | Future: governance escalation queue |
| Reviewer gate lift | Document-only | Future: reviewer gate signal in `/api/execute` |

---

## S6 — Source Verification Table

| Claimed item | Source file | Verified path or symbol | Owning interface/function/schema | Disposition |
|---|---|---|---|---|
| `no_requested_transition` | `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/lib/workflows/workflow-resolver.ts` | `WorkflowTransitionDisposition = 'no_requested_transition'` | `WorkflowTransitionDisposition` type | ACCEPT |
| `configured_deferred_gate` | `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/lib/workflows/workflow-resolver.ts` | `WorkflowTransitionDisposition = 'configured_deferred_gate'` | `WorkflowTransitionDisposition` type | ACCEPT |
| `valid_from_current_state` | `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/lib/workflows/workflow-resolver.ts` | `WorkflowTransitionDisposition = 'valid_from_current_state'` | `WorkflowTransitionDisposition` type | ACCEPT |
| `invalid_from_current_state` | `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/lib/workflows/workflow-resolver.ts` | `WorkflowTransitionDisposition = 'invalid_from_current_state'` | `WorkflowTransitionDisposition` type | ACCEPT |
| `lastRestorableCheckpoint` | `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/lib/workflows/workflow-resolver.ts` | `WorkflowRecoveryReadout.lastRestorableCheckpoint` | `WorkflowRecoveryReadout` interface | ACCEPT |
| `hold_for_reviewer_gate` | `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/lib/workflows/workflow-resolver.ts` | `WorkflowRecoveryAction = 'hold_for_reviewer_gate'` | `WorkflowRecoveryAction` type | ACCEPT |
| `escalate_to_governance` | `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/lib/workflows/workflow-resolver.ts` | `WorkflowRecoveryAction = 'escalate_to_governance'` | `WorkflowRecoveryAction` type | ACCEPT |
| MA1 section numbers `##0`-`##10` | `docs/reference/CVF_INTERNAL_MULTI_AGENT_WORK_TRANSFER_PACKET_STANDARD_2026-05-26.md` | Section headers `## 0` through `## 10` | MA1 standard | ACCEPT |

No `BLOCKED_SOURCE_NOT_FOUND` rows.

---

## Claim Boundary

This connector is a documentation artifact only. It does not claim WR1/W1
runtime extension, new workflow orchestration engine, route-level enforcement,
async worker runtime, memory reinjection, receipt envelope extension, provider
behavior, hosted readiness, production readiness, or public release readiness.

Contract version: `cvf.workflowRecoveryActionPacketConnector.lhw2.t2.v1`.
