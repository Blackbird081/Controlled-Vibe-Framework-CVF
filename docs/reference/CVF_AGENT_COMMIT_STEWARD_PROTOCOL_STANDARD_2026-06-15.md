# CVF Agent Commit Steward Protocol Standard

Memory class: FULL_RECORD

Status: ACTIVE_STANDARD

docType: reference

Date: 2026-06-15

Authority: operator request after Model Gateway C-02 P2 dispatch commit latency

---

## Purpose

Reduce total agent commit latency without weakening CVF guard coverage.

The protocol is agent-neutral. It applies whether Codex, Claude, another agent,
or one agent in multiple roles prepares the commit. The optimization target is
elapsed workflow time, not convenience for a specific provider.

## Scope

This standard applies to any governed CVF batch that:

- commits or prepares a commit for work orders, roadmaps, baselines, reviews,
  standards, guards, source, tests, session state, or handoff files;
- uses `WORKER_MUST_NOT_COMMIT` or `WORKER_MAY_COMMIT`;
- uses single-agent multi-role execution;
- changes active session front-door or generated state files;
- includes an Agent Operation Trace Block;
- runs autorun workflow gates.

## Core Principle

Keep guard coverage intact, but move failure discovery earlier and split commits
so one gate family does not invalidate another.

Do not use `--no-verify` as the normal speed path. Faster CVF commits come from:

- capturing the correct base before edits;
- running the phase-appropriate steward preflight before commit;
- avoiding duplicate fast/full gate runs unless the phase requires both;
- separating material artifacts from session/handoff sync;
- resolving manifest and protected-path conflicts before invoking `git commit`.

## Required Steward Command

Before a governed commit or worker return handoff, run the steward preflight for
the matching mode:

```powershell
python governance/compat/run_agent_commit_steward_preflight.py --mode <mode> --base <baseHead> --head HEAD --enforce
```

Allowed modes:

| Mode | Use when | Primary gate |
| --- | --- | --- |
| `dispatch` | Releasing a roadmap/work order/baseline to a worker | autorun `pre-dispatch` |
| `implementation` | Worker starts or validates implementation scope | autorun `pre-implementation` |
| `reviewer-return` | Reviewer inspects uncommitted worker artifacts | `reviewer-fast` |
| `closure` | Reviewer/committer validates committed closure range | autorun `pre-closure` |
| `push` | Preparing public or remote push | autorun `pre-push` |
| `session-sync` | Updating only session front-door/state/handoff continuity | closure packaging, active session, and generated-state checks |
| `handoff-sync` | Updating only the root active handoff after a material/session commit | active session compatibility only |

`--enforce` fails high-risk commit-shape conflicts. Without `--enforce`, the
script reports the same diagnostics but exits successfully unless a commanded
gate fails.

## Commit Split Rule

Material artifacts and session/handoff sync should be separate commits.

Default sequence:

1. Material commit: source, tests, work order, baseline, review, standard,
   guard, or registry artifacts owned by the work.
2. Session-sync commit: `CVF_SESSION_MEMORY.md`,
   `CVF_SESSION/ACTIVE_SESSION_STATE.json`, `CVF_SESSION/state/**`, active
   handoff, and related continuity pointers.
3. Handoff-sync commit: active handoff only, used when the prior commit already
   updated session state/front-door surfaces and the final HEAD marker needs the
   accepted parent-marker pattern.

Do not mix material artifacts with active handoff/session sync when an Agent
Operation Trace Block requires an exact `Actual changed set`, unless the
artifact explicitly authorizes the mixed protected-path manifest and the machine
gate accepts the exact observed paths.

Generated workspace state under `CVF_SESSION/agent_workspace/` is a governed
workspace-state material surface, not active session-sync continuity. It follows
the generated aggregate discipline and the agent workspace state checker rather
than the session-sync lane.

## Commit Stack Debt Disclosure Guard

Before creating any governed commit, the committing agent must inspect local
commit debt against the upstream tracking branch:

```powershell
git status --short --branch
git log --oneline "HEAD@{upstream}..HEAD"
```

If the current branch has more than two unpushed commits, the agent records a
push-debt disposition before starting another tranche or creating additional
optional closure/session-sync commits. Valid dispositions are:

