# CVF Work Order Closure Quality Gate Standard

Memory class: POINTER_RECORD

Status: canonical mandatory closure-quality standard for agent work orders.

## Purpose

This standard prevents agents from closing work orders with incomplete
roadmap traceability, stale continuity state, inaccurate file-change claims, or
unchecked acceptance residue.

It exists because CVF relies on agents to divide roles, implement, review, and
close work without continuous operator intervention. Dispatch and closure must
therefore be explicit enough that another agent can verify the result from
files and commands rather than trust memory.

## Scope

This standard applies to every new or amended CVF work order, roadmap closure,
completion review, public-sync batch, and delegated agent execution after
2026-05-28.

It is mandatory for documentation-only work, runtime/code work, public-facing
work, live-proof work, and multi-agent transfer work. Higher-risk work may add
stricter gates, but it may not omit this standard.

Archive-qualified artifacts under `archive/` are excluded from active
dispatch/closure validation. Archiving preserves historical evidence; it is not
a new active ready/dispatch/closure claim. If archived evidence is promoted
back to an active path or cited as current closure evidence, the active artifact
must satisfy this gate.

## Rule

No agent may mark a work order or roadmap task `CLOSED`, `CLOSED_PASS`,
`CLOSED_PASS_BOUNDED`, or equivalent unless the closure packet records and
passes the following gates:

1. Roadmap-to-work-order trace matrix.
2. Closure diff gate.
3. Claim integrity scan.
4. Negative/fail-condition scan.
5. Checklist finalization gate.
6. Continuity sync gate.
7. Agent autorun `pre-closure` gate.
8. Allowed-scope diff gate.
9. Whole-wave closure range gate when closing multi-tranche connector waves.
10. Machine-verified line-count claim gate.
11. Public export disposition gate.
12. Mandatory Gate-Failure Remediation Protocol.
13. Corpus completeness and report integrity gate when the task reads,
    inventories, extracts, compares, summarizes, audits, migrates, or absorbs a
    bounded set of files or folders.
14. Worker Autonomy / No-Question Rule for delegated worker packets.
15. Self-Reported Gate Evidence Consistency for any artifact that records
    governance gate results.
16. Work-Order Fulfillment Manifest for delegated runtime/source work.

If any gate is incomplete, the worker must return to Orchestrator or file a
blocking defect. Operator silence is not a waiver.

If the incomplete gate is caused by a defect inside the current work order's
Allowed scope, the worker must repair it and rerun the gate. Missing
disposition rows, stale `HOLD`/`PENDING` residue, source-symbol corrections,
continuity sync owned by the task, and required `N/A with reason` entries are
mandatory cleanup, not operator preference decisions.

Before implementation, the worker must capture a batch base anchor with
`git rev-parse --short HEAD`. Closure gates must use that `baseHead` so the
review checks the actual changed range. Empty closure ranges such as
`--base HEAD --head HEAD` are invalid for any batch that creates or modifies
governed artifacts.

## Requirements

### 1. Roadmap-To-Work-Order Trace Matrix

Every work order derived from a roadmap must include a table before execution:

| Roadmap requirement | Work order section | Output artifact or field | Verification command or check | Status |
|---|---|---|---|---|
| <requirement> | <section> | <path/field> | <command/check> | <PASS/BLOCKED/N/A with reason> |

Rules:

- every roadmap acceptance item must map to at least one work-order
  instruction or explicit `N/A with reason`;
- every required field named by a roadmap must appear as either a sourced
  runtime/source item or a declared new doc-only field;
- a missing row blocks dispatch;
- `PASS` may be recorded only after the final artifact exists and is checked.

### 2. Closure Diff Gate

Before closure, the worker must compare:

- roadmap requirements;
- work-order requirements;
- final artifact content;
- completion review claims.

The completion packet must state whether any requirement was lost, renamed, or
weakened between roadmap, work order, implementation, and review.

The changed-file set must also be compared against the work order's Allowed
scope. A worker may not bundle unrelated archive cleanup, baseline movement,
governance maintenance, or opportunistic refactors into a tranche unless those
paths are explicitly owned by the current work order. Out-of-scope cleanup must
use a separate work order or a separate operator-authorized batch.

### 3. Claim Integrity Scan

