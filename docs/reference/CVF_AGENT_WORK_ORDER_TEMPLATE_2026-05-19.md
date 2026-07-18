# CVF Agent Work Order Template

Memory class: POINTER_RECORD

Status: reusable template for scoped agent execution orders.

Text Encoding Exception: em dash and standard punctuation used in governance prose

## Dispatch Prompt Envelope Placement Rule

For every delegated or role-switching dispatch-ready work order, the
`## Dispatch Prompt Envelope` section must be the first `##` section in the
actual work order. It must appear before `## Purpose`, before any mission or
scope prose, and no later than line 25. Minimal metadata such as title, memory
class, status, owner, and base-head fields may appear above it.

This template describes the rule before its own purpose section so authors see
the read-first requirement before copying any other section order.

## Purpose

A CVF Agent Work Order is the tactical execution packet that an orchestrator,
reviewer, or operator gives to an implementing agent.

It sits below roadmap and governance authorization, and above raw task prompts.
It exists to prevent scope drift by making the worker's mission, authority
chain, write ownership, forbidden actions, evidence requirements, and return
conditions explicit.

Work orders are mandatory after a final roadmap when an orchestrator, reviewer,
operator, or lead agent delegates implementation to another agent or a later
session.

Work orders are governed by the operating workflow in
`docs/reference/CVF_AGENT_EXECUTION_WORKFLOW_SOP_2026-05-19.md`.

**Template family front door:**
`docs/reference/work_order_template/README.md`

## Owner / Source

Owner: CVF orchestration and delegation surface.

Source inputs may include:

- an operator instruction;
- a multi-agent decision pack;
- a roadmap;
- an active handoff;
- a root scratch prompt that needs conversion into a governed artifact.

## Scope / Target / Owner Boundary

Target: one bounded agent execution assignment or one explicitly ordered group
of assignments.

Owner boundary:

- the work order names who dispatches, who implements, who reviews, and when
  the operator must intervene;
- the work order must define owned paths, forbidden paths, and write mode;
- work outside those boundaries requires a new work order or an operator
  correction.

Architecture relationship:

- operator sets business and authority intent;
- orchestrator or CEO role translates final roadmap into one or more work
  orders;
- implementer executes only the current work order;
- reviewer evaluates evidence and blocking defects;
- auditor and governance gates verify structure, taxonomy, and proof.

## Protocol / Contract / Requirements

Protocol:

- cite the authority chain before instructions;
- file required GC-018 baselines before implementation;
- inherit GC-020, GC-023, GC-024, GC-046, GC-047, GC-048, public/provenance, and live-proof
  rules from the repository;
- make reviewer gate and waiver rules explicit.

Contract:

- the implementer follows the allowed scope and forbidden scope;
- the reviewer evaluates evidence against acceptance criteria;
- the orchestrator receives a closure packet or a stop condition.

## Enforcement / Verification

Verification requirements:

- pre-flight commands must be listed;
- autorun phase gates must be listed and passed before dispatch,
  implementation, closure, and push when applicable;
- existing paths, symbols, role values, template IDs, and policy fields must be
  source-verified before the work order is marked ready;
- work-order authors must verify source facts before dispatch, not delegate
  ambiguous source discovery to the implementer;
- roadmap-derived work orders must include a Roadmap-to-Work-Order Trace Matrix;
- acceptance criteria must be observable;
- fail conditions must be explicit when missing fields, stale source facts,
  ambiguous thresholds, public/provenance boundary errors, or forbidden runtime
  claims would invalidate the task;
- evidence must use command/result/path form where possible;
- completion must record changed files, closure diff status, checklist
  finalization, and required governance updates.
- closure diff evidence must prove the changed files stayed inside Allowed
  scope; archive cleanup, governance maintenance, or unrelated refactors require
  explicit ownership or a separate work order.
- connector wave roadmap closure must use a full-wave changed range, not only
  the final tranche range.
- ready or dispatched work orders must include a Worker Autonomy / No-Question
  Rule so routine allowed-scope remediation is not escalated to the operator.
- allowed-scope machine-gate failures must be repaired and rerun by the assigned
  agent; they must not be escalated to the operator as preference questions.
- self-reported gate evidence must be current before handoff; non-blocked
  artifacts must not record failed required gates and leave rerun/disposition
  to the reviewer or operator.
- delegated runtime/source work must include a Work-Order Fulfillment Manifest
  with required artifacts, forbidden paths, and required proof literals.
- bounded corpus tasks must include GC-047 manifest, terminal processing
  ledger, reconciliation evidence, exclusions/unreadable accounting, and an
  honest machine-checked completeness verdict.
- corpus-derived knowledge maps must include GC-048 source-authority,
  semantic-region, mapped/deferred/unmapped, drift, rebuildability, and
  retrieval-boundary evidence with an honest machine-checked verdict.
- GC-048 machine check:
  `governance/compat/check_corpus_to_knowledge_map_reconciliation.py`.
- governed tranches must follow the commit choreography standard:
  `docs/reference/CVF_TRANCHE_COMMIT_CHOREOGRAPHY_STANDARD_2026-06-03.md`.
- agent-authored text must follow the text encoding and symbol discipline
  standard:
  `docs/reference/CVF_TEXT_ENCODING_AND_SYMBOL_DISCIPLINE_STANDARD_2026-06-07.md`.
- roadmap-derived work must carry forward the roadmap design-control gate:
  scope boundary, non-goals, lane split, dependency/source-verification plan,
  claim boundary, acceptance criteria, verification evidence, and dispatch
  readiness. If the roadmap lacks these controls, the next work order must be
  source-verification, design-audit, or spec work, not implementation.

The work order is invalid for execution if it does not name stop conditions.

## Boundaries / Non-Goals

Non-goals:

- not a replacement for roadmap, GC-018, handoff, or active session state;
- not a way to broaden scope;
- not a public claim artifact;
- not a substitute for live governance proof.

## Claim Boundary

Claim boundary:

- `defined` means the artifact exists as docs/schema;
- `tested` means tests or local verification support the claim;
- `live-proven` requires the repository's live governance proof standard.

