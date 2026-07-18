# CVF LHW6 Tool Runtime Bridge Advisory Connector Spec

Memory class: FULL_RECORD

docType: reference

Contract version: `cvf.toolRuntimeBridgeAdvisoryConnector.lhw6.t1.v1`

Date: 2026-05-28

Status: CLOSED_PASS_BOUNDED

---

## Scope

Applies to: Orchestrator agents and documentation consumers for W3
`command_runtime` and `local_tool` surface tool calls. Documentation-only;
no runtime enforcement, code modification, or public sync.

## Purpose and Claim Boundary

This connector is a normative documentation standard binding W3 `ToolActionSurface`
(`local_tool` or `command_runtime`) + `ToolActionSideEffect` + optional `ToolTransport`
→ TA1 `ToolActionApprovalState` → LHW4-T2 `dispatchDecision` into a single
tool-runtime bridge advisory packet readable by an Orchestrator before dispatching
any tool call to a non-MCP runtime surface.

It closes the gap identified in the LH1 ledger `OpenAgentd` trigger: W3 classifies
`local_tool` and `command_runtime` surface actions and TA1 reports the six approval
states, but no connector standard defined the advisory packet that records what is
read-only-bridgeable versus blocked before any tool call is dispatched.

What this connector is not:

- Not a W3 or TA1 runtime extension.
- Not a tool executor, command bridge, or MCP client.
- Not a receipt envelope extension.

Explicit statement: `runtimeExecutionAuthorized=false` is preserved from W3 and TA1
boundaries. This connector does not execute tool calls. The advisory packet is a
non-blocking governance record.

---

## S2 — W3 Surface + SideEffect → TA1 Approval State → Dispatch Field Mapping

Column definitions: `W3 surface` | `W3 sideEffect` | `TA1 approvalState` |
`dispatchDecision` | `Tool bridge signal`

| W3 surface | W3 sideEffect | TA1 approvalState | dispatchDecision | Tool bridge signal |
| --- | --- | --- | --- | --- |
| `local_tool` | `read_only` | `not_required` | `allowed` | Read-only tool bridge satisfied; no approval gate; `runtimeExecutionAuthorized=false` |
| `local_tool` | `local_write` | `pending_approval` | `hold_for_approval` | Local write requires review approval before any tool dispatch |
| `command_runtime` | `workspace_mutation` | `blocked_by_policy` | `blocked` | Command runtime workspace mutation is policy-blocked; do not dispatch |
| `command_runtime` | `install` | `pending_approval` | `hold_for_approval` | Install is R3 explicit approval; advisory holds before any dispatch; `runtimeExecutionAuthorized=false` |
| `command_runtime` | `destructive` | `blocked_by_policy` | `blocked` | Destructive commands are blocked by W3 policy; `runtimeExecutionAuthorized=false` |
| `local_tool` | `network_egress` | `satisfied_but_not_executable` | `blocked` | Network egress approval satisfied but not yet executable in current boundary |

Use W3 and TA1 field and token names verbatim from source files. Rows map to the
minimum surface/sideEffect combinations most relevant to `local_tool` and
`command_runtime`; other W3 sideEffect values follow the same W3 → TA1 → dispatch
logic with the same `runtimeExecutionAuthorized=false` invariant.

---

## S3 — Tool Bridge Advisory Packet Minimum Fields

Every tool-bridge advisory packet must contain the following fields. These are
documentation-only minimum requirements. `runtimeExecutionAuthorized=false` is
invariant. The advisory packet does not extend `GovernanceEvidenceReceipt` or any
existing receipt envelope type.

