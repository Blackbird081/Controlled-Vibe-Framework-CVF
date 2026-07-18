# CVF LHW7-T3 Failure Simulation → Spec-Change Re-Intake Connector Spec

Memory class: FULL_RECORD

docType: reference

Contract version: `cvf.failureSimSpecChangeReIntake.lhw7.t3.v1`

Date: 2026-05-28

Status: CLOSED_PASS_BOUNDED

---

## Purpose

Connector spec binding LHW5-T3 failure simulation scenario packet →
LHW3-T3 spec-change packet → LHW3-T2 clarification re-intake type →
WR1 recommended `recoveryAction` into a single fault-to-respec advisory chain.

## Scope / Applies To

Applies to: Orchestrator agents receiving a failure simulation scenario packet
who need to determine the corresponding spec-change trigger, re-intake type,
and recovery recommendation. Documentation-only; no runtime enforcement.

---

## S1 — Purpose and Claim Boundary

This connector is a normative documentation standard binding LHW5-T3 failure
simulation scenario packet → LHW3-T3 spec-change packet → LHW3-T2
clarification re-intake packet type → WR1 recommended `recoveryAction` into
one Orchestrator-readable fault-to-respec advisory chain.

### Problem it solves

LHW5-T3 produces failure scenarios with `scenarioType` and `wr1RecoveryAction`.
LHW3-T3 produces spec-change packets. LHW3-T2 produces clarification re-intake
packets. WR1 provides `WorkflowRecoveryAction`. No standard chains them:

> "Given this failure scenario, which spec-change packet should be drafted,
> which clarification re-intake type should be opened, and which recovery
> action should the Orchestrator recommend?"

This connector answers that question without executing any of those actions.

### What this connector is not

- Not a LHW5-T3, LHW3-T2, LHW3-T3, or WR1 runtime extension.
- Not a spec-change executor or re-intake automation engine.
- Not a workflow transition trigger.

Explicit invariants:

- "This connector does not execute spec changes or re-intake actions."
- "The fault-to-respec advisory packet is a planning record only."
- `runtimeExecutionAuthorized=false` is invariant throughout.
- `scenarioPlanningOnly=true` is invariant throughout.

T3 gate: T1 CLOSED_PASS_BOUNDED + T2 CLOSED_PASS_BOUNDED.

---

## S2 — Fault-to-Respec Chain Mapping

Input: LHW5-T3 `scenarioType` + `wr1RecoveryAction` + `lhw3TrendSignal` →
LHW3-T3 spec-change trigger description → LHW3-T2 re-intake type →
`faultToRespecAdvisoryType` → recommended WR1 `recoveryAction`.

All input tokens are used verbatim from their source surfaces.

| `scenarioType` | Simulation `wr1RecoveryAction` | `lhw3TrendSignal` | Spec-change trigger | LHW3-T2 re-intake type | `faultToRespecAdvisoryType` | Recommended `recoveryAction` |
| --- | --- | --- | --- | --- | --- | --- |
| `policy_block` | `escalate_to_governance` | any | Spec requires policy exception clarification before retry | `ambiguous_outcome_clarification_packet` | `spec_exception_required` | `escalate_to_governance` |
| `provider_failure` | `resume_from_checkpoint` | any | Provider failure: retry boundary and fallback allowances need spec update | `missing_context_clarification_packet` | `spec_retry_boundary_update` | `resume_from_checkpoint` |
| `output_drift` | `hold_for_reviewer_gate` | `increasing_failure_rate` | Output drift: success criteria need tightening in spec | `noisy_context_clarification_packet` | `spec_success_criteria_tighten` | `hold_for_reviewer_gate` |
| `output_drift` | `hold_for_reviewer_gate` | other or `none` | Output drift detected without trend: reviewer gate required | `ambiguous_outcome_clarification_packet` | `spec_success_criteria_tighten` | `hold_for_reviewer_gate` |
| `human_review` | `request_human_review` | any | Spec requires explicit human-review gate insertion | `ambiguous_outcome_clarification_packet` | `spec_human_gate_insertion` | `request_human_review` |
| `routing_block` | `escalate_to_governance` | any | Routing block: route constraint relaxation or split needed in spec | `unmatched_request_clarification_packet` | `spec_route_constraint_update` | `escalate_to_governance` |
| `model_failure` | `resume_from_checkpoint` | any | Model failure: fallback model allowances need spec update | `missing_context_clarification_packet` | `spec_fallback_model_update` | `resume_from_checkpoint` |

