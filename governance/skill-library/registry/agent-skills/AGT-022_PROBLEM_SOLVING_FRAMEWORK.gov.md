# AGT-022: Problem-Solving Framework Router

Text Encoding Exception: preserves pre-existing Unicode punctuation and symbols during semantic-preserving structural normalization.

> **Category:** Agent Intelligence
> **Status:** Active
> **Version:** 1.0.0
> **Created:** 2026-02-18
> **Source:** claudekit-skills → problem-solving/* (mrgoonie/claudekit-skills)

---

## Source

- **Provenance:** claudekit-skills/problem-solving (mrgoonie/claudekit-skills)
- **Source link:** [mrgoonie/claudekit-skills](https://github.com/mrgoonie/claudekit-skills) — problem-solving/ (6 sub-skills)
- **Techniques:** collision-zone-thinking, inversion-exercise, meta-pattern-recognition, scale-game, simplification-cascades, when-stuck
- **License:** MIT (source) → CC BY-NC-ND 4.0 (CVF adaptation)
- **CVF Adaptation:** Added governance constraints, dispatch table, combination patterns, CVF phase mapping
- **Pattern Type:** Framework-level problem-solving dispatch methodology

---

## Capability

Meta-skill that matches "stuck-type" to the appropriate problem-solving technique. Instead of random approaches, agents systematically identify what kind of problem they face and dispatch to the correct methodology. Does not solve problems directly — routes the agent to the most appropriate method.

**Key Principle:** Different stuck-types need different techniques. Match symptom to method.

### Dispatch Table — Stuck-Type → Technique

| How You're Stuck | Technique | Description |
|------------------|-----------|-------------|
| Complexity spiraling — Same thing 5+ ways, growing special cases | Simplification Cascades | Find one insight that eliminates multiple components |
| Need innovation — Conventional solutions inadequate | Collision-Zone Thinking | Force unrelated concepts together to discover emergent properties |
| Recurring patterns — Same issue in different places | Meta-Pattern Recognition | Spot patterns in 3+ domains to extract universal principles |
| Forced by assumptions — "Must be done this way" | Inversion Exercise | Flip core assumptions to reveal hidden constraints |
| Scale uncertainty — Will it work in production? Edge cases? | Scale Game | Test at extremes (1000x bigger/smaller) to expose fundamental truths |
| Code broken — Wrong behavior, test failing | Systematic Debugging (AGT-023) | 4-phase root cause investigation |

### Combination Patterns

- **Simplification + Meta-Pattern**: Find pattern → simplify all instances
- **Collision + Inversion**: Force metaphor → invert its assumptions
- **Scale + Simplification**: Extremes reveal what to eliminate

### Process

1. **Identify** — What symptom matches the dispatch table?
2. **Load** — Activate the specific technique
3. **Apply** — Follow the technique's process
4. **Iterate** — If still stuck, try different technique or combine

### Decision Tree

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

---

## Governance

| Field | Value |
|-------|-------|
| Risk Level | **R0 – Minimal** |
| Autonomy | Auto |
| Category | Agent Intelligence |
| Allowed Roles | All Roles (Orchestrator, Architect, Builder, Reviewer) |
| Allowed Phases | Discovery, Design, Build, Review (All) |
| Requires Approval | false |
| Audit Log | false |
| Max Token Budget | 500 |
| Fallback on Failure | List all available techniques for manual selection |

### Authority Mapping

| Role | Permission |
|------|-----------|
| All Roles | Full: any role can use problem-solving techniques |

### Phase Applicability

| Phase | Usage |
|-------|-------|
| A – Discovery | Explore problem space, challenge assumptions |
| B – Design | Resolve architectural dilemmas, find simplifications |
| C – Build | Debug, overcome implementation blocks |
| D – Review | Identify recurring patterns, challenge design decisions |

---

## Risk Justification

- **R0 classification** — no side effects, pure reasoning skill
- SHOULD try max 2 techniques before escalating to human
- MUST NOT skip to implementation without completing analysis
- MUST document which technique was applied and outcome

---

## Constraints

- SHOULD try max 2 techniques before escalating to human
- MUST NOT skip to implementation without completing analysis
- MUST document which technique was applied and outcome
- R0 classification: no side effects, pure reasoning skill

---

## Dependencies

- **AGT-023** (Systematic Debugging Engine) — routes to it for "code broken" stuck-type
- **AGT-018** (Agent Team Orchestrator) — routes to it for parallel investigation / multiple independent issues
- **AGT-012** (Agentic Loop Controller) — complements iterative problem-solving

---

## Validation

### Success Criteria

| Criterion | Target |
|-----------|--------|
| Problem resolution rate | ≥80% within 2 techniques |
| Technique match accuracy | ≥90% |
| Time-to-resolution vs unstructured | ≥40% faster |

---

## UAT Binding

**UAT Link:** `governance/skill-library/uat/results/UAT-AGT-022.md`

**PASS criteria:**
- [ ] Problem resolution rate ≥80% within 2 techniques
- [ ] Technique match accuracy ≥90%
- [ ] Time-to-resolution ≥40% faster than unstructured approach
- [ ] Applied technique and outcome documented

**FAIL criteria:**
- [ ] Implementation attempted before analysis completed
- [ ] More than 2 techniques tried without escalating to human
- [ ] Technique/outcome not documented

---

*Last Updated: February 18, 2026*
