# CVF Execution Plane Foundation

Status: coordination package shell for `W2-T1 / CP1` in the whitepaper-completion roadmap.

## Purpose

- create one stable execution-plane import surface without physically merging source modules
- preserve lineage for MCP bridge, gateway, adapter, and execution evidence modules
- keep `CVF_ECO_v2.5_MCP_SERVER` guard-runtime internals out of the initial package body
- preserve `CVF_MODEL_GATEWAY` as the canonical gateway-facing wrapper anchor
- expose one reviewable execution-plane shell summary for tranche-local planning and implementation

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
- the shell stays additive and does not modify active-path runtime behavior by itself