Guard/runtime claim-language discipline:

- do not use `functionally enforced`, `directly enforced`, `already enforced`,
  `runtime enforcement behavior`, or equivalent enforcement-language for a
  guard/policy unless the cited source contains named guard wiring or an
  explicit test assertion that names the guard/policy ID;
- if source behavior exists but is not named as the guard/policy, call it
  `source-visible behavior connection`, `behavior corresponding to guard
  intent`, or `implementation candidate`;
- metadata such as `cvfOwnerExists`, owner paths, registry entries, or policy
  IDs proves owner/registry presence only, not enforcement;
- completion packets must keep this distinction in Purpose, Findings,
  Decision, Claim Boundary, and Finding-To-Governance Learning Disposition.

Text encoding and symbol discipline:

- default to ASCII for agent-authored prose, comments, tests, and governed
  markdown;
- non-ASCII is allowed only under the exceptions in
  `docs/reference/CVF_TEXT_ENCODING_AND_SYMBOL_DISCIPLINE_STANDARD_2026-06-07.md`;
- if changed files retain agent-authored Unicode, the completion packet must
  record the exception and reason.

Final boundary:

- a work order is closed only when the completion packet or final report records
  evidence, changed files, reviewer disposition, and handoff sync status.

## Relationship To Other Artifacts

The work order does not authorize work by itself.

It must cite an authority chain:

- active session state or operator instruction;
- decision pack, roadmap, or approved review packet;
- lane-specific GC-018 or an explicit instruction that GC-018 must be filed
  before implementation;
- current active handoff and GC-020 requirements.

Use this artifact when a roadmap is too broad for direct implementation and an
agent needs precise marching orders.

Do not use it to bypass:

- GC-018 authorization;
- GC-020 handoff sync;
- GC-023 file-size discipline;
- public/provenance repository boundary;
- live governance proof requirements;
- reviewer gates or operator waivers.

## Required File Naming

Use:

```text
docs/work_orders/CVF_AGENT_WORK_ORDER_<SCOPE>_<YYYY-MM-DD>.md
```

Root-level scratch prompts are allowed only as temporary intake material. Once a
prompt becomes execution authority for another agent, convert it into a work
order under `docs/work_orders/`.

## Required Structure

Status token rule for authors:

- `HOLD_*`, `DRAFT`, or `PROPOSED` statuses must not include the token
  `CLOSED`; use `PASS` or `SATISFIED` for prerequisite wording, for example
  `HOLD_UNTIL_T1_PASS`.
- Parent roadmaps that remain open for later child lanes must not use
  `CLOSED` in the top-level `Status` merely because one child lane passed.
  Use child-lane wording such as `EX_T1_PASS_BOUNDED` in the parent roadmap,
  and reserve `CLOSED_PASS_BOUNDED` for the child work order, completion
  review, or fully closed roadmap.

Copy and complete the block below.

```text
# CVF Agent Work Order - <Scope>

Memory class: POINTER_RECORD

Status: <DRAFT | READY_FOR_REVIEW | APPROVED_FOR_EXECUTION | CLOSED>

## Dispatch Prompt Envelope

Place this section here as the first `##` section for any delegated or
role-switching dispatch-ready work order. It is a read-first cover note; it
does not replace the work order. Use the field skeleton in
`docs/reference/CVF_AGENT_DISPATCH_PROMPT_ENVELOPE_STANDARD_2026-06-15.md`.

## 1. Mission

<One paragraph describing the exact mission. Include what success means.>

## 2. Authority Chain

- Operator instruction: <path or date/time note>
- Active session state: <path>
- Decision pack / review authority: <path>
- Roadmap: <path>
- Roadmap design-control gate: <section/path OR N/A with reason>
- Spec / contract / machine-readable semantics: <path OR N/A with reason>
- GC-018 requirement: <already filed path OR must be filed before implementation>
- Active handoff: <path>

Authority boundary:

- This work order does not authorize work outside the cited authority chain.
- If any authority artifact conflicts with this work order, stop and reconcile
  before implementation.

## 3. Agent Roles

- Orchestrator / dispatcher: <agent or operator>
- Implementer: <agent>
- Reviewer: <agent>
- Operator approval required for: <conditions>

## 4. Scope

Allowed scope:

- <allowed action 1>
- <allowed action 2>

Forbidden scope:

- <forbidden action 1>
- <forbidden action 2>

Risk ceiling:

- <R0 | R1 | R2 | R3>

## ADIF Defect Registry Disclosure

Before filing this work order, query the read-only ADIF defect resolver
(`governance/compat/run_adif_defect_resolver.py`) for this dispatch's own
task class, role, and lifecycle phase, then list every returned defectId
below. `check_adif_defect_registry_disclosure.py` (wired into the
pre-dispatch and pre-implementation autorun phases) fails this work order
if this section is missing, if the query line is missing, or if any
defectId the resolver actually returns for the declared query is omitted
from the list.

Resolver query: taskClass=`<task class>`, role=`<dispatcher | worker |
reviewer | closer>`, lifecyclePhase=`<pre-dispatch | pre-implementation |
pre-closure | pre-push>`

Returned defects (or `Returned defects: NONE_RETURNED` if the query matches
zero entries):

- <defectId> - <one-line note on whether/how this dispatch avoids the
  pattern>

## 5. Required First Reads

Before filing GC-018 or editing files, read:

- <path 1> - why it matters
- <path 2> - why it matters

## 6. Pre-Flight Checks

Commands to run before implementation:

```powershell
git rev-parse --short HEAD
<command 1>
<command 2>
python governance/compat/run_agent_autorun_workflow_gate.py --phase pre-dispatch --base <baseHead> --head HEAD
python governance/compat/run_agent_autorun_workflow_gate.py --phase pre-implementation --base <baseHead> --head HEAD
python governance/compat/check_work_order_dispatch_quality.py --base <baseHead> --head HEAD --enforce
python governance/compat/check_adif_defect_registry_disclosure.py --base <baseHead> --head HEAD --enforce
```

Expected results:

- <expected result 1>
- <expected result 2>

