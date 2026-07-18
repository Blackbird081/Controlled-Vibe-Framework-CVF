# CVF Agent Interaction Workspace Design Standard

Memory class: FULL_RECORD

Status: ACTIVE_STANDARD_AND_MACHINE_ENFORCED

docType: reference

## Purpose

Define the bounded design requirements for the future CVF agent-interaction
workspace so future agents can prepare that workspace without weakening the
ratified Agent Handoff Contract, foundation storage discipline, or provider
memory boundary.

## Scope / Target / Owner Boundary

Target: design governance for a future dedicated workspace where multiple CVF
actors can exchange work, evidence, objections, review state, and next-move
signals.

Owner boundary: this standard authorizes analysis and design only. It does not
build the workspace, create runtime queues, edit product code, change provider
behavior, public-sync, or claim production readiness.

## Source Authority

| Source | Path | Role |
|---|---|---|
| AHB-T2 ratified contract | `docs/reference/CVF_AHB_T2_AGENT_HANDOFF_CONTRACT_RATIFICATION_2026-06-16.md` | Central Core for role, phase, base-head, trace, commit, and next-move fields |
| AHB-T3 checker | `governance/compat/check_agent_handoff_boundary.py` | Machine-enforced work-order local view |
| AHB-Tn.2 workspace checker | `governance/compat/check_agent_workspace_design.py` | Machine-enforced workspace design control block |
| AHB-Tn.3 state topology contract | `docs/reference/agent_workspace/CVF_AGENT_WORKSPACE_STATE_TOPOLOGY_CONTRACT.md` | Workspace state, lane, storage, and archive topology |
| AHB-Tn.6 lane taxonomy | `docs/reference/agent_workspace/CVF_AGENT_WORKSPACE_STATE_LANE_TAXONOMY.md` | Canonical lane vocabulary and transition rules |
| AHB-Tn.6 item template | `docs/reference/agent_workspace/CVF_AGENT_WORKSPACE_STATE_ITEM_TEMPLATE.json` | Canonical generated state source item shape |
| AHB-Tn.7 workspace skeleton | `CVF_SESSION/agent_workspace/workspace/README.md` | Bounded local workspace skeleton front door |
| AHB-Tn.8 runtime expansion contract | `docs/reference/agent_workspace/CVF_AGENT_WORKSPACE_RUNTIME_EXPANSION_READINESS_CONTRACT.md` | Runtime expansion boundary and control-block source |
| AHB-Tn.9 queue skeleton | `CVF_SESSION/agent_workspace/runtime_queue/README.md` | Bounded queue-family skeleton front door |
| AHB-Tn.10 operator view plan | `docs/reference/agent_workspace/CVF_AGENT_WORKSPACE_OPERATOR_VIEW_PLAN.md` | Operator-facing read-model plan |
| AHB-Tn.5 option readiness matrix | `docs/reference/agent_workspace/CVF_AGENT_WORKSPACE_OPTION_READINESS_MATRIX.md` | Parked future option choices after foundation closure |
| AHB roadmap | `docs/roadmaps/CVF_AGENT_HANDOFF_BOUNDARY_SYSTEMIZATION_ROADMAP_2026-06-16.md` | Workspace candidate route after AHB-T3 |
| Foundation storage standard | `docs/reference/foundation_storage/CVF_FOUNDATION_FILE_STORAGE_AND_INDEX_STANDARD.md` | Stable folder/index rule |
| Provider memory boundary | `AGENTS.md` | Provider-local memory is not CVF source of truth |

## Design Decision

The agent-interaction workspace must be designed as a governed coordination
surface, not as an informal chat archive or provider-local memory substitute.

The workspace design must preserve:

- Agent Handoff Contract fields as the Central Core;
- per-batch work orders, trace blocks, reviews, and session-sync records as
  Local Views;
- stable indexed foundation paths for durable workspace rules;
- dated execution/evidence paths for batch-specific receipts and reviews;
- explicit separation between design artifacts and any later runtime/product
  implementation.

