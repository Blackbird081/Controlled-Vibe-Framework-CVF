<!-- Memory class: SUMMARY_RECORD -->

# CVF W132-T1 Provider/Runtime Stability And Browser Session Hardening Roadmap

> Date: 2026-04-30
> Status: AUTHORIZED - NOT YET DELIVERED
> Scope class: PROVIDER RUNTIME STABILITY / BROWSER SESSION HARDENING / EVIDENCE PRESERVATION
> Predecessor: W131-T1 DELIVERED - EVIDENCE BASED - CONTINUATION CHOSEN
> Authorization: `docs/baselines/CVF_GC018_W132_T1_PROVIDER_RUNTIME_STABILITY_AND_BROWSER_SESSION_HARDENING_AUTHORIZATION_2026-04-30.md`
> Wave ID: W132

---

## 0. Why This Is Next

W131 did not justify a feature-expansion wave. It found a stability problem:

- Alibaba `qwen-turbo`: 1 accepted journey, 2 timeouts, 2 mock fallbacks, 1
  route miss across the first 6 real journeys, then browser-session collapse
- DeepSeek `deepseek-chat`: the same 1/6 accepted and 4/6 timeout/fallback
  pattern across the confirmatory 6 journeys
- both providers produced the same 17% acceptance and 66% timeout/fallback
  profile

Therefore W132 must harden the provider/runtime path and the live browser proof
method before CVF broadens noncoder capability or public claims.

---

## 1. Product Claim Target

W132 should make this bounded claim true:

> CVF can preserve per-journey evidence and classify live provider/runtime
> failures without cascading browser-session loss, and can either demonstrate a
> materially more stable noncoder execution path or publish a precise blocker for
> the next tranche.

This is not a claim of provider parity, public adoption, or full production
readiness.

---

## 2. Non-Goals

- No new noncoder feature
- No trusted-form corpus expansion
- No public claim hardening beyond the measured W132 evidence
- No UI redesign
- No server telemetry productization
- No mock-mode substitution for governance proof
- No raw key printing or storage

---

## 3. Checkpoints

### CP0 - Authorization And Stability Contract

**Deliver**

- `docs/baselines/CVF_GC018_W132_T1_PROVIDER_RUNTIME_STABILITY_AND_BROWSER_SESSION_HARDENING_AUTHORIZATION_2026-04-30.md`
- `docs/reviews/CVF_W132_PROVIDER_RUNTIME_STABILITY_CONTRACT_2026-04-30.md`

**Acceptance**

- GC-018 depth audit is at least 9/10
- W132 is limited to provider/runtime hardening, browser-session hardening, and
  evidence preservation
- contract defines counted evidence and diagnostic subcodes

### CP1 - Browser Session Isolation And Evidence Persistence

**Deliver**

Refactor the W131 live proof shape so each journey, or each small shard, has an
isolated Playwright browser context. Evidence must be written after every
attempted journey instead of only at the end of a long run.

Target file:

- `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/tests/e2e/w131-post-w130-stability.live.spec.ts`

Optional if cleaner:

- create `tests/e2e/w132-runtime-stability.live.spec.ts` and keep W131 intact
  as historical proof

**Acceptance**

- a late browser failure cannot erase earlier journey evidence
- `ui_flow_error` is limited to the affected journey/shard
- evidence JSON and Markdown are valid even after partial failure

### CP2 - Provider Runtime Diagnostics

**Deliver**

Add diagnostics around the existing governed `/api/execute` path and live spec
capture so timeout/fallback outcomes can be separated into:

- provider timeout
- execute route timeout
- provider disabled or missing key
- settings hydration mismatch
- receipt missing after accepted output
- browser context closed
- clipboard/download blocked

**Acceptance**

- no raw key values are logged
- diagnostics include provider, model, key alias presence, route type, template
  id, elapsed time, HTTP status where available, receipt presence, and outcome
  code
- `mock_fallback_no_receipt` cannot be mistaken for accepted governance proof

### CP3 - Bounded Runtime Hardening

**Deliver**

Apply the smallest runtime fix justified by CP2. Candidate fixes include:

