# CVF Multi-Agent Orchestration Reference Front Door

Memory class: POINTER_RECORD

Status: ACTIVE_INDEX

docType: reference

Date: 2026-07-11

Batch ID: MAO-T0

executionBaseHead: `209a9b4b3`

EPISTEMIC_PROCESS_NA_WITH_REASON: this is a stable folder front door and
index. It makes no empirical or runtime-behavior claim.

## Purpose

Provide the stable folder front door for the CVF Multi-Agent Orchestration
(MAO) runtime-foundation documentation and schema family. Future agents read
this folder before proposing, designing, or implementing any MAO task graph,
event ledger, role resolver, delegation adapter, reviewer isolation, closer/
commit interlock, lifecycle controller, or evidence/receipt surface.

## Scope / Target / Owner Boundary

Target: bounded, evidence-first documentation and schema foundation for a
future CVF multi-agent orchestration runtime.

Owner boundary: this folder owns MAO source inventory, architecture
decisions, and schema definitions only. It does not build a runtime, call a
provider, create a queue/scheduler/UI, edit a registry, public-sync, or
authorize production/public readiness.

## Central Core

Governing roadmap:

`docs/roadmaps/CVF_MULTI_AGENT_ORCHESTRATION_RUNTIME_FOUNDATION_ROADMAP_2026-07-11.md`

Accepted critique reconciliation:

`docs/reviews/CVF_MAO_ROADMAP_EXTERNAL_CRITIQUE_INTERNAL_RECONCILIATION_2026-07-11.md`

Agent Handoff Contract (upstream authority for route/phase/closer/commit):

`docs/reference/CVF_AHB_T2_AGENT_HANDOFF_CONTRACT_RATIFICATION_2026-06-16.md`

Agent workspace front door (upstream authority for workspace projection and
runtime-expansion boundary):

`docs/reference/agent_workspace/README.md`

## Local Views

| Local view | Role |
|---|---|
| `docs/reference/multi_agent_orchestration/CVF_MAO_T0_SOURCE_INVENTORY_AND_OVERLAP_DECISIONS.md` | Definitive source inventory, REUSE/ADAPT/REJECT decisions, and the three-caveat compatibility analysis |
| `docs/reference/multi_agent_orchestration/CVF_MAO_RUNTIME_FOUNDATION_CONTRACT.md` | Architecture decisions, lifecycle/state transition tables, risk/cost/retry model, storage/retention decision, and threat/failure model |
| `docs/reference/multi_agent_orchestration/CVF_MAO_RUNTIME_FOUNDATION_SCHEMA.json` | JSON Schema for task graph, event ledger, receipts, capability/authority envelope, and generated read model |
| `docs/roadmaps/CVF_MULTI_AGENT_ORCHESTRATION_RUNTIME_FOUNDATION_ROADMAP_2026-07-11.md` | Governing roadmap: tranche sequence MAO-T0 through MAO-T9 |
| `docs/reviews/CVF_MAO_ROADMAP_EXTERNAL_CRITIQUE_INTERNAL_RECONCILIATION_2026-07-11.md` | Accepted external critique classification with three T0 caveats |
| `docs/reference/CVF_AHB_T2_AGENT_HANDOFF_CONTRACT_RATIFICATION_2026-06-16.md` | Upstream authority for route, phase, base-head, trace, commit owner, and closer identity |
| `docs/reference/agent_workspace/README.md` | Upstream authority for workspace state topology and runtime-expansion boundary |
| `docs/reference/archive/CVF_INTERNAL_MULTI_AGENT_WORK_TRANSFER_PACKET_STANDARD_2026-05-26.md` | Archived MA1 packet; evidence and design history only, not active authority |

## Required Read Trigger

Read this folder when a task:

- proposes, designs, or implements any part of the MAO runtime foundation
  (task graph, event ledger, role resolver, delegation adapter, reviewer
  isolation, closer/commit interlock, lifecycle controller, evidence/receipt
  surface);
- extends or reuses `MultiAgentCoordinationContract`, `MultiAgentRuntime`,
  or `ProviderRouterContract` for orchestration purposes;
- proposes a new MAO schema field, receipt kind, or lifecycle state;
- needs to decide whether an orchestration artifact is MAO-owned or belongs
  to an existing CVF control surface (AHB, workspace, commit steward, ASC).

