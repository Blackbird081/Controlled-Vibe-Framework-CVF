# CVF LHW1 Product Skill Pack Workflow Connector Spec

Memory class: FULL_RECORD

docType: reference

Status: ACTIVE

Contract version: `cvf.productSkillPackWorkflowConnector.lhw1.t1.v1`

Date: 2026-05-27

Authority: `docs/work_orders/CVF_WO_LHW1_T1_PRODUCT_SKILL_PACK_WORKFLOW_CONNECTOR_2026-05-27.md`

Examples: `docs/reference/CVF_LHW1_PRODUCT_SKILL_PACK_WORKFLOW_CONNECTOR_EXAMPLES_2026-05-27.md`

---

## Purpose

**What the connector is.**

A canonical CVF record that turns a certified product skill pack into a
non-coder workflow chain. It binds skill pack metadata, an ordered workflow
spec, execution policy, review checklist, receipt schema, and failure recovery
into one readable record. A non-coder or an agent can read this record to
understand what phases exist, which roles are responsible, how progress is
checkpointed, and what evidence is required before the chain is complete.

**What it is not.**

This connector is not a runtime scheduler, not a live provider call, and not
a memory reinjection mechanism. It does not add a new receipt envelope schema,
modify any TypeScript or Python file, or claim production, hosted, or public
release readiness. It is a document standard that narrows future implementation
scope rather than opening it.

## Scope

Applies to all CVF certified skill packs registered in
`governance/registries/cvf-certified-skill-pack-registry.json`. This spec is
the canonical connector standard for LHW1-T1; all example records must conform
to it.

---

## Section 2 — Required Fields: Skill Pack Metadata

| Field | Type | Description |
| --- | --- | --- |
| `packId` | string | Unique identifier matching the certified registry key |
| `packName` | string | Human-readable English name |
| `packVersion` | string | Semver string (e.g. `1.0.0`) |
| `outcomeFamily` | string | Top-level outcome domain (e.g. `product`, `marketing`, `operations`) |
| `certificationStatus` | enum | `certified \| experimental \| deprecated` |
| `nonCoderSummary` | string | One sentence describing what a non-coder gets from completing this workflow |

---

## Section 3 — Required Fields: Workflow Spec

| Field | Type | Description |
| --- | --- | --- |
| `workflowId` | string | Unique workflow identifier (defaults to `packId`) |
| `phases` | list | Ordered phases; each phase has `name`, `role`, `inputs`, `outputs`, `successCriteria` |
| `phaseTransitions` | list | Valid `from → to` pairs using W1 vocabulary |
| `recoveryCheckpoint` | string | Phase that can be restored if interrupted (maps to WR1 `lastRestorableCheckpoint`) |

**W1 phase vocabulary:**
`intake_pending → design_ready → build_running → review_pending → freeze_ready → completed`

**Phase object shape:**

- `name` — string, one of the W1 phase names above
- `role` — string, MA1 role lane (Orchestrator / Implementer / Reviewer / Auditor / Integrator)
- `inputs` — list of strings describing what must be present to enter this phase
- `outputs` — list of strings describing what must be produced to exit this phase
- `successCriteria` — string, the single condition that marks this phase complete

---

## Section 4 — Required Fields: Execution Policy

| Field | Type | Description |
| --- | --- | --- |
| `maxRiskLevel` | enum | `R0 \| R1 \| R2 \| R3` |
| `requiresLiveProvider` | boolean | Whether a live provider call is needed to complete the workflow |
| `requiresReviewerGate` | boolean | Whether a reviewer gate must be satisfied |
| `reviewerGatePhase` | string | Phase at which the reviewer gate is enforced (required when `requiresReviewerGate: true`) |
| `blockedActions` | list | Action classes that cannot execute within this workflow, drawn from W3/TA1 vocabulary |

**W3/TA1 blocked-action vocabulary:**
`tool_execution`, `mcp_call`, `database_mutation`, `raw_memory_reinjection`,
`external_skill_import`, `credential_access`

---

