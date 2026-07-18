# CVF LHW12-T3 Async Worker Lifecycle Boundary Connector Spec

Memory class: FULL_RECORD

docType: connector_spec

Contract version: `cvf.workerLifecycleBoundary.lhw12.t3.v1`

Date: 2026-05-29

Status: ACTIVE

---

## Purpose

This connector maps WR1 `WorkflowRecoveryAction` (4 values) × MA1 role lanes (4 values) × LHW10-T1 `transitionEnforcementAdvisoryType` into an async worker lifecycle boundary advisory.

## Scope / Applies To

Applies to: CVF async worker lifecycle boundary advisory surface. Target: documentation-only connector spec. No runtime enforcement.

---

## S1 — Purpose and Claim Boundary

### Purpose

This connector maps WR1 `WorkflowRecoveryAction` (4 values) × MA1 role lanes (4 values) × LHW10-T1 `transitionEnforcementAdvisoryType` into an async worker lifecycle boundary advisory.

The connector maps input combinations → a named `workerLifecycleAdvisoryType` + `spawnAuthorizationAdvisory` + `maxScopeAdvisory` plain-language planning guidance.

This closes the gap where the subagent spawn boundary is undefined (not allowed, not forbidden). It addresses the LH1 `deepagents` trigger: "bounded worker delegation proof; no autonomous queues."

### Claim Boundary

This connector is a documentation-only normalization artifact. It does not spawn subagents, execute autonomous worker queues, or authorize runtime worker spawning.

`runtimeExecutionAuthorized=false`

---

## S2 — Async Worker Lifecycle Boundary Mapping

Input: WR1 `WorkflowRecoveryAction` × MA1 role lanes × LHW10-T1 `transitionEnforcementAdvisoryType` → `workerLifecycleAdvisoryType` + `spawnAuthorizationAdvisory` + `maxScopeAdvisory`.

| `recoveryAction` | MA1 role lane | Enforcement tier | `workerLifecycleAdvisoryType` | `spawnAuthorizationAdvisory` | `maxScopeAdvisory` |
| --- | --- | --- | --- | --- | --- |
| `resume_from_checkpoint` | `Implementer` | `CLEAR` | `worker_eligible_bounded` | `advisory_allowed_with_scope_limit` | single workflow step; receipt required |
| `resume_from_checkpoint` | `Orchestrator` | `CLEAR` | `worker_eligible_orchestrator_scope` | `advisory_allowed` | full workflow sub-task; MA1 transfer required |
| `hold_for_reviewer_gate` | any | `HOLD` | `worker_suspended_pending_gate` | `advisory_suspended` | no sub-tasks until gate clears |
| `escalate_to_governance` | any | `BLOCKED` | `worker_blocked_governance_escalation` | `advisory_blocked` | no spawn; escalate to governance |
| `request_human_review` | any | any | `worker_suspended_human_review` | `advisory_deferred` | no spawn until human review completes |

For any combination mapping to `advisory_blocked`, the Orchestrator is advised to escalate to operator immediately.

---

## S3 — Async Worker Lifecycle Boundary Packet Minimum Fields

An async worker lifecycle boundary advisory packet must include:

- `contractVersion`: `cvf.workerLifecycleBoundary.lhw12.t3.v1`
- `recoveryAction`: from WR1 `WorkflowRecoveryAction` (4 values)
- `roleLane`: from MA1 (4 values)
- `transitionEnforcement`: from LHW10-T1
- `workerLifecycleAdvisoryType`: derived from S2 mapping (new doc-only field)
- `spawnAuthorizationAdvisory`: derived plain recommendation (new doc-only field)
- `maxScopeAdvisory`: derived max scope (new doc-only field)
- `runtimeExecutionAuthorized`: `false` (literal invariant)
- `boundaries`: array of explicit boundary statements

Example packet:

```json
{
  "contractVersion": "cvf.workerLifecycleBoundary.lhw12.t3.v1",
  "recoveryAction": "resume_from_checkpoint",
  "roleLane": "Implementer",
  "transitionEnforcement": "CLEAR",
  "workerLifecycleAdvisoryType": "worker_eligible_bounded",
  "spawnAuthorizationAdvisory": "advisory_allowed_with_scope_limit",
  "maxScopeAdvisory": "single workflow step; receipt required",
  "runtimeExecutionAuthorized": false,
  "boundaries": [
    "This connector does not spawn subagents or authorize autonomous execution.",
    "Spawn authorization advisory is advisory only — no runtime spawn gate is executed."
  ]
}
```

