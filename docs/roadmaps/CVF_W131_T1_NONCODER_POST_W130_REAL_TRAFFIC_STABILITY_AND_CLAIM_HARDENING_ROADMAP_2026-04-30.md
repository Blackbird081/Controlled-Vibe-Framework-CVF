<!-- Memory class: SUMMARY_RECORD -->

# CVF W131-T1 Noncoder Post-W130 Real-Traffic Stability And Claim Hardening Roadmap

> Date: 2026-04-30
> Status: DELIVERED — EVIDENCE BASED — CONTINUATION CHOSEN (2026-04-30)
> Scope class: NONCODER STABILITY / LIVE TRAFFIC READOUT / CLAIM HARDENING
> Predecessor: W130-T1 CLOSED DELIVERED 2026-04-28
> Authorization: requires fresh GC-018 before implementation closure
> Wave ID: W131

---

## 0. Why This Is Next

W130 successfully moved both post-execution export lanes out of `no_data`:

- `evidence_exported=1`
- `deliverable_pack_exported=1`
- `evidence_export=healthy`
- `deliverable_pack=healthy`

But the W130 evidence packet is intentionally narrow:

- only 1 governed UI journey successfully fired both export events
- 2 journeys were retained as `mock_fallback_no_receipt` and were not counted
- W129 Stage C also recorded provider/runtime instability through `api_timeout`
- all W127/W128 metrics remain browser-local
- trusted-form routing remains a bounded 8-form subset, not the full template corpus
- `AGENT_HANDOFF.md` has a stale top-level state line even though later W130 entries are correct

The correct next move is therefore not to add another user-facing feature. W131
should harden the measured claim:

> CVF can run the full post-W130 noncoder path repeatedly through live provider
> calls, classify provider/runtime failures honestly, confirm lane health from
> browser-local analytics, and publish the next continuation decision from data.

---

## 1. Product Claim Target

W131 should make this bounded claim true:

> After W130, CVF can operate the full noncoder journey across routing,
> clarification, trusted forms, follow-up, evidence export, and deliverable pack
> export under controlled live traffic, with failures classified and claims
> limited to the evidence actually observed.

This is bounded to:

- Web noncoder journey only
- browser-driven UI journeys only
- browser-local analytics plus exported evidence packets
- Alibaba primary live lane and DeepSeek confirmatory live lane
- claim hardening and continuation choice, not automatic rollout

This wave does **not** claim:

- statistically significant public adoption
- server-side telemetry or organization analytics
- full provider parity
- full template-corpus routing coverage
- full CVF runtime inheritance for Web
- uniform stability for every prompt or every provider

---

## 2. Provider And Key Policy

The operator has confirmed that existing Alibaba and DeepSeek API keys remain
authorized for W131 validation.

Accepted live-key environment variables:

- Alibaba / DashScope-compatible:
  - `DASHSCOPE_API_KEY`
  - `ALIBABA_API_KEY`
  - `CVF_ALIBABA_API_KEY`
  - `CVF_BENCHMARK_ALIBABA_KEY`
- DeepSeek:
  - `DEEPSEEK_API_KEY`

Rules:

- never print, commit, echo, or write raw key values
- report only provider lane, model, key presence, and alias used
- Alibaba `qwen-turbo` is the primary proof lane
- DeepSeek `deepseek-chat` is a confirmatory lane only
- do not claim latency, cost, quality, or parity equivalence between providers

---

## 3. Current Weaknesses To Fix

### W1 - Thin W130 export proof

W130 proves both export lanes can exit `no_data`, but only with one successful
governed journey. W131 must raise the evidence volume and include multiple
accepted executions that copy evidence and download packs.

### W2 - Provider/runtime instability is visible but not classified

W129 recorded `api_timeout`; W130 recorded `mock_fallback_no_receipt`. W131 must
separate accepted governed executions from timeout, mock fallback, missing
receipt, and UI flow failures.

### W3 - Browser-local metrics are useful but not durable enough for review

W131 should continue using W127/W128 browser-local analytics, but must export a
JSON and Markdown evidence packet so the readout can be reviewed without
requiring the original browser profile.

### W4 - Trusted-form routing is bounded and needs gap measurement

W126 intentionally covers only the trusted 8-form subset:

- `email_template`
- `documentation`
- `competitor_review`
- `risk_assessment`
- `user_persona`
- `feature_prioritization`
- `pricing_strategy`
- `strategy_analysis`

