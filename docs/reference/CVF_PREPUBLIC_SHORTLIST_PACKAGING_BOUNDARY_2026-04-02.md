# CVF Pre-Public Shortlist Packaging Boundary — 2026-04-02

Memory class: POINTER_RECORD
Status: canonical packaging-boundary reference for the first bounded selective-export planning wave.

## Purpose

- define the first planning boundary for packaging work on the approved shortlist
- keep first-wave export planning smaller than a full publication program
- stop shortlist members from inheriting an open-ended public-support promise

## Core Rule

Packaging-boundary definition means:

- the candidate now has a bounded planning envelope
- future implementation packets can target a smaller, named surface

It does not mean:

- `READY_FOR_EXPORT`
- approved package publication
- approved public support commitment

## Cross-Cutting Boundary Rule

Any future packaging packet for this shortlist must:

- anchor on a canonical root entry surface or explicit documented subpaths
- distinguish stable exported API from optional runtime/provider/helper internals
- document non-code assets that must ship with the package, if any
- avoid treating tests, local evidence files, or repo-internal wiring as public API promises

## Candidate Boundary Summary

### `CVF_GUARD_CONTRACT`

Preferred first-wave packaging boundary:

- root guard barrel and typed contracts:
  - `src/index.ts`
  - `src/types.ts`
  - `src/engine.ts`
- explicit governed guard surfaces:
  - `src/guards/*.ts`
- selected runtime helpers already surfaced by the root barrel:
  - agent handoff
  - agent coordination

Boundary cautions:

- current manifest already exposes wildcard runtime subpaths and an enterprise subpath
- provider-specific runtime integrations under `src/runtime/providers/` should not become implicit first-wave promises without a separate support decision
- SQLite-backed audit persistence should be treated as optional packaging surface, not default public-contract scope

### `CVF_v3.0_CORE_GIT_FOR_AI`

Preferred first-wave packaging boundary:

- root barrel:
  - `index.ts`
- bounded primitive families:
  - `ai_commit/`
  - `artifact_staging/`
  - `artifact_ledger/`
  - `process_model/`
  - `skill_lifecycle/`

Boundary cautions:

- this candidate already reads like one cohesive primitive package
- current package shape still needs explicit public export mapping instead of relying only on the root TypeScript barrel
- future packaging should preserve the “core primitives” story and avoid broad repo-workflow promises beyond these families

### `CVF_v1.7.3_RUNTIME_ADAPTER_HUB`

Preferred first-wave packaging boundary:

- contract layer:
  - `contracts/`
- adapter layer:
  - `adapters/`
- support layers that explain or configure adapters:
  - `policy/`
  - `explainability/`
  - `risk_models/`

Boundary cautions:

- the root currently has a package manifest, but no canonical root `index.ts` barrel or explicit package `exports` map
- adapter capability levels must stay explicit; shell-capable, filesystem-capable, and HTTP-capable adapters cannot be collapsed into one undifferentiated “safe default” promise
- packaged JSON/config assets must be named explicitly in any later implementation packet

## First-Wave Consequences

- all three shortlist candidates remain `NEEDS_PACKAGING`
- future implementation packets should focus on:
  - canonical entrypoints
  - explicit export maps
  - public-facing README/release boundary clarity
  - asset inclusion rules where needed
- future implementation packets should not widen the shortlist automatically

## Deferred Boundary Work

Still deferred outside this reference:

- broad foundation-family export packaging
- readiness upgrades from `NEEDS_PACKAGING` to `READY_FOR_EXPORT`
- public package publication or release automation
- documentation mirror execution

## Related Artifacts

- `docs/reference/CVF_PREPUBLIC_EXPORT_SHORTLIST_2026-04-02.md`
- `docs/reference/CVF_PREPUBLIC_PUBLICATION_DECISION_MEMO_2026-04-02.md`
- `docs/reference/CVF_PREPUBLIC_RESTRUCTURING_UNIFIED_AGENT_PROTOCOL.md`
- `docs/reference/CVF_REPOSITORY_EXPOSURE_CLASSIFICATION.md`
- `governance/compat/CVF_EXTENSION_LIFECYCLE_REGISTRY.json`
