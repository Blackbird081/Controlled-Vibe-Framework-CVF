# CVF LHW9-T3 Integration Layer Packaging Connector Spec

Memory class: FULL_RECORD

Status: CLOSED_PASS_BOUNDED

Contract version: `cvf.integrationLayerPackaging.lhw9.t3.v1`

docType: connector_spec

Date: 2026-05-28

---

## Purpose

This connector spec normalizes how G1 `ExecutionIdentityDecision`
(`executionBoundary.boundary`, `cvfRole`, `authority.canExecute`), LHW6-T2
`onboardingClassification` (5 values), and LHW7-T1 `reEntryAdvisoryType`
(5 values) are combined into an integration layer packaging advisory packet.
Closes the gap where no standard maps execution boundary + onboarding
classification + re-entry advisory to a named `integrationLayerAdvisoryType`
with a concrete `onboardingStepRecommended` for a new integration's first
governance record.

LH1 triggers: `Review CVF_2.md` (PARTIALLY_ABSORBED — reopen for
integration-layer packaging after tool/MCP boundary proof), `De_xuat.md`
(PARTIALLY_ABSORBED — reopen for integration SDK/runtime readiness with
concrete user flow).

## Scope / Applies To

Documentation-only connector. Applies when a new integration (tool, MCP
client, or CLI adapter) is first registered in CVF governance context. Does
not apply to runtime integration execution, role taxonomy change, or RBAC
modification.

---

## S1 — Purpose and Claim Boundary

**Gap addressed:** G1 `executionBoundary.boundary` names the policy governing
the actor; LHW6-T2 `onboardingClassification` states how a tool/integration
is onboarded; LHW7-T1 `reEntryAdvisoryType` advises re-entry posture after
recovery. No standard maps these three into a named
`integrationLayerAdvisoryType` with a first `onboardingStepRecommended`.

**This connector does not execute integrations or change role taxonomy.**
`runtimeExecutionAuthorized=false` is invariant.

## S2 — Execution Boundary × Onboarding Classification → Integration Advisory Mapping

| G1 `executionBoundary.boundary` | G1 `authority.canExecute` | LHW6-T2 `onboardingClassification` | LHW7-T1 `reEntryAdvisoryType` | `integrationLayerAdvisoryType` | `onboardingStepRecommended` |
| --- | --- | --- | --- | --- | --- |
| `governed_pack_actor_policy` | `true` | `safe_first_use` | `safe_reentry` | `integration_layer_clear` | Proceed with governed pack execution; no additional onboarding gate. |
| `governed_pack_actor_policy` | `true` | `review_before_first_use` | `reapproval_required` | `integration_layer_review_required` | Route to Reviewer for first-use approval before pack execution. |
| `governed_pack_actor_policy` | `false` | `blocked_first_use` | `blocked_no_reentry` | `integration_layer_blocked` | Integration blocked; Orchestrator must resolve policy before onboarding. |
| `template_execution_policy` | `true` | `install_review_required` | `safe_reentry` | `integration_layer_install_review` | Complete install governance review before first execution. |
| `template_execution_policy` | `true` | `network_review_required` | `safe_reentry` | `integration_layer_network_review` | Complete network governance review before first execution. |
| `role_resolution_denied` | `false` | any | `escalated_no_reentry` | `integration_layer_role_denied` | Role resolution denied; escalate to Orchestrator for identity fix before onboarding. |

Key invariant: `integrationLayerAdvisoryType` is a first-governance-record
advisory only. The connector does not execute the onboarding step, modify role
assignments, or change RBAC policy.

## S3 — Integration Layer Packaging Advisory Packet Minimum Fields

| Field | Source | Invariant | Notes |
| --- | --- | --- | --- |
| `actorId` | G1 `ExecutionIdentityDecision.actorId` | — | Links advisory to actor |
| `executionBoundary` | G1 `executionBoundary.boundary` | — | One of 3 `ExecutionIdentityBoundary` values verbatim |
| `canExecute` | G1 `authority.canExecute` | — | Boolean from G1 |
| `onboardingClassification` | LHW6-T2 `onboardingClassification` | — | One of 5 values verbatim |
| `reEntryAdvisory` | LHW7-T1 `reEntryAdvisoryType` | — | One of 5 values verbatim |
| `integrationLayerAdvisoryType` | N/A — new doc-only | — | Advisory type from S2 mapping |
| `onboardingStepRecommended` | N/A — new doc-only | — | Plain-language first step |
| `runtimeExecutionAuthorized` | N/A — new doc-only | `=false` | Connector invariant |

## S4 — Boundary Table

| Surface | Status | Notes |
| --- | --- | --- |
| G1 `ExecutionIdentityBoundary` (3 values) | Runtime-proven | Source: `execution-identity.ts` lines 20–23 |
| G1 `authority.canExecute` | Runtime-proven | Source: `execution-identity.ts` line 35 |
| LHW6-T2 `onboardingClassification` (5 values) | Doc-proven | Source: LHW6-T2 spec S3 line 84 |
| LHW7-T1 `reEntryAdvisoryType` (5 values) | Doc-proven | Source: LHW7-T1 spec lines 110–111 |
| `integrationLayerAdvisoryType` (new) | Doc-only | Defined in this connector |
| `onboardingStepRecommended` (new) | Doc-only | Defined in this connector |
| Integration execution | Not authorized | `runtimeExecutionAuthorized=false` |
| Role taxonomy change or RBAC modification | Not authorized | `runtimeExecutionAuthorized=false` |

