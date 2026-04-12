# CVF W7 External Asset Compiler Guide

> **Document Type:** INTERNAL DESIGN DRAFT
> **Status:** Synthesized from promoted `CVF ADDING NEW` materials on 2026-04-12
> **Source Quality:** internal_design_draft with mixed-intake rationale
> **Scope:** component mapping and no-raw-asset rules for compiling external repos into W7 assets
> **Scope Boundary:** This guide covers external repo -> W7 asset conversion only. It does not overlap with the Alibaba provider PVV workstream.

## 1. Purpose

This guide defines the canonical design intent for converting external repo material into W7-compliant assets without creating a parallel runtime.

## 2. Core Rules

### 2.1 No Raw Asset Rule

No external component may enter CVF runtime or registry as a raw artifact.

Required path:

```text
ingest
-> classify
-> normalize
-> compile
-> validate
-> register
```

### 2.2 Layer Separation

Every imported component must be separated into:

- definition
- execution
- governance

### 2.3 No Direct Execution

Imported commands, skills, workflows, or hooks must not execute directly.

They must flow through:

```text
command
-> planner
-> decision
-> policy gate
-> runtime
```

## 3. Component Mapping

| External Component | W7 Target | Notes |
| --- | --- | --- |
| slash command / command doc | `W7CommandAsset` | intent carrier, not direct logic |
| CLAUDE.md rule content | `W7PolicyAsset` | hard constraints only |
| CLAUDE.md contextual guidance | `W7ContextAsset` | soft context injection |
| reusable skill definition | `W7SkillAsset` | execution unit after governance |
| subagent definition | `W7AgentAsset` | isolated worker surface |
| workflow template | `W7PlannerAsset` | orchestration graph |
| hook / interceptor | guard extension or policy binding | never a free-running hook path |
| MCP or plugin integration | `W7ToolAsset` | external capability surface |
| examples / guides | `W7LearningAsset` | learning input only, never direct runtime authority |

## 4. Guarded Adoption Rules

1. Commands are entry points, not implementation bodies.
2. Policy and context must be separated even if source material mixes them.
3. Tool assets require real tool-binding content to pass normalization.
4. Learning assets remain downstream evidence or pattern sources, never direct runtime authority.

## 5. Relationship To CLI

The W7 CLI is the operator surface that should drive this compiler path.

Related promoted drafts:

- [CVF_W7_CLI_SCHEMA_CONTRACTS.md](./CVF_W7_CLI_SCHEMA_CONTRACTS.md)
- [CVF_W7_CLI_GOVERNANCE_BINDINGS.md](./CVF_W7_CLI_GOVERNANCE_BINDINGS.md)
- [CVF_W7_CLI_MVP_SCOPE.md](./CVF_W7_CLI_MVP_SCOPE.md)
- [CVF_W7_CLI_WORKSPACE_AND_STATE.md](./CVF_W7_CLI_WORKSPACE_AND_STATE.md)

## 6. Final Rule

CVF does not import external repos as systems.

CVF compiles them into governed asset candidates and admits only what survives W7 validation and governance.
