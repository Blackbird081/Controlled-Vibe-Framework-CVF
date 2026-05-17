Memory class: SUMMARY_RECORD

# CVF GC-018 ADD-E1 Scoped Knowledge Authorization - 2026-05-17

Status: AUTHORIZED FOR LOCAL IMPLEMENTATION.

## Purpose

Authorize Step 10c from the V8 absorption queue: ADD-E1 Scoped Knowledge /
Code Graph provider contract.

## Scope

Owner surface:

- `EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION/`

Permitted implementation:

- `ScopedKnowledgeProvider` type as a read-only subclass of knowledge vault
  intake;
- query helper limited to scoped provider paths;
- provider-action guard that blocks policy override and execution attempts;
- mapping helper from provider output to `ContextProfile.sourceRelevance`;
- focused tests and ADR;
- inventory, consensus roadmap, and handoff updates.

## Source

- `docs/reviews/CVF_DEFERRED_ITEMS_SOLUTION_PROPOSALS_2026-05-17.md`
- `AGENT_HANDOFF_V8_2026-05-17.md`

## Decision

Approved direction: implement ADD-E1 as a Control Plane contract that lets
code graph, cortex, source-map, and indexed-reference providers register as
read-only knowledge sources. Provider output is consumed only through context
profile source relevance, not through direct prompt injection or policy
override.

## Non-Goals

- no code execution;
- no code graph runtime engine;
- no separate source registry;
- no governance override by provider output;
- no provider routing or release gate change.

## Evidence / Verification

Required before closure:

- Control Plane Foundation tests and TypeScript check;
- ADR documenting the relationship to knowledge vault intake and ADD-B Context
  Profile;
- inventory and final consensus roadmap updates.

## Claim Boundary

ADD-E1 is a read-only provider contract. It defines scoped metadata, query
limits, and blocking behavior only. It does not execute code, classify risk, or
override governance decisions.
