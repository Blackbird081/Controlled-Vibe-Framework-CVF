# CVF LHW8-T2 Execution Identity Authority Chain Readout Connector Spec

Memory class: FULL_RECORD

Status: CLOSED_PASS_BOUNDED

Contract version: `cvf.executionIdentityAuthorityChainReadout.lhw8.t2.v1`

docType: connector_spec

Date: 2026-05-28

---

## Purpose

This connector spec normalizes how G1 `ExecutionIdentityDecision`, W3/TA1
`ToolActionApprovalState`, and MA1 role lanes are combined into an authority
chain readout advisory packet. Closes the gap where no standard maps execution
identity + tool approval state to a named `authorityChainAdvisoryType` and
MA1 role handoff recommendation.

LH1 triggers addressed: `Claude Kit` (PARTIALLY_ABSORBED — reopen for
concrete identity/runtime authority gap), `Review CVF_4.md` (PARTIALLY_ABSORBED
— reopen for structured runtime maturity review).

## Scope / Applies To

Documentation-only connector. Applies when a CVF session requires mapping an
actor's execution identity decision and tool action approval state to a named
authority chain advisory and a recommended MA1 role lane for handoff. Does not
apply to runtime role enforcement, RBAC changes, or new execution authority.

---

## S1 — Purpose and Claim Boundary

**Gap addressed:** G1 `ExecutionIdentityDecision.cvfRole` + `contextScope.scope`
+ `authority.canExecute` defines who the actor is and whether they can execute;
TA1 `ToolActionApprovalState` defines the approval posture of a tool action;
MA1 role lanes define how work is transferred across roles. No standard maps
these three into a named `authorityChainAdvisoryType` with a specific
`handoffRoleRecommendation`. Orchestrators infer this manually.

**This connector does not grant execution authority.** The authority chain
readout advisory packet is a non-blocking governance record naming the combined
authority posture and recommended MA1 role handoff. It does not create new
role taxonomy, change RBAC, extend G1/W3/MA1 runtime behavior, or lift any
invariant.

**Invariants:**

- `runtimeExecutionAuthorized=false`

## S2 — Execution Identity × Approval State → Authority Chain Mapping

| G1 `authority.canExecute` | G1 `contextScope.scope` | TA1 `ToolActionApprovalState` | `authorityChainAdvisoryType` | `handoffRoleRecommendation` | Notes |
| --- | --- | --- | --- | --- | --- |
| `true` | `operator_workspace` | `not_required` | `authority_chain_clear` | `Implementer` | Actor authorized; no tool approval needed; direct implementation. |
| `true` | `operator_workspace` | `pending_approval` | `authority_chain_hold_for_approval` | `Reviewer` | Actor authorized; approval pending; route to Reviewer for approval decision. |
| `true` | `builder_workspace` | `satisfied_but_not_executable` | `authority_chain_satisfied_not_executable` | `Orchestrator` | Approval satisfied; execution blocked by policy; Orchestrator must resolve policy constraint. |
| `true` | `review_workspace` | `incomplete_approval` | `authority_chain_incomplete` | `Reviewer` | Actor authorized; approval evidence incomplete; Reviewer required. |
| `false` | any | `blocked_before_approval` | `authority_chain_blocked_pre_approval` | `Orchestrator` | Actor denied; no approval path; escalate to Orchestrator. |
| `false` | any | `blocked_by_policy` | `authority_chain_blocked_by_policy` | `Auditor` | Actor denied; policy block active; route to Auditor for policy review. |
| `true` | any | `not_required` | `authority_chain_clear` | `Implementer` | General clear path for any authorized actor with no approval requirement. |

Key invariant: G1 `executionBoundary.boundary` governs the policy applied.
`role_resolution_denied` always maps to `authority_chain_blocked_pre_approval`
regardless of `ToolActionApprovalState`.

## S3 — Authority Chain Readout Packet Minimum Fields

| Field | Source | Invariant | Notes |
| --- | --- | --- | --- |
| `actorId` | G1 `ExecutionIdentityDecision.actorId` | — | Links advisory to actor |
| `cvfRole` | G1 `ExecutionIdentityDecision.cvfRole` | — | Resolved CVFRole |
| `contextScope` | G1 `ExecutionIdentityDecision.contextScope.scope` | — | One of 7 `ExecutionIdentityContextScope` values |
| `canExecute` | G1 `ExecutionIdentityDecision.authority.canExecute` | — | Boolean from G1 |
| `executionBoundary` | G1 `ExecutionIdentityDecision.executionBoundary.boundary` | — | One of 3 `ExecutionIdentityBoundary` values |
| `toolApprovalState` | TA1 `ToolActionApprovalState` | — | One of 6 TA1 values verbatim |
| `authorityChainAdvisoryType` | N/A — new doc-only | — | Advisory type from S2 mapping |
| `handoffRoleRecommendation` | N/A — new doc-only | — | One of: `Orchestrator`, `Implementer`, `Reviewer`, `Auditor` |
| `runtimeExecutionAuthorized` | N/A — new doc-only | `=false` | Connector invariant |

## S4 — Boundary Table