`changePacketStatus` for all rows: `pending_approval` — change must go through
the LHW3-T3 approval process. The connector does not auto-approve.

---

## S3 — Fault-to-Respec Advisory Packet Minimum Fields

Every Failure Simulation → Spec-Change Re-Intake advisory packet must contain
the following fields. All fields are doc-only. `runtimeExecutionAuthorized=false`
and `scenarioPlanningOnly=true` are invariant. The packet does not extend
`GovernanceEvidenceReceipt` or any existing receipt envelope.

- `faultRespecPacketId`: unique doc-only token
- `sourceScenarioId`: from LHW5-T3 `scenarioId`
- `scenarioType`: from LHW5-T3 `scenarioType`
  — values: `policy_block` | `provider_failure` | `output_drift` |
    `human_review` | `routing_block` | `model_failure`
- `simulationWr1RecoveryAction`: from LHW5-T3 `wr1RecoveryAction`
  — values: `resume_from_checkpoint` | `hold_for_reviewer_gate` |
    `escalate_to_governance` | `request_human_review`
- `lhw3TrendSignal`: from LHW5-T3 `lhw3TrendSignal`, or `none`
- `specChangePacketFields`: partial LHW3-T3 change packet
  — required: `changeId`, `deltaDescription`, `affectedPhaseRange`,
    `changePacketStatus` (always `pending_approval`)
- `reIntakePacketTypeRecommended`: from LHW3-T2 clarification type (new doc-only)
  — values: `missing_context_clarification_packet` |
    `noisy_context_clarification_packet` |
    `ambiguous_outcome_clarification_packet` |
    `unmatched_request_clarification_packet`
- `faultToRespecAdvisoryType`: derived advisory (new doc-only)
  — values: `spec_exception_required` | `spec_retry_boundary_update` |
    `spec_success_criteria_tighten` | `spec_human_gate_insertion` |
    `spec_route_constraint_update` | `spec_fallback_model_update`
- `recommendedWr1RecoveryAction`: from WR1 `WorkflowRecoveryAction`
- `runtimeExecutionAuthorized`: always `false`
- `scenarioPlanningOnly`: always `true`
- `boundaryStatement`: explicit statement that the packet is planning-only

---

## S4 — Boundary Table

| Surface | Doc-only | Runtime-proven (source) |
| --- | --- | --- |
| LHW5-T3 `scenarioType` values | — | Yes — LHW5-T3 spec S3 |
| LHW5-T3 `wr1RecoveryAction` | — | Yes — `workflow-resolver.ts` lines 50–54 (via LHW5-T3 S5) |
| LHW5-T3 `lhw3TrendSignal` | Doc-only (LHW5-T3 spec) | — |
| LHW5-T3 `scenarioId`, `boundaryStatement`, `scenarioPlanningOnly` | Doc-only (LHW5-T3 spec) | — |
| LHW3-T3 `changePacketStatus` values | Doc-only (LHW3-T3 spec) | — |
| LHW3-T3 `changeId`, `deltaDescription`, `affectedPhaseRange` | Doc-only (LHW3-T3 spec) | — |
| LHW3-T2 clarification packet types | Doc-only (LHW3-T2 spec) | — |
| WR1 `WorkflowRecoveryAction` values | — | Yes — `workflow-resolver.ts` lines 50–54 |
| `faultToRespecAdvisoryType` | New doc-only field | — |
| `reIntakePacketTypeRecommended` | New doc-only field | — |
| Spec-change execution | Not authorized | Not authorized |
| Re-intake automation | Not authorized | Not authorized |
| Workflow transition execution | Not authorized | Not authorized |

