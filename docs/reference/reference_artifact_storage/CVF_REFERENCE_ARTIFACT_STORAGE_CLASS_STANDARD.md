# CVF Reference Artifact Storage Class Standard

Memory class: FULL_RECORD

Status: ACTIVE_FORWARD_ONLY

docType: reference

Date: 2026-07-07

EPISTEMIC_PROCESS_NA_WITH_REASON: classification vocabulary and forward-only
citation rule set; all content is definitional taxonomy without an
experimental prediction, evidence comparison, or hypothesis test; no
observable outcome is predicted or measured by this standard.

## Purpose

Define a forward-only storage-class taxonomy and citation rule set for
`docs/reference/` artifacts. This standard lets a worker or reviewer classify
a reference artifact at creation time as a stable front door, a dated
evidence snapshot, a versioned reference snapshot, a legacy dated active
reference, or an archive-only record, so future packets know how to cite it
correctly without guessing from the filename alone.

This standard is a sibling to, and does not replace or reinterpret,
`docs/reference/CVF_INDEX_CLASSIFICATION_STANDARD_2026-06-21.md`. That
standard classifies artifacts that declare themselves as `INDEX_ARTIFACT`
outputs (`INDEX type:` IDX-1 through IDX-6). This standard classifies the
storage/citation posture of a `docs/reference/` artifact regardless of
whether it is also an INDEX artifact. An artifact may carry both
classifications at once: for example, an artifact can be a
`STABLE_REFERENCE_FRONT_DOOR` under this standard and an IDX-2
`PLANE_OWNER_MAP` under the INDEX classification standard.

## Scope / Applies To

Applies to:

- any new `docs/reference/` artifact authored on or after 2026-07-07;
- the reference artifact index at `docs/reference/CVF_REFERENCE_ARTIFACT_INDEX.md`,
  which records the storage class assigned to each classified artifact;
- citation guidance for any packet that references a `docs/reference/`
  artifact and needs to choose the correct citation form.

Does not apply to:

- `docs/baselines/`, `docs/work_orders/`, `docs/reviews/`, or `docs/roadmaps/`
  artifacts, which are governed by their own lifecycle standards;
- historical `docs/reference/` artifacts that predate this standard and have
  not been given an index row; this standard does not require retroactive
  classification of every historical file, only forward classification of
  new artifacts and any existing artifact an agent chooses to add to the
  index;
- checker implementation, hook-chain wiring, or `governance/compat/`
  automation; no checker is implemented by this standard.

## Storage Class Taxonomy

### SC-1: STABLE_REFERENCE_FRONT_DOOR

Definition: An undated, long-lived front door or canonical reference file
whose filename does not change across content revisions. Content may be
updated in place; the filename and path remain stable so other artifacts can
cite it durably across time.

Examples in this repository: `docs/reference/guard_orientation/README.md`;
this standard's own paired README at
`docs/reference/reference_artifact_storage/README.md`.

| Attribute | Value |
|---|---|
| Filename convention | undated |
| Content mutability | updated in place as the canonical current version |
| Citation form | cite the stable path directly; no date qualifier needed |
| Claim boundary | citing the current content of the file at time of read; does not itself prove historical state at an earlier date |

### SC-2: DATED_EVIDENCE_ARTIFACT

Definition: A point-in-time evidence record, receipt, snapshot, or audit
output whose filename is intentionally dated because the artifact's entire
purpose is to record state as of that date. The filename date is load-bearing
evidence, not incidental.

Examples in this repository: `docs/evidence/public-current-state-snapshot-2026-07-07.md`
(public-sync clone); dated receipt or evidence JSON files produced by a
governed proof run.

| Attribute | Value |
|---|---|
| Filename convention | dated; the date is part of the evidence claim |
| Content mutability | should not be edited after creation except to correct an error; superseding state requires a new dated artifact, not an in-place rewrite |
| Citation form | cite the full dated filename; treat as historical evidence as of that date, not as current state |
| Claim boundary | proves state as of the cited date only; does not represent current state unless independently re-verified |

### SC-3: VERSIONED_REFERENCE_SNAPSHOT

Definition: A reference artifact that intentionally keeps multiple dated
versions side by side, where each version is a complete snapshot of the same
reference content at a different point in time, and the newest version is
the current source of truth until superseded by a newer one.

Examples in this repository: `docs/evidence/public-current-state-snapshot-2026-07-05.md`
alongside `docs/evidence/public-current-state-snapshot-2026-07-07.md`
(public-sync clone), where the newer dated file supersedes the older one for
current-state claims while the older file remains as historical evidence.

| Attribute | Value |
|---|---|
| Filename convention | dated; multiple versions coexist |
| Content mutability | each version is immutable once created; a new version is added, not an existing one edited |
| Citation form | cite the newest version for current state; cite a specific older version only when the citation is explicitly historical |
| Claim boundary | only the newest version represents current state; older versions are historical unless explicitly cited as such |

### SC-4: LEGACY_DATED_ACTIVE_REFERENCE

