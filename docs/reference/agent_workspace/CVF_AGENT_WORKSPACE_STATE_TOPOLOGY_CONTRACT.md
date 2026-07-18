# CVF Agent Workspace State Topology Contract

Memory class: FULL_RECORD

Status: ACTIVE_CONTRACT

docType: reference

## Purpose

Define the bounded state topology for a future CVF agent-interaction workspace
before any workspace root, generated state aggregate, queue, inbox, dashboard,
runtime source, provider proof, public-sync, or registry edit is created.

## Scope / Target / Owner Boundary

Target: governance-foundation state topology for future agent-to-agent
coordination surfaces.

Owner boundary: this contract defines topology only. It does not create a
workspace implementation, generated JSON aggregate, runtime table, UI,
provider route, public surface, registry entry, or production/public readiness
claim.

## Source Authority

| Source | Path | Role |
|---|---|---|
| Agent workspace front door | `docs/reference/agent_workspace/README.md` | Stable retrieval path |
| Workspace design standard | `docs/reference/agent_workspace/CVF_AGENT_INTERACTION_WORKSPACE_DESIGN_STANDARD.md` | Pre-build boundary and control block source |
| Lane taxonomy | `docs/reference/agent_workspace/CVF_AGENT_WORKSPACE_STATE_LANE_TAXONOMY.md` | Canonical lane vocabulary and transition rules |
| Item template | `docs/reference/agent_workspace/CVF_AGENT_WORKSPACE_STATE_ITEM_TEMPLATE.json` | Canonical state source item shape |
| Option readiness matrix | `docs/reference/agent_workspace/CVF_AGENT_WORKSPACE_OPTION_READINESS_MATRIX.md` | Parked future option routing after foundation closure |
| Runtime expansion contract | `docs/reference/agent_workspace/CVF_AGENT_WORKSPACE_RUNTIME_EXPANSION_READINESS_CONTRACT.md` | Runtime/read-model/queue boundary |
| Runtime queue skeleton | `CVF_SESSION/agent_workspace/runtime_queue/README.md` | Queue-family skeleton front door |
| Operator view plan | `docs/reference/agent_workspace/CVF_AGENT_WORKSPACE_OPERATOR_VIEW_PLAN.md` | Operator read-model boundary |
| Workspace design checker | `governance/compat/check_agent_workspace_design.py` | Machine-enforced work-order local view |
| Agent Handoff Contract | `docs/reference/CVF_AHB_T2_AGENT_HANDOFF_CONTRACT_RATIFICATION_2026-06-16.md` | Central Core for role, phase, base-head, trace, commit, and next-move semantics |
| Handoff boundary checker | `governance/compat/check_agent_handoff_boundary.py` | Machine-enforced handoff local view |
| Foundation storage standard | `docs/reference/foundation_storage/CVF_FOUNDATION_FILE_STORAGE_AND_INDEX_STANDARD.md` | Stable folder/index discipline |
| Active session state discipline | `docs/reference/CVF_JSON_GENERATED_AGGREGATE_DISCIPLINE_STANDARD_2026-06-12.md` | Future generated aggregate pattern |

## Topology Decision

The future workspace state must be modeled as a governed state topology, not as
a chat transcript, provider-local memory, or ad hoc shared scratch folder.

The topology has three layers:

| Layer | Role | Status |
|---|---|---|
| Central Core | AHB contract fields plus workspace state vocabulary | ACTIVE_CONTRACT |
| Local View | per-batch work orders, worker returns, reviews, completion packets, and session-sync entries | EXISTING_SURFACES |
| Generated State | compact machine-readable workspace state aggregate and source fragments | ACTIVE_FOUNDATION |

AHB-Tn.4 creates the generated-state foundation after this contract. Future
expansion of generated-state semantics must still use a fresh GC-018, update
source fragments, run the generator, and pass generated aggregate drift checks.
AHB-Tn.5 adds parked option records so future workspace work must first select
one explicit option instead of treating workspace continuation as implicit
build authorization.

## Workspace State Units

Future workspace state may contain only bounded state units. A state unit is
not a freeform conversation.

| State unit | Purpose | Required owner |
|---|---|---|
| Intake item | proposed work, finding, critique, or operator direction awaiting routing | dispatcher or operator |
| Dispatch item | authorized work order ready for execution | dispatcher |
| Worker-return item | returned material or audit packet awaiting reviewer action | worker plus reviewer |
| Review item | critique, dissent, acceptance, or requested repair | reviewer |
| Accepted-material item | accepted committed material and closure evidence | closer |
| Session-sync item | next-move, handoff, and active-state updates after material closure | session-sync steward |
| Parked item | explicitly deferred lane with condition to resume | operator or closer |

