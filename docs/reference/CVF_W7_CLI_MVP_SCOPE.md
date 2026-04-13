# CVF W7 CLI MVP Scope

> **Document Type:** DEFERRED BY DESIGN
> **Status:** W71-T1 posture finalized 2026-04-13; CLI runtime not yet built; no CPF/LPF/cvf-web implementation evidence; intentionally deferred until a future CLI-build wave receives GC-018 authorization
> **Source Quality:** internal_design_draft
> **Scope:** Minimum viable scope for the first production-meaningful version of the CVF W7 CLI
> **Scope Boundary:** This MVP closes the external repo -> W7 asset -> governed plan/run path only. It is unrelated to the PVV Alibaba provider/API-key workstream.

## 1. Purpose

This document fixes the first shippable scope of the CLI and stops scope drift.

The MVP is not a general-purpose platform shell.
It is the minimum governed CLI surface required to:

- ingest external repo material
- map it into W7-compliant assets
- validate and register those assets
- build a plan from those assets
- execute a governed run
- inspect trace outcomes

## 2. MVP Goal

The CLI MVP is successful only if it can support this end-to-end path:

```text
external repo
-> asset ingest
-> classify
-> normalize
-> compile
-> validate
-> register
-> plan build
-> run exec
-> trace show
```

## 3. In-Scope Commands

### 3.1 System

- `cvf system doctor`
- `cvf system version`
- `cvf system config show`

### 3.2 Asset

- `cvf asset ingest`
- `cvf asset classify`
- `cvf asset normalize`
- `cvf asset compile`
- `cvf asset validate`
- `cvf asset register`
- `cvf asset show`
- `cvf asset list`

### 3.3 Plan

- `cvf plan build`
- `cvf plan inspect`
- `cvf plan validate`

### 3.4 Run

- `cvf run exec`
- `cvf run status`

### 3.5 Trace

- `cvf trace show`
- `cvf trace artifact`

## 4. Explicitly Out of Scope for MVP

- advanced asset diff or lineage tools
- asset removal or deactivation flows
- broad run cancel or resume support for all runtime classes
- direct memory mutation tools
- interactive wizard surfaces
- broad multi-workspace orchestration
- policy authoring or editing through CLI
- automatic learning-loop curation tools

## 5. Required Command Path by CVF Mapping

| Command | CVF Module Mapping | Required W7 Path |
| --- | --- | --- |
| asset ingest | intake + trust boundary | intake trace |
| asset classify | W7 governance integration | classification trace |
| asset normalize | W7 governance integration | normalization trace |
| asset compile | W7 governance integration + registry compatibility | compile trace + asset batch |
| asset validate | policy + guard + dependency validation | validation trace or report |
| asset register | registry modules | registration trace |
| plan build | boardroom or orchestrator | planner trace |
| run exec | execution authorization + runtime | runtime trace + artifacts |
| trace show | observability | trace retrieval |

## 6. Required Asset Types in MVP

The compiler path in MVP must support:

- `W7CommandAsset`
- `W7PolicyAsset`
- `W7ContextAsset`
- `W7SkillAsset`
- `W7AgentAsset`
- `W7PlannerAsset`
- `W7GuardExtension`
- `W7ToolAsset`
- `W7LearningAsset`

Conditional rule:

- Scripts or tool bindings are `Required-when` the candidate asset type is `W7ToolAsset`
- they are not always required for other asset classes

## 7. Required Contracts in MVP

The CLI MVP must implement the common contracts defined in [CVF_W7_CLI_SCHEMA_CONTRACTS.md](./CVF_W7_CLI_SCHEMA_CONTRACTS.md).

At minimum:

- request envelope
- response envelope
- error envelope
- validation report
- trace record
- artifact record
- stable exit codes

## 8. Required Workspace Support in MVP

The CLI MVP requires a dedicated workspace/state model, but the exact `.cvf/` layout remains under separate internal design review.

Current rule:

- deterministic local state is required
- trace-linked persistence is required
- hidden mutation outside declared workspace paths is forbidden

Detailed workspace canon is deferred to a heavier review pass before final adoption.

## 9. Required Governance in MVP

The following checks are mandatory and cannot be postponed:

- schema validation
- dependency integrity check
- policy evaluation for validate and run paths
- guard evaluation for validate and run paths
- authorization for runtime execution
- trace emission for all mutating commands

## 10. Required Output Modes in MVP

Minimum output support:

- `--output table`
- `--output json`

YAML may wait if needed.

## 11. MVP Acceptance Criteria

The MVP is complete only if all of the following are true:

1. A repo-like source can be ingested into a raw bundle.
2. The bundle can be classified and normalized into candidate components.
3. Candidate components can be compiled into W7-compliant asset specs.
4. Compiled assets can be validated with explicit pass or fail output.
5. Validated assets can be registered into the correct CVF registries.
6. A plan can be built from registered assets.
7. A governed run can be started from that plan.
8. The run produces trace-visible outputs.
9. All mutating commands emit trace-linked state.
10. No command bypasses the mapped CVF governance chain.

## 12. MVP Non-Negotiables

- no raw direct execution path
- no untraced registry mutation
- no runtime command without authorization
- no asset registration without validation
- no hidden local state mutation outside declared workspace support

## 13. MVP Completion Rule

MVP is done only when this path is reliably closed:

```text
external repo pattern
-> W7-compliant asset batch
-> registered CVF asset set
-> governed plan
-> governed run
-> trace-visible result
```

If that path is not closed, the MVP is not complete.
