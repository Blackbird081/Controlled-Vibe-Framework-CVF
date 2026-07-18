# CVF Agent Push Readiness Preview Standard

Memory class: POINTER_RECORD

Status: ACTIVE_REFERENCE

docType: reference_standard

Date: 2026-06-27

EPISTEMIC_PROCESS_NA_WITH_REASON: operational sequencing standard; it defines
a local read-only preview step and does not assert empirical runtime,
provider, or public behavior.

## Purpose

Prevent repeated provenance or public push cascades by requiring an early
read-only preview before the full pre-push gate or `git push` attempt. The
preview is a diagnostic step, not a substitute for the canonical pre-push gate.

## Scope / Methodology

Applies when an agent plans to push a governed CVF branch, publish a
public-sync batch, or ask the operator to accept a push-ready state. The agent
must run the preview after material changes are staged enough to inspect, and
again after the final material commit if session-sync work was needed.

Required command:

```powershell
python governance/compat/run_agent_push_readiness_preview.py --base <baseHead> --head HEAD --enforce
```

Default upstream debt rule: the preview fails when the local branch is more
than 2 commits ahead of its upstream tracking branch. The normal safe shape is
one material commit plus one dedicated session-sync or handoff-sync commit.
If a governed batch truly needs a larger local stack, the agent must either
push the completed pair first, or record a concrete blocker and operator
authorization before continuing into the next tranche.

If the branch intentionally has no upstream tracking branch, use
`--skip-upstream` and record that reason in the closure packet. For final push
evidence, the preview range must be non-stale and must not be confused with the
full gate required by
`docs/reference/CVF_AGENT_AUTORUN_WORKFLOW_CONTROL_STANDARD_2026-05-28.md`.

## Required Readout

The preview must report:

- repository remote and upstream tracking branch;
- upstream push-debt status and the local commit count ahead of upstream;
- `git status --short`;
- commit-shape split risk between material paths and protected
  session/handoff paths;
- generated active-session state drift;
- active session, session mode, next-move, core-guard, active-window,
  review-retention, repository-lifecycle, pre-public P3, knowledge-absorption,
  public-doc-drift, governed file-size, and Python automation-size checks;
- diff hygiene.

## Required Operator Discipline

When the preview fails, repair the first actionable local defect before running
the full pre-push gate again. Do not repeatedly call the full pre-push gate to
discover the next marker one at a time.

If the preview reports mixed material and protected session/handoff paths,
split the batch:

1. Commit material paths first.
2. Commit a dedicated session-sync or handoff-sync update second.
3. Run preview again over the relevant final range.
4. Then run the canonical pre-push gate.

If the preview reports upstream push debt over the default limit, the agent
must not open or continue another governed tranche on that branch. The next
action is to push the already-complete safe range, rebuild/split the unpushed
range if it is already malformed, or record a concrete blocker in the active
handoff and stop new material work.

## Findings / Position

The preview exists because the full pre-push chain is intentionally broad and
can surface stale front-door markers, active-window registry issues,
review-retention registry scope issues, repository lifecycle markers,
pre-public P3 exposure markers, knowledge-absorption markers, or GC-020
handoff continuity after the agent already believes the batch is ready. Moving
these readouts earlier reduces noisy repair loops while preserving the
canonical gate as the authority.

## Risk / Corrective Action

Risk: an agent may treat the preview as push authorization.

Corrective action: the preview standard explicitly requires the canonical
pre-push autorun gate before push. A PASS from the preview means only that the
known cascade-prone read-only checks passed at that moment.

Risk: an agent may preview an empty or stale range.

Corrective action: the closure packet must name the base/head range used for
final push readiness and must keep material and session-sync ranges separate
when commit-shape says to split them.

Risk: an agent may keep committing multiple governed tranches locally and defer
push until the resulting range mixes material, protected session surfaces, and
handoff rotation history.

Corrective action: the preview helper fails by default when upstream ahead
count exceeds 2. The agent must clear or explicitly park that push debt before
starting another governed tranche.

## Decision / Disposition

Disposition: ACTIVE_REFERENCE.

