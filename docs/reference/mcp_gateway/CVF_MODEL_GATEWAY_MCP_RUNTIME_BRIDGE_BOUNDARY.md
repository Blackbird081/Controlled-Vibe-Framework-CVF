# CVF Model Gateway MCP Runtime Bridge Boundary

Status: ACTIVE_REFERENCE

Memory class: FULL_RECORD

docType: reference

Last updated: 2026-06-18

## Purpose

Define the bounded contract that future work must satisfy before exposing Model
Gateway execution through the MCP server.

This is a Central Core boundary. Local work orders may implement only a narrow
view of it after fresh GC-018 and source verification.

## Scope / Applies-To

Applies to future work orders, design packets, and implementation tranches that
propose an MCP tool, MCP server endpoint, or MCP-facing agent surface that calls
Model Gateway runtime contracts.

Does not apply to existing Model Gateway live harnesses that do not use MCP, or
to unrelated MCP guard tools that do not call Model Gateway.

## Scope / Target / Owner Boundary

Target: stable boundary guidance for MCP-to-Model-Gateway bridge work.

Owner boundary: this file is a reference contract. Runtime source remains owned
by `EXTENSIONS/CVF_MODEL_GATEWAY/` and MCP tool source remains owned by
`EXTENSIONS/CVF_ECO_v2.5_MCP_SERVER/`.

## Current Source Facts

| Fact | Source | Disposition |
|---|---|---|
| Model Gateway has a provider-neutral execution bridge. | `EXTENSIONS/CVF_MODEL_GATEWAY/src/provider-execution-bridge.ts` | ACCEPT |
| Model Gateway exposes `GatewayExecuteRequest`, `GatewayExecuteResponse`, and `GatewayErrorEnvelope`. | `EXTENSIONS/CVF_MODEL_GATEWAY/src/unified-gateway-interface-contract.ts` | ACCEPT |
| Model Gateway live proof harness calls `ProviderExecutionBridge.execute` through bounded provider adapters. | `EXTENSIONS/CVF_MODEL_GATEWAY/src/p4b-b-live-proof-harness.ts` | ACCEPT |
| MCP server exposes guard/runtime tools through `server.tool(...)`. | `EXTENSIONS/CVF_ECO_v2.5_MCP_SERVER/src/index.ts` | ACCEPT |
| Existing MCP D3 CLI bridge is command-whitelisted to `evaluate`, `status`, and `help`. | `EXTENSIONS/CVF_ECO_v2.5_MCP_SERVER/src/index.ts` | ACCEPT |
| Generic MCP adapter INT1 records advisory/enforce progression but does not authorize runtime execution. | `EXTENSIONS/CVF_ECO_v2.5_MCP_SERVER/src/tools/int1-connection-point-policy.ts` | ACCEPT |
| The MCP package README previously linked to a missing prepublic export surface path. | `EXTENSIONS/CVF_ECO_v2.5_MCP_SERVER/README.md` plus missing `docs/reference/CVF_PREPUBLIC_MCP_SERVER_EXPORT_SURFACE_2026-04-08.md` | ACCEPT |

## Boundary Decision

Any future MCP-to-Model-Gateway work must treat MCP as the agent/tool ingress
surface and Model Gateway as the provider execution surface.

The first executable MCP bridge, if authorized later, must be a single narrow
tool candidate such as `cvf_model_gateway_execute_preview`, not a broad provider
marketplace or multi-method gateway.

External repository patterns may inform this design only after CVF-owned
absorption. The useful Foundry pattern is MCP as a first-class agent ingress
over local state with a thin tool layer. CVF adapts that pattern by keeping
Model Gateway as execution authority and requiring CVF receipts, credential
boundaries, AHB role controls, and autorun gates.

The operator-copied workspace package reinforces proposal-before-execution and
event/receipt separation, but its hard-coded public/simple workflow enum is not
CVF internal workflow-chain authority. Future MCP work must cite
`docs/reference/external_agent_review/CVF_WORKFLOW_CHAIN_PUBLIC_REVIEW_CONTEXT.md`
when public lifecycle vocabulary appears in MCP/workspace context.

## Required Bridge Control Fields

