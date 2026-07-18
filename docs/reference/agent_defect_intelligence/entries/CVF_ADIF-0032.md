# ADIF-0032 - Aggregate PASS Without Retained Case Identity

Memory class: POINTER_RECORD

Status: ACTIVE

```text
defectId: ADIF-0032
title: Aggregate PASS without retained case identity
defectCategory: CLOSURE_EVIDENCE
defectClass: RULE_GAP
defectRole: worker
severity: MEDIUM
lifecycleState: ACTIVE
taskClasses: Worker execution (`WORKER_MUST_NOT_COMMIT`); Reviewer-return review; Live runtime or provider proof
roles: worker; reviewer; closer
lifecyclePhases: pre-implementation; pre-closure
surfaceSelectors: proof runners, subprocess test parsers, per-case receipts, focused proof-runner tests
detectionSignals: aggregate denominator and process exit are PASS but receipt case names are identical, truncated, or absent; focused tests contain placeholder pass bodies while their names imply real behavior coverage
enforcementLevel: GUIDANCE_ONLY
checkerBindings: NOT_APPLICABLE_WITH_REASON: current worker-return and receipt gates validate structure but do not prove that every counted event retains a unique case identity or that every named test contains an effective assertion
promotionState: RULE_EXISTS
supersedes: NONE
lastVerifiedCommit: 482352555
roadmapSeedId: NONE
```

## Purpose

Prevent a proof packet from treating an aggregate process PASS and numeric
denominator as complete per-case evidence when the retained receipt cannot
identify which named cases passed. Also prevent placeholder-only focused tests
from inflating the apparent verification count.

## Scope / Applies To

Applies to proof runners that parse subprocess output into case/event receipts
and to focused harness tests used as closure evidence. It does not require a
new live invocation when the retained command, exact test source, process
result, and bounded claim already make the decision sound; in that case the
reviewer must disclose the limitation and record a concrete reopen condition.

## Bad Example

> Record two anonymous PASS rows with the same truncated name, cite 23/23
> focused tests even though some bodies are only `pass`, and claim complete
> per-case traceability.

## Good Example

> Give each expected case a stable ID, reject duplicate or missing IDs before
> overall PASS, retain the invoked source hash, and ensure every focused test
> named as coverage exercises an observable behavior. If historical evidence
> lacks identity but still supports a bounded decision, disclose that limit
> and park repair behind a reuse-trigger rather than rerunning blindly.

## Canonical Sources

- `docs/reference/archive/CVF_LIVE_RUN_DIAGNOSTIC_STANDARD_2026-05-24.md`
- `docs/reference/system_chain/CVF_SYSTEM_CHAIN_LIVE_PROOF_AND_LEARNING_LOOP_STANDARD.md`
- `docs/work_orders/CVF_AGENT_WORK_ORDER_SYSTEM_CHAIN_UC03_CONTRACT_TO_RUNTIME_REPRESENTATIVE_PATH_2026-07-14.md`
- `docs/reviews/CVF_SYSTEM_CHAIN_UC03_CONTRACT_TO_RUNTIME_WORKER_RETURN_2026-07-14.md`
- `docs/reviews/evidence/system-chain-uc03-contract-runtime-proof-2026-07-14.json`

## Remediation

1. Define stable expected case IDs before invocation.
2. Require one unique retained result per expected ID; duplicate, truncated,
   anonymous, missing, or extra IDs fail receipt validation.
3. Retain the invoked proof-source hash when the proof file is mutable.
4. Replace placeholder-only tests with observable assertions before counting
   them as coverage.
5. Do not repeat a costly proof solely to improve metadata when the decision is
   unchanged; record the limitation and a checkable reuse-trigger instead.

## Epistemic Process Block

### Expected Result / Prediction

A two-case PASS receipt was expected to preserve the distinct positive and
negative case identities and the focused suite was expected to exercise every
behavior claimed by its test names.

### Evidence Comparison

The UC-03 process exited successfully and the exact proof file contains two
tests, but the retained receipt contains two identical truncated case names.
Two focused test functions contain only `pass`, so the numeric 23/23 result
overstates effective harness checks.

### Contradiction Or Gap Disposition

The operational GC-011 conclusion remains supported by the exact command,
two-test source, process PASS, and bounded result. Complete per-case receipt
identity and full focused-test effectiveness are not supported.

### Claim Update

Aggregate PASS may support only the bounded decision its retained source and
command prove. It must not be described as complete per-case traceability when
case identities or effective test bodies are missing.

## Agent Operation Trace Block

| Field | Evidence |
|---|---|
| Actor | reviewer/closer |
| Provider or surface | local private provenance workspace |
| Session or invocation | SCLP-UC03-T2 closure review, 2026-07-14 |
| Working directory | repository root |
| Command or tool surface | worker-return review, receipt/source comparison, focused pytest, reviewer-fast gate, apply_patch |
| Target paths | `docs/reference/agent_defect_intelligence/entries/CVF_ADIF-0032.md`; entries README |
| Allowed scope source | mandatory ADIF disclosure and reviewer-owned UC-03 learning closure |
| Before status evidence | UC-03 receipt retained two identical case names and focused suite contained placeholder-only bodies |
| After status evidence | ADIF-0032 is resolver-discoverable and the completion claim preserves the evidence limitation |
| Diff evidence | new entry and README row in the UC-03 material closure batch |
| Approval boundary | reviewer learning and bounded closure only; no proof rerun or runtime-owner mutation |
| Claim boundary | defect guidance only; no machine-wide prevention claim |
| Agent type | reviewer/closer |
| Invocation ID | system-chain-uc03-adif-0032-2026-07-14 |
| Expected manifest | ADIF-0032 entry and entries README row |
| Actual changed set | ADIF-0032 entry and entries README row |
| Manifest delta | MATCH |
| Deletion or rename disposition | N/A with reason: no deletion or rename |

## Public Export Disposition

DEFERRED_PRIVATE_ONLY

Reason: private provenance reviewer-learning record; no public-sync action.

## Claim Boundary

This entry records an evidence-quality pattern and bounded prevention rule. It
does not invalidate the accepted UC-03 operational result, implement a checker,
or authorize another proof invocation, UC-04, public, or production work.
