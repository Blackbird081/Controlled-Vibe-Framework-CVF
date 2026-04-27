# CVF W128 Rollout Decision Contract

> Date: 2026-04-27
> Status: LOCKED
> Wave: W128-T1
> Implements: CP0 of W128 roadmap
> Readout model: src/lib/noncoder-rollout-readout.ts

---

## Purpose

Lock the threshold bands and bounded operator actions that the W128 readout
model uses to turn W127 metrics into product decisions. Any threshold change
requires a new contract entry before code changes (same pattern as W127 metric
contract).

---

## Noncoder Lanes

| Lane ID | Lane Name | Primary Metric | Flag |
|---|---|---|---|
| `entry_routing` | Entry Routing | `weak_fallback_rate` + `time_to_first_value` | `NEXT_PUBLIC_CVF_INTENT_FIRST_FRONT_DOOR` |
| `clarification_recovery` | Clarification Recovery | `route_recovery_rate` | `NEXT_PUBLIC_CVF_NONCODER_CLARIFICATION_LOOP` |
| `trusted_form` | Trusted Form Routing | `weak_fallback_rate` (shared signal) | `NEXT_PUBLIC_CVF_INTENT_FIRST_FRONT_DOOR` |
| `followup_continuity` | Follow-up Continuity | `followup_continuation_rate` | `NEXT_PUBLIC_CVF_NONCODER_ITERATION_MEMORY` |
| `evidence_export` | Evidence Export | `evidence_export_rate` | always active |
| `deliverable_pack` | Deliverable Pack Export | `deliverable_pack_export_rate` | always active |

---

## Threshold Bands

### Entry Routing — `weak_fallback_rate`

| Band | Range | Operator Action |
|---|---|---|
| healthy | ≤ 15% | Consider widening intent-first rollout |
| watch | 15–30% | Review routing corpus for gaps |
| act-now | > 30% | Expand patterns or improve front-door copy |
| no_data | null | Enable intent-first and collect 1–2 weeks of traffic |

### Entry Routing — `time_to_first_value` (secondary, worst-of combined)

| Band | Range | Operator Action |
|---|---|---|
| healthy | ≤ 3 min | No action |
| watch | 3–5 min | Investigate template selection friction |
| act-now | > 5 min | Reduce onboarding friction; check template complexity |
| no_data | null | Collect execution events |

### Clarification Recovery — `route_recovery_rate`

| Band | Range | Operator Action |
|---|---|---|
| healthy | ≥ 50% | Loop is working; no action |
| watch | 30–50% | Review clarification question quality and option coverage |
| act-now | < 30% | Rewrite questions or expand option sets |
| no_data | null | No weak-confidence routes recorded (may be healthy routing volume) |

### Trusted Form Routing — `weak_fallback_rate` (shared)

The trusted-form lane shares the weak-fallback signal with entry routing.
Its status reflects whether the combined wizard + form corpus is absorbing
weak routes. A decreasing fallback rate over successive readouts confirms
form routing is expanding coverage.

### Follow-up Continuity — `followup_continuation_rate`

| Band | Range | Operator Action |
|---|---|---|
| healthy | ≥ 15% | Continuity is valuable; consider enabling iteration memory broadly |
| watch | 5–15% | Review continuity UX discoverability |
| act-now | < 5% | Improve continue-work CTA or add in-result prompting |
| no_data | null | Insufficient execution events |

### Evidence Export — `evidence_export_rate`

| Band | Range | Operator Action |
|---|---|---|
| healthy | ≥ 15% | Users are capturing governed outputs |
| watch | 5–15% | Improve evidence panel visibility or copy-to-clipboard CTA |
| act-now | < 5% | Add prominent export CTA to result view |
| no_data | null | No accepted executions yet |

### Deliverable Pack Export — `deliverable_pack_export_rate`

| Band | Range | Operator Action |
|---|---|---|
| healthy | ≥ 15% | Users using packs for handoffs |
| watch | 5–15% | Surface pack tab more prominently |
| act-now | < 5% | Improve pack discoverability or add in-result prompt |
| no_data | null | No accepted executions yet |

---

## Status Vocabulary

| Status | Meaning |
|---|---|
| `healthy` | Metric within acceptable bounds; no action required |
| `watch` | Metric approaching threshold; monitor and plan response |
| `action_required` | Metric outside acceptable bounds; bounded action recommended |
| `no_data` | Insufficient events to compute metric; treat as informational |

`no_data` is a first-class status, not an error. It is expected at Day-0 and
valid whenever a feature flag is disabled.

---

## Flag-Awareness Rules

1. Do not recommend "expand clarification" if `NEXT_PUBLIC_CVF_NONCODER_CLARIFICATION_LOOP` is off.
2. Do not judge pack/evidence adoption as low when the relevant surface is
   unreachable due to upstream routing issues.
3. Do not judge trusted-form coverage when `NEXT_PUBLIC_CVF_INTENT_FIRST_FRONT_DOOR` is off.
4. Do not judge follow-up continuity when `NEXT_PUBLIC_CVF_NONCODER_ITERATION_MEMORY` is off.

All recommendations must account for the active flag posture, not idealized state.

---

## Recommendation Priority Order

When multiple lanes require action, priority is:

1. `action_required` lanes (highest — fix before expanding)
2. `watch` lanes (monitor and plan)
3. `no_data` lanes (collect data before judging)
4. `healthy` lanes (no action — omit from recommendation list)

Within the same status tier, priority follows lane order above
(entry routing → clarification → trusted form → continuity → evidence → pack).
