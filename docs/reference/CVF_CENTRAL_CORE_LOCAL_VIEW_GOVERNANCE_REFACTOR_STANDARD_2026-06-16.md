# CVF Central Core Local View Governance Refactor Standard

Memory class: FULL_RECORD

Status: ACTIVE STANDARD

Date: 2026-06-16

Standard ID: CVF-CCLV-2026-06-16

rawMemoryReleased: false

## Purpose

This standard defines a forward-only governance refactor pattern for CVF:
shared batch facts should live in one central core packet, while each roadmap,
work order, worker return, completion review, session entry, or registry row
keeps only the local view required for its role.

The goal is to reduce agent-created drift, duplicate edits, repeated guard
failures, and reviewer latency. CVF should not force agents to copy the same
changed set, commit anchors, closure status, finding summary, and public export
boundary into many files when those facts can be recorded once and referenced
from each local artifact.

## Applies To

This standard applies forward-only to new or materially changed CVF governance
batches that produce repeated shared facts across multiple governed artifacts,
including:

- closure facts;
- finding/root-cause facts;
- Agent Operation Trace expected and actual changed sets;
- material and session-sync commit anchors;
- public export disposition;
- live proof receipt boundaries;
- legacy absorption coverage rows;
- session-sync mode and next-move evidence.

Existing closed artifacts are not reopened solely to adopt this pattern.

## Core Principle

Use a central core packet for shared facts and local views for artifact-specific
claims.

Central core packet examples:

- `docs/reviews/evidence/CVF_<BATCH>_CLOSURE_FACTS_<YYYY-MM-DD>.md`
- `docs/reviews/evidence/CVF_<BATCH>_CLOSURE_FACTS_<YYYY-MM-DD>.json`
- a clearly named `## Central Facts Packet` section inside a governed review
  when a separate evidence file would be unnecessary overhead.

Local view examples:

- roadmap: tranche status, next move, design boundary;
- work order: worker mission, allowed scope, return contract;
- worker return: worker actions, pending evidence, uncommitted set;
- completion review: reviewer decision, accepted risk, final claim boundary;
- session state: active mode, next allowed move, parked checkpoints.

## Required Central Facts

A central core packet should include only facts that are shared by more than
one artifact in the same governed batch.

Recommended fields:

| Field | Purpose |
|---|---|
| `batchId` | Stable identifier for the governed batch |
| `baseHead` | Material or dispatch base used for evidence |
| `materialCommit` | Material closure commit, or `PENDING` before commit |
| `sessionSyncCommit` | Session-sync commit, or `N/A with reason` |
| `expectedChangedSet` | Canonical expected paths for the material batch |
| `actualChangedSet` | Command-backed actual paths for the material batch |
| `roadmapStatus` | Final or current roadmap status |
| `workOrderStatus` | Final or current work-order status |
| `completionReview` | Path to reviewer completion artifact |
| `publicExportDisposition` | `EXPORTED`, `DEFERRED_PRIVATE_ONLY`, or blocked state |
| `findingRootCauseSummary` | Root finding summary or `N/A with reason` |
| `claimBoundary` | What this batch proves and does not prove |

## Required Local References

When a local artifact relies on a central core packet, it should include a
concise reference instead of repeating all shared facts.

Required local fields:

```text
Central Facts Reference: <repo-relative path>#<section-or-id>
Local View Role: <roadmap | work-order | worker-return | completion-review | session-sync | registry>
Local Disposition: <PASS | BLOCKED | N/A_WITH_REASON>
Local Delta: <what this artifact adds beyond the central facts>
```

Local artifacts may still repeat a short summary when readability requires it,
but the central packet remains the source of truth for shared batch facts.

## Forward-Only Migration Rule

Do not rewrite old closed roadmaps, work orders, reviews, session entries, or
registries solely to adopt this standard. Apply it to new batches and to files
already being materially changed for an authorized reason.

## Guard Strategy

Initial enforcement should be permissive:

1. allow either the existing duplicated evidence pattern or the new central
   reference pattern;
