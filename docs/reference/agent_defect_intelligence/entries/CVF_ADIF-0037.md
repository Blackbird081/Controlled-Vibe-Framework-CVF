# ADIF-0037 - Server Session Assertion Used As Client Projection Readiness

Memory class: POINTER_RECORD

Status: ACTIVE

```text
defectId: ADIF-0037
title: Server session assertion used as client projection readiness
defectCategory: CLOSURE_EVIDENCE
defectClass: RULE_GAP
defectRole: dispatcher
severity: HIGH
lifecycleState: ACTIVE
taskClasses: Web UI/dashboard; Live runtime or provider proof; Reviewer-return review
roles: dispatcher; worker; reviewer; closer
lifecyclePhases: pre-dispatch; pre-implementation; pre-closure
surfaceSelectors: browser proofs that establish server authentication before asserting a separately hydrated client role or permission state
detectionSignals: server session role differs from rendered application role; expected client auth request is absent; material POST is never attempted; timeout increase is proposed without request-emission evidence
enforcementLevel: GUIDANCE_ONLY
checkerBindings: NOT_APPLICABLE_WITH_REASON: repository gates cannot observe browser request emission or reconcile multiple live auth projections
promotionState: MACHINE_CHECK_CANDIDATE
supersedes: NONE
lastVerifiedCommit: c8995160e
roadmapSeedId: NONE
```

## Purpose

Prevent a direct server-session assertion from being treated as proof that a
separately hydrated browser client has observed the same actor and role.

## Scope / Applies To

Applies when a browser proof crosses more than one auth projection, including
server session, shell identity, page-local role state, or API-derived policy
state, before the material action.

## Bad Example

Assert that `/api/auth/session` returns `reviewer`, navigate to a page whose
role starts as `anonymous_local`, and wait only for rendered reviewer text.
When no client auth request appears, increase the text assertion timeout and
call the issue timing.

## Good Example

Name every auth projection in the dispatch. Before consuming the material
browser invocation, use deterministic local regression to prove the page emits
its auth request and maps the response to the intended role. During live proof,
capture request emission, response outcome, rendered role, and the material
POST as separate evidence boundaries.

## Canonical Sources

- `docs/reference/system_chain/CVF_SYSTEM_CHAIN_LIVE_PROOF_AND_LEARNING_LOOP_STANDARD.md`
- `docs/reviews/CVF_SYSTEM_CHAIN_UC04B_R3R1_NEGATIVE_LOCATOR_RECOVERY_WORKER_RETURN_2026-07-15.md`
- `docs/reviews/evidence/system-chain-uc04b-r3r1-negative-diagnostic-2026-07-15.json`
- `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/app/(dashboard)/governance/operations/page.tsx`

## Remediation

1. Inventory the server-session, shell, page-local, and policy-route auth
   projections used by the proof.
2. Source-verify which owner hydrates each projection and the request or event
   that transitions it from its initial value.
3. Add a provider-free deterministic regression for request emission and role
   mapping before another browser business invocation.
4. Do not treat a longer timeout as a repair when the expected request was not
   observed.
5. Retain prior bounded evidence for other roles; reopen only the contradicted
   scope.

## Epistemic Process Block

### Expected Result / Prediction

After direct authentication reported `reviewer`, the Operations page was
expected to hydrate that role and reach the policy-denial POST.

### Evidence Comparison

The server assertion reported reviewer, the shell snapshot displayed admin,
and the Operations owner remained anonymous_local. The retained trace contained
no `/api/auth/me` request and the POST was never attempted.

### Contradiction Or Gap Disposition

The evidence contradicts projection readiness, not the focused denial policy.
The existing auth-projection GAP is reopened for reviewer scope.

### Claim Update

Server authentication and client authorization projection are separate proof
edges. Both must be observed before a browser business-policy claim can close.

## Agent Operation Trace Block

| Field | Evidence |
|---|---|
| Actor | reviewer/closer |
| Provider or surface | local private provenance workspace |
| Session or invocation | SCLP-UC04B-R3R1 closure, 2026-07-15 |
| Working directory | repository root |
| Command or tool surface | worker evidence, trace network counts, error-context snapshot, source reads |
| Target paths | this entry and entries README row |
| Allowed scope source | mandatory ADIF learning and reviewer-owned R3R1 closure |
| Before status evidence | server reviewer session was assumed sufficient while the page remained anonymous_local and emitted no client auth request |
| After status evidence | multi-projection readiness discipline is resolver-discoverable |
| Diff evidence | new entry and README row in the R3R1 blocked closure batch |
| Approval boundary | learning record and bounded closure only; no runtime repair or browser rerun |
| Claim boundary | guidance and machine-check candidate only |
| Agent type | reviewer/closer |
| Invocation ID | system-chain-uc04b-adif-0037-2026-07-15 |
| Expected manifest | ADIF-0037 entry and entries README row |
| Actual changed set | ADIF-0037 entry and entries README row |
| Manifest delta | MATCH |
| Deletion or rename disposition | N/A with reason: none |

## Public Export Disposition

DEFERRED_PRIVATE_ONLY

Reason: private provenance learning record; no public-sync action.

## Claim Boundary

This entry records a reusable browser-proof defect. It does not repair auth
projection, authorize a rerun, or prove reviewer denial.