If a pre-flight check fails, stop and record the failed command and result.
The worker must not continue past a failed autorun phase gate.

Mandatory Gate-Failure Remediation Protocol:

- Allowed-scope failures are mandatory remediation. Complete the remediation
  and execute the failed gate again.
- Missing `N/A with reason`, stale closure residue, source-verification
  corrections, allowed continuity sync, and routine guard failures are not
  operator-preference questions.
- Escalation is reserved for remediation that would exceed Allowed scope,
  change the claim boundary, release a `HOLD_*` prerequisite, change risk
  level, open public-sync, run live/provider proof, consume secrets/quota,
  touch forbidden paths, or perform destructive/irreversible actions.
- Any attempted handoff that turns an allowed-scope gate failure into an
  operator preference is a governance/control-plane learning signal.

Staging and checker-source rule:

- Before running `run_local_governance_hook_chain.py`, simulating pre-commit,
  or committing, stage the intended file set with `git add <paths>` so
  staged-index checkers read the current artifact.
- Before staging, working-tree-aware component gates may be used for pending
  worker artifacts; record that status as pending, not clean closure.
- If a checker appears to reject a file that is correct on disk, first verify
  whether the corrected file was staged.
- Hook-chain failures are cascade layers. Fix the first failing gate, rerun
  that gate directly, then rerun the full applicable autorun or hook chain
  before recording PASS.

## 6A. Source-Fidelity Pass

Before marking this work order ready for execution, verify the source facts it
depends on.

Full rules for all items below are in:

`docs/reference/work_order_template/CVF_WORK_ORDER_SOURCE_VERIFICATION_ADDENDUM.md`

Quick-reference commands:

```powershell
Test-Path "<existing path named in first reads>"
rg -n "<claimed function/type/templateId/role/policy field>" <source path>
rg -n --fixed-strings "<claimed token>" .
```

### Source Verification Block

Include a Source Verification Table when the work order names runtime or source
facts. Required columns per addendum; disposition values: `ACCEPT`, `REJECT`,
`BLOCKED_SOURCE_NOT_FOUND`.

### Current Runtime Freshness Verification

Include this section when the work order claims a capability is absent, not
implemented, stale, or intentionally not used. Show the repo searches that
were checked. Full rule in addendum.

### Negative Search And Collision Discipline

Include this section when the work order uses `NOT FOUND` or
`BLOCKED_SOURCE_NOT_FOUND`. Record exact search roots, commands, and collision
results. Full rule in addendum.

### ACCEPT_AS_OWNER_MAP coverage

When a roadmap-derived work order claims ACCEPT_AS_OWNER_MAP coverage from a
source audit, include a coverage disposition naming each accepted concept and
its status (in-scope / completed / deferred / rejected / out-of-scope with
reason). Full rule in addendum.

Required blocks when applicable:

- Intake Role Routing Decision block (per addendum)
- Single-Agent Multi-Role Control Block when applicable (per addendum)

If a source fact cannot be verified, either correct the work order or return to
the orchestrator. Do not ask the implementer to discover invented symbols.

## 6B. Roadmap-To-Work-Order Trace Matrix

If this work order is derived from a roadmap, map every roadmap requirement to
the executable instruction and closure evidence:

| Roadmap requirement | Work order section | Output artifact or field | Verification command or check | Status |
|---|---|---|---|---|
| <requirement> | <section> | <path/field> | <command/check> | <PASS/BLOCKED/N/A with reason> |

Rules:

- every roadmap acceptance item must have a row or explicit `N/A with reason`;
- every required roadmap field must appear in the output artifact or in the
  New Doc-Only Fields table;
- `PASS` is allowed only after the final artifact exists and has been checked;
- missing rows block dispatch or closure.

## 6C. Worker Autonomy / No-Question Rule

The worker proceeds without operator confirmation for non-destructive actions
inside this work order's Allowed scope.

Proceed autonomously with:

- reading files named by this work order;
- running `git status`, `git diff`, `git rev-parse`, manifest/hash checks, and
  listed governance gates;
- documentation format remediation inside Allowed scope;
- required evidence block completion inside Allowed scope;
- repeated guard or autorun execution after allowed-scope remediation.

Escalation is reserved for actions that would exceed Allowed scope, edit legacy
source, edit runtime/source code outside ownership, run live/provider proof, use
secrets/quota, public-sync, push/publish, change risk or claim boundary, release
a `HOLD_*` prerequisite, touch forbidden paths, or perform destructive or
irreversible action.

If a machine gate fails inside Allowed scope, complete the remediation and
execute the gate again. Routine gate remediation is not an operator-preference
checkpoint.

## 6C.1 System Loop Interlock Routing

Include this section when the work order scans, classifies, absorbs, or maps a
corpus, or when it records findings, "not found" claims, negative search
evidence, search/filter readiness, or downstream roadmap candidates.

Required content:

- upstream loop and output artifact;
- downstream loop and input artifact;
- machine-readable registry, finding packet, or intake path;
- routing rule for deferred or blocked findings;
- claim boundary that blocks autonomous mutation.

Minimum scan-routing rule:

- findings must be recorded in the corpus scan registry and a finding packet;
- deferred or blocked findings must include `defectClass`, `learningLane`,
  `nextAction`, and `f2gRef`, `roadmapRef`, or `workOrderRef`;
- a scan report with findings only in prose is not final.

## 6D. Pending Artifact Evidence Finality

If the worker leaves a changed, staged, or untracked governed artifact for
review, the artifact must not claim `git status --short` is clean. It must
record the actual pending status or state that clean-status evidence is
post-commit and command-backed.

Pending artifacts must not cite `--base HEAD~1 --head HEAD` or another
committed-only range as proof for the pending artifact itself.

Full finality, commit-mode lifecycle, dependency release, two-stage handoff,
worker pending-return gate, and reviewer closure conversion block rules are in:

`docs/reference/CVF_AGENT_WORK_ORDER_FINALITY_AND_REVIEW_CONVERSION_ADDENDUM_2026-06-12.md`

