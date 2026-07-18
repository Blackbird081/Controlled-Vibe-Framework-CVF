# CVF Agent Delegation And Subagent Boundary Standard

Memory class: POINTER_RECORD

Status: DEFINED - procedural standard for bounded delegation and subagent use.

## Purpose

Define when CVF may delegate work to a specialist worker or subagent, what that
worker may receive, what it may emit, and which boundaries stop execution.

This standard converts legacy delegation and subagent material into a
CVF-native operating boundary. It is designed for Agent Work Orders and future
roadmap implementation planning. It does not implement a runtime scheduler.

## Scope

In scope:

- delegation decision rules;
- worker/subagent preconditions;
- context, tool, artifact, memory, time, and communication boundaries;
- refusal, escalation, termination, and review gates;
- source reuse decisions for role/delegation/subagent legacy material.

Out of scope:

- live subagent spawning;
- autonomous parallel runtimes;
- runtime worker registry implementation;
- provider prompt reinjection;
- deployment or release authority;
- changing existing CPF/EPF delegation contracts.

Owner: CVF orchestration and delegation surface.

## Owner / Source

Canonical CVF references:

- `docs/reference/CVF_AGENT_ROLE_ASSIGNMENT_MATRIX_2026-05-19.md`
- `docs/reference/CVF_AGENT_EXECUTION_WORKFLOW_SOP_2026-05-19.md`
- `docs/reference/CVF_AGENT_WORK_ORDER_TEMPLATE_2026-05-19.md`
- `docs/reviews/archive/CVF_17_05_GOVERNANCE_KERNEL_OWNER_MAP_2026-05-17.md`
- `docs/reviews/archive/CVF_17_05_LEGACY_ABSORPTION_GAP_LEDGER_2026-05-18.md`
- `docs/reviews/archive/CVF_LEGACY_PHASE_D_ORCHESTRATOR_TRANCHE_COMPLETION_2026-05-18.md`

Legacy source material re-opened:

- `.private_reference/legacy/CVF ADD/Human System Harness/CVF_ORCHESTRATOR_DELEGATION_CONTRACT.md`
- `.private_reference/legacy/CVF ADD/deepagents/CVF_WORKER_DELEGATION_CONTRACT.md`
- `.private_reference/legacy/CVF ADD/deepagents/CVF_SUBAGENT_EXECUTION_BOUNDARY.md`
- `.private_reference/legacy/CVF ADD/Agent Harnesses/CVF_WORKER_SESSION_CONTRACT.md`
- `.private_reference/legacy/CVF ADD/Agent Harnesses/CVF_EXECUTION_SESSION_PROTOCOL.md`
- `.private_reference/legacy/CVF ADD/Agent Harnesses/CVF_SESSION_VALIDATION_GATE_SPEC.md`
- `.private_reference/legacy/CVF 16.5/Claude Kit/CVF_AGENT_ROLE_CATALOG.md`
- `.private_reference/legacy/CVF_Important/ADDING_CONTEXT CONTROL/CVF_AGENT_ROLE_EXECUTION_SPEC.md`

## Protocol / Contract / Requirements

### Core Principle

Delegation is not delegation of authority. Delegation is bounded execution
within pre-authorized scope.

A worker or subagent is subordinate to CVF governance. It may execute only the
assigned task and may not self-upgrade, self-authorize, spawn unmanaged
workers, write durable truth memory, or bypass policy gates.

## Rule

No delegation may occur without a bounded task, explicit authority chain,
minimal context package, allowed tool list, result contract, escalation route,
and review gate.

## Allowed And Forbidden Requirements

Allowed:

- delegate scoped implementation, testing, documentation, audit, or specialist
  research when it materially improves the work;
- pass only task-relevant context and constraints;
- require refusal when the contract cannot be safely satisfied;
- record worker output as candidate evidence pending review.

Forbidden:

- delegate governance authority;
- grant unrestricted tools or memory;
- spawn unmanaged nested workers;
- write durable truth memory from a worker by default;
- bypass policy, review, or operator escalation.

