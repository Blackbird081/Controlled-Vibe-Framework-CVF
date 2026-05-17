# CVF Agent Tool Memory Observability Boundary Spec - 2026-05-16

Memory class: POINTER_RECORD

Document type: CANONICAL-CANDIDATE - CVF BOUNDARY SPEC

Source lineage: normalized from CVF 16.5 `Claude Kit`, `OpenAgentd`,
`agentmemory`, `abtop`, and `pancake-pos-mcp` drafts.

## Purpose

This document consolidates the reusable agent, tool, memory, MCP, and
observability boundaries from the CVF 16.5 legacy bundle.

It does not create a new runtime. It gives future implementation tranches a
single boundary map to avoid repeated rereading and token waste.

## Source Destination Map

This spec is a map over existing owner surfaces, not a new owner surface.

| Source folder | Source-declared destination | Existing CVF overlap | Disposition |
|---|---|---|---|
| `Claude Kit` | `EXTENSIONS/CVF_EXECUTION_PLANE_FOUNDATION/agent_registry/`, `EXTENSIONS/CVF_GOVERNANCE_EXPANSION_FOUNDATION/agent_governance/`, `EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION/agent_orchestration/` | `EXTENSIONS/CVF_AGENT_DEFINITION/README.md`, `EXTENSIONS/CVF_AGENT_LEDGER/README.md`, `EXTENSIONS/CVF_ECO_v2.3_AGENT_IDENTITY/README.md`, `EXTENSIONS/CVF_ECO_v2.0_AGENT_GUARD_SDK/README.md` | Adopt as agent registry, permission, handoff, and audit deltas |
| `OpenAgentd` | Docs across `CVF_v1.6_AGENT_PLATFORM`, Control, Execution, Governance, Learning | Agent platform, sandbox, telemetry, tool-call tracing surfaces | Adopt trace/sandbox/telemetry deltas; defer cockpit OS |
| `agentmemory` | Memory docs under Learning, Control, Governance, Guard Contract | Knowledge Layer, Context Builder, Learning Plane | Adopt controlled memory policy; defer memory runtime |
| `abtop` | `EXTENSIONS/CVF_OBSERVABILITY_PLANE_FOUNDATION/` | `EXTENSIONS/CVF_v1.8.1_ADAPTIVE_OBSERVABILITY_RUNTIME/README.md` | Treat as delta on v1.8.1, not a new plane by default |
| `pancake-pos-mcp` | `EXTENSIONS/CVF_EXECUTION_PLANE_FOUNDATION/src/mcp-business-adapter/` | Execution Plane adapter boundary | Adopt 7 generic MCP primitives as high-fit candidates; defer Pancake profile |

## Core Rule

Agents, tools, memory, MCP endpoints, and observability streams are subordinate
to CVF. They may provide capability or visibility. They may not become policy
authority.

## Agent Boundary

Every external or specialized agent must be registered before it can act:

```yaml
agent_record:
  agent_id: string
  role: string
  allowed_phase: []
  allowed_tools: []
  permission_profile: string
  risk_level: low|medium|high|critical
  approval_required: boolean
  output_contract: string
  audit_required: boolean
```

Minimum permission profiles:

- `read_only`
- `write_docs`
- `write_code_limited`
- `run_tests`
- `read_only_security`
- `database_limited`
- `deployment_guarded`

Agents may not change their own permission profile.

## Handoff Boundary

Agent handoff must be structured:

```yaml
agent_handoff:
  task_summary: string
  files_touched: []
  decisions_made: []
  risks_found: []
  next_required_action: string
  open_questions: []
  audit_reference: string
```

Free-form chat is not enough for governed delegation.

## Tool Call Trace

No tool call is invisible.

Required lifecycle:

```text
tool_call
-> policy_check
-> tool_start
-> tool_end | tool_error | tool_blocked
-> audit_receipt
```

Trace requirements:

- session id;
- agent id;
- tool name;
- arguments hash;
- risk level;
- policy decision;
- duration;
- safe result summary or error;
- audit receipt id.

Raw arguments and results should be redacted or permission-gated by default.

## MCP Business Tool Boundary

Business MCP tools must have a contract before execution:

```yaml
mcp_business_tool:
  tool_id: string
  domain: string
  action: string
  risk_level: read_only|low_risk_write|high_risk_write|destructive|system_config
  input_schema: {}
  output_schema: {}
  requires_approval: boolean
  mutation_type: none|create|update|delete|external_send|system_change
  audit_required: boolean
```

Approval posture:

| Risk | Default action |
|---|---|
| read-only | allow with receipt |
| low-risk write | allow with receipt if policy permits |
| high-risk write | approval required |
| destructive | explicit approval and reason required |
| system config | admin approval required |

Domain-specific profiles such as Pancake POS may inform the pattern, but must
not be hardcoded into CVF core.

The generic MCP business adapter pattern is high fit because 7 of the 8 source
files are domain-agnostic primitives. Only `pancake-pos-mcp.profile.ts` is
domain-specific and deferred.

## Memory Boundary

Memory is a controlled capability, not hidden authority.

Allowed memory flow:

```text
event signal
-> privacy filter
-> lifecycle classification
-> controlled memory gateway
-> retrieval policy
-> context packager
-> governed reinjection
```

Memory must preserve:

- project/workspace scope;
- sensitivity;
- provenance;
- freshness;
- contradiction state;
- reinjection policy;
- audit reference.

Agents may not read/write/reinject raw memory outside the controlled gateway.

## Observability Boundary

Observability may observe, summarize, alert, emit receipts, and recommend
escalation.

This section is a delta on
`EXTENSIONS/CVF_v1.8.1_ADAPTIVE_OBSERVABILITY_RUNTIME/README.md`. A new
`CVF_OBSERVABILITY_PLANE_FOUNDATION` must not be opened by default.

Observability must not:

- approve actions;
- kill processes;
- reroute providers;
- mutate policy;
- bypass execution gates;
- claim live governance enforcement without proof.

Useful event classes:

- `SESSION_STARTED`
- `TOKEN_USAGE_UPDATED`
- `CONTEXT_WINDOW_WARNING`
- `RATE_LIMIT_WARNING`
- `QUOTA_PRESSURE_DETECTED`
- `PROCESS_ORPHANED`
- `PORT_ORPHANED`
- `DASHBOARD_ALERT_RAISED`
- `ESCALATION_RECOMMENDED`

## Scheduler And Sandbox Boundary

Scheduled agent execution is high-risk by default because it can run without a
human actively watching.

Every scheduled execution must define:

- schedule owner;
- allowed phase;
- allowed tools;
- sandbox tier;
- approval posture;
- timeout;
- receipt requirement;
- rollback or stop condition.

Local sandbox permissions must be explicit for filesystem, shell, web, MCP,
generation, and scheduler access.

## Runtime Boundary

This document is a boundary spec only. It does not prove or implement agent
registry, tool tracing, memory runtime, observability dashboard, scheduler, or
MCP enforcement.

Future work must choose one bounded owner surface and provide tests plus live
governance proof when claiming enforcement.