Every claim about changed files, untouched files, public status, runtime/code
impact, live proof, provider behavior, receipt envelope behavior, hosted
readiness, production readiness, or operator acceptance must be backed by a
command, file path, receipt, or explicit `N/A with reason`.

Closed roadmaps, final wave completion packets, and public catalog claims must
include `## Public Export Disposition` with exactly one of `EXPORTED`,
`DEFERRED_PRIVATE_ONLY`, or `BLOCKED_MISSING_PUBLIC_ARTIFACTS`. `EXPORTED`
requires public-sync remote, commit, and artifact path evidence. A private
provenance closure is not a public catalog update unless the public-sync clone
contains the matching artifacts and catalog change.

File-change claims must be based on `git diff --name-status`, `git status
--short`, or committed diff output. Memory-based file-change claims are not
valid closure evidence.

Any bounded corpus output must include `## Corpus Completeness And Report
Integrity`, an enumerated manifest count, a terminal processing-ledger count,
explicit exclusions and unreadable counts, reconciliation evidence, and one
machine-checked verdict from
`docs/reference/CVF_CORPUS_COMPLETENESS_AND_REPORT_INTEGRITY_STANDARD_2026-06-01.md`.
An agent may not claim `COMPLETE_VERIFIED` while any item remains unresolved or
excluded.

Any corpus-derived knowledge map, semantic-region ledger, architecture
reconciliation, Memory synthesis, graphification plan, or retrieval-readiness
claim must include `## Knowledge System Reconciliation`. Closure must reject
unsafe enumeration, authority/derived-view confusion, arithmetic mismatch,
hidden orphan state, stale drift state, and overbroad retrieval claims.

Line-count claims must be command-backed or machine-verifiable. A connector
spec, completion review, or audit must not claim "actual: N lines" or
"spec < N lines" from memory when the current file exceeds that threshold.

### 4. Negative And Fail-Condition Scan

Work orders must include explicit fail conditions when missing fields,
ambiguous thresholds, stale source facts, public/provenance boundary errors, or
forbidden runtime claims would invalidate the task.

At closure, the worker must confirm each fail condition is absent or mark the
work `BLOCKED`.

Source invariant claims are fail conditions unless source-backed. If a cited
source exposes a field as `boolean` or as an interface property, the worker may
not claim "`field=false` is preserved from source" unless a cited line declares
or assigns the field as literal `false`, or a cited runtime branch proves that
specific connector path.

Status-token ambiguity is a fail condition. `HOLD_*`, `DRAFT`, or `PROPOSED`
statuses must not contain the token `CLOSED`; use prerequisite wording such as
`HOLD_UNTIL_T1_PASS` or `HOLD_UNTIL_T1_SATISFIED` instead.

Source Verification symbol ambiguity is a fail condition. The `Verified path or
symbol` cell must contain only a field, path, or symbol name. Put values in the
claimed item or value-set evidence, not in the symbol cell: use
`rawMemoryReleased`, not `rawMemoryReleased: false`. Do not put type
annotations in that cell: use `canReinject`, not `canReinject: boolean`.

Current Runtime Freshness Verification is required when a roadmap or work order
claims a runtime/source capability is absent, not implemented, hardcoded,
per-role only, or otherwise stale. The author must search current source and
record the relevant current owner paths before marking the packet ready.

ACCEPT_AS_OWNER_MAP coverage claims are fail conditions unless every accepted
concept from the cited absorption audit is represented in a wave/tranche, or is
explicitly listed with a completed, deferred, rejected, or out-of-scope
disposition.

### 4A. Mandatory Gate-Failure Remediation Protocol

Work-order authority includes routine remediation of failed machine gates inside
the allowed changed files. A worker must not turn an allowed-scope gate failure
into a question for the operator. The correct behavior is:

1. identify the failed guard and owned file;
2. repair the missing field, stale status, source mismatch, checklist residue,
   or `N/A with reason` entry;
3. rerun the failed guard or autorun phase;
4. record the command and result in the closure evidence.

Escalate to the operator only when the repair would exceed Allowed scope,
change the claim boundary, release a `HOLD_*` prerequisite, alter risk level,
start public-sync, run live/provider proof, consume secrets or paid quota,
touch forbidden paths, or perform destructive/irreversible actions.

Any artifact that records "should I fix", "operator checkpoint pending", or
equivalent preference language for an allowed-scope guard failure is not closed.
It is a governance/control-plane learning signal, not a valid blocker placed on
the non-coder operator.

