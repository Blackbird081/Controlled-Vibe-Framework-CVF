# CVF Value-Parked Lane Reopen Discipline Standard

Memory class: POINTER_RECORD

Status: ACTIVE STANDARD

Date: 2026-06-25

Standard ID: CVF-VPLRD-2026-06-25

## Purpose

A lane, tranche, or follow-up can be deferred for two structurally different
reasons, and the difference governs how it may be reopened. This standard
exists because a deferred-for-low-value decision was once recorded only in
one provider's session memory (Claude), making it invisible to every other
agent and every future session - the same anti-pattern `CVF_ADIF-0008` names
for any reusable lesson.

## Scope / Applies To

- any agent (Claude, Codex, Gemini, or future agent) deciding to defer a
  lane, tranche, or follow-up for low expected value rather than for a
  missing authority/credential/dependency blocker;
- any agent considering re-proposing a previously value-declined lane to the
  operator;
- the `nextAllowedMove` field in `CVF_SESSION/ACTIVE_SESSION_STATE.json` and
  its source entries under `CVF_SESSION/state/entries/`.

## The Two Kinds Of Parked

- **Blocked by missing authority/credential/dependency** (e.g. waiting on
  operator authorization, secrets, or a separate GC-018). Reopen normally
  once the stated blocker is resolved; no special evidence bar applies.
- **Declined for low expected value** after the operator or a reviewer
  evaluated it and judged the cost not worth the benefit at this time (for
  example: a follow-up that would only reduce review-noise without closing
  any missed-detection gap). This is a `DEFERRED_AND_REVISIT_ON_EVIDENCE`
  decision, not a pending blocker.

## Required Action When Declining For Low Value

The agent that records the decision must write a concrete, checkable reopen
condition into `nextAllowedMove` in `CVF_SESSION/ACTIVE_SESSION_STATE.json`
(via its source entry under `CVF_SESSION/state/entries/`) in the same pass
that declines the lane.

The condition must name a specific fact a future agent can verify:

- a reviewer citing a real missed defect, with the artifact named;
- a pattern appearing on a named surface it wasn't found on before;
- a measured threshold being crossed.

Vague restatements such as "if it becomes more valuable" or "if the operator
wants it later" do not satisfy this requirement.

## Required Action Before Re-Proposing

No agent may re-propose a value-declined lane to the operator without first
checking whether its recorded reopen condition is actually met, and citing
that check when proposing. Re-proposing "because it would still be nice to
have" is the exact anti-pattern this standard exists to block.

## Where The Condition Must Live

Recording the reopen condition only in one provider's session memory does
not satisfy this standard. It must be in `nextAllowedMove` or another
CVF-governed artifact every agent reads at startup (`CVF_SESSION_MEMORY.md`,
`CVF_SESSION/ACTIVE_SESSION_STATE.json`, `AGENTS.md`, `CLAUDE.md`).

## Worked Example

EQC-T2 (widening the equivalence-claim-evidence checker's scanned-file set,
or adding table-row-context exclusion for the "unchanged" false-positive
pattern found during EQC-T1's dry run) was evaluated and declined: the 129
dry-run flags across 86 pre-existing files are review-noise only, and
adversarial sampling found zero cases where the gap let a real
unverified-equivalence claim through. Recorded reopen condition: either (a)
a reviewer reports actually missing a real equivalence-claim defect because
it was buried in the noise, citing the specific worker-return/completion-review
where this happened, or (b) the same "unchanged"-in-metadata-row
false-positive pattern is found occurring in `docs/baselines/*.md` or
another governed surface outside the checker's current scanned set.

## Relationship To Other Standards

- `docs/reference/agent_defect_intelligence/CVF_ADIF_ENTRY_TEMPLATE.md` and
  the `CVF_ADIF-0008` defect entry govern the broader rule that reusable
  lessons must be CVF-governed, not provider-memory-only; this standard is
  one specific application of that rule to deferred-lane decisions.
- `docs/reference/CVF_GC018_CONTINUATION_CANDIDATE_TEMPLATE.md` governs
  continuation/handoff decisions generally; this standard adds the
  reopen-condition requirement specifically for value-declined lanes.

## Epistemic Process Block

Epistemic Process Applicability: EPISTEMIC_PROCESS_NA_WITH_REASON: canonical
governance standard definition; no empirical claim, corpus classification,
risk-model update, or evidence-comparison work is asserted. The standard
defines a recording and re-proposal discipline; it does not predict or
compare runtime evidence.

Expected Result / Prediction: N/A - standard definition artifact.

Evidence Comparison Requirement: N/A with reason: no empirical prediction to
compare.

Contradiction Or Gap Disposition: N/A with reason: no contradictory evidence
surface for a contract-definition document.

Claim Update Requirement: N/A with reason: no claim was predicted; no update
is required.

## Public Export Disposition

DEFERRED_PRIVATE_ONLY

Reason: references internal lane names (EQC-T2, ASSF) as a worked example.
A public-safe rewording would be needed before any public-sync batch.

## Claim Boundary

This standard defines an authoring-time governance discipline for recording
and re-proposing value-declined lanes. It does not prove runtime agent
behavior, provider behavior, cross-agent memory transfer, hosted freshness,
production readiness, or public readiness.
