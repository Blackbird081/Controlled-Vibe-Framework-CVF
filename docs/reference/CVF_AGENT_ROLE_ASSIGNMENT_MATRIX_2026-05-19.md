# CVF Agent Role Assignment Matrix

Memory class: POINTER_RECORD

Status: DEFINED - docs/reference standard for assigning agent roles before
delegated execution.

## Purpose

Define how CVF assigns agent roles for user requests, roadmap work, reviews,
implementation lanes, and specialist delegation.

This matrix exists to close the practical gap between "agent role concepts are
known" and "an orchestrator can assign the right role without scope drift." It
normalizes legacy role catalog and orchestrator material into CVF-native
dispatch language without claiming runtime enforcement.

## Scope

In scope:

- operator, orchestrator, planner, implementer, reviewer, auditor, and
  specialist worker/subagent assignment;
- role ownership for common CVF request classes;
- delegation-required, delegation-allowed, and delegation-forbidden decision
  points;
- review and escalation gates for agent-to-agent work.

Out of scope:

- runtime scheduler enforcement;
- autonomous worker pools;
- live subagent execution;
- changes to `AgentFunctionRole`, RBAC roles, or provider behavior;
- public capability claims.

Owner: CVF orchestration and delegation surface.

## Owner / Source

Canonical current CVF references:

- `AGENT_HANDOFF_V9_2026-05-18.md`
- `docs/reviews/archive/CVF_17_05_GOVERNANCE_KERNEL_OWNER_MAP_2026-05-17.md`
- `docs/reviews/archive/CVF_17_05_UNABSORBED_KERNEL_SOURCE_MATRIX_2026-05-17.md`
- `docs/reviews/archive/CVF_17_05_LEGACY_ABSORPTION_GAP_LEDGER_2026-05-18.md`
- `docs/reviews/archive/CVF_LEGACY_PHASE_D_ORCHESTRATOR_TRANCHE_COMPLETION_2026-05-18.md`
- `docs/reviews/archive/CVF_LEGACY_PHASE_D_ROLE_PERMISSION_TRANCHE_COMPLETION_2026-05-18.md`
- `docs/reference/CVF_AGENT_EXECUTION_WORKFLOW_SOP_2026-05-19.md`
- `docs/reference/CVF_AGENT_WORK_ORDER_TEMPLATE_2026-05-19.md`

Legacy source material re-opened for this matrix:

- `.private_reference/legacy/CVF ADD/Human System Harness/CVF_ORCHESTRATOR_DELEGATION_CONTRACT.md`
- `.private_reference/legacy/CVF ADD/deepagents/CVF_WORKER_DELEGATION_CONTRACT.md`
- `.private_reference/legacy/CVF ADD/deepagents/CVF_SUBAGENT_EXECUTION_BOUNDARY.md`
- `.private_reference/legacy/CVF ADD/Agent Harnesses/CVF_WORKER_SESSION_CONTRACT.md`
- `.private_reference/legacy/CVF ADD/Agent Harnesses/CVF_EXECUTION_SESSION_PROTOCOL.md`
- `.private_reference/legacy/CVF ADD/Agent Harnesses/CVF_SESSION_VALIDATION_GATE_SPEC.md`
- `.private_reference/legacy/CVF 16.5/Claude Kit/CVF_AGENT_ROLE_CATALOG.md`
- `.private_reference/legacy/CVF_Important/ADDING_CONTEXT CONTROL/CVF_AGENT_ROLE_EXECUTION_SPEC.md`

## Protocol / Contract / Requirements

### Core Assignment Rule

Every delegated CVF task must identify one accountable owner for each active
role lane:

| Lane | Required when | Owner output | Cannot do |
|---|---|---|---|
| Operator | business authority, waiver, scope expansion, public/provenance ambiguity | decision, waiver, lane selection | replace evidence or tests |
| Orchestrator | any multi-step, multi-agent, or lane-based task | work order, role assignment, stop conditions | absorb specialist execution when a matching worker lane exists |
| Planner | task needs decomposition before execution | plan, dependency map, acceptance checklist | mutate code or close work |
| Implementer | approved code/docs/schema/runtime work exists | patch, artifact, implementation evidence | widen scope, self-approve, deploy unless authorized |
| Reviewer | implementation or roadmap needs challenge | findings, no-blocking disposition, correction request | silently approve, rewrite implementation as review |
| Auditor / Governance | gates, evidence, handoff, taxonomy, public boundary | guard results, evidence trace, compliance status | waive policy without operator authority |
| Specialist Worker / Subagent | bounded specialist work is useful and registered | scoped result, trace, refusal or escalation | self-upgrade, spawn unmanaged workers, write durable truth memory |

