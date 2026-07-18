# CVF RSE-T1 Operator Question Boundary Addendum

Memory class: FULL_RECORD

Status: ACTIVE_REFERENCE

docType: reference

Date: 2026-06-22

Index classification: GOVERNED_DOC (not an INDEX_ARTIFACT). This addendum defines
a question-classification vocabulary; it does not map, enumerate, project, or
classify CVF state.

EPISTEMIC_PROCESS_NA_WITH_REASON: this is a documentation addendum that classifies
questions into fixed boundary classes; it is not an estimation, forecast, or
probabilistic judgment task, so no epistemic confidence calibration applies.

## Purpose

Make the non-coder operator boundary explicit. This addendum extends the closed
Role Switch Envelope standard with a classification of every question an agent
might raise into four canonical classes, so a worker self-handles or routes
routine inter-agent decisions instead of asking the operator.

The addendum exists because a worker once merged a required, self-handled action
(capturing a finding in the worker return) with a reviewer or closer decision
(promoting that finding to a shared artifact) and raised the merged choice to the
operator. The classification below separates those decisions so the question
never reaches the operator.

## Scope

Applies to any agent acting as dispatch author, worker, reviewer, closer, or
session-sync steward in a governed CVF batch. This addendum builds on the closed
Role Switch Envelope standard
(`docs/reference/role_switch_envelope/CVF_ROLE_SWITCH_ENVELOPE_STANDARD.md`) and
its Operator Question Boundary Rule. It is a local view of the ratified Agent
Handoff Contract in
`docs/reference/CVF_AHB_T2_AGENT_HANDOFF_CONTRACT_RATIFICATION_2026-06-16.md`; it
does not replace that contract. Role names follow the Role Glossary in
`docs/reference/guard_orientation/README.md`.

Out of scope: any checker, helper, or diagnostic implementation; the RSE-T2
Worker Return Jurisdiction Block requirement; the RSE-T3 diagnostics; and any
runtime, provider, public-sync, or interception behavior.

## Question Classification

Before raising any question or taking any action that crosses a role boundary, an
agent classifies it into exactly one of four classes.

| Class | Owner | When it applies |
|---|---|---|
| `ASK_OPERATOR` | operator | scope expansion, risk change, live or provider use, public-sync, destructive or irreversible action, secrets or quota, roadmap or tranche selection, or explicit authorization of otherwise forbidden scope |
| `ASK_REVIEWER_OR_CLOSER` | reviewer or closer | closure acceptance, finding absorption, out-of-scope promotion routing, worker-return packet-shape ambiguity, or reviewer remediation choice |
| `SELF_HANDLE_WITHIN_SCOPE` | current role | required finding capture, allowed-scope gate remediation, required rerun of assigned checks, or worker-return evidence completion |
| `RETURN_BLOCKED_WITH_REASON` | current role returns blocked | blocked source, impossible scope, forbidden path, unavailable required input, or a failed gate outside the allowed repair scope |

Classification rules:

- A decision is `ASK_OPERATOR` only when it matches an operator-owned class
  above. A phase transition is `ASK_OPERATOR` only when its governing packet
  explicitly reserves that transition for the operator; ordinary worker
  execution after an accepted dispatch follows the declared role route.
- A reviewer or closer decision is never raised to the operator. It is stated in
  the envelope and routed through the `outOfScopePromotionRoute` field.
- A self-handled action is performed inside scope without asking anyone; the
  agent does not raise it as a question.
- When the work cannot proceed inside allowed scope, the agent returns
  `RETURN_BLOCKED_WITH_REASON` naming the exact source or gate, rather than
  asking the operator to resolve a reviewer or closer matter.

## Finding Capture And Promotion Are Separate

A meaningful finding is always captured in the allowed `findingCaptureSurface`,
such as the worker return; this is `SELF_HANDLE_WITHIN_SCOPE` and is mandatory
even when promotion is deferred.

Promoting that finding to a shared artifact, such as a lane memory, a reference
standard, a checker, a registry, or a roadmap, is a separate decision. It is
`ASK_REVIEWER_OR_CLOSER` and is routed through `outOfScopePromotionRoute`. The
worker does not perform the promotion and does not ask the operator about it.

Recording a finding never authorizes editing an out-of-scope artifact.

## Forbidden Operator-Question Pattern

The following question is forbidden because it merges two classes and raises the
merged choice to the operator:

`Want me to record the gate-trap lessons into the shared reference, or leave that until closure?`

Decomposition under this addendum:

| Part of the question | Correct class | Correct behavior |
|---|---|---|
| record the finding in the worker return | `SELF_HANDLE_WITHIN_SCOPE` | capture it now; do not ask |
| promote the finding into a shared reference | `ASK_REVIEWER_OR_CLOSER` | route it to the reviewer or closer; do not perform it; do not ask the operator |

No operator-facing prompt should ask whether to do reviewer or closer work. The
correct behavior is to capture the finding in the worker return and route the
shared-reference promotion to the reviewer or closer.

## Worked Examples

| Situation | Class | Action |
|---|---|---|
| A required gate fails on the worker's own changed file inside allowed scope | `SELF_HANDLE_WITHIN_SCOPE` | repair and rerun the gate; do not ask |
| The worker finds a reusable lesson that belongs in a shared standard | capture is `SELF_HANDLE_WITHIN_SCOPE`; promotion is `ASK_REVIEWER_OR_CLOSER` | capture in the worker return; route the promotion |
| The work would require live provider use not in scope | `ASK_OPERATOR` | stop and ask the operator to authorize scope and provider use |
| A required source file named in the work order does not exist | `RETURN_BLOCKED_WITH_REASON` | return blocked naming the missing source |
| The reviewer must decide whether to accept the worker return | `ASK_REVIEWER_OR_CLOSER` | the worker states readiness and returns; the reviewer decides, not the operator |

## Documentation-Only Boundary

This addendum is documentation and reference only. It introduces no machine
check, no helper output, no runtime behavior, and no operator-facing automation.
It builds on the closed RSE-T0 standard and is a local view of the ratified Agent
Handoff Contract. A Worker Return Jurisdiction Block requirement and any early
diagnostics are deferred to RSE-T2 and RSE-T3, each requiring its own
authorization and source-verified work order.

## Non-Goals

- replacing the ratified Agent Handoff Contract;
- editing the closed RSE-T0 standard;
- implementing any checker, helper, or diagnostic in this tranche;
- provider or live proof, public-sync, CLI/MCP adapter behavior, or external
  agent runtime behavior;
- claiming universal governed-coding control or speed and cost outcomes.

## Claim Boundary

This addendum defines the operator-question classification and the
finding-capture versus promotion separation as documentation and reference only.
It builds on the closed RSE-T0 standard and is a local view of the ratified Agent
Handoff Contract, not a replacement and not an edit of it. It does not authorize
any checker, helper, or diagnostic implementation, any RSE-T2 or RSE-T3 content,
runtime behavior, provider or live behavior, CLI/MCP adapter behavior,
public-sync, direct interception, readiness claims, speed or cost claims, or
universal governed-coding control.

## Public Export Disposition

DEFERRED_PRIVATE_ONLY

Reason: RSE-T1 is private provenance governance-protocol work. No public-sync
repository work or public catalog claim is authorized.

## Delta Execution Claim Boundary Control Block

| Field | Disposition |
|---|---|
| claimScope | RSE-T1 Operator Question Boundary addendum |
| claimDisposition | N/A with reason: no Delta execution-control claim is made |
| receiptEvidence | N/A with reason: no Delta receipt evidence is created or consumed |
| actionEvidence | N/A with reason: no runtime action is executed or observed |
| invocationBoundary | documentation reference only |
| interceptionBoundary | no IDE, shell, git, filesystem, or provider interception claim |
| claimLanguage | documentation-only reference addendum |
| forbiddenExpansion | checker or helper implementation, runtime role router, agent workspace, AHB semantics change, RSE-T0 edit, RSE-T2/T3 content, provider/live, public-sync, queue/daemon/watcher, direct interception, readiness, and universal control remain out of scope |

## Agent Operation Trace Block

| Field | Evidence |
|---|---|
| Actor | worker role |
| Provider or surface | local workspace |
| Session or invocation | RSE-T1 worker execution, 2026-06-22 |
| Working directory | `D:\UNG DUNG AI\TOOL AI 2026\Controlled-Vibe-Framework-CVF` |
| Command or tool surface | documentation authoring |
| Target paths | this addendum |
| Allowed scope source | RSE-T1 work order and paired GC-018 baseline |
| Before status evidence | executionBaseHead `77f676bf`; clean worktree before worker edits |
| After status evidence | this addendum created, pending no-commit return |
| Diff evidence | worker records `git status --short` in the worker return |
| Approval boundary | worker created the addendum and committed nothing |
| Claim boundary | documentation-only addendum; no checker, helper, runtime, provider, or public behavior |
| Agent type | worker role |
| Invocation ID | `rse-t1-operator-question-boundary-worker-2026-06-22` |
| Expected manifest | this addendum; the worker return |
| Actual changed set | worker records in the worker return |
| Manifest delta | worker records in the worker return |