The helper `governance/compat/run_agent_push_readiness_preview.py` is the
local implementation of this standard. Future agents should run it before
provenance push, public-sync push, or push-readiness claims.

## Claim Boundary

This standard adds an early local diagnostic step only. It does not push,
fetch, mutate files, replace the pre-push gate, relax any guard, authorize
public-sync, claim live provider behavior, open runtime work, change MPI-T6
status, or certify CVF readiness.

## Public Export Disposition

DEFERRED_PRIVATE_ONLY

Reason: this is provenance governance workflow documentation only; no
public-facing artifact is authorized in this batch.

## Delta Execution Claim Boundary Control Block

| Field | Disposition |
|---|---|
| claimScope | push-readiness preview standard only |
| claimDisposition | N/A with reason: no Delta execution-control claim is made |
| receiptEvidence | N/A with reason: no receipt is created or consumed by the standard |
| actionEvidence | N/A with reason: helper performs read-only local checks |
| invocationBoundary | local agent shell invocation |
| interceptionBoundary | no IDE, shell, git, filesystem, provider, or network interception claim |
| claimLanguage | read-only preview before canonical pre-push gate |
| forbiddenExpansion | push authorization, public-sync authorization, runtime/provider/live proof, readiness certification, queue/daemon/watcher, or universal governed-coding-control claim |

## Agent Operation Trace Block

| Field | Evidence |
|---|---|
| Actor | Codex reviewer/closer role |
| Provider or surface | local workspace |
| Session or invocation | push-readiness preview standardization, 2026-06-27 |
| Working directory | `D:\UNG DUNG AI\TOOL AI 2026\Controlled-Vibe-Framework-CVF` |
| Command or tool surface | apply_patch, focused pytest, preview helper, governance gates |
| Target paths | `docs/reference/CVF_AGENT_PUSH_READINESS_PREVIEW_STANDARD_2026-06-27.md`; `governance/compat/run_agent_push_readiness_preview.py`; `governance/compat/test_run_agent_push_readiness_preview.py`; `docs/reference/guard_orientation/README.md`; `docs/reviews/CVF_AGENT_PUSH_READINESS_PREVIEW_STANDARDIZATION_COMPLETION_2026-06-27.md`; `governance/compat/CVF_REVIEW_RETENTION_REGISTRY.json` |
| Allowed scope source | operator instruction to standardize the prevention path for provenance pre-push cascades before returning to FPC-SCG next move |
| Before status evidence | baseHead `3e4b7266`; worktree clean before patch |
| After status evidence | read-only helper and standard added; upstream push-debt limit documented; focused tests updated |
| Diff evidence | `git diff --name-status` against baseHead `3e4b7266` |
| Approval boundary | push-readiness preview standardization only |
| Claim boundary | read-only preview; no public-sync, runtime/provider/live behavior, registry edit beyond documentation, push authorization, MPI-T6 work, or FPC implementation |
| Agent type | reviewer/closer |
| Invocation ID | `agent-push-readiness-preview-standardization-2026-06-27` |
| Expected manifest | `docs/reference/CVF_AGENT_PUSH_READINESS_PREVIEW_STANDARD_2026-06-27.md`; `governance/compat/run_agent_push_readiness_preview.py`; `governance/compat/test_run_agent_push_readiness_preview.py`; `docs/reference/guard_orientation/README.md`; `docs/reviews/CVF_AGENT_PUSH_READINESS_PREVIEW_STANDARDIZATION_COMPLETION_2026-06-27.md`; `governance/compat/CVF_REVIEW_RETENTION_REGISTRY.json` |
| Actual changed set | `docs/reference/CVF_AGENT_PUSH_READINESS_PREVIEW_STANDARD_2026-06-27.md`; `docs/reference/guard_orientation/README.md`; `docs/reviews/CVF_AGENT_PUSH_READINESS_PREVIEW_STANDARDIZATION_COMPLETION_2026-06-27.md`; `governance/compat/CVF_REVIEW_RETENTION_REGISTRY.json`; `governance/compat/run_agent_push_readiness_preview.py`; `governance/compat/test_run_agent_push_readiness_preview.py` |
| Manifest delta | MATCH |
