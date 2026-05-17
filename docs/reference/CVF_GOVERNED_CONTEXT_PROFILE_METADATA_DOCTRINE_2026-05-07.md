# CVF Governed Context Profile Metadata Doctrine

Memory class: POINTER_RECORD

Document type: CANONICAL — CVF-NATIVE DOCTRINE

Status: official docs absorption from CVF ADD, Phase B, 2026-05-07.

Source lineage: CVF ADD arbitration and synthesis normalized profile,
efficiency, execution-binding, and reinjection concepts from caveman, Workflow
GoClaw, Agent Engineer, and related sources.

## Purpose

This doctrine defines the safe role of context profiles inside CVF.

A context profile is advisory metadata. It may help existing CVF owner surfaces
select, compress, defer, or reinject context. It must not become a new router,
memory owner, policy engine, or execution authority.

## Accepted Profile Shape

```yaml
governed_context_profile:
  task_context_type: string
  capability_need: string
  skill_match: high|medium|low|unknown
  context_budget: compact|standard|expanded
  freshness_requirement: current|recent|historical|unknown
  reuse_candidate: true|false
  reinjection_policy: none|summary_only|artifact_pointer|full_record_when_authorized
  handoff_need: none|phase_checkpoint|agent_transfer|closure
  evidence_sensitivity: low|medium|high
  owner_surface_hint: string
```

All fields are metadata. None of them authorize runtime behavior.

## Owner Binding

| Profile Use | Required Owner |
|---|---|
| Route hint | Intent router remains authority. |
| Context budget | Context builder / packager remains authority. |
| Knowledge reference | Knowledge Layer remains authority. |
| Continuity / handoff hint | Execution continuity + AGENT_HANDOFF remain authority. |
| Risk/evidence sensitivity | Policy engine and evidence layer remain authority. |
| Provider or model implication | Provider/Model Gateway remains authority. |

If a profile field cannot map to an existing owner, the field is invalid.

## Accepted Uses

- Reduce repeated context across continuation.
- Mark which source material is canonical, deferred, example-only, or rejected.
- Help agents decide whether to summarize, cite, ignore, or preserve a source.
- Make reinjection policy explicit instead of hidden in prompt memory.
- Support final-result review by showing why some context was included or
  excluded.

## Rejected Uses

Context profiles must not:

- create a parallel prompt-mode subsystem;
- route around `intent-router.ts`;
- write hidden memory;
- lower a risk class;
- suppress live-governance proof requirements;
- grant tool, provider, or worker permissions;
- override a roadmap or GC-018 boundary.

## Relationship To CVF Core

This doctrine exists because CVF's core is controlled execution, not operator
micromanagement. Agents should audit available context, choose the best bounded
context package, and record the profile decision clearly enough for final
review.

The operator should see the final state and evidence, not be forced to decide
every context-selection tradeoff.

## Runtime Activation Boundary

Runtime use requires a future roadmap that chooses concrete owner surfaces and
testable fields. Until then, this doctrine is canonical guidance only.

