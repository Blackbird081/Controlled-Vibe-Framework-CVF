# CVF STRUCTURAL CHANGE AUDIT GUARD

**Type:** Governance Operation Guard  
**Applies to:** Major structural changes, restructuring waves, humans, and AI agents  
**Purpose:** Prevent unsafe structural merges, physical moves, or boundary-changing consolidation by requiring evidence, cross-check review, and explicit approval before execution.

---

## 1. Mandatory Rule

Before any major structural change is executed, the proposer MUST complete a structural audit packet and an independent review packet.

Execution MUST follow this exact order:

1. `Audit`
2. `Independent review`
3. `Explicit user / authority decision`
4. `Execution`

The default assumption is:

- do **not** merge structurally on intuition
- do **not** move directories because of naming discomfort alone
- do **not** treat conceptual overlap as proof that physical consolidation is better

---

## 2. When This Guard Is Mandatory

This guard is mandatory when a proposed change does at least one of the following:

- merges two or more extensions or modules into one new structural unit
- moves a module to a new physical root or new package lineage
- transfers primary ownership of a module between logical planes
- introduces a replacement package intended to supersede existing packages
- changes public entrypoints or import boundaries for active-path consumers
- restructures a subsystem in a way that changes rollback, dependency, or ownership behavior

This guard is usually **not** required for:

- documentation-only changes
- test-only changes
- internal refactors that do not change ownership, boundaries, entrypoints, or filesystem lineage

---

## 3. Required Classification

Every structural proposal must classify itself as exactly one of:

| Change class | Meaning |
|---|---|
| `coordination package` | unify ownership and entry semantics while keeping source modules physically in place |
| `wrapper/re-export merge` | expose a new public entrypoint that composes existing modules with minimal physical movement |
| `physical merge` | physically move or consolidate source modules into a new structural unit |

If the class is `physical merge`, the burden of proof is highest.

---

## 4. Required Audit Packet

The audit packet must be explicit and reviewable.

Minimum required sections:

- proposal identity and scope
- source module profiles
- consumer analysis
- overlap classification:
  - conceptual overlap
  - interface overlap
  - implementation overlap
- active-path impact
- risk assessment
- recommended change class
- verification plan
- rollback plan

Standard template:

- `docs/reference/CVF_GC019_STRUCTURAL_CHANGE_AUDIT_TEMPLATE.md`

---

## 5. Required Independent Review

The structural audit alone is not sufficient for execution.

A second packet must independently review the audit and answer:

- Is the audit factually sound?
- Is the recommended change class correct?
- Is the risk framing complete?
- Should the user approve execution, request revision, or defer?

The review must produce one of:

- `APPROVE`
- `REVISE`
- `DEFER`

Standard template:

- `docs/reference/CVF_GC019_STRUCTURAL_CHANGE_REVIEW_TEMPLATE.md`

---

## 6. Decision Rule

Execution is allowed only when all of the following are true:

- a structural audit packet exists
- an independent review packet exists
- both artifacts are linked from the active roadmap or implementation packet
- the final decision is explicitly recorded as approved by the user or delegated authority

If any of these is missing, execution MUST stop.

---

## 7. Default Guidance

Prefer `coordination package` when:

- overlap is mostly conceptual
- modules are in different languages
- current physical layout has strong test/dependency stability
- physical movement would create high rollback cost with little runtime gain

Prefer `wrapper/re-export merge` when:

- a unified public surface is valuable
- underlying modules can remain stable
- consumer simplification is the main benefit

Prefer `physical merge` only when:

- implementation overlap is real
- ownership ambiguity remains harmful after coordination/wrapper options
- rollback is still bounded and independently reversible
- evidence shows physical consolidation is materially better than preserving lineage

---

## 8. Governance Position

This guard complements `GC-018`.

- `GC-018` decides whether a new restructuring or deepening wave should open.
- This guard decides whether a specific structural change inside an authorized wave is safe enough to execute.

Both controls may apply at the same time.
