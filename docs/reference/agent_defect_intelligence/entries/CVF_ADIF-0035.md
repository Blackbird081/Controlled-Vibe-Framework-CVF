# ADIF-0035 - Canonical Host Drift In Browser Live Proof

Memory class: POINTER_RECORD

Status: ACTIVE

```text
defectId: ADIF-0035
title: Canonical host drift in browser live proof
defectCategory: CLOSURE_EVIDENCE
defectClass: RULE_GAP
defectRole: dispatcher
severity: HIGH
lifecycleState: ACTIVE
taskClasses: Web UI/dashboard; Live runtime or provider proof; Reviewer-return review
roles: dispatcher; worker; reviewer; closer
lifecyclePhases: pre-dispatch; pre-implementation; pre-closure
surfaceSelectors: Playwright baseURL, Auth.js callback origin, Next development allowed origins, browser/API request contexts
detectionSignals: 127.0.0.1 and localhost appear in one trace; callback redirects across host aliases; session endpoint passes but client useEffect requests never occur; diagnosis says cookie missing although browser navigation carries it
enforcementLevel: GUIDANCE_ONLY
checkerBindings: NOT_APPLICABLE_WITH_REASON: current gates do not reconcile hosts, redirect chains, cookie presence, browser hydration, and client request emission inside Playwright traces
promotionState: MACHINE_CHECK_CANDIDATE
supersedes: NONE
lastVerifiedCommit: 9a1043404
roadmapSeedId: NONE
```

## Purpose

Prevent browser proof packets from conflating host aliases or attributing a
failure to cookie loss without tracing the actual browser navigation, cookies,
redirect chain, hydration, and client requests.

## Scope / Applies To

Applies to real local browser proofs using Playwright with Next.js, Auth.js, or
another framework that may construct canonical callback URLs independently of
the test runner's default host alias.

## Bad Example

Authenticate through relative API calls at `127.0.0.1`, observe an Auth.js
callback redirect to `localhost`, then state that the later browser navigation
lost its cookie without checking the browser navigation request itself.

## Good Example

Choose one canonical origin before the invocation, use it for API requests,
callback URLs, and page navigation, then inspect trace rows separately for API
request context, browser navigation, cookies, redirect targets, client fetches,
and hydration errors. State only the failure stage the trace proves.

## Canonical Sources

- `docs/reference/archive/CVF_LIVE_RUN_DIAGNOSTIC_STANDARD_2026-05-24.md`
- `docs/reference/system_chain/CVF_SYSTEM_CHAIN_LIVE_PROOF_AND_LEARNING_LOOP_STANDARD.md`
- `docs/reviews/CVF_SYSTEM_CHAIN_UC04B_R2_WEB_AUTH_PROJECTION_REPAIR_WORKER_RETURN_2026-07-14.md`
- `docs/reviews/evidence/system-chain-uc04b-r2-auth-projection-diagnostic-2026-07-14.json`
- `docs/reviews/evidence/system-chain-uc04b-r2r1-localhost-regression-2026-07-15.json`
- `docs/reviews/CVF_SYSTEM_CHAIN_UC04B_R2R1_LOCALHOST_NORMALIZED_RECOVERY_COMPLETION_2026-07-15.md`
- `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/playwright.config.ts`

## Remediation

1. Select one canonical scheme, host, and port before freezing proof source.
2. Record the resolved origin in the immutable invocation ledger.
3. Ensure API requests, callback URLs, and browser navigation use that origin.
4. On failure, distinguish API-request redirects from browser navigation.
5. Verify cookies on the actual browser request and verify whether expected
   client requests were emitted before naming a cookie or auth-owner defect.
6. Do not retry under the same packet; use a fresh recovery authorization.

## Confirming Recovery Evidence

SCLP-UC04B-R2R1 applied one explicit `http://localhost:3001` origin without
changing the frozen proof spec. One invocation passed both developer and
anonymous projection cases with zero business, checker, retry, and provider
calls. This confirms the remediation guidance while preserving the rule that
a passing auth projection is not a UC-04B business-operation claim.

## Epistemic Process Block

### Expected Result / Prediction

R2 expected a developer session to project through `/api/auth/me` and the
Operations client after a request-bound adapter repair.

### Evidence Comparison

The trace contains an Auth.js callback redirect from `127.0.0.1` to
`localhost`, but the later browser navigation itself used `127.0.0.1` and
carried the session cookie. No browser-side `/api/auth/me` or jobs request was
emitted after page load, and the dev client reported origin-related HMR errors.

### Contradiction Or Gap Disposition

The worker's general host-drift finding is accepted, but its cookie-loss stage
is rejected. Recovery must normalize the origin and rerun only under fresh
authority.

### Claim Update

A cross-host redirect does not prove the browser navigation lost cookies.
Closure-grade diagnosis must reconcile request context, redirects, cookies,
hydration, and client fetch emission separately.

## Agent Operation Trace Block

| Field | Evidence |
|---|---|
| Actor | reviewer/closer |
| Provider or surface | local private provenance workspace |
| Session or invocation | SCLP-UC04B-R2 blocked review, 2026-07-15 |
| Working directory | repository root |
| Command or tool surface | worker evidence review, zip trace inspection, source reads, focused tests |
| Target paths | this entry and entries README row |
| Allowed scope source | mandatory ADIF learning and reviewer-owned R2 closure |
| Before status evidence | R1/R2 browser proofs both reached authenticated endpoint evidence but failed application-page projection under mixed host evidence |
| After status evidence | canonical-host and trace-stage discipline is resolver-discoverable |
| Diff evidence | new entry and README row in the R2 blocked closure batch |
| Approval boundary | learning record and bounded closure only; no live retry |
| Claim boundary | guidance and machine-check candidate only |
| Agent type | reviewer/closer |
| Invocation ID | system-chain-uc04b-adif-0035-2026-07-15 |
| Expected manifest | ADIF-0035 entry and entries README row |
| Actual changed set | ADIF-0035 entry and entries README row |
| Manifest delta | MATCH |
| Deletion or rename disposition | N/A with reason: no deletion or rename |

## Public Export Disposition

DEFERRED_PRIVATE_ONLY

Reason: private provenance learning record; no public-sync action.

## Claim Boundary

This entry records a reusable browser-proof defect. It does not implement a
checker, prove the final hydration cause, authorize another invocation, or
claim UC-04B Web operation.
