# CVF MAO Runtime Foundation Contract

Memory class: FULL_RECORD

Status: ACTIVE_CONTRACT

docType: reference

Date: 2026-07-11

Batch ID: MAO-T0

executionBaseHead: `209a9b4b3`

EPISTEMIC_PROCESS_NA_WITH_REASON: this is a design/schema contract. It
records architecture decisions and doc-only field definitions; it does not
predict or compare runtime behavior.

## Purpose

Define the active contract for the future CVF Multi-Agent Orchestration
(MAO) runtime foundation: task graph, event/receipt ledger, generated
read-model, role-resolver ownership, provider-neutral capability port,
lifecycle/state transitions, storage/retention decisions, and threat/failure
model. This contract is the schema-decision authority for MAO-T1 through
MAO-T9. It authorizes no runtime implementation, no provider call, and no
queue/scheduler/UI/public-sync/registry mutation.

## Scope / Applies To

Applies to: any future MAO-T1..T9 tranche, and any agent reading MAO schema
fields before implementing a task graph, event ledger, role resolver,
delegation adapter, reviewer isolation, closer/commit interlock, lifecycle
controller, or evidence/receipt surface. Companion source inventory:
`docs/reference/multi_agent_orchestration/CVF_MAO_T0_SOURCE_INVENTORY_AND_OVERLAP_DECISIONS.md`.
Companion schema:
`docs/reference/multi_agent_orchestration/CVF_MAO_RUNTIME_FOUNDATION_SCHEMA.json`.

## Central Core

MAO does not replace any existing CVF control surface. It executes strictly
inside the envelope those surfaces already define:

| Existing Central Core | MAO relationship |
|---|---|
| Agent Handoff Contract (`docs/reference/CVF_AHB_T2_AGENT_HANDOFF_CONTRACT_RATIFICATION_2026-06-16.md`) | owns route, phase, base-head, changed-set scope, trace scope, commit owner, cross-batch isolation, next-move surfaces. MAO consumes these fields; it does not redefine them. |
| Agent Workspace State Topology Contract (`docs/reference/agent_workspace/CVF_AGENT_WORKSPACE_STATE_TOPOLOGY_CONTRACT.md`) | owns workspace generated state as a bounded projection. MAO milestone events project into workspace lanes; workspace state is never MAO's execution truth. |
| Agent Workspace Runtime Expansion Readiness Contract (`docs/reference/agent_workspace/CVF_AGENT_WORKSPACE_RUNTIME_EXPANSION_READINESS_CONTRACT.md`) | owns the `runtimeMode` boundary (`QUEUE_SKELETON_ONLY`, `READ_MODEL_ONLY`, `RUNTIME_IMPLEMENTATION_REQUESTED`, `PROVIDER_LIVE_REQUESTED`, `PUBLIC_SYNC_REQUESTED`). Any MAO-T1+ tranche touching queue/UI/provider/public scope must include a Runtime Expansion Control Block citing this contract. |
| Commit-steward standard (`docs/reference/CVF_AGENT_COMMIT_STEWARD_PROTOCOL_STANDARD_2026-06-15.md`) | owns phase-to-mode mapping and commit-split discipline. It does not own closer identity (see Closer And Commit Boundary below). |

## Architecture Decisions

These decisions are carried forward unchanged from the accepted roadmap's
Architecture Decision Table
(`docs/roadmaps/CVF_MULTI_AGENT_ORCHESTRATION_RUNTIME_FOUNDATION_ROADMAP_2026-07-11.md`)
and are now ratified as the T0 contract baseline for MAO-T1+.

