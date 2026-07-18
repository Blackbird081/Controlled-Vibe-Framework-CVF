# CVF Tranche Commit Choreography Standard

Memory class: POINTER_RECORD

Status: ACTIVE_STANDARD

docType: reference

Date: 2026-06-03

Authority: operator finding after CI2-T1 closure friction

---

## Purpose

Define the required commit choreography for governed CVF tranches so archive
hygiene, artifact implementation, closure transition, session state, and active
handoff sync do not collide in one oversized or ambiguous commit range.

This standard converts the CI2-T1 closure friction into a reusable workflow
rule before CI2-T2 checker work begins.

Dependency-release evidence is governed by:

`docs/reference/CVF_WORK_ORDER_DEPENDENCY_RELEASE_EVIDENCE_STANDARD_2026-06-03.md`

---

## Scope

This standard applies to any governed tranche, work order, roadmap task,
reviewer closure, archive hygiene batch, guard-maintenance batch, or session
sync batch that:

- touches active work orders, roadmaps, reviews, baselines, session state, or
  handoff files;
- runs autorun workflow gates;
- changes more than 40 files;
- changes `governance/compat/*`;
- closes a tranche and opens the next ordered tranche;
- uses `WORKER_MUST_NOT_COMMIT`.

It is especially binding for CI2-T2 and later Corpus Intelligence enforcement
work, because those tranches edit guard/checker code and will otherwise be
vulnerable to range bleed from archive or session commits.

---

## Root Cause Lessons

| Root cause | Required control |
| --- | --- |
| Archive script creates large unstaged diff | Run archive hygiene as a separate pre-session batch, or explicitly split archive deletion/copy/reference commits before tranche work. |
| Large-scope authorization must be in the same commit | Stage the authorization review in the same commit as the large-scope change it authorizes. A prior commit is not enough. |
| Windows decoding can break checker subprocess output | Governance scripts that read git output must use UTF-8 with replacement for non-ASCII bytes. |
| Archived review files can trigger active corpus checks | Corpus/path checkers must exclude archive paths unless the archive batch explicitly reopens them. |
| Stale dispatch base expands closure range | Use the worker-captured `executionBaseHead` for worker validation and reviewer-captured `closureBaseHead` for closure, not an old dispatch base after unrelated commits. |
| Session mode must exist in JSON and front door | Any mode/next-move change must update both `CVF_SESSION/ACTIVE_SESSION_STATE.json` and `CVF_SESSION_MEMORY.md` in the same authorized session commit. |
| Handoff HEAD cannot be known before commit | Expect a dedicated handoff-sync-only commit after material/session commits. |
| Next work order released from HOLD with stale prerequisite placeholders | Before marking the next work order READY/DISPATCH_READY, replace `REQUIRED` or `after closure` dependency rows with artifact path plus closure commit evidence, and refresh base anchors. |
| Hook-chain checks read staged index while some component checkers read disk | Before running the local hook chain or simulating pre-commit, stage the intended files with `git add`; when testing pending worker artifacts, use working-tree-aware component gates and record pending status honestly. |
| Checker token requirements are hidden in source code | Work orders and standards must expose exact machine tokens for common gates instead of requiring workers to reverse-engineer Python checkers. |
| `REQUIRED` is human-readable but dispatch-blocking in ready packets | Use `ACCEPT` for satisfied Authority Chain, Dependency Gate, and Source Verification rows; keep `REQUIRED` only in non-ready draft/HOLD text or artifact/proof manifest columns where the checker treats it as a boolean. |
| Session sync is a three-surface continuity update | Mode and next-move changes must update `ACTIVE_SESSION_STATE.json`, `CVF_SESSION_MEMORY.md`, and active handoff context together; then a dedicated handoff-sync commit records the final HEAD or accepted parent marker. |
| Hook chain fail-fast hides later defects | Treat each failure as a cascade layer: fix the first failing gate, rerun the same gate locally, then rerun the full autorun/hook chain before claiming readiness. |
| `WORKER_MUST_NOT_COMMIT` packets let workers author completion reviews | Workers may return pending handoff/evaluation artifacts; completion review is reviewer / committer owned unless the packet explicitly changes role and commit mode before dispatch. |
| Strict manual commit choreography creates reviewer friction | Use the conservative helper `scripts/cvf_commit_tranche.py` when possible; it commits only the staged artifact batch, writes the active handoff parent marker, creates a handoff-only sync commit, and reruns pre-closure. |
| Worker closure prose does not become downstream machine input | Require a Machine Closure Package that updates work order, completion/review, roadmap, registry JSON/MD, external evidence digest, loop interlock, and session continuity surfaces as applicable. |
| External workspace evidence is confused with source authority | Keep external/local workspace paths out of Source Verification source-file cells; record external hashes and record counts in a repo-local evidence digest first. |

