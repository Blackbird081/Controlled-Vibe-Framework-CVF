# CVF LHW15-T2 Workflow Resume/Recovery Advisory Connector Spec

Memory class: FULL_RECORD

Contract version: `cvf.workflowResumeRecoveryAdvisory.lhw15.t2.v1`

Status: CLOSED_PASS_BOUNDED

docType: connector_spec

Date: 2026-05-30

---

## Scope/Target/Owner Boundary

- **Scope:** Documentation-only connector spec. No code file. No EXTENSIONS/ change.
- **Target:** CVF governance agents consuming WR1 `workflowRecoveryReadout` and W1 `workflowStateMachineProjection` response fields.
- **Owner:** `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/lib/workflow-recovery-readout.ts` (WR1).
- **Applies-to:** Any agent or surface that needs to determine the safe resumption path for a paused or interrupted workflow.

## Purpose

Close the remaining LH1 trigger for the `Agent Harnesses` family (line 150) by
defining a workflow resume/recovery advisory type. W1 delivered
`workflowStateMachineProjection` (current state, deferred steps). WR1 delivered
`workflowRecoveryReadout` (`lastRestorableCheckpoint`, invalid/valid transition
classification). The remaining gap is a resumption proof advisory — how a paused
or interrupted workflow surfaces its resumption path to the next agent so that
the agent can decide whether to resume, restart, or escalate without guessing.

LH1 source: `docs/reference/CVF_LEGACY_HARVEST_CLOSEOUT_LEDGER_2026-05-25.md` line 150
W1 owner surface: `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/lib/workflows/`
WR1 owner surface: `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/lib/workflow-recovery-readout.ts`

Rejection label for this wave:
`Agent Harnesses` live harness execution is rejected from this LHW wave
(doc-only scope) — requires live route; eligible for separate live-proof
roadmap post-LHW.

---

## Advisory Type Definition

### `workflowResumeAdvisoryType`

Six values covering all resumption postures:

| Value | Meaning |
| --- | --- |
| `resume_from_checkpoint` | A valid `lastRestorableCheckpoint` exists; agent may resume from that step with prior receipt evidence |
| `restart_required` | No restorable checkpoint; state is non-recoverable; agent must restart the workflow from intake |
| `incomplete_evidence` | Checkpoint exists but required receipt or approval evidence is missing before resumption |
| `approval_gate_pending` | Workflow paused at a reviewer gate; resumption requires reviewer approval before next step |
| `escalation_required` | Recovery path exists but exceeds agent authority; escalate to Orchestrator before resuming |
| `no_recovery_path` | Workflow is in a terminal error state with no restart or resumption path available |

### `resumptionPath`

String field describing the next safe step and any evidence required before
resumption. Examples:

- `resume_from_checkpoint` → `"Resume from step 'design_review' (checkpoint rcpt-xxx). Attach prior governance receipt as parentReceiptId before re-dispatching."`
- `approval_gate_pending` → `"Workflow is holding at reviewer gate. Submit a REVIEWER-role approval via /api/execute before advancing to 'build_running'."`
- `no_recovery_path` → `"Workflow has reached a terminal error state. A new intake is required from the beginning."`

---

## Connector Advisory Shape

```typescript
// Advisory readout only — no runtime execution, no workflow state mutation.
interface WorkflowResumeRecoveryAdvisory {
  contractVersion: 'cvf.workflowResumeRecoveryAdvisory.lhw15.t2.v1';
  workflowResumeAdvisoryType: WorkflowResumeAdvisoryType;
  resumptionPath: string;
  lastRestorableCheckpoint: string | null; // Step ID from WR1 readout, if available
  requiredEvidenceTypes: string[];         // Receipt types needed before resumption
  runtimeExecutionAuthorized: false;       // invariant — advisory only
}

type WorkflowResumeAdvisoryType =
  | 'resume_from_checkpoint'
  | 'restart_required'
  | 'incomplete_evidence'
  | 'approval_gate_pending'
  | 'escalation_required'
  | 'no_recovery_path';
```

---

## Integration Guidance

This advisory type is designed to be consumed after reading a `workflowRecoveryReadout`
(WR1) response field. The consuming agent reads:

1. `workflowRecoveryReadout.lastRestorableCheckpoint` — determines if a checkpoint exists.
2. `workflowRecoveryReadout.transitionClassification` — determines if the transition from
   the last known state is valid, deferred, or escalation-required.
3. `workflowStateMachineProjection.currentPhase` — determines if a reviewer gate is active.

From these three inputs the agent selects one of the six `workflowResumeAdvisoryType` values
and constructs a `resumptionPath` string. No live provider call is required.

---

## Invariants

- `runtimeExecutionAuthorized: false` — advisory never authorizes workflow resumption.
- `rawMemoryReleased: false` — no memory promotion from this advisory.
- No code file in this connector spec.
- No EXTENSIONS/ directory change.
- No receipt envelope change.
- No public-sync.

---

## LH1 Trigger Closure

**Closed:** `Agent Harnesses` — LH1 line 150
**Status:** ABSORBED (doc-only connector scope)
**W1/WR1 absorption already covers:** checkpoint/restore projection, recovery action
classification, deferred step detection.
**This spec closes:** workflow resumption proof path advisory for agent-to-agent
handoff continuity.

---

## Claim Boundary

This spec is documentation-only. It does not claim:
- Automated workflow resumption execution
- Live provider call during recovery
- Hosted readiness or production readiness
- Public release readiness

## Core Principle

This connector is a documentation-only public standard unless a separate live
runtime roadmap and evidence packet explicitly promotes it.

## Allowed Actions

- Cite the connector as a schema-defined advisory or boundary standard.
- Use the connector to scope future implementation work.
- Link it from the public catalog with its bounded claim language.

## Forbidden Actions

- Do not claim runtime execution, hosted readiness, production readiness, or
  receipt-envelope mutation from this connector alone.
- Do not treat private provenance closure status as public runtime proof.

## Requirements

Public claims must cite this file together with
`docs/evidence/cvf-28-05-public-sync-capability-export-2026-05-30.md` and must
preserve the connector's documentation-only boundary.

## Exception Path

A stronger claim requires a separate governed roadmap, live or source-backed
verification, and a catalog update that names the new evidence path.

## Violation Conditions

It is a public-claim violation to use this connector as proof of live provider,
database, MCP approval, code-intelligence, hosted, or production behavior.

## Audit / Evidence Requirements

Evidence is limited to the public-sync source/reference paths and the curated
public evidence summary for this batch.

## Related / Owner Surface

- Owner: CVF public documentation surface.
- Related: `docs/evidence/cvf-28-05-public-sync-capability-export-2026-05-30.md`.