- increasing live-result wait budget where provider latency exceeds W131 timing
- one bounded retry for transient provider timeout when safe and auditable
- preventing fallback rendering from masquerading as a governed receipt
- waiting for hydrated provider settings before live submission
- surfacing provider-disabled/missing-key as a classified non-counted outcome

**Acceptance**

- fix is scoped to the current governed execution path
- no provider parity or provider-quality claim is introduced
- unit or route-level coverage is added only where the fix changes code behavior

### CP4 - Alibaba Isolated Stability Run

**Deliver**

Run the isolated-session live spec on Alibaba `qwen-turbo` with all three
noncoder flags enabled:

- `NEXT_PUBLIC_CVF_INTENT_FIRST_FRONT_DOOR=true`
- `NEXT_PUBLIC_CVF_NONCODER_CLARIFICATION_LOOP=true`
- `NEXT_PUBLIC_CVF_NONCODER_ITERATION_MEMORY=true`

Publish:

- `docs/reviews/CVF_W132_RUNTIME_STABILITY_ALIBABA_EVIDENCE_2026-04-30.md`
- `docs/reviews/CVF_W132_RUNTIME_STABILITY_ALIBABA_EVIDENCE_2026-04-30.json`

**Acceptance**

- at least 12 attempted browser UI journeys
- at least 8 accepted-with-receipt journeys, or a classified blocker
- timeout + provider_error + mock_fallback rate below 25%, or a classified
  blocker
- zero cascade failures from a single browser context collapse

### CP5 - DeepSeek Confirmatory Run

**Deliver**

Run the same isolated-session shape on DeepSeek `deepseek-chat`.

Publish:

- `docs/reviews/CVF_W132_RUNTIME_STABILITY_DEEPSEEK_EVIDENCE_2026-04-30.md`
- `docs/reviews/CVF_W132_RUNTIME_STABILITY_DEEPSEEK_EVIDENCE_2026-04-30.json`

**Acceptance**

- at least 6 attempted browser UI journeys
- at least 3 accepted-with-receipt journeys, or a classified blocker
- no provider parity claim
- DeepSeek evidence uses the same taxonomy as Alibaba

### CP6 - Continuation Decision

**Deliver**

Publish:

- `docs/reviews/CVF_W132_CONTINUATION_DECISION_2026-04-30.md`

Decision rules:

- if timeout/fallback remains above 25%, next tranche is deeper provider/runtime
  remediation
- if browser context cascade failures persist, next tranche is Playwright/session
  infrastructure hardening
- if provider path stabilizes but route misses persist, next tranche is routing
  quality
- if provider path stabilizes and all six lanes become measurable, next tranche
  may return to claim hardening or release-readiness documentation

**Acceptance**

- W133, if chosen, is data-backed
- no capability expansion is chosen while provider/runtime instability remains
  unresolved

### CP7 - Release Gate And Closure Sync

**Deliver**

Run:

```bash
python scripts/run_cvf_release_gate_bundle.py --json
```

Also run targeted checks relevant to any changed web files.

**Acceptance**

- release gate passes with live governance E2E
- no raw key values appear in logs or committed artifacts
- `AGENTS.md` and `AGENT_HANDOFF.md` may reflect W132 authorization, but must
  not mark W132 closed until evidence exists
- W132 roadmap status changes to closed only after CP4-CP7 evidence exists

---

## 4. Exit Criteria

W132 can close only when:

- fresh GC-018 exists
- stability contract exists
- browser-session isolation prevents W131-style cascade loss
- Alibaba and DeepSeek evidence packets exist or are explicitly blocked with
  classified reason
- provider/runtime failures are diagnostically separated
- continuation decision is published from data
- mandatory live release gate passes

---

## 5. Execution Locks

1. Do not add new user-facing capability.
2. Do not expand routing corpus.
3. Do not count mock fallback as governance proof.
4. Do not count API-only calls as UI proof.
5. Do not print raw provider keys.
6. Do not claim provider parity.
7. Do not close W132 from unit tests alone.
8. Keep W132 claims narrower than the measured evidence.
