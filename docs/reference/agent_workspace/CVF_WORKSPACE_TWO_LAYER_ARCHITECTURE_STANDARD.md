# CVF Workspace Two-Layer Architecture Standard

Memory class: FULL_RECORD

Status: ACTIVE_STANDARD

docType: reference

## Purpose

Define the CVF-native split between the human-facing Web Workspace and the
agent-facing Local Workspace Runtime. This standard absorbs the useful
two-surface lesson from the external workspace package without copying that
package as authority.

## Scope / Target / Owner Boundary

Target: future work that designs, describes, builds, or upgrades CVF workspace
surfaces, especially CVF Web operator views and local agent runtime/MCP/CLI
controls.

Owner boundary: this standard defines architecture and terminology. It does
not build CVF Web UI, implement MCP tools, mutate runtime queues, run providers,
public-sync, import raw external package files, or claim production/public
readiness.

## Source Authority

| Source | Role |
|---|---|
| `docs/reference/agent_workspace/README.md` | stable workspace front door |
| `docs/reference/agent_workspace/CVF_AGENT_WORKSPACE_OPERATOR_VIEW_PLAN.md` | operator-facing read model precedent |
| `docs/reference/agent_workspace/CVF_AGENT_WORKSPACE_RUNTIME_EXPANSION_READINESS_CONTRACT.md` | runtime/MCP boundary precedent |
| `docs/reference/agent_workspace/CVF_WORKSPACE_LAYER_EXTERNAL_PACKAGE_ABSORPTION_MAP.md` | selective absorption map for external workspace package |
| `docs/reviews/CVF_EARC_T3A_EXTERNAL_RETURN_ABSORPTION_PILOT_WORKSPACE_LAYER_2026-06-18.md` | governed absorption table and claim boundary |
| `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/docs/reference/CVF_W112_WEB_GOVERNANCE_SURFACE_INVENTORY_2026-04-22.md` | existing CVF Web governance-surface inventory |

## Canonical Two-Layer Split

| Layer | Primary user | Role | Source of truth | Must not do |
|---|---|---|---|---|
| CVF Web Workspace | non-coder operator | view work, assign or approve work, track status, inspect evidence, receive results | CVF Core state, governed reviews, receipts, active session state, workspace read models | bypass CVF Core, mutate runtime state directly, claim provider/runtime proof without receipts |
| CVF Local Workspace Runtime | IDE/local agents | force agent work through CVF-governed proposal, MCP/CLI, guard, receipt, and closure paths | CVF Core authority, AHB, autorun gates, local runtime contracts, generated workspace state | act as independent authority, execute dangerous mutation directly, replace work orders or closure gates |

## CVF Web Workspace

The CVF Web Workspace is the human-facing control and review surface. It is for
non-coder operators to understand the current work state and make decisions
without reading raw handoff files.

Required capabilities for future Web Workspace upgrades:

- show current mode, next allowed move, active handoff, and parked checkpoints;
- show roadmap/work-order/work-return status through governed artifacts;
- show evidence, receipts, guard status, and closure boundaries;
- allow operator decisions only through CVF-governed action paths;
- keep runtime/provider/public claims tied to receipts and live-proof rules.

The Web Workspace may present buttons, forms, filters, dashboards, and review
queues, but the action behind those controls must be a CVF-governed request,
not an untracked mutation.

## CVF Local Workspace Runtime

The CVF Local Workspace Runtime is the agent-facing execution control substrate.
It is where Claude, Codex, Gemini, IDE agents, or future local agents must pass
through CVF before they alter files, tools, queues, runtime state, or evidence.

Required capabilities for future Local Runtime work:

- proposal before execution for file/tool/policy/runtime mutations;
- MCP or CLI ingress that binds to AHB, work orders, autorun, and receipts;
- non-bypass handling for dangerous actions;
- generated local state views derived from CVF-owned state sources;
- append-only event and evidence trails separated from closure receipts.

Local Runtime work requires fresh authorization before implementation. A
reference scaffold, smoke result, or external package does not prove CVF runtime
behavior.

## Forbidden Conflations

Future agents must not conflate these layers:

| Conflation | Correct CVF disposition |
|---|---|
| Web dashboard exists, therefore agent runtime enforcement exists | REJECT: Web read model is not runtime enforcement |
| MCP scaffold exists, therefore operator-facing workspace exists | REJECT: Local Runtime is not Web Workspace |
| External package smoke test passed, therefore CVF proof exists | REJECT: external smoke is advisory until CVF live/runtime proof exists |
| Workflow display vocabulary defines CVF internal state | REJECT: CVF roadmap, work order, AHB, autorun, and session state remain authority |
| UI button approval equals closure | REJECT: closure needs governed artifact evidence and gates |

## Required Work Order Control Block

Any future work order that touches CVF Web Workspace, Local Workspace Runtime,
MCP workspace tooling, agent workspace UI, runtime queues, or workspace state
must include a Workspace Two-Layer Control Block:

| Field | Required content |
|---|---|
| `targetLayer` | `CVF_WEB_WORKSPACE`, `CVF_LOCAL_WORKSPACE_RUNTIME`, or `BOTH_WITH_BOUNDARY` |
| `operatorSurface` | read-only view, governed action request, or N/A with reason |
| `agentExecutionSurface` | MCP, CLI, runtime queue, local projection, or N/A with reason |
| `sourceOfTruth` | CVF Core state or governed artifact paths |
| `mutationBoundary` | no mutation, governed proposal, runtime implementation, or N/A with reason |
| `receiptBoundary` | evidence/receipt path or no-receipt claim with reason |
| `forbiddenConflationCheck` | explicit statement that Web and Local Runtime are not being merged |

## CVF Web Upgrade Boundary

The next CVF Web upgrade should start from `CVF_WEB_WORKSPACE`, not from MCP
runtime implementation. The first Web tranche should be a source-verified
operator workspace read model and route map for existing `cvf-web` surfaces.
Only after that should UI implementation change product code.

Any CVF Web implementation must read `DESIGN.md` before editing frontend code.

## Public Export Disposition

DEFERRED_PRIVATE_ONLY

Reason: private provenance foundation standard. Public-facing wording requires
a separate public-sync authorization.

## Claim Boundary

This standard clarifies architecture. It does not implement CVF Web, Local
Runtime, MCP, provider calls, public-sync, runtime queue execution, or
production/public readiness.
