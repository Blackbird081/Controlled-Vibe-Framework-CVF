# CVF Agent Workspace Runtime Expansion Readiness Contract

Memory class: FULL_RECORD

Status: ACTIVE_CONTRACT

docType: reference

## Purpose

Define the governed boundary for future agent-workspace runtime expansion after
the bounded local workspace skeleton exists. This contract separates allowed
foundation scaffolding from runtime execution so agents do not convert a folder
or queue label into an executable scheduler, provider workflow, product UI, or
public claim without fresh authorization.

## Scope / Target / Owner Boundary

Target: CVF-governed agent workspace runtime-readiness planning and local queue
skeletons.

Owner boundary: this contract is foundation-only. It authorizes stable
reference guidance, a minimal local queue skeleton, an operator read-model
plan, and a machine guard. It does not authorize runtime queue execution,
provider/live proof, public-sync, registry edits, product UI, production
readiness, or public readiness.

## Source Authority

| Source | Role |
|---|---|
| `docs/reference/agent_workspace/README.md` | stable workspace front door |
| `docs/reference/agent_workspace/CVF_WORKSPACE_TWO_LAYER_ARCHITECTURE_STANDARD.md` | CVF Web Workspace versus Local Workspace Runtime split |
| `docs/reference/agent_workspace/CVF_AGENT_INTERACTION_WORKSPACE_DESIGN_STANDARD.md` | workspace design boundary |
| `docs/reference/agent_workspace/CVF_AGENT_WORKSPACE_STATE_TOPOLOGY_CONTRACT.md` | state topology and generated aggregate boundary |
| `docs/reference/agent_workspace/CVF_AGENT_WORKSPACE_STATE_LANE_TAXONOMY.md` | canonical lane vocabulary |
| `docs/reference/agent_workspace/CVF_AGENT_WORKSPACE_STATE_ITEM_TEMPLATE.json` | canonical state item shape |
| `CVF_SESSION/agent_workspace/workspace/README.md` | bounded local workspace skeleton |
| `CVF_SESSION/agent_workspace/runtime_queue/README.md` | bounded runtime queue skeleton |
| `docs/reference/agent_workspace/CVF_AGENT_WORKSPACE_OPERATOR_VIEW_PLAN.md` | operator-facing read model plan |
| `governance/compat/check_agent_workspace_runtime_boundary.py` | machine guard for this contract |

## Runtime Expansion Boundary

This contract is the first Local View for the `CVF_LOCAL_WORKSPACE_RUNTIME`
layer. It does not implement or substitute the CVF Web Workspace.

| Area | Current authorized disposition | Blocked until fresh GC-018 |
|---|---|---|
| Runtime queue storage | `QUEUE_SKELETON_ONLY` under `CVF_SESSION/agent_workspace/runtime_queue/` | executable queue records, dequeue/ack, scheduler, worker daemon |
| State source of truth | generated workspace state under `CVF_SESSION/agent_workspace/state/` | aggregate-only edits, ungoverned runtime state stores |
| Operator view | read-model plan only | product UI, local web app, dashboard implementation |
| Provider/live behavior | not authorized | provider calls, live governance proof, API-key use |
| Public surface | private provenance only | public-sync, public README/catalog claim |
| Registry/product mutation | not authorized | provider registry, product runtime, release claim |

## Required Runtime-Readiness Fields

Future work that proposes runtime state, queues, UI, provider execution, or
public exposure must include a Runtime Expansion Control Block with:

| Field | Required value or evidence |
|---|---|
| `runtimeMode` | one of `QUEUE_SKELETON_ONLY`, `READ_MODEL_ONLY`, `RUNTIME_IMPLEMENTATION_REQUESTED`, `PROVIDER_LIVE_REQUESTED`, `PUBLIC_SYNC_REQUESTED` |
| `contractSource` | this contract path |
| `frontDoor` | `docs/reference/agent_workspace/README.md` |
| `stateSourceOfTruth` | generated workspace state path or fresh source-verified replacement |
| `queueBoundary` | queue skeleton, runtime queue, or N/A with reason |
| `operatorViewBoundary` | read model, UI implementation, or N/A with reason |
| `providerBoundary` | no-provider or fresh live-proof authorization |
| `publicBoundary` | private-only or fresh public-sync authorization |
| `guardOwner` | checker and hook/autorun placement |

## Queue Skeleton Rules

`CVF_SESSION/agent_workspace/runtime_queue/` is a local reference skeleton. It
may contain README files that define lane-to-queue mapping, allowed future
fields, and blocked runtime assumptions.

It must not contain executable queue items, scheduling code, provider calls,
secret material, product UI state, or public-facing content. Future runtime
queue records must be introduced through a fresh work order that chooses
`RUNTIME_IMPLEMENTATION_REQUESTED` and cites this contract.

## Operator View Rules

The operator view plan is a read model, not a UI implementation. It may define
sections, data sources, evidence links, and guard-status summaries. It must not
claim that a dashboard exists, that runtime queue actions work, or that provider
governance has been proven.

## Machine Enforcement

`governance/compat/check_agent_workspace_runtime_boundary.py` enforces:

- stable contract/front-door markers;
- runtime queue skeleton presence and boundary wording;
- operator view plan presence and read-model boundary wording;
- AGENTS, autorun, and local hook binding;
- no accidental promotion from `QUEUE_SKELETON_ONLY` to executable runtime.

## Work Order Requirement

Any future workspace runtime, queue, operator-view, provider, public, registry,
or UI work order must read the stable workspace front door and this contract,
then include both an Agent Workspace Design Control Block and a Runtime
Expansion Control Block. If the work changes generated workspace state, it must
edit source fragments under `CVF_SESSION/agent_workspace/state/` and run the
generator.

## Public Export Disposition

DEFERRED_PRIVATE_ONLY

Reason: private provenance workspace foundation. No public-sync batch is
authorized.

## Claim Boundary

This contract authorizes runtime-readiness governance only. It does not build a runtime queue, and it does not execute agent work, schedule workers, run provider/live proof, ship UI, public-sync, edit registries, or claim production/public readiness.