Work orders that use worker handoff, pending artifacts, prerequisite release, or
reviewer-owned closure must apply these extracted sections:

- Commit Mode And Base-Anchor Lifecycle
- Dependency Release And Next-Work-Order Refresh
- Two-Stage Handoff Finality
- Worker Pending-Return Gate
- Reviewer Closure Conversion Block

## 6E. Self-Reported Gate Evidence Consistency

If the artifact records governance gate results, those results must match the
current handoff state.

Rules:

- if a required gate fails inside Allowed scope, repair and rerun before
  handoff;
- if the failure cannot be repaired inside Allowed scope, set status to
  `BLOCKED` or `HOLD_*` and name the return action;
- do not leave a non-blocked artifact saying a required gate failed while asking
  the reviewer/operator to rerun, decide, or pick it up;
- do not record autorun `PASS` when a required section for that phase is still
  missing, such as `## Finding-To-Governance Learning Disposition` on a
  finding-bearing review;
- if recording `git status --short` for a pending artifact, include the pending
  status line for the artifact itself;
- after rerunning a gate, update the recorded Governance Gates Run result before
  returning the artifact.
- do not treat `FAIL_EXPECTED_PENDING_FINALITY` as a closed-equivalent PASS;
  it is valid only for `WORKER_MUST_NOT_COMMIT` pending review handoff;

## 6E.1 Machine Closure Package

Any work order that scans, classifies, imports, maps, routes, closes, or
hands off governed work must define the machine-readable outputs that turn the
worker result into the next loop's input.

Full table, rules, Acceptance Receipt Assertion Matrix template, and External
Artifact Hash Manifest template are in:

`docs/reference/work_order_template/CVF_WORK_ORDER_MACHINE_CLOSURE_PACKAGE_ADDENDUM.md`

Machine check:

```powershell
python governance/compat/check_machine_closure_package.py --base <baseHead> --head HEAD --enforce
```

Required closure package table — use the full template from the addendum above:

| Closure item | Required artifact/path | Machine-readable evidence | Final status |
|---|---|---|---|
| Work order status | `docs/work_orders/<work-order>.md` | closed-equivalent status; no stale residue | `<PASS/BLOCKED/N/A with reason>` |
| Completion or reviewer artifact | `docs/reviews/<completion>.md` or `N/A with reason` | final disposition, changed-file evidence, claim boundary, gate evidence | `<PASS/BLOCKED/N/A with reason>` |
| Roadmap state | `docs/roadmaps/<roadmap>.md` or `N/A with reason` | tranche row final status; no stale `READY_WITH_CONDITIONS` residue | `<PASS/BLOCKED/N/A with reason>` |
| Registry JSON | `docs/corpus-intelligence/CVF_CORPUS_SCAN_REGISTRY.json` or `N/A with reason` | entry id, normalized paths, hashes, verdicts, next action | `<PASS/BLOCKED/N/A with reason>` |
| Registry Markdown | `docs/corpus-intelligence/CVF_CORPUS_SCAN_REGISTRY.md` or `N/A with reason` | human quick lookup, next recommendation | `<PASS/BLOCKED/N/A with reason>` |
| External evidence digest | repo-local completion section or digest artifact | external path, schema/version, record count, hash, generated time, privacy boundary | `<PASS/BLOCKED/N/A with reason>` |
| System loop interlock | `docs/reference/CVF_SYSTEM_LOOP_INTERLOCK_REGISTRY_*.json` or `N/A with reason` | upstream output, downstream input, learning/finding route, mutation boundary | `<PASS/BLOCKED/N/A with reason>` |
| Session continuity | `CVF_SESSION_MEMORY.md`, `CVF_SESSION/ACTIVE_SESSION_STATE.json`, active handoff | mode, next allowed move, handoff HEAD or accepted parent marker | `<PASS/BLOCKED/N/A with reason>` |

## 6F. Commit Choreography

Governed work orders must follow:

`docs/reference/CVF_TRANCHE_COMMIT_CHOREOGRAPHY_STANDARD_2026-06-03.md`

Machine-token quick reference:

| Surface | Required exact tokens / values |
|---|---|
| Core guard-maintenance authorization | `Authorized guard-maintenance scope`, `Protected paths`, `Operator authorization`, `Rollback boundary` |
| Scope firewall authorization | `Allowed paths`, `Forbidden paths`, `Operator authorization`, `Rollback boundary` |
| Commit prompt rule | `Diff scope: PASS`, `Tests: PASS`, `Gates: PASS`, `Untracked unrelated: NONE`, `Forbidden touched paths: NONE` |
| Finding-To-Governance defect classes | `WORKER_EXECUTION_ERROR`, `ORCHESTRATOR_PACKET_GAP`, `RULE_GAP`, `MACHINE_GATE_GAP`, `PHASE_GATE_PLACEMENT_GAP`, `OPERATOR_SCOPE_CLARITY_GAP`, `RUNTIME_SIGNAL_GAP` |
| Finding-To-Governance lanes | `GOVERNANCE_CONTROL_PLANE`, `RUNTIME_BEHAVIOR_LEARNING`, `PROVIDER_OUTPUT_LEARNING`, `COST_ECONOMICS_LEARNING`, `DOCUMENTATION_ONLY_LEARNING` |
| Finding-To-Governance dispositions | `RULE_EXISTS`, `RULE_ADDED`, `MACHINE_CHECK_ADDED`, `MACHINE_CHECK_CANDIDATE`, `PHASE_GATE_PLACEMENT_GAP`, `DESIGN_REVIEW_REQUIRED`, `RUNTIME_LEARNING_CANDIDATE`, `N/A_WITH_REASON`, `TEMPLATE_UPDATED`, `STANDARD_UPDATED`, `STANDARD_ADDED` |
| Source Verification dispositions | `ACCEPT`, `REJECT`, `BLOCKED_SOURCE_NOT_FOUND` |

Notes:

- `N/A_WITH_REASON` is a disposition, not a defect class.
- New governed markdown should use plain checker-matched headings such as
  `## Purpose`; avoid numbered variants like `## 1. Purpose` unless the
  artifact type is already known to allow them.