---

## Required Commit Sequence

### Step 0 - Archive Hygiene Preflight

Before starting tranche implementation, check whether archive hygiene or stale
active-doc cleanup is already pending.

If archive hygiene is needed:

1. run the archive batch before tranche work;
2. create or update the large-scope authorization review in the same commit as
   the large archive diff;
3. keep archive commits separate from tranche artifact commits;
4. rerun active archive hygiene and dispatch-quality gates before continuing.

Do not mix archive hygiene with a tranche implementation commit unless the
work order explicitly owns archive cleanup.

### Step 1 - Worker Artifact Batch

The worker records `executionBaseHead` immediately before material edits:

```powershell
git rev-parse --short HEAD
```

For `WORKER_MUST_NOT_COMMIT`, the worker must leave artifacts pending and must
not claim closure. The worker may claim only component test/gate results that
are valid against the pending working tree.

The worker must not create or own the completion review in
`WORKER_MUST_NOT_COMMIT` mode. Use a worker handoff/evaluation artifact for
pending evidence. Reviewer / committer owns the completion review after
disposition and committed-range closure evidence.

For `WORKER_MAY_COMMIT`, the worker may commit only owned artifact changes
after tests and gates pass.

### Step 2 - Reviewer Closure Batch

The reviewer or committer captures `closureBaseHead` immediately before the
closure commit. This base must be the actual start of the closure range, not an
old dispatch base that includes unrelated archive or prior tranche commits.

Closure transition may include:

- closing the current work order;
- updating the roadmap row;
- opening the next ordered work order;
- creating the completion review;
- recording committed-range gate evidence.

If protected session or governance files are changed, the authorization review
for those protected changes must be staged in the same commit.

### Step 2A - Dependency Release Refresh

Canonical dependency-release standard:

`docs/reference/CVF_WORK_ORDER_DEPENDENCY_RELEASE_EVIDENCE_STANDARD_2026-06-03.md`

If the next ordered work order was drafted earlier in `HOLD_*` status, do not
release it by changing only the status line. In the same release batch:

1. replace placeholder dependency evidence such as `after closure`,
   `after Tn closure`, or `Disposition: REQUIRED` with the actual closed
   artifact path and closure commit;
2. set `dispatchBaseHead` to the closure commit or current dispatch anchor;
3. set `executionBaseHead` to `WORKER_MUST_CAPTURE_AT_START` unless the worker
   already captured it after dispatch;
4. keep `closureBaseHead` as `NOT_EXECUTED_YET`;
5. rerun dispatch-quality and pre-dispatch autorun gates before handing the
   packet to a worker.

This is the CI2-T4 to CI2-T5 lesson: a downstream work order must receive the
machine-readable output of the closed tranche, not a prose memory that the
worker is expected to reinterpret.

### Step 3 - Session State Sync Batch

When mode, next allowed move, closed status, or active front-door text changes,
update these together:

- `CVF_SESSION/ACTIVE_SESSION_STATE.json`;
- `CVF_SESSION_MEMORY.md`;
- active handoff if the handoff text also needs next-move context;
- a same-commit authorization review if protected paths require it.

This commit may still be followed by a handoff-only sync commit because its
final SHA is not knowable before commit.

### Step 4 - Dedicated Handoff Sync Commit

After any material or session sync commit, run:

```powershell
python governance/compat/check_active_session_state.py --enforce
```

