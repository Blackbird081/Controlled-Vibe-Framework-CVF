Memory class: SUMMARY_RECORD

# ADR: Context Profile Advisory Metadata

Date: 2026-05-17

Status: ACCEPTED LOCALLY.

## Purpose

Define the relationship between ADD-B `ContextProfile` metadata and existing
Control Plane context, knowledge, and policy surfaces.

## Context

The V8 absorption queue authorized ADD-B after OBS-1 and previous runtime
absorption steps completed. The deferred knowledge item described a compact
context profile that could reduce token waste and improve handoff quality, but
only if it stayed advisory and did not become a hidden policy override.

## Scope

Owner surface:

- `EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION/`

Related policy surface:

- `EXTENSIONS/CVF_GUARD_CONTRACT/`

This ADR covers the `ContextProfile` record shape, its builder helper, and its
relationship to existing source identity surfaces.

## Decision

`ContextProfile` is an advisory record owned by Control Plane Foundation. It
helps Context Builder rank existing source IDs, apply context budget hints,
preserve reinjection approval hints, and surface evidence sensitivity for
upstream policy validation.

The profile does not create a source registry. `sourceRelevance.sourceId` and
`reinjectionEligibility.sourceId` must refer to source IDs already owned by
the relevant knowledge or intake surface.

Restricted `evidenceSensitivity` is represented as a
`requiresPolicyValidation` flag in the builder output. The flag is intentionally
not runtime enforcement; the caller or Policy Engine integration must act on
it.

## Alternatives

- Make Context Profile an enforcement contract. Rejected because ADD-B is
  explicitly advisory and must not approve work or override policy.
- Add a new source registry. Rejected because Knowledge Vault and related
  intake surfaces already own source identity.
- Inject profile metadata directly into prompts. Rejected because that would
  widen runtime behavior and prompt authority beyond the authorized scope.

## Gate / Boundary

The implementation gate is TypeScript plus focused CPF tests. The boundary is:
profile metadata may shape context assembly, but may not authorize execution,
provider routing, prompt injection, or policy override.

## Consequences

- Context assembly can become more deterministic without adding execution
  authority.
- Policy-sensitive evidence handling is visible as a typed signal instead of
  hidden convention.
- Knowledge intake remains the owner of source identity and source metadata.
- No prompt injection, approval, routing, or provider behavior changes are
  introduced by this ADR.

## Claim Boundary

This ADR records an advisory metadata decision only. It does not claim runtime
emission, live provider governance behavior, or release-gate coverage.

## Verification

Verified through:

- `EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION/tests/context.profile.contract.test.ts`
- `npm test`
- `npm run check`