W131 should test this subset across live UI journeys and record any routing
misses. It should not expand the corpus in the same wave.

### W5 - Canonical handoff header drift

`AGENT_HANDOFF.md` includes correct W129/W130 entries later in the file, but the
top-level state line still reads as if W114-W128 is the latest coherent unit.
W131 should fix this documentation drift before closure.

---

## 4. Non-Goals

- No new end-user feature
- No new feature flags
- No trusted-form corpus expansion
- No server telemetry backend
- No governance execution path rewrite
- No provider selection UX rewrite
- No public adoption or business KPI claim
- No mock evidence counted toward governance or stability claims

---

## 5. Checkpoints

### CP0 - W131 Authorization And Claim Contract

**Deliver**

Create a fresh GC-018 authorization record for W131 and a short claim contract:

- `docs/baselines/CVF_GC018_W131_T1_NONCODER_POST_W130_STABILITY_AUTHORIZATION_2026-04-30.md`
- `docs/reviews/CVF_W131_POST_W130_STABILITY_CLAIM_CONTRACT_2026-04-30.md`

The contract must lock:

1. live provider lanes
2. counted vs non-counted evidence
3. minimum journey volume
4. failure taxonomy
5. lane-readout thresholds
6. continuation decision rules

**Acceptance**

- GC-018 explicitly authorizes Alibaba and DeepSeek live-key use without printing keys
- W131 remains stability/readout scoped, not feature expansion
- mock fallback is explicitly non-counted for governance and lane-health proof

### CP1 - Canonical Handoff Drift Repair

**Deliver**

Update the top-level `AGENT_HANDOFF.md` state line so it reflects:

- W129 rollout complete
- W130 closed delivered
- no active implementation tranche pre-authorized
- W131 requires fresh GC-018 and measured post-W130 evidence

Do not rewrite unrelated historical sections.

**Acceptance**

- the first screen of `AGENT_HANDOFF.md` no longer suggests W128 is the latest
  noncoder boundary
- later W129/W130 detailed entries remain intact

### CP2 - Live Journey Matrix And Failure Taxonomy

**Deliver**

Implement or update a W131 live Playwright spec:

- `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/tests/e2e/w131-post-w130-stability.live.spec.ts`

The spec should drive browser UI journeys only:

1. open `/home`
2. use `IntentEntry`
3. route to the trusted form or clarification recovery path
4. submit through the UI
5. wait for governed execution result
6. copy evidence receipt
7. download deliverable pack
8. submit follow-up when the journey is accepted and suitable
9. read analytics from browser-local storage
10. write evidence JSON/Markdown packets

Failure taxonomy must include:

- `accepted_with_exports`
- `accepted_missing_receipt`
- `accepted_export_failed`
- `route_miss`
- `clarification_not_recovered`
- `api_timeout`
- `provider_error`
- `mock_fallback_no_receipt`
- `ui_flow_error`

**Acceptance**

- no API-only request is counted as a UI journey
- mock fallback is recorded but excluded from live governance success counts
- every attempted journey has a classified outcome

### CP3 - Alibaba Primary Stability Run

**Deliver**

Run the W131 spec on Alibaba `qwen-turbo` with all three noncoder flags enabled:

- `NEXT_PUBLIC_CVF_INTENT_FIRST_FRONT_DOOR=true`
- `NEXT_PUBLIC_CVF_NONCODER_CLARIFICATION_LOOP=true`
- `NEXT_PUBLIC_CVF_NONCODER_ITERATION_MEMORY=true`

Minimum target:

- attempted UI journeys: at least 18
- successful governed accepted journeys: at least 12
- each W126 trusted form subset entry: at least 1 attempted journey
- clarification recovery journeys: at least 5 weak-input attempts
- follow-up submissions: at least 3
- evidence exports: at least 5
- deliverable pack exports: at least 5

**Acceptance**

- Alibaba evidence packet records all attempts and outcomes
- `computeLaneReadout` is run on the captured analytics stream
- all six W128 lanes are either `healthy` or explicitly explained if `watch`,
  `action_required`, or `no_data`

### CP4 - DeepSeek Confirmatory Run

**Deliver**

Run a smaller confirmatory W131 spec pass on DeepSeek `deepseek-chat`.

Minimum target:

