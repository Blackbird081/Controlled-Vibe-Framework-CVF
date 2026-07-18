# CVF LHW9-T1 MCP Tool Approval Advisory Connector Spec

Memory class: FULL_RECORD

Status: CLOSED_PASS_BOUNDED

Contract version: `cvf.mcpToolApprovalAdvisory.lhw9.t1.v1`

docType: connector_spec

Date: 2026-05-28

---

## Purpose

This connector spec normalizes how W3 `ToolActionSurface='mcp_tool'` +
`ToolActionApprovalReadout.requiredEvidence`, TA1 `ToolActionApprovalState`,
and LHW6-T1 `bridgeAdvisoryType` are combined into an MCP tool approval
advisory packet. Closes the gap where no standard maps MCP tool surface ×
approval state × bridge advisory to a named `mcpApprovalAdvisoryType` with
explicit `approvalEvidenceRequired`.

LH1 triggers: `pancake-pos-mcp` (PARTIALLY_ABSORBED — reopen only for MCP
approval proof; no transport/runtime execution), `OpenAgentd` (PARTIALLY_ABSORBED
— reopen only for read-only tool runtime bridge design).

## Scope / Applies To

Documentation-only connector. Applies when a CVF session evaluates an MCP
tool action and needs a governance record naming the combined approval posture.
Does not apply to MCP transport, CLI execution, or tool re-execution.

---

## S1 — Purpose and Claim Boundary

**Gap addressed:** W3 classifies MCP tool actions under
`ToolActionSurface='mcp_tool'` and reports `requiredEvidence` and
`missingEvidence`; TA1 `ToolActionApprovalState` reports approval posture; LHW6-T1
`bridgeAdvisoryType` defines bridge advisory. No standard maps these three into
a named `mcpApprovalAdvisoryType` advisory packet.

**This connector does not execute MCP tool calls or bridge to any MCP
transport.** The MCP approval advisory packet is a governance planning record
only. `runtimeExecutionAuthorized=false` is invariant.

## S2 — MCP Tool × Approval State → Advisory Mapping

| W3 `ToolActionSurface` | TA1 `ToolActionApprovalState` | LHW6-T1 `bridgeAdvisoryType` | `mcpApprovalAdvisoryType` | `approvalEvidenceRequired` | Notes |
| --- | --- | --- | --- | --- | --- |
| `mcp_tool` | `not_required` | `advisory_allowed` | `mcp_advisory_clear` | none | No approval gate; MCP call may proceed per policy. |
| `mcp_tool` | `pending_approval` | `hold_for_approval` | `mcp_advisory_hold_pending` | `scope_declaration`, `target_declaration` | Approval pending; hold until operator approves. |
| `mcp_tool` | `satisfied_but_not_executable` | `advisory_allowed` | `mcp_advisory_satisfied_not_executable` | `audit_receipt` | Approval satisfied; blocked by policy for execution. |
| `mcp_tool` | `blocked_before_approval` | `blocked` | `mcp_advisory_blocked_pre_approval` | `scope_declaration`, `target_declaration`, `approval_evidence` | Blocked; cannot proceed without approval. |
| `mcp_tool` | `blocked_by_policy` | `blocked` | `mcp_advisory_blocked_by_policy` | `audit_receipt` | Policy block active; Auditor review required. |
| `mcp_tool` | `incomplete_approval` | `hold_for_approval` | `mcp_advisory_incomplete` | `trace_binding`, `approval_evidence` | Evidence incomplete; hold until evidence complete. |

Key invariant: Prior approval for an MCP tool action does not automatically
transfer across sessions or workflow restarts.

## S3 — MCP Approval Advisory Packet Minimum Fields

| Field | Source | Invariant | Notes |
| --- | --- | --- | --- |
| `actionId` | W3 `ToolActionTaxonomyRequest.actionId` | — | Links advisory to W3 action |
| `surface` | W3 `ToolActionSurface` | `='mcp_tool'` | Always `mcp_tool` for this connector |
| `approvalState` | TA1 `ToolActionApprovalState` | — | One of 6 TA1 values verbatim |
| `requiredEvidence` | W3 `ToolActionApprovalReadout.requiredEvidence` | — | List from W3 evaluation |
| `missingEvidence` | W3 `ToolActionApprovalReadout.missingEvidence` | — | List from W3 evaluation |
| `bridgeAdvisory` | LHW6-T1 `bridgeAdvisoryType` | — | One of 3 LHW6-T1 values verbatim |
| `mcpApprovalAdvisoryType` | N/A — new doc-only | — | Advisory type from S2 mapping |
| `approvalEvidenceRequired` | N/A — new doc-only | — | Evidence list from S2 mapping |
| `runtimeExecutionAuthorized` | N/A — new doc-only | `=false` | Connector invariant |

## S4 — Boundary Table

| Surface | Status | Notes |
| --- | --- | --- |
| W3 `ToolActionSurface` (5 values) | Runtime-proven | Source: `tool-action-taxonomy.ts` lines 9–14 |
| W3 `ToolActionApprovalReadout.requiredEvidence` | Runtime-proven | Source: `tool-action-taxonomy.ts` line 139 |
| W3 `ToolActionApprovalReadout.missingEvidence` | Runtime-proven | Source: `tool-action-taxonomy.ts` line 140 |
| W3 `runtimeExecutionAuthorized=false` | Runtime-proven | Source: `tool-action-taxonomy.ts` line 141 |
| TA1 `ToolActionApprovalState` (6 values) | Runtime-proven | Source: `tool-action-taxonomy.ts` lines 64–70 |
| LHW6-T1 `bridgeAdvisoryType` (3 values) | Doc-proven | Source: LHW6-T1 spec S4 field list |
| `mcpApprovalAdvisoryType` (new) | Doc-only | Defined in this connector |
| `approvalEvidenceRequired` (new) | Doc-only | Defined in this connector; advisory only |
| MCP transport or tool execution | Not authorized | `runtimeExecutionAuthorized=false` |