### 4B. Worker Autonomy / No-Question Rule

Ready or dispatched work orders must tell the worker not to ask for operator
confirmation before non-destructive work inside Allowed scope.

The work order must authorize autonomous execution of:

- source reads named by the work order;
- `git status`, `git diff`, `git rev-parse`, manifest/hash checks, and
  documented governance gates;
- documentation-format remediation inside Allowed scope;
- missing required evidence blocks inside Allowed scope;
- rerunning failed gates after allowed-scope remediation.

Escalation remains mandatory for scope expansion, claim-boundary changes,
`HOLD_*` release, live/provider proof, public-sync, secrets/quota, forbidden
paths, destructive action, risk changes, or runtime/source edits outside
ownership.

### 4C. Work-Order Fulfillment Manifest

Any delegated work order that creates or modifies runtime/source files must
include machine-readable handoff manifests before dispatch:

- `## Required Artifact Manifest` names every source, test, review, or package
  artifact that must exist before worker handoff.
- `## Forbidden Path Manifest` names forbidden files, directories, or glob
  patterns that must not appear in the changed implementation range unless
  explicitly listed in `## Pre-Existing Dirty Path Exemptions`.
- `## Required Proof Manifest` names required proof files and literals, such
  as raw-leak sentinel tests or invariant assertions.

The compatibility gate must fail an implementation handoff when runtime/source
activity exists and a required handoff artifact is missing, a forbidden path is
touched outside a declared pre-existing dirty-path exemption, or a required
proof literal is absent from the named proof file.

Pre-existing dirty-path exemptions are narrow provenance hygiene exceptions,
not ownership transfer. The worker must not edit, stage, claim, or close those
paths unless a separate work order owns them.

### 4D. Pending Artifact Evidence Finality

A changed, staged, or untracked governed artifact must not claim the worktree is
clean while that same artifact is still pending. If the artifact records
`git status --short`, the recorded output must match the pending state or the
artifact must state that clean-status evidence is post-commit and command-backed.

A pending artifact must not cite `--base HEAD~1 --head HEAD` or another
committed-only range as proof for the pending artifact itself. The worker must
either:

- run working-tree-aware guard checks that include uncommitted/staged files and
  label them as pending-artifact validation; or
- commit the artifact, then rerun the real changed range and record that
  committed evidence.

Machine enforcement rejects pending artifacts that self-report
`git status --short` as clean or cite a committed range that cannot include the
pending artifact.

#### Commit Mode And Base-Anchor Lifecycle

Dispatch provenance, worker validation, and committed closure use distinct
anchors:

| Anchor | Purpose |
| --- | --- |
| `dispatchBaseHead` | audit anchor captured by orchestrator before dispatch |
| `executionBaseHead` | worker anchor captured before material edits and used for pending-artifact component gates |
| `closureBaseHead` | reviewer / committer anchor used for the non-empty committed closure range |

A later worker must not blindly reuse an earlier hardcoded dispatch hash after
intervening commits. The worker records the current `executionBaseHead`.
Committed closure then proves the approved tranche with
`closureBaseHead..HEAD`.

#### Two-Stage No-Commit Worker Handoff

Every delegated work order must state one commit mode:

- `WORKER_MAY_COMMIT`
- `WORKER_MUST_NOT_COMMIT`

For `WORKER_MUST_NOT_COMMIT`, the worker is required to:

1. run and repair working-tree-aware component gates;
2. record actual pending paths from `git status --short`;
3. return a non-closed status such as `COMPLETE_PENDING_REVIEW`;
4. leave committed-range `pre-closure` to the reviewer / committer.

The worker may record `PRE_CLOSURE_NOT_RUN_PENDING_COMMIT` or
`FAIL_EXPECTED_PENDING_FINALITY`. Neither value is a PASS and neither authorizes
a closed-equivalent status.

After review disposition, the reviewer / committer must commit the approved
owned diff and run autorun `pre-closure` against a non-empty committed range.

### 4E. Self-Reported Gate Evidence Consistency

If an artifact records a governance gate, autorun phase, corpus check, or
dispatch-quality result, the recorded result must be current for the artifact
state being handed off.

A non-blocked artifact must not record a failed required gate and then ask the
reviewer or operator to decide, rerun, or pick it up. The worker must either:

