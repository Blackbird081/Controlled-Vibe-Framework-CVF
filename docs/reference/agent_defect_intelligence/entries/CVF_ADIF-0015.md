# ADIF-0015 - Declared Route Mode Does Not Match Actor's Own Execution Behavior

Memory class: POINTER_RECORD

Status: ACTIVE

```text
defectId: ADIF-0015
title: Declared route mode does not match actor's own execution behavior
defectCategory: AUTHORITY_BOUNDARY
defectClass: WORKER_EXECUTION_ERROR
defectRole: NOT_APPLICABLE_WITH_REASON: this entry is a general pattern, not a single finding row
severity: HIGH
lifecycleState: ACTIVE
taskClasses: Work-order authoring / dispatch
roles: dispatcher; worker
lifecyclePhases: pre-dispatch; pre-implementation
surfaceSelectors: GC-018 baselines and work orders whose Agent Roles / Intake Role Routing Decision / Agent Handoff Contract Control Block declares route=`SINGLE_AGENT_SINGLE_ROLE` or `author-then-executor` with the dispatching actor named only as dispatch-author
detectionSignals: the same actor who declared `route` and `rolePattern` also performed multiple self-correction passes that materially rewrote the governed artifact's substantive content (not just formatting) after the initial draft, with no role-change marker or fresh base-head recorded for the shift from authoring to executing
enforcementLevel: GUIDANCE_ONLY
checkerBindings: NOT_APPLICABLE_WITH_REASON: distinguishing "dispatch-authoring iteration" from "executor-shaped self-correction" requires judgment a generic diff/keyword checker cannot reliably make; no checker is proposed here
promotionState: DESIGN_REVIEW_REQUIRED
supersedes: NONE
lastVerifiedCommit: 5ae9cb9e
roadmapSeedId: NONE
```

## Purpose

Record one observed defect pattern so an agent recognizes it before declaring
a route mode and rolePattern that names itself as dispatch-author only, while
its own subsequent actions on the same artifact are executor-shaped.

## Scope / Applies To

Applies to GC-018 baselines and work orders that declare a canonical route
token (`SINGLE_AGENT_SINGLE_ROLE`, `SINGLE_AGENT_MULTI_ROLE`,
`MULTI_AGENT_SINGLE_ROLE`, `MULTI_AGENT_MULTI_ROLE`) and a `rolePattern`
naming the dispatching actor as author-only. Does not apply to genuine
dispatch-authoring iteration (drafting, then correcting one's own prose for
clarity or gate compliance) when the artifact's substantive claims and scope
do not change.

## Bad Example

> A dispatch packet declares `route: SINGLE_AGENT_SINGLE_ROLE` and
> `rolePattern: "Codex implements checker/tests/worker-return; reviewer
> reviews/closes"`. The same agent that authored this then runs the changed
> artifact through dozens of governance checkers across many rounds, each time
> rewriting the artifact's substantive content (adding full Rescan
> Intelligence Hardening tables, Reviewer Closure Conversion blocks, Worker
> Return Packet Shape Contract terms) to satisfy the gates - the kind of
> iterative content production the work order assigns to the executor role -
> while the artifact still claims the agent is dispatch-author only, per
> [CVF_GC018_AGSG_BSH_T1_SCOPE_TRIGGERED_BLINDSPOT_PRESENCE_GUARD_2026-06-28.md](../../../baselines/CVF_GC018_AGSG_BSH_T1_SCOPE_TRIGGERED_BLINDSPOT_PRESENCE_GUARD_2026-06-28.md).
> The correct taxonomy per
> `docs/reference/CVF_AHB_T2_AGENT_HANDOFF_CONTRACT_RATIFICATION_2026-06-16.md`
> CF-02 is `one-agent-many-roles`, not `author-then-executor`, for the portion
> of work the dispatching agent actually executed itself.

## Good Example

> The agent recognizes that authoring a governance artifact through to full
> gate-compliance is itself executor-shaped work on that artifact (distinct
> from the separately-scoped code/test work delegated to another actor), and
> declares `rolePattern: one-agent-many-roles` for the docs-authoring portion
> with phase markers (DISPATCH_AUTHORING then EXECUTION-for-docs), while still
> declaring a separate `author-then-executor` split for the code/checker
> portion delegated to the other actor. Or, the agent stops self-correcting
> the artifact once it is dispatch-ready in substance and returns it for the
> declared executor to take over, rather than driving it to full closure-level
> gate compliance itself.

## Canonical Sources

- `docs/reference/CVF_AHB_T2_AGENT_HANDOFF_CONTRACT_RATIFICATION_2026-06-16.md`
  (CF-02 `rolePattern`; named patterns `one-agent-many-roles` vs.
  `author-then-executor` vs. `worker-no-commit split`)
- `docs/baselines/CVF_GC018_AGSG_BSH_T1_SCOPE_TRIGGERED_BLINDSPOT_PRESENCE_GUARD_2026-06-28.md`
  (observed instance: declared `SINGLE_AGENT_SINGLE_ROLE` / dispatch-author-only
  while the same agent iteratively rewrote the artifact's substantive content)

## Remediation

Before declaring `route` and `rolePattern`, look ahead at what the
dispatching agent is actually about to do to the artifact. If the agent
expects to make multiple substantive-content correction passes (not just
formatting) to reach gate compliance, declare `one-agent-many-roles` for that
portion of the work with phase markers, rather than `author-then-executor`.
Reserve `author-then-executor` for cases where the dispatching agent stops
once the packet is dispatch-ready in substance and a genuinely separate actor
performs the remaining iteration.

## Agent Operation Trace Block

| Field | Evidence |
|---|---|
| Actor | Claude dispatch-author orchestrator |
| Provider or surface | local workspace |
| Session or invocation | AGSG-BSH-T1 dispatch authoring self-review, 2026-06-28 |
| Working directory | repository root |
| Command or tool surface | governed source reads, grep over AHB-T2 contract, file write tool |
| Target paths | this entry file; ADIF entries README |
| Allowed scope source | operator instruction 2026-06-28 to record this role-mismatch pattern as a checklist item for other agents |
| Before status evidence | AGSG-BSH-T1 baseline/work order declared `SINGLE_AGENT_SINGLE_ROLE` while the declaring agent had already performed many self-correction passes rewriting substantive content |
| After status evidence | defect pattern discoverable in the ADIF registry; resolver can surface it at pre-dispatch |
| Diff evidence | new-file creation in this batch |
| Approval boundary | records an observed defect pattern only; does not retroactively amend the AGSG-BSH-T1 artifact's route/rolePattern fields |
| Claim boundary | defect-record only; no checker implementation claim |
| Agent type | dispatcher |
| Invocation ID | `agsg-bsh-t1-role-mismatch-adif-2026-06-28` |
| Expected manifest | this entry, plus an index row in the entries README |
| Actual changed set | this entry; entries README |
| Manifest delta | MATCH |

## Public Export Disposition

DEFERRED_PRIVATE_ONLY

Reason: private provenance ADIF entry. No public-sync claim.

## Claim Boundary

This entry records an observed defect pattern only. It does not implement a
checker, and it does not retroactively change the route/rolePattern fields
already committed in the AGSG-BSH-T1 baseline or work order.
