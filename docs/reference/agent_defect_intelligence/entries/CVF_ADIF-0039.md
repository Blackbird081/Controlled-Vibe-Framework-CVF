# ADIF-0039 - Worker Return Contract Omits Automation-Assist Terms

Memory class: POINTER_RECORD

Status: ACTIVE

```text
defectId: ADIF-0039
title: Worker return contract omits automation-assist terms
defectCategory: GATE_TRIGGER_FRICTION
defectClass: RULE_GAP
defectRole: dispatcher
severity: MEDIUM
lifecycleState: ACTIVE
taskClasses: Work-order authoring / dispatch; Worker execution (`WORKER_MUST_NOT_COMMIT`); Reviewer-return review
roles: dispatcher; worker; reviewer; closer
lifecyclePhases: pre-dispatch; pre-implementation; pre-closure
surfaceSelectors: work orders containing a Worker Return Packet Shape Contract generated or adapted from the dispatch scaffold
detectionSignals: automation assist repeatedly reports the missing enumerated-terms closing prose even though the contract profile and required gate are present
enforcementLevel: PARTIAL_CHECK
checkerBindings: governance/compat/run_agent_automation_assist.py
promotionState: MACHINE_CHECK_CANDIDATE
supersedes: NONE
lastVerifiedCommit: edec8008a
roadmapSeedId: NONE
```

## Purpose

Prevent repeated worker-side discovery that a dispatch packet omitted the
enumerated worker-return terms expected by the automation-assist readout.

## Scope / Applies To

Applies to no-commit work orders whose Worker Return Packet Shape Contract is
generated or adapted from the dispatch scaffold. It does not require immediate
helper mutation inside unrelated implementation tranches.

## Bad Example

Declare the full worker-return profile and fast gate but omit the closing prose
that enumerates the expected return terms. Each worker then rediscovers the same
non-blocking automation-assist signal and records it as a local exception.

## Good Example

The dispatch scaffold emits the complete contract paragraph once. Until a
separately authorized helper batch implements that default, the dispatcher
adds the paragraph during packet finalization and verifies automation assist
before dispatch.

## Canonical Sources

- `docs/reviews/CVF_SYSTEM_CHAIN_UC04B_R3R2_REVIEWER_AUTH_PROJECTION_REPAIR_WORKER_RETURN_2026-07-15.md`
- `docs/reviews/CVF_SYSTEM_CHAIN_UC04B_R3R3_REVIEWER_NEGATIVE_PROOF_WORKER_RETURN_2026-07-15.md`
- `docs/reviews/CVF_SYSTEM_CHAIN_T5_WORKER_RETURN_2026-07-15.md`
- `governance/compat/build_dispatch_packet_scaffold.py`
- `governance/compat/run_agent_automation_assist.py`

## Remediation

1. During dispatch authoring, run automation assist against the pending packet.
2. If it reports the missing enumerated-terms paragraph, repair the work order
   before worker execution rather than deferring the same signal downstream.
3. Open a separately authorized helper-maintenance packet to default-include
   the paragraph and focused regression coverage.
4. Do not mutate the protected helper from an unrelated worker tranche.

## Epistemic Process Block

### Expected Result / Prediction

A recurring packet-shape omission should stop recurring once it has crossed the
governance-learning threshold and becomes resolver-discoverable.

### Evidence Comparison

The same omission appeared in R3R2, R3R3, and T5 work orders. Each worker
reported the automation-assist signal independently, establishing recurrence.

### Contradiction Or Gap Disposition

Three occurrences reject continued chat-only or return-only handling. Record
the defect now; defer helper mutation to a separately authorized batch.

### Claim Update

The pattern is durable ADIF learning with partial detection. Automatic scaffold
prevention is not yet implemented.

## Agent Operation Trace Block

| Field | Evidence |
|---|---|
| Actor | reviewer/closer |
| Provider or surface | local private provenance workspace |
| Session or invocation | SCLP-T5 closure, 2026-07-15 |
| Working directory | repository root |
| Command or tool surface | three worker-return reads, ADIF template/readme, apply_patch, entry integrity gate |
| Target paths | this entry and entries README |
| Allowed scope source | mandatory ADIF recurring-defect disclosure during reviewer closure |
| Before status evidence | same automation-assist omission recorded in R3R2, R3R3, and T5 returns without an ADIF owner |
| After status evidence | recurring dispatch/scaffold defect is resolver-discoverable |
| Diff evidence | new entry and README row in the T5 closure batch |
| Approval boundary | durable learning only; no helper/checker mutation |
| Claim boundary | partial detection and machine-check candidate only |
| Agent type | reviewer/closer |
| Invocation ID | system-chain-t5-adif-0039-2026-07-15 |
| Expected manifest | ADIF-0039 entry and entries README row |
| Actual changed set | ADIF-0039 entry and entries README row |
| Manifest delta | MATCH |
| Deletion or rename disposition | N/A with reason: none |

## Public Export Disposition

DEFERRED_PRIVATE_ONLY

Reason: private provenance learning record; no public-sync action.

## Claim Boundary

This entry records a three-occurrence dispatch/scaffold defect. It does not
modify the scaffold helper, guarantee prevention, or broaden T5 runtime claims.
