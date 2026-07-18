# CVF Role Switch Envelope Standard

Memory class: FULL_RECORD

Status: ACTIVE_REFERENCE

docType: reference

Date: 2026-06-22

Index classification: GOVERNED_DOC (not an INDEX_ARTIFACT). This standard
defines a role-switch protocol vocabulary; it does not map, enumerate, project,
or classify CVF state.

EPISTEMIC_PROCESS_NA_WITH_REASON: this is a documentation standard that defines a
role-switch envelope vocabulary and boundary rules; it is not an estimation,
forecast, or probabilistic judgment task, so no epistemic confidence calibration
applies.

## Purpose

Define the canonical Role Switch Envelope (RSE): the compact set of fields any
agent states when it changes or accepts a role inside a governed CVF batch, plus
the boundary rule that keeps routine inter-agent jurisdiction decisions away from
the non-coder operator.

RSE exists because a worker once routed a reviewer/closer finding-promotion
decision to the operator, merging two different decisions: required finding
capture inside the allowed worker return, and out-of-scope promotion of that
finding to a lane memory, reference, or checker artifact. The first is required
and self-handled; the second is routed to reviewer/closer. The envelope makes
that separation explicit so the question never reaches the operator.

This standard is a role-switch local view of the ratified Agent Handoff
Contract. It does not replace that contract and it adds no runtime, checker, or
helper behavior. It is documentation and reference only until a later RSE checker
tranche is separately authorized.

## Scope / Target / Owner Boundary

Target: any agent acting in a governed CVF batch as dispatch author, worker,
reviewer, closer, or session-sync steward, across one or more turns or agents.

In scope:

- the canonical envelope field set;
- the operator-question boundary rule;
- a compliant worker-to-reviewer role-switch example;
- a forbidden operator-question example.

Out of scope (owner boundary):

- any checker, helper, or diagnostic implementation;
- any change to the Agent Handoff Contract semantics;
- the RSE-T1 operator-question classification rules, the RSE-T2 Worker Return
  Jurisdiction Block requirement, and the RSE-T3 diagnostics, which are separate
  tranches;
- any runtime, provider, live, web, CLI/MCP, workspace, queue, daemon, watcher,
  public-sync, or interception behavior.

## Relationship To The Agent Handoff Contract

The envelope is a local view, not a parallel contract. Its fields are drawn from
the ratified Agent Handoff Contract field set (`CF-01` route through `CF-07`
commitOwner in
`docs/reference/CVF_AHB_T2_AGENT_HANDOFF_CONTRACT_RATIFICATION_2026-06-16.md`) and
from the required Agent Handoff Contract Control Block heading defined in
`docs/reference/agent_handoff/CVF_AGENT_HANDOFF_BOUNDARY_MACHINE_CHECK_STANDARD.md`.
Role names follow the Role Glossary in
`docs/reference/guard_orientation/README.md`.

When a work order already carries an Agent Handoff Contract Control Block, the
envelope is the per-role-switch reading of that block plus the four
RSE-specific boundary fields (`jurisdictionOwner`, `operatorQuestionAllowed`,
`findingCaptureSurface`, `outOfScopePromotionRoute`). The envelope never
overrides the contract; if the two disagree, the contract governs and the
disagreement is a finding to route to the reviewer/closer.

## Canonical Envelope Fields

An agent changing or accepting a role states these fields. Fields drawn from the
Agent Handoff Contract keep their contract meaning; the four boundary fields are
RSE-specific and documentation only.

| Field | Meaning |
|---|---|
| `currentRole` | the role the agent is acting in now after the switch |
| `previousRole` | the role the agent held before this switch, or none |
| `phase` | the canonical batch phase: dispatch authoring, execution, closure, or session sync |
| `route` | the canonical route mode for the batch, such as multi-agent multi-role |
| `rolePattern` | the actor-to-role assignment across phases for this batch |
| `baseHeadForPhase` | the base head anchoring the current phase changed set |
| `changedSetScope` | the files this role may change in the current phase |
| `commitOwner` | the role that owns any commit in the current phase |
| `jurisdictionOwner` | the role that owns the decision currently in question |
| `operatorQuestionAllowed` | whether the current role may ask the operator in this phase, and for which decision classes |
| `reviewerQuestionRequired` | whether a decision must be routed to the reviewer or closer rather than the operator |
| `findingCaptureSurface` | the allowed surface where the role records a finding inside scope, such as the worker return |
| `outOfScopePromotionRoute` | the route for promoting an out-of-scope finding, such as routing to the reviewer or closer or to an operator-authorized future tranche |
| `nextRole` | the role expected to act next after the current role completes |
| `claimBoundary` | the bounded claim the current role is allowed to make |

## Operator Question Boundary Rule

The current role may ask the operator only for decisions the operator owns:
scope expansion, risk change, live or provider use, public-sync, destructive or
irreversible action, secrets or quota, roadmap or tranche selection, or explicit
authorization of otherwise forbidden scope.

The current role must not ask the operator about a decision owned by the
reviewer or closer: closure acceptance, finding absorption, out-of-scope
promotion routing, worker-return packet-shape ambiguity, or reviewer remediation
choice. Those are stated in the envelope and routed through
`outOfScopePromotionRoute`, not raised to the operator.