If the active handoff lacks the current HEAD or accepted parent marker, create
a dedicated handoff-sync-only commit. That commit must modify only the active
handoff file unless a new handoff version is being opened under its own
handoff-transition rules.

### Step 4A - Optional Commit Helper

Reviewer / committer may use the conservative helper:

```powershell
python scripts/cvf_commit_tranche.py --base <closureBaseHead> --message "<artifact commit message>" --handoff-summary "<bounded summary>" --execute
```

Helper contract:

- dry-run is the default; `--execute` is required before any commit is made;
- the helper commits only files already staged before invocation;
- it does not run `git add .`, does not push, and does not bypass hooks;
- by default, unstaged or untracked files stop the helper before commit;
- `--allow-unstaged` is permitted only when the reviewer intentionally leaves
  inspection-only residual files outside the staged artifact batch;
- after the artifact commit, the helper updates only the active handoff HEAD
  marker and refuses the handoff-sync commit if any other file is staged;
- the helper runs the `pre-closure` autorun gate against `--base
  <closureBaseHead>` unless `--skip-preclosure` is explicitly supplied for a
  separately documented gate run.

Use the helper to reduce operator friction, not to widen commit scope. If the
artifact batch needs session-state updates, protected-path authorization, or
large-scope authorization, those files must be staged intentionally before the
helper runs and must still satisfy the same hook chain.

### Step 5 - Gate Cascade Discipline

Governance checks may read different sources during a pending batch:

- the pre-commit hook chain validates the staged index;
- `git diff --cached`-based checks see only staged files;
- working-tree-aware autorun and component checks may see unstaged edits;
- selected authorization helpers read files directly from disk.

Before running a hook-chain simulation or committing, stage exactly the intended
files. Do not interpret a hook failure against the staged index as proof that
the working tree file is still wrong; first confirm whether the changed file
was staged.

Because the hook chain fails early, a PASS/fail cycle can expose defects in
layers. Required sequence after a failure:

1. fix the first failing gate inside the allowed scope;
2. stage the intended file set if testing hook behavior;
3. rerun the failed gate directly;
4. rerun the full applicable autorun or hook chain;
5. update recorded evidence only after the full rerun passes.

### Step 6 - Machine Closure Package

Before a reviewer or committer claims a tranche closed, the changed artifacts
must expose the machine-readable closure state that downstream loops consume.

Required package surfaces:

| Surface | Required state |
| --- | --- |
| Work order | closed-equivalent status when closed; no stale `DISPATCH_READY`, unchecked required checklist residue, or placeholder dependency text. |
| Completion/reviewer artifact | reviewer-owned final disposition for `WORKER_MUST_NOT_COMMIT`; changed-file evidence; claim boundary; committed-range gate evidence. |
| Roadmap | tranche row updated to the final state and next tranche dependency state refreshed. |
| Registry JSON | machine-readable scan/readiness/gap fields updated when corpus, classification, search/filter, or learning-loop state changes. |
| Registry Markdown | human quick lookup updated alongside JSON when GC-051 state changes. |
| External evidence digest | external path, schema/version, record count, hash, generated time, and privacy boundary recorded in a repo-local section or artifact. |
| System loop interlock | upstream output, downstream input, learning/finding route, and mutation boundary recorded when one loop feeds another. |
| Session continuity | active state, front door, and handoff updated when mode or next allowed move changes. |

Rules:

- A scan, classification, or readiness report that stays only in prose is not a
  complete loop handoff when a registry or learning input exists.
- Source Verification cites repo-local source authority or canonical contracts.
  External paths such as local `Policy_Local` inputs are evidence inputs and
  must first be normalized into a repo-local digest before later packets cite
  them.
- Closed-equivalent artifacts must not leave `NOT_EXECUTED_YET`,
  `PRE_CLOSURE_NOT_RUN`, stale `READY_WITH_CONDITIONS`, or stale dependency
  placeholders unless the artifact is explicitly still pending review.
- Finding-bearing artifacts must use checker-accepted defect classes. Use
  `RULE_GAP`, `MACHINE_GATE_GAP`, `ORCHESTRATOR_PACKET_GAP`, or
  `PHASE_GATE_PLACEMENT_GAP` for reusable control defects; do not invent
  `EVIDENCE_GAP`.

