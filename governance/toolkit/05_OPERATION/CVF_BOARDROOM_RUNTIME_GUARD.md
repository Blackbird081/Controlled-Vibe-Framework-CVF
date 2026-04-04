# CVF Boardroom Runtime Guard

**Control ID:** `GC-028`
Control ID: `GC-028`
**Guard Class:** `CONTINUITY_AND_DECISION_GUARD`
**Status:** Active runtime deliberation and transition rule for `INTAKE -> AI Boardroom -> DESIGN/ORCHESTRATION`.
**Applies to:** live boardroom deliberation, dissent handling, and runtime transition truth inside the Control Plane.
**Enforced by:** `governance/compat/check_boardroom_runtime_governance_compat.py`

## Purpose

- give `AI Boardroom` its own high-criticality governance control
- make live boardroom deliberation truthfully stronger than repo-only review formatting
- block downstream orchestration when boardroom convergence is weak, unresolved, or rejected

## Rule

Whenever live multi-agent deliberation is used inside the Control Plane to decide what governed path CVF should take next, the work must pass through the canonical boardroom runtime sequence:

1. intake candidate enters boardroom scope
2. clarifications, warnings, and dissent are surfaced
3. one canonical boardroom decision is produced
4. one transition gate determines whether downstream work may proceed

No downstream orchestration may proceed until the transition gate returns `PROCEED_TO_ORCHESTRATION`.

### Scope

`GC-028` governs live boardroom runtime behavior and the canonical packet shapes used to record boardroom sessions when they are externalized into repository evidence.

This control is for:

- live intake debate and clarification inside the Control Plane
- boardroom convergence before downstream design or orchestration
- dissent handling when multiple agent perspectives disagree materially
- transition truth between `Boardroom` and the next allowed stage

This control does not replace:

- `GC-027` canonical repo-level intake, rebuttal, and decision-pack evaluation
- `GC-018` continuation authorization
- `GC-019` structural audit for physical merges or ownership transfer

### Canonical Sequence

The governed boardroom sequence is:

`INTAKE -> BOARDROOM SESSION -> DISSENT CHECK -> TRANSITION DECISION -> next allowed stage only`

Required outputs:

- one `BOARDROOM_SESSION_PACKET` when a live boardroom decision is externalized into docs
- one `BOARDROOM_DISSENT_LOG` when material disagreement remains active
- one `BOARDROOM_TRANSITION_DECISION` when the next allowed stage must be made explicit

### Runtime Transition Contract

The primary runtime owner of `GC-028` is the boardroom transition gate:

- `EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION/src/boardroom.transition.gate.contract.ts`

The boardroom transition gate must map boardroom decisions as follows:

- `PROCEED -> PROCEED_TO_ORCHESTRATION`
- `AMEND_PLAN -> RETURN_TO_DESIGN`
- `ESCALATE -> ESCALATE_FOR_REVIEW`
- `REJECT -> STOP_EXECUTION`

Any result other than `PROCEED_TO_ORCHESTRATION` must keep downstream orchestration blocked.

### Required Session Packet Content

Every canonical `BOARDROOM_SESSION_PACKET` must include:

- intake candidate summary
- participants and roles
- clarification state
- argument and evidence summary
- dissent status
- final boardroom decision
- transition directive
- evidence ledger

### Required Dissent Handling

When material disagreement remains, the canonical `BOARDROOM_DISSENT_LOG` must record:

- dissent claim
- supporting evidence
- risk if the dissent is ignored
- current resolution status

Silently dropping dissent is not allowed.

### Required Transition Decision Content

Every canonical `BOARDROOM_TRANSITION_DECISION` must state:

- dominant decision
- transition gate result
- allowed next step
- blocking conditions
- evidence ledger

## Enforcement Surface

- this guard
- `docs/reference/CVF_BOARDROOM_DELIBERATION_PROTOCOL.md`
- canonical boardroom packet templates
- `governance/compat/check_boardroom_runtime_governance_compat.py`
- the runtime gate in `EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION/src/boardroom.transition.gate.contract.ts`

`GC-028` is higher criticality than repo-only proposal formatting because it sits on the live path that determines what the system may build next.

## Related Artifacts

- `docs/reference/CVF_BOARDROOM_DELIBERATION_PROTOCOL.md`
- `docs/reference/CVF_BOARDROOM_SESSION_PACKET_TEMPLATE.md`
- `docs/reference/CVF_BOARDROOM_DISSENT_LOG_TEMPLATE.md`
- `docs/reference/CVF_BOARDROOM_TRANSITION_DECISION_TEMPLATE.md`
- `governance/compat/check_boardroom_runtime_governance_compat.py`
- `EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION/src/boardroom.transition.gate.contract.ts`

## Final Clause

If boardroom convergence is weak, unresolved, or rejected, downstream orchestration has not earned the right to proceed.
