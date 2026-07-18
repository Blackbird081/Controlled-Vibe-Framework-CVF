# CVF Project Role And Provider Delegation Envelope

Memory class: POINTER_RECORD

Status: ACTIVE_REFERENCE

docType: reference

Date: 2026-06-20

**Applies to:** any operator and role starting governed project work that
assigns roles, delegates bounded execution, or selects a provider lane.

EPISTEMIC_PROCESS_NA_WITH_REASON: reference envelope - it routes operator
approval and role/provider configuration; it makes no evidence claims or
source-backed assertions that require comparison.

## Purpose

Give an operator one private front door to approve, before agents begin governed
project work: who holds each role, what each role may and may not do, which
provider lane the operator has configured, the cost and quota ceiling, the
evidence each role must log, and what changes force reapproval.

This envelope exists so a noncoder operator and external agents understand the
delegation boundary up front instead of discovering it through gate failures.
It is a documentation and reference layer. It does not select providers, route
runtime traffic, call providers, or enforce behavior at runtime.

## When To Use

Use this envelope when:

- a new project profile is being set up before agents do governed work;
- roles are being assigned across more than one lane;
- the operator is choosing which provider lane is allowed for a project;
- a project's cost or quota ceiling needs to be set or changed;
- a reapproval trigger below has fired.

Do not use this envelope as a runtime router, an automated provider selector, or
a substitute for the canonical role, delegation, or provider-routing standards
named in Related Surfaces.

## Operator Approval Envelope

Before any role begins governed project work, the operator approves a project
profile with at least:

| Field | Value or placeholder |
|---|---|
| Project identifier | project name or N/A with reason |
| Operator approval timestamp | timestamp or placeholder for project start |
| Approved role lanes | the role lanes active for this project |
| Approved provider lane | the single provider lane the operator configured, or N/A with reason |
| Cost and quota ceiling | configured ceiling and stop condition |
| Evidence log location | where role evidence is recorded |
| Reapproval triggers acknowledged | yes/no |

Approval is operator authority. A worker, reviewer, or subagent cannot
self-approve a project profile, widen it, or select a provider lane the operator
did not configure.

## Role And Delegation Map

Delegation is bounded execution within pre-authorized scope, not transfer of
authority. A delegated role may execute only its assigned task and may not
self-upgrade, self-authorize, spawn unmanaged workers, write durable truth
memory, or bypass policy gates.

| Role | Responsibility | Allowed tools (configured per project) | Forbidden | Output | Reviewer gate |
|---|---|---|---|---|---|
| Operator | Project authority, role/provider-lane approval, cost/quota ceiling | approval and configuration surfaces | replace evidence or tests | decision, lane selection, ceiling | n/a (is the authority) |
| Dispatcher / dispatch author | Author GC-018 and work order; run pre-dispatch gate | read, work-order authoring surfaces | absorb worker execution; dispatch without pre-dispatch gate | dispatch packet | pre-dispatch gate |
| Worker | Execute the work order within scope; return for review without committing | only tools named in the delegation packet | commit; self-upgrade; widen scope; durable memory write | uncommitted deliverables submitted for review | worker-return fast gate |
| Reviewer | Review the worker return; repair allowed-scope defects | read, allowed-scope repair | silently approve; rewrite implementation as review | findings, disposition | reviewer-fast gate |
| Closer | Commit accepted material and closure artifacts | commit of reviewer/closer-owned paths | mix closure with worker changes | closure commit | committed-range pre-closure |
| Session-sync steward | Update active handoff, session state, next-move after closure | session-sync surfaces | append status to archived handoffs | updated session surfaces | active session state checks |

Each delegated task should carry a bounded delegation packet (delegation id,
authority chain, task objective, completion and refusal criteria, allowed and
forbidden tools, allowed and prohibited artifact classes, result contract,
escalation route, review gate, and memory-write authority defaulting to none),
per the delegation boundary standard in Related Surfaces.

## Provider Lane Selection Boundary

The operator selects one provider lane as project configuration. This envelope
records that selection; it does not perform it.

- Provider lane selection here is operator configuration, not automated
  selection by an agent or by CVF runtime.
