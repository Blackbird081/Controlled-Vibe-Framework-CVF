# CVF Pre-Public Docs Mirror Boundary — 2026-04-02

Memory class: POINTER_RECORD
Status: canonical boundary reference for a future `PRIVATE_CORE + PUBLIC_DOCS_MIRROR` implementation.

## Purpose

- define what a future public docs mirror may include
- prevent `PUBLIC_DOCS_ONLY` from being misread as “mirror the whole `docs/` root”
- preserve evidence-heavy and governance-heavy material inside the private core

## Core Rule

A future public docs mirror is a curated subset, not a wholesale copy of `docs/`.

The exposure class `PUBLIC_DOCS_ONLY` means a surface may participate in public-facing documentation.
It does not mean every file under that root should be mirrored automatically.

## Direct Mirror Candidates

These are the first-pass candidates for a future public docs mirror.

### Root Front-Door Files

- `README.md`
- `START_HERE.md`
- `ARCHITECTURE.md`
- `LICENSE`
- `CHANGELOG.md`
- `CVF_ECOSYSTEM_ARCHITECTURE.md`
- `CVF_LITE.md`

### Learning And Orientation Zones

- `docs/guides/`
- `docs/concepts/`
- `docs/tutorials/`
- `docs/case-studies/`
- `docs/cheatsheets/`

### Concise Docs-Root Guides

- `docs/GET_STARTED.md`
- `docs/HOW_TO_APPLY_CVF.md`
- `docs/VERSION_COMPARISON.md`
- `docs/VERSIONING.md`
- `docs/CHEAT_SHEET.md`

## Conditional Mirror Zone

These surfaces may contribute to a future public docs mirror, but only after per-file review.

### Selected Explanatory Reference Files

Likely candidates:

- `docs/reference/CVF_REFERENCE_GOVERNED_LOOP.md`
- `docs/reference/CVF_ARCHITECTURE_MAP.md`
- `docs/reference/CVF_POSITIONING.md`
- `docs/reference/CVF_NONCODER_REFERENCE_GOVERNED_PACKET.md`
- `docs/reference/CVF_RELEASE_READINESS_STATUS_2026-03-20.md`
- `docs/reference/CVF_ONE_PAGE_MASTER_BLUEPRINT.md`
- `docs/reference/CVF_MINIMUM_VIABLE_GOVERNANCE_STACK.md`

Review rule:

- include only explanatory/product-facing references
- exclude governance-control internals, enforcement templates, internal retention registries, and restructuring packets

## Private-Core-Only Zone

These surfaces must remain in the private core and must not be mirrored by default.

### Evidence And Governance Records

- `docs/audits/`
- `docs/reviews/`
- `docs/baselines/`
- `docs/logs/`
- `docs/roadmaps/`

### Internal Bootstrap And Dense Memory

- `docs/INDEX.md`
- `docs/BUG_HISTORY.md`
- `docs/CVF_INCREMENTAL_TEST_LOG.md`
- `docs/CVF_ARCHITECTURE_DECISIONS.md`
- `docs/CVF_CORE_KNOWLEDGE_BASE.md`
- `AGENT_HANDOFF.md`
- governance policy and compat surfaces outside `docs/`

## Foundation Anchor Interaction

- `v1.0/` and `v1.1/` remain visible private-core foundation anchors
- the docs mirror is not the mechanism for relocating or hiding those roots
- their public/noise reduction comes from curated front-door navigation, not from pretending they belong in a public docs mirror

## Implementation Preconditions

Before any real docs mirror is created:

- replace private-core links that point into audits, reviews, baselines, logs, or internal-only roots
- verify that mirrored pages do not imply full-repo public availability
- ensure no internal workflow, handoff, or governance scratch surfaces are referenced as public entrypoints
- run a dedicated mirror-content pass for each selected `docs/reference/` file

## Related Artifacts

- `docs/reference/CVF_PREPUBLIC_PUBLICATION_DECISION_MEMO_2026-04-02.md`
- `docs/reference/CVF_PREPUBLIC_RESTRUCTURING_UNIFIED_AGENT_PROTOCOL.md`
- `docs/reference/CVF_REPOSITORY_EXPOSURE_CLASSIFICATION.md`
- `docs/roadmaps/CVF_PREPUBLIC_REPOSITORY_RESTRUCTURING_ROADMAP_2026-04-02.md`
