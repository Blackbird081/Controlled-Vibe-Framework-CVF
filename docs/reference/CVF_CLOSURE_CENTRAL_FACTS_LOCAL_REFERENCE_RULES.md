# CVF Closure Central Facts Local Reference Rules

Memory class: REFERENCE

Status: ACTIVE_REFERENCE

docType: reference

Date: 2026-06-16

rawMemoryReleased: false

Text Encoding Exception: em dash and standard punctuation used in governance prose

## Scope / Target / Owner Boundary

Target: the rules a local governed artifact follows when it references a closure
central facts packet instead of duplicating shared batch facts.

Owner boundary: this reference owns the local reference block format and usage
rules only. It does not own the central packet shape (that is the closure facts
packet template) and it does not reduce any evidence requirement.

## Purpose

Define the local reference block format and rules so a governed artifact can
point at a shared closure central facts packet instead of duplicating shared
batch facts, while keeping its own local role judgment.

## Applies To

Apply these rules in roadmaps, work orders, worker returns, completion reviews,
and session-sync entries that belong to a governed batch which has a closure
central facts packet under `docs/reviews/evidence/`.

Do not apply these rules to a small single-file batch that has no separate central
packet; in that case keep facts inline per the CCLV standard.

## Authority

- CCLV standard:
  `docs/reference/CVF_CENTRAL_CORE_LOCAL_VIEW_GOVERNANCE_REFACTOR_STANDARD_2026-06-16.md`
  (Required Local References, lines 86-100)
- Closure facts packet template (Markdown):
  `docs/reviews/evidence/CVF_CLOSURE_CENTRAL_FACTS_PACKET_TEMPLATE.md`
- Closure facts packet template (JSON):
  `docs/reviews/evidence/CVF_CLOSURE_CENTRAL_FACTS_PACKET_TEMPLATE.json`

## Local Reference Block Format

When a local artifact relies on a central core packet, include this block instead
of repeating all shared facts:

```text
Central Facts Reference: <repo-relative path>#<section-or-id>
Local View Role: <roadmap | work-order | worker-return | completion-review | session-sync | registry>
Local Disposition: <PASS | BLOCKED | N/A_WITH_REASON>
Local Delta: <what this artifact adds beyond the central facts>
```

## Field Rules

- `Central Facts Reference` must point at an existing packet path (and section or
  field id when relevant) in the same repository and the same governed batch. A
  reference to a non-existent packet is a defect.
- `Local View Role` must be one of the listed role values; it states which local
  view this artifact owns.
- `Local Disposition` is this artifact's own status against the batch, not the
  batch's overall status. Use `N/A_WITH_REASON` with a reason when the artifact
  records context rather than a pass/fail position.
- `Local Delta` names only what this artifact adds beyond the shared facts (for
  example, a reviewer's accepted-risk note, or a worker's uncommitted set). If
  there is no delta, write `none` rather than leaving it blank.

## Usage Rules

1. The central packet remains the source of truth for shared facts. A local
   artifact must not contradict the central `claimBoundary`; it may only add a
   non-contradicting local delta.
2. A local artifact may still repeat a short human-readable summary when
   readability requires it, but the canonical values live in the central packet.
3. Do not turn a local artifact into an empty link. Local role judgment (the
   reviewer decision, the worker actions, the roadmap next move) stays local.
4. Forward-only: do not rewrite a closed artifact solely to add a reference
   block. Use this format in new artifacts and in artifacts already being changed
   for an authorized reason.

## Example

A completion review for batch `<BATCH>`:

```text
Central Facts Reference: docs/reviews/evidence/CVF_<BATCH>_CLOSURE_FACTS_<YYYY-MM-DD>.md#central-facts-packet
Local View Role: completion-review
Local Disposition: PASS
Local Delta: reviewer accepted R0 risk; confirmed split-range pre-closure COMPLIANT on material range
```

## Claim Boundary

This reference defines the local reference block format and usage rules only. It
does not prove runtime/provider behavior, live governance proof, public
readiness, or production readiness, and it does not reduce any existing evidence
requirement.

## Public Export Disposition

Disposition: DEFERRED_PRIVATE_ONLY

Reason: private provenance governance reference. No public-sync batch is
authorized.
