# CVF W129 First Signal Readout

> Date: 2026-04-27
> Tranche: W129-T1
> Status: READOUT PUBLISHED — Stage A rollout posture documented; live governance CERTIFIED; dedicated intent-routing signal proof captured in addendum artifact

---

## 1. Rollout Posture At Readout Time

| Flag | State |
|---|---|
| `NEXT_PUBLIC_CVF_INTENT_FIRST_FRONT_DOOR` | **ON in the controlled operator environment used for W129 readout** (Stage A posture documented; rollout-safe repo default still requires local/operator enable) |
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

W128 threshold contract remains the governing interpretation model.
The default live release gate alone is still not treated as sufficient proof for
intent-first routing movement. However, W129 now includes a dedicated live
signal-capture addendum:

- `docs/reviews/CVF_W129_STAGE_A_SIGNAL_CAPTURE_EVIDENCE_2026-04-27.md`
- Source: `tests/e2e/w129-stage-a-signal-capture.live.spec.ts`
- Live proof: Alibaba `qwen-turbo`, governed execution `200 ALLOW`
- Browser-local routing evidence: `5` `intent_routed`, `0`
  `clarification_weak_confidence_detected`, `0`
  `clarification_browse_fallback`

| Lane | Metric(s) | Status | Note |
|---|---|---|---|
| `entry_routing` | `weak_fallback_rate`, `time_to_first_value` | **healthy** | Dedicated Stage A evidence packet captured `5` strong routes and `0%` browse fallback |
| `clarification_recovery` | `route_recovery_rate` | no_data | Stage B flag still OFF — expected |
| `trusted_form` | `weak_fallback_rate` | **healthy** | Shares Stage A routing signal; addendum packet recorded `0%` browse fallback |
| `followup_continuity` | `followup_continuation_rate` | no_data | Stage C deferred — expected |
| `evidence_export` | `evidence_export_rate` | no_data | Insufficient accepted executions for denominator |
| `deliverable_pack` | `deliverable_pack_export_rate` | no_data | Same denominator gap |

`entry_routing` and `trusted_form` are now canonically confirmed out of
`no_data` based on the dedicated Stage A evidence artifact. The remaining lanes
still require either later-stage flag enablement or richer execution-volume
denominators.

---

## 4. Blocking Reason For Remaining `no_data` Lanes

The remaining four `no_data` lanes are blocked for explicit, documented
reasons:

- **clarification_recovery**: `NEXT_PUBLIC_CVF_NONCODER_CLARIFICATION_LOOP` is OFF by
  playbook design. No clarification triggers = no recovery rate denominator.
- **followup_continuity**: `NEXT_PUBLIC_CVF_NONCODER_ITERATION_MEMORY` is OFF by playbook
  design. No follow-up submissions = no continuation rate denominator.
- **evidence_export / deliverable_pack**: Not enough accepted executions in the current
  browser-local analytics stream to produce a non-null denominator. The
  dedicated Stage A addendum included one live governed execution, but that
  request was API-driven evidence proof, not a full UI acceptance/export journey.

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

- `entry_routing` = `healthy`
- `trusted_form` = `healthy`
- Four downstream lanes remain `no_data` for documented playbook reasons
- Verdict: **Stage A routing signal is now explicitly proven healthy. Continue controlled observation until Stage B enable criteria are satisfied.**

### W130 Decision

W130 is **NOT YET AUTHORIZED**. The proof-scope gap is now closed for Stage A
routing, but the playbook still requires sufficient execution volume before
Stage B enablement and broader continuation authorization.

Recommended next action: continue Stage A traffic collection until the browser
analytics stream contains `>=10` `execution_created` events; if
`entry_routing` remains not `action_required`, enable Stage B
(`NEXT_PUBLIC_CVF_NONCODER_CLARIFICATION_LOOP`) per playbook criteria.

---

## 6. Evidence Trace

- Live release gate: PASS 7/7 (2026-04-27)
- Governed execution path: Alibaba `qwen-turbo` lane CERTIFIED
- Default live release gate scope: `noncoder-governance-live.spec.ts` +
  `governance-gate-live.spec.ts` + `w113-workspace-web-live-proof.spec.ts`;
  this bundle does **not** include the dedicated `intent-first-flow.live.spec.ts`
  routing proof
- Dedicated Stage A signal artifact: `docs/reviews/CVF_W129_STAGE_A_SIGNAL_CAPTURE_EVIDENCE_2026-04-27.md`
  generated by `tests/e2e/w129-stage-a-signal-capture.live.spec.ts`
- Rollout events: `rollout_flag_enabled` + `rollout_session_start` verified in `analytics.ts`
  type union; `home/page.tsx` useEffect confirmed firing on mount
- Unit tests: analytics 47/47 pass; noncoder-rollout-readout 20/20 pass