## Section 5 — Required Fields: Review Checklist

| Field | Type | Description |
| --- | --- | --- |
| `reviewerRoles` | list | MA1 role lanes that must approve before `freeze_ready` (Orchestrator, Reviewer, Auditor) |
| `dissentHandling` | enum | `hold_for_resolution \| escalate_to_orchestrator \| record_and_defer` |
| `evidenceRequired` | list | Minimum evidence items that must be confirmed before marking `freeze_ready` |

---

## Section 6 — Required Fields: Receipt Schema

| Field | Type | Description |
| --- | --- | --- |
| `receiptRequired` | boolean | Whether a governance evidence receipt is required to close the workflow |
| `receiptFields` | list | Fields expected in the receipt, using existing `GovernanceEvidenceReceipt` field names |
| `canReinject` | boolean | **Must be hardcoded `false`**. Receipt content must never be reinjected into a live execution path. |

**Applicable `GovernanceEvidenceReceipt` field names:**
`receiptId`, `traceId`, `provider`, `model`, `phase`, `riskLevel`, `riskValid`,
`approvalRequired`, `humanReviewRequired`, `workflowState`, `contractVersion`

---

## Section 7 — Required Fields: Failure Recovery

| Field | Type | Description |
| --- | --- | --- |
| `failureClasses` | list | Expected failure classes from V3 `ExecutionDiagnosticClass` vocabulary |
| `recoveryActions` | map | Per failure class: `retry \| escalate \| hold \| abort` |
| `userVisibleMessage` | map | Per failure class: non-technical message pattern for non-coders |

**Standard failure class table:**

| Failure class | Default recovery | User-visible message pattern |
| --- | --- | --- |
| `provider_auth_error` | escalate | "We could not connect to the AI provider. Please check your credentials." |
| `context_validation_error` | hold | "Your request is missing required information. Please complete the highlighted fields." |
| `risk_gate_block` | hold | "This request needs human review before we can continue. A reviewer has been notified." |
| `reviewer_gate_hold` | hold | "Waiting for reviewer approval. No action is needed from you right now." |
| `timeout_transient` | retry | "The request took too long. We will try again automatically." |
| `spec_validation_error` | hold | "The workflow spec could not be validated. Please contact support." |

---

## Section 8 — Mapping from Web Template / Spec Export Surfaces

This section describes how the current cvf-web template selector and spec
export surfaces map to connector fields. No cvf-web file is modified by this
spec.

**Fields a non-coder fills via the UI**

When a non-coder selects a template in the web UI (e.g. "Product Brief"), this
determines `packId` and `workflowId`. The user-entered task description and
context populate the `inputs` list for the `intake_pending` phase. The desired
output type determines the `outcomeFamily` display label shown to the user.

**Fields populated automatically from the skill pack registry**

`packVersion`, `certificationStatus`, `maxRiskLevel`, `requiresLiveProvider`,
and `blockedActions` are sourced from the certified skill pack registry entry
and the static pack policy. The non-coder does not configure these manually.
`packName` and `nonCoderSummary` are also registry-supplied; the UI surfaces
them as read-only context.

**Fields requiring governance review before population**

`requiresReviewerGate` and `reviewerGatePhase` must be confirmed by a Reviewer
or Auditor before the workflow chain is dispatched. They must not be overridden
to `false` by the non-coder UI alone if the pack `riskLevel` is R2 or higher.
`evidenceRequired` items must be verified as satisfied by an Orchestrator or
Auditor before `freeze_ready` is marked.

The Surface 1 English spec export produces a copy-ready CVF Execution Spec that
provides intake `inputs` and `nonCoderSummary` context. It does not
auto-populate reviewer gate fields or evidence confirmation.

---

## Claim Boundary

This spec is a documentation artifact only. It does not claim runtime workflow
enforcement, external skill ingestion, MCP/tool action execution, memory
reinjection, hosted readiness, production readiness, or public release
readiness. Contract version `cvf.productSkillPackWorkflowConnector.lhw1.t1.v1`.
