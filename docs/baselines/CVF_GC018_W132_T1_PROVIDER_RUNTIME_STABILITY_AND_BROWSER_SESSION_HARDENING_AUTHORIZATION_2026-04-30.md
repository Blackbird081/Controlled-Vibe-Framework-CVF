<!-- Memory class: SUMMARY_RECORD -->

# CVF GC-018 - W132-T1 Authorization

> Type: TRANCHE AUTHORIZATION
> Tranche: W132-T1 - Provider/Runtime Stability And Browser Session Hardening
> Date: 2026-04-30
> Predecessor closure: W131-T1 DELIVERED - EVIDENCE BASED - CONTINUATION CHOSEN
> Operator: CVF core team

---

## 1. Authorization Decision

**AUTHORIZED.** W132-T1 may begin immediately.

W132 is authorized because W131 measured the same failure distribution on both
Alibaba `qwen-turbo` and DeepSeek `deepseek-chat`: 1 accepted journey out of 6
real journeys, with 2 `api_timeout`, 2 `mock_fallback_no_receipt`, and 1
`route_miss`. Alibaba additionally showed browser-session collapse after the
first 6 real journeys in the 24-journey matrix.

This authorization does not approve new product features. It approves only
runtime reliability, provider diagnostics, Playwright session hardening, and
evidence preservation needed to make the existing noncoder path measurable.

---

## 2. Predecessor Evidence

| Artifact | Role |
|---|---|
| `docs/roadmaps/CVF_W131_T1_NONCODER_POST_W130_REAL_TRAFFIC_STABILITY_AND_CLAIM_HARDENING_ROADMAP_2026-04-30.md` | W131 roadmap and closure status |
| `docs/reviews/CVF_W131_POST_W130_STABILITY_EVIDENCE_2026-04-30.md` | Alibaba primary evidence |
| `docs/reviews/CVF_W131_POST_W130_STABILITY_DEEPSEEK_EVIDENCE_2026-04-30.md` | DeepSeek confirmatory evidence |
| `docs/reviews/CVF_W131_CONTINUATION_DECISION_2026-04-30.md` | Data-backed W132 continuation decision |

W131 measured:

| Metric | Alibaba | DeepSeek |
|---|---:|---:|
| Real journeys before collapse or end | 6 | 6 |
| Accepted with exports | 1 | 1 |
| api_timeout | 2 | 2 |
| mock_fallback_no_receipt | 2 | 2 |
| route_miss | 1 | 1 |
| ui_flow_error | 18 | 0 |

The shared 17% acceptance rate and 66% timeout/mock-fallback rate indicate a
systemic runtime path issue, not a single-provider claim.

---

## 3. Proposed Tranche

**W132-T1 - Provider/Runtime Stability And Browser Session Hardening**

Roadmap: `docs/roadmaps/CVF_W132_T1_PROVIDER_RUNTIME_STABILITY_AND_BROWSER_SESSION_HARDENING_ROADMAP_2026-04-30.md`

Contract: `docs/reviews/CVF_W132_PROVIDER_RUNTIME_STABILITY_CONTRACT_2026-04-30.md`

Deliverables:

| CP | Deliverable |
|---|---|
| CP0 | GC-018 + runtime stability contract |
| CP1 | Browser-session isolation and per-journey evidence persistence plan |
| CP2 | Provider/runtime diagnostic classification for timeout, fallback, and missing receipt |
| CP3 | Bounded timeout/retry/provider-envelope hardening implementation |
| CP4 | Alibaba isolated-session stability run |
| CP5 | DeepSeek isolated-session confirmatory run |
| CP6 | W131 lane rerun and continuation decision |
| CP7 | Mandatory release gate and closure sync |

---

## 4. Provider Key Policy

Authorized key environment variables remain:

- Alibaba / DashScope-compatible: `DASHSCOPE_API_KEY`, `ALIBABA_API_KEY`,
  `CVF_ALIBABA_API_KEY`, `CVF_BENCHMARK_ALIBABA_KEY`
- DeepSeek: `DEEPSEEK_API_KEY`

Rules:

- never print, commit, echo, or write raw key values
- report only provider, model, key presence, and alias name
- Alibaba `qwen-turbo` remains the primary proof lane unless CP2 proves a
  configuration defect or explicitly documents a model swap recommendation
- DeepSeek `deepseek-chat` remains confirmatory
- no provider parity claim is authorized

---

## 5. Counted vs Non-Counted Evidence

**Counted for W132 stability claims:**

- browser-driven UI journeys with an isolated browser context per journey or per
  small shard
- journeys reaching `ResultViewer` with a real `governanceEvidenceReceipt`
- evidence packet rows written during or immediately after each journey
- provider diagnostics that avoid raw request secrets

**Not counted as successful governance proof:**

- mock fallback
- API-only calls
- missing-receipt result views
- timeout-only runs
- browser infrastructure failures

All non-counted outcomes must still be retained in evidence packets.

---

## 6. Failure Taxonomy

W132 inherits the W131 taxonomy and adds diagnostic subcodes.

| Code | Meaning |
|---|---|
| `accepted_with_exports` | ResultViewer rendered with receipt; evidence copy and pack download fired |
| `accepted_missing_receipt` | ResultViewer rendered without receipt |
| `accepted_export_failed` | Receipt present but export interaction failed |
| `route_miss` | Intent did not produce a strong route |
| `clarification_not_recovered` | Clarification did not produce a usable route |
| `api_timeout` | No ResultViewer inside the configured live timeout |
| `provider_error` | Governed execute path returned provider/API error |
| `mock_fallback_no_receipt` | UI rendered fallback output without live receipt |
| `ui_flow_error` | Browser/test infrastructure failure |

Diagnostic subcodes:

- `provider_timeout`
- `execute_route_timeout`
- `missing_provider_key`
- `provider_disabled`
- `receipt_dropped`
- `settings_not_hydrated`
- `browser_context_closed`
- `download_or_clipboard_blocked`

---

## 7. Minimum Stability Targets

| Target | Threshold |
|---|---:|
| Alibaba isolated journeys attempted | >= 12 |
| Alibaba accepted with receipt | >= 8 |
| Alibaba api_timeout + provider_error + mock_fallback rate | < 25% |
| DeepSeek isolated journeys attempted | >= 6 |
| DeepSeek accepted with receipt | >= 3 |
| Browser-context cascade failures | 0 |
| Evidence packet persistence after each attempted journey | 100% |

If provider failure remains above threshold, W132 may still close only as a
diagnostic hardening tranche with an explicit W133 continuation decision.

---

## 8. GC-018 Depth Audit

| Dimension | Score (0-2) | Rationale |
|---|---:|---|
| Risk reduction | 2 | W131 shows the existing path cannot support stable noncoder claims without runtime hardening |
| Decision value | 2 | W132 determines whether the issue is timeout policy, provider config, receipt propagation, browser session design, or routing |
| Machine enforceability | 2 | Targets are measurable through Playwright, exported evidence packets, and release gate output |
| Operational efficiency | 2 | Scope is limited to hardening the existing path and tests before any feature expansion |
| Portfolio priority | 2 | Required before public claim hardening or broader noncoder rollout can resume |

**Total: 10/10 - AUTHORIZED**

---

## 9. Execution Locks

1. Do not add new end-user product features.
2. Do not count mock fallback as governance proof.
3. Do not count API-only calls as UI journey proof.
4. Do not print raw provider key values.
5. Do not claim provider parity.
6. Do not expand the trusted-form corpus in W132.
7. Do not close W132 without isolated-session evidence.
8. Keep claims narrower than observed stability data.