## Required Workspace Design Model

Any future build work order for the agent-interaction workspace must define
these design surfaces before implementation:

| Surface | Required decision before build |
|---|---|
| Front door | Stable `docs/reference/agent_workspace/README.md` remains the first read |
| Actor lanes | Which actors may author, execute, review, close, and session-sync |
| Handoff contract fields | How `route`, `rolePattern`, `phase`, base heads, changed-set scope, trace scope, commit owner, cross-batch isolation, and next-move surfaces are represented |
| Evidence storage | Which artifacts are stable foundation records and which are dated execution evidence |
| Workspace state | Whether state is markdown-only, generated JSON, runtime-backed, or deferred |
| State topology | How intake, dispatch, worker-return, review, accepted-material, session-sync, and parked state units map to the AHB contract |
| Lane taxonomy | Which `lane` value each workspace item uses before active state is changed |
| Generated state aggregate | `CVF_SESSION/agent_workspace/ACTIVE_AGENT_WORKSPACE_STATE.json` must stay generated from `CVF_SESSION/agent_workspace/state/` |
| Option readiness | Which parked option is selected before build, richer lanes, or further hardening starts |
| Runtime expansion | Whether the work is `QUEUE_SKELETON_ONLY`, `READ_MODEL_ONLY`, runtime implementation, provider-live, or public-sync scope |
| Operator view | Whether the work is read-model planning only or a separately authorized UI implementation |
| Guard placement | Which existing or future machine checks enforce the design before dispatch, implementation, closure, and session sync |
| Archive policy | How stale workspace records leave the active front door |
| Public boundary | Whether any workspace output may ever enter public-sync, and under which separate authorization |

## Minimum Pre-Build Control Block

A future workspace build work order must include an `Agent Workspace Design
Control Block` with:

| Field | Required content |
|---|---|
| Workspace purpose | One bounded use case, not broad collaboration infrastructure |
| Contract source | `docs/reference/CVF_AHB_T2_AGENT_HANDOFF_CONTRACT_RATIFICATION_2026-06-16.md` |
| Front door | `docs/reference/agent_workspace/README.md` |
| Storage class | stable foundation file, dated execution evidence, generated state, runtime source, or public-sync artifact |
| Handoff fields | concrete mapping for CF-01 through CF-09 |
| State ownership | owner for each proposed workspace state file or runtime table |
| Guard owner | existing checker or proposed machine-check candidate |
| Build boundary | explicit yes/no for runtime source, provider proof, public-sync, and registry edits |

## Folder And File Policy

Stable workspace foundation rules live under:

`docs/reference/agent_workspace/`

Dated GC-018, work orders, completion reviews, and evidence stay in their
existing execution folders:

- `docs/baselines/`
- `docs/work_orders/`
- `docs/reviews/`
- `docs/reviews/evidence/`

Do not create a workspace root, runtime queue, generated JSON aggregate, UI,
provider integration, or public-facing copy from this standard alone.

## Relationship To Existing Guards

| Guard | Relationship |
|---|---|
| `governance/compat/check_agent_handoff_boundary.py` | Enforces handoff contract evidence in changed work orders |
| `governance/compat/check_agent_workspace_design.py` | Enforces the Agent Workspace Design Control Block in changed workspace work orders |
| `docs/reference/agent_workspace/CVF_AGENT_WORKSPACE_STATE_TOPOLOGY_CONTRACT.md` | Defines state units, lanes, required fields, candidate generated-state layout, and archive policy |
| `docs/reference/agent_workspace/CVF_AGENT_WORKSPACE_STATE_LANE_TAXONOMY.md` | Defines canonical lanes, transition rules, and required `lane`, `resumeCondition`, and `supersedes` fields |
| `governance/compat/check_agent_workspace_state.py` | Enforces generated workspace state drift and required topology fields |
| `governance/compat/check_agent_workspace_skeleton.py` | Enforces bounded skeleton folder/index layout and hook binding |
| `governance/compat/check_agent_workspace_runtime_boundary.py` | Enforces runtime-readiness contract, queue skeleton, operator view plan, and hook binding |
| `governance/compat/check_foundation_storage_layout.py` | Enforces stable folder/index discipline for durable workspace rules |
| `governance/compat/check_agent_operation_trace.py` | Enforces per-phase changed-set and trace manifest evidence |
| `governance/compat/check_finding_to_governance_learning.py` | Prevents workspace findings from staying only in provider memory |
| `governance/compat/check_next_move_freshness.py` | Prevents stale next-move surfaces after workspace-related closures |