Every state unit must preserve the source work order, owner role, evidence
paths, claim boundary, and next-move impact.

## Required State Fields

Future workspace state records must include these fields before any generated
aggregate is authorized:

| Field | Requirement |
|---|---|
| workspaceItemId | stable opaque ID within the workspace state family |
| lane | one canonical lane from `CVF_AGENT_WORKSPACE_STATE_LANE_TAXONOMY.md` |
| itemKind | one of intake, dispatch, worker_return, review, accepted_material, session_sync, parked |
| status | one bounded lifecycle status, not freeform prose |
| ownerRole | dispatcher, worker, reviewer, closer, session_sync_steward, or operator |
| route | one canonical AHB route token |
| rolePattern | role pattern from the Agent Handoff Contract |
| phase | dispatch authoring, execution, closure, session sync, or parked |
| baseHead | phase-appropriate base head |
| changedSetScope | paths or scope boundary for the item |
| traceScope | trace or evidence scope for the item |
| commitOwner | owner of any commit implied by the item |
| sourceWorkOrder | governed work order path or N/A with reason for operator intake |
| evidencePaths | bounded artifact paths; no provider-local memory as authority |
| claimBoundary | explicit no-runtime/no-provider/no-public/no-registry boundary when applicable |
| nextMoveImpact | whether the item changes next allowed move surfaces |
| resumeCondition | explicit condition to resume, or `N/A with reason` when closed |
| supersedes | list of workspace item IDs superseded by this item; empty list when none |
| archivePolicy | condition that moves the item out of the active view |

## Lane Topology

| Lane | Allowed state units | Boundary |
|---|---|---|
| Intake lane | intake item, parked item | May capture operator direction or finding; cannot authorize execution alone |
| Dispatch lane | dispatch item | Requires GC-018 and work order before execution |
| Worker-return lane | worker-return item | Worker may return material but cannot close unless commit mode permits |
| Review lane | review item | Records critique, dissent, acceptance, or repair request |
| Accepted-material lane | accepted-material item | Requires committed material evidence |
| Session-sync lane | session-sync item | Updates active state, session memory, and active handoff after material closure |
| Parked lane | parked item | Keeps deferred work visible without making it active |

## Storage Topology

Stable workspace foundation records live under:

`docs/reference/agent_workspace/`

Dated execution and evidence records remain in their existing folders:

- `docs/baselines/`
- `docs/work_orders/`
- `docs/reviews/`
- `docs/reviews/evidence/`

If a future generated state aggregate is authorized, the preferred candidate
layout is:

| Candidate path | Role | Status |
|---|---|---|
| `CVF_SESSION/agent_workspace/ACTIVE_AGENT_WORKSPACE_STATE.json` | generated aggregate | ACTIVE_FOUNDATION |
| `CVF_SESSION/agent_workspace/state/` | source fragments | ACTIVE_FOUNDATION |
| `governance/compat/generate_agent_workspace_state.py` | generator | ACTIVE_FOUNDATION |
| `governance/compat/check_agent_workspace_state.py` | drift/topology checker | ACTIVE_FOUNDATION |
| `docs/reference/agent_workspace/CVF_AGENT_WORKSPACE_STATE_LANE_TAXONOMY.md` | stable lane vocabulary | ACTIVE_TAXONOMY |
| `docs/reference/agent_workspace/CVF_AGENT_WORKSPACE_STATE_ITEM_TEMPLATE.json` | source item template | ACTIVE_TEMPLATE |
| `CVF_SESSION/agent_workspace/workspace/README.md` | bounded local skeleton front door | ACTIVE_SKELETON |
| `CVF_SESSION/agent_workspace/workspace/lanes/README.md` | lane folder index | ACTIVE_INDEX |
| `governance/compat/check_agent_workspace_skeleton.py` | skeleton folder/index guard | ACTIVE_GUARD |
| `docs/reference/agent_workspace/CVF_AGENT_WORKSPACE_RUNTIME_EXPANSION_READINESS_CONTRACT.md` | runtime expansion boundary | ACTIVE_CONTRACT |
| `CVF_SESSION/agent_workspace/runtime_queue/README.md` | bounded queue skeleton front door | ACTIVE_QUEUE_SKELETON |
| `docs/reference/agent_workspace/CVF_AGENT_WORKSPACE_OPERATOR_VIEW_PLAN.md` | operator read-model plan | ACTIVE_PLAN |
| `governance/compat/check_agent_workspace_runtime_boundary.py` | runtime boundary guard | ACTIVE_GUARD |

Those paths are generated-state foundation only. They do not build a workspace
UI, runtime queue, provider route, public surface, registry edit, or production
claim.

