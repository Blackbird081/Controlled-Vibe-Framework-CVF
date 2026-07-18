# CVF Agent Workspace Operator View Plan

Memory class: FULL_RECORD

Status: ACTIVE_PLAN

docType: reference

## Purpose

Define the operator-facing read model for the agent workspace without building
UI or runtime actions. The plan gives future agents a stable view shape so they
can design or implement a dashboard later without re-deriving which state,
handoff, queue, and evidence surfaces must appear.

## Scope / Target / Owner Boundary

Target: future operator-facing workspace view design and implementation.

Owner boundary: this is a read model only. It does not build a dashboard, run a
local web app, create runtime queue actions, call providers, public-sync, edit
registries, or claim production/public readiness.

## Source Authority

| Source | Role |
|---|---|
| `docs/reference/agent_workspace/README.md` | stable workspace front door |
| `docs/reference/agent_workspace/CVF_WORKSPACE_TWO_LAYER_ARCHITECTURE_STANDARD.md` | CVF Web Workspace versus Local Workspace Runtime split |
| `docs/reference/agent_workspace/CVF_AGENT_WORKSPACE_RUNTIME_EXPANSION_READINESS_CONTRACT.md` | runtime/read-model boundary |
| `docs/reference/agent_workspace/CVF_AGENT_WORKSPACE_STATE_TOPOLOGY_CONTRACT.md` | generated state source of truth |
| `docs/reference/agent_workspace/CVF_AGENT_WORKSPACE_STATE_LANE_TAXONOMY.md` | lane vocabulary |
| `CVF_SESSION/agent_workspace/ACTIVE_AGENT_WORKSPACE_STATE.json` | generated active workspace state |
| `CVF_SESSION/agent_workspace/runtime_queue/README.md` | queue skeleton boundary |
| `governance/compat/check_agent_workspace_runtime_boundary.py` | machine guard |

## Read Model Sections

This plan is the first Local View for the `CVF_WEB_WORKSPACE` layer. It does
not define Local Workspace Runtime behavior.

| Section | Data source | Boundary |
|---|---|---|
| Current Mode | `CVF_SESSION/ACTIVE_SESSION_STATE.json`; `CVF_SESSION_MEMORY.md` | show current mode and next allowed move only |
| Active Handoff | active handoff named by state registry | link active handoff, do not append history |
| Lane Summary | `ACTIVE_AGENT_WORKSPACE_STATE.json` items grouped by lane | read-only summary |
| Queue Skeleton | `CVF_SESSION/agent_workspace/runtime_queue/README.md`; queue README files | structural readiness only |
| Blocked And Parked | workspace state items with blocked or parked status | operator decision prompts only |
| Accepted Material | workspace state items in `accepted_material` lane | evidence links and closure status |
| Guard Status | relevant checker paths and latest command evidence | no hidden pass claim without receipt |
| Next Move | active session state nextAllowedMove | no inference from chat or provider memory |

## Required Future UI Work

A future UI or dashboard implementation must include:

- fresh GC-018;
- source-verified work order;
- Agent Handoff Contract Control Block;
- Agent Workspace Design Control Block;
- Runtime Expansion Control Block;
- explicit storage and archive policy;
- no-provider/no-public/no-registry boundary, unless separately authorized.

## Public Export Disposition

DEFERRED_PRIVATE_ONLY

Reason: private provenance workspace foundation. No public-sync batch is
authorized.

## Claim Boundary

This plan is read model only. It does not implement UI, mutate runtime state,
execute queues, run provider/live proof, public-sync, edit registries, or claim
production/public readiness.
