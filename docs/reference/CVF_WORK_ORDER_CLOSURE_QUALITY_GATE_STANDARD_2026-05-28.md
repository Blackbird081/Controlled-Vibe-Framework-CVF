# CVF Work Order Closure Quality Gate Standard

Memory class: POINTER_RECORD

Status: ACTIVE_STANDARD

docType: reference

Date: 2026-05-28

Last updated: 2026-06-07

Authority: restored active canonical path plus CI/LPCI closure-friction learning
and reviewer-fast gate hardening

Historical full packet:

`docs/reference/archive/CVF_WORK_ORDER_CLOSURE_QUALITY_GATE_STANDARD_2026-05-28.md`

---

## Purpose

Prevent governed work from being called closed when the evidence chain exists
only in prose or chat memory.

Closure means the transition from authority to artifact to machine-readable
evidence to continuity state is reproducible from repository files and recorded
commands.

---

## Scope

This standard applies to every active CVF work order, roadmap task, completion
review, corpus scan, classification packet, public-sync batch, delegated worker
execution, and reviewer/committer closure.

Archive-qualified artifacts under `archive/` are historical evidence. They are
not active closure claims unless a later governed batch explicitly reopens
them.

---

## Rule

No artifact may be marked `CLOSED`, `CLOSED_PASS`,
`CLOSED_PASS_BOUNDED`, `DISPATCH_READY` for a dependency-released packet, or an
equivalent final state unless the applicable closure gates below are satisfied:

1. roadmap-to-work-order trace matrix;
2. closure diff and allowed-scope check;
3. command/path/receipt-backed claim integrity;
4. explicit fail-condition scan;
5. checklist finalization;
6. continuity sync;
7. committed-range autorun `pre-closure`;
8. public export disposition when applicable;
9. corpus completeness and knowledge reconciliation when applicable;
10. worker autonomy and no-question rule for delegated packets;
11. self-reported gate evidence consistency;
12. work-order fulfillment manifest for runtime/source work;
13. machine closure package for downstream loop inputs;
14. closure packaging preflight before full pre-closure claim.

Allowed-scope machine-gate failures are mandatory remediation, not operator
preference questions. Escalate only when remediation would exceed Allowed
scope, change risk or claim boundary, release a `HOLD_*` prerequisite, run
live/provider proof, use secrets/quota, public-sync, touch forbidden paths, or
perform destructive/irreversible actions.

---

## Required Closure Markers

This active standard intentionally exposes the exact marker names used by
dispatch-quality and autorun wiring. Work orders and closure packets may add
detail, but must not rename these concepts away from machine-readable form.

### Roadmap-To-Work-Order Trace Matrix

Map every roadmap requirement to a work-order instruction, output artifact,
verification command, and status.

### Negative And Fail-Condition Scan

Record the missing-field, stale-source, public/provenance, forbidden-runtime,
status-token, source-symbol, and checklist-residue conditions that would block
closure.

### Mandatory Gate-Failure Remediation Protocol

Repair allowed-scope guard failures and rerun the failed gate before handoff.
Do not ask the operator whether to fix owned machine-gate residue.

### Worker Autonomy / No-Question Rule

Ready delegated packets must authorize non-destructive reads, checks, routine
format fixes, required evidence-block completion, and gate reruns inside
Allowed scope.

### Pending Artifact Evidence Finality

Pending worker artifacts must state pending status honestly and must not claim
clean worktree, committed-range proof, or final pre-closure evidence before
reviewer/committer disposition.

### Worker Pending-Return Gate

For `WORKER_MUST_NOT_COMMIT`, pending review is not a gate waiver. The worker
return must include `executionBaseHead`, actual `git status --short`, relevant
working-tree-aware component-gate results, and explicit disposition for every
failure before reviewer / committer closure.

### Reviewer Closure Conversion

Every `WORKER_MUST_NOT_COMMIT` work order that reaches ready, dispatch, or
closed-equivalent status must define reviewer-owned conversion from pending
worker return to committed closure before dispatch.

Required fields:

- `completionReviewPath`;
- `reviewerOwnedClosurePaths`;
- allowed pending worker-return status tokens;
- forbidden closed-equivalent residue tokens;
- predecessor closure fact source.

Rules:

