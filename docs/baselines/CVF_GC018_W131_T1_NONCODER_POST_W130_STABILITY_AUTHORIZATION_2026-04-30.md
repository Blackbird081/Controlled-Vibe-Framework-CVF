<!-- Memory class: SUMMARY_RECORD -->

# CVF GC-018 — W131-T1 Authorization

> Type: TRANCHE AUTHORIZATION
> Tranche: W131-T1 — Noncoder Post-W130 Real-Traffic Stability And Claim Hardening
> Date: 2026-04-30
> Predecessor closure: W130-T1 CLOSED DELIVERED 2026-04-28
> Operator: CVF core team

---

## 1. Authorization Decision

**AUTHORIZED.** W131-T1 may begin immediately.

Operator has confirmed existing Alibaba and DeepSeek API keys remain authorized for
W131 validation. No new keys are required.

---

## 2. Predecessor State

| Wave | Delivery |
|---|---|
| W122 | Intent-first front door + routing facade |
| W123 | Iteration memory + follow-up continuity |
| W124 | Clarification loop + safe routing recovery |
| W125 | Deliverable packs + handoff productization |
| W126 | Trusted form-template routing (8-form subset) |
| W127 | Adoption metrics (6 metrics, 4 analytics events) |
| W128 | Rollout readout + 6-lane optimization dashboard |
| W129 | Controlled rollout A→B→C; all 3 flags enabled; routing/recovery/continuity lanes healthy |
| W130 | Evidence + pack export activation; 1 successful governed journey; both export lanes exit no_data |

Post-W130 lane state (from W130 evidence packet `docs/reviews/CVF_W130_EVIDENCE_PACK_EXPORT_EVIDENCE_2026-04-28.md`):

| Lane | Status | Note |
|---|---|---|
| entry_routing | healthy | W130 journey log: 3 attempts, 1 accepted |
| clarification_recovery | no_data | not exercised in W130 spec |
| trusted_form | no_data | routing measured but not isolated in W130 |
| followup_continuity | no_data | not exercised in W130 spec |
| evidence_export | healthy | 1 event — thin but non-zero |
| deliverable_pack | healthy | 1 event — thin but non-zero |

Known weaknesses from W130:
- Only 1 successful governed journey in the evidence packet
- 2 journeys classified `mock_fallback_no_receipt` (not counted)
- clarification_recovery, trusted_form, followup_continuity lanes have no post-W130 data
- analytics remain browser-local with no durable exported packet
- `api_timeout` / `mock_fallback_no_receipt` categories not formally classified
- `AGENT_HANDOFF.md` top-level state line drifted (still references W114–W128)

---

## 3. Proposed Tranche

**W131-T1 — Noncoder Post-W130 Real-Traffic Stability And Claim Hardening**

Roadmap: `docs/roadmaps/CVF_W131_T1_NONCODER_POST_W130_REAL_TRAFFIC_STABILITY_AND_CLAIM_HARDENING_ROADMAP_2026-04-30.md`

This is a **stability and claim-hardening** tranche only. No new end-user features.

Deliverables:
- CP0: GC-018 authorization + claim contract (this file + claim contract)
- CP1: Repair `AGENT_HANDOFF.md` top-level state line drift
- CP2: `w131-post-w130-stability.live.spec.ts` — full failure taxonomy, multi-journey matrix
- CP3: Alibaba primary stability run (≥18 attempted, ≥12 accepted journeys)
- CP4: DeepSeek confirmatory run (≥6 attempted, ≥3 accepted journeys)
- CP5: Post-W130 evidence packet (MD + JSON)
- CP6: Continuation decision doc
- CP7: Release gate pass + closure sync

---

## 4. Provider Key Policy

Authorized key environment variables (no raw values may be printed or committed):
- Alibaba / DashScope-compatible: `DASHSCOPE_API_KEY`, `ALIBABA_API_KEY`, `CVF_ALIBABA_API_KEY`, `CVF_BENCHMARK_ALIBABA_KEY`
- DeepSeek: `DEEPSEEK_API_KEY`

Primary proof lane: Alibaba `qwen-turbo`
Confirmatory lane: DeepSeek `deepseek-chat`

No provider parity claim is authorized.

---

## 5. Counted vs Non-Counted Evidence

