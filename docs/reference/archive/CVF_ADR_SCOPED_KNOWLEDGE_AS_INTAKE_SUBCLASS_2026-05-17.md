Memory class: POINTER_RECORD

# ADR: Scoped Knowledge As Intake Subclass

Date: 2026-05-17

Status: ACCEPTED LOCALLY.

## Purpose

Document how ADD-E1 `ScopedKnowledgeProvider` relates to knowledge vault intake
and ADD-B Context Profile.

## Context

The V8 queue authorized ADD-E1 after ADD-B Context Profile completed. The
accepted ADD-E1 value is conditional and bounded: code graph, cortex,
source-map, and indexed-reference sources can reduce broad file scanning, but
must stay read-only and must not become a second governance or source registry.

`knowledge.vault.intake.contract.ts` was 575 lines at GC-023 pre-flight.
Adding the scoped provider implementation in place would push that file beyond
the governed markdown/source size safety margin, so the contract is implemented
as a separate CPF file and exported through the knowledge barrel.

## Scope

Owner surface:

- `EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION/`

Related contracts:

- `knowledge.vault.intake.contract.ts`
- `knowledge.vault.intake.types.ts`
- `context.profile.contract.ts`

## Decision

Add `ScopedKnowledgeProvider` as a read-only knowledge intake subclass in CPF.
All provider classes map to the existing knowledge vault asset class
`external_reference`; no separate source registry is introduced.

Provider output has one permitted consumer path:

- query scoped provider paths;
- convert the provider to `ContextProfile.sourceRelevance`;
- let Context Builder consume that advisory source relevance.

Policy Engine behavior is conservative: every provider action request is
blocked by `guardProviderAction`. Providers cannot classify risk, override
governance decisions, execute code, mutate files, or directly inject context.

## Alternatives

- Extend `knowledge.vault.intake.contract.ts` in place. Rejected because the
  file was already near the governed size limit and the new implementation
  would push it over the safe boundary.
- Create a separate code-intelligence registry. Rejected because ADD-E1 must be
  a subclass of existing knowledge intake, not a parallel registry.
- Let provider output inject context directly. Rejected because ADD-B already
  defines the bounded advisory context profile path.

## Gate / Boundary

The implementation gate is CPF test/typecheck coverage. The boundary is:
providers can return scoped read-only paths and metadata; callers decide how to
use that advisory relevance inside existing context assembly.

## Consequences

- Code intelligence providers have a typed registration shape with explicit
  scope, freshness, confidence, and source class.
- Rejected providers return no query results.
- Provider outputs can be ranked through `ContextProfile.sourceRelevance`.
- Future runtime work must still implement any actual indexing engine under a
  new roadmap and authorization packet.

## Claim Boundary

Read-only provider contract only. No code execution, no governance override,
no provider routing change, no release gate change, and no GA posture change.

## Verification

Verified through:

- `EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION/tests/scoped.knowledge.provider.contract.test.ts`
- CPF `npm test` and `npm run check`
