# CVF Structural Change Audit Guard

**Control ID:** `GC-019`
**Guard Class:** `CONTINUITY_AND_DECISION_GUARD`
**Status:** Active structural execution gate for major merges, physical moves, and boundary-changing consolidation.
**Applies to:** major structural changes, restructuring waves, humans, and AI agents proposing a merge, move, ownership transfer, or replacement package.
**Enforced by:** `governance/compat/check_foundational_guard_surfaces.py`, `docs/reference/CVF_GC019_STRUCTURAL_CHANGE_AUDIT_TEMPLATE.md`, `docs/reference/CVF_GC019_STRUCTURAL_CHANGE_REVIEW_TEMPLATE.md`

## Purpose

- prevent unsafe structural merges, physical moves, or boundary-changing consolidation
- require evidence, independent review, and explicit approval before execution
- keep conceptual overlap from being mistaken for proof that physical consolidation is better

## Rule

Before any major structural change is executed, the proposer must complete a structural audit packet and an independent review packet.

Execution must follow this exact order:

1. `Audit`
2. `Independent review`
3. `Explicit user / authority decision`
4. `Execution`

Default assumption:

- do not merge structurally on intuition
- do not move directories because of naming discomfort alone
- do not treat conceptual overlap as proof that physical consolidation is better

### When This Guard Is Mandatory

This guard is mandatory when a proposed change does at least one of the following:

- merges two or more extensions or modules into one new structural unit
- moves a module to a new physical root or new package lineage
- transfers primary ownership of a module between logical planes
- introduces a replacement package intended to supersede existing packages
- changes public entrypoints or import boundaries for active-path consumers
- restructures a subsystem in a way that changes rollback, dependency, or ownership behavior

This guard is usually not required for:

- documentation-only changes
- test-only changes
- internal refactors that do not change ownership, boundaries, entrypoints, or filesystem lineage

### Required Classification

Every structural proposal must classify itself as exactly one of:

| Change class | Meaning |
|---|---|
| `coordination package` | unify ownership and entry semantics while keeping source modules physically in place |
| `wrapper/re-export merge` | expose a new public entrypoint that composes existing modules with minimal physical movement |
| `physical merge` | physically move or consolidate source modules into a new structural unit |

If the class is `physical merge`, the burden of proof is highest.

### Required Audit Packet

Minimum required sections:

- proposal identity and scope
- source module profiles
- consumer analysis
- overlap classification
- active-path impact
- risk assessment
- recommended change class
- verification plan
- rollback plan

Standard template:

- `docs/reference/CVF_GC019_STRUCTURAL_CHANGE_AUDIT_TEMPLATE.md`

### Required Independent Review

A second packet must independently review the audit and answer:

- is the audit factually sound
- is the recommended change class correct
- is the risk framing complete
- should the user approve execution, request revision, or defer

The review must produce one of:

- `APPROVE`
- `REVISE`
- `DEFER`

Standard template:

- `docs/reference/CVF_GC019_STRUCTURAL_CHANGE_REVIEW_TEMPLATE.md`

### Decision Rule

Execution is allowed only when all of the following are true:

- a structural audit packet exists
- an independent review packet exists
- both artifacts are linked from the active roadmap or implementation packet
- the final decision is explicitly recorded as approved by the user or delegated authority

If any of these is missing, execution must stop.

### Default Guidance

Prefer `coordination package` when overlap is mostly conceptual or physical movement would create high rollback cost with little runtime gain.

Prefer `wrapper/re-export merge` when a unified public surface is valuable and consumer simplification is the main benefit.

Prefer `physical merge` only when implementation overlap is real, ownership ambiguity remains harmful after lighter options, and rollback stays bounded.

## Enforcement Surface

- repo-level enforcement runs through `governance/compat/check_foundational_guard_surfaces.py`
- this guard is primarily enforced through the audit and review packet sequence
- `GC-019` works in tandem with roadmap and packet review checkpoints before execution begins
- `GC-019` complements `GC-018`: one decides whether a wave should open, the other decides whether a structural move inside that wave is safe to execute

## Related Artifacts

- `docs/reference/CVF_GC019_STRUCTURAL_CHANGE_AUDIT_TEMPLATE.md`
- `docs/reference/CVF_GC019_STRUCTURAL_CHANGE_REVIEW_TEMPLATE.md`
- `docs/reference/CVF_GOVERNANCE_CONTROL_MATRIX.md`
- `docs/roadmaps/CVF_RESTRUCTURING_ROADMAP_2026-03-21.md`
- `governance/toolkit/05_OPERATION/CVF_DEPTH_AUDIT_GUARD.md`

## Final Clause

Structural change is not governed by elegance alone. It is governed by evidence, reversibility, and explicit approval.