---

## S5 — Source Verification Table

| Token | Source file | Line/section | Interface/type | Connector location | Decision |
| --- | --- | --- | --- | --- | --- |
| LHW5-T3 `scenarioType` values | `docs/reference/archive/CVF_LHW5_FAILURE_SIMULATION_SCENARIO_PACKET_CONNECTOR_SPEC_2026-05-27.md` | S3 `scenarioType` | LHW5-T3 packet | S2/S3 | ACCEPT |
| LHW5-T3 `wr1RecoveryAction` | same | S3 `wr1RecoveryAction` | LHW5-T3 packet | S3 `simulationWr1RecoveryAction` | ACCEPT |
| LHW5-T3 `lhw3TrendSignal` | same | S3 `lhw3TrendSignal` | LHW5-T3 packet | S3 | ACCEPT |
| LHW5-T3 `scenarioId` | same | S3 `scenarioId` | LHW5-T3 packet | S3 `sourceScenarioId` | ACCEPT |
| LHW5-T3 `boundaryStatement` | same | S3 `boundaryStatement` | LHW5-T3 packet | S3 invariant ref | ACCEPT |
| LHW5-T3 `scenarioPlanningOnly=true` | same | S3 `scenarioPlanningOnly` | LHW5-T3 invariant | S3 invariant | ACCEPT |
| LHW3-T3 `changeId` | `docs/reference/archive/CVF_LHW3_SPEC_CHANGE_WORKFLOW_PACKET_CONNECTOR_SPEC_2026-05-27.md` | S3 line 60 | LHW3-T3 packet | S3 `specChangePacketFields` | ACCEPT |
| LHW3-T3 `deltaDescription` | same | S3 line 63 | LHW3-T3 packet | S3 `specChangePacketFields` | ACCEPT |
| LHW3-T3 `affectedPhaseRange` | same | S3 line 64 | LHW3-T3 packet | S3 `specChangePacketFields` | ACCEPT |
| LHW3-T3 `changePacketStatus` values | same | S3 line 67 | LHW3-T3 packet | S3 `specChangePacketFields` | ACCEPT |
| LHW3-T2 `missing_context_clarification_packet` | `docs/reference/archive/CVF_LHW3_REQUEST_CLARIFICATION_RE_INTAKE_LOOP_CONNECTOR_SPEC_2026-05-27.md` | S2 table line 47 | LHW3-T2 clarification type | S3 `reIntakePacketTypeRecommended` | ACCEPT |
| LHW3-T2 `noisy_context_clarification_packet` | same | S2 table line 48 | LHW3-T2 clarification type | S3 `reIntakePacketTypeRecommended` | ACCEPT |
| LHW3-T2 `ambiguous_outcome_clarification_packet` | same | S2 table line 49 | LHW3-T2 clarification type | S3 `reIntakePacketTypeRecommended` | ACCEPT |
| LHW3-T2 `unmatched_request_clarification_packet` | same | S2 table line 50 | LHW3-T2 clarification type | S3 `reIntakePacketTypeRecommended` | ACCEPT |
| WR1 `WorkflowRecoveryAction` values | `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/lib/workflows/workflow-resolver.ts` | lines 50–54 | `WorkflowRecoveryAction` | S2/S3 `recommendedWr1RecoveryAction` | ACCEPT |
| `faultToRespecAdvisoryType` | N/A — new doc-only | S3 new fields | doc-only | S3 | ACCEPT |
| `reIntakePacketTypeRecommended` | N/A — new doc-only | S3 new fields | doc-only | S3 | ACCEPT |

## Claim Boundary

This connector normalizes the chain from failure simulation to spec-change and
re-intake recommendation. It does not claim spec-change execution, re-intake
automation, workflow transition execution, memory reinjection, receipt-envelope
extension, LHW5-T3/LHW3 runtime change, provider behavior change, public-sync
work, hosted readiness, production readiness, or public release readiness.