- worker returns may be `COMPLETE_PENDING_REVIEW`,
  `IMPLEMENTATION_COMPLETE_PENDING_REVIEW`, `DRAFT`, or `HOLD_*`;
- reviewer completion artifacts and closed work orders must not retain
  `COMPLETE_PENDING_REVIEW`, `NOT_EXECUTED_YET`, `WORKER_RETURNS_PENDING`,
  `PRE_CLOSURE_NOT_RUN`, `FAIL_EXPECTED_PENDING_FINALITY`, or `DISPATCHED` as
  current final status;
- the reviewer must create or update the conventional `_COMPLETION_` artifact
  unless the work order records `N/A with reason`;
- mutable `ACTIVE_SESSION_STATE.json` values are continuity evidence, not
  stable predecessor-closure invariants. Use stable completion/review artifacts
  for predecessor closure facts.

### Commit Mode And Base-Anchor Lifecycle

Separate `dispatchBaseHead`, `executionBaseHead`, `closureBaseHead`, and
handoff-sync parent evidence. `--base HEAD --head HEAD` is not closure proof
for changed governed artifacts.

Dispatch-ready work orders must set `dispatchBaseHead` to a real git commit
hash before worker execution. Placeholder prose such as worker-owned capture,
unknown, or later confirmation is a dispatch defect.

### Dispatch Packet Authoring Learning Promotion

Dispatch packet defects found during reviewer cleanup are reusable
governance/control-plane learning signals when they affect source verification,
base anchors, runtime freshness evidence, `Evidence Reuse And Encoding Plan`,
fulfillment manifests, or machine-readable status. The closure batch must
promote the pattern to a template, standard, or machine check when feasible;
otherwise record `N/A with reason`.

### Protected-Path Authorization Carrier

A dispatch/ready work order that authorizes the worker to create or modify a
protected path -- a `governance/compat/*.py` checker, any `CVF_SESSION/**` JSON
state file, `CVF_SESSION_MEMORY.md`, or an `AGENT_HANDOFF*.md` handoff -- must
carry a complete `Core Guard Self-Protection Authorization` block. The block
must use the same vocabulary the core-guard self-protection gate enforces:
the `Core Guard Self-Protection Authorization` heading plus
`Authorized guard-maintenance scope`, `Protected paths` (naming every
authorized protected path), `Operator authorization`, and `Rollback boundary`.

Authorizing the protected path in scope without the carrier is the
ORCHESTRATOR_PACKET_GAP that forces the worker to synthesize the authorization
mid-task. This is enforced at dispatch by
`check_work_order_dispatch_quality.py`; the carrier vocabulary is the single
source of truth owned by `check_core_guard_self_protection.py`, so dispatch and
closure share one authorization language. See work-order template section 7A.

### Self-Reported Gate Evidence Consistency

Recorded gate results must match the current artifact and handoff state. After
rerun, update the evidence table before returning or committing the artifact.

### Near-Threshold Owner Maintainability Plan

When a touched governed owner file is near its hard threshold, include split,
rotation, archive, or shrink evidence in the same governed batch.

### Work-Order Fulfillment Manifest

Runtime/source work must declare required artifacts, forbidden paths, and
forbidden filesystem state before implementation.

### Closure Packaging Preflight

Before claiming full `pre-closure`, run the early closure-packaging preflight
or rely on the autorun wrapper that runs it first. The preflight catches
recurring packaging defects while the fix is still small:

- closed-equivalent artifacts retaining stale dispatch, hold, or pending
  pre-closure language;
- corpus completeness blocks using git-derived or bare `rg --files`
  enumeration instead of filesystem-backed enumeration such as
  `rg --files --hidden --no-ignore ...`;
- closure diff / changed-file sections citing paths that are not present in
  the changed range;
- protected guard/session files changed without a checker-recognized
  `Core Guard Self-Protection Authorization` artifact.

### Reviewer Fast Gate

When a no-commit worker returns staged or uncommitted governed artifacts, the
reviewer / committer should run the focused reviewer gate before attempting a
full commit:

`python governance/compat/run_local_governance_hook_chain.py --hook reviewer-fast`

This gate is an early defect filter only. It does not replace committed-range
`pre-closure`, `pre-push`, or the full hook chain. It exists to catch common
reviewer-return defects while the fix is still small: closure residue,
source/registry coverage, public export disposition, machine closure package
rows, finding-learning disposition, and active session continuity.

