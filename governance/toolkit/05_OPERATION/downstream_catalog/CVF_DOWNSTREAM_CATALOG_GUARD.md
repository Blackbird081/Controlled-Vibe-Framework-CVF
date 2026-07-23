# CVF Downstream Catalog Guard

Memory class: POINTER_RECORD

Status: Reference documentation for the golden-downstream bootstrap catalog
kit. This is not yet a registered numbered `GC-xxx` control; it documents the
behavior implemented by the bootstrap kit and enforced by the workspace
doctor and the generated project's own catalog manager.

Text Encoding Exception: preserve Unicode symbols in the imported public guard
examples; no machine-readable token depends on them.

**Applies to:** downstream projects bootstrapped by `scripts/new-cvf-workspace.ps1`
with the governed downstream catalog kit (tranche `CVF-BSL-T1`, repair round
following independent review findings BSL-R1 through BSL-R7).

**Enforced by:**
- the generated project's own `scripts/manage_cvf_downstream_catalog.ps1 -Check`
- `scripts/check_cvf_workspace_agent_enforcement.ps1` (fails closed when any
  governed-catalog marker or surface is present but incomplete; bounded
  legacy-compatibility path only when none is present at all)

## Purpose

- keep the machine sources of truth (`docs/catalog/ARTIFACT_REGISTRY.json`,
  `docs/catalog/MODULE_REGISTRY.json`) and their generated human views
  (`docs/INDEX.md`, `docs/catalog/MODULE_CATALOG.md`) from drifting apart
- make a bootstrapped project's authority surfaces (schemas, tool, manifest,
  policy, continuity, implementation truth, governed artifact families)
  machine-discoverable instead of hand-authored prose
- keep an empty Module Registry from ever implying roadmap or runtime
  capability that has not been source-verified
- never overwrite a project's own pre-existing catalog-shaped content

## Rule

A governed downstream catalog must validate its source registries before
writing derived views, preserve project-owned content, and fail closed when a
declared governed kit is damaged.

## Catalog state before any write (BSL-R1)

Bootstrap classifies catalog state before touching any catalog file:

| State | Trigger | Bootstrap action |
|---|---|---|
| `FRESH` | no `docs/catalog/ARTIFACT_REGISTRY.json` and no legacy signal | install the full kit (schemas, tool, both registries, generated views) |
| `ALREADY_GOVERNED` | `ARTIFACT_REGISTRY.json` exists and passes the closed-schema shape check | preserve the registries; regenerate `docs/INDEX.md` / `docs/catalog/MODULE_CATALOG.md` from them |
| `DAMAGED_GOVERNED` | `ARTIFACT_REGISTRY.json` exists but fails to parse or fails the shape check | preserve everything; do **not** touch the generated views; report the damage |
| `LEGACY_OR_MIXED` | no `ARTIFACT_REGISTRY.json`, but a pre-existing `docs/catalog/MODULE_REGISTRY.json`, `docs/INDEX.md`, `docs/catalog/MODULE_CATALOG.md`, or manager script is present | **no catalog/view mutation of any kind** - report `MIGRATION_REQUIRED_SKIPPED` and stop; a maintainer must adopt the kit deliberately |

A legacy or mixed project's existing `docs/INDEX.md` and
`docs/catalog/MODULE_CATALOG.md` are guaranteed byte-identical before and
after bootstrap.

## Governed-catalog marker (BSL-R3)

A freshly bootstrapped or already-governed manifest carries
`.cvf/manifest.json` → `catalogKitVersion` (currently `1.1`). That field is
never added to a `LEGACY_OR_MIXED` project's manifest, and `requiredDocs`
only references governed-catalog paths when the project is not
`LEGACY_OR_MIXED`.

The doctor treats a project as **governed** (must be complete) if the
manifest carries `catalogKitVersion` **or** any of these surfaces exist:

```text
scripts/manage_cvf_downstream_catalog.ps1
scripts/lib/downstream_catalog/CvfDownstreamCatalogLib.ps1
docs/catalog/ARTIFACT_REGISTRY.json
docs/catalog/schemas/ARTIFACT_REGISTRY.schema.json
docs/catalog/schemas/MODULE_REGISTRY.schema.json
```

- **None** of the above and no marker → true legacy project → bounded,
  non-blocking `LEGACY_PROJECT` note; pre-existing checks only.
- **Any** of the above but not all → `DAMAGED_GOVERNED_KIT` → blocking
  failure naming the missing surface(s). A governed-kit deletion can never
  silently fall back to legacy compatibility.
- **All** present → the manager runs in `-Check` mode; its result is the
  blocking pass/fail.

## Two registries, two purposes