Definition: An artifact that functions as a currently active, citable
reference (not a one-time evidence snapshot) but happens to carry a dated
filename because it was authored under an earlier filename convention or
because its content was tied to a specific dated governed packet at
authoring time. Unlike `DATED_EVIDENCE_ARTIFACT`, the date in the filename is
not load-bearing evidence; the artifact is meant to be cited as ongoing
current reference content, not as a point-in-time snapshot.

Examples in this repository:
`docs/reference/CVF_FOUNDATION_PLANE_IO_CONTRACT_REGISTRY_2026-07-07.md`
(`Memory class: ACTIVE_REFERENCE`, `Status: ACTIVE_REFERENCE`); and
`docs/reference/CVF_FOUNDATION_TO_CONTROL_PLANE_INTERLOCK_REFERENCE_2026-07-07.md`
(`Memory class: ACTIVE_REFERENCE`, `Status: ACTIVE_REFERENCE`). Both carry
`Status: ACTIVE_REFERENCE` in their top matter and are cited by later packets
as ongoing reusable reference content, not as one-time evidence.

| Attribute | Value |
|---|---|
| Filename convention | dated, inherited from authoring-time convention; the date is not load-bearing evidence |
| Content mutability | may be updated in place by a reviewer/closer if the reusable contract content changes; filename is not renamed on update |
| Citation form | cite the full existing dated filename; do not assume a stable undated alias exists |
| Claim boundary | active reusable reference content as of last update; the filename date does not itself prove currency, `Status: ACTIVE_REFERENCE` in the artifact's own top matter does |

### SC-5: ARCHIVE_ONLY

Definition: A reference artifact that has been superseded, is retained only
for historical continuity, and must not be cited as current authority or
current reusable reference content.

Examples in this repository: files under `docs/reference/archive/` and any
`docs/reference/` artifact whose top matter is marked `Status: SUPERSEDED` or
equivalent.

| Attribute | Value |
|---|---|
| Filename convention | any; often relocated under an `archive/` path segment |
| Content mutability | frozen; not edited after archival except to add an archival note |
| Citation form | may be cited only as historical context, never as current authority; the citing packet must say so explicitly |
| Claim boundary | historical record only; superseded by a named current artifact where applicable |

## Citation Rules

### Citing a stable front door (SC-1)

Cite the stable path directly. Because the filename does not change, no date
qualifier is needed in the citation. If the file's content has changed
materially since a prior citation, note that the current read reflects the
file's state at time of the current citation, not at the time of any earlier
citation.

### Citing a dated evidence artifact (SC-2) or a versioned reference snapshot (SC-3)

Cite the full dated filename. State explicitly that the citation is a
point-in-time evidence claim as of the cited date. For SC-3 artifacts, prefer
the newest dated version for any "current state" claim, and name the version
explicitly when citing an older one for historical comparison.

### Citing a legacy dated active reference (SC-4)

Cite the full existing dated filename exactly as it exists; do not invent or
assume an undated alias. State that the artifact is cited as ongoing active
reference content, verified by the artifact's own `Status: ACTIVE_REFERENCE`
top-matter declaration, not solely by the presence of a date in the filename.
Do not rename the artifact to remove the date as part of a citing packet; any
such rename is out of scope for a citing packet and requires a separate,
explicitly authorized rename tranche.

### Citing an archive-only artifact (SC-5)

Cite only as historical context. State explicitly in the citing packet that
the cited content is archival and not current authority, and name the
current superseding artifact when one exists.

## No Historical Rename Sweep

This standard does not authorize, require, or imply a sweep to rename
existing dated artifacts to remove their dates, to relabel existing
`LEGACY_DATED_ACTIVE_REFERENCE` artifacts as `STABLE_REFERENCE_FRONT_DOOR`
artifacts, or to move any existing file. Storage-class assignment for an
existing artifact is a classification act recorded in the index; it does not
rename, move, or edit the classified artifact.

## Relationship To Other Standards

| Standard | Relationship |
|---|---|
| `docs/reference/CVF_INDEX_CLASSIFICATION_STANDARD_2026-06-21.md` | Classifies INDEX-declared artifacts (`INDEX type:` IDX-1 through IDX-6); this standard classifies storage/citation posture and is independent of INDEX-type status |
| `docs/reference/CVF_REFERENCE_ARTIFACT_INDEX.md` | The governed index that records the storage class assigned to each classified `docs/reference/` artifact under this standard |
| `docs/reference/reference_artifact_storage/README.md` | Front door explaining purpose, reading order, and no-rename-sweep posture for this standard and its paired index |

## Claim Boundary

This standard defines a forward-only storage-class vocabulary and citation
rule set for `docs/reference/` artifacts. It does not implement a checker,
does not authorize a historical rename or move sweep, does not authorize
runtime, provider/live, or MCP proof, does not mutate public-sync, does not
read private or generated MinerU output, does not release production
Memory/RAG or retrieval/vectorization, and does not reopen P3.

## Public Export Disposition

DEFERRED_PRIVATE_ONLY

Reason: private provenance reference governance standard. Public export
requires a separate operator decision and public-safe summary from the
sibling public-sync clone.
