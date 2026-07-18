# CVF LHW14-T3 Noncoder Clarification and Recovery Advisory Connector Spec

Memory class: FULL_RECORD

Status: ACTIVE

Wave: LHW14 (T3 ACTIVE; T1+T2 CLOSED_PASS_BOUNDED)

docType: connector_spec

Date: 2026-05-29

---

## Purpose

This connector defines a documentation-only advisory that helps non-technical
operators recover from ambiguous requests or stalled workflows. It normalizes
the combined posture of C8 `ProductSkillPackSelectionStatus`, CB1
`missingSignals`, and WR1 `WorkflowRecoveryAction` (4 values) into a named
`noncoderClarificationAdvisoryType` and plain-language `clarificationNextStep`.

## Scope / Applies To

Applies to LHW14-T3 noncoder clarification and recovery advisory. Target owner
surface: documentation-only connector specs and noncoder operator planning
records. It does not change runtime source, provider behavior, receipt envelopes,
pack selection execution, recovery dispatch, or RBAC authorization.

---

## S1 — Purpose and Gap Citation

Source gap: LH1 `Human System Harness` PARTIALLY_ABSORBED trigger (line 160) —
"Reopen for noncoder request clarification or workflow recovery proof."
C8 `ProductSkillPackSelectionStatus` tells whether a certified pack was
selected. CB1 `missingSignals` records which context signals are absent.
WR1 `WorkflowRecoveryAction` (4 values) names the recommended recovery action.
No connector maps these three surfaces into a named clarification advisory
guiding non-technical operators on what clarification is needed or what
recovery step to take.

Without this connector, non-technical operators must interpret raw pack
selection status, missing signals, and recovery action labels — inconsistent
across sessions and producing friction for noncoder adoption.

This connector normalizes the clarification posture into a machine-readable
advisory vocabulary. It does NOT execute pack selection or trigger recovery
actions. The clarification advisory is a governance planning record.
`runtimeExecutionAuthorized=false`.

Invariant: `runtimeExecutionAuthorized=false`.

Authority chain:
- LHW14 roadmap: `docs/roadmaps/CVF_LHW14_WORKFLOW_CONNECTOR_WAVE14_ROADMAP_2026-05-29.md`
- LHW14 GC-018: `docs/baselines/CVF_GC018_LHW14_WORKFLOW_CONNECTOR_WAVE14_2026-05-29.md`
- WR1 source: `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/lib/workflows/workflow-resolver.ts` lines 50–54
- LHW12-T2 spec: `docs/reference/CVF_LHW12_T2_OUTCOME_PACK_TAXONOMY_GROUPING_CONNECTOR_SPEC_2026-05-29.md`
- LH1 ledger: `docs/reference/archive/CVF_LEGACY_HARVEST_CLOSEOUT_LEDGER_2026-05-25.md` — `Human System Harness` trigger at line 160
- T1 gate: `docs/reviews/CVF_LHW14_T1_AGENT_MEMORY_CAPTURE_PACKAGING_ADVISORY_CONNECTOR_COMPLETION_2026-05-29.md` CLOSED_PASS_BOUNDED
- T2 gate: `docs/reviews/CVF_LHW14_T2_SPEC_CHANGE_WORKFLOW_ADVISORY_CONNECTOR_COMPLETION_2026-05-29.md` CLOSED_PASS_BOUNDED

## S2 — Pack Selection + Recovery → Clarification Advisory Mapping

This connector maps C8 `ProductSkillPackSelectionStatus` × CB1 `missingSignals`
× WR1 `WorkflowRecoveryAction` → `noncoderClarificationAdvisoryType` +
`clarificationNextStep`.

`ProductSkillPackSelectionStatus` values are `selected` and
`no_certified_pack_match` from C8/LHW12-T2. `WorkflowRecoveryAction` values
are `resume_from_checkpoint`, `hold_for_reviewer_gate`,
`escalate_to_governance`, and `request_human_review` from WR1
(`workflow-resolver.ts` lines 50–54).

| `ProductSkillPackSelectionStatus` | `missingSignals` | `WorkflowRecoveryAction` | `noncoderClarificationAdvisoryType` | `clarificationNextStep` |
| --- | --- | --- | --- | --- |
| `selected` | empty | `resume_from_checkpoint` | `clarification_proceed` | Proceed with selected pack; workflow resumed from checkpoint |
| `selected` | non-empty | `hold_for_reviewer_gate` | `clarification_provide_signals` | Provide missing context signals before proceeding |
| `no_certified_pack_match` | any | `request_human_review` | `clarification_describe_goal` | Describe goal in plain language; human review required to select pack |
| `selected` | any | `escalate_to_governance` | `clarification_governance_hold` | Workflow held by governance; contact operator for resolution |
| `no_certified_pack_match` | non-empty | `escalate_to_governance` | `clarification_full_restart` | Request is too ambiguous; restart with clearer description and/or different pack |

