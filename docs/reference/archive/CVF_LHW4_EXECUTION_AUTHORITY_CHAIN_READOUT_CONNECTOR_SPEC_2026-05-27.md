# CVF LHW4 Execution Authority Chain Readout Connector Spec

Memory class: FULL_RECORD

docType: reference

Contract version: `cvf.executionAuthorityChainReadout.lhw4.t2.v1`

Date: 2026-05-27

Status: CLOSED_PASS_BOUNDED

---

## Purpose

This connector defines the execution authority chain readout standard: how G1
execution identity, W3 tool action taxonomy, and TA1 approval readout are
combined into a single authority-chain packet that an Orchestrator can evaluate
before dispatching work to a role agent.

It is not a G1, W3, or TA1 runtime extension. It is not a new role taxonomy,
RBAC change, or execution authority grant. `runtimeExecutionAuthorized=false`
is preserved from W3 and TA1 boundaries throughout.

## Scope / Applies-To

Applies to future documentation, packet design, and implementation planning for
authority-chain readout across G1 execution identity, W3 tool action
classification, TA1 approval state, and MA1 role assignment surfaces.

Does not apply to runtime provider calls, new role taxonomy, RBAC enforcement,
receipt envelope changes, hosted readiness, production readiness, or public
release readiness.

## S1 — Purpose and Claim Boundary

This connector is a normative documentation standard binding G1 execution
identity fields → W3 tool action surface/side-effect/transport → TA1 approval
state → MA1 `## 4. Role Assignment` into a single authority-chain readout
packet readable by an Orchestrator before dispatching work to a role agent.

It closes the gap identified in LHW4-T1: the memory snapshot standard needs
an explicit authority-chain readout to show which actor/role/action approval
posture may request or consume a governed package, but no connector tied G1,
W3, and TA1 together for that purpose.

What this connector is not:

- Not a G1, W3, or TA1 runtime extension.
- Not a new role taxonomy or RBAC change.
- Not an execution authority grant.

Explicit statement: `runtimeExecutionAuthorized=false` is preserved from W3
and TA1 boundaries. The authority-chain readout packet is a governance advisory;
it does not grant execution authority or change actor permissions.

---

## S2 — G1 → W3 → TA1 → MA1 Authority Chain Field Mapping

Column definitions: `G1 field` | `W3 field / token` | `TA1 approvalState` |
`MA1 section` | `Authority chain signal` | `dispatchDecision`

| G1 field | W3 field / token | TA1 approvalState | MA1 section | Authority chain signal | dispatchDecision |
| --- | --- | --- | --- | --- | --- |
| `cvfRole=OPERATOR`, `decision=allowed` | any `surface`, `sideEffect=read_only` | `not_required` | `## 4. Role Assignment` R | Operator read action; no approval gate | `allowed` |
| `cvfRole=BUILDER`, `decision=allowed` | `surface=local_tool` or `command_runtime`, `sideEffect=local_write` | `pending_approval` | `## 4. Role Assignment` R, `## 8. Integration Decision` R | Builder action requires approval; hold for review before dispatch | `hold_for_approval` |
| `cvfRole=BUILDER`, `decision=allowed` | `surface=mcp_tool` or `database`, any mutating `sideEffect` | `blocked_by_policy` | `## 4. Role Assignment` R, `## 8. Integration Decision` R | Policy block; stop and record in MA1 `## 8` | `blocked` |
| `executionBoundary.boundary=role_resolution_denied` (any `cvfRole`, any `surface`) | any `surface`, any `sideEffect` | any | `## 4. Role Assignment` R, `## 8. Integration Decision` R | G1 denial overrides TA1 approval; dispatch blocked | `blocked` |
| `cvfRole=REVIEWER`, `decision=allowed` | `surface=capability_provider`, `sideEffect=read_only` | `satisfied_but_not_executable` | `## 4. Role Assignment` R, `## 8. Integration Decision` O | Capability approved but not yet executable; hold for authorized executor | `hold_for_approval` |
| `cvfRole=SERVICE_AGENT`, `decision=allowed` | `surface=local_tool` or `capability_provider`, `sideEffect=read_only` | `not_required` | `## 4. Role Assignment` R | Service token read; no approval gate required | `allowed` |

R = Required section; O = Optional / advisory section.

Use G1, W3, and TA1 field and token names verbatim as verified in S5. If any
name cannot be confirmed from source files, mark `BLOCKED_SOURCE_NOT_FOUND`
and stop.

---

## S3 — Authority Chain Packet Minimum Fields

Every authority-chain readout packet must contain the following fields. These
are documentation-only minimum requirements. They do not extend
`GovernanceEvidenceReceipt` or any existing receipt envelope type.
`runtimeExecutionAuthorized=false` is explicit.

- `chainId`: unique token for this readout (doc-only)
- `actorId`: from G1 `ExecutionIdentityDecision.actorId`
- `cvfRole`: from G1 `ExecutionIdentityDecision.cvfRole`
- `executionBoundary`: from G1 `ExecutionIdentityDecision.executionBoundary`
- `surface`: from W3 `ToolActionTaxonomyRequest.surface`
- `sideEffect`: from W3 `ToolActionTaxonomyRequest.sideEffect`
- `transport`: from W3 `ToolActionTaxonomyRequest.transport` when present
- `approvalState`: from TA1 `ToolActionApprovalReadout.approvalState`
- `runtimeExecutionAuthorized`: always `false`
- `dispatchDecision`: one of `allowed` | `hold_for_approval` | `blocked` (doc-only)
- `authorityChainSignal`: plain-language summary of the combined chain signal (doc-only)
- `ma1RoleAssignmentSection`: reference token for MA1 `## 4. Role Assignment` (doc-only)