| Registry | Purpose | Starting state |
|---|---|---|
| `ARTIFACT_REGISTRY.json` | self-registers the bootstrap kit's own authority surfaces (schemas, tool, manifest, policy, continuity, implementation-truth, generated views, governed artifact family folders) | populated with the fixed baseline surface set at bootstrap time |
| `MODULE_REGISTRY.json` | source-verified application runtime modules | empty; `claimBoundary` states no module may be inferred from plans, handoffs, or provider memory |

Both registries must declare the same `projectName`; a mismatch is rejected.

Schemas: `docs/catalog/schemas/ARTIFACT_REGISTRY.schema.json` and
`docs/catalog/schemas/MODULE_REGISTRY.schema.json` (closed vocabulary
reference copied from `scripts/lib/downstream_catalog/schemas/`).

## Closed schema enforcement (BSL-R2)

The manager enforces the schema contract structurally, not just in
documentation:

- every top-level required field (`schemaVersion`, `projectName`,
  `updatedAt`, `claimBoundary`, `artifacts`/`modules`) must be present;
- no top-level or entry-level property outside the closed set is allowed
  (`additionalProperties: false` is enforced, not just declared);
- every entry required field must be present, non-empty, and the correct
  type (string fields must be strings; `controls`/`dependencies` must be
  arrays when present);
- `-Write` runs every check above before touching a single generated view;
  any violation blocks the write.

## Closed vocabulary

- Artifact `family`: `schema`, `tool`, `manifest`, `policy`, `continuity`,
  `implementation_truth`, `generated_view`, `governed_artifact_family`.
- Artifact `status`: `ACTIVE`, `DEPRECATED`, `RETIRED`.
- Module `status` (BSL-R4, source-backed only - no value may represent
  plan-only intent): `ENFORCED`, `PARTIAL`, `CONTRACT_ONLY`, `STUB`,
  `DEPRECATED`. `PLANNED` and any other roadmap-only token are rejected.
  Every module entry also requires a non-empty `evidence` field - a
  concrete file/line or test/gate reference that justifies the selected
  status. A row that only points at a doc like `docs/INDEX.md` with no
  enforcing test or gate does not earn `ENFORCED`.
- Module `controls` entries must match `^GC-[0-9]{3}$`; anything else is
  rejected as an unknown CVF control token.
- Module `dependencies` entries must reference another module `id` already
  present in the same registry; anything else is rejected as an unknown
  dependency.

## Rejected conditions (`--check` and `--write` both validate first)

- a registered path that does not exist under the project root
- a duplicate `id` or duplicate `path` within either registry
- a path that escapes the project root (`..` segment), is rooted
  (`C:\...`), or uses a Windows backslash separator
- a required field missing, null, empty, or the wrong type
- a property outside the closed schema (top-level or entry-level)
- an invalid lifecycle/status value outside the closed vocabulary above,
  including any plan-only module status
- Artifact/Module Registry `projectName` mismatch
- a generated view (`docs/INDEX.md`, `docs/catalog/MODULE_CATALOG.md`) whose
  on-disk content does not byte-match what the manager would render from the
  current registries (hand-edited or stale view)
- a missing mandatory baseline Artifact Registry entry, or one whose `path`
  no longer matches the baseline

Any violation is a blocking failure (`--check`, and the doctor's governed
catalog check when the kit is complete). `--write` does not modify
`docs/INDEX.md` or `docs/catalog/MODULE_CATALOG.md` when validation fails.

## Legacy compatibility

A downstream project with no governed-catalog marker and no governed-catalog
surface at all is a true legacy project: the doctor reports a bounded,
non-blocking `LEGACY_PROJECT` note and evaluates only the pre-existing checks
(front-door presence, JSON validity). Bootstrap never rewrites an existing
`docs/catalog/MODULE_REGISTRY.json`, `docs/INDEX.md`, or
`docs/catalog/MODULE_CATALOG.md` in place, and for a `LEGACY_OR_MIXED`
project it does not add the kit's other surfaces either - see the catalog
state table above. Migrating an existing downstream catalog into the new
schema is out of scope for this tranche and is an explicit, separate
maintainer action.

## Enforcement Surface

- `scripts/lib/downstream_catalog/manage_cvf_downstream_catalog.ps1`
- `scripts/check_cvf_workspace_agent_enforcement.ps1`
- `scripts/test_cvf_golden_downstream_bootstrap.ps1`

## Related Artifacts

- `docs/reference/CVF_GOLDEN_DOWNSTREAM_BOOTSTRAP_SPEC_2026-07-23.md`
- `docs/reference/CVF_WORKSPACE_RULES.md`

## Claim boundary

This kit proves that a bootstrapped project's own generated authority
surfaces are internally consistent, closed-schema-valid, and non-drifted. It
does not prove that any listed module is implemented, tested, or
production-ready - a module's `status` and `evidence` are only as honest as
the person who wrote them - and it does not run or require a live
AI-provider call.

## Final Clause

The guard documents and routes the catalog checks implemented by the named
scripts; it does not independently execute, migrate, or repair a downstream
project.
