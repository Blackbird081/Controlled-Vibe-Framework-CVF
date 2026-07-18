# CVF Local Workspace Projection Read Model Decision

Memory class: FULL_RECORD

Status: ACTIVE_REFERENCE

docType: reference

## Purpose

Define the first CVF-owned local workspace projection read model after the
workspace-layer package was absorbed as reference input. This file maps useful
package projection vocabulary to existing CVF workspace state, operator view,
handoff, and governed artifact surfaces without creating executable runtime,
MCP, CLI, IDE bridge, provider, public, or certification behavior.

## Scope / Target / Owner Boundary

Target: read-only local workspace projection model for future agent and
operator surfaces.

Owner boundary: this reference defines projection sections, source-of-truth
mapping, blocked actions, and future work-order requirements. It does not
create files under a runtime queue, mutate generated workspace state, implement
MCP or CLI tools, change CVF Web, run providers, public-sync, activate the raw
package, or certify package instances.

## Source Authority

| Source | Role |
|---|---|
| `docs/reference/agent_workspace/README.md` | stable workspace front door |
| `docs/reference/agent_workspace/CVF_WORKSPACE_LAYER_FULL_PACKAGE_ABSORPTION_INVENTORY.md` | complete package inventory and next-roadmap recommendation |
| `docs/reference/agent_workspace/CVF_WORKSPACE_LAYER_EXTERNAL_PACKAGE_ABSORPTION_MAP.md` | CVF-owned package absorption decisions |
| `docs/reference/agent_workspace/CVF_AGENT_WORKSPACE_STATE_TOPOLOGY_CONTRACT.md` | canonical workspace state fields and topology |
| `docs/reference/agent_workspace/CVF_AGENT_WORKSPACE_OPERATOR_VIEW_PLAN.md` | operator-facing read-model section precedent |
| `docs/reference/agent_workspace/CVF_AGENT_WORKSPACE_RUNTIME_EXPANSION_READINESS_CONTRACT.md` | runtime/read-model boundary and Runtime Expansion Control Block |
| `docs/reference/agent_workspace/CVF_WORKSPACE_TWO_LAYER_ARCHITECTURE_STANDARD.md` | CVF Web versus Local Workspace Runtime split |
| `docs/reference/agent_workspace/CVF_WORKSPACE_LAYER_EXTERNAL_PACKAGE_ABSORPTION_MAP.md` | CVF-owned mapping for non-canonical package projection vocabulary |
| `docs/reference/agent_workspace/CVF_WORKSPACE_LAYER_FULL_PACKAGE_ABSORPTION_INVENTORY.md` | non-canonical package manifest and schema inventory |

## Source Verification Block

| Claimed item | Source file | Verified line/section | Verified path or symbol | Owning interface/function/schema | Disposition |
|---|---|---|---|---|---|
| Follow-on roadmap should define a local workspace projection read model | `docs/reference/agent_workspace/CVF_WORKSPACE_LAYER_FULL_PACKAGE_ABSORPTION_INVENTORY.md` | line 163 | `Next-Roadmap Recommendation` | package absorption inventory | ACCEPT |
| Package projection-not-authority pattern is already absorbed by CVF | `docs/reference/agent_workspace/CVF_WORKSPACE_LAYER_EXTERNAL_PACKAGE_ABSORPTION_MAP.md` | Useful Patterns; CVF Mapping | `workspace_state.json`; `workflow_state.json`; `governance_state.json`; `agent_state.json`; `evidence_state.json` | package absorption map | ACCEPT |
| Package projection contract is present in the retained inventory | `docs/reference/agent_workspace/CVF_WORKSPACE_LAYER_FULL_PACKAGE_ABSORPTION_INVENTORY.md` | line 82 | `STATE_PROJECTION_CONTRACT.md` | package absorption inventory | ACCEPT |
| Package workspace-state schema is present in the retained inventory | `docs/reference/agent_workspace/CVF_WORKSPACE_LAYER_FULL_PACKAGE_ABSORPTION_INVENTORY.md` | line 135 | `workspace_state.schema.json` | package absorption inventory | ACCEPT |
| CVF workspace state records have required source fields | `docs/reference/agent_workspace/CVF_AGENT_WORKSPACE_STATE_TOPOLOGY_CONTRACT.md` | lines 81-106 | Required State Fields | workspace state topology contract | ACCEPT |
| Operator read model already names current-mode, lane, evidence, guard, and next-move sections | `docs/reference/agent_workspace/CVF_AGENT_WORKSPACE_OPERATOR_VIEW_PLAN.md` | lines 37-51 | Read Model Sections | operator view plan | ACCEPT |
| Future read-model or runtime work requires a Runtime Expansion Control Block | `docs/reference/agent_workspace/CVF_AGENT_WORKSPACE_RUNTIME_EXPANSION_READINESS_CONTRACT.md` | lines 60-73 | Runtime Expansion Control Block | runtime expansion readiness contract | ACCEPT |
| Package schema details remain comparison input only | `docs/reference/agent_workspace/CVF_WORKSPACE_LAYER_FULL_PACKAGE_ABSORPTION_INVENTORY.md` | line 135 | `workspace_state.schema.json` | package absorption inventory | ACCEPT |