---

## S4 — Runtime-Enforcement Boundary Table

| Behavior | Current status | Future path |
| --- | --- | --- |
| G1 execution identity resolution | Runtime (cvf-web route) | Stable |
| W3 tool action taxonomy classification | Runtime (`governance/contracts`) | Stable |
| TA1 approval state readout | Runtime (`governance/contracts`) | Stable |
| MA1 role assignment packet structure | Document standard (MA1) | Stable |
| Authority chain packet composition | Document-only | Future: authority chain validator |
| Dispatch gate enforcement | Document-only | Future: route-level authority gate |

No doc-only row is labeled Runtime. Composition and gate enforcement remain
advisory documentation only.

---

## S5 — Source Verification Table

| Claimed item | Source file | Verified line/section | Verified path or symbol | Owning interface/function/schema | Disposition |
| --- | --- | --- | --- | --- | --- |
| G1 `actorId`, `sessionRole`, `cvfRole`, `decision` | `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/lib/execution-identity.ts` | lines 27–29, 53 | `ExecutionIdentityDecision.actorId`, `.sessionRole`, `.cvfRole`, `.decision` | `ExecutionIdentityDecision` | ACCEPT |
| G1 `authority.canExecute`, `authority.allowedActorRoles` | `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/lib/execution-identity.ts` | lines 35, 38 | `ExecutionIdentityDecision.authority` | `ExecutionIdentityDecision` | ACCEPT |
| G1 `contextScope.scope` | `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/lib/execution-identity.ts` | lines 11–18, 40–43 | `ExecutionIdentityContextScope` / `ExecutionIdentityDecision.contextScope` | `ExecutionIdentityDecision` | ACCEPT |
| G1 `executionBoundary.boundary` values | `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/lib/execution-identity.ts` | lines 20–23, 44–47 | `ExecutionIdentityBoundary`: `governed_pack_actor_policy`, `template_execution_policy`, `role_resolution_denied` | `ExecutionIdentityDecision` | ACCEPT |
| G1 `receiptOwnership` | `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/lib/execution-identity.ts` | lines 48–52 | `ExecutionIdentityDecision.receiptOwnership` | `ExecutionIdentityDecision` | ACCEPT |
| `CVFRole` values | `EXTENSIONS/CVF_GUARD_CONTRACT/src/types.ts` | lines 35–44 | `OBSERVER`, `ANALYST`, `BUILDER`, `REVIEWER`, `GOVERNOR`, `HUMAN`, `AI_AGENT`, `OPERATOR`, `SERVICE_AGENT` | `CVFRole` | ACCEPT |
| RBAC → CVFRole mapping | `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/lib/execute-role-resolver.ts` | lines 34–40 | `owner/admin→OPERATOR`, `developer→BUILDER`, `reviewer→REVIEWER`, `viewer→OBSERVER`, service token→`SERVICE_AGENT` | `resolveExecutionCVFRole` | ACCEPT |
| W3 `surface` tokens | `governance/contracts/tool-action-taxonomy.ts` | lines 9–14 | `local_tool`, `command_runtime`, `mcp_tool`, `database`, `capability_provider` | `ToolActionSurface` | ACCEPT |
| W3 `sideEffect` tokens | `governance/contracts/tool-action-taxonomy.ts` | lines 16–31 | `read_only`, `local_write`, `workspace_mutation`, `external_mutation`, and others | `ToolActionSideEffect` | ACCEPT |
| W3 `transport` tokens | `governance/contracts/tool-action-taxonomy.ts` | line 43 | `local`, `stdio_mcp`, `remote_mcp`, `http`, `browser`, `database_connection` | `ToolTransport` | ACCEPT |
| W3 `runtimeExecutionAuthorized=false` | `governance/contracts/tool-action-taxonomy.ts` | lines 119, 141, 312 | `ToolActionTaxonomyEvaluation.runtimeExecutionAuthorized`, `ToolActionApprovalReadout.runtimeExecutionAuthorized` | `ToolActionTaxonomyEvaluation` / `ToolActionApprovalReadout` | ACCEPT |
| TA1 `approvalState` tokens | `governance/contracts/tool-action-taxonomy.ts` | lines 64–70 | `not_required`, `pending_approval`, `satisfied_but_not_executable`, `blocked_before_approval`, `blocked_by_policy`, `incomplete_approval` | `ToolActionApprovalState` | ACCEPT |
| MA1 `## 4. Role Assignment` | `docs/reference/CVF_INTERNAL_MULTI_AGENT_WORK_TRANSFER_PACKET_STANDARD_2026-05-26.md` | lines 92–102 | section `## 4. Role Assignment` | MA1 packet standard | ACCEPT |
| MA1 `## 8. Integration Decision` | `docs/reference/CVF_INTERNAL_MULTI_AGENT_WORK_TRANSFER_PACKET_STANDARD_2026-05-26.md` | lines 134–140 | section `## 8. Integration Decision` | MA1 packet standard | ACCEPT |

No `BLOCKED_SOURCE_NOT_FOUND` rows. All claimed items are ACCEPT.

---

## Claim Boundary

This connector is documentation-only. It does not claim G1, W3, or TA1 runtime
extension, new execution authority, new role taxonomy, RBAC change, receipt
envelope extension, provider behavior, live authority-chain validation,
hosted readiness, production readiness, or public release readiness.
