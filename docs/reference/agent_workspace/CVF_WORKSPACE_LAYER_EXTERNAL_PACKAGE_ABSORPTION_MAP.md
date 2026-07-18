# CVF Workspace Layer External Package Absorption Map

Memory class: FULL_RECORD

Status: ACTIVE_REFERENCE

docType: reference

## Scope / Applies-To

Applies to future CVF work that references the operator-copied external
workspace package, external MCP/workspace handoff material, or package-derived
state projection ideas.

Does not apply to direct runtime implementation, public-sync, provider proof,
or importing external package files into CVF source.

## Purpose

Record the CVF-owned absorption decision for the operator-copied external
workspace package:

`CVF_WORKSPACE_LAYER_PRODUCTION_HANDOFF_PACKAGE/`

The package is useful reference input. It is not CVF authority.

## Source Package Status

| Field | Disposition |
|---|---|
| Local source path | `CVF_WORKSPACE_LAYER_PRODUCTION_HANDOFF_PACKAGE/` |
| Source class | external-agent handoff package |
| CVF authority | `NOT_CVF_SOURCE` |
| Raw import | `REJECTED_WITH_REASON`: do not commit raw bundle, generated caches, or scaffold code into CVF core without a separate work order |
| Absorption mode | CVF-owned mapping and selective adaptation |
| Smoke check | local package smoke test passed in temp; not CVF runtime proof |

## Useful Patterns

| Pattern | Package source | CVF disposition |
|---|---|---|
| CVF Core remains authority; workspace state is projection. | `README.md`; `contracts/STATE_PROJECTION_CONTRACT.md` | `ABSORB`: already aligned with CVF Agent Workspace state topology. |
| Agents read projected state but do not write it directly. | `implementation/STATE_FILE_DEFINITIONS.md`; `contracts/WORKSPACE_RUNTIME_CONTRACT.md` | `ABSORB`: reinforce in future runtime work orders. |
| Proposal before execution for file/tool/policy mutations. | `contracts/WORKSPACE_MCP_CONTRACT.md`; `reference_implementation/cvf_workspace/runtime.py` | `ADAPT`: map to CVF work-order/AHB/autorun authority before implementation. |
| Dangerous action denylist. | `contracts/WORKSPACE_MCP_CONTRACT.md`; `reference_implementation/cvf_workspace/models.py` | `ADAPT`: use as MCP/workspace guard vocabulary, not as complete CVF policy. |
| Event stream is append-only and separate from receipts. | `implementation/WORKSPACE_EVENT_MODEL.md` | `ABSORB`: useful for future workspace runtime projection. |
| Five projected state files. | `implementation/STATE_FILE_DEFINITIONS.md`; `schemas/*.json` | `ADAPT`: map to existing `ACTIVE_AGENT_WORKSPACE_STATE` and future generated local views. |
| Dependency-free JSON-RPC stdio scaffold. | `reference_implementation/cvf_workspace/mcp_stdio_server.py` | `DEFER`: useful test scaffold only; production CVF MCP should use the official MCP SDK or existing MCP package. |
| Public/simple workflow enum. | `schemas/workflow_state.schema.json` | `REJECT_AS_AUTHORITY`: may be display vocabulary, not CVF internal workflow-chain source of truth. |

## CVF Mapping

Central two-layer standard:

`docs/reference/agent_workspace/CVF_WORKSPACE_TWO_LAYER_ARCHITECTURE_STANDARD.md`

| Package concept | CVF-owned mapping |
|---|---|
| `workspace_state.json` | workspace identity and active session projection under existing generated workspace state. |
| `workflow_state.json` | local view of roadmap/work-order/AHB/autorun state, not a hard-coded lifecycle enum. |
| `governance_state.json` | allowed/blocked action projection from CVF references and gates. |
| `agent_state.json` | AHB route, role pattern, commit owner, and agent workspace state item. |
| `evidence_state.json` | evidence/receipt/readiness projection tied to governed reviews and receipts. |
| `submit_proposal` | future MCP ingress to create a governed proposal/workspace item, not direct execution approval. |
| `request_transition` | future request to move a governed item between lanes, not a standalone workflow state change. |
| `receipt` | CVF receipt or completion evidence reference, not just local JSON output. |

## Two-Layer Absorption

| External package area | CVF layer | Disposition |
|---|---|---|
| `contracts/WORKSPACE_UI_CONTRACT.md`; `implementation/WORKSPACE_WEB_ARCHITECTURE.md`; local surface server | `CVF_WEB_WORKSPACE` | `ADAPT`: useful operator read-model and display-surface input, but not CVF authority or product implementation. |
| `contracts/WORKSPACE_RUNTIME_CONTRACT.md`; `contracts/WORKSPACE_MCP_CONTRACT.md`; `contracts/IDE_BRIDGE_CONTRACT.md`; MCP/CLI runbooks | `CVF_LOCAL_WORKSPACE_RUNTIME` | `ADAPT`: useful proposal, receipt, and non-bypass boundary input, but fresh GC-018 is required before runtime implementation. |
| Hard-coded lifecycle and package-local readiness wording | neither layer as authority | `REJECT_AS_AUTHORITY`: may inform display vocabulary or questions only. |

## EARC-T3A Pilot Absorption Result

Pilot packet:

`docs/reviews/CVF_EARC_T3A_EXTERNAL_RETURN_ABSORPTION_PILOT_WORKSPACE_LAYER_2026-06-18.md`

| Pilot item | Result |
|---|---|
| Projection-not-authority | `ABSORB`: keep as a core workspace principle. |
| State-first MCP and proposal-before-execution | `ADAPT`: future MCP/workspace work must bind this to AHB, autorun, receipts, and CVF Core authority. |
| Dangerous action non-bypass rule | `ADAPT`: useful guard vocabulary, not a complete policy engine. |
| Five projected state files | `ADAPT`: useful local view, not a replacement for generated CVF state aggregates. |
| `INTAKE -> DESIGN -> SPEC -> WORK_ORDER -> BUILD -> REVIEW -> FREEZE` | `REJECT_AS_AUTHORITY`: display vocabulary only. |
| Package smoke result | `NON_CANONICAL_ADVISORY`: package-local evidence only, not CVF runtime proof. |
| Production handoff wording | `BLOCKED_UNTIL_CVF_PROOF`: implementation requires explicit MCP/runtime authorization and fresh GC-018. |

Checker follow-up:

`EARC-T3B` may add a range-aware checker requiring the EARC-T3 Required
Absorption Table for changed external-return absorption reviews. T3A does not
implement that checker.

## Absorption Decision

The package strengthens CVF in three areas:

1. external-agent review context must distinguish public vocabulary from
   internal workflow-chain authority;
2. MCP/workspace tools should expose proposal/evidence/receipt state before
   executable mutation;
3. future workspace runtime projection should preserve event/receipt
   separation.

The package does not supersede:

- Agent Handoff Contract;
- agent workspace state topology;
- RTAD-T5 MCP Model Gateway boundary;
- autorun gates;
- public export disposition rules;
- active session state and next-move freshness.

## Claim Boundary

This map is a selective absorption record. It does not import the package,
authorize workspace runtime implementation, implement MCP tools, run providers,
public-sync, or claim production/public readiness.