## Projection Decision

Decision: CVF accepts a local workspace projection read model as a governed
reference layer only.

The model may project existing CVF-owned state and evidence into compact views
for agents and operators, but the source of truth remains CVF state fragments,
active handoff, governed artifacts, review packets, receipts, and command
evidence.

The model must not treat package schemas, package smoke results, or package
reference implementation files as CVF authority.

## Projection Sections

| Projection section | CVF source of truth | Package vocabulary adapted | Boundary |
|---|---|---|---|
| workspaceIdentity | `CVF_SESSION/agent_workspace/ACTIVE_AGENT_WORKSPACE_STATE.json`; `docs/reference/agent_workspace/README.md` | `workspace_state.json` identity fields | read-only identity projection |
| activeSession | `CVF_SESSION/ACTIVE_SESSION_STATE.json`; active handoff | `active_session_id`; `current_stage` | no direct state mutation |
| laneSummary | generated workspace state items grouped by lane | workflow state display vocabulary | CVF lane taxonomy controls |
| governanceControls | work orders, autorun gates, closure reviews, guard evidence | `allowed_actions`; `blocked_actions`; `blocking_conditions` | advisory projection only |
| requiredEvidence | completion reviews, receipts, source verification, git/gate outputs | `required_evidence`; evidence state | no hidden pass claim |
| closureReadiness | work order status, reviewer disposition, closure package, session-sync evidence | `closure_allowed` | closure still needs governed artifacts and gates |
| parkedAndBlocked | active session nextAllowedMove and parked workspace items | blocked workspace status | operator decision prompt only |

## Runtime Expansion Control Block

| Field | Disposition |
|---|---|
| runtimeMode | READ_MODEL_ONLY |
| contractSource | `docs/reference/agent_workspace/CVF_AGENT_WORKSPACE_RUNTIME_EXPANSION_READINESS_CONTRACT.md` |
| frontDoor | `docs/reference/agent_workspace/README.md` |
| stateSourceOfTruth | existing generated workspace state and active session state; no new aggregate in this batch |
| queueBoundary | N/A with reason: no queue record or executable queue behavior is created |
| operatorViewBoundary | source-verified read model only; no UI or dashboard implementation |
| providerBoundary | no-provider |
| publicBoundary | private-only |
| guardOwner | existing workspace design/runtime boundary guards; no checker mutation in this batch |

## Workspace Two-Layer Control Block

| Field | Disposition |
|---|---|
| targetLayer | BOTH_WITH_BOUNDARY |
| operatorSurface | read-only projection sections for a future CVF Web Workspace |
| agentExecutionSurface | local projection vocabulary only; no MCP, CLI, IDE, queue, or runtime action |
| sourceOfTruth | CVF active session state, generated workspace state, handoff, work orders, reviews, receipts, and guard outputs |
| mutationBoundary | no mutation |
| receiptBoundary | completion and gate evidence only; no runtime receipt is created |
| forbiddenConflationCheck | Web read model and Local Workspace Runtime are not merged or treated as proof of each other |

## Dual Agent Surface Matrix

| Consumer class | Interface or owner surface | Authority and risk boundary | Evidence | Adapter boundary | Disposition |
|---|---|---|---|---|---|
| `INTERNAL_AGENT` | `docs/reference/agent_workspace/` read-model reference | internal agents may read this as governed guidance only | this reference and source verification rows | N/A with reason: no adapter created | CONTRACT_ONLY |
| `EXTERNAL_AGENT_CLI_MCP` | future CLI/MCP projection adapter owner remains deferred | external agents get no new executable support from this reference | dual-surface standard and runtime expansion contract | deferred adapter owner; fresh GC-018 required before CLI/MCP implementation | DEFERRED_WITH_REASON |