### Role Assignment Flow

1. Classify the user request.
2. Decide whether the task is single-role, sequential multi-role, or delegated
   specialist work.
3. Assign orchestrator ownership when scope spans more than one role lane.
4. Assign planner only when decomposition is needed before execution.
5. Assign implementer with explicit write ownership and forbidden paths.
6. Assign reviewer before closure for any implementation, public claim, or
   contested roadmap.
7. Assign auditor/governance gates whenever evidence, public/provenance,
   taxonomy, active session state, or live proof is involved.
8. Assign specialist worker/subagent only through a bounded delegation packet.

## Rule

Every CVF task that crosses role boundaries must declare role ownership before
implementation begins. The declaration may live in an Agent Work Order, GC-018,
roadmap, review packet, or completion packet, but it must be inspectable before
closure.

## Allowed And Forbidden Requirements

Allowed:

- assign multiple roles to one human/agent only when duties do not conflict;
- for single-agent multi-role work, use the control block defined in
  `docs/reference/CVF_SINGLE_AGENT_MULTI_ROLE_CONTROL_STANDARD_2026-06-11.md`;
- assign a specialist worker for a bounded, testable side task;
- use operator waiver when reviewer availability blocks low-risk docs-only
  work;
- mark a role N/A when the request class does not need it.

Forbidden:

- implement before role owner and reviewer gate are known;
- let the orchestrator self-approve specialist work;
- let a worker expand write scope or risk ceiling;
- treat a role template as autonomous authority.

## Exceptions

Exceptions require explicit operator or governance record when:

- reviewer silence must be treated as non-blocking;
- the orchestrator must execute fallback work because no matching worker lane
  exists;
- a task must proceed before a planned role artifact is complete;
- public/provenance ambiguity requires a direct operator decision.

## Enforcement Surface

The enforcement surface is procedural in this document:

- Agent Work Orders;
- GC-018 authorization packets;
- review packets and completion packets;
- active session state and GC-020 handoff;
- local governance compatibility checks.

Runtime role enforcement remains out of scope.

### Request Class Matrix

| Request class | Orchestrator | Planner | Implementer | Reviewer | Auditor/Governance | Specialist worker/subagent |
|---|---|---|---|---|---|---|
| Simple answer, no repo change | optional | no | no | no | no | no |
| Code review | yes if broad | optional | no by default | primary | optional | no |
| Roadmap or decision pack | primary | optional | no | required if multi-agent | required for claim boundary | no |
| Docs/reference standard | primary | optional | docs implementer | required or operator waiver | structural and taxonomy gates | optional only for source audit |
| Code implementation | primary | optional | required | required | tests and active handoff gates | optional for bounded side task |
| Runtime governance change | primary | required | required | required | GC-018, tests, live proof if claim needs it | only with explicit contract |
| Public catalog/public-sync work | primary | optional | required in public-sync clone | required | remote/path/catalog proof | no |
| Live proof/release claim | primary | required | required | required | live provider proof required | no unless proof harness authorizes |
| Specialist research/source audit | primary | optional | source-audit worker | reviewer checks synthesis | source reuse table | allowed if bounded |
| Deployment/release | primary | required | deployment implementer | required | explicit approval and release gate | no unmanaged worker |

### Specialist Role Mapping

The legacy role catalog is normalized as templates, not autonomous authorities:

| Legacy role template | CVF assignment use | Default risk | Required gate |
|---|---|---:|---|
| `planner_agent` | Planner lane | R0/R1 | work order or roadmap capture |
| `coder_agent` | Implementer for code | R1/R2 | owned paths and tests |
| `reviewer_agent` | Reviewer lane | R0/R1 | findings-first review |
| `test_agent` | Auditor/governance helper or implementer for tests | R1 | command evidence |
| `security_agent` | Auditor/governance helper | R1/R2 | risk escalation path |
| `docs_agent` | Implementer for docs/reference | R0 | docs taxonomy and structural gates |
| `refactor_agent` | Implementer for behavior-preserving refactor | R1/R2 | behavior preservation evidence |
| `db_agent` | Specialist worker for database scope | R2/R3 | destructive change approval |
| `frontend_agent` | Implementer for UI/client scope | R1/R2 | design contract and browser evidence when UI changes |
| `backend_agent` | Implementer for server/API scope | R2 | auth/data tests |
| `deployment_agent` | Deployment implementer | R3 | explicit operator approval |

## Enforcement / Verification

This matrix is enforced procedurally through:

- Agent Work Orders under `docs/work_orders/`;
- GC-018 authorization packets before implementation;
- GC-020 active handoff sync after commits;
- GC-046 reviewer role discipline for disputed work;
- Markdown, docs taxonomy, active session, test, and live-proof gates.

This matrix does not enforce runtime actor identity by itself.

## Boundaries / Non-Goals

Do not use this matrix to:

- create a new parallel role taxonomy;
- bypass existing CPF/EPF delegation and handoff contracts;
- claim full ORCHESTRATOR runtime enforcement;
- allow an orchestrator to perform specialist execution when a bounded worker
  lane exists and is authorized;
- authorize a subagent without a scoped delegation packet.

## Source Reuse Decisions

| Source | Decision | CVF-native result |
|---|---|---|
| `CVF_ORCHESTRATOR_DELEGATION_CONTRACT.md` | normalize | Orchestrator coordinates, decomposes, delegates, supervises, integrates, and escalates. It is not default specialist executor. |
| `CVF_WORKER_DELEGATION_CONTRACT.md` | normalize | Delegation is execution transfer within pre-authorized bounds, not authority transfer. |
| `CVF_SUBAGENT_EXECUTION_BOUNDARY.md` | normalize | Specialist worker/subagent remains isolated, subordinate, bounded, revocable, and auditable. |
| `CVF_WORKER_SESSION_CONTRACT.md` | reuse | Worker must receive scoped task, constraints, context pack, trace, checkpoint, validation status, and next step. |
| `CVF_EXECUTION_SESSION_PROTOCOL.md` | normalize | State restore, baseline validation, task selection, execution, validation, artifact emission, and handoff become role workflow gates. |
| `CVF_SESSION_VALIDATION_GATE_SPEC.md` | reuse | No gate pass means no progress. |
| `CVF_AGENT_ROLE_CATALOG.md` | normalize | Role templates become assignment lanes and specialist templates, not autonomous runtime authorities. |
| `CVF_AGENT_ROLE_EXECUTION_SPEC.md` | defer | Runtime APIs such as `execute_role()` and `route_task()` remain future implementation work. |

## Role Deny Rules

A role assignment must stop or return to orchestrator if the assigned actor:

- executes outside assigned phase;
- modifies denied paths;
- accesses secrets without permission;
- deploys without approval;
- self-upgrades permission;
- bypasses audit;
- suppresses reviewer or operator escalation;
- expands from assigned task to adjacent work without a new order.

## Related Artifacts

- `docs/reference/CVF_AGENT_DELEGATION_AND_SUBAGENT_BOUNDARY_STANDARD_2026-05-19.md`
- `docs/reference/CVF_AGENT_EXECUTION_WORKFLOW_SOP_2026-05-19.md`
- `docs/reference/CVF_AGENT_WORK_ORDER_TEMPLATE_2026-05-19.md`
- `docs/work_orders/CVF_AGENT_WORK_ORDER_AGENT_ROLE_ASSIGNMENT_2026-05-19.md`
- `EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION/src/delegation.contract.ts`
- `EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION/src/agent.handoff.contract.ts`

## Claim Boundary

This matrix defines a role-assignment standard for CVF agent execution. It does
not prove runtime role enforcement, live worker dispatch, live subagent
isolation, or full ORCHESTRATOR absorption. Those claims require separate
scoped implementation and evidence.