## Machine Enforcement

Workspace design enforcement is now machine-checked:

```powershell
python governance/compat/check_agent_workspace_design.py --base <baseHead> --head HEAD --enforce
python governance/compat/check_agent_workspace_state.py --base <baseHead> --head HEAD --enforce
python governance/compat/check_agent_workspace_skeleton.py --base <baseHead> --head HEAD --enforce
python governance/compat/check_agent_workspace_runtime_boundary.py --base <baseHead> --head HEAD --enforce
python governance/compat/check_agent_handoff_boundary.py --base <baseHead> --head HEAD --enforce
python governance/compat/check_foundation_storage_layout.py --base <baseHead> --head HEAD --enforce
python governance/compat/check_agent_operation_trace.py --base <baseHead> --head HEAD --enforce
```

`governance/compat/check_agent_workspace_design.py` is included in the autorun
workflow gate and local governance hook chain. A future workspace build,
runtime, provider-proof, public-sync, registry, queue, inbox, or dashboard work
order that mentions the agent-interaction workspace must carry the Agent
Workspace Design Control Block before dispatch or closure.

`governance/compat/check_agent_workspace_state.py` is included in the autorun
workflow gate and local governance hook chain. Any generated workspace state
change must edit source fragments under `CVF_SESSION/agent_workspace/state/`,
run `governance/compat/generate_agent_workspace_state.py`, and pass the drift
checker.

`governance/compat/check_agent_workspace_skeleton.py` is included in the
autorun workflow gate and local governance hook chain. Any future change to
`CVF_SESSION/agent_workspace/workspace/` must preserve the skeleton front
door, lane index, canonical lane folders, and no-runtime boundary.

`governance/compat/check_agent_workspace_runtime_boundary.py` is included in
the autorun workflow gate and local governance hook chain. Any future runtime
queue, operator view, dashboard, provider, public-sync, registry, or runtime
execution work must preserve the runtime-readiness contract unless a fresh
GC-018 explicitly authorizes a wider mode.

## Work Order Requirement

Any future work order that proposes or builds an agent-interaction workspace
must:

- cite this standard and the agent workspace front door;
- include the Agent Handoff Contract Control Block required by AHB-T3;
- include a Foundation Storage Layout Block if it creates durable workspace
  foundation files;
- include the Agent Workspace Design Control Block above before implementation;
- cite the workspace state topology contract before creating workspace state,
  generated state, queues, inboxes, review lanes, or dashboards;
- cite the lane taxonomy and item template before changing generated workspace
  state source fragments;
- cite the skeleton front door and skeleton checker before modifying the local
  workspace skeleton or lane folders;
- cite the runtime expansion readiness contract and runtime boundary checker
  before creating or modifying runtime queue skeletons, operator views,
  dashboards, provider-live behavior, public-sync, registries, or runtime
  execution;
- include a Runtime Expansion Control Block when runtime/read-model/queue
  scope is mentioned;
- state whether it is analysis-only, design-only, machine-check, runtime build,
  provider-proof, public-sync, or archive-cleanup scope.

## Public Export Disposition

DEFERRED_PRIVATE_ONLY

Reason: private provenance governance design. No public-sync batch is
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

This standard defines workspace design controls only. It does not authorize a
workspace build, runtime behavior, provider calls, public-sync, autonomous
mutation, or production/public readiness claims.
