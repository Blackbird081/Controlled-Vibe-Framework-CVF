# ADIF-0036 - Unscoped Human-Text Locator In Browser Proof

Memory class: POINTER_RECORD

Status: ACTIVE

```text
defectId: ADIF-0036
title: Unscoped human-text locator in browser proof
defectCategory: CLOSURE_EVIDENCE
defectClass: RULE_GAP
defectRole: dispatcher
severity: MEDIUM
lifecycleState: ACTIVE
taskClasses: Web UI/dashboard; Live runtime or provider proof; Reviewer-return review
roles: dispatcher; worker; reviewer; closer
lifecyclePhases: pre-dispatch; pre-implementation; pre-closure
surfaceSelectors: retained Playwright proof specs that assert role, status, actor, or policy text before the material action
detectionSignals: strict-mode locator ambiguity; multiple text matches; proof stops before the intended POST or policy branch; positive case passes while negative case never invokes its target
enforcementLevel: GUIDANCE_ONLY
checkerBindings: NOT_APPLICABLE_WITH_REASON: current gates cannot determine whether a human-visible text locator is unique in the live rendered page
promotionState: MACHINE_CHECK_CANDIDATE
supersedes: NONE
lastVerifiedCommit: 0c1469860
roadmapSeedId: NONE
```

## Purpose

Prevent a browser proof from consuming its sole invocation on an ambiguous
human-text assertion before the action or policy branch that the packet exists
to prove.

## Scope / Applies To

Applies to bounded Playwright proofs whose acceptance depends on reaching a
specific submission, denial, approval, or audit event after loading a real UI.

## Bad Example

Use `page.getByText('reviewer')` as an unscoped precondition on a page where the
same role text appears in navigation, badges, identity blocks, and the main
readout, then treat the resulting strict-mode exception as a runtime-policy
failure.

## Good Example

Before freezing the proof, use a stable semantic owner such as a dedicated
`data-testid`, a uniquely scoped region, or an exact locator whose uniqueness
is verified against the rendered page. Keep the material POST and its durable
audit assertion as the acceptance boundary.

## Canonical Sources

- `docs/reference/system_chain/CVF_SYSTEM_CHAIN_LIVE_PROOF_AND_LEARNING_LOOP_STANDARD.md`
- `docs/reviews/CVF_SYSTEM_CHAIN_UC04B_R3_BUSINESS_PROOF_WORKER_RETURN_2026-07-15.md`
- `docs/reviews/evidence/system-chain-uc04b-r3-business-diagnostic-2026-07-15.json`
- `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/tests/e2e/system-chain-uc04b-web-operations-readout.spec.ts`

## Remediation

1. Identify the exact material action and every assertion that precedes it.
2. Verify each pre-action locator is unique in the real rendered page.
3. Prefer a stable semantic selector over a broad human-text substring.
4. If a live run stops before the action, record the actual invocation and
   side-effect counters and do not rerun under the same authorization.
5. Repair and regress the proof under a fresh packet before promoting the
   intended runtime claim.

## Epistemic Process Block

### Expected Result / Prediction

The retained negative proof case was expected to reach its reviewer POST after
confirming the authenticated role was visible.

### Evidence Comparison

The real rendered page contained five matches for the broad text locator, so
Playwright strict mode stopped the case before the POST and policy branch.

### Contradiction Or Gap Disposition

The evidence contradicts the assumption that a familiar role label is a unique
pre-action locator. It does not contradict the policy implementation itself.

### Claim Update

Pre-action locator uniqueness is part of proof-harness readiness. Runtime
policy behavior remains unproven when the harness never invokes it.

## Agent Operation Trace Block

| Field | Evidence |
|---|---|
| Actor | reviewer/closer |
| Provider or surface | local private provenance workspace |
| Session or invocation | SCLP-UC04B-R3 blocked closure, 2026-07-15 |
| Working directory | repository root |
| Command or tool surface | worker evidence review, Playwright error-context inspection, retained proof source read |
| Target paths | this entry and entries README row |
| Allowed scope source | mandatory ADIF learning and reviewer-owned R3 closure |
| Before status evidence | R3 negative case stopped at an ambiguous pre-submission locator after the positive case passed |
| After status evidence | locator-uniqueness discipline is resolver-discoverable |
| Diff evidence | new entry and README row in the R3 blocked closure batch |
| Approval boundary | learning record and bounded closure only; no proof-spec edit or live retry |
| Claim boundary | guidance and machine-check candidate only |
| Agent type | reviewer/closer |
| Invocation ID | system-chain-uc04b-adif-0036-2026-07-15 |
| Expected manifest | ADIF-0036 entry and entries README row |
| Actual changed set | ADIF-0036 entry and entries README row |
| Manifest delta | MATCH |
| Deletion or rename disposition | N/A with reason: no deletion or rename |

## Public Export Disposition

DEFERRED_PRIVATE_ONLY

Reason: private provenance learning record; no public-sync action.

## Claim Boundary

This entry records a reusable browser-proof defect. It does not implement a
checker, repair the retained proof, authorize a rerun, or prove reviewer denial.
