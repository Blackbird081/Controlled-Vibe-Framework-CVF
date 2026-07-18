# CVF Vibe-to-Spec Conversation Capture Form

Memory class: TEMPLATE_RECORD

docType: reference

Date: 2026-05-25

Status: CANONICAL_TEMPLATE

Companion to: `docs/concepts/CVF_LAYERED_PRODUCT_ARCHITECTURE_AND_VIBE_DIALOG_PATTERN_2026-05-25.md`

---

## Purpose

Standardize the shape of any non-coder-to-agent Vibe-to-Spec conversation
in CVF. This form serves three audiences:

1. **Runtime non-coder users:** when CVF agent guides a vibe iteration,
   the conversation should follow this form's phases.

2. **Workflow authors:** when designing a new workflow's guided step
   sequence, use this form as the structural reference.

3. **Internal CVF design sessions:** when operator and CVF agent discuss
   architecture, scope, or product direction, this form captures the
   reasoning chain so subsequent agents inherit the conclusions correctly.

This template is documentation only. It does not authorize runtime
implementation by itself.

## Scope / Target / Owner Boundary

Owner: CVF dialog protocol and conversation capture.

Boundary: this template defines structure. It does not change runtime,
prescribe specific workflows, or authorize tranches.

## When To Use This Form

Use when ANY of these conditions apply:

- A non-coder is iterating with a CVF agent toward a frozen Spec
- An operator and CVF agent are designing a product direction or scope
- An outside reviewer is providing structured feedback (GAP analysis)
- A workflow author is sketching a new guided step sequence
- Multiple iterations of clarification are expected before commitment

Do NOT use when:

- A single one-shot request will produce a one-shot answer
- The task is purely mechanical (e.g., file rename, lint fix)
- No Spec or commitment artifact is the outcome

## Form Structure

The form has 5 required sections and 3 optional sections. All sections
allow language to match the participant's preference (Vietnamese, English,
mixed). The final committed Spec is always English (architecture invariant).

### Required Section 1: Header

```text
# <Conversation Title>

Capture date: <YYYY-MM-DD>

Participants:
- <Role 1>: <name or pseudonym>
- <Role 2>: <name or pseudonym>

Initial intent (in participant's words):
<one to three sentences capturing the starting point>

Outcome class:
[ ] FROZEN_SPEC (agent-ready)
[ ] ARCHITECTURE_DECISION (no immediate Spec)
[ ] SCOPE_REFINEMENT (existing Spec narrowed)
[ ] FEEDBACK_REVIEW (no Spec emitted)
[ ] OTHER (describe)
```

### Required Section 2: Iteration Log

Capture each meaningful clarification cycle. One subsection per iteration.

```text
## Iteration <N>: <Short topic name>

Surfacing trigger: <what artifact, question, or observation started this>

Initial position (agent or user): <one to three sentences>

Clarification given (from the other participant):
<the actual words used, quoted if possible — verbatim is preferred>

Hidden assumption revealed:
<what was implicitly believed before but now is questioned>

Scope impact:
<what changed in the working understanding after this clarification>

State after iteration:
[ ] more iterations expected
[ ] ready to draft Spec
[ ] outcome reached without Spec
```

Repeat as many Iteration subsections as needed. No fixed maximum.

### Required Section 3: Frozen Decisions

List every decision that crystallized during the conversation. One bullet
per decision. Format:

```text
- <Decision number>. <One-sentence decision> (Iteration <N> source)
```

Example:

```text
- 1. UI shell uses standard i18n EN/VI toggle (Iteration 4 source)
- 2. Workflow internals stay English always (Iteration 5 source)
```

### Required Section 4: Anti-Patterns Recorded

List patterns that were considered but rejected. This prevents future
agents from accidentally reverting:

```text
- <Anti-pattern>. Reason it was rejected.
```

Example:

```text
- Bundling Vietnamese strings in runtime payloads. Rejected because
  standard i18n already handles this and runtime translation adds
  maintenance burden.
```

### Required Section 5: Next Steps

```text
Recommended next steps (priority order):

1. <Specific action>
2. <Specific action>
...

Dispatch readiness:
[ ] requires fresh GC-018 before implementation
[ ] documentation update only
[ ] no action required, record only

Dependencies blocking next steps: <list or "none">
```

### Optional Section 6: Frozen Spec Block

If the conversation produced a frozen Spec, embed it here verbatim in
English. The Spec is the agent control point and must not be translated.

```text
## Frozen Spec (English, immutable)

\`\`\`text
<full Spec content as it would appear to an agent>
\`\`\`

Spec language: en

Frozen at: <ISO timestamp>

Spec contract version: <e.g., cvf.specFirstMediation.l1.v1>
```

### Optional Section 7: Cross-References

Link related artifacts:

```text
## Cross-References

- Predecessor conversations: <paths>
- Related roadmaps: <paths>
- Related work orders: <paths>
- External feedback that triggered this: <paths>
- Memory entries influenced: <names>
```

### Optional Section 8: Meta-Observations

If the conversation revealed patterns about CVF itself (not just the
immediate topic), capture them here. This is where meta-patterns get
preserved across sessions:

```text
## Meta-Observations

<Observations about CVF's product, process, or architecture that emerged
beyond the immediate conversation topic.>
```

