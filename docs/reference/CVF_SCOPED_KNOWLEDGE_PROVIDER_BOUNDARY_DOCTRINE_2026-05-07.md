# CVF Scoped Knowledge Provider Boundary Doctrine

Memory class: POINTER_RECORD

Document type: CANONICAL — CVF-NATIVE DOCTRINE

Status: official docs absorption from CVF ADD, Phase B, 2026-05-07.

Source lineage: CVF ADD arbitration and synthesis normalized code graph,
cortex, source-map, and indexed reference concepts from code-review-graph,
cortex, and related sources.

## Purpose

This doctrine defines how CVF should treat graph, cortex, source-map, and
indexed reference systems.

They are scoped knowledge providers. They may provide context. They must not
become governance authority.

## Core Rule

A scoped knowledge provider can answer "what does this source suggest?" It
cannot answer "what is CVF allowed to do?"

Governance authority remains with CVF policy, roadmap, evidence, and canonical
docs.

## Required Metadata

Any future runtime knowledge provider should expose:

```yaml
scoped_knowledge_provider:
  provider_id: string
  source_path: string
  source_class: canon|private_reference|external_reference|generated_index|example|rejected_material
  freshness: current|stale|unknown
  confidence: high|medium|low|unknown
  scope_boundary: string
  retrieval_reason: string
  owner_surface: string
  policy_authority: false
```

`policy_authority` must remain `false`.

## Accepted Uses

- Help agents find relevant source material.
- Improve code/document navigation.
- Support context packaging.
- Provide provenance and freshness signals.
- Preserve why a source was included or excluded.

## Rejected Uses

Scoped knowledge providers must not:

- override policy classification;
- present stale source as canon;
- leak ignored/private material into public docs;
- mutate repository state by themselves;
- claim test or live-governance proof;
- decide release readiness.

## Relationship To Knowledge Layer

The Knowledge Layer owns storage and retrieval. The context builder owns
packaging. The policy/evidence layers own governance interpretation and proof.

A provider is useful only when its scope is explicit and its authority is
limited.

## Runtime Activation Boundary

Runtime activation requires a future implementation roadmap with source
filtering, provenance, privacy boundaries, and tests. This doctrine is the
canonical boundary before that work begins.