| Decision | Selected design |
|---|---|
| Orchestration state owner | execution-plane MAO runtime module (future); policy stays control-plane owned |
| Persistence shape | append-only event/receipt ledger as execution truth, plus deterministic generated read models |
| Task graph source of truth | accepted work-order authority envelope compiled into a versioned immutable task-graph definition; runtime events advance state but never rewrite authority |
| Workspace relationship | projection of lifecycle milestones into existing lanes; no per-heartbeat mirroring; workspace is never a queue |
| AHB relationship | AHB controls routes, phases, actor scopes, closer, commit, and session sync; MAO executes only within that envelope |
| Role resolver ownership | control-plane policy component returning an admission decision and reason receipt |
| Runtime adapter boundary | execution-plane provider-neutral invocation port consuming a capability declaration and explicit authority envelope; no provider hardcoding |
| Retry semantics | retry only retryable invocation failures under the same authority hash and idempotency key; policy/approval/review failures never auto-retry |
| Cancel semantics | cooperative cancel request followed by a terminal cancellation receipt; no new child may start after cancel acceptance |
| Human checkpoints | required before high-risk fan-out admission, scope/budget expansion, overriding reviewer dissent, accepting partial results, or authorizing commit/public action |
| No-auto-commit boundary | adapters, workers, specialists, and resolver cannot commit; only the AHB-designated closer may invoke commit steward after independent acceptance |
| Public/private projection | provenance-only through pilot and closure; any later public export needs a separate public-safe projection packet |
| Freshness ownership | MAO schema/receipt checker owners (future) plus ASC generator/checker after catalog admission; workspace generator owns workspace projection drift |
| Catalog admission | only after implemented source, deterministic invocation evidence, tests, operator/evidence route, and proof-classed edges exist |

## Closer And Commit Boundary

Per Compatibility Analysis Caveat 2 in the paired source inventory: the
**Agent Handoff Contract** is the sole owner of closer identity and the
exactly-one-closer invariant (CF-07 `commitOwner(phase)`, and the C3
three-or-more-agent closer-designation rule). The commit-steward standard is
a downstream execution surface that maps phase to commit mode; it does not
itself decide who the closer is. No MAO tranche may introduce a second
closer-identity mechanism. A future MAO-T5 "designated closer and
commit/session interlock" tranche must cite AHB CF-07 as the closer-identity
source and may only add an execution-side enforcement check that the
AHB-designated closer is the actor invoking commit steward.

## Role Resolver Ownership

The role resolver is a control-plane policy component. It returns exactly
one of: single-worker admission, a bounded role plan, operator-approval-
required, or rejection-with-reason. It is not a runtime component and does
not select a provider. Provider selection happens downstream of role
admission, through the capability-adapter boundary described below, using
the existing `ProviderRouterContract`
(`EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION/src/provider.router.contract.ts`).
The resolver and the provider router are distinct components with distinct
authority: the resolver decides whether extra roles are admitted at all; the
router decides which allowed provider serves an admitted role.

## Provider-Neutral Capability Port

A future MAO-T3 adapter must consume a capability declaration (role,
required capabilities, budget) and an explicit authority envelope (task
identity, authority hash, idempotency key) and must not hardcode a provider
name as a schema value or orchestration branch. It reuses
`ProviderRouterContract.route()` for provider selection; it does not
duplicate provider policy. Named providers are integration configurations
supplied to the adapter, never schema forks.

## Task / Role / State Lifecycle

Carried forward from the accepted roadmap's Task / Role / State Lifecycle
section, now ratified as the T0 lifecycle contract:

1. An accepted work order fixes the authority envelope, route, risk inputs,
   budget, files, dependencies, closer, and approval checkpoints.
2. The compiler creates an immutable task graph and authority hash.
3. The role resolver returns single-worker admission, a bounded role plan,
   operator-approval-required, or rejection.
4. The runtime transitions dependency-ready tasks from planned to admitted
   to running. A parent cannot complete before all required children are
   terminal.
5. Failed or blocked dependencies propagate a blocked state to descendants;
   independent siblings may continue only when the graph explicitly permits
   it.
6. Every invocation records identity, role, authority hash, input manifest,
   idempotency key, budget allocation, timestamps, and outcome.
7. Reviewer tasks receive a source packet independent of worker conclusions.
   Worker output is evidence under review, never reviewer authority.
8. A reviewer accepts, requests a classified repair, records dissent, or
   escalates. Repair loops are bounded by the work-order revision limit.
