# CVF RSE-T2 Worker Return Jurisdiction Block Addendum

Memory class: FULL_RECORD

Status: ACTIVE_REFERENCE

docType: reference

Date: 2026-06-22

Index classification: GOVERNED_DOC (not an INDEX_ARTIFACT). This addendum defines
a worker-return documentation block; it does not map, enumerate, project, or
classify CVF state.

EPISTEMIC_PROCESS_NA_WITH_REASON: this is a documentation addendum that defines a
fixed worker-return block and its fields; it is not an estimation, forecast, or
probabilistic judgment task, so no epistemic confidence calibration applies.

## Purpose

Make worker returns carry enough structured routing data for a reviewer or closer
to act without asking the operator. This addendum defines a
`## Worker Return Jurisdiction Block` whose fields state what was captured, what
may need promotion, where promotion should route, and whether any operator-owned
decision is actually present.

The block exists because a worker once merged a self-handled finding capture with
a reviewer or closer promotion decision and raised the merged choice to the
operator. With the block present, a worker records the routing data and the
reviewer or closer reads it directly, so the operator is not pulled into a routine
inter-agent decision.

## Scope

Applies to any agent producing a worker return in a governed CVF batch,
especially returns that contain findings, gate traps, or out-of-scope promotion
candidates. This addendum builds on the closed Role Switch Envelope standard
(`docs/reference/role_switch_envelope/CVF_ROLE_SWITCH_ENVELOPE_STANDARD.md`) and
the closed Operator Question Boundary addendum
(`docs/reference/role_switch_envelope/CVF_RSE_T1_OPERATOR_QUESTION_BOUNDARY_ADDENDUM.md`).
It is a local view of the ratified Agent Handoff Contract in
`docs/reference/CVF_AHB_T2_AGENT_HANDOFF_CONTRACT_RATIFICATION_2026-06-16.md`; it
does not replace that contract. Role names follow the Role Glossary in
`docs/reference/guard_orientation/README.md`.

Out of scope: any checker, helper, or diagnostic implementation; any edit to the
Worker Return Packet Shape Contract enforcement code or the work-order template;
the RSE-T3 diagnostics; and any runtime, provider, public-sync, or interception
behavior.

## The Worker Return Jurisdiction Block

A worker return that contains a finding, gate trap, or out-of-scope promotion
candidate should carry a `## Worker Return Jurisdiction Block` with the following
fields. Each field is documentation only; this addendum does not enforce them.

| Field | Meaning |
|---|---|
| `findingRecorded` | whether a meaningful finding was captured in this return |
| `findingSurface` | the allowed surface where the finding was captured, such as this worker return |
| `allowedScopeRepairPerformed` | whether the worker repaired an allowed-scope defect and reran the assigned checks |
| `outOfScopePromotionCandidate` | whether the finding may need promotion to an out-of-scope artifact |
| `promotionTargetType` | the kind of target a promotion would touch, such as lane memory, reference, checker, registry, or roadmap |
| `promotionTargetPath` | the specific target path a promotion would touch, when known |
| `reviewerActionRequested` | the action the worker asks the reviewer or closer to decide, such as accept, reject, or route a promotion |
| `operatorActionRequired` | whether an operator-owned decision is actually present, true only when an RSE-T1 `ASK_OPERATOR` class applies |
| `operatorActionReason` | the specific operator-owned class when `operatorActionRequired` is true, otherwise none |
| `blockedReason` | the exact source or gate when the return is blocked, otherwise none |
| `claimBoundary` | the bounded claim this return makes |

## Capture And Promotion Are Distinct Fields

`findingRecorded` and `findingSurface` record that the finding was captured; this
is the worker's self-handled obligation. `outOfScopePromotionCandidate`,
`promotionTargetType`, and `promotionTargetPath` record that promotion may be
needed and where it would go; the worker does not perform the promotion and
routes it to the reviewer or closer through `reviewerActionRequested`.

Keeping these as separate fields prevents the capture-plus-promotion conflation
that produced the original operator-question confusion.

## Operator Action Is The Exception, Not The Default

`operatorActionRequired` is true only when an RSE-T1 `ASK_OPERATOR` class is
present: scope expansion, risk change, live or provider use, public-sync,
destructive or irreversible action, secrets or quota, roadmap or tranche
selection, or explicit authorization of otherwise forbidden scope. In that case
`operatorActionReason` names the specific class.

For closure acceptance, finding absorption, and out-of-scope promotion routing,
`operatorActionRequired` is false and `reviewerActionRequested` carries the
request. Those are reviewer or closer decisions and are never raised to the
operator.

## No Self-Widening

Recording a promotion candidate in this block does not authorize the worker to
edit the promotion target. Lane memory, reference standards, checkers,
registries, and roadmaps remain out of worker scope. The block records the
candidate and routes the decision; it does not perform the edit. No worker is
granted authority to edit out-of-scope lane memory or checkers by filling in this
block.

## Worked Example

A worker finishes a documentation tranche, captures a reusable gate-trap lesson,
and notes it may belong in a shared standard.