2. validate the central packet when present;
3. validate that local references point to an existing packet or section;
4. only later promote missing centralization to a hard failure for selected
   high-duplication workflows.

The first machine check should be advisory or narrow. It must not block small
single-file batches where a central packet would add overhead.

## CCLV-T4 Rule Conversion

Decision: CCLV remains opt-in and conditional; it is not a blanket requirement
for every governed batch.

Use Central Core + Local View when a batch repeats shared facts across multiple
governed artifacts, especially:

- closure facts that appear in a roadmap, work order, completion review, and
  session-sync entry;
- Agent Operation Trace expected/actual changed sets copied into multiple
  artifacts;
- material and session-sync commit anchors used by several closure surfaces;
- finding/root-cause summaries that must be referenced by both worker return
  and reviewer completion packets;
- public export disposition or claim-boundary facts repeated in local views.

Do not force a central packet for a small single-file or two-file batch where
the central packet would add more retrieval overhead than drift reduction.

For conditional-use batches, the central core owns shared facts. Local views
must cite the central core and add only role-specific judgment, disposition,
or boundary deltas. A local view may repeat a short human-readable summary, but
the central core remains the source of truth for shared fields.

This rule is a template/standard decision, not a broad hard-fail checker.
Machine checks should remain narrow and field-specific until repeated evidence
shows a broader rule can be enforced without increasing false positives.

## Design Boundary

This standard does not reduce evidence requirements. It changes where shared
facts live. A local artifact may link to central facts only when the referenced
packet is in the same repository and is part of the governed batch evidence.

This standard does not authorize runtime behavior, provider calls, public-sync,
legacy absorption, co-work product development, production readiness, or public
readiness.

## Finding-To-Governance Learning Disposition

| Field | Disposition |
|---|---|
| Defect class | `EVIDENCE_DUPLICATION_DRIFT` |
| Learning lane | `GOVERNANCE_CONTROL_PLANE` |
| Escalation state | `STANDARD_ADDED` |
| Next control action | Roll out central facts packet usage by roadmap/work-order tranche, then add narrow reference validation |
| Worker blame | `N/A_WITH_REASON`: repeated evidence drift is a governance data-shape problem, not only a worker execution problem |

## Epistemic Process Block

Epistemic Process Applicability: EPISTEMIC_PROCESS_NA_WITH_REASON: governance
standard definition; no empirical runtime, provider, benchmark, or corpus
classification claim is asserted.

Expected Result / Prediction: N/A - standard definition artifact.

Evidence Comparison Requirement: N/A with reason: no empirical prediction.

Contradiction Or Gap Disposition: N/A with reason: future rollout roadmaps may
record contradictions from implementation evidence.

Claim Update Requirement: N/A with reason: no empirical claim was predicted.

## Agent Operation Trace Block

| Field | Evidence |
|---|---|
| Actor | Codex orchestrator |
| Provider or surface | Codex local workspace |
| Session or invocation | 2026-06-16 central-core-local-view standard authoring |
| Working directory | `d:\UNG DUNG AI\TOOL AI 2026\Controlled-Vibe-Framework-CVF` |
| Command or tool surface | PowerShell, apply_patch |
| Target paths | `docs/reference/CVF_CENTRAL_CORE_LOCAL_VIEW_GOVERNANCE_REFACTOR_STANDARD_2026-06-16.md` |
| Allowed scope source | operator requested a common CVF standard for central core plus local views |
| Before status evidence | material base `dedc97c4` |
| After status evidence | standard authored, pending review/commit |
| Diff evidence | governed documentation add |
| Approval boundary | forward-only governance standard; no old artifact rewrite |
| Claim boundary | authoring-time governance standard only |
| Deletion or rename disposition | N/A with reason: no deletion or rename |

## Public Export Disposition

Disposition: DEFERRED_PRIVATE_ONLY

Reason: private provenance governance standard. No public-sync batch is
authorized.

## Claim Boundary

This standard defines a governance data-shape pattern. It does not prove any
runtime/provider behavior, live governance proof, public readiness, production
readiness, hosted freshness, or automatic adoption by other agents.