## Tranche Status

| Tranche | Deliverable | Status |
|---|---|---|
| MAO-T0 | source inventory, architecture decisions, schemas (this folder) | this tranche's worker-return packet records `COMPLETE_PENDING_REVIEW` pending independent reviewer acceptance |
| MAO-T1 | task graph and state contract | not dispatched; depends on T0 acceptance |
| MAO-T2 through MAO-T9 | risk resolver, delegation adapter, reviewer isolation, closer/commit interlock, lifecycle recovery, evidence/observability, pilot, independent critique and closure | not dispatched; see governing roadmap Work Plan And Dependencies |

## Archive Policy

Stable files in this folder are updated in place and proven through GC-018,
work order, completion review, and git history. Superseded stable MAO design
files move to `docs/reference/multi_agent_orchestration/archive/` only under
a separate governed archive batch.

## Agent Operation Trace Block

| Field | Evidence |
|---|---|
| Actor | delegated worker |
| Provider or surface | local private provenance repository |
| Session or invocation | MAO-T0 execution, 2026-07-11 |
| Working directory | `D:\UNG DUNG AI\TOOL AI 2026\Controlled-Vibe-Framework-CVF` |
| Command or tool surface | Read, Grep, Bash (git, python, rg - read-only and local validation only) |
| Target paths | `docs/reference/multi_agent_orchestration/README.md`; `docs/reference/multi_agent_orchestration/CVF_MAO_T0_SOURCE_INVENTORY_AND_OVERLAP_DECISIONS.md`; `docs/reference/multi_agent_orchestration/CVF_MAO_RUNTIME_FOUNDATION_CONTRACT.md`; `docs/reference/multi_agent_orchestration/CVF_MAO_RUNTIME_FOUNDATION_SCHEMA.json` |
| Allowed scope source | `docs/work_orders/CVF_AGENT_WORK_ORDER_MAO_T0_SOURCE_INVENTORY_ARCHITECTURE_DECISIONS_AND_SCHEMAS_2026-07-11.md` Scope / Target / Owner Boundary |
| Before status evidence | HEAD `209a9b4b3491a7e622450a5b42ad98af2d2edd2d`; clean worktree |
| After status evidence | four new untracked files under `docs/reference/multi_agent_orchestration/`; HEAD unchanged (worker no-commit) |
| Diff evidence | `git status --short` shows `?? docs/reference/multi_agent_orchestration/` |
| Approval boundary | worker execution only; no commit authority; reviewer/closer decides acceptance |
| Claim boundary | MAO-T0 documentation/schema front door only; no runtime/provider/public/session claim |
| Agent type | worker |
| Invocation ID | `mao-t0-delegated-worker-2026-07-11` |
| Expected manifest | `docs/reference/multi_agent_orchestration/README.md`; `docs/reference/multi_agent_orchestration/CVF_MAO_T0_SOURCE_INVENTORY_AND_OVERLAP_DECISIONS.md`; `docs/reference/multi_agent_orchestration/CVF_MAO_RUNTIME_FOUNDATION_CONTRACT.md`; `docs/reference/multi_agent_orchestration/CVF_MAO_RUNTIME_FOUNDATION_SCHEMA.json` |
| Actual changed set | `docs/reference/multi_agent_orchestration/README.md`; `docs/reference/multi_agent_orchestration/CVF_MAO_T0_SOURCE_INVENTORY_AND_OVERLAP_DECISIONS.md`; `docs/reference/multi_agent_orchestration/CVF_MAO_RUNTIME_FOUNDATION_CONTRACT.md`; `docs/reference/multi_agent_orchestration/CVF_MAO_RUNTIME_FOUNDATION_SCHEMA.json` |
| Manifest delta | MATCH |
| Deletion or rename disposition | N/A with reason: no deletion or rename in this tranche |

## Public Export Disposition

DEFERRED_PRIVATE_ONLY

Reason: private provenance architecture/schema foundation. No public-sync
batch is authorized by this tranche.

## Claim Boundary

This README is a stable pointer record. It does not authorize runtime
behavior, provider calls, public-sync, autonomous mutation, or production/
public readiness claims.