- repair the allowed-scope failure and rerun the gate before handoff; or
- mark the artifact `BLOCKED` or `HOLD_*` with a return action when the repair
  exceeds Allowed scope.

Stale gate evidence is a closure/dispatch defect. If a worker reruns a gate and
the result changes, the artifact must update the Governance Gates Run section
before returning it for review.

Self-reported `PASS` evidence is also stale if the artifact is missing a
section that the recorded autorun phase requires. For example, a finding-bearing
review must include `## Finding-To-Governance Learning Disposition` before it
may record autorun `pre-dispatch` as `PASS`.

If a pending artifact records `git status --short`, it must include its own
pending path in that status evidence. Omitting the artifact itself while
claiming pending validation is a finality defect.

### 4F. Near-Threshold Owner Maintainability Plan

Avoiding a near-threshold active owner file is not maintainability remediation.
When a ready or dispatched work order adds or modifies source inside a
registered owner domain while the active owner entrypoint is within the GC-023
near-hard margin, the work order must:

- include `## Near-Threshold Owner Maintainability Plan`;
- include the active owner entrypoint in Allowed scope and Write Ownership;
- name the split, extract, rotate, or archive action;
- record `Minimum shrink target: 50 lines`;
- prove the owner entrypoint was meaningfully reduced or split before closure.

A work order must not classify the near-threshold owner entrypoint as
forbidden-touch merely to place adjacent logic in new files. Adjacent modules
are healthy only when the active owner surface is also reduced to a reviewable
role.

Machine enforcement uses:

`governance/compat/CVF_GOVERNED_FILE_SIZE_EXCEPTION_REGISTRY.json`

`governance/compat/check_governed_file_size.py`

`governance/compat/check_work_order_dispatch_quality.py`

### 5. Checklist Finalization Gate

Closure checklists are evidence controls, not decoration. Any unchecked item in
a work order, roadmap, completion packet, or public-sync checklist must be one
of:

- checked after evidence exists;
- marked `N/A` with reason;
- marked `BLOCKED` with return-to-orchestrator action.

Open checkbox residue is a closure defect.

Machine enforcement must reject closed-equivalent artifacts that still contain
open closure residue. A file with `Status: CLOSED*`, `CLOSED_PASS*`, or
equivalent must not contain `| OPEN |` table rows or unchecked `- [ ]`
checklist items, and must not retain closure checklist rows marked `HOLD`,
`PENDING`, or `READY_FOR_DISPATCH`. Work-order authors must either mark each
item checked, replace it with `N/A with reason`, or leave the artifact in
`HOLD_*`, `DRAFT`, or `BLOCKED`.

A closed work order must not retain stale dispatch-blocking prose such as
"remains on HOLD", "while on HOLD", "not ready for worker execution", or "not
dispatchable". Closed baselines, roadmaps, completion reviews, and connector
specs that cite a work order must cite a closed work order whose own closure
checklist has no unresolved residue.

Runtime/source edits require a released work order. If the changed range
contains implementation files and a cited or governing work order remains
`HOLD_*`, `DRAFT`, or `PROPOSED`, the range is not dispatchable or closable.
The agent must release/update the work order through the authority chain before
implementation, or split/revert the runtime change.

### 6. Continuity Sync Gate

If the task changes current mode, handoff status, roadmap status, public-sync
status, or next allowed move, the worker must update the active session
front door, machine-readable state registry, and active handoff as applicable.

The worker must not leave a newer registry and stale front-door or handoff
claim in conflict.

For connector waves, latest-closure continuity is mandatory. If
`ACTIVE_SESSION_STATE.json` contains a higher closed `lhwN...` record, then the
state `nextAllowedMove`, the `CVF_SESSION_MEMORY.md` `Next Allowed Move`
section, and the active handoff must reference that latest closed `LHWN`.
Leaving `LHW6` or `LHW8` text after closing `LHW9` is a closure defect even if
the connector specs and completion reviews pass.

Latest-closure detection must also consider closed GC-018 LHW baselines on disk;
omitting the latest closed wave from `ACTIVE_SESSION_STATE.json` is not a valid
way to bypass continuity sync.

### 7. Agent Autorun Pre-Closure Gate

Before any closed-equivalent status claim, run:

```powershell
python governance/compat/run_agent_autorun_workflow_gate.py --phase pre-closure --base <baseHead> --head HEAD
```

The completion packet must record the command, range, and result. If the
command fails, the artifact must remain `DRAFT`, `HOLD_*`, `BLOCKED`, or
equivalent until the blocking gate is fixed or explicitly waived by the
operator.

After the closure commit, run:

```powershell
python governance/compat/check_active_session_state.py --enforce
```

If the active handoff lacks the new HEAD or the parent HEAD for an explicit
handoff-sync commit, the closure is incomplete.

Pre-closure cannot be satisfied by handwritten `PASS` tables when the machine
gate reports source-verification, structural-completeness, continuity,
file-size, worktree, or dispatch-quality violations.

For multi-tranche LHW connector waves, final roadmap closure must use a full
wave changed range from the pre-wave or first-tranche base through final HEAD.
A final-tranche-only range is not valid evidence for closing the whole wave,
because it cannot prove T1/T2/T3 artifacts, scope boundaries, and continuity
claims together.

This full-wave range requirement applies when the checked range newly closes a
connector roadmap. Post-closure governance-maintenance edits to an already
closed connector roadmap may be validated as ordinary changed governed
artifacts when the base ref already contains the closed status.

## Exceptions

There are no exceptions for delegated work-order closure.

For trivial direct answers that do not create or modify governed artifacts,
this standard does not apply. For emergency fixes, the worker may perform the
minimal fix first only when delay would cause operational harm, but the closure
quality gates must be recorded before claiming the task closed.

## Enforcement Surface

This standard is enforced by:

- work-order authors before dispatch;
- implementers before completion;
- reviewers before PASS disposition;
- active handoff/session-state sync;
- local governance hooks where structural checks apply;
- `governance/compat/check_work_order_dispatch_quality.py`, which hard-fails
  dispatch/ready work orders, connector-wave roadmaps, and fast-lane audits
  when prerequisite GC-018 baselines, source files, source-verification truth,
  roadmap trace matrices, source-invariant proof, non-empty verification
  ranges, prerequisite completion evidence, closed-artifact checklist
  finality, status-token hygiene, symbol-cell hygiene, or roadmap/Fast Lane
  status consistency are missing. It also hard-fails single-work-order changed
  ranges that touch files outside the work order's Allowed scope, LHW wave
  roadmap closures that lack full T1/T2/T3 changed-range evidence, connector
  specs with false line-count threshold claims, and Source Verification symbol
  cells containing value assignments or type annotations. It also hard-fails
  governed artifacts that record allowed-scope machine-gate remediation as an
  operator preference checkpoint, and ranges that pair runtime/source edits
  with a still-held governing work order. Ready or dispatched work orders must
  include a Worker Autonomy / No-Question Rule.
- `governance/compat/check_public_export_disposition.py`, which hard-fails
  changed active roadmap closures, final wave completion packets, and public
  catalog claims that lack a public export disposition or that claim public
  export without public-sync evidence.
- `governance/compat/run_agent_autorun_workflow_gate.py`, which bundles the
  mandatory phase gates for pre-dispatch, pre-implementation, pre-closure, and
  pre-push agent workflows.
- `governance/compat/check_active_session_state.py`, which hard-fails stale
  latest-closed-wave continuity across the front door, state registry, and
  active handoff.

Future automation may add hard checks, but manual compliance is mandatory now.

## Related Artifacts

- `AGENTS.md`
- `docs/reference/CVF_AGENT_WORK_ORDER_TEMPLATE_2026-05-19.md`
- `docs/reference/CVF_AGENT_EXECUTION_WORKFLOW_SOP_2026-05-19.md`
- `docs/reference/CVF_MARKDOWN_STRUCTURAL_COMPLETENESS_STANDARD.md`
- `docs/reference/CVF_QUALITY_ASSESSMENT_STANDARD.md`
- `docs/reference/CVF_AGENT_AUTORUN_WORKFLOW_CONTROL_STANDARD_2026-05-28.md`
- `docs/reference/CVF_WORKER_AUTONOMY_DISPATCH_PROMPT_STANDARD_2026-06-01.md`

## Final Clause

Closure is not a status label. Closure is a verified transition from authority
to artifact to evidence to continuity state. If another agent cannot reproduce
that chain from the files and commands recorded in the packet, the work is not
closed.