**Counted (governs lane health and stability claims):**
- Browser-driven UI journeys reaching ResultViewer with `governanceEvidenceReceipt` present
- Outcome: `accepted_with_exports` or `accepted_missing_receipt` (receipt documented)

**Not counted (retained for transparency only):**
- API-only calls not driven through browser UI
- `mock_fallback_no_receipt` journeys
- `api_timeout` journeys
- `ui_flow_error` journeys
- Any journey that does not reach ResultViewer

---

## 6. Failure Taxonomy (locked for W131)

| Code | Meaning |
|---|---|
| `accepted_with_exports` | Journey accepted; evidence copy + pack download both fired |
| `accepted_missing_receipt` | Journey accepted; ResultViewer rendered; no governance receipt |
| `accepted_export_failed` | Journey accepted; receipt present; export button click failed |
| `route_miss` | Intent typed; no strong-confidence route produced |
| `clarification_not_recovered` | Clarification prompt shown; user could not proceed |
| `api_timeout` | No ResultViewer within 90s of form submission |
| `provider_error` | API returned non-200 on governed execute path |
| `mock_fallback_no_receipt` | ResultViewer appeared without governance receipt |
| `ui_flow_error` | Browser error, navigation failure, or test infrastructure failure |

---

## 7. Minimum Journey Volume

| Metric | Target |
|---|---|
| Alibaba attempted UI journeys | ≥ 18 |
| Alibaba successful governed accepted | ≥ 12 |
| Each W126 trusted form covered | ≥ 1 attempt per form type |
| Clarification recovery journeys | ≥ 5 weak-input attempts |
| Follow-up submissions | ≥ 3 |
| Evidence exports | ≥ 5 |
| Deliverable pack exports | ≥ 5 |
| DeepSeek attempted UI journeys | ≥ 6 |
| DeepSeek successful governed accepted | ≥ 3 |

---

## 8. Lane-Readout Thresholds (from W128)

All six lanes must be reported post-W131. Any lane that is `watch` or `action_required`
must be explained in the continuation decision (CP6).

| Lane | Healthy threshold |
|---|---|
| entry_routing | weak_fallback_rate ≤ 10% |
| clarification_recovery | clarification_recovery_rate ≥ 70% |
| trusted_form | weak_fallback_rate ≤ 15% |
| followup_continuity | followup_rate ≥ 40% |
| evidence_export | export_rate ≥ 60% |
| deliverable_pack | export_rate ≥ 60% |

---

## 9. Continuation Decision Rules

If `api_timeout` + `provider_error` > 25% on Alibaba → next tranche: provider/runtime stability
If `route_miss` or `weak_fallback_rate` = watch/action_required → next tranche: routing quality
If `clarification_recovery` = watch/action_required → next tranche: clarification question quality
If `followup_continuity` = watch/action_required → next tranche: follow-up UX quality
If `evidence_export` or `deliverable_pack` regresses to no_data/action_required → next tranche: export UX stabilization
If all 6 lanes healthy + failure rate acceptable → next tranche may be public claim hardening or release-readiness docs

---

## 10. GC-018 Depth Audit

| Dimension | Score (0–2) | Rationale |
|---|---|---|
| Risk reduction | 2 | W130 has only 1 counted journey; stability readout with ≥12 accepted journeys substantially reduces claim risk |
| Decision value | 2 | The continuation direction (provider hardening vs routing quality vs UX) depends entirely on this readout |
| Machine enforceability | 2 | All 6 lanes are machine-computed from typed analytics events; failure taxonomy is codified in spec |
| Operational efficiency | 2 | No new architecture or features — only evidence gathering and documentation |
| Portfolio priority | 2 | Required before any next capability wave can be authorized responsibly |

**Total: 10/10 — AUTHORIZED**

---

## 11. Execution Locks

1. Do not add new product features — W131 is stability + claim hardening only.
2. Do not count API-only calls as UI journey volume.
3. Do not count mock fallback as governance proof.
4. Do not print raw Alibaba or DeepSeek key values.
5. Do not claim provider parity.
6. Do not expand trusted-form routing corpus — only measure gaps.
7. Do not close W131 from unit tests alone.
8. Keep claims narrower than evidence.
9. `AGENT_HANDOFF.md` and `AGENTS.md` are updated only after W131 closure is real.
