# CVF Single-Agent Multi-Role Control Standard

Memory class: STANDARD

Status: canonical and machine-enforced standard

## Purpose

Define the bounded control requirements when one agent performs more than one
CVF role in the same governed tranche.

This standard exists because single-agent multi-role execution is sometimes
practical for small, bounded, control-plane work, but it must not be treated as
equivalent to independent multi-agent review.

## Scope / Target / Owner Boundary

Target:

- ready or dispatched work orders that declare single-agent multi-role
  execution;
- role-assignment tables that assign the same actor to implementation and
  review or closure duties;
- control-plane, documentation, template, checker, and small bounded tranche
  work where operator time or worker availability makes delegation costly.

Owner boundary:

- owned by governance/control-plane workflow maintainers;
- does not authorize runtime role enforcement, autonomous worker pools,
  public readiness, production readiness, live-provider claims, or legal
  quality claims.

## Scope / Applies-To

Applies when a governed artifact:

- uses terms such as `single-agent multi-role`, `one agent multiple roles`,
  `Codex multi-role`, `Claude multi-role`, or `self-review`;
- assigns the same actor to worker/implementer and reviewer/committer duties;
- assigns the same actor to orchestrator, implementation, and review duties.

Does not apply to simple direct answers with no governed artifact changes.

## Protocol

A ready or dispatched work order that uses single-agent multi-role execution
must include:

- `## Single-Agent Multi-Role Control Block`

The block must record:

- role separation ledger;
- evidence basis independent of memory-only claims;
- self-review boundary that says independent review is not claimed;
- escalation conditions that stop the agent when risk, scope, public-sync,
  provider/live proof, secrets, destructive action, or claim boundary changes;
- gate sequence, including reviewer-fast where applicable and pre-closure on a
  real range before closure.

## Allowed Use

Single-agent multi-role execution may be used for:

- small control-plane checker hardening;
- bounded template/standard updates;
- narrowly scoped documentation correction;
- reviewer/committer closure after a no-commit worker return;
- session-sync-only updates.

## Forbidden Use Without Separate Authorization

Do not use single-agent multi-role execution as the sole review posture for:

- production or public-readiness claims;
- live governance behavior claims;
- provider behavior, cost, or quality claims;
- legal/current-law quality decisions;
- high-risk runtime changes;
- public-sync pushes;
- destructive, irreversible, or secret-consuming work.

## Enforcement

Machine guard:

- `governance/compat/check_work_order_dispatch_quality.py`

The guard detects explicit single-agent multi-role wording and role-assignment
tables where the same actor owns implementation plus review/closure roles. It
requires the control block before dispatch.

## Failure Modes

- Same actor owns worker and reviewer duties without the control block.
- Same actor owns orchestrator, implementation, and review duties without the
  control block.
- Control block omits evidence basis, self-review boundary, escalation
  conditions, or gate sequence.
- Artifact claims independent review from a single-agent multi-role pass.

## Claim Boundary

This standard improves role-separation evidence discipline. It does not prove
independent review, semantic correctness, runtime role enforcement, provider
behavior, legal advice quality, production readiness, or public readiness.

## Public Export Disposition

DEFERRED_PRIVATE_ONLY

Reason: this is an internal provenance control-plane standard. Public
documentation can summarize the pattern later through a separate public-sync
batch if authorized.