- the commit is required to finish the same already-started operator-approved
  tranche and cannot be safely left uncommitted;
- the operator has explicitly selected a push, squash, split, rebase, or branch
  isolation plan for the current stack;
- the agent records a concrete blocker explaining why the completed safe pair
  cannot be pushed or consolidated before more work continues.

The normal completed-tranche shape is at most one material commit plus one
session-sync or handoff-sync commit. More commits for the same tranche require a
brief reason in the steward evidence. A failed commit attempt is not a reason to
create another tranche; repair the current changed set or stop with a
source-backed blocker.

This section is a disclosure and operating-discipline rule for commit authors.
It does not claim that `run_agent_commit_steward_preflight.py` currently
machine-enforces the upstream ahead-count threshold. The read-only
`run_agent_push_readiness_preview.py` upstream check can fail when the local
ahead count exceeds the preview limit, but commit-steward preflight enforcement
is limited to the implemented mode and changed-path shape checks until a future
source-verified checker tranche explicitly adds an upstream-count guard.

Branches that already exceed the threshold when this disclosure rule is adopted
are `LEGACY_PUSH_DEBT_PRESENT`, not proof that every future commit must hard
block. They should be routed to an operator-visible push/squash/split/rebase or
branch-isolation decision before broad new roadmap work continues; a bounded
in-progress tranche may still be finished when leaving it uncommitted would lose
reviewable evidence.

## Single-Agent Multi-Role Rule

A single agent may execute multiple roles only if the evidence is separated by
phase and commit shape:

- role changes must be stated in the artifact;
- base heads must be captured per phase;
- material and session-sync commits remain separate when both are needed;
- worker evidence, reviewer evidence, and committer evidence must not be
collapsed into a single unqualified PASS claim;
- committed-range `pre-closure` remains reviewer/committer evidence even if the
same agent authored the worker artifacts.

## `WORKER_MUST_NOT_COMMIT` Rule

For `WORKER_MUST_NOT_COMMIT`, the worker leaves artifacts uncommitted and may
run `reviewer-return` or focused tests. The reviewer/committer owns:

- final material commit;
- committed-range `pre-closure`;
- session-sync commit if state changes;
- final clean-worktree claim.

The worker must not claim committed-range closure from uncommitted artifacts.

## Latency Discipline

Run only the gate set that matches the phase:

- dispatch packets: steward `dispatch`; do not also run `reviewer-fast` unless
  a no-commit worker return is being reviewed;
- worker returns: steward `reviewer-return`; do not claim closure from it;
- closure: steward `closure` after material commit; do not use `--base HEAD
  --head HEAD`;
- session sync: steward `session-sync` instead of the full phase gate when no
  material artifact is changing. It must run closure packaging preflight before
  generated-state and active-session checks so missing protected-path
  authorization is caught before `git commit`.
- handoff sync: steward `handoff-sync` for a dedicated active-handoff-only
  commit. Do not rerun generated-state checks when no generated state source or
  aggregate changed.

The git hook remains the final local confirmation layer. The steward preflight
exists to reduce repeated failed commits, not to replace hooks.

## Evidence Requirements

Commit or closure evidence should record:

- steward mode;
- base head and head;
- changed-path summary;
- material paths;
- protected session paths;
- split recommendation or `N/A with reason`;
- unpushed commit count against upstream, or `N/A with reason` when no upstream
  tracking branch exists;
- gate result;
- whether `--enforce` was used.

## Failure Conditions

The steward preflight must block or return to orchestrator for the machine
checked conditions it currently implements:

- the selected mode does not match the work phase;
- `closure` or `push` uses an empty committed range;
- an Agent Operation Trace exact-manifest artifact is mixed with active
  session/handoff sync in a way that would change the observed set;
- generated active session state is edited without source JSON alignment;
- protected session files are changed without an authorized session-sync
  boundary;
- `handoff-sync` mode includes any file other than the root active handoff;
- a worker in `WORKER_MUST_NOT_COMMIT` tries to commit or claim committed-range
  closure.