9. Exactly one designated closer (AHB CF-07) reconciles accepted outputs,
   dissent, changed set, and approval evidence.
10. Commit steward verifies the closure boundary. Session-sync remains a
    separate commit updating active continuity surfaces.

## Task Lifecycle State Transition Table

| From state | To state | Trigger | Notes |
|---|---|---|---|
| `planned` | `admitted` | role resolver returns an admission decision and all declared dependencies are terminal-success | authority hash is bound at admission |
| `admitted` | `running` | adapter accepts the invocation and issues an attempt | attempt identity is distinct from task identity |
| `running` | `succeeded` | adapter returns a validated output receipt | terminal state |
| `running` | `rejected` | reviewer or policy rejects the output with no repair path remaining | terminal state |
| `running` | `blocked` | a required dependency transitions to `rejected`, `cancelled`, `timed_out`, `exhausted`, or `failed` | propagates to descendants per the Terminal Outcome Propagation table |
| `running` | `cancelled` | cooperative cancel request is accepted | terminal state; no new child may start after acceptance |
| `running` | `timed_out` | task-specific timeout elapses without a terminal receipt | eligible for a new attempt under the same task and authority hash if retryable |
| `timed_out` | `running` | orphan recovery issues a new attempt under the same idempotency boundary | only for retryable classes |
| `running` | `exhausted` | the work-order revision or invocation-count budget is spent with no terminal success | terminal state; escalates to operator |
| `running` | `failed` | a non-retryable invocation failure occurs (validation, scope breach, ambiguous side effect) | terminal state; escalates to operator or reviewer for classified repair |
| any non-terminal | `blocked` | budget exhaustion or human-checkpoint gate is pending | resumes only after operator/reviewer action |

## Terminal Outcome Propagation

Required terminal task outcomes: `succeeded`, `rejected`, `blocked`,
`cancelled`, `timed_out`, `exhausted`, `failed`.

| Terminal outcome | Descendant propagation | Retry eligible | Operator action required |
|---|---|---|---|
| `succeeded` | dependents become dependency-ready | N/A | no |
| `rejected` | required descendants become `blocked`; independent siblings may continue if the graph permits | no | yes, if no repair path remains |
| `blocked` | descendants remain `blocked` until the blocking condition clears | N/A | yes |
| `cancelled` | required descendants become `blocked`; no new descendant admission | no | only if resuming the branch is requested |
| `timed_out` | descendants remain `blocked` until retry or escalation resolves | yes, if failure class is retryable | yes, if orphan recovery does not resolve it |
| `exhausted` | required descendants become `blocked` | no | yes |
| `failed` | required descendants become `blocked` | no, unless reclassified as retryable by diagnostic envelope | yes |

## Risk-Based Role Model

Carried forward unchanged from the accepted roadmap:

| Conditions | Default route | Required evidence |
|---|---|---|
| Low risk, narrow reversible scope, deterministic checks, no independence claim | one worker; single-agent route | admission receipt explaining why review separation adds insufficient value |
| Medium risk, governed artifact or non-trivial integration, repair remains reversible | worker plus independent reviewer | separate source packet and reviewer decision |
| High risk, security/privacy/domain consequence, or irreversible external effect | worker, independent specialist, reviewer, designated closer, plus human checkpoint | specialist qualification/capability, dissent ledger, explicit approval |
| Context leakage would defeat independence | reject multi-agent plan or create an isolated reviewer packet | isolation decision and excluded-context manifest |
| Fan-out cost exceeds evidence value, task cannot be safely decomposed, or actors would edit overlapping scope | single worker or operator escalation | cost/context-risk rejection receipt |

Multi-agent admission requires all of: decomposable scopes, non-overlapping
or explicitly serialized writes, measurable evidence value, a bounded
budget, one closer, and a source packet for every role.

## Cost / Token / Latency Controls

- Default fan-out is 1; initial pilot maximum is 3 concurrent execution
  roles excluding the closer.
- Initial maximum revision depth is 1 worker repair cycle; a second requires
  operator approval; a third is forbidden in the pilot.
