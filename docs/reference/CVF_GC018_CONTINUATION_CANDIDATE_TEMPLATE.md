# CVF GC-018 Continuation Candidate Template

Status: reusable template for any future attempt to reopen a materially delivered roadmap under `GC-018`.

## Purpose

- provide one standard continuation packet for post-closure roadmap reopening
- make `GC-018` scoring comparable across waves
- reduce ambiguity about when a new batch is authorized versus merely proposed

## When To Use

Use this template only when all of the following are true:

- the roadmap or wave is already marked `MATERIALLY DELIVERED`, `DEPTH-FROZEN`, or equivalent
- a proposer wants to reopen breadth expansion, semantic deepening, or proof-strengthening
- the proposer needs a reviewable `GC-018` decision before implementation begins

Do not use this template for:

- ordinary bug fixes on an already authorized active batch
- baseline-only reconciliation updates
- post-fix verification or closeout receipts

## Required Packet

Copy the following block into one reviewable artifact:

- roadmap update
- baseline delta
- reassessment addendum
- governance decision note

```text
GC-018 Continuation Candidate
- Candidate ID: <stable id>
- Date: <YYYY-MM-DD>
- Parent roadmap / wave: <path>
- Proposed scope: <short description>
- Why now: <short justification>
- Active-path impact: NONE | LIMITED | MATERIAL
- Risk if deferred: <short description>
- Expected enforcement class:
  - RUNTIME_GUARD | GATEWAY_PRECONDITION | APPROVAL_CHECKPOINT | CI_REPO_GATE | GOVERNANCE_DECISION_GATE
- Required evidence if approved:
  - <artifact or test 1>
  - <artifact or test 2>

Depth Audit
- Risk reduction: <0|1|2>
- Decision value: <0|1|2>
- Machine enforceability: <0|1|2>
- Operational efficiency: <0|1|2>
- Portfolio priority: <0|1|2>
- Total: <0..10>
- Decision: CONTINUE | REVIEW REQUIRED | DEFER
- Reason: <short justification>

Authorization Boundary
- Authorized now: YES | NO
- If YES, next batch name: <planned batch>
- If NO, reopen trigger: <fresh reassessment or new candidate condition>
```

## Reading Rules

- `Authorized now: YES` should only appear if the score satisfies the current `GC-018` threshold and no hard-stop override is triggered.
- any `0` in `Risk reduction`, `Decision value`, or `Machine enforceability` should force `Decision: DEFER`
- if the proposed step changes active-path implementation, the resulting packet must remain reviewable by the repository continuation gate

## Preferred Placement

For system-level continuation, prefer one of:

- `docs/roadmaps/...`
- `docs/baselines/...`
- `docs/reviews/...`

The same packet may be summarized in multiple places, but there should be one obvious canonical source.

## Related Controls

- `governance/toolkit/05_OPERATION/CVF_DEPTH_AUDIT_GUARD.md`
- `docs/reference/CVF_GOVERNANCE_CONTROL_MATRIX.md#GC-018`
- `governance/compat/check_depth_audit_continuation_compat.py`
- `docs/roadmaps/CVF_SYSTEM_UNIFICATION_REMEDIATION_ROADMAP_2026-03-19.md`
