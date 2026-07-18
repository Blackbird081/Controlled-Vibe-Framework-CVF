# CVF MCP Gateway Reference Front Door

Status: ACTIVE_REFERENCE_FRONT_DOOR

Memory class: POINTER_RECORD

Last updated: 2026-06-18

## Purpose

This folder stores stable MCP Gateway reference surfaces used before any future
MCP runtime bridge, tool exposure, or public MCP claim.

## Scope / Applies-To

Applies to bounded MCP reference lookup, MCP-to-runtime bridge planning, and
future MCP work-order source verification.

Does not authorize MCP tool implementation, public package publication,
provider live calls, release-facing readiness, public readiness, or production
readiness.

## Current References

| Reference | Use |
|---|---|
| `CVF_MODEL_GATEWAY_MCP_RUNTIME_BRIDGE_BOUNDARY.md` | Central boundary contract for any future MCP tool that intends to call Model Gateway runtime surfaces. |
| `docs/reference/external_agent_review/README.md` | Review-context front door for external-agent MCP/workspace critique and non-canonical package absorption. |
| `docs/reference/agent_workspace/CVF_WORKSPACE_LAYER_EXTERNAL_PACKAGE_ABSORPTION_MAP.md` | Selective absorption map for the operator-copied external workspace package. |

## Runtime Source Pointers

| Source | Current role |
|---|---|
| `EXTENSIONS/CVF_ECO_v2.5_MCP_SERVER/README.md` | MCP package overview and tool list. |
| `EXTENSIONS/CVF_ECO_v2.5_MCP_SERVER/src/index.ts` | MCP server entry point and current tool registrations. |
| `EXTENSIONS/CVF_ECO_v2.5_MCP_SERVER/src/tools/int1-connection-point-policy.ts` | Generic MCP adapter advisory/enforce progression semantics. |
| `EXTENSIONS/CVF_MODEL_GATEWAY/src/provider-execution-bridge.ts` | Current governed Model Gateway execution bridge. |
| `EXTENSIONS/CVF_MODEL_GATEWAY/src/unified-gateway-interface-contract.ts` | Current Model Gateway execute/stream/embedding/health interface contract. |

## Required Use

Before authoring any work order that exposes Model Gateway through MCP, read
this folder front door and the bridge boundary contract. The work order must
source-verify the MCP tool surface and the Model Gateway runtime surface it
intends to connect.

If the work order uses external repository ideas or external-agent package
material, also read `docs/reference/external_agent_review/README.md` and record
whether the material is `ABSORB`, `ADAPT`, `DEFER`, or `REJECT` under a
CVF-owned absorption map.

## Claim Boundary

This front door is a navigation surface only. It does not prove MCP runtime
behavior, provider behavior, public export readiness, hosted freshness,
production readiness, or automatic agent adoption.
