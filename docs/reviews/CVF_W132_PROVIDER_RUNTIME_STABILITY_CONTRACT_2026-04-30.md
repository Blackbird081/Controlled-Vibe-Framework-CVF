<!-- Memory class: SUMMARY_RECORD -->

# CVF W132-T1 Provider Runtime Stability Contract

> Date: 2026-04-30
> Tranche: W132-T1 - Provider/Runtime Stability And Browser Session Hardening
> GC-018: `docs/baselines/CVF_GC018_W132_T1_PROVIDER_RUNTIME_STABILITY_AND_BROWSER_SESSION_HARDENING_AUTHORIZATION_2026-04-30.md`
> Status: LOCKED - governs W132 implementation and closure

---

## 1. Bounded Claim Target

After W132, CVF may claim only one of these outcomes:

1. The existing noncoder path has been stabilized enough to rerun W131-style
   journeys with isolated browser sessions and materially lower timeout/fallback
   rates.
2. Or, CVF has classified the runtime/provider failure mode precisely enough to
   choose the next tranche without overstating live readiness.

W132 does not create a broader product capability claim by itself.

---

## 2. Baseline From W131

| Finding | Baseline |
|---|---|
| Alibaba accepted journeys | 1/6 real journeys before browser collapse |
| DeepSeek accepted journeys | 1/6 confirmatory journeys |
| api_timeout + mock_fallback rate | 66% on both providers |
| Browser session issue | Alibaba 24-journey matrix collapsed after journey 6 |
| Successful form type | `documentation` only |

W132 must improve this or explain why it cannot be improved without a deeper
runtime change.

---

## 3. Counted Evidence Rules

Counted:

- browser-driven UI journeys
- real provider execution through `/api/execute`
- `ResultViewer` with `governanceEvidenceReceipt`
- evidence rows persisted even when later journeys fail

Not counted:

- mock mode
- mock fallback without receipt
- API-only calls
- screenshots or static UI structure checks
- browser failures that never reach user-visible result state

---

## 4. Diagnostic Requirements

Each attempted journey must capture:

- provider name and model
- key alias presence, not key value
- selected provider settings after hydration
- route type and template id
- submit timestamp and elapsed time
- HTTP status where available
- receipt present or absent
- outcome code and diagnostic subcode
- whether evidence and pack export events fired

No raw prompt output is required beyond truncated prompt labels already used by
W131 evidence packets.

---

## 5. Stability Targets

| Metric | Target |
|---|---:|
| Browser-context cascade failures | 0 |
| Evidence packet write after each journey | 100% |
| Alibaba accepted-with-receipt rate | >= 67% across >= 12 attempts |
| Alibaba timeout/fallback/provider-error rate | < 25% |
| DeepSeek accepted-with-receipt count | >= 3 across >= 6 attempts |
| Release gate | PASS 7/7 with live governance E2E |

Failure to meet these targets is acceptable only if the evidence packet
classifies the blocker and the continuation decision is explicit.

---

## 6. Non-Goals

- No new end-user feature
- No new feature flag unless required only for diagnostics and defaulted off
- No trusted-form corpus expansion
- No provider parity claim
- No server telemetry productization
- No UI redesign
- No public launch claim

---

## 7. Closure Conditions

W132 can close only when:

- GC-018 and this contract exist
- the live spec cannot lose all evidence after a late browser/session failure
- provider/runtime diagnostics distinguish timeout, missing receipt, fallback,
  disabled provider, missing key, and browser-context failures
- Alibaba and DeepSeek isolated-session runs have evidence packets
- the continuation decision is published from data
- `python scripts/run_cvf_release_gate_bundle.py --json` passes
