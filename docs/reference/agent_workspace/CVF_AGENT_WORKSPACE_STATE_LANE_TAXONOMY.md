# CVF Agent Workspace State Lane Taxonomy

Memory class: FULL_RECORD

Status: ACTIVE_TAXONOMY

docType: reference

## Purpose

Define the canonical lane vocabulary for the generated agent workspace state so
future agents can route workspace items without inventing ad hoc queues,
inboxes, review buckets, or archive labels before runtime exists.

## Scope / Target / Owner Boundary

Target: pre-runtime workspace state lane taxonomy.

Owner boundary: this taxonomy defines governance state vocabulary only. It
does not build a workspace, runtime queue, UI, provider route, public-sync
surface, registry entry, production readiness, or public readiness.

## Source Authority

| Source | Role |
|---|---|
| `docs/reference/agent_workspace/README.md` | Stable workspace front door |
| `docs/reference/agent_workspace/CVF_AGENT_WORKSPACE_STATE_TOPOLOGY_CONTRACT.md` | State topology contract |
| `docs/reference/agent_workspace/CVF_AGENT_WORKSPACE_STATE_ITEM_TEMPLATE.json` | Canonical item shape |
| `CVF_SESSION/agent_workspace/ACTIVE_AGENT_WORKSPACE_STATE.json` | Generated active state view |
| `governance/compat/generate_agent_workspace_state.py` | Source validator and aggregate generator |
| `governance/compat/check_agent_workspace_state.py` | Machine guard |

## Central Core

Each workspace state item must carry one `lane` value. The lane is the durable
routing bucket. `itemKind` describes the record type inside that bucket, and
`phase` maps the item back to the Agent Handoff Contract phase.

Allowed lanes:

| Lane | Purpose | Runtime boundary |
|---|---|---|
| `intake` | Operator direction, finding, critique, or proposed work awaiting routing | Does not authorize execution |
| `dispatch` | GC-018/work-order-ready item awaiting execution | Requires governed dispatch evidence |
| `execution` | Active worker execution record | Runtime queue not implied |
| `worker_return` | Returned material awaiting reviewer action | Worker cannot close unless commit mode permits |
| `review` | Critique, dissent, acceptance, or repair request | Review evidence only |
| `accepted_material` | Committed accepted material and closure evidence | Closure evidence only |
| `session_sync` | Next-move, active-state, and handoff update work | Session surfaces only |
| `parked` | Deferred item with explicit resume condition | Not active work |
| `blocked` | Item blocked by a named condition | Requires unblock evidence |
| `archive_ready` | Item ready to leave active view after evidence remains recoverable | Requires archive or compaction authorization |

## Local View

The local view of this taxonomy is each source item under
`CVF_SESSION/agent_workspace/state/items/`. Future agents must update the
source item, run the generator, and let
`CVF_SESSION/agent_workspace/ACTIVE_AGENT_WORKSPACE_STATE.json` remain a
generated aggregate. A work order, worker return, completion review, or
session-sync entry may describe a lane, but it does not become active workspace
state until the source item and generated aggregate agree.

## Required Field Extensions

AHB-Tn.6 adds three required fields to the generated workspace item shape:

| Field | Requirement |
|---|---|
| `lane` | one canonical lane from this taxonomy |
| `resumeCondition` | explicit condition to resume, or `N/A with reason` when closed |
| `supersedes` | list of workspace item IDs superseded by this item; empty list when none |

These fields prevent parked or closed workspace items from silently becoming
next work through stale prose.

## Lane Transition Rules

| From | To | Required evidence |
|---|---|---|
| `intake` | `dispatch` | GC-018 and source-verified work order |
| `dispatch` | `execution` | assigned worker and execution base head |
| `execution` | `worker_return` | worker return or committed worker material |
| `worker_return` | `review` | reviewer acceptance, dissent, or requested repair |
| `review` | `accepted_material` | accepted material commit and closure evidence |
| `accepted_material` | `session_sync` | next-move or handoff/session state update need |
| any lane | `parked` | explicit parked condition and owner |
| any lane | `blocked` | named blocker and unblock evidence |
| closed/parked | `archive_ready` | source artifacts remain reconstructable |

## Work Order Requirement

Any future work order that changes generated workspace state must cite this
taxonomy and the item template, identify the selected lane for each changed
item, and state whether the item is active, parked, blocked, closed, or
archive-ready.

## Public Export Disposition

DEFERRED_PRIVATE_ONLY

Reason: private provenance workspace foundation. No public-sync batch is
authorized.

## Claim Boundary

This taxonomy defines pre-runtime state vocabulary only. It does not build
workspace runtime behavior, queues, UI, provider calls, public-sync, registry
edits, production readiness, or public readiness.
