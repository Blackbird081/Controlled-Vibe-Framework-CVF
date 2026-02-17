# AGT-022: Problem-Solving Framework Router# AGT-022: Problem-Solving Framework Router


































































































*Last Updated: February 18, 2026*---- **License:** MIT (source) → CC BY-NC-ND 4.0 (CVF adaptation)- **CVF Adaptation:** Added governance constraints, dispatch table, combination patterns, CVF phase mapping- **Pattern Type:** Framework-level problem-solving dispatch methodology- **Techniques:** collision-zone-thinking, inversion-exercise, meta-pattern-recognition, scale-game, simplification-cascades, when-stuck- **Source:** [mrgoonie/claudekit-skills](https://github.com/mrgoonie/claudekit-skills) — problem-solving/ (6 sub-skills)## 📚 Attribution---`governance/skill-library/uat/results/UAT-AGT-022.md`### UAT Link| Time-to-resolution vs unstructured | ≥40% faster || Technique match accuracy | ≥90% || Problem resolution rate | ≥80% within 2 techniques ||-----------|--------|| Criterion | Target |### Success Criteria## 📊 Validation---- **AGT-012** (Agentic Loop Controller) — Iterative technique application- **AGT-023** (Systematic Debugging Engine) — For "code broken" stuck-type## 🔗 Dependencies---- R0 classification: no side effects, pure reasoning skill- SHOULD try max 2 techniques before escalating to human- MUST NOT skip to implementation without completing analysis- MUST document which technique was applied and outcome### Constraints| D – Review | Identify recurring patterns, challenge design decisions || C – Build | Debug, overcome implementation blocks || B – Design | Resolve architectural dilemmas, find simplifications || A – Discovery | Explore problem space, challenge assumptions ||-------|-------|| Phase | Usage |### Phase Applicability| All Roles | Full: any role can use problem-solving techniques ||------|-----------|| Role | Permission |### Authority Mapping## 🔐 CVF Governance---4. **Iterate** — If still stuck, try different technique or combine3. **Apply** — Follow the technique's process2. **Load** — Activate the specific technique1. **Identify** — What symptom matches the dispatch table?### Process- **Scale + Simplification**: Extremes reveal what to eliminate- **Collision + Inversion**: Force metaphor → invert its assumptions- **Simplification + Meta-Pattern**: Find pattern → simplify all instances### Combination Patterns| **Code broken** — Wrong behavior, test failing | Systematic Debugging (AGT-023) | 4-phase root cause investigation || **Scale uncertainty** — Will it work in production? Edge cases? | Scale Game | Test at extremes (1000x bigger/smaller) to expose fundamental truths || **Forced by assumptions** — "Must be done this way" | Inversion Exercise | Flip core assumptions to reveal hidden constraints || **Recurring patterns** — Same issue in different places | Meta-Pattern Recognition | Spot patterns in 3+ domains to extract universal principles || **Need innovation** — Conventional solutions inadequate | Collision-Zone Thinking | Force unrelated concepts together to discover emergent properties || **Complexity spiraling** — Same thing 5+ ways, growing special cases | Simplification Cascades | Find one insight that eliminates multiple components ||------------------|-----------|-------------|| How You're Stuck | Technique | Description |### Dispatch Table — Stuck-Type → Technique## 🎯 Capabilities---**Key Principle:** Different stuck-types need different techniques. Match symptom to method.Meta-skill that matches "stuck-type" to the appropriate problem-solving technique. Instead of random approaches, agents systematically identify what kind of problem they face and dispatch to the correct methodology.## 📋 Overview---> **Provenance:** claudekit-skills/problem-solving (mrgoonie/claudekit-skills)> **Category:** Agent Intelligence  > **Autonomy:** Auto  > **Risk Level:** R0 – Minimal  > **Status:** Active  > **Version:** 1.0.0  
> **Status:** Active
> **Risk Level:** R0 – Minimal
> **Autonomy:** Auto
> **Version:** 1.0.0
> **Created:** 2026-02-18
> **Source:** claudekit-skills → problem-solving/* (mrgoonie/claudekit-skills)

---

## Purpose

Meta-skill that **dispatches to the right problem-solving technique** based on the specific type of "stuck-ness". Không giải quyết vấn đề trực tiếp — mà chỉ dẫn agent đến phương pháp phù hợp nhất.

## Capability

### Stuck-Type → Technique Routing

| How You're Stuck | Technique | Action |
|------------------|-----------|--------|
| **Complexity spiraling** — Same thing 5+ ways, growing special cases | Simplification Cascades | Find one insight that eliminates multiple components |
| **Need innovation** — Conventional solutions inadequate | Collision Zone Thinking | Force unrelated concepts together for emergent properties |
| **Recurring patterns** — Same issue in different places | Meta-Pattern Recognition | Spot patterns appearing in 3+ domains |
| **Forced by assumptions** — "Must be done this way" | Inversion Exercise | Flip core assumptions to reveal hidden constraints |
| **Scale uncertainty** — Will it work in production? | Scale Game | Test at extremes (1000x bigger/smaller) |
| **Code broken** — Wrong behavior, test failing | → AGT-023 (Systematic Debugging) | 4-phase debugging framework |

### Combining Techniques

When one technique is insufficient:
- **Simplification + Meta-pattern**: Find pattern → simplify all instances
- **Collision + Inversion**: Force metaphor → invert its assumptions
- **Scale + Simplification**: Extremes reveal what to eliminate

## Decision Tree

```
STUCK?
├─ Technical bug? → AGT-023 (Systematic Debugging)
├─ Architecture too complex? → Simplification Cascades
├─ Need breakthrough idea? → Collision Zone Thinking
├─ Seeing repeated patterns? → Meta-Pattern Recognition
├─ Assumptions feel wrong? → Inversion Exercise
├─ Unsure about scale? → Scale Game
└─ Multiple independent issues? → AGT-018 (parallel sub-agents)
```

## Integration

- **Routes to:** AGT-023 (Systematic Debugging Engine) for code bugs
- **Routes to:** AGT-018 (Agent Team Orchestrator) for parallel investigation
- **Complements:** AGT-012 (Agentic Loop Controller) for iterative problem-solving

---

## Governance Summary

```yaml
skill_id: AGT-022
skill_name: Problem-Solving Framework Router
risk_level: R0
autonomy: auto
allowed_roles:
  - Orchestrator
  - Architect
  - Builder
  - Reviewer
allowed_phases:
  - Discovery
  - Design
  - Build
  - Review
requires_approval: false
audit_log: false
max_token_budget: 500
fallback_on_failure: "List all available techniques for manual selection"
```

## CVF Compliance

- [x] Risk level assigned (R0)
- [x] Authority mapping defined
- [x] Phase restrictions set (All)
- [x] Routing logic documented
- [x] Fallback behavior specified
- [x] Source attribution documented
