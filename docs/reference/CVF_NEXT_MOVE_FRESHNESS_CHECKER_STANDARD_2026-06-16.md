# CVF Next-Move Freshness Checker Standard

Memory class: POINTER_RECORD

Status: ACTIVE

docType: reference_standard

Date: 2026-08-30

Owner: Codex

## Purpose

Define the bounded machine-check rule for active next-move freshness so a
current agent instruction surface cannot reopen work that active session state
already records as closed.

## Scope / Applies-To

Applies to current session continuity surfaces only:

- active generated state `nextAllowedMove`;
- active front-door `## Next Allowed Move`;
- active handoff `## Next Allowed Move`;
- active handoff startup acknowledgment.

It does not apply to archived handoffs or historical nested state-entry
`nextAllowedMove` provenance unless that text is promoted to a current surface.

## Rule

Active next-move surfaces must not instruct an agent to dispatch, redispatch,
open, execute, or treat as ready any target that current active session state
already records as `CLOSED_PASS` or `CLOSED_PASS_BOUNDED`.

## Current Surfaces

The machine checker must inspect only current instruction surfaces:

- `CVF_SESSION/ACTIVE_SESSION_STATE.json` top-level `nextAllowedMove`;
- `CVF_SESSION_MEMORY.md` section `## Next Allowed Move`;
- the active handoff section `## Next Allowed Move`;
- the active handoff startup acknowledgment.

Historical state-entry `nextAllowedMove` values are provenance and must not be
treated as active instructions unless promoted into the current top-level
surface.

## Required Behavior

The checker must:

- discover closed target labels from active session state records carrying
  `CLOSED_PASS` or `CLOSED_PASS_BOUNDED`;
- support common CVF target labels such as `RSF-T3`, `FPRC-T1`, `CCLV-T2`,
  `LHW24`, and `Model Gateway C-02 P2`;
- reject action wording such as dispatch, redispatch, ready, worker execute,
  may open, or next move when it targets a closed label;
- allow closed-target mentions that explicitly block or close the target, such
  as "do not redispatch", "already closed", or `CLOSED_PASS_BOUNDED`;
- split long next-move paragraphs into sentence fragments so a safe closure
  sentence cannot mask a later stale dispatch sentence.

## Non-Goals

This standard does not authorize runtime mutation, provider/API proof,
public-sync, legacy absorption, broad stale-roadmap scanning, or automatic
selection of the next roadmap. It only prevents current next-move surfaces from
reopening already closed targets or redispatching an exact target already
consumed by committed downstream evidence (see the exact-target rule below).

## Exact-Target Committed-Supersession Rule (AFFD-R1 / Consolidated Rework R1)

Added to close a real observed gap: a governed planning/assessment artifact
can be reconciled and superseded by committed downstream evidence while never
itself being marked `CLOSED_PASS`/`CLOSED_PASS_BOUNDED` in session state, so
the label rule above cannot detect it. Active continuity selected
`docs/assessments/CVF_TASK_PROPORTIONAL_GOVERNANCE_SECOND_UPGRADE_EXTERNAL_CRITIQUE_PLAN_2026-08-17.md`
as an apparently-fresh dispatch target even though that exact plan hash
already had a committed external critique and CVF reconciliation, and a
substantial accepted follow-on sequence already existed.

### Authority Model

A supersession finding may use ONLY committed Git evidence. Working-tree
bytes are never authoritative content, and an untracked file (target or
evidence) can never participate in a supersession finding. This closes the
first rework's defect, which trusted arbitrary working-tree Markdown bytes
as if they were committed evidence.

### Target Requirements