Any future MCP Model Gateway work order must define these fields before
implementation:

| Field | Required disposition |
|---|---|
| MCP tool name | Exact tool id proposed for `server.tool(...)`. |
| MCP role boundary | Allowed caller roles and rejection behavior. |
| Model Gateway method | One of the source-verified Model Gateway methods, starting with `execute` unless separately authorized. |
| Request schema | Exact mapping to `GatewayExecuteRequest` or another source-verified contract. |
| Response schema | Exact mapping from `GatewayExecuteResponse` or `GatewayErrorEnvelope`. |
| Credential boundary | Secret values must stay behind Model Gateway `CredentialBoundary`; MCP must not accept or return raw keys. |
| Provider selection boundary | MCP may pass bounded routing preferences only when source-verified; it must not rank providers or bypass registry/routing guards. |
| Receipt boundary | Returned evidence must include a Model Gateway receipt reference or explicit N/A with reason. |
| Live-run boundary | Live provider calls require explicit operator authorization and live diagnostic discipline. |
| Public/export boundary | Public MCP package claims require separate public-sync authorization. |

## Allowed Future Implementation Shape

Allowed only after fresh GC-018:

1. Add one MCP tool that wraps a source-verified Model Gateway method.
2. Keep the tool request schema narrow and explicit.
3. Use Model Gateway routing, credential, health, quota, admission, and receipt
   controls as the execution authority.
4. Add focused MCP tests for accepted/rejected role, schema validation,
   secret-safety, and error-envelope mapping.
5. Run Model Gateway checks and MCP checks if the future work changes both
   packages.

## Forbidden Without Separate Authorization

- Broad MCP gateway implementation.
- Provider ranking, provider marketplace, or provider parity claim.
- Raw API-key input through MCP request bodies.
- Raw key, credential value, or authorization header in MCP output.
- Public package export or public README/catalog claim.
- Release-facing, production, hosted, external-facing, or public readiness
  claim.
- Runtime queue, scheduler, worker daemon, or agent workspace execution.
- New provider live campaign without explicit operator live-run authorization.
- Treating public/simple workflow labels as MCP authorization or runtime state.

## Bridge Readiness Ruling

| Question | Ruling |
|---|---|
| Is MCP related to Model Gateway? | Yes, MCP can become the agent/tool ingress surface for a Model Gateway call. |
| Is MCP required before Model Gateway runtime tests? | No, RTAD-T2 through RTAD-T4 already proved Model Gateway locally and through bounded live harnesses without MCP. |
| Is MCP implementation authorized now? | No. RTAD-T5 is boundary/design only. |
| What should happen next if operator wants MCP runtime? | Open a fresh GC-018 for one narrow MCP Model Gateway tool using this boundary as source authority. |

## Finding-To-Governance Learning Disposition

| Field | Disposition |
|---|---|
| Finding | MCP package README pointed at missing prepublic export-surface path. |
| Defect class | `RULE_GAP` |
| Learning lane | `DOCUMENTATION_ONLY_LEARNING` |
| Escalation state | `STANDARD_ADDED` |
| Governance action | Stable `docs/reference/mcp_gateway/README.md` front door created and package README linked to it. |
| Machine-check action | `DEFERRED_WITH_REASON`: existing foundation storage layout guard covers stable reference front doors; no new checker needed for this single stale link. |

## Epistemic Process Block

### Expected Result / Prediction

MCP was expected to be an ingress surface, while Model Gateway was expected to
remain the provider execution authority.

### Evidence Comparison

The source evidence matched that prediction: MCP currently registers tools
through `server.tool(...)`, and Model Gateway owns execute request/response
contracts and `ProviderExecutionBridge` execution.

### Contradiction Or Gap Disposition

The missing dated MCP export-surface link contradicted the expected stable
reference path. RTAD-T5 resolves that by creating the stable
`docs/reference/mcp_gateway/` front door and making the package README point to
it.

### Claim Update

The claim is limited to boundary/design readiness for future work-order
authoring. MCP implementation remains parked.

## Claim Boundary

This boundary is design and source-verification guidance only. It does not add
an MCP tool, mutate provider runtime behavior, run live providers, public-sync,
or claim MCP readiness.
