# CVF Knowledge Absorption And Extension Priority Standard — 2026-04-13

Memory class: POINTER_RECORD

## 1. Purpose

This document is a binding standard for future CVF work that:

- absorbs new external knowledge into CVF
- promotes curated knowledge into canon
- proposes new uplift waves after knowledge intake
- attempts to widen CVF using newly absorbed doctrine, tooling, or runtime ideas

Its purpose is to prevent value dilution, architecture drift, and premature surface multiplication.

## 2. Binding Rule

Unless a fresh operator decision and explicit `GC-018` state otherwise, the default rule is:

`doctrine-first / governance-first absorption must be completed before implementation-first expansion`

This rule is binding for any future knowledge-absorption or CVF-extension wave.

## 3. What This Means In Practice

When CVF absorbs a new knowledge packet, the next step must default to:

1. accepted-value extraction
2. deduplicated concept mapping
3. owner-surface mapping
4. explicit rejection / defer list
5. future reopen conditions

The next step must **not** default to:

1. new runtime creation
2. new CLI creation
3. new guard-family creation
4. parallel subsystem creation
5. provider-lane reopening

## 4. Required Priority Order

Future agents must follow this priority order:

1. **Doctrine fit**
- determine what the new knowledge actually adds to CVF in conceptual terms

2. **Governance fit**
- determine which accepted concepts can be governed safely inside existing CVF owner surfaces

3. **Owner-surface mapping**
- map accepted value into existing CVF owners such as Knowledge Layer, Context Builder, Learning Plane, W7-aligned governance, or already delivered bounded `cvf-web` surfaces

4. **Value concentration**
- choose the smallest uplift that increases reuse, clarity, or governed operability the most

5. **Implementation only after proof of fit**
- implementation may open only after the doctrine/governance layer is clean and the boundary is explicit

## 5. No-New-Surface Default

The default rule for absorbed knowledge is:

`enhance an existing CVF owner surface first`

not:

`create a new CVF surface first`

A future agent must assume:

- no new graph runtime
- no new memory runtime
- no new wiki runtime
- no new CLI family
- no new guard family

unless a fresh bounded wave proves that an existing owner surface cannot absorb the value safely.

## 6. Mandatory Questions Before Any Uplift

Before opening a new uplift wave from absorbed knowledge, the agent must answer:

1. What exact value is accepted?
2. What existing CVF owner surface should own it?
3. What is explicitly rejected?
4. What remains deferred?
5. Why is a new surface not sufficient or not necessary?
6. Why is the chosen next step the highest-leverage move rather than just the easiest move?

If these answers are not explicit, the wave is not ready.

## 7. What Counts As Highest-Leverage

A next step is higher-leverage only if it does at least one of these:

- makes future knowledge absorption narrower and safer
- reduces terminology drift
- increases governed reuse of accepted knowledge
- improves owner-surface clarity
- prevents parallel architecture sprawl
- strengthens existing official CVF surfaces instead of multiplying new ones

If a proposed step mainly adds implementation volume without improving these things first, it is not the priority move.

## 8. Explicit Exceptions

A future wave may skip doctrine-first / governance-first priority only if all of the following are true:

1. the operator explicitly authorizes an implementation-first exception
2. a fresh bounded `GC-018` is issued
3. the exception states why the doctrine/governance fit is already sufficiently closed
4. the exception states why existing owner surfaces cannot absorb the value without a new surface

Without all four, the default priority rule remains active.

## 9. Best-Practice Exemplar

The repository should treat the `Graphify / LLM-Powered / Palace` lane as the current best-practice example of this standard in action:

- canonical roadmap: `docs/roadmaps/CVF_GRAPHIFY_LLM_POWERED_PALACE_SYNTHESIS_ONLY_ROADMAP_2026-04-13.md`

- broad intake happened first
- independent evaluation happened
- rebuttal and synthesis happened
- accepted value was narrowed
- rejected/deferred value was made explicit
- implementation remained blocked
- the next recommended move stayed in a doctrine/governance-first lane

This exemplar does not make that packet canon automatically.
It demonstrates the correct sequencing discipline.

## 10. Relation To Existing Files

Use this standard together with:

- `AGENT_HANDOFF.md`
- `docs/reference/CVF_MASTER_ARCHITECTURE_WHITEPAPER.md`
- `docs/assessments/CVF_EXECUTIVE_VALUE_PRIORITIZATION_NOTE_2026-04-13.md`
- `docs/roadmaps/CVF_GRAPHIFY_LLM_POWERED_PALACE_SYNTHESIS_ONLY_ROADMAP_2026-04-13.md`

The executive note explains **why** this ordering creates the most value.
This standard defines the ordering as a **binding default rule**.
