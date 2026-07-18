# CVF Negative Search And Collision Discipline Standard

Memory class: STANDARD

Status: canonical and machine-enforced standard

## Purpose

Define the bounded evidence discipline for source-verification absence claims.
This standard prevents a work order, roadmap, baseline, review, or completion
packet from closing a bare `NOT FOUND` or `BLOCKED_SOURCE_NOT_FOUND` claim when
the repo contains same-token evidence in another context.

## Scope / Target / Owner Boundary

Target:

- governed markdown artifacts that record absence claims;
- dispatch-quality checker behavior for negative-search evidence;
- work-order authoring template and closure-quality standard references.

Owner boundary:

- owned by governance/control-plane checker maintainers;
- does not own runtime/source semantics, provider behavior, legal analysis, or
  corpus interpretation.

## Scope / Applies-To

Applies to changed, active governed artifacts under work-order, roadmap,
baseline, review, fast-lane audit, and connector-spec validation paths when
they contain `NOT FOUND` or `BLOCKED_SOURCE_NOT_FOUND`.

Does not apply to archived artifacts unless a later active batch reopens them.

## Protocol

Any artifact that claims a token, field, enum, schema key, failure token, or
config key is `NOT FOUND`, or uses `BLOCKED_SOURCE_NOT_FOUND`, must include a
`## Negative Search And Collision Discipline` section.

The section must include:

- exact search roots;
- exact search command or structured query;
- coverage across source, tests, docs, JSON, and external evidence when
  applicable;
- same-token collision results;
- absent-versus-collision disposition.

If the same token appears elsewhere with a different meaning, record the
collision or non-authoritative occurrence, cite the occurrence, and explain why
it is or is not binding for the current work.

## Enforcement

Machine guard:

- `governance/compat/check_work_order_dispatch_quality.py`

The guard is intentionally bounded. It checks evidence structure and
same-token collision disclosure. It does not prove semantic correctness,
runtime behavior, legal advice quality, current-law freshness, production
readiness, or public readiness.

## Failure Modes

- Bare absence claim without a negative-search evidence section.
- Evidence section omits search roots, command/query, coverage, collision
  result, or disposition.
- Artifact claims a token as absent while the same token appears elsewhere in
  the repo and the artifact does not record a collision or non-authoritative
  occurrence.
- Artifact records a same-token collision as `none` while the repo contains
  the same token elsewhere.

## Public Export Disposition

DEFERRED_PRIVATE_ONLY

Reason: this is an internal provenance control-plane standard. Public
documentation can summarize the pattern later through a separate public-sync
batch if authorized.

## Claim Boundary

This standard improves evidence discipline for absence claims. It does not
guarantee every source-verification claim is semantically correct, nor does it
replace reviewer sampling for high-impact source, legal, or runtime claims.