Upstream push debt above the normal two-commit completed-tranche shape is an
advisory disclosure condition in commit steward evidence. It is hard-enforced by
push-readiness preview only when that preview is run with upstream checking and
`--enforce`. Do not describe it as a commit-steward machine block unless the
steward implementation has been updated and verified in the same source-backed
checker tranche.

## Related Artifacts

- `docs/reference/CVF_AGENT_AUTORUN_WORKFLOW_CONTROL_STANDARD_2026-05-28.md`
- `docs/reference/CVF_TRANCHE_COMMIT_CHOREOGRAPHY_STANDARD_2026-06-03.md`
- `docs/reference/CVF_SINGLE_AGENT_MULTI_ROLE_CONTROL_STANDARD_2026-06-11.md`
- `docs/reference/CVF_AGENT_OPERATION_TRACE_AND_WORKSPACE_INTEGRITY_STANDARD_2026-06-13.md`
- `governance/compat/run_agent_commit_steward_preflight.py`

## Latency Control Addendum - 2026-06-15

Repeated closure friction showed that the final active-handoff marker commit is
a different lane from full session-state synchronization. When the only changed
path is the root active handoff, agents should run:

```powershell
python governance/compat/run_agent_commit_steward_preflight.py --mode handoff-sync --base HEAD~1 --head HEAD --enforce
```

This lane is deliberately narrower than `session-sync`: it runs active-session
compatibility and diff hygiene, and it rejects any material path or generated
state path. `session-sync` also runs closure packaging preflight to catch
missing Core Guard Self-Protection Authorization for protected state/front-door
paths before the commit hook. Use `session-sync` when `CVF_SESSION_MEMORY.md`,
`CVF_SESSION/ACTIVE_SESSION_STATE.json`, or `CVF_SESSION/state/**` changes.
Use `handoff-sync` only after those surfaces are already aligned and the active
handoff needs the accepted parent-marker continuity record.

## Epistemic Process Block

## Expected Result / Prediction

Prediction: a dedicated handoff-only steward lane should reduce repeated
closure friction by letting agents run active-session compatibility and diff
hygiene for final handoff marker commits, while rejecting any mixed material or
generated-session changed set.

## Evidence Comparison

Evidence comparison: the steward now classifies changed paths, prints a
recommended lane, accepts root `AGENT_HANDOFF*.md`-only changes as
`handoff-sync`, keeps `session-sync` for generated/front-door session updates,
and now runs closure packaging preflight in `session-sync` before commit.
Focused tests cover handoff-only acceptance, mixed session-state rejection, and
the session-sync command sequence.

## Contradiction Or Gap Disposition

Contradiction or gap disposition: this does not replace committed-range
`pre-closure`, pre-push, git hooks, generated-state validation when state files
change, or active-session compatibility. The remaining latency gap is the full
material closure gate itself, which remains intentionally authoritative.

## Claim Update

Claim update: prediction CONFIRMED_BOUNDED. CVF can reduce final sync latency
for handoff-only commits without weakening guard coverage, but this standard
does not claim semantic review automation or runtime/provider behavior.

## Exact Autorun Receipt Reuse And Parallel Timing Addendum - 2026-06-19

The phase-specific commit steward still invokes the matching autorun gate and
does not replace it. To avoid executing an identical successful phase twice,
autorun now writes a local ignored PASS receipt under
`.cvf/runtime/autorun-receipts/`. Steward requests reuse of that receipt.

Reuse is valid only when all of these values match exactly:

- phase;
- requested and resolved base/head anchors;
- complete command-manifest hash;
- worktree fingerprint over every committed-range and local changed path.

A missing, malformed, failed, stale, or mismatched receipt is never a pass. The
autorun gate executes its complete command set and replaces the receipt only
after every check passes. Receipts are optimization hints, not canonical CVF
authority, closure evidence, or a substitute for git hooks.

Autorun common checks run with bounded parallel workers by default and report
per-command plus total duration. `--serial` remains available for debugging.
Pre-push trailing commands remain serial so the nested parallel hook chain does
not compete with the common bundle. Parallel execution changes scheduling only;
it does not remove checks or weaken any failure condition.

## Core Guard Self-Protection Authorization

This batch is authorized as bounded governance control-plane hardening in
response to the operator request on 2026-06-15 to reduce total governed commit
latency while keeping guard coverage.

