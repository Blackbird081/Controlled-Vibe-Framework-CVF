# CVF Agent Autorun Workflow Control Standard

Memory class: POINTER_RECORD

Status: canonical mandatory autorun workflow control standard for agent-led
execution.

EPISTEMIC_PROCESS_NA_WITH_REASON: control-contract reference standard restored from archive to its active path without semantic change; it defines workflow rules and makes no source-backed evidence comparison claim.

## Purpose

This standard converts CVF work-order rules into an autorun workflow that can
control autonomous agents without non-coder intervention.

It exists because a non-coder cannot safely inspect every roadmap, work order,
source claim, diff, checklist, and closure packet. CVF must therefore stop an
agent before work begins or before closure is claimed when the evidence chain is
not machine-checkable.

## Scope

This standard applies to every new or resumed CVF agent that drafts,
dispatches, implements, reviews, closes, commits, pushes, or public-syncs
governed work after 2026-05-28.

It applies to documentation-only waves, runtime/code implementation, public
catalog work, live-proof work, connector waves, roadmaps, work orders,
completion reviews, active handoffs, and delegated multi-agent execution.

Trivial direct answers that do not create, modify, dispatch, close, commit, or
push governed artifacts are out of scope.

## Owner Surface / Source Lineage

Owner surface: CVF orchestration, agent delegation, and governance gate layer.

Canonical sources:

- `AGENTS.md`
- `CVF_SESSION_MEMORY.md`
- `CVF_SESSION/ACTIVE_SESSION_STATE.json`
- `docs/reference/CVF_AGENT_EXECUTION_WORKFLOW_SOP_2026-05-19.md`
- `docs/reference/CVF_AGENT_WORK_ORDER_TEMPLATE_2026-05-19.md`
- `docs/reference/CVF_AGENT_ERROR_TO_GOVERNANCE_LEARNING_PHILOSOPHY_2026-05-28.md`
- `docs/reference/CVF_WORK_ORDER_CLOSURE_QUALITY_GATE_STANDARD_2026-05-28.md`
- `docs/reference/CVF_PUBLIC_EXPORT_DISPOSITION_STANDARD_2026-05-30.md`
- `docs/reference/CVF_MARKDOWN_STRUCTURAL_COMPLETENESS_STANDARD.md`
- `governance/compat/check_work_order_dispatch_quality.py`
- `governance/compat/check_public_export_disposition.py`
- `governance/compat/check_markdown_structural_completeness.py`
- `governance/compat/check_docs_governance_compat.py`
- `governance/compat/check_active_session_state.py`
- `governance/compat/check_governed_file_size.py`
- `governance/compat/check_corpus_completeness_report_integrity.py`

## Protocol / Contract / Requirements

The autorun workflow has four blocking gates:

1. `pre-dispatch`: before a work order, roadmap, or Fast Lane audit may be
   marked ready, dispatched, or equivalent.
2. `pre-implementation`: after dispatch evidence exists and before file edits
   outside the dispatch packet begin.
3. `pre-closure`: before any artifact may claim `CLOSED`, `CLOSED_PASS`,
   `CLOSED_PASS_BOUNDED`, or equivalent.
4. `pre-push`: before any public or provenance repository push.

An agent must not continue to the next phase when the current phase fails.
Operator silence is not a waiver. A waiver must name the failed gate, reason,
scope, and follow-up owner.

### Mandatory Gate-Failure Remediation Protocol

A dispatched work order is execution authority inside its Allowed scope. When a
machine gate fails on an allowed file, allowed artifact, closure checklist,
source-verification row, disposition row, stale status token, missing
`N/A with reason`, or continuity field owned by the work order, remediation is
mandatory. The agent must repair the defect, rerun the failed gate, and record
the result. It must not ask the operator whether to fix the failure as a matter
of preference.

Operator escalation is allowed only when remediation would exceed Allowed
scope, change the claim boundary, release a `HOLD_*` prerequisite, alter the
risk ceiling, open public-sync, run live/provider proof, consume operator
secrets or paid quota, touch forbidden paths, or require a destructive or
irreversible operation.

If an agent asks the operator whether to repair an allowed-scope machine-gate
failure, that is a governance/control-plane defect. It must be treated as a
finding-to-governance learning signal: the rule, guard, phase placement, or
work-order wording failed to protect the non-coder operator.

Agent defects discovered during autorun are governance learning inputs. A
repeated defect must not close as worker blame alone. It must be evaluated for
promotion from finding to rule, from rule to machine check, or from late machine
check to earlier phase gate.

Every governed batch must capture a base HEAD anchor before work starts:

```powershell
git rev-parse --short HEAD
```

