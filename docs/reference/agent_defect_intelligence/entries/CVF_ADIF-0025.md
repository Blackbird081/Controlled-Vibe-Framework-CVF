# ADIF-0025 - Untracked Worker Return Poisons Concurrent Trace Range Check

Memory class: POINTER_RECORD

Status: ACTIVE

```text
defectId: ADIF-0025
title: Untracked worker return poisons concurrent trace range check
defectCategory: GATE_TRIGGER_FRICTION
defectClass: RULE_GAP
defectRole: NOT_APPLICABLE_WITH_REASON: this entry records a checker-shape range-scoping gap, not a single root-cause role row
severity: MEDIUM
lifecycleState: ACTIVE
taskClasses: Continuity / session-sync / handoff maintenance; Reviewer-return review
roles: session-sync steward; reviewer
lifecyclePhases: pre-commit; pre-implementation
surfaceSelectors: governance/compat/check_agent_operation_trace.py range checks (--base/--head) run while an untracked docs/reviews or docs/work_orders trace artifact exists in the working tree alongside unrelated staged or committed changes
detectionSignals: check_agent_operation_trace.py reports UNAUTHORIZED_ADDITION or MISSING_DELIVERABLE violations naming files that are unrelated to the flagged trace artifact's own Actual changed set, specifically when a WORKER_MUST_NOT_COMMIT worker-return file remains untracked while another commit (e.g. session-sync) lands in the same working tree or range
enforcementLevel: PARTIAL_CHECK
checkerBindings: governance/compat/check_agent_operation_trace.py
promotionState: RULE_EXISTS
supersedes: NONE
lastVerifiedCommit: e5d4665f8
roadmapSeedId: NONE
```

## Purpose

Record that `get_changed_paths()` in
`governance/compat/check_agent_operation_trace.py` unconditionally merges
`git ls-files --others --exclude-standard` into the observed changed set,
regardless of the `--base`/`--head` range under test. Any untracked file
that qualifies as a trace artifact (a `docs/reviews/` or `docs/work_orders/`
file containing trigger vocabulary) is always included in the comparison,
and its own narrow `Actual changed set` manifest (listing only its own
worker-authored deliverables) is then compared against every other path
observed in the merged set - including files touched by a completely
unrelated commit made in the same working tree.

This is expected to recur every time a `WORKER_MUST_NOT_COMMIT` worker
return is left untracked (by design) while a session-sync or any other
commit lands in the same tree, and again whenever a reviewer runs the
pre-implementation autorun gate over `--base <dispatchCommit> --head HEAD`
while that same worker-return file is still untracked pending closure.

## Scope / Applies To

Applies to any session-sync, reviewer, or closer action that runs
`check_agent_operation_trace.py` (directly, via pre-commit, via
`run_worker_return_fast_gate.py`, or via
`run_agent_autorun_workflow_gate.py`) while at least one untracked
trace-artifact-shaped file coexists with other staged, committed, or
in-range changes that the artifact's own manifest does not name.

## Bad Example

A worker returns `COMPLETE_PENDING_REVIEW` and correctly leaves two files
untracked per `WORKER_MUST_NOT_COMMIT`. A session-sync steward then edits
unrelated continuity files (active handoff, session state) to clear a
GC-020 handoff-freshness gap and tries to commit. `git commit` is blocked:
the checker treats the untracked worker-return file as the authoritative
trace artifact for the entire range and flags every session-sync file as
`UNAUTHORIZED_ADDITION`, even though the session-sync files have no
relationship to the worker-return's own declared manifest. Re-running the
same check with `--base <dispatchCommit> --head HEAD` after the session-sync
commit lands reproduces the identical violation set, because the untracked
file is still in the tree and still gets merged in regardless of range.

## Good Example

Before committing unrelated continuity/session-sync work while a
worker-return file is intentionally untracked, temporarily move the
untracked worker deliverables out of the working tree (e.g.
`git stash push -u -- <worker paths>`), let the unrelated commit land and
verify `check_agent_operation_trace.py` reports zero violations for that
commit's own range, then restore the worker files
(`git stash pop`) so they remain untracked exactly as before, unmodified,
for the reviewer to evaluate separately. Do not use `--no-verify` to bypass
the gate, and do not fold the worker's untracked files into the session-sync
commit to make the checker pass.

A durable fix (separately authorized, out of session-sync scope) would scope
`get_changed_paths()`'s untracked-file merge to only apply when checking the
working tree against itself (e.g. `--base HEAD --head HEAD` or no explicit
range), and exclude untracked files from comparisons against an explicit
historical `--base` commit that does not include them.

## Canonical Sources

