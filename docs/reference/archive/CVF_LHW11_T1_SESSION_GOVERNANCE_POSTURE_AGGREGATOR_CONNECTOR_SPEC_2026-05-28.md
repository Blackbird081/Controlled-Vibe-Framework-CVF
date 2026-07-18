# CVF LHW11-T1 Session Governance Posture Aggregator Connector Spec

Memory class: FULL_RECORD

Status: ACTIVE

docType: connector_spec

Date: 2026-05-28

---

## Purpose

This connector aggregates four prior LHW advisory type outputs into a single
`sessionGovernancePostureType` + `highestRiskAdvisory`. It closes the gap where
Orchestrators must read 4+ separate advisory dimensions to determine "what is
the overall governance posture of this session?"

## Scope / Applies To

**Applies to:** CVF session-continuity and roadmap steering surface.

Inputs and outputs are enumerated in S1/S3; row-level source evidence lives in
the S5 appendix.

---

## S1 — Purpose and Invariants

This connector aggregates four prior LHW advisory type outputs into a single
`sessionGovernancePostureType` + `highestRiskAdvisory`. It closes the gap where
Orchestrators must read 4+ separate advisory dimensions to determine "what is
the overall governance posture of this session?"

**Invariants:**

- This connector aggregates advisory outputs. It does not re-evaluate source
  surfaces or change their values.
- `runtimeExecutionAuthorized=false` — this connector produces documentation
  artifacts only; it does not claim runtime aggregation, enforcement, memory
  reinjection, receipt envelope extension, or provider behavior.

**Contract version:** `cvf.sessionGovernancePostureAggregator.lhw11.t1.v1`

**Input advisory types (all CLOSED_PASS_BOUNDED):**

- LHW10-T1 `transitionEnforcementAdvisoryType` (16 values)
- LHW10-T3 `providerHealthAdvisoryType` (24 values)
- LHW9-T1 `mcpApprovalAdvisoryType` (6 values)
- LHW8-T2 `authorityChainAdvisoryType` (4 values)

**Output fields:**

- `sessionGovernancePostureType`: one of `posture_clear`, `posture_hold`,
  `posture_blocked`
- `highestRiskAdvisory`: the specific advisory type value (from any of the 4
  inputs) that determines the final posture tier
- `advisoryCount`: count of active advisory inputs (1–4)
- `runtimeExecutionAuthorized`: `false` (invariant)


## S2 — Risk-Tier Grouping and Posture Derivation

To stay < 250 lines, this connector uses **risk-tier grouping** instead of
exhaustive combination rows. Each input advisory type value is mapped to one of
three risk tiers: `CLEAR`, `HOLD`, or `BLOCKED`. The final
`sessionGovernancePostureType` is derived from the worst tier across all 4
inputs.

### Risk Tier Definitions

- **CLEAR tier:** advisory values that allow forward progress without blocking
  or hold conditions
- **HOLD tier:** advisory values that suspend progress pending review, approval,
  or human intervention
- **BLOCKED tier:** advisory values that block or escalate, preventing any
  forward progress

### Posture Derivation Rule

- If any input advisory is in `BLOCKED` tier → `sessionGovernancePostureType =
  posture_blocked`
- Else if any input advisory is in `HOLD` tier → `sessionGovernancePostureType
  = posture_hold`
- Else all inputs are in `CLEAR` tier → `sessionGovernancePostureType =
  posture_clear`

`highestRiskAdvisory` is set to the specific advisory type value (from any of
the 4 inputs) that determines the final posture tier. If multiple advisories
share the worst tier, the first encountered in evaluation order (LHW10-T1,
LHW10-T3, LHW9-T1, LHW8-T2) is selected.


### LHW10-T1 `transitionEnforcementAdvisoryType` Risk Tier Mapping

| Advisory value | Risk tier | Notes |
| --- | --- | --- |
| `safe_transition_resume` | CLEAR | Safe transition; resume allowed |
| `transition_resume_with_reapproval` | HOLD | Resume allowed after re-approval |
| `no_transition_resume_allowed` | CLEAR | No transition requested; resume allowed |
| `hold_for_reviewer` | HOLD | Pending reviewer gate |
| `human_review_required` | HOLD | Pending human review |
| `transition_resume_hold_reviewer` | HOLD | Re-entry pending reviewer gate |
| `invalid_transition_hold_reviewer` | HOLD | Invalid transition; reviewer gate required |
| `no_transition_hold_reviewer` | HOLD | No transition; reviewer gate required |
| `deferred_gate_hold_reviewer` | HOLD | Deferred gate + reviewer gate |
| `deferred_gate_human_review` | HOLD | Deferred gate + human review |
| `no_transition_human_review` | HOLD | No transition; human review required |
| `invalid_transition_human_review` | HOLD | Invalid transition; human review required |
| `escalated_blocked` | BLOCKED | Escalated to governance; no transition allowed |
| `transition_resume_blocked` | BLOCKED | Re-entry blocked by prior tool bridge advisory |
| `invalid_transition_blocked` | BLOCKED | Invalid from current state; resume not allowed |
| `deferred_gate_resume_blocked` | BLOCKED | Deferred gate active; resume not allowed |