`reviewer-fast`, `pre-commit`, and `pre-push` local hook modes run in parallel
by default for latency control. Use `--serial` for order-dependent debugging.

### Current Runtime Freshness Verification

Absence, missing, stale, hardcoded, per-role-only, or intentional non-use
runtime/source claims must be backed by current source searches and owner-path
evidence. This includes phrases such as "no provider/API key use", "no
provider calls", "no runtime/source edits", and "no registry update" when a
current owner surface exists.

### Negative Search And Collision Discipline

Any artifact that claims a token, field, enum, schema key, failure token, or
config key is `NOT FOUND`, or uses `BLOCKED_SOURCE_NOT_FOUND`, must include
negative-search evidence before dispatch or closure. The evidence must record
exact search roots, exact command or structured query, coverage across source,
tests, docs, JSON, and external evidence when applicable, same-token collision
results, and the absent-versus-collision disposition.

If the same token appears elsewhere with a different meaning, record the
collision or non-authoritative occurrence and explain why it is not binding.
Do not close a bare `NOT FOUND` claim when the repo contains a same-token
occurrence.

### Intake Role Routing Decision

Ready or dispatched work orders must include `## Intake Role Routing Decision`
before implementation. The orchestrator must convert raw non-coder intake into
a role-routing decision with intake summary, scope classification, risk
sensitivity, selected route mode, role separation basis, and escalation
condition.

Allowed route modes are `SINGLE_AGENT_SINGLE_ROLE`,
`SINGLE_AGENT_MULTI_ROLE`, `MULTI_AGENT_MULTI_ROLE`, and
`MULTI_AGENT_SINGLE_ROLE`. If routing is unresolved, the work order must stay
`HOLD_*` or `DRAFT`; a dispatch-ready artifact must not carry a pending or
blocked role route as its final decision.

### Single-Agent Multi-Role Control Block

Single-agent multi-role execution is allowed only as bounded evidence
discipline, not as independent review. Ready or dispatched work orders that
assign the same actor to implementation and review/closure roles must include
the control block defined in
`docs/reference/CVF_SINGLE_AGENT_MULTI_ROLE_CONTROL_STANDARD_2026-06-11.md`.

### ACCEPT_AS_OWNER_MAP coverage

Accepted concepts from a source audit must be represented as completed,
deferred, rejected, or out-of-scope with reason. Scope rejection is not source
rejection.

---

## Machine Closure Package

Any closure that feeds another CVF loop must record the downstream input
surfaces explicitly.

Required package:

| Closure item | Required artifact/path | Machine-readable evidence | Final status |
| --- | --- | --- | --- |
| Work order status | `docs/work_orders/<work-order>.md` | final status, no stale ready/pending residue, closure anchor policy | `<PASS/BLOCKED/N/A with reason>` |
| Completion or reviewer artifact | `docs/reviews/<completion>.md` or `N/A with reason` | final disposition, changed files, claim boundary, gate evidence | `<PASS/BLOCKED/N/A with reason>` |
| Roadmap state | `docs/roadmaps/<roadmap>.md` or `N/A with reason` | tranche row final state and next dependency state | `<PASS/BLOCKED/N/A with reason>` |
| Registry JSON | `docs/corpus-intelligence/CVF_CORPUS_SCAN_REGISTRY.json` or `N/A with reason` | scan/readiness/gap fields when corpus state changes | `<PASS/BLOCKED/N/A with reason>` |
| Registry Markdown | `docs/corpus-intelligence/CVF_CORPUS_SCAN_REGISTRY.md` or `N/A with reason` | operator/reviewer quick lookup when GC-051 state changes | `<PASS/BLOCKED/N/A with reason>` |
| External evidence digest | repo-local digest section or artifact | external path, schema/version, record count, hash, generated time, privacy boundary | `<PASS/BLOCKED/N/A with reason>` |
| System loop interlock | `docs/reference/CVF_SYSTEM_LOOP_INTERLOCK_REGISTRY_*.json` or `N/A with reason` | upstream output, downstream input, learning/finding route, mutation boundary | `<PASS/BLOCKED/N/A with reason>` |
| Session continuity | `CVF_SESSION_MEMORY.md`, `CVF_SESSION/ACTIVE_SESSION_STATE.json`, active handoff | current mode, next allowed move, handoff HEAD or accepted parent marker | `<PASS/BLOCKED/N/A with reason>` |

