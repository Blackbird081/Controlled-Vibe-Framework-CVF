# CVF Skill Portfolio Canonicalization Policy

> **Version:** 1.0.0
> **Status:** Active
> **Date:** 2026-04-26

---

## 1. Purpose

Keep every CVF skill domain small, high-quality, and non-coder friendly.

CVF does not optimize for the largest possible skill library. CVF optimizes for
the smallest active skill portfolio that can reliably turn a non-coder request
into a governed, agent-ready packet.

---

## 2. Portfolio Principle

Each domain should prefer:

1. **One canonical system skill** for the domain's main thinking model,
   constraints, vocabulary, and output contract.
2. **One or two tactical handoff skills** for common intake/prototype/source
   conversion workflows.
3. **One QA/review skill** when the domain has repeatable failure modes that
   must be checked before delivery.

Avoid many micro-skills when their behavior can be expressed as options,
sections, checklists, or examples inside a stronger canonical skill.

---

## 3. Non-Coder Output Rule

Every active user-facing skill must produce one of these outputs:

- a clear brief
- a governed spec
- an implementation handoff
- an evaluation checklist
- a decision packet
- a review report

The output must hide unnecessary technical complexity from non-coders while
still giving agents enough structure to execute.

Do not expose framework selection, model routing, database design, security
tradeoffs, or deployment details as user chores unless the skill is explicitly a
technical-review skill for a technical user.

---

## 4. Domain Portfolio Shapes

Use these shapes as defaults:

| Domain Type | Preferred Active Shape |
| --- | --- |
| Build domains | System spec skill + handoff skill + QA checklist |
| Strategy domains | Strategy brief skill + decision packet skill + review checklist |
| Compliance domains | Intake checklist + risk review skill + evidence packet skill |
| Content domains | Creative brief skill + production handoff skill + quality review skill |
| Data/analysis domains | Analysis plan skill + interpretation packet skill + validation checklist |

If a domain needs more than 3-5 active skills, split by genuinely different job
function, not by small tactic names.

---

## 5. Merge-First Rule

When a new source proposes a skill:

1. Check whether its value can be added to an existing canonical skill.
2. If yes, update that skill and record the source in version history.
3. If the source is useful only as guidance, add it to docs, examples, or QA.
4. Create a new skill only if the capability is recurring, non-overlapping,
   form-capable, and needed by non-coders as a separate entrypoint.

New skill creation is the last option, not the default outcome.

---

## 6. External Knowledge Absorption

External repositories, prompt collections, design systems, and skill packs are
reference material. They may enrich CVF by contributing:

- stronger vocabulary
- clearer acceptance criteria
- better output packet structure
- domain-specific anti-patterns
- examples that improve agent execution
- QA checks that catch real failure modes

They must not import:

- duplicate skills
- brand identity or proprietary signatures
- fragile stylistic trends
- hidden dependency requirements
- user-facing technical burden
- conflicting governance language

---

## 7. Promotion Decision

Use this decision order:

| Finding | Destination |
| --- | --- |
| Improves whole-domain judgment | Update the domain's canonical system skill |
| Improves source/prototype intake | Update the tactical handoff skill |
| Improves final quality checks | Update the QA/review skill |
| Useful once for one project | Put it in that project handoff only |
| Duplicates existing behavior | Move to legacy/quarantine or reject |
| Creates a new recurring job function | Propose a new canonical skill with overlap review |

---

## 8. Active vs Legacy

The default user-facing skill explorer should show only active, trusted,
non-duplicative skills.

Legacy skills stay useful as:

- audit history
- extraction references
- migration sources
- examples of rejected or superseded patterns

Legacy skills should not appear as default choices for non-coders unless a
specific workflow intentionally exposes them as archived reference material.

---

## 9. Acceptance Criteria

A domain portfolio is canonicalized when:

- active skills have clear non-overlapping jobs
- each active skill produces a structured output packet
- users can choose a skill without understanding internal architecture
- duplicate micro-skills are merged or moved to legacy
- external references enrich existing skills before creating new ones
- QA/review coverage exists for the domain's highest-risk failure modes

---

## 10. Version History

| Version | Date | Changes |
| --- | --- | --- |
| 1.0.0 | 2026-04-26 | Initial portfolio canonicalization policy after UI/UX skill consolidation. |