The captured value is the batch `baseHead`. Roadmaps, work orders, completion
reviews, and handoff notes must not cite an older base than the actual current
HEAD unless the artifact explicitly explains a rebase/merge and records the new
anchor. If the artifact base and actual HEAD disagree, implementation is
blocked until the orchestrator re-anchors the packet.

## Inputs And Outputs

Inputs:

- operator instruction or active session decision;
- roadmap or review finding;
- GC-018 baseline when required;
- work order;
- source files and canonical contracts;
- generated artifacts;
- git diff/status evidence;
- live proof receipts when claims require live governance proof.

Outputs:

- pass/fail autorun gate result;
- blocker report when any gate fails;
- corrected work order or returned orchestrator action;
- completion packet only after closure gates pass;
- commit and push evidence only after local gates pass.

## Role Workflow

### Orchestrator

The Orchestrator authors or receives the roadmap/work order and must run
`pre-dispatch` before assigning implementation.

If `pre-dispatch` fails, the Orchestrator fixes the source verification,
traceability, structure, prerequisite, or status defect before any worker acts.
For defects inside the dispatch packet's owned files, this is mandatory
remediation, not an operator preference checkpoint.

### Worker

The Worker runs `pre-implementation` after accepting the work order and before
material edits.

If `pre-implementation` fails, the Worker stops and returns the defect to the
Orchestrator. The Worker must not "fix while implementing" unless the fix is
itself the assigned task.
If the assigned task is to remediate the work order or gate failure, the Worker
must repair allowed-scope failures and rerun the gate instead of asking whether
the operator wants the routine repair.

### Reviewer

The Reviewer runs `pre-closure` before accepting any closed status.

If `pre-closure` fails, the Reviewer must mark the work `BLOCKED` or return it
for correction. The Reviewer must not rely on a completion review's handwritten
`PASS` when machine gates disagree.
When the failed item is an allowed-scope cleanup such as a missing disposition,
stale closure residue, source-symbol correction, or explicit `N/A with reason`,
the reviewer/closer must correct it and rerun the gate; asking the operator
whether to perform that repair is a closure-quality defect.

### Release / Public-Sync Agent

The release or public-sync agent runs `pre-push` after commit evidence exists
and before pushing. Public-facing work must still switch to the public-sync
clone after `git remote -v` proves the target repository.

## Standard Workflow

### Step 1 - Pre-Dispatch Gate

Required command:

```powershell
python governance/compat/run_agent_autorun_workflow_gate.py --phase pre-dispatch --base <baseHead> --head HEAD
```

The gate must include source verification schema, roadmap trace matrix,
structural completeness, docs governance naming, active session state, and file
size maintainability checks.

For bounded corpus and corpus-derived knowledge-map work, the gate must also
run GC-047 corpus completeness and GC-048 corpus-to-knowledge-map
reconciliation checks before dispatch, implementation, closure, and push.

Dispatch is blocked when:

- the work order uses non-canonical Source Verification columns;
- runtime/source facts are guessed, stale, wildcarded, or source-less;
- a source invariant claim is stronger than the cited source proves;
- roadmap-derived work lacks a trace matrix;
- prerequisites are conditional or pending;
- checkboxes needed for ready/dispatch remain open;
- a connector wave lacks fresh GC-018 baseline evidence.
- a bounded corpus task lacks its corpus manifest, terminal processing ledger,
  reconciliation evidence, or an honest non-complete verdict.
- a corpus-derived knowledge map lacks source-authority separation,
  semantic-region reconciliation, drift truth, or an honest bounded verdict.

### Step 2 - Pre-Implementation Gate

Required command:

```powershell
python governance/compat/run_agent_autorun_workflow_gate.py --phase pre-implementation --base <baseHead> --head HEAD
```

The Worker confirms that dispatch artifacts pass the same checks immediately
before editing. This prevents an agent from implementing from an obsolete or
partially corrected work order.

Implementation is blocked when:

- the current work order would fail `pre-dispatch`;
- required first reads or startup state are stale;
- the worktree contains unresolved prior-governance blockers that would make
  evidence ambiguous;
- the intended edit would touch forbidden paths or exceed the risk ceiling.

### Step 3 - Pre-Closure Gate

Required command:

```powershell
python governance/compat/run_agent_autorun_workflow_gate.py --phase pre-closure --base <baseHead> --head HEAD
```

Closure is blocked when:

- any dispatch, structural, docs governance, session-state, or file-size gate
  fails;
- the state registry contains a newer closed LHW wave than the front door,
  `nextAllowedMove`, or active handoff acknowledge;
- the closure command uses an empty `--base HEAD --head HEAD` range for work
  that changed governed artifacts;
