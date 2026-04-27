# CVF W127 Noncoder Adoption Baseline

> Date: 2026-04-27
> Status: BASELINE ESTABLISHED
> Wave: W127-T1
> Instrumentation: src/lib/noncoder-metrics.ts
> Metric contract: docs/reviews/CVF_W127_NONCODER_METRIC_CONTRACT.md

---

## Purpose

Establish the Day-0 baseline for noncoder adoption metrics immediately after
W122–W126 delivery. This baseline documents what the instrumentation captures
before any user traffic accumulates, and sets the reference point for post-wave
comparisons.

---

## Day-0 State (2026-04-27)

### Infrastructure delivered this session

| Checkpoint | Status |
|---|---|
| W122-T1 Intent-first front door | CLOSED DELIVERED |
| W123-T1 Noncoder iteration memory + follow-up continuity | CLOSED DELIVERED |
| W124-T1 Clarification loop + safe routing recovery | CLOSED DELIVERED |
| W125-T1 Deliverable packs + handoff productization | CLOSED DELIVERED |
| W126-T1 Trusted form-template routing expansion | CLOSED DELIVERED |
| W127-T1 Adoption metrics instrumentation | DELIVERED (this artifact) |

### Metric baseline values (Day-0, no user traffic)

All metrics return N/A on Day-0 because no real user sessions have been recorded
in the production analytics store. This is expected and correct.

| Metric | Day-0 value | Expected direction after adoption |
|---|---|---|
| time_to_first_value | N/A (no data) | Should decrease over waves as UX improves |
| route_recovery_rate | N/A (no data) | Should increase as clarification loop matures |
| weak_fallback_rate | N/A (no data) | Should decrease as routing coverage expands |
| followup_continuation_rate | N/A (no data) | Should increase as continuity surfaces engage users |
| evidence_export_rate | N/A (no data) | Should increase as governance value becomes clear |
| deliverable_pack_export_rate | N/A (no data) | Should increase as pack quality improves |

---

## Instrumentation Events Deployed

Four new events are now wired and collecting:

| Event | Fire location | Wired in |
|---|---|---|
| `intent_routed` | IntentEntry.tsx — strong-confidence route | W127-T1 |
| `followup_started` | ResultViewer.tsx — follow-up submit | W127-T1 |
| `evidence_exported` | ResultViewer.tsx — MD/PDF/DOCX download | W127-T1 |
| `deliverable_pack_exported` | ResultViewer.tsx — pack download | W127-T1 |

Pre-existing events used in metric computation:

| Event | Used for |
|---|---|
| `execution_created` | time_to_first_value denominator, followup_continuation_rate denominator |
| `execution_accepted` | time_to_first_value numerator, evidence/pack export denominators |
| `clarification_weak_confidence_detected` | route_recovery_rate, weak_fallback_rate |
| `clarification_route_recovered` | route_recovery_rate numerator |
| `clarification_browse_fallback` | weak_fallback_rate numerator |

---

## Follow-On Direction

Based on the W122–W126 delivery and the instrumentation now in place, the
recommended sequence for the next tranche is:

1. **Collect 1–2 weeks of real user traffic** with the new instrumentation active.
2. **Re-run `generateMetricReport()`** to get the first real baseline numbers.
3. **Choose next focus** based on which metric shows the highest friction:
   - If `time_to_first_value > 5 min` → investigate onboarding/template selection friction
   - If `weak_fallback_rate > 30%` → expand routing corpus or improve clarification questions
   - If `followup_continuation_rate < 10%` → improve history/continuity UX surfaces
   - If `evidence_export_rate < 10%` → improve evidence visibility and copy-to-clipboard UX
   - If `route_recovery_rate < 50%` → improve clarification question quality

---

## Notes

- All metrics are browser-local (localStorage). No server telemetry.
- Metric window defaults to last 30 days (MAX_EVENT_AGE_DAYS in analytics.ts).
- The metric contract is locked in CVF_W127_NONCODER_METRIC_CONTRACT.md.
  Any metric redefinition requires a new contract entry before code changes.