Required rules:

- check archive hygiene before material tranche edits;
- keep archive cleanup, artifact implementation, closure transition, session
  state sync, and handoff sync in separate commits unless the work order
  explicitly owns the combined scope;
- stage large-scope authorization in the same commit as the large-scope diff;
- capture `executionBaseHead` immediately before worker edits;
- capture `closureBaseHead` immediately before reviewer closure commit;
- expect a dedicated handoff-sync-only commit after material/session commits;
- never use a stale dispatch base as closure proof after intervening commits.
- record component-gate PASS separately from committed-range `pre-closure`
  PASS so a reviewer can see exactly which transition remains.
- for mode/next-move changes, update `CVF_SESSION/ACTIVE_SESSION_STATE.json`,
  `CVF_SESSION_MEMORY.md`, and active handoff context together, then expect a
  dedicated handoff-sync commit for the final HEAD.

### 6F.1 Session / Handoff Commit Protocol

Use this protocol when a closure touches session continuity or active handoff
state:

1. Put `Core Guard Self-Protection Authorization` in the changed governed
   authorization artifact under one of the checker-recognized prefixes:
   `docs/baselines/`, `docs/roadmaps/`, `docs/reviews/`, or
   `docs/work_orders/`.
2. For a protected session/front-door sync commit, the changed root active
   handoff matching `AGENT_HANDOFF*.md` may carry the same authorization block
   if it lists every protected path in the changed range.
3. Preferred two-commit closure:
   - material/session commit: close the artifact, update session state/front
     door if needed, and include the same-range authorization doc;
   - handoff-only sync commit: update only the active handoff with the material
     commit SHA.
4. If the front door or state registry must record the material commit SHA
   itself, use a protected session-sync commit whose changed active handoff or
   docs-prefixed artifact carries same-range authorization.
5. Run committed-range `pre-closure` only after the material/session commit and
   required handoff sync are complete.

## 6F. Near-Threshold Owner Maintainability Plan

If Allowed scope adds or modifies source inside a registered owner domain whose
active entrypoint is within the GC-023 near-hard margin, include this section
before dispatch.

Required content:

- active owner entrypoint path;
- current line count and hard threshold;
- split, extract, rotate, or archive action;
- new helper/barrel/archive path;
- `Minimum shrink target: 50 lines`;
- command-backed post-change line count;
- explicit statement that the owner entrypoint is in Allowed scope and Write
  Ownership.

Do not classify the near-threshold owner entrypoint as forbidden-touch while
adding adjacent source.

## 6G. Work-Order Fulfillment Manifest

For runtime/source implementation work, include these machine-readable tables
before dispatch.

## Required Artifact Manifest

| Path | Required at handoff | Purpose |
|---|---|---|
| <source/test/review path> | Yes | <why this file must exist> |

## Forbidden Path Manifest

| Path | Reason |
|---|---|
| <forbidden path or glob> | <why this path is out of scope> |

## Forbidden Filesystem State At Dispatch

Record the filesystem state of every forbidden path at the moment this work
order is dispatched. The orchestrator must verify each path before dispatch.

This block is verified by `check_forbidden_filesystem_state.py` at the
`pre-implementation` autorun gate phase.

| Forbidden path | Expected state | Actual state at dispatch | Action if PRESENT |
|---|---|---|---|
| <forbidden path> | ABSENT | ABSENT ✓ | N/A |

Rules:

- `ABSENT` — path does not exist on disk. Dispatch is safe.
- `PRESENT` — path already exists. Dispatch is blocked until the orchestrator
  either removes the files, opens a governance packet for them, or records an
  explicit operator exemption with reason.
- `PRESENT_EXEMPTED` — path exists; orchestrator has authorized worker to ignore
  it; worker must not edit, stage, or claim the path.

## Pre-Existing Dirty Path Exemptions

Use only when the repository is already dirty before dispatch and the worker
must ignore, not edit, the path.

| Path | Status at dispatch | Exemption boundary |
|---|---|---|
| <pre-existing dirty path> | <M/A/?? from git status> | <do not edit/stage/claim> |

## Required Proof Manifest

| Proof | Path | Required literal | Required at handoff |
|---|---|---|---|
| <sentinel/invariant/test proof> | <test or source path> | <literal token> | Yes |

## 7. Write Ownership

Owned files or modules:

- <path or module>

Forbidden paths:

- <path or module>

Write mode:

- <append-only | create-only | modify-listed>

Any file outside ownership requires an updated work order or operator approval.
If the closure diff shows files outside Allowed scope or ownership, the worker
must stop, split the cleanup into a separate governed batch, or return to the
Orchestrator.

## 7A. Protected-Path Authorization Carrier

If this work order authorizes the worker to create or modify any protected
path — a `governance/compat/*.py` checker, any `CVF_SESSION/**` state/handoff
file, `CVF_SESSION_MEMORY.md`, or an `AGENT_HANDOFF*.md` file — the work order
itself must carry a `Core Guard Self-Protection Authorization` block.

Required fields:

- `## Core Guard Self-Protection Authorization` heading;
- `Authorized guard-maintenance scope`;
- `Protected paths` — a list of every protected path authorized;
- `Operator authorization` — the governance authority that permits the change;
- `Rollback boundary` — what may and must not be reverted if rejected.

Omitting this block when a protected path is in scope is a dispatch-quality
violation (enforced by `governance/compat/check_work_order_dispatch_quality.py`).

Example skeleton:

```text
## Core Guard Self-Protection Authorization

Authorized guard-maintenance scope: <permitted guard/state change; out-of-scope note>.

Protected paths:

- governance/compat/check_<name>.py
- CVF_SESSION/ACTIVE_SESSION_STATE.json

Operator authorization: <instruction or governance authority>.

Rollback boundary: revert only <this change> if rejected; do not revert <prior closures>.
```

## 8. Execution Plan

Steps must be sequential unless explicitly marked parallel-safe.

1. <step>
2. <step>
3. <step>

Each step must state:

- input artifact;
- output artifact;
- validation command or evidence;
- stop condition.

## 8A. Design Control Carry-Forward