- the committed diff range has no files for a closed-equivalent claim;
- `git status --short` contains untracked or modified files without an explicit
  committed-diff evidence path;
- roadmap/work-order/completion statuses disagree;
- roadmap or work-order acceptance checkboxes remain open without `N/A with
  reason` or `BLOCKED`;
- any closed-equivalent work order, roadmap, Fast Lane audit, completion, or
  connector spec still contains `| OPEN |` table rows or unchecked `- [ ]`
  checklist items;
- any closed-equivalent work order still contains checklist rows marked
  `HOLD`, `PENDING`, or `READY_FOR_DISPATCH`, or stale prose saying the order is
  still on hold or not ready for worker execution;
- the changed range contains runtime/source files while the governing or cited
  work order is still `HOLD_*`, `DRAFT`, or `PROPOSED`;
- any closed baseline, roadmap, completion review, or connector spec cites a
  work order that is not closed or still contains unresolved closure residue;
- a closed roadmap still carries stale dispatch residue such as
  `WORK_ORDER_READY`, `READY_FOR_IMPLEMENTATION`, or `HOLD until`;
- a Fast Lane audit status remains `ACTIVE`, `DRAFT`, or `HOLD` while its
  decision/disposition says pass, approve, or accept;
- completion review claims `PASS` for evidence that was not produced by a
  command, path, receipt, or committed diff;
- a completion review claims no runtime/code/public/live-proof impact without
  `git diff --name-status`, `git status --short`, committed diff output, or
  explicit `N/A with reason`.
- a single-work-order closure changed files outside that work order's Allowed
  scope, including unrelated archive cleanup or governance maintenance;
- a closed LHW connector roadmap is checked with a final-tranche-only range
  instead of the full wave range containing T1, T2, and T3 artifacts;
- a connector spec records a line-count threshold or actual line count that no
  longer matches the current file;
- a Source Verification `Verified path or symbol` cell contains a value
  assignment or type annotation such as `rawMemoryReleased: false` or
  `canReinject: boolean`.
- a Source Verification `ACCEPT` row cites a code symbol that does not exist in
  the cited code source or, for dotted symbols, does not exist under the cited
  owner/interface/class;
- a roadmap or work order makes absent/not-implemented/hardcoded runtime claims
  without Current Runtime Freshness Verification against current source;
- an artifact claims complete ACCEPT_AS_OWNER_MAP coverage without a disposition
  for every accepted concept in the cited source audit;
- a closed roadmap, final wave completion packet, or public catalog claim lacks
  a `Public Export Disposition` of `EXPORTED`, `DEFERRED_PRIVATE_ONLY`, or
  `BLOCKED_MISSING_PUBLIC_ARTIFACTS`;
- an artifact claims public export without public-sync remote, commit, and
  artifact path evidence.
- a bounded corpus output claims completeness while any source item remains
  unresolved, excluded without reason, unreadable without disposition, or
  unreconciled against the enumerated corpus.

The closure packet must say which autorun phase was run and include the command
result, including the base/head range. If `pre-closure` fails, the artifact
status must be `BLOCKED`, `HOLD_*`, `DRAFT`, or equivalent, not
`CLOSED_PASS_BOUNDED`.

After the closure commit, the worker must run:

```powershell
python governance/compat/check_active_session_state.py --enforce
```

If the active handoff does not contain the new HEAD or the parent HEAD for a
handoff-sync commit, closure is incomplete.

### Step 4 - Pre-Push Gate

Required command:

```powershell
python governance/compat/run_agent_autorun_workflow_gate.py --phase pre-push --base <baseHead> --head HEAD
```

The gate must run the local pre-push governance hook chain and require repository
remote verification before any push. Public-facing changes must be pushed only
from the public-sync clone.

## Enforcement / Verification

The canonical wrapper is:

```powershell
python governance/compat/run_agent_autorun_workflow_gate.py --phase <phase>
```

The wrapper intentionally reuses existing guards instead of replacing them.
This keeps the gate explainable: every failure points to the underlying guard
that rejected the artifact.

Minimum included guards:

- `check_docs_governance_compat.py --base <baseHead> --head HEAD --enforce`
- `check_markdown_structural_completeness.py --base <baseHead> --head HEAD --enforce`
- `check_work_order_dispatch_quality.py --base <baseHead> --head HEAD --enforce`
- `check_public_export_disposition.py --base <baseHead> --head HEAD --enforce`
- `check_active_session_state.py --enforce`
- `check_governed_file_size.py --enforce`

