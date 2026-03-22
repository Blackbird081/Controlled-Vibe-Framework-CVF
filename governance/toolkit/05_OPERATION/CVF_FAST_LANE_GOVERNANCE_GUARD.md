# CVF FAST LANE GOVERNANCE GUARD

**Type:** Governance Operation Guard  
**Applies to:** Humans, AI agents, and additive implementation work inside an already-authorized tranche  
**Purpose:** Speed up low-risk implementation work without losing structural control, tranche truth, or token discipline.

---

## 1. Mandatory Rule

CVF may use `Fast Lane` governance only for low-risk, additive work inside an already-authorized tranche.

The default split is:

- `Fast Lane` for low-risk additive work
- `Full Lane` for structural, boundary-changing, or scope-expanding work

This guard exists so CVF does not pay full-packet cost on every small control point when the tranche boundary is already settled.

---

## 2. Fast Lane Eligibility

`Fast Lane` is allowed only when **all** of the following are true:

1. the tranche or wave is already authorized through `GC-018`
2. the work stays inside the already-approved tranche scope
3. the change is additive, not a physical merge
4. primary ownership does not move between planes or modules
5. no active runtime authority or control boundary changes
6. no target-state claim is widened
7. no concept-only module is being turned into a new standalone line
8. rollback stays bounded to the touched package or local slice

Typical `Fast Lane` examples:

- contract extraction
- wrapper-to-real-contract uplift
- consumer proof
- deterministic packaging
- additive runtime helper

---

## 3. Full Lane Triggers

`Full Lane` is mandatory whenever **any** of the following is true:

- no physical merge is no longer true because a physical merge or filesystem lineage move is proposed
- module created from concept-only target
- ownership transfer between logical planes
- no runtime authority or control boundary changes is no longer true because a public control boundary or runtime authority change is proposed
- target-state whitepaper claim expansion
- tranche scope expansion beyond the already-authorized slice

In short:

- `high-risk / boundary-changing => Full Lane`
- `low-risk / additive / already-authorized => Fast Lane`

---

## 4. Required Fast Lane Evidence

Each `Fast Lane` control point must still produce:

1. one short audit
2. one short independent review
3. one implementation delta
4. execution plan update
5. test log update
6. clean classified commit

Top-level roadmap/status/inventory/manifest refresh is required only when one of the following changes:

- tranche state
- release or module truth
- maturity or readiness claim

---

## 5. Required Fast Lane Content

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

---

## 6. Token Discipline

`Fast Lane` should reduce token cost by:

- reusing the tranche packet and execution plan as the main context anchor
- linking to canonical tranche docs instead of rewriting them in full for every additive CP
- keeping audit/review wording short and tranche-local
- avoiding top-level doc churn unless top-level truth actually changes

This means `Fast Lane` is not only a speed rule.

It is also a context-discipline rule aligned with the CVF context-continuity model.

---

## 7. Required Templates

Use these templates for `Fast Lane` work:

- `docs/reference/CVF_FAST_LANE_AUDIT_TEMPLATE.md`
- `docs/reference/CVF_FAST_LANE_REVIEW_TEMPLATE.md`

Do **not** use `Fast Lane` templates to hide work that should have been escalated to `GC-019` full-lane handling.

---

## 8. Relationship To Existing Controls

- `GC-018` still governs whether a new wave or tranche may open
- `GC-019` full-lane flow still governs major structural or boundary-changing work
- this guard adds a lightweight governed path for additive work after the tranche boundary is already approved

`Fast Lane` does not replace `GC-018` or `GC-019`.

It narrows when full-packet heaviness is necessary.

---

## 9. Related References

- `governance/toolkit/02_POLICY/CVF_MASTER_POLICY.md`
- `docs/reference/CVF_GOVERNANCE_CONTROL_MATRIX.md`
- `docs/reference/CVF_FAST_LANE_AUDIT_TEMPLATE.md`
- `docs/reference/CVF_FAST_LANE_REVIEW_TEMPLATE.md`
- `governance/compat/check_fast_lane_governance_compat.py`
