# CVF Agent Work Order Finality And Review Conversion Addendum

Memory class: STANDARD_ADDENDUM

Status: active extracted rule surface for the canonical work-order template.

## Purpose

This addendum owns detailed finality, commit-mode, pending-return, and reviewer
conversion rules extracted from:

`docs/reference/CVF_AGENT_WORK_ORDER_TEMPLATE_2026-05-19.md`

The extraction is a GC-023 maintainability action. The canonical template remains
the front door, and this addendum carries detailed rules that were making that
front door too large.

## Scope

Apply this addendum when a work order:

- uses `WORKER_MAY_COMMIT` or `WORKER_MUST_NOT_COMMIT`;
- receives staged, modified, or untracked pending worker artifacts;
- releases a prerequisite from `HOLD_*`, `DRAFT`, or `PROPOSED`;
- assigns reviewer-owned closure after a no-commit worker return;
- records dispatch, execution, or closure base anchors.

## Commit Mode And Base-Anchor Lifecycle

Do not freeze one base hash into every phase as if dispatch, implementation,
pending review, and committed closure were the same transition.

Record these anchors separately:

| Anchor | Captured by | When | Used for |
|---|---|---|---|
| `dispatchBaseHead` | Orchestrator | immediately before dispatch | audit history and dispatch packet provenance |
| `executionBaseHead` | Worker | immediately before material implementation | working-tree-aware pending-artifact validation |
| `closureBaseHead` | Reviewer / committer | before the closure commit or from the approved tranche base | non-empty committed-range `pre-closure` validation |

Rules:

- the worker must capture `executionBaseHead` with
  `git rev-parse --short HEAD` before edits;
- a stale `dispatchBaseHead` remains useful audit evidence but must not be
  copied into worker gate commands when later commits changed HEAD;
- pending-artifact checks use `executionBaseHead` and working-tree-aware
  component gates;
- committed closure checks use `closureBaseHead..HEAD` after commit and must
  include the reviewed artifact changes;
- `--base HEAD --head HEAD` is never valid closure evidence.

## Dependency Release And Next-Work-Order Refresh

Canonical standard:

`docs/reference/CVF_WORK_ORDER_DEPENDENCY_RELEASE_EVIDENCE_STANDARD_2026-06-03.md`

If a later work order is drafted before its prerequisite tranche closes, keep it
in `HOLD_*` status until the prerequisite closure evidence exists.

Before changing that later work order to `READY`, `DISPATCH_READY`, or
`DISPATCHED`, the orchestrator/reviewer must refresh the packet in the same
release batch:

- replace placeholder prerequisite rows such as `after closure` or
  `Disposition: REQUIRED` with source-backed `ACCEPT` rows;
- cite the closed artifact path and closure commit, not only the tranche name;
- set `dispatchBaseHead` to the actual prerequisite closure commit or current
  dispatch anchor;
- set `executionBaseHead` to `WORKER_MUST_CAPTURE_AT_START` unless the worker
  already captured a fresh execution anchor;
- keep `closureBaseHead` as `REVIEWER_MUST_CAPTURE_AT_CLOSURE` until reviewer
  closure;
- rerun `check_work_order_dispatch_quality.py` and pre-dispatch autorun gate on
  the release range.

A ready/dispatch work order with unresolved prerequisite language is invalid.
The worker must not be asked to infer which prior artifact satisfied the HOLD.

## Two-Stage Handoff Finality

Choose one explicit commit mode before dispatch:

| Commit mode | Worker boundary | Reviewer / committer boundary |
|---|---|---|
| `WORKER_MAY_COMMIT` | worker may commit only after owned diff, tests, and gates are clean | reviewer verifies committed range |
| `WORKER_MUST_NOT_COMMIT` | worker returns pending artifacts after working-tree-aware component gates | reviewer / committer approves disposition, commits, then runs committed-range `pre-closure` |

For `WORKER_MUST_NOT_COMMIT` work orders:

- the worker handoff status must remain `COMPLETE_PENDING_REVIEW`,
  `IMPLEMENTATION_COMPLETE_PENDING_REVIEW`, `DRAFT`, or `HOLD_*`;
- the worker must not claim `pre-closure` PASS;
- the worker may record `PRE_CLOSURE_NOT_RUN_PENDING_COMMIT` or
  `FAIL_EXPECTED_PENDING_FINALITY` only with the explicit statement that
  committed closure remains reviewer / committer work;
- component gates must still be run and repaired inside Allowed scope;
- the worker must return a handoff/evaluation artifact that lists actual
  pending files from `git status --short`;
- the completion review is reviewer / committer owned unless the work order
  explicitly changes role and commit mode before dispatch;
- the reviewer / committer must run `pre-closure` after the commit with a
  non-empty committed range before any closed-equivalent claim.