## Exceptions

Exceptions require explicit operator or governance record when:

- nested delegation is needed;
- a worker needs a tool outside the original scope;
- persistent memory write authority is required;
- the orchestrator executes fallback work instead of delegating to a matching
  specialist lane.

## Enforcement Surface

The enforcement surface is procedural in this document:

- Agent Work Orders;
- delegation contracts and handoff records;
- GC-018 authorization packets;
- evidence trace blocks;
- review and completion packets;
- active session and handoff guards.

Runtime worker isolation remains out of scope.

### Delegation Decision

Delegation is allowed only when all conditions hold:

1. The task objective is bounded and testable.
2. Delegation materially improves execution quality, focus, safety, or
   parallel progress.
3. The worker class or specialist lane is identified.
4. The task class is eligible for that worker.
5. The required tool scope is explicit and minimal.
6. The context package is buildable and relevance-filtered.
7. Policy and risk gates admit the delegation.
8. Audit lineage can be preserved.

Delegation is mandatory only when a registered specialist lane exists, the task
matches that lane, policy permits the handoff, and no explicit operator or
governance exception is recorded.

Delegation is forbidden when the task is unbounded, authority would be
transferred, context cannot be safely packaged, tool scope is open-ended, or
the worker would need to create unmanaged child workers.

### Mandatory Delegation Packet

Every delegated task must define:

- delegation id;
- parent request id or trace id;
- delegator surface;
- worker class or specialist role;
- task objective;
- completion criteria;
- refusal criteria;
- allowed tools;
- forbidden tools;
- allowed artifact classes;
- prohibited artifact classes;
- context package;
- result contract;
- timeout and cancellation policy;
- escalation route;
- review gate;
- memory write authority, defaulting to none.

### Context Boundary

The worker receives the smallest context sufficient for correct execution:

- task objective;
- required output;
- key constraints;
- acceptance checklist;
- necessary domain context;
- trace reference to the upstream brief.

The worker must not receive unrelated user history, unrelated worker state,
full boardroom history, unrelated codebase fragments, hidden policy internals,
or full parent context unless explicitly required and approved.

### Tool Boundary

Tool scope must be explicit, minimal, task-relevant, and revocable.

A worker must refuse or escalate if it needs a tool outside the assigned scope.
Tool improvisation is forbidden.

### Artifact Boundary

A worker may emit only:

- result artifacts defined by the delegation packet;
- supporting traces;
- bounded progress summaries;
- refusal reports;
- failure reports;
- escalation messages.

A worker must not emit undeclared deploy manifests, undeclared executable
outputs, undeclared memory commits, or undeclared cross-worker transfer bundles.

### Memory Boundary

Default worker and subagent memory authority:

- no persistent memory write;
- no truth memory write;
- no registry mutation;
- no archive write;
- temporary notes and candidate observations only.

Persistence decisions occur outside the worker boundary through orchestrator,
reviewer, auditor, or an explicitly authorized memory contract.

### Communication Boundary

A worker may communicate only through:

- progress update;
- bounded result artifact;
- refusal report;
- failure report;
- governed escalation message.

Side channels to other workers, external operator surfaces, learning-plane
persistence endpoints, or privileged deploy surfaces are forbidden unless a
specific contract authorizes them.

### Time And Termination Boundary

Every delegated task must have a termination condition:

- completion criteria met;
- refusal criteria met;
- cancellation enforced;
- timeout reached;
- policy interruption issued;
- execution failure becomes terminal.

Unbounded execution is invalid.

### Refusal And Escalation

Refusal is a valid governed outcome.

A worker must refuse or escalate when:

- context is insufficient;
- scope is ambiguous beyond tolerance;
- required tool is forbidden;
- artifact class is forbidden;
- risk rises above admitted class;
- expected output would violate the result contract;
- policy conflict is detected.

Escalation returns to the orchestrator or operator-approved governance surface.