Roadmap-derived work orders must preserve the roadmap design-control gate.

| Design control | Roadmap source | Work-order handling | Verdict |
|---|---|---|---|
| Scope boundary | <section/path> | <how this work order preserves it> | <PASS/BLOCKED/N/A> |
| Non-goals | <section/path> | <how forbidden claims/actions are blocked> | <PASS/BLOCKED/N/A> |
| Lane split | <section/path> | <which lane this work order executes> | <PASS/BLOCKED/N/A> |
| Dependency/source-verification plan | <section/path> | <source checks required before build> | <PASS/BLOCKED/N/A> |
| Claim boundary | <section/path> | <claim boundary inherited here> | <PASS/BLOCKED/N/A> |
| Acceptance criteria | <section/path> | <observable acceptance rows below> | <PASS/BLOCKED/N/A> |
| Verification/evidence | <section/path> | <commands/artifacts required> | <PASS/BLOCKED/N/A> |
| Dispatch-readiness decision | <section/path> | <why this work order may dispatch> | <PASS/BLOCKED/N/A> |

If any required design control is `BLOCKED`, this work order must remain
`DRAFT`, `HOLD_*`, or return to Orchestrator.

## 8B. Agent Operation Trace Block

Every ready/dispatched work order and every worker-return or completion packet
derived from it must preserve repo-local agent-operation trace evidence.

Canonical standard:

`docs/reference/CVF_AGENT_OPERATION_TRACE_AND_WORKSPACE_INTEGRITY_STANDARD_2026-06-13.md`

Required block:

| Field | Evidence |
| --- | --- |
| Actor | <agent/operator/provider role> |
| Provider or surface | <Codex, Claude, CLI, IDE tab, MCP, browser, etc.> |
| Session or invocation | <session id, commit range, or N/A with reason> |
| Working directory | <cwd or repo root> |
| Command or tool surface | <commands/tools used; safe summaries allowed> |
| Target paths | <changed or intended paths> |
| Allowed scope source | <operator instruction, roadmap, GC-018, work order> |
| Before status evidence | <git status --short, base HEAD, or N/A with reason> |
| After status evidence | <git status --short or closure status evidence> |
| Diff evidence | <git diff --name-status / committed range> |
| Approval boundary | <what was authorized and by whom/source> |
| Claim boundary | <repo-local trace only; no OS/user attribution unless separately proven> |
| Deletion or rename disposition | <required only when protected paths are deleted/renamed; otherwise N/A with reason> |

## 8C. Epistemic Process Block (FPC-T3-C04)

High-evidence work orders (findings, claim updates, corpus analysis, source
verification, benchmarks, or risk-model changes) must include this process
block.

```text
## Epistemic Process Block

Epistemic Process Applicability: <HIGH_EVIDENCE | EVIDENCE_LIGHT | MECHANICAL | EPISTEMIC_PROCESS_NA_WITH_REASON: <reason>>

Expected Result / Prediction: <expected finding before execution>

Evidence Comparison Requirement: worker return compares actual evidence against the prediction.

Contradiction Handling Requirement: contradictory evidence requires a Contradiction Or Gap Disposition and claim-boundary update.

Claim Update Requirement: worker return records whether the claim was confirmed, revised, narrowed, or invalidated.
```

Full contract:
`docs/reference/CVF_AGENT_WORK_ORDER_EPISTEMIC_PROCESS_BLOCK_ADDENDUM_2026-06-13.md`

## 9. Evidence Requirements

Required evidence:

- <command/result/path>
- <test result>
- <catalog path verification, if applicable>
- complete Agent Operation Trace Block for work orders, worker returns, and
  completion reviews

Evidence Trace Block requirements:

- Claim:
- Command:
- Result:
- Key path:
- Verdict:

Base-anchor evidence:

- `dispatchBaseHead`:
- `executionBaseHead`:
- `closureBaseHead`: `<post-review commit stage or N/A - pending review>`
- Commit mode: `<WORKER_MAY_COMMIT | WORKER_MUST_NOT_COMMIT>`
- Pending-artifact component gates:
- Worker Pending-Return Gate table:
- Worker-return fast gate:
  `python governance/compat/run_worker_return_fast_gate.py`
  plus `--pytest-target <path>` for focused tests when applicable
- Committed-range `pre-closure`: `<PASS after commit | N/A - pending review>`

## 10. Acceptance Criteria

- [ ] <criterion 1>
- [ ] <criterion 2>
- [ ] <criterion 3>

Criteria must be observable through files, commands, tests, or review records.

Fail conditions:

- [ ] <blocking missing field, source mismatch, boundary error, or ambiguous
  threshold condition>
- [ ] <forbidden runtime/public/live-proof claim condition>

Closure is blocked if any fail condition is present.

## 11. Review Gate

Implementation may proceed only after:

- <GC-018 filed and reviewed | operator waiver recorded | other condition>
- `pre-dispatch` autorun gate passed before dispatch
- `pre-implementation` autorun gate passed before material edits

Closure may proceed only after:

- <reviewer no-blocking objection | operator waiver | gate result>
- `pre-closure` autorun gate passed and result recorded

For `WORKER_MUST_NOT_COMMIT` mode, worker handoff is not closure. The reviewer
or committer must approve disposition, commit the reviewed owned diff, and run
the committed-range `pre-closure` gate before changing status to a
closed-equivalent value.

No-commit worker returns use the compact full-gate contract:

```text
## Worker Return Packet Shape Contract

contractProfile: WORKER_RETURN_FULL_GATE_V1
requiredGate: `python governance/compat/run_worker_return_fast_gate.py`
individualCheckerSubstitution: FORBIDDEN
workerReturnSkeleton: CHECKER_SAFE_SKELETON_REQUIRED
```

For a GC-018-authorized docs-only no-commit tranche, the dispatcher may use
`WORKER_RETURN_FAST_DOC_V1` exactly as defined by
`docs/reference/work_order_authoring/CVF_WORKER_RETURN_FULL_GATE_CONTRACT_STANDARD.md`.

