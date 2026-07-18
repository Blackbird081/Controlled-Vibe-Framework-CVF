# ADIF-0030 - Live Test Direct Invocation Bypasses Evidence Capture

Memory class: POINTER_RECORD

Status: ACTIVE

```text
defectId: ADIF-0030
title: Live test direct invocation bypasses evidence capture
defectCategory: GATE_TRIGGER_FRICTION
defectClass: WORKER_EXECUTION_ERROR
defectRole: worker
severity: HIGH
lifecycleState: ACTIVE
taskClasses: Worker execution (`WORKER_MUST_NOT_COMMIT`); Live/provider proof; Reviewer-return review; Closure
roles: dispatcher; worker; reviewer; closer
lifecyclePhases: pre-dispatch; pre-implementation; pre-closure
surfaceSelectors: route-adjacent live tests, provider proof runners, live evidence receipts, call ledgers
detectionSignals: a live test is invoked directly instead of through its receipt runner; provider calls occur before observation persistence is configured; a parsed call-limit option is not used; a passing provider result has no durable correlation receipt
enforcementLevel: GUIDANCE_ONLY
checkerBindings: NOT_APPLICABLE_WITH_REASON: the A3 permit guard is local executable proof, while no general governance checker yet covers every live-test runner design
promotionState: RULE_EXISTS
supersedes: NONE
lastVerifiedCommit: 082e65eed
roadmapSeedId: NONE
```

## Purpose

Prevent a worker from treating direct invocation of a live-test file as a
free dry run when the test framework can load an operator-local provider key.
The defect can consume provider calls outside the intended runner, lose the
only passing observation when the test process exits, and leave no receipt
that supports the live-governance claim.

## Scope / Applies To

Applies to live provider tests whose canonical entrypoint is a wrapper that
creates receipts, diagnostics, manifests, or call ledgers. It does not impose
a numeric provider quota when the operator has declared a provider unmetered.
Diagnostic-before-rerun and diminishing-return rules still apply.

## Bad Example

> Run a `*.live.test.ts` file directly to check whether it skips, discover
> afterward that the test framework loaded a local key, then rerun it while
> the observation output path is still absent.

## Good Example

> Make the live suite require a short-lived, one-use permit created by the
> canonical runner. Resolve the provider key only after permit validation,
> write a secret-safe call ledger before the network boundary, persist the
> observation in the same invocation, and classify any failure before rerun.

## Canonical Sources

- `AGENTS.md` (Mandatory Live Governance Proof and Mandatory Live Run
  Diagnostics)
- `docs/reference/archive/CVF_LIVE_RUN_DIAGNOSTIC_STANDARD_2026-05-24.md`
  (Mandatory Rule and Rerun Rule)
- `docs/work_orders/CVF_AGENT_WORK_ORDER_SOT3_ACT_A3_REAL_PROVIDER_APPROVED_CONTEXT_PROOF_2026-07-13.md`
  (live-call and receipt boundary)
- `docs/reviews/CVF_SOT3_ACT_A3_REAL_PROVIDER_APPROVED_CONTEXT_PROOF_WORKER_RETURN_2026-07-13.md`
  (three-call breach and lost passing observation)
- `scripts/run_cvf_sot3_a3_live_proof.py` (one-use runner permit)
- `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/app/api/execute/route.sot3-activation.alibaba.live.test.ts`
  (pre-key permit validation and pre-network call ledger)

## Remediation

1. Declare one canonical runner for each receipt-producing live proof.
2. Require a short-lived, one-use permit bound to the observation path.
3. Resolve provider credentials only after permit validation succeeds.
4. Record a secret-safe call ledger immediately before the network boundary.
5. Prove direct invocation cannot reach the live suite.
6. Do not claim a live PASS from console memory when the required receipt and
   correlation fields were not persisted.
7. Before rerun, record the failure class and the exact result-changing action,
   even when provider calls are unmetered.

## Epistemic Process Block

### Expected Result / Prediction

A numeric call ceiling in a work order and a runner option were expected to
keep an A3 proof within its live-call boundary.

### Evidence Comparison

The A3 worker invoked the live test directly three times. The second call
passed, but no observation output path existed, and the runner's declared
`--max-calls` enforcement was only an unused parsed option.

### Contradiction Or Gap Disposition

The prediction was rejected. Prose and an unused option do not control a
direct test invocation. The accepted local repair uses a one-use permit,
pre-key validation, and a pre-network ledger.

### Claim Update

Live-proof call discipline requires executable entrypoint control and durable
observation capture, not only a stated quota.

## Agent Operation Trace Block

| Field | Evidence |
|---|---|
| Actor | reviewer/closer |
| Provider or surface | local private provenance workspace |
| Session or invocation | SOT3-ACT-A3 recovery review, 2026-07-13 |
| Working directory | repository root |
| Command or tool surface | worker-return review, source review, `apply_patch`, TypeScript check, direct-invocation negative test |
| Target paths | `docs/reference/agent_defect_intelligence/entries/CVF_ADIF-0030.md`; `docs/reference/agent_defect_intelligence/entries/README.md` |
| Allowed scope source | operator authorization for A3 bounded repair and ADIF guard on 2026-07-13; Mandatory ADIF Defect Registry Disclosure |
| Before status evidence | A3 worker return records three direct provider calls, a lost passing observation, and an unused call-limit option |
| After status evidence | ADIF-0030 is indexed and discoverable by the ADIF resolver |
| Diff evidence | new entry and front-door row; `git diff --name-status` before material commit |
| Approval boundary | governed defect learning and A3 recovery guard only; no public-sync or general provider-runtime change |
| Claim boundary | registry guidance plus local A3 permit evidence; no universal live-test prevention claim |
| Agent type | reviewer/closer |
| Invocation ID | sot3-act-a3-adif-0030-2026-07-13 |
| Expected manifest | `docs/reference/agent_defect_intelligence/entries/CVF_ADIF-0030.md`; `docs/reference/agent_defect_intelligence/entries/README.md` |
| Actual changed set | `docs/reference/agent_defect_intelligence/entries/CVF_ADIF-0030.md`; `docs/reference/agent_defect_intelligence/entries/README.md` |
| Manifest delta | MATCH |
| Deletion or rename disposition | N/A with reason: no deletion or rename |

## Public Export Disposition

DEFERRED_PRIVATE_ONLY

Reason: private provenance reviewer-learning record. No public-sync action is
authorized.

## Claim Boundary

This entry makes the defect discoverable and records the accepted prevention
pattern. The implemented permit proves the local SOT3-ACT-A3 path only. It
does not claim a repository-wide checker, malicious-bypass resistance, public
readiness, or unlimited-value reruns.
