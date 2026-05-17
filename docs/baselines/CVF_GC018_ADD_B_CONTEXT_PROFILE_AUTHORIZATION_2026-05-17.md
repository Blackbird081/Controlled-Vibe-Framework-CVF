Memory class: SUMMARY_RECORD

# CVF GC-018 ADD-B Context Profile Authorization - 2026-05-17

Status: AUTHORIZED FOR LOCAL IMPLEMENTATION.

## Purpose

Authorize Step 8 from the V8 absorption queue: ADD-B Context Profile Metadata.

## Scope

Owner surface:

- `EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION/`

Secondary surface:

- `EXTENSIONS/CVF_GUARD_CONTRACT/` conceptually owns the policy validation
  meaning for restricted evidence sensitivity.

Permitted implementation:

- `ContextProfile` type;
- `applyContextProfile` builder helper;
- restricted sensitivity flag for upstream policy validation;
- focused tests;
- roadmap, inventory, consensus roadmap, and handoff updates.

## Source

- `docs/reviews/CVF_DEFERRED_ITEMS_SOLUTION_PROPOSALS_2026-05-17.md`
- `docs/roadmaps/CVF_UNABSORBED_KNOWLEDGE_FINAL_CONSENSUS_ROADMAP_2026-05-17.md`
- ADD-B synthesis from the Phase A/B intake path.

## Decision

Approved direction: implement ADD-B as advisory context metadata in Control
Plane Foundation. Restricted sensitivity is represented as a validation flag,
not as runtime enforcement.

## Non-Goals

- no execution authority;
- no prompt injection;
- no provider routing change;
- no approval authority;
- no new source registry;
- no release gate change.

## Evidence / Verification

Required before closure:

- Control Plane Foundation tests;
- Control Plane Foundation TypeScript check;
- GC-023 pre-flight line check;
- documentation updates listed in this packet.

## Claim Boundary

Context profiles shape context assembly only. They cannot approve work, inject
prompts, change routing, or override policy decisions.
