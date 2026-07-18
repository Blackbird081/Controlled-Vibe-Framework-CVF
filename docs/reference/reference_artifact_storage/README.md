# CVF Reference Artifact Storage Front Door

Memory class: FULL_RECORD

Status: ACTIVE_FORWARD_ONLY

docType: reference

Date: 2026-07-07

## Purpose

Explain how CVF classifies reusable `docs/reference/` artifacts by storage
class, why some artifacts keep dated filenames while others use stable
undated front doors, and where to find the governed index of currently
classified reference artifacts.

This front door exists because reference artifacts have accumulated with
mixed naming conventions over time: some are dated evidence snapshots that
should stay dated, some are stable front doors that should never carry a
date, and some are active references that happen to have a dated filename
from when they were authored. Without a forward-only classification layer,
future packets citing these files risk treating a dated snapshot as if it
were a stable front door, or vice versa.

## Scope / Applies To

Applies to:

- any agent or operator classifying a new `docs/reference/` artifact at
  creation time;
- any agent or operator citing an existing `docs/reference/` artifact and
  needing to know whether it is safe to treat as a long-lived citation
  target or whether it is a point-in-time snapshot;
- the reference artifact index at `docs/reference/CVF_REFERENCE_ARTIFACT_INDEX.md`,
  which records the storage class of each classified artifact.

Does not apply to:

- `docs/baselines/`, `docs/work_orders/`, `docs/reviews/`, or `docs/roadmaps/`
  artifacts, which have their own governed lifecycle and are not reference
  artifacts under this standard;
- historical `docs/reference/` artifacts that predate this standard and have
  not yet been classified in the index; this standard does not require or
  authorize a retroactive rename or classification sweep of those files.

## Reading Order

1. Read this README for orientation.
2. Read
   `docs/reference/reference_artifact_storage/CVF_REFERENCE_ARTIFACT_STORAGE_CLASS_STANDARD.md`
   for the storage-class taxonomy and citation rules.
3. Read `docs/reference/CVF_REFERENCE_ARTIFACT_INDEX.md` for the current list
   of classified reference artifacts and their storage class.
4. When authoring a new `docs/reference/` artifact, select a storage class
   from the standard, add an index row, and follow the applicable citation
   rule.

## No Historical Rename Sweep

This governance layer is forward-only. It does not require, authorize, or
imply renaming, moving, or reclassifying any existing `docs/reference/`
artifact that predates this standard. Existing dated active references, such
as `docs/reference/CVF_FOUNDATION_PLANE_IO_CONTRACT_REGISTRY_2026-07-07.md`,
keep their current filename and path. Adding an index row for an existing
artifact is a classification act only; it is not a rename, move, or content
edit.

A future, separately authorized tranche may choose to perform a bounded
rename or reorganization. This front door and its paired standard do not
authorize that work.

## Claim Boundary

This front door explains the purpose, reading order, and no-rename-sweep
posture of the reference artifact storage-class governance layer. It does
not implement a checker, does not mutate public-sync, does not authorize
runtime or provider/live proof, does not read private or generated MinerU
output, does not release production Memory/RAG or retrieval/vectorization,
does not reopen P3, and does not perform or authorize any historical rename
or move.

## Public Export Disposition

DEFERRED_PRIVATE_ONLY

Reason: private provenance reference governance front door. Public export
requires a separate operator decision and public-safe summary from the
sibling public-sync clone.