- Every work order must set total invocation count, token/cost ceiling when
  the provider exposes it, wall-clock ceiling, and per-role allocation.
- Budget exhaustion stops new invocations, requests cancellation of safe
  in-flight work, records partial evidence, and escalates.
- Provider adapters must return usage/latency when available and explicitly
  record unavailable measurements; estimated and provider-reported usage
  must not be mixed without labels.

## Idempotency, Retry, Cancel, And Recovery

- Idempotency keys bind task, attempt policy, authority hash, role, and
  input manifest. Duplicate invocation returns the existing receipt or a
  conflict; it never executes twice.
- Retryable classes: transport interruption, provider-declared transient
  failure, safe timeout with no side-effect ambiguity.
- Non-retryable classes: authority rejection, approval denial, invalid
  output, scope breach, ambiguous side effect.
- Heartbeat proves liveness only; it cannot renew authority, extend budget,
  or imply progress.
- Cancellation is idempotent and blocks further child admission once
  accepted.
- Orphan recovery scans non-terminal attempts without valid liveness
  evidence, classifies them, and either resumes from durable evidence,
  safely retries, or escalates. It never infers success from silence.

## Evidence And Receipt Model

Future MAO schemas cover six receipt kinds, defined structurally in the
companion JSON Schema:

1. graph receipt - graph identity, work-order identity, authority hash,
   dependency manifest, compiler version.
2. role-resolution receipt - inputs, selected route/roles, exclusions, risk
   reason, cost justification, approval requirement.
3. invocation receipt - provider-neutral invocation identity, adapter
   identity, role, capability, authority hash, input manifest hash,
   idempotency key, timing, usage, diagnostic classification.
4. output receipt - output manifest, changed-set evidence, validation
   result, claim boundary.
5. review receipt - isolated source packet hash, recomputed evidence,
   defects, dissent, decision, repair owner.
6. integration receipt - designated closer, accepted outputs, rejected
   outputs, unresolved dissent, final changed set, commit-steward result,
   session-sync requirement.

Raw prompts, secrets, provider-private memory, and unrestricted model traces
are not required receipt content. Evidence must be secret-safe and
reconstructable from governed sources.

## Storage And Retention Decision

| Concern | Decision |
|---|---|
| Execution truth | append-only event/receipt ledger (future MAO-T1 implementation); never the workspace generated state |
| Read model | deterministic generated aggregate, regenerated from the event ledger; same generated-aggregate discipline pattern as `CVF_SESSION/agent_workspace/ACTIVE_AGENT_WORKSPACE_STATE.json` |
| Workspace projection | lifecycle milestones only (graph created, admitted, terminal outcome, closure); no per-heartbeat mirroring |
| Retention | receipts retained for the life of the governed batch plus closure evidence window; long-term retention policy is MAO-T7 scope |
| Secrets | never stored in any MAO receipt or read model; adapters must redact before receipt emission |

## Threat And Failure Model

| Threat / failure class | Description | Control |
|---|---|---|
| Unauthorized fan-out | a role plan admits more roles than the work order's risk/budget allows | role resolver admission is bounded by the Risk-Based Role Model table; rejection receipt required |
| Self-approval | a worker or its own output becomes reviewer authority | reviewer must use an isolated source packet independent of worker conclusions (Task Lifecycle step 7) |
| Stale authority hash | a task graph is executed against authority that has since changed | authority hash is immutable per graph; any authority change requires a new graph and new hash |
| Duplicate invocation | the same task/attempt is executed twice | idempotency key binding prevents duplicate execution; duplicate calls return the existing receipt or a conflict |
| Overlapping write scope | two roles edit the same file/resource concurrently | multi-agent admission requires non-overlapping or explicitly serialized writes; adapted from `MultiAgentRuntime.canAssignTask` file-scope and lock checks |
| Non-retryable failure treated as retryable | a policy/approval/validation failure is blindly retried | retry classifier only retries the named retryable classes; all others require repair or escalation |
| Budget exhaustion silently degrading review | cost pressure causes review isolation to be skipped | budget exhaustion stops new invocations and escalates; it never silently degrades reviewer independence |
| Second governance/state truth | workspace generated state or a provider trace is treated as authoritative execution state | workspace state remains a projection only; the event/receipt ledger is the only execution truth |
| Provider hardcoding | a schema field or orchestration branch names a specific provider | capability port and provider router remain the only provider-selection surfaces; schema fields are provider-neutral |
| Implicit commit | an adapter or worker commits without closer/reviewer acceptance | no-auto-commit boundary: only the AHB-designated closer may invoke commit steward |
| ADIF-calibration overclaim | admission thresholds are presented as empirically calibrated when no MAO-specific defect baseline exists | thresholds are recorded as first-principles/source-informed per Compatibility Analysis Caveat 3; MAO-T9 must revisit after pilot evidence accumulates |