Key invariant: "This connector does not execute pack selection or trigger
recovery actions. The clarification advisory is a governance planning record.
`runtimeExecutionAuthorized=false`."

## S3 — Clarification Advisory Packet Minimum Fields

All fields are documentation-only advisory fields.

| Field | Source | Invariant | Notes |
| --- | --- | --- | --- |
| `packSelectionStatus` | C8 `ProductSkillPackSelectionStatus` | verbatim from C8 | `selected` or `no_certified_pack_match` |
| `missingSignals` | CB1 `missingSignals` | from LHW12-T2 CB1 | Array of missing context signal labels; empty if all signals present |
| `workflowRecoveryAction` | WR1 `WorkflowRecoveryAction` | verbatim from WR1 | One of 4 WR1 values |
| `noncoderClarificationAdvisoryType` | N/A — new doc-only | — | One of 5 clarification advisory values from S2 |
| `clarificationNextStep` | N/A — new doc-only | — | Plain-language next step from S2 |
| `runtimeExecutionAuthorized` | N/A — new doc-only | `=false` | Connector invariant |

## S4 — Boundary Table

| Surface | Status | Notes |
| --- | --- | --- |
| C8 `ProductSkillPackSelectionStatus` | Doc-only | Source: C8/LHW12-T2 S3; `selected` / `no_certified_pack_match` |
| CB1 `missingSignals` | Doc-only | Source: LHW12-T2 S3 `contextSignalsNeeded` reference |
| WR1 `WorkflowRecoveryAction` (4 values) | Runtime-proven | Source: `workflow-resolver.ts` lines 50–54 |
| `noncoderClarificationAdvisoryType` (new) | Doc-only | Defined in this connector; no runtime source |
| `clarificationNextStep` (new) | Doc-only | Defined in this connector; no runtime source |
| Pack selection execution | Not authorized | `runtimeExecutionAuthorized=false` |
| Recovery action dispatch | Not authorized | Advisory only |
| RBAC or role taxonomy change | Not authorized | No role or auth claim |

## S5 — Source Verification Table

| Claimed item | Source file | Verified line/section | Verified path or symbol | Owning interface/function/schema | Disposition |
| --- | --- | --- | --- | --- | --- |
| `WorkflowRecoveryAction` type | `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/lib/workflows/workflow-resolver.ts` | lines 50–54 | `WorkflowRecoveryAction` | `workflow-resolver.ts` | ACCEPT |
| `resume_from_checkpoint` | `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/lib/workflows/workflow-resolver.ts` | line 51 | `WorkflowRecoveryAction` value | `workflow-resolver.ts` | ACCEPT |
| `hold_for_reviewer_gate` | `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/lib/workflows/workflow-resolver.ts` | line 52 | `WorkflowRecoveryAction` value | `workflow-resolver.ts` | ACCEPT |
| `escalate_to_governance` | `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/lib/workflows/workflow-resolver.ts` | line 53 | `WorkflowRecoveryAction` value | `workflow-resolver.ts` | ACCEPT |
| `request_human_review` | `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/lib/workflows/workflow-resolver.ts` | line 54 | `WorkflowRecoveryAction` value | `workflow-resolver.ts` | ACCEPT |
| `ProductSkillPackSelectionStatus` field | `docs/reference/CVF_LHW12_T2_OUTCOME_PACK_TAXONOMY_GROUPING_CONNECTOR_SPEC_2026-05-29.md` | S3 fields | `ProductSkillPackSelectionStatus` | LHW12-T2 doc-only field | ACCEPT |
| `selected` | `docs/reference/CVF_LHW12_T2_OUTCOME_PACK_TAXONOMY_GROUPING_CONNECTOR_SPEC_2026-05-29.md` | S2 mapping table | `ProductSkillPackSelectionStatus` value | LHW12-T2 S2 | ACCEPT |
| `no_certified_pack_match` | `docs/reference/CVF_LHW12_T2_OUTCOME_PACK_TAXONOMY_GROUPING_CONNECTOR_SPEC_2026-05-29.md` | S2 mapping table | `ProductSkillPackSelectionStatus` value | LHW12-T2 S2 | ACCEPT |
| `missingSignals` field | `docs/reference/CVF_LHW12_T2_OUTCOME_PACK_TAXONOMY_GROUPING_CONNECTOR_SPEC_2026-05-29.md` | S3 `contextSignalsNeeded` reference | `missingSignals` | CB1/LHW12-T2 | ACCEPT |
| LH1 `Human System Harness` trigger | `docs/reference/archive/CVF_LEGACY_HARVEST_CLOSEOUT_LEDGER_2026-05-25.md` | line 160 | `Human System Harness` | LH1 CVF ADD ledger | ACCEPT |

---

## Claim Boundary

`cvf.noncoderClarificationRecoveryAdvisory.lhw14.t3.v1` is a documentation-only
connector. It does not claim pack selection execution, recovery action dispatch,
RBAC or role taxonomy changes, receipt envelope extension, provider behavior,
hosted readiness, production readiness, or public release readiness.