2026-07-08 extension: the operator identified excessive local commit stacking
as a governance-load defect analogous to overgrown ceremony. This standard is
authorized to add lightweight commit stack debt discipline without adding a new
checker, hook, runtime behavior, provider proof, public-sync mutation, or
session-sync requirement.

Protected paths authorized in this batch:

- `governance/compat/run_agent_commit_steward_preflight.py`
- `governance/compat/test_run_agent_commit_steward_preflight.py`
- `governance/compat/CVF_ACTIVE_WINDOW_REGISTRY.json`
- `docs/reference/CVF_AGENT_COMMIT_STEWARD_PROTOCOL_STANDARD_2026-06-15.md`

Allowed changes:

- add session-sync closure packaging preflight to catch protected-path
  authorization gaps before commit;
- add focused tests for the session-sync command sequence;
- preserve the lightweight handoff-sync command sequence.
- add lightweight commit stack debt discipline requiring agents to inspect
  unpushed commits before creating more local governed commits.
- register this still-active dated standard in the active-window registry so
  the active archive hygiene gate treats bounded updates as an active reference
  rather than stale drift.

Forbidden changes:

- disabling, weakening, or removing existing hooks;
- authorizing `--no-verify`;
- granting worker commit rights;
- changing provider/live/public behavior;
- changing unrelated governance gates.

Rollback boundary: revert this standard and the steward script/test only. Do
not revert Agent Dispatch Prompt Envelope Standardization material commit
`b2654e2e` or session-sync commit `65496aec`.

## Agent Operation Trace Block

| Field | Evidence |
| --- | --- |
| Actor | Codex |
| Provider or surface | Codex CLI |
| Session or invocation | commit stack debt disclosure wording repair after provenance push-debt cleanup at execution base `8b28e5923` |
| Working directory | `d:\UNG DUNG AI\TOOL AI 2026\Controlled-Vibe-Framework-CVF` |
| Command or tool surface | repair commit stack debt standard wording after source verification showed commit steward does not enforce upstream ahead count |
| Target paths | `docs/reference/CVF_AGENT_COMMIT_STEWARD_PROTOCOL_STANDARD_2026-06-15.md` |
| Allowed scope source | operator supplied review finding that the prior wording promised a machine block that current steward implementation does not provide, and highlighted existing 53-commit push debt |
| Before status evidence | branch status after cleanup was `codex/p1-p5-small-debt-remediation...origin/codex/p1-p5-small-debt-remediation`; historical review finding recorded prior `ahead 53`; `run_agent_commit_steward_preflight.py` has no upstream-count logic; `run_agent_push_readiness_preview.py` owns the upstream ahead-limit check |
| After status evidence | standard now distinguishes disclosure discipline from implemented machine enforcement, keeps the normal two-commit completed-tranche shape, and classifies already-over-threshold branches as `LEGACY_PUSH_DEBT_PRESENT` needing operator-visible consolidation planning rather than automatic hard block |
| Diff evidence | `git diff -- docs/reference/CVF_AGENT_COMMIT_STEWARD_PROTOCOL_STANDARD_2026-06-15.md`; focused gates |
| Approval boundary | bounded reference-standard wording repair only |
| Claim boundary | Repo-local trace only; no checker/hook/runtime/provider/public-sync behavior change, no public readiness, no production readiness, no push authorization |
| Agent type | Single agent acting as orchestrator/implementer/reviewer for a governance-control batch |
| Invocation ID | `commit-stack-debt-hardening-codex-2026-07-08` |
| Expected manifest | `docs/reference/CVF_AGENT_COMMIT_STEWARD_PROTOCOL_STANDARD_2026-06-15.md` |
| Actual changed set | `docs/reference/CVF_AGENT_COMMIT_STEWARD_PROTOCOL_STANDARD_2026-06-15.md` |
| Manifest delta | MATCH |

## Claim Boundary

This standard does not reduce required governance coverage, authorize
`--no-verify`, bypass git hooks, grant worker commit rights, authorize public
push, or claim production readiness. It standardizes the fastest governed path
by making the correct preflight, split, and evidence sequence repeatable across
agents.
