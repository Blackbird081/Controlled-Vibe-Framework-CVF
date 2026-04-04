# CVF Public Structure Overview

Memory class: POINTER_RECORD
Status: extracted orientation layer for explaining CVF structure without exposing internal-only or sensitive surfaces as if they were public-ready.

## Purpose

- help outside readers understand the real CVF structure quickly
- provide a stable explanation layer without relocating dense legacy/reference roots
- reduce the chance that internal-only or sensitive surfaces are mistaken for public-entry material

## Read This First

This file is intentionally extractive.

- it explains how the repository is organized
- it does not grant publication approval to any root
- it should be used before sending readers into high-density internal or historical areas

## Recommended Reading Path

If someone needs to understand CVF safely and quickly, start here:

1. `README.md`
2. `START_HERE.md`
3. `docs/GET_STARTED.md`
4. `docs/guides/CVF_QUICK_ORIENTATION.md`
5. `ARCHITECTURE.md`
6. `docs/INDEX.md`

Only after that should a reader move into deeper canonical references or implementation roots.

## Top-Level Root Map

| Root | Role | Current posture |
|---|---|---|
| `docs/` | canonical docs, guides, roadmaps, reviews, baselines | public-orientation candidate, but still curated |
| `EXTENSIONS/` | implementation families, runtimes, SDKs, product surfaces | internal or selectively exportable only |
| `governance/` | executable guards, policy, compatibility gates | internal control surface |
| `scripts/`, `tools/` | automation, validation, helper tooling | internal operational surface |
| `ECOSYSTEM/`, `CVF_SKILL_LIBRARY/`, `ui_governance_engine/` | lineage-retained or enterprise-heavy roots | not public-ready by default |
| `REVIEW/` | frozen review/reference material | internal frozen reference |
| `v1.0/`, `v1.1/` | historical framework reference lines with many important files | freeze in place; do not relocate under current posture |

## What `v1.0` And `v1.1` Mean

`v1.0/` and `v1.1/` are kept because they still hold meaningful historical and reference value.

Current rule:

- keep both roots at their existing paths
- do not relocate them as part of pre-public cleanup
- if someone needs to understand what they are, point them to this overview and the core orientation docs first

This preserves data retention while avoiding unnecessary path churn.

## What Outside Readers Should Usually Open

Good first-stop surfaces:

- `README.md`
- `START_HERE.md`
- `docs/GET_STARTED.md`
- `docs/guides/CVF_QUICK_ORIENTATION.md`
- `ARCHITECTURE.md`
- `docs/reference/CVF_REPOSITORY_LIFECYCLE_CLASSIFICATION.md`
- `docs/reference/CVF_REPOSITORY_EXPOSURE_CLASSIFICATION.md`

Surfaces that should usually remain operator/internal first:

- `governance/`
- most of `EXTENSIONS/`
- `REVIEW/`
- raw historical roots such as `v1.0/` and `v1.1/`

## Sensitive-Data Preservation Rule

CVF should prefer explanation over relocation when a root is both:

- high-density
- historically important
- not appropriate for broad publication as-is

That is why the current posture keeps `v1.0/` and `v1.1/` in place and uses extracted docs to explain them.

## Related Artifacts

- `docs/roadmaps/CVF_PREPUBLIC_REPOSITORY_RESTRUCTURING_ROADMAP_2026-04-02.md`
- `docs/reference/CVF_REPOSITORY_LIFECYCLE_CLASSIFICATION.md`
- `docs/reference/CVF_REPOSITORY_EXPOSURE_CLASSIFICATION.md`
- `docs/reference/CVF_PREPUBLIC_PUBLICATION_DECISION_MEMO_2026-04-02.md`
- `docs/reference/CVF_PREPUBLIC_P3_READINESS.md`

## Final Clause

The safest way to explain CVF publicly is to extract the structure narrative first and move paths only when there is a strong preservation-safe reason.
