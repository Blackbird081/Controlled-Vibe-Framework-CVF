# CVF GC-018 Public GitHub Renewal Candidate — 2026-05-09

Memory class: POINTER_RECORD
Status: CANDIDATE FOR CLAUDE/OPERATOR AUTHORIZATION
Related roadmap: `docs/roadmaps/CVF_PUBLIC_GITHUB_RENEWAL_AND_PROVENANCE_SPLIT_ROADMAP_2026-05-09.md`

## 1. Candidate Summary

This GC-018 candidate governs the public GitHub renewal track.

The proposed direction is to split the current repository into:

- a private or controlled-access provenance repository preserving full historical development truth
- a clean renewed public repository focused on current developer-facing CVF architecture, modules, setup, governance contracts, provider boundaries, and curated evidence

The candidate exists because public renewal is a high-impact governance and publication-boundary project. It must not proceed as an ordinary docs cleanup.

## 2. Proposed Continuation Token

`GC018_PUBLIC_GITHUB_RENEWAL_2026_05_09`

## 3. Scope

In scope:

- Pre-R reversible impact baseline
- repository URL and release-link impact inventory
- classification of public-core vs provenance-only content
- public-surface anti-drift guard design
- export manifest and provenance anchor design
- renewed repo documentation plan
- renewed repo live release gate environment plan
- partner/auditor provenance commitment

Conditionally in scope after authorization:

- rename current repo to `Controlled-Vibe-Framework-CVF-Provenance`
- create renewed public repo at `Controlled-Vibe-Framework-CVF`
- push curated public export
- run renewed repo protected live release gate
- publish renewed repo evidence summary

Out of scope:

- deleting or rewriting the provenance repository history
- publishing raw provider keys or local runtime state
- claiming full provider parity
- moving all historical records into the renewed repo
- making GitHub the primary noncoder product surface
- converting CVF into a skill/template marketplace

## 4. Stop Rules

Pause and reassess if any of these occur:

- Pre-R inventory finds more than 10 important external links that would break without replacement
- the old `v4.0.0-rc.1` release URL or CI2-H proof cannot be replaced by renewed repo evidence or documented provenance access
- renewed repo cannot run protected live release gate after GitHub environment/secrets setup
- secret scan finds raw provider keys or local runtime state in the export candidate
- public-surface scanner cannot reliably block handoffs, rebuttals, raw logs, wave records, and uncurated evidence
- Claude/operator rejects `CONDITIONAL_RENAME_AND_REUSE`
- export manifest cannot bind the public export to a final provenance tag

## 5. Approval Gates

### Gate A — Pre-R Start

Authorized by operator request plus this GC-018 candidate.

Allows:

- reversible local/documentation analysis
- timing baseline
- URL impact inventory
- scanner warning-mode design

Does not allow:

- GitHub repo rename
- public repo cutover
- deletion or history rewrite

### Gate B — R0 To R1

Requires:

- Claude re-review of V2 roadmap
- operator approval of rename strategy
- final decision on old repo visibility
- final decision on commit-provenance strategy

### Gate C — R4 To R5

Requires:

- public-surface manifest
- anti-drift scanner
- secret scan pass
- export manifest draft
- PROVENANCE.md draft
- public release profile defined

### Gate D — R5 To R6

Requires:

- GitHub environment and live-key secret configured on renewed repo
- branch protection / Actions reviewed
- initial public push verified

### Gate E — Closure

Requires:

- renewed repo protected live release gate PASS
- public evidence summary
- provenance anchor tag and export manifest
- public anti-drift PR dry run
- post-cutover handoff state

## 6. Continuation Instructions

Future agents must continue from the latest of:

1. this GC-018 candidate
2. the V2 public GitHub renewal roadmap
3. the latest Claude authorization/review file
4. the latest post-renewal handoff file, if created

Agents must not assume that rename-and-reuse is authorized until Gate B is closed.

## 7. Evidence Requirements

Governance behavior claims still require live provider proof under the repository rules.

Planning, classification, public-surface, and secret-scan artifacts may be deterministic/local evidence.

Renewed public GA evidence must eventually include a live protected release gate run on the renewed repo, not only historical CI2-H evidence from the provenance repo.

## 8. Boundary

This candidate authorizes planning and review. It does not authorize GitHub cutover by itself.

The default posture is:

`GO_WITH_PRE_R_BASELINE_BEFORE_RENAME`
