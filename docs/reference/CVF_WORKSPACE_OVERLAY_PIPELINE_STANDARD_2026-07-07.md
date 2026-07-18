# CVF Workspace Overlay Pipeline Standard

Memory class: ACTIVE_REFERENCE

Status: ACTIVE_REFERENCE

docType: reference

Date: 2026-07-07

## Scope / Applies To

Applies to workspaces that inherit CVF premium assets or private continuity files using the local-first overlay pipeline. Does not apply to public-core workspaces that stay anchored strictly to the public core repository.

## Purpose

Define a local-first pipeline that lets a workspace inherit selected
high-value CVF provenance assets without turning the workspace into a direct
clone of the private provenance repository.

## Base Model

The hidden workspace core stays anchored to the public repository:

`https://github.com/Blackbird081/Controlled-Vibe-Framework-CVF.git`

Overlay is a second step that copies reviewed files from the provenance repo on
top of that fresh public clone.

This keeps three layers separate:

1. `public-core`
2. `premium-workspace`
3. `provenance-local`

## Layer Meanings

### 1. `public-core`

- Source: public GitHub repo only
- Use when the workspace should stay public-safe
- No private continuity state is copied

### 2. `premium-workspace`

- Source: provenance allowlist
- Adds curated rules, guards, and governance references that are useful for
  downstream project execution
- Excludes canonical private session continuity surfaces such as
  `CVF_SESSION/` and `CVF_SESSION_MEMORY.md`

### 3. `provenance-local`

- Extends `premium-workspace`
- Adds canonical internal continuity surfaces for the local operator machine,
  including `CVF_SESSION/`, `CVF_SESSION_MEMORY.md`, and the provenance
  `AGENTS.md`
- Intended for private/local use, not public export

## Source Of Truth

Overlay definitions live under:

`workspace_overlay_profiles/`

Artifact classification lives under:

`workspace_overlay_catalog.json`

Profiles should stay thin. They select by stable tags such as
`workspace-premium` or `workspace-provenance-local` instead of carrying long
manual file lists.

Recommended structure:

- lane profiles select one stable concern each;
- bundle profiles extend those lane profiles;
- local operator profiles extend bundle profiles plus local continuity lanes.

This is the long-lived maintenance rule:

1. add or update the source artifact;
2. decide whether the artifact is export-safe and useful for a workspace;
3. classify it once in `workspace_overlay_catalog.json`;
4. keep profile JSON unchanged unless a new lane is needed.

Each catalog entry must declare:

- `artifactId`
- `path`
- `artifactClass`
- `selectionTags`
- `stability`
- `reviewPolicy`
- `reason`

Directory entries are exported recursively.

Validate the catalog and profile set before publishing or relying on a changed
overlay configuration. R70A defines the catalog/profile contract only; it does
not create overlay validation, export, report, or apply scripts.

## Future Implementation Hooks

The following command names are reserved as candidate script surfaces for a
later implementation tranche. They are not available from R70A and must not be
cited as executable evidence until a later source-verified packet creates and
tests them:

- `scripts\check_cvf_workspace_overlay_catalog.ps1`
- `scripts\get_cvf_workspace_overlay_profile_report.ps1`
- `scripts\export_cvf_workspace_overlay.ps1`
- `scripts\apply_cvf_workspace_overlay.ps1`

## Expected Verification Behavior

The downstream doctor still expects the hidden core to:

- point at the public `origin`
- contain the public workspace kit
- match `origin/main` by commit

An applied overlay may leave the hidden core worktree dirty. That is acceptable
as a bounded note because the doctor reports pending overlay state as a warning,
not a hard failure.

## Boundary

This pipeline is local-first by default.

Running it does not publish anything to GitHub. A later provenance push is a
separate operator decision after review.

## Selection Criteria

Use these criteria before tagging an artifact into a workspace lane:

### `workspace-premium`

- useful to downstream project execution;
- canonical enough to survive normal repo churn;
- not dependent on private operator-only continuity state;
- safe to layer on top of a public hidden core.
- must not depend on `CVF_SESSION/`, `CVF_SESSION_MEMORY.md`, or versioned
  private handoff files.

### `workspace-provenance-local`

- needed for full-fidelity local operator continuity;
- allowed to be volatile;
- private/local-only by nature;
- must not be treated as public-safe export.

## Bundle Profiles

Current lane profiles:

- `premium-orientation`
- `premium-governance`
- `premium-authoring`
- `premium-boundary`
- `premium-operator-runbook`
- `premium-skill-enablement`
- `provenance-continuity-local`

Current bundle profiles:

- `premium-workspace`
- `premium-extended-workspace`
- `provenance-local`
- `provenance-extended-local`

Recommended use:

- `premium-workspace`: stable default premium bundle
- `premium-extended-workspace`: stable default plus optional operator and skill lanes
- `provenance-local`: local full continuity on top of the stable default
- `provenance-extended-local`: local full continuity plus optional operator and skill lanes

## Future Machine Validation

A later checker or script should fail when:

- a catalog entry points to a missing path;
- an `artifactId` or path is duplicated;
- a required field is missing;
- a profile references an unknown selector;
- `workspace-premium` includes private continuity surfaces;
- `workspace-provenance-local` uses anything other than `local-only` review
  policy.

## Claim Boundary

This standard defines the local-first overlay vocabulary, catalog shape, and
profile separation rules for future workspace overlay work. It does not create
or validate overlay scripts, apply an overlay, mutate public-sync, publish a
public artifact, claim hosted or production readiness, or authorize runtime,
provider/live, source, test, checker, wrapper, bootstrap, or installer changes.

## Public Export Disposition

DEFERRED_PRIVATE_ONLY

Reason: R70A is a private provenance definition tranche. Public export or
public-safe adaptation of this overlay standard requires a later governed
public-sync packet and separate operator authorization.