| Surface | Status | Notes |
| --- | --- | --- |
| G1 `ExecutionIdentityDecision` | Runtime-proven | Source: `execution-identity.ts` lines 25–55 |
| G1 `ExecutionIdentityContextScope` (7 values) | Runtime-proven | Source: `execution-identity.ts` lines 11–18 |
| G1 `ExecutionIdentityBoundary` (3 values) | Runtime-proven | Source: `execution-identity.ts` lines 20–23 |
| TA1 `ToolActionApprovalState` (6 values) | Runtime-proven | Source: `tool-action-taxonomy.ts` lines 64–70 |
| MA1 role lanes (`Orchestrator`, `Implementer`, `Reviewer`, `Auditor`) | Doc-proven | Source: MA1 standard section ## 4 |
| `authorityChainAdvisoryType` (new) | Doc-only | Defined in this connector; no runtime source |
| `handoffRoleRecommendation` (new) | Doc-only | Defined in this connector; no runtime source |
| New role taxonomy or RBAC change | Not authorized | `runtimeExecutionAuthorized=false` |
| Execution authority extension | Not authorized | `runtimeExecutionAuthorized=false` |

## S5 — Source Verification Table

| Claimed item | Source file | Verified line/section | Verified path or symbol | Owning interface/function/schema | Disposition |
| --- | --- | --- | --- | --- | --- |
| `ExecutionIdentityDecision` interface | `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/lib/execution-identity.ts` | lines 25–55 | `ExecutionIdentityDecision` | `ExecutionIdentityDecision` | ACCEPT |
| `ExecutionIdentityDecision.cvfRole` | `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/lib/execution-identity.ts` | line 29 | `cvfRole` | `ExecutionIdentityDecision` | ACCEPT |
| `ExecutionIdentityDecision.authority.canExecute` | `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/lib/execution-identity.ts` | line 35 | `authority.canExecute` | `ExecutionIdentityDecision` | ACCEPT |
| `ExecutionIdentityContextScope` type | `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/lib/execution-identity.ts` | lines 11–18 | `ExecutionIdentityContextScope` | `ExecutionIdentityContextScope` | ACCEPT |
| `operator_workspace` | `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/lib/execution-identity.ts` | line 12 | `ExecutionIdentityContextScope` value | `ExecutionIdentityContextScope` | ACCEPT |
| `builder_workspace` | `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/lib/execution-identity.ts` | line 13 | `ExecutionIdentityContextScope` value | `ExecutionIdentityContextScope` | ACCEPT |
| `review_workspace` | `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/lib/execution-identity.ts` | line 14 | `ExecutionIdentityContextScope` value | `ExecutionIdentityContextScope` | ACCEPT |
| `ExecutionIdentityBoundary` type | `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/lib/execution-identity.ts` | lines 20–23 | `ExecutionIdentityBoundary` | `ExecutionIdentityBoundary` | ACCEPT |
| `executionBoundary.boundary` | `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/lib/execution-identity.ts` | line 45 | `executionBoundary.boundary` | `ExecutionIdentityDecision` | ACCEPT |
| `ToolActionApprovalState` type | `governance/contracts/tool-action-taxonomy.ts` | lines 64–70 | `ToolActionApprovalState` | `ToolActionApprovalState` | ACCEPT |
| `not_required` | `governance/contracts/tool-action-taxonomy.ts` | line 65 | `ToolActionApprovalState` value | `ToolActionApprovalState` | ACCEPT |
| `pending_approval` | `governance/contracts/tool-action-taxonomy.ts` | line 66 | `ToolActionApprovalState` value | `ToolActionApprovalState` | ACCEPT |
| `satisfied_but_not_executable` | `governance/contracts/tool-action-taxonomy.ts` | line 67 | `ToolActionApprovalState` value | `ToolActionApprovalState` | ACCEPT |
| `blocked_before_approval` | `governance/contracts/tool-action-taxonomy.ts` | line 68 | `ToolActionApprovalState` value | `ToolActionApprovalState` | ACCEPT |
| `blocked_by_policy` | `governance/contracts/tool-action-taxonomy.ts` | line 69 | `ToolActionApprovalState` value | `ToolActionApprovalState` | ACCEPT |
| `incomplete_approval` | `governance/contracts/tool-action-taxonomy.ts` | line 70 | `ToolActionApprovalState` value | `ToolActionApprovalState` | ACCEPT |
| MA1 `Orchestrator` role lane | `docs/reference/archive/CVF_INTERNAL_MULTI_AGENT_WORK_TRANSFER_PACKET_STANDARD_2026-05-26.md` | section `## 4. Role Assignment` | `Orchestrator` | MA1 role lane | ACCEPT |
| MA1 `Implementer` role lane | `docs/reference/archive/CVF_INTERNAL_MULTI_AGENT_WORK_TRANSFER_PACKET_STANDARD_2026-05-26.md` | section `## 4. Role Assignment` | `Implementer` | MA1 role lane | ACCEPT |
| MA1 `Reviewer` role lane | `docs/reference/archive/CVF_INTERNAL_MULTI_AGENT_WORK_TRANSFER_PACKET_STANDARD_2026-05-26.md` | section `## 4. Role Assignment` | `Reviewer` | MA1 role lane | ACCEPT |
| MA1 `Auditor` role lane | `docs/reference/archive/CVF_INTERNAL_MULTI_AGENT_WORK_TRANSFER_PACKET_STANDARD_2026-05-26.md` | section `## 4. Role Assignment` | `Auditor` | MA1 role lane | ACCEPT |
| New doc-only `authorityChainAdvisoryType` | N/A — doc-only | S3 new fields | doc-only | Authority chain readout packet | ACCEPT |
| New doc-only `handoffRoleRecommendation` | N/A — doc-only | S3 new fields | doc-only | Authority chain readout packet | ACCEPT |

---

## Claim Boundary

`cvf.executionIdentityAuthorityChainReadout.lhw8.t2.v1` is a documentation-only
connector. It does not claim G1/W3/TA1/MA1 runtime extension, new execution
authority, new role taxonomy, RBAC change, tool execution, memory injection,
receipt envelope extension, provider behavior, hosted readiness, production
readiness, or public release readiness.
