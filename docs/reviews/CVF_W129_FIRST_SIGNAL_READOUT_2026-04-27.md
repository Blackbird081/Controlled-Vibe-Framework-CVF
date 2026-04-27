# CVF W129 First Signal Readout

> Date: 2026-04-27
> Tranche: W129-T1
> Status: SIGNAL CAPTURED — Stage A flag enabled; live governance CERTIFIED

---

## 1. Rollout Posture At Readout Time

| Flag | State |
|---|---|
| `NEXT_PUBLIC_CVF_INTENT_FIRST_FRONT_DOOR` | **ON** (Stage A — enabled in CP1) |
| `NEXT_PUBLIC_CVF_NONCODER_CLARIFICATION_LOOP` | OFF (Stage B — deferred) |
| `NEXT_PUBLIC_CVF_NONCODER_ITERATION_MEMORY` | OFF (Stage C — deferred) |
| Trusted-form routing (W126) | Always active |

---

## 2. Rollout Events Instrumented

| Event | Trigger | Status |
|---|---|---|
| `rollout_flag_enabled` | Home page mount when `INTENT_FIRST_FRONT_DOOR=true` | ✅ Wired in `home/page.tsx` |
| `rollout_session_start` | First mount per browser session | ✅ Wired with `sessionStorage` guard |

---

## 3. Lane Status Readout (post Stage A enable)

W128 threshold contract applied. Browser-local event stream consulted
via live release gate session.

| Lane | Metric(s) | Status | Note |
|---|---|---|---|
| `entry_routing` | `weak_fallback_rate`, `time_to_first_value` | **watch** | Intent-first flag active; routing surface live; initial sessions observed via live gate |
| `clarification_recovery` | `route_recovery_rate` | no_data | Stage B flag still OFF — expected |
| `trusted_form` | `weak_fallback_rate` | watch | Shares signal with entry routing; form subset active |
| `followup_continuity` | `followup_continuation_rate` | no_data | Stage C deferred — expected |
| `evidence_export` | `evidence_export_rate` | no_data | Insufficient accepted executions for denominator |
| `deliverable_pack` | `deliverable_pack_export_rate` | no_data | Same denominator gap |

`entry_routing` moved from `no_data` → `watch` after Stage A enable. All other lanes remain
`no_data` for expected reasons (flags off or insufficient event volume). This is the correct
state at Day-1 of a controlled single-flag rollout.

---

## 4. Blocking Reason For Remaining `no_data` Lanes

The four `no_data` lanes are blocked for explicit, documented reasons:

- **clarification_recovery**: `NEXT_PUBLIC_CVF_NONCODER_CLARIFICATION_LOOP` is OFF by
  playbook design. No clarification triggers = no recovery rate denominator.
- **followup_continuity**: `NEXT_PUBLIC_CVF_NONCODER_ITERATION_MEMORY` is OFF by playbook
  design. No follow-up submissions = no continuation rate denominator.
- **evidence_export / deliverable_pack**: Not enough accepted executions in the current
  observation window to produce a non-null denominator. These lanes will populate as
  Stage A traffic accumulates.

None of these are unexpected failures — all are explicitly covered by the playbook.

---

## 5. Continuation Decision

Rule from W129 roadmap §CP4:

- `weak_fallback_rate` act-now → route tuning lane next
- `route_recovery_rate` act-now → clarification rewrite lane next
- `followup_continuation_rate` act-now → continuity UX lane next
- `deliverable_pack_export_rate` act-now → pack discoverability lane next
- All remain `no_data` → extend rollout, do not open W130

**Applied:**

- `entry_routing` = `watch` (not act-now) → no forced lane pivot
- All other lanes = `no_data` for documented playbook reasons
- Verdict: **Stage A rollout is healthy. Extend observation, enable Stage B when ≥10 executions.**

### W130 Decision

W130 is **NOT YET AUTHORIZED**. Condition: entry_routing must reach `act-now`
or another lane must exit `no_data` before W130 opens.

Recommended next action: accumulate Stage A traffic → re-read W128 readout →
if `entry_routing` remains `watch`, enable Stage B (`NEXT_PUBLIC_CVF_NONCODER_CLARIFICATION_LOOP`)
per playbook criteria.

---

## 6. Evidence Trace

- Live release gate: PASS 7/7 (2026-04-27)
- Governed execution path: Alibaba `qwen-turbo` lane CERTIFIED
- Rollout events: `rollout_flag_enabled` + `rollout_session_start` verified in `analytics.ts`
  type union; `home/page.tsx` useEffect confirmed firing on mount
- Unit tests: analytics 47/47 pass; noncoder-rollout-readout 20/20 pass
