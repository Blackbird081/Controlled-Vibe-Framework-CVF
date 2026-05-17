# CVF Skill Publication Quality Gate

> **Version:** 1.0.0
> **Status:** Active
> **Date:** 2026-04-26

---

## 1. Purpose

CVF public skills are not a prompt library. A public skill is an
agent-ready capability packet that helps CVF turn a non-coder intent into a
governed spec, checklist, decision packet, or implementation handoff.

The public Web skill library must stay small, high-quality, and directly
usable. Source skills that are useful for future learning may remain in the
repository, but they must not appear in the public Web catalog until they pass
this gate.

---

## 2. Public Skill Rule

A skill may appear in the public Web catalog only when all conditions are true:

- the skill has a clear non-coder intent boundary;
- it is mapped to at least one real template in the app template registry;
- every public linked template is `TRUSTED_FOR_VALUE_PROOF`;
- the template can generate a governed agent-ready packet;
- the skill output contract is concrete enough for an AI/agent to execute;
- related skill references point only to active public skills or are rewritten
  to canonical replacements;
- the skill does not duplicate another public skill's job.

If a skill fails any condition, it is non-public.

---

## 3. Template Types

### Full Wizard Template

Use for important, multi-step, high-context workflows such as:

- app specification;
- architecture or system design;
- business planning;
- finance analysis;
- compliance or security assessment.

Full wizard templates may have many fields and guided review steps.

### Lightweight Execution Template

Use for tactical skills that still need a clean activation packet:

- QA checklist;
- review;
- audit;
- forecast review;
- due diligence;
- handoff cleanup.

Lightweight templates should usually ask for 3-7 fields and produce a
structured packet, not a generic answer.

---

## 4. Non-Public States

Non-public skills should not appear in Web search, detail pages, related skill
links, or archive categories.

Use these internal states when reviewing source skills:

| State | Meaning |
| --- | --- |
| Merged | Useful material absorbed into a stronger canonical skill. |
| Incubating | Promising but lacks template, evidence, or output contract. |
| Removed | Too narrow, duplicate, low quality, or not useful for non-coder value. |

Git history and compact mapping notes are the audit trail. The public Web app
should not expose legacy skill bodies as archived reference material.

---

## 5. Learning Module Boundary

Future CVF learning modules may discover useful skill patterns during real work,
but they must not auto-publish skills.

Promotion flow:

```text
Observed repeated success
→ candidate pattern
→ skill draft
→ Full or Lightweight template
→ evidence / review gate
→ public promotion
```

---

## 6. Acceptance Checks

The Web public skill index must satisfy:

- no `archiveCategories` in `public/data/skills-index.json`;
- every public skill has `frontDoorVisible: true`;
- every public skill has at least one linked template;
- every public linked template exists in the template registry;
- every public linked template has class `TRUSTED_FOR_VALUE_PROOF`;
- no legacy or unscreened template aliases are serialized for public skills.

---

## 7. Version History

| Version | Date | Changes |
| --- | --- | --- |
| 1.0.0 | 2026-04-26 | Initial public skill publication gate after strict quality uplift. |