## S5 — Source Verification Table

| Claimed item | Source file | Verified line/section | Verified path or symbol | Owning interface/function/schema | Disposition |
| --- | --- | --- | --- | --- | --- |
| `ToolActionSurface` type | `governance/contracts/tool-action-taxonomy.ts` | lines 9–14 | `ToolActionSurface` | `ToolActionSurface` | ACCEPT |
| `local_tool` | `governance/contracts/tool-action-taxonomy.ts` | line 10 | `ToolActionSurface` value | `ToolActionSurface` | ACCEPT |
| `command_runtime` | `governance/contracts/tool-action-taxonomy.ts` | line 11 | `ToolActionSurface` value | `ToolActionSurface` | ACCEPT |
| `mcp_tool` | `governance/contracts/tool-action-taxonomy.ts` | line 12 | `ToolActionSurface` value | `ToolActionSurface` | ACCEPT |
| `database` | `governance/contracts/tool-action-taxonomy.ts` | line 13 | `ToolActionSurface` value | `ToolActionSurface` | ACCEPT |
| `capability_provider` | `governance/contracts/tool-action-taxonomy.ts` | line 14 | `ToolActionSurface` value | `ToolActionSurface` | ACCEPT |
| `ToolActionApprovalState` type | `governance/contracts/tool-action-taxonomy.ts` | lines 64–70 | `ToolActionApprovalState` | `ToolActionApprovalState` | ACCEPT |
| `not_required` | `governance/contracts/tool-action-taxonomy.ts` | line 65 | `ToolActionApprovalState` value | `ToolActionApprovalState` | ACCEPT |
| `pending_approval` | `governance/contracts/tool-action-taxonomy.ts` | line 66 | `ToolActionApprovalState` value | `ToolActionApprovalState` | ACCEPT |
| `satisfied_but_not_executable` | `governance/contracts/tool-action-taxonomy.ts` | line 67 | `ToolActionApprovalState` value | `ToolActionApprovalState` | ACCEPT |
| `blocked_before_approval` | `governance/contracts/tool-action-taxonomy.ts` | line 68 | `ToolActionApprovalState` value | `ToolActionApprovalState` | ACCEPT |
| `blocked_by_policy` | `governance/contracts/tool-action-taxonomy.ts` | line 69 | `ToolActionApprovalState` value | `ToolActionApprovalState` | ACCEPT |
| `incomplete_approval` | `governance/contracts/tool-action-taxonomy.ts` | line 70 | `ToolActionApprovalState` value | `ToolActionApprovalState` | ACCEPT |
| `ToolActionApprovalReadout.requiredEvidence` | `governance/contracts/tool-action-taxonomy.ts` | line 139 | `requiredEvidence` | `ToolActionApprovalReadout` | ACCEPT |
| `ToolActionApprovalReadout.missingEvidence` | `governance/contracts/tool-action-taxonomy.ts` | line 140 | `missingEvidence` | `ToolActionApprovalReadout` | ACCEPT |
| `ToolActionApprovalReadout.runtimeExecutionAuthorized=false` | `governance/contracts/tool-action-taxonomy.ts` | line 141 | `runtimeExecutionAuthorized` | `ToolActionApprovalReadout` | ACCEPT |
| `bridgeAdvisoryType` token | `docs/reference/CVF_LHW6_TOOL_RUNTIME_BRIDGE_ADVISORY_CONNECTOR_SPEC_2026-05-28.md` | S4 field list | `bridgeAdvisoryType` | LHW6-T1 advisory packet | ACCEPT |
| `advisory_allowed` | `docs/reference/CVF_LHW6_TOOL_RUNTIME_BRIDGE_ADVISORY_CONNECTOR_SPEC_2026-05-28.md` | S4 field list | `bridgeAdvisoryType` value | LHW6-T1 advisory packet | ACCEPT |
| `hold_for_approval` | `docs/reference/CVF_LHW6_TOOL_RUNTIME_BRIDGE_ADVISORY_CONNECTOR_SPEC_2026-05-28.md` | S4 field list | `bridgeAdvisoryType` value | LHW6-T1 advisory packet | ACCEPT |
| `blocked` (bridgeAdvisoryType) | `docs/reference/CVF_LHW6_TOOL_RUNTIME_BRIDGE_ADVISORY_CONNECTOR_SPEC_2026-05-28.md` | S4 field list | `bridgeAdvisoryType` value | LHW6-T1 advisory packet | ACCEPT |
| New doc-only `mcpApprovalAdvisoryType` | N/A — doc-only | S3 new fields | doc-only | MCP approval advisory packet | ACCEPT |
| New doc-only `approvalEvidenceRequired` | N/A — doc-only | S3 new fields | doc-only | MCP approval advisory packet | ACCEPT |

---

## Claim Boundary

`cvf.mcpToolApprovalAdvisory.lhw9.t1.v1` is a documentation-only connector.
It does not claim W3/TA1/LHW6-T1 runtime extension, MCP execution, MCP
transport, tool execution, memory injection, receipt envelope extension,
provider behavior, hosted readiness, production readiness, or public release
readiness.