Finding capture is mandatory and self-handled: a meaningful finding is recorded
in the allowed `findingCaptureSurface` even when promotion is deferred. Recording
a finding does not authorize editing lane memory, standards, checkers,
registries, roadmaps, or unrelated artifacts; that promotion is routed, not
performed.

## Compliant Worker-To-Reviewer Example

A worker finishes execution and observes a reusable gate-trap lesson that belongs
in a shared reference, which is outside worker scope.

Envelope at the switch:

- `currentRole`: worker completing execution
- `previousRole`: worker
- `phase`: execution to closure handoff
- `route`: multi-agent multi-role
- `commitOwner`: reviewer or closer (worker commits nothing)
- `jurisdictionOwner`: reviewer or closer owns the promotion decision
- `operatorQuestionAllowed`: no, this decision class is not operator-owned
- `reviewerQuestionRequired`: yes
- `findingCaptureSurface`: the worker return
- `outOfScopePromotionRoute`: record the finding in the worker return and route
  the shared-reference promotion to the reviewer or closer
- `nextRole`: reviewer or closer
- `claimBoundary`: worker records and routes; worker does not edit the shared
  reference

Behavior: the worker records the lesson in the worker return and routes the
promotion to the reviewer or closer. The worker does not ask the operator and
does not edit the shared reference itself.

## Forbidden Operator-Question Example

The same worker instead asks the operator:

`Want me to record the gate-trap lessons into the shared reference, or leave that until closure?`

This is forbidden. It merges a required, self-handled action (finding capture in
the worker return) with a reviewer or closer decision (out-of-scope promotion of
that finding), and raises the merged choice to the operator. Under the envelope,
`operatorQuestionAllowed` is no for this decision class and
`reviewerQuestionRequired` is yes. The correct behavior is the compliant example
above: capture in the worker return, route the promotion to the reviewer or
closer.

## Documentation-Only Boundary

RSE is documentation and reference only until a later, separately authorized
checker tranche. This standard introduces no machine check, no helper output, no
runtime behavior, and no operator-facing automation. Operator-question
classification rules, a Worker Return Jurisdiction Block requirement, and any
early diagnostics are deferred to RSE-T1, RSE-T2, and RSE-T3, each requiring its
own authorization and source-verified work order.

## Non-Goals

- replacing the ratified Agent Handoff Contract;
- creating a runtime role router or an agent workspace;
- implementing any checker, helper, or diagnostic in this tranche;
- provider or live proof, public-sync, CLI/MCP adapter behavior, or external
  agent runtime behavior;
- claiming universal governed-coding control or speed and cost outcomes.

## Claim Boundary

This standard defines the Role Switch Envelope vocabulary and the
operator-question boundary rule as documentation and reference only. It is a
local view of the ratified Agent Handoff Contract and does not change that
contract. It does not authorize any checker, helper, or diagnostic
implementation, any RSE-T1, T2, or T3 content, runtime behavior, provider or live
behavior, CLI/MCP adapter behavior, public-sync, direct interception, readiness
claims, speed or cost claims, or universal governed-coding control.

## Public Export Disposition

DEFERRED_PRIVATE_ONLY

Reason: RSE-T0 is private provenance governance-protocol work. No public-sync
repository work or public catalog claim is authorized.

## Delta Execution Claim Boundary Control Block

| Field | Disposition |
|---|---|
| claimScope | RSE-T0 Role Switch Envelope Standard |
| claimDisposition | N/A with reason: no Delta execution-control claim is made |
| receiptEvidence | N/A with reason: no Delta receipt evidence is created or consumed |
| actionEvidence | N/A with reason: no runtime action is executed or observed |
| invocationBoundary | documentation reference only |
| interceptionBoundary | no IDE, shell, git, filesystem, or provider interception claim |
| claimLanguage | documentation-only reference standard |
| forbiddenExpansion | checker or helper implementation, runtime role router, agent workspace, AHB semantics change, RSE-T1/T2/T3 content, provider/live, public-sync, queue/daemon/watcher, direct interception, readiness, and universal control remain out of scope |

## Agent Operation Trace Block

| Field | Evidence |
|---|---|
| Actor | worker role |
| Provider or surface | local workspace |
| Session or invocation | RSE-T0 worker execution, 2026-06-22 |
| Working directory | `D:\UNG DUNG AI\TOOL AI 2026\Controlled-Vibe-Framework-CVF` |
| Command or tool surface | documentation authoring |
| Target paths | this standard and its front door |
| Allowed scope source | RSE-T0 work order and paired GC-018 baseline |
| Before status evidence | executionBaseHead `124a372b`; clean worktree before worker edits |
| After status evidence | this standard and front door created, pending no-commit return |
| Diff evidence | worker records `git status --short` in the worker return |
| Approval boundary | worker created the standard and front door and committed nothing |
| Claim boundary | documentation-only standard; no checker, helper, runtime, provider, or public behavior |
| Agent type | worker role |
| Invocation ID | `rse-t0-role-switch-envelope-standard-worker-2026-06-22` |
| Expected manifest | this standard; the front-door README; the worker return |
| Actual changed set | worker records in the worker return |
| Manifest delta | worker records in the worker return |
