<!-- Memory class: SUMMARY_RECORD -->

# CVF W131-T1 Post-W130 Stability Claim Contract

> Date: 2026-04-30
> Tranche: W131-T1 — Noncoder Post-W130 Real-Traffic Stability And Claim Hardening
> GC-018: `docs/baselines/CVF_GC018_W131_T1_NONCODER_POST_W130_STABILITY_AUTHORIZATION_2026-04-30.md`
> Status: LOCKED — governs W131 evidence and closure

---

## 1. Bounded Claim Target

After W131, CVF may claim:

> CVF can operate the full noncoder journey across routing, clarification, trusted
> forms, follow-up, evidence export, and deliverable pack export under controlled
> live traffic, with failures classified and claims limited to the evidence
> actually observed.

This claim is bounded to:

- Web noncoder journey only
- Browser-driven UI journeys only (not API-only calls)
- Browser-local analytics plus exported evidence packets
- Alibaba `qwen-turbo` as primary live lane
- DeepSeek `deepseek-chat` as confirmatory lane only
- Claim hardening and continuation choice — not automatic public rollout

---

## 2. What This Claim Does NOT Include

- Statistically significant public adoption figures
- Server-side telemetry or organization-level analytics
- Full provider parity (equal latency, cost, or quality between providers)
- Full template-corpus routing coverage (W126 covers only the 8-form subset)
- Full CVF runtime inheritance for the Web layer
- Uniform stability for every prompt or every provider

---

## 3. Live Provider Lanes

| Provider | Model | Role | Key Variable |
|---|---|---|---|
| Alibaba | qwen-turbo | Primary proof lane | DASHSCOPE_API_KEY / ALIBABA_API_KEY |
| DeepSeek | deepseek-chat | Confirmatory lane | DEEPSEEK_API_KEY |

Raw key values must never be printed, committed, echoed, or written to any file.

---

## 4. Counted Evidence Rules

**Counted toward governance and lane-health proof:**
- Browser-driven UI journeys where ResultViewer renders with `governanceEvidenceReceipt` confirmed
- Outcome codes: `accepted_with_exports`, `accepted_missing_receipt` (with receipt documented)

**Not counted (retained for transparency):**
- API-only calls
- `mock_fallback_no_receipt` journeys
- `api_timeout` journeys
- `provider_error` journeys
- `ui_flow_error` journeys
- Any journey that does not reach ResultViewer

---

## 5. Failure Taxonomy

All journeys must be classified into exactly one outcome code:

| Code | Definition |
|---|---|
| `accepted_with_exports` | ResultViewer rendered with receipt; evidence copy + pack download both fired |
| `accepted_missing_receipt` | ResultViewer rendered; no governance receipt detected |
| `accepted_export_failed` | Receipt present; export button interaction failed |
| `route_miss` | Intent typed; no strong-confidence route matched |
| `clarification_not_recovered` | Clarification shown; journey could not be completed |
| `api_timeout` | No ResultViewer within 90s of form submission |
| `provider_error` | Governed execute API returned non-200 |
| `mock_fallback_no_receipt` | ResultViewer appeared without governance receipt |
| `ui_flow_error` | Browser error, navigation failure, or test infrastructure issue |

---

## 6. Minimum Journey Volume

| Metric | Minimum | Provider |
|---|---|---|
| Attempted UI journeys | 18 | Alibaba |
| Successful governed accepted | 12 | Alibaba |
| W126 trusted form subset coverage | 1 attempt per form | Alibaba |
| Clarification recovery attempts | 5 | Alibaba |
| Follow-up submissions | 3 | Alibaba |
| Evidence exports | 5 | Alibaba |
| Deliverable pack exports | 5 | Alibaba |
| Attempted UI journeys | 6 | DeepSeek |
| Successful governed accepted | 3 | DeepSeek |
| Evidence exports | 2 | DeepSeek |
| Deliverable pack exports | 2 | DeepSeek |

If minimum volumes cannot be reached in a single spec run, record the actual counts
and classify the gap as a stability finding, not a proof substitution.

---

## 7. W126 Trusted Form Subset (must all be attempted)

1. `email_template`
2. `documentation`
3. `competitor_review`
4. `risk_assessment`
5. `user_persona`
6. `feature_prioritization`
7. `pricing_strategy`
8. `strategy_analysis`

A routing miss for any entry must be recorded as `route_miss` and counted toward
the trusted-form gap measurement.

---

## 8. Lane-Readout Thresholds

All six W128 lanes must be re-read after W131. Any `watch` or `action_required`
lane requires an explanation in the continuation decision doc.

| Lane | Healthy When |
|---|---|
| entry_routing | weak_fallback_rate ≤ 10% |
| clarification_recovery | clarification_recovery_rate ≥ 70% |
| trusted_form | weak_fallback_rate ≤ 15% |
| followup_continuity | followup_rate ≥ 40% |
| evidence_export | export_rate ≥ 60% |
| deliverable_pack | export_rate ≥ 60% |

---

## 9. Continuation Decision Rules

The continuation decision (CP6) must follow this logic:

| Condition | Next Tranche |
|---|---|
| Alibaba api_timeout + provider_error > 25% | Provider/runtime stability |
| route_miss or entry_routing = watch/action_required | Trusted-form routing quality or corpus expansion |
| clarification_recovery = watch/action_required | Clarification question quality |
| followup_continuity = watch/action_required | Follow-up continuity UX |
| evidence_export or deliverable_pack regresses | Export UX stabilization |
| All 6 lanes healthy + failure rate acceptable | Public claim hardening or release-readiness docs |

The next tranche must be chosen from measured evidence, not preference.

---

## 10. Closure Gate

W131 cannot be marked closed until all of the following are true:

- [ ] GC-018 exists with explicit live-key authorization
- [ ] `AGENT_HANDOFF.md` top-level state line reflects W130 closure and W131 status
- [ ] W131 live spec exists with full failure taxonomy
- [ ] Alibaba evidence packet records ≥18 attempted + ≥12 accepted journeys
- [ ] DeepSeek confirmatory evidence exists or is explicitly blocked with reason
- [ ] All six W128 lanes are re-read from post-W130/W131 analytics
- [ ] Mock fallback is not counted as live governance proof
- [ ] Continuation decision is published and data-backed
- [ ] `python scripts/run_cvf_release_gate_bundle.py --json` passes with live governance E2E
- [ ] W131 roadmap status updated to `CLOSED DELIVERED`