## Required Future Work Order Use

Any future implementation that uses this read model must:

- cite this reference and the workspace runtime expansion readiness contract;
- select `READ_MODEL_ONLY`, `RUNTIME_IMPLEMENTATION_REQUESTED`,
  `PROVIDER_LIVE_REQUESTED`, or `PUBLIC_SYNC_REQUESTED` explicitly;
- source-verify every runtime field, schema key, CLI/MCP tool name, and route;
- keep Web operator view work separate from Local Workspace Runtime work unless
  a `BOTH_WITH_BOUNDARY` control block names both surfaces;
- provide receipt or command evidence before claiming guard, runtime, or
  provider behavior;
- update generated state only through its source fragments and generator.

## External Knowledge Intake Routing

| Field | Disposition |
|---|---|
| Chain map | `docs/reference/external_agent_review/CVF_EXTERNAL_KNOWLEDGE_ABSORPTION_CHAIN_MAP.md` |
| Input type | external repo or copied folder |
| Chain map route | root/folder lifecycle classification plus absorption map when retained |
| Matching local-view guard | `governance/compat/check_external_knowledge_intake_routing.py`; `governance/compat/check_external_agent_absorption_table.py`; `governance/compat/check_foundation_storage_layout.py` |
| Owner surface | `docs/reference/agent_workspace/` |
| Disposition | ADAPT package projection vocabulary into CVF-owned read-model reference |
| Claim boundary | package files remain comparison input only; no raw package authority, runtime, MCP, CLI, IDE bridge, provider, public-sync, or readiness claim |

## Delta Execution Claim Boundary Control Block

| Field | Disposition |
|---|---|
| claimScope | local workspace projection read-model decision |
| claimDisposition | BOUNDED_CLAIM_WITH_EVIDENCE |
| receiptEvidence | CVF_RECEIPT_PRESENT: source verification rows, gate output, and material commit evidence |
| actionEvidence | ACTION_EVIDENCE_PRESENT: reference mapping and changed-file manifest |
| invocationBoundary | local source reads and governed markdown edits only |
| interceptionBoundary | no IDE, shell, git, filesystem, provider, CLI, or MCP interception claim |
| claimLanguage | read-model decision and reference mapping only |
| forbiddenExpansion | no runtime queue, MCP tool, CLI adapter, IDE bridge, provider/live proof, public-sync, generated workspace state mutation, resolver mutation, package activation, certification decision, or DICE work |

## Agent Operation Trace Block

| Field | Evidence |
|---|---|
| Actor | Codex |
| Provider or surface | Codex local workspace |
| Session or invocation | 2026-06-27 local workspace projection read-model decision |
| Working directory | `D:\UNG DUNG AI\TOOL AI 2026\Controlled-Vibe-Framework-CVF` |
| Command or tool surface | PowerShell, rg, apply_patch, python governance gates, git |
| Target paths | `docs/reference/agent_workspace/CVF_LOCAL_WORKSPACE_PROJECTION_READ_MODEL_DECISION.md` |
| Allowed scope source | active session next allowed move after workspace layer full package absorption |
| Before status evidence | HEAD `fa3c25e5`; clean worktree |
| After status evidence | material closure pending commit |
| Diff evidence | `git diff --name-status fa3c25e5..HEAD` |
| Approval boundary | decision-first read-model foundation only |
| Claim boundary | no runtime, MCP, CLI, IDE bridge, provider/live, public-sync, generated workspace state mutation, resolver mutation, adapter mutation, package activation, certification decision, or DICE work |
| Agent type | Codex dispatcher/implementer/reviewer/closer |
| Invocation ID | `lwprm-t0-t4-local-workspace-projection-read-model-2026-06-27` |
| Expected manifest | this reference file |
| Actual changed set | this reference file |
| Manifest delta | MATCH |
| Deletion or rename disposition | N/A with reason: no deletion or rename |

## Public Export Disposition

DEFERRED_PRIVATE_ONLY

Reason: private provenance workspace foundation. No public-sync batch is
authorized.

## Claim Boundary

This reference defines a read model. It does not build UI, runtime queues, MCP
tools, CLI adapters, IDE bridges, provider calls, public-sync, resolver or
adapter mutations, package activation, package certification, generated
workspace-state changes, production readiness, or public readiness.
