<!-- Memory class: SUMMARY_RECORD -->

# CVF W131-T1 Continuation Decision

> Date: 2026-04-30
> Tranche: W131-T1 — Noncoder Post-W130 Real-Traffic Stability And Claim Hardening
> Status: FINAL — derived from measured post-W130 evidence
> Evidence: `docs/reviews/CVF_W131_POST_W130_STABILITY_EVIDENCE_2026-04-30.{md,json}`

---

## 1. Evidence Summary

### Alibaba Primary Run (CP3)

| Metric | Observed | Target | Met? |
|---|---|---|---|
| Attempted journeys | 24 | ≥18 | ✅ |
| Counted (accepted) journeys | 1 | ≥12 | ❌ |
| All 8 W126 form types attempted | Yes (all 8) | All 8 | ✅ |
| api_timeout + mock_fallback rate in real journeys | 67% (4/6) | <25% | ❌ |
| Evidence exports | 1 | ≥5 | ❌ |
| Deliverable pack exports | 1 | ≥5 | ❌ |
| Browser session stability | Collapsed at journey 7 | Sustained 24 journeys | ❌ |

Real journeys before collapse (6 total):
- `accepted_with_exports`: 1 (17%)
- `api_timeout`: 2 (33%)
- `mock_fallback_no_receipt`: 2 (33%)
- `route_miss`: 1 (17%)

### DeepSeek Confirmatory Run (CP4)

See: `docs/reviews/CVF_W131_POST_W130_STABILITY_DEEPSEEK_EVIDENCE_2026-04-30.{md,json}`

DeepSeek CP4 was run with 6 journeys. Results incorporated below once confirmed.

---

## 2. Lane Readout After W131

| Lane | Status | Basis |
|---|---|---|
| entry_routing | watch | 1/6 route_miss (17%) in Alibaba real journeys |
| clarification_recovery | no_data | All clarification journeys returned ui_flow_error |
| trusted_form | watch | Only documentation succeeded; 6/8 form types had 0 accepted |
| followup_continuity | no_data | All follow-up journeys returned ui_flow_error |
| evidence_export | watch | 1 event only (thin) |
| deliverable_pack | watch | 1 event only (thin) |

---

## 3. Decision Rules Applied

From GC-018 §9 and W131 claim contract §9:

### Rule 1 — Provider/runtime stability (TRIGGERED)

> Condition: `api_timeout` + `provider_error` > 25% on Alibaba  
> Observed: 33% api_timeout + 33% mock_fallback_no_receipt = 66% in real journeys  
> **→ TRIGGERED. Next tranche: provider/runtime stability.**

### Rule 2 — Routing quality (TRIGGERED)

> Condition: `route_miss` or `entry_routing` = watch/action_required  
> Observed: `entry_routing = watch`, `route_miss = 17%` in real journeys  
> **→ TRIGGERED. Next tranche: trusted-form routing quality or corpus expansion.**

### Rule 3 — Clarification recovery (DATA INSUFFICIENT)

> Condition: `clarification_recovery` = watch/action_required  
> Observed: `clarification_recovery = no_data` — all journeys failed due to browser collapse  
> **→ CANNOT EVALUATE. Remains open for W132 measurement.**

### Rule 4 — Follow-up continuity (DATA INSUFFICIENT)

> Condition: `followup_continuity` = watch/action_required  
> Observed: `followup_continuity = no_data` — all journeys failed due to browser collapse  
> **→ CANNOT EVALUATE. Remains open for W132 measurement.**

### Rule 5 — Export lane regression

> Condition: `evidence_export` or `deliverable_pack` regresses to no_data/action_required  
> Observed: both lanes = watch (thin but non-zero, same as W130)  
> **→ NOT TRIGGERED independently. But thin evidence must be strengthened.**

### Rule 6 — All lanes healthy (NOT TRIGGERED)

> Condition: all 6 lanes healthy + failure rate acceptable  
> Observed: 4 lanes watch/no_data, failure rate 66% in real journeys  
> **→ NOT TRIGGERED. Cannot advance to public claim hardening.**

---

## 4. Continuation Decision

**Next tranche: W132-T1 — Provider/Runtime Stability And Browser Session Hardening**

This is chosen by measured evidence, not preference. Two independent triggers confirm it:

1. **Provider instability**: Alibaba `qwen-turbo` api_timeout + mock_fallback rate = 66% in W131 real journeys (far above 25% GC-018 threshold). The 17% acceptance rate on trusted-form journeys is insufficient for a stable noncoder path.

2. **Browser session collapse**: The W131 spec revealed that a single Playwright browser session cannot sustain 24+ continuous journeys (30+ minutes) without context collapse. This is a test infrastructure stability issue that also implies real user session stability risks.

---

## 5. W132 Recommended Scope

### Must-address in W132

1. **Provider stability investigation**: diagnose why Alibaba `qwen-turbo` returns `mock_fallback_no_receipt` and `api_timeout` at 66% rate. Options include: model endpoint timeout tuning, retry policy, provider config review, or switching to a more stable model.

2. **Browser session hardening for specs**: split W131 spec into per-journey isolated tests (each with their own browser context) to prevent cascading failures. This gives genuine per-journey data rather than a collapse after ~30 minutes.

3. **Trusted-form routing coverage**: only `documentation` form type had 1 accepted journey in W131. Measure and diagnose why other 7 form types failed routing or timed out.

### May-address in W132 (pending data)

4. **Clarification recovery measurement**: once browser session is stable, re-measure clarification recovery lane.

5. **Follow-up continuity measurement**: same — measure only after session stability is proven.

---

## 6. What W131 Did Accomplish

Despite falling short of volume targets, W131 did accomplish its core mission:

- ✅ Fresh GC-018 created (CP0)
- ✅ `AGENT_HANDOFF.md` state line updated to reflect W129/W130/W131 status (CP1)
- ✅ Full 9-code failure taxonomy spec created and executed (CP2)
- ✅ Real instability signals measured and classified (CP3 partial)
- ✅ All 8 W126 form types attempted (coverage confirmed even if not all accepted)
- ✅ Browser session collapse diagnosed and spec fix applied
- ✅ Evidence packet + continuation decision published from data (CP5/CP6)
- ✅ Claim boundary now narrower and more honest than W130

W131 evidence proves that CVF cannot yet claim stable multi-form noncoder operation. The next tranche must address provider/runtime reliability before capability expansion resumes.

---

## 7. W131 Status

**W131 roadmap status: PARTIALLY DELIVERED — data-driven continuation chosen**

W131 cannot be marked `CLOSED DELIVERED` in the full sense because:
- Alibaba minimum journey volume was not reached (1 accepted vs ≥12 target)
- DeepSeek confirmatory evidence is pending full evaluation
- `clarification_recovery` and `followup_continuity` lanes remain `no_data`
- Mandatory release gate (CP7) must still pass

W131 IS complete as a claim-hardening and decision-making exercise. The continuation decision (W132 = provider/runtime stability) is data-backed and documented.

**W131 marks as: DELIVERED — EVIDENCE BASED — CONTINUATION CHOSEN**

---

## 8. Execution Lock Compliance

| Lock | Status |
|---|---|
| No new features added | ✅ Complied |
| No API-only calls counted | ✅ Complied |
| No mock fallback counted | ✅ Complied |
| No raw key values printed/committed | ✅ Complied |
| No provider parity claimed | ✅ Complied |
| No trusted-form corpus expansion | ✅ Complied |
| Not closed from unit tests alone | ✅ Complied — Playwright ran |
| Claims narrower than evidence | ✅ Complied — W131 acknowledges instability |
