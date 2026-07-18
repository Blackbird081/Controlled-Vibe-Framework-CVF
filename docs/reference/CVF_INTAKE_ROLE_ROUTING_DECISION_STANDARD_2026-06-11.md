# CVF Intake Role Routing Decision Standard

Memory class: STANDARD

Status: canonical and machine-enforced standard

## Purpose

Define the required control step that converts raw non-coder intake into an
explicit orchestration route before a work order is dispatched.

CVF must not require the operator to know whether a task should use
multi-agent/multi-role execution or single-agent/multi-role execution. That
decision belongs to the orchestrator and must be recorded before build work.

## Scope / Target / Owner Boundary

Target:

- ready or dispatched work orders;
- roadmap-to-work-order dispatch packets;
- delegated worker instructions that derive from non-coder or vibe-coding
  intake.

Owner boundary:

- owned by the orchestrator before dispatch;
- enforced by governance dispatch-quality checks;
- not owned by the non-coder operator or worker implementer.

## Required Block

Ready or dispatched work orders must include:

- `## Intake Role Routing Decision`

The block must record:

- intake summary;
- scope classification;
- risk sensitivity, including public-sync, provider/live proof, secrets,
  legal/current-law, production, and readiness checks;
- selected role route;
- role separation basis;
- escalation condition.

## Canonical Route Modes

Allowed route modes:

- `SINGLE_AGENT_SINGLE_ROLE`
- `SINGLE_AGENT_MULTI_ROLE`
- `MULTI_AGENT_MULTI_ROLE`
- `MULTI_AGENT_SINGLE_ROLE`

Pending route modes are allowed only before dispatch:

- `HOLD_PENDING_OPERATOR_DECISION`
- `BLOCKED_PENDING_OPERATOR_DECISION`
- `PARKED_PENDING_OPERATOR_DECISION`

A ready or dispatched work order must not carry a pending route mode as its
final routing decision.

## Routing Defaults

Use `SINGLE_AGENT_MULTI_ROLE` only for small, bounded, low-risk control-plane
work where evidence and gates can separate duties. This route also requires
the Single-Agent Multi-Role Control Block.

Use `MULTI_AGENT_MULTI_ROLE` when the work is broad, runtime-impacting,
public-facing, live-provider-backed, secret-consuming, legal/current-law
sensitive, production/readiness-bearing, or otherwise benefits from separate
worker and reviewer posture.

Use `HOLD_*` or `DRAFT` when the orchestrator cannot classify the route from
available intake and source evidence.

## Enforcement

Machine guard:

- `governance/compat/check_work_order_dispatch_quality.py`

The guard rejects ready or dispatched work orders that omit the block, omit a
canonical route mode, carry a pending route mode, or omit required evidence
fields.

## Failure Modes

- Work order is ready or dispatched but lacks the routing block.
- The route is selected from chat memory without scope/risk evidence.
- Single-agent multi-role is selected without the required control block.
- Pending operator decision is recorded while the artifact is already ready.
- Orchestrator asks the non-coder operator to choose role topology without
  giving a source-backed routing recommendation.

## Claim Boundary

This standard improves orchestration routing discipline. It does not prove
independent review, semantic correctness, runtime role enforcement, provider
behavior, legal advice quality, production readiness, public readiness, or
that the selected route is optimal for every future task.

## Public Export Disposition

DEFERRED_PRIVATE_ONLY

Reason: this is an internal provenance control-plane standard. Public-facing
documentation can summarize the routing pattern later through a separate
public-sync batch if authorized.