## Archive And Retention Rule

The future active workspace view must stay compact. Completed or rejected state
units leave the active view when all of these are true:

- material or decision evidence is committed;
- session-sync surfaces no longer point to the item as next action;
- any parked condition is either resolved or explicitly renewed;
- the item can be reconstructed from governed artifacts.

Archive batches require separate authorization if they move existing governed
artifacts. State-unit compaction must preserve source work order and completion
paths.

## Work Order Requirement

Any future work order that creates workspace state, generated workspace state,
workspace queues, workspace inboxes, workspace review lanes, workspace
dashboards, or workspace runtime must:

- cite this contract;
- include the Agent Workspace Design Control Block;
- include the Agent Handoff Contract Control Block;
- state whether it creates stable reference files, dated evidence, generated
  state, runtime source, public-sync output, or registry edits;
- map any proposed state record to the Required State Fields table;
- use the lane taxonomy and item template when adding or modifying state source
  fragments;
- cite the runtime expansion readiness contract before creating runtime queue
  skeletons, runtime queue records, operator views, dashboards, provider-live
  behavior, public-sync output, registries, or runtime execution;
- include a Runtime Expansion Control Block when runtime queue or operator
  view scope is mentioned;
- state the archive policy before implementation.

## Machine Enforcement

Current machine enforcement:

```powershell
python governance/compat/check_agent_workspace_design.py --base <baseHead> --head HEAD --enforce
python governance/compat/check_agent_handoff_boundary.py --base <baseHead> --head HEAD --enforce
python governance/compat/check_foundation_storage_layout.py --base <baseHead> --head HEAD --enforce
```

Future generated workspace state requires a separate checker. This contract
now points to the AHB-Tn.4 checker:

```powershell
python governance/compat/check_agent_workspace_state.py --base <baseHead> --head HEAD --enforce
python governance/compat/generate_agent_workspace_state.py --check
python governance/compat/check_agent_workspace_skeleton.py --base <baseHead> --head HEAD --enforce
python governance/compat/check_agent_workspace_runtime_boundary.py --base <baseHead> --head HEAD --enforce
```

## Public Export Disposition

DEFERRED_PRIVATE_ONLY

Reason: private provenance governance foundation. No public-sync batch is
authorized.

## Agent Operation Trace Block