## Runtime Expansion Control Block

| Field | Value |
|---|---|
| `runtimeMode` | `READ_MODEL_ONLY` for this contract's own schema decisions; no queue, UI, provider, or public scope is created by MAO-T0 |
| `contractSource` | `docs/reference/agent_workspace/CVF_AGENT_WORKSPACE_RUNTIME_EXPANSION_READINESS_CONTRACT.md` |
| `frontDoor` | `docs/reference/agent_workspace/README.md` |
| `stateSourceOfTruth` | N/A with reason: MAO-T0 defines schema only; no state source is created |
| `queueBoundary` | N/A with reason: no queue implementation in this tranche |
| `operatorViewBoundary` | N/A with reason: no operator view implementation in this tranche |
| `providerBoundary` | no-provider; MAO-T0 makes no provider call |
| `publicBoundary` | private-only; `DEFERRED_PRIVATE_ONLY` |
| `guardOwner` | future MAO checker (not yet authorized); this contract is not itself machine-enforced |

## New Doc-Only Fields

Every field name below is a new MAO-T0 design decision. None is claimed to
exist as current runtime source.

| Field | Owner concept | Type |
|---|---|---|
| `taskGraphId` | task graph identity | string |
| `workOrderId` | authority-envelope source | string |
| `authorityHash` | immutable authority binding | string |
| `taskId` / `attemptId` | task and attempt identity | string |
| `idempotencyKey` | duplicate-invocation prevention | string |
| `taskState` | lifecycle state enum | enum |
| `terminalOutcome` | terminal task outcome enum | enum |
| `roleResolutionReceipt` | role-admission decision record | object |
| `invocationReceipt` | provider-neutral invocation record | object |
| `outputReceipt` | worker output record | object |
| `reviewReceipt` | reviewer decision record | object |
| `integrationReceipt` | closer integration record | object |
| `runtimeMode` | workspace-runtime-expansion boundary token | enum (existing enum values, reused per the runtime expansion contract) |

Full structural definitions are in
`CVF_MAO_RUNTIME_FOUNDATION_SCHEMA.json`.

## Work Order Requirement

Any future MAO-T1..T9 work order must:

- cite this contract and the companion source inventory and schema;
- state which lifecycle states, receipts, or new fields it implements;
- include an Agent Handoff Contract Control Block;
- include a Runtime Expansion Control Block when it touches queue, UI,
  provider, or public scope;
- carry forward any still-open threat/failure-model item it addresses;
- not introduce a second closer-identity mechanism, a second execution
  truth, or a provider-hardcoded schema field.

## Public Export Disposition

DEFERRED_PRIVATE_ONLY

Reason: private provenance architecture/schema contract. No public-sync
batch is authorized by this tranche.

## Claim Boundary

This contract defines MAO architecture decisions, lifecycle/state
transitions, storage/retention decisions, and a threat/failure model. It
does not implement a runtime, call a provider, build a queue/scheduler/UI,
change AHB/workspace/ASC/R91/L4/R84/R73F semantics, edit a registry, or
claim production/public readiness. Machine enforcement of any field in this
contract requires a fresh GC-018 and operator authorization in a future
MAO-T1+ tranche.
