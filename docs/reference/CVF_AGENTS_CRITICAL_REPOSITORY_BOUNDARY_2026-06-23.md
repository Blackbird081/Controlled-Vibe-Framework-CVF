# CVF Agents Critical Repository Boundary

Memory class: POINTER_RECORD

Status: ACTIVE_REFERENCE

docType: reference

Date: 2026-06-23

Index classification: GOVERNED_DOC (not an INDEX_ARTIFACT). This file
records one rotated AGENTS.md rule; it does not enumerate, map, or project
CVF state as a generated aggregate.

**Applies to:** any agent reading `AGENTS.md` who needs the repository
boundary rule rotated out of that file under the Governed File Size Guard
(GC-023).

## Purpose

Rotate the "Critical Repository Boundary - 2026-05-09" rule out of
`AGENTS.md` to keep that file under its governed line-count threshold,
without losing the rule itself. `AGENTS.md` retains a one-line pointer to
this file.

## Critical Repository Boundary - 2026-05-09

This workspace is the private provenance/archive repository:

`https://github.com/Blackbird081/Controlled-Vibe-Framework-CVF-Provenance.git`

It contains full historical development material, evidence records, handoffs,
reviews, and internal continuity files. Treat it as locked for private audit and
deep review. Do not use this workspace as the public CVF product front door.

The only GitHub repository intended for public/external CVF information is:

`https://github.com/Blackbird081/Controlled-Vibe-Framework-CVF.git`

Public-facing architecture, README, contributor, setup, governance, provider,
cost, or evidence-summary changes must be prepared and pushed from the sibling
public-sync clone:

`d:\UNG DUNG AI\TOOL AI 2026\Controlled-Vibe-Framework-CVF-public-sync`

Before any push that is meant for the public repository, run `git remote -v`.
If the current working directory is this provenance workspace or `origin`
contains `Controlled-Vibe-Framework-CVF-Provenance`, stop and switch to the
public-sync clone. Do not push the full provenance tree into the public repo.

## Claim Boundary

This file records one rotated rule verbatim from `AGENTS.md`. It does not
add, remove, or reinterpret any part of the rule, and it does not claim
authority over public-sync execution beyond what the rule itself states.

## Public Export Disposition

DEFERRED_PRIVATE_ONLY

Reason: describes the private provenance workspace's own boundary rule
relative to the public repository; not itself eligible for public-sync
export.