### LHW10-T3 `providerHealthAdvisoryType` Risk Tier Mapping

| Advisory value | Risk tier | Notes |
| --- | --- | --- |
| `provider_health_ready` | CLEAR | Provider ready; no action required |
| `provider_health_ready_needs_context` | CLEAR | Provider ready; benchmark needs context |
| `provider_health_ready_insufficient_evidence` | CLEAR | Provider ready; benchmark evidence insufficient |
| `provider_health_ready_mcp_incomplete` | CLEAR | Provider ready; MCP approval incomplete |
| `provider_health_ready_hold_mcp` | HOLD | Provider ready; hold for MCP approval |
| `provider_health_ready_mcp_blocked` | HOLD | Provider ready; MCP blocked by policy |
| `provider_health_missing_model` | HOLD | Provider or model not configured |
| `provider_health_missing_model_needs_context` | HOLD | Provider missing; benchmark needs context |
| `provider_health_missing_model_insufficient_evidence` | HOLD | Provider missing; benchmark evidence insufficient |
| `provider_health_unsupported_method` | HOLD | Method not supported by provider |
| `provider_health_unsupported_method_needs_context` | HOLD | Method unsupported; benchmark needs context |
| `provider_health_unsupported_method_insufficient_evidence` | HOLD | Method unsupported; benchmark evidence insufficient |
| `provider_health_fallback_available` | HOLD | Fallback available; consider fallback provider |
| `provider_health_fallback_available_needs_context` | HOLD | Fallback available; benchmark needs context |
| `provider_health_fallback_available_insufficient_evidence` | HOLD | Fallback available; benchmark evidence insufficient |
| `provider_health_fallback_unavailable` | BLOCKED | Fallback unavailable; no alternative provider |
| `provider_health_fallback_unavailable_needs_context` | BLOCKED | Fallback unavailable; benchmark needs context |
| `provider_health_fallback_unavailable_insufficient_evidence` | BLOCKED | Fallback unavailable; benchmark evidence insufficient |
| `provider_health_blocked_non_retryable` | BLOCKED | Provider blocked; non-retryable error |
| `provider_health_blocked_non_retryable_needs_context` | BLOCKED | Provider blocked; benchmark needs context |
| `provider_health_blocked_non_retryable_insufficient_evidence` | BLOCKED | Provider blocked; benchmark evidence insufficient |
| `provider_health_blocked_quota` | BLOCKED | Provider blocked; quota exceeded |
| `provider_health_blocked_quota_needs_context` | BLOCKED | Provider blocked; quota exceeded; benchmark needs context |
| `provider_health_blocked_quota_insufficient_evidence` | BLOCKED | Provider blocked; quota exceeded; benchmark evidence insufficient |
| `provider_health_unavailable` | BLOCKED | Provider unhealthy; suspend all pending MCP approvals |
| `provider_health_unavailable_needs_context` | BLOCKED | Provider unhealthy; benchmark needs context |
| `provider_health_unavailable_insufficient_evidence` | BLOCKED | Provider unhealthy; benchmark evidence insufficient |


### LHW9-T1 `mcpApprovalAdvisoryType` Risk Tier Mapping

| Advisory value | Risk tier | Notes |
| --- | --- | --- |
| `mcp_advisory_clear` | CLEAR | MCP approval clear; no action required |
| `mcp_advisory_incomplete` | CLEAR | MCP approval incomplete; advisory only |
| `mcp_advisory_hold_pending` | HOLD | MCP approval pending; hold for approval |
| `mcp_advisory_satisfied_not_executable` | HOLD | MCP approval satisfied but not executable |
| `mcp_advisory_blocked_pre_approval` | BLOCKED | MCP blocked before approval |
| `mcp_advisory_blocked_by_policy` | BLOCKED | MCP blocked by policy |

### LHW8-T2 `authorityChainAdvisoryType` Risk Tier Mapping

