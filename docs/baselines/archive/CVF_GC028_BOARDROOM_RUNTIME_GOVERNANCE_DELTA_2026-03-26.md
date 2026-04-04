# CVF GC-028 Boardroom Runtime Governance Delta (2026-03-26)

Memory class: SUMMARY_RECORD
Status: canonical receipt for promoting `AI Boardroom` from a scope note into a governed runtime control with a dedicated guard, templates, compatibility gate, and runtime transition owner.

## Purpose

- establish `GC-028` as the canonical boardroom runtime governance rule
- separate live boardroom convergence from `GC-027` repo-only proposal convergence
- ensure downstream orchestration is blocked unless boardroom truthfully reaches `PROCEED`

## What Changed

CVF now has a dedicated boardroom runtime control:

- guard: `governance/toolkit/05_OPERATION/CVF_BOARDROOM_RUNTIME_GUARD.md`
- runtime protocol: `docs/reference/CVF_BOARDROOM_DELIBERATION_PROTOCOL.md`
- canonical templates:
  - `docs/reference/CVF_BOARDROOM_SESSION_PACKET_TEMPLATE.md`
  - `docs/reference/CVF_BOARDROOM_DISSENT_LOG_TEMPLATE.md`
  - `docs/reference/CVF_BOARDROOM_TRANSITION_DECISION_TEMPLATE.md`
- compat gate: `governance/compat/check_boardroom_runtime_governance_compat.py`

This delta also upgrades runtime ownership by tying boardroom continuation to:

- `EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION/src/boardroom.transition.gate.contract.ts`

## Canonical Truth

- `GC-027` remains the canonical repo/docs chain for proposal evaluation and roadmap intake.
- `GC-028` is now the canonical live boardroom runtime rule for `INTAKE -> Boardroom -> downstream allowed stage`.
- `GC-028` is higher criticality than `GC-027` because it sits on the live decision surface above downstream design/orchestration.

## Operational Effect

From this delta onward:

- live boardroom work should route through `GC-028`
- unresolved `AMEND_PLAN`, `ESCALATE`, or `REJECT` outcomes should keep downstream orchestration blocked
- canonical boardroom packets should use the new `GC-028` templates when persisted to `docs/reviews/`
