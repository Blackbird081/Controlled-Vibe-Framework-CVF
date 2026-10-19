# CVF Build Learning Evidence Checklist

Memory class: FULL_RECORD
Status: ACTIVE_REFERENCE
docType: reference
Date: 2026-10-12
Batch ID: CVF-PLL-T1

## Purpose

Apply existing CVF controls to reusable build-learning categories. Parent
selection uses the Project Learning Loop Standard; the CCMA snapshots are advisory
input, not independent historical incident or test proof.

## Scope / Applies To

Local shell cleanup, repair evidence, archive extraction, receipt publication and
coverage reviews. Use the relevant items for the selected proof, not every item
for every task. Canonical owners remain
the Agent Operation Trace and Workspace Integrity standard, Text Encoding and
Symbol Discipline standard, Active Continuity Read Budget standard, Live Run
Diagnostic standard, Epistemic Process standard, Review Cost standard and F2G.

## Shell, Cleanup And Paths

1. Select one shell for a filesystem mutation. On Windows, do not enumerate in
   PowerShell then interpolate paths into cmd/batch deletion or moves.
2. Resolve each final absolute target and prove it remains inside the intended
   workspace or explicitly named directory before recursive cleanup/move. Use
   native commands and literal paths. Separate discovery, validation and mutation.
3. If MSYS path conversion affects an invocation, scope its remedy to that
   invocation and record the resulting resolved arguments. Do not infer a global
   defect from one command or change environment globally without evidence.
4. Record rejected commands, actual mutations and cleanup residuals separately.
   An approval/policy rejection is not a demonstrated shell parser root cause.

## Repair, Negative Fixtures And Mutations

1. Acknowledge startup and authority before mutation. Prepare a coherent multi-file
   continuity change, validate it, then publish the intended set; generated state
   follows source items. This is not a claim of atomic filesystem transactions.
2. Use finite disposable negative fixtures tied to a named expected finding.
   Before running a mutation, verify its match count and applied diff. A replacement
   that matched zero targets is `NOT_APPLIED`, never a successful detector kill.
3. Record `KILLED` only when an applied mutation causes the intended assertion or
   finding. An unrelated import, environment or syntax error is `INCONCLUSIVE`.
   If the intended detector accepts the applied mutation, record `SURVIVED`.
4. Restore the fixture and verify baseline bytes/result. Keep failed, timed-out,
   skipped and unrun observations. A later partitioned pass is separate evidence,
   not a retroactive rewrite of a failed or timed-out full run.
5. Consume valid returned evidence before rerunning. A rerun needs a named gap,
   expected information gain and cost reason under the Review Cost owner.

Before a selected negative: establish a valid positive fixture under the actual
consumer's domain rules (for example, valid UUIDs when an allowlist requires them).
Confirm output length before indexing and assert exact expected identity/order.
Keep malformed-input rejection separate. Isolate competing guards so the negative
reaches the named assertion; keep the fixture finite and valid under the mutation.
For shared/nested mutable state, restore the actual changed object and verify the
baseline, not just an outer pointer. Apply the existing O6 P0-P7 reviewer checklist
when negative-oracle integrity matters; its helper remains deferred.

## Archive Extraction Identity

When proof runs from a Git archive, bind the archive's actual SHA-256 and source
ref. Compare extracted membership, paths, sizes and hashes against the archive
member bytes. A Windows checkout/export conversion can make those bytes differ
from raw Git blobs; report that comparison separately. Do not silently normalize
the execution payload or change Git configuration to rewrite a historical claim.
Perform this cheap manifest check before the selected expensive proof.

## Receipt Publication Integrity

Use distinct variables for output targets and validate the actual written target,
typed shape and identity before publication. Keep raw receipts separate from
generated summaries; a successful command alone does not establish the intended
file was written. Recover surviving evidence read-only before considering a replay.
If an original receipt is lost, mark it unavailable and label any reconciliation
as derived from the retained evidence. Do not fabricate an original receipt or
spend another runtime budget merely to hide its loss.

## Sync Coverage And Claims

Declare acceptance per evidence layer:

| Layer | Example proof | Claim limit |
|---|---|---|
| Enumeration | selected item/page inventory | discovered coverage only |
| Message/content | parsed content linked to an item | no persistence claim |
| Storage | committed stored rows/objects | no checkpoint or remote freshness claim |
| Checkpoint | durable progress and restart proof | no provider coverage claim |
| Local adapter | disposable adapter call | no live provider call |
| Live provider | actual secret-safe API proof | only the tested request/scope |
| Runtime governance | real governed API execution and required release proof | only the exercised policy path |

Use a narrow acceptance boundary when only some layers pass. Folder existence,
file-gate acceptance or a local adapter fixture cannot establish product completion
or runtime governance. Do not run providers merely to support a documentation-only
claim; leave that layer unproven unless separately authorized and exercised.

For terminal-write failures, assert returned outcome, stored status, stored
terminal summary and checkpoint independently. A best-effort fallback may store
an error/finished status without the failed summary; a blocked fallback may store
neither. Inspect the last successfully persisted summary prefix and reload errors.
A terminal marker or returned completion does not prove that a terminal receipt
was persisted.

## Source Selection And Incremental Value

CCMA shell learning adds a common resolved-path/rejection record; repair learning
adds explicit mutation outcome and restoration evidence; coverage learning adds
the layer matrix. Existing parent rules are retained and extended through a shared
template/checklist, rather than treating every incident as a missing parent rule.
The parent decision/proof is recorded in the PLL-T1 review. Returned CCMA adoption
is `PARKED_BY_OPERATOR`; no source project was modified or tested.

The 2026-10-12 delta is dispositioned in
`docs/reviews/learnings/CVF_CCMA_PROOF_PREPARATION_LEARNING_2026-10-12.md`.
It adds archive-member identity, publication-target checks and domain-valid/durable
prefix examples to this owner. Roadmap drift and minor metadata repair cases merge
into existing lifecycle/ADIF routing. No global gate, mandatory extra worker phase,
fixed support-scope threshold or new implementation campaign is introduced.

## Claim Boundary

Checklist for evidence declaration and review; no arbitrary-command interception,
automatic root-cause attribution, runtime daemon or historical CCMA proof.
