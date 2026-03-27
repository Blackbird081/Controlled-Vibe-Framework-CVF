# CVF Multi-Agent Review Doc Guard

**Control ID:** GC-027
Control ID: GC-027
**Guard Class:** `CONTINUITY_AND_DECISION_GUARD`
**Status:** Active canonical documentation rule for multi-agent intake, rebuttal, and decision-pack evaluation.
**Applies to:** humans and AI agents creating canonical multi-agent intake reviews, rebuttals, and decision packs.
**Enforced by:** `governance/compat/check_multi_agent_review_governance_compat.py`

## Purpose

- standardize how CVF evaluates new proposal sets across multiple agents
- keep intake, rebuttal, and final decision records comparable, reviewable, and machine-checkable
- prevent roadmap promotion before the canonical contradiction-resolution chain is complete

Scope boundary: this guard governs canonical documentation only. It does not replace the live `AI Boardroom` deliberation path in the Control Plane.

## Rule

When CVF evaluates new architecture, module, or roadmap proposals through multiple agents, the canonical documentation chain must follow one standardized sequence:

1. intake review
2. cross-agent rebuttal
3. pre-integration decision pack
4. only then roadmap intake or implementation authorization

No canonical roadmap promotion should happen until the decision pack resolves the active contradictions truthfully.

### Canonical Artifact Types

Use exactly these artifact classes for the canonical chain:

- `MULTI_AGENT_INTAKE_REVIEW`
- `MULTI_AGENT_REBUTTAL`
- `MULTI_AGENT_DECISION_PACK`

Recommended canonical placement:

- `docs/reviews/CVF_MULTI_AGENT_INTAKE_REVIEW_*.md`
- `docs/reviews/CVF_MULTI_AGENT_REBUTTAL_*.md`
- `docs/reviews/CVF_MULTI_AGENT_DECISION_PACK_*.md`

This guard does not govern live `INTAKE -> AI Boardroom -> DESIGN` runtime deliberation. For that higher-priority runtime surface, see `docs/reference/CVF_BOARDROOM_DELIBERATION_PROTOCOL.md`.

### Required Intake Review Content

Every canonical intake review must include:

- proposal summary
- four-question alignment or equivalent architecture-fit check
- integration mapping
- overlap or conflict scan
- risk register
- explicit decision posture
- required pass conditions
- file:line evidence for substantive claims

### Required Rebuttal Content

Every canonical rebuttal must include:

- agree and disagree findings
- evidence ledger with `file:line` references
- decision override proposal
- condition delta versus prior decision pack or intake review
- final recommendation

### Required Decision Pack Content

Every canonical decision pack must include:

- decision matrix
- pass conditions
- canonical ownership map
- execution order or dependency order
- next recommended tranche or governed move
- file:line evidence for decisive claims

### Evidence Discipline

For canonical multi-agent review docs:

- no material claim without `file:line` evidence
- if evidence is disputed, the stricter risk posture wins until reconciled
- unresolved ownership ambiguity forces `HOLD`
- unresolved guard or risk ambiguity forces `HOLD`

## Enforcement Surface

- repo-level compatibility and canonical review-doc validation are enforced by `governance/compat/check_multi_agent_review_governance_compat.py`
- this enforcement checks guard, template, policy, matrix, bootstrap, hook, and CI alignment
- changed canonical multi-agent docs must contain the required sections and `file:line` evidence markers

Canonical templates:

- `docs/reference/CVF_MULTI_AGENT_INTAKE_REVIEW_TEMPLATE.md`
- `docs/reference/CVF_MULTI_AGENT_REBUTTAL_TEMPLATE.md`
- `docs/reference/CVF_MULTI_AGENT_DECISION_PACK_TEMPLATE.md`

## Related Artifacts

- `docs/reference/CVF_MULTI_AGENT_INTAKE_REVIEW_TEMPLATE.md`
- `docs/reference/CVF_MULTI_AGENT_REBUTTAL_TEMPLATE.md`
- `docs/reference/CVF_MULTI_AGENT_DECISION_PACK_TEMPLATE.md`
- `docs/reference/CVF_BOARDROOM_DELIBERATION_PROTOCOL.md`
- `docs/reference/CVF_SESSION_GOVERNANCE_BOOTSTRAP.md`
- `governance/compat/check_multi_agent_review_governance_compat.py`

## Final Clause

Multi-agent evaluation is only governed when disagreement is reconciled through one canonical documentation chain, not through parallel ad hoc opinions.