The active-session guard must verify latest-closure continuity: when
`ACTIVE_SESSION_STATE.json` contains `lhwN...CLOSED_PASS_BOUNDED`, the compact
front door `Next Allowed Move`, the state `nextAllowedMove`, and the active
handoff must reference the highest closed `LHWN`. A lower-wave stale pointer is
a closure defect even when the roadmap and work-order artifacts themselves pass.

`pre-push` must also run:

- `run_local_governance_hook_chain.py --hook pre-push`

## Boundaries / Non-Goals

This standard does not:

- prove every external agent automatically loads these rules;
- replace human or operator authority for waivers;
- replace live governance proof when claims require live provider behavior;
- authorize runtime behavior changes;
- make documentation-only connector specs runtime-enforced;
- remove the need for independent review when a gate reports a blocker.

## Failure Modes / Escalation Conditions

| Failure mode | Required action |
|---|---|
| Artifact base HEAD differs from actual current HEAD | Re-anchor the roadmap/work order before implementation. |
| Empty closure range | Re-run with the captured base HEAD and do not claim closure from `HEAD..HEAD`. |
| Source invariant claim exceeds source proof | Downgrade the claim to doc-only normalization or cite a literal source invariant. |
| Latest LHW closure is missing from front door, `nextAllowedMove`, or active handoff | Sync continuity surfaces before claiming or accepting closure. |
| Closed artifact contains `| OPEN |` or unchecked `- [ ]` residue | Finalize the work-order/roadmap/review checklist or downgrade status to `HOLD_*`/`BLOCKED`. |
| Closed work order contains `HOLD`, `PENDING`, or dispatch-blocking prose | Convert the item to `PASS`, `N/A with reason`, or downgrade the work order out of closed status. |
| Runtime/source files changed while cited work order is still `HOLD_*` | Release/update the work order through the required authority chain before implementation, or revert/split the runtime change. |
| Closed roadmap still says `WORK_ORDER_READY` or `HOLD until` | Replace dispatch planning text with final per-tranche closure status. |
| Fast Lane audit status conflicts with pass/approve disposition | Align the status with the final disposition before closure. |
| Single-work-order diff includes files outside Allowed scope | Split unrelated cleanup into a separate governed batch or return to Orchestrator. |
| LHW wave closure uses only the final tranche range | Re-run pre-closure from the pre-wave or first-tranche base so T1/T2/T3 are checked together. |
| Source Verification symbol cell includes value or type syntax | Move the value/type evidence to the claimed item/source proof and leave only the bare field/path/symbol. |
| Source Verification `ACCEPT` cites a missing code symbol | Correct the source path/symbol or change the disposition to `REJECT` / `BLOCKED_SOURCE_NOT_FOUND`. |
| Line-count claim is stale or handwritten | Recompute from the current file or remove the claim. |
| Public export disposition is missing or overclaims public-sync export | Add the disposition, cite public-sync evidence, or downgrade to `DEFERRED_PRIVATE_ONLY` / `BLOCKED_MISSING_PUBLIC_ARTIFACTS`. |
| Machine gate fails inside Allowed scope | Repair the allowed-scope defect and rerun the gate; do not ask the operator whether routine remediation should happen. |
| Agent asks operator whether to fix an allowed-scope gate failure | Record a governance/control-plane learning signal and tighten the relevant work-order wording or guard. |
| `pre-dispatch` fails | Keep artifact in `DRAFT`, `HOLD_*`, or `BLOCKED`; return to Orchestrator. |
| `pre-implementation` fails | Stop edits; return the blocker to Orchestrator or Reviewer. |
| `pre-closure` fails | Do not mark closed; file a blocking finding or correction batch. |
| `pre-push` fails | Do not push; classify the failing hook and fix or downgrade the claim. |
| Agent cannot run the wrapper | Run the underlying guard commands individually and record why the wrapper was unavailable. |
| Operator requests immediate continuation despite failure | Require an explicit waiver naming failed gate, risk, and follow-up owner. |

## Related Artifacts

- `AGENTS.md`
- `docs/reference/CVF_AGENT_EXECUTION_WORKFLOW_SOP_2026-05-19.md`
- `docs/reference/CVF_AGENT_WORK_ORDER_TEMPLATE_2026-05-19.md`
- `docs/reference/CVF_WORK_ORDER_CLOSURE_QUALITY_GATE_STANDARD_2026-05-28.md`
- `docs/reference/CVF_PUBLIC_EXPORT_DISPOSITION_STANDARD_2026-05-30.md`
- `governance/compat/run_agent_autorun_workflow_gate.py`

## Claim Boundary

This standard defines the mandatory autorun control workflow. It is a control
contract and local machine gate entrypoint, not proof that every external client
enforces it automatically. A scope is trustworthy only when its phase gate
outputs, artifacts, diffs, and continuity state agree.
