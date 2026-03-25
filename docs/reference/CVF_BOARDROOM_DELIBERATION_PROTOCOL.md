# CVF Boardroom Deliberation Protocol

Memory class: POINTER_RECORD

Status: canonical runtime/control-plane reference for live multi-agent deliberation inside the AI Boardroom path.

## Purpose

- separate live boardroom deliberation from repository-level review documentation
- define the highest-priority multi-agent decision surface in the Control Plane
- keep `INTAKE -> AI Boardroom -> DESIGN` convergence truthful before execution planning continues

## Scope

This protocol applies to live Control Plane deliberation where multiple agent perspectives, clarifications, or decision rounds are used to choose the best governed path before the system proceeds into deeper design/orchestration work.

It is not the same thing as:

- `GC-027` canonical intake / rebuttal / decision-pack documentation for repo-level proposal evaluation
- post-hoc review packets written after architecture or roadmap discussion is already externalized into docs

## Current Runtime Anchors

Current code-backed boardroom anchors already exist here:

- `EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION/src/boardroom.contract.ts`
- `EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION/src/boardroom.round.contract.ts`
- `EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION/src/design.consumer.contract.ts`

Current decision outputs:

- `PROCEED`
- `AMEND_PLAN`
- `ESCALATE`
- `REJECT`

## Canonical Deliberation Sequence

The boardroom sequence should be read as:

1. receive intake-shaped design candidate
2. surface clarifications and unresolved ambiguity
3. apply multi-agent or multi-perspective review inside Boardroom
4. record rationale, warnings, and dissent-worthy concerns
5. converge on one governed decision
6. pass only the governed result into the downstream design/orchestration path

## Required Deliberation Properties

Boardroom deliberation should preserve all of the following:

- one clear decision outcome
- rationale for the outcome
- clarification state
- warning surface
- risk-aware escalation behavior
- bounded transition into downstream orchestration

If convergence is weak, the protocol should bias toward:

- `AMEND_PLAN`
- `ESCALATE`
- or `REJECT`

instead of allowing silent weak-consensus drift into execution.

## Relationship To GC-027

`GC-027` governs the canonical documentation chain for proposal evaluation in `docs/reviews/`.

This protocol governs the live decision surface inside the Control Plane.

In short:

- `GC-027` = repo/docs convergence
- `Boardroom Deliberation Protocol` = runtime/control-plane convergence

They are complementary, but they are not interchangeable.

## Architectural Priority

Boardroom deliberation is the highest-priority multi-agent decision surface in the current CVF architecture because it sits above downstream design/orchestration and therefore shapes what the system is allowed to build next.

This means Boardroom quality matters more than later rebuttal formatting alone.

## Current Governance Posture

This protocol is canonical reference truth now.

Repo-level compatibility enforcement for `GC-027` exists today.
Dedicated runtime enforcement expansion for boardroom deliberation may be introduced later, but this document should already be treated as the canonical scope boundary.

## Related References

- `docs/reference/CVF_MASTER_ARCHITECTURE_WHITEPAPER.md`
- `docs/reference/CVF_SESSION_GOVERNANCE_BOOTSTRAP.md`
- `docs/reference/CVF_MULTI_AGENT_INTAKE_REVIEW_TEMPLATE.md`
- `docs/reference/CVF_MULTI_AGENT_REBUTTAL_TEMPLATE.md`
- `docs/reference/CVF_MULTI_AGENT_DECISION_PACK_TEMPLATE.md`
- `governance/toolkit/05_OPERATION/CVF_MULTI_AGENT_REVIEW_DOC_GUARD.md`
