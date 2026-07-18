# CVF Reference Artifact Index

Memory class: FULL_RECORD

INDEX type: IDX-2

Source authority: `docs/reference/reference_artifact_storage/CVF_REFERENCE_ARTIFACT_STORAGE_CLASS_STANDARD.md`

Status: ACTIVE

Date: 2026-07-07

Human-reviewable: YES

Claim boundary: This index records the storage class assigned to each listed
`docs/reference/` artifact and the citation rule that applies to it. It is a
cross-reference only. It does not replace, supersede, or override the cited
artifact's own content, does not assert that every historical
`docs/reference/` artifact has been classified, and does not authorize any
rename, move, or content edit of a listed artifact.

Public Export Disposition: DEFERRED_PRIVATE_ONLY

EPISTEMIC_PROCESS_NA_WITH_REASON: cross-reference index of classified
artifacts; this index records a classification mapping, not an experimental
prediction, evidence comparison, or hypothesis test; no observable outcome is
predicted or measured by this index.

## Purpose

Provide a governed, forward-only index of `docs/reference/` artifacts
classified under
`docs/reference/reference_artifact_storage/CVF_REFERENCE_ARTIFACT_STORAGE_CLASS_STANDARD.md`.
This index lets an agent look up the storage class of a reference artifact
before deciding how to cite it, instead of guessing from the filename alone.

This index does not enumerate every `docs/reference/` file in the repository.
It records only artifacts that have been explicitly classified, starting with
this R71 tranche's initial row and growing forward as future packets add
entries.

## Scope / Applies To

Applies to `docs/reference/` artifacts that have been assigned a storage
class from
`docs/reference/reference_artifact_storage/CVF_REFERENCE_ARTIFACT_STORAGE_CLASS_STANDARD.md`.

Does not apply to `docs/baselines/`, `docs/work_orders/`, `docs/reviews/`, or
`docs/roadmaps/` artifacts, which are governed by their own lifecycle
standards and are out of scope for this index.

## Required Metadata Per Index Row

Each row in the Reference Artifact Index table below must record:

| Field | Meaning |
|---|---|
| Artifact path | The full repository-relative path of the classified `docs/reference/` artifact |
| Storage class | One of `DATED_EVIDENCE_ARTIFACT`, `STABLE_REFERENCE_FRONT_DOOR`, `VERSIONED_REFERENCE_SNAPSHOT`, `LEGACY_DATED_ACTIVE_REFERENCE`, `ARCHIVE_ONLY`, or a worker-defined equivalent class recorded with an explicit reason |
| Source authority | The artifact's own top-matter `Status` or `Memory class` declaration used to justify the assigned storage class |
| Citation rule | Which citation rule from the storage-class standard applies |
| Classified by | The tranche or packet that added this row |
| Classification date | ISO date the row was added to this index |

## Reference Artifact Index

| Artifact path | Storage class | Source authority | Citation rule | Classified by | Classification date |
|---|---|---|---|---|---|
| `docs/reference/CVF_FOUNDATION_PLANE_IO_CONTRACT_REGISTRY_2026-07-07.md` | LEGACY_DATED_ACTIVE_REFERENCE | `Memory class: ACTIVE_REFERENCE`; `Status: ACTIVE_REFERENCE` (verified in the artifact's own top matter) | Cite the full existing dated filename exactly as it exists; do not invent an undated alias; state that the artifact is cited as ongoing active reference content per its own `Status: ACTIVE_REFERENCE` declaration | MSEA-R71 Reference Artifact Storage Class And Index Standard | 2026-07-07 |
| `docs/reference/CVF_WORKSPACE_OVERLAY_PIPELINE_STANDARD_2026-07-07.md` | LEGACY_DATED_ACTIVE_REFERENCE | `Memory class: ACTIVE_REFERENCE`; `Status: ACTIVE_REFERENCE` (verified in the artifact's own top matter) | Cite the full existing dated filename exactly as it exists; do not invent an undated alias; state that the artifact is cited as ongoing active reference content per its own `Status: ACTIVE_REFERENCE` declaration | MSEA-R70A Workspace Overlay Standards Catalog Profile Definitions | 2026-07-07 |
| `docs/reference/governance_control_index/README.md` | STABLE_REFERENCE_FRONT_DOOR | `Memory class: POINTER_RECORD`; `Status: ACTIVE_REFERENCE` (verified in the artifact's own top matter) | Cite the stable path directly as the front door for governance-control lifecycle management; read the paired index before proposing governance-control creation, widening, consolidation, or retirement | MSEA-R72 Governance Control Index front-door refactor | 2026-07-07 |
| `docs/reference/governance_control_index/CVF_GOVERNANCE_CONTROL_INDEX.md` | STABLE_REFERENCE_FRONT_DOOR | `Memory class: FULL_RECORD`; `Status: ACTIVE_REFERENCE`; `INDEX type: IDX-3` (verified in the artifact's own top matter) | Cite the stable path directly as the official governance-control lifecycle/cost/value index; do not treat it as a substitute for each cited control's own canonical standard or checker source | MSEA-R72 Governance Control Index front-door refactor | 2026-07-07 |
| `docs/reference/CVF_WORKSPACE_RELEASE_CANDIDATE_CHECKLIST_2026-07-10.md` | LEGACY_DATED_ACTIVE_REFERENCE | `Memory class: ACTIVE_REFERENCE`; `Status: ACTIVE_REFERENCE` (verified in the artifact's own top matter) | Cite the full existing dated filename exactly as it exists; state that it is ongoing local workspace RC guidance per its own `Status: ACTIVE_REFERENCE` declaration | MSEA-R81B Workspace RC Checklist And Integrated Smoke Execution | 2026-07-10 |
| `docs/reference/workspace_distribution/README.md` | STABLE_REFERENCE_FRONT_DOOR | `Memory class: POINTER_RECORD`; `Status: ACTIVE_REFERENCE` (verified in the artifact's own top matter) | Cite the stable path directly as the Windows workspace distribution front door | MSEA-R82 Workspace Distribution And Update Release | 2026-07-10 |

## Adding A Future Row

To add a new row to this index:

1. Read the artifact's own top matter (`Memory class`, `Status`, `docType`,
   and any dated filename).
2. Select the closest matching storage class from
   `docs/reference/reference_artifact_storage/CVF_REFERENCE_ARTIFACT_STORAGE_CLASS_STANDARD.md`,
   or record a worker-defined equivalent class with an explicit reason if
   none of the five named classes fit.
3. Add one row to the Reference Artifact Index table above with all six
   required fields filled in.
4. Do not rename, move, or edit the classified artifact as part of adding an
   index row.

## No Historical Rename Sweep

Adding a row to this index is a classification act only. It does not rename,
move, or edit the classified artifact. This index does not require or
authorize a sweep to classify every historical `docs/reference/` artifact at
once; rows are added forward as future packets choose to classify additional
artifacts.

## Claim Boundary

This index cross-references the storage class of listed `docs/reference/`
artifacts. It does not implement a checker, does not authorize a historical
rename or move sweep, does not authorize runtime, provider/live, or MCP
proof, does not mutate public-sync, does not read private or generated
MinerU output, does not release production Memory/RAG or
retrieval/vectorization, and does not reopen P3. Citing this index is not a
substitute for reading the classified artifact's own source content.

## Public Export Disposition

DEFERRED_PRIVATE_ONLY

Reason: private provenance reference governance index. Public export
requires a separate operator decision and public-safe summary from the
sibling public-sync clone.