- normalize `/` and `\` next-move path mentions to one canonical
  repository-relative POSIX path, rejecting traversal (`..`), absolute
  paths, drive-letter prefixes (`C:`), UNC forms (`\\server\...`), and a
  `~` home-relative marker; a match whose regex capture is a truncated
  suffix of a longer unsafe mention (e.g. the `docs\...` remainder of
  `C:\docs\...`) is also rejected, not silently normalized;
- the normalized candidate must exist as a tracked file at HEAD
  (`git ls-tree HEAD`), matched byte-exactly; a case-only or
  Unicode-normalization-only collision among tracked paths fails closed as
  an explicit ambiguity rather than guessing which file is meant;
- target bytes are obtained from Git (`git show HEAD:<target-path>`), never
  the working tree; the authoritative target SHA-256 is computed from those
  HEAD bytes;
- if the working-tree copy of a tracked target differs from its HEAD blob,
  the checker reports an explicit `AMBIGUOUS_DIRTY_TARGET` violation rather
  than silently passing or silently trusting either version's bytes;
- an untracked target can never be treated as a committed superseded target.

### Evidence Requirements

- evidence is a non-archive Markdown path under the bounded existing
  evidence families (`docs/reviews/`, `docs/baselines/`);
- evidence must be tracked at HEAD; its authoritative content is read via
  Git (`git show HEAD:<evidence-path>`), never the working tree;
  an untracked evidence file, or uncommitted edits to a tracked evidence
  file, can never authorize supersession.

### Accepted Binding A: Content Identity

The same logical table row (a full `| ... |` physical line) or
sentence-bounded logical line contains the exact normalized target path AND
a labelled 64-hex-character SHA-256 equal to the target's HEAD blob SHA-256.

### Accepted Binding B: Committed Target Identity

The same logical row/line contains the exact normalized target path AND a
labelled full 40-character Git commit id that is independently verified to
(1) exist, (2) be an ancestor of HEAD, (3) contain the target path at that
commit, and (4) have byte-identical target content at that commit compared
to HEAD. Short (7-39 hex character) commit ids are diagnostic-only and never
authorize supersession, since only a full 40-character id can be
unambiguously verified as a specific Git commit.

### Advisory-Versus-Consuming Distinction

Supersession additionally requires the same evidence document to carry an
explicit governed disposition/status token from a fixed vocabulary
(`TERMINAL_DISPOSITION_TOKENS` in the checker) immediately following a
recognized disposition label (e.g. `Final reconciliation disposition:`) on
the same or next non-blank line. A bare mention of a word like
"reconciliation" in a title, unrelated row, source citation, or neighboring
paragraph is never sufficient, and a bare critique/advisory-input document
with no such label+token pair is never terminal by itself, however exact its
path/hash citation.

### Claim Boundary And Bounded Scan

Filename similarity, title similarity, dates alone, and free-text thematic
overlap are never sufficient for any part of this rule. The evidence scan is
bounded to the two named directories (no repository-wide scan, no historical
scanner), and detection is deterministic given committed repository state;
no claim is made that every historical duplicate-dispatch pattern is
detectable, only that the exact-identity binding shapes defined above are
covered.

## Epistemic Process Block

### Expected Result / Prediction

Current session surfaces should pass because RSF-T3 already remediated the
C-02 P2 pointer prose, while synthetic dispatch/open text for a closed label
or an exact-target committed-supersession case should fail.

### Evidence Comparison

The checker run on current state returns zero violations for both rules.
Focused tests show closed-target dispatch, fresh-auth open wording, handoff
next move, startup acknowledgment, and long-line masking all fail in enforce
mode for the label rule; and exact-path SHA-256 binding, verified-ancestor
commit binding, dirty-target ambiguity, and case-collision ambiguity all
fail in enforce mode for the exact-target rule, while untracked evidence,
untracked targets, forged/non-ancestor/short commit tokens, cross-row
combination, and title-only disposition mentions all correctly do not
authorize supersession.

### Contradiction Or Gap Disposition

No contradiction remains inside the bounded current-surface scope for either
rule. Historical roadmap or archived continuity scans, and detection of
supersession patterns outside the two defined binding shapes, remain outside
this standard.

### Claim Update

The standard adds a current next-move freshness guard covering both a
closed-label class and a Git-authoritative exact-target committed-
supersession class. It does not claim broad historical roadmap
reconciliation, semantic-similarity detection, or runtime governance
behavior.

## Verification

Verification boundary: local deterministic checker and unit tests only,
against committed Git state.

Final boundary: current next-move surfaces cannot action closed targets, nor
exact targets already superseded by committed reconciliation/completion/
terminal-closure evidence meeting the binding and disposition requirements
above, when the checker runs. No provider, live, public-sync, production
readiness, public readiness, or Model Gateway implementation claim is made.