- attempted UI journeys: at least 6
- successful governed accepted journeys: at least 3
- evidence exports: at least 2
- deliverable pack exports: at least 2

**Acceptance**

- DeepSeek confirms the path can operate outside Alibaba
- no provider parity claim is made
- timeouts or slower runs are classified separately from CVF governance failures

### CP5 - Post-W130 Evidence Packet And Readout

**Deliver**

Publish:

- `docs/reviews/CVF_W131_POST_W130_STABILITY_EVIDENCE_2026-04-30.md`
- `docs/reviews/CVF_W131_POST_W130_STABILITY_EVIDENCE_2026-04-30.json`

The packet must include:

1. flag posture
2. provider lane summary
3. journey counts by outcome
4. lane readout for all six W128 lanes
5. trusted-form subset coverage
6. clarification recovery result
7. follow-up continuity result
8. evidence and pack export result
9. timeout/provider-error rate
10. exact claim boundary after W131

**Acceptance**

- packet can be reviewed without reopening the browser profile
- every claim is traceable to counted live UI journeys
- non-counted journeys are retained for transparency

### CP6 - Continuation Decision Lock

**Deliver**

Publish:

- `docs/reviews/CVF_W131_CONTINUATION_DECISION_2026-04-30.md`

Decision rules:

- if `api_timeout` or `provider_error` exceeds 25% on Alibaba, next tranche is
  provider/runtime stability
- if `route_miss` or `weak_fallback_rate` is `watch` or `action_required`, next
  tranche is trusted-form routing quality or corpus expansion
- if `clarification_recovery` is `watch` or `action_required`, next tranche is
  clarification question quality
- if `followup_continuity` is `watch` or `action_required`, next tranche is
  follow-up continuity UX quality
- if `evidence_export` or `deliverable_pack` returns to `no_data` or
  `action_required`, next tranche is export UX stabilization
- if all six lanes are healthy and failure rate is acceptable, next tranche may
  be public claim hardening or release-readiness documentation

**Acceptance**

- W132 is not chosen by preference
- W132, if recommended, is chosen by measured post-W130 evidence

### CP7 - Release Gate And Closure Sync

**Deliver**

Before closing W131, run the mandatory release gate:

```bash
python scripts/run_cvf_release_gate_bundle.py --json
```

Also run targeted web checks from:

```bash
cd EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web

npx vitest run \
  src/lib/noncoder-metrics.test.ts \
  src/lib/noncoder-rollout-readout.test.ts \
  src/components/ResultViewer.test.tsx \
  src/lib/deliverable-pack.test.ts
```

If CP2 adds or changes live specs, run:

```bash
cd EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web

npx playwright test \
  tests/e2e/w131-post-w130-stability.live.spec.ts \
  --reporter=line
```

**Acceptance**

- release gate passes with live governance E2E
- no raw key values appear in logs or committed artifacts
- `AGENT_HANDOFF.md` and `AGENTS.md` are updated only after W131 closure is real
- W131 roadmap status is changed to `CLOSED DELIVERED` only after evidence exists

---

## 6. Exit Criteria

W131 can close only when:

- fresh GC-018 exists
- canonical handoff header drift is repaired
- Alibaba primary run has a classified multi-journey evidence packet
- DeepSeek confirmatory run is completed or explicitly blocked with reason
- all six W128 lanes are re-read from post-W130 analytics
- mock fallback is not counted as live governance proof
- continuation decision is published
- mandatory live release gate passes

---

## 7. Execution Locks For Claude

1. Do not add new product features unless the roadmap is explicitly amended.
2. Do not count API-only calls as UI journey volume.
3. Do not count mock fallback as governance proof.
4. Do not print raw Alibaba or DeepSeek key values.
5. Do not claim provider parity.
6. Do not expand trusted-form routing in W131; only measure gaps.
7. Do not close W131 from unit tests alone.
8. Keep claims narrower than evidence.

---

## 8. Expected Outcome

The preferred W131 outcome is a sober post-W130 stability readout:

- if the system is stable, CVF earns a stronger public/readiness claim
- if instability appears, the next tranche becomes provider/runtime hardening
- if routing gaps appear, the next tranche becomes trusted-form quality work
- if user-exit lanes regress, the next tranche becomes export/follow-up UX work

Either outcome is acceptable. The only unacceptable outcome is opening another
capability wave without measured post-W130 evidence.