Rules:

- External/local workspace paths are evidence inputs, not canonical Source
  Verification source files. Record their digest in the repository before a
  later packet cites them as evidence.
- `WORKER_MUST_NOT_COMMIT` worker returns must include the Worker
  Pending-Return Gate evidence from the work-order template or an equivalent
  table. The reviewer / committer owns committed-range `pre-closure`, but the
  worker still owns repairable component-gate defects inside Allowed scope.
- `WORKER_MUST_NOT_COMMIT` work orders must include Reviewer Closure
  Conversion fields before dispatch so reviewer-owned closure paths and
  `_COMPLETION_` artifacts are known before implementation begins.
- Corpus scan, classification, readiness, or gap state changes must update
  both GC-051 registry surfaces when applicable. JSON is the machine input;
  Markdown is the reviewer/operator lookup.
- Machine Closure Package row names are exact machine tokens. Use
  `Registry JSON` and `Registry Markdown`; renamed variants are not accepted.
- `Final status` values must be checker-accepted: `PASS`, `BLOCKED`, or
  `N/A with reason`. Do not use `N/A_WITH_REASON` in the final status cell.
- If corpus/search/classification/readiness text appears in a closed-equivalent
  artifact, `Registry JSON` and `Registry Markdown` must be `PASS` or
  `BLOCKED with reason`, not `N/A with reason`.
- If `External evidence digest` is `PASS` and references external evidence,
  the row or an External Artifact Hash Manifest must include a `sha256:<hex>`
  digest.
- Parent roadmaps that stay open for later child lanes should use child-lane
  status tokens such as `EX_T1_PASS_BOUNDED`, not top-level `CLOSED` wording.
  Reserve `CLOSED_PASS_BOUNDED` for fully closed roadmaps or child closure
  artifacts.
- Closed-equivalent artifacts must not retain stale `DISPATCH_READY`,
  `READY_WITH_CONDITIONS`, `NOT_EXECUTED_YET`, `PRE_CLOSURE_NOT_RUN`, unchecked
  required checklist items, or placeholder dependency rows except in explicit
  pending-review worker handoffs.
- Finding-bearing artifacts must use checker-accepted
  Finding-To-Governance defect classes. `EVIDENCE_GAP` is not a defect class;
  `N/A_WITH_REASON` is a disposition, not a defect class.

---

## Commit Choreography

Governed closure follows:

`docs/reference/CVF_TRANCHE_COMMIT_CHOREOGRAPHY_STANDARD_2026-06-03.md`

Required principles:

- stage the intended file set before running hook-chain or commit validation;
- use `executionBaseHead` for pending worker validation and `closureBaseHead`
  for reviewer/committer closure;
- never use `--base HEAD --head HEAD` as evidence for changed governed
  artifacts;
- split archive hygiene, artifact implementation, closure transition, session
  sync, and handoff-only sync unless a work order explicitly owns the combined
  scope;
- after material or session commits, create a dedicated handoff-only sync
  commit when active handoff HEAD proof requires it.

---

## Enforcement

This standard is enforced by work-order authors, workers, reviewers,
committers, local governance hooks, and autorun gates. Relevant machine checks
include:

- `governance/compat/check_work_order_dispatch_quality.py`
- `governance/compat/check_closure_packaging_preflight.py`
- `governance/compat/check_machine_closure_package.py`
- `governance/compat/check_markdown_structural_completeness.py`
- `governance/compat/check_active_session_state.py`
- `governance/compat/check_finding_to_governance_learning.py`
- `governance/compat/check_corpus_scan_registry.py`
- `governance/compat/run_agent_autorun_workflow_gate.py`

Manual compliance is mandatory even when a particular machine check has not
yet learned the defect.

---

## Claim Boundary

This standard defines closure evidence discipline. It does not prove semantic
correctness, product readiness, public export, legal advice quality, runtime
integration, or live governance behavior unless those claims are backed by
their own required standards and proof commands.

---

## Public Export Disposition

DEFERRED_PRIVATE_ONLY

Reason: this is an internal provenance workflow and closure-evidence standard.
