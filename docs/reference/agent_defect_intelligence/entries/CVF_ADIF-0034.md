# ADIF-0034 - Live Proof Diagnosis And Invocation Ledger Divergence

Memory class: POINTER_RECORD

Status: ACTIVE

```text
defectId: ADIF-0034
title: Live proof diagnosis and invocation ledger divergence
defectCategory: CLOSURE_EVIDENCE
defectClass: RULE_GAP
defectRole: worker
severity: HIGH
lifecycleState: ACTIVE
taskClasses: Worker execution (`WORKER_MUST_NOT_COMMIT`); Reviewer-return review; Live runtime or provider proof
roles: worker; reviewer; closer
lifecyclePhases: pre-implementation; pre-closure
surfaceSelectors: live proof receipts, diagnostics, worker returns, local credential preflights, invocation and retry ledgers
detectionSignals: worker prose records more live invocations than the receipt; a second command follows proof-spec repair despite zero-retry authority; environment root cause is asserted without checking the required local source; reviewer reruns the focused command and it passes while return calls it globally broken
enforcementLevel: GUIDANCE_ONLY
checkerBindings: NOT_APPLICABLE_WITH_REASON: current structural gates do not reconcile invocation counts across prose, receipts, diagnostics, and runtime artifacts or verify environment diagnoses against required local sources
promotionState: MACHINE_CHECK_CANDIDATE
supersedes: NONE
lastVerifiedCommit: c9ce755a6
roadmapSeedId: NONE
```

## Purpose

Prevent a failed live proof from consuming additional attempts and then
returning internally inconsistent counters or an unverified environment root
cause. A diagnostic is useful only when its source checks, invocation ledger,
receipt, runtime artifacts, and worker prose agree.

## Scope / Applies To

Applies to bounded browser, CLI, MCP, provider, or service proofs with an
explicit invocation or retry ceiling. It complements ADIF-0024 stale-evidence
hygiene and ADIF-0032 per-case identity; it focuses on cross-artifact call
counts and source-backed failure classification.

## Bad Example

Run a live browser command, edit the proof spec, run it again despite a
zero-retry ceiling, report one invocation and zero retry, then attribute the
failure to a missing local environment file without checking the required
path or source fallback.

## Good Example

Before the first live command, finish proof-spec and focused-test repair. After
the command starts, append every attempt to one immutable ledger. On failure,
check required environment sources without printing secrets, classify only
what the evidence proves, reconcile prose/receipt/diagnostic/runtime counters,
and stop when the packet has no retry authority.

## Canonical Sources

- `docs/reference/archive/CVF_LIVE_RUN_DIAGNOSTIC_STANDARD_2026-05-24.md`
- `docs/reference/system_chain/CVF_SYSTEM_CHAIN_LIVE_PROOF_AND_LEARNING_LOOP_STANDARD.md`
- `docs/work_orders/CVF_AGENT_WORK_ORDER_SYSTEM_CHAIN_UC04B_WEB_OPERATIONS_READOUT_2026-07-14.md`
- `docs/reviews/CVF_SYSTEM_CHAIN_UC04B_WEB_OPERATIONS_READOUT_WORKER_RETURN_2026-07-14.md`
- `docs/reviews/evidence/system-chain-uc04b-web-operations-readout-proof-2026-07-14.json`

## Remediation

1. Freeze proof source and pass focused preflight before the live ceiling starts.
2. Append each live command start to one ledger before execution.
3. Never reinterpret a spec-repair rerun as part of the original invocation.
4. Verify required local files and source fallbacks secret-safely before naming
   an environment root cause.
5. Reconcile invocation, retry, submission, checker, provider, and case counts
   across worker prose, receipt, diagnostic, and runtime artifacts.
6. A reviewer must reject contradictory counters and authorize recovery only
   through a fresh packet.

## Epistemic Process Block

### Expected Result / Prediction

The one-invocation UC-04B packet was expected to produce two stable case rows,
one checker execution, zero retries, and mutually consistent prose, receipt,
diagnostic, and runtime evidence.

### Evidence Comparison

Worker prose recorded an initial Playwright command and another after proof
spec repair, while the receipt reported one invocation and zero retry. The
reviewer also found the required local environment path and obtained 20/20
focused PASS, contradicting the two asserted environment root causes.

### Contradiction Or Gap Disposition

The attempt is closed blocked. Zero submissions/checker/provider calls remain
valid; invocation and retry counters are corrected; auth root cause remains
unresolved.

### Claim Update

A live failure diagnostic is not closure-grade until source checks and all
invocation ledgers reconcile. Recovery requires fresh authority.

## Agent Operation Trace Block

| Field | Evidence |
|---|---|
| Actor | reviewer/closer |
| Provider or surface | local private provenance workspace |
| Session or invocation | SCLP-UC04B-T4 blocked review, 2026-07-14 |
| Working directory | repository root |
| Command or tool surface | worker-return review, receipt/diagnostic comparison, secret-safe environment existence check, focused Vitest verification, source reads |
| Target paths | this entry; entries README; UC-04B completion evidence |
| Allowed scope source | mandatory ADIF learning and reviewer-owned UC-04B closure |
| Before status evidence | worker prose recorded two Playwright commands while receipt claimed one and named unverified environment defects |
| After status evidence | ADIF-0034 makes cross-artifact invocation and diagnosis reconciliation discoverable |
| Diff evidence | new entry and README row in the UC-04B blocked closure batch |
| Approval boundary | defect record and bounded blocked closure only; no live retry or runtime-owner mutation |
| Claim boundary | guidance and machine-check candidate only |
| Agent type | reviewer/closer |
| Invocation ID | system-chain-uc04b-adif-0034-2026-07-14 |
| Expected manifest | ADIF-0034 entry and entries README row |
| Actual changed set | ADIF-0034 entry and entries README row |
| Manifest delta | MATCH |
| Deletion or rename disposition | N/A with reason: no deletion or rename |

## Public Export Disposition

DEFERRED_PRIVATE_ONLY

Reason: private provenance reviewer-learning record; no public-sync action.

## Claim Boundary

This entry records a reusable proof-evidence defect. It does not prove the
auth root cause, implement a checker, authorize another live invocation, or
claim UC-04B Web operation.
