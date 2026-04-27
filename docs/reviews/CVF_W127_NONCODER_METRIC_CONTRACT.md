# CVF W127 Noncoder Metric Contract

> Date: 2026-04-27
> Status: LOCKED — metric definitions are stable; changes require a new contract entry
> Wave: W127-T1
> Instrumentation module: src/lib/noncoder-metrics.ts

---

## Purpose

Lock the 6 product metrics that measure noncoder journey quality. Each metric is
defined precisely so that comparison across waves is valid and not subject to
definition drift.

---

## Metric Definitions

### 1. `time_to_first_value`

**Definition:** Median elapsed time (ms) between `execution_created` and
`execution_accepted` across all paired execution events in the analytics store.

**Why median:** Avoids skew from outlier long sessions.

**Unit:** Milliseconds. Report format: human-readable (e.g., "2m 30s").

**Data source:** `execution_created` + `execution_accepted` events matched by
execution `id` in the analytics event store.

**Null condition:** Returns `null` when fewer than 1 accepted execution exists.

---

### 2. `route_recovery_rate`

**Definition:** Ratio of successful routing recoveries via the clarification loop
to total weak-confidence routing attempts.

**Formula:** `clarification_route_recovered` / `clarification_weak_confidence_detected`

**Unit:** 0.0–1.0. Report format: percentage.

**Data source:** `clarification_route_recovered` and
`clarification_weak_confidence_detected` events.

**Null condition:** Returns `null` when `clarification_weak_confidence_detected = 0`
(no weak routing attempts in scope).

---

### 3. `weak_fallback_rate`

**Definition:** Ratio of routing attempts that ended in browse fallback (never
recovered) to all intent routing entry points.

**Formula:** `clarification_browse_fallback` / `intent_routed_total`

Where `intent_routed_total` = `intent_routed` (strong) + `clarification_weak_confidence_detected` (weak).

**Unit:** 0.0–1.0. Report format: percentage.

**Data source:** `intent_routed`, `clarification_weak_confidence_detected`,
`clarification_browse_fallback` events.

**Null condition:** Returns `null` when no intent routing events exist.

---

### 4. `followup_continuation_rate`

**Definition:** Ratio of follow-up executions started to total executions created.

**Formula:** `followup_started` / `execution_created`

**Unit:** 0.0–1.0. Report format: percentage.

**Data source:** `followup_started` and `execution_created` events.

**Null condition:** Returns `null` when `execution_created = 0`.

---

### 5. `evidence_export_rate`

**Definition:** Ratio of evidence export actions to total accepted executions.

**Formula:** `evidence_exported` / `execution_accepted`

**Unit:** 0.0–1.0. Report format: percentage.

**Data source:** `evidence_exported` and `execution_accepted` events.

**Null condition:** Returns `null` when `execution_accepted = 0`.

---

### 6. `deliverable_pack_export_rate`

**Definition:** Ratio of deliverable pack export actions to total accepted executions.

**Formula:** `deliverable_pack_exported` / `execution_accepted`

**Unit:** 0.0–1.0. Report format: percentage.

**Data source:** `deliverable_pack_exported` and `execution_accepted` events.

**Null condition:** Returns `null` when `execution_accepted = 0`.

---

## Required Analytics Events (instrumentation contract)

| Event | New in W127? | Fire location | Key payload |
|---|---|---|---|
| `execution_created` | No (existing) | store.ts addExecution | templateId, templateName |
| `execution_accepted` | No (existing) | store.ts updateExecution | id, templateId |
| `clarification_weak_confidence_detected` | No (existing) | IntentEntry.tsx | input |
| `clarification_route_recovered` | No (existing) | IntentEntry.tsx | depth |
| `clarification_browse_fallback` | No (existing) | IntentEntry.tsx | depth |
| `intent_routed` | **NEW W127** | IntentEntry.tsx handleStart | routeType, templateId |
| `followup_started` | **NEW W127** | ResultViewer.tsx followup submit | executionId |
| `evidence_exported` | **NEW W127** | ResultViewer.tsx export actions | executionId, format |
| `deliverable_pack_exported` | **NEW W127** | ResultViewer.tsx handleDownloadPack | executionId, templateId |

---

## Scope Boundary

- All events are browser-local (localStorage). No server telemetry.
- Metrics are computed at read time from the analytics event log.
- No PII is collected. The `input` field in `clarification_weak_confidence_detected`
  is a pre-existing field; W127 does not expand it.
- Metric window defaults to last 30 days (consistent with `MAX_EVENT_AGE_DAYS = 30`
  in analytics.ts).

---

## Change Protocol

Any new metric or event requires:
1. A new row in the table above
2. A new section in this document
3. A new test in `noncoder-metrics.test.ts`
4. A commit referencing W127 or the new wave

No silent metric redefinition.
