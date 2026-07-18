# ADIF-0013 - Upstream Push Debt Range Backlog

Memory class: POINTER_RECORD

Status: ACTIVE

EPISTEMIC_PROCESS_NA_WITH_REASON: ADIF registry entry; canonical sources and
trace evidence are recorded, but this entry does not perform a separate
evidence-comparison process.

```text
defectId: ADIF-0013
title: Upstream push debt range backlog
defectCategory: STATE_CONTINUITY
defectClass: RULE_GAP
defectRole: NOT_APPLICABLE_WITH_REASON: general reviewer/closer and session-sync steward sequencing pattern
severity: HIGH
lifecycleState: ACTIVE
taskClasses: Push-readiness preview; Closure; Session-sync
roles: reviewer; closer; session-sync steward
lifecyclePhases: pre-closure; pre-push
surfaceSelectors: governed branch with upstream tracking branch and local commits ahead of upstream
detectionSignals: push-readiness preview reports upstream push debt exceeds the configured ahead limit; git rev-list --left-right --count upstream...HEAD shows local ahead count greater than 2
enforcementLevel: MACHINE_CHECKED
checkerBindings: governance/compat/run_agent_push_readiness_preview.py
promotionState: MACHINE_CHECK_ADDED
supersedes: NONE
lastVerifiedCommit: 42ffa4f6
roadmapSeedId: NONE
```

## Purpose

Record the failure pattern where an agent completes multiple governed tranches
locally but defers upstream push until the branch contains a long unpushed
stack. Once material commits, protected session-sync commits, handoff rotation,
and guard authorization artifacts accumulate in one unpublished range, the
pre-push path becomes hard to repair because each sub-range can require a
different authorization or commit shape.

The defect is not "push took a long time" by itself. The defect is allowing
new governed work to continue while the branch is already more than one
material-plus-session pair ahead of upstream, without recording a concrete
blocker or operator-authorized exception.

## Scope / Applies To

Applies to governed CVF branches with an upstream tracking branch when an
agent is acting as reviewer, closer, or session-sync steward. Does not apply
to intentionally untracked scratch branches where `--skip-upstream` is used
and the reason is recorded in the closure packet.

## Bad Example

```text
Finish tranche T1, commit material and session-sync locally, skip push,
then continue T2/T3/T4. Only after many local commits, run the pre-push gate
once over the entire upstream..HEAD span.
```

This makes the upstream range contain unrelated material and protected
session/handoff changes, so a single missing authorization or stale marker can
block the entire publish path.

## Good Example

```text
Finish one material commit and one dedicated session-sync commit, run
push-readiness preview and canonical pre-push for that range, then push. If
push is blocked, record the exact blocker and do not open another governed
tranche on the same branch until the debt is cleared or explicitly parked.
```

The safe default is at most 2 commits ahead of upstream: one material commit
and one session-sync or handoff-sync commit.

## Canonical Sources

- `docs/reference/CVF_AGENT_PUSH_READINESS_PREVIEW_STANDARD_2026-06-27.md`:
  upstream push-debt rule and required preview command
- `governance/compat/run_agent_push_readiness_preview.py`:
  `DEFAULT_UPSTREAM_AHEAD_LIMIT` and `_upstream_status`
- `docs/reference/guard_orientation/README.md`:
  Push-readiness preview task-class row and common failure pattern
- `docs/reference/CVF_TRANCHE_COMMIT_CHOREOGRAPHY_STANDARD_2026-06-03.md`:
  material/session-sync commit separation discipline

## Remediation

Run push-readiness preview before starting a fresh governed tranche and after
each completed material-plus-session pair. If the local branch is more than 2
commits ahead of upstream, stop new governed work on that branch. Push the safe
sub-range, rebuild or split the malformed local stack from a backup branch, or
record a concrete blocker and operator authorization before continuing.

## Agent Operation Trace Block

| Field | Evidence |
|---|---|
| Actor | Codex reviewer/closer |
| Provider or surface | local workspace |
| Session or invocation | provenance push debt standardization, 2026-06-27 |
| Working directory | repository root |
| Command or tool surface | git status, git rev-list upstream readout, apply_patch, focused pytest |
| Target paths | `docs/reference/agent_defect_intelligence/entries/CVF_ADIF-0013.md`; `docs/reference/agent_defect_intelligence/entries/README.md` |
| Allowed scope source | operator instruction to standardize the provenance push-debt lesson so other agents cannot repeat it |
| Before status evidence | branch was 27 commits ahead of `origin/codex/p1-p5-small-debt-remediation`; push-readiness preview showed upstream `behind_ahead=0 27` |
| After status evidence | ADIF entry added and preview helper updated to machine-fail upstream push debt over the default limit |
| Diff evidence | new-file creation plus README row in this commit |
| Approval boundary | ADIF entry and push-debt prevention guidance only |
| Claim boundary | records and machine-binds one sequencing defect pattern; does not push, rewrite history, or authorize public-sync |
| Agent type | reviewer/closer |
| Invocation ID | cvf-adif-0013-upstream-push-debt-2026-06-27 |
| Expected manifest | this entry, plus README table row |
| Actual changed set | this entry, plus README table row |
| Manifest delta | MATCH |

## Public Export Disposition

DEFERRED_PRIVATE_ONLY

Reason: private provenance ADIF entry. No public-sync claim.

## Claim Boundary

This entry records one observed sequencing defect pattern and its confirmed
checker binding. It does not modify git history, push any branch, authorize
runtime/provider/live work, or replace the canonical pre-push autorun gate.