- `bridgeAdvisoryId`: unique token for this advisory record (doc-only)
- `bridgeSurface`: from W3 `ToolActionSurface` (`local_tool` or `command_runtime`)
- `sideEffect`: from W3 `ToolActionSideEffect`
- `transport`: from W3 `ToolTransport` when present (`local`, `stdio_mcp`, `remote_mcp`, `http`, `browser`, `database_connection`)
- `approvalState`: from TA1 `ToolActionApprovalState`
- `runtimeExecutionAuthorized`: always `false` from W3/TA1 boundary
- `bridgeAdvisoryType`: one of `advisory_allowed` | `hold_for_approval` | `blocked` (doc-only)
- `toolBridgeSignal`: plain-language summary of the bridge advisory (doc-only)
- `toolBridgeBlocking`: always `false` (advisory is non-blocking; dispatch decision is separate)

---

## S4 — Runtime-Enforcement Boundary Table

| Behavior | Current status | Future path |
| --- | --- | --- |
| W3 tool action taxonomy classification | Runtime (`governance/contracts`) | Stable |
| TA1 tool action approval readout | Runtime (`governance/contracts`) | Stable |
| LHW4-T2 authority chain readout packet | Document-only (LHW4-T2) | Future: authority chain validator |
| Tool bridge advisory packet composition | Document-only | Future: tool bridge advisory engine |
| Local tool execution gate | Document-only | Future: route-level tool execution gate |

No doc-only row is labeled Runtime. Composition and gate enforcement remain advisory
documentation only.

---

## S5 — Source Verification Table

| Claimed item | Source file | Verified line/section | Verified path or symbol | Owning interface/function/schema | Disposition |
| --- | --- | --- | --- | --- | --- |
| W3 surface tokens `local_tool`, `command_runtime` | `governance/contracts/tool-action-taxonomy.ts` | lines 9–14 | `local_tool`, `command_runtime` | `ToolActionSurface` | ACCEPT |
| W3 sideEffect tokens `read_only`, `local_write`, `workspace_mutation`, `install`, `network_egress`, `destructive` | `governance/contracts/tool-action-taxonomy.ts` | lines 16–31 | `ToolActionSideEffect` | `ToolActionSideEffect` | ACCEPT |
| W3 `ToolTransport` values `local`, `stdio_mcp`, `remote_mcp`, `http`, `browser`, `database_connection` | `governance/contracts/tool-action-taxonomy.ts` | line 43 | `ToolTransport` | `ToolTransport` | ACCEPT |
| W3 `runtimeExecutionAuthorized=false` | `governance/contracts/tool-action-taxonomy.ts` | lines 119, 141 | `ToolActionTaxonomyEvaluation.runtimeExecutionAuthorized`, `ToolActionApprovalReadout.runtimeExecutionAuthorized` | `ToolActionTaxonomyEvaluation` / `ToolActionApprovalReadout` | ACCEPT |
| TA1 `approvalState` tokens `not_required`, `pending_approval`, `satisfied_but_not_executable`, `blocked_before_approval`, `blocked_by_policy`, `incomplete_approval` | `governance/contracts/tool-action-taxonomy.ts` | lines 64–70 | `ToolActionApprovalState` | `ToolActionApprovalState` | ACCEPT |
| LHW4-T2 `dispatchDecision` values `allowed`, `hold_for_approval`, `blocked` | `docs/reference/archive/CVF_LHW4_EXECUTION_AUTHORITY_CHAIN_READOUT_CONNECTOR_SPEC_2026-05-27.md` | S3 field list | `dispatchDecision` | LHW4-T2 authority chain packet | ACCEPT |
| Doc-only fields `bridgeAdvisoryId`, `bridgeSurface`, `bridgeAdvisoryType`, `toolBridgeSignal`, `toolBridgeBlocking` | N/A — new doc-only fields proposed by LHW6-T1 work order | work order S3 new doc-only fields block | doc-only; no runtime source | LHW6-T1 advisory packet | ACCEPT |

No `BLOCKED_SOURCE_NOT_FOUND` rows. All claimed runtime/source items are ACCEPT.

---

## Claim Boundary

This connector is documentation-only. It does not claim W3 or TA1 runtime extension,
tool execution, command bridging, MCP client creation, receipt envelope extension,
provider behavior, hosted readiness, production readiness, or public release readiness.