```
## Worker Return Jurisdiction Block

- findingRecorded: yes
- findingSurface: this worker return, Findings section
- allowedScopeRepairPerformed: yes, one structural section added and gates rerun
- outOfScopePromotionCandidate: yes
- promotionTargetType: reference standard
- promotionTargetPath: none proposed; reviewer or closer selects the target
- reviewerActionRequested: decide whether to promote the lesson to a shared standard
- operatorActionRequired: no
- operatorActionReason: none
- blockedReason: none
- claimBoundary: documentation-only worker return; no out-of-scope edit performed
```

The worker captured the finding and routed the promotion. It did not edit a shared
standard and did not ask the operator.

## Placement Recommendation

This addendum recommends, without enforcing, that the Worker Return Jurisdiction
Block be adopted in the following order of preference. The decision and any
machine enforcement are deferred to RSE-T3.

| Candidate placement | Recommendation | Reason |
|---|---|---|
| Worker Return Packet Shape Contract | preferred for a future required block | it is where worker-return required sections already live, so a future checker could detect a missing block there |
| Work-order template | recommended as guidance now | a work order can instruct the worker to include the block without any code change |
| AAF helper diagnostics | candidate for an advisory readout | the helper already emits read-only advisories and could flag a return that has promotion language but no block |
| A future checker | deferred to RSE-T3 | machine enforcement is out of scope for this documentation tranche |

RSE-T2 makes no change to any of these surfaces. It records the recommendation
only.

## Documentation-Only Boundary

This addendum is documentation and reference only. It introduces no machine
check, no helper output, no work-order template change, no runtime behavior, and
no operator-facing automation. It builds on the closed RSE-T0 standard and RSE-T1
addendum and is a local view of the ratified Agent Handoff Contract. Machine
enforcement and any early diagnostics are deferred to RSE-T3, which requires its
own authorization and source-verified work order.

## Non-Goals

- replacing the ratified Agent Handoff Contract;
- editing the closed RSE-T0 standard or RSE-T1 addendum;
- editing the Worker Return Packet Shape Contract enforcement code or the
  work-order template;
- implementing any checker, helper, or diagnostic in this tranche;
- provider or live proof, public-sync, CLI/MCP adapter behavior, or external
  agent runtime behavior;
- claiming universal governed-coding control or speed and cost outcomes.

## Claim Boundary

This addendum defines the Worker Return Jurisdiction Block and its fields,
separates capture from promotion, ties operator action to an RSE-T1
`ASK_OPERATOR` class, forbids self-widening, and records a placement
recommendation, as documentation and reference only. It builds on the closed
RSE-T0 standard and RSE-T1 addendum and is a local view of the ratified Agent
Handoff Contract, not a replacement and not an edit of it. It does not authorize
any checker, helper, or diagnostic implementation, any edit to the Worker Return
Packet Shape Contract enforcement or the work-order template, any RSE-T3 content,
runtime behavior, provider or live behavior, CLI/MCP adapter behavior,
public-sync, direct interception, readiness claims, speed or cost claims, or
universal governed-coding control.

## Public Export Disposition

DEFERRED_PRIVATE_ONLY

Reason: RSE-T2 is private provenance governance-protocol work. No public-sync
repository work or public catalog claim is authorized.

## Delta Execution Claim Boundary Control Block

| Field | Disposition |
|---|---|
| claimScope | RSE-T2 Worker Return Jurisdiction Block addendum |
| claimDisposition | N/A with reason: no Delta execution-control claim is made |
| receiptEvidence | N/A with reason: no Delta receipt evidence is created or consumed |
| actionEvidence | N/A with reason: no runtime action is executed or observed |
| invocationBoundary | documentation reference only |
| interceptionBoundary | no IDE, shell, git, filesystem, or provider interception claim |
| claimLanguage | documentation-only reference addendum |
| forbiddenExpansion | checker or helper implementation, work-order template enforcement edit, runtime role router, agent workspace, AHB semantics change, RSE-T0 or RSE-T1 edit, RSE-T3 content, provider/live, public-sync, queue/daemon/watcher, direct interception, readiness, and universal control remain out of scope |

## Agent Operation Trace Block

| Field | Evidence |
|---|---|
| Actor | worker role |
| Provider or surface | local workspace |
| Session or invocation | RSE-T2 worker execution, 2026-06-22 |
| Working directory | `D:\UNG DUNG AI\TOOL AI 2026\Controlled-Vibe-Framework-CVF` |
| Command or tool surface | documentation authoring |
| Target paths | this addendum |
| Allowed scope source | RSE-T2 work order and paired GC-018 baseline |
| Before status evidence | executionBaseHead `45247ab0`; clean worktree before worker edits |
| After status evidence | this addendum created, pending no-commit return |
| Diff evidence | worker records `git status --short` in the worker return |
| Approval boundary | worker created the addendum and committed nothing |
| Claim boundary | documentation-only addendum; no checker, helper, runtime, provider, or public behavior |
| Agent type | worker role |
| Invocation ID | `rse-t2-worker-return-jurisdiction-block-worker-2026-06-22` |
| Expected manifest | this addendum; the worker return |
| Actual changed set | worker records in the worker return |
| Manifest delta | worker records in the worker return |
