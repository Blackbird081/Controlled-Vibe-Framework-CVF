# CVF Non-Coder Spec-First Web Flow

Memory class: PRODUCT_SPEC_RECORD

Date: 2026-05-25

Status: CANONICAL_PRODUCT_DIRECTION

## Purpose

Define how a non-coder should use CVF through a public web-facing product:
CVF turns intent into a controlled, agent-readable Spec before any agent
implementation begins.

## Target / Source

Target surface: public CVF web-facing non-coder entry flow.

Source inputs:

- operator feedback on the real non-coder usage test;
- `docs/reviews/archive/CVF_REAL_NONCODER_USAGE_TEST_RESULT_2026-05-25.md`;
- `docs/roadmaps/archive/CVF_L1_MULTILINGUAL_SPEC_FIRST_MEDIATION_ROADMAP_2026-05-25.md`;
- operator-provided "Vibe-to-Spec" handoff packet sample reviewed locally on
  2026-05-25.

## Scope / Methodology

Scope: product direction and user flow, not implementation.

Methodology:

1. Preserve the non-coder's native-language intent.
2. Convert the intent into a normalized CVF Spec.
3. Keep the Spec structured enough for any agent to read consistently.
4. Make governance, constraints, success criteria, and review gates explicit.
5. Let the user copy the Spec into a preferred agent or future CVF execution
   surface.

## Scope / Target / Owner Boundary

Owner: non-coder product UX and governed agent handoff contract.

Boundary: this document does not authorize runtime changes, provider adapter
changes, receipt envelope changes, hosted readiness, public release readiness,
or automatic agent execution.

## Owner / Source

Owner: non-coder product UX, L1 multilingual mediation, and governed agent
handoff contract.

Source: operator product feedback, real non-coder usage HOLD result, and the
locally reviewed Vibe-to-Spec packet pattern.

## Core Principle

CVF is not just a chat surface. For non-coders, the main product value is:

```text
vague user intent -> guided clarification -> governed CVF Spec -> agent work
```

The control point is the Spec. Agents should implement from the Spec, not from
loose chat wording.

## Web-Facing Entry Modes

### 1. Template-First

The user chooses a prepared template grouped by topic, content type, and
complexity.

The user can edit the generated brief until it matches their intent.

CVF then emits a standard Spec with:

- structured context;
- normalized language;
- UI/UX or output requirements when relevant;
- risk level;
- allowed and forbidden actions;
- expected deliverables;
- validation hooks;
- review checkpoint;
- copy-ready agent handoff.

### 2. Describe Your Goal

The user describes an idea in natural language.

CVF proposes the closest template, skill, or pack.

The user confirms or edits the selection.

CVF emits the same standard Spec, rather than sending a vague prompt directly
to an agent.

### 3. AI-Assisted Prompt Preparation

Some users will already pay for API keys or use another LLM/AI tool to think
through the problem before CVF.

This is allowed and useful, but CVF remains the normalizer:

```text
external AI-assisted draft -> CVF validation/normalization -> standard Spec
```

The user may translate or refine the prompt before CVF, but CVF still owns the
final execution contract.

### 4. User-Paid Provider Advisory Lane

Some users will intentionally spend their own API-key budget inside or beside
CVF to choose a provider/model and ask an LLM to advise on the idea, context,
template, skill, wording, or initial requirements.

This lane is advisory only. The selected provider/model may help the user think,
but it does not authorize implementation and does not produce the final agent
contract by itself.

The required flow is:

```text
user selects provider/model
-> advisory LLM helps refine idea/context/template/skill/prompt
-> user accepts or edits the advisory draft
-> CVF validation/normalization runs
-> standard CVF Spec is emitted
-> agent implementation may begin only from the Spec
```

The final Spec must record the advisory lane without treating it as a
governance receipt:

- advisory provider/model when known;
- whether user-paid API keys were used;
- advisory draft summary;
- CVF normalization status;
- final Spec generation status;
- explicit note that advisory output is source material, not implementation
  authorization.

## Standard CVF Spec Output

Every web-facing entry mode should converge to one copy-ready Spec with these
sections:

- Context;
- User Input;
- Input Coverage;
- Task / Intent;
- Expected Output Format;
- Output Template when applicable;
- Execution Constraints;
- Validation Hooks;
- Non-Coder Success Standard;
- Governed Response Rules;
- Knowledge Context Preference;
- Risk / Approval Posture;
- Advisory Source Notes when an external or user-paid LLM helped draft the
  request;
- Agent Handoff Instructions;
- Final User Review Checkpoint.

## Language Posture

The user should be able to input Vietnamese or another native language.

CVF may create an English internal execution brief when that improves agent
understanding, but the generated Spec must preserve:

- original user wording;
- source language;
- working language;
- output language;
- ambiguity notes;
- clarification questions.

The default user-facing summary should be localized. The raw technical Spec and
receipt can remain available for agents and auditors.

## Agent Control Requirements

The Spec must control the agent by making these fields explicit:

- what the agent may do;
- what the agent must not do;
- when the agent must ask for clarification;
- when the agent must stop for approval;
- how success is checked;
- what evidence or receipt must be returned;
- what language the user-facing answer should use;
- whether implementation is authorized or only planning/spec generation is
  authorized.

## Protocol / Contract / Requirements

Protocol: every web-facing non-coder entry mode must converge to a standard
CVF Spec before agent implementation.

Contract: the Spec is the implementation handoff. Loose chat text is source
material, not the agent execution contract.

Requirements:

- preserve original user intent;
- record advisory provider/model usage when the user uses paid keys or an
  external LLM for drafting;
- normalize into a structured Spec;
- expose constraints, validation hooks, and review checkpoints;
- state allowed and forbidden agent actions;
- keep user-facing language localized where possible;
- keep raw technical evidence available for agents and auditors.

## Enforcement / Verification

Future implementation should verify:

- Template-First emits all standard Spec sections;
- Describe Your Goal emits all standard Spec sections after recommendation and
  user edit/confirmation;
- AI-Assisted Prompt Preparation emits all standard Spec sections after CVF
  validation/normalization;
- User-Paid Provider Advisory Lane records advisory provider/model usage and
  still requires CVF validation/normalization before Spec emission;
- Vietnamese input remains valid;
- copy-ready Spec output is agent-readable without hidden UI state;
- implementation authorization is explicit and not implied.

## Boundaries / Non-Goals

Non-goals:

- direct autonomous agent execution from vague chat text;
- treating advisory LLM/provider output as the final implementation contract;
- treating user-paid API-key usage as governance proof;
- hiding governance evidence;
- replacing user review checkpoints;
- claiming hosted readiness;
- claiming public release readiness;
- changing provider adapters or receipt envelopes;
- executing tools, MCP, database actions, browser actions, or spend actions.

## Related Artifacts

- `docs/reviews/archive/CVF_REAL_NONCODER_USAGE_TEST_RESULT_2026-05-25.md`
- `docs/roadmaps/archive/CVF_L1_MULTILINGUAL_SPEC_FIRST_MEDIATION_ROADMAP_2026-05-25.md`
- `docs/reviews/archive/CVF_REAL_NONCODER_USAGE_TEST_OPERATOR_SAMPLE_2026-05-25.md`

## Findings / Position

This flow aligns the operator's product diagnosis with the L1 roadmap:
multilingual handling is not only translation. It is part of a spec-first
control layer that makes non-coder intent executable by agents without losing
governance.

## Risk / Corrective Action

Risk: if CVF optimizes for direct agent execution before the Spec is stable,
non-coder users may get technically valid but inconsistent agent behavior.

Corrective action: L1 should prioritize Spec generation and localized evidence
summary before hosted readiness or broader workflow scale.

## Decision / Recommendation / Disposition

Decision: adopt spec-first web flow as canonical product direction for L1.

Recommendation: L1 implementation should support Template-First, Describe Your
Goal, and AI-Assisted Prompt Preparation as three paths that converge to the
same standard CVF Spec.

Disposition: product direction recorded; implementation still requires fresh
GC-018 and work order.

## Claim Boundary

This is a product direction document. It does not claim implemented web UX,
runtime multilingual mediation, hosted readiness, public readiness, production
readiness, or broad agent-control completeness.
