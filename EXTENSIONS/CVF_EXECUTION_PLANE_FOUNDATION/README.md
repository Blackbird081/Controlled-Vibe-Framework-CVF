# CVF Execution Plane Foundation

Status: coordination package shell with explicit wrapper alignment for `W2-T1 / CP1-CP2` in the whitepaper-completion roadmap.

## Purpose

- create one stable execution-plane import surface without physically merging source modules
- preserve lineage for MCP bridge, gateway, adapter, and execution evidence modules
- keep `CVF_ECO_v2.5_MCP_SERVER` guard-runtime internals out of the initial package body
- preserve `CVF_MODEL_GATEWAY` as the canonical gateway-facing wrapper anchor
- expose one reviewable execution-plane shell summary for tranche-local planning and implementation
- make gateway and MCP bridge wrapper boundaries explicit without changing source-module ownership

## Source lineage

- `EXTENSIONS/CVF_ECO_v2.5_MCP_SERVER/`
- `EXTENSIONS/CVF_MODEL_GATEWAY/`
- `EXTENSIONS/CVF_v1.7.3_RUNTIME_ADAPTER_HUB/`

Reference-only through the preserved gateway wrapper:

- `EXTENSIONS/CVF_v1.2.1_EXTERNAL_INTEGRATION/`

## Execution class

- `coordination package`

## Current-cycle guardrail

- rollback unit is this package only
- source modules remain canonical for implementation ownership
- physical consolidation is out of scope for `CP1`

## Current-cycle shell surface

- `createExecutionPlaneFoundationShell()` composes one stable reviewable shell from gateway, MCP-runtime, registry, memory, explainability, and evidence helpers
- `describeExecutionPlaneFoundationShell()` produces one tranche-local summary for review and documentation surfaces
- `createExecutionGatewaySurface()` and `createExecutionMcpBridgeSurface()` expose explicit shell-facing wrapper surfaces for gateway and MCP entrypoints
- `describeExecutionPlaneWrapperAlignment()` produces the `CP2` review surface for MCP / gateway wrapper alignment
- the shell stays additive and does not modify active-path runtime behavior by itself

## Current-cycle wrapper boundary

- `CVF_MODEL_GATEWAY` remains the gateway-facing wrapper anchor
- MCP bridge entrypoints stay sourced from `CVF_ECO_v2.5_MCP_SERVER/src/sdk.ts`
- MCP guard-runtime and CLI internals remain deferred outside the shell package body
