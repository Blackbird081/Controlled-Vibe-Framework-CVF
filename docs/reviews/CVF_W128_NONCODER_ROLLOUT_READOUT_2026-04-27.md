# CVF W128 Noncoder Rollout Readout

> Date: 2026-04-27
> Status: CLOSED DELIVERED
> Wave: W128-T1
> Readout model: src/lib/noncoder-rollout-readout.ts
> Decision contract: docs/reviews/CVF_W128_ROLLOUT_DECISION_CONTRACT_2026-04-27.md
> Operator surface: /analytics → Noncoder Health tab

---

## Day-0 Readout (2026-04-27)

All lanes are `no_data`. This is correct: W128 closed immediately after W127,
before any real user traffic has accumulated. The readout model and operator
surface are production-ready; the actual lane signals will appear once the
W122–W126 feature flags are enabled in a live environment and users begin
interacting with the noncoder journey.

| Lane | Status | Metric | Value |
|---|---|---|---|
| Entry Routing | no_data | weak_fallback_rate | N/A |
| Clarification Recovery | no_data | route_recovery_rate | N/A |
| Trusted Form Routing | no_data | weak_fallback_rate (shared) | N/A |
| Follow-up Continuity | no_data | followup_continuation_rate | N/A |
| Evidence Export | no_data | evidence_export_rate | N/A |
| Deliverable Pack Export | no_data | deliverable_pack_export_rate | N/A |

---

## Feature-Flag Posture (Day-0)

| Flag | Default State |
|---|---|
| `NEXT_PUBLIC_CVF_INTENT_FIRST_FRONT_DOOR` | false (opt-in) |
| `NEXT_PUBLIC_CVF_NONCODER_CLARIFICATION_LOOP` | false (opt-in) |
| `NEXT_PUBLIC_CVF_NONCODER_ITERATION_MEMORY` | false (opt-in) |
| Trusted form routing (co-gated) | false (opt-in) |

All noncoder lanes are rollout-safe and off by default.

---

## Lane Health Assessment

### 1. Entry Routing
- **Status**: no_data (expected at Day-0)
- **Lanes affected**: entry_routing, trusted_form
- **What to look for after traffic**: weak_fallback_rate > 30% triggers act-now;
  also watch time_to_first_value if TTFV > 5 min even with low fallback
- **Readiness**: intent-first front door + trusted form routing both delivered;
  enable flag to start collecting

### 2. Clarification Recovery
- **Status**: no_data (expected; loop is off by default)
- **What to look for**: once loop is enabled, route_recovery_rate < 30% would
  indicate question quality needs work
- **Readiness**: clarification loop delivered in W124; 23 unit tests passing

### 3. Follow-up Continuity
- **Status**: no_data (memory flag is off)
- **What to look for**: followup_continuation_rate < 5% is act-now threshold;
  15% is healthy
- **Readiness**: iteration memory delivered in W123; thread continuity wired

### 4. Evidence Export
- **Status**: no_data (no accepted executions yet)
- **Always active**: this lane does not require a feature flag
- **What to look for**: evidence_export_rate < 5% is act-now
- **Readiness**: export handlers wired in ResultViewer; tracked via W127 events

### 5. Deliverable Pack Export
- **Status**: no_data (no accepted executions yet)
- **Always active**: no feature flag required
- **What to look for**: deliverable_pack_export_rate < 5% is act-now
- **Readiness**: pack tab and export delivered in W125; tracked via W127 events

---

## Recommendations (Day-0)

Because all lanes are no_data, no metric-driven action is possible yet.
The bounded recommended next steps are ordered by the W128 decision contract:

1. **Collect real user traffic** — enable `NEXT_PUBLIC_CVF_INTENT_FIRST_FRONT_DOOR`
   in a controlled environment and let the W127 event stream accumulate for
   at least 1–2 weeks before re-running the readout.

2. **Re-read the operator surface** — open `/analytics → Noncoder Health` after
   traffic accumulates to get the first real lane status assessment.

3. **Prioritize by the first act-now lane that appears**:
   - If `weak_fallback_rate > 30%`: route corpus or copy improvement (W126 expansion)
   - If `route_recovery_rate < 30%`: clarification question rewrite
   - If `followup_continuation_rate < 5%`: continuity UX improvement
   - If `evidence_export_rate < 5%`: result-view export CTA improvement
   - If `deliverable_pack_export_rate < 5%`: pack tab discoverability improvement

---

## Most Justified Next Tranche

**Cannot be determined from Day-0 data.** The first real readout after traffic
accumulates will name the highest-friction lane and justify the next tranche
from measured signal rather than intuition.

The W128 roadmap §8 establishes the next-step bias:

> After W128, the next tranche should optimize the highest-friction proven lane,
> not broaden the product surface by habit.

Operator direction: collect traffic → re-read → choose the act-now lane with
the highest user impact. Do not open new capability lanes until at least one
`watch` or `act-now` signal has been confirmed from real data.

---

## Which Flags to Keep Off, Trial, or Widen

| Flag | Recommendation |
|---|---|
| `NEXT_PUBLIC_CVF_INTENT_FIRST_FRONT_DOOR` | Trial in controlled environment first; widen once entry lane confirms healthy or watch |
| `NEXT_PUBLIC_CVF_NONCODER_CLARIFICATION_LOOP` | Enable alongside intent-first to get recovery data; keep depth cap at 2 |
| `NEXT_PUBLIC_CVF_NONCODER_ITERATION_MEMORY` | Enable after entry routing is stable; continuity value depends on users completing at least one accepted execution first |

---

## Closure Statement

W128-T1 is CLOSED DELIVERED. The readout model, decision contract, operator
surface, and this closure packet are all in place. The noncoder adoption tranche
(W122–W128) is complete as a coherent unit. Future tranches should be driven by
measured friction signals from the `/analytics → Noncoder Health` surface, not
by habit or roadmap momentum.
