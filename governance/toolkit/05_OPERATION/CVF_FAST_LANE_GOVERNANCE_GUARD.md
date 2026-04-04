# CVF Fast Lane Governance Guard

**Control ID:** `GC-021`
**Guard Class:** `CONTINUITY_AND_DECISION_GUARD`
**Status:** Active lightweight governance path for additive work inside an already-authorized tranche.
**Applies to:** humans, AI agents, and additive implementation work that stays inside an already-authorized tranche.
**Enforced by:** `governance/compat/check_fast_lane_governance_compat.py`

## Purpose

- speed up low-risk implementation work without losing structural control, tranche truth, or token discipline
- keep full-lane governance reserved for structural, boundary-changing, or scope-expanding work
- make lane choice explicit instead of ad hoc

## Rule

CVF may use `Fast Lane` governance only for low-risk additive work inside an already-authorized tranche.

Default split:

- `Fast Lane` for low-risk additive work
- `Full Lane` for structural, boundary-changing, or scope-expanding work

### Fast Lane Eligibility

`Fast Lane` is allowed only when all of the following are true:

1. the tranche or wave is already authorized through `GC-018`
2. the work stays inside the already-authorized tranche scope
3. the change is additive, not a physical merge
4. primary ownership does not move between planes or modules
5. no runtime authority or control boundary changes
6. no target-state claim is widened
7. no concept-only module is being turned into a new standalone line
8. rollback stays bounded to the touched package or local slice

Typical `Fast Lane` examples:

- contract extraction
- wrapper-to-real-contract uplift
- consumer proof
- deterministic packaging
- additive runtime helper

### Full Lane Triggers

`Full Lane` is mandatory whenever any of the following is true:

- no physical merge is no longer true because a physical merge or filesystem lineage move is proposed
- module created from concept-only target
- ownership transfer between logical planes
- no runtime authority or control boundary changes is no longer true because a public control boundary or runtime authority change is proposed
- target-state whitepaper claim expansion
- tranche scope expansion beyond the already-authorized slice

In short:

- high-risk or boundary-changing => `Full Lane`
- low-risk, additive, already-authorized => `Fast Lane`

### Required Fast Lane Evidence

Each `Fast Lane` control point must still produce:

1. one short audit
2. one short independent review
3. one implementation delta
4. execution plan update
5. test log update
6. clean classified commit

Top-level roadmap, status, inventory, or manifest refresh is required only when tranche state or top-level truth changes.

### Lane Selection Is Not Memory Classification

`Fast Lane` decides the minimum governed evidence burden for one additive control point.

It does not decide the durable memory class of every artifact produced by that control point.

`GC-022` still governs the memory class.

Typical default mapping:

| Artifact | Default memory class |
|---|---|
| fast-lane audit | `FULL_RECORD` |
| fast-lane independent review | `FULL_RECORD` |
| implementation delta | `SUMMARY_RECORD` |
| execution plan update | `SUMMARY_RECORD` |
| test log update | `SUMMARY_RECORD` |
| index or README navigation refresh | `POINTER_RECORD` |

### Required Fast Lane Content

The short audit must still state:

- why the change qualifies for `Fast Lane`
- what exact files or surfaces change
- what remains out of scope
- how rollback stays bounded
- what verification is required

The short review must still answer:

- does the change truly qualify for `Fast Lane`
- does it stay inside tranche scope
- should it proceed as `APPROVE`, `REVISE`, or `ESCALATE TO FULL LANE`

### Token Discipline

`Fast Lane` should reduce token cost by:

- reusing the tranche packet and execution plan as the main context anchor
- linking to canonical tranche docs instead of rewriting them in full for every additive control point
- keeping audit and review wording short and tranche-local
- avoiding top-level doc churn unless top-level truth actually changes

## Enforcement Surface

- repo-level alignment is enforced by `governance/compat/check_fast_lane_governance_compat.py`
- canonical templates are `docs/reference/CVF_FAST_LANE_AUDIT_TEMPLATE.md` and `docs/reference/CVF_FAST_LANE_REVIEW_TEMPLATE.md`
- `GC-018` still governs tranche authorization
- `GC-019` still governs major structural or boundary-changing work
- `GC-022` still governs how resulting records are stored for durable memory

## Related Artifacts

- `docs/reference/CVF_FAST_LANE_AUDIT_TEMPLATE.md`
- `docs/reference/CVF_FAST_LANE_REVIEW_TEMPLATE.md`
- `docs/reference/CVF_MEMORY_RECORD_CLASSIFICATION.md`
- `docs/reference/CVF_GOVERNANCE_CONTROL_MATRIX.md`
- `governance/compat/check_fast_lane_governance_compat.py`

## Final Clause

Fast Lane is not a shortcut around governance. It is the governed way to stay light only when the tranche boundary is already settled.