`## Verification Commands` must include
`python governance/compat/run_worker_return_fast_gate.py`. When the work order
names focused tests, add one `--pytest-target <path>` per test path.

When a no-commit worker return is expected, create the packet from the scaffold
before writing long prose:

```powershell
python governance/compat/run_worker_return_scaffold.py --write docs/reviews/<worker-return>.md --title "<worker return title>"
python governance/compat/run_worker_return_fast_gate.py
```

For an eligible compact dispatch, append
`--profile WORKER_RETURN_FAST_DOC_V1` to the scaffold command.

Run the fast gate once while the file is still a short skeleton, then fill the
content and rerun. This catches required headings, literal fields, and Source
Inventory action tokens before a 400-line report exists.

Reviewer/committer validation of a returned no-commit worker artifact uses:

```powershell
python governance/compat/run_agent_commit_steward_preflight.py --mode reviewer-return --base <closureBaseHead> --head HEAD --enforce
```

`worker-return` is not a commit-steward mode. If a worker needs a diagnostic
before handoff, use the worker-return fast gate above and the work order's
focused tests instead of inventing a commit-steward mode.

Worker-return `## Source Inventory` tables must use a bare action token in the
action cell: `READ`, `FULL_READ`, `PARTIAL_READ`, or `SOURCE_VERIFIED`. Put
qualifiers such as targeted grep, line-range read, or reason text outside the
action cell.

Worker Output Quality Controls:

rawMemoryReleased=false. This template guidance does not release raw memory,
retrieval, reinjection, private-output, or memory/RAG write behavior; any such
release still requires a fresh source-verified work order and accepted closure.

For any no-commit worker return, especially source/test or high-evidence
tranches, the work order should require the worker to complete and record this
self-audit before `COMPLETE_PENDING_REVIEW`:

- rerun every exact required command after the last material edit, including
  focused tests and worker-return gates named by the work order;
- copy each required command exactly as run, with working directory and focused
  target where applicable;
- classify any final command result as PASS, FAIL with allowed-scope repair
  completed and rerun, BLOCKED with reason, or N/A with reason;
- record `git status --short --untracked-files=all` after the worker-return
  file exists, so pending owned files and unexpected untracked files are visible
  to the reviewer;
- remove or disclose any provider-local or IDE side-channel file before
  handoff, and do not stage or claim such files unless the work order
  explicitly authorizes them;
- record any static-analysis diagnostic as fixed inside Allowed scope or as
  out-of-scope with no source/test edit claim;
- when the tranche touches security, private output, memory write, route
  release, unsafe metadata, or normalization behavior, include at least one
  negative or edge-case test proving the risky input fails closed.

When a work order requires a `docs/reviews/` review artifact (a worker return,
a UAT review, or a completion review), name these three sections explicitly in
the work order's required-shape guidance, in addition to the scaffold-emitted
sections, because separate generic gates require them on review-classed
artifacts even when the scaffold alone would not surface the gap until a fast
gate run: `Risk / Corrective Action`, `External Knowledge Intake Routing`, and
`Epistemic Process Block`. If any of the three is not applicable to that
specific review artifact, instruct the worker to include it anyway with an
explicit `N/A with reason` or `NOT_APPLICABLE_WITH_REASON` value rather than
omitting the heading.

`check_markdown_structural_completeness.py` separately classifies any
`docs/reviews/*.md` artifact as `review` type and requires one heading from
each of five generic groups before drafting begins, not only after a gate
failure: a target/source group (`## Target`, `## Source`, or
`## Reviewed`-prefixed heading), a scope/methodology group (`## Scope` or
`## Methodology`-prefixed heading), a findings/position group (`## Findings`,
`## Position`, or `## Bottom Line`-prefixed heading), the risk/corrective
action group already named above, and a decision/recommendation/disposition
group (`## Decision`, `## Recommendation`, or a heading containing
`Disposition`). When drafting the work order's required-shape list for a new
review artifact, include at least one heading per group up front rather than
discovering the gap during a live fast-gate run.

When session-sync happens in a separate commit after the material worker/
reviewer commit, the work order and any worker-return gate evidence should
record material-range and session-sync-range gate results as two distinct
rows or commands, not one combined range. Mixing a material commit range with
a later session-sync commit range in a single gate invocation (for example
`--base <dispatchBaseHead> --head HEAD` after a session-sync commit has
already landed on top of the material commit) can fail range-sensitive
checks such as `check_agent_operation_trace.py` on paths that the
session-sync commit legitimately touched outside the worker's changed-set
manifest. Record the material-only range result and the full-range result
separately so a reviewer can distinguish a real packet defect from this
range-comparison artifact.

Mandatory remediation rule:

- A gate failure inside this work order's Allowed scope is authorization to
  repair and rerun, not a reason to ask the operator for preference.
- Operator approval is required only for scope expansion, claim-boundary
  changes, `HOLD_*` release, live/provider proof, public-sync, secrets/quota,
  forbidden paths, destructive actions, or higher risk.

Reviewer silence is not approval unless the operator explicitly records a
waiver for this work order.

## 12. Closure Checklist

- [ ] All acceptance criteria satisfied or explicitly marked N/A with reason
- [ ] Required tests or evidence commands run
- [ ] Autorun `pre-closure` gate passed:
  `python governance/compat/run_agent_autorun_workflow_gate.py --phase pre-closure --base <baseHead> --head HEAD`
- [ ] Commit mode recorded as `WORKER_MAY_COMMIT` or `WORKER_MUST_NOT_COMMIT`
- [ ] `dispatchBaseHead`, `executionBaseHead`, and closure-stage base evidence
  recorded without treating a stale dispatch anchor as current worker proof
- [ ] For `WORKER_MUST_NOT_COMMIT`, pending handoff used a non-closed status,
  recorded actual `git status --short`, and left committed-range
  `pre-closure` to reviewer / committer
- [ ] For `WORKER_MUST_NOT_COMMIT`, Worker Pending-Return Gate results are
  recorded, required component-gate failures inside Allowed scope are repaired,
  and remaining failures are explicitly `BLOCKED`, `N/A with reason`, or
  `FAIL_EXPECTED_PENDING_FINALITY`
