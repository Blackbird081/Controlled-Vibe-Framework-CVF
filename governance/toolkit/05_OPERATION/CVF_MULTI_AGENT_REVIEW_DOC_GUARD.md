# CVF MULTI-AGENT REVIEW DOC GUARD

**Control ID:** GC-027  
Control ID: GC-027
**Type:** Governance Operation Guard  
**Applies to:** Humans and AI agents creating canonical multi-agent intake reviews, rebuttals, and decision packs  
**Purpose:** Standardize how CVF evaluates new proposal sets across multiple agents so intake, rebuttal, and final decision records stay comparable, reviewable, and machine-checkable.

---

## 1. Mandatory Rule

When CVF evaluates new architecture, module, or roadmap proposals through multiple agents, the canonical documentation chain must follow one standardized sequence:

1. intake review
2. cross-agent rebuttal
3. pre-integration decision pack
4. only then roadmap intake or implementation authorization

No canonical roadmap promotion should happen until the decision pack resolves the active contradictions truthfully.

---

## 2. Canonical Artifact Types

Use exactly these artifact classes for the canonical chain:

- `MULTI_AGENT_INTAKE_REVIEW`
- `MULTI_AGENT_REBUTTAL`
- `MULTI_AGENT_DECISION_PACK`

Recommended canonical placement:

- `docs/reviews/CVF_MULTI_AGENT_INTAKE_REVIEW_*.md`
- `docs/reviews/CVF_MULTI_AGENT_REBUTTAL_*.md`
- `docs/reviews/CVF_MULTI_AGENT_DECISION_PACK_*.md`

Historical or exploratory drafts may exist elsewhere, but they do not replace the canonical `docs/reviews/` chain.

---

## 3. Required Intake Review Content

Every canonical intake review must include:

- proposal summary
- four-question alignment or equivalent architecture-fit check
- integration mapping
- overlap / conflict scan
- risk register
- explicit decision posture
- required pass conditions
- file:line evidence for substantive claims

The intake review may conclude `GO`, `GO WITH FIXES`, or `HOLD`, but it must not silently skip the decision posture.

---

## 4. Required Rebuttal Content

Every canonical rebuttal must include:

- agree / disagree findings
- evidence ledger with `file:line` references
- decision override proposal
- condition delta versus prior decision pack or intake review
- final recommendation

Rebuttals exist to reconcile disagreement, not to restate intake content without evidence.

---

## 5. Required Decision Pack Content

Every canonical decision pack must include:

- decision matrix
- pass conditions
- canonical ownership map
- execution order or dependency order
- next recommended tranche or governed move
- file:line evidence for decisive claims

The decision pack is the final pre-roadmap checkpoint for multi-agent evaluation.

---

## 6. Evidence Discipline

For canonical multi-agent review docs:

- no material claim without `file:line` evidence
- if evidence is disputed, the stricter risk posture wins until reconciled
- unresolved ownership ambiguity forces `HOLD`
- unresolved guard/risk ambiguity forces `HOLD`

This guard is intentionally stricter than an informal discussion note.

---

## 7. Relationship To Existing Controls

- `GC-018` still governs whether a new continuation wave may open
- `GC-019` still governs major structural execution and merge decisions
- `GC-020` still governs pause / transfer / resume truth
- `GC-025` still governs session-start routing
- `GC-026` still governs tracker truth after tranche posture changes

`GC-027` governs the canonical documentation quality for multi-agent evaluation before those later controls are invoked for implementation.

---

## 8. Required Templates

Use these canonical templates:

- `docs/reference/CVF_MULTI_AGENT_INTAKE_REVIEW_TEMPLATE.md`
- `docs/reference/CVF_MULTI_AGENT_REBUTTAL_TEMPLATE.md`
- `docs/reference/CVF_MULTI_AGENT_DECISION_PACK_TEMPLATE.md`

Do not improvise a new canonical layout when one of the above applies.

---

## 9. Automated Enforcement

Repo-level compatibility and canonical review-doc validation are enforced by:

- `governance/compat/check_multi_agent_review_governance_compat.py`

This enforcement checks:

- guard / template / policy / matrix / bootstrap / hook / CI alignment
- required sections in changed canonical multi-agent review docs
- presence of `file:line` evidence markers in changed canonical docs

---

## 10. Related References

- `governance/toolkit/02_POLICY/CVF_MASTER_POLICY.md`
- `docs/reference/CVF_GOVERNANCE_CONTROL_MATRIX.md`
- `docs/reference/CVF_SESSION_GOVERNANCE_BOOTSTRAP.md`
- `docs/reference/CVF_MULTI_AGENT_INTAKE_REVIEW_TEMPLATE.md`
- `docs/reference/CVF_MULTI_AGENT_REBUTTAL_TEMPLATE.md`
- `docs/reference/CVF_MULTI_AGENT_DECISION_PACK_TEMPLATE.md`
- `governance/compat/check_multi_agent_review_governance_compat.py`