- `governance/compat/check_agent_operation_trace.py`
  (`get_changed_paths` lines ~141-161: unconditional `git ls-files --others
  --exclude-standard` merge; `find_trace_violations` / `_diff_manifest`
  section building the `UNAUTHORIZED_ADDITION` / `MISSING_DELIVERABLE`
  comparison against a single trace artifact's own manifest)
- `docs/reference/CVF_AGENT_OPERATION_TRACE_AND_WORKSPACE_INTEGRITY_STANDARD_2026-06-13.md`
  (trace and workspace integrity standard this checker implements)
- `docs/reviews/CVF_MSEA_R40_T1_MINERU_SYSTEM_CHAIN_PROVIDER_LIVE_PROOF_WORKER_RETURN_2026-07-06.md`
  (untracked worker-return artifact that triggered this defect during
  MSEA-R40-T1 session-sync)

## Remediation

Session-sync stewards should stash-with-untracked (`git stash push -u`) any
untracked worker-return or work-order trace artifacts before committing
unrelated continuity work, then restore them immediately after, verifying
`git status --short` matches pre-stash state exactly. Reviewers preparing to
run `run_agent_autorun_workflow_gate.py --phase pre-implementation` over a
range that includes an untracked worker-return file should expect this
gate to fail for reasons unrelated to the worker's own scope, and should not
interpret the resulting `UNAUTHORIZED_ADDITION` violations as a defect in
the session-sync or worker work itself.

A future authorized checker change should scope the untracked-file merge in
`get_changed_paths()` so it does not attribute unrelated repository churn to
an unrelated trace artifact's manifest. That change is out of scope for this
entry and for the session-sync tranche that discovered it.

## Agent Operation Trace Block

| Field | Evidence |
|---|---|
| Actor | Claude session-sync steward |
| Provider or surface | local workspace |
| Session or invocation | MSEA-R40-T1 session-sync after dispatch commit `c80bcd7b1`, 2026-07-06 |
| Working directory | repository root |
| Command or tool surface | `git status`; `git stash push -u`; `git commit`; `git stash pop`; `python governance/compat/check_agent_operation_trace.py`; `python governance/compat/run_worker_return_fast_gate.py`; `python governance/compat/run_agent_autorun_workflow_gate.py` |
| Target paths | this entry file; entries README |
| Allowed scope source | operator-selected remediation option (log ADIF entry, then stash/commit/restore) after operator asked for an audit and recommendation |
| Before status evidence | `check_agent_operation_trace.py --base c80bcd7b1 --head HEAD` reported 9 violations naming unrelated session-sync files as `UNAUTHORIZED_ADDITION` against the untracked worker-return file's own manifest |
| After status evidence | this entry records the reusable pattern; the underlying checker is not modified by this entry |
| Diff evidence | `git diff --name-status` before material commit |
| Approval boundary | defect-record only; no checker implementation change, no worker-return acceptance, no reviewer closure of MSEA-R40-T1 |
| Claim boundary | defect-record only; no runtime/provider/live behavior, no public-sync, no production claim |
| Agent type | session-sync steward |
| Invocation ID | `msea-r40-t1-session-sync-adif-0025-2026-07-06` |
| Expected manifest | this entry; entries README |
| Actual changed set | this entry; entries README |
| Manifest delta | MATCH |

## Public Export Disposition

DEFERRED_PRIVATE_ONLY

Reason: private provenance ADIF entry recording a governance checker gap. No
public-sync claim.

## Claim Boundary

This entry records a checker range-scoping defect pattern observed during
MSEA-R40-T1 session-sync. It does not modify
`check_agent_operation_trace.py`, does not authorize a checker-behavior
change, does not close or accept MSEA-R40-T1, and does not assert
runtime/provider/live, public-sync, MCP/CLI adapter, package lifecycle,
action authority, automatic invocation, document-truth, extraction-accuracy,
or production behavior.

## Epistemic Process Block

- Epistemic Process Applicability: BOUNDED_GOVERNANCE_IMPLEMENTATION
- Expected result / prediction: re-running `check_agent_operation_trace.py`
  over `--base c80bcd7b1 --head HEAD` while the R40-T1 worker-return file
  remains untracked would reproduce the same unrelated-file violation set
  observed at the session-sync commit.
- Evidence Comparison: expected result matched observed command evidence
  (9 violations naming session-sync files, unchanged pattern before and
  after the session-sync commit).
- Contradiction or gap disposition: no contradiction observed; the gap is
  confirmed structural, not a one-off sequencing artifact.
- Claim update: this checker will block the reviewer's own pre-implementation
  gate run for MSEA-R40-T1 closure unless the worker-return file is stashed
  or otherwise removed from the working tree for that specific check.