- This envelope does not rank providers, claim provider quality, claim cost
  optimization, or route runtime traffic.
- Provider and model names, prices, quotas, availability, and capabilities are
  temporal. If named, they are project configuration examples only, never CVF
  source authority, and require operator-approved refresh for a specific
  project.
- Automated provider selection and runtime provider routing remain a separate
  runtime tranche requiring a fresh GC-018 and work order.

## Cost And Quota Ceiling

- The operator sets a configured cost and quota ceiling per project.
- The ceiling is a stop condition, not a measured cost-optimization claim.
- When the ceiling is reached, governed work stops and returns to the operator
  for reapproval.
- This envelope does not measure, optimize, or prove cost; it only records the
  configured ceiling and stop condition.

## Evidence Log

Each role records, per governed task, at least:

| Evidence field | Meaning |
|---|---|
| Role | the role lane that acted |
| Provider lane | the operator-configured provider lane in effect, or N/A with reason |
| Invocation surface | the local surface used (e.g., work order, fast gate) |
| Changed files | exact changed paths |
| Proof basis | which gate or check provided the evidence |
| Review gate | the review/closure gate that applied |
| Reapproval status | none, or which reapproval trigger fired |

The evidence log is local documentation. It is not a runtime telemetry stream,
a provider/live proof, or a public artifact.

## Reapproval Triggers

Operator reapproval is required before any of:

- scope expansion beyond the approved project profile;
- provider or model change, or any new provider lane;
- cost or quota ceiling change;
- live or provider proof;
- public-sync;
- runtime or source implementation;
- direct IDE/shell/git/filesystem interception;
- queue, daemon, watcher, or background service;
- any readiness, production, or public release claim.

## Non-Goals

This envelope is not:

- an automated provider selector or runtime router;
- a provider quality, cost-optimization, or speed claim;
- a runtime, MCP, watcher, daemon, or queue surface;
- a public-sync or readiness artifact;
- a replacement for the canonical role, delegation, or provider-routing
  standards.

## Delta Execution Claim Boundary Control Block

| Field | Disposition |
|---|---|
| claimScope | project role/provider delegation reference envelope - documentation and routing only |
| claimDisposition | N/A with reason: no Delta execution-control claim is made by this envelope |
| receiptEvidence | N/A with reason: no Delta receipt evidence is created or consumed |
| actionEvidence | N/A with reason: no runtime action is executed or observed |
| invocationBoundary | cooperating local operator/roles read this envelope manually |
| interceptionBoundary | no IDE/shell/git/filesystem/provider interception claim |
| claimLanguage | delegation reference envelope, not execution-control enforcement |
| forbiddenExpansion | automated provider selection, runtime provider routing, provider/live, MCP, wrapper/proxy enforcement, direct interception, arbitrary commands, EDIT/COMMIT execution, queue/daemon, watcher, public-sync, readiness, and universal control remain out of scope |

## Claim Boundary

This envelope is a private documentation and reference layer for operator-
approved project role and provider-lane configuration. It does not authorize
automated provider selection, runtime provider routing, provider/live proof,
MCP execution, public-sync, direct interception, automatic mutation, cost
optimization, production readiness, public release readiness, universal speed,
or universal governed-coding-control claims. Canonical standards, work orders,
machine checkers, and current session state still control.

## Related Surfaces

- `docs/reference/CVF_AGENT_ROLE_ASSIGNMENT_MATRIX_2026-05-19.md` - role lanes and assignment flow
- `docs/reference/CVF_AGENT_DELEGATION_AND_SUBAGENT_BOUNDARY_STANDARD_2026-05-19.md` - delegation packet and tool/memory boundaries
- `docs/reference/CVF_MODEL_GATEWAY_C02_PROVIDER_ROUTING_BOUNDARY_REWRITE_PLAN_2026-06-14.md` - provider-routing planning-only boundary
- `docs/reference/guard_orientation/README.md` - guard orientation index
- `docs/reference/CVF_OPERATIONAL_REFERENCE_INDEX_2026-05-23.md` - task-trigger lookup table
- public-sync `docs/guides/CVF_MULTI_AGENT_PROVIDER_ROUTING.md` - public north-star context only, not CVF source authority
