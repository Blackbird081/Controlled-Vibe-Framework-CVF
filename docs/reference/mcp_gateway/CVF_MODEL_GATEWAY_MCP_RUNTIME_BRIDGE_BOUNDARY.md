# CVF Model Gateway MCP Runtime Bridge Boundary

Status: ACTIVE_REFERENCE

Memory class: FULL_RECORD

docType: reference

Last updated: 2026-08-24

## Purpose

Define the bounded contract that MCP-to-Model-Gateway bridge work must satisfy.
RFR-R3 implemented the first bounded tool, `cvf_model_gateway_execute`, gated
by mandatory native CVF admission; this reference now records that bounded
factual state rather than a future-only proposal.

This is a Central Core boundary. Local work orders may extend it only after
fresh GC-018 and source verification.

## Scope / Applies-To

Applies to the existing bounded `cvf_model_gateway_execute` tool and to any
future work order, design packet, or implementation tranche that proposes an
additional MCP tool, MCP server endpoint, or MCP-facing agent surface that
calls Model Gateway runtime contracts.

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
| `cvf_model_gateway_execute` requires the server-owned native `GuardRuntimeEngine` to return `ALLOW` before an injected `ModelGatewayExecutorPort` is ever called; MCP caller input cannot supply, select, or override that decision. | `EXTENSIONS/CVF_ECO_v2.5_MCP_SERVER/src/tools/model-gateway-execute.ts`; `EXTENSIONS/CVF_ECO_v2.5_MCP_SERVER/src/index.ts` | ACCEPT |
| The registered tool covers native ALLOW, BLOCK, and ESCALATE; a hermetic `ProviderExecutionBridge` composition proof separately covers ALLOW and BLOCK with zero live provider calls. | `EXTENSIONS/CVF_ECO_v2.5_MCP_SERVER/src/tools/model-gateway-execute.test.ts`; `EXTENSIONS/CVF_ECO_v2.5_MCP_SERVER/src/tools/model-gateway-composition-proof.test.ts` | ACCEPT |

## Boundary Decision

MCP-to-Model-Gateway work treats MCP as the agent/tool ingress surface and
Model Gateway as the provider execution surface. The bounded executable
bridge is `cvf_model_gateway_execute`, gated by mandatory native CVF
admission at the MCP boundary; it is not a broad provider marketplace or
multi-method gateway. Any additional MCP-to-Model-Gateway tool remains
future work requiring its own fresh GC-018.

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

## Implemented Bounded Shape

`cvf_model_gateway_execute` implements this bounded shape:

1. One MCP tool wraps the injected `ModelGatewayExecutorPort.execute` method;
   a hermetic composition proof additionally wires a real
   `ProviderExecutionBridge`.
2. The tool request schema is narrow and explicit; it carries no caller policy
   or decision field.
3. Mandatory native CVF admission through the server-owned `GuardRuntimeEngine`
   gates every request before the injected executor is called; Model Gateway
   routing, credential, health, quota, and receipt controls remain the
   downstream provider-execution authority.
4. Focused MCP tests cover accepted/rejected role, schema validation,
   secret-safety, error-envelope mapping, and the native admission matrix
   (missing/throwing/malformed/trace-mismatched/BLOCK/ESCALATE/ALLOW).
5. The MCP package suite and TypeScript build remain green; the composition
   proof imports Model Gateway source directly and asserts zero live provider
   calls. No separate Model Gateway package-suite claim is made by RFR-R3.

## Allowed Future Implementation Shape

Allowed only after fresh GC-018:

1. Add another MCP tool that wraps a source-verified Model Gateway method,
   following the same mandatory native-admission-before-executor shape.
2. Keep the tool request schema narrow and explicit.
3. Use Model Gateway routing, credential, health, quota, admission, and receipt
   controls as the downstream execution authority.
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
| Is MCP related to Model Gateway? | Yes, MCP is the agent/tool ingress surface for `cvf_model_gateway_execute`. |
| Is MCP required before Model Gateway runtime tests? | No, RTAD-T2 through RTAD-T4 already proved Model Gateway locally and through bounded live harnesses without MCP. |
| Is a bounded MCP tool implemented now? | Yes. RFR-R3 implemented `cvf_model_gateway_execute` with mandatory native CVF admission and local/hermetic proof only; no live provider call, deployment, or public claim is made. |
| What should happen next for another MCP-Model-Gateway tool or for live/production readiness? | Open a fresh GC-018 using this boundary as source authority; live-provider or production claims separately require the canonical live governance proof standard. |

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

### RTAD-T5 Expected Result / Prediction (historical)

MCP was expected to be an ingress surface, while Model Gateway was expected to
remain the provider execution authority.

### RTAD-T5 Evidence Comparison (historical)

The source evidence matched that prediction: MCP currently registers tools
through `server.tool(...)`, and Model Gateway owns execute request/response
contracts and `ProviderExecutionBridge` execution.

### RTAD-T5 Contradiction Or Gap Disposition (historical)

The missing dated MCP export-surface link contradicted the expected stable
reference path. RTAD-T5 resolves that by creating the stable
`docs/reference/mcp_gateway/` front door and making the package README point to
it.

### RTAD-T5 Claim Update (historical)

At RTAD-T5 authoring, the claim was limited to boundary/design readiness for
future work-order authoring, and MCP implementation was parked. RFR-R3
subsequently implemented the first bounded tool; see the RFR-R3 epistemic
entry below for the current state.

### RFR-R3 Native MCP Admission (2026-08-24)

#### Expected Result / Prediction

`cvf_model_gateway_execute` could close the caller-policy bypass named by
governed finding F8 by requiring the existing native MCP `GuardRuntimeEngine`
before the existing injected executor, without changing Model Gateway
production source.

#### Evidence Comparison

Source inspection and focused/full/build proof confirm the tool schema no
longer accepts a caller policy field, `executeModelGatewayAdapter` evaluates
native admission before any executor call, non-ALLOW and invalid admission
paths call the executor zero times, and a hermetic `ProviderExecutionBridge`
composition proof exercises the same invariant with zero live provider calls.

#### Contradiction Or Gap Disposition

No further owner gap was found. The behavioral contradiction RTAD-T5 flagged
as future work -- an injected executor trusting caller policy -- is resolved by
native admission gating at the MCP boundary.

#### Claim Update

CVF now has a bounded, locally proven `cvf_model_gateway_execute` tool. This
does not claim live/provider behavior, deployment, public export, or
production readiness; those require separate source-verified authority.

## Claim Boundary

This boundary is design, source-verification, and bounded-implementation
guidance for `cvf_model_gateway_execute`. It does not mutate Model Gateway
provider runtime behavior, run live providers, public-sync, or claim
deployment/production readiness.