### Machine Token Quick Reference

The following exact tokens are operational requirements for common governance
artifacts as of 2026-06-03. If checker source later changes, update this
section in the same guard-maintenance batch.

| Surface | Required exact tokens / values | Boundary |
| --- | --- | --- |
| Core guard-maintenance authorization | `Authorized guard-maintenance scope`, `Protected paths`, `Operator authorization`, `Rollback boundary` | Required when protected guard/session paths or guard-maintenance scope are touched. |
| Scope firewall authorization | `Allowed paths`, `Forbidden paths`, `Operator authorization`, `Rollback boundary` | Required for scope firewall authorization docs. |
| Commit prompt rule | `Diff scope: PASS`, `Tests: PASS`, `Gates: PASS`, `Untracked unrelated: NONE`, `Forbidden touched paths: NONE` | Required before an agent asks whether to commit. |
| Finding-To-Governance defect classes | `WORKER_EXECUTION_ERROR`, `ORCHESTRATOR_PACKET_GAP`, `RULE_GAP`, `MACHINE_GATE_GAP`, `PHASE_GATE_PLACEMENT_GAP`, `OPERATOR_SCOPE_CLARITY_GAP`, `RUNTIME_SIGNAL_GAP` | `N/A_WITH_REASON` is a disposition, not a defect class. |
| Finding-To-Governance lanes | `GOVERNANCE_CONTROL_PLANE`, `RUNTIME_BEHAVIOR_LEARNING`, `PROVIDER_OUTPUT_LEARNING`, `COST_ECONOMICS_LEARNING`, `DOCUMENTATION_ONLY_LEARNING` | One lane is required for finding-bearing artifacts unless an explicit checker-accepted exception applies. |
| Finding-To-Governance dispositions | `RULE_EXISTS`, `RULE_ADDED`, `MACHINE_CHECK_ADDED`, `MACHINE_CHECK_CANDIDATE`, `PHASE_GATE_PLACEMENT_GAP`, `DESIGN_REVIEW_REQUIRED`, `RUNTIME_LEARNING_CANDIDATE`, `N/A_WITH_REASON`, `TEMPLATE_UPDATED`, `STANDARD_UPDATED`, `STANDARD_ADDED` | Repeated/systemic findings should prefer reusable-control dispositions. |
| Markdown structural headings | plain `## Purpose`, `## Scope` or `## Applies To`, `## Claim Boundary`, and other checker-required headings | Avoid numbered headings such as `## 1. Purpose` in new governed reference/review/work-order artifacts unless the checker explicitly allows that type. |
| Commit choreography helper | `scripts/cvf_commit_tranche.py` | Optional reviewer helper; commits staged artifact batch, writes active handoff parent marker, creates handoff-only sync commit, and reruns pre-closure. |
| Source Verification disposition | `ACCEPT`, `REJECT`, `BLOCKED_SOURCE_NOT_FOUND` | `REQUIRED` is not a ready/dispatch disposition. |
| Source Verification `Verified path or symbol` cell | field/path/symbol only, for example `rawMemoryReleased` | Do not include assignments or type annotations such as `rawMemoryReleased: false` or `canReinject: boolean`. |
| `WORKER_MUST_NOT_COMMIT` completion boundary | worker handoff/evaluation artifact only; completion review owner must be Reviewer/committer | `check_work_order_dispatch_quality.py` blocks dispatch packets that assign completion review to Worker under `WORKER_MUST_NOT_COMMIT`. |
| Machine Closure Package | work order, completion/reviewer artifact, roadmap, registry JSON/MD, external digest, loop interlock, session continuity | Required when those surfaces are applicable; use `N/A with reason` instead of omission. |

---

## Base Anchor Rules

| Anchor | Owner | Use |
| --- | --- | --- |
| `dispatchBaseHead` | Orchestrator | dispatch provenance only |
| `executionBaseHead` | Worker | worker edits, pending checks, component tests |
| `closureBaseHead` | Reviewer / committer | committed closure range |
| `handoffSyncParentHead` | Reviewer / committer | parent marker for handoff-sync-only commit |

Rules:

- Do not reuse `dispatchBaseHead` for closure after intervening commits.
- Do not use `--base HEAD --head HEAD` as closure evidence.
- Do not cite `HEAD~1` for a pending artifact.
- Do not claim clean worktree while untracked or modified artifacts remain.
- Do not claim `pre-closure` PASS for `WORKER_MUST_NOT_COMMIT` pending output.
- Do not mark a dependency-gated work order `DISPATCH_READY` while its
  Authority Chain or Source Verification rows still say `REQUIRED` or
  `<prior tranche> after closure`.

---

## Large-Scope Authorization Rule

Any commit that changes more than 40 files, performs archive cleanup, renames or
deletes governed artifacts, or changes protected governance/session files must
include the appropriate authorization review in that same commit.

The authorization review must name:

- scope and target;
- allowed paths or path families;
- reason the large scope is necessary;
- protected paths touched;
- claim boundary;
- finding-to-governance disposition when the batch responds to a repeated
  agent/process defect.

---

## CI2-T2 Binding

CI2-T2 must follow this standard exactly:

1. capture a fresh `executionBaseHead` at worker start;
2. avoid archive cleanup;
3. keep checker implementation, tests, and hook/autorun wiring inside CI2-T2
   allowed scope;
4. leave output pending if worker mode remains `WORKER_MUST_NOT_COMMIT`;
5. reviewer captures a fresh `closureBaseHead` before committing;
6. session sync and handoff sync are separate from the implementation batch.

If CI2-T2 encounters archive hygiene, stale session state, or unrelated
governance drift, it must stop and return that drift to orchestrator instead of
folding it into the checker implementation.

---

## Finding-To-Governance Learning Disposition

| Finding | Defect class | Learning lane | Disposition | Next control action |
| --- | --- | --- | --- | --- |
| CI2-T1 closure consumed excessive time due to mixed archive, closure, session, and handoff commits | PHASE_GATE_PLACEMENT_GAP | GOVERNANCE_CONTROL_PLANE | RULE_ADDED | Apply this standard to CI2-T2 and future work orders before implementation |
| Stale dispatch base expanded closure ranges into unrelated commits | PHASE_GATE_PLACEMENT_GAP | GOVERNANCE_CONTROL_PLANE | TEMPLATE_UPDATED | Work orders must distinguish dispatch, execution, closure, and handoff-sync bases |
| Repeated worker/orchestrator friction came from unstaged hook checks, hidden token requirements, `REQUIRED` placeholder misuse, session-sync coupling, and fail-fast cascades | ORCHESTRATOR_PACKET_GAP | GOVERNANCE_CONTROL_PLANE | STANDARD_UPDATED | Add gate cascade discipline and machine-token quick reference to this standard and the work-order template |
| Worker role was allowed to author completion review in `WORKER_MUST_NOT_COMMIT` packets | ORCHESTRATOR_PACKET_GAP | GOVERNANCE_CONTROL_PLANE | MACHINE_CHECK_ADDED | Dispatch-quality gate now blocks worker-owned completion reviews unless role/commit mode changes before dispatch |
| Commit closure remained too operator-heavy after rules were tightened | OPERATOR_SCOPE_CLARITY_GAP | GOVERNANCE_CONTROL_PLANE | STANDARD_UPDATED | Add optional staged-commit helper contract and `scripts/cvf_commit_tranche.py` |
| LPCI/CI closure findings kept recurring because worker prose did not update all downstream machine inputs | ORCHESTRATOR_PACKET_GAP | GOVERNANCE_CONTROL_PLANE | STANDARD_UPDATED | Add Machine Closure Package and external evidence digest rules to the choreography standard and work-order template |

---

## Claim Boundary

This standard is an operational commit-sequencing rule. The helper script is a
reviewer convenience for already-staged governed commits; it is not a worker
commit waiver. This standard does not change runtime behavior, authorize
public-sync, authorize LPCI runtime work, or guarantee semantic correctness of
any worker output.

---

## Public Export Disposition

DEFERRED_PRIVATE_ONLY

Reason: this standard governs private provenance repository workflow,
session-state continuity, archive hygiene, and internal guard operation.