## Worker Pending-Return Gate

`WORKER_MUST_NOT_COMMIT` is a commit-boundary rule, not a quality-gate waiver.
Before returning pending artifacts, the worker must run and record the
working-tree-aware component gates that apply to the changed files. Repairable
failures inside Allowed scope must be fixed before return.

Minimum pending-return gate table:

| Gate | Applies when | Command or evidence | Required pending-return result |
|---|---|---|---|
| Execution anchor | every worker run | `git rev-parse --short HEAD` before edits | `executionBaseHead=<hash>` |
| Pending worktree | every `WORKER_MUST_NOT_COMMIT` return | `git status --short` | actual pending file list, not clean |
| Markdown structural completeness | changed governed markdown, reference, roadmap, work order, review, handoff, or registry markdown | `python governance/compat/check_markdown_structural_completeness.py --base <executionBaseHead> --head HEAD --enforce` | `PASS`, or `BLOCKED` with out-of-scope reason |
| Finding-To-Governance learning | any changed artifact records findings, defects, known issues, risks, or quality gaps | `python governance/compat/check_finding_to_governance_learning.py --base <executionBaseHead> --head HEAD --enforce` | `PASS`, or `BLOCKED` with out-of-scope reason |
| Machine Closure Package | any changed artifact uses closed-equivalent, readiness, handoff-complete, or downstream-loop language | `python governance/compat/check_machine_closure_package.py --base <executionBaseHead> --head HEAD --enforce` | `PASS`, `N/A with reason`, or `BLOCKED` |
| Dispatch quality | any changed work order, roadmap-derived packet, ready/dispatch packet, or closed-equivalent work-order packet | `python governance/compat/check_work_order_dispatch_quality.py --base <executionBaseHead> --head HEAD --enforce` | `PASS`, or `BLOCKED` with return action |
| Domain gates | any domain-specific guard named by this work order | `<command>` | `PASS`, `N/A with reason`, or `BLOCKED` |

If a component gate reports only expected pending-finality residue caused by
uncommitted artifacts, record `FAIL_EXPECTED_PENDING_FINALITY` and the exact
reason. Do not record that result as closure PASS.

The startup acknowledgment in a worker return must mirror the active session
state and active handoff. `parked checkpoint=none` is valid only when those
front doors record no parked checkpoint.

Worker returns must satisfy the structural, pseudo-path, evidence-reuse, and
encoding rules in the addendum plus:

`docs/reference/CVF_PRIOR_VERIFICATION_REUSE_AND_UNICODE_EVIDENCE_HANDLING_STANDARD_2026-06-11.md`

## Reviewer Closure Conversion Block

Every `WORKER_MUST_NOT_COMMIT` work order that is `READY`, `DISPATCH_READY`,
`DISPATCHED`, or equivalent must include this block before dispatch. It defines
the reviewer-owned path from pending worker return to committed closure.

Required fields:

```text
## Reviewer Closure Conversion Block

completionReviewPath: `docs/reviews/<CVF_*_COMPLETION_YYYY-MM-DD.md>`
reviewerOwnedClosurePaths:
- `<work order path>`
- `<worker return or evaluation path>`
- `<completionReviewPath>`
- `<roadmap, registry, session, or handoff paths if reviewer closure may touch them>`
pendingStatusTokensAllowedBeforeReview: COMPLETE_PENDING_REVIEW, IMPLEMENTATION_COMPLETE_PENDING_REVIEW, DRAFT, HOLD_*
forbiddenClosedEquivalentResidue: COMPLETE_PENDING_REVIEW, NOT_EXECUTED_YET, WORKER_RETURNS_PENDING, PRE_CLOSURE_NOT_RUN, FAIL_EXPECTED_PENDING_FINALITY, DISPATCHED as current status
predecessorClosureFactSource: stable completion/review artifact, not mutable ACTIVE_SESSION_STATE.json currentMode
```

Rules:

- worker return artifacts may use pending status honestly, but the reviewer
  completion artifact and final closed work order must not retain pending
  tokens as current status or final gate results;
- the reviewer must create or update the conventional `_COMPLETION_` artifact
  unless the block records `N/A with reason`;
- `ACTIVE_SESSION_STATE.json` may be startup context and continuity evidence,
  but it must not be source-verified as the sole closure invariant for a prior
  tranche; cite stable completion/review artifacts for predecessor closure
  facts;
- reviewer-owned closure paths are Allowed scope for the reviewer/committer
  only. A worker must not edit those paths unless the work order changes commit
  mode or explicitly assigns that path to the worker.

## Claim Boundary

This addendum defines authoring and closure discipline. It does not prove worker
implementation quality, output quality, runtime governance behavior, provider
behavior, public readiness, production readiness, or release readiness.