| Advisory value | Risk tier | Notes |
| --- | --- | --- |
| `authority_chain_clear` | CLEAR | Authority chain clear; no action required |
| `authority_chain_hold_for_approval` | HOLD | Authority chain hold; pending approval |
| `authority_chain_handoff_recommended` | HOLD | Authority chain handoff recommended |
| `authority_chain_blocked` | BLOCKED | Authority chain blocked |


## S3 — Session Governance Posture Aggregator Packet Minimum Fields

| Field | Source | Invariant | Notes |
| --- | --- | --- | --- |
| `contractVersion` | N/A — new doc-only | `=cvf.sessionGovernancePostureAggregator.lhw11.t1.v1` | Contract version |
| `sessionGovernancePostureType` | N/A — new doc-only | — | One of: `posture_clear`, `posture_hold`, `posture_blocked` |
| `highestRiskAdvisory` | N/A — new doc-only | — | Specific advisory type value that determines final posture tier |
| `advisoryCount` | N/A — new doc-only | — | Count of active advisory inputs (1–4) |
| `transitionEnforcementAdvisory` | LHW10-T1 `transitionEnforcementAdvisoryType` | — | One of 16 LHW10-T1 values verbatim |
| `providerHealthAdvisory` | LHW10-T3 `providerHealthAdvisoryType` | — | One of 24 LHW10-T3 values verbatim |
| `mcpApprovalAdvisory` | LHW9-T1 `mcpApprovalAdvisoryType` | — | One of 6 LHW9-T1 values verbatim |
| `authorityChainAdvisory` | LHW8-T2 `authorityChainAdvisoryType` | — | One of 4 LHW8-T2 values verbatim |
| `runtimeExecutionAuthorized` | N/A — new doc-only | `=false` | Connector invariant |


## S4 — Boundary Table

| Surface | Status | Notes |
| --- | --- | --- |
| LHW10-T1 `transitionEnforcementAdvisoryType` (16 values) | Doc-proven | Source: LHW10-T1 spec S2 lines 84–103 |
| LHW10-T3 `providerHealthAdvisoryType` (24 values) | Doc-proven | Source: LHW10-T3 spec S2 lines 80–115 |
| LHW9-T1 `mcpApprovalAdvisoryType` (6 values) | Doc-proven | Source: LHW9-T1 spec S2 mapping |
| LHW8-T2 `authorityChainAdvisoryType` (4 values) | Doc-proven | Source: LHW8-T2 spec S2 mapping |
| `sessionGovernancePostureType` (new) | Doc-only | Defined in this connector; no runtime source |
| `highestRiskAdvisory` (new) | Doc-only | Defined in this connector; no runtime source |
| `advisoryCount` (new) | Doc-only | Defined in this connector; no runtime source |
| Re-evaluation of source surfaces | Not authorized | This connector aggregates advisory outputs; it does not re-evaluate source surfaces or change their values |
| Runtime aggregation or enforcement | Not authorized | `runtimeExecutionAuthorized=false` |
| Memory reinjection | Not authorized | `runtimeExecutionAuthorized=false` |
| Receipt envelope extension | Not authorized | `runtimeExecutionAuthorized=false` |
| Provider behavior | Not authorized | `runtimeExecutionAuthorized=false` |


## S5 — Source Verification Table

Full row-level source verification is split into:

`docs/reference/CVF_LHW11_T1_SESSION_GOVERNANCE_POSTURE_AGGREGATOR_SOURCE_VERIFICATION_2026-05-29.md`

This keeps the primary connector spec compact while preserving the original
field/value verification evidence.

Minimum source families covered by the appendix:

- LHW10-T1 `transitionEnforcementAdvisoryType`
- LHW10-T3 `providerHealthAdvisoryType`
- LHW9-T1 `mcpApprovalAdvisoryType`
- LHW8-T2 `authorityChainAdvisoryType`
- new doc-only `sessionGovernancePostureType`, `highestRiskAdvisory`, and
  `advisoryCount`

---

## Claim Boundary

`cvf.sessionGovernancePostureAggregator.lhw11.t1.v1` is a documentation-only
connector. It aggregates advisory outputs from four prior LHW connector specs.
It does not claim re-evaluation of source surfaces, runtime aggregation,
enforcement, memory reinjection, receipt envelope extension, provider behavior,
hosted readiness, production readiness, or public release readiness.

---

## Verification

No runtime verification required. This is a documentation-only connector spec.

Static verification:

- All 4 input advisory type field names individually verified in S5
- All advisory values mapped to risk tiers in S2
- Primary spec remains under the line threshold after S5 appendix split
- `runtimeExecutionAuthorized=false` explicit in S1 and S3