---

## S4 — Boundary Table

| Boundary | Rationale | Enforcement |
| --- | --- | --- |
| No subagent spawning | Doc-only advisory | `runtimeExecutionAuthorized=false` explicit |
| No autonomous queues | Invariant stated in S1 | S3 example and S4 boundaries |
| Bounded worker delegation | Planning-only | `workerLifecycleAdvisoryType` doc-only |

---

## S5 — Source Verification Table

| Claimed item | Source file | Verified line/section | Verified path or symbol | Owning interface/function/schema | Disposition |
| --- | --- | --- | --- | --- | --- |
| `WorkflowRecoveryAction` type | `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/lib/workflows/workflow-resolver.ts` | line 50 | `WorkflowRecoveryAction` | `WorkflowRecoveryAction` | ACCEPT |
| `resume_from_checkpoint` value | `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/lib/workflows/workflow-resolver.ts` | line 51 | `WorkflowRecoveryAction` | `WorkflowRecoveryAction` | ACCEPT |
| `hold_for_reviewer_gate` value | `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/lib/workflows/workflow-resolver.ts` | line 52 | `WorkflowRecoveryAction` | `WorkflowRecoveryAction` | ACCEPT |
| `escalate_to_governance` value | `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/lib/workflows/workflow-resolver.ts` | line 53 | `WorkflowRecoveryAction` | `WorkflowRecoveryAction` | ACCEPT |
| `request_human_review` value | `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/lib/workflows/workflow-resolver.ts` | line 54 | `WorkflowRecoveryAction` | `WorkflowRecoveryAction` | ACCEPT |
| `Orchestrator` role lane | `docs/reference/archive/CVF_INTERNAL_MULTI_AGENT_WORK_TRANSFER_PACKET_STANDARD_2026-05-26.md` | line 96 | `Orchestrator` | MA1 role lane | ACCEPT |
| `Implementer` role lane | `docs/reference/archive/CVF_INTERNAL_MULTI_AGENT_WORK_TRANSFER_PACKET_STANDARD_2026-05-26.md` | line 97 | `Implementer` | MA1 role lane | ACCEPT |
| `Reviewer` role lane | `docs/reference/archive/CVF_INTERNAL_MULTI_AGENT_WORK_TRANSFER_PACKET_STANDARD_2026-05-26.md` | line 98 | `Reviewer` | MA1 role lane | ACCEPT |
| `Auditor` role lane | `docs/reference/archive/CVF_INTERNAL_MULTI_AGENT_WORK_TRANSFER_PACKET_STANDARD_2026-05-26.md` | line 99 | `Auditor` | MA1 role lane | ACCEPT |
| `transitionEnforcementAdvisoryType` field | `docs/reference/CVF_LHW10_T1_WORKFLOW_TRANSITION_ENFORCEMENT_ADVISORY_CONNECTOR_SPEC_2026-05-28.md` | S3 line 137 | `transitionEnforcementAdvisoryType` | LHW10-T1 doc-only field | ACCEPT |
| `escalated_blocked` value | `docs/reference/CVF_LHW10_T1_WORKFLOW_TRANSITION_ENFORCEMENT_ADVISORY_CONNECTOR_SPEC_2026-05-28.md` | S2 lines 88–102 | `transitionEnforcementAdvisoryType` | LHW10-T1 S2 | ACCEPT |
| LH1 `deepagents` trigger | `docs/reference/archive/CVF_LEGACY_HARVEST_CLOSEOUT_LEDGER_2026-05-25.md` | line 156 | `deepagents` | LH1 CVF ADD ledger | ACCEPT |

## New Doc-Only Fields

| Field | Definition surface | Runtime/source status | Dispatch disposition |
| --- | --- | --- | --- |
| `workerLifecycleAdvisoryType` | S2 mapping and S3 packet | New documentation-only connector field | Defined by this connector spec; not source-verified as existing runtime |
| `spawnAuthorizationAdvisory` | S2 mapping and S3 packet | New documentation-only connector field | Defined by this connector spec; not source-verified as existing runtime |
| `maxScopeAdvisory` | S2 mapping and S3 packet | New documentation-only connector field | Defined by this connector spec; not source-verified as existing runtime |

---

## Claim Boundary

This connector is a documentation-only normalization artifact. It does not spawn subagents, execute autonomous worker queues, or authorize runtime worker spawning.

`runtimeExecutionAuthorized=false`