## Enforcement / Verification

This standard is enforced through:

- Agent Work Order role assignment;
- explicit write ownership and forbidden paths;
- review gate before closure;
- evidence trace blocks;
- active session and handoff gates;
- tests or live proof when a runtime claim requires it.

This standard does not create a live scheduler, worker registry, or technical
subagent isolation mechanism by itself.

## Boundaries / Non-Goals

Do not use this standard to:

- bypass GC-018;
- grant unrestricted tool or memory authority;
- claim runtime-enforced worker isolation;
- spawn nested workers by default;
- make orchestrator convenience a reason to skip specialist routing;
- treat worker output as durable memory without review.

## Source Reuse Decisions

| Source | Decision | CVF-native result |
|---|---|---|
| `CVF_ORCHESTRATOR_DELEGATION_CONTRACT.md` | normalize | Orchestrator may classify, decompose, delegate, supervise, integrate, and escalate. It must not absorb specialist work when a registered lane exists. |
| `CVF_WORKER_DELEGATION_CONTRACT.md` | reuse | Delegation packet fields, task objective rules, refusal contract, worker obligations, nested delegation boundary, and tool/context/artifact rules. |
| `CVF_SUBAGENT_EXECUTION_BOUNDARY.md` | reuse | Subagent identity, hard prohibitions, isolation modes, context/tool/artifact/memory boundaries, violation classes, and audit requirements. |
| `CVF_WORKER_SESSION_CONTRACT.md` | reuse | Worker input, execution rules, output, prohibitions, and enforcement expectations. |
| `CVF_EXECUTION_SESSION_PROTOCOL.md` | normalize | State restore, baseline validation, task selection, execution, validation, artifact emission, and handoff become session gates. |
| `CVF_SESSION_VALIDATION_GATE_SPEC.md` | reuse | Pre-execution, post-execution, pre-handoff, and freeze gates. |
| `CVF_AGENT_ROLE_CATALOG.md` | normalize | Role templates inform worker class selection without becoming autonomous authorities. |
| `CVF_AGENT_ROLE_EXECUTION_SPEC.md` | defer | Router APIs and deterministic runtime role execution remain future runtime work. |

## Boundary Violation Classes

Canonical violation classes for delegated work:

- `SCOPE_ESCAPE`
- `TOOL_ESCAPE`
- `CONTEXT_LEAK`
- `MEMORY_ESCAPE`
- `ARTIFACT_ESCAPE`
- `POLICY_BYPASS_ATTEMPT`
- `UNMANAGED_CHILD_CREATION`
- `UNAUTHORIZED_DEPLOY_ATTEMPT`
- `ROLE_SELF_UPGRADE`
- `MISSING_TRACE`
- `SILENT_COMPLETION`
- `MISSING_ARTIFACT`

## Review Gate

Delegated work cannot close until:

- output exists;
- trace exists;
- validation status is recorded;
- next step is defined;
- reviewer no-blocking disposition or operator waiver is recorded;
- any violation signal is either resolved or escalated.

## Related Artifacts

- `docs/reference/CVF_AGENT_ROLE_ASSIGNMENT_MATRIX_2026-05-19.md`
- `docs/work_orders/CVF_AGENT_WORK_ORDER_AGENT_ROLE_ASSIGNMENT_2026-05-19.md`
- `docs/work_orders/CVF_AGENT_WORK_ORDER_LANE_BCH_2026-05-19.md`
- `EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION/src/delegation.contract.ts`
- `EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION/src/agent.handoff.contract.ts`
- `EXTENSIONS/CVF_EXECUTION_PLANE_FOUNDATION/src/delegation.boundary.guard.contract.ts`

## Claim Boundary

This standard defines the procedural boundary for delegated agent and subagent
work. It does not prove live subagent isolation, worker-lane routing, scheduler
lifecycle, or runtime ORCHESTRATOR enforcement. Runtime claims require a future
scoped implementation and evidence packet.