## S5 — Source Verification Table

| Claimed item | Source file | Verified line/section | Verified path or symbol | Owning interface/function/schema | Disposition |
| --- | --- | --- | --- | --- | --- |
| `ExecutionIdentityBoundary` type | `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/lib/execution-identity.ts` | lines 20–23 | `ExecutionIdentityBoundary` | `ExecutionIdentityBoundary` | ACCEPT |
| `governed_pack_actor_policy` | `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/lib/execution-identity.ts` | line 21 | `ExecutionIdentityBoundary` value | `ExecutionIdentityBoundary` | ACCEPT |
| `template_execution_policy` | `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/lib/execution-identity.ts` | line 22 | `ExecutionIdentityBoundary` value | `ExecutionIdentityBoundary` | ACCEPT |
| `role_resolution_denied` | `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/lib/execution-identity.ts` | line 23 | `ExecutionIdentityBoundary` value | `ExecutionIdentityBoundary` | ACCEPT |
| `executionBoundary.boundary` | `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/lib/execution-identity.ts` | line 45 | `executionBoundary.boundary` | `ExecutionIdentityDecision` | ACCEPT |
| `authority.canExecute` | `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/lib/execution-identity.ts` | line 35 | `authority.canExecute` | `ExecutionIdentityDecision` | ACCEPT |
| `safe_first_use` | `docs/reference/CVF_LHW6_CLI_TOOL_ONBOARDING_GOVERNANCE_CONNECTOR_SPEC_2026-05-28.md` | S3 line 84 | `onboardingClassification` value | LHW6-T2 packet | ACCEPT |
| `review_before_first_use` | `docs/reference/CVF_LHW6_CLI_TOOL_ONBOARDING_GOVERNANCE_CONNECTOR_SPEC_2026-05-28.md` | S3 line 84 | `onboardingClassification` value | LHW6-T2 packet | ACCEPT |
| `blocked_first_use` | `docs/reference/CVF_LHW6_CLI_TOOL_ONBOARDING_GOVERNANCE_CONNECTOR_SPEC_2026-05-28.md` | S3 line 84 | `onboardingClassification` value | LHW6-T2 packet | ACCEPT |
| `install_review_required` | `docs/reference/CVF_LHW6_CLI_TOOL_ONBOARDING_GOVERNANCE_CONNECTOR_SPEC_2026-05-28.md` | S3 line 84 | `onboardingClassification` value | LHW6-T2 packet | ACCEPT |
| `network_review_required` | `docs/reference/CVF_LHW6_CLI_TOOL_ONBOARDING_GOVERNANCE_CONNECTOR_SPEC_2026-05-28.md` | S3 line 84 | `onboardingClassification` value | LHW6-T2 packet | ACCEPT |
| `safe_reentry` | `docs/reference/CVF_LHW7_T1_WORKFLOW_RECOVERY_TOOL_REENTRY_CONNECTOR_SPEC_2026-05-28.md` | lines 110–111 | `reEntryAdvisoryType` value | LHW7-T1 packet | ACCEPT |
| `reapproval_required` | `docs/reference/CVF_LHW7_T1_WORKFLOW_RECOVERY_TOOL_REENTRY_CONNECTOR_SPEC_2026-05-28.md` | lines 110–111 | `reEntryAdvisoryType` value | LHW7-T1 packet | ACCEPT |
| `blocked_no_reentry` | `docs/reference/CVF_LHW7_T1_WORKFLOW_RECOVERY_TOOL_REENTRY_CONNECTOR_SPEC_2026-05-28.md` | lines 110–111 | `reEntryAdvisoryType` value | LHW7-T1 packet | ACCEPT |
| `blocked_pending_reviewer` | `docs/reference/CVF_LHW7_T1_WORKFLOW_RECOVERY_TOOL_REENTRY_CONNECTOR_SPEC_2026-05-28.md` | lines 110–111 | `reEntryAdvisoryType` value | LHW7-T1 packet | ACCEPT |
| `escalated_no_reentry` | `docs/reference/CVF_LHW7_T1_WORKFLOW_RECOVERY_TOOL_REENTRY_CONNECTOR_SPEC_2026-05-28.md` | lines 110–111 | `reEntryAdvisoryType` value | LHW7-T1 packet | ACCEPT |
| New doc-only `integrationLayerAdvisoryType` | N/A — doc-only | S3 new fields | doc-only | Integration layer packaging packet | ACCEPT |
| New doc-only `onboardingStepRecommended` | N/A — doc-only | S3 new fields | doc-only | Integration layer packaging packet | ACCEPT |

---

## Claim Boundary

`cvf.integrationLayerPackaging.lhw9.t3.v1` is a documentation-only connector.
It does not claim G1/LHW6-T2/LHW7-T1 runtime extension, integration execution,
role taxonomy change, RBAC modification, receipt envelope extension, provider
behavior, hosted readiness, production readiness, or public release readiness.
T3 completes the LHW9 wave; any further connector wave requires a fresh
roadmap and GC-018.