- [ ] For `WORKER_MUST_NOT_COMMIT`, worker-return fast gate result is recorded
  with focused pytest targets when applicable
- [ ] Agent Operation Trace Block is present and complete for this work order,
  worker return, or completion review
- [ ] Closure gate used a non-empty committed diff range; no `--base HEAD --head HEAD`
- [ ] Changed-file set from `git diff --name-status` is inside this work
  order's Allowed scope, or every extra path has explicit operator/work-order
  authorization
- [ ] If this closes a multi-tranche connector wave roadmap, the pre-closure
  range includes all tranche artifacts, not only the final tranche
- [ ] Any line-count threshold or "actual line count" claim is current and
  command-backed
- [ ] Roadmap-to-work-order trace matrix final statuses are PASS or N/A with reason
- [ ] Closure Diff Gate completed: roadmap, work order, final artifact, and
  completion claims were compared
- [ ] Claim Integrity Scan completed with `git diff --name-status`,
  `git status --short`, committed diff output, receipt, command output, or N/A
  evidence for file-change and boundary claims
- [ ] Fail conditions checked and absent, or work returned BLOCKED
- [ ] No open checkbox residue remains in roadmap, work order, completion
  packet, or public-sync checklist
- [ ] No closed work order contains unresolved `HOLD`, `PENDING`, or
  `READY_FOR_DISPATCH` checklist rows or stale dispatch-blocking prose
- [ ] Public catalog updated or explicitly N/A with reason
- [ ] Public/provenance repository boundary checked if public files changed
- [ ] GC-020 handoff updated with current HEAD after commit
- [ ] Post-commit active-session gate passed:
  `python governance/compat/check_active_session_state.py --enforce`
- [ ] Active session front door and state registry updated if mode, next
  allowed move, public-sync status, roadmap status, or handoff status changed
- [ ] Completion packet filed if the roadmap requires one
- [ ] Changed files listed for reviewer
- [ ] No closed-equivalent claim remains if any autorun phase gate failed
- [ ] Any allowed-scope autorun/guard failure was repaired and rerun, not left
  as an operator preference checkpoint

## 13. Return-To-Orchestrator Conditions

Return to orchestrator without continuing if:

- pre-flight fails;
- any autorun phase gate fails outside Allowed scope or cannot be repaired
  inside this work order;
- source-fidelity pass finds a missing path, invented symbol, or unverified
  role/template mapping;
- scope conflict is discovered;
- required citation cannot be found;
- implementation would exceed risk ceiling;
- reviewer raises a structural blocking objection;
- public/provenance boundary is unclear.
```

## Authoring Rules

- Use precise paths, not prose-only references.
- Prefer file:line citations for inventory answers.
- Use planned paths in GC-018 when files do not exist yet; verify existence in
  completion evidence after implementation.
- Keep public claims bounded to evidence level:
  - `defined` for schema/docs only;
  - `tested` for unit or integration evidence;
  - `live-proven` only after required live governance proof.
- Do not include raw API keys, secrets, or private credentials.
- Do not make the work order broader than the authorizing roadmap.

## Minimum Quality Bar

A work order is not ready for execution unless it answers:

- What exactly should be done?
- Why is it authorized?
- Who is implementer and who reviews?
- Which files may be touched?
- Which files or actions are forbidden?
- Which command proves pre-flight readiness?
- Which evidence proves completion, including dispatch prompt envelope evidence per `docs/reference/CVF_AGENT_DISPATCH_PROMPT_ENVELOPE_STANDARD_2026-06-15.md` when delegated?
- What stops the agent from continuing?

## Delta Execution Claim Boundary Control Block

A real work order built from this template must include this block with
the 8 canonical fields (`claimScope`, `claimDisposition`, `receiptEvidence`,
`actionEvidence`, `invocationBoundary`, `interceptionBoundary`,
`claimLanguage`, `forbiddenExpansion`), populated with the actual
dispatch's scope and boundary. This template's own placeholder copy below
exists only so `check_delta_execution_claim_boundary.py` recognizes the
template file itself when it mentions runtime-enforcement language in
prose (e.g. the Minimum Quality Bar's `runtime enforcement behavior`
wording); it is not a real dispatch's claim and must not be copied
verbatim into an actual work order.

| Field | Disposition |
|---|---|
| claimScope | `<bounded scope of this specific dispatch>` |
| claimDisposition | `<BOUNDED_CLAIM_WITH_EVIDENCE | N/A with reason>` |
| receiptEvidence | `<CVF_RECEIPT_PRESENT | N/A with reason>` |
| actionEvidence | `<ACTION_EVIDENCE_PRESENT | N/A with reason>` |
| invocationBoundary | `<governed local document/code editing, no broader claim>` |
| interceptionBoundary | `<no IDE/shell/git/filesystem/provider interception claim>` |
| claimLanguage | `<plain description of what this dispatch actually does>` |
| forbiddenExpansion | `<explicitly list what this dispatch does not do>` |

## Related Artifacts

- `EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION/src/delegation.contract.ts`
- `EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION/src/agent.handoff.contract.ts`
- `docs/reference/CVF_AGENT_EXECUTION_WORKFLOW_SOP_2026-05-19.md`
- `docs/reference/CVF_AGENT_AUTORUN_WORKFLOW_CONTROL_STANDARD_2026-05-28.md`
- `docs/reference/CVF_AGENT_OPERATION_TRACE_AND_WORKSPACE_INTEGRITY_STANDARD_2026-06-13.md`
- `docs/reference/CVF_AGENT_WORK_ORDER_FINALITY_AND_REVIEW_CONVERSION_ADDENDUM_2026-06-12.md`
- `docs/reference/CVF_GC018_CONTINUATION_CANDIDATE_TEMPLATE.md`
- `governance/toolkit/05_OPERATION/CVF_AGENT_REVIEW_ANTI_COLLUSION_GUARD.md`
- `governance/toolkit/05_OPERATION/CVF_DOCUMENT_STORAGE_GUARD.md`
- `docs/reference/work_order_template/README.md`