---

## Worked Example: The 2026-05-25 Operator-Claude Layered Architecture
Conversation

The companion concept document
`docs/concepts/CVF_LAYERED_PRODUCT_ARCHITECTURE_AND_VIBE_DIALOG_PATTERN_2026-05-25.md`
IS an instance of this form, applied to that conversation. Specifically:

| Form section | Maps to concept doc part |
| --- | --- |
| Header | Document frontmatter + Purpose |
| Iteration Log | Part 1 (6 iterations) |
| Frozen Decisions | Part 2-5 (architecture + scope) |
| Anti-Patterns | Part 7 "Anti-patterns Codex should avoid" |
| Next Steps | Recommendations section |
| Frozen Spec Block | N/A (architecture decision, not Spec) |
| Cross-References | Source / Predecessor Evidence + Part 9 |
| Meta-Observations | Part 4 (Vibe-to-Spec pattern recognition) + Part 6 |

Use this mapping as a reference when applying the form to other
conversations.

---

## Form Field Glossary

**Iteration:** one meaningful clarification cycle. Typically one
participant says something that updates the other's working model.
Iterations are not turns in a chat — many turns can produce zero
iterations (small talk, restating); some single turns can produce two
iterations (multiple insights stacked).

**Hidden assumption:** something implicitly believed by a participant
that was not stated until a clarification revealed it. Each iteration
should identify at least one. If none was revealed, the iteration might
not be meaningful enough to record.

**Frozen decision:** a commitment that future tranches inherit without
re-deciding. Frozen decisions are the conversation's permanent output,
distinct from any specific Spec content.

**Anti-pattern:** an approach considered during conversation but rejected.
Recording these prevents accidental reversion. Especially important when
the rejection reason is subtle.

**Engine room:** Layer 4 of CVF's product architecture. Backend workflow
and Spec. Always English. Reference:
`docs/concepts/CVF_LAYERED_PRODUCT_ARCHITECTURE_AND_VIBE_DIALOG_PATTERN_2026-05-25.md`.

---

## When To Convert Captured Form Into Other Artifacts

A completed form may seed several downstream artifacts. Decision rules:

| Form outcome | Downstream artifact |
| --- | --- |
| FROZEN_SPEC outcome | Spec block goes into `/api/execute` Spec emission |
| ARCHITECTURE_DECISION outcome | Concept document under `docs/concepts/` |
| SCOPE_REFINEMENT outcome | Updated roadmap, link form as Source |
| FEEDBACK_REVIEW outcome | Review record under `docs/reviews/` |
| Cross-cutting meta-observations | Memory entry under `memory/` (Claude) |
| Future tranche implied | Roadmap under `docs/roadmaps/`, link form |

A single form can produce multiple downstream artifacts. The form remains
the canonical capture of the conversation.

---

## Storage Convention

Captured conversation forms live in one of these locations:

| Conversation type | Location |
| --- | --- |
| Operator-CVF internal design | `docs/concepts/<descriptive-name>_<date>.md` |
| Non-coder runtime conversation | runtime database (future), exported summary in `docs/evidence/` |
| External feedback review | `.private_reference/legacy/CVF <YYYY.MM>/<source-name>.md` paired with a `CLAUDE_REVIEW_OF_<source>_<date>.md` |
| Workflow author design | `governance/workflows/<workflow_id>/design/<step-design>_<date>.md` |

Naming pattern: include date suffix for chronological ordering. Include
descriptive name (kebab-case or UPPER_SNAKE_CASE) so search works.

---

## Anti-Patterns When Using This Form

Do not:

1. **Skip iterations.** Each clarification deserves its own subsection.
   Compressing multiple insights into one iteration loses the reasoning
   chain.

2. **Paraphrase quoted clarifications.** Capture verbatim when possible.
   The exact wording often reveals the hidden assumption better than a
   paraphrase.

3. **Skip the "Hidden Assumption" field.** If a clarification did not
   reveal an assumption, it probably wasn't worth recording as an
   iteration. Either find the assumption or merge it into another
   iteration.

4. **Translate the Frozen Spec block.** It must stay English. Translation
   creates ambiguity for the agent.

5. **Make Frozen Decisions vague.** Each decision should be one sentence
   actionable enough that a future agent can verify whether it has been
   honored.

6. **Use the form for trivial conversations.** "What's the right variable
   name?" is not a Vibe-to-Spec conversation. The form is for design,
   intent capture, or scope decisions, not for routine implementation
   chat.

---

## Cross-Reference to Architecture Document

Full context, history, and decisions that produced this form:

`docs/concepts/CVF_LAYERED_PRODUCT_ARCHITECTURE_AND_VIBE_DIALOG_PATTERN_2026-05-25.md`

That document IS a worked example of this form applied to itself. Read it
to see the form's expected output shape.

---

## Claim Boundary

This is a template artifact. It does not claim:

- runtime support for the form
- a specific implementation of guided wizard mode
- a specific workflow's compliance with the form
- multilingual runtime translation
- production readiness
- hosted readiness
- broad agent dialog completeness

Future tranches may implement runtime support, automation, or capture
tooling for forms produced from this template. Such implementations
require their own fresh GC-018 and work order.