| Field | Evidence |
|---|---|
| Actor | Codex |
| Provider or surface | Codex local workspace |
| Session or invocation | 2026-06-17 AHB-Tn.4 agent workspace state source checker |
| Working directory | `d:\UNG DUNG AI\TOOL AI 2026\Controlled-Vibe-Framework-CVF` |
| Command or tool surface | PowerShell, rg, apply_patch, pytest |
| Target paths | `AGENTS.md`; `CVF_SESSION/agent_workspace/ACTIVE_AGENT_WORKSPACE_STATE.json`; `CVF_SESSION/agent_workspace/state/ACTIVE_AGENT_WORKSPACE_STATE_CORE.json`; `CVF_SESSION/agent_workspace/state/items/ahb-tn4-workspace-state-foundation-parked.json`; `docs/baselines/CVF_GC018_AHB_TN4_AGENT_WORKSPACE_STATE_SOURCE_CHECKER_2026-06-17.md`; `docs/reference/CVF_JSON_GENERATED_AGGREGATE_DISCIPLINE_STANDARD_2026-06-12.md`; `docs/reference/CVF_OPERATIONAL_REFERENCE_INDEX_2026-05-23.md`; `docs/reference/agent_workspace/README.md`; `docs/reference/agent_workspace/CVF_AGENT_INTERACTION_WORKSPACE_DESIGN_STANDARD.md`; `docs/reference/agent_workspace/CVF_AGENT_WORKSPACE_STATE_TOPOLOGY_CONTRACT.md`; `docs/reviews/CVF_AHB_TN4_AGENT_WORKSPACE_STATE_SOURCE_CHECKER_COMPLETION_2026-06-17.md`; `docs/roadmaps/CVF_AGENT_HANDOFF_BOUNDARY_SYSTEMIZATION_ROADMAP_2026-06-16.md`; `docs/work_orders/CVF_AGENT_WORK_ORDER_AHB_TN4_AGENT_WORKSPACE_STATE_SOURCE_CHECKER_FOR_CODEX_2026-06-17.md`; `governance/compat/check_agent_workspace_state.py`; `governance/compat/generate_agent_workspace_state.py`; `governance/compat/run_agent_autorun_workflow_gate.py`; `governance/compat/run_local_governance_hook_chain.py`; `governance/compat/test_agent_workspace_state.py` |
| Allowed scope source | operator authorization to continue workspace foundation hardening on 2026-06-17 |
| Before status evidence | HEAD `f8964c7a`; clean worktree |
| After status evidence | AHB-Tn.4 material closure pending commit |
| Diff evidence | `git diff --name-status f8964c7a..HEAD` |
| Approval boundary | generated workspace state source/checker foundation only |
| Claim boundary | no workspace build, runtime/provider/live/public/registry implementation claim |
| Agent type | Codex implementer/closer |
| Invocation ID | `ahb-tn4-agent-workspace-state-source-checker-2026-06-17` |
| Expected manifest | `AGENTS.md`; `CVF_SESSION/agent_workspace/ACTIVE_AGENT_WORKSPACE_STATE.json`; `CVF_SESSION/agent_workspace/state/ACTIVE_AGENT_WORKSPACE_STATE_CORE.json`; `CVF_SESSION/agent_workspace/state/items/ahb-tn4-workspace-state-foundation-parked.json`; `docs/baselines/CVF_GC018_AHB_TN4_AGENT_WORKSPACE_STATE_SOURCE_CHECKER_2026-06-17.md`; `docs/reference/CVF_JSON_GENERATED_AGGREGATE_DISCIPLINE_STANDARD_2026-06-12.md`; `docs/reference/CVF_OPERATIONAL_REFERENCE_INDEX_2026-05-23.md`; `docs/reference/agent_workspace/README.md`; `docs/reference/agent_workspace/CVF_AGENT_INTERACTION_WORKSPACE_DESIGN_STANDARD.md`; `docs/reference/agent_workspace/CVF_AGENT_WORKSPACE_STATE_TOPOLOGY_CONTRACT.md`; `docs/reviews/CVF_AHB_TN4_AGENT_WORKSPACE_STATE_SOURCE_CHECKER_COMPLETION_2026-06-17.md`; `docs/roadmaps/CVF_AGENT_HANDOFF_BOUNDARY_SYSTEMIZATION_ROADMAP_2026-06-16.md`; `docs/work_orders/CVF_AGENT_WORK_ORDER_AHB_TN4_AGENT_WORKSPACE_STATE_SOURCE_CHECKER_FOR_CODEX_2026-06-17.md`; `governance/compat/check_agent_workspace_state.py`; `governance/compat/generate_agent_workspace_state.py`; `governance/compat/run_agent_autorun_workflow_gate.py`; `governance/compat/run_local_governance_hook_chain.py`; `governance/compat/test_agent_workspace_state.py` |
| Actual changed set | `AGENTS.md`; `CVF_SESSION/agent_workspace/ACTIVE_AGENT_WORKSPACE_STATE.json`; `CVF_SESSION/agent_workspace/state/ACTIVE_AGENT_WORKSPACE_STATE_CORE.json`; `CVF_SESSION/agent_workspace/state/items/ahb-tn4-workspace-state-foundation-parked.json`; `docs/baselines/CVF_GC018_AHB_TN4_AGENT_WORKSPACE_STATE_SOURCE_CHECKER_2026-06-17.md`; `docs/reference/CVF_JSON_GENERATED_AGGREGATE_DISCIPLINE_STANDARD_2026-06-12.md`; `docs/reference/CVF_OPERATIONAL_REFERENCE_INDEX_2026-05-23.md`; `docs/reference/agent_workspace/README.md`; `docs/reference/agent_workspace/CVF_AGENT_INTERACTION_WORKSPACE_DESIGN_STANDARD.md`; `docs/reference/agent_workspace/CVF_AGENT_WORKSPACE_STATE_TOPOLOGY_CONTRACT.md`; `docs/reviews/CVF_AHB_TN4_AGENT_WORKSPACE_STATE_SOURCE_CHECKER_COMPLETION_2026-06-17.md`; `docs/roadmaps/CVF_AGENT_HANDOFF_BOUNDARY_SYSTEMIZATION_ROADMAP_2026-06-16.md`; `docs/work_orders/CVF_AGENT_WORK_ORDER_AHB_TN4_AGENT_WORKSPACE_STATE_SOURCE_CHECKER_FOR_CODEX_2026-06-17.md`; `governance/compat/check_agent_workspace_state.py`; `governance/compat/generate_agent_workspace_state.py`; `governance/compat/run_agent_autorun_workflow_gate.py`; `governance/compat/run_local_governance_hook_chain.py`; `governance/compat/test_agent_workspace_state.py` |
| Manifest delta | MATCH |
| Deletion or rename disposition | N/A with reason: no deletion or rename |

## Claim Boundary

This contract defines workspace state topology only. It does not authorize
workspace construction, generated JSON creation, runtime behavior, provider
calls, public-sync, registry edits, autonomous mutation, or production/public
readiness claims.
